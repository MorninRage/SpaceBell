# Brightness/Dimness - Comprehensive Review (Open to Different Issues)

**Date:** February 2026  
**Context:** Issue persists as early as level 2 despite previous fixes. This review considers **all possible causes**, not just the time/phase fixes already applied.

---

## Summary of Previous Fixes (Rounds 1–3)

- Replaced `Math.sin`-based pulse/twinkle with constants in backgrounds, caches, materials
- Switched background phase from `this.time` to `levelTimeElapsed`
- Added `levelup` and `paused` to time-source condition
- Fixed Boss background time source and remaining `Math.sin` in node size / Neuro coreSize

**Issue still occurs:** Brightness/dimness drift as early as level 2.

---

## Hypothesis 1: levelTimeElapsed Remainder (Primary Suspect)

### The Bug

On level-up, the code does:

```javascript
this.levelTimeElapsed -= adjustedTimePerLevel;  // Carry remainder
```

So `levelTimeElapsed` is **not** reset to 0. The remainder (0–30 seconds) is carried into the next level.

### Effect

- **Level 1 start:** `levelTimeElapsed = 0` → phase = 0
- **Level 2 start:** `levelTimeElapsed = remainder` (0–30) → phase = 0–16
- **Level 3+ start:** Same random phase range

Level 1 always starts at phase 0. Level 2+ starts at a random phase. That makes the background look different at each level start.

During a level, phase advances from `remainder` to `remainder + 30`. So the background cycles through its animation. If particle positions or overlap change perceived brightness, you get drift.

### Fix to Try

Reset `levelTimeElapsed` to 0 when leveling up:

```javascript
// In level-up while loop, after subtracting:
this.levelTimeElapsed -= adjustedTimePerLevel;
this.levelTimeElapsed = 0;  // Reset so every level starts at phase 0
```

**Trade-off:** The remainder is no longer carried for level progression. Levels will always require a full 30 seconds (or adjusted time) from 0.

---

## Hypothesis 2: Mode 1 Yellow Overlay (Mode-Specific)

### Observation

`drawEnsembleOverlay()` draws `rgba(255, 193, 7, 0.2)` over the whole canvas **only in Mode 1 (Ensemble)**. Modes 2 and 3 do not use this overlay.

### Effect

- Mode 1: 20% yellow tint
- Modes 2 & 3: No overlay

Switching modes changes perceived brightness/color. Docs describe Mode 1 as dim→bright and Modes 2 & 3 as bright→dim, which matches this difference.

### Possible Fix

- Remove or reduce the overlay, or
- Apply a similar overlay in Modes 2 & 3 for consistency

---

## Hypothesis 3: Spatial Brightness from Particle Overlap

### Observation

Background particles move with phase (e.g. `angle = phase * 0.2 + i * 0.4`). Their positions change over time. Overlap and clustering change with phase.

### Effect

Even with constant per-particle brightness, total luminance can change when:

- More particles overlap in the center
- Particles spread out vs. cluster

This can cause perceived brightness drift during a level.

### Possible Fixes

- Reduce particle count or overlap
- Use additive blending so overlap does not change perceived brightness
- Use a phase-independent layout (e.g. static positions)

---

## Hypothesis 4: Resume Smoothing (First Frames After Level-Up)

### Observation

After level-up, resume smoothing runs for 5 frames with:

```javascript
deltaTime = Math.min(rawDelta, 0.016 * (0.5 + p * 0.5));
```

So delta ramps from ~8 ms to ~16 ms. `levelTimeElapsed` advances more slowly for those 5 frames.

### Effect

Phase advances more slowly for ~83 ms. That’s a small delay; unlikely to cause visible drift by itself, but could interact with other effects.

---

## Hypothesis 5: Canvas Context State Leakage

### Observation

Many paths set `globalAlpha`, `globalCompositeOperation`, `shadowBlur`, etc. If any path forgets to reset them, later draws can be affected.

### Check

- All background draw paths should end with `globalAlpha = 1`, `shadowBlur = 0`, etc.
- Search for paths that set these and might not restore them

---

## Hypothesis 6: Level-Up Menu Overlay

### Observation

The level-up menu adds `body.level-up` and shows crafting/shop UI. Docs say the level-up menu looked brighter than gameplay.

### Check

- Level-up CSS: layout and cursor only, no opacity/filter changes
- The menu panels may add their own backgrounds; check if they brighten or dim the view

---

## Hypothesis 7: Preload Overlay Transition

### Observation

Preload overlay uses `backdrop-filter: blur(4px)` and gradients. When it hides, the transition could briefly affect perceived brightness.

### Effect

Unlikely to explain level 2 drift, since preload is long finished by then.

---

## Hypothesis 8: Ship / Player / Item Pulse

### Observation

Ships, player, and items use `Math.sin` for pulse effects (e.g. `pulseIntensity = 0.5 + Math.sin(time * 2) * 0.5`). These are not background-related.

### Effect

If many such elements pulse together, they could contribute to perceived global brightness change. Less likely to be the main cause, but worth checking.

---

## Hypothesis 9: Frame Cache Phase Selection

### Observation

Ensemble and Individual modes select frames by phase. With `_ensembleBaseBlendStrength = 0`, nearest-frame selection is used (no blending).

### Effect

Phase determines which frame is shown. If cached frames differ in brightness (despite constants), phase changes would cause drift. Cache build should use constants; verify cache invalidation and rebuild after fixes.

---

## Hypothesis 10: levelTimeElapsed During Level-Up

### Observation

Docs say “levelTimeElapsed is ~0 (frozen) during level-up”. In reality, it holds the remainder (0–30) after the subtraction.

### Effect

During level-up, phase = remainder × speedScale. So phase is not “~0” but 0–16. That’s consistent with Hypothesis 1: level 2+ starts at a random phase.

---

## Recommended Action Plan

### 1. Try Reset levelTimeElapsed (Hypothesis 1)

In the level-up `while` loop, after:

```javascript
this.levelTimeElapsed -= adjustedTimePerLevel;
if (!Number.isFinite(this.levelTimeElapsed) || this.levelTimeElapsed < 0) {
    this.levelTimeElapsed = 0;
}
```

Add:

```javascript
this.levelTimeElapsed = 0;  // Reset for consistent background phase at level start
```

This makes every level start at phase 0. Test whether brightness drift improves.

### 2. If Still Drifting: Mode 1 Overlay (Hypothesis 2)

- Temporarily disable `drawEnsembleOverlay()` or reduce its alpha
- Compare Mode 1 vs Modes 2 & 3 to see if the overlay explains the difference

### 3. If Still Drifting: Audit Context State (Hypothesis 5)

- Trace all background draw paths
- Ensure `globalAlpha`, `globalCompositeOperation`, `shadowBlur` are reset after each path

### 4. If Still Drifting: Particle Overlap (Hypothesis 3)

- Try reducing particle count or overlap
- Or switch to additive blending for background particles

### 5. Diagnostic Logging

Add temporary logging:

```javascript
// In draw loop, when drawing background:
if (this.level === 2 && this.frameCount % 60 === 0) {
    console.log('L2 phase:', this.levelTimeElapsed, 'phase:', phase, 'gameState:', this.gameState);
}
```

Use this to confirm phase and `levelTimeElapsed` behavior at level 2.

---

## Verification Checklist

- [ ] Full page refresh (F5) before testing
- [ ] Test Mode 1, 2, and 3 separately
- [ ] Note whether drift is during level or at level transitions
- [ ] Note whether it’s dim→bright or bright→dim
- [ ] Check if it happens without pausing
- [ ] Check if it happens without opening level-up menu
- [ ] Try with `drawEnsembleOverlay` disabled (Mode 1)

---

## Files to Modify (If Applying Fixes)

| Fix | File | Location |
|-----|------|----------|
| Reset levelTimeElapsed | game.js | ~line 10687, in level-up while loop |
| Disable Ensemble overlay | game.js | drawEnsembleOverlay() or caller |
| Context state audit | game.js | All background draw functions |
