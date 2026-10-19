// Character "Settings" panel: name, schedule, temperament, "next to", actions.
// Appearance (age, height, colors, hairstyle, clothes) — in the "Palette" panel (ui_palette.js).
// Edits accumulate in a draft and are applied only on "Done"; "Cancel" closes the panel without changes.

const edRoot   = document.getElementById('ui-editor');
const edName   = document.getElementById('ed-name');
const edWake   = document.getElementById('ed-wake');
const edWakeV  = document.getElementById('ed-wake-v');
const edSleep  = document.getElementById('ed-sleep');
const edSleepV = document.getElementById('ed-sleep-v');
const edTemper = document.getElementById('ed-temper');
const edFollows= document.getElementById('ed-follows');
const edDone   = document.getElementById('ed-done');
const edCancel = document.getElementById('ed-cancel');
const edActions= document.getElementById('ed-actions');

let editingPerson = null, draft = null;
const editorPanel = { cancel: () => closeEditor() };

const fmtH = h => {
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
};

function buildBtnRow(el, values, current, onPick, labels) {
  el.innerHTML = '';
  for (const v of values) {
    const b = document.createElement('button');
    b.textContent = labels[v] || v;
    b.dataset.v = v;
    if (v === current) b.classList.add('on');
    b.addEventListener('click', () => {
      el.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      onPick(v);
    });
    el.appendChild(b);
  }
}

// "Next to": a row of buttons (instead of a dropdown)
function buildFollows() {
  edFollows.innerHTML = '';
  const add = (id, label) => {
    const b = document.createElement('button');
    b.textContent = label; b.title = label;
    if ((draft.follows || null) === id) b.classList.add('on');
    b.addEventListener('click', () => {
      draft.follows = id;
      edFollows.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on');
    });
    edFollows.appendChild(b);
  };
  add(null, '—');
  for (const p of window.FAMILY) if (p.id !== draft.id) add(p.id, p.name);
}

// "Actions": what the character does in the game (by their age); pressed button — does it. The list is written to person.actions, i.e. to the family file.
function buildActions() {
  edActions.innerHTML = '';
  const cur = personActions(draft);
  for (const d of actionsFor(draft.age)) {
    const b = document.createElement('button');
    b.textContent = d.icon + ' ' + d.name;
    b.classList.toggle('on', cur[d.id]);
    if (!actionOnGlobal(d.id)) { b.classList.add('muted'); b.title = 'Disabled for everyone by the ✋ button'; }
    b.addEventListener('click', () => {
      const a = personActions(draft); a[d.id] = !a[d.id]; draft.actions = a;
      b.classList.toggle('on', a[d.id]);
    });
    edActions.appendChild(b);
  }
}

function openEditor(person) {
  SidePanel.open(editorPanel);          // will close the open panel as "Cancel"
  editingPerson = person;
  draft = JSON.parse(JSON.stringify(person));
  edName.value = draft.name;
  edWake.value = draft.wakeAt;
  edWakeV.textContent = fmtH(draft.wakeAt);
  edSleep.value = draft.sleepAt;
  edSleepV.textContent = fmtH(draft.sleepAt === 24 ? 0 : draft.sleepAt);
  buildBtnRow(edTemper, ['calm', 'fidget'], draft.temper, v => { draft.temper = v; }, {
    calm: 'Calm', fidget: 'Fidgety',
  });
  buildFollows();
  buildActions();
  edRoot.classList.add('open');
  SidePanel.place(edRoot);
}

function closeEditor() {
  edRoot.classList.remove('open');
  editingPerson = null; draft = null;
  SidePanel.closed(editorPanel);
  renderFamilyList();
}

edName.addEventListener('input', () => { if (draft) draft.name = edName.value; });
edWake.addEventListener('input', () => {
  if (!draft) return;
  draft.wakeAt = +edWake.value;
  edWakeV.textContent = fmtH(edWake.value);
});
edSleep.addEventListener('input', () => {
  if (!draft) return;
  const v = +edSleep.value;
  draft.sleepAt = v === 0 ? 24 : v;   // 00:00 = 24:00
  edSleepV.textContent = fmtH(v);
});
edDone.addEventListener('click', () => {
  if (editingPerson && draft) { Object.assign(editingPerson, draft); saveToStorage(); }
  closeEditor();
});
edCancel.addEventListener('click', closeEditor);

window.openPersonEditor = openEditor;