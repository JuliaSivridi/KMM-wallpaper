# Karelian Forest Hut — Specification

Living pixel-art desktop wallpaper: a Karelian mixed forest with a hut where a family lives. Time of day, seasons and weather follow the real clock and the real forecast. You can put the family together yourself in the builder: people, appearance, schedule. The project is plain JavaScript with no dependencies, split into modules.

This document describes: how to run it, what is done and how it is built, the drawing rules, and what could be done next.

---

## 1. How to run

**The app (Windows, Tauri).** The project builds into an installer (NSIS, the `src-tauri/` folder). During installation you choose a folder: the exe appears there, and on the first launch a `family.json` with one default person and a `settings.json` with default settings appear next to it. The window is frameless, full-screen, with no taskbar icon, pinned under all windows (`pin_to_bottom` in `lib.rs`). The `src/` folder with the wallpaper is embedded in the exe. You can close the wallpaper with Alt+F4 or the ✕ button in the top-right corner (about 70 px from the edges): it appears on hover, the first click turns it into ❓, the second closes it (the `quit_app` command; the button exists only in the app, not in the browser).

**Browser.** Open `index.html`. For testing you can append parameters to the address:

| Parameter | What it does |
|---|---|
| `?hour=21.5` | fixes the time (fractional hours) |
| `&month=1` | fixes the month (1–12) |
| `&speed=120` | speeds up time (timelapse) |
| `&aurora=1` | turns on the northern lights |
| `&animals=fast` | animals and birds every 4–10 seconds |
| `&day=25` | fixes the day of the month (for holidays, together with `&month=`); e.g. `?month=12&day=25` or `?month=1&day=10` for New Year |

**The showcase** `sprite-lab.html` — a separate sprite-builder page, not connected to the in-game family: a single character that depends only on the chosen settings. On the left is the builder (the same `buildLookControls` as in the "Palette" dialog) and under it a "Copy / Paste" block with the appearance as text. On the right are the season buttons 🌻 / ⛄ and four frames in a row (standing, sitting, step 1, step 2), below that all hairstyles (4 per row) and an "age × height" table (child and adult, −1, 0, +1). It exists to draw and check layers without running the whole scene. It includes only `colors.js`, `layers.js`, `look_editor.js` and `look.css`. Initial look: adult, short hair, top + bottom, long sleeves, the first colors of every palette.

The appearance text is refreshed on any change. Pasting (the button or Ctrl+V directly in the field) redraws the figure and the buttons. Fourteen fields are read: `age`, `height`, `skin`, `hair`, `hairstyle`, `outfit`, `dressColor`, `topColor`, `bottomColor`, `bottomKind`, `sleeves`, `shoes`, `hat`, `hatColor`. Extra fields (`id`, `name`, etc.) are ignored, missing ones stay as they are, colors are snapped to the palette. An invalid value or unreadable text changes nothing, and the reason is written under the field. The showcase doesn't know about schedule, temperament or name: when moving to a family file they must be added.

### Panels (invisible, appear when hovering over the top-left corner)

**Scene panel:**
- 🕒 🔄 "time as on the clock" (resets manual time) and a time-of-day slider;
- 🌡️ weather text: current or of the chosen forecast;
- 🔮 forecast: 🔄 now, +1, +2, +3 hours;
- below, "manual": 🌦️ weather (🔄 as it really is, ☀️ clear, ⚡ thunderstorm, 💧 rain, ❄️ snow, 🌫️ fog), 📅 season (🔄 by the calendar, ⛄ winter, 🌱 spring, 🌻 summer, 🍂 autumn; ⚙ on the right — which holidays exist), 🐿️ animals and 🐦 birds (🐢 rarely, 🐇 often; ⚙ on the right of each — which species exist);
- 📍 latitude and longitude for weather and day length; 💾 on the right — the game settings file (see below).

"Now" in either of the two weather rows resets both. Choosing weather manually clears the forecast choice, and vice versa.

**Family list** (under the scene panel): preview, name and the buttons ⚙ settings, 🎨 palette, 🗑 delete. At the bottom ➕ add, ✋ in-game actions and 💾 family file (the floppy disk on the right, like on the scene panel). While there is nobody in the family, instead of the list there is a hint: create a person or load a file.

**Side panels** open to the right of the list, with matching tops. Only one is open: opening a second closes the first as "Cancel". One rule everywhere: edits accumulate in the panel and are applied only on "Done", "Cancel" closes the panel without changes. "Animals", "Birds" and "Holidays" open to the right of the scene panel.

**Interface without dropdowns and system windows.** Buttons everywhere (`<select>`, `alert` and `confirm` are not used): that way the panels look like part of the game. Deleting a character is done with two presses on 🗑, messages are shown as a line in the panel.
- **Settings** — name, wake-up, sleep, temperament, "next to" (a row of buttons with names) and "Actions": buttons of the actions available to that age; pressed — does it, released — doesn't.
- **Palette** — the look builder: age (child, adult), hairstyle, hat, clothes, bottom and sleeves are chosen with picture buttons (small drawings of the variants, not dropdowns), height — with a slider −1…+1, then colors; on the right four frames (standing, sitting, step 1, step 2) and the 🌻 summer / ⛄ winter toggle; "Cancel" and "Done" sit under the frames, with the bottom edge of the buttons on the same line as the "Shoes" row. Order: age, height, hairstyle, hat, clothes, bottom, sleeves, colors (6 per row). Hairstyles: long, ponytail, bun, curly, bob, short, mohawk, bald (4 per row); clothes: top + bottom, dress.
- **Family file** — one text field and the buttons "Download", "Copy", "Paste" (from the clipboard into the field), "Open" (from a file into the field). "Done" applies the text from the field as a new family.
- **Game settings** (💾 in the coordinate row of the scene panel) — everything chosen on the scene panels, as one text: the buttons "Download", "Copy", "Paste", "Open", a field and "Cancel" / "Done". Opens to the right of the scene panel, format below in "Saving".
- **New character** — the same palette; the person is added on "Done".
- **In-game actions** (✋) — buttons of all actions in the groups "Adults", "Children", "Everyone"; seasons are shown as icons. Pressed — the action is available to everyone who can do it, released — nobody does it.
- **Animals / Birds** (⚙ in the scene panel) — one button per species: animals — hare, squirrel; birds — sparrow, tit, bullfinch, crow, magpie, jackdaws. Pressed — the species appears, released — it doesn't.
- **Holidays** (⚙ in the season row) — one button per holiday: Halloween, New Year. Pressed — decorations are there, released — not.

---

## 2. What is implemented

### The world
- **Mixed forest** of pines and birches in rows from the horizon to the foreground (10 depth rows), distant trees smaller and in haze. Undergrowth, bushes (juniper, rowan, deciduous), boulders, moss, bilberry.
- **A red hut** with white window frames, smoke from the chimney, a glowing window. A fire pit with two log benches. To the left of the hut a woodshed and a chopping block.
- **Sky:** Bayer-matrix dithering, sun and moon along arcs, twinkling stars, clouds, northern lights.

### Time, seasons, day length
- **Real clock.** Sunrise and sunset are computed from latitude, longitude and date (NOAA formulas) in the computer's time zone. There are white nights and polar day and night.
- **Seasons by month:** winter (Dec–Mar), spring (Apr–May), summer (Jun–Aug), autumn (Sep–Oct), late autumn (Nov, bare birches). In the southern hemisphere they shift by half a year.
- **Seasonal details:** ground and foliage colors, snow on crowns and roof, falling birch leaves, bilberry in July–August, lingonberry and mushrooms in autumn, rowan with berries, fireflies in summer.
- **Footprints in the snow:** in winter, short prints are left behind walking people, the hare and the squirrel, and a stripe behind a rolling snowball. They fade within 10–14 seconds and are not saved anywhere. Long footprints that snowfall covers over were decided not to be done (`js/tracks.js`).
- **Northern lights** — at latitude 55° and above (in either hemisphere) in the dark months, about every third night.

### Weather
- **Open-Meteo** (free, no key), a request every 20 minutes: current weather and an hourly forecast for 3 hours (`weather_code`, `cloud_cover`, `wind_speed_10m`, `temperature_2m`).
- **Cloud cover** changes the number of clouds, the greyness of the sky, the visibility of stars, the moon and the aurora.
- **Precipitation:** rain (the wind tilts the drops), snow, fog, thunderstorm with flashes.
- **Wind** affects cloud speed and the swaying of grass.
- **Heavy rain** (intensity ≥ 0.45): the family goes into the hut, the fire is not lit, animals and birds don't appear.
- **In summer, snow** turns into rain.
- **Without a network** the scene works without real weather.
- The data is a forecast model, not a weather station: it may show a local downpour over the house as drizzle.

### The family
Any number of characters, including zero: on the first launch the family is empty, there is nobody in the forest, the hut stands dark and the fire is not lit. People are added by hand (➕) or loaded from a file (💾). Anyone can be deleted, even the last one. Each is an object in `window.FAMILY`:

| Field | Values |
|---|---|
| `id`, `name` | unique id, name |
| `age` | `child`, `adult` |
| `height` | −1, 0, +1; a child +1 is drawn with a separate sprite (`kidTall`) |
| `skin`, `hair`, `shoes` | palette colors |
| `hairstyle` | `long`, `ponytail`, `bun`, `curly`, `bob`, `short`, `mohawk`, `none` |
| `outfit` | `top-bottom`, `dress` |
| `dressColor`, `topColor`, `bottomColor` | clothes colors |
| `bottomKind` | `pants`, `shorts`, `skirt` |
| `sleeves` | `long`, `short` |
| `hat`, `hatColor` | `none`, `plain`, `finnish`, `pompom`; the hat is worn only in winter |
| `wakeAt`, `sleepAt` | wake-up and sleep hours (24 = midnight) |
| `temper` | `calm`, `fidget` |
| `follows` | id of the character he stays next to, or `null` |
| `actions` | which actions he does: `{ "shovel": true, "chop": false }`; no field or key — enabled |

- **Actions:** `shovel` clear the path (adults, winter), `chop` chop firewood (adults, not summer), `snowman` build a snowman (children, winter), `cones` collect cones (children, autumn), `berries` berries (everyone, summer and autumn), `fire` sit by the fire (everyone). A person does an action only if it is enabled both in ✋ and for him personally. If an action is turned off while he is busy with it, he drops it and chooses another (the bucket of cones returns to the porch) (`js/actions.js`).
- **Foreground lines:** people walk and stand not along one line but along four: y = 156, 158, 160, 162 (`LINES` in `js/people.js`). They coincide with the depth-layer edges, so the drawing order is correct by itself: the nearer covers the farther. The line is chosen at random, with the main line 160 having twice the weight. On 160 are tied the fire, the snowman, the shovel, chopping and the cones; the other activities (a walk, sitting under a tree, berries, games) happen on any line. A fidget with `follows` sits on the leader's line. Above line 159 by the fire (±20 px) and "inside" boulders nobody stands; straight across the fire above 159 is not walked, a detour via 160.
- In the morning they come out of the hut one by one, in the evening they go to sleep, with a "z" over the roof.
- The fire burns from dusk (not before 15:00, not later than 20:30) as long as at least one adult is awake.
- **The window light** is on only if one of the awake people is inside the hut (e.g. hiding from the rain). Sleepers and those outside don't turn on the light.
- **"Calm" behavior:** they walk, sit under trees, pick berries (summer and autumn), sit by the fire. There are six spots by the fire: two logs and two ground spots on each side of them; one spot — one person. A taken spot (someone stands there or is going there) is skipped; if there are no spots, the person does something else. The same rule for sitting under a tree and picking berries: sprites must not sit on top of each other.
- **Snowman (winter, children only):** a child builds a snowman to the left of the big boulder: rolls balls over the snow (big, medium, small), stacks them and dresses it: scarf, arms, hat. The whole job takes about 10 minutes. One child builds it from start to finish, others don't help. Building is possible while the snow is wet (from −5° to +4°). From +5° the snowman melts: first the decor falls off, then he settles into a mound that shrinks to zero; a settled one is replaced by the child with a new one. In winter the snowman's spot is taken, nobody sits there (`js/snowman.js`).
- **Clearing the path (winter, adults only):** the path from the hut is snowed over in winter, snowfall covers it again, without snowfall it stays as it is. Any adult clears it with a shovel if nobody else is already clearing: goes from the door outward, about a minute. A clear path is drawn in bare-ground color, a snowed-over one in snow color, intermediate states as a checkerboard of pixels. After a restart the path is snowed over again (`js/path.js`).
- **Firewood (adults only, not in summer):** to the left of the hut a woodshed, a bit in front a chopping block. The woodshed shows how much wood is in it: it grows when an adult brings an armful, and shrinks while the stove (except in summer) and the fire burn. An adult chops when there is room in the woodshed: puts a log on the block, swings, strikes, the halves fly apart; having collected an armful, he carries it to the woodshed, and sometimes puts it into the fire, and the flame flares up brighter. An armful takes about 20 seconds. One adult chops at a time. The woodshed and block spot is taken, nobody sits there (`js/wood.js`).
- **Cones (autumn, children only):** cones now and then fall from the pines and lie on the ground (they don't fall on boulders). There is one bucket: a child goes collecting only when enough cones have gathered on the ground for a full bucket (six), takes it from the porch, collects until full and carries it to the fire. There he stands in front of the flame, farther from those sitting, and throws the cones into the fire, sparks fly. If the fire is not lit, he carries the bucket of cones back to the porch, and in the evening takes it and throws the cones into the fire (`js/cones.js`).
- **"Fidget" behavior:** they run, jump, play; if `follows` is set — they stay close to that one: by the fire they sit on the free spot closest to him (no spots — next to him on the ground), pick berries together.

### Animals
Every 5–10 minutes (in "often" mode — 4–10 seconds), a hare or a squirrel, equally. Species disabled in ⚙ don't appear; if both are disabled, there are no animals.
- **Brown hare:** in the depth of the forest jumps from edge to edge, hides behind trunks. In the foreground he runs toward the family, about 2 m away he sits up like a post and dashes back.
- **Squirrel:** runs in hops to a foreground tree, climbs in jerks, sits under the crown, jumps in an arc to neighbouring trees (up to 3 times), descends head-first and runs away.

### Birds
A separate timer, also every 5–10 minutes. Only in the daytime and not in a downpour. Any species can be disabled in ⚙; the chances of the others stay the same.
- **Small** (sparrow, tit, bullfinch; bullfinches more often in winter): 1–3 at a time, fly in a wave, flit over 2–5 trees, sometimes land on the ground and peck.
- **Large** (crow, magpie): fly from edge to edge, flapping in 4 phases and gliding; in about half the cases they land on the top of a tree.
- **Jackdaws:** a flock of 8–12 birds; in 40% of cases they settle over 3–4 trees and take off all at once.

### Holidays
Tied to the calendar, for testing: `?month=10&day=25` (`js/holidays.js`). There are two for now: Halloween (15–31 October, everything disappears on 1 November) and New Year (15 December – 14 January). Each can be disabled in ⚙ (season row): then its decorations are absent.
- **Pumpkins** appear in the forest one every two days (the first on the 15th, the ninth by the 31st). The spots are fixed, not by the hut, the fire and boulders.
- **Jack-o'-lantern** stands to the right of the end of the path to the house. From dusk its eyes and mouth glow and flicker, the ground around is lit.
- **Garlands** (up to three) hang between neighbouring front-row trees. Bulbs 2×2 alternate orange and purple, dim by day, lit and flickering in the evening.
- **The web** is one, round (8 spokes, 2 rings), between two trees nearer the middle of the scene, above heads, below the needles. Every 50 seconds a little spider descends on a thread, hangs, and climbs back up. Its place is found before the garlands, and they go around it.
- **Skeleton decoration** 7×13 stands in the bottom-left corner (facing the viewer). In the evening its eye sockets glow and flicker, like the jack-o'-lantern's. The foreground grass next to it is not drawn during the holiday (otherwise it covers its legs), then it grows back.
- **Ghosts** Pac-Man style (Blinky, Pinky, Inky, Clyde), 7×8, 25% opacity. At dusk and at night every 1–3 minutes (with `&animals=fast` — every 4–10 seconds) one flies out, sometimes a chain of 2–4. They float a little above the ground at the far-forest depth, hide behind nearby trunks, fly from edge to edge.

**New Year.** Runs from 15 December to 14 January, and also always while winter ⛄ is selected manually on the panel. Without a day `?month=1` gives the 15th, so for testing you also need `&day=`.
- **Garlands** red-and-green, up to five. They hang between trees of the front rows standing on the same or neighbouring lines, each with at least five bulbs. In the evening they light up and flicker. On a narrow window there are few trees, and only two or three garlands come out.
- **The fir tree** is a little taller than a tall adult, to the right of the fire, above the walking lines, next to the front-row trees and not on boulders. It has individual multicolored bulbs, a golden star on top, in winter snow on the tier tips. By day the bulbs are dim, in the evening they burn at full color and each flickers in its own way. People standing closer than the tree cover both it and its lights; the light doesn't fall on people (unlike the fire).

### Saving
- **Family:** stored in `localStorage` (key `forest.family.v1`) and in a file. The file is `forest-family.json`, an array of people. Loading a file **fully replaces** the family. There is no "default" family in the page code (the default person exists only in the Tauri part, see below): the wallpaper is not tied to someone's particular family, the family file is personal and is given to friends separately (or not).
- **Coordinates:** in `localStorage` (`forest.settings.v1`), separately from the family file, so they don't go to friends along with the file.
- **Snowman:** readiness, owner and save time in `localStorage` (`forest.snowman.v1`); after a restart he returns if it is still winter and less than 100 days have passed. Doesn't go into the family file.
- **Firewood:** the number of logs in the woodshed in `localStorage` (`forest.wood.v1`), doesn't go into the family file.
- **Game settings** (`js/gsettings.js`): the file `settings.json`, not connected to the family and not going with it. Everything chosen on the scene panels. Fields missing from the file stay as they are; unknown ids in lists are skipped; an error in any field cancels the application entirely.

  ```json
  { "location": { "lat": 61.07, "lon": 28.28 }, "time": "now", "weather": "now", "season": "now",
    "holidays": "all", "actions": "all",
    "animals": { "rate": "slow", "species": "all" }, "birds": { "rate": "slow", "species": "all" } }
  ```
  `time`: `"now"` or a number of hours (21.5). `weather`: `"now"`, forecast `"+1"`, `"+2"`, `"+3"` or `clear`, `storm`, `rain`, `snow`, `fog`. `season`: `"now"`, `winter`, `spring`, `summer`, `autumn`. `holidays`, `actions`, `species`: `"all"` (everything the game has, new ones turn on by themselves) or a list of enabled ids. `rate`: `slow` or `fast`. The current state, including manual time, weather and season, is remembered in `localStorage` (`forest.gs.v1`) and restored after a restart (🔄 returns "as it really is"); the `?animals=fast` address is stronger than the file at startup. The family and world state (snowman, firewood) are not included in the settings.
- **Switches ✋ and ⚙:** `localStorage` (`forest.actions.v1`, `forest.fauna.v1`, `forest.holidays.v1`), don't go into the family file, but are included in the game settings (`settings.json`). A character's personal actions — the `actions` field in the family file.
- On loading and at startup colors are snapped to the nearest palette colors.
- **First launch in Tauri (settings):** the same for game settings: if there is no `forest.gs.v1` record at all, the page asks for the `read_settings_file` command, which reads `settings.json` next to the exe (no file — it returns a sample embedded from `src-tauri/src/settings_default.json`).
- **First launch in Tauri (family):** if there is no family record in `localStorage` at all, the page asks Tauri for the `read_family_file` command: it reads `family.json` next to the exe (no file — it returns the default person embedded in the exe from `src-tauri/src/family_default.json`), and the family is applied. After that it lives in `localStorage`: manual edits to the file will only be picked up after clearing the webview data or loading via 📁. An empty family left by the person themselves (the record `[]`) is not overwritten by the file (`js/main.js`). In a regular browser there is no command, and the family is empty by default.

---

## 3. Technologies and architecture

### Files

| File | What's inside |
|---|---|
| `index.html`, `css/style.css`, `css/look.css` | the page, scene and panel styles, builder styles |
| `js/settings.js` | weather coordinates, FPS; reading saved coordinates |
| `js/actions.js` | list of actions (`ACTIONS`), global and personal switches (`canDo`) |
| `js/colors.js` | palettes (`SWATCH`) and snapping colors to them (`snapFamily`) |
| `js/layers.js` | people's sprite layers: `composeSprite`, `layerPalette` |
| `js/util.js`, `js/palette.js` | utilities and season palettes |
| `js/time.js`, `js/weather.js` | clock, seasons, sunrise and sunset; weather and forecast |
| `js/layout.js`, `js/render.js` | scene layout and rendering |
| `js/sprites.js` | animal and bird sprites |
| `js/people.js`, `js/animals.js`, `js/particles.js` | people's, animals' and birds' behavior, particles |
| `js/snowman.js` | the snowman: rolling balls, melting, saving |
| `js/path.js` | the winter path from the hut: snow on it, clearing with a shovel |
| `js/wood.js`, `js/cones.js` | firewood (woodshed, chopping block, chopping) and cones (falling, collecting, bucket) |
| `js/tracks.js` | short footprints in the snow |
| `js/holidays.js` | holidays: Halloween (pumpkins, jack-o'-lantern, garlands, web with a spider, skeleton, ghosts) and New Year (garlands, fir tree) |
| `js/storage.js`, `js/ui.js` | family saving; the scene panel and the wallpaper close button |
| `js/ui_family.js`, `js/ui_editor.js`, `js/look_editor.js`, `js/ui_palette.js`, `js/ui_file.js`, `js/ui_actions.js`, `js/ui_fauna.js`, `js/ui_holidays.js` | family list and side panels (including ✋ and ⚙) |
| `js/gsettings.js`, `js/ui_gsettings.js` | game settings: collecting and applying, remembering, reading `settings.json`; the 💾 panel |
| `js/main.js` | startup; family at start (localStorage, otherwise `family.json` next to the exe) |
| `src-tauri/src/lib.rs`, `family_default.json`, `settings_default.json`, `tauri.conf.json` | the Tauri shell: a window under all windows, creating `family.json` and `settings.json` next to the exe, the `read_family_file`, `read_settings_file` and `quit_app` commands |
| `sprite-lab.html` | the sprite showcase |


### Rendering
- **Internal resolution:** height 180 px, width proportional to the screen. The canvas is stretched to the whole screen with `image-rendering: pixelated`.
- **20 frames per second**, paused when `document.hidden`.
- **The winter path** from the hut is not included in the ground cache: the snow on it changes, so it is drawn every frame as a layer-0 object (before everything else).
- **Caches** are rebuilt every 30 game seconds or when the season, cloud cover or size changes: the sky (`ImageData` with dithering) and the ground (**13 depth layers**, edges in `LAYER_EDGES`: an object goes into a layer by its base `y`). The edges are denser where people walk: 156, 159 (fire boundary), 161. The people line y=160 lies in the layer [159, 161).
- **Drawing order.** For each layer: the layer's picture from the cache, then the footprints in the snow, then the dynamic objects of that layer, sorted by `y` (by `x` when equal). The dynamic objects are collected by `sceneItems()`: people, animals and ground birds, the snowman and ball, firewood and the woodshed, cones and bucket, jack-o'-lantern, spider, winter path. Each has a base `y`, the layer is computed from it. Exceptions with a flag: `over` (over the segment: birds in the air and on trees, smoke) and `l` (explicit layer, for the path).
- **Segments and glowing objects.** The scene is drawn onto several segment canvases, the boundaries between them set by the `BREAKS` list (boundary `y` and a draw function). Each segment is dimmed at night separately, and between the segments a glowing object is drawn that must not be dimmed. There are two boundaries for now: the New Year tree lights at y=154 and the fire at y=159 (flame and sparks). Whatever is deeper is behind the flame, whatever is at y=159 and closer covers it. Foreground grass, rain, snow and leaves in the air are drawn at the end of the last segment. A new boundary = a new entry in `BREAKS`.
- **Lighting:** each of the canvases is dimmed separately, night dimming and the warm dusk tint are applied via `source-atop`; light sources (fire, window, fireflies, sparks) are drawn after the dimming via `lighter`.
- **Deterministic layout:** the `mulberry32` generator with fixed seeds, the forest is the same on every launch and for the same scene width (`W`, from the window proportions). A different window or monitor gives a different forest.
- **Statics and dynamics.** Trees, bushes, all boulders, pumpkins, the hut, the chopping block are baked into the layers once, the rest is drawn every frame (the list above). Within one layer the statics are always below the dynamics; the layer strip is 2 px (more precisely in the 156–161 zone).

### People's sprites (layers)
- Each age has its own body template: **adult** 8×14, **child** 6×8. Height (`height`) −1, 0, +1 is duplicating or removing one torso row. The exception is **child +1**: this is a separately drawn sprite (the `KID_TALL` layer set, the `kidTall` template, 8×12): head like an adult, torso two rows shorter than an adult. It has only one height, the ±1 adjustment is not applied; when sitting it keeps shoulders and arms.
- Height in rows: child −1 / 0 / +1 — 7 / 8 / 12, adult — 13 / 14 / 15. Child −1 is a child with a one-row torso.
- The template and layer set are chosen by `composeSprite` (the `AGE_SET` and `SETS` tables).
- Layers are stacked in order: skin → hair → top → bottom → sleeves → shoes → hat. A letter = a character palette color (`H` hair, `S` skin, `E` eye, `T` top, `D` dress, `L` bottom, `B` shoes, `C`/`c`/`w` hat).
- The walking and sitting frames are assembled from the same layers: only the bottom rows ("legs") change. The head doesn't move.
- The hat hides the hair under it. For a hairless head, the plain hat and the pompom hat have their own drawing: the fit at the forehead is the same, but at the back the hat sticks out 1 px instead of 2. The Finnish hat has no separate drawing, it looks the same on any head.
- `composeSprite` returns `{ idle, walkA, walkB, sit }` — arrays of strings. The results are cached by look and season.
- The palettes are limited: skin 6 colors, hair 10, clothes and hats 12, shoes 6. The builder chooses only from them.

### Behavior
- **Characters** — a simple state machine: `walk` (along a route of points), `idle`, `sit`, `pick`, `play`, `build` (rolls balls and dresses the snowman), `shovel` (clears the path), hidden in the hut. `choose()` picks the next activity with weights depending on time, season, weather and `temper`. The route is built by `buildPath` (points with a line `y`), a free spot is checked by `spotFree` by `x` and the line (people on neighbouring lines must not stand on top of each other).
- **Animals and birds** — a shared `ANI` array, each species has its own states: squirrel `toTree / up / perch / jump / down / away`, hare `run / stop`, bird `fly / perch`. Squirrel jumps — the `hopStep` function.

---

## 4. Drawing rules

### General principles
- **Shape and color matter more than details.** Eyes, necks and fingers are not distinguishable at these sizes. The exception is the beak: it must stand out by color.
- **Strictly side view.** Fan tails, perspective and angles don't work in this 2D world.
- **Make new poses from existing sprites**, not by drawing anew.
- **Simple hairstyles.** Braids are not distinguishable in pixels; instead there are the bun and the mohawk.

### Scale

| Object | Size, px |
|---|---|
| Adult person | 8 × 14 |
| Child | 6 × 8 |
| Child +1 | 8 × 12 |
| Snowman | 9 × 14, with hat |
| Squirrel | 8 × 6 with tail |
| Crow, magpie (flying) | 10 × 3 body + wings 3 rows each |
| Crow, magpie (perched) | 5 × 8 |
| Jackdaw (flying) | 8 × 3 |
| Small birds (perched) | 5 × 4 — round little balls |

### Birds
- A perched bird and a flying bird are different silhouettes, but of the same visual "weight".
- The body of large birds is 3 rows, tapering toward the tail. The head continues the line of the back without a gap, the beak is 1 px. The wing is attached to the middle of the back.
- The crow and the magpie have one shape, they differ in coloring. In the magpie the white is the belly and the wing tips.
- Feet: 1 px for small ones, one pixel per foot for medium and large ones.

### Movement
- Squirrels — in hops: a series of leaps and freezing; on the trunk — in jerks.
- Hares — head above the back, ears laid back, a little tail on top of the rump.
- Small birds — flying in a wave (flaps → wings pressed).

### Color
- Make light objects in the snow a little darker, otherwise they disappear.
- Black clothes are almost invisible at night — that's normal.
- In the character palette there are several clearly distinguishable colors, without close shades.

---

## 5. Future ideas

### 5.1. Nature
- **Elk** — a rare event once every few days.
- **Fox** mouse-hunting in winter: a jump and a dive into the snowdrift.
- **Woodpecker** pecks the trunk, chips fly.
- **Shooting stars** on clear nights, more often in mid-August.
- **Rainbow** after rain, if the sun came out.
- **Owl** on a pine at night: hoots, turns its head.

### 5.2. Interaction
- **Clicks:** on a tree — a bird flutters up, on a family member — he waves his hand.
- **Feeder:** tits and bullfinches come more often.

### 5.3. Characters
- **Family exchange:** the file already exists; a short text code could be added.
- **Festive costume palette:** a separate set of outfits for the holidays (a witch's cap, a ghost sheet, etc.).

### 5.4. Toward a game
- Point-and-click: a click sends a character to a point, the hut interior as a separate scene, items (mushrooms, berries, cones, firewood), small quests from what already happens.
- First decide what kind of game this is: a cozy sandbox, a game for a child, or a story with an adventure.

### 5.5. Decided not to do
- **People walking between the front trees:** four lines below the trunks are enough (tree bases up to y≈152).
- **Sleds with a hill:** the hill takes up space, and it is unclear where to put it.
- **A hammock between pines:** lying sprites are needed, not suitable yet.
- **Long footprints in the snow** that snowfall covers over: only short fading ones are kept.
- **Bats** for Halloween: they are not seen here at this time of year.

---

## 6. Known conventions and limitations
- Statics and dynamics in one depth layer are not sorted among themselves: the statics lie under the dynamics. An error is possible only if the bases differ by less than the layer width.
- A bird on a branch is drawn over the foliage, even if another tree's crown is in front of it, otherwise small birds are not visible.
- Squirrels climb only foreground trees.
- Animals and characters don't go around each other on the move. The exception is spots where a person stays for a long time (sitting, picking berries): they are taken only by free ones, checked by `x` and the line.
- The time zone is taken from the computer; the coordinates in the settings must match it, otherwise sunrise and sunset shift.
- Child +1 is drawn separately and exists only at standard height. The remaining height ±1 is duplicating or removing a torso row; on a small body it is noticeable (child −1 has a torso of only one row).
- For the southern hemisphere the seasons shift, but berries and mushrooms are tied to the "northern" months.
