// Depth-layer edges by base y. Dense where people and the fire stand: 159 is the fire boundary, the people line y=160 lies in the layer [159, 161).
const LAYER_EDGES = [133, 137, 141, 144, 146, 148, 150, 152, 154, 156, 159, 161];
const LAST_LAYER = LAYER_EDGES.length;
const layerOf = base => { const i = LAYER_EDGES.findIndex(e => base < e); return i < 0 ? LAST_LAYER : i; };
const hazeOf = dep => dep < 0 ? 0.5 : (1 - dep) * 0.42;
function ellipse(g, cx, cy, rx, ry, c) {
  g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -ry; dy <= ry; dy++) { const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5))))); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); }
}

function layout() {
  const r = rng(7);
  L = {};
  L.cabin = { x: Math.round(W * 0.10), base: 142 };
  L.pile = { x: L.cabin.x - 14, w: 12, base: 142 };   // woodshed left of the house, right against the wall
  L.block = { x: L.cabin.x - 6, y: 150 };               // chopping block a bit in front
  L.doorX = L.cabin.x + 17;
  L.fireX = Math.round(W * 0.36); L.seatX = L.fireX - 11; L.seat2X = L.fireX + 11;
  L.far = []; L.near = [];
  for (let x = 0; x < W; x++) {
    L.far.push(Math.round(97 + 7 * Math.sin(x * 0.018 + 1.3) + 4 * Math.sin(x * 0.051 + 0.2) + 2 * Math.sin(x * 0.12 + 2)));
    L.near.push(Math.round(109 + 3 * Math.sin(x * 0.033 + 0.7) + 2 * Math.sin(x * 0.09 + 1)));
  }
  const blocked = (x, b) => (b > 141 && x > L.cabin.x - 8 && x < L.cabin.x + 31) || (b > 145 && Math.abs(x - L.fireX) < 19);
  L.edge = []; for (let x = -2; x < W + 3; x += 2 + Math.floor(r() * 4)) L.edge.push({ type: r() < 0.35 ? 'b' : 'p', x, base: 123 + Math.floor(r() * 2), h: 18 + Math.floor(r() * 18), s: 1000 + x, dep: -1 });
  L.under = []; for (let x = -4; x < W + 4; x += 3 + Math.floor(r() * 4)) L.under.push({ x, y: 124 + Math.floor(r() * 3), r: 2 + Math.floor(r() * 3), k: r() });
  L.trees = [];
  [127, 129, 131, 134, 137, 140, 143, 146, 149, 151].forEach((base, ri) => {
    const dep = (base - 126) / 26, sp = 4 + dep * 38;
    let x = -6 + r() * sp;
    while (x < W + 6) {
      const tx = Math.round(x), b = base + Math.floor(r() * 2);
      if (!blocked(tx, b)) L.trees.push({ type: r() < 0.32 ? 'b' : 'p', x: tx, base: b, h: Math.round((b - 104) * (1.5 + r() * 0.6)), s: 2000 + ri * 500 + tx, dep });
      x += sp * (0.6 + r() * 0.8);
    }
  });
  L.trees = L.trees.filter(t => !(t.base > 138 && t.base < 153 && t.x > L.pile.x - 5 && t.x < L.pile.x + L.pile.w + 4));   // no trees by the woodshed and the chopping block
  L.sitTrees = L.trees.filter(t => t.dep > 0.8 && t.x > W * 0.42 && t.x < W * 0.95);
  if (!L.sitTrees.length) L.sitTrees = [{ x: Math.round(W * 0.7) }];
  L.birches = L.trees.filter(t => t.type === 'b' && t.dep > 0.6);
  L.bushes = [];
  for (let i = 0; i < W / 7; i++) {
    const y = 128 + Math.floor(r() * 28), x = Math.floor(r() * W);
    if (blocked(x, y)) continue;
    L.bushes.push({ x, y, dep: Math.min(1, (y - 126) / 26), t: ['j', 'r', 'b', 'b'][Math.floor(r() * 4)], s: 800 + i });
  }
  L.bushes = L.bushes.filter(b => !(b.y > 138 && b.y < 156 && b.x > L.pile.x - 6 && b.x < L.pile.x + L.pile.w + 8));
  L.rocks = [{ x: Math.round(W * 0.585), y: 154, rx: 8, ry: 5 }, { x: Math.round(W * 0.80), y: 152, rx: 11, ry: 7 }, { x: Math.round(W * 0.22), y: 152, rx: 5, ry: 3 }, { x: Math.round(W * 0.94), y: 157, rx: 6, ry: 4 },
             { x: Math.round(W * 0.47), y: 139, rx: 5, ry: 3 }, { x: Math.round(W * 0.70), y: 135, rx: 4, ry: 2 }, { x: Math.round(W * 0.28), y: 133, rx: 3, ry: 2 }];
  L.speck = []; for (let i = 0; i < W * 1.2; i++) L.speck.push({ x: Math.floor(r() * W), y: 125 + Math.floor(r() * 55), w: 1 + (r() < 0.4 ? 1 : 0), k: r() });
  L.flowers = []; for (let i = 0; i < W * 0.2; i++) L.flowers.push({ x: Math.floor(r() * W), y: 130 + Math.floor(r() * 48), c: Math.floor(r() * 4) });
  L.shrooms = []; for (let i = 0; i < 8; i++) L.shrooms.push({ x: Math.floor(W * 0.45 + r() * W * 0.52), y: 154 + Math.floor(r() * 18), red: r() < 0.5 });
  L.tufts = []; for (let x = 0; x < W; x += 2 + Math.floor(r() * 4)) { const bl = [], n = 2 + Math.floor(r() * 3); for (let k = 0; k < n; k++) bl.push({ dx: k - 1, h: 3 + Math.floor(r() * 4), c: r() < 0.5 }); L.tufts.push({ x, y: 171 + Math.floor(r() * 9), bl, dry: r() < 0.25 }); }
  L.drifts = []; for (let i = 0; i < 6; i++) L.drifts.push({ x: Math.floor(r() * W), y: 174 + Math.floor(r() * 4), w: 14 + Math.floor(r() * 24) });
  L.stars = []; for (let i = 0; i < W * 0.25; i++) L.stars.push({ x: Math.floor(r() * W), y: Math.floor(r() * 95), p: r() * 6.28, s: 0.5 + r() * 2, b: r() < 0.12 });
  L.clouds = []; for (let i = 0; i < 12; i++) { const bl = [], n = 3 + Math.floor(r() * 3); for (let k = 0; k < n; k++) bl.push({ dx: k * 6 - n * 3 + Math.floor(r() * 4), dy: Math.floor(r() * 3) - 1, r: 3 + Math.floor(r() * 4) }); L.clouds.push({ x: r() * W, y: 14 + Math.floor(r() * 40), v: 0.6 + r() * 1.2, bl }); }
  layoutHolidays();
}