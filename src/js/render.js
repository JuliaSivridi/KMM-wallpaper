const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const sky = document.createElement('canvas'), skx = sky.getContext('2d');
// Ground cache: one layer per depth strip (LAYER_EDGES), each baked with its statics (trees, bushes, boulders, house, pumpkins, etc.).
const lands = Array.from({ length: LAST_LAYER + 1 }, () => document.createElement('canvas')), lcx = lands.map(c => c.getContext('2d'));
// Glowing objects between layers. At night everything drawn is dimmed, and fire must not be dimmed, so the scene is split into segments:
// each segment is dimmed separately, and between them a glowing object is drawn. There are two boundaries: the New Year tree lights (y=154) and the fire: what is deeper (smaller y) — behind the flame,
// what is closer or at the same depth — in front of it. A new boundary = a new entry in BREAKS (boundary y and draw function).
const FIRE_Y = 159;
const BREAKS = [{ y: NY_BASE, draw: (g, E) => nyTreeLights(g, E) }, { y: FIRE_Y, draw: (g, E) => drawFire(g, E) }];   // New Year tree lights (js/holidays.js) and the fire
const BREAK_LAYER = BREAKS.map(b => layerOf(b.y));
const segs = Array.from({ length: BREAKS.length + 1 }, () => document.createElement('canvas')), sgx = segs.map(c => c.getContext('2d'));

function buildSky(E) {
  const id = skx.createImageData(W, H), D = id.data, A = rgb(E.top), B = rgb(E.hor), lv = 12, hz = 118;
  for (let y = 0; y < H; y++) {
    const v = Math.pow(Math.min(1, y / hz), 1.3) * lv, b = Math.floor(v), fr = v - b;
    for (let x = 0; x < W; x++) {
      const k = fr > BAYER[y & 3][x & 3] ? Math.min(lv, b + 1) : b, t = k / lv, o = (y * W + x) * 4;
      D[o] = A[0] + (B[0] - A[0]) * t; D[o + 1] = A[1] + (B[1] - A[1]) * t; D[o + 2] = A[2] + (B[2] - A[2]) * t; D[o + 3] = 255;
    }
  }
  skx.putImageData(id, 0, 0);
}
function scots(g, t, S, season) {
  const r = rng(t.s), dep = t.dep, s = Math.max(0, dep), x = t.x, base = t.base, h = t.h, top = base - h, hz = hazeOf(dep);
  const [c0, c1] = CROWN[season], fog = c => mixHex(c, S.hillNear, hz);
  const main = fog(c0), hi = fog(c1), sh = mixHex(main, '#0b1a12', 0.35);
  const w = dep < 0.35 ? 1 : dep < 0.75 ? 2 : 3;
  if (w === 1) R(g, x, top, 1, h, mixHex('#8a5a3c', S.hillNear, Math.min(0.8, hz + 0.1)));
  else {
    const up = Math.round(h * 0.55);
    R(g, x, top, w, h, fog('#6e4330'));
    R(g, x + w - 2, top, 2, up, fog('#b8693a')); R(g, x + w - 1, top, 1, up, fog('#da8d4f'));
    if (w === 3) { R(g, x + 1, top + up, 1, h - up, '#86553a'); for (let y = top + up; y < base - 1; y += 2 + Math.floor(r() * 3)) R(g, x + Math.floor(r() * 3), y, 1, 1, '#4a2e22'); }
    if (S.snow) R(g, x, base - 2, w, 2, '#eef3f8');
  }
  const span = h * (0.22 + 0.16 * s), n = 2 + Math.round(s * 4 + r() * 2), cl = [], mid = x + Math.floor(w / 2);
  for (let k = 0; k < n; k++) {
    const cy = top + Math.round((k / n) * span) + Math.floor(r() * 3) - 1, side = k === 0 ? 0 : (k % 2 ? 1 : -1);
    const cx = mid + side * Math.round(r() * (4 + s * 9));
    const rx = 2 + Math.round(s * 3) + Math.floor(r() * (2 + s * 3)), ry = dep < 0.3 ? 1 : 1 + Math.round(s * 1.2) + (r() < 0.4 ? 1 : 0);
    cl.push({ cx, cy, rx, ry });
    if (w > 1 && side !== 0) for (let i = 0; i <= Math.abs(cx - mid); i++) R(g, mid + side * i, cy + ry + 1 - Math.floor(i * 0.25), 1, 1, fog('#5a3a28'));
  }
  for (const c of cl) ellipse(g, c.cx, c.cy + 1, c.rx, c.ry, sh);
  for (const c of cl) ellipse(g, c.cx, c.cy, c.rx, c.ry, main);
  if (dep >= 0.3) for (const c of cl) if (c.rx > 2) ellipse(g, c.cx - 1, c.cy - 1, c.rx - 2, Math.max(0, c.ry - 1), hi);
  if (S.snow) for (const c of cl) R(g, c.cx - c.rx + 1, c.cy - c.ry, c.rx * 2 - 1, 1, '#eef3f8');
}
function birch(g, t, S, season) {
  const r = rng(t.s), dep = t.dep, s = Math.max(0, dep), x = t.x, base = t.base, h = t.h, top = base - h, hz = hazeOf(dep), fog = c => mixHex(c, S.hillNear, hz);
  const leaves = (season === 'winter' || season === 'late') ? null : S.leaves, w = dep < 0.6 ? 1 : 2;
  R(g, x, top, w, h, fog('#ece8de')); if (w === 2) R(g, x + 1, top, 1, h, '#cfc9bb');
  for (let y = top + 2; y < base - 1; y += 3 + Math.floor(r() * 3)) R(g, x + (w === 2 && r() < 0.5 ? 1 : 0), y, 1, 1, fog('#2a2a2a'));
  if (leaves) {
    const n = 5 + Math.round(s * 6);
    for (let k = 0; k < n; k++) disc(g, x + Math.round((r() - 0.5) * (6 + s * 14)), top + Math.round(r() * h * 0.45) - 2, 2 + Math.round(s * 1.5) + Math.floor(r() * (1 + s * 2)), fog(leaves[k % leaves.length]));
    if (s > 0.6) for (let k = 0; k < 5; k++) R(g, x + Math.round((r() - 0.5) * 16) - 1, top + Math.round(r() * h * 0.3) - 3, 2, 2, leaves[(k + 1) % leaves.length]);
  } else {
    const n = 3 + Math.round(s * 4);
    for (let k = 0; k < n; k++) {
      const y0 = top + 2 + Math.round(k * (3 + s)), dir = k % 2 ? 1 : -1, len = 2 + Math.round(s * 5) + Math.floor(r() * 3);
      for (let i = 0; i < len; i++) R(g, x + (dir > 0 ? w - 1 : 0) + dir * i, y0 - Math.floor(i * 0.7), 1, 1, fog('#6a5a4c'));
      if (S.snow && s > 0.5) R(g, x + dir * (len - 2), y0 - Math.floor((len - 2) * 0.7) - 1, 2, 1, '#f4f7fb');
    }
  }
}
// bushes: j — juniper, r — rowan, b — deciduous bush
function bush(g, b, S, season) {
  const r = rng(b.s), x = b.x, y = b.y, k = 0.45 + 0.55 * b.dep, hz = hazeOf(b.dep), fog = c => mixHex(c, S.hillNear, hz), winter = season === 'winter', sc = v => Math.max(1, Math.round(v * k));
  if (b.t === 'j') {
    const c = fog(winter ? '#23402f' : '#2b4d36'), hi = fog('#3b6447');
    for (let i = 0; i < 5; i++) ellipse(g, x + Math.round((r() - 0.5) * 4 * k), y - sc(3 + i * 2), sc(3 - Math.floor(i / 2)), sc(2), i % 2 ? hi : c);
    if (S.snow) R(g, x - sc(2), y - sc(12), sc(4), 1, '#eef3f8');
    return;
  }
  if (winter || season === 'late') {
    for (let i = 0; i < 7; i++) { const dx = Math.round((r() - 0.5) * 12 * k); for (let j = 0; j < sc(6); j++) R(g, x + Math.round(dx * j / sc(6)), y - j, 1, 1, fog('#5e4a3c')); }
    if (S.snow) ellipse(g, x, y - 1, sc(7), sc(2), '#f2f6fa');
    if (b.t === 'r' && season === 'late') for (let i = 0; i < 4; i++) R(g, x - sc(3) + Math.floor(r() * sc(7)), y - sc(5) + Math.floor(r() * 3), 1, 1, '#c0282d');
    return;
  }
  const pal = (b.t === 'r'
    ? (season === 'autumn' ? ['#c4472a', '#e07b2c', '#a83424'] : ['#4f8a38', '#64a046', '#3f7430'])
    : (season === 'autumn' ? ['#b89a2e', '#d4b23a', '#8f7a2a'] : ['#3f7f35', '#559944', '#33692c'])).map(fog);
  ellipse(g, x, y - sc(3), sc(7), sc(4), pal[2]);
  for (let i = 0; i < 6; i++) disc(g, x + Math.round((r() - 0.5) * 10 * k), y - sc(4) - Math.floor(r() * sc(3)), sc(2 + Math.floor(r() * 2)), pal[i % 2]);
  if (b.t === 'r' && b.dep > 0.5 && (season === 'summer' || season === 'autumn')) for (let i = 0; i < 5; i++) R(g, x - 4 + Math.floor(r() * 9), y - 6 + Math.floor(r() * 4), 1, 1, season === 'autumn' ? '#e8302a' : '#e0752a');
}
function boulder(g, o, S) {
  const hz = hazeOf(clamp((o.y - 126) / 26, 0, 1)), fog = c => mixHex(c, S.hillNear, hz);
  ellipse(g, o.x, o.y, o.rx, o.ry, fog('#6f7378'));
  ellipse(g, o.x - 1, o.y - 1, Math.max(1, o.rx - 1), Math.max(0, o.ry - 1), fog('#8c9096'));
  ellipse(g, o.x - Math.round(o.rx * 0.35), o.y - Math.round(o.ry * 0.45), Math.max(1, Math.round(o.rx * 0.35)), Math.max(0, Math.round(o.ry * 0.3)), fog('#a9adb3'));
  R(g, o.x - o.rx + 1, o.y + o.ry, o.rx * 2 - 1, 1, 'rgba(0,0,0,0.18)');
  if (S.snow) ellipse(g, o.x, o.y - o.ry + 1, Math.max(1, o.rx - 2), 1, '#f2f6fa');
  else { R(g, o.x - Math.round(o.rx * 0.5), o.y - o.ry, Math.round(o.rx * 0.8), 1, fog('#5e7a45')); R(g, o.x + 1, o.y - o.ry + 1, Math.round(o.rx * 0.4), 1, fog('#6d8a50')); }
}
function cabin(g, S) {
  const x = L.cabin.x, b = L.cabin.base;
  R(g, x + 5, b - 22, 3, 8, '#5b5b62'); R(g, x + 5, b - 22, 3, 1, '#76767e');
  for (let r = 0; r < 10; r++) { const half = Math.round(14 - r * 1.45); R(g, x + 12 - half, b - 12 - r, half * 2, 1, r % 2 ? '#3d3d47' : '#45454f'); }
  if (S.snow) { for (let r = 4; r < 10; r++) { const half = Math.round(14 - r * 1.45); R(g, x + 12 - half, b - 12 - r, half * 2, 1, '#eef3f8'); } R(g, x + 5, b - 23, 3, 1, '#eef3f8'); }
  R(g, x, b - 11, 24, 11, '#a3322a');
  for (let k = 1; k < 11; k += 2) R(g, x, b - 11 + k, 24, 1, '#8c2a23');
  R(g, x, b - 11, 1, 11, '#ece6d8'); R(g, x + 23, b - 11, 1, 11, '#ece6d8'); R(g, x - 1, b - 12, 26, 1, '#ece6d8');
  R(g, x + 4, b - 8, 6, 5, '#ece6d8'); R(g, x + 5, b - 7, 4, 3, '#273246'); R(g, x + 7, b - 7, 1, 3, '#ece6d8');
  R(g, x + 14, b - 9, 6, 9, '#ece6d8'); R(g, x + 15, b - 8, 4, 8, '#5a3420'); R(g, x + 18, b - 4, 1, 1, '#d9b04a');
  R(g, x + 13, b, 8, 1, '#6b6b70');
}
function buildLand(E) {
  const g = lcx[0], S = E.S, se = E.season; for (const c of lcx) c.clearRect(0, 0, W, H);
  for (let x = 0; x < W; x++) { R(g, x, L.far[x], 1, 124 - L.far[x], S.hillFar); if (S.snow) R(g, x, L.far[x], 1, 2, '#e3ebf5'); }
  for (let x = 0; x < W; x++) R(g, x, L.near[x], 1, 124 - L.near[x], S.hillNear);
  for (const p of L.edge) p.type === 'b' ? birch(g, p, S, se) : scots(g, p, S, se);
  const ub = S.snow ? ['#c4d0dd', '#aebccc'] : se === 'autumn' ? ['#6f6a3a', '#5a6a40'] : [mixHex(S.hillNear, '#2a4a30', 0.5), mixHex(S.hillNear, '#2a4a30', 0.65)];
  for (const u of L.under) disc(g, u.x, u.y, u.r, ub[u.k < 0.5 ? 0 : 1]);
  R(g, 0, 124, W, 56, S.ground);
  R(g, 0, 124, W, 2, mixHex(S.ground, '#1a2a1a', 0.25));
  // moss, bilberry, needles
  const moss = S.snow ? '#d5dfea' : mixHex(S.ground, '#1f4a2a', 0.35);
  for (const p of L.speck) R(g, p.x, p.y, p.w, 1, p.k < 0.6 ? S.shade : moss);
  if (!S.snow && se !== 'spring') for (const p of L.speck) if (p.k > 0.93) R(g, p.x, p.y - 1, 1, 1, E.month === 6 || E.month === 7 ? '#3b4f9e' : se === 'autumn' ? '#c0282d' : moss);
  if (S.flowers) for (const f of L.flowers) R(g, f.x, f.y, 1, 1, S.flowers[f.c % S.flowers.length]);
  if (!S.snow) for (let y = L.cabin.base; y < 161; y++) R(g, L.doorX - 2 + Math.round(Math.sin(y * 0.45)), y, 4, 1, S.path);   // in winter the path is redrawn every frame (path.js)
  const items = [];
  for (const t of L.trees) items.push([t.base, c => t.type === 'b' ? birch(c, t, S, se) : scots(c, t, S, se)]);
  for (const b of L.bushes) items.push([b.y + 0.5, c => bush(c, b, S, se)]);
  for (const o of L.rocks) items.push([o.y + o.ry, c => boulder(c, o, S)]);
  if (se === 'autumn') for (const m of L.shrooms) items.push([m.y, c => { R(c, m.x, m.y - 1, 1, 2, '#efe9dc'); R(c, m.x - 1, m.y - 2, 3, 1, m.red ? '#d0302a' : '#8a5a2e'); if (m.red) R(c, m.x, m.y - 2, 1, 1, '#ffffff'); }]);
  items.push([L.cabin.base + 0.2, c => cabin(c, S)]);
  items.push([L.block.y + 0.4, c => chopBlock(c, S)]);
  halLand(items, E);
  items.sort((a, b) => a[0] - b[0]).forEach(it => it[1](lcx[layerOf(it[0])]));
  const gf = lcx[layerOf(FIRE_Y - 0.5)];   // the fire pit and logs lie right behind the fire boundary
  // fire pit and log
  const f = L.fireX, st = '#7c7f86', st2 = '#9a9da4';
  R(gf, f - 5, 158, 2, 2, st); R(gf, f - 3, 159, 2, 1, st2); R(gf, f + 2, 159, 2, 1, st2); R(gf, f + 4, 158, 2, 2, st); R(gf, f - 1, 160, 2, 1, st);
  R(gf, f - 3, 157, 6, 1, '#5a3a22'); R(gf, f - 2, 156, 4, 1, '#6b4a2f');
  for (const s of [L.seatX, L.seat2X]) { R(gf, s - 4, 157, 9, 3, '#6b4a2f'); R(gf, s - 4, 157, 9, 1, S.snow ? '#eef3f8' : '#80593a'); R(gf, s - 4, 157, 1, 3, '#b08a5c'); R(gf, s + 4, 157, 1, 3, '#b08a5c'); }
  const gd = lcx[LAST_LAYER];
  if (S.snow) for (const d of L.drifts) { R(gd, d.x + 2, d.y - 1, d.w - 4, 1, '#f6f9fc'); R(gd, d.x, d.y, d.w, 3, '#f6f9fc'); R(gd, d.x + 1, d.y + 3, d.w - 2, 1, S.shade); }
}
const ZG = ['####', '..#.', '.#..', '####'];
function glyphZ(g, x, y, c) { g.fillStyle = c; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (ZG[j][i] === '#') g.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); }
function aurora(g, a) {
  g.globalCompositeOperation = 'lighter';
  for (let x = 0; x < W; x += 2) {
    const top = 18 + 10 * Math.sin(x * 0.021 + T * 0.08) + 5 * Math.sin(x * 0.063 - T * 0.05);
    const h = 22 + 10 * Math.sin(x * 0.034 + T * 0.12) + 6 * Math.sin(x * 0.09 + T * 0.2);
    const k = a * (0.5 + 0.5 * Math.sin(x * 0.045 + T * 0.6)) * (0.6 + 0.4 * Math.sin(x * 0.13 - T * 0.9));
    R(g, x, top, 2, h * 0.4, rgba('#7a5cff', k * 0.10));
    R(g, x, top + Math.round(h * 0.4), 2, h * 0.6, rgba('#4dff9a', k * 0.22));
    R(g, x, top + Math.round(h) - 3, 2, 3, rgba('#9dffc8', k * 0.25));
  }
  g.globalCompositeOperation = 'source-over';
}
// Night dimming, sunset tint and overcast shadow: they fall only on what is drawn in the layer.
function shade(s, E) {
  s.globalCompositeOperation = 'source-atop';
  const dark = (1 - E.d) * 0.6;
  if (dark > 0.01) { s.fillStyle = rgba('#0a0f2e', dark); s.fillRect(0, 0, W, H); }
  if (E.tw > 0.01 && E.wx.cover < 80) { s.fillStyle = rgba('#ff8a3d', E.tw * 0.12); s.fillRect(0, 0, W, H); }
  const gloom = clamp((E.wx.cover - 60) / 40, 0, 1) * 0.15 + (E.wet ? 0.08 : 0);
  if (gloom > 0) { s.fillStyle = rgba('#20283a', gloom); s.fillRect(0, 0, W, H); }
  s.globalCompositeOperation = 'source-over';
}
// Everything drawn over the layer cache: each object has a base y (which determines the layer and order), or an over flag (over the whole segment: seg — segment number,
// last by default), or l — an explicit layer (footprints on the ground).
function sceneItems(E) {
  return [...FOLK.map(a => ({ y: a.y, x: a.x, d: c => drawAgent(c, a, E) })), ...aniItems(E), ...snowItems(), ...woodItems(E.S), ...coneItems(), ...holidayItems(E), ...pathItems(E),
    { over: true, seg: 0, y: 0, x: 0, d: c => drawSmoke(c) }];
}
function drawSmoke(s) { for (const p of P.smoke) { const age = 1 - p.life / p.max, sz = age > 0.4 ? 2 : 1; R(s, p.x, p.y, sz, sz, rgba('#cfd2da', (p.life / p.max) * 0.45)); } }
// Weather in the air and foreground grass: in front of everything.
function drawForeground(sf, E) {
  for (const l of P.leaves) R(sf, l.x, l.y, 1, 1, l.rest > 0 ? rgba(l.c, 1 - l.rest / 5) : l.c);
  for (const f of P.snow) R(sf, f.x, f.y, 1, 1, 'rgba(255,255,255,0.85)');
  for (const d of P.rain) R(sf, d.x, d.y, 1, 4, 'rgba(200,214,236,0.7)');
  const wint = E.season === 'winter', sw0 = E.S;
  for (const u of L.tufts) {
    if (wint && !u.dry) continue;
    if (E.hal && Math.abs(u.x - L.skeleton.x) <= 5) continue;   // under the skeleton (Halloween) no grass grows, otherwise it covers its legs
    const sw = Math.round(Math.sin(T * (1.6 + E.wx.wind * 0.3) + u.x * 0.35) * (0.8 + Math.min(1.2, E.wx.wind / 6)));
    for (const b of u.bl) { const c = b.c ? sw0.grassA : sw0.grassB; R(sf, u.x + b.dx, u.y - b.h + 1, 1, b.h - 1, c); R(sf, u.x + b.dx + sw, u.y - b.h, 1, 1, c); }
  }
}
// Flame and sparks: the glowing object at the fire boundary (drawn straight to the screen between segments, not dimmed).
function drawFire(g, E) {
  if (E.fireLit) { const fl = [2, 4, 6, 4, 2], up = WOOD.flare > 0 ? 2 : 0; for (let i = 0; i < 5; i++) { const hh = fl[i] + up + Math.floor(Math.random() * 3) - 1; for (let k = 0; k < hh; k++) R(g, L.fireX - 2 + i, 155 - k, 1, 1, k < hh * 0.4 ? '#ff6a1a' : k < hh * 0.75 ? '#ffae2e' : '#fff0a0'); } }
  for (const p of P.sparks) R(g, p.x, p.y, 1, 1, rgba('#ffb347', Math.min(1, p.life * 1.5)));
}
function draw(E) {
  const g = ctx;
  g.globalCompositeOperation = 'source-over';
  g.drawImage(sky, 0, 0);
  const sa = Math.pow(1 - E.d, 2) * (1 - E.wx.cover / 100);
  if (sa > 0.02) for (const s of L.stars) { const a = sa * (0.55 + 0.45 * Math.sin(T * s.s + s.p)); R(g, s.x, s.y, 1, 1, rgba('#ffffff', a)); if (s.b && a > 0.5) { R(g, s.x - 1, s.y, 1, 1, rgba('#ffffff', a * 0.4)); R(g, s.x + 1, s.y, 1, 1, rgba('#ffffff', a * 0.4)); } }
  if (E.aurora && E.d < 0.35 && E.wx.cover < 70) aurora(g, (1 - E.d / 0.35) * (1 - E.wx.cover / 70));
  if (E.sun && E.wx.cover < 90) {
    const s = E.sun, c = mixHex('#fff3c4', '#ff9d5c', clamp(1 - Math.sin(Math.PI * s.p) * 2.5, 0, 1));
    g.globalCompositeOperation = 'lighter'; disc(g, s.x, s.y, 9, rgba(c, 0.12)); disc(g, s.x, s.y, 6, rgba(c, 0.15)); g.globalCompositeOperation = 'source-over';
    disc(g, s.x, s.y, 4, c);
  }
  if (E.moon && E.d < 0.7 && E.wx.cover < 90) {
    const m = E.moon, a = 1 - E.d / 0.7;
    g.globalCompositeOperation = 'lighter'; disc(g, m.x, m.y, 8, rgba('#c9d6ff', 0.07 * a)); g.globalCompositeOperation = 'source-over';
    disc(g, m.x, m.y, 4, rgba('#eef2fa', a)); R(g, m.x + 1, m.y - 2, 1, 1, rgba('#c7cfe0', a)); R(g, m.x - 2, m.y, 2, 1, rgba('#c7cfe0', a)); R(g, m.x + 1, m.y + 2, 1, 1, rgba('#c7cfe0', a));
  }
  const cov = E.wx.cover / 100, heavy = clamp((cov - 0.5) * 2, 0, 1);
  const cb = mixHex(mixHex(mixHex('#28304d', '#f3f5fa', E.d), '#f2a27e', E.tw * 0.55), mixHex('#1c2232', '#8f97a8', E.d), heavy * 0.7), cs = mixHex(cb, '#5b657c', 0.35);
  const nClouds = Math.round(cov * L.clouds.length);
  for (const c of L.clouds.slice(0, nClouds)) { for (const b of c.bl) disc(g, c.x + b.dx, c.y + b.dy + 1, b.r, cs); for (const b of c.bl) disc(g, c.x + b.dx, c.y + b.dy, b.r, cb); }

  // scene (everything dimmed at night): segments separated by glowing objects (BREAKS)
  const byLayer = lands.map(() => []), over = [], byY = (p, q) => p.y - q.y || p.x - q.x, lastSeg = sgx.length - 1;
  for (const o of sceneItems(E)) (o.over ? over : byLayer[o.l !== undefined ? o.l : layerOf(o.y)]).push(o);
  for (const c of sgx) { c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); }
  // end of segment: objects "over" this segment; in the last one also the weather and foreground grass
  const endSeg = k => { for (const o of over.filter(o => (o.seg === undefined ? lastSeg : o.seg) === k).sort(byY)) o.d(sgx[k]); if (k === lastSeg) drawForeground(sgx[k], E); };
  let seg = 0;
  lands.forEach((land, i) => {
    while (seg < BREAK_LAYER.length && i >= BREAK_LAYER[seg]) endSeg(seg++);
    const s = sgx[seg];
    s.drawImage(land, 0, 0);
    drawTracks(s, i);
    byLayer[i].sort(byY).forEach(o => o.d(s));
  });
  endSeg(seg);
  sgx.forEach((s, k) => { shade(s, E); g.drawImage(segs[k], 0, 0); if (BREAKS[k]) BREAKS[k].draw(g, E); });
  if (E.wx.kind === 'fog') {
    const fc = mixHex('#2a3046', '#d4d9e0', E.d);
    for (let y = 40; y < H; y += 2) { const a = 0.12 + 0.48 * Math.sin(clamp((y - 40) / 125, 0, 1) * Math.PI) * (0.85 + 0.15 * Math.sin(T * 0.3 + y * 0.2)); R(g, 0, y, W, 2, rgba(fc, a)); }
  }
  if (P.flash > 0) { g.fillStyle = 'rgba(235,240,255,0.35)'; g.fillRect(0, 0, W, H); }

  // light sources
  const night = 1 - E.d, win = FOLK.some(a => a.hidden && isAwake(a.id, E.h));   // light — only if someone is awake inside (sleepers and those outside don't count)
  g.globalCompositeOperation = 'lighter';
  if (win) { const wx = L.cabin.x + 7, wy = L.cabin.base - 6; disc(g, wx, wy, 10, rgba('#ffb347', 0.05 * night + 0.02)); disc(g, wx, wy, 6, rgba('#ffb347', 0.08 * night + 0.03)); }
  if (E.fireLit) { const k = (0.3 + 0.7 * night) * (0.8 + Math.random() * 0.2) * (WOOD.flare > 0 ? 1.5 : 1); disc(g, L.fireX, 154, 22, rgba('#ff8a30', 0.05 * k)); disc(g, L.fireX, 154, 14, rgba('#ff8a30', 0.08 * k)); disc(g, L.fireX, 155, 8, rgba('#ffa040', 0.12 * k)); }
  for (const f of P.flies) { const a = Math.sin(T * 2.2 + f.ph); if (a > 0.05) R(g, f.x, f.y, 1, 1, rgba('#d9ff70', a * 0.9 * night)); }
  halGlow(g, E);
  g.globalCompositeOperation = 'source-over';
  if (win) { R(g, L.cabin.x + 5, L.cabin.base - 7, 2, 3, '#ffd27a'); R(g, L.cabin.x + 8, L.cabin.base - 7, 1, 3, '#ffd27a'); }
  for (const z of P.zz) glyphZ(g, z.x, z.y, rgba('#e8ecff', Math.min(1, z.life / 2) * 0.8));
  halBulbs(g, E);
}