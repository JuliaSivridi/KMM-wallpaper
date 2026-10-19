// Family list panel: preview, name, ⚙ settings, 🎨 palette, 🗑 delete; at the bottom ➕ and 💾.
// Interface without dropdowns and system alert/confirm windows: buttons everywhere, so the panels look like part of the game.

const famListEl = document.getElementById('fam-list');
// The side panels ("Settings" and "Palette") open to the right of the family list, with matching tops.
// Only one is open at a time: opening a second closes the first as "Cancel". All panels: edits are applied only on "Done", "Cancel" closes without changes.
// While a panel is open, the panel it stands next to (the family list by default, the scene panel for animals and birds) doesn't fade.
const SidePanel = {
  cur: null,
  open(p, pin = 'ui-family') { if (this.cur) this.cur.cancel(); this.cur = p; document.getElementById(pin).classList.add('pinned'); },
  closed(p) { if (this.cur === p) { this.cur = null; for (const id of ['ui', 'ui-family']) document.getElementById(id).classList.remove('pinned'); } },
  place(el) {
    const r = document.getElementById('ui-family').getBoundingClientRect();
    el.style.left = (r.right + 8) + 'px'; el.style.top = r.top + 'px';
    el.style.maxHeight = Math.max(200, innerHeight - r.top - 16) + 'px';
  },
};

// Preview in the list: standing character (summer), at the bottom of a 16×16 square.
function renderPreview(person) {
  const rows = composeSprite(person, 'summer').idle, pal = layerPalette(person);
  const cv = document.createElement('canvas'); cv.className = 'preview'; cv.width = 16; cv.height = 16;
  const g = cv.getContext('2d'), w = rows[0].length, ox = Math.floor((16 - w) / 2), oy = 16 - rows.length - 1;
  rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = pal[c] || '#f0f'; g.fillRect(ox + i, oy + j, 1, 1); } });
  return cv;
}

// Redraws the whole list.
function renderFamilyList() {
  famListEl.innerHTML = '';
  if (!window.FAMILY.length) {
    const hint = document.createElement('div'); hint.className = 'fam-empty';
    hint.textContent = 'No family yet: ➕ create a person, 💾 load from a file.';
    famListEl.appendChild(hint);
  }
  for (const person of window.FAMILY) {
    const row = document.createElement('div');
    row.className = 'fam-row';

    row.appendChild(renderPreview(person));

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = person.name;
    row.appendChild(name);

    const gear = document.createElement('button');
    gear.textContent = '⚙';
    gear.title = 'Settings';
    gear.addEventListener('click', () => {
      window.openPersonEditor(person);
    });
    row.appendChild(gear);

    const pal = document.createElement('button');
    pal.textContent = '🎨'; pal.title = 'Palette';
    pal.addEventListener('click', () => openLookDialog(person, false));
    row.appendChild(pal);

    const del = document.createElement('button');
    del.textContent = '🗑'; del.title = 'Delete';
    // deletion in two clicks (no confirm window): the first click arms the button, the second deletes
    del.addEventListener('click', () => {
      if (del.dataset.arm) { removePerson(person); return; }
      del.dataset.arm = '1'; del.textContent = '❓'; del.title = 'Click again to delete'; del.style.borderColor = '#e06060';
      setTimeout(() => { if (del.isConnected) { delete del.dataset.arm; del.textContent = '🗑'; del.title = 'Delete'; del.style.borderColor = ''; } }, 3000);
    });
    row.appendChild(del);

    famListEl.appendChild(row);
  }
}

document.getElementById('fam-add').addEventListener('click', () => openLookDialog(newPersonTemplate(), true));
document.getElementById('fam-save').addEventListener('click', () => openFilePanel());

// The family list stands under the scene panel: that one's height depends on the number of rows.
function placeFamilyPanel() {
  const r = document.getElementById('ui').getBoundingClientRect();
  document.getElementById('ui-family').style.top = (r.bottom + 12) + 'px';
}
placeFamilyPanel(); addEventListener('resize', placeFamilyPanel);