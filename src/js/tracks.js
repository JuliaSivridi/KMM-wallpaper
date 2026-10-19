// Short footprints in the snow: prints left by walking people, by a hare and squirrel on the ground, and a stripe behind a rolling snowball.
// They live 10–14 seconds and fade; they are not saved to the ground (so they take almost no memory). Only where snow lies.
// Each footprint is drawn on its own depth layer (by y), so what is closer covers the footprint, as it covers everything else.
const TRACKS = [];
const TRACK_LIFE = { foot: 10, ball: 14 };   // seconds
const TRACK_MAX = 800;
let _ballTrackX = null;
function addTrack(x, y, kind, w, h) { if (TRACKS.length < TRACK_MAX) TRACKS.push({ x: Math.round(x), y, kind, w, h, age: 0, l: layerOf(y) }); }
// A walker leaves a print roughly every step px of path; the feet alternate (the second slightly lower).
function trackSteps(o, moving, step, w, back, bare) {
  if (!moving) { o.tx = null; return; }
  if (o.tx == null) { o.tx = o.x; o.ty = o.y; o.tfoot = 0; return; }
  if (Math.hypot(o.x - o.tx, o.y - o.ty) >= step) {
    o.tfoot ^= 1; o.tx = o.x; o.ty = o.y;
    const x = o.x - back, y = Math.round(o.y) + o.tfoot;
    if (!(bare && pathBare(x, y))) addTrack(x, y, 'foot', w, 1);   // no prints on the cleared path
  }
}
function updateTracks(dt, E) {
  if (!E.S.snow) { TRACKS.length = 0; _ballTrackX = null; for (const a of FOLK) a.tx = null; return; }
  for (let i = TRACKS.length - 1; i >= 0; i--) { const m = TRACKS[i]; m.age += dt; if (m.age >= TRACK_LIFE[m.kind]) TRACKS.splice(i, 1); }
  for (const a of FOLK) trackSteps(a, !a.hidden && (a.mode === 'walk' || ((a.mode === 'build' || a.mode === 'shovel') && a.bmove)), 4, 2, a.face * 2, true);
  for (const a of ANI) {
    if (a.kind === 'hare') trackSteps(a, a.state === 'run', 5, a.front ? 2 : 1, a.dir * 3, false);
    else if (a.kind === 'sq') trackSteps(a, (a.state === 'toTree' || a.state === 'away') && a.moving, 4, 1, a.dir * 3, false);
  }
  // stripe behind the ball: two rows along the path it traveled
  if (SNOW && SNOW.ballX != null && SNOW.v < 3) {
    if (_ballTrackX == null) _ballTrackX = SNOW.ballX;
    const dir = Math.sign(SNOW.ballX - _ballTrackX);
    for (let px = Math.round(_ballTrackX); dir && px !== Math.round(SNOW.ballX); px += dir) addTrack(px, 160, 'ball', 1, 2);
    _ballTrackX = SNOW.ballX;
  } else _ballTrackX = null;
}
// Draws the footprints of one depth layer.
function drawTracks(g, layer) {
  for (const m of TRACKS) {
    if (m.l !== layer) continue;
    const k = 1 - m.age / TRACK_LIFE[m.kind];
    R(g, m.x, m.y, m.w, m.h, m.kind === 'ball' ? rgba('#7d8a78', k * 0.6) : rgba('#7389a8', k * 0.7));
  }
}