// --- Elements ---
// Get references to HTML elements by their IDs for later use
const charNameInput = document.getElementById('charNameInput'); // Input for character name
const charColorPicker = document.getElementById('charColorPicker'); // Color picker for character color
const charList = document.getElementById('charList'); // List element to display characters
const charListSection = document.getElementById('characterListSection'); // Section showing character list
const charCreationSection = document.getElementById('characterCreationSection'); // Section for creating a character
const appSection = document.getElementById('appSection'); // Main app section (diary, etc.)
const saveCharBtn = document.getElementById('saveCharBtn'); // Button to save a new character
const createNewCharBtn = document.getElementById('createNewCharBtn'); // Button to start creating a new character
const selectCharacterEntry = document.getElementById('selectCharacterEntry'); // Dropdown to select character for diary
const characterNameHeader = document.getElementById('characterNameHeader'); // Header showing current character's name

const entryText = document.getElementById('entryText'); // Textarea for diary entry content
const entryTagsInput = document.getElementById('entryTags'); // Input for tags (comma separated)
const moodSelect = document.getElementById('moodSelect'); // Dropdown to select mood for diary entry
const filterMood = document.getElementById('filterMood'); // Filter dropdown to filter entries by mood
const filterTag = document.getElementById('filterTag'); // Filter input to filter entries by tag
const searchInput = document.getElementById('searchInput'); // Search input to filter entries by text
const sortEntriesSelect = document.getElementById('sortEntries'); // Dropdown to sort diary entries
const sortCharactersSelect = document.getElementById('sortCharacters'); // Dropdown to sort characters

const entriesList = document.getElementById('entriesList'); // List element to show diary entries

const showAllEntriesBtn = document.getElementById('showAllEntriesBtn'); // Button to show all entries overview
const allEntriesOverviewSection = document.getElementById('allEntriesOverviewSection'); // Section to show all entries grouped by character
const allEntriesOverviewList = document.getElementById('allEntriesOverviewList'); // Container for all entries overview
const closeOverviewBtn = document.getElementById('closeOverviewBtn'); // Button to close the all entries overview

const moodGraphCanvas = document.getElementById('moodGraph'); // Canvas element for mood graph
const moodGraphCtx = moodGraphCanvas.getContext('2d'); // Canvas 2D context for drawing graph

// --- Data arrays ---
// Arrays to store characters and diary entries in memory
let characters = [];
let entries = [];

// --- Trait buttons logic ---
// List of trait categories (species, hair, eyeColor)
const traitGroups = ['species', 'hair', 'eyeColor'];

// Object to store the currently selected trait for each group
const traitSelections = { species: null, hair: null, eyeColor: null };

// Initialize event listeners for trait buttons for each trait group
traitGroups.forEach(group => {
    // Find the div containing buttons for this group
    const groupDiv = document.getElementById(group + 'Group');
    if (!groupDiv) return; // Skip if group div not found

    // For each button inside this group div...
    groupDiv.querySelectorAll('.trait-btn').forEach(button => {
        // Add click event listener
        button.addEventListener('click', () => {
            // When clicked, select the trait and mark button as active
            selectTrait(group, button.textContent, button);
        });
    });
});

// --- Select trait helper ---
// Select a trait for a given group and update UI
function selectTrait(group, trait, button) {
    // Save the selected trait in the traitSelections object
    traitSelections[group] = trait;

    // Remove active styles from all buttons in this group
    resetTraitGroup(group);

    // Add active style to the clicked button
    button.classList.add('selected-trait-btn');
}

// --- Reset trait buttons styles for a group ---
// Remove the 'selected-trait-btn' class from all buttons in the given trait group
function resetTraitGroup(group) {
    const groupDiv = document.getElementById(group + 'Group');
    if (!groupDiv) return;

    groupDiv.querySelectorAll('.trait-btn').forEach(btn => {
        btn.classList.remove('selected-trait-btn');
    });
}

// --- Save character button click ---
// When the user clicks "Save Character" button
saveCharBtn.addEventListener('click', () => {
    const name = charNameInput.value.trim(); // Get and trim the name input

    if (!name) {
        alert('Please enter a character name.');
        return; // Stop if no name
    }

    // Check if all traits have been selected
    for (let g of traitGroups) {
        if (!traitSelections[g]) {
            alert(`Please select a ${g}.`);
            return;
        }
    }

    // Check if the character name is unique (case insensitive)
    if (characters.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert('Character name must be unique.');
        return;
    }

    // Get color from color picker
    const color = charColorPicker.value;

    // Create new character object
    const newChar = {
        id: Date.now(), // unique id using timestamp
        name,
        species: traitSelections.species,
        hair: traitSelections.hair,
        eyeColor: traitSelections.eyeColor,
        color,
        created: new Date().toISOString(), // save creation time as ISO string
    };

    characters.push(newChar); // Add new character to array
    saveToLocalStorage(); // Save characters and entries to localStorage
    updateCharacterList(); // Refresh character list in UI
    resetCharacterCreation(); // Reset creation form inputs

    // Switch UI: hide creation section, show character list and main app
    charCreationSection.classList.add('hidden');
    charListSection.classList.remove('hidden');
    appSection.classList.remove('hidden');

    // Update character dropdown for diary entry selection
    populateCharacterSelect();

    // Automatically select new character in diary dropdown
    selectCharacterEntry.value = newChar.id;
    onCharacterChange(); // Load diary entries for new character
});

// --- Reset character creation inputs ---
// Clear all inputs and reset trait selections in the character creation form
function resetCharacterCreation() {
    charNameInput.value = ''; // Clear name input
    charColorPicker.value = '#ff69b4'; // Reset color picker to default pink
    traitGroups.forEach(g => {
        traitSelections[g] = null; // Clear trait selections
        resetTraitGroup(g); // Reset button styles for each trait group
    });
}

// --- Update character list in UI ---
// Clear and repopulate the character list element
function updateCharacterList() {
    charList.innerHTML = ''; // Clear existing list

    let sortedChars = [...characters]; // Copy array to sort without affecting original

    // Sort characters based on selected option in sort dropdown
    const sortVal = sortCharactersSelect.value;
    if (sortVal === 'name-asc') {
        sortedChars.sort((a,b) => a.name.localeCompare(b.name));
    } else if (sortVal === 'name-desc') {
        sortedChars.sort((a,b) => b.name.localeCompare(a.name));
    } else if (sortVal === 'date-asc') {
        sortedChars.sort((a,b) => new Date(a.created) - new Date(b.created));
    } else if (sortVal === 'date-desc') {
        sortedChars.sort((a,b) => new Date(b.created) - new Date(a.created));
    } else if (sortVal === 'entries-desc') {
        // Sort by number of diary entries descending
        sortedChars.sort((a,b) => {
            let countA = entries.filter(e => e.characterId === a.id).length;
            let countB = entries.filter(e => e.characterId === b.id).length;
            return countB - countA;
        });
    }

    // For each character, create a list item with name and traits
    sortedChars.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.name} (${c.species}, Hair: ${c.hair}, Eyes: ${c.eyeColor})`;

        // Add colored circle showing character color
        const colorSpan = document.createElement('span');
        colorSpan.style.backgroundColor = c.color;
        colorSpan.style.display = 'inline-block';
        colorSpan.style.width = '12px';
        colorSpan.style.height = '12px';
        colorSpan.style.borderRadius = '50%';
        colorSpan.style.marginLeft = '6px';
        li.appendChild(colorSpan);

        // Add Delete button for each character
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.title = 'Delete character and all their entries';
        delBtn.addEventListener('click', () => {
            if (confirm(`Delete character "${c.name}" and all their diary entries?`)) {
                deleteCharacter(c.id);
            }
        });
        li.appendChild(delBtn);

        charList.appendChild(li); // Add the list item to the character list
    });
}

// --- Delete character and their entries ---
// Remove character and all diary entries associated with them
function deleteCharacter(charId) {
    characters = characters.filter(c => c.id !== charId); // Remove character
    entries = entries.filter(e => e.characterId !== charId); // Remove their diary entries
    saveToLocalStorage(); // Save changes
    updateCharacterList(); // Update character list UI
    populateCharacterSelect(); // Update diary character dropdown
    renderEntries(); // Update diary entries list
}

// --- Populate character select dropdown for diary entry ---
// Fill the dropdown with all characters for user to select
function populateCharacterSelect() {
    selectCharacterEntry.innerHTML = ''; // Clear existing options

    characters.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id; // Value is character ID
        opt.textContent = c.name; // Display name
        selectCharacterEntry.appendChild(opt);
    });

    // If no characters exist, show character creation form and hide others
    if (characters.length === 0) {
        charCreationSection.classList.remove('hidden');
        charListSection.classList.add('hidden');
        appSection.classList.add('hidden');
    }
}

// --- On character change (in diary) ---
// When the user selects a different character in the diary dropdown
selectCharacterEntry.addEventListener('change', onCharacterChange);

function onCharacterChange() {
    const charId = Number(selectCharacterEntry.value); // Get selected character ID
    const char = characters.find(c => c.id === charId);
    if (!char) return; // If character not found, do nothing

    // Update header to show current character's name
    characterNameHeader.textContent = `Diary - ${char.name}`;

    // Clear the entry textarea and mood/tags inputs for new entry
    entryText.value = '';
    entryTagsInput.value = '';
    moodSelect.value = '';

    // Render diary entries filtered by this character
    renderEntries();
}

// --- Save diary entry ---
// When user submits a new diary entry
document.getElementById('saveEntryBtn').addEventListener('click', () => {
    const charId = Number(selectCharacterEntry.value);
    const char = characters.find(c => c.id === charId);
    if (!char) {
        alert('Please select a character.');
        return;
    }

    const text = entryText.value.trim();
    if (!text) {
        alert('Please enter diary text.');
        return;
    }

    const mood = moodSelect.value;
    if (!mood) {
        alert('Please select a mood.');
        return;
    }

    // Parse tags input, split by commas and trim spaces, filter empty strings
    let tags = entryTagsInput.value
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

    // Create new diary entry object
    const newEntry = {
        id: Date.now(), // unique ID by timestamp
        characterId: charId, // link to character
        text,
        mood,
        tags,
        created: new Date().toISOString(), // timestamp
    };

    entries.push(newEntry); // Add to entries array
    saveToLocalStorage(); // Save everything to localStorage
    renderEntries(); // Update displayed entries list

    // Clear form fields for next entry
    entryText.value = '';
    entryTagsInput.value = '';
    moodSelect.value = '';
});

// --- Render diary entries ---
// Show diary entries filtered and sorted based on user inputs
function renderEntries() {
    const charId = Number(selectCharacterEntry.value);

    // Filter entries for the selected character
    let filteredEntries = entries.filter(e => e.characterId === charId);

    // Filter by mood if a filter is selected
    if (filterMood.value && filterMood.value !== 'all') {
        filteredEntries = filteredEntries.filter(e => e.mood === filterMood.value);
    }

    // Filter by tag if entered
    const tagFilter = filterTag.value.trim().toLowerCase();
    if (tagFilter) {
        filteredEntries = filteredEntries.filter(e => e.tags.includes(tagFilter));
    }

    // Filter by search text in diary text (case insensitive)
    const searchText = searchInput.value.trim().toLowerCase();
    if (searchText) {
        filteredEntries = filteredEntries.filter(e => e.text.toLowerCase().includes(searchText));
    }

    // Sort entries based on selected sort option
    const sortVal = sortEntriesSelect.value;
    if (sortVal === 'date-desc') {
        filteredEntries.sort((a,b) => new Date(b.created) - new Date(a.created));
    } else if (sortVal === 'date-asc') {
        filteredEntries.sort((a,b) => new Date(a.created) - new Date(b.created));
    } else if (sortVal === 'mood-asc') {
        filteredEntries.sort((a,b) => a.mood.localeCompare(b.mood));
    } else if (sortVal === 'mood-desc') {
        filteredEntries.sort((a,b) => b.mood.localeCompare(a.mood));
    }

    // Clear the entries list container before adding new ones
    entriesList.innerHTML = '';

    // Create a list item for each entry
    filteredEntries.forEach(entry => {
        const li = document.createElement('li');

        // Format date nicely
        const date = new Date(entry.created);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        // Entry main text
        const textP = document.createElement('p');
        textP.textContent = entry.text;

        // Mood label with color coding
        const moodSpan = document.createElement('span');
        moodSpan.textContent = `Mood: ${entry.mood}`;
        moodSpan.classList.add('mood-label');
        moodSpan.style.color = getMoodColor(entry.mood);

        // Tags display
        const tagsSpan = document.createElement('span');
        tagsSpan.textContent = 'Tags: ' + entry.tags.join(', ');
        tagsSpan.classList.add('tags-label');

        // Date display
        const dateSpan = document.createElement('span');
        dateSpan.textContent = dateStr;
        dateSpan.classList.add('date-label');

        // Append all parts to the list item
        li.appendChild(textP);
        li.appendChild(moodSpan);
        li.appendChild(document.createTextNode(' | '));
        li.appendChild(tagsSpan);
        li.appendChild(document.createTextNode(' | '));
        li.appendChild(dateSpan);

        entriesList.appendChild(li); // Add entry to the list
    });

    // Draw the mood graph based on current filtered entries
    drawMoodGraph(filteredEntries);
}

// --- Helper to get mood color ---
// Return a color string based on mood name
function getMoodColor(mood) {
    switch (mood) {
        case 'happy': return 'green';
        case 'sad': return 'blue';
        case 'angry': return 'red';
        case 'neutral': return 'gray';
        case 'excited': return 'orange';
        default: return 'black';
    }
}

// --- Save all data to localStorage ---
// Store characters and entries arrays as JSON strings
function saveToLocalStorage() {
    localStorage.setItem('characters', JSON.stringify(characters));
    localStorage.setItem('entries', JSON.stringify(entries));
}

// --- Load data from localStorage ---
// Read saved data and parse JSON into arrays, or set empty arrays if none saved
function loadFromLocalStorage() {
    const savedChars = localStorage.getItem('characters');
    const savedEntries = localStorage.getItem('entries');

    if (savedChars) characters = JSON.parse(savedChars);
    if (savedEntries) entries = JSON.parse(savedEntries);
}

// --- Show all entries overview ---
// When user clicks "Show All Entries", display a grouped view by character
showAllEntriesBtn.addEventListener('click', () => {
    allEntriesOverviewList.innerHTML = ''; // Clear overview

    characters.forEach(char => {
        // Create a container for each character's entries
        const charDiv = document.createElement('div');
        charDiv.classList.add('char-overview');

        // Character name header with color circle
        const charHeader = document.createElement('h3');
        charHeader.textContent = char.name;
        const colorDot = document.createElement('span');
        colorDot.style.backgroundColor = char.color;
        colorDot.style.display = 'inline-block';
        colorDot.style.width = '12px';
        colorDot.style.height = '12px';
        colorDot.style.borderRadius = '50%';
        colorDot.style.marginLeft = '8px';
        charHeader.appendChild(colorDot);

        charDiv.appendChild(charHeader);

        // Get all entries for this character
        const charEntries = entries.filter(e => e.characterId === char.id);

        if (charEntries.length === 0) {
            // Show message if no entries
            const noEntriesP = document.createElement('p');
            noEntriesP.textContent = 'No entries';
            charDiv.appendChild(noEntriesP);
        } else {
            // List entries for this character
            const ul = document.createElement('ul');
            charEntries.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = `${entry.mood} - ${entry.text.substring(0, 50)}...`;
                ul.appendChild(li);
            });
            charDiv.appendChild(ul);
        }

        allEntriesOverviewList.appendChild(charDiv);
    });

    // Show the overview section and hide main app
    allEntriesOverviewSection.classList.remove('hidden');
    appSection.classList.add('hidden');
});

// --- Close the all entries overview ---
// When user clicks "Close" button on overview
closeOverviewBtn.addEventListener('click', () => {
    allEntriesOverviewSection.classList.add('hidden');
    appSection.classList.remove('hidden');
});

// --- Sort change listeners ---
// When user changes sorting of characters or entries, update lists accordingly
sortCharactersSelect.addEventListener('change', updateCharacterList);
sortEntriesSelect.addEventListener('change', renderEntries);

// --- Filter inputs listeners ---
// When user types or changes filters, update displayed diary entries
filterMood.addEventListener('change', renderEntries);
filterTag.addEventListener('input', renderEntries);
searchInput.addEventListener('input', renderEntries);

// --- Create new character button ---
// Show character creation form and hide others
createNewCharBtn.addEventListener('click', () => {
    charCreationSection.classList.remove('hidden');
    charListSection.classList.add('hidden');
    appSection.classList.add('hidden');
    resetCharacterCreation();
});

// --- Mood graph drawing ---
// Draw a simple graph showing count of each mood in current filtered entries
function drawMoodGraph(entriesToDraw) {
    // Clear canvas first
    moodGraphCtx.clearRect(0, 0, moodGraphCanvas.width, moodGraphCanvas.height);

    // Count occurrences of each mood
    const moodCounts = {};
    entriesToDraw.forEach(e => {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    const moods = Object.keys(moodCounts);
    if (moods.length === 0) return; // Nothing to draw

    // Graph dimensions and bar settings
    const width = moodGraphCanvas.width;
    const height = moodGraphCanvas.height;
    const barWidth = width / moods.length * 0.6;
    const maxCount = Math.max(...Object.values(moodCounts));

    moods.forEach((mood, i) => {
        const count = moodCounts[mood];
        const barHeight = (count / maxCount) * (height - 30); // leave space for labels

        // Bar position
        const x = i * (width / moods.length) + (width / moods.length - barWidth) / 2;
        const y = height - barHeight - 20;

        // Set fill color based on mood
        moodGraphCtx.fillStyle = getMoodColor(mood);
        moodGraphCtx.fillRect(x, y, barWidth, barHeight);

        // Draw mood label below bar
        moodGraphCtx.fillStyle = 'black';
        moodGraphCtx.font = '14px Arial';
        moodGraphCtx.textAlign = 'center';
        moodGraphCtx.fillText(mood, x + barWidth / 2, height - 5);

        // Draw count above bar
        moodGraphCtx.fillText(count, x + barWidth / 2, y - 5);
    });
}

// --- Background music toggle ---
// Toggle background music playback on button click
const bgMusic = document.getElementById('bgMusic');
const toggleMusicBtn = document.getElementById('toggleMusicBtn');

toggleMusicBtn.addEventListener('click', () => {
    if (bgMusic.paused) {
        bgMusic.play();
        toggleMusicBtn.textContent = 'Pause Music';
    } else {
        bgMusic.pause();
        toggleMusicBtn.textContent = 'Play Music';
    }
});

// --- Initialize app on page load ---
function init() {
    loadFromLocalStorage(); // Load saved characters and entries
    updateCharacterList(); // Show characters in list
    populateCharacterSelect(); // Fill diary character select dropdown

    if (characters.length > 0) {
        // If we have characters, select the first one by default
        selectCharacterEntry.value = characters[0].id;
        onCharacterChange();
    } else {
        // No characters: show character creation form
        charCreationSection.classList.remove('hidden');
        charListSection.classList.add('hidden');
        appSection.classList.add('hidden');
    }
}

init(); // Run initialization when script loads
