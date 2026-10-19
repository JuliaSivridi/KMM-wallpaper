// "Game settings" panel (💾 in the coordinate row of the scene panel): everything chosen on the scene panels, as one text (see js/gsettings.js).
// Download — save the text to a file; Copy — to the clipboard; Paste — from the clipboard into the field; Open — from a file into the field.
// "Done" applies the text from the field; "Cancel" closes the panel without changes. Opens to the right of the scene panel.
let _gamePanel = null, _gameDesc = null;
function closeGamePanel() {
  if (!_gamePanel) return;
  const inp = document.getElementById('fam-file'); if (inp) inp.onchange = null;
  _gamePanel.remove(); _gamePanel = null;
  SidePanel.closed(_gameDesc); _gameDesc = null;
}
function downloadText(text, name) {
  const blob = new Blob([text], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function openGamePanel() {
  const desc = { cancel: closeGamePanel };
  SidePanel.open(desc, 'ui'); _gameDesc = desc;
  const root = _gamePanel = document.createElement('div');
  root.id = 'game-panel'; root.className = 'side-panel';
  const original = JSON.stringify(collectGameSettings(), null, 2);
  root.innerHTML = '<div class="sp-title">Game settings</div>' +
    '<div class="sp-btns"><button class="dl">Download</button><button class="cp">Copy</button><button class="ps">Paste</button><button class="op">Open</button></div>' +
    '<textarea spellcheck="false"></textarea><div class="fp-msg"></div>' +
    '<div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div>';
  document.body.appendChild(root);
  const ta = root.querySelector('textarea'), msg = root.querySelector('.fp-msg');
  ta.value = original;
  root.querySelector('.dl').onclick = () => {
    downloadText(ta.value, 'settings.json');
    msg.textContent = 'If the file didn\'t appear in downloads, press "Copy" and paste the text into Notepad.';
  };
  root.querySelector('.cp').onclick = () => {
    ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    if (ok) msg.textContent = 'Copied.';
    else if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(() => { msg.textContent = 'Copied.'; }, () => { msg.textContent = 'Failed: text is selected, press Ctrl+C.'; });
    else msg.textContent = 'Failed: text is selected, press Ctrl+C.';
  };
  root.querySelector('.ps').onclick = () => {
    const fallback = () => { ta.focus(); ta.select(); msg.textContent = 'Press Ctrl+V: the text in the field is selected and will be replaced.'; };
    if (!navigator.clipboard || !navigator.clipboard.readText) return fallback();
    navigator.clipboard.readText().then(t => { ta.value = t; msg.textContent = 'Pasted. Press "Done" to apply.'; }, fallback);
  };
  root.querySelector('.op').onclick = () => {
    const inp = document.getElementById('fam-file');
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { ta.value = String(rd.result); msg.textContent = 'File read. Press "Done" to apply.'; };
      rd.readAsText(f); inp.value = '';
    };
    inp.click();
  };
  root.querySelector('.cancel').onclick = closeGamePanel;
  root.querySelector('.ok').onclick = () => {
    if (ta.value.trim() === original.trim()) { closeGamePanel(); return; }
    try {
      const skipped = applyGameSettings(JSON.parse(ta.value));
      if (skipped.length) console.warn('unknown entries skipped in settings:', skipped);
      closeGamePanel();
    } catch (e) { msg.textContent = 'Failed to apply: ' + e.message; }
  };
  const r = document.getElementById('ui').getBoundingClientRect();
  root.style.left = (r.right + 8) + 'px'; root.style.top = r.top + 'px';
  root.style.maxHeight = Math.max(200, innerHeight - r.top - 16) + 'px';
}
document.getElementById('game-file').addEventListener('click', () => openGamePanel());