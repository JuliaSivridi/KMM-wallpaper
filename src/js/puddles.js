// Puddles. They appear from rain, stay for an hour or two and reflect the sky (colours E.top / E.hor, so a sunset or overcast sky is mirrored too).
// While it rains, rings from the drops run across them. The spots are fixed (layoutPuddles, computed once with the scene layout), and one number PUD.k (0…1, "how wet the ground is")
// decides how many of them exist and how big they are: each puddle has its own threshold, so they appear one by one, grow, and later shrink and vanish one by one.
// Rain fills the ground (a drizzle slowly, a downpour in about 5 minutes), without rain it dries in ~1.5 hours (a bit faster on a sunny day).
// No puddles where snow lies (or is arriving) and in frost (≤ 0°: what is left dries out quickly instead of freezing).
// Puddles are drawn every frame as an object of layer 0 (like the winter path), because their size changes.
// The state is remembered in the browser (not when time/weather/season are set by hand or by ?month= / ?day=, so tests don't leak into the real state).
// For testing: ?puddles=1 (all puddles at full size) or ?puddles=0 (none); with rain on (💧) the rings are visible.
const PUD_KEY = 'forest.puddles.v1';
const PUD_FILL = 420;    // "rain seconds" until the ground is wet through (at intensity 0.7 about 7 minutes)
const PUD_DRY = 5400;    // seconds until a wet ground dries out
const PUD = { k: 0, rip: [], saved: 0 };   // rip — rings on the water: { i (puddle), u, v (place in the puddle, −1…1), t, dur }
try {
  const o = JSON.parse(localStorage.getItem(PUD_KEY) || 'null');
  if (o && isFinite(o.k) && isFinite(o.t)) PUD.k = clamp(o.k - (Date.now() - o.t) / 1000 / PUD_DRY, 0, 1);   // it dried while the wallpaper was off
} catch (e) {}

// Spots: on the ground in front of the people lines, away from the cabin, fire, boulders, pumpkins, skeleton, lantern, fir tree and mushrooms. Called from layout().
function layoutPuddles() {
  const r = rng(5150), n = Math.max(5, Math.round(W / 45));
  L.puddles = []; PUD.rip.length = 0;
  for (let tries = 0; tries < 600 && L.puddles.length < n; tries++) {
    const y = 158 + Math.floor(r() * 19), x = Math.round(W * 0.03 + r() * W * 0.94);
    const rx = Math.round(5 + (y - 158) / 18 * 6 + r() * 2), ry = Math.max(2, Math.round(rx * 0.3));
    if (x - rx < 3 || x + rx > W - 3) continue;
    if (Math.abs(x - L.doorX) < rx + 12 && y < 166) continue;                       // the path to the door
    if (x > L.cabin.x - 22 - rx && x < L.cabin.x + 34 + rx && y < 164) continue;   // cabin, woodshed, chopping block
    if (y < 172 && Math.abs(x - L.fireX) < rx + 26) continue;                       // fire and the seats around it
    if (L.rocks.some(o => Math.abs(x - o.x) < o.rx + rx + 2 && Math.abs(y - o.y) < o.ry + ry + 4)) continue;
    if (L.pumpkins.some(p => Math.abs(p.x - x) < rx + 6 && Math.abs(p.y - y) < ry + 6)) continue;
    if (L.shrooms.some(m => Math.abs(m.x - x) < rx + 3 && Math.abs(m.y - y) < ry + 3)) continue;
    if (Math.abs(x - L.skeleton.x) < rx + 8 && y > 150) continue;
    if (Math.abs(x - L.lantern.x) < rx + 8 && Math.abs(y - L.lantern.y) < ry + 8) continue;
    if (L.xtree && Math.abs(x - L.xtree.x) < rx + 10 && y < 166) continue;
    if (L.puddles.some(q => Math.abs(x - q.x) < rx + q.rx + 5 && Math.abs(y - q.y) < ry + q.ry + 3)) continue;
    L.puddles.push({ x, y, rx, ry, th: 0, jit: Array.from({ length: 8 }, () => [-1, 0, 0, 1][Math.floor(r() * 4)]) });   // jit — unevenness of the edge
  }
  const m = L.puddles.length;
  L.puddles.forEach((p, i) => { p.th = m > 1 ? i / (m - 1) * 0.7 : 0; });   // thresholds: the first appears at once, the last only when it is really wet
  L.puddles.sort((a, b) => a.y - b.y);                                       // far ones are drawn first
}

const puddleScale = p => smooth(p.th, p.th + 0.3, PUD.k);   // 0 — no puddle, 1 — full size
const puddlesTest = () => { const f = Q.get('puddles'); return f === '1' || f === '0' ? +f : null; };

// Called every frame from step().
function updatePuddles(dt, E) {
  if (!skyOn('puddles')) { PUD.k = 0; PUD.rip.length = 0; return; }   // switched off in the ⚙ "Sky" panel (js/stars.js)
  const f = puddlesTest(), w = E.wx, t = typeof w.temp === 'number' ? w.temp : null, rain = w.kind === 'rain' || w.kind === 'storm';
  const bare = !E.S.snow && !(E.snowQ > 0);
  if (f !== null) PUD.k = f;
  else if (!bare) PUD.k = 0;
  else if (t !== null && t <= 0) PUD.k = Math.max(0, PUD.k - dt / 600);
  else if (rain) PUD.k = Math.min(1, PUD.k + dt * (0.3 + w.int) / PUD_FILL);
  else PUD.k = Math.max(0, PUD.k - dt * (E.d > 0.5 && w.cover < 60 ? 1.5 : 1) / PUD_DRY);
  for (let i = PUD.rip.length - 1; i >= 0; i--) { const q = PUD.rip[i]; q.t += dt; if (q.t >= q.dur) PUD.rip.splice(i, 1); }
  if (bare && rain && PUD.k > 0.02 && L.puddles) L.puddles.forEach((p, i) => {
    const s = puddleScale(p);
    if (s > 0.35 && PUD.rip.length < 60 && Math.random() < dt * (0.8 + 4 * w.int) * s) PUD.rip.push({ i, u: rand(-1, 1), v: rand(-1, 1), t: 0, dur: rand(0.6, 1.0) });
  });
  const real = f === null && !(OV.wx || OV.fc || OV.month !== null || OV.hour !== null || Q.has('month') || Q.has('day'));
  if (real && Date.now() - PUD.saved > 6e4) {
    PUD.saved = Date.now();
    try { if (PUD.k > 0.001) localStorage.setItem(PUD_KEY, JSON.stringify({ k: Math.round(PUD.k * 1000) / 1000, t: Date.now() })); else localStorage.removeItem(PUD_KEY); } catch (e) {}
  }
}

// In the depth-sorted object list: layer 0, under everything standing on the ground.
const puddleItems = E => (!L || !L.puddles || E.S.snow || E.snowQ > 0 || PUD.k <= 0.01) ? [] : [{ y: -0.5, x: 0, l: 0, d: c => drawPuddles(c, E) }];

function drawPuddles(g, E) {
  L.puddles.forEach((p, pi) => {
    const s = puddleScale(p), rx = p.rx * s;
    if (rx < 1.5) return;
    const nr = Math.max(0, Math.round(p.ry * s)), x = p.x, y = p.y;
    const hw = dy => {   // half-width of the row dy (−nr…nr); the edge is slightly uneven
      const q = dy / (nr + 0.6), w = Math.round(rx * Math.sqrt(Math.max(0, 1 - q * q))) + (Math.abs(dy) === nr && nr > 0 ? 0 : p.jit[(dy + nr + 8) % 8]);
      return dy === 0 ? Math.max(1, w) : w;
    };
    // the far edge reflects the sky near the horizon, the near edge the higher sky
    const col = dy => mixHex(mixHex(E.hor, E.top, nr ? 0.15 + 0.55 * (dy + nr) / (2 * nr) : 0.35), '#ffffff', 0.1);
    const rim = mixHex(E.S.ground, '#241c12', 0.4);   // wet dark ground around
    for (let dy = -nr; dy <= nr; dy++) { const w = hw(dy); if (w >= 1) R(g, x - w - 1, y + dy, 2 * w + 3, 1, rim); }
    const wt = Math.max(1, hw(-nr) - (nr === 0 ? 1 : 0)), wb = Math.max(1, hw(nr) - (nr === 0 ? 1 : 0));
    R(g, x - wt, y - nr - 1, 2 * wt + 1, 1, rim); R(g, x - wb, y + nr + 1, 2 * wb + 1, 1, rim);
    for (let dy = -nr; dy <= nr; dy++) { const w = hw(dy); if (w >= 1) R(g, x - w, y + dy, 2 * w + 1, 1, col(dy)); }
    if (rx >= 4) { const hy = nr >= 2 ? -1 : 0, w = hw(hy), ln = Math.floor(w * 0.5); if (ln >= 1) R(g, x - w + 1, y + hy, ln, 1, mixHex(col(hy), '#ffffff', 0.3)); }   // a glint
    const rmax = Math.min(3, rx * 0.3);
    if (rmax < 1) return;
    for (const q of PUD.rip) {   // rings from the drops
      if (q.i !== pi) continue;
      const k = q.t / q.dur, rr = 0.6 + (rmax - 0.6) * k, ry = rr * 0.4, cx = x + Math.round(q.u * rx * 0.5), cy = y + (nr ? Math.round(q.v * nr * 0.5) : 0);
      const c = rgba(mixHex(col(0), '#ffffff', 0.6), (1 - k) * 0.85);
      for (let a = 0; a < 14; a++) {
        const ang = a / 14 * 6.2832, px = cx + Math.round(rr * Math.cos(ang)), py = cy + Math.round(ry * Math.sin(ang)), dy = py - y;
        if (Math.abs(dy) > nr || Math.abs(px - x) > hw(dy) - 1) continue;   // only inside the puddle
        R(g, px, py, 1, 1, c);
      }
    }
  });
}
