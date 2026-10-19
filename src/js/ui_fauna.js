// "Animals" and "Birds" panels (⚙ at the right edge of the scene panel's rows): button pressed — such wildlife appears, released — it doesn't.
// Open to the right of the scene panel. Changes are applied on "Done"; "Cancel" closes the panel without changes.
let _faunaPanel = null, _faunaDesc = null;
function closeFaunaPanel() {
  if (!_faunaPanel) return;
  _faunaPanel.remove(); _faunaPanel = null;
  SidePanel.closed(_faunaDesc); _faunaDesc = null;
}
function openFaunaPanel(list, title) {
  const draft = Object.assign({}, FAUNA_OFF);
  const desc = { cancel: closeFaunaPanel };
  SidePanel.open(desc, 'ui'); _faunaDesc = desc;
  const root = _faunaPanel = document.createElement('div');
  root.id = 'fauna-panel'; root.className = 'side-panel';
  root.innerHTML = '<div class="sp-title"></div><div class="act-btns"></div><div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div>';
  root.querySelector('.sp-title').textContent = title;
  const box = root.querySelector('.act-btns');
  for (const d of list) {
    const b = document.createElement('button');
    b.textContent = d.icon + ' ' + d.name;
    b.classList.toggle('on', !draft[d.id]);
    b.addEventListener('click', () => { if (draft[d.id]) delete draft[d.id]; else draft[d.id] = true; b.classList.toggle('on', !draft[d.id]); });
    box.appendChild(b);
  }
  document.body.appendChild(root);
  root.querySelector('.cancel').onclick = closeFaunaPanel;
  root.querySelector('.ok').onclick = () => { FAUNA_OFF = draft; saveFaunaOff(); purgeFauna(); closeFaunaPanel(); };
  const top = document.getElementById('ui'), r = top.getBoundingClientRect();
  root.style.left = (r.right + 8) + 'px'; root.style.top = r.top + 'px';
  root.style.maxHeight = Math.max(200, innerHeight - r.top - 16) + 'px';
}
document.getElementById('fauna-animals').addEventListener('click', () => openFaunaPanel(FAUNA.animals, 'Animals'));
document.getElementById('fauna-birds').addEventListener('click', () => openFaunaPanel(FAUNA.birds, 'Birds'));