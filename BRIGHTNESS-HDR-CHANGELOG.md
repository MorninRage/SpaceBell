# Brightness / HDR Investigation – Changelog & Current State

**Project:** `C:\Backup Bell\bell-game`  
**Last updated:** 2025-02-02

---

## 1. Problem summary

- **Symptom:** Brightness/dimming in **fullscreen** only; less frequent in dev mode; does **not** occur in `C:\bell-game\bell-game`.
- **User settings:** HDR stabilizer and auto are **always off** in-game. Turning off **system HDR** on the computer makes the issue disappear.
- **Conclusion so far:** The issue is likely **not** our HDR compensation logic itself but something else (a context-state leak or a **varying factor** like draw count) that gets **amplified** when the display is in HDR mode.

---

## 2. Current state of the codebase

### 2.1 HDR path (unchanged for this doc)

- **`isHdrPostProcessActive()`**  
  Returns true only when `_hdrComp.usePostProcess && (_hdrComp.enabled || _hdrComp.auto)`.  
  With stabilizer and auto **off**, this is **false** → we draw directly to the main canvas (no offscreen HDR buffer).
- **`updateHdrCompensation()` / `updateHdrFilter()`**  
  When `enabled` and `auto` are false, `currentFactor` stays 1.0 and no brightness filter is applied.
- **`applyHdrPostProcess(screenCtx)`**  
  Only runs when the HDR post-process is active; with both off it is not used.

### 2.2 Draw pipeline (relevant parts)

- **`draw()` in game.js**
  - Resets ctx at **start** (setTransform, globalAlpha, composite, **filter**, shadowBlur).
  - Optional redirect to `_hdrRenderCtx` when HDR post-process is active (not used when both off).
  - Clear with `fillRect(0,0,clearW,clearH)` then **second ctx reset** (alpha, composite, filter, shadowBlur).
  - Background → game objects (targets/pairs, obstacles, items, bullets, explosions, particles, player, HUD, etc.) → screen-shake restore → **ctx reset before overlays** → ensemble overlay (if applicable) → hit-flash → **final ctx reset** → `updateHdrCompensation()` → `finishHdrFrame()`.

---

## 3. Fixes applied (this session)

### 3.1 Context reset at start of `draw()`

- **Change:** Added `this.ctx.filter = 'none'` to the initial “CRITICAL” reset block at the top of `draw()`.
- **Reason:** Ensures no prior frame or code path leaves a brightness/filter on the main context that could affect the whole frame or interact badly with HDR compositing.

### 3.2 Context reset after clear

- **Change:** Right after `this.ctx.fillRect(0, 0, clearW, clearH)`, added an explicit reset:
  - `globalAlpha = 1`
  - `globalCompositeOperation = 'source-over'`
  - `filter = 'none'`
  - `shadowBlur = 0`
- **Reason:** Guarantees background and all later draws see a clean state, even if the clear/fill path ever has side effects.

### 3.3 `drawParticles()` – guaranteed restore

- **Change:** Per-particle block is now:
  - `this.ctx.save()`
  - `try { ... draw particle ... } catch (error) { console.error(...) } finally { this.ctx.restore() }`
- **Reason:** If drawing a particle throws, we no longer leave the context with a leaked `save()` (e.g. globalAlpha, shadow, transform), which could dim or distort the rest of the frame and be amplified on HDR.

### 3.4 Draw-count diagnostic (debug overlay)

- **Change:** When **Dev mode** and **Show Debug** are on, the debug overlay now includes a line:
  - **`Particles: N  Explosions: M`**
- **Location:** In `drawDebugInfo()`, added to the `debugInfo` array (same block as Level, Score, FPS, Entities, etc.).
- **Reason:** To test whether brightness drops correlate with **varying draw count** (e.g. P and M going to 0 or very low). If they do, the cause is likely variable luminance from draw count being amplified by system HDR rather than a single leaking draw.

---

## 4. File and symbol reference

| Item | File | Notes |
|------|------|------|
| `draw()` | game.js | Start-of-frame and post-clear ctx resets; full draw order |
| `drawParticles()` | game.js | save/try/catch/finally with restore in `finally` |
| `drawDebugInfo()` | game.js | New line: `Particles: ${...} Explosions: ${...}` |
| HDR helpers | game.js | `isHdrPostProcessActive`, `applyHdrPostProcess`, `updateHdrCompensation`, `updateHdrFilter` |

---

## 5. How to use the doc / next steps

- **Reproduce with diagnostic:** Fullscreen, system HDR on, in-game HDR stabilizer/auto off. Enable Dev mode and Show Debug. Watch **Particles** and **Explosions** when dimming happens.
- **If dimming correlates with P/M → 0 (or big drops):** Suggests variable draw count is the varying factor; consider capping or stabilizing particle/explosion draw count or adding a constant faint full-screen baseline (only if needed).
- **If no correlation:** Add more diagnostics (e.g. which background mode, which draw section ran) or bisect by disabling one draw path at a time (e.g. ensemble overlay, one background style) and re-test.

---

## 6. Previous attempts (for history; not current code)

- Separate fullscreen vs windowed HDR target luma: reverted.
- Aligning layout with working project (canvas/container CSS): done for layout; brightness issue persisted.
- Defensive ctx resets before overlays and at end of `draw()`: already in place; kept.
- Using `this.time` instead of `levelTimeElapsed` for background phase: reverted.

---

*This doc reflects the current state and fixes as of the last edit. When you change code or confirm new findings, update this file so it stays the single source of truth.*
