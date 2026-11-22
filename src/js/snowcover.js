// Snow on the ground by the weather, not only by the calendar. In calendar winter (Dec–Mar) snow lies always, as before. Outside winter it can fall and lie
// in April, October and November (months as in env(): after the southern-hemisphere shift).
// How much of the ground is white (k, 0…1) follows the weather: while it snows (below +1°) k grows (light snowfall ~5 min to a full cover, heavy ~3 min),
// when the snowfall stops a thin deposit slowly goes away, and a full cover starts to melt only from a month's threshold temperature
// (April +1°, October +3°, November +7°: in Karelia November snow stays even in a thaw); the warmer, the faster (an hour at one degree over, minutes in real warmth).
// Without a temperature (no network, manual weather) it melts slowly in April and October and stays in November. A month that cannot hold snow
// (May, summer, September) clears it at once; in December the calendar winter takes over.
// On screen the ground turns white in spots that grow and merge (E.snowQ, 0…SNOWC_Q: how many parts of the ground are white; the mixing is in buildGround, render.js).
// The "winter" in the scene (hats, footprints, snowman, clearing the path, season 'winter' in env()) switches on when more than half is white and off when less
// than half is left (with a small gap, so it doesn't flicker).
// A season chosen by hand (🌱 🌻 🍂 ⛄) switches this off: the chosen season is shown as is. For testing: ?snow=1 (lies) or ?snow=0 (bare) in the months above, e.g. ?month=11&snow=1.
// The state is remembered in the browser (not when the time is set by ?month= or ?day=, so tests don't leak into the real state).
const SNOWC_KEY = 'forest.snowcover.v1';
const SNOWC_MONTHS = { 3: { melt: 1, days: 5 }, 9: { melt: 3, days: 5 }, 10: { melt: 7, days: 40 } };   // melt — temperature from which it melts; days — how long without snowfall it is kept after a restart
const SNOWC_Q = 32;       // how many steps the white share of the ground is divided into on screen (E.snowQ)
const SNOWC_FALL = 240;    // "snowfall seconds" until the ground is fully white
const SNOWC_MELT = 3600;   // "degree-seconds" until a full cover has melted away
const SNOWC = { on: false, acc: 0, melt: 0, last: 0, saved: 0, lies: false };   // on — a full cover lies (and melts: melt 0…SNOWC_MELT); acc — the deposit while it is not full yet; lies — "winter" in the scene
const snowcK = () => SNOWC.on ? 1 - SNOWC.melt / SNOWC_MELT : SNOWC.acc / SNOWC_FALL;
try {
  const o = JSON.parse(localStorage.getItem(SNOWC_KEY) || 'null');
  if (o && o.on && Date.now() - o.t < 40 * 864e5) { SNOWC.on = true; SNOWC.last = o.t; SNOWC.melt = Math.max(0, Math.min(SNOWC_MELT, +o.m || 0)); SNOWC.lies = snowcK() >= 0.5; }
} catch (e) {}

// How snowy the ground is in month sm: { q: parts of the ground that are white (of SNOWC_Q), lies: is it "winter" in the scene }. Read by env(); outside the months above — nothing.
function snowCoverState(sm) {
  if (OV.month !== null || !SNOWC_MONTHS[sm]) return { q: 0, lies: false };
  const f = Q.get('snow');
  if (f === '1') return { q: SNOWC_Q, lies: true };
  if (f === '0') return { q: 0, lies: false };
  return { q: Math.round(Math.max(0, Math.min(1, snowcK())) * SNOWC_Q), lies: SNOWC.lies };
}
function snowcSave(force) {
  if (Q.has('month') || Q.has('day')) return;
  const now = Date.now(); if (!force && now - SNOWC.saved < 6e5) return;
  SNOWC.saved = now;
  try { if (SNOWC.on) localStorage.setItem(SNOWC_KEY, JSON.stringify({ on: true, t: SNOWC.last || now, m: Math.round(SNOWC.melt) })); else localStorage.removeItem(SNOWC_KEY); } catch (e) {}
}
function snowcOff() { SNOWC.on = false; SNOWC.acc = 0; SNOWC.melt = 0; SNOWC.lies = false; snowcSave(true); }
// Called every frame from step().
function updateSnowCover(dt, E) {
  const f = Q.get('snow');
  if (OV.month !== null || f === '1' || f === '0') return;
  const cfg = SNOWC_MONTHS[E.month];
  if (!cfg) { if (SNOWC.on || SNOWC.acc) snowcOff(); return; }
  const t = E.wx && typeof E.wx.temp === 'number' ? E.wx.temp : null, now = Date.now();
  if (E.wx.kind === 'snow' && (t === null || t <= 1)) {   // it snows: the ground whitens (or a melting cover is restored)
    const r = dt * (0.5 + E.wx.int);
    SNOWC.last = now;
    if (SNOWC.on) { SNOWC.melt = Math.max(0, SNOWC.melt - r * SNOWC_MELT / SNOWC_FALL); snowcSave(); }
    else { SNOWC.acc += r; if (SNOWC.acc >= SNOWC_FALL) { SNOWC.on = true; SNOWC.acc = 0; SNOWC.melt = 0; snowcSave(true); } }
  } else if (SNOWC.on) {
    if (SNOWC.last && (now - SNOWC.last) / 864e5 > cfg.days) snowcOff();   // it was a long time ago (the wallpaper was off)
    else { SNOWC.melt += (t === null ? (cfg.melt >= 7 ? 0 : 0.5) : Math.max(0, t - cfg.melt + 1)) * dt; if (SNOWC.melt >= SNOWC_MELT) snowcOff(); else snowcSave(); }
  } else SNOWC.acc = Math.max(0, SNOWC.acc - dt * 0.3);   // a thin deposit goes away by itself
  const k = snowcK();
  if (k >= 0.55) SNOWC.lies = true; else if (k <= 0.45) SNOWC.lies = false;
}
