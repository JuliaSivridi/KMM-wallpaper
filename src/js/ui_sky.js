// "Sky and nature" panel (⚙ at the right edge of the weather row of the scene panel): button pressed — it exists, released — it doesn't.
// Puddles, rainbow, northern lights, shooting stars and under them every meteor shower (js/stars.js). The showers are muted while shooting stars are off.
// Opens to the right of the scene panel. Changes are applied on "Done"; "Cancel" closes the panel without changes.
let _skyPanel = null, _skyDesc = null;
function closeSkyPanel() {
  if (!_skyPanel) return;
  _skyPanel.remove(); _skyPanel = null;
  SidePanel.closed(_skyDesc); _skyDesc = null;
}
function openSkyPanel() {
  const draft = Object.assign({}, SKY_OFF);
  const desc = { cancel: closeSkyPanel };
  SidePanel.open(desc, 'ui'); _skyDesc = desc;
  const root = _skyPanel = document.createElement('div');
  root.id = 'sky-panel'; root.className = 'side-panel';
  root.innerHTML = '<div class="sp-title">Sky and nature</div><div class="act-btns nat"></div>' +
    '<div class="sp-title sky-sub">Shooting stars</div><div class="act-btns mt"></div><div class="act-btns showers"></div>' +
    '<div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div>';
  const showers = [];
  const sync = () => showers.forEach(b => b.classList.toggle('muted', !!draft.meteors));
  const add = (box, d, label, isMain) => {
    const b = document.createElement('button');
    b.textContent = label; b.title = d.when ? 'Maximum: ' + d.when : d.hint;
    b.classList.toggle('on', !draft[d.id]);
    b.addEventListener('click', () => { if (draft[d.id]) delete draft[d.id]; else draft[d.id] = true; b.classList.toggle('on', !draft[d.id]); if (isMain) sync(); });
    box.appendChild(b); return b;
  };
  for (const d of SKY_NATURE) add(root.querySelector('.nat'), d, d.icon + ' ' + d.name);
  add(root.querySelector('.mt'), METEOR_MAIN, METEOR_MAIN.icon + ' ' + METEOR_MAIN.name, true);
  for (const d of METEOR_SHOWERS) showers.push(add(root.querySelector('.showers'), d, d.icon + ' ' + d.name));
  sync();
  document.body.appendChild(root);
  root.querySelector('.cancel').onclick = closeSkyPanel;
  root.querySelector('.ok').onclick = () => { SKY_OFF = draft; saveSkyOff(); closeSkyPanel(); };
  const r = document.getElementById('ui').getBoundingClientRect();
  root.style.left = (r.right + 8) + 'px'; root.style.top = r.top + 'px';
  root.style.maxHeight = Math.max(200, innerHeight - r.top - 16) + 'px';
}
document.getElementById('sky-gear').addEventListener('click', () => openSkyPanel());
