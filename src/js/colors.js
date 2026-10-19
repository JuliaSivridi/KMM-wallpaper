// Limited palettes for the editor and the showcase. A simple retro set instead of "the whole spectrum".
window.SWATCH = {
  // two light, two tan, two dark
  skin:  ['#f8d8b8', '#f0c4a0', '#dca36f', '#c0844f', '#8d5524', '#5c3317'],
  // chestnut, ginger, ash-brown, blond, black, light grey, dark grey, red, green, blue
  hair:  ['#7b3f1e', '#b8561f', '#a98a5a', '#e8cf7a', '#1f1a17', '#d4d0cc', '#8d9096', '#c8323a', '#4f9a4a', '#4a78d0'],
  // clothes and hats: black, grey, white, navy, light blue, red, orange, yellow, green, brown, purple, pink
  cloth: ['#1c1c22', '#4a4d55', '#e8e4da', '#1f2d5a', '#7fc0ea', '#c0392b', '#d9772a', '#e6b93a', '#3f7f4a', '#6b4a2f', '#6a4a9a', '#d977a0'],
  shoes: ['#1c1c22', '#4a3020', '#7c8088', '#e8e4da', '#a3322a', '#1f2d5a'],
};
const _SW_FIELDS = { skin: 'skin', hair: 'hair', dressColor: 'cloth', topColor: 'cloth', bottomColor: 'cloth', hatColor: 'cloth', shoes: 'shoes' };
function snapColor(hex, list) {
  const n = parseInt(String(hex).slice(1), 16);
  if (isNaN(n)) return list[0];
  let best = list[0], bd = Infinity;
  for (const c of list) {
    const m = parseInt(c.slice(1), 16);
    const d = ((n >> 16 & 255) - (m >> 16 & 255)) ** 2 + ((n >> 8 & 255) - (m >> 8 & 255)) ** 2 + ((n & 255) - (m & 255)) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
// Snaps old-save and loaded-file colors to the nearest palette colors (mutates the objects in place).
function snapFamily(arr) {
  for (const p of arr) for (const k in _SW_FIELDS) if (p[k]) p[k] = snapColor(p[k], window.SWATCH[_SW_FIELDS[k]]);
  return arr;
}