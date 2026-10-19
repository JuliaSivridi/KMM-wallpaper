// "In-game actions" panel (the ✋ button under the family list): what happens in the game at all. Pressed button — the action is available to everyone who can do it,
// released — nobody does it. Who from the family does what is decided in each person's settings. Edits accumulate in the panel and are applied on "Done";
// "Cancel" closes the panel without changes.
let _actPanel = null, _actDesc = null;
function closeActionsPanel() {
  if (!_actPanel) return;
  _actPanel.remove(); _actPanel = null;
  SidePanel.closed(_actDesc); _actDesc = null;
}
function openActionsPanel() {
  const draft = Object.assign({}, ACT_OFF);
  const desc = { cancel: closeActionsPanel };
  SidePanel.open(desc); _actDesc = desc;
  const root = _actPanel = document.createElement('div');
  root.id = 'actions-panel'; root.className = 'side-panel';
  root.innerHTML = '<div class="sp-title">In-game actions</div><div class="act-body"></div>' +
    '<div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div>';
  document.body.appendChild(root);
  const body = root.querySelector('.act-body');
  for (const [grpId, title] of ACT_GROUPS) {
    const list = ACTIONS.filter(d => actionGroup(d) === grpId);
    if (!list.length) continue;
    const grp = document.createElement('div'); grp.className = 'act-grp';
    const head = document.createElement('div'); head.className = 'sp-title'; head.textContent = title; grp.appendChild(head);
    const box = document.createElement('div'); box.className = 'act-btns';
    for (const d of list) {
      const b = document.createElement('button');
      b.textContent = d.icon + ' ' + d.name + (d.seasons.length ? '  ' + d.seasons.map(s => SEASON_ICON[s]).join('') : '');
      b.title = d.seasons.length ? 'When: ' + d.seasons.map(s => SEASON_ICON[s]).join(' ') : 'Any time of year';
      b.classList.toggle('on', !draft[d.id]);
      b.addEventListener('click', () => {
        if (draft[d.id]) delete draft[d.id]; else draft[d.id] = true;
        b.classList.toggle('on', !draft[d.id]);
      });
      box.appendChild(b);
    }
    grp.appendChild(box); body.appendChild(grp);
  }
  root.querySelector('.cancel').onclick = closeActionsPanel;
  root.querySelector('.ok').onclick = () => { ACT_OFF = draft; saveActionOff(); closeActionsPanel(); };
  SidePanel.place(root);
}
document.getElementById('fam-acts').addEventListener('click', () => openActionsPanel());