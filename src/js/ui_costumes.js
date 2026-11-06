// "Costume" dialog (🎭 in the family list; the button exists only while a holiday is on): for each running holiday a row of buttons per slot (head, body).
// Like the other side panels: edits apply on "Done", "Cancel" closes without changes. The choice is stored in person.costumes (and so in the family file).
let _cosPanel = null, _cosDesc = null;
function closeCostumeDialog() {
  if (!_cosPanel) return;
  _cosPanel.remove(); _cosPanel = null;
  SidePanel.closed(_cosDesc); _cosDesc = null;
}
function openCostumeDialog(person) {
  const E = env(), hols = activeHolidays(E);
  if (!hols.length) return;
  const work = JSON.parse(JSON.stringify(person)), sel = {};   // sel[h] = { head, body } — what is chosen for the running holidays
  for (const h of hols) sel[h] = Object.assign({}, costumeSel(person, h));
  const refresh = () => { work.costumes = sel; renderCostumeFrames(frames, work, season, activeCostume(work, E), 10); };
  const season = E.season === 'winter' ? 'winter' : 'summer';
  const desc = { cancel: closeCostumeDialog };
  SidePanel.open(desc); _cosDesc = desc;
  const root = _cosPanel = document.createElement('div');
  root.id = 'costume-panel'; root.className = 'side-panel';
  root.innerHTML = '<div class="sp-title">Costume</div><div class="cp-body"><div class="cp-ctl"></div><div class="cp-side"><div class="frames"></div>' +
    '<div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div></div></div>';
  document.body.appendChild(root);
  const ctl = root.querySelector('.cp-ctl'), frames = root.querySelector('.frames');
  for (const h of hols) {
    const H = HOLIDAYS.find(x => x.id === h), grp = document.createElement('div'); grp.className = 'cp-grp';
    const head = document.createElement('div'); head.className = 'sp-title'; head.textContent = H.icon + ' ' + H.name; grp.appendChild(head);
    for (const [slot, slotName] of COSTUME_SLOTS) {
      const list = COSTUMES.filter(x => x.holiday === h && x.slot === slot);
      if (!list.length) continue;
      const lbl = document.createElement('div'); lbl.className = 'cp-slot'; lbl.textContent = slotName; grp.appendChild(lbl);
      const box = document.createElement('div'); box.className = 'act-btns'; const btns = [];
      for (const c of [null].concat(list)) {
        const b = document.createElement('button'); b.textContent = c ? c.icon + ' ' + c.name : '— none';
        b.onclick = () => { if (c) sel[h][slot] = c.id; else delete sel[h][slot]; btns.forEach(x => x[0].classList.toggle('on', x[1] === (sel[h][slot] || null))); refresh(); };
        b.classList.toggle('on', (c ? c.id : null) === (sel[h][slot] || null));
        btns.push([b, c ? c.id : null]); box.appendChild(b);
      }
      grp.appendChild(box);
    }
    ctl.appendChild(grp);
  }
  refresh();
  root.querySelector('.cancel').onclick = closeCostumeDialog;
  root.querySelector('.ok').onclick = () => {
    const all = {};   // the running holidays from the dialog, the others as they were
    for (const H of HOLIDAYS) {
      const s = H.id in sel ? sel[H.id] : costumeSel(person, H.id), key = costumeKeyOf(H.id, s);
      if (key) { const [hd, bd] = key.split('|'), o = {}; if (hd) o.head = hd; if (bd) o.body = bd; all[H.id] = o; }
    }
    if (Object.keys(all).length) person.costumes = all; else delete person.costumes;
    saveToStorage(); renderFamilyList(); closeCostumeDialog();
  };
  SidePanel.place(root);
}
// The list shows the 🎭 buttons and costume previews only while a holiday is on: redraw it when a holiday starts, ends or is switched in ⚙.
let _cosKey = null;
setInterval(() => {
  try { const k = activeHolidays(env()).join(); if (_cosKey !== null && k !== _cosKey) renderFamilyList(); _cosKey = k; } catch (e) {}
}, 1000);
