// Layered sprites. Body template per age + layers: skin → hair → top → bottom → sleeves → shoes → hat.
// composeSprite(person, season) returns { idle, walkA, walkB, sit } — arrays of strings.
// Letters: H hair, S skin, E eyes, T top, D dress, L bottom (pants/skirt/shorts), B shoes, C/c hat.
// All sprites face right; to the left — mirrored at draw time.

const TPL = {
  // w×h, n = number of "leg" rows that change when walking, sitN = number of tail rows in the sitting pose,
  // keep = how many top rows remain when sitting, ins = the row duplicated/removed for height
  adult: { w: 8, h: 14, n: 3, sitN: 3, keep: 9, ins: 8 },
  kid:   { w: 6, h: 8,  n: 2, sitN: 1, keep: 5, ins: 4 },
  // "tall" kid: has its own full layer set (KID_TALL), drawn only at standard height
  kidTall: { w: 8, h: 12, n: 3, sitN: 3, keep: 8, ins: 7 },
};

function _pad(w, h, start, rows) {
  const o = Array(h).fill('.'.repeat(w));
  rows.forEach((r, i) => { o[start + i] = r.padEnd(w, '.'); });
  return o;
}
function _lay(T, start, rows, A, B, S) {
  const fix = (t, len) => Array.from({ length: len }, (_, i) => ((t || [])[i] || '').padEnd(T.w, '.'));
  return { r: _pad(T.w, T.h, start, rows), A: A && fix(A, T.n), B: B && fix(B, T.n), S: fix(S, T.sitN) };
}
const _sub = (rows, ch) => rows.map(r => r.replace(/X/g, ch));

/* ---------- adult layers ---------- */
const ADULT = {
  skin: () => _lay(TPL.adult, 2, [
    '....SSSS', '....SSSS', '....SSES', '....SSSS', '.....SS.', '........', '........', '........', '...S...S', '........', '...S..S.'],
    ['........', '..S...S.', '........'], ['........', '....SS..', '........'], ['...S....', '.......S']),
  hair: {
    short: ['........', '.....HH.', '....HHHH', '...HH...', '...H....'],
    curly: ['..HHHH..', '.HHHHHHH', '.HHHHHHH', '.HHHH...', '.HHH....', '..HH....'],
    long: ['...HHHH.', '..HHHHHH', '..HHHHHH', '..HHH...', '..HH....', '..HH....', '..HH....', '..HH....', '..HH....'],
    ponytail: ['..HHH...', '.HHHHHH.', 'HH.HHHHH', 'HH.HH...', 'HH.H....', 'HH......', '.H......'],
    bob: ['...HHHH.', '..HHHHHH', '..HHHHHH', '..HHH...', '..HH....', '..HH....'],
    bun: ['...HHH..', '...HHHH.', '....HHHH', '...HH...', '...H....'],
    mohawk: ['...H.H.H', '...HHHHH'],
  },
  top: ch => _lay(TPL.adult, 7, _sub(['....XXX.', '...XXXXX', '...XXXXX', '....XXX.'], ch)),
  sleeves: () => _lay(TPL.adult, 9, ['...S...S']),
  dress: () => _lay(TPL.adult, 11, ['..DDDDDD'], ['..DDDDD.'], ['...DDDDD'], ['....DDDD', '......D.']),
  bottom: kind => {
    const T = TPL.adult;
    if (kind === 'skirt') return _lay(T, 11, ['..LLLLLL'], ['..LLLLL.'], ['...LLLLL'], ['....LLLL', '......LL']);
    if (kind === 'shorts') return _lay(T, 11, ['...LLLL.'], ['...LLLL.'], ['...LLLL.'], ['....LLLL', '......LL']);
    return _lay(T, 11, ['...LLLL.', '...L..L.'], ['...LLLL.', '..L...L.'], ['...LLLL.', '....LL..'], ['....LLLL', '......LL']);
  },
  shoes: () => _lay(TPL.adult, 13, ['...B..B.'], ['........', '........', '..B...B.'], ['........', '........', '....BB..'], ['', '', '.......B']),
  hat: {
    // bald — the drawing for a hairless head: same as with hair, but at the back the hat sticks out 1 px instead of 2 (the Finnish hat has no separate drawing)
    finnish: { clip: 99, rows: ['...C...C', '...CCCCC', '...ccccc', '...C....', '...C....'] },
    plain: { clip: 3, rows: ['...CCCC.', '..CCCCCC', '..CCC...'],
      bald: { clip: 0, rows: ['...CCCC.', '...CCCCC', '...CC...'] } },
    pompom: { clip: 3, rows: ['...CwwC.', '..CCCCCC', '..CCC...'],
      bald: { clip: 0, rows: ['...CwwC.', '...CCCCC', '...CC...'] } },
  },
};

/* ---------- child layers ---------- */
const KID = {
  skin: () => _lay(TPL.kid, 1, ['..SSS.', '..SES.', '..SSS.', '......', '.S..S.'], null, null, ['.S....']),
  hair: {
    short: ['.HHH..', 'HHHH..', 'HH....', '.H....'],
    curly: ['.HHHH.', 'HHHH..', 'HHH...', 'HH....'],
    long: ['.HHH..', 'HHHH..', 'HH....', 'HH....', 'H.....'],
    ponytail: ['.HHH..', 'HHHH..', 'HH....', 'H.....', 'H.....'],
    bob: ['.HHH..', 'HHHH..', 'HH....', 'HH....'],
    bun: ['..HH..', '.HHH..', 'HH....', '.H....'],
    mohawk: ['..H.H.', '..HHH.'],
  },
  top: ch => _lay(TPL.kid, 4, _sub(['..XX..', '..XX..'], ch), null, null, _sub(['..XX..'], ch)),
  sleeves: () => _lay(TPL.kid, 5, ['.S..S.']),
  dress: () => _lay(TPL.kid, 6, ['.DDDD.'], ['.DDDD.'], ['.DDDD.'], ['..DDDD']),
  bottom: kind => {
    const T = TPL.kid;
    if (kind === 'skirt') return _lay(T, 6, ['.LLLL.'], ['.LLLL.'], ['.LLLL.'], ['..LLLL']);
    return _lay(T, 6, ['..LL..'], ['.L..L.', ''], ['..LL..', ''], ['....LL']);
  },
  shoes: () => _lay(TPL.kid, 7, ['..B.B.'], ['', '.B..B.'], ['', '..BB..'], ['']),
  hat: {
    plain: { clip: 2, rows: ['.CCC..', 'CCCCC.', '..C...', '..C...'], bald: { clip: 0, rows: ['.CCC..', '.CCCC.', '..C...', '..C...'] } },
    pompom: { clip: 2, rows: ['.CwC..', 'CCCCC.', '..C...', '..C...'], bald: { clip: 0, rows: ['.CwC..', '.CCCC.', '..C...', '..C...'] } },
    finnish: { clip: 2, rows: ['C...C.', 'CCCCC.', '..c...', '..c...'] },
  },
};

/* ---------- "tall" kid layers (8×12): head like an adult, torso two rows shorter than an adult ---------- */
const KID_TALL = {
  skin: () => _lay(TPL.kidTall, 2, [
    '....SSSS', '....SSSS', '....SSES', '....SSSS', '.....SS.', '........', '...S...S', '........', '...S..S.'],
    ['........', '..S...S.', '........'], ['........', '....SS..', '........'], ['', '...S....', '.......S']),
  hair: {
    short: ['........', '.....HH.', '....HHHH', '...HH...', '...H....'],
    curly: ['..HHHH..', '.HHHHHHH', '.HHHHHHH', '.HHHH...', '.HHH....', '..HH....'],
    long: ['...HHHH.', '..HHHHHH', '..HHHHHH', '..HHH...', '..HH....', '..HH....', '..HH....', '..HH....'],
    ponytail: ['..HHH...', '.HHHHHH.', 'HH.HHHHH', 'HH.HH...', 'HH.H....', 'HH......', '.H......'],
    bob: ['...HHHH.', '..HHHHHH', '..HHHHHH', '..HHH...', '..HH....', '..HH....'],
    bun: ['...HHH..', '...HHHH.', '....HHHH', '...HH...', '...H....'],
    mohawk: ['...H.H.H', '...HHHHH'],
  },
  // sitting: the collar (row 7) stays, then a wide shoulder/arm row, hips and shin with the boot
  top: ch => _lay(TPL.kidTall, 7, _sub(['....XXX.', '....XXX.'], ch), null, null, _sub(['...XXXXX'], ch)),
  sleeves: () => _lay(TPL.kidTall, 8, ['...S...S'], null, null, ['...S...S']),
  dress: () => _lay(TPL.kidTall, 9, ['..DDDDDD'], ['..DDDDD.'], ['...DDDDD'], ['', '....DDDD', '......D.']),
  bottom: kind => {
    const T = TPL.kidTall, S = ['', '....LLLL', '......LL'];
    if (kind === 'skirt') return _lay(T, 9, ['..LLLLLL'], ['..LLLLL.'], ['...LLLLL'], S);
    if (kind === 'shorts') return _lay(T, 9, ['...LLLL.'], ['...LLLL.'], ['...LLLL.'], S);
    return _lay(T, 9, ['...LLLL.', '...L..L.'], ['...LLLL.', '..L...L.'], ['...LLLL.', '....LL..'], S);
  },
  shoes: () => _lay(TPL.kidTall, 11, ['...B..B.'], ['........', '........', '..B...B.'], ['........', '........', '....BB..'], ['', '', '.......B']),
  hat: {
    finnish: { clip: 99, rows: ['...C...C', '...CCCCC', '...ccccc', '...C....', '...C....'] },
    plain: { clip: 3, rows: ['...CCCC.', '..CCCCCC', '..CCC...'],
      bald: { clip: 0, rows: ['...CCCC.', '...CCCCC', '...CC...'] } },
    pompom: { clip: 3, rows: ['...CwwC.', '..CCCCCC', '..CCC...'],
      bald: { clip: 0, rows: ['...CwwC.', '...CCCCC', '...CC...'] } },
  },
};

const SETS = { adult: ADULT, kid: KID, kidTall: KID_TALL };
const AGE_SET = { adult: 'adult', child: 'kid' };

function _frameRows(T, l, f) {
  if (f === 'sit') return l.r.slice(0, T.keep).concat(l.S);
  if (f === 'idle') return l.r;
  return l.r.slice(0, T.h - T.n).concat(l[f] || l.r.slice(T.h - T.n));
}
function _over(base, rows) {
  return base.map((b, i) => { let s = ''; for (let k = 0; k < b.length; k++) { const c = rows[i][k]; s += c !== '.' ? c : b[k]; } return s; });
}

function composeSprite(p, season) {
  let key = AGE_SET[p.age] || 'adult', dh = Math.max(-1, Math.min(1, +p.height || 0));   // character height: only −1, 0, +1 — one torso row
  if (key === 'kid' && dh > 0) { key = 'kidTall'; dh = 0; }   // kid +1 — a separate taller sprite, without the height adjustment
  const T = TPL[key], S = SETS[key];
  const hatKey = (season === 'winter' && p.hat && p.hat !== 'none') ? (S.hat[p.hat] ? p.hat : Object.keys(S.hat)[0]) : null;
  const hairRows = S.hair[p.hairstyle];
  let hat = hatKey ? S.hat[hatKey] : null;
  if (hat && !hairRows && hat.bald) hat = hat.bald;   // no hair — a shorter hat
  const layers = [S.skin()];
  if (hairRows) {
    const hl = _lay(T, 0, hairRows);
    if (hat) for (let i = 0; i < Math.min(hat.clip, T.h); i++) hl.r[i] = '.'.repeat(T.w);
    layers.push(hl);
  }
  if (p.outfit === 'dress') layers.push(S.top('D'), S.dress());
  else layers.push(S.top('T'), S.bottom(p.bottomKind || 'pants'));
  if (p.sleeves === 'short') layers.push(S.sleeves());
  layers.push(S.shoes());
  if (hat) layers.push(_lay(T, 0, hat.rows));
  const adj = rows => {
    rows = rows.slice();
    if (dh > 0) for (let i = 0; i < dh; i++) rows.splice(T.ins, 0, rows[T.ins]);
    if (dh < 0) rows.splice(T.ins, -dh);
    return rows;
  };
  const out = {};
  for (const f of ['idle', 'walkA', 'walkB', 'sit']) {
    const key = f === 'walkA' ? 'A' : f === 'walkB' ? 'B' : f;
    let base = Array(f === 'sit' ? T.keep + T.sitN : T.h).fill('.'.repeat(T.w));
    for (const l of layers) base = _over(base, _frameRows(T, l, key));
    out[f] = adj(base);
  }
  return out;
}

// Palette for the layer letters.
function layerPalette(p) {
  p = { hatColor: '#1c1c22', skin: '#f0c4a0', hair: '#7b3f1e', topColor: '#1f2d5a', dressColor: '#1f2d5a', bottomColor: '#4a4d55', shoes: '#1c1c22', ...p };
  const mix = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), c = i => Math.round(((A >> i) & 255) * (1 - t) + ((B >> i) & 255) * t).toString(16).padStart(2, '0'); return '#' + c(16) + c(8) + c(0); };
  return { H: p.hair, S: p.skin, E: '#1a1a1a', T: p.topColor, D: p.dressColor, L: p.bottomColor, B: p.shoes, C: p.hatColor, c: mix(p.hatColor, '#000000', 0.25), w: mix(p.hatColor, '#ffffff', 0.65) };
}