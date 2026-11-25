// Rainbow. After a real rain (at least a minute and a half of rain that was not a mere sprinkle) the sky gets a chance to show one: if within the next half hour the rain
// has stopped, the sun is up and the clouds have thinned out, it appears with a 70% chance (once per rain), slowly fades in, hangs for 10–20 minutes and fades out.
// It also fades out when rain returns, the sun goes down, the sky becomes overcast or snow lies. It stands on the side of the sky opposite to the sun (mirrored on the screen), the ends hide behind the hills and trees.
// Seven 1 px bands, translucent: brighter in clear daylight, weaker under clouds, invisible at night. Drawn in the sky after the clouds, before the scene (js/render.js).
// For testing: ?rainbow=1 (always there in the daytime, e.g. ?hour=8) or ?rainbow=0 (never). By hand: 💧 for a couple of minutes, then ☀️ — with luck it appears.
const RB_COL = ['#ff4d4d', '#ff9a3d', '#ffe14d', '#5ccf5c', '#4dc3ff', '#4d6bff', '#9a4dd6'];   // from the outer edge inward
const RB = { rainT: 0, armT: 0, life: 0, on: false, a: 0 };   // rainT — how long it has rained, armT — how long the chance lasts after the rain, life — time left, a — visibility 0…1

function updateRainbow(dt, E) {
  if (!skyOn('rainbow')) { RB.on = false; RB.armT = 0; RB.rainT = 0; RB.a = Math.max(0, RB.a - dt / 3); return; }   // switched off in the ⚙ "Sky" panel (js/stars.js)
  const f = Q.get('rainbow'), w = E.wx, rain = w.kind === 'rain' || w.kind === 'storm', ok = !E.S.snow && !(E.snowQ > 0);
  if (f === '1' || f === '0') { RB.on = f === '1'; RB.a = RB.on ? 1 : 0; RB.armT = 0; return; }
  if (rain) {
    if (w.int >= 0.3 && ok) { RB.rainT += dt; if (RB.rainT >= 90) RB.armT = 1800; }
    RB.on = false;   // rain came back — it is gone
  } else {
    RB.rainT = Math.max(0, RB.rainT - dt * 0.5);
    if (RB.armT > 0) {
      RB.armT -= dt;
      if (ok && E.sun && w.cover < 65 && E.d > 0.6) { RB.armT = 0; RB.rainT = 0; if (Math.random() < 0.7) { RB.on = true; RB.life = rand(600, 1200); } }
    }
    if (RB.on) { RB.life -= dt; if (RB.life <= 0 || !E.sun || w.cover >= 85 || !ok) RB.on = false; }
  }
  RB.a = clamp(RB.a + (RB.on ? dt / 40 : -dt / 90), 0, 1);
}

function drawRainbow(g, E) {
  if (RB.a <= 0.01) return;
  const a = RB.a * smooth(0.3, 0.8, E.d) * (1 - 0.5 * E.wx.cover / 100) * 0.42;
  if (a < 0.01) return;
  const Ro = clamp(W * 0.3, 84, 112), n = RB_COL.length, Ri = Ro - n, cy = 128;
  const cx = Math.round(E.sun ? clamp(W - E.sun.x, W * 0.3, W * 0.7) : W * 0.6);   // opposite to the sun
  for (let x = cx - Ro; x <= cx + Ro; x++) {
    const dx = x - cx, o2 = Ro * Ro - dx * dx; if (o2 <= 0) continue;
    const i2 = Ri * Ri - dx * dx, y0 = Math.floor(cy - Math.sqrt(o2)), y1 = Math.ceil(i2 > 0 ? cy - Math.sqrt(i2) : cy);
    for (let y = y0; y <= y1; y++) { const k = Math.floor(Ro - Math.hypot(dx, y - cy)); if (k >= 0 && k < n) R(g, x, y, 1, 1, rgba(RB_COL[k], a)); }
  }
}
