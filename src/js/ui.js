const ui = document.getElementById('ui'), hr = document.getElementById('hr'), hl = document.getElementById('hl');
const fmt = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0');
const uiAll = sel => ui.querySelectorAll(sel);
const uiOn = (btns, pred) => btns.forEach(b => b.classList.toggle('on', pred(b)));

// season
uiAll('button[data-m]').forEach(b => b.addEventListener('click', () => {
  const m = b.dataset.m;
  OV.month = m === 'now' ? null : +m;
  uiOn(uiAll('button[data-m]'), x => x === b);
}));
const hrNow = document.getElementById('hr-now');
const syncTimeBtn = () => hrNow.classList.toggle('on', OV.hour === null);   // lit while time runs "as on the clock"
hr.addEventListener('input', () => { OV.hour = +hr.value; hl.textContent = fmt(OV.hour); syncTimeBtn(); });
hrNow.addEventListener('click', () => { OV.hour = null; const h = clock().h; hr.value = h; hl.textContent = fmt(h); syncTimeBtn(); });

// weather: the "as is / manual" row and the "forecast" row. "Now" in either row resets both.
function syncWeatherBtns() {
  uiOn(uiAll('button[data-w]'), b => b.dataset.w === 'auto' ? !OV.wx : OV.wx === b.dataset.w);
  uiOn(uiAll('button[data-fc]'), b => !OV.wx && OV.fc === +b.dataset.fc);
  showWx();
}
uiAll('button[data-w]').forEach(b => b.addEventListener('click', () => {
  OV.wx = b.dataset.w === 'auto' ? null : b.dataset.w;
  OV.fc = 0;
  syncWeatherBtns();
}));
uiAll('button[data-fc]').forEach(b => b.addEventListener('click', () => {
  OV.fc = +b.dataset.fc; OV.wx = null;
  syncWeatherBtns();
}));

// animals and birds
const aniBtns = uiAll('button[data-f]'), birdBtns = uiAll('button[data-b]');
const syncFast = () => { aniBtns.forEach(b => b.classList.toggle('on', (b.dataset.f === '1') === FAST_ANI)); birdBtns.forEach(b => b.classList.toggle('on', (b.dataset.b === '1') === FAST_BIRD)); };
aniBtns.forEach(b => b.addEventListener('click', () => { FAST_ANI = b.dataset.f === '1'; aniT = FAST_ANI ? Math.min(aniT, 2) : rand(300, 600); syncFast(); }));
birdBtns.forEach(b => b.addEventListener('click', () => { FAST_BIRD = b.dataset.b === '1'; birdT = FAST_BIRD ? Math.min(birdT, 2) : rand(300, 600); syncFast(); }));
syncFast();
setInterval(() => { if (OV.hour === null) { const h = clock().h; hr.value = h; hl.textContent = fmt(h); } }, 1000);

// weather coordinates: saved in the browser settings, and weather is requested right after input
const latEl = document.getElementById('lat'), lonEl = document.getElementById('lon');
latEl.value = WEATHER.lat; lonEl.value = WEATHER.lon;
function applyPos() {
  const la = parseFloat(latEl.value), lo = parseFloat(lonEl.value);
  const okLa = isFinite(la) && la >= -90 && la <= 90, okLo = isFinite(lo) && lo >= -180 && lo <= 180;
  latEl.classList.toggle('bad', !okLa); lonEl.classList.toggle('bad', !okLo);
  if (!okLa || !okLo) return;
  WEATHER.lat = la; WEATHER.lon = lo; saveSettings(); fetchWeather();
}
latEl.addEventListener('change', applyPos); lonEl.addEventListener('change', applyPos);

// wallpaper close button: only in the Tauri app; first click — a little question mark, second closes (the quit_app command in lib.rs)
(function () {
  const T = window.__TAURI__, inv = T && ((T.core && T.core.invoke) || (T.tauri && T.tauri.invoke));
  const box = document.getElementById('ui-close'), btn = document.getElementById('close-app');
  if (!inv || !box || !btn) return;
  box.classList.add('on');
  let timer = 0;
  const disarm = () => { btn.classList.remove('arm'); btn.textContent = '✕'; btn.title = 'Close wallpaper'; };
  btn.addEventListener('click', () => {
    if (btn.classList.contains('arm')) { clearTimeout(timer); inv('quit_app'); return; }
    btn.classList.add('arm'); btn.textContent = '❓'; btn.title = 'Click again to close the wallpaper';
    timer = setTimeout(disarm, 3000);
  });
})();

// Refreshes the whole scene panel to the current state (after loading game settings from a file or a browser record).
function syncTopPanel() {
  uiOn(uiAll('button[data-m]'), b => b.dataset.m === 'now' ? OV.month === null : +b.dataset.m === OV.month);
  const h = OV.hour === null ? clock().h : OV.hour; hr.value = h; hl.textContent = fmt(h); syncTimeBtn();
  syncWeatherBtns(); syncFast();
  latEl.value = WEATHER.lat; lonEl.value = WEATHER.lon;
}