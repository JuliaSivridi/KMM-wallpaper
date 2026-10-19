const SPEED = +Q.get('speed') || 1, T0 = Date.now();
const OV = { month: null, hour: null, wx: null, fc: 0 };
function clock() {
  const ms = T0 + (Date.now() - T0) * SPEED, d = new Date(ms);
  let h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600, month = d.getMonth(), day = d.getDate();
  if (Q.has('hour')) h = (((+Q.get('hour')) + (Date.now() - T0) * SPEED / 3.6e6) % 24 + 24) % 24;
  if (Q.has('month')) { month = clamp((+Q.get('month') | 0) - 1, 0, 11); day = 15; }
  if (OV.month !== null) { month = OV.month; day = 15; }
  if (Q.has('day')) day = clamp(+Q.get('day') | 0, 1, 31);
  if (OV.hour !== null) h = OV.hour;
  const n = new Date(ms - 12 * 3.6e6);
  return { h, month, day, ovMonth: OV.month, nightKey: n.getFullYear() * 1000 + n.getMonth() * 40 + n.getDate() };
}
// Sunrise and sunset by the latitude and longitude from WEATHER (NOAA formulas), in the computer's local time.
function sunTimes(m, day) {
  const rad = Math.PI / 180, N = Math.floor((Date.UTC(2023, m, day) - Date.UTC(2023, 0, 0)) / 864e5), g = 2 * Math.PI / 365 * (N - 1);
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g)); // equation of time, min
  const phi = WEATHER.lat * rad, c = (Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(decl)) / (Math.cos(phi) * Math.cos(decl));
  const tz = -new Date(Date.UTC(2023, m, day, 12)).getTimezoneOffset() / 60;   // computer's timezone, DST included
  const noon = 12 - WEATHER.lon / 15 + tz - eot / 60;
  if (c >= 1) return [noon, noon];       // polar night
  if (c <= -1) return [-5, 29];          // polar day
  const half = Math.acos(c) / rad / 15;
  return [noon - half, noon + half];
}
const SEASON = ['winter', 'winter', 'winter', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'late', 'winter'];

function isAwake(id, h) { const f = window.FAMILY_BY_ID[id]; if (!f) return false; return f.sleepAt > f.wakeAt ? (h >= f.wakeAt && h < f.sleepAt) : (h >= f.wakeAt || h < f.sleepAt); }
function env() {
  const t = clock(), h = t.h, [sr, ss] = sunTimes(t.month, t.day);
  const d = smooth(sr - 0.7, sr + 0.7, h) * (1 - smooth(ss - 0.7, ss + 0.7, h));
  const tw = Math.max(0, 1 - Math.abs(h - sr) / 1.1, 1 - Math.abs(h - ss) / 1.1);
  const sm = WEATHER.lat < 0 ? (t.month + 6) % 12 : t.month;   // in the southern hemisphere the seasons are shifted half a year
  const season = SEASON[sm], S = PAL[season];
  const awake = FOLK.some(a => isAwake(a.id, h));
  const fireOn = Math.max(15, Math.min(ss - 0.5, 20.5));
  const wx = weatherNow(season), wet = (wx.kind === 'rain' || wx.kind === 'storm') && wx.int >= 0.45;
  const fireLit = !wet && FOLK.some(a => isGrownUp(a.person) && isAwake(a.id, h)) && (h >= fireOn || h < 5);
  const aurora = Q.has('aurora') ? Q.get('aurora') === '1' : (Math.abs(WEATHER.lat) >= 55 && [8, 9, 10, 11, 0, 1, 2].includes(sm) && rng(t.nightKey)() < 0.35);
  let sun = null, moon = null;
  if (h > sr && h < ss) { const p = (h - sr) / (ss - sr), alt = 20 + 70 * clamp((ss - sr - 6) / 13, 0, 1); sun = { x: W * 0.06 + p * W * 0.88, y: 118 - Math.sin(Math.PI * p) * alt, p }; }
  const nl = sr + 24 - ss, q = ((h - ss + 24) % 24) / nl;
  if (q > 0.02 && q < 0.98) moon = { x: W * 0.08 + q * W * 0.84, y: 112 - Math.sin(Math.PI * q) * 55 };
  const winter = season === 'winter';
  let top = mixHex(SKY.nTop, winter ? SKY.dTopW : SKY.dTop, d), hor = mixHex(SKY.nHor, winter ? SKY.dHorW : SKY.dHor, d);
  top = mixHex(top, SKY.tTop, tw * 0.45); hor = mixHex(hor, SKY.tHor, tw * 0.75);
  const grey = clamp((weatherNow(season).cover - 55) / 45, 0, 1) * 0.75, gcol = mixHex('#141a28', '#9aa2b2', d);
  top = mixHex(top, gcol, grey); hor = mixHex(hor, mixHex(gcol, '#c4cad4', d * 0.5), grey);
  return { h, sr, ss, d, tw, season, S, awake, fireLit, aurora, sun, moon, top, hor, month: sm, wx, wet, hal: halloweenState(t), ny: newYearState(t) };
}