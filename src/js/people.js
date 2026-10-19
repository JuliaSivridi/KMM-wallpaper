const isChild = p => p.age === 'child';
const isGrownUp = p => p.age === 'adult';

function agent(person, speed) {
  return {
    id: person.id,
    person,
    speed,
    x: 0, y: 160, face: 1, mode: 'idle', path: [], timer: 1,
    hidden: false, anim: Math.random(), blinkT: rand(1, 5), blink: 0,
    act: null, next: null,
  };
}

// Speed by age — a child is faster, an adult calmer.
const SPEED_BY_AGE = { child: 14, adult: 11 };
const FOLK = [];   // living characters; filled from window.FAMILY in rebuildFolk()
let BY_ID = {};

// Foreground lines: people walk and stand along them (base y). They coincide with the depth-layer edges, so the drawing order is correct by itself.
// The main line 160 — fire, snowman, shovel, cones; the others — for walks, sitting, berries and games. Chosen at random, with weight in favor of 160.
const LINES = [156, 158, 160, 162], MAIN_LINE = 160, LINE_W = [1, 1, 2, 1];
const FIRE_CLEAR = 20;   // on both sides of the fire above line 159 people have no place: logs, stones and flame
const SPOT_DY = 3;       // people on lines closer than this in y (neighbouring lines) must not stand on top of each other
const nearFire = x => Math.abs(x - L.fireX) < FIRE_CLEAR;
function pickLine(x) {
  const ok = LINES.map((y, i) => (y >= 159.5 || x === undefined || !nearFire(x)) ? LINE_W[i] : 0);
  let r = Math.random() * ok.reduce((p, q) => p + q, 0);
  for (let i = 0; i < ok.length; i++) { r -= ok[i]; if (r < 0) return LINES[i]; }
  return MAIN_LINE;
}
const lineNear = y => LINES.reduce((b, l) => Math.abs(l - y) < Math.abs(b - y) ? l : b, MAIN_LINE);
// Route from the current point to (tx, ty). From the house first down the path to 160. Straight across the fire above line 159 is not walked: a detour via 160.
function buildPath(a, tx, ty) {
  const P = [], door = ty === L.cabin.base;
  let x0 = a.x, y0 = a.y;
  if (y0 < 155) { P.push({ x: x0, y: 160 }); y0 = 160; }
  const x1 = door ? L.doorX : clamp(tx, 4, W - 4), y1 = door ? 160 : ty;
  if ((y0 < 159.5 || y1 < 159.5) && Math.max(x0, x1) > L.fireX - FIRE_CLEAR && Math.min(x0, x1) < L.fireX + FIRE_CLEAR) P.push({ x: x0, y: 160 }, { x: x1, y: 160 });
  P.push({ x: x1, y: y1 });
  if (door) P.push({ x: L.doorX, y: L.cabin.base });
  return P;
}
function go(a, tx, ty, mode, time, face) { a.path = buildPath(a, tx, ty); a.mode = 'walk'; a.next = { mode, time, face }; }
function arrive(a) {
  const n = a.next || { mode: 'idle', time: 3 }; a.next = null;
  if (n.mode === 'hide') { a.hidden = true; a.mode = 'idle'; returnBucket(a); return; }
  a.mode = n.mode; a.timer = n.time; if (n.face) a.face = n.face;
}
function wanderX() { let x = rand(W * 0.04, W * 0.95); if (Math.abs(x - L.fireX) < 7) x += 14; return x; }
function underTree() { return L.sitTrees[Math.floor(Math.random() * L.sitTrees.length)].x + 6; }

// Where the person is going or standing: that spot is already "taken" by him.
const spotX = a => a.mode === 'walk' && a.path.length ? a.path[a.path.length - 1].x : a.x;
const spotY = a => a.mode === 'walk' && a.path.length ? a.path[a.path.length - 1].y : a.y;
// A boulder covers a person standing "inside" it (above the base): nobody stands there.
const rockBlocks = (x, y, w) => L.rocks.some(o => Math.abs(x - o.x) < o.rx + w / 2 - 1 && y >= o.y - o.ry && y < o.y + o.ry);
const spriteW = a => spriteOf(a.person, 'summer').idle[0].length;
// Is spot x free for person a: no one else stands nearby or goes there (sprites must not overlap).
function spotFree(a, x, building, y = MAIN_LINE) {
  const wa = spriteW(a);
  if (snowSite(x, wa)) return false;   // the snowman's spot in winter must not be taken
  if (woodSite(x, wa)) return false;   // nor the woodshed and chopping block spot
  if (!building && snowLane(x)) return false;   // nor the lane the snowballs are rolled along
  if (y < 159.5 && nearFire(x)) return false;   // no one stands by the fire above line 159
  if (rockBlocks(x, y, wa)) return false;
  return FOLK.every(b => b === a || b.hidden || (b.next && b.next.mode === 'hide') || Math.abs(spotY(b) - y) >= SPOT_DY || Math.abs(spotX(b) - x) >= (wa + spriteW(b)) / 2 + 1);
}
// The first free spot from gen() within a few tries, else null.
function freeSpot(a, gen, tries = 6, building = false, y = MAIN_LINE) {
  for (let i = 0; i < tries; i++) { const x = gen(); if (spotFree(a, x, building, y)) return x; }
  return null;
}
// A free spot next to person o (in turn right, left, farther).
function spotNear(a, o, d, y) {
  const xs = [1, -1, 2, -2].map(k => clamp(spotX(o) + k * d, W * 0.04, W * 0.95)); let i = 0;
  return freeSpot(a, () => xs[i++], xs.length, false, y);
}
// Spots by the fire: two logs, then on the ground to the sides. One spot — one person.
function seatSlots() {
  return [{ x: L.seatX, face: 1, log: true }, { x: L.seat2X, face: -1, log: true },
          { x: L.seatX - 13, face: 1 }, { x: L.seat2X + 13, face: -1 }, { x: L.seatX - 26, face: 1 }, { x: L.seat2X + 26, face: -1 }];
}
// A free spot by the fire (logsOnly — log only); with nearX — the one closest to that point. No spots — null.
function freeSeat(a, logsOnly, nearX) {
  const free = seatSlots().filter(s => (!logsOnly || s.log) && spotFree(a, s.x));
  if (nearX != null) free.sort((p, q) => Math.abs(p.x - nearX) - Math.abs(q.x - nearX));
  return free[0] || null;
}

// The common "calm" set of actions: the fire, berries, sitting under a tree.
function chooseCalm(a, E) {
  const r = Math.random(), picking = E.season === 'summer' || E.season === 'autumn';
  if (E.fireLit && r < 0.7 && canDo(a.person, 'fire')) { const s = freeSeat(a, false); if (s) return go(a, s.x, 160, 'sit', rand(90, 240), s.face); }
  if (!E.fireLit) {
    if (picking && r < 0.25 && canDo(a.person, 'berries')) { const y = pickLine(), x = freeSpot(a, () => rand(W * 0.45, W * 0.95), 6, false, y); if (x !== null) return go(a, x, y, 'pick', rand(40, 120), Math.random() < 0.5 ? 1 : -1); }
    if (r < 0.4) { const y = pickLine(), x = freeSpot(a, underTree, 6, false, y); if (x !== null) return go(a, x, y, 'sit', rand(30, 90), -1); }
    if (r < 0.5 && canDo(a.person, 'fire')) { const s = freeSeat(a, true); if (s) return go(a, s.x, 160, 'sit', rand(25, 70), s.face); }
  }
  if (r < 0.85) { const x = wanderX(); return go(a, x, pickLine(x), 'idle', rand(3, 10), null); }
  a.mode = 'idle'; a.timer = rand(4, 12); if (Math.random() < 0.5) a.face *= -1;
}

// "Fidget": runs, jumps, plays. If follows is set — stays close to that one.
function chooseFidget(a, E) {
  const r = Math.random();
  const leader = a.person.follows ? BY_ID[a.person.follows] : null;
  const mom = leader && !leader.hidden ? leader : null;
  if (mom && E.fireLit && r < 0.6 && canDo(a.person, 'fire')) {
    // by the fire — to the free spot closest to the leader, otherwise next to him
    const s = Math.abs(spotX(mom) - L.fireX) < 45 ? freeSeat(a, false, spotX(mom)) : null;
    if (s) return go(a, s.x, 160, 'sit', rand(40, 120), s.face);
    const ly = lineNear(spotY(mom)), x = spotNear(a, mom, 8, ly);
    if (x !== null) return go(a, x, ly, 'sit', rand(40, 120), spotX(mom) > x ? 1 : -1);
  }
  if (mom && r < 0.35) {
    const ly = lineNear(spotY(mom)), x = spotNear(a, mom, 9, ly);
    if (x !== null) return go(a, x, ly, mom.mode === 'pick' && canDo(a.person, 'berries') ? 'pick' : 'play', rand(4, 12), spotX(mom) > x ? 1 : -1);
  }
  if (r < 0.75) { const x = clamp(a.x + rand(-70, 70), W * 0.04, W * 0.95); return go(a, x, pickLine(x), 'play', rand(3, 9), null); }
  a.mode = 'play'; a.timer = rand(3, 8);
}

function choose(a, E) {
  endWork(a);   // the previous job ended: firewood and cones don't get stuck
  if (a.mode === 'build' && SNOW && SNOW.v >= 4) { a.mode = 'play'; a.timer = rand(4, 7); return; }   // finished — celebrates
  if (canDo(a.person, 'snowman') && wantsSnowman(a, E) && chooseSnowman(a)) return;
  if (canDo(a.person, 'shovel') && wantsShovel(a, E) && chooseShovel(a)) return;
  if (canDo(a.person, 'chop') && wantsChop(a, E) && chooseChop(a)) return;
  if (canDo(a.person, 'cones') && wantsCones(a, E) && chooseCones(a, E)) return;
  if (a.person.temper === 'fidget') chooseFidget(a, E);
  else chooseCalm(a, E);
}

function placeAgent(a, E) {
  a.path = []; a.next = null;
  endWork(a); returnBucket(a);
  if (!isAwake(a.id, E.h)) { a.hidden = true; a.act = 'bed'; }
  else { a.hidden = false; a.act = null; a.x = rand(W * 0.2, W * 0.6); a.y = 160; a.mode = 'idle'; a.timer = rand(1, 5); }
}
function placeFolk(E) { for (const a of FOLK) placeAgent(a, E); }

function updateAgent(a, dt, E) {
  const aw = isAwake(a.id, E.h) && !E.wet;
  a.anim += dt;
  a.blinkT -= dt; if (a.blinkT <= 0) { a.blink = 0.14; a.blinkT = rand(2.5, 6); } if (a.blink > 0) a.blink -= dt;
  if (a.hidden) {
    if (aw) { a.hidden = false; a.x = L.doorX; a.y = L.cabin.base; a.face = 1; a.act = null; go(a, L.doorX + rand(8, 40), pickLine(), 'idle', rand(2, 5), null); }
    return;
  }
  if (!aw && a.act !== 'bed') { a.act = 'bed'; endWork(a); go(a, L.doorX, L.cabin.base, 'hide', 0, 1); }
  if (a.mode === 'walk') {
    const p = a.path[0]; if (!p) { arrive(a); return; }
    const dx = p.x - a.x, dy = p.y - a.y, dist = Math.hypot(dx, dy), st = (SPEED_BY_AGE[a.person.age] || 11) * dt;
    if (Math.abs(dx) > 0.3) a.face = dx > 0 ? 1 : -1;
    if (dist <= st) { a.x = p.x; a.y = p.y; a.path.shift(); if (!a.path.length) arrive(a); }
    else { a.x += dx / dist * st; a.y += dy / dist * st; }
    return;
  }
  const need = ACTION_MODE[a.mode];   // the action was disabled while he is busy with it: he drops it and picks another
  if (need && !canDo(a.person, need)) { if (a.mode === 'cones') returnBucket(a); choose(a, E); return; }
  if (a.mode === 'build') updateBuilder(a, dt, E);
  if (a.mode === 'shovel') updateShoveler(a, dt);
  if (a.mode === 'chop') updateChopper(a, dt, E);
  if (a.mode === 'cones') updateConeKid(a, dt, E);
  a.timer -= dt; if (a.timer <= 0) choose(a, E);
}

// Sprites are assembled from layers (layers.js) and cached by look and season.
const _spriteCache = new Map();
function spriteOf(p, season) {
  const sz = season === 'winter' ? 'winter' : 'summer', key = [p.age, p.height, p.hairstyle, p.outfit, p.bottomKind, p.sleeves, p.hat, sz].join('|');
  let s = _spriteCache.get(key); if (!s) { s = composeSprite(p, sz); _spriteCache.set(key, s); }
  return s;
}
function drawAgent(g, a, E) {
  if (a.hidden) return;
  const set = spriteOf(a.person, E.season), pal = layerPalette(a.person);
  if (a.blink > 0) pal.E = pal.S;
  let rows = set.idle, lift = 0;
  if (a.mode === 'walk') rows = [set.walkA, set.idle, set.walkB, set.idle][Math.floor(a.anim / (isChild(a.person) ? 0.12 : 0.16)) % 4];
  else if (a.mode === 'sit' || a.mode === 'pick') rows = set.sit;
  else if (a.mode === 'shovel') rows = a.bmove ? [set.walkA, set.idle, set.walkB, set.idle][Math.floor(a.anim / 0.16) % 4] : [set.idle, set.walkA][Math.floor(a.anim / 0.55) % 2];   // walks to the row; pushes the shovel
  else if (a.mode === 'build') rows = a.bmove ? [set.walkA, set.idle, set.walkB, set.idle][Math.floor(a.anim / 0.3) % 4] : (Math.floor(a.anim / 0.9) % 2 ? set.sit : set.idle);   // rolls the snowball walking; dresses — crouches, straightens
  else if (a.mode === 'chop') rows = a.bmove ? [set.walkA, set.idle, set.walkB, set.idle][Math.floor(a.anim / 0.16) % 4] : set.idle;   // swing and strike — arms only
  else if (a.mode === 'cones') rows = a.cn && a.cn.s === 'pick' ? set.sit : a.bmove ? [set.walkA, set.idle, set.walkB, set.idle][Math.floor(a.anim / 0.12) % 4] : set.idle;   // crouches at a cone
  else if (a.mode === 'play') { const ph = (a.anim * 2.2) % 3; if (ph < 1) lift = Math.round(Math.sin(ph * Math.PI) * 2); }
  const carrying = a.mode === 'shovel' || (a.mode === 'walk' && a.next && a.next.mode === 'shovel');
  const handsBusy = carrying || (a.mode === 'chop' && !isChild(a.person));
  if (handsBusy && !isChild(a.person) && rows.length >= 13) { rows = rows.slice(); const k = rows.length - 4; rows[k] = rows[k].replace(/S/g, '.'); }   // remove own hands at the hips: the shovel is held by hands at the shoulder
  const w = rows[0].length, half = Math.floor(w / 2), left = Math.round(a.x) - half, top = Math.round(a.y) - rows.length - lift;
  R(g, left, Math.round(a.y), w, 1, 'rgba(0,0,0,0.18)');
  rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = pal[c]; g.fillRect(a.face < 0 ? left + w - 1 - i : left + i, top + j, 1, 1); } });
  if (carrying) drawShovel(g, a, pal);
  if (a.mode === 'chop' && !isChild(a.person)) { if (a.logs) drawLogs(g, a, pal); else drawAxe(g, a, pal, a.ch ? chopPose(a.ch) : 'low'); }
  if (isChild(a.person) && hasBucket(a)) drawKidBucket(g, a, set, rows, left, w);
  if (a.mode === 'pick' && !isChild(a.person)) {
    const bx = Math.round(a.x) + (a.face > 0 ? half + 1 : -half - 4), y = Math.round(a.y);
    R(g, bx, y - 3, 4, 3, '#9a6b3c'); R(g, bx, y - 3, 4, 1, '#b8854c'); R(g, bx + 1, y - 5, 2, 1, '#9a6b3c'); R(g, bx, y - 4, 1, 1, '#9a6b3c'); R(g, bx + 3, y - 4, 1, 1, '#9a6b3c');
    R(g, bx + 1, y - 4, 2, 1, E.season === 'autumn' ? '#c0282d' : '#3b4f9e');
  }
}

// Rebuilds FOLK from the current window.FAMILY.
// Called after the family is loaded from a file.
function rebuildFolk() {
  FOLK.length = 0;
  for (const p of window.FAMILY) FOLK.push(agent(p, SPEED_BY_AGE[p.age] || 11));
  BY_ID = {};
  for (const a of FOLK) BY_ID[a.id] = a;
  placeFolk(env());
}