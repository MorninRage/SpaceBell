# Fullscreen Brightness/Dim Issue – Root Cause Analysis

## Scope
- **Symptom:** Brightness/dim issue in fullscreen; less frequent in dev.
- **Working version (no issue):** `C:\bell-game\bell-game`
- **Affected version:** `C:\Backup Bell\bell-game`
- **HDR stabilizer:** Added to *mitigate* the issue; auto causes large dim/bright leaps; manual does not fix it. So the **underlying cause is not the HDR logic itself** – we need to find what actually drives the dim.

---

## Structural Differences (Backup vs Working)

### 1. Resize and dimensions
| Aspect | Backup | Working |
|--------|--------|---------|
| Resize entry | `scheduleResize()` → debounce 500ms, `_resizeDeferUntil` | Single `resize()` on window resize / fullscreen |
| Canvas size source | `resizeCanvasOnly()`: `_logicalWidth`/`_logicalHeight` from `window.innerWidth`/`innerHeight` | `resize()`: `canvas.width/height = window.innerWidth/innerHeight` |
| Size in draw | `canvasWidth`/`canvasHeight` getters → `_logicalWidth`/`_logicalHeight` | Direct `this.canvas.width`/`this.canvas.height` |
| After fullscreen enter | Double rAF → `resizeCanvasOnly()` + callbacks + `buildExactFullscreenBackgroundCaches()` | Single `resize()` |
| After fullscreen exit | `scheduleResize()` → 500ms defer, then callbacks | Single `resize()` |
| In draw() | Dimension check: if `winW/winH` ≠ `_logicalWidth`/`_logicalHeight` → `resizeCanvasOnly()` | No dimension check in draw |

**Hypothesis A – Stale logical size in fullscreen**  
If `_logicalWidth`/`_logicalHeight` are ever out of sync with the real canvas (e.g. one frame where fullscreen is active but we haven’t run the dimension check or handler yet), we could clear/draw with the wrong size (e.g. `fillRect(0,0, 800,600)` on a 1920×1080 canvas), leaving the rest of the buffer untouched or undefined → possible dim or garbage.

**Hypothesis B – Resize defer and caches**  
For 500ms after *exit* fullscreen, `onResizeCallbacks` (e.g. gradient cache clear) don’t run. So gradient cache is not invalidated on the same “tick” as resize. Unlikely to cause fullscreen-only dim, but worth keeping in mind for exit behavior.

---

### 2. HDR and double buffer (backup only)
| Item | Backup | Working |
|------|--------|---------|
| HDR / double buffer | Yes: `_hdrRenderCanvas`, `ensureHdrRenderTarget()`, `applyHdrPostProcess()` | None |
| Draw target | When HDR post-process: draw to `_hdrRenderCanvas`, then blit to main with optional `ctx.filter` brightness | Always draw to main canvas |
| Canvas CSS filter | When *not* post-process: `canvas.style.filter = brightness(...)` | N/A |
| Dimension source for HDR buffer | `ensureHdrRenderTarget()` uses `this.canvas.width`/`height` at **start** of `draw()` | N/A |

**Hypothesis C – HDR buffer size vs main canvas**  
If `ensureHdrRenderTarget()` runs before the in-draw dimension check, for one frame we could have main canvas already fullscreen (e.g. 1920×1080) but `_hdrRenderCanvas` still at previous size (e.g. 800×600). We then resize both in `resizeCanvasOnly()` in the same draw. So after that, sizes match. A one-frame mismatch could still cause a single odd frame (e.g. scaling or wrong clear). Worth verifying with diagnostics.

**Hypothesis D – HDR as sole cause**  
If disabling HDR completely (no double buffer, no filter) makes the fullscreen dim go away, the cause is in the HDR path (buffer size, blit, or filter). Use the “force HDR off” option to test.

---

### 3. Gradient cache
| Item | Backup | Working |
|------|--------|---------|
| Gradient cache | `_cachedGradients`; cleared in `onResizeCallbacks` (run after 500ms on `scheduleResize`) | `_cachedGradients`; **not** cleared on resize (only bg dirty flags) |
| Key | e.g. `ensembleBg_${w}_${h}` with current `canvasWidth`/`canvasHeight` | Same idea |

Gradients are created with current w/h when missing. So after a size change we create new keys; old keys just sit in the map. Unlikely to cause fullscreen-only dim unless a wrong size is passed (see Hypothesis A).

---

### 4. Background caches and “dimensions match”
- Backup: ensemble/individual/bell backgrounds use “dimensions match” checks. If cache size ≠ canvas, we skip cache and use live draw or draw-at-phase.
- If for many frames in fullscreen we’re using a *scaled* cache (old size → new size) due to a bug, that could look different (e.g. blur or dark edges). Backup tries to avoid that by falling back to live when dimensions don’t match.
- Working version has simpler cache usage; no `_resizeDeferUntil` or “defer rebuild” logic.

---

### 5. CSS / layout (index.html)
| Item | Backup | Working |
|------|--------|---------|
| html/body | `position: fixed`, “prevents fullscreen brightness/dimension drift” | No fixed |
| #gameContainer | `100vw/100vh`, `position: fixed`, `!important`, `background: #000` | `100vw/100vh`, `position: relative` |
| #gameCanvas | `position: absolute`, `top/left 0`, `width/height 100%` | `position: relative`, no explicit size |

Backup forces the canvas element to always fill the container (100% × 100%). So if the buffer is smaller than the container, the image is scaled up by the browser. Working version lets the canvas element size follow its buffer. Both can “fill” the window if buffer = window size; difference is how they get there. Unclear if this alone causes dim; could interact with DPR or compositor in fullscreen.

---

## What Could Cause “Dim Only in Fullscreen”

1. **Stale dimensions** (A): One or more frames where we clear/draw with `canvasWidth`/`canvasHeight` smaller than actual buffer (e.g. still windowed size while already fullscreen) → partial draw or wrong clear.
2. **HDR path** (C, D): Wrong buffer size for one frame, or the blit/filter consistently reducing luminance in fullscreen (e.g. different effective factor).
3. **Compositor / scaling**: Fullscreen element is `document.documentElement`. Browser might composite or scale differently in fullscreen; combined with our resize/cache timing we might trigger a bad path (e.g. one-frame wrong size).
4. **Dev vs prod**: In dev, window size or fullscreen usage may differ (e.g. less often true fullscreen, or different innerWidth/innerHeight timing), so the bad path is hit less often.

---

## Why would it only happen in fullscreen when HDR is on? (User‑confirmed: no dim when HDR is off)

When HDR is **off**, we draw directly to the main canvas. When HDR is **on**, we draw to an offscreen canvas (`_hdrRenderCanvas`) and then blit to the main canvas with `drawImage(...)`. The same code path runs in both windowed and fullscreen; the only difference is the size of the buffers and the fact that in fullscreen the browser is presenting a fullscreen element.

Plausible reasons it only happens in fullscreen:

1. **Compositor / presentation path**  
   In fullscreen, the browser often uses a different presentation path (e.g. exclusive or overlay). When the main canvas is updated by **direct drawing**, it may be scanned out or composited one way. When it is updated by **drawImage from an offscreen canvas**, the copy may go through a different pipeline (e.g. different gamma, color space, or scaling). That can make the same RGB values look dimmer only in fullscreen.

2. **Layer / promotion**  
   The main canvas may be promoted to a separate layer in fullscreen. Drawing into that layer directly vs. copying from another canvas can be handled differently (blending, sRGB, etc.), so only the drawImage path is affected.

3. **No bug in our logic**  
   The double‑buffer and blit code can be correct and still produce a different visual result in fullscreen because of how the browser/compositor treats “canvas filled by drawImage” in that mode.

**Conclusion:** The dim is likely from the **interaction of the HDR path (drawImage from offscreen → main) with fullscreen presentation**, not from a mistake in our math or resize logic. A practical fix is to **skip the HDR double‑buffer in fullscreen** and draw directly to the main canvas (same as HDR off), so fullscreen uses the same presentation path that already looks correct.

---

## Recommended Next Steps

1. **Force HDR off**  
   Use the new “force HDR off” option (see below) and test in fullscreen.  
   - If dim **disappears** → cause is in HDR (double buffer, blit, or filter).  
   - If dim **remains** → cause is elsewhere (resize, dimensions, cache, or layout).

2. **Diagnostics**  
   Enable the new diagnostic (see below) in fullscreen and capture:
   - Every frame (or every N frames): `canvas.width`, `canvas.height`, `_logicalWidth`, `_logicalHeight`, `window.innerWidth`, `window.innerHeight`, `isFullscreen`, HDR on/off, which background path (cache vs live).
   - Look for frames where logical size ≠ canvas size or ≠ window size.

3. **Align with working version (experiment)**  
   - Remove resize defer: on fullscreen change, call a single `resize()` (like working) and run callbacks immediately.  
   - Remove the in-draw dimension check, or make it only log instead of calling `resizeCanvasOnly()`.  
   - If dim goes away, the cause is in the defer/dimension-check interaction.

4. **Simplify layout (experiment)**  
   - Temporarily match working version’s CSS (no fixed on html/body, no 100% on canvas) and test fullscreen.  
   - If dim changes, the cause involves layout/compositor.

---

## Changes Added in Code

1. **Force HDR off (testing)**  
   In the constructor, set:
   - `this._hdrForceOff = true;  // set to true to test without any HDR path`
   and in `isHdrPostProcessActive()` (and any path that applies HDR), if `_hdrForceOff` then behave as if HDR is off (no double buffer, no filter).  
   This isolates whether the dim is from the HDR path.

2. **Fullscreen dim diagnostic**  
   When `this._bgDiagnostics` (or a new `this._fullscreenDimDiagnostic`) is enabled and we’re in fullscreen, log once per second (or per N frames):
   - `canvas.width`, `canvas.height`, `_logicalWidth`, `_logicalHeight`, `window.innerWidth`, `window.innerHeight`, `isFullscreen`, HDR active, background path.  
   Compare when dim is visible vs when it’s not.

After running these tests, we can narrow the fix to either the HDR path, the resize/dimension path, or the layout/CSS path.
