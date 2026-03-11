# Mode 1 (Ensemble) Background System – Final Design & Replication Guide

**Date:** January 30, 2026  
**Status:** Implemented and stable. Uses **Option E frame cache** (cache base + geometry interpolation). Primary path blits cached frames and interpolates geometry; fallback to `drawEnsembleClassicFrameAtPhase` when cache not ready.

This document describes the **current** Mode 1 classic ensemble background system, the changes that led to it, how it differs from the previous “advanced” pipeline and from Mode 2 / Mode 3, and how it compares with Mode 2 / Mode 3.

---

## 1. Executive Summary

Mode 1 (Ensemble QM) uses the **Option E frame cache** system: each frame we look up two cached frames via `slerpFrameSelection`, blit the nearest base frame, and interpolate **geometry** (line endpoints, particles, nodes) between the two frames—then draw flow dots at exact phase along the interpolated lines. We do **not** blend pixels (which would cause ghosting). The result is:

- **Smooth continuous rotation** – geometry interpolation between cached frames; flow dots at exact phase  
- **No ghosting** – no cross-frame blending, so no double “lights” on lines  
- **Lower per-frame cost** – one `drawImage` + lightweight geometry interpolation vs full redraw  
- **64-frame cache** (default, clamp 32–1024) – stores `{ canvas, lineEndpoints, particleData, nodeData }` per frame  

**Fallback:** When cache is not ready (e.g. during incremental build or dimension mismatch), the path falls back to `drawEnsembleClassicFrameAtPhase` (live draw at exact phase).

---

## 2. Does Mode 1 Use a Preloaded Frame Cache? (Yes.)

**Short answer:** **Yes.** On the main draw path, Mode 1 (Ensemble) **does** use a preloaded frame cache, similar in spirit to Mode 2 and Mode 3, but with **geometry interpolation** instead of nearest-frame-only.

**How Mode 1 works (Option E – cache + geometry interpolation):**

- **At boot/resize:** Build N frames (default 64) via `ensureEnsembleClassicBackgroundCache`. Each frame stores: `canvas` (base draw via `drawEnsembleClassicFrameBaseOnly`), `lineEndpoints`, `particleData`, `nodeData`.
- **Each frame:** `slerpFrameSelection(phase, frameCount, span)` → `idx1`, `idx2`, `t`. Blit nearest base frame (`f1` or `f2`). Interpolate line endpoints: `ep = lerp(ep1, ep2, t)`. Draw flow dots at `flowPos(phase)` along `ep`. Interpolate particles and nodes similarly. Draw core with phase-based pulsing.

**How this differs from Mode 2 / Mode 3:**

- **Mode 2 (Individual)** – Cache + nearest-frame only; no geometry interpolation.
- **Mode 3 (Bell)** – Cache + nearest-frame only; no geometry interpolation.
- **Mode 1 (Ensemble)** – Cache + **geometry interpolation** (slerp between two frames) + flow dots at exact phase. Avoids ghosting because we interpolate **positions**, not pixels.

**Fallback:** When cache is invalid (dimensions mismatch, not yet built), the path calls `drawEnsembleClassicFrameAtPhase` for a full live redraw.
- REMOVED: So Mode 1 does **not** follow the “preload frame cache at the beginning, then blit a cached frame each frame” pattern. It uses **draw-at-phase**: redraw the scene at the exact phase every frame.

**Why the cache still exists:**  
The 128-frame cache is built for **fallback** only (e.g. if something calls `getEnsembleClassicBackgroundFrame`). The normal Mode 1 background render path does not call that; it only calls `drawEnsembleClassicFrameAtPhase`. So for the animated feature you see in Mode 1, there is no preloaded frame cache in use—it’s the one exception among the game’s frame-cache-style animated features.

---

## 3. Changes Made (Summary)

| Step | What changed | Why |
|------|----------------|-----|
| 1 | **Nearest-frame only** – `getEnsembleClassicBackgroundFrame` stopped calling `getInterpolatedEnsembleFrame`; it returned a single cached frame (nearest by phase). | Eliminated ghosting (multiple lights on lines) caused by blending two frames where the “flow dot” was in different positions. |
| 2 | **Time/speed** – Time source `Date.now() * 0.001` → `Date.now() * 0.0015`; `speedScale` 0.7 → 0.03 (per ARCHITECTURE). | Align with doc and calmer base speed. |
| 3 | **Stepping** – With nearest-frame only, rotation appeared in discrete steps (256 then 512 frames). | Fewer frames = visible steps; increasing frames helped but user wanted “64 or double” with smooth motion. |
| 4 | **Draw-at-phase** – Introduced `drawEnsembleClassicFrameAtPhase(ctx, phase, w, h)` and made the main draw path call it every frame with `phase = (time * speedScale) % cycleSpan`. Cache no longer used on hot path. | Smooth continuous motion without blending; no stepping; cache size can stay small (64–128). |
| 5 | **Cache size** – Default frame count set to **128** (double 64); clamp max 128. Cache built by calling `drawEnsembleClassicFrameAtPhase` per frame. | Small cache for fallback only; main path is draw-at-phase. |
| 6 | **Speed tuning** – `speedScale` increased to **0.54** (18× base 0.03) via 3×, 3×, 2×. | User-tuned “perfect” speed. |

---

## 4. Current System (Mode 1 Classic Ensemble)

### 4.1 Data flow

```
Every frame (drawEnsembleModeBackground):
  time = Date.now() * 0.0015
  speedScale = 0.54
  cycleSpan = Math.PI * 20
  phase = (time * speedScale) % cycleSpan   // continuous, not quantized
  frameSelection = slerpFrameSelection(phase, frameCount, span)  → idx1, idx2, t
  Blit nearest base frame (f1 or f2)
  Interpolate lineEndpoints, particleData, nodeData between f1 and f2 with t
  Draw flow dots at flowPos(phase) along interpolated lines
  Draw particles, nodes, core with phase-based pulsing
  → done (cache + geometry interpolation; fallback: drawEnsembleClassicFrameAtPhase)
```

### 4.2 Key functions

- **`drawEnsembleModeBackground()`**  
  For skin `classic-ensemble`: computes `phase` from `time`, calls `slerpFrameSelection`, blits nearest cached base frame, interpolates geometry (lineEndpoints, particleData, nodeData) between two frames, draws flow dots at exact phase along interpolated lines. Falls back to `drawEnsembleClassicFrameAtPhase` when cache not ready.

- **`drawEnsembleClassicFrameAtPhase(ctx, phase, w, h)`**  
  Draws one full ensemble background frame at the given **phase** (radians) into `ctx`: gradient, starfield, particles, field lines, flow dots, nodes, central core. Same math as the old cache builder (phase in all sin/cos terms). Called every frame on the main canvas for the hot path; also used when building the cache.

- **`ensureEnsembleClassicBackgroundCache(frameCount)`**  
  Builds a cache of `frameCount` frames (default 128, clamped 32–128). Each frame is an offscreen canvas; for frame `i`, `phase = (i / frameCount) * cycleSpan`, then `drawEnsembleClassicFrameAtPhase(ctx, phase, w, h)` on that canvas. Used only to populate the cache for fallback.

- **`getEnsembleClassicBackgroundFrame(time)`**  
  Returns a **single** cached frame (nearest by phase). Used only when something needs a cached frame (e.g. fallback or other code paths). **Not** used by the main Mode 1 draw path.

### 4.3 Parameters (current)

| Parameter | Value | Location |
|-----------|--------|----------|
| Time source | `Date.now() * 0.0015` | `drawEnsembleModeBackground()` |
| speedScale | `0.54` | `drawEnsembleModeBackground()` |
| cycleSpan | `Math.PI * 20` | `drawEnsembleModeBackground()`, cache |
| Cache frame count | 64 (default), clamp 32–1024 | `_ensembleClassicBgFrameCount`, `ensureEnsembleClassicBackgroundCache` |

---

## 5. How This Differs From the “Advanced” Version

The **advanced** pipeline (no longer used on the Mode 1 hot path) was:

1. **Pre-rendered frame cache** – Many frames (256, then 512), each a full-screen image at one phase.
2. **Slerp-style frame selection** – `slerpFrameSelection(phase, frameCount, span)` returned two indices `idx1`, `idx2` and an interpolation factor `t` in [0,1].
3. **Sub-frame interpolation** – For almost every frame (`t` not near 0 or 1), the code called **`getInterpolatedEnsembleFrame(frame1, frame2, t)`**, which:
   - Read `ImageData` from both frames
   - Optionally ran **motion detection** (`detectMotionBetweenFrames`) to find regions where the two frames differed
   - Blended pixels with **asymmetric weights** in motion regions (PerVFI-style)
   - Wrote the result to a new canvas and returned it
4. **Result:** Smooth-looking rotation in principle, but:
   - **Ghosting** – Blending two frames where the “flow dot” is in different positions showed multiple lights on the same line.
   - **Jitter** – Heavy per-frame work (ImageData read, motion detection, pixel loop, putImageData) and weight flips could cause frame-time variance and visible jitter.

The **current** system differs as follows:

| Aspect | Advanced (pixel blend, old) | Current (Option E – geometry interpolation) |
|--------|----------------|--------------------------|
| Hot path | Cache lookup → often blend two frames via pixel interpolation | Compute phase → draw once at that phase |
| Smoothness | From blending adjacent cached frames | From continuous phase; no discrete steps |
| Ghosting | Yes (blending moving elements) | No (single phase, no blend) |
| Jitter risk | Higher (heavy per-frame work) | Lower (one draw pass, no ImageData) |
| Cache role | Primary (every frame) | Fallback only (main path doesn’t use it) |
| Cache size | Large (256–512) | 64 (default), clamp 32–1024 |
| Motion detection / asymmetric blending | Used | Not used on hot path |

The advanced pixel-blending pipeline is still in the codebase (`getInterpolatedEnsembleFrame`, `detectMotionBetweenFrames`) for reference; the Mode 1 classic-ensemble **draw path** uses Option E (cache + geometry interpolation).

---

## 6. Comparison With Mode 2 and Mode 3

All three modes use **cyclic** backgrounds (phase-based animation). The difference is **how** the current frame is chosen and drawn.

### 6.1 Mode 2 (Individual) – Cache + nearest-frame

- **Cache:** 64 frames (`_individualClassicBgFrameCount`), built in `ensureIndividualClassicBackgroundCache`. Each frame is one phase over a `2π` cycle.
- **Lookup:** `getIndividualClassicBackgroundFrame(time)` → `phase = time % (2π)` → `idx = floor((phase / (2π)) * frameCount) % frameCount` → return `cache.frames[idx]`.
- **Draw:** `drawImage(cachedFrame.canvas, ...)`. **Nearest-frame only;** no blending.
- **Smoothness:** Depends on frame count (64). Can show slight stepping; no ghosting.

### 6.2 Mode 3 (Bell Pair) – Cache + nearest-frame

- **Cache:** 256 frames (`_bellClassicBgFrameCount`), cycleSpan `20π/3`, speedScale 2.0. Built in `ensureBellClassicBackgroundCache`; each frame is drawn via `renderBellClassicBackgroundFrame(ctx, w, h, phase)`.
- **Lookup:** `getBellClassicBackgroundFrame(time)` → `phase = (time * speedScale) % span` → `idx = floor((phase / span) * frameCount) % frameCount` → return `cache.frames[idx]`.
- **Draw:** `drawImage(cachedFrame.canvas, ...)`. **Nearest-frame only;** no blending.
- **Smoothness:** 256 frames give smaller steps than Mode 2; still discrete. No ghosting.

### 6.3 Mode 1 (Ensemble) – Cache + geometry interpolation (Option E)

- **Cache:** 64 frames (default), built with `drawEnsembleClassicFrameBaseOnly`; stores `{ canvas, lineEndpoints, particleData, nodeData }` per frame.
- **Hot path:** `slerpFrameSelection(phase)` → blit nearest base frame, interpolate geometry between f1 and f2, draw flow dots at exact phase along interpolated lines.
- **Draw:** Blit cached base + interpolated particles/lines/nodes + flow dots at exact phase. Fallback: `drawEnsembleClassicFrameAtPhase` when cache not ready.
- **Smoothness:** Continuous (geometry interpolation + flow dots at exact phase). No ghosting (no pixel blending).

### 6.4 Summary table

| Mode | Primary technique | Cache used on hot path? | Blending? | Smoothness | Ghosting risk |
|------|-------------------|--------------------------|-----------|------------|----------------|
| 1 (Ensemble) | Cache + geometry interpolation | Yes | Geometry only (no pixels) | Continuous | No |
| 2 (Individual) | Cache + nearest-frame | Yes | No | 64 steps | No |
| 3 (Bell) | Cache + nearest-frame | Yes | No | 256 steps | No |

---

## 7. Replication Guide – “Draw-at-Phase” for Smooth Continuous Motion

Use this pattern when you want:

- Smooth, continuous rotation (or any phase-driven animation) with **no stepping**
- **No ghosting** (no blending of two frames that contain the same object in different positions)
- A **small cache** (e.g. 64 or 128 frames) only for fallback, not for every frame

### Step 1: One drawing function that takes phase

- Implement a function that draws **one** frame of the background at an **arbitrary phase** (in radians or 0–1):

  ```js
  drawBackgroundAtPhase(ctx, phase, w, h) {
    // All animated elements use `phase` in their math, e.g.:
    // angle = phase * 0.2 + i * 0.4;
    // flowPos = (phase * 0.3 + i * 0.1) % 1;
    // ... gradient, particles, lines, dots, etc.
  }
  ```

- Ensure the animation is **cyclic**: the same `phase` (mod cycle) always produces the same image (e.g. cycleSpan = 20π so all multipliers wrap together).

### Step 2: Main draw path – use phase from time, no cache

- Each frame, compute a **continuous** phase from time:

  ```js
  const time = Date.now() * 0.0015;  // or your time source
  const speedScale = 0.54;           // tune for speed
  const cycleSpan = Math.PI * 20;    // match your cycle
  const phase = ((time * speedScale) % cycleSpan + cycleSpan) % cycleSpan;
  ```

- Call your draw function directly on the main canvas:

  ```js
  this.drawBackgroundAtPhase(this.ctx, phase, this.canvas.width, this.canvas.height);
  ```

- Do **not** look up a cached frame; do **not** blend two frames. One draw at the exact phase.

### Step 3: Optional small cache for fallback

- If you need a fallback (e.g. when draw-at-phase fails or for other features), build a **small** cache (64 or 128 frames):

  ```js
  for (let i = 0; i < frameCount; i++) {
    const phase = (i / frameCount) * cycleSpan;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    this.drawBackgroundAtPhase(ctx, phase, w, h);
    frames.push({ canvas: off });
  }
  ```

- Fallback lookup: `phase = (time * speedScale) % cycleSpan` → nearest index → `return frames[idx]`. No blending.

### Step 4: Tuning

- **Speed:** Adjust `speedScale` (e.g. 0.03 = calm, 0.54 = current Mode 1).
- **Time source:** `Date.now() * k`; smaller `k` = slower global time (e.g. 0.0015 for calm).
- **Cycle:** Set `cycleSpan` so all phase-based multipliers (0.1, 0.2, 0.3, …) align at wrap (e.g. 20π).

### What to avoid when replicating

- Do **not** blend two cached frames to “smooth” between them if the scene has **moving elements** (e.g. a dot along a line). That causes ghosting.
- Do **not** use the cache on the hot path if you want truly continuous motion; use draw-at-phase.
- Do **not** add motion detection / asymmetric blending unless you accept the cost and the risk of ghosting for sharp moving objects.

---

## 8. File and function reference (game.js)

| Item | Purpose |
|------|--------|
| `drawEnsembleModeBackground()` | Entry for Mode 1 background; classic-ensemble uses Option E (cache + geometry interpolation). |
| `drawEnsembleClassicFrameAtPhase(ctx, phase, w, h)` | Draws one ensemble frame at given phase; used every frame on hot path and when building cache. |
| `ensureEnsembleClassicBackgroundCache(frameCount)` | Builds 32–128 cached frames via `drawEnsembleClassicFrameAtPhase`. |
| `getEnsembleClassicBackgroundFrame(time)` | Returns nearest cached frame by phase; used for fallback only. |
| `_ensembleClassicBgFrameCount` | Default 64. |
| Time in draw path | `Date.now() * 0.0015`. |
| speedScale in draw path | `0.54`. |
| cycleSpan | `Math.PI * 20`. |

---

## 9. How to Create a Preloaded Frame-Cache Version of Mode 1 (Like Mode 2 / Mode 3)

If you want Mode 1 to use the **same pattern as Mode 2 and Mode 3**—preload a frame cache at the beginning, then each frame just **blit** the right cached frame—here is how.

### 9.1 What “preloaded frame cache” means here

- **At boot (or on resize):** Build N full-screen frames, each at a different phase over one cycle, and store them (e.g. `_ensembleClassicBgCache.frames`). This is already done by `ensureEnsembleClassicBackgroundCache(frameCount)` and is **already triggered in `runPreload()`** via the task `'Backgrounds: Ensemble Classic Frames'`.
- **Each frame:** From current time, compute phase → pick the **nearest** cached frame (no blending) → `drawImage(cachedFrame.canvas, ...)`.

So the only change from the current design is the **draw path**: instead of calling `drawEnsembleClassicFrameAtPhase(this.ctx, phase, w, h)` every frame, you call `getEnsembleClassicBackgroundFrame(time)` and then `drawImage(cachedFrame.canvas, ...)`. The cache is already preloaded; you just use it.

### 9.2 Steps to implement

1. **Use the cache on the draw path**  
   In `drawEnsembleModeBackground()`, for skin `classic-ensemble`, replace the draw-at-phase block with:
   - `time = Date.now() * 0.0015` (same time source as now).
   - `cachedFrame = this.getEnsembleClassicBackgroundFrame(time)`.
   - If `cachedFrame && cachedFrame.canvas`, then `this.ctx.drawImage(cachedFrame.canvas, 0, 0, this.canvas.width, this.canvas.height)` and return.

2. **Align speed with current feel (optional)**  
   Right now the draw path uses `speedScale = 0.54`. `getEnsembleClassicBackgroundFrame` uses `speedScale = 0.03` internally. So if you switch to the cache path without changing that, the animation will be much slower. To match current speed, either:
   - Change the `speedScale` inside `getEnsembleClassicBackgroundFrame` to `0.54`, or  
   - Define a single shared constant (e.g. `this._ensembleClassicSpeedScale = 0.54`) and use it both in the draw path and in `getEnsembleClassicBackgroundFrame`.

3. **Choose frame count**  
   The cache is built with `_ensembleClassicBgFrameCount` (default 128). For a preloaded cache version:
   - **64 or 128 frames** – Same as “64 or double” you had before; rotation will show **discrete steps** (one frame per step). No ghosting.
   - **256 or 512 frames** – Finer steps, smoother-looking rotation, more memory and preload time. Still no blending, so no ghosting.

   The clamp in `ensureEnsembleClassicBackgroundCache` currently allows 32–128. If you want 256+ for smoother stepping, increase the max (e.g. `Math.min(512, frameCount)`).

4. **Do not blend frames**  
   Keep using **nearest-frame only** in `getEnsembleClassicBackgroundFrame` (as it is now: `nearestIdx = t <= 0.5 ? idx1 : idx2`; return that frame). Do **not** reintroduce `getInterpolatedEnsembleFrame` or any pixel blending between two cached frames, or ghosting will return.

### 9.3 What you get and what you give up

| Aspect | Draw-at-phase (current) | Preloaded cache (this version) |
|--------|--------------------------|----------------------------------|
| Preload | Cache built but not used on hot path | Cache built in `runPreload`, used every frame |
| Per-frame work | Full redraw at exact phase | One lookup + one `drawImage` (cheap) |
| Smoothness | Continuous (no stepping) | Depends on frame count (64/128 = visible steps; 256+ = finer) |
| Ghosting | None | None (if you keep nearest-frame only) |
| Same as Mode 2/3 | No | Yes (preload then blit) |

So you get a **working** preloaded frame-cache Mode 1 that behaves like Mode 2 and Mode 3. The trade-off is **stepping**: with 64 or 128 frames the rotation will advance in discrete jumps. Using more frames (256 or 512) reduces stepping at the cost of more memory and preload time.

### 9.4 Code change summary

**In `drawEnsembleModeBackground()`**, replace:

```js
// Smooth continuous motion: draw at exact phase each frame (no cache stepping, no blending/ghosting)
const speedScale = 0.54;
const cycleSpan = Math.PI * 20;
const phase = ((time * speedScale) % cycleSpan + cycleSpan) % cycleSpan;
const w = this.canvas.width || 0;
const h = this.canvas.height || 0;
if (w > 0 && h > 0) {
    try {
        this.drawEnsembleClassicFrameAtPhase(this.ctx, phase, w, h);
        return;
    } catch (e) { ... }
}
```

with:

```js
// Preloaded frame cache (same pattern as Mode 2 / Mode 3): lookup nearest frame, blit
const cachedFrame = this.getEnsembleClassicBackgroundFrame(time);
if (cachedFrame && cachedFrame.canvas && cachedFrame.canvas.width > 0 && cachedFrame.canvas.height > 0) {
    try {
        this.ctx.drawImage(cachedFrame.canvas, 0, 0, this.canvas.width, this.canvas.height);
        return;
    } catch (e) { ... }
}
```

**In `getEnsembleClassicBackgroundFrame(time)`**, set `speedScale` to `0.54` (or your chosen value) so the animation speed matches.

**Optional:** In `runPreload()`, the task already calls `ensureEnsembleClassicBackgroundCache(this._ensembleClassicBgFrameCount || 256)`. The default is 128; if you want more frames for smoother stepping, set `_ensembleClassicBgFrameCount` to 256 (or 512) and raise the clamp in `ensureEnsembleClassicBackgroundCache` so the cache can be that large.

That is the full recipe for a working Mode 1 that uses a preloaded frame cache like the other modes.

---

## 10. Why It’s Not Smooth With Lower Frames (and How to Get Smooth Transition)

### 10.1 Why nearest-frame looks stepped

With **nearest-frame only**, we don’t draw anything “between” two cached frames. We pick one of N frames per frame (phase is quantized to N steps per cycle). So with 64 frames you get 64 distinct images per cycle; the rotation **jumps** from one to the next. There is no in-between state, so the motion is **stepped**, not smooth.

### 10.2 How to get smooth transition with lower frames

To get a **smooth transition** with fewer frames (e.g. 64 or 128), we have to show something **in between** two cached frames. That means **blending** (interpolating) between frame A and frame B: e.g. at time t between 0 and 1, draw `(1−t)*frameA + t*frameB`. That gives a smooth visual transition instead of a jump.

**Trade-off:** When the two frames contain the same **moving** object (e.g. the “flow dot” on the lines) in **different positions**, the blend shows **both** positions at once → **ghosting** (multiple lights on the same line). So:

- **Nearest-frame only** → No ghosting, but stepped (not smooth) with 64/128 frames.
- **Blend between frames** → Smooth transition, but possible ghosting of moving elements.

### 10.3 What we can do

| Option | Description | Result |
|--------|-------------|--------|
| **A. Blending on** | When phase is between two frame indices, blend those two frames (e.g. `getInterpolatedEnsembleFrame`). | Smooth transition with 64/128 frames; possible ghosting of flow dots. |
| **B. Motion-aware blending** | Same as A but use motion detection and asymmetric weights (PerVFI-style) in motion areas to favor one frame. | Can reduce ghosting; may still show some. |
| **C. More frames, nearest-frame** | Keep nearest-frame only but use 256+ frames so steps are smaller. | Smoother-looking rotation, no ghosting; more memory/preload. |
| **D. Draw-at-phase** | Don’t use cache on hot path; draw at exact phase every frame. | Fully smooth, no ghosting, no stepping; per-frame draw cost. |

To get **smooth transition with lower frames**, we use **A** (or **B**). The code supports **A** via `getInterpolatedEnsembleFrame`; when blending is enabled in `getEnsembleClassicBackgroundFrame`, we call it whenever we’re between two frames (e.g. `t` not near 0 or 1). You can use 64 or 128 frames and get smooth motion, with the understanding that ghosting may appear; if it’s too strong, try **B** (motion-aware, already in `getInterpolatedEnsembleFrame`) or **C** (more frames, nearest-frame only).

---

## 11. References

- **ARCHITECTURE.md** – Mode 1 ensemble background (cycleSpan, time, speedScale, “nearest-frame lookup (no cross-frame blending)”).
- **MODE1_ENSEMBLE_COMPREHENSIVE_ANALYSIS.md** – Root cause of ghosting (blending) and jitter; recommendation for nearest-frame / draw-at-phase.
- **MOTION_AWARE_CORRECT_IMPLEMENTATION.md** – Legacy motion-aware blending (not used on Mode 1 hot path).

---

## 12. Problem Resolution: Stepping and Blur (Fix History)

This section documents the problem we faced when implementing a frame cache for Mode 1, the approaches we tried, and the final fix.

### 12.1 The Problem

After implementing a frame-rate cache system for Mode 1 (Ensemble) background, the animation exhibited:

1. **Stepping** – Rotation advanced in discrete jumps instead of continuous motion.
2. **Blur / Ghosting** – Moving elements (flow dots along field lines) appeared doubled or smeared.

### 12.2 Approaches Tried

| Approach | Implementation | Result |
|---------|----------------|--------|
| **A. Cache + nearest-frame** | `getEnsembleClassicBackgroundFrameNearest(time)` → pick single cached frame by phase → `drawImage(cachedFrame)`. | **Stepping** – Phase quantized to 128 discrete steps; rotation jumped between frames. No blur/ghosting. |
| **B. Cache + frame interpolation** | `getEnsembleClassicBackgroundFrameSmooth(time)` → blend adjacent frames with `alpha = t` (sub-frame position) via canvas compositing. Inspired by "Fix Your Timestep" (Gaffer On Games). | **Stepping + Blur** – Blending two frames where flow dots are in different positions showed both positions at once (ghosting). Canvas compositing caused blur. |
| **C. Draw-at-phase** | Compute continuous `phase` from time; call `drawEnsembleClassicFrameAtPhase(ctx, phase, w, h)` every frame. No cache lookup, no blending. | **Smooth + Sharp** – Continuous phase, no stepping. No blending, no ghosting or blur. |

### 12.3 Why Blending Failed

The Mode 1 background has **moving elements** – flow dots that travel along field lines. Each cached frame captures the scene at one phase; the flow dot is at one position. When we blend two adjacent frames (e.g. frame N and N+1), we get:

- Frame N: flow dot at position A  
- Frame N+1: flow dot at position B  
- Blend: both positions visible → **ghosting** (double lights on lines) and **blur** (smeared transition)

This matches PerVFI (CVPR 2024) and MODE1_ENSEMBLE_COMPREHENSIVE_ANALYSIS.md: blending frames with moving elements causes ghosting. Motion-aware blending can reduce it but not eliminate it for sharp, high-contrast elements like the flow dots.

### 12.4 The Fix: Option E (Cache + Geometry Interpolation)

**Solution:** Use **Option E** as the primary path: cache base + geometry interpolation + flow dots at exact phase. Fallback to draw-at-phase when cache not ready.

**How it works:**

1. Each frame, compute phase and `slerpFrameSelection(phase)` → idx1, idx2, t.
2. Blit nearest cached base frame (f1 or f2).
3. Interpolate lineEndpoints, particleData, nodeData between f1 and f2 with t.
4. Draw flow dots at `flowPos(phase)` along interpolated lines.
5. Draw particles, nodes, core with phase-based pulsing.

No pixel blending (avoids ghosting). Geometry interpolation gives smooth motion. Flow dots at exact phase.

**Code location:** `drawEnsembleModeBackground()` in `game.js`, when `skinId === 'classic-ensemble'`.

### 12.5 Trade-offs

| Aspect | Option E (current) | Draw-at-phase (fallback) | Cache + pixel blend |
|--------|-------------------|--------------------------|---------------------|
| Smoothness | Continuous (geometry interpolation) | Continuous | Smooth (but ghosting) |
| Ghosting/Blur | None | None | Yes |
| Per-frame cost | One `drawImage` + geometry interpolation | Full redraw | Blend + `drawImage` |
| Cache on hot path | Yes | No | Yes |

Option E gives smooth motion without ghosting and lower per-frame cost than full draw-at-phase.

### 12.6 Summary

- **Problem:** Cache + pixel blending → ghosting. Cache + nearest only → stepping.  
- **Fix:** Option E – cache base + geometry interpolation + flow dots at exact phase.  
- **Result:** Smooth continuous rotation, no stepping, no ghosting, lower per-frame cost than full draw-at-phase.

This design is the one implemented for Mode 1 (Ensemble) classic-ensemble background.
