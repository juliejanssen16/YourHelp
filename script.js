/* =========================================================
   PINK DIARY STUDIO — ULTIMATE EDITION
   - Sims-like UI + state engine
   - Multiple characters
   - Undo/Redo time travel
   - Life simulation (needs drain + mood rules)
   - Events + Next Day
   - Traits with effects
   - Sensory sliders + gentle prompts
   - LocalStorage autosave
   - Export/Import JSON, Export Diary TXT
========================================================= */

/* -----------------------------
   STORAGE
-------------------------------- */
const STORAGE_KEY = "pinkDiaryStudio_ultimate_v1";

/* -----------------------------
   HISTORY (UNDO/REDO)
-------------------------------- */
const HISTORY_LIMIT = 60;
let history = []; // past snapshots
let future = []; // redo snapshots

/* Push a snapshot into history (for undo) */
function pushHistory() {
  history.push(JSON.stringify(state));
  if (history.length > HISTORY_LIMIT) history.shift();
  future = []; // new change invalidates redo
}

/* Undo: restore previous snapshot */
function undo() {
  if (history.length === 0) return;
  future.push(JSON.stringify(state));
  state = JSON.parse(history.pop());
  saveStateToStorage();
  renderAll();
  log("↩ Undo");
}

/* Redo: re-apply undone snapshot */
function redo() {
  if (future.length === 0) return;
  history.push(JSON.stringify(state));
  state = JSON.parse(future.pop());
  saveStateToStorage();
  renderAll();
  log("↪ Redo");
}

/* -----------------------------
   DEFAULT CHARACTER
-------------------------------- */
function makeNewCharacter() {
  return {
    id: crypto.randomUUID(),
    name: "New Character",

    appearance: {
      hairStyle: "short",
      hairColor: "#5a2d0c",
      eyeColor: "#1b1b1b",
      outfitColor: "#ff8fb1",
      accessories: [], // multiple icons
    },

    mood: "neutral",

    needs: { energy: 70, social: 60, focus: 50 },

    traits: ["creative"],

    diary: [], // {ts, text}

    sensory: { noise: 40, light: 35, touch: 45 },

    comfortNotes: "",
  };
}

/* -----------------------------
   APP STATE (single source of truth)
-------------------------------- */
let state = loadStateFromStorage();

/* Ensure at least 1 character */
if (!state.characters || state.characters.length === 0) {
  state = {
    characters: [makeNewCharacter()],
    currentIndex: 0,
    ui: { activeTab: "customize", lowStimulus: false },
  };
  saveStateToStorage();
}

/* -----------------------------
   DOM REFERENCES
-------------------------------- */
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const nextDayBtn = document.getElementById("nextDayBtn");
const randomizeBtn = document.getElementById("randomizeBtn");
const resetBtn = document.getElementById("resetBtn");

const exportJsonBtn = document.getElementById("exportJsonBtn");
const importJsonBtn = document.getElementById("importJsonBtn");
const importFile = document.getElementById("importFile");

const lowStimulusBtn = document.getElementById("lowStimulusBtn");

const newCharacterBtn = document.getElementById("newCharacterBtn");
const duplicateBtn = document.getElementById("duplicateBtn");
const deleteBtn = document.getElementById("deleteBtn");

const characterSelect = document.getElementById("characterSelect");
const householdList = document.getElementById("householdList");

/* Center */
const nameplateName = document.getElementById("nameplateName");
const moodBadge = document.getElementById("moodBadge");
const liveLog = document.getElementById("liveLog");

/* Character visuals */
const hair = document.getElementById("hair");
const eyes = document.getElementById("eyes");
const mouth = document.getElementById("mouth");
const body = document.getElementById("body");
const accessoriesEl = document.getElementById("accessories");

/* Needs UI */
const energyValue = document.getElementById("energyValue");
const socialValue = document.getElementById("socialValue");
const focusValue = document.getElementById("focusValue");
const energyBar = document.getElementById("energyBar");
const socialBar = document.getElementById("socialBar");
const focusBar = document.getElementById("focusBar");

/* Right panel inputs */
const nameInput = document.getElementById("nameInput");
const hairSelect = document.getElementById("hairSelect");
const hairColor = document.getElementById("hairColor");
const eyeColor = document.getElementById("eyeColor");
const outfitColor = document.getElementById("outfitColor");
const moodSelect = document.getElementById("moodSelect");

const accessorySelect = document.getElementById("accessorySelect");
const addAccessoryBtn = document.getElementById("addAccessoryBtn");
const clearAccessoriesBtn = document.getElementById("clearAccessoriesBtn");

/* Sliders */
const energySlider = document.getElementById("energySlider");
const socialSlider = document.getElementById("socialSlider");
const focusSlider = document.getElementById("focusSlider");

/* Traits */
const traitsPreview = document.getElementById("traitsPreview");
const traitsList = document.getElementById("traitsList");
const traitInput = document.getElementById("traitInput");
const addTraitBtn = document.getElementById("addTraitBtn");

/* Diary */
const diaryText = document.getElementById("diaryText");
const saveDiaryBtn = document.getElementById("saveDiaryBtn");
const diaryEntries = document.getElementById("diaryEntries");
const exportDiaryBtn = document.getElementById("exportDiaryBtn");

/* Sensory */
const noiseSlider = document.getElementById("noiseSlider");
const lightSlider = document.getElementById("lightSlider");
const touchSlider = document.getElementById("touchSlider");
const comfortNotes = document.getElementById("comfortNotes");
const gentlePrompt = document.getElementById("gentlePrompt");

/* Presets + tabs */
const presetButtons = document.querySelectorAll(".preset[data-outfit]");
const traitSuggestButtons = document.querySelectorAll(".trait-suggest");
const tabs = document.querySelectorAll(".tab");
const tabpages = {
  customize: document.getElementById("tab-customize"),
  traits: document.getElementById("tab-traits"),
  diary: document.getElementById("tab-diary"),
  sensory: document.getElementById("tab-sensory"),
};

/* -----------------------------
   STORAGE HELPERS
-------------------------------- */
function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          characters: [],
          currentIndex: 0,
          ui: { activeTab: "customize", lowStimulus: false },
        };
  } catch {
    return {
      characters: [],
      currentIndex: 0,
      ui: { activeTab: "customize", lowStimulus: false },
    };
  }
}

function saveStateToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* -----------------------------
   UTILITIES
-------------------------------- */
function clamp01to100(n) {
  const num = Number(n);
  return Math.max(0, Math.min(100, isNaN(num) ? 0 : num));
}

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function currentChar() {
  return state.characters[state.currentIndex];
}

/* Small log (keeps last ~6 lines) */
function log(msg) {
  const time = new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const line = document.createElement("div");
  line.textContent = `${time} — ${msg}`;
  liveLog.prepend(line);

  /* Cap log length visually */
  while (liveLog.children.length > 6) {
    liveLog.removeChild(liveLog.lastChild);
  }
}

/* Download helper */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* -----------------------------
   LIFE SIM: TRAIT EFFECTS
   (Easy to extend into a full modifier system)
-------------------------------- */
const TRAIT_EFFECTS = {
  creative: (c) => {
    c.needs.focus = clamp01to100(c.needs.focus + 2);
  },
  shy: (c) => {
    c.needs.social = clamp01to100(c.needs.social - 2);
  },
  sensitive: (c) => {
    c.sensory.noise = clamp01to100(c.sensory.noise + 2);
  },
  organized: (c) => {
    c.needs.focus = clamp01to100(c.needs.focus + 1);
  },
  hyperfocus: (c) => {
    c.needs.focus = clamp01to100(c.needs.focus + 3);
    c.needs.energy = clamp01to100(c.needs.energy - 2);
  },
  empathetic: (c) => {
    c.needs.social = clamp01to100(c.needs.social + 1);
  },
};

/* -----------------------------
   EVENTS (random “day events”)
-------------------------------- */
const EVENTS = [
  {
    name: "Quiet Day",
    effect(c) {
      c.needs.energy = clamp01to100(c.needs.energy + 8);
      c.needs.focus = clamp01to100(c.needs.focus + 6);
      c.diary.unshift({
        ts: Date.now(),
        text: "Today was calm and quiet. That helped a lot.",
      });
    },
  },
  {
    name: "Overstimulating Errands",
    effect(c) {
      c.needs.focus = clamp01to100(c.needs.focus - 10);
      c.needs.energy = clamp01to100(c.needs.energy - 6);
      c.sensory.noise = clamp01to100(c.sensory.noise + 6);
      c.mood = "overstimulated";
    },
  },
  {
    name: "Good Social Moment",
    effect(c) {
      c.needs.social = clamp01to100(c.needs.social + 10);
      c.mood = "happy";
      c.diary.unshift({
        ts: Date.now(),
        text: "A good social moment happened. I felt seen.",
      });
    },
  },
  {
    name: "Deep Work Session",
    effect(c) {
      c.needs.focus = clamp01to100(c.needs.focus + 12);
      c.needs.energy = clamp01to100(c.needs.energy - 6);
      c.mood = "focused";
    },
  },
  {
    name: "Rest + Reset",
    effect(c) {
      c.needs.energy = clamp01to100(c.needs.energy + 14);
      c.sensory.light = clamp01to100(c.sensory.light - 4);
      c.mood = "neutral";
    },
  },
];

function triggerRandomEvent() {
  const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  e.effect(currentChar());
  log(`✨ Event: ${e.name}`);
}

/* Apply trait effects once per day */
function applyTraitsOnce() {
  const c = currentChar();
  c.traits.forEach((tr) => {
    if (TRAIT_EFFECTS[tr]) TRAIT_EFFECTS[tr](c);
  });
  log("🎭 Traits applied");
}

/* -----------------------------
   RENDER FUNCTIONS
-------------------------------- */
function renderHousehold() {
  /* Dropdown select */
  characterSelect.innerHTML = "";
  state.characters.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = c.name || `Character ${i + 1}`;
    characterSelect.appendChild(opt);
  });
  characterSelect.value = String(state.currentIndex);

  /* Household cards */
  householdList.innerHTML = "";
  state.characters.forEach((c, i) => {
    const card = document.createElement("div");
    card.className =
      "household-card" + (i === state.currentIndex ? " active" : "");

    const top = document.createElement("div");
    top.className = "card-top";

    const nm = document.createElement("div");
    nm.className = "card-name";
    nm.textContent = c.name || `Character ${i + 1}`;

    const md = document.createElement("div");
    md.className = "badge";
    md.textContent = c.mood;

    top.appendChild(nm);
    top.appendChild(md);

    const sub = document.createElement("div");
    sub.className = "card-sub";
    sub.textContent = `Traits: ${c.traits.length} • Entries: ${c.diary.length}`;

    card.appendChild(top);
    card.appendChild(sub);

    card.addEventListener("click", () => {
      pushHistory();
      state.currentIndex = i;
      saveStateToStorage();
      renderAll();
      log(`👤 Active: ${currentChar().name}`);
    });

    householdList.appendChild(card);
  });
}

function renderInputs() {
  const c = currentChar();

  nameInput.value = c.name;
  hairSelect.value = c.appearance.hairStyle;
  hairColor.value = c.appearance.hairColor;
  eyeColor.value = c.appearance.eyeColor;
  outfitColor.value = c.appearance.outfitColor;
  moodSelect.value = c.mood;

  energySlider.value = String(c.needs.energy);
  socialSlider.value = String(c.needs.social);
  focusSlider.value = String(c.needs.focus);

  noiseSlider.value = String(c.sensory.noise);
  lightSlider.value = String(c.sensory.light);
  touchSlider.value = String(c.sensory.touch);

  comfortNotes.value = c.comfortNotes || "";
}

function renderCharacterVisuals() {
  const c = currentChar();

  nameplateName.textContent = c.name;
  moodBadge.textContent = c.mood;

  /* Hair */
  hair.style.background = c.appearance.hairColor;

  /* Reset hair geometry */
  hair.style.height = "58px";
  hair.style.borderRadius = "22px";

  /* Apply hair style shapes */
  if (c.appearance.hairStyle === "long") {
    hair.style.height = "92px";
    hair.style.borderRadius = "26px";
  } else if (c.appearance.hairStyle === "bun") {
    hair.style.height = "44px";
    hair.style.borderRadius = "999px";
  } else if (c.appearance.hairStyle === "pigtails") {
    hair.style.height = "66px";
    hair.style.borderRadius = "18px";
  }

  /* Eyes color:
     - CSS uses currentColor for pseudo elements
     - so set eyes.style.color
  */
  eyes.style.color = c.appearance.eyeColor;

  /* Outfit */
  body.style.background = c.appearance.outfitColor;

  /* Expression (mouth shape) based on mood */
  mouth.style.height = "5px";
  mouth.style.width = "20px";
  mouth.style.transform = "none";

  if (c.mood === "happy") {
    mouth.style.height = "8px";
    mouth.style.width = "22px";
    mouth.style.transform = "translateY(2px)";
  }
  if (c.mood === "sad") {
    mouth.style.height = "3px";
    mouth.style.width = "22px";
    mouth.style.transform = "translateY(-1px)";
  }
  if (c.mood === "overstimulated") {
    mouth.style.height = "2px";
    mouth.style.width = "26px";
    mouth.style.transform = "translateY(-2px)";
  }
  if (c.mood === "tired") {
    mouth.style.height = "2px";
    mouth.style.width = "24px";
    mouth.style.transform = "translateY(1px)";
  }
  if (c.mood === "lonely") {
    mouth.style.height = "3px";
    mouth.style.width = "24px";
    mouth.style.transform = "translateY(-1px)";
  }
  if (c.mood === "focused") {
    mouth.style.height = "5px";
    mouth.style.width = "18px";
    mouth.style.transform = "translateY(0px)";
  }

  /* Accessories */
  accessoriesEl.innerHTML = "";
  c.appearance.accessories.forEach((icon, idx) => {
    const span = document.createElement("span");
    span.className = "accessory";
    span.title = "Click to remove";

    span.textContent = icon;

    /* Remove accessory on click */
    span.addEventListener("click", () => {
      pushHistory();
      c.appearance.accessories.splice(idx, 1);
      saveStateToStorage();
      renderAll();
      log("🧩 Accessory removed");
    });

    accessoriesEl.appendChild(span);
  });
}

function renderNeeds() {
  const c = currentChar();

  energyValue.textContent = String(c.needs.energy);
  socialValue.textContent = String(c.needs.social);
  focusValue.textContent = String(c.needs.focus);

  energyBar.style.width = c.needs.energy + "%";
  socialBar.style.width = c.needs.social + "%";
  focusBar.style.width = c.needs.focus + "%";
}

function renderTraits() {
  const c = currentChar();

  /* Preview chips (center) */
  traitsPreview.innerHTML = "";
  c.traits.forEach((tr) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = tr;
    traitsPreview.appendChild(chip);
  });

  /* Editable chips (traits tab) */
  traitsList.innerHTML = "";
  c.traits.forEach((tr) => {
    const chip = document.createElement("div");
    chip.className = "chip";

    const label = document.createElement("span");
    label.textContent = tr;

    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "✖";
    rm.title = "Remove trait";
    rm.addEventListener("click", () => {
      pushHistory();
      c.traits = c.traits.filter((t) => t !== tr);
      saveStateToStorage();
      renderAll();
      log(`➖ Trait removed: ${tr}`);
    });

    chip.appendChild(label);
    chip.appendChild(rm);
    traitsList.appendChild(chip);
  });
}

function renderDiary() {
  const c = currentChar();
  diaryEntries.innerHTML = "";

  c.diary.forEach((entry) => {
    const wrap = document.createElement("div");
    wrap.className = "entry";

    const top = document.createElement("div");
    top.className = "entry-top";

    const date = document.createElement("span");
    date.textContent = formatDate(entry.ts);

    const del = document.createElement("button");
    del.className = "btn btn-small btn-danger";
    del.textContent = "Delete";
    del.title = "Remove this entry";
    del.addEventListener("click", () => {
      pushHistory();
      c.diary = c.diary.filter((e) => e.ts !== entry.ts);
      saveStateToStorage();
      renderAll();
      log("🗑 Diary entry deleted");
    });

    top.appendChild(date);
    top.appendChild(del);

    const text = document.createElement("div");
    text.textContent = entry.text;

    wrap.appendChild(top);
    wrap.appendChild(text);
    diaryEntries.appendChild(wrap);
  });
}

function renderGentlePrompt() {
  const c = currentChar();

  /* Gentle “cause → effect” prompt (predictable, ND-friendly) */
  let prompt = "No prompt right now 💗";

  if (c.needs.focus < 25)
    prompt = "Your focus is low. Want to write what’s making it hard today?";
  if (c.needs.energy < 25)
    prompt = "Your energy is low. Any rest/comfort you want to note?";
  if (c.sensory.noise > 70)
    prompt = "Noise sensitivity is high. Was today loud? What helped?";
  if (c.mood === "overstimulated")
    prompt = "You’re overstimulated. Want to describe triggers + supports?";

  gentlePrompt.textContent = prompt;
}

function renderLowStimulus() {
  document.body.classList.toggle("low-stimulus", !!state.ui.lowStimulus);
}

function renderAll() {
  renderLowStimulus();
  renderHousehold();
  renderInputs();
  renderCharacterVisuals();
  renderNeeds();
  renderTraits();
  renderDiary();
  renderGentlePrompt();

  /* Keep tab UI consistent with state */
  tabs.forEach((t) => t.classList.remove("active"));
  Object.values(tabpages).forEach((p) => p.classList.remove("active"));

  const tabKey = state.ui.activeTab || "customize";
  const activeBtn = [...tabs].find((t) => t.dataset.tab === tabKey) || tabs[0];
  activeBtn.classList.add("active");
  (tabpages[tabKey] || tabpages.customize).classList.add("active");
}

/* -----------------------------
   TABS: click sets state.ui.activeTab
-------------------------------- */
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    pushHistory();
    state.ui.activeTab = btn.dataset.tab;
    saveStateToStorage();
    renderAll();
  });
});

/* -----------------------------
   HOUSEHOLD ACTIONS
-------------------------------- */
newCharacterBtn.addEventListener("click", () => {
  pushHistory();
  state.characters.push(makeNewCharacter());
  state.currentIndex = state.characters.length - 1;
  saveStateToStorage();
  renderAll();
  log("➕ New character created");
});

duplicateBtn.addEventListener("click", () => {
  pushHistory();
  const src = currentChar();
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = crypto.randomUUID();
  copy.name = src.name + " (Copy)";
  state.characters.push(copy);
  state.currentIndex = state.characters.length - 1;
  saveStateToStorage();
  renderAll();
  log("🧬 Character duplicated");
});

deleteBtn.addEventListener("click", () => {
  if (state.characters.length <= 1) {
    alert("You need at least one character in the household 💗");
    return;
  }
  pushHistory();
  state.characters.splice(state.currentIndex, 1);
  state.currentIndex = Math.max(0, state.currentIndex - 1);
  saveStateToStorage();
  renderAll();
  log("🗑 Character deleted");
});

characterSelect.addEventListener("change", (e) => {
  pushHistory();
  state.currentIndex = Number(e.target.value);
  saveStateToStorage();
  renderAll();
  log(`👤 Active: ${currentChar().name}`);
});

/* -----------------------------
   UNDO/REDO BUTTONS + SHORTCUTS
-------------------------------- */
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

document.addEventListener("keydown", (e) => {
  /* Ctrl+Z and Ctrl+Y */
  if (e.ctrlKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undo();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redo();
  }
});

/* -----------------------------
   LOW STIMULUS TOGGLE
-------------------------------- */
lowStimulusBtn.addEventListener("click", () => {
  pushHistory();
  state.ui.lowStimulus = !state.ui.lowStimulus;
  saveStateToStorage();
  renderAll();
  log(state.ui.lowStimulus ? "🫧 Low-stimulus ON" : "✨ Low-stimulus OFF");
});

/* -----------------------------
   RESET
-------------------------------- */
resetBtn.addEventListener("click", () => {
  const ok = confirm(
    "Reset everything? This clears all characters and diary entries."
  );
  if (!ok) return;

  pushHistory();
  state = {
    characters: [makeNewCharacter()],
    currentIndex: 0,
    ui: { activeTab: "customize", lowStimulus: false },
  };
  saveStateToStorage();
  renderAll();
  log("🧼 Reset complete");
});

/* -----------------------------
   CUSTOMIZE INPUTS
-------------------------------- */
nameInput.addEventListener("input", () => {
  pushHistory();
  currentChar().name = nameInput.value || "Unnamed";
  saveStateToStorage();
  renderAll();
});

hairSelect.addEventListener("change", () => {
  pushHistory();
  currentChar().appearance.hairStyle = hairSelect.value;
  saveStateToStorage();
  renderAll();
});

hairColor.addEventListener("input", () => {
  pushHistory();
  currentChar().appearance.hairColor = hairColor.value;
  saveStateToStorage();
  renderAll();
});

eyeColor.addEventListener("input", () => {
  pushHistory();
  currentChar().appearance.eyeColor = eyeColor.value;
  saveStateToStorage();
  renderAll();
});

outfitColor.addEventListener("input", () => {
  pushHistory();
  currentChar().appearance.outfitColor = outfitColor.value;
  saveStateToStorage();
  renderAll();
});

moodSelect.addEventListener("change", () => {
  pushHistory();
  currentChar().mood = moodSelect.value;
  saveStateToStorage();
  renderAll();
});

/* Outfit presets */
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    pushHistory();
    const col = btn.dataset.outfit;
    currentChar().appearance.outfitColor = col;
    outfitColor.value = col;
    saveStateToStorage();
    renderAll();
    log("👗 Outfit preset applied");
  });
});

/* Accessories (add multiple) */
addAccessoryBtn.addEventListener("click", () => {
  const val = accessorySelect.value;
  if (val === "none") return;

  pushHistory();
  currentChar().appearance.accessories.push(val);
  saveStateToStorage();
  renderAll();
  log("🧩 Accessory added");
});

clearAccessoriesBtn.addEventListener("click", () => {
  pushHistory();
  currentChar().appearance.accessories = [];
  saveStateToStorage();
  renderAll();
  log("🧽 Accessories cleared");
});

/* -----------------------------
   NEEDS SLIDERS
-------------------------------- */
energySlider.addEventListener("input", () => {
  pushHistory();
  currentChar().needs.energy = clamp01to100(energySlider.value);
  saveStateToStorage();
  renderNeeds();
  renderGentlePrompt();
});

socialSlider.addEventListener("input", () => {
  pushHistory();
  currentChar().needs.social = clamp01to100(socialSlider.value);
  saveStateToStorage();
  renderNeeds();
  renderGentlePrompt();
});

focusSlider.addEventListener("input", () => {
  pushHistory();
  currentChar().needs.focus = clamp01to100(focusSlider.value);
  saveStateToStorage();
  renderNeeds();
  renderGentlePrompt();
});

/* -----------------------------
   TRAITS
-------------------------------- */
addTraitBtn.addEventListener("click", () => {
  const raw = traitInput.value.trim();
  if (!raw) return;

  const tr = raw.toLowerCase();
  const c = currentChar();

  pushHistory();
  if (!c.traits.includes(tr)) c.traits.push(tr);

  traitInput.value = "";
  saveStateToStorage();
  renderAll();
  log(`➕ Trait added: ${tr}`);
});

traitInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTraitBtn.click();
  }
});

traitSuggestButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tr = btn.dataset.trait;
    const c = currentChar();

    pushHistory();
    if (!c.traits.includes(tr)) c.traits.push(tr);

    saveStateToStorage();
    renderAll();
    log(`➕ Trait added: ${tr}`);
  });
});

/* -----------------------------
   DIARY
-------------------------------- */
saveDiaryBtn.addEventListener("click", () => {
  const txt = diaryText.value.trim();
  if (!txt) return;

  pushHistory();
  currentChar().diary.unshift({ ts: Date.now(), text: txt });

  diaryText.value = "";
  saveStateToStorage();
  renderAll();
  log("📌 Diary entry saved");
});

/* Export diary as TXT */
exportDiaryBtn.addEventListener("click", () => {
  const c = currentChar();
  const text = c.diary
    .map((e) => `${formatDate(e.ts)}\n${e.text}\n`)
    .join("\n---\n\n");

  downloadBlob(new Blob([text], { type: "text/plain" }), `${c.name}-diary.txt`);
  log("📝 Diary exported");
});

/* -----------------------------
   SENSORY + COMFORT NOTES
-------------------------------- */
function updateSensory() {
  pushHistory();
  const s = currentChar().sensory;
  s.noise = clamp01to100(noiseSlider.value);
  s.light = clamp01to100(lightSlider.value);
  s.touch = clamp01to100(touchSlider.value);
  saveStateToStorage();
  renderGentlePrompt();
}

noiseSlider.addEventListener("input", updateSensory);
lightSlider.addEventListener("input", updateSensory);
touchSlider.addEventListener("input", updateSensory);

comfortNotes.addEventListener("input", () => {
  pushHistory();
  currentChar().comfortNotes = comfortNotes.value;
  saveStateToStorage();
  renderGentlePrompt();
});

/* -----------------------------
   NEXT DAY / EVENTS
-------------------------------- */
nextDayBtn.addEventListener("click", () => {
  pushHistory();

  /* “Day tick”: apply traits then trigger an event */
  applyTraitsOnce();
  triggerRandomEvent();

  /* Small mood rule pass (post-event) */
  updateMoodFromNeeds();

  saveStateToStorage();
  renderAll();
  log("📅 Day advanced");
});

/* -----------------------------
   RANDOMIZE
-------------------------------- */
randomizeBtn.addEventListener("click", () => {
  pushHistory();
  const c = currentChar();

  /* Random helpers */
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randColor = () =>
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");

  c.appearance.hairStyle = pick(["short", "long", "bun", "pigtails"]);
  c.appearance.hairColor = randColor();
  c.appearance.eyeColor = randColor();
  c.appearance.outfitColor = randColor();

  c.mood = pick(["happy", "neutral", "sad", "focused"]);

  c.needs.energy = clamp01to100(Math.floor(Math.random() * 101));
  c.needs.social = clamp01to100(Math.floor(Math.random() * 101));
  c.needs.focus = clamp01to100(Math.floor(Math.random() * 101));

  c.appearance.accessories = [];
  const accPool = ["💗", "⭐", "✨", "🦋", "🎀", "🍓"];
  const accCount = Math.floor(Math.random() * 4); // 0..3
  for (let i = 0; i < accCount; i++)
    c.appearance.accessories.push(pick(accPool));

  saveStateToStorage();
  renderAll();
  log("🎲 Randomized character");
});

/* -----------------------------
   EXPORT / IMPORT JSON
-------------------------------- */
exportJsonBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, "pink-diary-studio-save.json");
  log("⬇ Save exported (JSON)");
});

importJsonBtn.addEventListener("click", () => {
  importFile.click();
});

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    /* Basic validation */
    if (
      !imported.characters ||
      !Array.isArray(imported.characters) ||
      imported.characters.length === 0
    ) {
      alert("Invalid save file (missing characters).");
      return;
    }

    pushHistory();
    state = imported;
    state.currentIndex = Math.max(
      0,
      Math.min(state.currentIndex ?? 0, state.characters.length - 1)
    );
    state.ui = state.ui || { activeTab: "customize", lowStimulus: false };

    saveStateToStorage();
    renderAll();
    log("⬆ Save imported (JSON)");
  } catch (e) {
    alert("Could not import this file. Is it valid JSON?");
    console.error(e);
  } finally {
    importFile.value = "";
  }
});

/* -----------------------------
   MOOD RULES (needs → mood)
-------------------------------- */
function updateMoodFromNeeds() {
  const c = currentChar();

  /* If user explicitly set mood, we still allow the sim engine to nudge it */
  if (c.needs.energy < 15) c.mood = "tired";
  else if (c.needs.social < 15) c.mood = "lonely";
  else if (c.needs.focus < 15) c.mood = "overstimulated";
  else if (c.needs.focus > 75 && c.needs.energy > 40) c.mood = "focused";
}

/* -----------------------------
   LIFE SIM LOOP (AUTONOMOUS DRAIN)
   - Runs lightly every 6 seconds
   - Keeps it “alive”
-------------------------------- */
setInterval(() => {
  const c = currentChar();
  if (!c) return;

  /* Drain needs gently */
  c.needs.energy = clamp01to100(c.needs.energy - 0.6);
  c.needs.social = clamp01to100(c.needs.social - 0.4);
  c.needs.focus = clamp01to100(c.needs.focus - 0.3);

  /* Mood inference */
  updateMoodFromNeeds();

  saveStateToStorage();
  renderNeeds();
  renderCharacterVisuals();
  renderGentlePrompt();
}, 6000);

/* -----------------------------
   INITIALIZE + HOTKEYS
-------------------------------- */
document.addEventListener("keydown", (e) => {
  /* Quick “Next Day” key: N */
  if (!e.ctrlKey && e.key.toLowerCase() === "n") {
    nextDayBtn.click();
  }
});

/* Wire undo/redo buttons */
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

/* Start with saved UI state */
renderAll();
log("💗 Loaded Pink Diary Studio");

/* Dev-friendly: expose state for inspection in DevTools */
window.__PINK_DIARY_STATE__ = state;
