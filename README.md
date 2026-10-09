# Cube Timer

A simple, fast speedcubing timer for **2x2 to 7x7, Pyraminx, Skewb, Megaminx, Square-1, Clock and FTO**. No build step, no backend, no account. Everything is stored in your browser and the app works offline once loaded.

## Features
- Algorithmic scrambles (2x2, 3x3, 4x4 with wide moves), kept separate from the UI
- `performance.now()` timing, not a `setInterval` counter
- Optional WCA inspection (+2 after 15 s, DNF after 17 s), adjustable length
- Penalties (+2 / DNF), Ao5 / Ao12 / Ao50 / Ao100 with WCA-style trimming
- Personal records and statistics tracked separately per cube
- Multiple sessions per cube, time-trend graph, light/dark theme
- Keyboard and touch controls, installable as a PWA

## Controls
| Input | Action |
|---|---|
| Hold `Space` until green, release | Start |
| `Space` / tap while running | Stop |
| `N` | New scramble |
| `Esc` | Cancel / reset timer |
| `Delete` | Delete latest solve |

With inspection on: tap Space (or the timer) to start the countdown, then hold and release to start the solve. On touch devices, touch and hold the timer.

## Run locally
Open `index.html`, or serve the folder (needed for the service worker):

```
python3 -m http.server 8000
```

## Deploy to GitHub Pages
1. Push these files to a GitHub repository.
2. Settings > Pages > Build and deployment > deploy from branch `main`, folder `/ (root)`.
3. Your site appears at `https://<user>.github.io/<repo>/`.

When you deploy changes, bump `VERSION` in `sw.js` so returning visitors receive the new files.

## Project structure
```
index.html          page markup
style.css           styles
scrambler.js        scramble engine + cube registry (add new puzzles here)
stats.js            formatting, averages, statistics
storage.js          localStorage, sessions, settings, PB tracking
timer.js            timer + inspection state machine
ui.js               rendering and dialogs
events.js           keyboard / pointer wiring and startup
pwa.js, sw.js       offline support
run-tests.js        unit tests (scrambles, averages), run with Node
```

## Tests
```
node run-tests.js
```

## Notes
Scrambles are valid random-move scrambles, not WCA random-state scrambles (which need a solver). Personal records are kept even if you later delete the solves that set them.

## License
MIT
