// Scene settings: what does not belong to a specific character.
window.SETTINGS = {
  weather: { lat: 61.07, lon: 28.28, enabled: true },
  fps: 20,
};

// Coordinates entered in the panel are stored in the browser and override the values above.
const SETTINGS_KEY = 'forest.settings.v1';
try {
  const sv = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
  if (sv && sv.weather && isFinite(sv.weather.lat) && isFinite(sv.weather.lon)) { window.SETTINGS.weather.lat = +sv.weather.lat; window.SETTINGS.weather.lon = +sv.weather.lon; }
} catch (e) { /* no saved settings */ }
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ weather: { lat: window.SETTINGS.weather.lat, lon: window.SETTINGS.weather.lon } })); } catch (e) {} }

// Short names for the rest of the code.
const WEATHER = window.SETTINGS.weather;
const FPS = window.SETTINGS.fps;