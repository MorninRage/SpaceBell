# Timing Fix Documentation

## Overview

This document details the timing-related issues discovered in the bell-game, their root causes, and the fixes applied. The problems manifested as jitter, stutter, and sustained slowdown affecting molecules, background, collisions, and all delta-time-driven systems.

---

## Problem Summary

| Symptom | When Observed |
|---------|----------------|
| Jitter every 2–3 seconds | During normal gameplay |
| Jitter on hit or mode switch | When taking damage or switching modes |
| Mode 1 (Ensemble) background blurry | When using blended frame interpolation |
| **Sustained slowdown** | Molecules, background, collisions—everything runs in slow motion |

---

## Root Causes Identified

### 1. Per-Frame Allocations (GC-Induced Jitter)

**Cause:** The update loop used `.filter()` and array literals (`const arr = []`) every frame for targets, pairs, bullets, and energy ripples. This created hundreds of allocations per second, triggering frequent garbage collection. GC blocks the main thread and causes visible stutters.

**Evidence:** Jitter correlated with GC cycles (~every 2–3 seconds).

### 2. Aggressive Delta Time Spike Detection

**Cause:** The spike threshold was initially 10ms. Moderate slowdowns from hit effects or mode switches (15–25ms frames) were treated as spikes and rejected. Physics fell behind real time, causing stutter.

**Fix (earlier):** Increased threshold to 33ms, then 50ms.

### 3. EMA Smoothing Causing Sustained Slowdown

**Cause:** Exponential Moving Average smoothing (`weight = 0.03`) on `deltaTime` was too aggressive. `_smoothedDeltaTime` could get stuck at low values. All physics and animations scale with `deltaTime`, so the game effectively ran in slow motion.

**Fix (earlier):** Removed EMA smoothing; use raw delta for normal frames.

### 4. Spike Rejection Discarding Game Time (Primary Slowdown Cause)

**Cause:** On severe spike frames (>50ms, e.g. GC or tab switch), the game used `_smoothedDeltaTime` (~0.016) instead of the actual elapsed time. For a 60ms frame, it simulated only 16ms—losing ~44ms of game time per spike. With frequent spikes (e.g. GC every 2–3 seconds), the game consistently fell behind and ran in slow motion.

**Fix (this session):** Use a **capped** raw delta on spike frames instead of the previous small value.

### 5. Resume Smoothing Denominator Mismatch

**Cause:** Resume smoothing used a hardcoded denominator of `3` for the ramp formula, but level-up activated with `framesRemaining = 5`. For level-up, `p = 1 - (4/3)` was negative, producing very low delta values and incorrect slow-motion during the first frames after level-up.

**Fix (this session):** Added `targetFrames` and set it correctly at each activation (3 for unpause, 5 for level-up).

### 6. Mode 1 Background Cost

**Cause:** Mode 1 (Ensemble) used "draw-at-phase" with hundreds of draw calls per frame. Blending frames for smoothness caused blurriness and variable frame times.

**Fix (earlier):** Switched to cached nearest-frame-only rendering; made cache build incremental.

---

## Changes Made (This Session)

### Fix 1: Spike Handling—Use Capped Raw Delta

**File:** `game.js` (game loop, ~line 54920)

**Before:**
```javascript
if (isSevereSpike) {
    deltaTime = this._smoothedDeltaTime ?? 0.016;
    this._smoothedDeltaTime = deltaTime;
}
```

**After:**
```javascript
if (isSevereSpike) {
    // Cap at 50ms (3 frames) - prevents giant jump but doesn't fall behind
    deltaTime = Math.min(rawDelta, 0.05);
    this._smoothedDeltaTime = deltaTime;
}
```

**Rationale:** On spike frames, we now simulate up to 50ms of game time instead of ~16ms. This prevents large visible jumps while avoiding sustained slowdown from discarded time.

---

### Fix 2: Resume Smoothing—Dynamic Denominator

**File:** `game.js`

**Changes:**

1. Added `targetFrames` to `resumeSmoothing` object (default: 3).
2. Set `targetFrames` at each activation:
   - **Level-up:** `targetFrames = 5` (matches `framesRemaining = 5`)
   - **Unpause, inventory close, shop close, cutscene end:** `targetFrames = 3` (matches `framesRemaining = 3`)
3. Updated ramp formula to use `targetFrames`:

**Before:**
```javascript
const p = 1 - (this.resumeSmoothing.framesRemaining / 3);
```

**After:**
```javascript
const tf = this.resumeSmoothing.targetFrames || 3;
const p = 1 - (this.resumeSmoothing.framesRemaining / tf);
```

---

## Previous Fixes (Context)

| Fix | Description |
|-----|-------------|
| Swap buffers | Replaced `.filter()` and array literals with reusable `_tempAliveTargets`, `_tempAlivePairs`, `_tempAliveBullets`, `_tempEnergyRipples` |
| Spike threshold | Increased from 10ms to 33ms, then 50ms |
| EMA removal | Removed EMA smoothing; use raw delta for normal frames |
| Mode 1 background | Cached nearest-frame rendering; incremental cache build |
| `drawQuantumNebulaMolecule` | Fixed coordinate bug; use `this.time` instead of `Date.now()` |

---

## Current Timing Logic Summary

1. **Normal frames (rawDelta ≤ 50ms):** Use `rawDelta` directly.
2. **Spike frames (rawDelta > 50ms):** Use `Math.min(rawDelta, 0.05)`.
3. **Resume smoothing (first 3–5 frames after unpause/level-up):** Ramp from 0.5× to 1.0× of 0.016, using `targetFrames` for correct denominator.
4. **Paused:** Use fixed 0.016; do not advance `lastTime`.
5. **Cutscenes:** Use real-time delta for accurate timing.

---

## Testing Recommendations

- Play for several minutes; verify no sustained slowdown.
- Trigger GC (e.g. open DevTools, switch tabs); verify recovery.
- Unpause, close inventory, level up; verify no jitter or incorrect slow-motion.
- Mode 1 (Ensemble): verify background is sharp and smooth.

---

## Related Documentation

- `JITTER_FIX_COMPREHENSIVE_REVIEW.md` – Initial jitter analysis
- `STUTTER_FIX_SUMMARY.md` – Spike handling and cap
- `MODE1_ENSEMBLE_COMPREHENSIVE_ANALYSIS.md` – Mode 1 background analysis
