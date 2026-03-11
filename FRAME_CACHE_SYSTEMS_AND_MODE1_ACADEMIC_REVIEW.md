# Frame Cache Systems Review & Mode 1 Academic Implementation Guide

**Date:** January 30, 2026  
**Purpose:** Comprehensive review of all frame cache systems, academic research synthesis (MIT, Stanford, UCLA, Oxford, CVPR), and a research-backed method for implementing a smooth frame cache for Mode 1 (Ensemble) background.

---

## 1. Executive Summary

Mode 1 (Ensemble) background causes more pronounced jitter because it uses **draw-at-phase**—redrawing the full scene every frame at the exact phase. This produces smooth, continuous rotation but is expensive. Frame cache approaches have failed due to:

- **Cache + nearest-frame** → Stepping (discrete jumps)
- **Cache + blend** → Ghosting (flow dots appear doubled on lines)
- **Draw-at-phase** → Smooth but expensive → Jitter

This document reviews all frame cache systems, synthesizes academic research, and proposes a **Layered Hybrid + High-Frame-Count** approach that can achieve smooth animation with a frame cache.

---

## 2. Frame Cache Systems Inventory

### 2.1 Background Caches

| Mode | System | Technique | Frame Count | Smoothness | Notes |
|------|--------|-----------|-------------|------------|-------|
| **1 (Ensemble)** | `drawEnsembleClassicFrameAtPhase` | **Draw-at-phase** (no cache on hot path) | 128 (fallback only) | Continuous | Expensive per-frame → jitter |
| **1 (Ensemble)** | `getEnsembleClassicBackgroundFrame` | Cache + blend/interpolation | 128 | Ghosting | `getInterpolatedEnsembleFrame` causes flow-dot ghosting |
| **1 (Ensemble)** | `getEnsembleClassicBackgroundFrameNearest` | Cache + nearest | 128 | Stepping | Phase quantized to 128 steps |
| **1 (Ensemble)** | `getEnsembleClassicBackgroundFrameSmooth` | Cache + canvas alpha blend | 128 | Ghosting | Simpler blend, same ghosting |
| **2 (Individual)** | `getIndividualClassicBackgroundFrame` | Cache + nearest | 64 | 64 steps | `phase = time % 2π`, `idx = floor(phase/2π * 64)` |
| **3 (Bell)** | `drawBellModeBackgroundClassic` | **Draw-at-phase** (live) | N/A | Continuous | Uses `renderBellClassicBackgroundFrame` at exact phase |
| **3 (Bell)** | `getBellClassicBackgroundFrame` | Cache + nearest | 256 | 256 steps | Fallback during incremental build |

### 2.2 Particle & Effect Caches

| System | Technique | Frame Count | Sub-Frame Blend | Notes |
|--------|-----------|-------------|-----------------|-------|
| **Molecule atoms** | Cache + blend | 5 health buckets | Yes (`canvasB`, `blend`) | Smooth rotation via A+(B-A)*α |
| **Bullets** | Cache + blend | 64 | Yes | `getBulletFrame` returns frame + canvasB + blend |
| **Quantum plasma** | Cache + nearest | 64 | No | Phase-based index |
| **Default particles** | Cache + nearest | 64 | No | Phase-based |
| **Bell pair particles** | Cache + nearest | 64 | No | Phase-based |
| **Ethereal materials** | Cache + nearest | 64 | No | Phase-based |
| **Fire/explosion** | Cache + nearest | 32 lifetime | No | Progress-based |
| **Energy ripples** | Cache + nearest | 32 | No | Progress-based |

### 2.3 Key Variables Per System

| System | cycleSpan | speedScale | Phase Formula | Index Formula |
|--------|-----------|------------|---------------|---------------|
| **Ensemble** | 20π | 0.54 | `(time*0.54) % 20π` | `floor((phase/20π)*N)` |
| **Individual** | 2π | 1 (time) | `time % 2π` | `floor((phase/2π)*64)` |
| **Bell** | 20π/3 | 2.0 | `(time*2) % (20π/3)` | `floor((phase/span)*256)` |
| **Molecule atoms** | 2π | varies | Rotation phase | `idx1, idx2, t` → blend |
| **Bullets** | 2π | 8+ | `time * 8` | `idx1, idx2, blend` |

### 2.4 What Worked for Each System

- **Molecule atoms:** Sub-frame blend (`canvasA` at 1, `canvasB` at α) — atoms are **isolated circles**; blending two rotated positions gives smooth motion without ghosting because each atom is a soft blob.
- **Bullets:** Same pattern — isolated sprites, blend between adjacent frames.
- **Individual (Mode 2):** 64 frames, nearest only — acceptable stepping; simpler background (stars + lines).
- **Bell (Mode 3):** 256 frames, nearest only — finer steps; OR draw-at-phase for classic skin.
- **Ensemble (Mode 1):** Draw-at-phase — only way to avoid stepping + ghosting; **flow dots along lines** cause ghosting when blended.

**Root cause of Mode 1 failure:** The ensemble background has **flow dots that travel along field lines**. Blending frame A (dot at position 1) with frame B (dot at position 2) shows **both** positions → ghosting. Molecule atoms and bullets are **discrete objects**; blending shows a smooth transition. Flow dots are **continuous trails** along lines; blending shows two positions.

---

## 3. Academic Research Synthesis

### 3.1 Glenn Fiedler – "Fix Your Timestep!" (Gaffer On Games)

**Key insight:** Decouple simulation (fixed dt) from rendering (variable framerate). Use **interpolation for rendering**:

```
alpha = accumulator / dt   // How far between prev and current state
state_to_render = currentState * alpha + previousState * (1 - alpha)
```

**Application:** For frame caches, this means: when phase is between frame i and i+1, interpolate. For **physics state** (positions, orientations), linear interpolation works. For **pixel blending** of two images with moving elements, interpolation causes ghosting.

**Takeaway:** Fiedler's interpolation works for **state vectors** (position, quaternion). For **raster images** with moving objects, pixel-wise interpolation = ghosting. We need a different approach.

### 3.2 PerVFI (CVPR 2024) – Asymmetric Blending

**Source:** Wu et al., "Perception-Oriented Video Frame Interpolation via Asymmetric Blending"

**Findings:**
- Ghosting from blending two frames with same object in different positions.
- **Asymmetric Synergistic Blending (ASB):** One frame primary, other complementary; sparse quasi-binary mask constrains blending.
- Reduces but does not eliminate ghosting for sharp, high-contrast moving elements.

**Application:** Our `getInterpolatedEnsembleFrame` uses motion detection + asymmetric weights. Still causes ghosting for flow dots. PerVFI improves quality but cannot fully eliminate ghosting for sharp moving elements.

### 3.3 Oxford – Layered Static-Dynamic Separation

**Source:** Oxford VGG – Layered neural rendering, video decomposition

**Key technique:** Decompose each frame into **separate layers**—static (background, shadows) vs dynamic (moving objects). Process and cache layers independently. Recombine for final render.

**Application for Mode 1:** 
- **Static layer:** Gradient (no phase dependence) — cache once.
- **Dynamic layer:** Everything else (stars, particles, lines, flow dots, nodes, core) — all phase-dependent.
- **Problem:** The "dynamic" layer cannot be cached as a single image because it changes every frame. We'd need to either (a) cache at many phases (back to frame cache) or (b) render dynamic at exact phase (back to draw-at-phase).

**Refined application:** Cache **structure** (lines, nodes) at discrete phases; render **flow dots** at exact phase on top. But flow dots are *on* the lines—line positions depend on phase. So we can't cache "lines without dots" at one phase and draw dots at another—the geometry would be wrong.

### 3.4 MIT/Stanford – Temporal Interpolation

**MIT (Quaternion Slerp):** Constant angular velocity, geodesic path. For 1D phase, linear `t = phase/span` is correct.

**Stanford CS248:** Keyframe interpolation, C² continuity. Linear blend between keyframes is standard.

**Takeaway:** The math for frame selection (phase → idx1, idx2, t) is correct. The issue is **what we do with t**—blend pixels (ghosting) vs. something else.

### 3.5 BiM-VFI (CVPR 2025) – Distance Indexing

**Finding:** "Time-to-location ambiguity" — with non-uniform motion, infinitely many trajectories exist between frames. Networks average → blur. **Distance indexing** (how far object traveled) reduces ambiguity.

**Application:** Our animation is **uniform** (constant angular velocity). Phase directly maps to position. No ambiguity. Not directly applicable.

---

## 4. Proposed Solutions for Mode 1

### Option A: High-Frame-Count Nearest (Simplest)

**Idea:** Use 512 (or 1024) cached frames, nearest-frame only. Step size = 20π/512 ≈ 0.12 rad ≈ 7°. At 60fps, speedScale 0.54, we advance ~0.009 rad/frame → same frame for ~13 frames → step every ~0.2s. With 512 frames, each step is 1/512 of a full cycle.

**Pros:** No ghosting, no blend cost, significant per-frame savings (one `drawImage` vs full redraw).  
**Cons:** Possible subtle stepping; memory (512 × canvas size).  
**Implementation:** Increase `_ensembleClassicBgFrameCount` to 512, raise clamp in `ensureEnsembleClassicBackgroundCache`, switch draw path to `getEnsembleClassicBackgroundFrameNearest`.

### Option B: Layered Hybrid – Static Base + Cached Rotation + Lightweight Overlay

**Idea:** Decompose into:
1. **Layer 0 (Static):** Gradient — cache once, draw first.
2. **Layer 1 (Cached):** Stars, particles, lines, nodes, core — cache at N phases. Use nearest frame.
3. **Layer 2 (Overlay):** Flow dots only — render at **exact phase** on top. Flow dot position = `(x1 + (x2-x1)*flowPos, y1 + (y2-y1)*flowPos)` where `(x1,y1),(x2,y2)` are line endpoints from Layer 1.

**Problem:** Layer 1 lines are at phase P (from cached frame). Flow dot at phase Q needs line at phase Q. If we use cached frame at phase P for lines, the line positions are at P. The flow dot formula uses `flowPos = (phase*0.3 + i*0.1) % 1` — the parametric position along the line. The line from (x1,y1) to (x2,y2) is at phase P. So if we draw flow dot at phase Q, we're drawing it at position `flowPos(Q)` along the line at phase P. But the line at phase Q would be different (rotated). So the flow dot would be on the "wrong" line—the line from the cached frame, not the line at current phase.

**Conclusion:** Layer 2 overlay only works if we use the **same phase** for lines and flow dots. So we need either (a) full draw at phase, or (b) cached frame at nearest phase. We cannot "overlay flow dots at exact phase" on a cached frame at a different phase.

### Option C: Optimize Draw-at-Phase (Reduce Cost, Keep Smooth)

**Idea:** Keep draw-at-phase but reduce its cost to lessen jitter:
1. **Cache gradient** — ensemble gradient is static; add to `getCachedGradient`.
2. **Reduce element counts** — 300 stars → 180; 40 particles → 25; 20 lines → 15.
3. **Reduce shadowBlur** — use sparingly or lower values.
4. **Batch operations** — minimize state changes.

**Pros:** Keeps smooth continuous rotation, no ghosting, no stepping.  
**Cons:** Still more expensive than cache blit; jitter may persist if GC or other factors dominate.

### Option D: Reduced-Resolution Draw-at-Phase

**Idea:** Draw Mode 1 background at 50% resolution to offscreen buffer, then `drawImage` scale up to main canvas. Halves fill/stroke/arc operations.

**Pros:** Significant cost reduction.  
**Cons:** Slight softness; may need to tune for quality.

### Option E: Hybrid – Cache with Flow-Dot-Free Base

**Idea:** Cache frames **without** flow dots. Each frame has: gradient, stars, particles, lines (no dots), nodes, core. At runtime: blit cached frame (nearest phase) + draw flow dots at **exact phase**. Flow dot position along line: we need the line endpoints at current phase. So we must compute `(x1,y1),(x2,y2)` from phase for each of 20 lines, then `flowPos`, then draw the dot. That's 20 arcs—cheap. The lines in the cached frame are at phase P. The flow dots we draw use lines at phase Q (current). So we'd have flow dots at positions along lines that don't match the cached lines—the dots would be floating in space between where the cached lines are and where they "should" be. **Wrong.**

**Corrected:** We must draw flow dots **on the lines from the cached frame**. So we need line endpoints from the cached frame. Those are baked into the pixels—we don't have them as vectors. We could store them in the cache: each cached frame stores `{ canvas, lineEndpoints }` where `lineEndpoints[i] = {x1,y1,x2,y2}` for line i. Then at runtime: blit canvas, compute `flowPos` from phase, for each line get endpoints from cache, draw dot at `(x1+(x2-x1)*flowPos, y1+(y2-y1)*flowPos)`. But the cached frame's lines are at phase P. Our current phase is Q. So we're drawing flow dots at flowPos(Q) along lines at phase P. The flow dot "should" be at flowPos(Q) along lines at phase Q. The lines rotate—so the line at P is rotated relative to the line at Q. The flow dot would be on the wrong line. **Unless** we use the nearest cached frame—so P ≈ Q. Then the line at P is very close to the line at Q. The flow dot at flowPos(Q) along the line at P would be approximately correct. With 512 frames, P and Q differ by at most 1/512 of a cycle. The angular difference is ~0.7°. So the line at P is rotated by ~0.7° from the line at Q. The flow dot would be very slightly off—probably imperceptible.

**Implementation:** 
1. Cache frames without flow dots (or with flow dots—we'll overwrite).
2. Store `lineEndpoints[i]` per frame in cache.
3. At runtime: nearest frame by phase, blit canvas, draw 20 flow dots at `flowPos(phase)` along `lineEndpoints[i]` from that frame.

**Refinement:** Actually, if we're using nearest frame, the line endpoints from that frame ARE the correct lines for that phase. The flow dot at flowPos(phase) along those lines—but flowPos uses phase, and we have phase. So we'd draw the flow dot at the correct position along the cached frame's lines. The cached frame's lines are at phase P (nearest). Our phase is Q ≈ P. So we're drawing flow dot at flowPos(Q) along lines at P. For Q ≈ P, flowPos(Q) ≈ flowPos(P). So we're approximately correct. The subtlety: the flow dot slides along the line. If Q is between P and P+Δ, the flow dot should be between its position at P and at P+Δ. By using nearest frame P, we're snapping the flow dot to position at P. So we'd still have stepping in the flow dot! We haven't solved stepping—we've just moved it from "whole frame steps" to "flow dot steps." The flow dot would step every time we change frames. With 512 frames, that's 512 steps per cycle for the flow dot. Same as before. So Option E doesn't improve smoothness—it just reduces the amount we draw (no need to redraw lines, particles, etc.). We'd still have stepping in the flow dots unless we draw them at exact phase. And to draw them at exact phase, we need the line at exact phase. The line at exact phase requires either (a) drawing it (part of draw-at-phase) or (b) interpolating between two cached line sets. Interpolating line endpoints and drawing the dot at flowPos(phase) along the interpolated line—that would work! We'd have smooth flow dot motion. And we wouldn't be blending pixels—we'd be interpolating **geometry** (line endpoints) and drawing the dot. No ghosting.

**Option E Revised – Geometry Interpolation:**
1. Cache frames without flow dots. Store `lineEndpoints[i] = {x1,y1,x2,y2}` per frame.
2. At runtime: `slerpFrameSelection(phase)` → idx1, idx2, t.
3. For each line i: interpolate endpoints `ep = ep1*(1-t) + ep2*t`.
4. flowPos = (phase*0.3 + i*0.1) % 1.
5. Draw flow dot at (ep.x1 + (ep.x2-ep.x1)*flowPos, ep.y1 + (ep.y2-ep.y1)*flowPos).
6. Blit: draw frame1 at (1-t) opacity? No—we need the full image. We have frame1 and frame2 (without flow dots). We could blend them for the base (gradient, stars, lines, nodes, core)—that would ghost the lines and nodes. The lines and nodes move with phase. Blending frame1 and frame2 would ghost them. So we can't blend the base either.
7. **Simpler:** Use nearest frame for base (no blend). Draw flow dots at exact phase. For flow dots we need line at exact phase. Line endpoints at exact phase = interpolate between frame1 and frame2 endpoints: `ep = ep1*(1-t) + ep2*t`. So we use nearest frame for the **image** (or we could use frame1 only for simplicity), and we compute interpolated line endpoints from frame1 and frame2, then draw flow dots along those interpolated lines. The base image would be from frame1 (or nearest). So we'd have stepping in the base (lines, particles, etc.) but smooth flow dots. The base steps every frame change. With 512 frames, the base steps 512 times per cycle. The flow dots would be smooth. So we'd have smooth dots on a stepping background. The stepping in the background (lines, particles) might be acceptable with 512 frames—each step is small. And the flow dots, which are the most noticeable moving elements, would be smooth.

**Option E Final – Smooth Flow Dots, Cached Base:**
1. Cache N frames (256 or 512). Each frame: canvas (full draw without flow dots) + `lineEndpoints[20]`.
2. At runtime: slerpFrameSelection → idx1, idx2, t.
3. Base: use frame1.canvas (nearest) OR blend frame1 and frame2 for base. Blending base would ghost lines/particles. So use nearest: frame1.
4. Flow dots: interpolate line endpoints between frame1 and frame2: `ep[i] = lerp(ep1[i], ep2[i], t)`. Draw 20 flow dots at flowPos(phase) along ep[i].
5. Result: Base has stepping (nearest frame). Flow dots are smooth (interpolated geometry). With 256+ frames, base stepping may be acceptable. Flow dots are the main "moving" element—they'd be smooth.

---

## 5. Recommended Implementation: Option E (Smooth Flow Dots + Cached Base)

### 5.1 Rationale

- **Eliminates ghosting:** No pixel blending of flow dots; we draw them at interpolated positions.
- **Reduces cost:** Base is one `drawImage`; flow dots are 20 cheap arcs.
- **Smooth flow dots:** Geometry interpolation (Fiedler-style) for the critical moving elements.
- **Acceptable base stepping:** With 256–512 frames, base steps are small; lines/particles rotate in small increments.

### 5.2 Implementation Steps

1. **Modify cache builder:** In `ensureEnsembleClassicBackgroundCache`, when building each frame, also compute and store `lineEndpoints[i]` for i=0..19. Use the same math as `drawEnsembleClassicFrameAtPhase` for lines (angle1, angle2, x1, y1, x2, y2).

2. **Modify cached frame structure:** `{ canvas, lineEndpoints }` where `lineEndpoints` is array of `{x1,y1,x2,y2}`.

3. **New draw path:** `drawEnsembleModeBackground` for classic-ensemble:
   - Compute phase, slerpFrameSelection → idx1, idx2, t.
   - Get frame1, frame2 from cache.
   - Draw frame1.canvas to main ctx (base).
   - For each line i: `ep = lerp(frame1.lineEndpoints[i], frame2.lineEndpoints[i], t)`. flowPos = (phase*0.3 + i*0.1) % 1. flowX = ep.x1 + (ep.x2-ep.x1)*flowPos, flowY = ep.y1 + (ep.y2-ep.y1)*flowPos. Draw flow dot arc at (flowX, flowY).

4. **Frame count:** Start with 256; increase to 512 if base stepping is visible.

5. **Gradient caching:** Add ensemble gradient to `getCachedGradient` in `drawEnsembleClassicFrameAtPhase` (for fallback/build path) to reduce cost during cache build.

### 5.3 Fallback

If cache is not ready (incremental build), fall back to `drawEnsembleClassicFrameAtPhase` (current behavior).

---

## 6. Summary Table

| Approach | Smoothness | Ghosting | Cost | Complexity |
|----------|------------|----------|------|------------|
| Draw-at-phase (current) | Continuous | No | High | Low |
| Cache + nearest 128 | Stepping | No | Low | Low |
| Cache + blend | Smooth | Yes | Medium | Medium |
| High-frame nearest 512 | Fine stepping | No | Low | Low |
| **Option E (smooth dots + cache)** | **Smooth dots, fine base** | **No** | **Low** | **Medium** |

---

## 7. Implementation Status (Option E)

**Implemented:** January 30, 2026

- `computeEnsembleLineEndpoints(phase, w, h)` – returns 20 line endpoints for flow-dot geometry
- `drawEnsembleClassicFrameAtPhase(ctx, phase, w, h, skipFlowDots)` – optional `skipFlowDots` for cache base
- Cache builder stores `{ canvas, lineEndpoints }` per frame
- Draw path: blit nearest cached frame, interpolate line endpoints with `t`, draw flow dots at `flowPos(phase)` along interpolated lines
- Default frame count: 256
- Fallback: `drawEnsembleClassicFrameAtPhase` when cache not ready or frames lack `lineEndpoints`

---

## 8. References

1. Glenn Fiedler, "Fix Your Timestep!" – Gaffer On Games  
2. Wu et al., "Perception-Oriented Video Frame Interpolation via Asymmetric Blending," CVPR 2024 (PerVFI)  
3. Oxford VGG – Layered neural rendering, static-dynamic separation  
4. MIT – Quaternion/Slerp interpolation  
5. Stanford CS248 – Keyframe interpolation  
6. MODE1_ENSEMBLE_BACKGROUND_SYSTEM.md – Current Mode 1 design  
7. MODE1_ENSEMBLE_COMPREHENSIVE_ANALYSIS.md – Ghosting root cause  
8. SMOOTH_ROTATION_COMPREHENSIVE_PLAN.md – Frame blending approaches  
