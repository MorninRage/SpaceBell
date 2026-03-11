# Fading/Dimming Issue – Comprehensive Analysis (Demo vs Backup Bell)

**Date:** March 2026  
**Issue:** Game grows faint/dim then brighter when HDR is on (at OS level). Demo does NOT have this issue.  
**Scope:** Cross-version comparison of Demo (C:\Demo) vs Backup Bell (c:\Backup Bell\bell-game)

---

## 1. Problem Summary

| Condition | Result |
|-----------|--------|
| **Demo (C:\Demo)** | No fading/dimming – stable brightness |
| **Backup Bell** | Fading: grows faint/dim, then brighter (fullscreen + OS HDR on) |
| **Backup Bell + OS HDR off** | Issue disappears |
| **Backup Bell + windowed** | Issue reduced or absent |

The in-game HDR compensation (stabilizer/auto) does **not** fix the issue and makes it worse when enabled. The issue is **not** the HDR compensation logic itself but something that gets **amplified** when the display is in HDR mode.

---

## 2. Key Differences: Demo vs Backup Bell

### 2.1 Platform & Runtime

| Aspect | Demo | Backup Bell |
|--------|------|-------------|
| **Runtime** | Electron app (SpaceBell Demo) | Browser (index.html) |
| **Fullscreen** | Same Fullscreen API | Same Fullscreen API |
| **Presentation path** | Electron/Chromium window | Browser tab/window |

**Note:** Both use `document.requestFullscreen()` on `document.documentElement`. Electron uses Chromium, so the API is the same. However, Electron’s window management and presentation can differ from a browser tab, which may affect how fullscreen + HDR is handled.

### 2.2 HDR Infrastructure

| Feature | Demo | Backup Bell |
|---------|------|-------------|
| **HDR code** | **None** | Full HDR compensation system |
| **updateHdrCompensation()** | Not present | Called **every frame** (even when HDR off) |
| **_hdrRenderCanvas** | Not present | Double buffer when HDR post-process active |
| **canvas.style.filter** | Never touched | Set/cleared by HDR logic |
| **ensureHdrRenderTarget()** | Not present | Creates offscreen canvas for HDR blit |

**Critical:** Demo has **no** HDR-related code. Backup Bell has HDR infrastructure that runs every frame, even when the user has HDR compensation disabled.

### 2.3 Resize & Fullscreen Handling

| Feature | Demo | Backup Bell |
|---------|------|-------------|
| **Resize** | Simple `resize()` – direct `canvas.width/height = window.innerWidth/innerHeight` | `scheduleResize()` → 500ms debounce, `resizeCanvasOnly()`, `_logicalWidth`/`_logicalHeight` |
| **Fullscreen enter** | `handleFullscreenChange` → `resize()` immediately | Double rAF → `resizeCanvasOnly()` → **350ms delay** → `buildExactFullscreenBackgroundCaches()` |
| **Fullscreen exit** | `resize()` immediately | `scheduleResize()` → 500ms debounce |
| **In-draw dimension check** | None | If `winW/winH` ≠ `_logicalWidth`/`_logicalHeight` → `resizeCanvasOnly()` |

**Critical:** Backup Bell runs `buildExactFullscreenBackgroundCaches()` 350ms after fullscreen enter. This is **heavy** (ensemble, individual, bell caches at fullscreen size) and causes **frame time spikes**. Docs (FULLSCREEN_BRIGHTNESS_ANALYSIS_RESEARCH.md) note that variable frame timing + fullscreen HDR pipeline can produce brightness cycles.

### 2.4 Time-Based Brightness (Math.sin)

| Location | Demo | Backup Bell |
|----------|------|-------------|
| **Backgrounds** | Many `Math.sin(time*...)*0.3+0.7` (pulse, twinkle, size) | Replaced with **constants** (0.85, 0.9, etc.) per BRIGHTNESS_DRIFT_FIX |
| **Particles** | `pulseIntensity = 0.7 + Math.sin(time*3+...)*0.3` | `pulseIntensity = 0.9` (constant) |
| **drawHeavy** | N/A (simpler pair drawing) | Always true (no 30 Hz cycle) |

**Finding:** Demo **still has** time-based brightness in backgrounds (Boss, Ensemble, Individual, Bell) yet **does not** show fading. So time-based luminance variation alone is **not** the primary cause. The difference is likely in **platform, HDR code presence, and fullscreen cache build**.

### 2.5 Layout / CSS

| Item | Demo | Backup Bell |
|------|------|-------------|
| **#gameContainer** | `position: fixed`, `100vw/100vh` | Same |
| **backdrop-filter** | Used on preload, #ui, #score, etc. | Same (reverted from earlier “avoid compositor” overrides) |
| **is-fullscreen class** | Not used | `document.documentElement.classList.toggle('is-fullscreen')` |

Layout is largely aligned; CSS is unlikely to be the main driver.

---

## 3. Root Cause Hypotheses (Prioritized)

### Hypothesis A: HDR Code Path When Disabled (HIGH)

**Observation:** Backup Bell calls `updateHdrCompensation()` every frame. When HDR is off, it returns early after possibly clearing `canvas.style.filter`. Even a one-time or rare style write could interact badly with the fullscreen HDR compositor.

**Doc reference:** FULLSCREEN_BRIGHTNESS_ANALYSIS_RESEARCH.md §12.5: *"Try **not calling** updateHdrCompensation() when HDR is disabled to rule out per-frame style touch."*

**Fix:** Guard the call: only call `updateHdrCompensation()` when `_hdrComp.enabled || _hdrComp.auto`.

### Hypothesis B: Fullscreen Cache Build → Frame Spikes (HIGH)

**Observation:** `buildExactFullscreenBackgroundCaches()` runs 350ms after fullscreen enter. It does heavy canvas work and causes frame time spikes. With VRR, variable frame rate can cause refresh-rate-dependent brightness changes.

**Doc reference:** FULLSCREEN_BRIGHTNESS_ANALYSIS_RESEARCH.md §12.5: *"Try **disabling** the fullscreen cache build entirely (e.g. skip buildExactFullscreenBackgroundCaches() when entering fullscreen) and see if the drift goes away."*

**Fix:** Add an option to skip fullscreen cache build, or move it off the critical path (e.g. Web Worker, or build at lower priority with yields).

### Hypothesis C: Electron vs Browser Presentation (MEDIUM)

**Observation:** Demo runs in Electron; Backup Bell runs in browser. Electron’s fullscreen and window handling can use a different presentation path than a browser tab. The problematic SDR→HDR mapping may only occur in the browser fullscreen path.

**Fix:** Consider packaging Backup Bell as an Electron app for users who see the issue, or test Backup Bell in Electron to confirm.

### Hypothesis D: Per-Frame canvas.style Touch (MEDIUM)

**Observation:** When HDR is off, `updateHdrCompensation()` can still set `canvas.style.filter = ''` when `currentFactor !== 1.0`. Repeated style updates might keep the compositor in a different state.

**Fix:** Same as Hypothesis A – avoid calling `updateHdrCompensation()` when HDR is disabled.

### Hypothesis E: Resize Defer / Dimension Mismatch (LOWER)

**Observation:** Backup Bell uses `_logicalWidth`/`_logicalHeight`, debounced resize, and in-draw dimension checks. A brief mismatch could cause odd frames.

**Fix:** Align resize logic with Demo (simpler, immediate resize) as an experiment.

---

## 4. Recommended Fixes (In Order)

### Fix 1: Skip updateHdrCompensation When HDR Is Disabled (Implement First)

**File:** `game.js`  
**Location:** In `draw()`, before `this.updateHdrCompensation();`

**Change:** Only call when HDR is actually used:

```javascript
// HDR compensation (SDR-in-HDR stabilization) - only when HDR features are enabled
if (this._hdrComp && (this._hdrComp.enabled || this._hdrComp.auto)) {
    this.updateHdrCompensation();
}
```

**Rationale:** Removes all HDR-related code from the draw path when the user has HDR off. Demo has no HDR code and does not fade; this brings Backup Bell closer to Demo’s behavior.

### Fix 2: Option to Disable Fullscreen Cache Build (Test)

**File:** `game.js`  
**Location:** In `handleFullscreenChange`, where `setTimeout(() => this.buildExactFullscreenBackgroundCaches(), 350)` is called.

**Change:** Add a flag (e.g. `this._skipFullscreenCacheBuild = true` for testing) to skip the call. If fading stops, the cache build is a contributor.

### Fix 3: Frame Rate Cap (User-Side)

**Doc reference:** FULLSCREEN_BRIGHTNESS_ANALYSIS_RESEARCH.md §9: Capping frame rate (e.g. 60 fps) can reduce VRR-induced brightness variation. Document this as a stability tip for fullscreen HDR users.

---

## 5. Verification Steps

1. **Apply Fix 1** – Guard `updateHdrCompensation()` when HDR is off.
2. **Test** – Fullscreen, OS HDR on, in-game HDR off. Check if fading improves or disappears.
3. **If improved** – Fix 1 is validated; consider it the primary fix.
4. **If unchanged** – Try Fix 2 (disable fullscreen cache build) and retest.
5. **Compare with Demo** – Run Demo in fullscreen with OS HDR on to confirm it stays stable.

---

## 6. Document References

| Doc | Content |
|-----|---------|
| BRIGHTNESS-HDR-CHANGELOG.md | HDR investigation, context resets, draw pipeline |
| BRIGHTNESS_PULSATION_DIMMING_ANALYSIS.md | Pulsation sources (particles, bullets, blend modes) |
| FULLSCREEN_BRIGHTNESS_ANALYSIS_RESEARCH.md | Fullscreen-only dim, pipeline, VRR, hypotheses A–D |
| BRIGHTNESS_DIM_ANALYSIS.md | Structural differences, force HDR off, diagnostics |
| BRIGHTNESS_DRIFT_FIX.md | Level-progression drift fixes (phase, constants) |
| BRIGHTNESS_COMPREHENSIVE_REVIEW.md | Mode 1 overlay, levelTimeElapsed remainder |

---

## 7. Summary

The fading/dimming in Backup Bell (fullscreen + OS HDR) is **not** seen in Demo. Main differences:

1. **Demo has no HDR code** – Backup Bell has HDR infrastructure that runs every frame.
2. **Demo has simpler resize** – No fullscreen cache build, no heavy post-enter work.
3. **Demo may use a different presentation path** – Electron vs browser.

**Primary fix:** Stop calling `updateHdrCompensation()` when HDR is disabled. This removes HDR-related code from the draw path and aligns behavior with Demo when the user has HDR off.
