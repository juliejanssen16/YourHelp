document.addEventListener('DOMContentLoaded', () => {
    const charNameInput = document.getElementById('charName');
    const saveCharBtn = document.getElementById('saveCharBtn');
    const charDisplayList = document.getElementById('charDisplayList');
    const charSelect = document.getElementById('charSelect');
    const entryText = document.getElementById('entryText');
    const entryTags = document.getElementById('entryTags');
    const moodSelect = document.getElementById('moodSelect');
    const saveEntryBtn = document.getElementById('saveEntryBtn');
    const entriesList = document.getElementById('entriesList');
    const searchInput = document.getElementById('searchInput');

    let characters = JSON.parse(localStorage.getItem('characters')) || [];
    let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    let editingCharId = null;

    function saveCharacters() {
        localStorage.setItem('characters', JSON.stringify(characters));
    }

    function saveEntries() {
        localStorage.setItem('diaryEntries', JSON.stringify(entries));
    }

    function updateCharList() {
        charDisplayList.innerHTML = '';
        charSelect.innerHTML = '<option value="">Select Character</option>';
        characters.forEach(char => {
            const li = document.createElement('li');
            li.textContent = char.name;

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => {
                editingCharId = char.id;
                charNameInput.value = char.name;
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => {
                if (confirm(`Delete "${char.name}" and all related entries?`)) {
                    characters = characters.filter(c => c.id !== char.id);
                    entries = entries.filter(e => e.characterId !== char.id);
                    saveCharacters();
                    saveEntries();
                    updateCharList();
                    renderEntries();
                }
            };

            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            charDisplayList.appendChild(li);

            const opt = document.createElement('option');
            opt.value = char.id;
            opt.textContent = char.name;
            charSelect.appendChild(opt);
        });
    }

    function renderEntries() {
        const term = searchInput.value.toLowerCase();
        entriesList.innerHTML = '';

        entries
            .filter(entry => {
                return (
                    entry.text.toLowerCase().includes(term) ||
                    entry.tags.some(tag => tag.toLowerCase().includes(term))
                );
            })
            .forEach(entry => {
                const div = document.createElement('div');
                div.classList.add('entry');

                const char = characters.find(c => c.id === entry.characterId);
                const charName = char ? char.name : 'Unknown';

                div.innerHTML = `
                    <p><strong>Character:</strong> ${charName}</p>
                    <p>${entry.text}</p>
                    <p><strong>Tags:</strong> ${entry.tags.join(', ')}</p>
                    <p><strong>Mood:</strong> ${entry.mood}</p>
                    <p style="font-style: italic;">${new Date(entry.date).toLocaleString()}</p>
                `;

                entriesList.appendChild(div);
            });
    }

    saveCharBtn.addEventListener('click', () => {
        const name = charNameInput.value.trim();
        if (!name) return alert('Please enter a name');

        if (editingCharId) {
            const idx = characters.findIndex(c => c.id === editingCharId);
            if (idx !== -1) characters[idx].name = name;
            editingCharId = null;
        } else {
            characters.push({ id: Date.now().toString(), name });
        }

        charNameInput.value = '';
        saveCharacters();
        updateCharList();
    });

    saveEntryBtn.addEventListener('click', () => {
        const text = entryText.value.trim();
        const tags = entryTags.value.split(',').map(t => t.trim()).filter(t => t);
        const mood = moodSelect.value;
        const characterId = charSelect.value;

        if (!characterId) return alert('Please select a character');
        if (!text) return alert('Entry cannot be empty');

        entries.push({
            id: Date.now().toString(),
            characterId,
            text,
            tags,
            mood,
            date: new Date().toISOString()
        });

        entryText.value = '';
        entryTags.value = '';
        moodSelect.value = 'neutral';
        saveEntries();
        renderEntries();
    });

    searchInput.addEventListener('input', renderEntries);

    updateCharList();
    renderEntries();
});
