// "Holidays" panel (⚙ at the right edge of the season row): a button per holiday and, under it and indented, a button per decoration (pumpkins, garlands, the tree...).
// Pressed — it is there, released — it is not. The button of the holiday switches everything off at once (the decorations keep their own state and come back with it);
// the costumes (🎭) do not depend on the decorations. The ghosts are a random event: instead of a switch they have four level buttons ❌ 🚶 🏃 🚴, like the animals.
// Opens to the right of the scene panel. Changes are applied on "Done"; "Cancel" closes the panel without changes.
let _holPanel = null, _holDesc = null, _holOff = null;
function closeHolidaysPanel() {
  if (!_holPanel) return;
  if (_holOff) { _holOff(); _holOff = null; }
  _holPanel.remove(); _holPanel = null;
  SidePanel.closed(_holDesc); _holDesc = null;
}
function openHolidaysPanel() {
  const draft = Object.assign({}, HOLIDAY_OFF), lv = {}, evUpd = [];   // draft — switches; lv — levels of the events (ghosts)
  for (const h of HOLIDAYS) for (const d of h.decor) if (d.event) lv[d.event] = evLevel(d.event);
  const desc = { cancel: closeHolidaysPanel };
  SidePanel.open(desc, 'ui'); _holDesc = desc;
  const root = _holPanel = document.createElement('div');
  root.id = 'holidays-panel'; root.className = 'side-panel';
  root.innerHTML = '<div class="sp-title">Holidays</div><div class="hol-list"></div><div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div>';
  const list = root.querySelector('.hol-list');
  for (const h of HOLIDAYS) {
    const grp = document.createElement('div'); grp.className = 'hol-grp';
    const top = document.createElement('div'); top.className = 'act-btns';
    const hb = document.createElement('button'); hb.textContent = h.icon + ' ' + h.name; hb.title = h.when; top.appendChild(hb); grp.appendChild(top);
    const sub = document.createElement('div'); sub.className = 'act-btns hol-sub'; grp.appendChild(sub);
    const sync = () => { hb.classList.toggle('on', !draft[h.id]); sub.classList.toggle('off', !!draft[h.id]); };
    hb.addEventListener('click', () => { if (draft[h.id]) delete draft[h.id]; else draft[h.id] = true; sync(); });
    for (const d of h.decor) {
      if (d.event) {   // levels
        const row = document.createElement('div'); row.className = 'lv-row';
        const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = d.icon + ' ' + d.name; const ev = document.createElement('small'); ev.className = 'ev'; nm.appendChild(ev); const showEv = () => { ev.textContent = evEveryText(d.event, lv[d.event], env()); }; evUpd.push(showEv); showEv(); row.appendChild(nm);
        const btns = document.createElement('div'); btns.className = 'lv-btns';
        for (const [l, icon, label] of EV_LEVELS) {
          const b = document.createElement('button'); b.textContent = icon; b.title = label; b.classList.toggle('on', lv[d.event] === l);
          b.addEventListener('click', () => { lv[d.event] = l; showEv(); btns.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
          btns.appendChild(b);
        }
        row.appendChild(btns); sub.appendChild(row);
      } else {
        const key = h.id + '.' + d.id, b = document.createElement('button');
        b.textContent = d.icon + ' ' + d.name; b.classList.toggle('on', !draft[key]);
        b.addEventListener('click', () => { if (draft[key]) delete draft[key]; else draft[key] = true; b.classList.toggle('on', !draft[key]); });
        sub.appendChild(b);
      }
    }
    sync(); list.appendChild(grp);
  }
  document.body.appendChild(root);
  const refresh = () => evUpd.forEach(q => q()), scene = document.getElementById('ui');
  scene.addEventListener('click', refresh); _holOff = () => scene.removeEventListener('click', refresh);
  root.querySelector('.cancel').onclick = closeHolidaysPanel;
  root.querySelector('.ok').onclick = () => { HOLIDAY_OFF = draft; saveHolidayOff(); setEvLevels(lv); closeHolidaysPanel(); };
  const r = document.getElementById('ui').getBoundingClientRect();
  root.style.left = (r.right + 8) + 'px'; root.style.top = r.top + 'px';
  root.style.maxHeight = Math.max(200, innerHeight - r.top - 16) + 'px';
}
document.getElementById('holidays-gear').addEventListener('click', () => openHolidaysPanel());
