// Look builder: fields on the left, frames on the right. Shared by the showcase (sprite-lab.html) and the in-game dialog.
const LOOK_OPT = {
  age: [['child', 'Child'], ['adult', 'Adult']],
  hairstyle: [['long', 'long'], ['ponytail', 'ponytail'], ['bun', 'bun'], ['curly', 'curly'], ['bob', 'bob'], ['short', 'short'], ['mohawk', 'mohawk'], ['none', 'bald']],
  outfit: [['top-bottom', 'top + bottom'], ['dress', 'dress']],
  bottomKind: [['pants', 'pants'], ['shorts', 'shorts'], ['skirt', 'skirt']],
  sleeves: [['long', 'long'], ['short', 'short']],
  hat: [['none', 'none'], ['plain', 'hat'], ['finnish', 'Finnish'], ['pompom', 'pompom']],
};
const LOOK_LABEL = { age: 'Age', hairstyle: 'Hairstyle', outfit: 'Clothes', bottomKind: 'Bottom', sleeves: 'Sleeves', hat: 'Hat' };
const LOOK_COLORS = [['skin', 'Skin', 'skin'], ['hair', 'Hair', 'hair'], ['hatColor', 'Hat', 'cloth'], ['dressColor', 'Dress', 'cloth'], ['topColor', 'Top', 'cloth'], ['bottomColor', 'Bottom', 'cloth'], ['shoes', 'Shoes', 'shoes']];

function _lookRow(label) {
  const r = document.createElement('div'); r.className = 'look-row';
  const l = document.createElement('label'); l.textContent = label; r.appendChild(l); return r;
}
// Which sprite rows to show on the picture button (adult / child) and in which season to draw.
const LOOK_CROP = {
  age: { adult: [0, 14], kid: [0, 14], season: 'summer' },
  hairstyle: { adult: [0, 8], kid: [0, 5], season: 'summer' },
  hat: { adult: [0, 7], kid: [0, 5], season: 'winter' },
  outfit: { adult: [7, 14], kid: [4, 8], season: 'summer' },
  bottomKind: { adult: [10, 14], kid: [5, 8], season: 'summer' },
  sleeves: { adult: [7, 12], kid: [4, 6], season: 'summer' },
};
function _drawThumb(cv, rows, pal, scale, h) {
  const w = rows[0].length;
  cv.width = w; cv.height = h; cv.style.width = w * scale + 'px'; cv.style.height = h * scale + 'px'; cv.style.imageRendering = 'pixelated';
  const g = cv.getContext('2d'); g.clearRect(0, 0, w, h);
  const top = h - rows.length;
  rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = pal[c] || '#f0f'; g.fillRect(i, top + j, 1, 1); } });
}
// Pick variants with picture buttons (instead of dropdowns).
function buildLookControls(el, P, onChange) {
  el.innerHTML = '';
  const redo = () => buildLookControls(el, P, onChange), thumbs = [];
  const refreshThumbs = () => {
    const kid = P.age === 'child', pal = layerPalette(P);
    for (const t of thumbs) {
      const c = LOOK_CROP[t.key], [a, b] = kid && t.key !== 'age' ? c.kid : c.adult;
      const rows = composeSprite({ ...P, height: 0, [t.key]: t.v }, c.season).idle.slice(a, b);
      _drawThumb(t.cv, rows, pal, t.key === 'age' ? 2 : 3, t.key === 'age' ? 14 : b - a);
    }
  };
  const heightRow = () => {
    const hr = _lookRow('Height'), rg = document.createElement('input'), v = document.createElement('span');
    rg.type = 'range'; rg.min = -1; rg.max = 1; rg.step = 1; rg.value = P.height || 0; v.className = 'v';
    const show = () => { v.textContent = (P.height > 0 ? '+' : '') + (P.height || 0); }; show();
    rg.oninput = () => { P.height = +rg.value; show(); onChange(); };
    hr.append(rg, v); el.appendChild(hr);
  };
  for (const key of ['age', 'height', 'hairstyle', 'hat', 'outfit', 'bottomKind', 'sleeves']) {
    if (key === 'height') { heightRow(); continue; }
    if (key === 'bottomKind' && P.outfit === 'dress') continue;     // a dress has no separate bottom
    const r = _lookRow(LOOK_LABEL[key]), box = document.createElement('div'); box.className = 'look-ch' + (key === 'hairstyle' ? ' c4' : '');
    for (const [v, t] of LOOK_OPT[key]) {
      const b = document.createElement('button'), cv = document.createElement('canvas');
      b.title = t; b.appendChild(cv); thumbs.push({ cv, key, v });
      if ((P[key] || LOOK_OPT[key][0][0]) === v) b.className = 'on';
      b.onclick = () => {
        P[key] = v;
        if (key === 'outfit') { redo(); } else { box.querySelectorAll('button').forEach(x => x.className = ''); b.className = 'on'; refreshThumbs(); }
        onChange();
      };
      box.appendChild(b);
    }
    r.appendChild(box); el.appendChild(r);
  }
  for (const [k, t, set] of LOOK_COLORS) {
    if (P.outfit === 'dress' ? (k === 'topColor' || k === 'bottomColor') : k === 'dressColor') continue;
    const r = _lookRow(t), box = document.createElement('div'); box.className = 'look-sw';
    for (const c of window.SWATCH[set]) {
      const b = document.createElement('button'); b.style.background = c; b.title = c;
      if (String(P[k]).toLowerCase() === c) b.className = 'on';
      b.onclick = () => { P[k] = c; box.querySelectorAll('button').forEach(x => x.className = ''); b.className = 'on'; refreshThumbs(); onChange(); };
      box.appendChild(b);
    }
    r.appendChild(box); el.appendChild(r);
  }
  refreshThumbs();
}
function drawSpriteCanvas(rows, pal, scale, pad = 1, topPad = 0) {
  const w = rows[0].length, h = rows.length + topPad, cv = document.createElement('canvas');
  cv.width = w + pad * 2; cv.height = h + pad * 2;
  cv.className = 'look-cv'; cv.style.imageRendering = 'pixelated';   // no smoothing, otherwise pixels blur
  cv.style.width = cv.width * scale + 'px'; cv.style.height = cv.height * scale + 'px';
  const g = cv.getContext('2d');
  rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = pal[c] || '#f0f'; g.fillRect(pad + i, pad + topPad + j, 1, 1); } });
  return cv;
}
function renderLookFrames(el, P, season, scale = 12) {
  const spr = composeSprite(P, season), pal = layerPalette(P);
  const H = Math.max(...Object.values(spr).map(r => r.length));
  el.className = 'look-frames'; el.innerHTML = '';
  for (const [k, t] of [['idle', 'standing'], ['sit', 'sitting'], ['walkA', 'step 1'], ['walkB', 'step 2']]) {
    const f = document.createElement('figure'), c = document.createElement('figcaption'); c.textContent = t;
    f.append(drawSpriteCanvas(spr[k], pal, scale, 1, H - spr[k].length), c); el.appendChild(f);
  }
}