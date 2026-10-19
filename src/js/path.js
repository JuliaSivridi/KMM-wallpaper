// The path from the house in winter: it is covered by snowfall and cleared by adults (mode 'shovel').
// cover[i] — how much snow lies in row i (0 — bare ground, 1 — fully covered); row i is y = cabin.base + i, as in buildLand.
// A partially cleared or snowed-over row is drawn as a checkerboard of pixels (BAYER), so you can see the snow arriving and leaving.
// Outside winter the path is drawn statically in buildLand, and when switching to winter everything is covered.
const PATH_LEN = 19, SHOVEL_ROW = 2.2, SHOVEL_REACH = 12;   // SHOVEL_ROW — seconds per row; SHOVEL_REACH — how many px from the path center he stands
const PATH = { cover: Array(PATH_LEN).fill(1) };
const pathY = i => L.cabin.base + i;
const pathX = y => L.doorX - 2 + Math.round(Math.sin(y * 0.45));   // leftmost pixel of the path, width 4

function updatePath(dt, E) {
  const cv = PATH.cover;
  if (E.season !== 'winter') { cv.fill(1); return; }
  if (E.wx.kind === 'snow') { const r = 0.0025 * (0.3 + E.wx.int) * dt; for (let i = 0; i < PATH_LEN; i++) cv[i] = Math.min(1, cv[i] + r); }   // snows over: in 5–8 minutes of snowfall
}
const pathSnowed = () => PATH.cover.slice(1).reduce((s, v) => s + v, 0) / (PATH_LEN - 1) > 0.5;
// Is the path free of snow at (x, y): no footprints are left there on the snow.
function pathBare(x, y) {
  const i = Math.round(y) - L.cabin.base;
  return i >= 0 && i < PATH_LEN && PATH.cover[i] < 0.5 && x >= pathX(Math.round(y)) - 1 && x <= pathX(Math.round(y)) + 4;
}
// The path — a footprint on the ground: layer 0 (l), drawn before all objects.
const pathItems = E => E.S.snow ? [{ y: -1, x: 0, l: 0, d: c => drawPath(c, E) }] : [];
function drawPath(g, E) {
  if (!E.S.snow) return;
  const bare = mixHex('#8a6d4a', E.S.ground, 0.2), snow = mixHex(E.S.ground, E.S.path, 0.35);
  for (let i = 0; i < PATH_LEN; i++) {
    const y = pathY(i), x0 = pathX(y), c = PATH.cover[i];
    for (let k = 0; k < 4; k++) R(g, x0 + k, y, 1, 1, c > BAYER[y & 3][(x0 + k) & 3] ? snow : bare);
  }
}

// Clears the path from the door outward, row by row (SHOVEL_ROW seconds per row). Called from updateAgent in mode 'shovel'.
// The adult stands beside the path (a.sside: 1 — right, −1 — left) facing it at SHOVEL_REACH distance, so the shovel blade
// ends up over the path in the row he is clearing. On the push the blade moves across the path (see drawShovel).
function updateShoveler(a, dt) {
  a.bmove = false;
  const cv = PATH.cover;
  let i = -1; for (let k = 1; k < PATH_LEN; k++) if (cv[k] > 0.02) { i = k; break; }   // nearest row to the door where snow still lies
  if (i < 0) { a.mode = 'idle'; a.timer = rand(4, 10); return; }                            // the path is clear
  const side = a.sside || 1, ty = pathY(i), tx = pathX(ty) + 1.5 + side * SHOVEL_REACH, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
  if (d > 0.6) {   // walks to the row
    const st = Math.min(d, 9 * dt); a.x += dx / d * st; a.y += dy / d * st; a.bmove = true;
    a.face = Math.abs(dx) > 3 ? (dx > 0 ? 1 : -1) : -side;   // from afar he faces along the way, but near the path always faces it (a step down the row or a bend in the path doesn't turn him around)
    return;
  }
  a.face = -side;   // facing the path
  cv[i] = Math.max(0, cv[i] - dt / SHOVEL_ROW);
  if (cv[i] <= 0.02) cv[i] = 0;
}
const shovelers = a => !a.hidden && (a.mode === 'shovel' || (a.mode === 'walk' && a.next && a.next.mode === 'shovel'));
// Clear the path: adult, winter, no downpour and no snowfall, the path is snowed over and nobody else is clearing. More willing to finish what was started.
function wantsShovel(a, E) {
  if (!isGrownUp(a.person) || E.season !== 'winter' || E.wet || E.wx.kind === 'snow' || !pathSnowed()) return false;
  if (FOLK.some(b => b !== a && shovelers(b))) return false;
  return Math.random() < (a.mode === 'shovel' ? 0.85 : 0.3);
}
function chooseShovel(a) {   // goes out to the path from the side he chose for this job
  a.sside = Math.random() < 0.5 ? 1 : -1;
  go(a, pathX(160) + 1.5 + a.sside * SHOVEL_REACH, 160, 'shovel', rand(60, 120), -a.sside);
  return true;
}

// Push phase: 0 — shovel returned, 1 — halfway, 2 — extended. Only progresses while the person stands and works.
const shovelPush = a => a.mode === 'shovel' && !a.bmove ? Math.round(Math.sin(a.anim * 5) + 1) : 0;
// Shovel with a long handle. His own sprite hands (hanging at the hips) are removed for that time (see drawAgent), instead two hands
// at the shoulder on the handle. The handle goes from the chest down forward at 45° to the blade on the ground. On the push the shovel extends 0…2 px,
// the arm stretches: pixels of the sleeve appear between shoulder and hand. The body doesn't move.
function drawShovel(g, a, pal) {
  const f = a.face, x = Math.round(a.x), y = Math.round(a.y), p = shovelPush(a);
  const dh = Math.max(-1, Math.min(1, +a.person.height || 0)), sy = -6 - dh;      // shoulder height: 1 px higher for a tall one, lower for a short one
  const sleeve = a.person.sleeves === 'short' ? pal.S : (a.person.outfit === 'dress' ? pal.D : pal.T);
  const px = (dx, dy, c) => R(g, x + f * dx, y + dy, 1, 1, c);
  for (let k = 0; k <= -sy; k++) px(3 + p + k, sy - 1 + k, '#8a6234');           // handle
  const ex = 3 + p - sy;                                                          // lower end of the handle (x), at level y-1
  for (let k = 1; k <= 3; k++) px(ex + k, 0, '#6f7a88');                          // blade
  px(ex + 1, -1, '#6f7a88');                                                      // bent edge
  for (let k = 4; k <= 3 + p; k++) px(k, sy, sleeve);                             // the arm stretches from the shoulder
  px(4 + p, sy, pal.S); px(5 + p, sy + 1, pal.S);                                 // two hands on the handle
}