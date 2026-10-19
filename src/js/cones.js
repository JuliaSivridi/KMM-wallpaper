// Cones. In autumn a cone now and then falls from a pine (bounces once) and lies on the ground. A child collects them into a bucket
// (mode 'cones'): takes the single bucket from the porch, walks the forest, crouches by a cone, puts it in the bucket. Having collected six, he carries
// it to the fire and throws them into the fire (sparks fly); if the fire is not lit, he carries the bucket of cones back to the porch, and in the evening
// takes it and throws the cones into the fire. There is only one bucket: either on the porch or with the child.
const CONES = [], THROWN = [];                  // CONES — cones on the ground and in flight
const BUCKET = { at: 'porch', n: 0 };           // at — 'porch' or the id of the child carrying it; n — cones in the bucket
let _coneInit = false, _coneT = 20;
const CONE_MAX = 20, BUCKET_FULL = 6;
const PORCH_SPOT = () => ({ x: L.doorX + 9, y: L.cabin.base + 4 });   // the child takes and leaves the bucket here
// Where the child stands when throwing cones: in front of the fire, a few pixels below those sitting on the logs, and farther from the people.
function fireKidSpot(a) {
  const others = FOLK.filter(b => b !== a && !b.hidden);
  let best = { x: L.fireX, y: 168 }, bs = -1;
  for (const dx of [0, -8, 8, -16, 16]) {
    const sc = others.length ? Math.min(...others.map(b => Math.abs(spotX(b) - (L.fireX + dx)))) : 99;
    if (sc > bs + 2) { bs = sc; best = { x: L.fireX + dx, y: 168 }; }
  }
  return best;
}
const hasBucket = a => BUCKET.at === a.id;
function returnBucket(a) { if (hasBucket(a)) BUCKET.at = 'porch'; }   // went to sleep or inside from the rain: left the bucket by the door

function spawnCone(lying) {
  const trees = L.trees.filter(t => t.type === 'p' && t.base >= 146 && t.x > 12 && t.x < W - 12 && !woodSite(t.x, 6) && Math.abs(t.x - L.fireX) > 24);
  if (!trees.length) return;
  const t = trees[Math.floor(Math.random() * trees.length)], gy = Math.round(rand(t.base + 1, Math.min(158, t.base + 8))), x = t.x + rand(-6, 6);
  if (L.rocks.some(o => Math.abs(x - o.x) < o.rx + 2 && gy > o.y - o.ry - 2 && gy < o.y + o.ry + 2)) return;   // cones don't lie on a boulder
  CONES.push({ x, y: lying ? gy : crownY(t), gy, state: lying ? 'lie' : 'fall', vy: 0, bounced: false, claim: null });
}
function releaseCones(a) { for (const c of CONES) if (c.claim === a.id) c.claim = null; }

function updateCones(dt, E) {
  if (!woodSeason(E)) { CONES.length = 0; THROWN.length = 0; BUCKET.at = 'porch'; BUCKET.n = 0; _coneInit = false; return; }
  if (BUCKET.at !== 'porch' && !BY_ID[BUCKET.at]) BUCKET.at = 'porch';   // the bucket's owner was removed from the family
  if (!_coneInit) { _coneInit = true; for (let i = 0; i < 6; i++) spawnCone(true); }   // by the start of autumn something is already lying there
  _coneT -= dt;
  if (_coneT <= 0) { if (!E.wet && CONES.length < CONE_MAX) spawnCone(false); _coneT = rand(20, 50); }
  for (const c of CONES) if (c.state === 'fall') {
    c.y += c.vy * dt; c.vy += 140 * dt;
    if (c.y >= c.gy) { c.y = c.gy; if (!c.bounced) { c.bounced = true; c.vy = -32; } else { c.state = 'lie'; c.vy = 0; } }
  }
  for (let i = CONES.length - 1; i >= 0; i--) if (CONES[i].dead) CONES.splice(i, 1);
  for (let i = THROWN.length - 1; i >= 0; i--) { const s = THROWN[i]; s.t += dt; if (s.t >= s.dur) { THROWN.splice(i, 1); fireBurst(6); WOOD.flare = Math.max(WOOD.flare, 0.7); } }
}

const lyingCone = (c, a) => c.state === 'lie' && !c.dead && (!c.claim || c.claim === a.id);
const lyingCount = a => CONES.filter(c => lyingCone(c, a)).length;
const nearestCone = a => {
  let best = null, bd = Infinity;
  for (const c of CONES) if (lyingCone(c, a)) { const d = Math.abs(c.x - a.x) + Math.abs(c.y - a.y) * 0.5; if (d < bd) { bd = d; best = c; } }
  if (best) best.claim = a.id;
  return best;
};
// Does the child want to collect cones: autumn, no downpour; the bucket is with him or standing on the porch, and there is something to collect or throw into the fire.
function wantsCones(a, E) {
  if (!isChild(a.person) || !woodSeason(E) || E.wet) return false;
  const mine = hasBucket(a);
  if (!mine && BUCKET.at !== 'porch') return false;
  const can = mine || (BUCKET.n < BUCKET_FULL ? lyingCount(a) >= BUCKET_FULL - BUCKET.n : E.fireLit);   // goes collecting only when enough has fallen for a full bucket
  return can && Math.random() < (a.mode === 'cones' ? 0.85 : mine ? 0.6 : 0.3);
}
// Goes for the bucket to the porch or, if he already has it, continues with it.
function chooseCones(a, E) {
  releaseCones(a);
  if (hasBucket(a)) { a.cn = { s: 'plan', t: 0, cone: null }; go(a, clamp(a.x, W * 0.05, W * 0.95), 160, 'cones', rand(60, 120), a.face); }
  else { a.cn = { s: 'fetch', t: 0, cone: null }; go(a, PORCH_SPOT().x, 160, 'cones', rand(60, 120), 1); }
  return true;
}

// The child's work in mode 'cones'; called from updateAgent every frame.
function updateConeKid(a, dt, E) {
  a.bmove = false;
  const K = a.cn = a.cn || { s: hasBucket(a) ? 'plan' : 'fetch', t: 0, cone: null };
  const stepTo = (tx, ty, sp) => {
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy); if (d < 0.8) return true;
    const st = Math.min(d, sp * dt); a.x += dx / d * st; a.y += dy / d * st; a.bmove = true; if (Math.abs(dx) > 0.3) a.face = dx > 0 ? 1 : -1; return false;
  };
  if (K.s === 'fetch') { const g = PORCH_SPOT(); if (stepTo(g.x, g.y, 10)) { a.face = -1; K.s = 'take'; K.t = 0; } return; }
  if (K.s === 'plan') {   // what to do with the bucket: collect more (up to full), then throw the cones into the fire or carry them to the porch
    if (!hasBucket(a)) K.s = 'done';
    else if (BUCKET.n < BUCKET_FULL && lyingCount(a) > 0 && (BUCKET.n > 0 || lyingCount(a) >= BUCKET_FULL)) K.s = 'collect';   // collects first, until the bucket is full or the cones on the ground run out
    else if (E.fireLit && BUCKET.n > 0) { K.s = 'toFire'; K.spot = null; }
    else K.s = 'toPorch';
    a.timer = Math.max(a.timer, 10);   // doesn't abandon work mid-collection: the mode timer doesn't expire while he is on the way
    return;
  }
  if (K.s === 'collect') {
    let c = K.cone; if (!c || c.dead || c.state !== 'lie') c = K.cone = nearestCone(a);
    if (!c) { K.s = 'plan'; return; }
    if (stepTo(c.x, c.y, 10)) { K.s = 'pick'; K.t = 0; a.face = c.x >= a.x ? 1 : -1; }
    return;
  }
  K.t += dt;
  if (K.s === 'take') {   // takes the bucket
    if (K.t >= 0.6) { if (BUCKET.at === 'porch') BUCKET.at = a.id; K.s = 'plan'; }
  } else if (K.s === 'pick') {   // crouched, took the cone, put it in the bucket
    if (K.t >= 0.5 && K.cone && !K.cone.dead) { K.cone.dead = true; K.cone = null; BUCKET.n++; }
    if (K.t >= 1.0) K.s = 'plan';
  } else if (K.s === 'toFire') {
    if (!E.fireLit) { K.s = 'toPorch'; return; }
    const g = K.spot || (K.spot = fireKidSpot(a)); if (stepTo(g.x, g.y, 10)) { a.face = g.x <= L.fireX ? 1 : -1; K.s = 'throw'; K.t = 0; K.n = 0; }
  } else if (K.s === 'throw') {   // throws one cone at a time, they fly in an arc into the fire
    if (BUCKET.n > 0 && K.t >= 0.4 + K.n * 0.2) { THROWN.push({ x0: a.x + a.face * 3, y0: a.y - 6, t: 0, dur: 0.5 }); BUCKET.n--; K.n++; }
    if (BUCKET.n <= 0 && K.t >= 0.4 + K.n * 0.2 + 0.7) K.s = 'plan';
  } else if (K.s === 'toPorch') {
    const g = PORCH_SPOT(); if (stepTo(g.x, g.y, 10)) { a.face = -1; K.s = 'drop'; K.t = 0; }
  } else if (K.s === 'drop') {   // puts the bucket on the porch
    if (K.t >= 0.6) { returnBucket(a); K.s = 'done'; }
  } else if (K.s === 'done') { a.mode = 'idle'; a.timer = rand(3, 8); a.cn = null; }
}

// Bucket: 3 px wide, cones stick out on top (up to three in a row, the rest above).
function drawBucket(g, x, y, n) {
  R(g, x, y - 2, 3, 2, '#7f8ea6'); R(g, x, y - 1, 3, 1, '#5e6a7e'); R(g, x, y - 3, 3, 1, '#aab4c4');
  for (let i = 0; i < Math.min(n, 3); i++) R(g, x + i, y - 3, 1, 1, '#7a4a28');
  for (let i = 0; i < Math.min(Math.max(0, n - 3), 3); i++) R(g, x + i, y - 4, 1, 1, '#9a6034');
}
function drawCone(g, c) { const x = Math.round(c.x), y = Math.round(c.y); R(g, x, y - 1, 2, 1, '#6e3f20'); R(g, x, y - 2, 1, 1, '#9a6034'); }
// Bucket in the child's hand: hung on the front hand and a bit in front of it; with a crouching child it stands next to him on the ground.
function drawKidBucket(g, a, set, rows, left, w) {
  const tall = set.idle.length >= 11, crouch = rows === set.sit, yy = Math.round(a.y);
  if (crouch) return drawBucket(g, a.face > 0 ? left + w : left - 3, yy, BUCKET.n);
  const colF = tall ? 7 : 4, handDy = tall ? -4 : -3, hx = a.face > 0 ? left + colF : left + w - 1 - colF;
  drawBucket(g, a.face > 0 ? hx : hx - 2, yy + handDy + 4, BUCKET.n);
}
// What cones add to the depth-sorted object list: cones on the ground and in flight, the bucket on the porch, thrown cones.
function coneItems() {
  const o = [];
  for (const c of CONES) if (!c.dead) o.push({ y: c.gy, x: c.x, d: g => drawCone(g, c) });
  if (_coneInit && BUCKET.at === 'porch') o.push({ y: L.cabin.base + 0.6, x: L.doorX + 5, d: g => drawBucket(g, L.doorX + 4, L.cabin.base + 1, BUCKET.n) });
  for (const s of THROWN) { const k = s.t / s.dur, x = s.x0 + (L.fireX - s.x0) * k, y = s.y0 + (153 - s.y0) * k - Math.sin(k * Math.PI) * 9; o.push({ y: 160.2, x, d: g => R(g, x, y, 1, 2, '#7a4a28') }); }
  return o;
}