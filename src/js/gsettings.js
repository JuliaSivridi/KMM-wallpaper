// Game settings in one file (settings.json): coordinates, time, weather, season, holidays, ✋ actions, animals and birds, the ⚙ "Sky" panel switches.
// This is what is chosen on the scene panels; the family and world state (snowman, firewood) are not included here.
// Values: "now" — as it really is; "all" — everything the game has (new holidays and animals turn on by themselves); otherwise a list of enabled ids.
//   time: "now" or a number of hours (21.5); weather: "now", "+1", "+2", "+3" (forecast) or clear / storm / rain / snow / fog; season: "now", winter, spring, summer, autumn;
//   holidays: "all" | { halloween: "all" | "off" | { pumpkins: true, ghosts: "rare" }, newyear: ... }
//   animals / birds: { species: "all" | { "hare": "often", "sq": "off" } } (levels: off / rare / normal / often); sky: "all" | [ ... ] (puddles, rainbow, aurora, meteors, and the meteor showers: quadrantids, lyrids, etaaquariids, perseids, orionids, leonids, geminids).
// Fields missing from the file stay as they are. The current state is remembered in the browser (localStorage), and on first start in Tauri,
// when there is no record there, settings are read from settings.json next to the exe (the read_settings_file command in lib.rs).
const GS_KEY = 'forest.gs.v1';
const GS_SEASON = { winter: 0, spring: 4, summer: 6, autumn: 9 };   // month for manual season selection (like the ⛄ 🌱 🌻 🍂 buttons)

// Current game state as a settings object.
function collectGameSettings() {
  const ids = (list, on) => { const a = list.map(d => d.id); return a.every(on) ? 'all' : a.filter(on); };
  // holidays: "all" when everything is on; otherwise an object { halloween: "all" | "off" | { pumpkins: true, ..., ghosts: "rare" }, newyear: ... }
  const holidays = () => {
    const out = {};
    for (const h of HOLIDAYS) {
      if (HOLIDAY_OFF[h.id]) { out[h.id] = 'off'; continue; }
      const dec = Object.fromEntries(h.decor.map(d => [d.id, d.event ? evLevel(d.event) : decorOn(h.id, d.id)]));
      out[h.id] = Object.values(dec).every(v => v === true || v === 'normal') ? 'all' : dec;
    }
    return Object.values(out).every(v => v === 'all') ? 'all' : out;
  };
  const levels = list => { const a = list.map(d => d.id); return a.every(id => evLevel(id) === 'normal') ? 'all' : Object.fromEntries(a.map(id => [id, evLevel(id)])); };   // frequency levels: "all" = everything normal
  return {
    location: { lat: WEATHER.lat, lon: WEATHER.lon },
    time: OV.hour === null ? 'now' : Math.round(OV.hour * 100) / 100,
    weather: OV.wx ? OV.wx : OV.fc ? '+' + OV.fc : 'now',
    season: OV.month === null ? 'now' : (Object.keys(GS_SEASON).find(k => GS_SEASON[k] === OV.month) || 'now'),
    holidays: holidays(),
    actions: ids(ACTIONS, actionOnGlobal),
    sky: ids(SKY_ALL, skyOn),
    animals: { species: levels(FAUNA.animals) },
    birds: { species: levels(FAUNA.birds) },
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
  // holidays: "all" (everything on) or an object per holiday:
  //   "all" | "off" | an object { "pumpkins": true, "web": false, "ghosts": "often" } (decorations missing from it stay as they are;
  //   the ghosts take a level off / rare / normal / often, or true / false). Holidays missing from the object stay as they are.
  if ('holidays' in o) {
    const v = o.holidays, LVL = EV_LEVELS.map(l => l[0]), plan = {};
    const full = h => Object.fromEntries(h.decor.map(d => [d.id, d.event ? 'normal' : true]));
    const parse = (h, x, f) => {
      if (x === 'all') return { dec: full(h) };
      if (x === 'off') return { off: true };
      if (x && typeof x === 'object' && !Array.isArray(x)) {
        const dec = {};
        for (const id in x) {
          const d = h.decor.find(q => q.id === id), y = x[id];
          if (!d) { skipped.push(f + ': ' + id); continue; }
          if (d.event) { const lv = y === true ? 'normal' : y === false ? 'off' : y; if (!LVL.includes(lv)) bad(f + '.' + id, 'need true, false or one of: ' + LVL.join(', ')); dec[id] = lv; }
          else { if (typeof y !== 'boolean') bad(f + '.' + id, 'need true or false'); dec[id] = y; }
        }
        return { dec };
      }
      return bad(f, 'need "all", "off" or an object { ... }');
    };
    if (v === 'all') for (const h of HOLIDAYS) plan[h.id] = { dec: full(h) };
    else if (v && typeof v === 'object' && !Array.isArray(v)) for (const id in v) { const h = HOLIDAYS.find(q => q.id === id); if (h) plan[id] = parse(h, v[id], 'holidays.' + id); else skipped.push('holidays: ' + id); }
    else bad('holidays', 'need "all" or an object { "halloween": ..., "newyear": ... }');
    next.holidays = plan;
  }
  if ('actions' in o) next.actions = list(o.actions, ACTIONS.map(d => d.id), 'actions');
  if ('sky' in o) next.sky = list(o.sky, SKY_ALL.map(d => d.id), 'sky');
  // animals / birds: species is "all" (everything normal) or an object { "hare": "often", "sq": "off" }; species missing from the object stay as they are.
  const LV = EV_LEVELS.map(l => l[0]);
  const levels = (v, known, f) => {
    const out = {};
    if (v === 'all') known.forEach(id => { out[id] = 'normal'; });
    else if (v && typeof v === 'object' && !Array.isArray(v)) for (const id in v) {
      if (!known.includes(id)) { skipped.push(f + ': ' + id); continue; }
      if (!LV.includes(v[id])) bad(f + '.' + id, 'need one of: ' + LV.join(', '));
      out[id] = v[id];
    }
    else bad(f, 'need "all" or an object { "id": "off" | "rare" | "normal" | "often" }');
    return out;
  };
  for (const k of ['animals', 'birds']) if (k in o) {
    const s = o[k];
    if (!s || typeof s !== 'object' || Array.isArray(s)) bad(k, 'need an object { "species": ... }');
    if ('species' in s) next[k] = levels(s.species, FAUNA[k].map(d => d.id), k + '.species');
  }
  if (next.loc) {
    const changed = next.loc.lat !== WEATHER.lat || next.loc.lon !== WEATHER.lon;
    WEATHER.lat = next.loc.lat; WEATHER.lon = next.loc.lon; saveSettings();
    if (changed) fetchWeather();
  }
  if ('hour' in next) OV.hour = next.hour;
  if (next.wx) { OV.wx = next.wx[0]; OV.fc = next.wx[1]; }
  if ('month' in next) OV.month = next.month;
  if (next.holidays) {
    const lv = {};
    for (const h of HOLIDAYS) {
      const n = next.holidays[h.id]; if (!n) continue;
      if (n.off) { HOLIDAY_OFF[h.id] = true; continue; }   // the decorations keep their own switches
      delete HOLIDAY_OFF[h.id];
      for (const id in n.dec) { const d = h.decor.find(q => q.id === id); if (d.event) lv[d.event] = n.dec[id]; else if (n.dec[id]) delete HOLIDAY_OFF[h.id + '.' + id]; else HOLIDAY_OFF[h.id + '.' + id] = true; }
    }
    saveHolidayOff(); setEvLevels(lv);
  }
  if (next.sky) { SKY_OFF = {}; for (const d of SKY_ALL) if (!next.sky.includes(d.id)) SKY_OFF[d.id] = true; saveSkyOff(); }
  if (next.actions) { ACT_OFF = {}; for (const d of ACTIONS) if (!next.actions.includes(d.id)) ACT_OFF[d.id] = true; saveActionOff(); }
  for (const k of ['animals', 'birds']) if (next[k]) setEvLevels(next[k]);
  purgeFauna(); syncTopPanel();
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