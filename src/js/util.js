const Q = new URLSearchParams(location.search);
const H = 180;
let W = 320, L = null, T = 0, cacheKey = '';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const _rgb = {};
function rgb(h) { if (_rgb[h]) return _rgb[h]; const n = parseInt(h.slice(1), 16); return (_rgb[h] = [n >> 16 & 255, n >> 8 & 255, n & 255]); }
function mixHex(a, b, t) { const A = rgb(a), B = rgb(b); t = clamp(t, 0, 1); const c = i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0'); return '#' + c(0) + c(1) + c(2); }
function rgba(h, a) { const c = rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1).toFixed(3)})`; }
function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function disc(g, cx, cy, r, c) { g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); for (let dy = -r; dy <= r; dy++) { const dx = Math.floor(Math.sqrt(r * r - dy * dy + 0.5)); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } }
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map(r => r.map(v => (v + 0.5) / 16));