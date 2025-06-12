// CharacterCreation.js

// Elements
const charNameInput = document.getElementById('charNameInput');
const charColorPicker = document.getElementById('charColorPicker');
const charList = document.getElementById('charList');
const charListSection = document.getElementById('characterListSection');
const charCreationSection = document.getElementById('characterCreationSection');
const appSection = document.getElementById('appSection');
const saveCharBtn = document.getElementById('saveCharBtn');
const selectCharacterEntry = document.getElementById('selectCharacterEntry');
const characterNameHeader = document.getElementById('characterNameHeader');

const entryText = document.getElementById('entryText');
const entryTagsInput = document.getElementById('entryTags');
const moodSelect = document.getElementById('moodSelect');
const filterMood = document.getElementById('filterMood');
const filterTag = document.getElementById('filterTag');
const searchInput = document.getElementById('searchInput');
const sortEntriesSelect = document.getElementById('sortEntries');
const sortCharactersSelect = document.getElementById('sortCharacters');

const entriesList = document.getElementById('entriesList');

const showAllEntriesBtn = document.getElementById('showAllEntriesBtn');
const allEntriesOverviewSection = document.getElementById('allEntriesOverviewSection');
const allEntriesOverviewList = document.getElementById('allEntriesOverviewList');
const closeOverviewBtn = document.getElementById('closeOverviewBtn');

const moodGraphCanvas = document.getElementById('moodGraph');
const moodGraphCtx = moodGraphCanvas.getContext('2d');

// Data arrays
let characters = [];
let entries = [];

// Trait buttons logic
const traitGroups = ['species', 'hair', 'eyeColor'];
const traitSelections = { species: null, hair: null, eyeColor: null };

// Initialize trait buttons event listeners
traitGroups.forEach(group => {
    const groupDiv = document.getElementById(group + 'Group');
    if (!groupDiv) return;
    groupDiv.querySelectorAll('.trait-btn').forEach(button => {
        button.addEventListener('click', () => {
            selectTrait(group, button.textContent, button);
        });
    });
});

// Select trait helper
function selectTrait(group, trait, button) {
    traitSelections[group] = trait;

    // Reset buttons styles
    resetTraitGroup(group);

    // Mark clicked button active
    button.classList.add('selected-trait-btn');
}

// Reset trait buttons styles for a group
function resetTraitGroup(group) {
    const groupDiv = document.getElementById(group + 'Group');
    if (!groupDiv) return;
    groupDiv.querySelectorAll('.trait-btn').forEach(btn => {
        btn.classList.remove('selected-trait-btn');
    });
}

// Save character button click
saveCharBtn.addEventListener('click', () => {
    const name = charNameInput.value.trim();
    if (!name) {
        alert('Please enter a character name.');
        return;
    }

    // Validate traits selected
    for (const group of traitGroups) {
        if (!traitSelections[group]) {
            alert(`Please select a ${group}.`);
            return;
        }
    }

    const newChar = {
        id: crypto.randomUUID(),
        name,
        species: traitSelections.species,
        hair: traitSelections.hair,
        eyeColor: traitSelections.eyeColor,
        color: charColorPicker.value,
        createdAt: Date.now(),
        entriesCount: 0,
    };

    characters.push(newChar);
    saveAll();
    updateCharList();

    // Clear form
    charNameInput.value = '';
    charColorPicker.value = '#ff69b4';
    traitGroups.forEach(g => {
        traitSelections[g] = null;
        resetTraitGroup(g);
    });

    // Show character list & diary app if this is first character
    charCreationSection.classList.add('hidden');
    charListSection.classList.remove('hidden');
    appSection.classList.remove('hidden');

    // Update selects for entries
    updateCharacterSelect();
});

// Update character list UI
function updateCharList() {
    // Clear
    charList.innerHTML = '';

    // Sorting characters
    const sortValue = sortCharactersSelect.value || 'name-asc';
    let sortedChars = [...characters];

    if (sortValue === 'name-asc') {
        sortedChars.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === 'name-desc') {
        sortedChars.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortValue === 'date-asc') {
        sortedChars.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortValue === 'date-desc') {
        sortedChars.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortValue === 'entries-desc') {
        sortedChars.sort((a, b) => b.entriesCount - a.entriesCount);
    }

    for (const char of sortedChars) {
        const li = document.createElement('li');
        li.textContent = `${char.name} (${char.species}, Hair: ${char.hair}, Eyes: ${char.eyeColor}) - Entries: ${char.entriesCount}`;
        li.style.color = char.color;

        // Add Delete button
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.style.marginLeft = '10px';
        delBtn.addEventListener('click', () => {
            if (confirm(`Delete character "${char.name}"? This will also delete their diary entries.`)) {
                deleteCharacter(char.id);
            }
        });

        li.appendChild(delBtn);
        charList.appendChild(li);
    }
}

// Delete character and their entries
function deleteCharacter(charId) {
    characters = characters.filter(c => c.id !== charId);
    entries = entries.filter(e => e.characterId !== charId);
    saveAll();

    updateCharList();
    updateCharacterSelect();
    updateEntriesList();

    // If no characters left, show creation form again
    if (characters.length === 0) {
        charCreationSection.classList.remove('hidden');
        charListSection.classList.add('hidden');
        appSection.classList.add('hidden');
    }
}

// Save all to localStorage
function saveAll() {
    localStorage.setItem('characters', JSON.stringify(characters));
    localStorage.setItem('entries', JSON.stringify(entries));
}

// Load all from localStorage
function loadAll() {
    const storedChars = localStorage.getItem('characters');
    if (storedChars) {
        characters = JSON.parse(storedChars);
    }

    const storedEntries = localStorage.getItem('entries');
    if (storedEntries) {
        entries = JSON.parse(storedEntries);
    }
}

// Update the character select dropdown for entries
function updateCharacterSelect() {
    selectCharacterEntry.innerHTML = '';
    for (const char of characters) {
        const option = document.createElement('option');
        option.value = char.id;
        option.textContent = char.name;
        selectCharacterEntry.appendChild(option);
    }

    // Update header with selected character
    if (selectCharacterEntry.value) {
        const selectedChar = characters.find(c => c.id === selectCharacterEntry.value);
        if (selectedChar) {
            characterNameHeader.textContent = `Diary for: ${selectedChar.name}`;
        }
    }
}

// When user selects a different character for diary entries
selectCharacterEntry.addEventListener('change', () => {
    const selectedChar = characters.find(c => c.id === selectCharacterEntry.value);
    if (selectedChar) {
        characterNameHeader.textContent = `Diary for: ${selectedChar.name}`;
    }
    updateEntriesList();
});

// Save diary entry button
document.getElementById('saveEntryBtn').addEventListener('click', () => {
    const selectedCharId = selectCharacterEntry.value;
    if (!selectedCharId || !characters.find(c => c.id === selectedCharId)) {
        alert('Please select a valid character for the entry.');
        return;
    }
    if (!entryText.value.trim()) {
        alert('Please write some text for the diary entry.');
        return;
    }

    const newEntry = {
        id: crypto.randomUUID(),
        characterId: selectedCharId,
        text: entryText.value.trim(),
        tags: entryTagsInput.value
            .split(',')
            .map(t => t.trim())
            .filter(t => t !== ''),
        mood: moodSelect.value,
        createdAt: Date.now(),
    };

    entries.push(newEntry);

    // Increase entriesCount for character
    const char = characters.find(c => c.id === selectedCharId);
    if (char) {
        char.entriesCount++;
    }

    saveAll();

    entryText.value = '';
    entryTagsInput.value = '';
    moodSelect.value = 'neutral';  // lowercase!

    updateEntriesList();
    updateCharList();
    updateMoodGraph();
});

// Update diary entries list with filters and sorting
function updateEntriesList() {
    entriesList.innerHTML = '';

    const selectedCharId = selectCharacterEntry.value;
    if (!selectedCharId) return;

    // Filter entries for selected character
    let filteredEntries = entries.filter(e => e.characterId === selectedCharId);

    // Filter by mood
    const moodFilter = filterMood.value;
    if (moodFilter && moodFilter !== 'all') {
        filteredEntries = filteredEntries.filter(e => e.mood === moodFilter);
    }

    // Filter by tag
    const tagFilter = filterTag.value.trim().toLowerCase();
    if (tagFilter) {
        filteredEntries = filteredEntries.filter(e =>
            e.tags.some(tag => tag.toLowerCase().includes(tagFilter))
        );
    }

    // Filter by search input
    const searchText = searchInput.value.trim().toLowerCase();
    if (searchText) {
        filteredEntries = filteredEntries.filter(e =>
            e.text.toLowerCase().includes(searchText)
        );
    }

    // Sort entries
    const sortVal = sortEntriesSelect.value;
    if (sortVal === 'date-asc') {
        filteredEntries.sort((a, b) => a.createdAt - b.createdAt);
    } else {
        filteredEntries.sort((a, b) => b.createdAt - a.createdAt);
    }

    for (const entry of filteredEntries) {
        const li = document.createElement('li');
        const dateStr = new Date(entry.createdAt).toLocaleString();
        li.innerHTML = `
            <div style="border-left: 5px solid ${getMoodColor(entry.mood)}; padding-left: 8px;">
                <strong>${dateStr}</strong> - Mood: ${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}<br/>
                <em>Tags: ${entry.tags.join(', ')}</em><br/>
                <p>${entry.text}</p>
                <button class="delete-entry-btn">Delete Entry</button>
            </div>
        `;

        // Delete entry button
        li.querySelector('.delete-entry-btn').addEventListener('click', () => {
            if (confirm('Delete this diary entry?')) {
                deleteEntry(entry.id);
            }
        });

        entriesList.appendChild(li);
    }
}

// Delete diary entry
function deleteEntry(entryId) {
    const entryIndex = entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;

    // Reduce entriesCount for character
    const entry = entries[entryIndex];
    const char = characters.find(c => c.id === entry.characterId);
    if (char && char.entriesCount > 0) {
        char.entriesCount--;
    }

    entries.splice(entryIndex, 1);
    saveAll();

    updateEntriesList();
    updateCharList();
    updateMoodGraph();
}

// Get color for mood graph and borders
function getMoodColor(mood) {
    switch (mood) {
        case 'happy':
            return '#FFD700'; // gold
        case 'sad':
            return '#1E90FF'; // dodgerblue
        case 'neutral':
            return '#808080'; // gray
        case 'anxious':
            return '#FF4500'; // orangered
        default:
            return '#000000';
    }
}

// Mood graph data and drawing
function updateMoodGraph() {
    // Clear
    moodGraphCtx.clearRect(0, 0, moodGraphCanvas.width, moodGraphCanvas.height);

    // Get entries for selected character, sorted by date ascending
    const selectedCharId = selectCharacterEntry.value;
    if (!selectedCharId) return;

    let moodEntries = entries
        .filter(e => e.characterId === selectedCharId)
        .sort((a, b) => a.createdAt - b.createdAt);

    if (moodEntries.length === 0) return;

    // Map moods to numeric values
    const moodMap = { happy: 3, neutral: 2, sad: 1, anxious: 0 };
    const maxMoodValue = 3;
    const minMoodValue = 0;

    const padding = 40;
    const width = moodGraphCanvas.width - padding * 2;
    const height = moodGraphCanvas.height - padding * 2;

    // X step per entry
    const stepX = width / (moodEntries.length - 1 || 1);

    // Draw axis lines
    moodGraphCtx.strokeStyle = '#ccc';
    moodGraphCtx.beginPath();
    moodGraphCtx.moveTo(padding, padding);
    moodGraphCtx.lineTo(padding, padding + height);
    moodGraphCtx.lineTo(padding + width, padding + height);
    moodGraphCtx.stroke();

    // Draw mood line
    moodGraphCtx.lineWidth = 3;
    moodGraphCtx.strokeStyle = '#ff69b4'; // pink mood line
    moodGraphCtx.beginPath();

    moodEntries.forEach((entry, i) => {
        const x = padding + i * stepX;
        // Normalize mood numeric value to y coordinate
        const moodVal = moodMap[entry.mood] ?? 2;
        const y = padding + height - ((moodVal - minMoodValue) / (maxMoodValue - minMoodValue)) * height;

        if (i === 0) {
            moodGraphCtx.moveTo(x, y);
        } else {
            moodGraphCtx.lineTo(x, y);
        }

        // Draw point circle
        moodGraphCtx.fillStyle = getMoodColor(entry.mood);
        moodGraphCtx.beginPath();
        moodGraphCtx.arc(x, y, 6, 0, Math.PI * 2);
        moodGraphCtx.fill();
    });

    moodGraphCtx.stroke();
}

// Update overview section with all entries across characters
function updateAllEntriesOverview() {
    allEntriesOverviewList.innerHTML = '';

    if (entries.length === 0) {
        allEntriesOverviewList.textContent = 'No diary entries yet.';
        return;
    }

    // Sort all entries by date descending
    const sortedEntries = [...entries].sort((a, b) => b.createdAt - a.createdAt);

    for (const entry of sortedEntries) {
        const char = characters.find(c => c.id === entry.characterId);
        const div = document.createElement('div');
        div.style.borderLeft = `5px solid ${char ? char.color : '#000'}`;
        div.style.paddingLeft = '8px';
        div.style.marginBottom = '8px';

        div.innerHTML = `
            <strong>${char ? char.name : 'Unknown Character'}</strong> - ${new Date(entry.createdAt).toLocaleString()}<br/>
            Mood: ${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}<br/>
            Tags: ${entry.tags.join(', ')}<br/>
            <p>${entry.text}</p>
        `;

        allEntriesOverviewList.appendChild(div);
    }
}

// Show overview button
showAllEntriesBtn.addEventListener('click', () => {
    allEntriesOverviewSection.classList.remove('hidden');
    updateAllEntriesOverview();
});

// Close overview button
closeOverviewBtn.addEventListener('click', () => {
    allEntriesOverviewSection.classList.add('hidden');
});

// Filters and search inputs event listeners to update entries list
filterMood.addEventListener('change', updateEntriesList);
filterTag.addEventListener('input', updateEntriesList);
searchInput.addEventListener('input', updateEntriesList);
sortEntriesSelect.addEventListener('change', updateEntriesList);
sortCharactersSelect.addEventListener('change', updateCharList);

// Initialization
function init() {
    loadAll();

    if (characters.length === 0) {
        // Show character creation form
        charCreationSection.classList.remove('hidden');
        charListSection.classList.add('hidden');
        appSection.classList.add('hidden');
    } else {
        charCreationSection.classList.add('hidden');
        charListSection.classList.remove('hidden');
        appSection.classList.remove('hidden');

        updateCharList();
        updateCharacterSelect();
        updateEntriesList();
        updateMoodGraph();
    }
}

init();
