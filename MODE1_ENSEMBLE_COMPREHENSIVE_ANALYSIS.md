# Mode 1 (Ensemble) Comprehensive Review & Analysis

**Date:** January 28, 2026  
**Scope:** Ghosting (lights on lines), jitter (ship, molecules, particles) — **analysis only, no code changes.**

---

## 1. Executive Summary

Mode 1 (Ensemble QM) uses an advanced background pipeline inspired by MIT/Stanford/PerVFI literature: pre-rendered frame cache, sub-frame interpolation, motion-aware asymmetric blending, and Slerp-based frame selection. Despite this, **documented fixes in ARCHITECTURE.md were never fully applied in code**. The implementation still uses **cross-frame blending** and **faster time/speed** than the doc specifies, which directly explains **ghosting** (multiple lights on lines). **Jitter** of ship/molecules/particles may be exacerbated by heavy per-frame interpolation work and motion-detection weight flips; a full causal chain for global jitter requires further profiling.

---

## 2. Literature & Best Practices Reviewed

### 2.1 MIT – Quaternion / Slerp (Rotation Interpolation)

- **Source:** MIT quaternion interpolation (e.g. 2.998, manipulation.csail.mit.edu), Shoemake Slerp.
- **Relevance:** Constant angular velocity, geodesic path between orientations.
- **Application in game:** `slerpFrameSelection()` (lines 18755–18784) maps phase to frame indices and interpolation factor `t`. The code uses **linear** phase→frame mapping, not true quaternion Slerp; the name reflects the goal (smooth rotation), not the math.
- **Takeaway:** For 1D rotation (phase), linear `t = (phase/span)*frameCount` is correct for constant angular velocity. No issue here.

### 2.2 Stanford CS248 – Keyframe / Temporal Interpolation

- **Source:** Stanford CS248 (e.g. interpolation slides, keyframe animation).
- **Relevance:** Linear vs cubic/Hermite interpolation; dense keyframes vs sparse; temporal coherence.
- **Application in game:** Mode 1 uses **linear** alpha blending between two cached frames. Docs mention avoiding “jerky” motion; linear interpolation between adjacent frames is standard and appropriate.
- **Takeaway:** Linear blend is fine. The problem is **blending at all** for content with moving elements (see PerVFI).

### 2.3 PerVFI (CVPR 2024) – Asymmetric Blending & Ghosting

- **Source:** Wu et al., “Perception-Oriented Video Frame Interpolation via Asymmetric Blending,” CVPR 2024.
- **Findings:**
  - **Ghosting** comes from blending two frames that contain the same object in **different positions**; the blend shows both positions.
  - **Asymmetric Synergistic Blending (ASB):** In motion regions, use one frame as primary and the other as complementary (quasi-binary mask), instead of a 50/50 blend.
  - Motion estimation / detection drives where to use asymmetric vs normal blending.
- **Application in game:** `getInterpolatedEnsembleFrame()` (18711–18752) implements motion detection (`detectMotionBetweenFrames`) and asymmetric weights (smoothstep, motion threshold 0.7, gradual blend). So the **intent** matches PerVFI.
- **Takeaway:** Even with ASB, **any** blending of two frames that have a “light” at different positions on a line will show multiple positions if motion detection is imperfect or if the light spans many pixels. The literature’s fix for strong ghosting is either **no blending** in high-motion regions or **nearest-frame only** (no blend). Our docs explicitly chose “nearest-frame lookup (no cross-frame blending)” for Mode 1, but code still blends.

### 2.4 Canvas 2D / Premultiplied Alpha

- **Source:** MDN, Inigo Quilez, WebGL/Canvas alpha blending.
- **Relevance:** Correct alpha handling avoids brightness pulsation and edge artifacts.
- **Application in game:** Code uses straight alpha from `getImageData`, blends in straight alpha, and relies on `putImageData` re-premultiplication. Comments and MOTION_AWARE_CORRECT_IMPLEMENTATION.md state this correctly.
- **Takeaway:** Alpha handling is consistent with “correct” implementation. Pulsation fixes (e.g. “lighter” compositing) are for the **canvas-draw path**; the current **pixel loop** path uses straight alpha. No obvious alpha bug identified as cause of ghosting/jitter.

### 2.5 Oxford / Cambridge – Temporal Coherence

- **Source:** Occlusion-aware temporal interpolation (e.g. Cambridge APSIPA), keyframe inbetweening.
- **Relevance:** Avoid flicker and popping; smooth transitions; temporal consistency.
- **Application in game:** A **nearest-frame only** (no blend) policy gives maximal temporal consistency for discrete frames and avoids “halfway” ghost positions. Blending trades consistency for smoothness and, with moving elements, introduces ghosting.
- **Takeaway:** For a background with moving “lights” along lines, nearest-frame is the safe choice and matches ARCHITECTURE.md.

---

## 3. Documented vs Implemented Behavior (Critical Mismatches)

### 3.1 ARCHITECTURE.md – Mode 1 Ensemble Background (Line 22)

Documented fix:

- **(a)** `cycleSpan = 20π` so all animated layers align at wrap.  
  **Code:** Implemented. `cycleSpan = Math.PI * 20` (line 18458). ✅  
- **(b)** “Sampling pre-rendered frames evenly and **using Mode 2’s nearest-frame lookup (no cross-frame blending)**”.  
  **Code:** **Not implemented.** `getEnsembleClassicBackgroundFrame()` (18884–18943) uses an interpolation threshold of `0.001` and calls `getInterpolatedEnsembleFrame()` whenever `t` is not in [0, 0.001] or [0.999, 1]. So **blending is used ~99.8% of the time**. There is **no** “nearest-frame only” path for Mode 1. ❌  
- **(c)** “Shared, slowed time source (`Date.now() * 0.0015`) plus a mild cache speedScale (`0.03`).”  
  **Code:** **Not implemented.**  
  - Time: `drawEnsembleModeBackground()` uses `Date.now() * 0.001` (line 17649).  
  - Speed: `getEnsembleClassicBackgroundFrame()` uses `speedScale = 0.7` (line 18890).  
  So the code uses **faster** time and **much faster** speed than the doc. ❌  

### 3.2 ARCHITECTURE.md – Frame Count (Line 16)

- Doc: “Classic Mode 1 (Ensemble) and Mode 2 (Individual) backgrounds now use **64-frame** cached cycles.”  
- Code: `_ensembleClassicBgFrameCount = 256` (line 1007); `clampedFrameCount = Math.max(32, Math.min(256, frameCount))` (line 18459). So Mode 1 uses **up to 256 frames**, not 64.  

Discrepancy is secondary to the blending vs nearest-frame and time/speed mismatches.

---

## 4. Root Cause Analysis

### 4.1 Ghosting (“Multiple lights on the lines”)

**What the user sees:** Several instances of the “light” that moves along the field lines appear at once.

**Mechanism:**

1. Each **cached frame** is a full-screen image of the ensemble background at one phase. That includes:
   - Quantum field **lines** (angles from center).
   - A **flow** dot on each line: `flowPos = (phase * 0.3 + i * 0.1) % 1`; position along segment `(x1,y1)→(x2,y2)` (lines 18503–18561). So each frame has the light at a **different** position along the line.
2. **Current behavior:** For almost every frame, the code **blends** two cached frames (e.g. frame N and N+1) with weight `t`. So the displayed image is `(1-t)*frame_N + t*frame_N+1`.
3. **Effect:** At any pixel where one frame has “light” and the other “no light” (or light elsewhere), the blend shows **both** states — i.e. two (or more) lights along the same line, or a smeared “trail.” That is exactly **ghosting** from frame interpolation with motion.

**Why motion-aware blending doesn’t fix it:**

- Motion detection marks “difference” between the two frames. The **entire** moving light and its trail differ between frames, so a large region is “motion.”
- Asymmetric blending then favors one frame over the other in that region. But:
  - The **other** frame still contributes (e.g. weight2 = 0.1–0.9 depending on alpha and smoothstep).
  - So you still see a mix of “light at position A” and “light at position B” → multiple lights or elongation.
- PerVFI-style ASB is designed to **reduce** ghosting when you **must** interpolate; it does not remove it when the interpolated object is sharp and spans many pixels. The only way to **eliminate** this ghosting is to **not blend** — i.e. use nearest-frame only, as in ARCHITECTURE.md (b).

**Conclusion:**  
Ghosting is caused by **cross-frame blending** despite the doc stating “no cross-frame blending.” Implementing **nearest-frame lookup only** for Mode 1 (and optionally applying the doc’s slowed time/speed) would align with the documented fix and should remove the multiple-lights effect.

---

### 4.2 Jitter (ship, molecules, particles “jitter as they move”)

**Observed:** Everything that moves on screen (ship, molecules, particles) jitters in Mode 1.

**Possible causes (no code changes; analysis only):**

1. **Heavy Mode 1 background work every frame**  
   When `getEnsembleClassicBackgroundFrame()` returns an **interpolated** frame (almost every frame), it:
   - Reads two full-frame `ImageData` buffers.
   - Runs `detectMotionBetweenFrames()` (luminance diff + 3×3 smoothing over full resolution).
   - Loops over every pixel for asymmetric weights and blending.
   - Writes a full-frame `ImageData` and caches the result.  
   This is **expensive** and can cause **frame drops** or **variable frame time**. If `deltaTime` or effective FPS is uneven, **all** movement (ship, molecules, particles) will look jittery because positions are updated with varying time steps.

2. **Motion detection + asymmetric weights**  
   - Motion mask is binary (smoothed): “motion” vs “static.”  
   - Weights switch from “normal blend” to “asymmetric blend” when `motionStrength > 0` (motion threshold 0.7).  
   - As `alpha` (and thus `smoothAlpha`) crosses 0.5, the primary frame flips from frame1 to frame2. Even with smoothstep, that can cause a **visible jump** in the background.  
   - If the background is perceived as “jumping,” it can create an **impression** that the whole scene (including ship/molecules/particles) is jittering, even if their update logic is correct.

3. **Time source and phase stability**  
   - Background uses `Date.now() * 0.001`; game logic uses `this.time` updated by `deltaTime` (e.g. line 10025).  
   - So background phase and game-simulation time are **not** the same. This is only relevant if we expected “lockstep” (e.g. overlays); it doesn’t directly explain entity jitter.

4. **Mode-specific code paths for entities**  
   - Grep shows **no** mode-specific update or draw logic for ship, molecules, or particles. They use the same `update(deltaTime)` and draw regardless of `this.mode`.  
   - So entity jitter is **not** caused by a different **formula** in Mode 1, but could be caused by **performance** (same loop, but less time left after Mode 1 background) or **perception** (unstable background).

**Conclusion:**  
The most plausible **technical** causes for global jitter in Mode 1 are:  
- **A:** Cost of interpolation + motion detection causing variable frame rate and thus variable `deltaTime`.  
- **B:** Visible “jumps” or instability in the background (from blending + asymmetric weight flips) making the whole scene feel jittery.  

Implementing **nearest-frame only** would remove most of the per-frame cost and eliminate blending-related background jumps, which may significantly reduce or remove the perceived jitter. **Definitive** attribution would require profiling (e.g. frame time with/without blending, and with/without motion detection).

---

## 5. Code Path Summary (Mode 1 Background)

| Step | Function / Location | Behavior |
|------|---------------------|----------|
| 1 | `drawEnsembleModeBackground()` (17642) | Uses `time = Date.now() * 0.001`; if skin `classic-ensemble`, gets one frame from `getEnsembleClassicBackgroundFrame(time)` and draws it. |
| 2 | `getEnsembleClassicBackgroundFrame(time)` (18884) | `speedScale = 0.7`, `span = 20π`. Phase = `(time * speedScale) % span`. Calls `slerpFrameSelection(phase, frameCount, span)` → `idx1`, `idx2`, `t`. |
| 3 | Interpolation decision | If `t < 0.001` or `t > 0.999`, returns single frame (nearest). Otherwise **always** calls `getInterpolatedEnsembleFrame(frame1, frame2, t, idx1, idx2)`. |
| 4 | `getInterpolatedEnsembleFrame()` (18711) | Builds cache key; gets motion mask `detectMotionBetweenFrames()`; for each pixel, computes asymmetric or linear weights; blends in straight alpha; `putImageData`; caches and returns result canvas. |
| 5 | `ensureEnsembleClassicBackgroundCache()` (18452) | Builds up to 256 frames; each frame uses `phase = (frame / frameCount) * cycleSpan` and draws gradient, starfield, particles, **lines**, **flow dots** (`flowPos` along each line), nodes, core. |

The “light that moves down the lines” is the **flow dot** (lines 18503–18561) drawn in each cached frame. Blending two such frames → two flow positions visible = ghosting.

---

## 6. Summary of Findings

| Issue | Likely cause | Doc vs code |
|-------|----------------|-------------|
| **Ghosting (multiple lights on lines)** | Cross-frame **blending** of two frames that have the flow dot at different positions. | ARCHITECTURE says “nearest-frame lookup (no cross-frame blending)”; code blends ~99.8% of the time. |
| **Jitter (ship, molecules, particles)** | (1) Heavy per-frame interpolation + motion detection → variable frame time; (2) Background instability from blend/weight flips. | Doc does not discuss entity jitter; code uses expensive blend path and different time/speed than doc. |
| **Time / speed** | N/A (no direct bug), but rotation speed and “calm” feel differ from intent. | Doc: `Date.now()*0.0015`, `speedScale=0.03`. Code: `Date.now()*0.001`, `speedScale=0.7`. |
| **Frame count** | Minor (memory/init vs smoothness). | Doc: 64-frame cycles. Code: 256 frames. |

---

## 7. Recommendations (For Future Implementation Only)

1. **Eliminate ghosting:**  
   In Mode 1 classic-ensemble path, implement **nearest-frame only**:  
   - Compute phase and frame index as now.  
   - **Do not** call `getInterpolatedEnsembleFrame()`.  
   - Return `cache.frames[idx]` where `idx` is the nearest frame (e.g. `Math.round(exactFrame)` or `Math.floor` and use that single frame).  
   This matches ARCHITECTURE.md (b) and removes the multiple-lights artifact.

2. **Optional: apply documented time/speed:**  
   Use `Date.now() * 0.0015` for the Mode 1 background time and `speedScale = 0.03` (or equivalent) so that “cached frames and live overlays move in lockstep at a calm speed” (ARCHITECTURE (c)).  
   Note: If “live overlays” are removed and everything is in the cache, “live overlays” may refer to an older design; confirm before changing.

3. **Optional: reduce cost and smoothness trade-off:**  
   If nearest-frame alone looks too steppy, consider **increasing frame count** (e.g. 256 kept) and/or **slightly** expanding the “no blend” band (e.g. use single frame when `t` in [0, 0.1] or [0.9, 1]) so that blending is used only in the middle of the segment. That would reduce ghosting while keeping some smoothness. The doc, however, specifies **no** cross-frame blending.

4. **Jitter:**  
   After switching to nearest-frame only, re-test jitter. If it remains, profile frame time and `deltaTime` distribution in Mode 1 vs other modes to confirm whether the cause is background cost or something else (e.g. RAF, layout, other systems).

---

## 8. References

- ARCHITECTURE.md (lines 16, 22) – Mode 1 background design and “no cross-frame blending” fix.
- SMOOTH_ROTATION_*.md, MOTION_AWARE_*.md, JITTERING_GHOSTING_FIX.md, PULSATION_FIX_*.md – In-repo design and tuning.
- MIT: Quaternion/Slerp (e.g. web.mit.edu/2.998, manipulation.csail.mit.edu).
- Stanford CS248: Keyframe interpolation, temporal coherence.
- PerVFI (CVPR 2024): Asymmetric Synergistic Blending for perception-oriented frame interpolation; ghosting from blending misaligned motion.
- Canvas/alpha: Straight vs premultiplied alpha (getImageData/putImageData, Inigo Quilez, MDN).

---

**Status:** Analysis complete. No code has been modified. This document is the basis for any future fix (nearest-frame only, optional time/speed, and re-test of jitter).
