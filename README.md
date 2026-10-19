# Karjalan Metsämökki

Living pixel-art wallpaper for the Windows desktop: a Karelian mixed forest with a small red cabin where a family lives.
Time of day, seasons and weather follow the real clock and the real forecast. You build the family yourself:
people, looks, daily routine. Plain JavaScript, no dependencies, wrapped in a [Tauri](https://tauri.app) shell.

![Screenshot](docs/screenshot.png)

## Features

- Day and night, sunrise and sunset computed from your latitude and longitude, polar day and night, northern lights.
- Seasons by the calendar, real weather from [Open-Meteo](https://open-meteo.com) (rain, snow, fog, thunderstorms, wind).
- A family of any size, built in an in-app constructor: age, height, hairstyle, clothes, colours, wake/sleep times, temper.
- Things to do: sitting by the fire, picking berries, building a snowman, clearing the path, chopping firewood, collecting cones.
- Hares, squirrels and birds; Halloween and New Year decorations.
- Panels hidden in the top-left corner of the screen (hover to show them): time, weather, season, animals, holidays, coordinates, family, settings files.

The full description of the game (what it does and how it is built) is in the specification:

- [Specification (English)](docs/KMM-spec-en.md)
- [Specification (Russian)](docs/KMM-spec-ru.md)

## Download

Ready-made installers are attached to the [Releases](../../releases) page (Windows x64).

## Build it yourself

### Requirements (Windows 10/11, x64)

- [Node.js](https://nodejs.org) (LTS)
- [Rust](https://www.rust-lang.org/tools/install) with the default MSVC toolchain (`rustup`)
- Microsoft C++ Build Tools (Visual Studio Build Tools, workload "Desktop development with C++")
- Microsoft Edge WebView2 Runtime (already present on Windows 11 and on up-to-date Windows 10)

The official list of prerequisites is here: <https://tauri.app/start/prerequisites/>.

### Build

```bash
git clone https://github.com/<your-name>/<repo-name>.git
cd <repo-name>
npm install
npm run tauri build
```

The first build takes a while (Rust compiles all dependencies) and needs internet access
(crates, and the NSIS tools that Tauri downloads for the installer).

The installer appears here:

```
src-tauri/target/release/bundle/nsis/kmm-wallpaper_0.1.0_x64-setup.exe
```

### Install and use

1. Run the installer and choose a folder.
2. Start the program. On the first start it creates two files next to the exe:
   - `family.json` — the family (one default person at first);
   - `settings.json` — game settings (coordinates, time, weather, season, holidays, activities, animals).
3. The window is borderless, has no taskbar button and is pinned under all other windows, so it works as a wallpaper.
4. Close it with **Alt+F4**, or with the ✕ button in the top-right corner (it shows up on hover; the first click turns it into ❓, the second one closes the program).
5. To start it with Windows, put a shortcut to the exe into the `shell:startup` folder.

Set your own latitude and longitude on the top panel (📍) so that sunrise, sunset and weather match your place.
The family and the settings can be saved to files and loaded back with the 💾 buttons.

## Try it without building

Open `src/index.html` in any modern browser. Handy parameters for testing:

| Parameter | What it does |
|---|---|
| `?hour=21.5` | fixes the time (fractional hours) |
| `&month=1` | fixes the month (1–12) |
| `&day=25` | fixes the day of the month (for holidays, together with `&month=`) |
| `&speed=120` | speeds time up (time-lapse) |
| `&aurora=1` | turns the northern lights on |
| `&animals=fast` | animals and birds every 4–10 seconds |

`src/sprite-lab.html` is a separate page for drawing and checking character sprites.

## How the Tauri part works

The whole game is static files in `src/`; there is no bundler and no frontend npm dependencies.
Tauri just embeds the `src/` folder into the exe (`frontendDist` in `src-tauri/tauri.conf.json`) and exposes `window.__TAURI__` to the page (`withGlobalTauri`).

- **Window** (`tauri.conf.json`): no decorations, transparent, not resizable, not minimizable, hidden from the taskbar, `alwaysOnBottom`.
- **Pinned under all windows** (`src-tauri/src/lib.rs`): after start the window is maximized and moved to the bottom of the z-order with the WinAPI call `SetWindowPos(HWND_BOTTOM)` (crate `windows-sys`).
- **Commands** (`lib.rs`), called from the page:
  - `read_family_file` — reads `family.json` next to the exe;
  - `read_settings_file` — reads `settings.json` next to the exe;
  - `quit_app` — closes the program (the ✕ button).
- **Default files**: `src-tauri/src/family_default.json` and `settings_default.json` are embedded into the exe and written next to it on the first start, if the files are not there yet.
- **First start only**: the page reads `family.json` and `settings.json` only if the webview has no saved data yet. After that the family and the settings live in the webview's `localStorage`, so editing the files by hand has no effect later; use the 💾 panels in the game to load a file.
- **Installer**: NSIS only (`bundle.targets`), the install mode lets the user choose between "for me" and "for all users".

## Project layout

```
src/                  the wallpaper itself (HTML, CSS, JS)
  index.html
  sprite-lab.html     sprite showcase and constructor
  css/
  js/
src-tauri/            Tauri shell (Rust)
  src/lib.rs          window pinning and commands
  src/main.rs
  src/family_default.json
  src/settings_default.json
  tauri.conf.json
  capabilities/default.json
  icons/
docs/                 specifications (English, Russian)
```

## Credits and licence

- Weather data: [Open-Meteo](https://open-meteo.com) (CC BY 4.0).
- Built with [Tauri](https://tauri.app).
- Licence: MIT
