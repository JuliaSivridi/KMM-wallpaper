// Snowman. In winter a child builds it (mode 'build'): rolls back and forth over the snow first a big ball, then a medium one, then
// a small one (SNOW_PH: 5 / 3 / 1 minute), rolls each ball to the spot and puts it down; then dresses the snowman (scarf, arms, hat).
// v — how much is done (0…4): whole ball parts 1/2/3; after 3 comes the dressing (scarf from 3.4, arms and buttons from 3.7, hat at 4).
// The snowman is built by one child from start to finish: whoever started is the owner, others don't help and don't finish it for him.
// Building is possible while the snow is wet: from −5° to +4°. Melting starts at +5°, and the warmer it is, the faster.
// Melting is melt (0…1): first the decor falls off (hat, scarf, arms, face), then the snowman loses shape and turns into a mound
// (triangle), and the mound shrinks to zero. If it gets cold again, the mound stays; the child builds a new one when melt ≥ SNOW_RUINED.
const SNOW_KEY = 'forest.snowman.v1';
const SNOW_PAL = { W: '#f8fbff', w: '#aebfd6', k: '#1c1c22', O: '#e8742a', R: '#c0392b', b: '#6b4a2f', h: '#2f3342' };
const SNOW_PH = [{ d: 300, r: 3.4 }, { d: 180, r: 2.4 }, { d: 60, r: 1.4 }];   // how many seconds to roll the ball (5 / 3 / 1 minute) and its final radius
const SNOW_DRESS = 12;      // seconds for scarf, arms and hat
const SNOW_ROLL_SPEED = 7;  // px/s, how fast the ball rolls
const SNOW_T_MIN = -5, SNOW_T_MAX = 4, SNOW_T_MELT = 5;   // builds from −5° to +4°, melts from +5°
const SNOW_RUINED = 0.35;   // melt level at which the snowman has settled and a child can build a new one
let SNOW = null, _snowLoaded = false, _snowFloor = -1, _snowWinter = false;   // SNOW = { v, melt, w (seconds on the current ball), ballX, dir, turn, owner (child id) }
// Snowman owner: the one who started. If he is not in the family (removed), another child can take the snowman.
const snowRuined = S => !!S && (S.melt || 0) >= SNOW_RUINED;
const snowOwnerOk = (S, a) => !S || !S.owner || S.owner === a.id || !BY_ID[S.owner] || snowRuined(S);

// Stands to the left of the biggest front-ground boulder; goes around other boulders (on a light stone a white snowman disappears).
function snowX() {
  const rocks = L.rocks.filter(r => r.y >= 150), big = rocks.reduce((m, r) => r.rx > m.rx ? r : m, rocks[0]);
  const ok = x => x > W * 0.06 && x < W - 14 && !rocks.some(r => r !== big && Math.abs(r.x - x) < r.rx + 9);
  return [14, 26, 38].map(d => big.x - big.rx - d).find(ok) || Math.min(W - 14, L.fireX + 52);
}
const snowAway = () => snowX() > L.fireX ? 1 : -1;   // which side of the snowman the lane for balls goes
// Snowman's spot and the lane for balls: in winter you can't pick a place there to sit or pick berries.
const snowSite = (x, wa) => _snowWinter && Math.abs(x - snowX()) < wa / 2 + 5;
const snowLane = x => { if (!_snowWinter) return false; const u = (x - snowX()) * snowAway(); return u > 8 && u < 66; };
const snowTemp = E => (E.wx && typeof E.wx.temp === 'number') ? E.wx.temp : null;   // no temperature data (no network, manual weather) — doesn't interfere
const snowWorkable = E => { const t = snowTemp(E); return E.season === 'winter' && (t === null || (t >= SNOW_T_MIN && t <= SNOW_T_MAX)); };
const snowMeltRate = E => { const t = snowTemp(E); return E.season !== 'winter' ? 0.3 : (t !== null && t >= SNOW_T_MELT) ? 0.0044 * Math.min(8, Math.max(1, t - 4)) : 0; };
const snowBallR = S => { const ph = SNOW_PH[Math.floor(S.v)]; return ph ? 0.5 + (ph.r - 0.5) * Math.min(1, S.w / ph.d) : 0; };
const snowBallPx = S => Math.max(1, Math.round(snowBallR(S)));

const snowKey = () => Math.floor(SNOW.v) * 100 + Math.floor((SNOW.melt || 0) * 20);   // what changed since the last save
function snowSave() {
  try { if (SNOW) localStorage.setItem(SNOW_KEY, JSON.stringify({ v: SNOW.v, m: SNOW.melt || 0, t: Date.now(), o: SNOW.owner || null })); else localStorage.removeItem(SNOW_KEY); } catch (e) {}
}
function updateSnowman(dt, E) {
  _snowWinter = E.season === 'winter';
  if (!_snowLoaded) {   // after a restart the snowman returns if it is still winter
    _snowLoaded = true;
    try { const o = JSON.parse(localStorage.getItem(SNOW_KEY) || 'null'); if (o && o.v > 0 && Date.now() - o.t < 100 * 864e5 && E.season === 'winter') SNOW = { v: Math.min(4, +o.v), melt: +o.m || 0, w: 0, ballX: null, dir: 1, owner: o.o || null }; } catch (e) {}
    _snowFloor = SNOW ? snowKey() : -1;
  }
  const melt = snowMeltRate(E);
  if (SNOW && melt > 0) { SNOW.melt = (SNOW.melt || 0) + melt / 4 * dt; SNOW.ballX = null; if (SNOW.melt >= 1) SNOW = null; }   // melt / 4: rate as fractions of the snowman
  const cur = SNOW ? snowKey() : -1;
  if (cur !== _snowFloor) { _snowFloor = cur; snowSave(); }
}

// Someone (besides a) stands or sits at the snowman's spot: the ball can't be placed.
const snowSiteBusy = a => { const sx = snowX(); return FOLK.some(b => b !== a && !b.hidden && b.mode !== 'walk' && b.mode !== 'build' && Math.abs(b.y - MAIN_LINE) < SPOT_DY + 0.5 && Math.abs(b.x - sx) < spriteW(b) / 2 + 6); };

// Child's work in mode 'build'; called from updateAgent every frame.
function updateBuilder(a, dt, E) {
  a.bmove = false;
  if (!snowWorkable(E)) return;
  if (snowRuined(SNOW)) SNOW = null;   // settled — builds anew
  const S = SNOW = SNOW || { v: 0, melt: 0, w: 0, ballX: null, dir: 1 }, sx = snowX(), aw = snowAway();
  if (S.v >= 4 || !snowOwnerOk(S, a)) return;
  S.owner = a.id; S.melt = 0;   // a slightly melted one he patches up
  const stepTo = (tx, sp) => { const d = tx - a.x; if (Math.abs(d) < 0.5) return true; a.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt); a.face = Math.sign(d); a.bmove = true; return false; };
  if (S.v >= 3) {   // the head is in place: dresses the snowman, standing next to it
    if (Math.abs(a.x - sx) > 24 || !stepTo(sx + aw * 10, 9)) return;
    a.face = -aw; S.v = Math.min(4, S.v + dt / SNOW_DRESS);
    return;
  }
  if (S.v % 1) S.v = Math.floor(S.v);
  const ph = SNOW_PH[S.v], far = Math.max(30, Math.min(56, aw > 0 ? W - 10 - sx : sx - 10)), near = 18;
  if (S.ballX == null) {   // no ball: steps away from the snowman to the start of the lane and takes a new lump of snow
    if (!stepTo(sx + aw * 26, 9)) return;
    S.w = 0; S.dir = aw; S.ballX = a.x + aw * 4; S.turn = 0;
    return;
  }
  const behind = snowBallPx(S) + 3;
  if (S.turn > 0) {   // turn: goes around the ball and takes the other side
    S.turn -= dt; stepTo(S.ballX - S.dir * behind, 30); a.face = S.dir; return;
  }
  const deliver = S.w >= ph.d;   // the ball is ready: rolls it to the snowman
  if (deliver) {
    S.dir = Math.sign(sx - S.ballX) || aw;
    if ((S.ballX - sx) * aw <= 9 && snowSiteBusy(a)) return;   // spot taken: waits until they leave
  }
  S.ballX += S.dir * SNOW_ROLL_SPEED * dt;
  if (deliver) {
    if ((S.ballX - sx) * aw <= 0.5) { S.v = Math.floor(S.v) + 1; S.ballX = null; return; }   // ball is in place
  } else {
    S.w += dt;
    const u = (S.ballX - sx) * aw;
    if (u >= far || u <= near) { S.ballX = sx + aw * Math.min(far, Math.max(near, u)); S.dir = -S.dir; S.turn = 0.5; }
  }
  a.face = S.dir; a.x = S.ballX - S.dir * (snowBallPx(S) + 3); a.bmove = true;
}

// Does the child want to build: winter, no downpour, wet snow, the snowman is not finished and is not someone else's. More willing to finish what was started.
function wantsSnowman(a, E) {
  if (!isChild(a.person) || E.wet || !snowWorkable(E) || (SNOW && SNOW.v >= 4 && !snowRuined(SNOW)) || !snowOwnerOk(SNOW, a)) return false;
  return Math.random() < (a.mode === 'build' ? 0.85 : 0.3);
}
// Goes to the work spot: to the ball (behind it), to the start of the lane, or to the snowman to dress it. No spot — false.
function chooseSnowman(a) {
  const sx = snowX(), aw = snowAway(), S = SNOW;
  let x;
  if (S && S.v >= 3) { const xs = [sx + aw * 10, sx - aw * 10]; let i = 0; x = freeSpot(a, () => xs[i++], xs.length, true); }
  else if (S && S.ballX != null) x = S.ballX - S.dir * (snowBallPx(S) + 3);
  else x = sx + aw * 26;
  if (x === null || x === undefined) return false;
  if (snowRuined(SNOW)) SNOW = null;   // clears away the mound of the previous snowman
  SNOW = SNOW || { v: 0, melt: 0, w: 0, ballX: null, dir: 1 }; SNOW.owner = a.id;   // from this minute the snowman is his
  go(a, clamp(x, W * 0.03, W * 0.97), 160, 'build', rand(60, 120), sx > x ? 1 : -1);
  return true;
}

// A white ball of radius r with a thin shadow along the bottom-right edge: the same circle shifted one pixel up-left stays white.
function snowBall(g, cx, cy, r) {
  const half = (dy, rr) => Math.floor(Math.sqrt(Math.max(0, rr * rr - dy * dy + 0.5)));
  for (let dy = -r; dy <= r; dy++) {
    const h = half(dy, r), hy = dy + 1, hh = hy >= -r && hy <= r ? half(hy, r) : -1;   // the same row of the shifted circle
    for (let dx = -h; dx <= h; dx++) { const lit = hh >= 0 && Math.abs(dx + 1) <= hh; R(g, cx + dx, cy + dy, 1, 1, lit ? SNOW_PAL.W : SNOW_PAL.w); }
  }
}
// Half the width of a circle of radius r at distance dy from the center (same rule as disc in util.js).
const snowHalf = (dy, r) => Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy + 0.5)));
// Profile of the assembled snowman: half-width at each height h from the ground (−1 — empty) for n assembled parts.
function snowProfile(n) {
  const out = [];
  for (let h = 0; h <= 12; h++) {
    let hw = -1;
    if (h <= 6) hw = Math.max(hw, snowHalf(h - 3, 3));                    // bottom ball, heights 0…6
    if (n >= 2 && h >= 6 && h <= 10) hw = Math.max(hw, snowHalf(h - 8, 2)); // medium, 6…10
    if (n >= 3 && h >= 10) hw = Math.max(hw, 1);                           // head 3×3, 10…12
    out.push(hw);
  }
  return out;
}
// The snowman is drawn as circles, like the ball being rolled: the same ball becomes the bottom, the middle, or the head.
// When melting (melt): the hat falls off (0.08), the scarf (0.16), the arms (0.24), the face (0.32) and lie on the ground; from 0.35 the snowman loses its shape,
// turning into a triangular mound (t), from 0.55 the mound shrinks (u), and around 1 it disappears together with the fallen bits.
function drawSnowman(g) {
  const v = SNOW.v, m = SNOW.melt || 0, n = Math.min(3, Math.floor(v)), cx = Math.round(snowX()), C = SNOW_PAL;
  R(g, cx - 3, 160, 7, 1, 'rgba(0,0,0,0.18)');
  if (m < SNOW_RUINED) {
    const ball = (cy, r) => snowBall(g, cx, cy, r);
    ball(156, 3);                                                      // bottom ball, rows 153…159
    if (n >= 2) ball(151, 2);                                          // medium, 149…153
    if (n >= 3) {                                                      // head 3×3, 147…149
      R(g, cx - 1, 147, 3, 3, C.W);
      if (m < 0.32) { R(g, cx - 1, 148, 1, 1, C.k); R(g, cx + 1, 148, 1, 1, C.k); R(g, cx, 149, 3, 1, C.O); }   // eyes and nose
    }
    if (v >= 3.4 && m < 0.16) { R(g, cx - 2, 150, 5, 1, C.R); R(g, cx + 2, 151, 1, 1, C.R); }   // scarf
    if (v >= 3.7 && m < 0.24) {                                        // twig arms and buttons
      R(g, cx - 4, 150, 1, 2, C.b); R(g, cx - 3, 151, 1, 1, C.b); R(g, cx + 3, 151, 2, 1, C.b); R(g, cx + 4, 152, 1, 1, C.b);
      R(g, cx, 152, 1, 1, C.k); R(g, cx, 155, 1, 1, C.k);
    }
    if (v >= 4 && m < 0.08) { R(g, cx - 1, 146, 3, 1, C.h); R(g, cx - 2, 147, 5, 1, C.h); }   // brimmed hat
  } else {
    snowMound(g, cx, n, m);
  }
  if (m > 0.05 && m < 0.97) {   // the fallen bits lie on the ground nearby until everything melts
    if (v >= 4 && m >= 0.08) { R(g, cx - 9, 159, 3, 1, C.h); R(g, cx - 8, 158, 1, 1, C.h); }              // hat
    if (v >= 3.4 && m >= 0.16) R(g, cx + 6, 159, 3, 1, C.R);                                               // scarf
    if (v >= 3.7 && m >= 0.24) { R(g, cx - 12, 159, 2, 1, C.b); R(g, cx + 11, 159, 2, 1, C.b); }           // twigs
    if (n >= 3 && m >= 0.32) { R(g, cx + 9, 159, 2, 1, C.O); R(g, cx - 6, 159, 1, 1, C.k); R(g, cx - 5, 160, 1, 1, C.k); }   // nose and coals
  }
  if (m > 0.2) R(g, cx - Math.round(2 + 3 * Math.min(1, (m - 0.2) * 1.5)), 160, 2 * Math.round(2 + 3 * Math.min(1, (m - 0.2) * 1.5)) + 1, 1, 'rgba(120,150,190,0.4)');   // puddle
}
// Mound: the snowman's profile smoothly turns into a triangle (t), then the triangle shrinks (u). Shadow along the bottom-right edge, like on the balls.
function snowMound(g, cx, n, m) {
  const W0 = snowProfile(n), t = Math.min(1, Math.max(0, (m - SNOW_RUINED) / 0.2)), u = Math.min(1, Math.max(0, (m - 0.55) / 0.45)), s = 1 - u;
  const Hc = (n === 1 ? 6 : 9) * s, Bw = (n === 1 ? 3 : 4) * s, hw = [];
  for (let h = 0; h <= 12; h++) {
    const a = W0[h], c = h < Hc ? Math.round(Bw * (1 - h / Hc)) : -1;
    hw.push(Math.round(a + (c - a) * t));
  }
  for (let h = 0; h <= 12; h++) {
    if (hw[h] < 0) continue;
    for (let dx = -hw[h]; dx <= hw[h]; dx++) {
      const lit = h >= 1 && hw[h - 1] >= 0 && Math.abs(dx + 1) <= hw[h - 1];   // like on the ball: lit if the cell below-right is also snow
      R(g, cx + dx, 159 - h, 1, 1, lit ? SNOW_PAL.W : SNOW_PAL.w);
    }
  }
}
// The ball the child is rolling: a circle that grows from a lump to the needed size.
function drawBall(g) {
  const S = SNOW, r = snowBallPx(S), cx = Math.round(S.ballX), cy = 160 - r - 1;
  R(g, cx - r, 160, 2 * r + 1, 1, 'rgba(0,0,0,0.18)');
  snowBall(g, cx, cy, r);
}
// What the snowman adds to the depth-sorted object list.
function snowItems() {
  const o = [];
  if (!SNOW) return o;
  if (Math.floor(SNOW.v) >= 1) o.push({ y: 159.5, x: snowX(), d: c => drawSnowman(c) });
  if (SNOW.ballX != null && SNOW.v < 3) o.push({ y: 159.7, x: SNOW.ballX, d: c => drawBall(c) });
  return o;
}