document.addEventListener('DOMContentLoaded', () => {

    const traitNamesMap = {
        trait1: 'Brave',
        trait2: 'Smart',
        trait3: 'Kind',
        trait4: 'Funny',
    };

    // Elements
    const app = document.getElementById('app');
    const characterCreationSection = document.getElementById('characterCreationSection');
    const characterListSection = document.getElementById('characterListSection');
    const diarySection = document.getElementById('diarySection');
    const entriesOverviewSection = document.getElementById('entriesOverviewSection');

    const charNameInput = document.getElementById('charName');
    const charColorInput = document.getElementById('charColor');
    const traitButtons = [...document.querySelectorAll('.trait-btn')];
    const saveCharBtn = document.getElementById('saveCharBtn');
    const cancelCharBtn = document.getElementById('cancelCharBtn');
    const charList = document.getElementById('charList');
    const addNewCharBtn = document.getElementById('addNewCharBtn');

    const charSelect = document.getElementById('charSelect');
    const entryText = document.getElementById('entryText');
    const entryTags = document.getElementById('entryTags');
    const entryMood = document.getElementById('entryMood');
    const saveEntryBtn = document.getElementById('saveEntryBtn');

    const allEntriesOverviewList = document.getElementById('allEntriesOverviewList');

    // Data
    let characters = JSON.parse(localStorage.getItem('characters') || '[]');
    let entries = JSON.parse(localStorage.getItem('entries') || '[]');

    let editingCharId = null;
    let selectedTraits = {};
    let currentCharacterId = null;

    // --- Character Creation & Editing ---

    traitButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trait = btn.dataset.trait;
            if (selectedTraits[trait]) {
                delete selectedTraits[trait];
                btn.classList.remove('active');
            } else {
                selectedTraits[trait] = true;
                btn.classList.add('active');
            }
        });
    });

    function updateCharacterList() {
        charList.innerHTML = '';
        if (characters.length === 0) {
            charList.innerHTML = '<li>No characters yet. Please add one.</li>';
            return;
        }

        characters.forEach(char => {
            const li = document.createElement('li');

            // Colored circle
            const colorCircle = document.createElement('span');
            colorCircle.style.display = 'inline-block';
            colorCircle.style.width = '12px';
            colorCircle.style.height = '12px';
            colorCircle.style.borderRadius = '50%';
            colorCircle.style.backgroundColor = char.color || '#ff69b4';
            colorCircle.style.marginRight = '8px';

            li.appendChild(colorCircle);

            const traitDisplayNames = Object.keys(char.traits).map(t => traitNamesMap[t]).filter(Boolean);
            li.appendChild(document.createTextNode(`${char.name} - Traits: ${traitDisplayNames.join(', ') || 'None'}`));


            // Buttons: Select, Edit, Delete
            const selectBtn = document.createElement('button');
            selectBtn.textContent = 'Select';
            selectBtn.style.marginLeft = '10px';
            selectBtn.addEventListener('click', () => {
                currentCharacterId = char.id;
                setCurrentCharacter(char.id);
                updateSectionsVisibility();
            });

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginLeft = '5px';
            editBtn.addEventListener('click', () => {
                editingCharId = char.id;
                selectedTraits = { ...char.traits };

                charNameInput.value = char.name;
                charColorInput.value = char.color || '#ff69b4';

                traitButtons.forEach(btn => {
                    if (selectedTraits[btn.dataset.trait]) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });

                characterCreationSection.classList.remove('hidden');
                characterListSection.classList.add('hidden');
                diarySection.classList.add('hidden');
                entriesOverviewSection.classList.add('hidden');
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.marginLeft = '5px';
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Delete character "${char.name}" and all their entries?`)) {
                    characters = characters.filter(c => c.id !== char.id);
                    entries = entries.filter(e => e.characterId !== char.id);
                    localStorage.setItem('characters', JSON.stringify(characters));
                    localStorage.setItem('entries', JSON.stringify(entries));

                    if (currentCharacterId === char.id) currentCharacterId = null;

                    updateCharacterList();
                    updateCharSelectOptions();
                    renderEntries();
                    updateSectionsVisibility();
                }
            });

            li.appendChild(selectBtn);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);

            charList.appendChild(li);
        });
    }

    saveCharBtn.addEventListener('click', () => {
        const charName = charNameInput.value.trim();
        const charColor = charColorInput.value;

        if (!charName) {
            alert('Please enter a name for the character.');
            return;
        }

        // Traits stored as keys with true, e.g. { trait1: true, trait2: true }
        // It's okay even if empty

        if (editingCharId) {
            // Update existing
            const idx = characters.findIndex(c => c.id === editingCharId);
            if (idx !== -1) {
                characters[idx] = {
                    id: editingCharId,
                    name: charName,
                    color: charColor,
                    traits: { ...selectedTraits }
                };
            }
            editingCharId = null;
        } else {
            // Add new
            characters.push({
                id: String(Date.now()),
                name: charName,
                color: charColor,
                traits: { ...selectedTraits }
            });
        }

        localStorage.setItem('characters', JSON.stringify(characters));

        // Reset form
        charNameInput.value = '';
        charColorInput.value = '#ff69b4';
        selectedTraits = {};
        traitButtons.forEach(btn => btn.classList.remove('active'));

        updateCharacterList();
        updateCharSelectOptions();

        // Select the last created character
        currentCharacterId = characters[characters.length - 1].id;
        setCurrentCharacter(currentCharacterId);
        updateSectionsVisibility();
    });

    cancelCharBtn.addEventListener('click', () => {
        editingCharId = null;
        charNameInput.value = '';
        charColorInput.value = '#ff69b4';
        selectedTraits = {};
        traitButtons.forEach(btn => btn.classList.remove('active'));

        updateSectionsVisibility();
    });

    addNewCharBtn.addEventListener('click', () => {
        editingCharId = null;
        charNameInput.value = '';
        charColorInput.value = '#ff69b4';
        selectedTraits = {};
        traitButtons.forEach(btn => btn.classList.remove('active'));

        characterCreationSection.classList.remove('hidden');
        characterListSection.classList.add('hidden');
        diarySection.classList.add('hidden');
        entriesOverviewSection.classList.add('hidden');
    });

    // --- Diary Entries ---

    function updateCharSelectOptions() {
        charSelect.innerHTML = '';
        characters.forEach(char => {
            const opt = document.createElement('option');
            opt.value = char.id;
            opt.textContent = char.name;
            charSelect.appendChild(opt);
        });

        if (characters.length > 0) {
            currentCharacterId = currentCharacterId || characters[0].id;
            charSelect.value = currentCharacterId;
        } else {
            currentCharacterId = null;
        }
    }

    charSelect.addEventListener('change', () => {
        currentCharacterId = charSelect.value;
        renderEntries();
    });

    saveEntryBtn.addEventListener('click', () => {
        const text = entryText.value.trim();
        if (!text) {
            alert('Please write something in your diary entry.');
            return;
        }
        const tagsRaw = entryTags.value.trim();
        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
        const mood = entryMood.value;
        const characterId = charSelect.value;

        if (!characterId) {
            alert('Please select a character first.');
            return;
        }

        entries.push({
            id: String(Date.now()),
            characterId,
            text,
            tags,
            mood
        });

        localStorage.setItem('entries', JSON.stringify(entries));

        entryText.value = '';
        entryTags.value = '';
        entryMood.value = 'Happy';

        renderEntries();
        updateSectionsVisibility();
    });

    function renderEntries() {
        allEntriesOverviewList.innerHTML = '';
        if (!currentCharacterId) {
            allEntriesOverviewList.textContent = 'Please select a character to see diary entries.';
            return;
        }

        const filteredEntries = entries.filter(e => e.characterId === currentCharacterId);

        if (filteredEntries.length === 0) {
            allEntriesOverviewList.textContent = 'No diary entries yet.';
            return;
        }

        filteredEntries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('entry');

            // Find character color
            const character = characters.find(c => c.id === entry.characterId);
            const color = character?.color || '#ff69b4';
            entryDiv.style.borderLeft = `4px solid ${color}`;
            entryDiv.style.paddingLeft = '8px';
            entryDiv.style.marginBottom = '12px';

            const textP = document.createElement('p');
            textP.textContent = entry.text;

            const tagsP = document.createElement('p');
            tagsP.textContent = `Tags: ${entry.tags.join(', ') || 'None'}`;

            const moodP = document.createElement('p');
            moodP.textContent = `Mood: ${entry.mood}`;

            entryDiv.appendChild(textP);
            entryDiv.appendChild(tagsP);
            entryDiv.appendChild(moodP);

            allEntriesOverviewList.appendChild(entryDiv);
        });
    }

    // --- UI State Control ---

    function setCurrentCharacter(id) {
        currentCharacterId = id;
        charSelect.value = id;
        renderEntries();
    }

    function updateSectionsVisibility() {
        if (characters.length === 0) {
            // No characters yet, show creation form only
            characterCreationSection.classList.remove('hidden');
            characterListSection.classList.add('hidden');
            diarySection.classList.add('hidden');
            entriesOverviewSection.classList.add('hidden');
        } else if (editingCharId !== null) {
            // Editing character
            characterCreationSection.classList.remove('hidden');
            characterListSection.classList.add('hidden');
            diarySection.classList.add('hidden');
            entriesOverviewSection.classList.add('hidden');
        } else if (currentCharacterId) {
            // Show diary and entries
            characterCreationSection.classList.add('hidden');
            characterListSection.classList.remove('hidden');
            diarySection.classList.remove('hidden');
            entriesOverviewSection.classList.remove('hidden');
        } else {
            // Just show character list
            characterCreationSection.classList.add('hidden');
            characterListSection.classList.remove('hidden');
            diarySection.classList.add('hidden');
            entriesOverviewSection.classList.add('hidden');
        }
    }

    // --- Initial Setup ---

    updateCharacterList();
    updateCharSelectOptions();
    updateSectionsVisibility();
    renderEntries();

});
