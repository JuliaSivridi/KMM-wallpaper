// "Holidays" panel (⚙ at the right edge of the season row): button pressed — the holiday decorations are there, released — they are not.
// Opens to the right of the scene panel. Changes are applied on "Done"; "Cancel" closes the panel without changes.
let _holPanel = null, _holDesc = null;
function closeHolidaysPanel() {
  if (!_holPanel) return;
  _holPanel.remove(); _holPanel = null;
  SidePanel.closed(_holDesc); _holDesc = null;
}
function openHolidaysPanel() {
  const draft = Object.assign({}, HOLIDAY_OFF);
  const desc = { cancel: closeHolidaysPanel };
  SidePanel.open(desc, 'ui'); _holDesc = desc;
  const root = _holPanel = document.createElement('div');
  root.id = 'holidays-panel'; root.className = 'side-panel';
  root.innerHTML = '<div class="sp-title">Holidays</div><div class="act-btns"></div><div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div>';
  const box = root.querySelector('.act-btns');
  for (const d of HOLIDAYS) {
    const b = document.createElement('button');
    b.textContent = d.icon + ' ' + d.name; b.title = d.when;
    b.classList.toggle('on', !draft[d.id]);
    b.addEventListener('click', () => { if (draft[d.id]) delete draft[d.id]; else draft[d.id] = true; b.classList.toggle('on', !draft[d.id]); });
    box.appendChild(b);
  }
  document.body.appendChild(root);
  root.querySelector('.cancel').onclick = closeHolidaysPanel;
  root.querySelector('.ok').onclick = () => { HOLIDAY_OFF = draft; saveHolidayOff(); closeHolidaysPanel(); };
  const r = document.getElementById('ui').getBoundingClientRect();
  root.style.left = (r.right + 8) + 'px'; root.style.top = r.top + 'px';
  root.style.maxHeight = Math.max(200, innerHeight - r.top - 16) + 'px';
}
document.getElementById('holidays-gear').addEventListener('click', () => openHolidaysPanel());