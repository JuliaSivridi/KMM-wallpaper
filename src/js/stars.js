// Starry sky and shooting stars.
// Stars stand in their real places: for the moment on the clock, the date and the latitude/longitude from WEATHER the height and the side of every star
// are computed from its coordinates (sidereal time), so the winter sky has Orion, the summer one the Summer Triangle, the autumn one the Pegasus square, and the sky turns during the night.
// No connecting lines: at this size the constellations are readable as dots. A catalogue of bright stars (STAR_CAT, with the main figures of the sky) and a faint background (STAR_BG random stars) are used.
// The screen is a scheme like the Sun's and the Moon's arc: the frame looks south (east on the left, west on the right; in the southern hemisphere it looks north, with the same left-to-right motion),
// the height uses the same SKY_ALT_K as the Sun and the Moon, and the width is stretched a little less at a height. What is near the zenith or behind us does not get into the frame; hills and trees cover the low sky.
// How many stars are seen follows the darkness and the clouds: in the twilight the brightest ones come first, a full moon washes out the faint ones and the ones near it.
// Shooting stars: in a dark clear sky now and then a short streak (random ones about every 10 minutes). On the days of the meteor showers (METEOR_SHOWERS) there are more of them,
// and the streaks fly away from the shower's radiant, whose place in the sky is computed like a star's; the higher the radiant, the more meteors (the figures are tuned for a pleasant wallpaper, not real rates).
// The ⚙ "Sky" panel (js/ui_sky.js) switches puddles, rainbow, northern lights, shooting stars and every shower; the choice is kept in the browser and in settings.json (the "sky" field).
// For testing: ?hour=23&month=1 (a clear sky: 🌦️ ☀️), shooting stars: &animals=fast (or the 🐇 button) gives one every 4–10 seconds; a shower: ?month=8&day=12&hour=23.

/* ---------- switches (the ⚙ "Sky" panel) ---------- */
const SKY_KEY = 'forest.sky.v1';
const SKY_NATURE = [
  { id: 'puddles', icon: '💧', name: 'Puddles', hint: 'Puddles after rain' },
  { id: 'rainbow', icon: '🌈', name: 'Rainbow', hint: 'A rainbow after rain' },
  { id: 'aurora', icon: '🌌', name: 'Northern lights', hint: 'From latitude 55° in the dark months' },
];
const METEOR_MAIN = { id: 'meteors', icon: '🌠', name: 'Shooting stars', hint: 'Random shooting stars; released — none at all, the showers too' };
// peak — day of the year of the maximum (not a leap year), width — how many days around it the shower lasts, boost — extra rate at the maximum in parts of the usual one,
// ra (hours) and dec (degrees) — the radiant
const METEOR_SHOWERS = [
  { id: 'quadrantids', icon: '☄️', name: 'Quadrantids', when: '3–4 Jan', peak: 4, width: 1.3, boost: 4, ra: 15.30, dec: 49.5 },
  { id: 'lyrids', icon: '☄️', name: 'Lyrids', when: '22 Apr', peak: 112, width: 2.5, boost: 1.5, ra: 18.07, dec: 34 },
  { id: 'etaaquariids', icon: '☄️', name: 'Eta Aquariids', when: '6 May', peak: 126, width: 4, boost: 2, ra: 22.53, dec: -1 },
  { id: 'perseids', icon: '☄️', name: 'Perseids', when: '12 Aug', peak: 224, width: 6, boost: 4, ra: 3.20, dec: 58 },
  { id: 'orionids', icon: '☄️', name: 'Orionids', when: '21 Oct', peak: 294, width: 4, boost: 2, ra: 6.33, dec: 16 },
  { id: 'leonids', icon: '☄️', name: 'Leonids', when: '17 Nov', peak: 321, width: 2.5, boost: 1.5, ra: 10.13, dec: 22 },
  { id: 'geminids', icon: '☄️', name: 'Geminids', when: '14 Dec', peak: 348, width: 3.5, boost: 5, ra: 7.47, dec: 33 },
];
const SKY_ALL = [...SKY_NATURE, METEOR_MAIN, ...METEOR_SHOWERS];
let SKY_OFF = {};   // { rainbow: true } — this one is switched off
try { const o = JSON.parse(localStorage.getItem(SKY_KEY) || 'null'); if (o && typeof o === 'object') SKY_OFF = o; } catch (e) {}
const skyOn = id => !SKY_OFF[id];
function saveSkyOff() { try { localStorage.setItem(SKY_KEY, JSON.stringify(SKY_OFF)); } catch (e) {} }

const STAR_TINT = { w: '#ffffff', b: '#cfe0ff', y: '#fff1c4', o: '#ffd2a0', r: '#ffae8a' };   // white, blue-white, yellowish, orange, red
const STAR_BG = 520;   // faint random stars over the whole sky
// [right ascension in hours, declination in degrees, magnitude, colour]
const STAR_CAT = [
  // Orion, Taurus, Auriga, Gemini, the Dogs
  [6.7525, -16.716, -1.46, 'b'], [5.2423, -8.202, 0.13, 'b'], [5.9195, 7.407, 0.5, 'r'], [5.4189, 6.350, 1.64, 'b'], [5.5334, -0.299, 2.25, 'b'], [5.6036, -1.202, 1.69, 'b'],
  [5.6793, -1.943, 1.74, 'b'], [5.7959, -9.670, 2.07, 'b'], [5.5855, 9.934, 3.39, 'b'], [4.8308, 6.961, 3.2, 'w'], [5.5920, -5.910, 2.77, 'b'], [5.4067, -2.397, 3.35, 'b'],
  [4.5987, 16.509, 0.86, 'o'], [5.4382, 28.607, 1.65, 'b'], [5.6274, 21.143, 3.0, 'b'], [4.3299, 15.628, 3.65, 'y'], [4.3820, 17.543, 3.76, 'y'], [4.4776, 15.871, 3.4, 'y'], [4.4770, 19.180, 3.53, 'o'],
  [3.7914, 24.105, 2.87, 'b'], [3.8194, 24.053, 3.63, 'b'], [3.7479, 24.113, 3.7, 'b'], [3.7634, 24.368, 3.87, 'b'], [3.7722, 23.948, 4.18, 'b'],
  [5.2782, 45.998, 0.08, 'y'], [5.9921, 44.947, 1.9, 'w'], [5.9954, 37.213, 2.62, 'w'], [4.9498, 33.166, 2.69, 'y'], [5.0328, 43.823, 3.0, 'y'],
  [7.5767, 31.888, 1.58, 'w'], [7.7553, 28.026, 1.14, 'o'], [6.6285, 16.399, 1.93, 'w'], [6.3827, 22.514, 2.88, 'r'], [6.7322, 25.131, 3.06, 'y'], [6.2480, 22.507, 3.3, 'r'], [7.3355, 21.982, 3.5, 'y'], [6.7542, 12.896, 3.35, 'y'], [7.7400, 24.398, 3.57, 'o'],
  [7.6550, 5.225, 0.34, 'y'], [7.4527, 8.289, 2.89, 'b'], [6.9771, -28.972, 1.5, 'b'], [7.1399, -26.393, 1.84, 'y'], [6.3783, -17.956, 1.98, 'b'], [7.4016, -29.303, 2.45, 'b'], [6.3380, -30.063, 3.0, 'b'],
  [5.5453, -17.822, 2.58, 'y'], [5.4710, -20.759, 2.84, 'y'], [5.6610, -34.074, 2.64, 'b'], [8.2750, 9.186, 3.5, 'o'], [8.7450, 18.154, 3.9, 'o'],
  // Perseus, Cassiopeia, Cepheus, Andromeda, Pegasus, Aries, Cetus, Eridanus
  [3.4054, 49.861, 1.79, 'y'], [3.1361, 40.956, 2.12, 'b'], [3.7154, 47.788, 3.01, 'b'], [3.9640, 40.010, 2.89, 'b'], [3.9022, 31.884, 2.85, 'b'],
  [0.6751, 56.537, 2.24, 'o'], [0.1530, 59.150, 2.27, 'y'], [0.9451, 60.717, 2.47, 'b'], [1.4303, 60.235, 2.68, 'w'], [1.9066, 63.670, 3.37, 'b'],
  [21.3097, 62.586, 2.51, 'w'], [21.4777, 70.561, 3.2, 'b'], [23.6558, 77.632, 3.21, 'o'], [22.1810, 58.201, 3.4, 'y'], [22.8280, 66.200, 3.5, 'b'],
  [0.1398, 29.091, 2.06, 'b'], [1.1622, 35.621, 2.05, 'r'], [2.0650, 42.330, 2.1, 'o'], [2.1590, 34.987, 3.0, 'w'],
  [23.0629, 28.083, 2.42, 'r'], [23.0794, 15.205, 2.49, 'b'], [0.2206, 15.184, 2.83, 'b'], [21.7364, 9.875, 2.39, 'o'], [22.7173, 30.221, 2.94, 'y'],
  [2.1195, 23.462, 2.0, 'o'], [1.9109, 20.808, 2.64, 'w'], [1.8920, 19.294, 3.9, 'b'],
  [3.0380, 4.090, 2.53, 'r'], [0.7265, -17.987, 2.04, 'o'], [2.7210, 3.236, 3.47, 'b'], [1.8580, -10.335, 3.74, 'o'],
  [1.6286, -57.237, 0.46, 'b'], [5.1310, -5.086, 2.79, 'w'], [3.9670, -13.509, 2.95, 'b'], [2.9710, -40.305, 3.2, 'w'], [3.5490, -9.458, 3.7, 'w'],
  [22.9608, -29.622, 1.16, 'w'], [0.4380, -42.306, 2.4, 'o'],
  // Lyra, Cygnus, Aquila, Delphinus, Capricornus, Aquarius
  [18.6156, 38.784, 0.03, 'w'], [18.8347, 33.363, 3.52, 'b'], [18.9824, 32.690, 3.25, 'b'], [18.9080, 36.899, 4.3, 'r'], [18.7460, 37.605, 4.4, 'w'],
  [20.6905, 45.280, 1.25, 'w'], [20.3705, 40.257, 2.23, 'y'], [20.7702, 33.970, 2.46, 'o'], [19.7496, 45.131, 2.87, 'b'], [19.5120, 27.960, 3.18, 'o'],
  [19.8464, 8.868, 0.76, 'w'], [19.7710, 10.613, 2.72, 'o'], [19.9219, 6.407, 3.71, 'y'], [19.4250, 3.115, 3.4, 'w'], [19.0900, 13.863, 2.99, 'w'], [19.1040, -4.883, 3.4, 'b'], [20.1880, -0.821, 3.2, 'b'],
  [20.6603, 15.912, 3.6, 'w'], [20.6259, 14.595, 3.6, 'w'],
  [21.7840, -16.127, 2.87, 'w'], [20.3500, -14.781, 3.05, 'y'], [20.2940, -12.545, 3.6, 'y'],
  [21.5259, -5.571, 2.9, 'y'], [22.0964, -0.320, 2.96, 'y'], [22.9110, -15.820, 3.27, 'w'], [22.8770, -7.580, 3.84, 'w'],
  // Bootes, Corona Borealis, Hercules, Ophiuchus, Draco, Virgo, Libra, Leo, Hydra, Corvus
  [14.2610, 19.182, -0.05, 'o'], [14.7498, 27.074, 2.35, 'o'], [13.9110, 18.398, 2.68, 'y'], [14.5348, 38.308, 3.0, 'w'], [15.0324, 40.391, 3.5, 'o'], [15.2580, 37.377, 3.5, 'y'],
  [15.5781, 26.715, 2.22, 'w'], [15.4640, 29.106, 3.68, 'w'], [15.5490, 31.359, 4.1, 'b'],
  [16.5037, 21.490, 2.77, 'y'], [16.6880, 31.603, 2.81, 'y'], [17.2510, 36.809, 3.16, 'o'], [16.7150, 38.922, 3.5, 'y'], [17.2441, 14.390, 3.5, 'r'], [17.2510, 24.839, 3.1, 'b'], [17.0050, 30.926, 3.9, 'w'],
  [17.5822, 12.560, 2.07, 'w'], [17.7250, 4.567, 2.77, 'o'], [17.1730, -15.725, 2.43, 'w'], [16.2390, -3.694, 2.74, 'o'], [16.6190, -10.567, 3.2, 'o'],
  [17.9434, 51.489, 2.23, 'o'], [17.5072, 52.301, 2.79, 'o'], [17.8920, 56.873, 3.75, 'o'],
  [13.4199, -11.161, 0.97, 'b'], [12.6944, -1.449, 2.74, 'y'], [13.0363, 10.959, 2.83, 'y'], [11.8450, 1.765, 3.6, 'w'], [13.5780, -0.596, 3.37, 'w'],
  [15.2835, -9.383, 2.61, 'b'], [14.8478, -16.042, 2.75, 'w'],
  [10.1395, 11.967, 1.36, 'b'], [11.8177, 14.572, 2.14, 'w'], [10.3329, 19.842, 2.28, 'o'], [11.2351, 20.524, 2.56, 'w'], [11.2373, 15.430, 3.3, 'w'], [10.2782, 23.417, 3.4, 'y'], [9.8793, 26.007, 3.88, 'y'],
  [9.4598, -8.659, 1.98, 'o'], [12.2634, -17.542, 2.59, 'b'], [12.5730, -23.397, 2.65, 'b'], [12.4980, -16.515, 2.95, 'w'], [12.1690, -22.620, 3.0, 'y'],
  // Ursa Major, Ursa Minor, Canes Venatici
  [11.0621, 61.751, 1.79, 'o'], [11.0307, 56.382, 2.37, 'w'], [11.8972, 53.695, 2.44, 'w'], [12.2571, 57.033, 3.31, 'w'], [12.9005, 55.960, 1.77, 'w'], [13.3988, 54.925, 2.23, 'w'], [13.7923, 49.313, 1.86, 'b'],
  [8.9870, 48.042, 3.1, 'w'], [10.3720, 41.500, 3.05, 'o'], [8.5040, 60.718, 3.35, 'w'], [11.3030, 33.094, 3.5, 'y'], [12.9340, 38.318, 2.9, 'w'],
  [2.5303, 89.264, 1.98, 'y'], [14.8451, 74.156, 2.08, 'o'],
  // Scorpius, Sagittarius, the south
  [16.4901, -26.432, 1.06, 'r'], [17.5601, -37.104, 1.62, 'b'], [17.6220, -42.998, 1.87, 'y'], [16.0056, -22.622, 2.32, 'b'], [16.0907, -19.805, 2.62, 'b'], [16.8360, -34.293, 2.3, 'o'], [17.7080, -39.030, 2.4, 'b'], [17.5000, -37.296, 2.7, 'b'],
  [18.4029, -34.385, 1.85, 'b'], [18.9211, -26.297, 2.05, 'b'], [19.0435, -29.880, 2.6, 'w'], [18.3499, -29.828, 2.7, 'o'], [18.4662, -25.422, 2.8, 'o'], [18.0966, -30.424, 2.99, 'o'], [19.1156, -27.670, 3.3, 'w'],
  [6.3992, -52.696, -0.74, 'y'], [9.2200, -69.717, 1.68, 'w'], [8.3750, -59.509, 1.86, 'y'], [8.0600, -40.003, 2.25, 'b'], [8.1590, -47.337, 1.75, 'b'], [9.1330, -43.433, 2.2, 'o'],
  [14.6600, -60.834, -0.27, 'y'], [14.0637, -60.373, 0.61, 'b'], [12.4433, -63.099, 0.76, 'b'], [12.7953, -59.689, 1.25, 'b'], [12.5194, -57.113, 1.64, 'r'], [12.2524, -58.749, 2.8, 'b'],
  [14.1110, -36.370, 2.06, 'o'], [12.6920, -48.960, 2.17, 'b'], [16.8110, -69.028, 1.92, 'o'], [22.1370, -46.961, 1.74, 'b'], [20.4275, -56.735, 1.94, 'b'],
];
const STAR_DEG = Math.PI / 180;
const STARS = { key: '', pts: [], cat: null };   // pts — stars that are above the horizon and in the frame, with screen positions

// Catalogue and faint background in one list (the background comes from a fixed seed, so the sky is the same on every launch).
function starCatalog() {
  if (STARS.cat) return STARS.cat;
  const r = rng(9001), out = [];
  const mk = (ra, dec, mag, tint, ph, sp) => { const d = dec * STAR_DEG; return { ra, sd: Math.sin(d), cd: Math.cos(d), mag, c: STAR_TINT[tint] || STAR_TINT.w, ph, sp }; };
  for (const s of STAR_CAT) out.push(mk(s[0] * 15, s[1], s[2], s[3], r() * 6.28, 0.6 + r() * 1.8));
  for (let i = 0; i < STAR_BG; i++) {
    const ra = r() * 360, dec = Math.asin(2 * r() - 1) / STAR_DEG, mag = 3.2 + 2.3 * Math.sqrt(r()), k = r();
    out.push(mk(ra, dec, mag, k < 0.12 ? 'b' : k < 0.2 ? 'y' : k < 0.25 ? 'o' : 'w', r() * 6.28, 0.5 + r() * 2));
  }
  return (STARS.cat = out);
}

// The sky for the moment t (the result of clock()): sidereal time, latitude, which way the frame looks.
function skyFrame(t) {
  const tz = -new Date(Date.UTC(t.year, t.month, t.day, 12)).getTimezoneOffset() / 60;   // the computer's time zone, as in sunTimes
  const days = (Date.UTC(t.year, t.month, t.day) - Date.UTC(2000, 0, 1, 12)) / 864e5 + (t.h - tz) / 24;
  const phi = clamp(WEATHER.lat, -89.9, 89.9) * STAR_DEG, north = WEATHER.lat >= 0;
  return { lst: 280.46061837 + 360.98564736629 * days + WEATHER.lon, sinF: Math.sin(phi), cosF: Math.cos(phi), side: north ? 1 : -1, centre: north ? 180 : 0 };   // lst — local sidereal time, degrees
}
// Altitude (radians) and screen position of a point of the sky (right ascension in degrees, sine and cosine of the declination). The result object is reused: copy what you need at once.
const _SP = { alt: 0, x: 0, y: 0 };
function skyXY(raDeg, sd, cd, fr) {
  const ha = (fr.lst - raDeg) * STAR_DEG, cH = Math.cos(ha), alt = Math.asin(sd * fr.sinF + cd * cH * fr.cosF);
  let dx = Math.atan2(-cd * Math.sin(ha), sd * fr.cosF - cd * cH * fr.sinF) / STAR_DEG - fr.centre;   // azimuth from the middle of the frame
  dx = ((dx + 540) % 360) - 180;
  _SP.alt = alt; _SP.x = W / 2 + fr.side * SKY_ALT_K * dx * Math.cos(alt * 0.5); _SP.y = SKY_HORIZON - alt / STAR_DEG * SKY_ALT_K;
  return _SP;
}
// Where every star is on the screen for the moment t.
function buildStarPoints(t) {
  const fr = skyFrame(t), pts = [];
  for (const st of starCatalog()) {
    const p = skyXY(st.ra, st.sd, st.cd, fr);
    if (p.alt < 0.02 || p.x < 1 || p.x > W - 2 || p.y < 1 || p.y > 116) continue;   // below the horizon or out of the frame
    const deg = p.alt / STAR_DEG;
    pts.push({ x: Math.round(p.x), y: Math.round(p.y), s: st, ext: deg < 12 ? 0.4 + 0.6 * deg / 12 : 1 });   // ext — a low star is dimmer
  }
  return pts;
}

// sa — how dark and clear it is, 0…1 (see draw() in render.js). Called from draw() before the Sun, the Moon and the clouds.
function drawStars(g, E, sa) {
  const t = clock(), key = Math.floor(t.h * 240) + '|' + t.year + '|' + t.month + '|' + t.day + '|' + W + '|' + WEATHER.lat + '|' + WEATHER.lon;
  if (key !== STARS.key) { STARS.key = key; STARS.pts = buildStarPoints(t); }
  const lim = -1.5 + 7.5 * sa, m = E.moon, ml = m && m.a > 0.02 ? m.a * m.f : 0;   // lim — the faintest magnitude that is seen now
  for (const p of STARS.pts) {
    const s = p.s, mag = s.mag;
    let a = clamp((lim - mag) / 1.5, 0, 1);
    if (a <= 0) continue;
    a *= (0.45 + 0.55 * clamp((4.2 - mag) / 4.2, 0, 1)) * p.ext;
    a *= 1 - (mag < 1.5 ? 0.12 : mag < 3.5 ? 0.25 : 0.4) * (0.5 + 0.5 * Math.sin(T * s.sp + s.ph));   // twinkling
    if (ml > 0) a *= (1 - ml * 0.5 * clamp((mag - 2) / 3, 0, 1)) * (1 - ml * 0.9 * (1 - smooth(3, 16, Math.hypot(p.x - m.x, p.y - m.y))));   // the Moon washes out faint stars and the ones near it
    if (a < 0.03) continue;
    R(g, p.x, p.y, 1, 1, rgba(s.c, a));
    if (mag <= 1.3 && a > 0.3) {   // the brightest ones have a small cross
      const c = rgba(s.c, a * 0.4);
      R(g, p.x - 1, p.y, 1, 1, c); R(g, p.x + 1, p.y, 1, 1, c); R(g, p.x, p.y - 1, 1, 1, c); R(g, p.x, p.y + 1, 1, 1, c);
      if (mag <= 0.1) { const c2 = rgba(s.c, a * 0.2); R(g, p.x - 2, p.y, 1, 1, c2); R(g, p.x + 2, p.y, 1, 1, c2); R(g, p.x, p.y - 2, 1, 1, c2); R(g, p.x, p.y + 2, 1, 1, c2); }
    }
  }
}

/* ---------- shooting stars ---------- */
const METEORS = [];   // { x, y, vx, vy, age, dur, len }
const METEOR_GAP = 600;   // seconds between random shooting stars, on average
// The showers that are on now: { s, k (extra rate in parts of the usual one), x, y (the radiant on the screen) }. A shower is strongest at its date and when its radiant is high.
function activeShowers(t) {
  const out = [], doy = (Date.UTC(t.year, t.month, t.day) - Date.UTC(t.year, 0, 0)) / 864e5, fr = skyFrame(t);
  for (const s of METEOR_SHOWERS) {
    if (!skyOn(s.id)) continue;
    let dd = Math.abs(doy - s.peak); dd = Math.min(dd, 365 - dd);
    const g = Math.exp(-(dd / s.width) * (dd / s.width)); if (g < 0.02) continue;
    const d = s.dec * STAR_DEG, p = skyXY(s.ra * 15, Math.sin(d), Math.cos(d), fr), k = s.boost * g * Math.max(0, Math.sin(p.alt));
    if (k > 0.01) out.push({ s, k, x: p.x, y: p.y });
  }
  return out;
}
let METEOR_SH = [];   // the showers that are on now (filled by the rate function of the event below)
function updateMeteors(dt, E) {
  for (let i = METEORS.length - 1; i >= 0; i--) { const m = METEORS[i]; m.age += dt; if (m.age >= m.dur) METEORS.splice(i, 1); }
  if (!skyOn('meteors')) METEORS.length = 0;
}
function spawnMeteor() {
  const sh = METEOR_SH, extra = sh.reduce((a, q) => a + q.k, 0);
  let r = Math.random() * (1 + extra) - 1, src = null;   // who it is from: a random one (share 1) or one of the showers
  if (r > 0) for (const q of sh) { r -= q.k; if (r <= 0) { src = q; break; } }
  const x = rand(W * 0.1, W * 0.9), y = rand(4, 60), v = rand(60, 110);
  let ux, uy, f = 1;
  if (src) {   // flies away from the radiant; near the radiant it is short
    const dx = x - src.x, dy = y - src.y, d = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx) + rand(-0.12, 0.12);
    ux = Math.cos(a); uy = Math.sin(a); f = clamp(d / 50, 0.35, 1);
  } else { const dir = Math.random() < 0.5 ? 1 : -1, a = rand(0.25, 0.9); ux = dir * Math.cos(a); uy = Math.sin(a); }
  METEORS.push({ x, y, vx: ux * v, vy: uy * v, age: 0, dur: rand(0.35, 0.7) * f, len: Math.max(4, Math.round(rand(8, 16) * f)) });
}
// Shooting stars are an event of the registry (js/events.js) of the "sky" group: a chance every frame (on average one in METEOR_GAP seconds), only in a dark clear sky;
// the rate grows on the days of the showers. The ⚙ "Sky" switch turns them off (levels are not offered here).
defineEvent({ id: 'meteors', group: 'sky', icon: '🌠', name: 'Shooting stars', gap: METEOR_GAP, fast: 7, poisson: true, lvl: () => skyOn('meteors') ? 'normal' : 'off',
  can: E => Math.pow(1 - E.d, 2) * (1 - E.wx.cover / 100) >= 0.5,
  mul: E => { METEOR_SH = activeShowers(clock()); return 1 + METEOR_SH.reduce((a, q) => a + q.k, 0); },
  run: () => spawnMeteor() });
// A bright head and a fading tail; drawn in the sky before the clouds, so the hills and trees cover the end of the path.
function drawMeteors(g) {
  for (const m of METEORS) {
    const env = Math.sin(Math.PI * m.age / m.dur), sp = Math.hypot(m.vx, m.vy), ux = m.vx / sp, uy = m.vy / sp, hx = m.x + m.vx * m.age, hy = m.y + m.vy * m.age;
    for (let i = 0; i <= m.len; i++) R(g, hx - ux * i, hy - uy * i, 1, 1, rgba(i < 2 ? '#ffffff' : '#bcd0ff', env * (1 - i / m.len) * (i === 0 ? 1 : 0.7)));
  }
}
