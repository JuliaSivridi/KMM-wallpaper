// Event registry and the single scheduler. Every random happening (a hare, a sparrow, a ghost, a shooting star...) is one entry in EVENTS; one loop (updateEvents) walks the table.
// A new event is added with one defineEvent({...}) call next to the code that draws it. Fields:
//   id      — unique id (also the key of the frequency level and of the ?<id>=fast test parameter);
//   group   — 'animals' | 'birds' | 'holidays' | 'sky' (which panel it belongs to);
//   icon, name — for the panels;
//   gap     — mean interval in seconds at the "normal" level (a number or a function of E);
//   can(E)  — may it happen right now (no downpour, daylight...); when it is false at the moment the timer ends, the timer just starts again;
//   on(E)   — optional: is the event "alive" at all now (e.g. only while a holiday lasts); while false, its timer does not run and is reset;
//   run(E)  — what happens;
//   first   — optional: seconds until the first occurrence after it becomes alive (default — an ordinary interval);
//   spread  — optional [min, max] share of the mean interval (default [0.667, 1.333]: an interval of 300–600 s for a mean of 450);
//   poisson — optional: no timer, every frame a chance dt * mul(E) / mean (for events whose rate changes all the time, like meteors); mul(E) is optional;
//   fast    — mean interval in the test mode "fast" (number or function of E, default 7 s);
//   when    — optional: a short note for the panels when the event happens only at a certain time ("evening", "at night");
//   lvl     — optional: function returning the level when it is not stored here (meteors follow the ⚙ "Sky" switch).
// Frequency levels: off / rare / normal / often. The interval is multiplied by 2.5 / 1 / 0.1, "off" means the event never happens.
// Levels are stored in the browser (forest.events.v1) and in settings.json; "normal" is not stored.
// Test parameters: ?events=fast — everything every few seconds (?animals=fast does the same, as before); ?<id>=fast — one event, e.g. ?ghosts=fast, ?meteors=fast, ?hare=fast.
const EV_KEY = 'forest.events.v1';
const EV_LEVELS = [['off', '❌', 'Off'], ['rare', '🚶', 'Rare'], ['normal', '🏃', 'Normal'], ['often', '🚴', 'Often']];
const EV_MULT = { rare: 2.5, normal: 1, often: 0.1 };   // the one place to tune how "rare" and "often" feel
let EV_LV = {};   // { crow: 'off', hare: 'often' } — everything that is not "normal"
try {
  const o = JSON.parse(localStorage.getItem(EV_KEY) || 'null');
  if (o && typeof o === 'object') for (const k in o) if (o[k] === 'off' || o[k] === 'rare' || o[k] === 'often') EV_LV[k] = o[k];
} catch (e) {}

const EVENTS = [], EV_T = {};   // EV_T[id] — seconds left until the next occurrence
function defineEvent(ev) { EVENTS.push(ev); }
const evLevel = id => EV_LV[id] || 'normal';
const evLevelOf = ev => ev.lvl ? ev.lvl() : evLevel(ev.id);
function saveEvLevels() { try { localStorage.setItem(EV_KEY, JSON.stringify(EV_LV)); } catch (e) {} }
// map: { id: level }; the timers of the changed events start again.
function setEvLevels(map) {
  for (const id in map) {
    const lv = map[id];
    if (evLevel(id) !== lv) delete EV_T[id];
    if (lv === 'normal') delete EV_LV[id]; else EV_LV[id] = lv;
  }
  saveEvLevels();
}

const EV_FAST_ALL = Q.get('events') === 'fast' || Q.get('animals') === 'fast';
const evIsFast = ev => EV_FAST_ALL || Q.get(ev.id) === 'fast';
// Mean interval now, in seconds.
function evMean(ev, E) {
  if (evIsFast(ev)) return ev.fast === undefined ? 7 : typeof ev.fast === 'function' ? ev.fast(E) : ev.fast;
  return (typeof ev.gap === 'function' ? ev.gap(E) : ev.gap) * EV_MULT[evLevelOf(ev)];
}
function evDraw(ev, mean) {
  const [a, b] = evIsFast(ev) ? [4 / 7, 10 / 7] : (ev.spread || [0.667, 1.333]);
  return mean * rand(a, b);
}

// Called every frame from step().
function updateEvents(dt, E) {
  for (const ev of EVENTS) {
    if (evLevelOf(ev) === 'off' || (ev.on && !ev.on(E))) { delete EV_T[ev.id]; continue; }
    const mean = evMean(ev, E);
    if (ev.poisson) {
      if (ev.can && !ev.can(E)) continue;
      if (Math.random() < (ev.mul ? ev.mul(E) : 1) * dt / mean) ev.run(E);
      continue;
    }
    if (EV_T[ev.id] === undefined) EV_T[ev.id] = evIsFast(ev) ? rand(1, 4) : ev.first !== undefined ? ev.first : evDraw(ev, mean);
    EV_T[ev.id] -= dt;
    if (EV_T[ev.id] <= 0) {
      if (!ev.can || ev.can(E)) ev.run(E);
      EV_T[ev.id] = evDraw(ev, evMean(ev, E));
    }
  }
}

// Text under the name in the panels: how often the event happens at the given level, e.g. "~15 min", "~1.5 h · evening" (E — the result of env(), the gap may depend on the season).
function evEveryText(id, level, E) {
  const ev = EVENTS.find(x => x.id === id); if (!ev) return '';
  if (level === 'off') return 'off';
  const s = (typeof ev.gap === 'function' ? ev.gap(E) : ev.gap) * EV_MULT[level], m = s / 60, h = m / 60;
  const t = s < 60 ? Math.round(s) + ' s' : m < 10 ? Math.round(m) + ' min' : m < 90 ? Math.round(m / 5) * 5 + ' min' : (h < 10 ? Math.round(h * 2) / 2 : Math.round(h)) + ' h';
  return '~' + t + (ev.when ? ' · ' + ev.when : '');
}
