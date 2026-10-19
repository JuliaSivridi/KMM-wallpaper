let FAST_ANI = Q.get('animals') === 'fast', FAST_BIRD = Q.get('animals') === 'fast';
const ANI = [];
// What wildlife exists at all (the ⚙ panels next to the "Animals" and "Birds" rows). Disabled creatures don't appear; the global switch is stored in the browser.
const FAUNA = {
  animals: [{ id: 'hare', icon: '🐇', name: 'Hare' }, { id: 'sq', icon: '🐿️', name: 'Squirrel' }],
  birds: [{ id: 'sparrow', icon: '🐦', name: 'Sparrow' }, { id: 'tit', icon: '🐦', name: 'Tit' }, { id: 'bullfinch', icon: '🐦', name: 'Bullfinch' },
          { id: 'crow', icon: '🐦', name: 'Crow' }, { id: 'magpie', icon: '🐦', name: 'Magpie' }, { id: 'jackdaw', icon: '🐦', name: 'Jackdaws (flock)' }],
};
const FAUNA_KEY = 'forest.fauna.v1';
let FAUNA_OFF = {};   // { crow: true } — this creature is absent
try { const o = JSON.parse(localStorage.getItem(FAUNA_KEY) || 'null'); if (o && typeof o === 'object') FAUNA_OFF = o; } catch (e) {}
const faunaOn = id => !FAUNA_OFF[id];
function saveFaunaOff() { try { localStorage.setItem(FAUNA_KEY, JSON.stringify(FAUNA_OFF)); } catch (e) {} }
// Disabled creatures already on the scene are removed immediately.
function purgeFauna() { for (const a of ANI) if (!faunaOn(a.kind === 'bird' ? a.sp : a.kind)) a.dead = true; }
let aniT = FAST_ANI ? 2 : rand(300, 600), birdT = FAST_BIRD ? 3 : rand(300, 600);
const nextAni = () => FAST_ANI ? rand(4, 10) : rand(300, 600);
const nextBird = () => FAST_BIRD ? rand(4, 10) : rand(300, 600);
function aniPal(kind, E, dep) {
  const w = E.season === 'winter', hz = dep >= 1 ? 0 : hazeOf(dep) * 0.6, fog = c => hz ? mixHex(c, E.S.hillNear, hz) : c;
  if (kind === 'sq') return { B: fog(w ? '#8c8a8e' : '#a84a22'), K: fog(w ? '#5e5a5c' : '#6e2e14'), T: fog(w ? '#a07a66' : '#d97a3a'), b: fog(w ? '#e8e2da' : '#e6c9a0'), P: fog(w ? '#5e5a5c' : '#7a3a1a'), E: '#111111' };
  return { G: fog(w ? '#bdb4aa' : '#8a5a36'), h: fog(w ? '#cfc6bc' : '#a8764a'), k: fog(w ? '#3a342e' : '#2a2018'), W: '#f4f4f4', l: fog(w ? '#e4ddd4' : '#c9a27a'), E: '#111111' };
}
const trunkCX = t => t.x - 2;
const crownY = t => t.base - Math.round(t.h * 0.58);
const smallPool = E => (E.season === 'winter' ? ['sparrow', 'tit', 'bullfinch', 'bullfinch'] : ['sparrow', 'sparrow', 'tit', 'tit', 'bullfinch']).filter(faunaOn);
function spawnBird(E) {
  if (E.wet || E.d <= 0.25) return;
  // previous chances: flock 8%, small and big 46% each; disabled species are excluded from the draw
  const kinds = [['flock', 0.08, faunaOn('jackdaw')], ['small', 0.46, smallPool(E).length > 0], ['big', 0.46, faunaOn('crow') || faunaOn('magpie')]].filter(k => k[2]);
  let r = Math.random() * kinds.reduce((s, k) => s + k[1], 0);
  for (const k of kinds) { r -= k[1]; if (r < 0) return spawnBirds(k[0], E); }
}
function spawnAnimal(E) {
  if (E.wet) return;
  const hare = faunaOn('hare'), sq = faunaOn('sq');
  if (!hare && !sq) return;
  if (hare && (!sq || Math.random() < 0.5)) {
    const fromLeft = Math.random() < 0.5, front = Math.random() < 0.4, y = front ? Math.round(rand(163, 168)) : Math.round(rand(131, 138));
    ANI.push({ kind: 'hare', front, x: fromLeft ? -10 : W + 10, y, dir: fromLeft ? 1 : -1, speed: front ? 34 : 24, ph: 0, state: 'run', t: 0, dep: front ? 1 : (y - 126) / 26 });
  } else {
    const trees = L.trees.filter(t => t.base >= 146 && t.x > 12 && t.x < W - 12);
    if (!trees.length) return;
    const tr = trees[Math.floor(Math.random() * trees.length)], left = tr.x < W / 2;
    ANI.push({ kind: 'sq', x: left ? -8 : W + 8, y: tr.base, dir: left ? 1 : -1, tree: tr, state: 'toTree', t: 0, ph: 0, jumps: 0 });
  }
}
function smallPerch() {
  if (Math.random() < 0.25) { const y = Math.round(rand(150, 170)); return { x: rand(W * 0.15, W * 0.95), y, ground: true }; }
  const trees = L.trees.filter(t => t.base >= 146);
  const t = trees[Math.floor(Math.random() * trees.length)];
  return { x: t.x + Math.round(rand(-7, 8)), y: t.base - Math.round(t.h * rand(0.5, 0.62)), ground: false };
}
function treeTops(dirFrom, n) {
  const ts = L.trees.filter(t => t.base >= 146 && t.x > 15 && t.x < W - 15);
  const out = []; for (let i = 0; i < n && ts.length; i++) out.push(ts.splice(Math.floor(Math.random() * ts.length), 1)[0]);
  return out;
}
function spawnBirds(size, E) {
  const fromLeft = Math.random() < 0.5;
  if (size === 'flock') {
    const n = 8 + Math.floor(Math.random() * 5), dir = fromLeft ? 1 : -1, y0 = rand(30, 65), land = Math.random() < 0.4;
    const tops = land ? treeTops(dir, 4) : [], grp = { leaveAt: Infinity, dir };
    for (let i = 0; i < n; i++) {
      const b = { kind: 'bird', size: 'mid', sp: 'jackdaw', grp, x: (fromLeft ? -12 : W + 12) - dir * rand(0, 70), y: y0 + rand(-14, 14), dir, state: 'fly', ph: Math.random() * 3, t: 0, wob: Math.random() * 6 };
      if (tops.length) { const t = tops[i % tops.length]; b.target = { x: t.x + Math.round(rand(-6, 7)), y: t.base - t.h + 1 + Math.floor(rand(0, 4)) }; }
      else b.target = { x: fromLeft ? W + 16 + rand(0, 40) : -16 - rand(0, 40), y: b.y + rand(-10, 10), leave: true };
      ANI.push(b);
    }
    return;
  }
  if (size === 'small') {
    const pool = smallPool(E);
    const sp = pool[Math.floor(Math.random() * pool.length)], n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) ANI.push({ kind: 'bird', size, sp, x: fromLeft ? -8 - i * 9 : W + 8 + i * 9, y: rand(55, 95), dir: fromLeft ? 1 : -1, state: 'fly', target: smallPerch(), stops: 2 + Math.floor(Math.random() * 4), ph: Math.random(), t: 0 });
  } else {
    const bigs = ['crow', 'magpie'].filter(faunaOn), sp = bigs[Math.floor(Math.random() * bigs.length)], y = rand(25, 70), dir = fromLeft ? 1 : -1;
    const b = { kind: 'bird', size, sp, x: fromLeft ? -12 : W + 12, y, dir, state: 'fly', ph: Math.random(), t: 0, target: null };
    if (Math.random() < 0.45) {
      const ahead = L.trees.filter(t => t.base >= 146 && (t.x - b.x) * dir > 60 && t.x > 15 && t.x < W - 15);
      if (ahead.length) { const t = ahead[Math.floor(Math.random() * ahead.length)]; b.target = { x: t.x + 1, y: t.base - t.h + 1 }; }
    }
    if (!b.target) b.target = { x: fromLeft ? W + 14 : -14, y: y + rand(-15, 15), leave: true };
    ANI.push(b);
  }
}
function updateBird(a, dt) {
  if (a.state === 'perch') {
    a.t -= dt;
    if (Math.random() < dt * (a.size === 'small' ? 0.9 : 0.3)) a.dir *= -1;
    if (a.grp) {
      if (a.grp.leaveAt === Infinity) a.grp.leaveAt = T + rand(5, 10);
      if (T >= a.grp.leaveAt) { a.target = { x: a.grp.dir > 0 ? W + 16 + rand(0, 30) : -16 - rand(0, 30), y: rand(25, 60), leave: true }; a.state = 'fly'; a.dir = a.grp.dir; }
      return;
    }
    if (a.t <= 0) {
      if (a.size === 'small' && --a.stops > 0) { a.target = smallPerch(); }
      else { const out = a.size === 'big' ? a.dir : (Math.random() < 0.5 ? 1 : -1); a.target = { x: out > 0 ? W + 14 : -14, y: rand(30, 80), leave: true }; }
      a.state = 'fly';
    }
    return;
  }
  const tg = a.target, dx = tg.x - a.x, dy = tg.y - a.y, dist = Math.hypot(dx, dy), sp = (a.size === 'small' ? 48 : a.size === 'mid' ? 40 : 32) * dt;
  if (Math.abs(dx) > 0.5) a.dir = dx > 0 ? 1 : -1;
  if (dist <= sp) {
    a.x = tg.x; a.y = tg.y;
    if (tg.leave) { a.dead = true; return; }
    a.state = 'perch'; a.ground = !!tg.ground; a.t = a.size === 'small' ? rand(1.5, 4.5) : rand(3, 8);
  } else { a.x += dx / dist * sp; a.y += dy / dist * sp + (a.wob !== undefined ? Math.sin(a.ph * 2.5 + a.wob) * 6 * dt : 0); }
}
const SQ_GROUND = { dur: 0.2, dist: 11, lift: 2, shortRest: [0.02, 0.07], longRest: [0.3, 1.0], hops: 4 };
const SQ_CLIMB  = { dur: 0.16, dist: 5, lift: 0, shortRest: [0.08, 0.25], longRest: [0.5, 1.3], hops: 4 };
function hopStep(a, dt, c) {
  if (a.rest > 0) { a.rest -= dt; a.moving = false; a.lift = 0; return 0; }
  a.moving = true;
  const k = Math.min(dt / c.dur, 1 - (a.hp || 0)); a.hp = (a.hp || 0) + k; a.lift = Math.sin(a.hp * Math.PI) * c.lift;
  if (a.hp >= 0.999) {
    a.hp = 0; a.lift = 0;
    a.hops = (a.hops || 3) - 1;
    if (a.hops <= 0) { a.rest = rand(c.longRest[0], c.longRest[1]); a.hops = 2 + Math.floor(Math.random() * c.hops); }
    else a.rest = rand(c.shortRest[0], c.shortRest[1]);
  }
  return k * c.dist;
}
// What animals and birds add to the shared object list in render.js. Depth — base y: a hare or squirrel on the ground by its y, a squirrel on a tree by the tree base
// (in front of the trunk, behind everything that is closer). Birds in the air and on trees — above the foliage (over), as before; on the ground — by y.
function aniItems(E) {
  const o = [];
  for (const a of ANI) {
    const d = c => drawAnimal(c, a, E);
    if (a.kind === 'bird') { o.push(a.state === 'perch' && a.ground ? { y: a.y, x: a.x, d } : { over: true, y: a.y, x: a.x, d }); continue; }
    o.push({ y: a.kind === 'sq' && a.state !== 'toTree' && a.state !== 'away' ? a.tree.base + 0.1 : a.y, x: a.x, d });
  }
  return o;
}
function updateAnimals(dt, E) {
  aniT -= dt; if (aniT <= 0) { spawnAnimal(E); aniT = nextAni(); }
  birdT -= dt; if (birdT <= 0) { spawnBird(E); birdT = nextBird(); }
  for (const a of ANI) {
    a.ph += dt;
    if (a.kind === 'bird') { updateBird(a, dt); continue; }
    if (a.kind === 'hare') {
      if (a.state === 'run') {
        a.x += a.dir * a.speed * dt;
        if (a.front && !a.turned) for (const f of FOLK) { if (f.hidden) continue; const dx = (f.x - a.x) * a.dir; if (dx > 0 && dx < 38) { a.state = 'stop'; a.t = 0.7; a.turned = true; break; } }
      } else if (a.state === 'stop') { a.t -= dt; if (a.t <= 0) { a.dir *= -1; a.state = 'run'; a.speed *= 1.3; } }
      if (a.x < -20 || a.x > W + 20) a.dead = true;
      continue;
    }
    const t = a.tree;
    if (a.state === 'toTree' || a.state === 'away') {
      a.x += a.dir * hopStep(a, dt, SQ_GROUND);
      if (a.state === 'toTree' && (trunkCX(t) - a.x) * a.dir <= 0) { a.x = trunkCX(t); a.state = 'up'; }
      if (a.state === 'away' && (a.x < -12 || a.x > W + 12)) a.dead = true;
    } else if (a.state === 'up') {
      a.y -= hopStep(a, dt, SQ_CLIMB); if (a.y <= crownY(t)) { a.y = crownY(t); a.state = 'perch'; a.t = rand(2, 5); a.dir = Math.random() < 0.5 ? 1 : -1; }
    } else if (a.state === 'perch') {
      a.t -= dt;
      if (a.t <= 0) {
        const nb = a.jumps < 3 && Math.random() < 0.65 ? L.trees.filter(o => o !== t && o.base >= 146 && Math.abs(o.x - t.x) >= 10 && Math.abs(o.x - t.x) <= 55) : [];
        if (nb.length) { const o = nb[Math.floor(Math.random() * nb.length)]; Object.assign(a, { state: 'jump', from: { x: a.x, y: a.y }, to: o, t: 0, dur: 0.45 + Math.abs(o.x - t.x) / 80, dir: o.x > t.x ? 1 : -1 }); a.jumps++; }
        else a.state = 'down';
      }
    } else if (a.state === 'jump') {
      a.t += dt; const k = Math.min(1, a.t / a.dur), tx = trunkCX(a.to), ty = crownY(a.to);
      a.x = a.from.x + (tx - a.from.x) * k; a.y = a.from.y + (ty - a.from.y) * k - Math.sin(k * Math.PI) * 8;
      if (k >= 1) { a.tree = a.to; a.state = 'perch'; a.t = rand(1.5, 4); }
    } else if (a.state === 'down') {
      a.y += hopStep(a, dt, SQ_CLIMB); if (a.y >= t.base) { a.y = t.base; a.state = 'away'; a.dir = a.x < W / 2 ? -1 : 1; }
    }
  }
  for (let i = ANI.length - 1; i >= 0; i--) if (ANI[i].dead) ANI.splice(i, 1);
}
function drawAnimal(g, a, E) {
  let rows, pal, lift = 0, flipV = false, face = a.dir;
  if (a.kind === 'bird') {
    pal = BIRD_PAL[a.sp];
    const small = a.size === 'small';
    if (a.state === 'perch') {
      if (small) rows = a.ground && (a.ph % 1.1) < 0.35 ? BIRD_SPR.peck : BIRD_SPR.sit;
      else rows = a.size === 'mid' ? BIRD_SPR.jS : BIRD_SPR[a.sp === 'crow' ? 'crowS' : 'magS'];
    } else {
      if (small) {
        rows = (a.ph % 0.7) < 0.45 ? (Math.floor(a.ph * 14) % 2 ? BIRD_SPR.flyA : BIRD_SPR.flyB) : BIRD_SPR.fold;
        lift = Math.round(Math.sin(a.ph * Math.PI / 0.35) * 1.5);
      } else if (a.size === 'mid') {
        rows = [BIRD_SPR.jA, BIRD_SPR.jG, BIRD_SPR.jB, BIRD_SPR.jG][Math.floor(a.ph * 12) % 4];
      } else {
        const p = a.sp === 'crow' ? 'crow' : 'mag', beat = [BIRD_SPR[p + 'A'], BIRD_SPR[p + 'G'], BIRD_SPR[p + 'B'], BIRD_SPR[p + 'G']];
        rows = (a.ph % 2.6) < 1.6 ? beat[Math.floor(a.ph * 6) % 4] : BIRD_SPR[p + 'G'];
      }
      const w = rows[0].length, h = rows.length, left = Math.round(a.x) - Math.floor(w / 2), top = Math.round(a.y) - Math.floor(h / 2) - lift;
      rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = pal[c]; g.fillRect(a.dir < 0 ? left + w - 1 - i : left + i, top + j, 1, 1); } });
      return;
    }
  } else if (a.kind === 'hare') {
    pal = aniPal('hare', E, a.dep);
    const p = (a.ph * 4.5) % 1, air = p > 0.15 && p < 0.85;
    if (a.state === 'stop') rows = a.front ? ANI_SPR.haS : ANI_SPR.hmB;
    else { rows = a.front ? (air ? ANI_SPR.haA : ANI_SPR.haB) : (air ? ANI_SPR.hmA : ANI_SPR.hmB); lift = Math.round(Math.sin(p * Math.PI) * (a.front ? 2 : 1)); }
  } else {
    pal = aniPal('sq', E, a.tree.dep);
    if (a.state === 'up' || a.state === 'down') { rows = a.moving ? ANI_SPR.upA : ANI_SPR.upB; flipV = a.state === 'down'; face = 1; }
    else if (a.state === 'perch') rows = (a.ph % 2.3) < 0.15 ? ANI_SPR.sqA : ANI_SPR.sqB;
    else if (a.state === 'jump') rows = ANI_SPR.sqA;
    else { rows = a.moving ? ANI_SPR.sqA : ANI_SPR.sqB; lift = Math.round(a.lift || 0); }
  }
  const w = rows[0].length, h = rows.length, left = Math.round(a.x) - Math.floor(w / 2), top = Math.round(a.y) - h - lift;
  rows.forEach((row, j) => { const jj = flipV ? h - 1 - j : j; for (let i = 0; i < w; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = pal[c]; g.fillRect(face < 0 ? left + w - 1 - i : left + i, top + jj, 1, 1); } });
}