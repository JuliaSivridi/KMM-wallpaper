// Holiday costumes. An optional extra layer over the character; the 🎨 palette and the look fields are not touched.
// A person keeps them in the optional field costumes: { "halloween": { "head": "witch", "body": "ghost" }, "newyear": { "head": "tonttu" } }
// (one entry per holiday, so the choice is not lost between holidays; a plain string is read as the head costume).
// A costume is visible only while its holiday is on (E.hal / E.ny, which already respect the ⚙ holidays panel); otherwise the person looks as usual.
// Two independent slots: 'head' (hats, ears, antlers) and 'body' (clothes over the figure, or a full costume instead of it).
// Every costume has its own letters and colours (pal). Letters H S E T D L B C c w belong to the person and must not be used.
// Letters of costumes that can be worn together (a head and a body of the same holiday) must not clash unless the colour is the same.
//
// HEAD  { ex, clip, rows }: ex — rows added above the head (the sprite grows upward), clip — how many top hair rows it hides,
//   rows — the picture: the first ex rows are above the head, the next ones cover the head from its top row. adult is also used for the tall child, kid for the small child.
// BODY  { rows, A, B, S } as in layers.js: rows — the whole figure from the top (adult 8×14, kid 6×8), A / B — the "leg" rows (last 3 for the adult, last 2 for the kid) in the walking frames,
//   S — the tail rows when sitting (3 for the adult, 1 for the kid). No A / B — the walking frames use the bottom rows of rows. '.' — keep what is under it, '-' — erase it.
//   full: true — the costume replaces the whole figure (skin, hair, clothes) and everything it needs, including the head, is drawn by it.
//   The tall child (8×12) takes tall; no tall — it is made from adult by removing torso rows 8 and 9.
const _8 = '........', _6 = '......';
const COSTUMES = [
  /* ---------- Halloween: head ---------- */
  { id: 'witch', holiday: 'halloween', slot: 'head', icon: '🧙', name: 'Witch hat', pal: { K: '#2b2236', P: '#6a3fa0', G: '#e6b93a' },
    adult: { ex: 4, clip: 3, rows: ['....K...', '....KK..', '...KKK..', '...PGP..', '...KKKK.', '.KKKKKKK', '..KKK...'] },
    kid:   { ex: 3, clip: 2, rows: ['..K...', '..KK..', '.KKK..', '.PGP..', 'KKKKK.', '..K...', '..K...'] } },
  { id: 'cat', holiday: 'halloween', slot: 'head', icon: '🐱', name: 'Cat ears', pal: { k: '#1c1c22' },
    adult: { ex: 0, clip: 0, rows: ['....k.k.', '....kkkk'] },
    kid:   { ex: 1, clip: 0, rows: ['..k.k.', '..kkk.'] } },
  /* ---------- Halloween: body ---------- */
  { id: 'ghost', holiday: 'halloween', slot: 'body', full: true, icon: '👻', name: 'Ghost sheet', pal: { F: '#f2f2f6', f: '#c4c8d8', O: '#1a1a22' },
    adult: { rows: [_8, '..FFFF..', '.FFFFFFF', '.FFFFFFF', '.FFFFOFO', '.FFFFFFF', '.FfFFFFF', 'fFFFFFFF', 'fFFFFFFF', 'fFFFFFFF', 'fFFFFFFF', 'fFFFFFFF', 'fFFFFFFF', 'FF.FF.FF'],
             A: ['fFFFFFFF', 'fFFFFFFF', '.FF.FF.F'], B: ['fFFFFFFF', 'fFFFFFFF', 'F.FF.FF.'], S: ['fFFFFFFF', 'fFFFFFFF', 'FF.FF.FF'] },
    kid:   { rows: ['.FFF..', 'FFFFFF', 'FFFOFO', 'fFFFFF', 'fFFFFF', 'fFFFFF', 'fFFFFF', 'F.FF.F'],
             A: ['fFFFFF', '.FF.FF'], B: ['fFFFFF', 'FF.FF.'], S: ['F.FF.F'] } },
  { id: 'skeleton', holiday: 'halloween', slot: 'body', full: true, icon: '💀', name: 'Skeleton', pal: { M: '#17110f', Y: '#e8e2cf', O: '#1a1a22' },
    adult: { rows: [_8, _8, '....YYYY', '....YYYY', '....YYOY', '....YMYM', '.....MM.', '....MMM.', '...MYYYM', '...MMYMM', '...YMYMY', '...MMMM.', '...Y..Y.', '...Y..Y.'],
             A: ['...MMMM.', '..Y...Y.', '..Y...Y.'], B: ['...MMMM.', '....YY..', '....YY..'], S: ['...YMMMM', '......YY', '.......Y'] },
    kid:   { rows: [_6, '..YYY.', '..YOY.', '..YYY.', '..MY..', '.YMMY.', '..MM..', '.Y..Y.'],
             A: ['.M..M.', '.Y..Y.'], B: ['..MM..', '..YY..'], S: ['.YMMMM'] } },
  { id: 'robe', holiday: 'halloween', slot: 'body', icon: '🔮', name: 'Witch robe', pal: { V: '#3b2a5a', G: '#e6b93a' },
    adult: { rows: [_8, _8, _8, _8, _8, _8, _8, '....VVV.', '...VVVVV', '...VVVVV', '...VVVVV', '..VVVVVV', '.GGGGGGG', _8],
             S: ['..VVVVVV', '.....GGG', _8] },
    kid:   { rows: [_6, _6, _6, _6, '..VV..', '.VVVV.', '.GGGG.', _6], S: ['.VVVVV'] } },
  { id: 'pumpkin', holiday: 'halloween', slot: 'body', icon: '🎃', name: 'Pumpkin suit', pal: { o: '#e8761a', a: '#b9520f' },
    adult: { rows: [_8, _8, _8, _8, _8, _8, _8, '..ooooo.', '.ooaooao', '.ooaooao', '.ooaooao', '..ooooo.', _8, _8],
             S: ['.ooaooao', '..ooooo.', _8] },
    kid:   { rows: [_6, _6, _6, _6, '.oaao.', 'ooaaoo', '.oaao.', _6], S: ['ooaaoo'] } },
  /* ---------- New Year: head ---------- */
  { id: 'santa', holiday: 'newyear', slot: 'head', icon: '🎅', name: 'Santa hat', pal: { R: '#c8202a', Q: '#f4f4f4' },
    adult: { ex: 2, clip: 3, rows: ['..QQ....', '...RRR..', '..RRRRR.', '..QQQQQQ', '..RRR...'] },
    kid:   { ex: 2, clip: 2, rows: ['.QQ...', '.RR...', '.RRR..', 'QQQQQ.', '..R...', '..R...'] } },
  { id: 'tonttu', holiday: 'newyear', slot: 'head', icon: '🧝', name: 'Tonttu hat', pal: { U: '#c2252d', u: '#8f1a20' },
    adult: { ex: 4, clip: 3, rows: ['.U......', '..U.....', '..UU....', '..UUU...', '...UUUU.', '..UUUUUU', '..uuu...'] },
    kid:   { ex: 3, clip: 2, rows: ['.U....', '..U...', '..UU..', '.UUU..', 'UUUUU.', '..u...', '..u...'] } },
  { id: 'antlers', holiday: 'newyear', slot: 'head', icon: '🦌', name: 'Antlers', pal: { N: '#8a5a34' },
    adult: { ex: 3, clip: 0, rows: ['..N..N..', '..NN.NN.', '...NNN..', '....NN..'] },
    kid:   { ex: 3, clip: 0, rows: ['.N..N.', '.NNNN.', '..NN..', '..N...'] } },
  /* ---------- New Year: body ---------- */
  { id: 'santacoat', holiday: 'newyear', slot: 'body', icon: '🎁', name: 'Santa coat', pal: { R: '#c8202a', Q: '#f4f4f4', J: '#1c1c22', G: '#e6b93a' },
    adult: { rows: [_8, _8, _8, _8, _8, _8, _8, '....QQQ.', '...RRRRR', '...JJGJJ', '....RRR.', '...QQQQ.', _8, _8], S: ['....QQQQ'] },
    tall:  { rows: [_8, _8, _8, _8, _8, _8, _8, '....RRR.', '....JGJ.', '...QQQQ.', _8, _8], S: ['....QQQQ'] },
    kid:   { rows: [_6, _6, _6, _6, '..RR..', '..JJ..', '..QQ..', _6], S: ['..QQQQ'] } },
  { id: 'elf', holiday: 'newyear', slot: 'body', icon: '🧚', name: 'Elf tunic', pal: { Z: '#2f8a4a', z: '#1f5a33', G: '#e6b93a' },
    adult: { rows: [_8, _8, _8, _8, _8, _8, _8, '....ZZZ.', '...ZZZZZ', '...zGGGz', '....ZZZ.', '..ZZZZZ.', '..Z.Z.Z.', _8], S: ['....ZZZZ'] },
    tall:  { rows: [_8, _8, _8, _8, _8, _8, _8, '....ZZZ.', '....GGG.', '..ZZZZZ.', '..Z.Z.Z.', _8], S: ['....ZZZZ'] },
    kid:   { rows: [_6, _6, _6, _6, '..ZZ..', '..GG..', '.ZZZZ.', _6], S: ['..ZZZZ'] } },
];
const COSTUME_BY_ID = Object.fromEntries(COSTUMES.map(c => [c.id, c]));
const costumeById = id => COSTUME_BY_ID[id] || null;
const COSTUME_SLOTS = [['head', 'Head'], ['body', 'Body']];

// Sprite-set key of composeSprite ('adult', 'kid', 'kidTall') → the costume's drawing for it.
const costumeHead = (c, key) => key === 'kid' ? c.kid : c.adult;
function costumeBody(c, key) {
  if (key === 'kid') return c.kid;
  if (key !== 'kidTall') return c.adult;
  const a = c.adult;
  return c.tall || { rows: a.rows.filter((_, i) => i !== 8 && i !== 9), A: a.A, B: a.B, S: a.S };
}

// Holidays that are on now (E is the result of env()).
const activeHolidays = E => [E.hal && 'halloween', E.ny && 'newyear'].filter(Boolean);
// What is chosen for a holiday: { head, body } (a plain string from an earlier format is the head costume).
function costumeSel(p, h) {
  const v = p.costumes && p.costumes[h];
  return typeof v === 'string' ? { head: v } : v && typeof v === 'object' ? v : {};
}
// Costume key "head|body" for the sprite cache and composeSprite; ids of another holiday or slot and unknown ids are dropped. No costume — null.
function costumeKeyOf(h, s) {
  const pick = (id, slot) => { const c = COSTUME_BY_ID[id]; return c && c.holiday === h && c.slot === slot ? c.id : ''; };
  const head = pick(s.head, 'head'), body = pick(s.body, 'body');
  return head || body ? head + '|' + body : null;
}
function activeCostume(p, E) {
  const h = E.hal ? 'halloween' : E.ny ? 'newyear' : null;
  return h ? costumeKeyOf(h, costumeSel(p, h)) : null;
}
function costumeParts(key) {
  const [a, b] = String(key).split('|');
  return { head: COSTUME_BY_ID[a] || null, body: COSTUME_BY_ID[b] || null };
}

// Four frames (standing, sitting, step 1, step 2) in a costume; needs look_editor.js (drawSpriteCanvas).
function renderCostumeFrames(el, P, season, key, scale = 10) {
  const spr = composeSprite(P, season, key), pal = Object.assign(layerPalette(P), spr.pal || {});
  const frames = [['idle', 'standing'], ['sit', 'sitting'], ['walkA', 'step 1'], ['walkB', 'step 2']];
  const H = Math.max(...frames.map(f => spr[f[0]].length));
  el.className = 'look-frames'; el.innerHTML = '';
  for (const [k, t] of frames) {
    const f = document.createElement('figure'), c = document.createElement('figcaption'); c.textContent = t;
    f.append(drawSpriteCanvas(spr[k], pal, scale, 1, H - spr[k].length), c); el.appendChild(f);
  }
}
