function step(dt) {
  T += dt;
  const E = env();
  const key = Math.floor(E.h * 120) + '|' + E.season + '|' + W + '|' + E.wx.cover + '|' + (E.hal ? E.hal.n : 0) + '|' + (E.ny ? 1 : 0);
  if (key !== cacheKey) { cacheKey = key; buildSky(E); buildLand(E); }
  for (const a of FOLK) updateAgent(a, dt, E);
  updateSnowman(dt, E);
  updatePath(dt, E);
  updateTracks(dt, E);
  updateWood(dt, E);
  updateCones(dt, E);
  updateAnimals(dt, E);
  updateGhosts(dt, E);
  updateParticles(dt, E);
  draw(E);
}
function resize() {
  W = Math.max(200, Math.round(H * innerWidth / Math.max(1, innerHeight)));
  for (const c of [cv, sky, ...segs, ...lands]) { c.width = W; c.height = H; }
  layout();
  TRACKS.length = 0; P.snow = []; P.flies = []; P.leaves = []; P.smoke = []; P.sparks = []; P.zz = [];
  cacheKey = '';
  placeFolk(env());
}
addEventListener('resize', resize);
// Family at start: 1) from the browser (localStorage); 2) if there is no record in the browser at all (first launch in Tauri) —
// family.json next to the exe, read by the read_family_file command on the Tauri side; 3) otherwise the list is empty.
// An empty list that the person left themselves (the record "[]") is not overwritten by the file.
async function readFamilyFile() {
  const T = window.__TAURI__, inv = T && ((T.core && T.core.invoke) || (T.tauri && T.tauri.invoke));
  if (!inv) return null;   // regular browser: there is no file
  try { const txt = await inv('read_family_file'); return txt ? parseFamilyFile(txt) : null; }
  catch (e) { console.warn('family.json not read:', e); return null; }
}
(function bootFamily() {
  const saved = loadFromStorage();
  if (saved) { applyFamily(saved); return; }
  renderFamilyList();
  let fresh = true; try { fresh = localStorage.getItem(STORAGE_KEY) === null; } catch (e) {}
  if (fresh) readFamilyFile().then(arr => { if (arr && arr.length && !window.FAMILY.length) applyFamily(arr); });
})();
resize();
let last = performance.now();
function loop(ts) {
  requestAnimationFrame(loop);
  if (document.hidden) return;
  const dt = (ts - last) / 1000; if (dt < 1 / FPS - 0.002) return;
  last = ts; step(Math.min(dt, 0.5));
}
requestAnimationFrame(loop);
fetchWeather(); setInterval(fetchWeather, 20 * 60 * 1000);