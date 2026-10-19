// Firewood. A woodshed to the left of the house and a chopping block a bit in front. An adult chops wood (mode 'chop') when there is room in the woodshed and it isn't summer:
// puts a log on the block, swings and strikes, the halves fly apart; having collected an armful, carries it to the woodshed (it grows) or puts it
// into the fire (the flame flares up). Wood is consumed while the fire burns and the stove smokes. Only one adult chops at a time.
const WOOD_KEY = 'forest.wood.v1';
const PILE_MAX = 17;   // log ends in the woodshed: 6 + 5 + 6 in three rows
const WOOD = { pieces: [], logOn: false, flare: 0, pile: 6, use: 0, loaded: false };   // pile — how many logs are in the woodshed, use — accumulated consumption, pieces — halves on the ground, logOn — a log on the block, flare — seconds of bright fire flare-up
const woodSeason = E => E.season === 'autumn' || E.season === 'late';   // for cones
const woodSave = () => { try { localStorage.setItem(WOOD_KEY, JSON.stringify({ p: WOOD.pile })); } catch (e) {} };
const woodSite = (x, wa) => Math.abs(x - (L.cabin.x - 4)) < 12 + wa / 2;   // woodshed and block spot: no sitting and berry picking next to it
const CHOP_STAND = () => ({ x: L.block.x + 9, y: L.block.y });             // the adult stands to the right of the block and faces it
const PILE_SPOT = () => ({ x: L.pile.x + L.pile.w + 2, y: 146 });          // puts the armful by the woodshed
const FIRE_SPOT = () => ({ x: L.fireX - 12, y: 160 });

// Log ends in the woodshed from bottom up: bottom row 6, middle 5, top 6.
function pileSlots() {
  const p = L.pile, out = [];
  for (const k of [2, 1, 0]) for (let i = 0; i < (k === 1 ? 5 : 6); i++) out.push({ x: p.x + i * 2 + (k % 2), y: p.base - 6 + k * 2, row: k });
  return out;
}
// Woodshed: two uprights and log ends, as many as there are (drawn every frame because the number of logs changes); in winter snow on the top row.
function drawPile(g, S) {
  const p = L.pile, slots = pileSlots(), n = Math.min(PILE_MAX, WOOD.pile);
  R(g, p.x - 1, p.base - 7, 1, 7, '#5e4129'); R(g, p.x + p.w, p.base - 7, 1, 7, '#5e4129');
  for (let j = 0; j < n; j++) {
    const { x, y } = slots[j];
    R(g, x, y, 1, 1, '#d2ab7a'); R(g, x + 1, y, 1, 1, '#a9794a'); R(g, x, y + 1, 1, 1, '#8a5a36'); R(g, x + 1, y + 1, 1, 1, '#6b4a2f');
  }
  if (S.snow && n > 0) { const top = slots[n - 1], cnt = slots.slice(0, n).filter(s => s.row === top.row); R(g, cnt[0].x, top.y - 1, cnt.length * 2, 1, '#eef3f8'); }
  R(g, p.x - 1, p.base, p.w + 3, 1, 'rgba(0,0,0,0.18)');
}
// Chopping block: a stump with an end on top, in winter with a cap of snow.
function chopBlock(g, S) {
  const x = L.block.x, y = L.block.y;
  R(g, x - 3, y - 3, 7, 3, '#7a5230'); R(g, x - 2, y - 3, 1, 3, '#5e4129'); R(g, x + 2, y - 2, 1, 2, '#5e4129');
  R(g, x - 3, y - 4, 7, 1, S.snow ? '#eef3f8' : '#c9a27a'); if (!S.snow) R(g, x - 1, y - 4, 3, 1, '#a9794a');
  R(g, x - 3, y, 8, 1, 'rgba(0,0,0,0.18)');
}

// Axe pose: the handle goes from the hand to the butt at the end; everything above and below the shoulder is counted from sy (shoulder height by growth).
function drawAxe(g, a, pal, pose) {
  const f = a.face, x = Math.round(a.x), y = Math.round(a.y);
  const dh = Math.max(-1, Math.min(1, +a.person.height || 0)), sy = -6 - dh;
  const px = (dx, dy, c) => R(g, x + f * dx, y + dy, 1, 1, c);
  const P = { low: [[3, sy + 1], [6, sy + 5]], mid: [[3, sy], [5, sy - 5]], up: [[3, sy - 1], [0, sy - 8]], hit: [[4, sy + 1], [8, -4]] }[pose];
  const [h, t] = P, n = Math.max(Math.abs(t[0] - h[0]), Math.abs(t[1] - h[1])), pts = [];
  for (let k = 0; k <= n; k++) pts.push([Math.round(h[0] + (t[0] - h[0]) * k / n), Math.round(h[1] + (t[1] - h[1]) * k / n)]);
  for (const [dx, dy] of pts) px(dx, dy, '#d3a867');                      // handle (light: on autumn ground a dark one blends in)
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) px(t[0] + dx, t[1] + dy, '#b9c2cd');   // axe head
  px(h[0], h[1], pal.S); px(pts[Math.min(1, n)][0] + (pose === 'up' ? 0 : 0), pts[Math.min(1, n)][1], pal.S);   // two hands at the shoulder
}
// An armful of logs at the chest, two hands under it.
function drawLogs(g, a, pal) {
  const f = a.face, x = Math.round(a.x), y = Math.round(a.y), dh = Math.max(-1, Math.min(1, +a.person.height || 0)), sy = -6 - dh;
  const px = (dx, dy, c) => R(g, x + f * dx, y + dy, 1, 1, c);
  for (let i = 0; i < 4; i++) { px(3 + i, sy + 1, '#c9a27a'); px(3 + i, sy + 2, '#9a6b3c'); }
  px(3, sy + 3, pal.S); px(5, sy + 3, pal.S);
}
// Axe pose by the chopping state.
const chopPose = C => C.s === 'raise' ? (C.t < 0.25 ? 'mid' : 'up') : C.s === 'strike' ? 'hit' : 'low';

function endWork(a) {   // abandoned the job: firewood and cones don't get stuck
  if (a.ch) { a.ch = null; WOOD.logOn = false; WOOD.pieces.length = 0; }
  a.logs = false;
  if (typeof releaseCones === 'function') releaseCones(a);
}
const choppers = a => !a.hidden && (a.mode === 'chop' || (a.mode === 'walk' && a.next && a.next.mode === 'chop'));
const pileHasRoom = () => WOOD.pile <= PILE_MAX - 4;   // an armful is four to eight logs
function wantsChop(a, E) {
  if (!isGrownUp(a.person) || E.season === 'summer' || E.wet || !pileHasRoom() || FOLK.some(b => b !== a && choppers(b))) return false;
  return Math.random() < (a.mode === 'chop' ? 0.8 : 0.25);
}
function chooseChop(a) { const s = CHOP_STAND(); a.ch = null; a.logs = false; go(a, s.x, 160, 'chop', rand(60, 120), -1); return true; }

function fireBurst(n) { for (let i = 0; i < n; i++) P.sparks.push({ x: L.fireX + rand(-2, 2), y: 152, vx: rand(-8, 8), vy: rand(-34, -14), life: rand(0.7, 1.4) }); }
function splitLog() {
  const x = L.block.x, gy = L.block.y + 1;
  for (const d of [-1, 1]) WOOD.pieces.push({ x: x + d, y: L.block.y - 5, vx: d * rand(14, 24), vy: rand(-45, -30), gy: gy + Math.round(rand(0, 2)), lie: false });
  if (WOOD.pieces.length > 16) WOOD.pieces.splice(0, WOOD.pieces.length - 16);
}
function updateWood(dt, E) {
  if (!WOOD.loaded) { WOOD.loaded = true; try { const o = JSON.parse(localStorage.getItem(WOOD_KEY) || 'null'); if (o && isFinite(o.p)) WOOD.pile = Math.max(0, Math.min(PILE_MAX, Math.round(o.p))); } catch (e) {} }
  const burn = (E.season !== 'summer' ? 1 / 2400 : 0) + (E.fireLit ? 1 / 1500 : 0);   // stove: a log per 40 minutes, fire: per 25
  WOOD.use += burn * dt;
  if (WOOD.use >= 1) { WOOD.use -= 1; if (WOOD.pile > 0) { WOOD.pile--; woodSave(); } }
  if (WOOD.flare > 0) WOOD.flare -= dt;
  for (const p of WOOD.pieces) if (!p.lie) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 150 * dt; if (p.y >= p.gy) { p.y = p.gy; p.lie = true; } }
}

// The adult's work in mode 'chop'; called from updateAgent every frame.
function updateChopper(a, dt, E) {
  a.bmove = false;
  const C = a.ch = a.ch || { s: 'goto', t: 0, n: 0, goal: 5 + Math.floor(Math.random() * 4), toFire: false };
  const stepTo = (tx, ty, sp) => {
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy); if (d < 0.6) return true;
    const st = Math.min(d, sp * dt); a.x += dx / d * st; a.y += dy / d * st; a.bmove = true; if (Math.abs(dx) > 0.3) a.face = dx > 0 ? 1 : -1; return false;
  };
  const stand = CHOP_STAND();
  if (C.s === 'goto') { if (stepTo(stand.x, stand.y, 9)) { a.face = -1; C.s = 'place'; C.t = 0; } return; }
  C.t += dt;
  if (C.s === 'place') { a.face = -1; WOOD.logOn = true; if (C.t >= 0.5) { C.s = 'raise'; C.t = 0; } }
  else if (C.s === 'raise') { if (C.t >= 0.5) { C.s = 'strike'; C.t = 0; } }
  else if (C.s === 'strike') { if (C.t >= 0.16) { splitLog(); WOOD.logOn = false; C.n++; C.s = 'rest'; C.t = 0; } }
  else if (C.s === 'rest') { if (C.t >= 0.4) { C.s = C.n >= C.goal ? 'collect' : 'place'; C.t = 0; } }
  else if (C.s === 'collect') {   // gathers the halves into an armful
    if (C.t >= 0.6) { WOOD.pieces.length = 0; a.logs = true; C.toFire = (E.fireLit || E.h > 13) && Math.random() < 0.35; C.s = 'carry'; }
  } else if (C.s === 'carry') {
    const tg = C.toFire ? FIRE_SPOT() : PILE_SPOT();
    if (stepTo(tg.x, tg.y, 9)) { a.face = C.toFire ? 1 : -1; C.s = 'put'; C.t = 0; }
  } else if (C.s === 'put') {   // puts the armful down
    if (C.t >= 0.4 && a.logs) { a.logs = false; if (C.toFire) WOOD.flare = 1.2; else { WOOD.pile = Math.min(PILE_MAX, WOOD.pile + C.n); woodSave(); } }
    if (C.t >= 0.9) {
      if (!pileHasRoom() || E.wet) { a.mode = 'idle'; a.timer = rand(4, 10); a.ch = null; return; }   // woodshed is full: enough
      C.n = 0; C.goal = 5 + Math.floor(Math.random() * 4); C.s = 'goto';
    }
  }
}

// What firewood adds to the depth-sorted object list: the woodshed (number of logs changes), a log on the block and halves on the ground.
function woodItems(S) {
  const o = [{ y: L.pile.base + 0.3, x: L.pile.x, d: c => drawPile(c, S) }];
  if (WOOD.logOn) o.push({ y: L.block.y - 0.1, x: L.block.x, d: c => { R(c, L.block.x - 1, L.block.y - 8, 3, 4, '#9a6b3c'); R(c, L.block.x - 1, L.block.y - 8, 3, 1, '#c9a27a'); } });
  for (const p of WOOD.pieces) o.push({ y: p.gy, x: p.x, d: c => { const x = Math.round(p.x), y = Math.round(p.y); if (p.lie) { R(c, x - 1, y - 1, 3, 1, '#9a6b3c'); R(c, x - 1, y - 2, 2, 1, '#c9a27a'); } else { R(c, x, y - 3, 2, 3, '#9a6b3c'); R(c, x, y - 3, 2, 1, '#c9a27a'); } } });
  return o;
}