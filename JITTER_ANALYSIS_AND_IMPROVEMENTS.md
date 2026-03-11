# Jitter Analysis & Improvement Plan

**Date:** January 30, 2026  
**Status:** Comprehensive Review Complete  
**Context:** Noticeable jitter every 2-5 seconds; GC reduced by pooling but jitter persists

---

## Executive Summary

This document synthesizes a full code review, existing documentation, and academic research (WPI, V8, web performance) to identify remaining jitter sources and improvement opportunities. **Key finding:** Jitter may not be solely GC-related—multiple factors can cause 2-5 second periodic stutters. A diagnostic approach plus targeted fixes is recommended.

---

## Part 1: What We Know

### Already Implemented (Good)

| System | Status | Impact |
|--------|--------|--------|
| Swap buffers for targets, pairs, bullets | ✅ | Eliminates ~180 array allocs/sec |
| Object pooling (bullets, particles, items, explosions) | ✅ | Major GC reduction |
| Delta-time aware lerp | ✅ | Frame-rate independent interpolation |
| Spike rejection (rawDelta > 50ms) | ✅ | Caps physics on GC frames |
| Fixed-timestep physics for molecules | ✅ | PHASE_DT = 1/60 avoids variable delta in rotation |
| Quantum Nebula: game time, (0,0) center | ✅ | No wall-clock desync |

### Academic Research (WPI MMSys '24, V8)

**WPI/Claypool Frame Jitter Study:**
- **Interrupt magnitude matters more than frequency** for QoE (R² 0.93 vs 0.18)
- Frame time standard deviation (FTSD) and interrupt magnitude (IM) are strong QoE predictors
- Average frame rate alone can hide variation; stability matters

**V8 Jank Busters:**
- GC runs on main thread; pauses block rendering
- ArrayBuffer/WebGL bookkeeping was a major jank source (mitigated in Chrome 46+)
- Concurrent marking/sweeping reduces pause times
- Idle-time GC scheduling helps but doesn't eliminate pauses

---

## Part 2: Remaining Jitter Sources (Prioritized)

### 1. **Gradient Creation (HIGH – Likely Primary)**

**Evidence:** 665+ `createRadialGradient` / `createLinearGradient` calls in `game.js`. Many run **per entity per frame** in draw paths:

- Molecules: 5–15 gradients per molecule (atom glow, core, bands, halo, motes)
- Bullets: 4+ gradients per bullet (outer glow, body, core, trail)
- Items: 1+ gradient per item
- Particles: gradients per particle in some paths
- Shields: 10–30+ gradients per shield type per frame

**Impact:** With 30 molecules × 8 gradients ≈ 240 gradient allocations/frame. At 60 FPS ≈ 14,400 gradients/sec. Each gradient allocates and triggers GC pressure.

**Fix:** Cache gradients by (approximate) parameters. Use solid colors where acceptable. Pre-render to offscreen canvas for repeated patterns.

---

### 2. **Per-Frame Array Allocations in Draw Path (MEDIUM)**

| Location | Alloc | When |
|----------|-------|------|
| `visibleObstacles = []` (31685) | New array | Every frame (targeting computer) |
| `visibleObstacles.slice(0, maxScannedObstacles)` (31702) | New array | Every frame |
| `entities = []` (32276) | New array | Every frame when laser active |
| `bioMaterials.filter(...)` (28237) | New array | Every frame (materials UI) |
| `helixPoints = []`, `helixStrand1Points`, `helixStrand2Points` (29774, 29931) | New arrays | Every frame in boss draw |

**Fix:** Reuse temp arrays (e.g. `_tempVisibleObstacles`, `_tempEntities`) and `.length = 0` + push instead of `= []`.

---

### 3. **obstacles.filter in Update (LOW–MEDIUM)**

- `obstacles.filter(o => !o._remove)` (13387) – runs when `_cleanupNeeded !== false` (boss cleanup)
- `obstacles.filter(o => o.isBoss)` – multiple places, some in hot paths

**Fix:** Use swap-buffer pattern (like targets/pairs) for obstacle cleanup instead of `filter`.

---

### 4. **requestAnimationFrame / Frame Budget**

- `requestAnimationFrame` timestamp can have jitter (e.g. Firefox historically)
- Update + draw must finish within ~16.6 ms for 60 FPS
- Long frames (>50 ms) are already capped, but the **cause** of those frames (GC, layout, JS) is what we want to reduce

---

### 5. **Non-GC Causes of 2–5 Second Jitter**

Possible non-GC sources:

| Cause | Mechanism | How to Check |
|-------|-----------|--------------|
| **Compositor / layout** | Periodic style/layout recalculation | Chrome DevTools Performance, check for Layout/Paint |
| **Timer / background tasks** | `setInterval`/`setTimeout` or other periodic work | Search for timers, workers |
| **Network / storage** | Periodic fetch, localStorage, IndexedDB | Check for polling, save logic |
| **Audio decode** | Decode on main thread | Use pre-decoded audio pools (already done) |
| **Canvas resize / devicePixelRatio** | Resize observers, DPR changes | Check resize handlers |
| **Browser extensions** | Extensions injecting scripts | Test in incognito |

---

## Part 3: Diagnostic Tool – Frame Timing Monitor

Add a lightweight frame-timing monitor to **identify** whether jitter correlates with GC, long frames, or something else.

```javascript
// Add to game init (e.g. after lastTime init):
this._frameTiming = {
    history: [],
    maxLen: 300,  // ~5 sec at 60fps
    lastFrameEnd: 0,
    spikeCount: 0,
    lastSpikeAt: 0
};

// In gameLoop(), at the very start (after const now = performance.now()):
const ft = this._frameTiming;
if (ft.lastFrameEnd > 0) {
    const frameDuration = now - ft.lastFrameEnd;
    ft.history.push(frameDuration);
    if (ft.history.length > ft.maxLen) ft.history.shift();
    if (frameDuration > 33) {  // >2 frames
        ft.spikeCount++;
        ft.lastSpikeAt = now;
    }
}
ft.lastFrameEnd = now;

// Expose for dev panel / console:
// game._frameTiming.history - array of frame durations
// game._frameTiming.spikeCount, game._frameTiming.lastSpikeAt
```

**Usage:**
1. Play for 30–60 seconds.
2. When jitter occurs, note the time.
3. Inspect `game._frameTiming.history` and look for spikes >33 ms.
4. If spikes align with jitter, the cause is long frames (GC, layout, or heavy JS).
5. Use Chrome Performance profiler with “Record allocation timeline” to see if spikes match GC.

---

## Part 4: Recommended Improvements (Priority Order)

### P0 – Highest Impact

1. **Gradient caching / reduction**
   - Cache gradients by rounded parameters (e.g. `"rgba_r_g_b_a_radius"`).
   - Use solid colors for distant/small entities.
   - Consider pre-rendered sprites for molecules/bullets (already partially done).

2. **Reuse draw-path arrays**
   - `_tempVisibleObstacles`, `_tempEntities`, `_tempScannedObstacles`.
   - Clear and repopulate instead of `= []` and `slice()`.

### P1 – Medium Impact

3. **bioMaterials.filter**
   - Cache `visibleMaterials` and invalidate only when inventory changes.

4. **obstacles cleanup**
   - Swap-buffer pattern for `obstacles` cleanup instead of `filter`.

5. **Laser `entities` and `pairs.some`**
   - Reuse `_tempEntities` for laser collision.
   - Consider caching “is part of pair” on entities to avoid `pairs.some()` per entity.

### P2 – Lower Impact / Harder

6. **Canvas context state**
   - Only set `fillStyle`/`strokeStyle` when they change.

7. **Reduce `save()`/`restore()`**
   - Batch transforms where possible.

8. **Web Worker for heavy logic**
   - Move collision or AI to a worker if it becomes a bottleneck (larger refactor).

---

## Part 5: Comparison with Research

| Aspect | Our System | Research (WPI, V8) |
|--------|------------|--------------------|
| Frame pacing | Variable (spike cap 50 ms) | Interrupt magnitude > frequency for QoE |
| GC mitigation | Pooling, swap buffers | V8: concurrent marking, idle-time GC |
| Delta smoothing | Spike rejection, no EMA on normal frames | Avoid hiding variation; measure FTSD |
| Diagnostic | None built-in | Frame timing, FTSD, interrupt magnitude |

**Takeaway:** Add frame-timing diagnostics (FTSD, spike count, spike times) to validate that our changes reduce interrupt magnitude and frame time variance.

---

## Part 6: Quick Wins to Implement

1. **Add frame timing monitor** (see Part 3).
2. **Reuse `visibleObstacles` / `scannedObstacles`** – init once, clear and repopulate each frame.
3. **Reuse `entities`** for laser collision – same pattern.
4. **Cache `visibleMaterials`** – update only when inventory changes.
5. **Gradient cache** – start with molecules (highest gradient count); cache by size bucket and color key.

---

## Part 7: Implemented Changes (This Session)

1. **Frame timing monitor** – Added `_frameTiming` object with `history`, `spikeCount`, `lastSpikeAt`. Access from console: `window.game._frameTiming`. To inspect spikes: `window.game._frameTiming.history.filter(d => d > 33)` or compute std dev of `history`.
2. **visibleObstacles reuse** – Replaced `visibleObstacles = []` and `slice()` with `_tempVisibleObstacles`; clear and repopulate each frame.
3. **entities reuse** – Replaced `entities = []` in laser collision with `_tempEntities`; clear and repopulate each frame.
4. **Gradient caching** – Added `getCachedGradient(key, factory)` and applied to:
   - **Items**: quantumParticles, crystals, energyCores, metalScraps, atp (radial gradients cached by type + size bucket).
   - **Bullet tails**: basic, rapid, spread (outer, core, streak linear gradients cached by weapon + tail length bucket).
   - **drawNeonMaterials**: core gradient cached by materialType + size bucket.
5. **visibleMaterials cache** – drawFoodMaterialsUI caches `visibleMaterials`; recomputes only when inventory (bio materials) changes.

---

## Part 8: Verification

After changes:

1. Run with frame timing monitor; confirm spike count and magnitude decrease.
2. Use Chrome Performance → “Record allocation timeline” to see if GC frequency drops.
3. Compare `_frameTiming.history` standard deviation before/after.
4. Subjective test: play 2–3 minutes; note if 2–5 s jitter is reduced or gone.

---

## References

- WPI MMSys '24: Xu & Claypool, “User Study-based Models of Game Player QoE with Frame Display Time Variation”
- V8: “Jank Busters Part One”, “Getting garbage collection for free”
- TIMING_FIX_DOCUMENTATION.md, JITTER_FIX_COMPREHENSIVE_REVIEW.md
- PERFORMANCE_ANALYSIS.md, OPTIMIZATION_OPPORTUNITIES.md
