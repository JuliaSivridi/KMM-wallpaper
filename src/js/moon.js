// Moon phases. The phase comes from the date (a synodic month of 29.53 days from a known new moon), and everything else follows from it:
// the Moon rises and sets about 50 minutes later every day (new moon — with the Sun, first quarter — in the afternoon, full moon — at sunset and all night),
// it is a thin crescent near the Sun, a half disc at the quarters and a full disc at full moon, and at new moon it cannot be seen at all.
// The height and length of the Moon's path come from its real declination (the Moon stands ahead of the Sun along the ecliptic by the phase angle):
// a full moon is high in winter and low in summer (in the white nights it barely rises), a crescent in winter stays low. The Sun's height is computed the same way (noon altitude = 90° − latitude + declination).
// The path across the screen is a circular arc whose centre lies deep under the ground. The forest is tall, so a low Sun or Moon stays behind the trees — in winter the Sun is hardly seen at all, as in real life.
// The frame looks south, so a waxing Moon is lit on the right and a waning one on the left (the other way round in the southern hemisphere).
// Half and thicker moons are also seen, paler, in the daytime sky; a crescent only in the dark.
// For testing: ?moon=0.5 sets the phase (0 — new, 0.25 — first quarter, 0.5 — full, 0.75 — last quarter); the time of day still decides whether the Moon is up: ?moon=0.5&hour=23.
const MOON_REF = Date.UTC(2000, 0, 6, 18, 14), MOON_SYN = 29.530588853;   // a known new moon, days in a synodic month

const SKY_ALT_K = 1.6, SKY_HORIZON = 118;   // pixels of screen height per degree of altitude (raise it to lift both Sun and Moon), the horizon line of the arcs
const SKY_EPS = 23.44 * Math.PI / 180;      // tilt of the Earth's axis
// Ecliptic longitude of the Sun (0 at the March equinox) and the declination of a body at a given longitude.
function sunLon(t) { const n = (Date.UTC(t.year, t.month, t.day) - Date.UTC(t.year, 0, 0)) / 864e5; return 2 * Math.PI * (n - 79.5) / 365.25; }
const sunDecl = lon => Math.asin(Math.sin(SKY_EPS) * Math.sin(lon));
// Height of the highest point of the path in pixels: 90° − |latitude − declination| degrees, no higher than the sky allows.
const skyAltPx = decl => clamp(90 - Math.abs(WEATHER.lat - decl * 180 / Math.PI), 0, 90) * SKY_ALT_K;
// Y on the screen of a circular arc: p — progress 0…1 along the path, s — height of the top in pixels, a — half of the arc's width in pixels.
// The circle goes through the two horizon points and the top, so its centre is deep under the ground; a low arc is almost flat.
function arcY(p, s, a) {
  s = Math.min(s, 105);
  if (s < 0.5) return SKY_HORIZON;
  const R = (a * a + s * s) / (2 * s), dx = (p - 0.5) * 2 * a;
  return SKY_HORIZON - (Math.sqrt(Math.max(0, R * R - dx * dx)) - (R - s));
}

// Moon for the moment t (the result of clock()) with sunrise sr and sunset ss: { ph, f, x, y, a } or null if it is below the horizon.
// ph — phase 0…1, f — how much of the disc is lit 0…1, a — visibility 0…1.
function moonNow(t, sr, ss) {
  const days = (Date.UTC(t.year, t.month, t.day) - MOON_REF) / 864e5 + t.h / 24;
  let ph = Q.has('moon') ? +Q.get('moon') || 0 : days / MOON_SYN;
  ph = ((ph % 1) + 1) % 1;
  const f = (1 - Math.cos(2 * Math.PI * ph)) / 2;
  const decl = sunDecl(sunLon(t) + 2 * Math.PI * ph);   // the Moon is ahead of the Sun along the ecliptic by the phase angle
  const k = -Math.tan(clamp(WEATHER.lat, -89.9, 89.9) * Math.PI / 180) * Math.tan(decl), arc = k >= 1 ? 0 : k <= -1 ? 24 : 24 * Math.acos(k) / Math.PI;   // hours above the horizon
  if (arc <= 0) return null;
  const rise = (sr + ss) / 2 + ph * 24 - arc / 2, u = (((t.h - rise) % 24) + 24) % 24;
  if (u >= arc) return null;
  const p = u / arc, d = smooth(sr - 0.7, sr + 0.7, t.h) * (1 - smooth(ss - 0.7, ss + 0.7, t.h));
  const a = ((1 - d) + d * 0.5 * smooth(0.3, 0.5, f)) * smooth(0.005, 0.04, f);   // night — fully, day — only a half disc or more, and pale; new moon — not at all
  return { ph, f, x: W * 0.08 + p * W * 0.84, y: arcY(p, skyAltPx(decl), W * 0.42), a };
}

function drawMoon(g, E) {
  const m = E.moon;
  if (!m || m.a < 0.02) return;
  const cx = Math.round(m.x), cy = Math.round(m.y), c = Math.cos(2 * Math.PI * m.ph), side = ((m.ph < 0.5) !== (WEATHER.lat < 0)) ? 1 : -1;
  g.globalCompositeOperation = 'lighter'; disc(g, cx, cy, 8, rgba('#c9d6ff', 0.07 * m.a * (0.3 + 0.7 * m.f))); g.globalCompositeOperation = 'source-over';
  const hw = dy => Math.floor(Math.sqrt(16 - dy * dy + 0.5)), lit = (dx, dy) => dx * side - c * hw(dy) > -0.01;   // the terminator is an ellipse: its offset is cos(phase) of the row's half-width
  for (let dy = -4; dy <= 4; dy++) for (let dx = -hw(dy); dx <= hw(dy); dx++)
    R(g, cx + dx, cy + dy, 1, 1, lit(dx, dy) ? rgba('#eef2fa', m.a) : rgba('#aab6d8', m.a * 0.14));   // the dark part is only a faint outline
  for (const [dx, dy] of [[1, -2], [-2, 0], [1, 2]]) if (lit(dx, dy)) R(g, cx + dx, cy + dy, 1, 1, rgba('#c7cfe0', m.a));   // craters, only on the lit part
}
