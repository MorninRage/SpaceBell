# Brightness/Dimness Issue - Comprehensive Review & Fix Plan

**Date:** February 2026  
**Status:** Analysis Complete - Fixes Identified  
**Related:** BRIGHTNESS_DRIFT_FIX.md, TIMING_FIX_DOCUMENTATION.md

---

## Executive Summary

The brightness/dimness fix (documented in BRIGHTNESS_DRIFT_FIX.md) was partially completed. The issue has improved but **persists after level 4–5**. This review compares documentation to code and identifies **remaining gaps** that cause the drift to reappear.

**Per docs:** Mode 1 (Ensemble) had dim→bright drift; Modes 2 & 3 (Individual, Bell) had bright→dim drift. The fix was to use `levelTimeElapsed` for phase and replace all `Math.sin`-based brightness with constants.

---

## Doc vs Code Verification

### ✅ What Matches Documentation

| Fix | Doc | Code | Status |
|-----|-----|------|--------|
| Individual cache twinkle | Constant 0.85 | `tw = 0.85` | ✅ |
| Ensemble/Individual/Bell live pulse | Constants | All use 0.85/0.9 | ✅ |
| Level-sync phase | levelTimeElapsed | Used when playing/levelup | ✅ |
| Bell time source | Game time | levelTimeElapsed | ✅ |
| Level-up menu time | levelTimeElapsed | Included in condition | ✅ |
| Boss intersectionPulse, cloudSize, cloudPulse | Constants | 0.85, 200, 0.85 | ✅ |
| Ethereal materials starPulse | 0.9 | 0.9 | ✅ |
| Quantum plasma cache | Constants | 0.85, etc. | ✅ |
| Player glow cache | 1.0 | 1.0 | ✅ |

### ❌ Gaps Found (Doc Says Fixed, Code Still Has Issues)

| Location | Issue | Doc | Code |
|----------|-------|-----|------|
| **drawBossBackground** | Uses `this.time` | Not in fix list | `const time = this.time \|\| 0` |
| **drawBossBackground** | Node size varies | Doc says constants | `size = 2.5 + Math.sin(time*1.5+i)*1` |
| **drawIndividualModeBackgroundPrecision (Neuro)** | coreSize varies | Doc says constants | `coreSize = 14 + Math.sin(time*1.3)*2.5` |
| **Paused state** | Time source | Not documented | Uses fallback `this.time` when paused |
| **Boss mode** | levelTimeElapsed frozen | Not documented | Boss bg uses `this.time` (keeps advancing) |

---

## Root Cause: Why It Appears "After Level 4–5"

1. **Level 5 = First Cutscene**  
   Cutscenes trigger at levels 5, 10, 20, 25, etc. The first noticeable change is at level 5.

2. **Paused State Time Mismatch**  
   When `gameState === 'paused'`, background draw uses `this.time` (cumulative) instead of `levelTimeElapsed`. Pausing causes a phase jump → brightness jump. By level 5, `this.time` is large enough that the jump is obvious.

3. **Boss Background (Level 15+)**  
   `drawBossBackground()` always uses `this.time`. During boss fights, `levelTimeElapsed` is frozen, but the boss background keeps animating with `this.time`, so brightness drifts during long boss battles.

4. **Remaining Math.sin in Backgrounds**  
   - Boss: `size = 2.5 + Math.sin(time*1.5+i)*1` → size oscillation → perceived brightness change  
   - Neuro (Precision skin): `coreSize = 14 + Math.sin(time*1.3)*2.5` → core size oscillation → brightness change  

5. **Mode 1 vs Modes 2 & 3**  
   Docs state Mode 1 had dim→bright and Modes 2 & 3 had bright→dim. The time-source fix addressed this, but the **paused** and **boss** paths were not updated, so the opposite behavior can still appear in those states.

---

## Fix Plan

### Fix 1: Extend Time-Source Condition (Paused + Cutscene)

**Problem:** When paused, background uses `this.time` instead of `levelTimeElapsed`.  
**Solution:** Include `'paused'` in the condition so we use `levelTimeElapsed` (frozen at pause moment).

**Note:** Cutscene does not draw the game background (it draws cutscene content and returns). No change needed for cutscene.

**Files:** `game.js`  
**Locations:** All background draw functions that use the time-source condition (see list below)

**Change:**
```javascript
// Before
(this.levelTimeElapsed !== undefined && (this.gameState === 'playing' || this.gameState === 'levelup'))

// After  
(this.levelTimeElapsed !== undefined && (this.gameState === 'playing' || this.gameState === 'levelup' || this.gameState === 'paused'))
```

**Affected functions:**
- `drawEnsembleModeBackground` (classic-ensemble path, line ~18109)
- `drawEnsembleModeBackground` (fallback, line ~18265)
- `drawIndividualModeBackgroundClassic` (lines ~18457, ~18471)
- `drawIndividualModeBackgroundPrecision` (line ~18522)
- `drawIndividualModeBackgroundRetroFuture` (line ~18685)
- `drawIndividualModeBackgroundNeuro` (line ~18757)
- `drawBellModeBackgroundClassic` (line ~19863)
- `drawBellModeBackgroundAuroraBorealis` (line ~19893)

---

### Fix 2: drawBossBackground Time Source

**Problem:** Boss background uses `this.time`; during boss mode `levelTimeElapsed` does not advance.  
**Solution:** Use `levelTimeElapsed` when in boss mode (frozen) for consistent brightness.

**File:** `game.js`  
**Location:** `drawBossBackground()` line ~17887

**Change:**
```javascript
// Before
const time = this.time || 0;

// After
const time = (this.levelTimeElapsed !== undefined && this.bossMode) 
    ? this.levelTimeElapsed 
    : (this.time || 0);
```

---

### Fix 3: Boss Background Node Size (Remove Math.sin)

**Problem:** `size = 2.5 + Math.sin(time*1.5+i)*1` causes size oscillation → brightness drift.  
**Solution:** Use constant size.

**File:** `game.js`  
**Location:** `drawBossBackground()` line ~17937

**Change:**
```javascript
// Before
const size = 2.5 + Math.sin(time * 1.5 + i) * 1;

// After
const size = 3.0; // Constant - was 2.5+Math.sin(time*1.5+i)*1 (size variation caused brightness drift)
```

---

### Fix 4: Neuro (Precision) Background coreSize (Remove Math.sin)

**Problem:** `coreSize = 14 + Math.sin(time*1.3)*2.5` causes size oscillation → brightness drift.  
**Solution:** Use constant size.

**File:** `game.js`  
**Location:** `drawIndividualModeBackgroundPrecision()` (Neuro path) line ~18611

**Change:**
```javascript
// Before
const coreSize = 14 + Math.sin(time * 1.3) * 2.5;

// After
const coreSize = 15.25; // Constant - was 14+Math.sin(time*1.3)*2.5 (caused brightness drift in Precision/Neuro skin)
```

---

## Implementation Order

1. Fix 1: Add `'paused'` to time-source condition (all 8+ locations)
2. Fix 2: Boss background time source
3. Fix 3: Boss node size constant
4. Fix 4: Neuro coreSize constant
5. Update BRIGHTNESS_DRIFT_FIX.md with Round 3 fixes

---

## Verification Steps

1. **Full page refresh (F5)** – Clear in-memory caches
2. **Test levels 1–6** – Verify no drift during gameplay
3. **Pause at level 3 and 5** – Verify no brightness jump when pausing/unpausing
4. **Boss at level 15** – Verify consistent brightness during boss fight
5. **Mode 1, 2, 3** – Verify all modes behave consistently
6. **Precision/Neuro skin** – If unlocked, verify no drift

---

## Related Documentation

- `BRIGHTNESS_DRIFT_FIX.md` – Original fix documentation
- `JITTER_BRIGHTNESS_FIX.md` – Earlier analysis
- `TIMING_FIX_DOCUMENTATION.md` – Resume smoothing, spike handling
