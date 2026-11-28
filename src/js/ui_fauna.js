// "Animals" and "Birds" panels (⚙ next to the 🐿️ and 🐦 icons of the scene panel): a list, every species on its own row, and on the right four aligned buttons —
// off / rare / normal / often (❌ 🚶 🏃 🚴): one click to the needed level. The levels are in the event registry (js/events.js).
// Opens to the right of the scene panel. Changes are applied on "Done"; "Cancel" closes the panel without changes.
let _faunaPanel = null, _faunaDesc = null, _faunaOff = null;
function closeFaunaPanel() {
  if (!_faunaPanel) return;
  if (_faunaOff) { _faunaOff(); _faunaOff = null; }
  _faunaPanel.remove(); _faunaPanel = null;
  SidePanel.closed(_faunaDesc); _faunaDesc = null;
}
function openFaunaPanel(list, title) {
  const draft = {}, evUpd = [];
  for (const d of list) draft[d.id] = evLevel(d.id);
  const desc = { cancel: closeFaunaPanel };
  SidePanel.open(desc, 'ui'); _faunaDesc = desc;
  const root = _faunaPanel = document.createElement('div');
  root.id = 'fauna-panel'; root.className = 'side-panel';
  root.innerHTML = '<div class="sp-title"></div><div class="sp-title lv-legend"></div><div class="lv-list"></div><div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div>';
  root.querySelector('.sp-title').textContent = title;
  root.querySelector('.lv-legend').textContent = EV_LEVELS.map(l => l[1] + ' ' + l[2].toLowerCase()).join('  ·  ');
  const box = root.querySelector('.lv-list');
  for (const d of list) {
    const row = document.createElement('div'); row.className = 'lv-row';
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = d.icon + ' ' + d.name; const ev = document.createElement('small'); ev.className = 'ev'; nm.appendChild(ev); const showEv = () => { ev.textContent = evEveryText(d.id, draft[d.id], env()); }; evUpd.push(showEv); showEv(); row.appendChild(nm);
    const btns = document.createElement('div'); btns.className = 'lv-btns';
    for (const [lv, icon, label] of EV_LEVELS) {
      const b = document.createElement('button'); b.textContent = icon; b.title = label;
      b.classList.toggle('on', draft[d.id] === lv);
      b.addEventListener('click', () => { draft[d.id] = lv; showEv(); btns.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
      btns.appendChild(b);
    }
    row.appendChild(btns); box.appendChild(row);
  }
  document.body.appendChild(root);
  const refresh = () => evUpd.forEach(q => q()), scene = document.getElementById('ui');   // a click on the scene panel (season...) may change the intervals
  scene.addEventListener('click', refresh); _faunaOff = () => scene.removeEventListener('click', refresh);
  root.querySelector('.cancel').onclick = closeFaunaPanel;
  root.querySelector('.ok').onclick = () => { setEvLevels(draft); purgeFauna(); closeFaunaPanel(); };
  const top = document.getElementById('ui'), r = top.getBoundingClientRect();
  root.style.left = (r.right + 8) + 'px'; root.style.top = r.top + 'px';
  root.style.maxHeight = Math.max(200, innerHeight - r.top - 16) + 'px';
}
document.getElementById('fauna-animals').addEventListener('click', () => openFaunaPanel(FAUNA.animals, 'Animals'));
document.getElementById('fauna-birds').addEventListener('click', () => openFaunaPanel(FAUNA.birds, 'Birds'));
