# Molecule Movement Smoothness – Analysis & Enhancements

**Date:** January 2026  
**Status:** Analysis complete, fix implemented

---

## 1. Executive Summary

The molecule system uses a frame-rate cache for atom rendering (128 frames + sub-frame blend) which works well for **rotation animation**. However, molecule **position movement** was not as smooth as it could be. This document analyzes the causes and documents the fix.

---

## 2. System Overview

### 2.1 What Works Well

| Component | Implementation | Status |
|-----------|----------------|--------|
| **Atom rotation** | 128-frame cache + sub-frame blend (canvas compositing) | ✅ Smooth |
| **Atom rendering** | Pre-rendered sprites (gradient, glow, core) | ✅ Fast |
| **Physics** | Euler integration: `x += vx * deltaTime` | ✅ Frame-rate independent |
| **DeltaTime** | `performance.now()` with spike capping | ✅ Reasonable |

### 2.2 What Caused Stepped Movement

| Issue | Location | Impact |
|-------|----------|--------|
| **Half-pixel position snapping** | `drawObstacles()` line ~29028 | Primary cause – molecules jump between 0.5px positions |
| **No render interpolation** | N/A | Display shows quantized positions |

---

## 3. Root Cause: Half-Pixel Position Snapping

### 3.1 The Code

```javascript
// Draw at exact physics position - no interpolation. Interpolation caused slowdown/speedup
// when combined with variable frame times and spike handling.
const drawX = Math.round(obstacle.x * 2) / 2;
const drawY = Math.round(obstacle.y * 2) / 2;
this.ctx.translate(drawX, drawY);
```

### 3.2 What It Does

- Snaps `obstacle.x` and `obstacle.y` to the nearest **0.5 pixel**
- Example: x=100.3 → 100.5, x=100.7 → 100.5, x=100.9 → 101.0
- Molecules advance in **discrete half-pixel steps** instead of continuous sub-pixel movement

### 3.3 Why It Was Added

The comment says: *"Interpolation caused slowdown/speedup when combined with variable frame times and spike handling."*

A previous interpolation approach (likely lerp between prev/current position) was removed because it caused perceived speed changes when frame times varied. The half-pixel rounding was likely a compromise to reduce sub-pixel rendering artifacts while avoiding interpolation bugs.

### 3.4 The Trade-off

- **Half-pixel rounding** → Reduces some sub-pixel blur/aliasing
- **Cost** → Stepped, jerky movement – molecules visibly "jump" between positions
- **For smooth movement** → Use full sub-pixel precision; canvas handles sub-pixel drawing

---

## 4. Other Factors (Minor)

### 4.1 Variable DeltaTime

- `deltaTime` varies frame-to-frame (from `performance.now()`)
- Physics uses it directly: `obstacle.x += obstacle.vx * deltaTime`
- This is correct for frame-rate independence
- Micro-variations in deltaTime can cause tiny position jitter, but the **half-pixel rounding dominates** – it quantizes to 0.5px regardless

### 4.2 Atom Frame Cache

- **128 frames** with sub-frame blend for rotation
- `getMoleculeAtomFrame()` returns frameA + frameB with blend factor
- Atom *rotation* is smooth; the issue is molecule *translation* (position)

### 4.3 Atom Positions

- Atoms have `x, y` in **obstacle-local space** (relative to center)
- `generateMoleculeStructure()` sets these at spawn (fixed layout)
- Drawing: `ctx.translate(drawX, drawY)` then draw atoms at `atom.x`, `atom.y`
- The snapped `drawX`, `drawY` affects the **entire molecule** – all atoms move together in stepped increments

---

## 5. The Fix: Use Full Sub-Pixel Precision

**Change:** Remove the half-pixel rounding. Use `obstacle.x` and `obstacle.y` directly.

**Before:**
```javascript
const drawX = Math.round(obstacle.x * 2) / 2;
const drawY = Math.round(obstacle.y * 2) / 2;
this.ctx.translate(drawX, drawY);
```

**After:**
```javascript
this.ctx.translate(obstacle.x, obstacle.y);
```

**Result:**
- Molecules move with full sub-pixel precision
- Smooth continuous movement (limited only by physics step size and frame rate)
- Canvas 2D handles sub-pixel drawing (browser anti-aliases)

---

## 6. Implemented Enhancements

### 6.1 Display Smoothing (Delta-Time Aware)

**Implemented:** Delta-time aware exponential smoothing for trajectory jitter reduction.

- Store `obstacle._displayX`, `obstacle._displayY` (initialized at spawn)
- Each frame: `lerpFactor = 1 - Math.exp(-20 * dt)`; `_displayX += (x - _displayX) * lerpFactor`
- Frame-rate independent: ~27% convergence at 60fps, consistent across variable frame times
- Draw at `_displayX`, `_displayY` (full sub-pixel); collision uses true `x`, `y`
- Replaces physics interpolation; reduces trajectory jitter from variable deltaTime

### 6.2 Fixed Timestep Physics

**Implemented:** Obstacle position updates run at fixed `dt = 1/60`.

- `_obstaclePhysicsAccumulator += deltaTime`
- While `accumulator >= FIXED_DT`: run position step; `accumulator -= FIXED_DT`
- Cap at 5 steps per frame to prevent spiral of death
- Store `_prevX`, `_prevY` for interpolation
- `alpha = accumulator / FIXED_DT`; render at `prev + (current - prev) * (1 - alpha)`
- Regen and collision still run once per frame with variable dt

### 6.3 Atom Frame Count Increase

**Implemented:** Increased from 128 to 256 frames for rotation.

- Finer rotation steps; smoother atom animation
- Sub-frame blend still used for interpolation between frames

---

## 7. Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Position precision** | 0.5 pixel | Full sub-pixel |
| **Movement feel** | Stepped, jerky | Smooth, continuous |
| **Atom rotation** | Already smooth (128 frames + blend) | Unchanged |
| **Physics** | Unchanged | Unchanged |

**Primary fix:** Remove half-pixel rounding on molecule draw position. Use `obstacle.x`, `obstacle.y` directly for smooth movement.

---

## 7. Lighting/Design Jitter Sources (Fixed)

Several molecule lighting and design elements caused visible jitter:

### 7.1 Runtime Orbiting Highlight (Removed)

- **Issue:** A white highlight dot orbited around each atom using `highlightAngle = time + index`. With variable `deltaTime`, the orbit advanced at different rates each frame → visible stepping/jitter.
- **Fix:** Removed – cached atom frames already have a baked specular highlight (fixed position, no flicker per MOLECULE_ANIMATION_NOTES.md).

### 7.2 Field Intensity Pulse (Dampened)

- **Issue:** `fieldIntensity = 0.3 + Math.sin(time * 2 + index) * 0.2` – energy field stroke opacity pulsed. Sine-based opacity caused brightness flicker when frame rate varied.
- **Fix:** Use constant `fieldIntensity = 0.4`.

### 7.3 Bond Shadow Blur (Removed)

- **Issue:** `ctx.shadowBlur = 8` on bond strokes. Shadow blur with sub-pixel drawing can produce inconsistent bloom frame-to-frame.
- **Fix:** Set `shadowBlur = 0` for bond strokes.

### 7.4 Non-Integer drawSize (Fixed)

- **Issue:** `drawSize = cachedFrame.canvas.width * scale` could be non-integer. `drawImage` with non-integer dimensions may anti-alias differently each frame.
- **Fix:** `drawSize = Math.round(cachedFrame.canvas.width * scale)` for stable scaling.

### 7.5 Default Molecule Pulse / Expand-Contract (Fixed)

- **Issue:** The whole molecule appeared to pulsate/expand/contract (brighter and dimmer).
- **Root cause:** **Halos** – when blending two cached frames, the halos (shadowBlur glow + halo gradients) overlap. At mid-blend both halos are visible → brighter; at single-frame → dimmer. This brightness swing causes the perceived pulse.
- **Fix:** Reduce halo intensity so overlap during blend is less pronounced:
  - **shadowBlur:** 1.5R → 0.6R, shadowColor alpha 0.25
  - **haloGradient:** all alpha values ~halved (0.14→0.08, 0.18→0.10, etc.)
  - **halo2:** 0.06→0.03, 0.04→0.02
  - Also: circular swirl (no ellipse rotation extent), reduced band alpha. Moving motes kept.

### 7.6 Phase Loop / Rotation Jitter (Fixed)

- **Issue:** Molecule atom rotation phase used `this.time` directly. When GC runs (every few seconds), `deltaTime` spikes to 50ms. Phase advanced by 50ms worth in one frame → visible rotation "jump" or jitter.
- **Fix:** Frame-based phase: `_moleculePhaseFrameCount` increments by 1 each frame. Phase = frameCount × (1/60) × 1.5 rad. Zero variable deltaTime → zero jitter. GC spikes cause brief rotation stall (1 frame of rotation for 50ms) instead of jump.

---

## 8. References

- **MOLECULE_ATOM_FRAME_CACHING.md** – Atom cache system (rotation)
- **MOLECULE_ANIMATION_NOTES.md** – Rotation timing, sub-frame blend
- **MODE1_ENSEMBLE_BACKGROUND_SYSTEM.md** – Draw-at-phase for smooth backgrounds
- **Fix Your Timestep** (Gaffer On Games) – Interpolation for display
