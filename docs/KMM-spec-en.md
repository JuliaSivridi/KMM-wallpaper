# Karelian Forest Cabin — Specification

Living pixel-art desktop wallpaper: a Karelian mixed forest with a cabin where a family lives. Time of day, seasons and weather follow the real clock and the real forecast. You can put the family together yourself in the builder: people, appearance, schedule. The project is plain JavaScript with no dependencies, split into modules.

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
| `&animals=fast` | all random events (animals, birds, ghosts, shooting stars) about every 7 seconds on average; the species keep their shares |
| `&events=fast` | the same as `&animals=fast` |
| `&ghosts=fast`, `&meteors=fast`, `&hare=fast` | speeds up one event; the id of any event of the registry works |
| `&day=25` | fixes the day of the month (for holidays, together with `&month=`); e.g. `?month=12&day=25` or `?month=1&day=10` for New Year |
| `&snow=1` / `&snow=0` | snow lies / the ground is bare, in the months when snow can lie by the weather (April, October, November); e.g. `?month=11&snow=1` |
| `&wind=270` | the direction the wind comes from, in degrees (270 — west, so the clouds go to the left) |
| `&puddles=1` / `&puddles=0` | puddles at full size / no puddles |
| `&rainbow=1` / `&rainbow=0` | a rainbow in the daytime (e.g. `?hour=8`) / never |
| `&moon=0.5` | the Moon's phase (0 — new, 0.25 — first quarter, 0.5 — full, 0.75 — last quarter); whether it is up depends on the time, e.g. `?moon=0.5&hour=23` |

The parameters work only in the browser: the app (Tauri) has no address bar, there everything is set by the settings.

**The showcase** `sprite-lab.html` — a separate sprite-builder page, not connected to the in-game family: a single character that depends only on the chosen settings. On the left is the builder (the same `buildLookControls` as in the "Palette" dialog) and under it a "Copy / Paste" block with the appearance as text. On the right are the season buttons 🌻 / ⛄ and four frames in a row (standing, sitting, step 1, step 2), below that all hairstyles (4 per row) and an "age × height" table (child and adult, −1, 0, +1). It exists to draw and check layers without running the whole scene. It includes only `colors.js`, `layers.js`, `look_editor.js` and `look.css`. Initial look: adult, short hair, top + bottom, long sleeves, the first colors of every palette.

The appearance text is refreshed on any change. Pasting (the button or Ctrl+V directly in the field) redraws the figure and the buttons. Fourteen fields are read: `age`, `height`, `skin`, `hair`, `hairstyle`, `outfit`, `dressColor`, `topColor`, `bottomColor`, `bottomKind`, `sleeves`, `shoes`, `hat`, `hatColor`. Extra fields (`id`, `name`, etc.) are ignored, missing ones stay as they are, colors are snapped to the palette. An invalid value or unreadable text changes nothing, and the reason is written under the field. The showcase doesn't know about schedule, temper or name: when moving to a family file they must be added.

**The costume showcase** `costumes.html` — a separate page for the holiday costumes, built like the sprite showcase and also not connected to the family. On the left the costumes are listed by slot: "Head" (witch hat, cat ears, Santa hat, tonttu hat, antlers) and "Body" (ghost sheet, skeleton, witch robe, pumpkin suit, Santa coat, elf tunic), each group under its own holiday, with a "— none" button in every slot; under the list is a row of all the hairstyles, to see how the headwear hides the hair. On the right are the "age × height" table (child and adult, −1, 0, +1) and the frames: for a child and for an adult, four in a row (standing, sitting, step 1, step 2). Any head can be combined with any body, even from different holidays: it is only for looking at the drawings, in the game a person wears the costumes of one holiday. It includes only `colors.js`, `layers.js`, `costumes.js`, `look_editor.js` and `look.css`. Initial look: adult, short hair, top + bottom, the first colors of every palette, the witch hat and no body costume.

**The animal lab** `animal-lab.html` — a separate page for drawing the frames of animals and birds, built like the sprite showcase. On the left: the animal (hare, squirrel, hedgehog, fox, moose, sparrow, tit, bullfinch, crow, magpie, jackdaw), its palette (letters, summer / winter colours), buttons that add or remove a row or a column on any side of the frame, the background (transparent, grass, snow), letters, grid, undo and "Reset frame". In the middle: the frame as a grid of pixels (left click or drag — paint, right click — erase; the ground line and the middle column are marked) and thumbnails of all frames of the animal (a dot marks a changed one). On the right: the result as text (the whole table, only the changed frames, or all tables) to paste into `js/sprites.js` by hand, and the real size ×1 and ×4. Edits stay in the browser until they are pasted into the file. It includes only `sprites.js`. The sparrow, the tit and the bullfinch share their frames; the colours are shown without the haze that the game adds in the distance.

### Panels (invisible, appear when hovering over the top-left corner)

**Scene panel:**
- 🕒 🔄 "time as on the clock" (resets manual time) and a time-of-day slider;
- 🌡️ weather text: current or of the chosen forecast;
- 🔮 forecast: 🔄 now, +1, +2, +3 hours;
- below, "manual": 🌦️ weather (🔄 as it really is, ☀️ clear, ⚡ thunderstorm, 💧 rain, ❄️ snow, 🌫️ fog; ⚙ on the right — sky and nature), 📅 season (🔄 by the calendar, ⛄ winter, 🌱 spring, 🌻 summer, 🍂 autumn; ⚙ on the right — which holidays exist), 🐿️ animals and 🐦 birds in one row: an icon and ⚙ each (how often every species occurs);
- 📍 latitude and longitude for weather and day length; 💾 on the right — the game settings file (see below).

"Now" in either of the two weather rows resets both. Choosing weather manually clears the forecast choice, and vice versa.

**Family list** (under the scene panel): preview, name and the buttons ⚙ settings, 🎨 palette, 🎭 costume (only while a holiday is on; the preview shows the person in that costume) and 🗑 delete. At the bottom ➕ add, ✋ in-game actions and 💾 family file (the floppy disk on the right, like on the scene panel). While there is nobody in the family, instead of the list there is a hint: create a person or load a file. When a holiday begins or ends, the list redraws itself within a second, so the 🎭 buttons appear and disappear together with it.

**Side panels** open to the right of the list, with matching tops. Only one is open: opening a second closes the first as "Cancel". One rule everywhere: edits accumulate in the panel and are applied only on "Done", "Cancel" closes the panel without changes. "Sky and nature", "Animals", "Birds" and "Holidays" open to the right of the scene panel.

**Interface without dropdowns and system windows.** Buttons everywhere (`<select>`, `alert` and `confirm` are not used): that way the panels look like part of the game. Deleting a character is done with two presses on 🗑, messages are shown as a line in the panel.
- **Settings** — name, wake-up, sleep, temper, "next to" (a row of buttons with names) and "Actions": buttons of the actions available to that age; pressed — does it, released — doesn't.
- **Palette** — the look builder: age (child, adult), hairstyle, hat, clothes, bottom and sleeves are chosen with picture buttons (small drawings of the variants, not dropdowns), height — with a slider −1…+1, then colors; on the right four frames (standing, sitting, step 1, step 2) and the 🌻 summer / ⛄ winter toggle; "Cancel" and "Done" sit under the frames, with the bottom edge of the buttons on the same line as the "Shoes" row. Order: age, height, hairstyle, hat, clothes, bottom, sleeves, colors (6 per row). Hairstyles: long, ponytail, bun, curly, bob, short, mohawk, bald (4 per row); clothes: top + bottom, dress.
- **Costume** (🎭 in the family list; the button exists only while a holiday is on) — for each running holiday a row of buttons per slot, "Head" and "Body": pressed — that costume, "— none" — without it. "Done" applies the choice, "Cancel" closes the panel without changes.
- **Family file** — one text field and the buttons "Download", "Copy", "Paste" (from the clipboard into the field), "Open" (from a file into the field). "Done" applies the text from the field as a new family.
- **Game settings** (💾 in the coordinate row of the scene panel) — everything chosen on the scene panels, as one text: the buttons "Download", "Copy", "Paste", "Open", a field and "Cancel" / "Done". Opens to the right of the scene panel, format below in "Saving".
- **New character** — the same palette; the person is added on "Done".
- **In-game actions** (✋) — buttons of all actions in the groups "Adults", "Children", "Everyone"; seasons are shown as icons. Pressed — the action is available to everyone who can do it, released — nobody does it.
- **Animals / Birds** (⚙ next to the 🐿️ and 🐦 icons of the scene panel) — a list, every species on its own row: the icon with the name, and on the right four aligned buttons ❌ 🚶 🏃 🚴 — off / rare / normal / often, the needed level in one click. Animals: hare, squirrel, hedgehog, fox, moose; birds: sparrow, tit, bullfinch (🐤), crow, magpie, jackdaws (🐦). "Done" applies, "Cancel" closes the panel without changes. Under every name a small grey line shows how often the species appears at the chosen level ("~15 min", "~1.5 h", with a note such as "· evening" for those that appear only at a certain time); it is recalculated at every click on the scene panel, because the season changes some intervals.
- **Holidays** (⚙ in the season row) — a button per holiday (Halloween, New Year): pressed — the holiday is on, released — it is not, and then there are neither decorations nor costumes. Under it, indented, a button per decoration in one row that wraps when there is not enough room: Halloween — skeleton, lantern, pumpkins, web with a spider, garlands; New Year — the tree, garlands. Pressed — the decoration is there, released — it is not; with the holiday off these buttons are dimmed but keep their own states. The ghosts (Halloween) stand on a row of their own and, instead of a switch, have four level buttons like the animals, with the same interval line. The dates of the holidays are in the hint.
- **Sky and nature** (⚙ in the weather row) — one button per item: puddles, rainbow, northern lights, shooting stars, and under them, indented, the names of the meteor showers (Quadrantids, Lyrids, Eta Aquariids, Perseids, Orionids, Leonids, Geminids) in one row that wraps when there is not enough room; the date of the maximum is in the hint. Pressed — it exists, released — it doesn't; while shooting stars are off the showers are muted. The ⚙ makes the scene panel a little wider.

---

## 2. What is implemented

### The world
- **Mixed forest** of pines and birches in rows from the horizon to the foreground (10 depth rows), distant trees smaller and in haze. Undergrowth, bushes (juniper, rowan, deciduous), boulders, moss, bilberry.
- **A red cabin** with white window frames, smoke from the chimney, a glowing window. A fire pit with two log benches. To the left of the cabin a woodshed and a chopping block.
- **Sky:** Bayer-matrix dithering, sun and moon along arcs, real stars and shooting stars, clouds, northern lights.

### Time, seasons, day length
- **Real clock.** Sunrise and sunset are computed from latitude, longitude and date (NOAA formulas) in the computer's time zone. There are white nights and polar day and night.
- **Seasons by month:** winter (Dec–Mar), spring (Apr–May), summer (Jun–Aug), autumn (Sep–Oct), late autumn (Nov, bare birches). In the southern hemisphere they shift by half a year.
- **Snow by the weather.** Outside calendar winter snow can fall and stay too: in April, October and November. It starts to lie during a real snowfall (below +1°): the ground turns white in spots that grow and merge, and is fully white after a few minutes of steady snowfall; a thin deposit that did not grow into a cover goes away by itself. When more than half is white, the scene turns into "winter" (hats, footprints, snowman, clearing the path), when less than half is left, back. Melting starts from a threshold temperature of the month (April +1°, October +3°, November +7°: in Karelia November snow stays even in a thaw) and goes faster the warmer it is, gradually, spot by spot; without temperature data it melts slowly in April and October and stays in November. In the other months snow does not lie, in December the calendar winter takes over. A season chosen by hand (🌱 🌻 🍂 ⛄) switches this off (`js/snowcover.js`).
- **Seasonal details:** ground and foliage colors, snow on crowns and roof, falling birch leaves, bilberry in July–August, lingonberry and mushrooms in autumn, rowan with berries, fireflies in summer.
- **Footprints in the snow:** in winter, short prints are left behind walking people, the hare, the squirrel, the fox and the moose, and a stripe behind a rolling snowball. They fade within 10–14 seconds and are not saved anywhere. Long footprints that snowfall covers over were decided not to be done (`js/tracks.js`).
- **Northern lights** — at latitude 55° and above (in either hemisphere) in the dark months, about every third night.
- **The Sun and the Moon.** Both follow a circular arc across the sky (its centre lies deep under the ground); the height and length of the arc come from the real declination, as in life: the Sun is high in summer and low in winter, a full moon is high in winter and in the white nights of summer barely rises, a crescent in winter stays low. The forest is tall, so a low Sun or Moon stays behind the trees: in winter the Sun is hardly seen at all (`js/moon.js`).
- **Moon phases.** The phase follows the date (a synodic month of 29.53 days): a thin crescent, a half disc at the quarters, a full disc at full moon, and at new moon nothing at all. A waxing Moon is lit on the right, a waning one on the left (the other way round in the southern hemisphere). The Moon rises about 50 minutes later every day: the first quarter is up in the afternoon and the evening, the full moon all night, the last quarter after midnight. A half disc and thicker is seen, paler, in the daytime too; a crescent only in the dark.
- **Stars.** They stand in their real places: the height and the side of every star are computed from its coordinates for the time on the clock, the date and the latitude/longitude (sidereal time), so the sky turns during the night and changes by season — Orion and Taurus in winter, the Summer Triangle, Lyra and Cygnus in summer, the Pegasus square and Andromeda in autumn. About 190 bright stars with colours (red Betelgeuse, blue Rigel) and 520 faint background ones, no connecting lines. How many are seen follows the darkness and the clouds: in the twilight the brightest come first; a full moon washes out the faint stars and the ones near it; low stars are dimmer. The frame looks south, as the Sun's and the Moon's arc (in the southern hemisphere — north, with the same left-to-right motion). Near the zenith and to the north the sky does not fit: the Big Dipper and Cassiopeia pass high on this latitude and show only when they lean to the side (`js/stars.js`).
- **Shooting stars.** In a dark clear sky a short streak with a fading tail, on average one in 10 minutes. On the days of seven meteor showers there are more of them (Quadrantids, Lyrids, Eta Aquariids, Perseids, Orionids, Leonids, Geminids): each has a date of the maximum, a width and a radiant whose place in the sky is computed like a star's; the streaks fly away from the radiant, and the higher the radiant, the more meteors (the rates are tuned for a pleasant wallpaper, not real ones; at 61° the Eta Aquariids are weak, as in life). Test: `?month=8&day=12&hour=23` (Perseids), `&meteors=fast` for frequent ones. Puddles, rainbow, northern lights, shooting stars and each shower can be switched off in the ⚙ "Sky and nature" panel.

### Weather
- **Open-Meteo** (free, no key), a request every 20 minutes: current weather and an hourly forecast for 3 hours (`weather_code`, `cloud_cover`, `wind_speed_10m`, `wind_direction_10m`, `temperature_2m`).
- **Cloud cover** changes the number of clouds, the greyness of the sky, the visibility of stars, the moon and the aurora.
- **Precipitation:** rain (the wind tilts the drops), snow, fog, thunderstorm with flashes.
- **Wind** affects the speed and direction of the clouds, rain, snow and the smoke from the chimney and the fire, and the swaying of grass (speed only). The direction comes from the forecast and changes smoothly. The frame looks south, so a west wind blows from right to left and an east wind from left to right; a north or south wind gives a weak sideways drift. Weather chosen by hand has no direction: everything goes to the right.
- **Heavy rain** (intensity ≥ 0.45): the family goes into the cabin, the fire is not lit, animals and birds don't appear.
- **In summer, snow** turns into rain.
- **Puddles.** After rain puddles form on the ground in front of the people lines: they appear one by one, grow while it rains, and shrink and vanish one by one within an hour or two after it stops (a drizzle fills the ground slowly, a downpour in a few minutes). They mirror the sky of that moment, a sunset included, and while it rains rings from the drops run across them. There are none where snow lies or is arriving, and in frost. They keep away from the cabin, the fire, boulders and the holiday decorations (`js/puddles.js`).
- **Rainbow.** After a real rain (not a sprinkle) the sky gets a chance to show one: if within half an hour the rain has stopped, the sun is out and the clouds have thinned, it appears with a 70% chance, slowly fades in, hangs for 10–20 minutes and fades out. It also goes away when the rain comes back, the sun sets, the sky closes over or snow lies. It stands on the side of the sky opposite the Sun, translucent: brighter in clear daylight, weaker under clouds, invisible at night; its ends hide behind the hills and trees (`js/rainbow.js`).
- **Without a network** the scene works without real weather.
- The data is a forecast model, not a weather station: it may show a local downpour over the house as drizzle.

### The family
Any number of characters, including zero: on the first launch the family is empty, there is nobody in the forest, the cabin stands dark and the fire is not lit. People are added by hand (➕) or loaded from a file (💾). Anyone can be deleted, even the last one. Each is an object in `window.FAMILY`:

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
| `costumes` | optional holiday costumes: `{ "halloween": { "head": "witch", "body": "ghost" }, "newyear": { "head": "tonttu" } }`; a plain string is read as the head costume; visible only while that holiday is on |

**Holiday costumes** (`js/costumes.js`, `js/ui_costumes.js`) are an optional extra layer over the person, chosen in the 🎭 panel: a head (hats, ears, antlers) and a body (clothes over the figure, or a whole costume instead of it). The choice is kept in the optional field `costumes`, separately for every holiday, so it is not lost between holidays. A costume is visible only while its holiday is on (that is what the ⚙ holidays panel controls), the rest of the time the person looks as usual — both in the scene and in the family list preview. The look itself is not touched: 🎨 and all the appearance fields stay as they were, and in winter the costume's headwear simply takes the place of the hat. One person wears the costumes of one holiday at a time: if both holidays are on at once, Halloween wins. A body costume with `full: true` (the ghost sheet and the skeleton) replaces the whole figure, skin, hair and clothes included, and brings its own head if it needs one. Unknown ids, and ids of another holiday or of another slot, are dropped on load: the person is simply drawn without them.

- **Actions:** `shovel` clear the path (adults, winter), `chop` chop firewood (adults, not summer), `snowman` build a snowman (children, winter), `cones` collect pine cones (children, autumn), `berries` berries (everyone, summer and autumn), `fire` sit by the fire (everyone). A person does an action only if it is enabled both in ✋ and for him personally. If an action is turned off while he is busy with it, he drops it and chooses another (the bucket of pine cones returns to the porch) (`js/actions.js`).
- **Foreground lines:** people walk and stand not along one line but along four: y = 156, 158, 160, 162 (`LINES` in `js/people.js`). They coincide with the depth-layer edges, so the drawing order is correct by itself: the nearer covers the farther. The line is chosen at random, with the main line 160 having twice the weight. On 160 are tied the fire, the snowman, the shovel, chopping and the cones; the other activities (a walk, sitting under a tree, berries, games) happen on any line. A fidget with `follows` sits on the leader's line. Above line 159 by the fire (±20 px) and "inside" boulders nobody stands; straight across the fire above 159 is not walked, a detour via 160.
- In the morning they come out of the cabin one by one, in the evening they go to sleep, with a "z" over the roof.
- The fire burns from dusk (not before 15:00, not later than 20:30) as long as at least one adult is awake.
- **The window light** is on only if one of the awake people is inside the cabin (e.g. hiding from the rain). Sleepers and those outside don't turn on the light.
- **"Calm" behavior:** they walk, sit under trees, pick berries (summer and autumn), sit by the fire. There are six spots by the fire: two logs and two ground spots on each side of them; one spot — one person. A taken spot (someone stands there or is going there) is skipped; if there are no spots, the person does something else. The same rule for sitting under a tree and picking berries: sprites must not sit on top of each other.
- **Snowman (winter, children only):** a child builds a snowman to the left of the big boulder: rolls balls over the snow (big, medium, small), stacks them and dresses it: scarf, arms, hat. The whole job takes about 10 minutes. One child builds it from start to finish, others don't help. Building is possible while the snow is wet (from −5° to +4°). From +5° the snowman melts: first the decor falls off, then he settles into a mound that shrinks to zero; a settled one is replaced by the child with a new one. In winter the snowman's spot is taken, nobody sits there (`js/snowman.js`).
- **Clearing the path (winter, adults only):** the path from the cabin is snowed over in winter, snowfall covers it again, without snowfall it stays as it is. Any adult clears it with a shovel if nobody else is already clearing: goes from the door outward, about a minute. A clear path is drawn in bare-ground color, a snowed-over one in snow color, intermediate states as a checkerboard of pixels. After a restart the path is snowed over again (`js/path.js`).
- **Firewood (adults only, not in summer):** to the left of the cabin a woodshed, a bit in front a chopping block. The woodshed shows how much wood is in it: it grows when an adult brings an armful, and shrinks while the stove (except in summer) and the fire burn. An adult chops when there is room in the woodshed: puts a log on the block, swings, strikes, the halves fly apart; having collected an armful, he carries it to the woodshed, and sometimes puts it into the fire, and the flame flares up brighter. An armful takes about 20 seconds. One adult chops at a time. The woodshed and block spot is taken, nobody sits there (`js/wood.js`).
- **Cones (autumn, children only):** pine cones now and then fall from the pines and lie on the ground (they don't fall on boulders). There is one bucket: a child goes collecting only when enough pine cones have gathered on the ground for a full bucket (six), takes it from the porch, collects until full and carries it to the fire. There he stands in front of the flame, farther from those sitting, and throws the pine cones into the fire, sparks fly. If the fire is not lit, he carries the bucket of pine cones back to the porch, and in the evening takes it and throws the pine cones into the fire (`js/cones.js`).
- **"Fidget" behavior:** they run, jump, play; if `follows` is set — they stay close to that one: by the fire they sit on the free spot closest to him (no spots — next to him on the ground), pick berries together.

### Animals
Every species is an event of the registry (see "Random events"): at the "normal" level a hare and a squirrel appear about once in 15 minutes each (together once in 7.5 minutes, as with the former timer of 5–10 minutes). The rarer ones, also at "normal": a hedgehog about once an hour, a fox once in 1.5 hours, a moose once in 3 hours. They don't appear in a downpour. A species that is off doesn't appear, and one already on the scene disappears at once; if all are off, there are no animals.
- **Brown hare:** in the depth of the forest jumps from edge to edge, hides behind trunks. In the foreground he runs toward the family, about 2 m away he sits up like a post and dashes back.
- **Squirrel:** runs in hops to a foreground tree, climbs in jerks, sits under the crown, jumps in an arc to neighbouring trees (up to 3 times), descends head-first and runs away.
- **Hedgehog:** only by the cabin and only in the evening twilight: from half an hour before sunset to an hour and a half after it (the window follows the real sunset, so it moves with the seasons and the latitude); not in winter and not in late autumn. It comes in from the left edge, walks to and fro in front of the cabin (3–6 legs, stopping to sniff) and leaves the same way. Not afraid of people. A smooth teardrop body with a line of spines on top, 7×3, no legs.
- **Fox:** trots evenly through the far forest (the legs alternate, the body stays level). In winter it also hunts mice 1–2 times on the way: stops and listens, jumps, curls into an arc and dives nose-first into the snow (a puff of snow, the rump and tail stick out), then comes out step by step: the rump with the tail, the body, the head. In other seasons it only sometimes stops for a moment and looks around. The same red all year; in winter the white tip of the tail is a bit darker so it shows on snow. Leaves footprints in the snow.
- **Moose:** far away in the forest, walks slowly from edge to edge and stops once or twice for 3–6 seconds. Bulls (about two thirds) have antlers, except in late autumn (November) and winter. Brown, only the legs and the antlers are lighter. Leaves footprints in the snow.

### Birds
Every species is an event of the registry of its own. Only in the daytime and not in a downpour. The mean intervals at the "normal" level repeat the former timer of 5–10 minutes with chances 8% a flock of jackdaws / 46% small birds / 46% big ones: small birds together about once in 16 minutes (sparrow and tit about 41 minutes each in summer and 65 in winter, bullfinch about 82 in summer and 33 in winter: bullfinches come more often in winter), crow and magpie about 33 minutes each, jackdaws once in about 94 minutes. Any species can be switched off, made rarer or more frequent, and the others don't change.
- **Small** (sparrow, tit, bullfinch; bullfinches more often in winter): 1–3 at a time, fly in a wave, flit over 2–5 trees, sometimes land on the ground and peck.
- **Large** (crow, magpie): fly from edge to edge, flapping in 4 phases and gliding; in about half the cases they land on the top of a tree.
- **Jackdaws:** a flock of 8–12 birds; in 40% of cases they settle over 3–4 trees and take off all at once.

### Random events

Everything random (animals, birds, ghosts, shooting stars) goes through one registry and one scheduler (`js/events.js`). An event is described with one `defineEvent({...})` next to the code that draws it: id, group (animals, birds, holidays, sky), icon and name, the mean interval `gap` at the "normal" level (a number or a function of `E`), the condition `can(E)` ("may it happen now": no downpour, dark or light) and the action `run(E)`. Optionally: `on(E)` (the event is alive only while a holiday lasts), `first` (when it happens the first time), `spread` (the spread of the interval, by default 0.67 to 1.33 of the mean, i.e. 300–600 seconds for a mean of 450), `poisson` (a chance every frame instead of a timer, for events whose rate changes all the time: that is how meteors work), `fast` (the mean interval in the test mode).

Frequency levels: ❌ off, 🚶 rare, 🏃 normal, 🚴 often. The interval is multiplied by 2.5 / 1 / 0.1 (the multipliers are in one constant, `EV_MULT`). Every species of animals and birds and the ghosts have a level; meteors are still switched by the switch in the "Sky" panel. "Normal" repeats the behaviour from before the scheduler. If the timer ends while `can(E)` is false (for example, in daylight for the ghosts), the event is skipped and the next try comes after an ordinary interval. When a level changes, the timer of that event starts again. The levels are stored in `localStorage` (`forest.events.v1`, only what is not "normal") and are part of `settings.json`.

A new event is added with one entry of the registry (the skein of geese, the owl or the woodpecker from the ideas below); the panels of animals, birds and holidays are built from the lists `FAUNA` (`js/animals.js`) and `HOLIDAYS` (`js/holidays.js`).

### Holidays
Tied to the calendar, for testing: `?month=10&day=25` (`js/holidays.js`). There are two for now: Halloween (15–31 October, everything disappears on 1 November) and New Year (15 December – 14 January). The holiday and each of its decorations can be switched off in ⚙ (season row); a holiday that is off means neither decorations nor costumes. The costumes depend only on the holiday itself, not on the switches of the decorations. Decorations with their own switches (key `<holiday>.<decoration>`): skeleton, lantern, pumpkins, web, garlands (Halloween) and the tree, garlands (New Year); the ghosts are an event with levels. The scene is redrawn when a switch changes.
- **Pumpkins** appear in the forest one every two days (the first on the 15th, the ninth by the 31st). The spots are fixed, not by the cabin, the fire and boulders.
- **Jack-o'-lantern** stands to the right of the end of the path to the house. From dusk its eyes and mouth glow and flicker, the ground around is lit.
- **Garlands** (up to five) hang between neighbouring front-row trees. Bulbs 2×2 alternate orange and purple, dim by day, lit and flickering in the evening. The garlands are laid after the web and again every time a switch changes: while the web is on they share the space with it and go around it, and without the web they take all the free space.
- **The web** is one, round (8 spokes, 2 rings), between two trees nearer the middle of the scene, above heads, below the needles. Every 50 seconds a little spider descends on a thread, hangs, and climbs back up. Its place is found before the garlands; while the web is on they go around it.
- **Skeleton decoration** 7×13 stands in the bottom-left corner (facing the viewer). In the evening its eye sockets glow and flicker, like the jack-o'-lantern's. The foreground grass next to it is not drawn during the holiday (otherwise it covers its legs), then it grows back.
- **Ghosts** Pac-Man style (Blinky, Pinky, Inky, Clyde), 7×8, 25% transparent. An event of the registry: while Halloween lasts, at dusk and at night without a downpour, at the "normal" level one flies out every 1–3 minutes, sometimes a chain of 2–4. They float a little above the ground at the far-forest depth, hide behind nearby trunks, fly from edge to edge.

**New Year.** Runs from 15 December to 14 January, and also always while winter ⛄ is selected manually on the panel. Without a day `?month=1` gives the 15th, so for testing you also need `&day=`.
- **Garlands** red-and-green, up to five. They hang between trees of the front rows standing on the same or neighbouring lines, each with at least five bulbs. In the evening they light up and flicker. On a narrow window there are few trees, and only two or three garlands come out.
- **The Christmas tree** is a little taller than a tall adult, to the right of the fire, above the walking lines, next to the front-row trees and not on boulders. It has individual multicolored bulbs, a golden star on top, in winter snow on the tier tips. By day the bulbs are dim, in the evening they burn at full color and each flickers in its own way. People standing closer than the tree cover both it and its lights; the light doesn't fall on people (unlike the fire).

### Saving
- **Family:** stored in `localStorage` (key `forest.family.v1`) and in a file. The file is `forest-family.json`, an array of people. Loading a file **fully replaces** the family. There is no "default" family in the page code (the default person exists only in the Tauri part, see below): the wallpaper is not tied to someone's particular family, the family file is personal and is given to friends separately (or not).
- **Coordinates:** in `localStorage` (`forest.settings.v1`), separately from the family file, so they don't go to friends along with the file.
- **Snowman:** readiness, owner and save time in `localStorage` (`forest.snowman.v1`); after a restart he returns if it is still winter and less than 100 days have passed. Doesn't go into the family file.
- **Firewood:** the number of logs in the woodshed in `localStorage` (`forest.wood.v1`), doesn't go into the family file.
- **Puddles:** how wet the ground is, in `localStorage` (`forest.puddles.v1`), doesn't go into the family file; after a restart the ground has dried by the time the wallpaper was off. Not saved while time, weather or season are set by hand, or by `?month=` / `?day=`.
- **Snow cover:** how much snow lies, in `localStorage` (`forest.snowcover.v1`), doesn't go into the family file. After a restart November snow returns, April and October snow only if the wallpaper was off for less than 5 days. Not saved when the time is set by `?month=` or `?day=`.
- **Game settings** (`js/gsettings.js`): the file `settings.json`, not connected to the family and not going with it. Everything chosen on the scene panels. Fields missing from the file stay as they are; unknown ids in lists are skipped; an error in any field cancels the application entirely.
  ```json
  { "location": { "lat": 61.07, "lon": 28.28 }, "time": "now", "weather": "now", "season": "now",
    "holidays": "all", "actions": "all", "sky": "all",
    "animals": { "species": "all" }, "birds": { "species": "all" } }
  ```
  `time`: `"now"` or a number of hours (21.5). `weather`: `"now"`, forecast `"+1"`, `"+2"`, `"+3"` or `clear`, `storm`, `rain`, `snow`, `fog`. `season`: `"now"`, `winter`, `spring`, `summer`, `autumn`. `actions`, `sky`: `"all"` (everything the game has, new ones turn on by themselves) or a list of enabled ids. `holidays`: `"all"` or an object per holiday `{ "halloween": ..., "newyear": ... }`, where the value is `"all"` (the holiday and all decorations), `"off"` (no holiday; the choice of decorations is kept) or an object of decorations `{ "pumpkins": true, "web": false, "ghosts": "often" }` (missing ones stay as they are; the ghosts take a level instead of true/false); a holiday missing from the object stays as it is. Decoration ids: Halloween — `skeleton`, `lantern`, `pumpkins`, `web`, `garlands`, `ghosts`; New Year — `tree`, `garlands`. `species`: `"all"` (all at "normal") or an object `{ "hare": "often", "sq": "off" }` with the levels `off`, `rare`, `normal`, `often` (missing ones stay as they are); ids: `hare`, `sq`, `hedgehog`, `fox`, `moose`, `sparrow`, `tit`, `bullfinch`, `crow`, `magpie`, `jackdaw`. `sky` ids: `puddles`, `rainbow`, `aurora`, `meteors` and the showers `quadrantids`, `lyrids`, `etaaquariids`, `perseids`, `orionids`, `leonids`, `geminids`. The current state, including manual time, weather and season, is remembered in `localStorage` (`forest.gs.v1`) and restored after a restart (🔄 returns "as it really is"). The family and world state (snowman, firewood) are not included in the settings.
- **Switches ✋ and ⚙:** `localStorage` (`forest.actions.v1`, `forest.events.v1` (levels of animals, birds and ghosts), `forest.holidays.v1` (holidays and decorations), `forest.sky.v1`), don't go into the family file, but are included in the game settings (`settings.json`). A character's personal actions — the `actions` field in the family file.
- On loading and at startup colors are snapped to the nearest palette colors.
- **First launch in Tauri (settings):** the same for game settings: if there is no `forest.gs.v1` record at all, the page asks for the `read_settings_file` command, which reads `settings.json` next to the exe (no file — it returns a sample embedded from `src-tauri/src/settings_default.json`).
- **First launch in Tauri (family):** if there is no family record in `localStorage` at all, the page asks Tauri for the `read_family_file` command: it reads `family.json` next to the exe (no file — it returns the default person embedded in the exe from `src-tauri/src/family_default.json`), and the family is applied. After that it lives in `localStorage`: manual edits to the file will only be picked up after clearing the webview data or loading via 💾. An empty family left by the person themselves (the record `[]`) is not overwritten by the file (`js/main.js`). In a regular browser there is no command, and the family is empty by default.

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
| `js/costumes.js` | holiday costumes: the `COSTUMES` set (a head and a body per holiday), the person's choice, the sprite-cache key |
| `js/util.js`, `js/palette.js` | utilities and season palettes |
| `js/time.js`, `js/weather.js` | clock, seasons, sunrise and sunset; weather, forecast and wind direction |
| `js/snowcover.js` | snow on the ground by the weather: how much lies, melting, saving |
| `js/puddles.js` | puddles: places, filling by rain and drying, reflection of the sky, rings from drops |
| `js/rainbow.js` | the rainbow after rain: when it appears, fades in and out, drawing |
| `js/moon.js` | the Moon: phase, rise and set, drawing of the disc; the arc of the Sun and the Moon across the sky |
| `js/stars.js` | stars (real places by time, date and location), shooting stars and meteor showers, the switches of the "Sky and nature" panel |
| `js/layout.js`, `js/render.js` | scene layout and rendering |
| `js/sprites.js` | animal and bird sprites |
| `js/events.js` | the registry of random events and the single scheduler: frequency levels (off / rare / normal / often), timers |
| `js/people.js`, `js/animals.js`, `js/particles.js` | people's, animals' and birds' behavior, particles |
| `js/snowman.js` | the snowman: rolling balls, melting, saving |
| `js/path.js` | the winter path from the cabin: snow on it, clearing with a shovel |
| `js/wood.js`, `js/cones.js` | firewood (woodshed, chopping block, chopping) and cones (falling, collecting, bucket) |
| `js/tracks.js` | short footprints in the snow |
| `js/holidays.js` | holidays: Halloween (pumpkins, jack-o'-lantern, garlands, web with a spider, skeleton, ghosts) and New Year (garlands, Christmas tree) |
| `js/storage.js`, `js/ui.js` | family saving; the scene panel and the wallpaper close button |
| `js/ui_family.js`, `js/ui_editor.js`, `js/look_editor.js`, `js/ui_palette.js`, `js/ui_costumes.js`, `js/ui_file.js`, `js/ui_actions.js`, `js/ui_fauna.js`, `js/ui_holidays.js`, `js/ui_sky.js` | family list and side panels (including 🎭, ✋ and ⚙) |
| `js/gsettings.js`, `js/ui_gsettings.js` | game settings: collecting and applying, remembering, reading `settings.json`; the 💾 panel |
| `js/main.js` | startup; family at start (localStorage, otherwise `family.json` next to the exe) |
| `src-tauri/src/lib.rs`, `family_default.json`, `settings_default.json`, `tauri.conf.json` | the Tauri shell: a window under all windows, creating `family.json` and `settings.json` next to the exe, the `read_family_file`, `read_settings_file` and `quit_app` commands |
| `sprite-lab.html`, `costumes.html`, `animal-lab.html` | the sprite showcase, the costume showcase and the animal lab (frames of animals and birds as text for `js/sprites.js`) |


### Rendering
- **Internal resolution:** height 180 px, width proportional to the screen. The canvas is stretched to the whole screen with `image-rendering: pixelated`.
- **20 frames per second**, paused when `document.hidden`.
- **The winter path** from the cabin is not included in the ground cache: the snow on it changes, so it is drawn every frame as a layer-0 object (before everything else). The puddles are drawn the same way, since their size changes.
- **Snow arriving and leaving.** While snow lies only partly (`E.snowQ`, the white share in 32 steps, is part of the cache key), the ground is built twice, bare and snowy, and the two pictures are mixed through a fixed map of soft spots (`buildGround` in `js/render.js`): the ground, and a little the trees, boulders and bushes, turn white in spots that grow and merge. In the scene the season becomes `winter` when more than half is white.
- **Caches** are rebuilt every 30 game seconds or when the season, cloud cover, size or the holiday switches change: the sky (`ImageData` with dithering) and the ground (**13 depth layers**, edges in `LAYER_EDGES`: an object goes into a layer by its base `y`). The edges are denser where people walk: 156, 159 (fire boundary), 161. The people line y=160 lies in the layer [159, 161).
- **Drawing order.** For each layer: the layer's picture from the cache, then the footprints in the snow, then the dynamic objects of that layer, sorted by `y` (by `x` when equal). The dynamic objects are collected by `sceneItems()`: people, animals and ground birds, the snowman and ball, firewood and the woodshed, pine cones and bucket, jack-o'-lantern, spider, winter path. Each has a base `y`, the layer is computed from it. Exceptions with a flag: `over` (over the segment: birds in the air and on trees, smoke) and `l` (explicit layer, for the path).
- **Segments and glowing objects.** The scene is drawn onto several segment canvases, the boundaries between them set by the `BREAKS` list (boundary `y` and a draw function). Each segment is dimmed at night separately, and between the segments a glowing object is drawn that must not be dimmed. There are two boundaries for now: the New Year tree lights at y=154 and the fire at y=159 (flame and sparks). Whatever is deeper is behind the flame, whatever is at y=159 and closer covers it. Foreground grass, rain, snow and leaves in the air are drawn at the end of the last segment. A new boundary = a new entry in `BREAKS`.
- **Lighting:** each of the canvases is dimmed separately, night dimming and the warm dusk tint are applied via `source-atop`; light sources (fire, window, fireflies, sparks) are drawn after the dimming via `lighter`.
- **Deterministic layout:** the `mulberry32` generator with fixed seeds, the forest is the same on every launch and for the same scene width (`W`, from the window proportions). A different window or monitor gives a different forest.
- **Statics and dynamics.** Trees, bushes, all boulders, pumpkins, the cabin, the chopping block are baked into the layers once, the rest is drawn every frame (the list above). Within one layer the statics are always below the dynamics; the layer strip is 2 px (more precisely in the 156–161 zone).

### People's sprites (layers)
- Each age has its own body template: **adult** 8×14, **child** 6×8. Height (`height`) −1, 0, +1 is duplicating or removing one torso row. The exception is **child +1**: this is a separately drawn sprite (the `KID_TALL` layer set, the `kidTall` template, 8×12): head like an adult, torso two rows shorter than an adult. It has only one height, the ±1 adjustment is not applied; when sitting it keeps shoulders and arms.
- Height in rows: child −1 / 0 / +1 — 7 / 8 / 12, adult — 13 / 14 / 15. Child −1 is a child with a one-row torso.
- The template and layer set are chosen by `composeSprite` (the `AGE_SET` and `SETS` tables).
- Layers are stacked in order: skin → hair → top → bottom → sleeves → shoes → hat. A letter = a character palette color (`H` hair, `S` skin, `E` eye, `T` top, `D` dress, `L` bottom, `B` shoes, `C`/`c`/`w` hat).
- The walking and sitting frames are assembled from the same layers: only the bottom rows ("legs") change. The head doesn't move.
- The hat hides the hair under it. For a hairless head, the plain hat and the pompom hat have their own drawing: the fit at the forehead is the same, but at the back the hat sticks out 1 px instead of 2. The Finnish hat has no separate drawing, it looks the same on any head.
- `composeSprite` returns `{ idle, walkA, walkB, sit }` — arrays of strings. The results are cached by look and season.
- The palettes are limited: skin 6 colors, hair 10, clothes and hats 12, shoes 6. The builder chooses only from them.
- **A costume is drawn as extra layers over the finished frames** (`js/costumes.js`): `head` — `ex` rows added above the head and `clip` rows where the hair is hidden, `body` — rows over the whole figure (adult 8×14, small child 6×8, tall child 8×12, where `tall` is missing it is made from the adult by removing torso rows 8 and 9), plus `A`/`B` rows for the walking frames and `S` for the sitting one. `.` keeps what is under it, `-` erases it. Costumes have their own letters and colours and must not use the person's `H S E T D L B C c w`; the header of `costumes.js` has the rest of the rules.

### Behavior
- **Characters** — a simple state machine: `walk` (along a route of points), `idle`, `sit`, `pick`, `play`, `build` (rolls balls and dresses the snowman), `shovel` (clears the path), hidden in the cabin. `choose()` picks the next activity with weights depending on time, season, weather and `temper`. The route is built by `buildPath` (points with a line `y`), a free spot is checked by `spotFree` by `x` and the line (people on neighbouring lines must not stand on top of each other).
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
| Hedgehog | 7 × 3 |
| Fox (trot) | 13 × 6 |
| Moose | 15 × 12, the antlers are the two top rows |
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
- **Woodpecker** pecks the trunk, chips fly.
- **Owl** on a pine at night: hoots, turns its head.
- **A skein of geese in spring and autumn:** 5–9 birds in a V once every few days — the size of crows, so the "V" reads. In October they pass here in thousands.

### 5.2. Interaction
- **Clicks:** on a tree — a bird flutters up, on a family member — he waves his hand.
- **Feeder:** tits and bullfinches come more often.

### 5.3. Family life
- **A birthday:** a date in the person's card; once a year — flags, a cake on the porch and the whole family by the fire (free spots are already searched for with `freeSeat`).
- **Heat:** at +25° and above the fire is not lit (except for the grill), and people sit in the shade under the trees — that mode already exists; the temperature is already known from `wx.temp`.
- **The "grill" activity:** in warm weather without rain an adult grills meat on a grate over the fire pit: smoke, sparks, and the others come over. A new entry in `ACTIONS`, switched on and off like the other actions.
- **A mailbox:** a box by the path; on Wednesdays mail appears in it (the flag is up), and on that same Wednesday one of the adults goes for it and reads it by the porch. The weekday comes from the same clock as everything else.
- **A vegetable patch by the cabin** — a bed 10–14 px: sprouts in spring, greens in summer, empty in autumn; only as a switchable activity (in ✋), so that someone who does not want it has none.
- **Firewood as a real resource:** while the woodshed is empty the stove is not heated (no smoke) and the fire is not lit, and the adults go chopping. The consumption and the chopping already exist (`js/wood.js`), only this link is missing.

### 5.4. Toward a game
- Point-and-click: a click sends a character to a point, the cabin interior as a separate scene, items (mushrooms, berries, pine cones, firewood), small quests from what already happens.
- First decide what kind of game this is: a cozy sandbox, a game for a child, or a story with an adventure.
- **The inside of the cabin** — the stove, the table, the beds, as a separate scene: one day, separately from the "toward a game" line.

### 5.5. Decided not to do
- **People walking between the front trees:** four lines below the trunks are enough (tree bases up to y≈152).
- **Sleds with a hill:** the hill takes up space, and it is unclear where to put it.
- **A hammock between pines:** lying sprites are needed, not suitable yet.
- **Long footprints in the snow** that snowfall covers over: only short fading ones are kept.
- **Bats** for Halloween: they are not seen here at this time of year.
- **Shades of the snow cover** (in-between states, dirty snow): the snow is only white.
- **A pet in the family** (a cat or a dog): a child who sees a pet on the screen will start asking for a real animal.
- **A second set of winter clothes:** it is indistinguishable at this scale; the colour of the top and the bottom is enough, and the hat is shown in winter anyway.
- **Drips and icicles on the roof:** at this scale they are one or two dots and do not read.
- **Butterflies and dragonflies:** they are noticeably smaller than even the small birds, and those are barely visible already.
- **Crowns swaying in the wind:** the crowns are baked into the layer cache, and the movement would hardly be noticed anyway.
- **Kupala (Ivan Kupala):** wreaths and fern are not part of this place, the white night is bright as it is, and the fire is already there.
- **Easter with an egg hunt:** coloured eggs on the ground are indistinguishable from the pixels of spring flowers.
- **"Talking" in speech bubbles:** people talk little around here; silence suits the scene better.
- **Emotions and poses:** only the eyes are visible on the face, and poses do not read in pixels.
- **Children playing together** (snowballs, tag): complicated, and there is usually one child in the family.
- **A name plate on hover:** the window sits under all the others, and the mouse is almost never over the people.
- **Exporting a frame as PNG:** not needed.
- **Hotkeys:** the wallpaper is almost never focused, other windows take the keystrokes.
- **Fireworks at New Year midnight:** everyone watches the real ones that night.
- **A lake in the distance:** given up at the very start.
- **A bathhouse as a second building:** not needed.
- **Sound** (wind, birds, the crackle of the fire): the wallpaper runs while people work and call, so no sound.
- **Mist out of the weather** (morning mist in the hollow): mist only as weather, no separate dawn mist.
- **Birds taking off from a person:** the birds here are cheeky and sometimes ignore a person.
- **A squirrel dropping a cone:** no need — cones fall on their own.
- **Seasonal bird species** (swallows in summer and the like): swallows are indistinguishable in pixels, and bullfinches are here all year round — the species already drawn are enough.
- **Constellation lines:** stars only in their real places, with no connecting lines.
- **Walking out onto the porch** to watch a sunset, the aurora or the first snow: in the rain the sky is not visible, and when they sleep they will not come out; there is no reason for them to go out.
- **A face in the window:** definitely no.
- **A wandering guest:** definitely no.

---

## 6. Known conventions and limitations
- Statics and dynamics in one depth layer are not sorted among themselves: the statics lie under the dynamics. An error is possible only if the bases differ by less than the layer width.
- A bird on a branch is drawn over the foliage, even if another tree's crown is in front of it, otherwise small birds are not visible.
- Squirrels climb only foreground trees.
- The moose and the fox walk in the far forest (nearer trunks cover them), the hedgehog in front of the cabin, behind the chopping block; none of them avoids people or other animals.
- Animals and characters don't go around each other on the move. The exception is spots where a person stays for a long time (sitting, picking berries): they are taken only by free ones, checked by `x` and the line.
- The time zone is taken from the computer; the coordinates in the settings must match it, otherwise sunrise and sunset shift.
- Child +1 is drawn separately and exists only at standard height. The remaining height ±1 is duplicating or removing a torso row; on a small body it is noticeable (child −1 has a torso of only one row).
- For the southern hemisphere the seasons shift, but berries and mushrooms are tied to the "northern" months.
- The paths of the Sun and the Moon are a scheme: the Moon's declination ignores the tilt of its orbit (about 5°), the screen position is not the real azimuth, and the Sun's height is scaled to the picture (`SKY_ALT_K` in `js/moon.js`).
- Stars and the radiants of the showers are a scheme like the Sun's and the Moon's path: the height uses the same `SKY_ALT_K`, the width is stretched less at a height, what is near the zenith or behind the frame is not shown, precession is ignored, and in the southern hemisphere the sky is a mirror image (so that time still flows left to right). Meteor rates are not real.
