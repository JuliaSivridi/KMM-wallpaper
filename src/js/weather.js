let WX = null, WXF = [];   // WXF[n] — forecast in n hours (1…3)
let WX_LABEL = '';
const WX_PRESET = { clear: { cover: 10, kind: 'clear', int: 0, wind: 2 }, rain: { cover: 95, kind: 'rain', int: 0.7, wind: 5 }, snow: { cover: 90, kind: 'snow', int: 0.6, wind: 3 }, fog: { cover: 85, kind: 'fog', int: 0, wind: 1 }, storm: { cover: 100, kind: 'storm', int: 1, wind: 9 } };
function decode(code) {
  const m = { 45: ['fog', 0, 'fog'], 48: ['fog', 0, 'fog'], 51: ['rain', 0.2, 'drizzle'], 53: ['rain', 0.25, 'drizzle'], 55: ['rain', 0.3, 'drizzle'], 56: ['rain', 0.3, 'freezing drizzle'], 57: ['rain', 0.35, 'freezing drizzle'],
    61: ['rain', 0.4, 'light rain'], 63: ['rain', 0.65, 'rain'], 65: ['rain', 1, 'downpour'], 66: ['rain', 0.5, 'freezing rain'], 67: ['rain', 0.7, 'freezing rain'],
    71: ['snow', 0.35, 'light snow'], 73: ['snow', 0.65, 'snow'], 75: ['snow', 1, 'snowfall'], 77: ['snow', 0.3, 'snow grains'],
    80: ['rain', 0.45, 'showers'], 81: ['rain', 0.7, 'showers'], 82: ['rain', 1, 'heavy showers'], 85: ['snow', 0.5, 'snowfall'], 86: ['snow', 0.9, 'heavy snowfall'],
    95: ['storm', 0.8, 'thunderstorm'], 96: ['storm', 1, 'thunderstorm with hail'], 99: ['storm', 1, 'thunderstorm with hail'] };
  return m[code] || ['clear', 0, code <= 1 ? 'clear' : code === 2 ? 'partly cloudy' : 'cloudy'];
}
function showWx() {
  const el = document.getElementById('wx'); if (!el) return;
  const t = w => (w.temp > 0 ? '+' : '') + Math.round(w.temp) + '°';
  const f = !OV.wx && OV.fc ? WXF[OV.fc] : null;
  if (f) el.textContent = `In ${OV.fc} h: ${f.label}, ${t(f)}`;
  else if (WX) el.textContent = `Now: ${WX.label}, ${t(WX)}`;
  else el.textContent = WX_LABEL || 'Weather: loading…';
}
async function fetchWeather() {
  if (!WEATHER.enabled) return;
  try {
    const v = 'weather_code,cloud_cover,wind_speed_10m,temperature_2m';
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER.lat}&longitude=${WEATHER.lon}&current=${v}&hourly=${v}&forecast_days=2&timezone=auto&wind_speed_unit=ms`;
    const j = await (await fetch(u)).json(), c = j.current;
    const pack = (o, i) => { const [kind, int, label] = decode(i === undefined ? o.weather_code : o.weather_code[i]); const g = k => i === undefined ? o[k] : o[k][i];
      return { cover: g('cloud_cover'), kind, int, wind: g('wind_speed_10m'), temp: g('temperature_2m'), label }; };
    WX = pack(c);
    WXF = [WX];
    for (let n = 1; n <= 3; n++) {
      // API time is local "YYYY-MM-DDTHH:MM"; add the hours as UTC so it doesn't depend on the computer's timezone
      const key = new Date(Date.parse(c.time + ':00Z') + n * 3.6e6).toISOString().slice(0, 13) + ':00', i = j.hourly.time.indexOf(key);
      if (i >= 0) WXF[n] = pack(j.hourly, i);
    }
    showWx();
  } catch (e) { WX_LABEL = 'Weather: no connection'; showWx(); }
}
function weatherNow(season) {
  let w = OV.wx ? WX_PRESET[OV.wx] : ((OV.fc && WXF[OV.fc]) || WX);
  if (w && w.kind === 'snow' && season === 'summer') w = { ...w, kind: 'rain' };
  if (w) return w;
  return season === 'winter' ? { cover: 40, kind: 'snow', int: 0.35, wind: 2 } : { cover: 35, kind: 'clear', int: 0, wind: 2 };
}