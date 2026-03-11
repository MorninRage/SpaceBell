# Comprehensive Analysis: Pulsing, Dimming, and Brightness Changes

**Date:** February 2026  
**Scope:** Root causes of perceived brightness changes in objects, backgrounds, and globally. **No code changes**—review and analysis only.

---

## 1. Global Brightness (Whole-Screen)

### 1.1 HDR Compensation (Auto Brightness)

**Location:** `updateHdrCompensation()`, `updateHdrFilter()`, `applyHdrPostProcess()` (~10627–10754, 10744–10754, 10746–10753).

**Mechanism:**
- Every **6 frames** (`sampleInterval: 6`) a 64×36 downscaled copy of the canvas is sampled.
- **Luminance** is computed per pixel (sRGB → linear: 0.2126 R + 0.7152 G + 0.0722 B), then averaged.
- **EMA:** `emaLuma = emaLuma * 0.9 + avg * 0.1`.
- **Target luma:** Separate for windowed (`windowedTargetLuma`) and fullscreen (`fullscreenTargetLuma`), each smoothed with `* 0.98 + emaLuma * 0.02`.
- **Correction:** `desired = targetLuma / emaLuma`, clamped to [0.75, 1.35], then `correction = correction * 0.9 + clamped * 0.1`.
- **Output:** `brightness(correction * strength)` applied via CSS `filter` on the canvas (or on the post-process blit when `usePostProcess` is true).

**Why it can cause pulsing/dimming:**
- Scene luminance **changes** with gameplay (e.g. many particles vs few, more explosions, mode switch). EMA and correction follow with a delay.
- When the **scene gets brighter** (e.g. many glows), `emaLuma` rises → correction drops → filter dims the screen. When the scene gets dimmer, correction rises → screen brightens. So the system **tracks content** and can produce a slow “breathing” or step-like brightness change.
- **Fullscreen vs windowed:** Different targets are used, but if the compositor or GPU path is different in fullscreen, perceived brightness can still differ (documented as unresolved in BRIGHTNESS_DRIFT_FIX.md).

**Summary:** Global brightness is **intentionally adaptive**. That adaptation can be perceived as pulsing or dimming when scene content or view (fullscreen/windowed) changes.

---

### 1.2 Fullscreen-Specific Dim

**Status:** Documented as **unresolved** (BRIGHTNESS_DRIFT_FIX.md). Screen often appears dimmer in fullscreen than in windowed mode. Likely causes: browser/GPU compositor scaling path, different color pipeline, or different effective gamma in fullscreen. No single code path identified; HDR already uses separate fullscreen vs windowed target luma.

---

### 1.3 Canvas/Context State Leakage

**Locations:** Start of `draw()`, after HDR blit, before overlays (~18228–18231, 18377–18378, 18396–18398).

**Mechanism:** `globalAlpha`, `globalCompositeOperation`, and `filter` are reset every frame so that no previous draw path leaves the main context in a modified state. If any path forgets to restore (e.g. after an exception), **leaked alpha or composite** would dim or tint subsequent frames until the next explicit reset.

**Summary:** Defensive resets are in place; **leakage** would cause gradual or sudden global dimming, not a regular pulse.

---

## 2. Backgrounds (Mode 1/2/3 and Boss)

### 2.1 Ensemble (Mode 1) Frame Blending — Possible Pulsation

**Location:** ~18680–18687.

**Current code:**
```javascript
this.ctx.drawImage(f1.canvas, ...);
this.ctx.globalAlpha = t * blendStrength;
this.ctx.drawImage(f2.canvas, ...);
// then globalAlpha = 1
```

**Compositing:** Default is **source-over**. With source-over, the second draw is:  
`result = dest + src * (t * blendStrength) * (1 - destAlpha)`.  
So the blend is **not** the linear interpolation `(1−t)*A + t*B`. The effective blend of the two frames depends on the alpha of the first frame and produces a **non-linear** relationship between `t` and perceived brightness (similar to an α² term when blending two semi-transparent layers). As `t` advances every frame, brightness can **oscillate or pulse** slightly even if both cached frames have constant luminance.

**Documentation:** PULSATION_FIX_FINAL_RESEARCH.md describes switching to **`lighter`** compositing and clearing to transparent black to achieve true linear interpolation and remove pulsation. The **current code still uses the default (source-over)** and does not clear to transparent before drawing; the “lighter” fix does not appear to be applied in this path.

**Summary:** Ensemble background interpolation is a **likely source of subtle pulsation** due to source-over blend non-linearity.

---

### 2.2 Bell and Individual Mode Frame Blending

**Locations:** Bell mode (~33828–33836, 34084–34088, 34411–34417), molecule/atom cache (~23572–23577). Same pattern: `globalAlpha = 1`, draw frame A, `globalAlpha = cachedFrame.blend`, draw frame B, `globalAlpha = 1`. Again **source-over**. So the same non-linear blend issue can apply: as `blend` varies (sub-frame interpolation), perceived brightness can pulse slightly.

**Summary:** Any path that blends two cached frames with **source-over + globalAlpha** on the second draw is a **candidate** for pulsation; severity depends on frame content and alpha.

---

### 2.3 Background Phase and Time Sources

**Fixed in earlier rounds (BRIGHTNESS_DRIFT_FIX.md):**
- Phase uses **levelTimeElapsed** (and level-up/paused) so phase resets at level start and does not drift across levels.
- **levelTimeElapsed** is set to 0 at level-up (after subtracting adjusted time), so each level starts at a consistent phase.
- All background **pulse/twinkle/size** values that were `Math.sin(phase|time)*...` were replaced with **constants** (e.g. 0.85, 0.9, 2.25, 5.75) in Ensemble, Individual, Bell, Boss, and in cache builders (ensemble, individual, bell, ethereal materials, quantum plasma, player glow).
- **shadowBlur** was set to **0** on phase-dependent background elements to avoid overlap-induced brightness drift.

**Remaining time-based geometry (not brightness):** Some paths (e.g. Neuro branch jitter, wave positions) still use `Math.sin(time * …)` for **position/size only** (jitterX, ang, skew, len). These do not directly set luminance but can change **overlap** of solid fills and thus slightly affect total brightness; effect is likely small compared to the former pulse/size/shadowBlur fixes.

**Summary:** Background **luminance** is no longer driven by phase/time in the documented paths; **blending mode** (source-over) remains a potential pulsation source.

---

### 2.4 Mode 1 Yellow Overlay

**Observation (BRIGHTNESS_COMPREHENSIVE_REVIEW.md):** Ensemble draws a yellow overlay (`rgba(255, 193, 7, 0.2)`) over the canvas only in Mode 1. Modes 2 and 3 do not. So **switching modes** changes global tint/brightness; it does not cause in-level pulsing.

---

## 3. Objects (Per-Object or Local Brightness)

### 3.1 Particles (drawParticles)

**Location:** ~36905–36937.

**Code:**  
`pulseIntensity = 0.7 + Math.sin(time * 3 + p.x * 0.1 + p.y * 0.1) * 0.3`

**Usage:**  
- `shadowBlur = particleSize * 3 * pulseIntensity`
- `globalAlpha = (p.alpha || 1) * lifePercent * pulseIntensity`
- `arc(..., particleSize * pulseIntensity, ...)`
- Stroke and inner core also scaled by `pulseIntensity`

**Effect:** Each particle’s brightness and size **pulse with time** (period ~2.1 s, amplitude 0.3 around 0.7). With many particles, their combined luminance oscillates → **global brightness pulse**. Phase is offset per particle by position, so it’s not a single in-phase flash but a **smooth, global wave** of brightness.

**Summary:** **Particles are a direct cause of object-level and global pulsing.**

---

### 3.2 Bullets (Basic / Green Spread)

**Location:** ~33864–33870 and ~33889–33895 (sprite path and gradient fallback).

**Code:**  
`pulsePhase = Math.sin(time * 4) * 0.3 + 0.7`  
Used for stroke style alpha of a “pulsing outer ring” around the bullet.

**Effect:** All bullets share the same time-based pulse (period ~1.57 s). When many bullets are on screen, the sum of their ring brightness **pulses** → contributes to **global brightness oscillation**.

**Summary:** **Bullet ring pulse is a time-based brightness source.**

---

### 3.3 Material Drops (Neon / Ethereal)

**Call site:** ~31762 — `pulseIntensity = 0.85` (constant). So material **drops** do not add time-based pulse. Ethereal materials use this as a multiply overlay when `pulseIntensity !== 1.0`, which is a constant slight dim, not a pulse.

**Summary:** Material drops are **not** a current source of pulsing (constant 0.85).

---

### 3.4 Player and Enemy Ships (drawShipPreview)

**Location:** ~39102–39124 (panel lines, cockpit glow).

**Code:**  
- `panelPulse = Math.sin(t * 2 + i) * 0.3 + 0.7`  
- `cockpitPulse = 0.4 + Math.sin(t * 1.2) * 0.3`  
Used for stroke/fill alpha and gradient stops.

**Effect:** Ship preview (and any caller using this for in-game ships) has **time-based pulsing** on panels and cockpit. One ship is a small area; many ships or a large cockpit could add to perceived brightness change.

**Summary:** **Ship panel/cockpit pulse is a time-based brightness source** (local to ship art).

---

### 3.5 Other UI / Effect Pulses

**Locations (examples):**
- ~26244: `pulseIntensity = 0.6 + Math.sin(time * 4) * 0.4` (central core body)
- ~28738: `pulseIntensity = (Math.sin(pulseTime) + 1) / 2` (stroke)
- ~28874, 28886, 28970: `pulseIntensity = 0.5 + Math.sin(time * 2) * 0.5` or similar (energy rings, description matrix, etc.)

**Effect:** Various HUD/effect elements use **time-based alpha or intensity**. Individually small; in combination they can add to a **global “living” pulse** or dimming, especially if several share similar periods.

**Summary:** **Multiple UI/effect paths use sin(time) for intensity** and can contribute to overall brightness variation.

---

### 3.6 Targets (Puzzle / Default Particle)

**Location:** ~29573 — `basePulse = 0.9` (constant). drawDefaultParticle only applies a **darkening** overlay when `basePulse < 1.0`, which is constant. No time-based pulse.

**Summary:** Target/puzzle particle base pulse is **constant**; not a pulsation source.

---

### 3.7 Explosions

**Location:** ~14302 — `exp.brightness = 0.6` (constant). Fade is by **lifetime** (alpha over life), not by global time. So explosions do not add a global time-based pulse; they add short-lived brightness that fades out.

**Summary:** Explosions are **not** a source of rhythmic pulsing.

---

### 3.8 Molecule Atoms

**Location:** ~23607–23612 — field intensity is constant (`fieldIntensity = 0.4`). Comment notes that a previous sine pulse was removed to avoid brightness flicker. Cached atom frames use constant pulse in cache build.

**Summary:** Molecule atoms are **not** a current pulsation source.

---

## 4. Summary Table

| Category              | Source                          | Type                    | Causes                                                                 |
|-----------------------|----------------------------------|-------------------------|------------------------------------------------------------------------|
| **Global**            | HDR auto compensation           | Adaptive brightness     | Scene content / fullscreen changes → slow or step-like dim/bright     |
| **Global**            | Fullscreen compositor           | Unresolved              | Fullscreen often looks dimmer than windowed                           |
| **Global**            | Context leakage                 | Bug (if present)        | Gradual or sudden dim if alpha/composite not restored                  |
| **Backgrounds**       | Ensemble frame blend            | source-over blend       | Non-linear (1−t)*A + t*B → subtle pulsation as t advances              |
| **Backgrounds**       | Bell/Individual frame blend     | source-over blend       | Same as above for any two-frame interpolation                          |
| **Backgrounds**       | Phase/time pulse (old)          | Fixed                   | Replaced with constants; no longer primary cause                       |
| **Objects**           | Particles                       | sin(time)*0.3+0.7       | **Strong** global brightness pulse (many particles, same period)       |
| **Objects**           | Bullet ring                     | sin(time*4)*0.3+0.7     | Global pulse when many bullets on screen                               |
| **Objects**           | Ship panel/cockpit              | sin(t) on ship art      | Local pulse on ships                                                    |
| **Objects**           | UI/effect rings and cores      | Various sin(time)       | Contribute to overall brightness variation                             |
| **Objects**           | Materials, targets, explosions  | Constant or lifetime   | Not pulsation sources                                                  |

---

## 5. Conclusion

**Pulsing** is primarily from:
1. **Particles** — time-based `pulseIntensity` affecting alpha, size, and shadow (largest aggregate effect).
2. **Bullets** — time-based ring stroke alpha.
3. **Ensemble (and similar) frame blending** — source-over instead of linear interpolation, so blend factor `t` produces non-linear brightness.
4. **Ship and UI effects** — multiple sin(time) intensity terms adding together.

**Dimming (global)** is primarily from:
1. **HDR auto** — correction chases scene luminance; dimmer content → higher correction; brighter content → lower correction (can feel like “breathing” or steps).
2. **Fullscreen** — separate, unresolved dimmer appearance vs windowed.
3. **Potential context leakage** — only if some path fails to restore `globalAlpha`/composite.

**Brightness changes in objects** come from the same time-based formulas (particles, bullets, ship art, UI effects); **backgrounds** no longer use time-based luminance in the documented paths but remain subject to **blend-mode-induced** pulsation when two cached frames are blended with source-over.

No code changes were made in this analysis; this document is for diagnosis and prioritization of fixes.
