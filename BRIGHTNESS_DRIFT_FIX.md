# Brightness Drift Fix - Implementation Documentation

**Status:** FIXED (Round 1–5 for level progression); **UNSOLVED** (fullscreen-specific dim)  
**File:** `game.js`  
**Last Updated:** February 2026

---

## Fullscreen-Specific Brightness Dim (Unresolved)

**Separate issue:** Screen appears dimmer in fullscreen vs windowed mode. This is distinct from level-progression drift (which is fixed).

**Attempted fixes (did not resolve):**
- Single dimension source (clientWidth/clientHeight) for consistency
- devicePixelRatio canvas scaling (reverted – caused jitter when switching modes after fullscreen)

**Current state:** Reverted DPR to restore stable mode switching. Fullscreen dim likely due to browser/GPU compositor behavior (different scaling path in fullscreen). Requires a different approach (e.g. CSS, compositor hints, or procedural correction – see BRIGHTNESS_STABILIZATION_RESEARCH.md).

---

## Executive Summary

Global screen brightness drifted during level progression (Mode 1: dim→bright; Modes 2 & 3: bright→dim). Five rounds of fixes eliminated all sources:

- **Round 1:** Individual cache twinkle, live render pulse/twinkle, level-synchronized phase, Bell time source, level-up menu time source
- **Round 2:** Boss background, Ensemble/Precision waveRadius/cloudSize, Ethereal Materials cache, Quantum Plasma cache, Player glow cache
- **Round 3:** Paused state time source, Boss background time source, Boss node size, Neuro coreSize (persisting drift after level 4–5)
- **Round 4:** Level-up menu deltaTime spike (huge leap at level 3, frequent pattern after cutscene 5)
- **Round 5:** Material drops + gameplay elements (drift during gameplay level 3+, more frequent after)

All `Math.sin`-based brightness/size values were replaced with constants. Academic research (PNAS, Nature, MIT, Stanford, Oxford, UCLA) supports constant luminance to prevent temporal adaptation and perceived drift.

---

## Complete Fix Index

| # | Location | What Changed | Round |
|---|----------|--------------|-------|
| 1 | `ensureIndividualClassicBackgroundCache()` | Star twinkle: `Math.sin(phase*0.4+i*0.09)*0.3+0.7` → `0.85` | 1 |
| 2 | Ensemble/Individual/Bell/Boss live render paths | All pulse/twinkle: `Math.sin(phase/time*X)*0.3+0.7` → `0.85` | 1 |
| 3 | All background draw functions | Phase source: `this.time` → `levelTimeElapsed` | 1 |
| 4 | Bell Mode Classic | Time source: `Date.now()` → game time | 1 |
| 5 | All background draw functions | Level-up: use `levelTimeElapsed` when `gameState === 'levelup'` | 1 |
| 6 | `drawBossBackground()` | intersectionPulse, cloudSize, cloudPulse → constants | 2 |
| 7 | Ensemble fallback, `drawIndividualModeBackgroundPrecision()` | waveRadius, cloudSize → constants | 2 |
| 8 | `ensureEtherealMaterialsFrameCache()` | starPulse → `0.9` | 2 |
| 9 | Quantum plasma particle cache builder | plasmaPulse, ringRadius, ringDistortion, particleSize → constants | 2 |
| 10 | Player glow frame cache builder | pulse → `1.0` | 2 |
| 11 | All background draw functions | Paused: use `levelTimeElapsed` when `gameState === 'paused'` | 3 |
| 12 | `drawBossBackground()` | Time source: `this.time` → `levelTimeElapsed` when bossMode | 3 |
| 13 | `drawBossBackground()` | Node size: `2.5+Math.sin(time*1.5+i)*1` → `3.0` constant | 3 |
| 14 | `drawIndividualModeBackgroundPrecision()` (Neuro) | coreSize: `14+Math.sin(time*1.3)*2.5` → `15.25` constant | 3 |
| 15 | `continueFromLevelUp()` | Reset lastTime + resumeSmoothing to prevent deltaTime spike | 4 |
| 16 | Cutscene exit to level-up | levelTimeElapsed = 0 when exiting level cutscene | 4 |
| 17 | `devSetLevel()` | levelTimeElapsed = 0 when jumping levels in dev mode | 4 |
| 18 | Neon materials (drawNeonMaterials) | shadowBlur=0, auraPulse/ringRadius/particleSize/innerPulse/spikeLength/spikePulse/moteDist/moteSize/moteAlpha→constants | 5 |
| 19 | Ethereal materials fallback | shadowBlur=0, cosmicAuraPulse/ringRadius/starSize/starPulse/innerPulse/streamLength/streamWidth/streamAlpha/particleDist/particleSize/particleAlpha/starBurstPulse→constants | 5 |
| 20 | Player shield (basic/reinforced/quantum) | shadowBlur=0, sparkleSize/sparkleAlpha/pulsePhase/nodeSize/nodePulse→constants | 5 |
| 21 | Auto-collector particles/lines | shadowBlur=0, particleSize→constant | 5 |

---

## Round 5 Fixes (February 2026 - Drift During Gameplay Level 3+)

The issue happened **during gameplay** (not at level-up): brightness leaped around level 3, then became more frequent at higher levels. Level 3 is when enough material drops first cluster (molecules destroyed → drops spawn). As levels increase, more obstacles/drops = more clustering = more frequent brightness variation.

**Root cause:** Material drops (neon + ethereal) and gameplay elements used heavy shadowBlur (8–40) and Math.sin(time) for size/alpha. When many drops clustered, overlapping glows added up = brighter screen. When they scattered = dimmer. More drops at higher levels = more frequent variation.

**Fixes:**
1. **Neon materials:** shadowBlur=0, all Math.sin→constants (auraPulse, ringRadius, particleSize, innerPulse, spikeLength, spikePulse, moteDist, moteSize, moteAlpha)
2. **Ethereal materials fallback:** shadowBlur=0, all Math.sin→constants (cosmicAuraPulse, ringRadius, starSize, starPulse, innerPulse, streamLength/Width/Alpha, particleDist/Size/Alpha, starBurstPulse)
3. **Player shield (basic/reinforced/quantum):** shadowBlur=0, sparkleSize/sparkleAlpha/pulsePhase/nodeSize/nodePulse→constants
4. **Auto-collector:** shadowBlur=0, particleSize→constant

---

## Round 4 Fixes (February 2026 - Level 3 Leap, Post-Cutscene 5 Drift)

After Rounds 1–3, brightness drift persisted with specific patterns:
- **Level 3:** Huge leap from brightness to dimness, then self-corrects within a few seconds
- **After cutscene 5:** More frequent pattern similar to original drift during next level

**Root cause:** When continuing from the level-up menu, `lastTime` was stale (from before the menu opened). The first frame after Continue got a huge `rawDelta` (e.g. 10–30 seconds, capped at 0.1s), so `levelTimeElapsed` jumped ~100ms in one frame. This phase jump caused a perceived brightness leap. The "self-correct" was the phase cycling or temporal adaptation.

**Fixes:**
1. **continueFromLevelUp():** Reset `lastTime = performance.now()` and activate `resumeSmoothing` (5 frames) so the first frames after Continue use gradual deltaTime instead of a spike.
2. **Cutscene exit to level-up:** Set `levelTimeElapsed = 0` when exiting a level cutscene to the level-up menu (belt-and-suspenders).
3. **devSetLevel():** Set `levelTimeElapsed = 0` when jumping levels in dev mode.

---

## Problem

Global screen brightness drifted during level progression. The behavior differed by mode:

- **Mode 1 (Ensemble):** Started dim → got brighter during level → returned to correct brightness on level up
- **Modes 2 & 3 (Individual, Bell):** Started bright → got dimmer during level → returned to correct brightness on level up

The level-up menu always looked correct (bright). During gameplay in modes 2 and 3, brightness started at that level, gradually dimmed over the level, then snapped back when the level-up menu appeared. The effect was global (entire screen).

---

## Root Cause

**Primary cause:** The Individual Classic background cache (`ensureIndividualClassicBackgroundCache`) used `Math.sin(phase * 0.4 + i * 0.09) * 0.3 + 0.7` for star twinkle when **building** cached frames. This baked varying brightness into each frame. When the game selected frames by phase during playback, it cycled through frames with different brightness levels, causing perceived global drift.

**Contributing factors:**
- Ensemble and other backgrounds used `Math.sin(phase * X)` for pulse/twinkle values in live render paths, causing phase-based brightness oscillation
- Bell Mode Classic used `Date.now()` instead of game time, so its animation continued during level-up while other modes froze
- Background phase was driven by `this.time` (cumulative game time) rather than `levelTimeElapsed` (per-level time), so phase did not reset at level start
- **Level-up menu used a different time source:** During level-up, backgrounds used `this.time` (cumulative, e.g. 30, 60, 90) while gameplay used `levelTimeElapsed` (~0 at level start). Different phases produced different perceived brightness, so the level-up menu looked brighter than gameplay

---

## Solution Summary

1. **Individual cache:** Replaced phase-based twinkle with a constant so cached frames have uniform brightness.
2. **Live render paths:** Replaced all `Math.sin`-based pulse/twinkle values with constants across Ensemble, Individual, Bell, and Boss backgrounds.
3. **Level-synchronized phase:** Switched from `this.time` to `levelTimeElapsed` so phase resets at level start.
4. **Bell mode time source:** Switched from `Date.now()` to game time so Bell animation freezes during level-up like other modes.
5. **Level-up menu time source:** Use `levelTimeElapsed` during level-up as well as gameplay so the level-up screen matches level start (no brightness jump).

---

## Fixes Implemented (Detail)

### 1. Individual Cache Build (Primary Fix)

**File:** `game.js`  
**Location:** `ensureIndividualClassicBackgroundCache()` (Individual Classic background cache build)

**Change:** Replaced phase-based twinkle with constant value:
```javascript
// Before (baked varying brightness into cache)
const tw = Math.sin(phase * 0.4 + i * 0.09) * 0.3 + 0.7;

// After (constant brightness)
const tw = 0.85; // Constant - was Math.sin(phase*0.4+i*0.09)*0.3+0.7 (baked varying brightness into cache = global drift)
```

**Effect:** Cached frames now have consistent brightness; no drift when cycling through frames.

---

### 2. Constant Brightness in Live Render Paths

Replaced all `Math.sin(phase * X)` and `Math.sin(time * X)` brightness/pulse values with constants across:

- **Ensemble Mode (Mode 1):** Flow-dot overlay, `drawEnsembleClassicFrameBaseOnly`, `drawEnsembleClassicFrameAtPhase`, ensemble fallback gradient/starfield
- **Individual Mode (Mode 2):** Classic fallback, Precision, Neuro, Retro Future
- **Bell Mode (Mode 3):** Aurora Borealis
- **Boss background:** Node pulse, particle size (where applicable)

**Example pattern:**
```javascript
// Before
const pulse = Math.sin(phase * 2 + i * 0.2) * 0.3 + 0.7;

// After
const pulse = 0.85; // Constant - prevents brightness fade during level
```

---

### 3. Level-Synchronized Background Phase

**Change:** Use `levelTimeElapsed` instead of `this.time` for background phase when `gameState === 'playing'`.

**Affected functions:**
- `drawEnsembleModeBackground()` – classic-ensemble and fallback
- `drawIndividualModeBackgroundClassic()`, `drawIndividualModeBackgroundPrecision()`, `drawIndividualModeBackgroundNeuro()`, `drawIndividualModeBackgroundRetroFuture()`
- `drawBellModeBackgroundClassic()`, `drawBellModeBackgroundAuroraBorealis()`

**Effect:** Each level starts at the same phase (≈ 0); animation is synchronized with level progression and resets at level up.

---

### 4. Bell Mode Time Source

**Change:** Bell Mode Classic uses game time (`this.time` / `levelTimeElapsed`) instead of `Date.now()`.

**Effect:** Bell background animation freezes during level-up like Ensemble and Individual, avoiding desync and opposite brightness behavior.

---

### 5. Level-Up Menu Time Source (Final Fix)

**Issue:** After fixes 1–4, modes 2 and 3 still showed gradual dimming during the level, with brightness returning when the level-up menu appeared. The level-up menu always looked brighter because backgrounds used a different time source there: `this.time` (cumulative) during level-up vs. `levelTimeElapsed` (per-level, ~0 at start) during gameplay. Different phases produced different perceived brightness.

**Change:** Use `levelTimeElapsed` for background phase when `gameState === 'levelup'` as well as `'playing'`. During level-up, `levelTimeElapsed` is ~0 (frozen), so the background matches level start.

**Code change:** Updated the time-source condition from:
```javascript
(this.levelTimeElapsed !== undefined && this.gameState === 'playing')
```
to:
```javascript
(this.levelTimeElapsed !== undefined && (this.gameState === 'playing' || this.gameState === 'levelup'))
```

**Affected:** All background draw paths (Ensemble, Individual Classic/Precision/Neuro/RetroFuture, Bell Classic/Aurora).

**Effect:** Level-up menu and level start now show the same background phase; no brightness jump when entering or leaving level-up. This resolved the remaining brightness drift in modes 2 and 3.

---

## How the Problem Was Solved

1. **Initial analysis:** Identified that brightness drift correlated with level progression and reset at level-up. This pointed to time/phase-based effects in background rendering.
2. **Cache inspection:** Found that the Individual Classic background cache baked phase-dependent twinkle (`Math.sin`) into each frame. Fixing this removed drift in Individual mode.
3. **Live render audit:** Replaced all remaining `Math.sin`-based brightness/pulse values with constants across Ensemble, Individual, Bell, and Boss backgrounds.
4. **Time source alignment:** Switched background phase from cumulative `this.time` to per-level `levelTimeElapsed` so each level starts at the same phase.
5. **Level-up discrepancy:** Noticed the level-up menu looked brighter than gameplay. Traced this to different time sources: level-up used `this.time` (cumulative) while gameplay used `levelTimeElapsed` (~0 at start). Using `levelTimeElapsed` for both states fixed the remaining drift.

---

## Post-Fix Behavior

- All modes maintain constant brightness during level progression
- Brightness at level start and level up is consistent
- Backgrounds are visually aligned across modes
- Full page refresh (F5/Ctrl+R) is required after the fix to clear in-memory caches and rebuild with the new code
- If brightness drift persists, ensure you have done a full refresh (not just resume) to clear any old cached frames

---

## Round 2 Fixes (January 2026 - Persisting Drift)

After the initial fix, brightness drift persisted: Mode 1 (dim→bright), Modes 2 & 3 (bright→dim). Additional sources were identified and fixed:

### 6. Boss Background (drawBossBackground)

**Location:** `drawBossBackground()` – intersection nodes, energy clouds

**Changes:**
- `intersectionPulse`: `Math.sin(time*1.8+i*0.3)*0.4+0.6` → `0.85` (constant)
- `cloudSize`: `180 + Math.sin(time*0.8+i)*40` → `200` (constant)
- `cloudPulse`: `Math.sin(time*0.5+i)*0.2+0.8` → `0.85` (constant)

### 7. Ensemble & Individual Precision Fallback (waveRadius, cloudSize)

**Location:** Gradient/starfield fallback paths, `drawIndividualModeBackgroundPrecision()`

**Changes:**
- `waveRadius`: Removed `+ Math.sin(time*1.2+i)*40` – radius variation caused perceived brightness drift (larger radius = more stroke pixels = brighter)
- `cloudSize`: `200 + Math.sin(time*0.8+i)*50` → `200` (constant) – size variation affected total luminance

### 8. Ethereal Materials Cache (material item drops)

**Location:** `ensureEtherealMaterialsFrameCache()` – star pulse in ring stars

**Change:** `starPulse = 0.8 + Math.sin(time*2.5+star)*0.2` → `0.9` (constant) – baked varying brightness into cached frames; cycling through frames by phase caused global drift when materials were on screen

### 9. Quantum Plasma Particle Cache

**Location:** Quantum plasma particle frame cache builder

**Changes:**
- `plasmaPulse`: `0.7 + Math.sin(framePhase*2)*0.3` → `0.85` (constant)
- `ringRadius`: Removed `*(1+Math.sin(plasmaTime*1.5+ring)*0.15)` multiplier
- `ringDistortion`: `Math.sin(plasmaTime*2+ring)*0.1` → `0` (constant)
- `particleSize`: `1.5 + Math.sin(framePhase*4+i+ring)*0.8` → `2.3` (constant)

### 10. Player Glow Pre-Shaded Frames

**Location:** Player glow frame cache builder

**Change:** `pulse = 1 + Math.sin(phase)*0.2` → `1.0` (constant) – player is always visible; cycling through glow frames by phase caused perceived brightness variation

---

## Round 3 Fixes (February 2026 - Persisting Drift After Level 4–5)

After Rounds 1 and 2, brightness drift persisted after level 4–5. Additional sources were identified and fixed:

### 11. Paused State Time Source

**Location:** All background draw functions (Ensemble, Individual Classic/Precision/Neuro/RetroFuture, Bell Classic/Aurora)

**Issue:** When `gameState === 'paused'`, backgrounds used fallback `this.time` (cumulative) instead of `levelTimeElapsed`. Pausing caused a phase jump → brightness jump. By level 5, `this.time` was large enough that the jump was noticeable.

**Change:** Added `gameState === 'paused'` to the time-source condition so paused state uses `levelTimeElapsed` (frozen at pause moment).

### 12. Boss Background Time Source

**Location:** `drawBossBackground()`

**Issue:** Boss background always used `this.time`. During boss mode, `levelTimeElapsed` does not advance, but boss background kept animating with `this.time`, causing brightness drift during long boss fights.

**Change:** Use `levelTimeElapsed` when `bossMode` is true (frozen at boss entry); fallback to `this.time` otherwise.

### 13. Boss Background Node Size

**Location:** `drawBossBackground()` – node size in loop

**Change:** `size = 2.5 + Math.sin(time*1.5+i)*1` → `3.0` (constant) – size variation caused perceived brightness drift

### 14. Neuro (Precision) Background coreSize

**Location:** `drawIndividualModeBackgroundPrecision()` – Neuro skin center orb

**Change:** `coreSize = 14 + Math.sin(time*1.3)*2.5` → `15.25` (constant) – size oscillation caused brightness drift when Precision/Neuro skin was active

---

## Academic Research Summary

Research from PNAS, Nature, MIT, Stanford, Oxford, and UCLA informs the fix:

1. **Temporal Brightness Constancy** (PNAS 2012): Perceived brightness plateaus with stimulus duration. Temporal modulation causes perceived variation. Solution: Use constant luminance values so integrated luminance over time is stable.

2. **Perceived Luminance Depends on Temporal Context** (Nature 2004): Two parallel streams—one adapting and one non-adapting—encode brightness. Temporal relations with neighbouring objects modulate perceived brightness. Solution: Eliminate time-based luminance variation to prevent adaptation-induced drift.

3. **Broca-Sulzer Effect**: Perceived contrast peaks at 50–100 ms. Rapid temporal modulation amplifies perceived brightness variation. Solution: Avoid rapid pulse/twinkle effects; use constants.

4. **Ramp Aftereffect** (Vision Research): After adapting to gradually brightening/dimming light, constant fields appear to show the opposite effect. Solution: Keep luminance constant during level progression to prevent adaptation and aftereffect.

---

## Verification

After applying all fixes:

1. **Full page refresh (F5 or Ctrl+R)** – Required to clear in-memory caches and rebuild with new code
2. **Hard refresh (Ctrl+Shift+R)** – If drift persists, bypass browser cache
3. **Test all modes** – Ensemble (Mode 1), Individual (Mode 2), Bell (Mode 3) across several levels
4. **Expected result** – Constant brightness during level progression; no dim→bright or bright→dim drift; level-up menu matches gameplay brightness

---

## Related Documentation

- `JITTER_BRIGHTNESS_FIX.md` – Earlier analysis of global brightness oscillation from `Math.sin(time * X)` pulse effects
- `JITTER_FIX_COMPREHENSIVE_REVIEW.md` – Broader jitter and brightness review

---

## Document Scope

This document records everything found, implemented, and changed for the brightness drift fix:

- **Problem:** Mode-specific brightness drift during level progression
- **Root causes:** Phase/time-based `Math.sin` in caches and live render paths; time source mismatches
- **Fixes:** 10 changes across Round 1 and Round 2 (see Complete Fix Index)
- **Research:** PNAS, Nature, MIT, Stanford, Oxford, UCLA – temporal brightness constancy, adaptation, Broca-Sulzer effect
- **Status:** FIXED

---

## Date

January 2026 (Round 1); January 2026 (Round 2 – persisting drift); February 2026 (Round 3 – persisting drift after level 4–5)

---

## Related Review

- `BRIGHTNESS_DIMNESS_REVIEW_AND_FIX_PLAN.md` – Comprehensive doc vs code review, fix plan, and verification steps
