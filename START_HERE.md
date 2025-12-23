<!-- Quick orientation for Beyond Bell: the game, setup, and troubleshooting -->

# START HERE

## What this project is
- Single-page HTML5 canvas game (`index.html` + `game.js`) with RPG/progression, multiple modes (Ensemble, Individual, Bell pairs), bosses, crafting, survival systems, and audio/voice.
- Runs locally in a browser; optional Node/Express leaderboard server under `server/`.

## How to run
- Fastest: open `index.html` in a modern Chromium-based browser (hardware acceleration on). `index-dev.html` is a heavier debug variant.
- Local static host (optional): run `start_server.bat` or `start_server.ps1`, or use any static server (e.g., `npx serve .`).
- Offline package: `beyond-bell-offline.zip` contains prebuilt playable files (game + dev) for in-browser download fallback.
- Service worker: `sw.js` caches assets after first load when hosted; not used under `file://`.

## Leaderboard (optional)
- Client uses `window.API_URL` from `config.js` (empty = offline/localStorage only).
- To enable:
  1) `cd server && npm install`
  2) `npm start` (or `npm run dev` with nodemon)
  3) Set `window.API_URL` in `config.js`, e.g., `http://localhost:3000/api`
- Endpoints: `GET /api/leaderboard`, `POST /api/leaderboard`, `GET /api/leaderboard/top`, `GET /api/health`
- Data is stored in `server/leaderboard.json` (file-based, no DB).

## Controls (player-facing)
- Move: WASD / arrows. Shoot: hold mouse. Pause: Space. Reset: R.
- Modes: keys `1` (Ensemble QM), `2` (Individual System), `3` (Bell Pairs).
- UI panels: crafting/inventory/shop/level-up via on-screen buttons; click canvas to create systems (tutorial states).

## Key files
- `index.html`, `index-dev.html`: HTML shells and UI styling.
- `game.js`: Monolithic game logic (state, systems, rendering, audio hooks, progression). Includes adaptive quality tiers for bullets to reduce lag.
- `config.js`: API endpoint config (leave empty for offline).
- `sw.js`: Service worker for hosted/offline caching.
- `download.js`, `convert_audio.js`, `convert_audio.md`, audio guides: tooling for audio/offline packaging.
- `server/`: Optional leaderboard API (Express).
- Assets: `music/` (main_theme, galactic_rap); other audio may be generated or loaded via paths defined in `game.js`.

## Performance notes
- Rendering safeguards: `game.js` now auto-downgrades bullet visuals (quality lock tiers) on high bullet counts or fire-rate bursts, disabling gradients/shadows/particles in minimal/low modes.
- If you see lag at low levels, ensure hardware acceleration is on; spreads can temporarily trigger low/minimal mode for ~20 frames to avoid stalls.

## Troubleshooting checklist
- Lag spikes: verify browser GPU acceleration; confirm `config.js` is empty if no server is running; try hosted (not `file://`) to allow service worker caching; consider lowering OS/browser animations.
- Audio missing: ensure `music/` and `sfx/` assets exist; see audio guides; HTML5 audio requires user interaction to start.
- Leaderboard not saving: check `API_URL`, that `server/` is running, and CORS if hosted.

## Contributing workflow
- No build step required. Edit `game.js` and reload. Keep changes ASCII.
- Prefer profiling before visual feature additions; follow the new quality-tier patterns for any rendering-heavy features.



