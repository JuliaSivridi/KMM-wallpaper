// Game settings in one file (settings.json): coordinates, time, weather, season, holidays, ✋ actions, animals and birds.
// This is what is chosen on the scene panels; the family and world state (snowman, firewood) are not included here.
// Values: "now" — as it really is; "all" — everything the game has (new holidays and animals turn on by themselves); otherwise a list of enabled ids.
//   time: "now" or a number of hours (21.5); weather: "now", "+1", "+2", "+3" (forecast) or clear / storm / rain / snow / fog; season: "now", winter, spring, summer, autumn;
//   animals / birds: { rate: "slow" | "fast", species: "all" | [ ... ] }.
// Fields missing from the file stay as they are. The current state is remembered in the browser (localStorage), and on first start in Tauri,
// when there is no record there, settings are read from settings.json next to the exe (the read_settings_file command in lib.rs).
const GS_KEY = 'forest.gs.v1';
const GS_SEASON = { winter: 0, spring: 4, summer: 6, autumn: 9 };   // month for manual season selection (like the ⛄ 🌱 🌻 🍂 buttons)

// Current game state as a settings object.
function collectGameSettings() {
  const ids = (list, on) => { const a = list.map(d => d.id); return a.every(on) ? 'all' : a.filter(on); };
  return {
    location: { lat: WEATHER.lat, lon: WEATHER.lon },
    time: OV.hour === null ? 'now' : Math.round(OV.hour * 100) / 100,
    weather: OV.wx ? OV.wx : OV.fc ? '+' + OV.fc : 'now',
    season: OV.month === null ? 'now' : (Object.keys(GS_SEASON).find(k => GS_SEASON[k] === OV.month) || 'now'),
    holidays: ids(HOLIDAYS, holidayOn),
    actions: ids(ACTIONS, actionOnGlobal),
    animals: { rate: FAST_ANI ? 'fast' : 'slow', species: ids(FAUNA.animals, faunaOn) },
    birds: { rate: FAST_BIRD ? 'fast' : 'slow', species: ids(FAUNA.birds, faunaOn) },
  };
}

// Applies a settings object: everything is validated first, and on error nothing changes. Returns the list of skipped unknown ids.
function applyGameSettings(o, boot) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('expected a single object like { ... }');
  const next = {}, skipped = [], bad = (f, why) => { throw new Error('field ' + f + ': ' + why); };
  const num = v => typeof v === 'number' && isFinite(v);
  if ('location' in o) {
    const l = o.location;
    if (!l || !num(l.lat) || !num(l.lon) || Math.abs(l.lat) > 90 || Math.abs(l.lon) > 180) bad('location', 'need { "lat": -90 to 90, "lon": -180 to 180 }');
    next.loc = { lat: l.lat, lon: l.lon };
  }
  if ('time' in o) {
    if (o.time === 'now') next.hour = null;
    else if (num(o.time) && o.time >= 0 && o.time < 24) next.hour = o.time;
    else bad('time', 'need "now" or a number of hours from 0 to 24, e.g. 21.5');
  }
  if ('weather' in o) {
    const w = o.weather;
    if (w === 'now') next.wx = [null, 0];
    else if (typeof w === 'string' && /^\+[123]$/.test(w)) next.wx = [null, +w.slice(1)];
    else if (typeof w === 'string' && Object.keys(WX_PRESET).includes(w)) next.wx = [w, 0];
    else bad('weather', 'need "now", "+1", "+2", "+3" or one of: ' + Object.keys(WX_PRESET).join(', '));
  }
  if ('season' in o) {
    if (o.season === 'now') next.month = null;
    else if (typeof o.season === 'string' && Object.keys(GS_SEASON).includes(o.season)) next.month = GS_SEASON[o.season];
    else bad('season', 'need "now", "winter", "spring", "summer" or "autumn"');
  }
  const list = (v, known, f) => {
    if (v === 'all') return known.slice();
    if (!Array.isArray(v)) bad(f, 'need "all" or a list [ ... ]');
    return v.filter(id => known.includes(id) || (skipped.push(f + ': ' + id), false));
  };
  if ('holidays' in o) next.holidays = list(o.holidays, HOLIDAYS.map(d => d.id), 'holidays');
  if ('actions' in o) next.actions = list(o.actions, ACTIONS.map(d => d.id), 'actions');
  for (const k of ['animals', 'birds']) if (k in o) {
    const s = o[k];
    if (!s || typeof s !== 'object' || Array.isArray(s)) bad(k, 'need an object { "rate": ..., "species": ... }');
    next[k] = {};
    if ('rate' in s) { if (s.rate !== 'slow' && s.rate !== 'fast') bad(k + '.rate', 'need "slow" or "fast"'); next[k].fast = s.rate === 'fast'; }
    if ('species' in s) next[k].on = list(s.species, FAUNA[k].map(d => d.id), k + '.species');
  }

  if (next.loc) {
    const changed = next.loc.lat !== WEATHER.lat || next.loc.lon !== WEATHER.lon;
    WEATHER.lat = next.loc.lat; WEATHER.lon = next.loc.lon; saveSettings();
    if (changed) fetchWeather();
  }
  if ('hour' in next) OV.hour = next.hour;
  if (next.wx) { OV.wx = next.wx[0]; OV.fc = next.wx[1]; }
  if ('month' in next) OV.month = next.month;
  if (next.holidays) { HOLIDAY_OFF = {}; for (const d of HOLIDAYS) if (!next.holidays.includes(d.id)) HOLIDAY_OFF[d.id] = true; saveHolidayOff(); }
  if (next.actions) { ACT_OFF = {}; for (const d of ACTIONS) if (!next.actions.includes(d.id)) ACT_OFF[d.id] = true; saveActionOff(); }
  for (const k of ['animals', 'birds']) {
    const n = next[k]; if (!n) continue;
    if (n.on) for (const d of FAUNA[k]) { if (n.on.includes(d.id)) delete FAUNA_OFF[d.id]; else FAUNA_OFF[d.id] = true; }
    if ('fast' in n && !(boot && Q.get('animals') === 'fast')) {   // at startup the ?animals=fast URL parameter wins over the file
      if (k === 'animals') { FAST_ANI = n.fast; aniT = FAST_ANI ? Math.min(aniT, 2) : rand(300, 600); }
      else { FAST_BIRD = n.fast; birdT = FAST_BIRD ? Math.min(birdT, 2) : rand(300, 600); }
    }
  }
  saveFaunaOff(); purgeFauna(); syncTopPanel();
  return skipped;
}

// settings.json next to the exe: read by the read_settings_file command on the Tauri side. There is no file in a regular browser.
async function readSettingsFile() {
  const T = window.__TAURI__, inv = T && ((T.core && T.core.invoke) || (T.tauri && T.tauri.invoke));
  if (!inv) return null;
  try { return await inv('read_settings_file'); }
  catch (e) { console.warn('settings.json not read:', e); return null; }
}

// State is remembered in the browser: once a second we compare it with what is stored there and write if something changed.
let _gsLast = null;
function gsPersist() {
  try { const t = JSON.stringify(collectGameSettings()); if (t !== _gsLast) { _gsLast = t; localStorage.setItem(GS_KEY, t); } } catch (e) {}
}
// Start: 1) the record in the browser; 2) if there is none at all (first run in Tauri) — settings.json next to the exe; 3) otherwise leave as is.
(function bootGameSettings() {
  let saved = null; try { saved = localStorage.getItem(GS_KEY); } catch (e) {}
  const start = () => { gsPersist(); setInterval(gsPersist, 1000); };
  if (saved) {
    try { applyGameSettings(JSON.parse(saved), true); } catch (e) { console.warn('saved settings not applied:', e); }
    start(); return;
  }
  readSettingsFile().then(txt => {
    if (txt) { try { applyGameSettings(JSON.parse(txt), true); } catch (e) { console.warn('settings.json not applied:', e); } }
    start();
  });
})();