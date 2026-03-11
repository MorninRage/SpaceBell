# Brightness Stabilization - Research & Implementation

**Date:** February 2026  
**Status:** **REMOVED** – Procedural pass was implemented but caused more problems than it solved (Mode 3 pulsation, brightness spikes, did not address root cause). See BRIGHTNESS_DRIFT_FIX.md for the correct approach: fix root causes (constant luminance in caches, levelTimeElapsed sync) rather than post-process correction.

**Original Purpose:** Address persistent global brightness drift that occurs across all modes, fullscreen/windowed, and mode switches—when root cause cannot be identified, implement a method to ensure consistent brightness throughout the game.

---

## Academic Research Summary

### MIT / PNAS - Temporal Brightness Constancy
**Source:** PNAS 2012 - "Optimizing the temporal dynamics of light to human perception"

- Perceived brightness **plateaus** with stimulus duration
- Temporal modulation causes perceived variation
- **Temporal brightness constancy** normalizes brightness perception across temporal modulation conditions
- Solution: Use constant luminance or normalize temporal modulation

### Nature - Perceived Luminance Depends on Temporal Context
**Source:** Nature 2004 - "Perceived luminance depends on temporal context"

- Brightness perception depends on **temporal context** with neighboring objects
- Visual cortex uses parallel streams—one adapting, one non-adapting—to encode brightness
- Temporal relations modulate perceived brightness
- Solution: Provide consistent temporal context; reduce abrupt changes

### Stanford / Vision Research - Luminance Adaptation
**Source:** Effects of mean luminance changes on contrast perception

- When mean luminance changes **abruptly**, perceived contrast is attenuated
- Attenuation subsides within ~400 ms for luminance increases
- Visual system maintains robustness despite limited retinal dynamic range
- Solution: Smooth luminance transitions; avoid abrupt changes

### Oxford / Durham - Perceptual Constancy
**Source:** "Perception-memory interactions reveal a computational strategy for perceptual constancy"

- Lightness perception relies on **reflectance inference** rather than contrast alone
- Memory and context interact to maintain stable perception
- Solution: Consistent reference frame aids constancy

### UCLA / Shady - Gamma & Luminance Control
**Source:** Shady documentation - "Precise Control of Luminance"

- **Gamma correction** is fundamental for brightness consistency
- Mapping from pixel intensity to physical luminance is non-linear (typically γ=2.2)
- Linear workflow: all calculations in linear space, gamma only at final output
- Solution: Consistent gamma pipeline; avoid mixing color spaces

### Real-Time Tone Mapping
**Source:** Bart Wronski, Real-time noise-aware tone mapping

- Tone mapping adapts brightness display to viewing environments
- Compresses dynamic range while minimizing contrast distortion
- Local tonemapping uses bilateral grids for smooth adaptation
- Solution: Post-processing can normalize output luminance

---

## Procedural Solution: Brightness Stabilization Pass

Since the root cause (global, mode-independent, fullscreen-related) remains elusive, implement a **procedural brightness stabilization** that guarantees consistent perceived luminance regardless of source.

### Approach

1. **Sample** canvas luminance periodically (coarse grid, every Nth frame)
2. **Smooth** measured luminance with exponential moving average
3. **Compare** to target luminance (calibrated or fixed)
4. **Correct** via full-screen overlay (multiply to darken, screen to brighten)
5. **Smooth** correction factor to avoid visible jumps

### Implementation Details

- **Sampling:** 16×16 grid (every 16th pixel), every 5th frame → ~256 pixels, ~12 samples/sec
- **Luminance formula:** `0.299*R + 0.587*G + 0.114*B` (sRGB relative luminance)
- **Target:** Calibrated from first 60 frames of gameplay, or fixed (e.g. 40–60)
- **Correction:** Multiply (if too bright) or screen (if too dim), alpha = f(difference)
- **Smoothing:** EMA with α ≈ 0.1 for measured luminance, α ≈ 0.05 for correction

### Performance

- `getImageData` on small region (e.g. 256×256) is ~0.5–2 ms
- Sampling every 5th frame → ~0.1–0.4 ms amortized per frame
- Overlay draw: single `fillRect` with blend mode → negligible

### Toggle

- Settings: `brightnessStabilization: true` (default on)
- Can be disabled if user prefers or if it causes issues on specific hardware

---

## Possible Root Causes (Unconfirmed)

Given the symptoms (global, all modes, mode-switch trigger, fullscreen-related):

1. **Canvas scaling / DPI** – Fullscreen vs windowed may use different `devicePixelRatio` or scaling
2. **Resize debounce** – Mode switch bypasses resize defer (`_resizeDeferUntil = 0`); dimension flux during 500 ms debounce
3. **Cache dimension mismatch** – Ensemble/Bell caches built at different dimensions; scaling during blit may affect brightness
4. **GPU compositing** – Fullscreen may use different compositor path
5. **Color space** – Mixing linear/sRGB or different profiles in fullscreen
6. **Context state leakage** – `globalAlpha` or `globalCompositeOperation` not reset (unlikely given explicit reset at draw start)

The stabilization pass addresses symptoms regardless of cause.

---

## References

- PNAS 2012: Optimizing temporal dynamics of light to human perception
- Nature 2004: Perceived luminance depends on temporal context
- Shady docs: Gamma correction and precise luminance control
- Bart Wronski: Exposure fusion and real-time tonemapping
