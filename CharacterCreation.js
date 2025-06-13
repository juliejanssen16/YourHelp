// Elements
const charNameInput = document.getElementById('charNameInput');
const charColorPicker = document.getElementById('charColorPicker');
const charList = document.getElementById('charList');
const charListSection = document.getElementById('characterListSection');
const charCreationSection = document.getElementById('characterCreationSection');
const appSection = document.getElementById('appSection');
const saveCharBtn = document.getElementById('saveCharBtn');
const createNewCharBtn = document.getElementById('createNewCharBtn');
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
    // Check all traits selected
    for (let g of traitGroups) {
        if (!traitSelections[g]) {
            alert(`Please select a ${g}.`);
            return;
        }
    }

    // Check if name unique
    if (characters.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert('Character name must be unique.');
        return;
    }

    const color = charColorPicker.value;

    const newChar = {
        id: Date.now(),
        name,
        species: traitSelections.species,
        hair: traitSelections.hair,
        eyeColor: traitSelections.eyeColor,
        color,
        created: new Date().toISOString(),
    };

    characters.push(newChar);
    saveData();
    updateCharacterList();
    resetCharacterCreation();

    // Hide creation section, show character list & app section
    charCreationSection.classList.add('hidden');
    charListSection.classList.remove('hidden');
    appSection.classList.remove('hidden');

    // Populate character select for diary
    populateCharacterSelect();

    // Select new character in diary
    selectCharacterEntry.value = newChar.id;
    onCharacterChange();
});

// Reset character creation inputs
function resetCharacterCreation() {
    charNameInput.value = '';
    charColorPicker.value = '#ff69b4';
    traitGroups.forEach(g => {
        traitSelections[g] = null;
        resetTraitGroup(g);
    });
}

// Update character list in UI
function updateCharacterList() {
    charList.innerHTML = '';
    let sortedChars = [...characters];

    // Sort characters
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
        sortedChars.sort((a,b) => {
            let countA = entries.filter(e => e.characterId === a.id).length;
            let countB = entries.filter(e => e.characterId === b.id).length;
            return countB - countA;
        });
    }

    sortedChars.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.name} (${c.species}, Hair: ${c.hair}, Eyes: ${c.eyeColor})`;

        // Color circle
        const colorSpan = document.createElement('span');
        colorSpan.style.backgroundColor = c.color;
        colorSpan.style.display = 'inline-block';
        colorSpan.style.width = '12px';
        colorSpan.style.height = '12px';
        colorSpan.style.borderRadius = '50%';
        colorSpan.style.marginLeft = '6px';
        li.appendChild(colorSpan);

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.title = 'Delete character and all their entries';
        delBtn.addEventListener('click', () => {
            if (confirm(`Delete character "${c.name}" and all their diary entries?`)) {
                deleteCharacter(c.id);
            }
        });
        li.appendChild(delBtn);

        charList.appendChild(li);
    });
}

// Delete character and their entries
function deleteCharacter(charId) {
    characters = characters.filter(c => c.id !== charId);
    entries = entries.filter(e => e.characterId !== charId);
    saveData();
    updateCharacterList();
    populateCharacterSelect();
    renderEntries();
}

// Populate character select dropdown for diary entry
function populateCharacterSelect() {
    selectCharacterEntry.innerHTML = '';
    characters.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        selectCharacterEntry.appendChild(opt);
    });

    if (characters.length === 0) {
        // If no characters, go back to creation
        charCreationSection.classList.remove('hidden');
        charListSection.classList.add('hidden');
        appSection.classList.add('hidden');
    }
}

// On character change (in diary)
selectCharacterEntry.addEventListener('change', onCharacterChange);

function onCharacterChange() {
    const charId = Number(selectCharacterEntry.value);
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    characterNameHeader.textContent = `Diary for: ${char.name}`;
    renderEntries();
    drawMoodGraph(charId);
}

// Save diary entry
document.getElementById('saveEntryBtn').addEventListener('click', () => {
    const charId = Number(selectCharacterEntry.value);
    if (!charId) {
        alert('Please select a character.');
        return;
    }
    const text = entryText.value.trim();
    if (!text) {
        alert('Please write some text for the diary entry.');
        return;
    }
    const mood = moodSelect.value;
    const tagsRaw = entryTagsInput.value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    const newEntry = {
        id: Date.now(),
        characterId: charId,
        text,
        mood,
        tags,
        created: new Date().toISOString(),
    };

    entries.push(newEntry);
    saveData();

    entryText.value = '';
    entryTagsInput.value = '';
    moodSelect.value = 'neutral';

    renderEntries();
    drawMoodGraph(charId);
});

// Render diary entries filtered and sorted
function renderEntries() {
    const charId = Number(selectCharacterEntry.value);
    if (!charId) {
        entriesList.innerHTML = '<li>No character selected.</li>';
        return;
    }

    let filtered = entries.filter(e => e.characterId === charId);

    // Filter by mood
    const moodFilter = filterMood.value;
    if (moodFilter !== 'all') {
        filtered = filtered.filter(e => e.mood === moodFilter);
    }

    // Filter by tag
    const tagFilter = filterTag.value.trim().toLowerCase();
    if (tagFilter) {
        filtered = filtered.filter(e => e.tags.includes(tagFilter));
    }

    // Search text
    const searchVal = searchInput.value.trim().toLowerCase();
    if (searchVal) {
        filtered = filtered.filter(e => e.text.toLowerCase().includes(searchVal));
    }

    // Sort entries
    if (sortEntriesSelect.value === 'date-asc') {
        filtered.sort((a, b) => new Date(a.created) - new Date(b.created));
    } else {
        filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
    }

    entriesList.innerHTML = '';

    if (filtered.length === 0) {
        entriesList.innerHTML = '<li>No diary entries found.</li>';
        return;
    }

    filtered.forEach(entry => {
        const li = document.createElement('li');

        const dateStr = new Date(entry.created).toLocaleString();
        const tagsStr = entry.tags.length ? `Tags: ${entry.tags.join(', ')}` : '';
        li.innerHTML = `
          <div>
            <strong>${dateStr}</strong> - Mood: <em>${entry.mood}</em><br />
            ${tagsStr ? `<small>${tagsStr}</small><br />` : ''}
            <p>${entry.text.replace(/\n/g, '<br />')}</p>
            <button class="delete-entry-btn">Delete Entry</button>
          </div>
        `;

        li.querySelector('.delete-entry-btn').addEventListener('click', () => {
            if (confirm('Delete this diary entry?')) {
                deleteEntry(entry.id);
            }
        });

        entriesList.appendChild(li);
    });
}

// Delete diary entry by id
function deleteEntry(entryId) {
    entries = entries.filter(e => e.id !== entryId);
    saveData();
    renderEntries();
    drawMoodGraph(Number(selectCharacterEntry.value));
}

// Save all data to localStorage
function saveData() {
    localStorage.setItem('characters', JSON.stringify(characters));
    localStorage.setItem('entries', JSON.stringify(entries));
}

// Load all data from localStorage
function loadData() {
    const charsRaw = localStorage.getItem('characters');
    if (charsRaw) {
        characters = JSON.parse(charsRaw);
    }
    const entriesRaw = localStorage.getItem('entries');
    if (entriesRaw) {
        entries = JSON.parse(entriesRaw);
    }
}

// Show all entries overview
showAllEntriesBtn.addEventListener('click', () => {
    allEntriesOverviewSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    charListSection.classList.add('hidden');
    charCreationSection.classList.add('hidden');
    renderAllEntriesOverview();
});

// Close overview
closeOverviewBtn.addEventListener('click', () => {
    allEntriesOverviewSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    charListSection.classList.remove('hidden');
});

// Render all entries overview (grouped by character)
function renderAllEntriesOverview() {
    allEntriesOverviewList.innerHTML = '';
    if (entries.length === 0) {
        allEntriesOverviewList.textContent = 'No diary entries available.';
        return;
    }

    const grouped = {};

    entries.forEach(e => {
        if (!grouped[e.characterId]) grouped[e.characterId] = [];
        grouped[e.characterId].push(e);
    });

    for (const charId in grouped) {
        const char = characters.find(c => c.id === Number(charId));
        if (!char) continue;

        const div = document.createElement('div');
        div.innerHTML = `<h3>${char.name} (${grouped[charId].length} entries)</h3>`;

        grouped[charId].forEach(entry => {
            const dateStr = new Date(entry.created).toLocaleString();
            const tagsStr = entry.tags.length ? `Tags: ${entry.tags.join(', ')}` : '';
            const p = document.createElement('p');
            p.innerHTML = `<strong>${dateStr}</strong> - Mood: <em>${entry.mood}</em><br />
                ${tagsStr ? `<small>${tagsStr}</small><br />` : ''}
                ${entry.text.replace(/\n/g, '<br />')}`;
            div.appendChild(p);
        });

        allEntriesOverviewList.appendChild(div);
    }
}

// Draw simple mood graph for selected character
function drawMoodGraph(charId) {
    const width = moodGraphCanvas.width;
    const height = moodGraphCanvas.height;

    moodGraphCtx.clearRect(0, 0, width, height);

    const charEntries = entries
        .filter(e => e.characterId === charId)
        .sort((a, b) => new Date(a.created) - new Date(b.created));

    if (charEntries.length < 2) {
        moodGraphCtx.fillStyle = '#888';
        moodGraphCtx.font = '16px Arial';
        moodGraphCtx.fillText('Not enough entries to draw mood graph.', 20, height / 2);
        return;
    }

    // Map moods to numeric values for plotting
    const moodMap = {
        'happy': 3,
        'neutral': 2,
        'anxious': 1,
        'sad': 0,
    };

    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Draw axis lines
    moodGraphCtx.strokeStyle = '#ff69b4';
    moodGraphCtx.lineWidth = 2;

    // Y axis labels
    const moodsSorted = ['sad', 'anxious', 'neutral', 'happy'];
    moodGraphCtx.fillStyle = '#ff69b4';
    moodGraphCtx.font = '12px Arial';

    for (let i = 0; i < moodsSorted.length; i++) {
        const y = padding + (graphHeight / (moodsSorted.length - 1)) * i;
        moodGraphCtx.fillText(moodsSorted[moodsSorted.length - 1 - i], 5, y + 4);
        moodGraphCtx.beginPath();
        moodGraphCtx.moveTo(padding, y);
        moodGraphCtx.lineTo(width - padding, y);
        moodGraphCtx.strokeStyle = '#ffd6e8';
        moodGraphCtx.stroke();
    }

    // X axis labels: Dates evenly spaced
    const n = charEntries.length;
    for (let i = 0; i < n; i++) {
        const x = padding + (graphWidth / (n - 1)) * i;
        if (i % Math.ceil(n/10) === 0 || i === n - 1) {
            const dateStr = new Date(charEntries[i].created).toLocaleDateString();
            moodGraphCtx.fillStyle = '#ff69b4';
            moodGraphCtx.fillText(dateStr, x - 20, height - 10);
        }
    }

    // Plot line
    moodGraphCtx.strokeStyle = '#ff1493';
    moodGraphCtx.lineWidth = 3;
    moodGraphCtx.beginPath();

    charEntries.forEach((e, i) => {
        const x = padding + (graphWidth / (n - 1)) * i;
        const moodValue = moodMap[e.mood] !== undefined ? moodMap[e.mood] : 2;
        const y = padding + graphHeight - (moodValue / 3) * graphHeight;
        if (i === 0) {
            moodGraphCtx.moveTo(x, y);
        } else {
            moodGraphCtx.lineTo(x, y);
        }
        // Draw points
        moodGraphCtx.fillStyle = '#ff69b4';
        moodGraphCtx.beginPath();
        moodGraphCtx.arc(x, y, 5, 0, 2 * Math.PI);
        moodGraphCtx.fill();
    });

    moodGraphCtx.stroke();
}

// Sort characters event
sortCharactersSelect.addEventListener('change', () => {
    updateCharacterList();
});

// Filters events for entries
filterMood.addEventListener('change', renderEntries);
filterTag.addEventListener('input', renderEntries);
searchInput.addEventListener('input', renderEntries);
sortEntriesSelect.addEventListener('change', renderEntries);

// Create new character button in character list section
createNewCharBtn.addEventListener('click', () => {
    charCreationSection.classList.remove('hidden');
    charListSection.classList.add('hidden');
    appSection.classList.add('hidden');
});

// Initialize app
function init() {
    loadData();

    if (characters.length === 0) {
        charCreationSection.classList.remove('hidden');
        charListSection.classList.add('hidden');
        appSection.classList.add('hidden');
    } else {
        charCreationSection.classList.add('hidden');
        charListSection.classList.remove('hidden');
        appSection.classList.remove('hidden');
        updateCharacterList();
        populateCharacterSelect();
        selectCharacterEntry.value = characters[0].id;
        onCharacterChange();
    }
}

init();

const music = document.getElementById('backgroundMusic');
const musicToggleBtn = document.getElementById('musicToggleBtn');

musicToggleBtn.addEventListener('click', () => {
    if (music.paused) {
        music.muted = false;
        music.play();
        musicToggleBtn.textContent = '🔊 Pause Music';
    } else {
        music.pause();
        musicToggleBtn.textContent = '🔈 Play Music';
    }
});

