const P = { rain: [], flash: 0, smoke: [], sparks: [], leaves: [], snow: [], flies: [], zz: [], glints: [], smT: 0, spT: 0, lfT: 0, zT: 0 };
function updateParticles(dt, E) {
  for (const c of L.clouds) { c.x += c.v * dt * (0.5 + E.wx.wind / 4); if (c.x > W + 40) c.x = -40; }
  P.smT -= dt;
  if (P.smT <= 0) {
    P.smT = 0.4;
    if (E.season !== 'summer') P.smoke.push({ x: L.cabin.x + 6, y: L.cabin.base - 23, vx: rand(1.5, 3.5), vy: rand(-5, -3.5), life: 5, max: 5 });
    if (E.fireLit) P.smoke.push({ x: L.fireX, y: 150, vx: rand(0.5, 2.5), vy: rand(-6, -4), life: 3.5, max: 3.5 });
  }
  for (const s of P.smoke) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx += dt * 0.3; s.life -= dt; }
  P.smoke = P.smoke.filter(s => s.life > 0);
  if (E.fireLit) { P.spT -= dt; if (P.spT <= 0) { P.spT = rand(0.15, 0.5); P.sparks.push({ x: L.fireX + rand(-1.5, 1.5), y: 152, vx: rand(-3, 3), vy: rand(-18, -10), life: rand(0.5, 1.1) }); } }
  for (const s of P.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; }
  P.sparks = P.sparks.filter(s => s.life > 0);
  if (E.season === 'autumn') { P.lfT -= dt; if (P.lfT <= 0) { P.lfT = rand(0.8, 2.2); const b = L.birches[Math.floor(Math.random() * L.birches.length)]; P.leaves.push({ x: b.x + rand(-9, 9), y: b.base - b.h + rand(-2, 14), ph: rand(0, 6), c: E.S.leaves[Math.floor(Math.random() * E.S.leaves.length)], land: rand(157, 178), rest: 0 }); } }
  for (const l of P.leaves) { if (l.rest > 0) l.rest += dt; else { l.y += dt * 7; l.x += Math.sin(T * 2 + l.ph) * dt * 6; if (l.y >= l.land) { l.y = l.land; l.rest = 0.001; } } }
  P.leaves = P.leaves.filter(l => l.rest < 5);
  const wantSnow = E.wx.kind === 'snow' ? Math.round(15 + 110 * E.wx.int) : 0;
  const wantRain = (E.wx.kind === 'rain' || E.wx.kind === 'storm') ? Math.round(20 + 140 * E.wx.int) : 0;
  while (P.rain.length < wantRain) P.rain.push({ x: rand(-20, W), y: rand(-20, H), v: rand(110, 150) });
  if (P.rain.length > wantRain) P.rain.length = wantRain;
  for (const d of P.rain) { d.y += d.v * dt; d.x += E.wx.wind * 4 * dt; if (d.y > H) { d.y = rand(-20, 0); d.x = rand(-20, W); } }
  if (E.wx.kind === 'storm') { P.flash -= dt; if (P.flash < -rand(6, 16)) P.flash = 0.12; }
  while (P.snow.length < wantSnow) P.snow.push({ x: rand(0, W), y: rand(0, H), vy: rand(5, 10), ph: rand(0, 6) });
  if (P.snow.length > wantSnow) P.snow.length = wantSnow;
  for (const s of P.snow) { s.y += s.vy * dt; s.x += (Math.sin(T + s.ph) * 3 + E.wx.wind * 1.5) * dt; if (s.x > W) s.x -= W; if (s.y > H) { s.y = -2; s.x = rand(0, W); } }
  const wantFlies = (E.season === 'summer' || E.month === 4) && E.d < 0.5 ? 14 : 0;
  while (P.flies.length < wantFlies) P.flies.push({ x: rand(0, W), y: rand(132, 170), vx: 0, vy: 0, ph: rand(0, 6) });
  if (P.flies.length > wantFlies) P.flies.length = wantFlies;
  for (const f of P.flies) { f.vx = clamp(f.vx + rand(-10, 10) * dt, -4, 4); f.vy = clamp(f.vy + rand(-10, 10) * dt, -3, 3); f.x = (f.x + f.vx * dt + W) % W; f.y += f.vy * dt; if (f.y < 130 || f.y > 172) { f.vy *= -1; f.y = clamp(f.y, 130, 172); } }
  if (FOLK.some(a => a.hidden && !isAwake(a.id, E.h))) { P.zT -= dt; if (P.zT <= 0) { P.zT = 2.6; P.zz.push({ x: L.cabin.x + 16, y: L.cabin.base - 16, life: 4 }); } }
  for (const z of P.zz) { z.x += 2 * dt; z.y -= 3 * dt; z.life -= dt; }
  P.zz = P.zz.filter(z => z.life > 0);
}