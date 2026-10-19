// "Palette" dialog: look builder for a new and existing character.
function newPersonTemplate() {
  const S = window.SWATCH;   // starting look the same as in the showcase: first colors of the palettes
  return { id: 'p' + Date.now().toString(36), name: 'New', age: 'adult', height: 0, skin: S.skin[0], hair: S.hair[0], hairstyle: 'short',
    outfit: 'top-bottom', dressColor: S.cloth[0], topColor: S.cloth[0], bottomColor: S.cloth[0], bottomKind: 'pants', sleeves: 'long',
    shoes: S.shoes[0], hat: 'plain', hatColor: S.cloth[0], wakeAt: 8, sleepAt: 22, temper: 'calm', follows: null };
}
function addPerson(p) {
  p.actions = personActions(p);
  window.FAMILY.push(p); window.FAMILY_BY_ID[p.id] = p;
  const a = agent(p, SPEED_BY_AGE[p.age] || 11); FOLK.push(a); BY_ID[a.id] = a;
  placeAgent(a, env());
  saveToStorage(); renderFamilyList();
}
function removePerson(p) {
  window.FAMILY = window.FAMILY.filter(x => x !== p);
  for (const x of window.FAMILY) if (x.follows === p.id) x.follows = null;
  window.FAMILY_BY_ID = {}; for (const x of window.FAMILY) window.FAMILY_BY_ID[x.id] = x;
  const i = FOLK.findIndex(a => a.person === p); if (i >= 0) FOLK.splice(i, 1);
  BY_ID = {}; for (const a of FOLK) BY_ID[a.id] = a;
  saveToStorage(); renderFamilyList();
}
let _lookPanel = null, _lookDesc = null;
function closeLookDialog() {
  if (!_lookPanel) return;
  _lookPanel.remove(); _lookPanel = null;
  document.removeEventListener('keydown', _lookEsc);
  SidePanel.closed(_lookDesc); _lookDesc = null;
}
function _lookEsc(e) { if (e.key === 'Escape' && _lookDesc) _lookDesc.cancel(); }
function openLookDialog(person, isNew) {
  const work = JSON.parse(JSON.stringify(person));   // edits go to a copy and are applied only on "Done"
  let season = env().season === 'winter' ? 'winter' : 'summer';
  const desc = { cancel: closeLookDialog };
  SidePanel.open(desc);                 // will close the open "Settings" as "Cancel"
  const root = _lookPanel = document.createElement('div'); _lookDesc = desc;
  root.id = 'look-panel'; root.className = 'side-panel';
  root.innerHTML = '<div class="sp-title">' + (isNew ? 'New character' : 'Palette') + '</div>' +
    '<div class="lp-body"><div class="ctl"></div><div class="lp-side"><div class="seasons"><button data-s="summer" title="Summer">🌻</button><button data-s="winter" title="Winter">⛄</button></div><div class="frames"></div>' +
    '<div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div></div></div>';
  document.body.appendChild(root);
  const frames = root.querySelector('.frames'), ctl = root.querySelector('.ctl');
  const refresh = () => { renderLookFrames(frames, work, season, 10); root.querySelectorAll('.seasons button').forEach(b => b.classList.toggle('on', b.dataset.s === season)); };
  const changed = () => refresh();
  root.querySelectorAll('.seasons button').forEach(b => b.onclick = () => { season = b.dataset.s; refresh(); });
  buildLookControls(ctl, work, changed); refresh();
  root.querySelector('.cancel').onclick = desc.cancel;
  root.querySelector('.ok').onclick = () => {
    if (isNew) addPerson(work); else { Object.assign(person, work); saveToStorage(); renderFamilyList(); }
    closeLookDialog();
  };
  document.addEventListener('keydown', _lookEsc);
  SidePanel.place(root);
}