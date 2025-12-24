# ARCHITECTURE

## Overview
- Single-page HTML5/Canvas game driven by `game.js`; no build tooling.
- Game loop: `gameLoop()` (in `game.js`) runs `update(deltaTime)` then `draw()` via `requestAnimationFrame`.
- Rendering and systems are centralized in one Game class plus helper managers (e.g., `AudioManager` at file top).
- Optional leaderboard backend: simple Express server in `server/` storing scores in a JSON file.

## Frontend structure
- **HTML shells**: `index.html` (production) and `index-dev.html` (heavier debug UI/styling). Both mount a full-screen canvas and layered UI panels (mode buttons, stats, instructions, theory panel, crafting/shop/inventory, cutscenes, leaderboard UI).
- **Entry/config**: `config.js` defines `window.API_URL` (empty = offline/localStorage). `sw.js` handles offline caching when hosted (not under `file://`).
- **Assets**: `music/` (main_theme.ogg, galactic_rap.ogg). SFX/voice paths are defined in `game.js`; missing files fall back gracefully.
- **Offline bundle**: `beyond-bell-offline.zip` is a prebuilt archive used by `download.js` as a preferred downloadable package; falls back to in-browser zip if missing.

## Core runtime (`game.js`)
- **AudioManager**: HTML5 Audio (file:// compatible), volume channels, sound throttling, music crossfade, missing-file cache.
- **Game state & systems**: player stats/progression, weapons/upgrades, crafting, survival (food/materials), bosses, obstacles, particles, UI caching/batching, save/load, dev tools.
- **Loop control**: `gameLoop()` with optional FPS cap; pause/cutscene handling; resume smoothing to avoid delta spikes.
- **Rendering pipeline**:
  - Uses the main canvas 2D context for everything (backgrounds, player, bullets, particles, UI overlays).
  - Preload overlay blocks start until pre-shaded assets are ready (bullets pre-rendered; enhanced materials stay until higher item-count thresholds: medium 100, low 160, minimal 220).
  - Bullet rendering includes culling margins and now quality tiers with short-lived locks:
    - `minimal`: solid circles only, no shadows/particles/gradients.
    - `low`: solid fill + simple trail line, no gradients/shadows.
    - `medium`: reduced effects; gradients but fewer/shadowless elements.
    - `high/ultra`: full effects.
  - Burst triggers: high bullet count or fire-rate/weapon stacks push into low/minimal for ~20 frames before reconsidering. Particles fully disable in reduced tiers.
  - Backgrounds/boss scenes use simplified gradients and reduced counts relative to earlier versions but still run per-frame.
- **Performance safeguards** (already in code):
  - Off-screen culling for bullets.
  - DOM query caching and UI update batching.
  - Object pools for bullets/particles; distance checks use squared math in hot paths.
  - FPS history informs adaptive quality, but burst locks handle sudden spikes.

## Backend (`server/`)
- **Tech**: Node.js + Express + CORS + body-parser; file-based storage `leaderboard.json`.
- **Endpoints**: `GET /api/leaderboard` (top 10), `POST /api/leaderboard` (add/update, keeps top 50), `GET /api/leaderboard/top`, `GET /api/health`.
- **Usage**: `npm install`, `npm start` (port 3000 default). Configure client via `config.js` (`window.API_URL`).
- **Deployment**: Procfile/Railway templates included; no database required. For production, tighten CORS and consider persistent storage beyond JSON.

## Data & persistence
- Client saves to localStorage when `API_URL` is empty; leaderboard uses the server when configured.
- Audio assets load from relative paths; missing files are cached in a failed-set to avoid repeated fetch attempts.

## Extending safely
- Rendering: follow quality-tier gates; avoid per-bullet gradient creation in hot paths. Prefer cached colors/gradients or tiered fallbacks.
- Systems: keep UI updates batched and reuse cached DOM references already present in `game.js`.
- Backend: if migrating to DB, mirror the shape of entries `{ name, score, level, date }` and keep sorting rules (score desc, then level).

## Notable scripts/tools
- `start_server.bat` / `start_server.ps1`: basic static hosting helpers.
- `download.js`: offline build/download logic; prefers the prebuilt zip.
- `convert_audio.js` + docs: audio conversion pipeline guidance.

## Known performance sensitivities
- Bullet gradients/shadows/particles are the primary render cost; mitigated via quality tiers and culling.
- Background gradient creation still happens per-frame in boss scenes; keep counts low when adding effects.
- Ensure browser GPU acceleration is enabled; service worker caching reduces network overhead when hosted.
- Early-level pacing: levels 1-15 spawn particles faster and molecules slower with a 10-obstacle cap to keep the opening minutes smooth while still feeding materials.
- Resource drops now have caps and rendering tiers to prevent late-game overload:
  - `getResourceDropCap()` limits drop counts by level and on-screen headroom; multipliers are clamped.
  - `getResourceRenderQuality()` downgrades item visuals (solid circles only in low/minimal modes) and skips auto-collector effects when many items are present. Current thresholds: medium 100, low 160, minimal 220 items (counts or high levels).
  - Off-screen items are culled from rendering to save CPU/GPU when drop counts spike.



