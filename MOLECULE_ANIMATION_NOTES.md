# Molecule Animation & Size Updates

**Status:** Implemented  
**Scope:** Molecule atoms (visual cache), rotation timing, spawn sizing  

---

## Changes

- 64-frame high-fidelity atom cache with plasma effects:
  - Dual rotating bands, counter-rotating inner band, inner swirl.
  - Halo fringe with cyan/magenta neon mix plus bright outer edge highlight.
  - Orbiting micro-motes.
- Palette update: cooler/coral neon mix (cyan/teal + magenta/pink) while keeping soft inner cores.
- Softer pulse/shimmer: reduced pulse amplitude to cut flicker.
- Rotation timing:
  - Phase from game time: `time = (this.time || 0) * 1.5` (rad/s). Sub-frame blend for smooth rotation (no stepping).
  - Correct compositing: draw frameA at globalAlpha 1, then frameB at globalAlpha blend → (1-α)*A + α*B (avoids α² pulsation; see PULSATION_FIX_FINAL_RESEARCH.md).
  - 128 cached frames + linear blend between adjacent frames = smooth rotation.
- Pulse/shimmer in pre-render kept minimal so blended frames don’t pulsate.
- **Seamless loop**: All time multipliers in the pre-render use integers (e.g. time*1, time*2, sin(time*2)) so at phase 2π state equals phase 0—no jump when the animation wraps.
- Size adjustments:
  - Base spawn size reduced globally to 0.8x.
  - Late-game shrink from level 60→90 down to ~0.7x; applied to molecule size and atom radii so render/collision stay aligned.

---

## Visual enhancements (no flicker, cache-safe)

- **Baked in pre-render (same 128-frame cache):**
  - **Specular highlight**: Fixed bright spot (top-left) on each atom for a glassy look; constant so no flicker.
  - **Richer main gradient**: Extra color stop at 0.5 for more depth; constant.
  - **Second outer halo**: Soft ring at 2.6× radius (cool tint) for depth; constant.
  - **Mote size variation**: Three sizes by index (0.92 + 0.06×(m%3)) so motes aren’t identical; constant per frame.
- **Bond gradient (cached)**: More stops and brighter mid for an “energy” feel; still cached by health bucket.
- **Trail for fast-moving molecules**: When speed > 3 and not aggressively simplified, draw cached `moleculeTrail` behind molecule center (one draw, rotated to velocity); alpha scales with speed.

---

## Performance Notes
- Runtime cost remains O(1) per atom (cache lookup + drawImage).
- Memory: 64-frame cache; larger than 32-frame but same runtime cost.
- Rotation tuning is aligned to baked frames; small desync keeps instances varied.

---

## Tweaks to revisit (if needed)
- Rotation speed: `(this.time || 0) * 1.5` rad/s (~4.2 s/cycle). 128 frames + sub-frame blend (correct draw order: A at 1, B at α). Pulse/shimmer minimal.
- Brightness: edge neon can be lowered/raised via alpha; pulse can be reduced further if desired.
- Size curve: change shrink start/end levels or final scale if late-game still feels too large.
