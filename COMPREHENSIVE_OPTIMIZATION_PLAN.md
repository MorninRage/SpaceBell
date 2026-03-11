# Comprehensive Optimization Plan – Full Game Systems Review

**Date:** February 2026  
**Source:** Direct code analysis of `game.js` (56,000+ lines) + existing docs  
**Purpose:** Phase 1 – Detailed plan for optimizing the entire game across all systems; research-backed recommendations

---

## 1. Executive Summary

This plan provides a **system-by-system optimization roadmap** for SpaceBell. The game already implements many best practices (object pooling, gradient caching, frame caches, DOM caching, squared-distance collision). Remaining opportunities span:

1. **Fullscreen brightness drift** – Dimension/DPR handling
2. **Rendering hot paths** – Context state, gradients, shadows, integer coords
3. **Collision & physics** – Remaining `Math.sqrt` calls (49 in codebase)
4. **DOM & UI** – ~269 DOM queries; batch updates, passive listeners
5. **Memory & GC** – Per-frame allocations, swap buffers
6. **Audio** – Throttling, preload pools (already strong)
7. **Input** – Gamepad polling, passive listeners

**Research sources:** web.dev (Google), MDN, WPI frame jitter study (MMSys '24), V8 Jank Busters, IEEE WebGPU/WebGL papers, OPTIMIZATION_OPPORTUNITIES.md, JITTER_ANALYSIS_AND_IMPROVEMENTS.md, PERFORMANCE_ANALYSIS.md

---

## 2. Research & Citations

### 2.1 Canvas Optimization (web.dev, MDN)

| Technique | Source | Status in Game |
|-----------|--------|----------------|
| Pre-render to offscreen canvas | web.dev, MDN | ✅ Frame caches, pre-shaded sprites |
| Cache gradients | MDN | ✅ `_cachedGradients`, molecule/particle caches |
| `willReadFrequently: false` for draw-only | MDN | ✅ Main canvas |
| Integer coordinates | web.dev, MDN | ⚠️ Partial – bullets/particles may use floats |
| Minimize `save()`/`restore()` | MDN | ⚠️ Audit needed |
| Avoid `shadowBlur` | web.dev | ⚠️ Still used in many draw paths |
| Batch path drawing | web.dev | ⚠️ Many separate `beginPath`/`stroke` per entity |
| Render screen differences only | web.dev | ❌ Full clear each frame (acceptable for games) |
| Layered canvases | web.dev | ❌ Single canvas (architectural) |

### 2.2 Frame Jitter (WPI MMSys '24, V8)

- **WPI/Claypool:** Interrupt magnitude matters more than frequency for QoE (R² 0.93 vs 0.18). Frame time stability (FTSD) is a strong predictor.
- **V8:** GC runs on main thread; concurrent marking/sweeping reduces pauses. ArrayBuffer/WebGL bookkeeping was a jank source (mitigated in Chrome 46+).
- **Implication:** Reduce allocations (object pools ✅, swap buffers ✅), minimize gradient creation, avoid per-frame array allocations.

### 2.3 WebGPU/WebGL (IEEE 2024)

- WebGPU outperforms WebGL in Godot; canvas 2D is CPU-bound. For this game (2D canvas), focus on CPU-side optimizations: fewer draw calls, cached gradients, integer coords.

---

## 3. Systems Inventory & Optimization Status

### 3.1 Core Loop & Timing

| Component | Location | Status | Opportunities |
|-----------|----------|--------|---------------|
| gameLoop | ~55092 | ✅ RAF, delta-time | — |
| update(deltaTime) | ~10392 | ✅ Early returns, resume smoothing | — |
| draw() | ~17772 | ✅ Context reset each frame | Dimension check uses `innerWidth` vs `clientWidth` |
| FPS cap | _fpsCapInterval | ✅ | — |
| Resume smoothing | resumeSmoothing | ✅ | — |
| Spike rejection | rawDelta > 50ms | ✅ | — |

### 3.2 Canvas & Resize

| Component | Location | Status | Opportunities |
|-----------|----------|--------|---------------|
| resizeCanvasOnly | ~1765 | Uses `clientWidth/Height` | Add DPR for fullscreen (experimental) |
| scheduleResize | ~1752 | 500ms debounce | — |
| Fullscreen enter | handleFullscreenChange | RAF-deferred resize | — |
| Fullscreen exit | handleFullscreenChange | forceFullscreen=false, scheduleResize | — |
| Dimension check in draw | ~17810 | `window.innerWidth` vs canvas | **Use `clientWidth`** (match resize source) |

### 3.3 Caches

| Cache | Status | Notes |
|-------|--------|-------|
| _cachedGradients | ✅ Cleared on resize | — |
| _ensembleClassicBgCacheBySize | ✅ Max 2 (windowed + fullscreen) | — |
| _individualClassicBgCache | ✅ 64 frames | — |
| _bellClassicBgCache | ✅ 256 frames, chunked build | — |
| moleculeGradientCache | ✅ Health buckets | — |
| particleGradientCache | ✅ Size buckets | — |
| preShadedSprites | ✅ Bullets, materials, etc. | — |
| Frame caches (particles, bullets, molecules) | ✅ 64 frames | — |

### 3.4 Object Pools & Memory

| Pool | Status | Notes |
|------|--------|-------|
| _bulletPool | ✅ 200 | — |
| _particlePool | ✅ 500 | — |
| Items, explosions | ✅ Pooled | — |
| Swap buffers (targets, pairs) | ✅ | — |
| Per-frame allocations | ⚠️ | `visibleObstacles = []`, `entities = []`, `helixPoints`, etc. (JITTER_ANALYSIS) |

### 3.5 Collision Detection

| Function | Status | Notes |
|----------|--------|-------|
| checkCollision | ✅ Squared distance | — |
| checkMaterialCollection | ✅ Squared distance | — |
| checkObstacleCollision | ✅ Squared distance | — |
| Other distance checks | ⚠️ 49 `Math.sqrt` calls | Laser beam, auto-collector, targeting, molecule draw, etc. |

### 3.6 DOM & UI

| Component | Status | Notes |
|-----------|--------|-------|
| _cachedElements | ✅ ~50 elements | — |
| Remaining getElementById/querySelector | ⚠️ ~269 total | Some in updateStats, panels, etc. |
| updateStats | ✅ Batched (_statsNeedsUpdate) | — |
| UI update on change only | ⚠️ | Consider _lastScore, etc. |

### 3.7 Rendering (Draw Paths)

| System | Status | Opportunities |
|--------|--------|---------------|
| Bullets | ✅ Pre-shaded sprites, culling | Context state caching, integer coords |
| Particles | ✅ Frame caches | — |
| Molecules | ✅ Gradient cache, atom cache | — |
| Items | ✅ Material skins, frame caches | — |
| Player | ✅ Glow cache, flame skins | — |
| Backgrounds | ✅ Mode caches | — |
| Shields | ⚠️ 10–30+ gradients per frame | Cache by type/size |
| Boss helix | ⚠️ Per-frame array allocs | Reuse temp arrays |

### 3.8 Audio

| Component | Status | Notes |
|-----------|--------|-------|
| AudioManager | ✅ Preload pools, throttling | — |
| Music session guard | ✅ | — |
| Failed file cache | ✅ | — |

### 3.9 Input

| Component | Status | Notes |
|-----------|--------|-------|
| updateGamepad | ~5937 | Poll every frame |
| Mouse/keyboard | ✅ | Passive listeners where possible |

### 3.10 Mode-Specific Systems

| Mode | Status | Notes |
|------|--------|-------|
| Ensemble | ✅ Option E frame cache, slerp | — |
| Individual | ✅ Classic cache, precision/retro/neuro | — |
| Bell Pair | ✅ Classic cache, Aurora skin | — |
| Boss | ⚠️ DNA helix, puzzle hint | Per-frame allocs |

---

## 4. Prioritized Optimization Opportunities

### 4.1 HIGH PRIORITY (Impact + Feasibility)

#### A. Dimension Source Consistency
- **Issue:** draw() uses `window.innerWidth/Height` for dimension check; resizeCanvasOnly uses `document.documentElement.clientWidth/Height`. Mismatch can cause unnecessary resize loops or stale dimensions.
- **Fix:** In draw() ~17810, use `document.documentElement.clientWidth/Height` instead of `window.innerWidth/Height`.
- **Risk:** Low. **Effort:** 1 line.

#### B. Fullscreen DPR Investigation
- **Issue:** HiDPI displays; fullscreen may change effective DPR. No DPR scaling currently.
- **Fix:** Phase 1: Add optional diagnostic logging (clientW, innerW, DPR, screen) on fullscreen enter/exit. Phase 2: If diagnostics support it, try `w *= devicePixelRatio` in fullscreen (with `ctx.scale` adjustment).
- **Risk:** Medium (scaling affects all drawing). **Effort:** Diagnostics low; DPR scaling medium.

#### C. Remove/Cache Remaining Math.sqrt in Hot Paths
- **Locations (from grep):** Laser beam (~10498, 10813, 10828), bullet speed (~11708, 13215), molecule speed (~12703, 22632, 29502), auto-collector (~12340, 12825, 13040, 13056, 13158), targeting (~18952, 28256, 28823, 28926, 29013, 29614, 30826, 31028, 31039), boss helix (~29762, 29800, 29963, 30134), player speed (~32056).
- **Fix:** Where only comparison is needed, use squared distance. Where actual distance is required (e.g., normalization), consider caching or avoiding.
- **Risk:** Low. **Effort:** Medium (many call sites).

#### D. Reuse Temp Arrays (Per-Frame Allocations)
- **From JITTER_ANALYSIS:** `visibleObstacles = []`, `entities = []`, `helixPoints`, `helixStrand1Points`, `helixStrand2Points`, `bioMaterials.filter(...)`.
- **Fix:** Use `_tempVisibleObstacles`, `_tempEntities`, etc.; `.length = 0` + push instead of `= []`.
- **Risk:** Low. **Effort:** Medium.

### 4.2 MEDIUM PRIORITY

#### E. Context Property Caching
- **Research (MDN):** Only set fillStyle, strokeStyle, etc. when they change.
- **Current:** Context reset every frame; many draw paths set styles repeatedly.
- **Fix:** In bullet/particle/item draw, cache last fillStyle/strokeStyle/shadowBlur; set only on change.
- **Risk:** Low. **Effort:** Medium (many draw functions).

#### F. Integer Coordinates
- **Research (web.dev):** Float coords trigger sub-pixel anti-aliasing; `Math.floor` or `|0` is faster.
- **Fix:** Apply `(x|0)`, `(y|0)` for draw positions in bullets, particles, items where appropriate.
- **Risk:** Low (may slightly change visuals). **Effort:** Low–medium.

#### G. Reduce shadowBlur Usage
- **Research (web.dev):** shadowBlur is expensive.
- **Fix:** At high entity counts or in "minimal" quality, disable or simplify shadows. Cache shadow state.
- **Risk:** Low. **Effort:** Medium.

#### H. Boss Defeat / Obstacle Filter Caching
- **Current:** `obstacles.find(o => o.isBoss && o.bossPart === 'neuron')` every frame.
- **Fix:** Cache boss reference when boss spawns; invalidate when destroyed. Use swap-buffer for obstacle cleanup instead of `filter`.
- **Risk:** Low. **Effort:** Low.

### 4.3 LOWER PRIORITY

#### I. DOM Query Audit
- **Current:** ~269 getElementById/querySelector; _cachedElements covers ~50.
- **Fix:** Audit remaining calls; add to _cachedElements or cache at first use.
- **Risk:** Low. **Effort:** Medium.

#### J. Passive Event Listeners
- **Fix:** Add `{ passive: true }` to mousemove, wheel where preventDefault is not used.
- **Risk:** None. **Effort:** Low.

#### K. Batch Path Drawing
- **Research (web.dev):** Single path with multiple segments is faster than many separate strokes.
- **Fix:** Where drawing many lines (e.g., boss helix, grid), batch into one beginPath/stroke.
- **Risk:** Low. **Effort:** Medium.

---

## 5. Fullscreen Brightness Drift – Deep Dive

### 5.1 Current Path
1. fullscreenchange fires (before reflow).
2. Enter: RAF → resizeCanvasOnly() → _resizeDeferUntil = 0 → onResizeCallbacks.
3. Exit: scheduleResize() → 500ms debounce.

### 5.2 Hypotheses (From Code)

| Cause | Evidence | Status |
|-------|----------|--------|
| Stale dimensions at fullscreenchange | RAF defer on enter | Addressed |
| Resize defer blocking cache rebuild | Bypass on enter | Addressed |
| devicePixelRatio not used | clientWidth/Height only | **Not addressed** |
| Dimension source mismatch | draw uses innerWidth, resize uses clientWidth | **Not addressed** |
| GPU compositing | Browser/OS | Out of scope |

### 5.3 Recommended Sequence
1. **Phase 1A:** Dimension consistency (draw use clientWidth) – low risk.
2. **Phase 1B:** Diagnostic logging (clientW, innerW, DPR, screen) on fullscreen enter/exit.
3. **Phase 1C:** If diagnostics show DPR/size anomaly in fullscreen, experiment with DPR scaling.

---

## 6. Implementation Roadmap

### Phase 1: Quick Wins (1–2 days)
1. Dimension consistency in draw() (4.1.A).
2. Reuse 2–3 highest-impact temp arrays (visibleObstacles, entities) (4.1.D).
3. Passive listeners for mousemove/wheel (4.3.J).

### Phase 2: Collision & Math (2–3 days)
1. Replace sqrt with squared distance in laser, auto-collector, targeting where comparison-only (4.1.C).
2. Cache boss reference (4.2.H).

### Phase 3: Rendering (3–5 days)
1. Context property caching in bullet/particle draw (4.2.E).
2. Integer coordinates in hot paths (4.2.F).
3. Reduce shadowBlur at high load or minimal quality (4.2.G).

### Phase 4: Fullscreen & Diagnostics (1–2 days)
1. Fullscreen diagnostic logging (4.1.B Phase 1).
2. DPR experiment if diagnostics support (4.1.B Phase 2).

### Phase 5: Memory & DOM (2–3 days)
1. Remaining temp array reuse (4.1.D).
2. DOM query audit and cache expansion (4.3.I).
3. Batch path drawing where applicable (4.3.K).

---

## 7. Code Locations Reference

| System | Location |
|--------|----------|
| gameLoop | 55092 |
| draw | 17772 |
| resizeCanvasOnly | 1765 |
| scheduleResize | 1752 |
| handleFullscreenChange | 873 |
| Dimension check in draw | 17810–17814 |
| getCachedGradient | 2388 |
| _cachedGradients | 1040, 1077 |
| _ensembleClassicBgCacheBySize | 1065, 19311, 19357 |
| _resizeDeferUntil | 852, 1754, 6588, 6614, 19020, 19372, 19773 |
| _bulletPool | 1415, 9689, 11460, 12238 |
| _particlePool | 1423, 12918, 13728 |
| checkCollision | 13570 |
| checkMaterialCollection | 13581 |
| checkObstacleCollision | 13609 |
| Math.sqrt call sites | 49 total (see grep) |
| visibleObstacles alloc | ~31685 |
| entities alloc (laser) | ~32276 |
| helixPoints (boss) | ~29774, 29931 |

---

## 8. Success Criteria

1. **Fullscreen brightness:** Reduced or eliminated drift (if DPR/dimension fix applies).
2. **Dimension consistency:** Single source (clientWidth) for canvas dimensions.
3. **No regressions:** Mode switching, resize, F11, gameplay unchanged.
4. **Performance:** No measurable regression; target 5–15% frame-time improvement from Phase 1–3.
5. **Jitter:** Reduced per-frame allocations; lower GC pressure.

---

## 9. Related Documents

- `OPTIMIZATION_OPPORTUNITIES.md` – Detailed sqrt/DOM/array optimizations
- `JITTER_ANALYSIS_AND_IMPROVEMENTS.md` – Gradient/array/GC analysis
- `PERFORMANCE_ANALYSIS.md` – Bullet gradient/crash analysis
- `FRAME_CACHE_COMPREHENSIVE_REVIEW.md` – Frame cache status
- `ARCHITECTURE.md` – High-level architecture

---

*This document reflects code analysis and research synthesis. Implement in phases; validate each change before proceeding.*
