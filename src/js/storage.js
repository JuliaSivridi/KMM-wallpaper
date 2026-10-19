// Family saving. localStorage is a fast mirror, the file is the source of truth.
// The file is a JSON array of people (forest-family.json).

const STORAGE_KEY = 'forest.family.v1';

// The family is empty at the start. On launch main.js loads it from the browser; after that — from a file or by hand.
window.FAMILY = [];
window.FAMILY_BY_ID = {};

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.FAMILY));
  } catch (e) {
    console.warn('localStorage unavailable:', e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : null;
  } catch (e) {
    return null;
  }
}

// Apply a family array: update window.FAMILY, rebuild the indexes and FOLK.
function applyFamily(arr) {
  if (typeof closeEditor === 'function') closeEditor();   // the panels held a reference to the old character
  if (typeof closeLookDialog === 'function') closeLookDialog();
  window.FAMILY = snapFamily(arr);
  window.FAMILY_BY_ID = {};
  for (const p of window.FAMILY) window.FAMILY_BY_ID[p.id] = p;
  rebuildFolk();
  saveToStorage();
  renderFamilyList();
}

// Download the family as forest-family.json
function downloadFamily(text) {
  const body = text || JSON.stringify(window.FAMILY, null, 2);
  const blob = new Blob([body], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'forest-family.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Parse the text of a family file: a JSON array of people.
function parseFamilyFile(text) {
  const arr = JSON.parse(text.trim());
  if (!Array.isArray(arr)) throw new Error('expected a list of people [ ... ]');
  return arr;
}