# Frame Cache System – Deep Dive Analysis

**Date:** March 2026  
**Context:** Fullscreen HDR brightness fade persists after luminance constant fixes. User suspects frame cache system.  
**Goal:** Analyze cache architecture, identify wiring gaps, timing issues, and alternative approaches.

---

## 1. Frame Cache Architecture Overview

### 1.1 What Gets Cached

| Cache | Frames | Purpose | Build Trigger |
|-------|--------|---------|---------------|
| **Ensemble Classic** | 64 (configurable 32–1024) | Mode 1 background – quantum field, particles, lines, nodes | Preload (window + screen size), ensureEnsembleClassicBackgroundCache |
| **Individual Classic** | 64 | Mode 2 background | Preload (window + screen size), ensureIndividualClassicBackgroundCache |
| **Bell Classic** | 256 | Mode 3 background | Preload (window + screen size), ensureBellClassicBackgroundCache |
| **Particles, bullets, molecules, etc.** | 32–256 each | Sprites, explosions, atoms | Preload only |

### 1.2 Cache Build Flow

```
Preload (runPreload):
  1. Ensemble: build at canvas size (after resize) + build at window.screen size (fullscreen pre-build)
  2. Individual: same
  3. Bell: same

Fullscreen enter (handleFullscreenChange):
  - SKIPPED: buildExactFullscreenBackgroundCaches() is NOT called (line 913)
  - Comment: "Avoids frame spikes that may contribute to fullscreen HDR fading"
  - We rely on preload having built at screen size

Runtime (each frame):
  - ensureEnsembleClassicBackgroundCache() – incremental build if dimensions changed
  - If cache miss or dimension mismatch → live draw (drawEnsembleClassicFrameAtPhase)
```

### 1.3 Critical Path: Cache vs Live Draw

**When cache is used:**
- `dimensionsMatch` (cache size ≈ canvas size, within 2px)
- `cacheValid` (f1, f2, lineEndpoints, particleData exist)
- `baseFrame` path: draw single frame (t < 0.5 ? f1 : f2) – no blend
- Overlay: particles, lines, nodes drawn with interpolated positions from f1/f2

**When live draw is used:**
- Dimension mismatch (cache built at different size)
- Cache not ready (partial build)
- Exception in cache path
- `drawEnsembleClassicFrameAtPhase(ctx, phase, w, h)` – full redraw each frame

---

## 2. Potential Issues & Wiring Gaps

### 2.1 Dimension Mismatch (HIGH LIKELIHOOD)

**Problem:** Preload builds at `window.screen.width/height`. Fullscreen canvas often uses `window.innerWidth/innerHeight` (or scaled size). These can differ:
- Taskbar reduces inner height
- Browser chrome
- `_getScaledCacheSize()` may scale differently
- DPI/devicePixelRatio handling

**Result:** `dimensionsMatch` is false → **live draw every frame** instead of cache. Live draw has different code path (drawEnsembleClassicFrameAtPhase) including:
- Line 19822: `ctx.shadowBlur = 5` for quantum field lines (cache path uses 0)
- Full per-frame draw cost

**Fix to verify:** Log when `dimensionsMatch` is false and what `bw,bh` vs `cw,ch` are in fullscreen.

### 2.2 Fullscreen Cache Build Skipped – Preload May Be Wrong Size

**Current state:** We skip `buildExactFullscreenBackgroundCaches()` on fullscreen enter. The theory was "frame spikes cause HDR fade." But now:
- If preload built at `screen.width x screen.height` and fullscreen uses different size → cache never matches
- We never build at the *actual* fullscreen size
- `buildExactFullscreenBackgroundCaches` uses `_getScaledCacheSize(clientW, clientH)` – which might differ from preload's `screen.width/height`

**Gap:** Preload and fullscreen build use different size sources. They may never align.

### 2.3 ensureEnsembleClassicBackgroundCache – Incremental Build During Gameplay

**Behavior:** When `needsRebuild` (dimensions changed, dirty, etc.), it builds 4–16 frames per rAF until complete. During build:
- `_ensembleClassicBgDirty` is true
- `builtCount` may be less than `frameCount`
- `getEnsembleClassicBackgroundFrameNearest` uses `cache.frames[idx % builtCount]` – can return wrong frame or null
- Frame time spikes during chunk build

**HDR implication:** Variable frame timing (spikes) can trigger display backlight adaptation. DisplayHDR allows up to 8 frames for backlight transition – so a 100ms spike could cause visible brightness shift.

### 2.4 Phase/Time Source Inconsistency

**Ensemble uses:** `resolveBackgroundTime(0.0015)` → `levelTimeElapsed` when playing/levelup, else `this.time`.

**Level up:** `levelTimeElapsed = 0` (line 10966, 56195, 56271). Phase resets → background jumps to frame 0. That's a **discrete luminance jump** – one frame is full phase 0, next is phase 0 + delta. Could trigger display adaptation.

**Puzzle/boss:** Different time sources in different modes. `resolveBackgroundTime` has `timeScale` param – ensure all callers use consistent scale.

### 2.5 Cache vs Live Draw – ShadowBlur Mismatch

**drawEnsembleClassicFrameBaseOnly** (cache build): No shadowBlur on lines (only gradient + stars).  
**drawEnsembleClassicFrameAtPhase** (live draw): `ctx.shadowBlur = 5` for quantum field lines (line 19822).

**Cache render path** (lines 18618–18634): Draws lines with `shadowBlur = 0`.  
**Live draw path:** Uses shadowBlur = 5 for lines.

**Result:** When we fall back to live draw (dimension mismatch), we get *more* glow (shadowBlur=5) than cache path. Luminance differs between the two paths.

### 2.6 BySize Map – Eviction and Rebuild

`_ensembleClassicBgCacheBySizeMax = 2` – we keep only 2 size variants (e.g. windowed + fullscreen). When a third size is needed (e.g. resize during load), we evict the oldest. Next time we need that size, we rebuild. Rebuild = frame spikes.

### 2.7 Puzzle / Boss Mode Timing

Puzzle and boss modes may use different background time or skip background entirely. If they switch in/out, the transition could cause a luminance step. Worth checking `resolveBackgroundTime` and `gameState` handling for puzzle/boss.

---

## 3. Research: Frame Caching in Games

### 3.1 Pre-Bake vs Runtime

**Pre-baking (our approach):**
- Pros: GPU-accelerated drawImage, no per-frame path work
- Cons: Memory (64–256 frames × 2 sizes × 4 bytes/pixel), build time, dimension coupling

**Runtime draw (Demo approach):**
- Pros: No cache, no dimension coupling, simpler
- Cons: More CPU per frame – but Demo doesn't fade

**Takeaway:** Demo proves runtime draw can be stable. Our cache adds complexity that may introduce the fade (dimension mismatch → path switch, build spikes, etc.).

### 3.2 Sprite Sheet / Texture Atlas

Games often use sprite sheets for animation – one texture, UV coords per frame. We use separate canvases per frame. Alternative: single atlas texture with 64 tiles. Would require WebGL or canvas drawImage with source rect. More work but eliminates per-size cache.

### 3.3 HDR / Display Adaptation

- **VESA DisplayHDR:** Backlight rise time up to 8 frames (standard) or 2 frames (True Black)
- **Local dimming:** Display analyzes content in real-time per zone
- **Variable frame timing:** Spikes (cache build) or drops change "frames per second" of content. Display may adapt to perceived brightness over a rolling window.

**Hypothesis:** The cache system causes *indirect* fade:
1. Dimension mismatch → live draw (different luminance than cache)
2. Or: incremental build → frame spikes → variable timing → display adapts
3. Or: level up phase reset → discrete luminance jump → display adapts

---

## 4. Alternative Approaches

### 4.1 Option A: Disable Background Cache Entirely (Live Draw Always)

**Change:** Never use cache for Ensemble/Individual/Bell backgrounds. Always call `drawEnsembleClassicFrameAtPhase` (and equivalents).

**Pros:** Matches Demo, no dimension coupling, no build spikes  
**Cons:** Higher CPU per frame – may need to simplify draw (fewer particles, etc.) if FPS drops

**Test:** Add a flag `_disableBackgroundCache = true` and short-circuit cache path to always live draw. If fade goes away, cache is implicated.

### 4.2 Option B: Fix Dimension Alignment

**Change:** On fullscreen enter, use the *exact* canvas dimensions that will be used, and ensure preload/build use the same. Unify `_getScaledCacheSize`, `resizeCanvasOnly`, and preload size logic.

**Pros:** Cache would match when it should  
**Cons:** Complex – many code paths affect dimensions

### 4.3 Option C: Pre-Bake at Single Resolution, Scale at Runtime

**Change:** Build cache once at e.g. 1920×1080. At runtime, always drawImage with scale to fit canvas. No per-size cache.

**Pros:** Simpler, one size only  
**Cons:** Scaling can blur; very large screens may upscale

### 4.4 Option D: Re-Enable Fullscreen Cache Build (Revert Skip)

**Change:** Call `buildExactFullscreenBackgroundCaches()` again on fullscreen enter, but:
- Build in Web Worker (if possible) or
- Build with smaller chunks and longer yields to spread load
- Or build at low priority (requestIdleCallback)

**Pros:** Cache would match fullscreen size  
**Cons:** We previously suspected this caused fade (frame spikes). Need to test with gentler build.

### 4.5 Option E: Reduce Frame Count

**Change:** 64 → 16 frames for Ensemble. Less memory, faster build, coarser animation. Fewer discrete steps = less chance of visible luminance jumps between frames.

**Pros:** Quick test  
**Cons:** May look choppier

---

## 5. Recommended Next Steps

### 5.1 Diagnostic (No Code Change)

1. **Log dimension match:** In `drawEnsembleModeBackground` (around line 18568), when `!dimensionsMatch`, log `{ cw, ch, bw, bh }` and `cacheValid`. Run in fullscreen, check console.
2. **Log cache vs live:** Add a counter for "cache path" vs "live draw path" per frame. If live draw is used 100% in fullscreen, that's the smoking gun.

### 5.2 Quick Test: Force Live Draw (IMPLEMENTED)

In console: `window.game._forceLiveDrawBackground = true`

This bypasses all background caches (Ensemble, Individual, Bell) and uses live draw. If the fade disappears, the cache system is implicated. Reset with `window.game._forceLiveDrawBackground = false`.

### 5.3 Fix ShadowBlur Consistency

In `drawEnsembleClassicFrameAtPhase`, line 19822: change `ctx.shadowBlur = 5` to `ctx.shadowBlur = 0` to match cache path. Ensures both paths have identical luminance.

### 5.4 Consider Option A (Full Live Draw)

If diagnostic confirms cache is the issue, implement Option A as a user toggle or default for HDR/fullscreen. "Simpler is better" – Demo works without cache.

---

## 6. Summary Table

| Issue | Severity | Fix |
|-------|----------|-----|
| Dimension mismatch → live draw | High | Align preload/fullscreen size logic; or force live draw |
| ShadowBlur 5 vs 0 (live vs cache) | Medium | Set live draw shadowBlur=0 |
| Fullscreen cache build skipped | Medium | Re-enable with gentler build, or accept live draw |
| Incremental build frame spikes | Medium | Build off main thread or with longer yields |
| Level up phase reset | Low | Consider smoothing phase transition |
| BySize eviction | Low | Increase max or build on demand |

---

## 7. References

- FADING_ISSUE_COMPREHENSIVE_ANALYSIS.md
- MODE1_ENSEMBLE_COMPREHENSIVE_ANALYSIS.md
- FULLSCREEN_BRIGHTNESS_ANALYSIS_RESEARCH.md
- web.dev: Canvas performance (pre-render to offscreen)
- DisplayHDR: Backlight rise time specs
