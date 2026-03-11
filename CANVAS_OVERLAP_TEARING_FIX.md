# Canvas Overlap, Screen Tearing, and Instability Fix

**Date**: 2025-01-30  
**Issue**: Canvases overlapping, visible "other canvases" at edges (especially Mode 3/Bell), screen tearing, and game becoming unstable/crashing. Affects all modes.

---

## Root Causes Identified

### 1. Context State Leakage (globalAlpha, shadowBlur)
When the ensemble background cache path threw an exception (e.g., during drawImage or geometry interpolation), `globalAlpha` and `shadowBlur` could remain set. Subsequent draws (bullets, particles, UI) would inherit wrong alpha/glow, causing:
- Overlapping/bleeding visuals
- Perceived "other canvases" at edges
- Screen tearing from partial transparency

### 2. Canvas Dimension Mismatch
Using `_ensembleClassicBgCacheSize` (bw, bh) for drawImage source dimensions without validating that cached frame canvases actually matched. If cache was built at different resolution or frames had inconsistent dimensions, drawImage could produce visual artifacts or visible boundaries.

### 3. Particle Draw Context Leak
The particle draw loop used try/catch with restore in catch. If an error occurred after an inner `ctx.save()` (e.g., in the fire particle branch) but before its `ctx.restore()`, the restore in catch would only pop one level. The outer save would leak, causing accumulated context state corruption over many frames → instability and visual glitches.

### 4. Cutscene Canvas Visibility
In edge cases (race conditions, missed code paths), the cutscene overlay/canvas could remain visible during gameplay. With z-index 20000, it would overlay the game canvas and create the perception of "other canvases" or overlapping layers.

### 5. Missing Cache Validation
Using cache frames without validating that `lineEndpoints`, `particleData`, and canvas references were present and valid. Incomplete or corrupted cache entries could cause drawImage with invalid sources.

---

## Fixes Applied

### 1. Ensemble Background – Context State Reset
- **try/finally** around the blend path to always reset `globalAlpha` even when exceptions occur
- In **catch** block: explicitly reset `globalAlpha = 1` and `shadowBlur = 0` before fallback draw
- Use actual frame canvas dimensions (fw, fh) for drawImage to prevent dimension mismatch artifacts

### 2. Ensemble Background – Cache Validation
- Pre-validate f1, f2 before entering cache path: require `f1?.canvas`, `f2?.canvas`, `lineEndpoints`, `particleData`, and `bw > 0`, `bh > 0`
- Fall back to `drawEnsembleClassicFrameAtPhase` if validation fails

### 3. Particle Draw – Save/Restore Safety
- Wrapped particle draw body in **try/finally** so `ctx.restore()` always runs for the outer save
- Wrapped fire particle branch `save`/`drawImage`/`restore` in **try/finally** so inner restore always runs even if drawImage throws

### 4. Defensive Cutscene Hide
- At start of main draw path (when drawing gameplay, not cutscene): explicitly set `cutsceneOverlay.style.display = 'none'` and `cutsceneCanvas.style.display = 'none'` if they are not already hidden
- Prevents any race where cutscene elements remain visible during gameplay

---

## Verification

- [x] Ensemble background cache path validates frames before use
- [x] globalAlpha and shadowBlur reset in all exception paths
- [x] Particle draw uses try/finally for correct save/restore pairing
- [x] Cutscene overlay/canvas defensively hidden during gameplay
- [x] drawImage uses actual frame dimensions to avoid mismatch

---

## Related Systems (No Changes)

- **Object pools** (bullets, particles, enemy bullets, items, explosions): Pooled objects are fully overwritten when reused; no stale references identified
- **Background caches** (ensemble, individual, bell): Invalidation on resize already handled via `_ensembleClassicBgDirty`, `onResizeCallbacks`
- **Cutscene end**: `endCutscene()` correctly hides overlay and canvas; defensive hide adds redundancy

---

**Status**: Fixes applied. Monitor for recurrence of overlap, tearing, or instability.
