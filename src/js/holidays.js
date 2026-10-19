// Holidays: Halloween (15–31 October) and New Year (at the end of the file: 15 December – 14 January or with manual winter selection). Everything is tied to the calendar (for testing: ?month=10&day=25).
// Pumpkins appear in the forest one every two days (the first on the 15th, the ninth on the 31st), and disappear on 1 November. By the path to the house stands
// a jack-o'-lantern: from dusk its eyes and mouth glow. In the forest between the pines hang orange-and-purple garlands (lit in the evening),
// between trees in the middle of the scene a big round web, down which a little spider descends now and then. The places for all of this are computed once during scene layout (layoutHolidays) and do not change.
// In the bottom-left corner stands a skeleton decoration (in the evening its skull's eyes glow), and at dusk and at night in the distance between trees translucent ghosts occasionally fly past, Pac-Man style.
// Which holidays exist at all (the ⚙ panel in the season row). A disabled one never comes; the global switch is stored in the browser.
const HOLIDAYS = [{ id: 'halloween', icon: '🎃', name: 'Halloween', when: '15–31 October' }, { id: 'newyear', icon: '🎄', name: 'New Year', when: '15 December – 14 January' }];
const HOLIDAY_KEY = 'forest.holidays.v1';
let HOLIDAY_OFF = {};   // { halloween: true } — this holiday is absent
try { const o = JSON.parse(localStorage.getItem(HOLIDAY_KEY) || 'null'); if (o && typeof o === 'object') HOLIDAY_OFF = o; } catch (e) {}
const holidayOn = id => !HOLIDAY_OFF[id];
function saveHolidayOff() { try { localStorage.setItem(HOLIDAY_KEY, JSON.stringify(HOLIDAY_OFF)); } catch (e) {} }
const HAL_FIRST = 15, HAL_PUMPKINS = 9;
// State for today (t is the result of clock()) or null if it is not Halloween.
function halloweenState(t) {
  if (!holidayOn('halloween') || t.month !== 9 || t.day < HAL_FIRST) return null;
  return { n: Math.min(HAL_PUMPKINS, Math.floor((t.day - HAL_FIRST) / 2) + 1) };
}

function layoutHolidays() {
  const r = rng(3110), cab = x => x > L.cabin.x - 16 && x < L.cabin.x + 32;
  L.lantern = { x: L.doorX + 9, y: 162 };
  L.skeleton = { x: 11, y: 176 };   // bottom-left corner
  // pumpkins in the forest: not by the house and woodshed, not by the fire, not on boulders, not right next to each other
  L.pumpkins = [];
  for (let tries = 0; L.pumpkins.length < HAL_PUMPKINS && tries < 600; tries++) {
    const x = Math.round(W * 0.03 + r() * W * 0.94), y = 134 + Math.floor(r() * 38);
    if (cab(x) || (y > 145 && Math.abs(x - L.fireX) < 19)) continue;
    if (L.rocks.some(o => Math.abs(x - o.x) < o.rx + 3 && Math.abs(y - o.y) < o.ry + 3)) continue;
    if (L.pumpkins.some(p => Math.abs(p.x - x) < 14 && Math.abs(p.y - y) < 7)) continue;
    L.pumpkins.push({ x, y, dep: clamp((y - 126) / 26, 0, 1) });
  }
  for (const p of L.pumpkins) if (p.x < 28 && p.y > 162) p.x += 36;   // the corner is taken by the skeleton (don't touch random(), so the rest stays in place)
  // (the former choice of spots for corner webs is gone; the loop is kept only to advance random() so pumpkins and garlands stay where they were)
  const pines = L.trees.filter(t => t.type === 'p' && t.dep > 0.6 && t.x > W * 0.04 && t.x < W * 0.97 && !cab(t.x));
  for (let tries = 0, n = 0, xs = []; n < 4 && tries < 200 && pines.length; tries++) {
    const t = pines[Math.floor(r() * pines.length)];
    if (xs.some(x => Math.abs(x - t.x) < 45)) continue;
    xs.push(t.x); n++;
  }
  // big round web between two neighbouring front-row trees nearer the middle of the scene: above heads, below the needles.
  // Its place is found before the garlands (garlands then go around it); if there is no pair, the conditions are gradually loosened.
  L.web = null;
  for (const [dep, lo, hi, maxGap] of [[0.75, 0.3, 0.75, 46], [0.75, 0.15, 0.9, 52], [0.6, 0.1, 0.95, 56]]) {
    const wt = L.trees.filter(t => t.dep > dep && t.x > W * lo && t.x < W * hi).sort((a, b) => a.x - b.x), wp = [];
    for (let i = 0; i < wt.length; i++) for (let j = i + 1; j < wt.length; j++) {
      const xa = wt[i].x + 3, xb = wt[j].x, gap = xb - xa; if (gap > maxGap) break;
      if (gap < 14 || Math.abs(wt[i].base - wt[j].base) > 3 || Math.abs((xa + xb) / 2 - L.fireX) < 30) continue;
      wp.push({ xa, xb, a: wt[i], b: wt[j], off: Math.abs((xa + xb) / 2 - W / 2) });
    }
    if (!wp.length) continue;
    wp.sort((p, q) => (p.off + (p.xb - p.xa > 30 ? 1000 : 0)) - (q.off + (q.xb - q.xa > 30 ? 1000 : 0)));   // prefers trees closer to each other, then closer to the middle
    const c = wp[0], R = Math.min(6, Math.floor((c.xb - c.xa) / 2) - 1);
    L.web = { xa: c.xa, xb: c.xb, cx: Math.round((c.xa + c.xb) / 2), cy: Math.min(c.a.base, c.b.base) - 26, R, dmax: R + 8, base: Math.max(c.a.base, c.b.base) + 0.05 };
    break;
  }
  // garlands between neighbouring trees of the four front rows (up to five, as at New Year): a sagging wire, bulbs 2×2 every 6 px.
  // Pairs of trees 33…60 px apart (at least five bulbs) on the same line or on neighbouring ones; picked randomly, but short ones more often than long.
  // Garlands don't overlap each other or the web: first 24 px apart, if there aren't enough spots, 10, then 4.
  L.garlands = [];
  const cand = L.trees.filter(t => t.dep > 0.6 && t.x > L.cabin.x + 34 && t.x < W - 8).sort((a, b) => a.x - b.x), pairs = [];
  for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
    const d = cand[j].x - cand[i].x; if (d > 60) break;
    if (d < 33 || Math.abs(cand[i].base - cand[j].base) > 7) continue;
    if (L.web && cand[i].x + 3 < L.web.xb + 8 && cand[j].x > L.web.xa - 8) continue;   // no garlands near the web
    pairs.push([cand[i], cand[j]]);
  }
  pairs.sort((p, q) => (p[1].x - p[0].x) - (q[1].x - q[0].x));
  for (const gap of [24, 10, 4]) {
    const pool = pairs.slice();
    while (pool.length && L.garlands.length < 5) {
      const [a, b] = pool.splice(Math.floor(r() * r() * pool.length), 1)[0], xa = a.x + 3, xb = b.x;   // r()*r(): closer to the start of the list, i.e. to the short ones
      if (L.garlands.some(g => xa < g.x1 + gap && xb > g.x0 - gap)) continue;
      const ya = a.base - Math.round(a.h * 0.36), yb = b.base - Math.round(b.h * 0.36), G = { x0: xa, x1: xb, wire: [], bulbs: [], base: Math.max(a.base, b.base) + 0.05 };
      for (let x = xa; x <= xb; x++) { const k = (x - xa) / (xb - xa); G.wire.push({ x, y: Math.round(ya + (yb - ya) * k + 5 * 4 * k * (1 - k)) }); }
      for (let x = xa + 3, n = 0; x < xb - 2; x += 6, n++) G.bulbs.push({ x, y: G.wire[x - xa].y + 1, c: n % 2, ph: r() * 6.28 });
      if (G.bulbs.length < 5) continue;   // don't hang fewer than five bulbs
      L.garlands.push(G);
    }
  }
  layoutNewYear();
}

/* ---------- drawing ---------- */
const PUMP_SPR = { s: ['.s.', 'ooo', 'ooO'], m: ['..s.', 'looO', 'oooO'], l: ['..ss..', '.oOoO.', 'loOooO', 'ooOooO', '.oOoO.'] };
const PUMP_PAL = { o: '#e8761a', O: '#b9520f', l: '#f7a540', s: '#4f6a2a' };
function drawPumpkin(g, p, S) {
  const rows = PUMP_SPR[p.dep < 0.4 ? 's' : p.dep < 0.75 ? 'm' : 'l'], w = rows[0].length, h = rows.length, hz = hazeOf(p.dep) * 0.6;
  const left = p.x - Math.floor(w / 2), top = p.y - h;
  R(g, left, p.y, w, 1, 'rgba(0,0,0,0.18)');
  rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const c = row[i]; if (c !== '.') R(g, left + i, top + j, 1, 1, mixHex(PUMP_PAL[c], S.hillNear, hz)); } });
}
// Jack-o'-lantern 8×7; E — the cut-outs (dark in the day, glowing in the evening, see halBulbs).
const LANT = ['...ss...', '.oooooo.', 'ooEooEoo', 'oEEooEEo', 'oooooooo', 'oEoEEoEo', '.oooooo.'];
function drawLantern(g) {
  const q = L.lantern, left = q.x - 4, top = q.y - 7;
  R(g, left, q.y, 8, 1, 'rgba(0,0,0,0.2)');
  LANT.forEach((row, j) => { for (let i = 0; i < 8; i++) {
    const c = row[i]; if (c === '.') continue;
    R(g, left + i, top + j, 1, 1, c === 's' ? '#4f6a2a' : c === 'E' ? '#2a1408' : (i >= 6 || j === 6) ? '#b9520f' : (i <= 1 && j <= 3) ? '#f7a540' : '#e8761a');
  } });
}
// Round web: 8 spokes, two rings, and threads to the trunks (the spider is drawn separately, see drawSpider).
const WEB_COL = 'rgba(236,240,248,0.7)';
function halLine(g, x0, y0, x1, y1, col) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let k = 0; k <= n; k++) R(g, Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), 1, 1, col);
}
function drawWeb(g, w) {
  const { cx, cy, R: rad } = w, rings = [rad * 0.5, rad];
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    const rr = Math.hypot(dx, dy);
    if (rr > rad + 0.5) continue;
    if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy) || rings.some(q => Math.abs(rr - q) <= 0.5)) R(g, cx + dx, cy + dy, 1, 1, WEB_COL);
  }
  const d = Math.round(rad * 0.71);
  halLine(g, w.xa, cy, cx - rad, cy, WEB_COL); halLine(g, cx + rad, cy, w.xb, cy, WEB_COL);                      // threads to the trunks
  halLine(g, cx - d, cy - d, w.xa, cy - d - 4, WEB_COL); halLine(g, cx + d, cy - d, w.xb, cy - d - 4, WEB_COL);
  halLine(g, cx - d, cy + d, w.xa, cy + d + 4, WEB_COL); halLine(g, cx + d, cy + d, w.xb, cy + d + 4, WEB_COL);
}
// The spider lives at the center of the web; every 50 seconds it descends on a thread below the web, hangs, and climbs back up.
function spiderDepth(w) {
  const p = T % 50, ease = k => k * k * (3 - 2 * k);
  if (p < 26 || p >= 43) return 0;
  if (p < 32) return w.dmax * ease((p - 26) / 6);
  if (p < 37) return w.dmax + Math.round(Math.sin(T * 3));
  return w.dmax * (1 - ease((p - 37) / 6));
}
function drawSpider(g) {
  const w = L.web, d = Math.round(spiderDepth(w)), x = w.cx, y = w.cy + d;
  if (d > 0) halLine(g, x, w.cy, x, y, 'rgba(236,240,248,0.55)');   // thread
  R(g, x, y, 2, 2, '#1a1418');
  const c = '#2a2228'; R(g, x - 1, y - 1, 1, 1, c); R(g, x + 2, y - 1, 1, 1, c); R(g, x - 1, y + 2, 1, 1, c); R(g, x + 2, y + 2, 1, 1, c);
}
// Wire and unlit bulbs (into the ground cache); lit bulbs are drawn by halBulbs.
function drawGarlandWire(g, G) {
  for (const p of G.wire) R(g, p.x, p.y, 1, 1, '#25202b');
  for (const b of G.bulbs) R(g, b.x, b.y, 2, 2, b.c ? '#5e4396' : '#9a5a1a');
}
// Adds the holiday's statics to the buildLand list: [depth, drawer].
function halLand(items, E) {
  nyLand(items, E);
  if (!E.hal) return;
  for (let i = 0; i < E.hal.n; i++) { const p = L.pumpkins[i]; if (p) items.push([p.y + 0.3, c => drawPumpkin(c, p, E.S)]); }
  if (L.web) items.push([L.web.base, c => drawWeb(c, L.web)]);
  for (const G of L.garlands) items.push([G.base, c => drawGarlandWire(c, G)]);
}
// Jack-o'-lantern and spider in the depth-sorted object list (the spider sits at the web's depth, right after it).
const holidayItems = E => nyItems(E).concat(!E.hal ? [] : [{ y: L.lantern.y, x: L.lantern.x, d: c => drawLantern(c) }, { y: L.skeleton.y, x: L.skeleton.x, d: c => drawSkeleton(c) }]
  .concat(L.web ? [{ y: L.web.base + 0.01, x: L.web.cx, d: c => drawSpider(c) }] : [])
  .concat(GHOSTS.map(o => ({ y: o.y, x: o.x, d: c => drawGhost(c, o, E) }))));   // a ghost stands at the depth of the far forest and hides behind nearer trees

// Skeleton 7×13, facing the viewer; E — eye sockets (dark by day, glowing in the evening, see halBulbs), k — dark gaps between bones.
const SKEL = ['..bbbbb..','.bbbbbbb.','.bEEbEEb.','.bbEbEbb.','..bbbbb..','...bkb...','....b....','..bbbbb..','.b..b..b.','.b.bbb.b.','.b..b..b.','.b.bbb.b.','....b....','..bbbbb..','..b...b..','..b...b..','.bb...bb.',];
function drawSkeleton(g) {
  const s = L.skeleton, left = s.x - 4, top = s.y - SKEL.length;
  R(g, left, s.y, 9, 1, 'rgba(0,0,0,0.2)');
  SKEL.forEach((row, j) => { for (let i = 0; i < 9; i++) {
    const c = row[i]; if (c === '.') continue;
    R(g, left + i, top + j, 1, 1, c === 'E' ? '#17110f' : c === 'k' ? '#4a443a' : '#e8e2cf');
  } });
}

// Pac-Man ghosts (Blinky, Pinky, Inky, Clyde), translucent. At dusk and at night every 1–3 minutes (with ?animals=fast — every 4–10 seconds)
// one ghost flies in from the edge of the scene, sometimes a chain of 2–4. They float in the distance (at the far-forest depth) and slip behind nearby trunks.
const GHOSTS = [];
let _ghostT = 8;
const GHOST_COL = ['#ff2a2a', '#ffb0f0', '#35e8ff', '#ffb040'];
const GHOST_SPR = [
  ['.GGGGG.', 'GGGGGGG', 'GWWGWWG', 'GWBGWBG', 'GGGGGGG', 'GGGGGGG', 'GGGGGGG', 'GG.G.GG'],
  ['.GGGGG.', 'GGGGGGG', 'GWWGWWG', 'GWBGWBG', 'GGGGGGG', 'GGGGGGG', 'GGGGGGG', 'G.GGG.G'],
];
function spawnGhosts() {
  const dir = Math.random() < 0.5 ? 1 : -1, n = Math.random() < 0.3 ? 2 + Math.floor(Math.random() * 3) : 1;
  const cols = [0, 1, 2, 3].sort(() => Math.random() - 0.5), y = rand(128, 140), v = rand(11, 16), alt = rand(4, 10);   // float a little above the ground
  for (let i = 0; i < n; i++) GHOSTS.push({ x: (dir > 0 ? -8 : W + 8) - dir * i * 13, y: y + i * 0.01, alt: alt + rand(-1.5, 1.5), v, dir, c: cols[i], ph: rand(0, 6) });
}
function updateGhosts(dt, E) {
  if (!E.hal) { GHOSTS.length = 0; _ghostT = 8; return; }
  _ghostT -= dt;
  if (_ghostT <= 0) { _ghostT = FAST_ANI ? rand(4, 10) : rand(60, 180); if (!E.wet && E.d < 0.7) spawnGhosts(); }
  for (const o of GHOSTS) o.x += o.dir * o.v * dt;
  for (let i = GHOSTS.length - 1; i >= 0; i--) { const o = GHOSTS[i]; if ((o.dir > 0 && o.x > W + 12) || (o.dir < 0 && o.x < -12)) GHOSTS.splice(i, 1); }
}
function drawGhost(g, o, E) {
  const rows = GHOST_SPR[Math.floor(T * 3 + o.ph) % 2], hz = hazeOf(clamp((o.y - 126) / 26, 0, 1)) * 0.5;
  const pal = { G: mixHex(GHOST_COL[o.c], E.S.hillNear, hz), W: '#ffffff', B: '#2a2ae0' };
  const left = Math.round(o.x) - 3, top = Math.round(o.y - o.alt - rows.length + Math.sin(T * 1.6 + o.ph) * 1.5);
  g.globalAlpha = 0.75;
  rows.forEach((row, j) => { for (let i = 0; i < 7; i++) { const c = row[i]; if (c !== '.') R(g, o.dir < 0 ? left + 6 - i : left + i, top + j, 1, 1, pal[c]); } });
  g.globalAlpha = 1;
}

// How much the lights are lit: 0 by day, 1 in the dark (they brighten from sunset).
const halLit = E => clamp((0.75 - E.d) / 0.45, 0, 1);
const HAL_COL = ['#ff8a1e', '#a35cff'];
// Soft glow: called with globalCompositeOperation = 'lighter'.
function halGlow(g, E) {
  nyGlow(g, E);
  const k = E.hal ? halLit(E) : 0; if (k <= 0) return;
  for (const G of L.garlands) for (const b of G.bulbs) disc(g, b.x + 1, b.y + 1, 3, rgba(HAL_COL[b.c], 0.07 * k * (0.7 + 0.3 * Math.sin(T * 2.4 + b.ph))));
  const f = 0.8 + Math.random() * 0.2, q = L.lantern;
  disc(g, q.x, q.y - 3, 10, rgba('#ff9a2a', 0.05 * k * f)); disc(g, q.x, q.y - 3, 5, rgba('#ffb040', 0.09 * k * f));
  const s = L.skeleton, f2 = 0.8 + Math.random() * 0.2;   // skull eyes
  disc(g, s.x, s.y - 10, 7, rgba('#ff9a2a', 0.04 * k * f2)); disc(g, s.x, s.y - 10, 4, rgba('#ffb040', 0.07 * k * f2));
}
// Glowing pixels: garland bulbs and the jack-o'-lantern's eyes and mouth (over the night dimming).
function halBulbs(g, E) {
  nyBulbs(g, E);
  const k = E.hal ? halLit(E) : 0; if (k <= 0) return;
  for (const G of L.garlands) for (const b of G.bulbs) R(g, b.x, b.y, 2, 2, rgba(HAL_COL[b.c], k * (0.75 + 0.25 * Math.sin(T * 2.4 + b.ph))));
  const q = L.lantern, left = q.x - 4, top = q.y - 7, a = k * (0.8 + Math.random() * 0.2);
  LANT.forEach((row, j) => { for (let i = 0; i < 8; i++) if (row[i] === 'E') R(g, left + i, top + j, 1, 1, rgba('#ffc84a', a)); });
  const s = L.skeleton, sl = s.x - 4, st = s.y - SKEL.length, a2 = k * (0.8 + Math.random() * 0.2);
  SKEL.forEach((row, j) => { for (let i = 0; i < 9; i++) if (row[i] === 'E') R(g, sl + i, st + j, 1, 1, rgba('#ffc84a', a2)); });
}

/* ---------- New Year ---------- */
// 15 December – 14 January, and also when winter is selected manually (the ⛄ button on the panel). For testing: ?month=12&day=25 or ?month=1&day=10 (a month without a day gives the 15th).
// Up to five red-and-green garlands between front-row trees, and a fir tree to the right of the fire, above the walking lines, next to the trees.
// The fir tree is drawn as a regular object of its depth, and the evening bulb and star lights — on the scene segment boundary (BREAKS in render.js, like the fire),
// so people standing closer cover both the tree and its lights, and the light doesn't fall on them. In the evening bulbs and star light up and flicker. Places are computed once (layoutNewYear).
function newYearState(t) {
  if (!holidayOn('newyear')) return null;
  if (t.ovMonth === 0) return { on: true };   // winter selected manually
  if ((t.month === 11 && t.day >= 15) || (t.month === 0 && t.day <= 14)) return { on: true };
  return null;
}
const NY_GAR = ['#ff3030', '#35d04f'];                                      // red and green garland bulbs
const NY_BULB = ['#ff3b3b', '#ffd23a', '#38c8ff', '#ff7bd0', '#7dff5a'];    // fir-tree bulbs
const NY_W = [1, 3, 5, 3, 5, 7, 5, 7, 9, 7, 9, 11, 7, 9, 11, 13], NY_TIER_END = [2, 5, 8, 11, 15];   // needle row widths top to bottom; the bottom rows of tiers
const NY_ROW0 = 3, NY_H = 21, NY_BASE = 154, NY_GARLANDS = 5;   // 3 star rows above the needles, 2 trunk rows below; base above the people lines (156…162)
const nyTop = () => L.xtree.base - NY_H;

function layoutNewYear() {
  const r = rng(1231);
  // garlands: a sagging wire between two front-row trees, bulbs 2×2 every 6 px, red and green in turn.
  // Pairs of trees 33…60 px apart (so at least five bulbs come out), on the same line or on neighbouring ones (bases within 7 px); from the pairs, random ones are picked but short ones more often than long. A new garland must not
  // overlap the already chosen ones: first 24 px apart, if there aren't enough spots, 10, then 4. Searched until five are gathered or there are no more pairs.
  L.nyGarlands = [];
  const cand = L.trees.filter(t => t.dep > 0.6 && t.x > L.cabin.x + 34 && t.x < W - 8).sort((a, b) => a.x - b.x), pairs = [];
  for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
    const d = cand[j].x - cand[i].x; if (d > 60) break;
    if (d >= 33 && Math.abs(cand[i].base - cand[j].base) <= 7) pairs.push([cand[i], cand[j]]);
  }
  pairs.sort((p, q) => (p[1].x - p[0].x) - (q[1].x - q[0].x));
  for (const gap of [24, 10, 4]) {
    const pool = pairs.slice();
    while (pool.length && L.nyGarlands.length < NY_GARLANDS) {
      const [a, b] = pool.splice(Math.floor(r() * r() * pool.length), 1)[0], xa = a.x + 3, xb = b.x;   // r()*r(): closer to the start of the list, i.e. to the short ones
      if (L.nyGarlands.some(g => xa < g.x1 + gap && xb > g.x0 - gap)) continue;
      const ya = a.base - Math.round(a.h * 0.36), yb = b.base - Math.round(b.h * 0.36), G = { x0: xa, x1: xb, wire: [], bulbs: [], base: Math.max(a.base, b.base) + 0.05 };
      for (let x = xa; x <= xb; x++) { const k = (x - xa) / (xb - xa); G.wire.push({ x, y: Math.round(ya + (yb - ya) * k + 5 * 4 * k * (1 - k)) }); }
      for (let x = xa + 3, n = 0; x < xb - 2; x += 6, n++) G.bulbs.push({ x, y: G.wire[x - xa].y + 1, c: n % 2, ph: r() * 6.28 });
      if (G.bulbs.length < 5) continue;   // don't hang fewer than five bulbs
      L.nyGarlands.push(G);
    }
  }
  // fir tree: to the right of the fire, by the front-row trees (nearest trunk 7…11 px), not on boulders
  const front = L.trees.filter(t => t.base >= 146), big = L.rocks.filter(o => o.y >= 148);
  const lo = L.fireX + 32, hi = Math.max(lo, Math.min(Math.round(W * 0.57), W - 20));
  let best = null, bs = Infinity;
  for (let x = lo; x <= hi; x++) {
    if (big.some(o => Math.abs(x - o.x) < o.rx + 9)) continue;
    const d = front.reduce((m, t) => Math.min(m, Math.abs(x - (t.x + 1))), 99);
    if (d < 7) continue;
    const sc = Math.abs(d - 9) + (x - lo) * 0.01;
    if (sc < bs) { bs = sc; best = x; }
  }
  L.xtree = { x: best === null ? lo + 10 : best, base: NY_BASE, bulbs: [] };
  // individual bulbs on the needles: not next to each other, don't touch the top row or the star
  const spots = [];
  NY_W.forEach((w, i) => { if (i > 0) for (let k = -(w - 1) / 2; k <= (w - 1) / 2; k++) spots.push({ dx: k, row: i }); });
  for (let tries = 0; tries < 600 && L.xtree.bulbs.length < 20; tries++) {
    const s = spots[Math.floor(r() * spots.length)];
    if (L.xtree.bulbs.some(b => Math.abs(b.dx - s.dx) < 2 && Math.abs(b.row - s.row) < 2)) continue;
    L.xtree.bulbs.push({ dx: s.dx, row: s.row, c: Math.floor(r() * NY_BULB.length), ph: r() * 6.28 });
  }
}

// Fir tree with dim (daytime) bulbs and a golden star; in the evening lights come on over them (nyTreeLights).
function drawXmasTree(g, E) {
  const q = L.xtree, top = nyTop(), x = q.x, S = E.S;
  R(g, x - 6, q.base, 13, 1, 'rgba(0,0,0,0.18)');
  R(g, x - 1, q.base - 2, 3, 2, '#6b4a2f'); R(g, x - 1, q.base - 2, 1, 2, '#8a5f3c');   // trunk
  NY_W.forEach((w, i) => {
    const half = (w - 1) / 2, bottom = NY_TIER_END.includes(i);
    for (let kx = -half; kx <= half; kx++) {
      let c = bottom ? '#1f5a33' : kx < 0 ? '#3f9455' : '#2e7a45';
      if (S.snow && bottom && Math.abs(kx) === half) c = '#eef3f8';   // snow on the tier tips
      R(g, x + kx, top + NY_ROW0 + i, 1, 1, c);
    }
  });
  for (const b of q.bulbs) R(g, x + b.dx, top + NY_ROW0 + b.row, 1, 1, mixHex(NY_BULB[b.c], '#1f5a33', 0.45));   // the bulb replaces a needle pixel
  const gold = '#ffd84a';   // plus-shaped star
  R(g, x, top, 1, 1, gold); R(g, x - 1, top + 1, 3, 1, gold); R(g, x, top + 2, 1, 1, gold); R(g, x, top + 1, 1, 1, '#fff3a0');
}
const nyItems = E => !E.ny ? [] : [{ y: L.xtree.base - 0.1, x: L.xtree.x, d: c => drawXmasTree(c, E) }]   // deeper than the NY_BASE segment boundary: people on lines 156 and closer stay in front of the lights;

function drawNyWire(g, G) {
  for (const p of G.wire) R(g, p.x, p.y, 1, 1, '#22262a');
  for (const b of G.bulbs) R(g, b.x, b.y, 2, 2, b.c ? '#24673a' : '#7a2424');
}
// Holiday statics into the ground cache: garland wires.
function nyLand(items, E) {
  if (!E.ny) return;
  for (const G of L.nyGarlands) items.push([G.base, c => drawNyWire(c, G)]);
}
// Soft glow of the garlands (under 'lighter').
function nyGlow(g, E) {
  const k = E.ny ? halLit(E) : 0; if (k <= 0) return;
  for (const G of L.nyGarlands) for (const b of G.bulbs) disc(g, b.x + 1, b.y + 1, 3, rgba(NY_GAR[b.c], 0.07 * k * (0.7 + 0.3 * Math.sin(T * 2.2 + b.ph))));
}
// Glowing garland pixels over the night dimming (fir-tree bulbs and star are drawn with the tree, see drawXmasTree).
function nyBulbs(g, E) {
  const k = E.ny ? halLit(E) : 0; if (k <= 0) return;
  for (const G of L.nyGarlands) for (const b of G.bulbs) R(g, b.x, b.y, 2, 2, rgba(NY_GAR[b.c], k * (0.75 + 0.25 * Math.sin(T * 2.2 + b.ph))));
}
// Fir-tree lights: glowing bulb and star pixels without the night dimming. Drawn straight to the screen at the segment boundary (BREAKS in render.js, like the fire):
// everything closer than the tree (people on lines 156 and beyond) is drawn afterwards and covers the lights, and the light doesn't fall on people. The glow around is faint.
function nyTreeLights(g, E) {
  const k = E.ny ? halLit(E) : 0; if (k <= 0) return;
  const q = L.xtree, top = nyTop(), f = 0.9 + 0.1 * Math.sin(T * 1.3);
  g.globalCompositeOperation = 'lighter';
  for (const b of q.bulbs) disc(g, q.x + b.dx, top + NY_ROW0 + b.row, 1, rgba(NY_BULB[b.c], 0.07 * k * (0.7 + 0.3 * Math.sin(T * (1.6 + b.ph % 1) + b.ph * 5))));
  disc(g, q.x, top + 1, 4, rgba('#ffd84a', 0.07 * k * f));
  g.globalCompositeOperation = 'source-over';
  for (const b of q.bulbs) R(g, q.x + b.dx, top + NY_ROW0 + b.row, 1, 1, rgba(NY_BULB[b.c], k * (0.8 + 0.2 * Math.sin(T * (1.6 + b.ph % 1) + b.ph * 5))));
  const star = rgba('#ffe566', k * f);
  R(g, q.x, top, 1, 1, star); R(g, q.x - 1, top + 1, 3, 1, star); R(g, q.x, top + 2, 1, 1, star); R(g, q.x, top + 1, 1, 1, rgba('#fffbe0', k * f));
}