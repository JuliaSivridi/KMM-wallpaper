// "Family file" panel. All four buttons work with one text field:
//   Download — save the text to a file; Copy — to the clipboard; Paste — from the clipboard into the field; Open — from a file into the field.
// "Done" applies the text from the field as a new family. If download or the clipboard fail,
// there is a fallback via Ctrl+C / Ctrl+V.
let _filePanel = null, _fileDesc = null;
function closeFilePanel() {
  if (!_filePanel) return;
  const inp = document.getElementById('fam-file'); if (inp) inp.onchange = null;
  _filePanel.remove(); _filePanel = null;
  SidePanel.closed(_fileDesc); _fileDesc = null;
}
function openFilePanel() {
  const desc = { cancel: closeFilePanel };
  SidePanel.open(desc);
  _fileDesc = desc;
  const root = _filePanel = document.createElement('div');
  root.id = 'file-panel'; root.className = 'side-panel';
  const original = JSON.stringify(window.FAMILY, null, 2);
  root.innerHTML = '<div class="sp-title">Family file</div>' +
    '<div class="sp-btns"><button class="dl">Download</button><button class="cp">Copy</button><button class="ps">Paste</button><button class="op">Open</button></div>' +
    '<textarea spellcheck="false"></textarea>' +
    '<div class="fp-msg"></div>' +
    '<div class="sp-ft"><button class="cancel">Cancel</button><button class="ok">Done</button></div>';
  document.body.appendChild(root);
  const ta = root.querySelector('textarea'), msg = root.querySelector('.fp-msg');
  ta.value = original;

  root.querySelector('.dl').onclick = () => {
    downloadFamily(ta.value);
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
  root.querySelector('.cancel').onclick = desc.cancel;
  root.querySelector('.ok').onclick = () => {
    if (ta.value.trim() === original.trim()) { closeFilePanel(); return; }
    try {
      const arr = parseFamilyFile(ta.value);
      closeFilePanel();
      applyFamily(arr);
    } catch (e) { msg.textContent = 'Could not read the text: ' + e.message; }
  };
  SidePanel.place(root);
}