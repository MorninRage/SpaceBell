# Fullscreen-Only Brightness / Dimming: Deep Analysis and Research-Based Hypotheses

**Date:** February 2026  
**Premise:** The issue occurs **only in fullscreen**, and **only when the game’s HDR stabilizer and auto are OFF**. The in-game HDR system was **designed to fix this issue** but does not fix it and makes it worse when enabled. Disabling HDR at the OS level or leaving fullscreen (windowed) eliminates the issue. Those workarounds are not treated as “the cause”; the goal is to identify what in the fullscreen pipeline or in our methods could explain the symptom. **Mitigations implemented:** Hypothesis A — `drawHeavy` is now always `true` (no 30 Hz luminance cycle). Hypothesis B — fullscreen cache build deferred 350 ms and yields between ensemble/individual/bell. Hypothesis C — in `drawPairs`, `bondPulse`, `puzzlePulse`, `particlePulse`, and puzzle halo `flicker` are constants.

---

## 1. Precise Problem Statement

| Condition | Result |
|-----------|--------|
| **Windowed mode** | No brightness/dimming issue (or negligible). |
| **Fullscreen + game HDR ON** | Issue persists or worsens (game’s correction does not fix it). |
| **Fullscreen + game HDR OFF** | Issue present (the case we are analyzing). |
| **Fullscreen + OS HDR OFF** | Issue goes away. |
| **Fullscreen + OS HDR ON** | Issue present. |

So the combination **fullscreen + OS HDR on** is necessary for the symptom, and the **game’s HDR compensation is not the fix** (and is counterproductive when enabled). The game draws a **2D canvas with SDR content** (sRGB-like values); no HDR canvas or HDR API is used. The display is HDR-capable and HDR is enabled at the system level.

---

## 2. What Is Different in Fullscreen (Pipeline, Not Blame)

We do not assume “fullscreen” or “OS HDR” are the direct cause; they change the **path** the pixels take. Identifying what changes in that path helps narrow where the symptom could originate.

### 2.1 Browser and OS Behavior

- **Fullscreen API:** The game calls `requestFullscreen()` on **document.documentElement** (the `<html>` element). The Fullscreen API is asynchronous; the browser and OS may switch presentation mode (e.g. exclusive fullscreen vs borderless fullscreen, or different compositor paths).
- **Chromium / Windows:** Documentation and user reports indicate that in **fullscreen**, HDR content can use different backlight/zone control than in windowed mode; in **windowed** mode the SDR brightness slider can affect how HDR content is shown; in **fullscreen** the behavior can differ. So the **same SDR canvas** may be interpreted differently by the OS/display when the window is fullscreen vs windowed.
- **SDR on HDR display:** When the display is in HDR mode, SDR content (our canvas) is typically mapped into the HDR signal (e.g. SDR → HDR tone mapping or fixed mapping). That mapping can depend on:
  - Whether the app is fullscreen or windowed.
  - How the compositor (e.g. DWM) presents the buffer (gamma, color space, metadata).
  - Per-frame or per-present behavior (e.g. if the display or driver does any analysis of frame content or timing).

So in fullscreen, our **unchanged** canvas pixels may be going through a **different pipeline** (compositor, gamma, SDR→HDR mapping, backlight) than in windowed mode. That difference is a candidate environment for the symptom, even if the root cause is something we do (e.g. periodic luminance variation) that only becomes visible in that pipeline.

### 2.2 Gamma and Compositor (Research and Docs)

- **Microsoft / DXGI:** In true fullscreen exclusive mode, applications can control gamma via hardware (e.g. `SetGammaControl`); in windowed mode the DWM compositor controls the pipeline. So **gamma and final brightness** can differ between fullscreen and windowed.
- **“Fullscreen optimizations”:** On Windows, “fullscreen” games are often run in an optimized **borderless windowed** mode rather than true exclusive fullscreen. The browser’s fullscreen is not necessarily exclusive; the exact path (DWM vs exclusive) is implementation-dependent. In any case, **fullscreen vs windowed can use different compositor and gamma paths**.
- **CSS/layout:** The game intentionally avoids forcing the canvas to 100% width/height so that “the compositor does not scale” and to “avoid fullscreen HDR dim.” So in fullscreen the canvas size matches the fullscreen dimensions (buffer size = innerWidth/innerHeight), and no extra CSS scaling is applied. That reduces one source of scaling-induced dimming but does not remove pipeline differences (SDR→HDR, gamma, backlight).

Conclusion: **Fullscreen changes the display pipeline** (presentation, SDR→HDR mapping, possibly gamma and backlight). The symptom could be (a) the pipeline itself reacting to something (e.g. frame timing or content), or (b) our content or timing creating a signal that only becomes visible as brightness/dimming when that pipeline is active.

---

## 3. Performance Spikes and Internal Cycles

If the display or compositor reacts to **frame timing** or **frame content**, then any **periodic or sporadic** change in our workload or draw pattern could correlate with perceived brightness cycles. Below are the main sources of **variable frame timing** and **repeating draw patterns** in the game.

### 3.1 Heavy Work Immediately After Entering Fullscreen

**Location:** `fullscreenchange` handler → `buildExactFullscreenBackgroundCaches()` (~908–923).

- On **entering** fullscreen, after two `requestAnimationFrame` callbacks, the game calls `buildExactFullscreenBackgroundCaches()`. This builds ensemble, individual, and bell background caches at the **current fullscreen size** (async, on the main thread).
- That work is **expensive** (many canvas operations, many frames per cache). It can cause **frame time spikes** (e.g. 50–200 ms or more) for a period after going fullscreen.
- **Effect:** For a short time after fullscreen, frame rate is irregular. If the display or VRR reacts to frame timing (see Section 5), this burst of spikes could coincide with the user’s first impression of “fullscreen is bad.” It could also leave a short-term pattern of “smooth then spike then smooth” that might be perceived as a brightness or stability cycle.

### 3.2 Every-Other-Frame “Heavy” Draw (2-Frame Cycle)

**Location:** `drawPairs()` and related pair/puzzle drawing (~29669, 29710, 29859, 29894, 29943).

- `drawHeavy = (this._frameSkipToggle = !this._frameSkipToggle) === false` so that **every other frame** a set of “heavy” draws is **skipped**.
- When `drawHeavy` is true, the game draws:
  - **shadowBlur = 16** for puzzle glow on the bond stroke;
  - puzzle glow with **shadowBlur** on pair particles;
  - an extra **halo** fill for the pair.
- So **frame N** has more glow (shadowBlur + halo) and **frame N+1** has less. At 60 fps this is a **30 Hz** alternation of “brighter” vs “dimmer” frame content.

**Why this could matter in fullscreen on HDR:**

- The **luminance** of the canvas literally alternates every frame (more glow vs less glow). That is a **periodic 30 Hz component** in the signal we send to the compositor.
- Vision research (see Section 5) shows that **temporal modulation** and **stimulus duration** affect perceived brightness; flicker perception depends on luminance and size; VRR and aperiodic frame timing can increase perceived flicker. So a **30 Hz content cycle** could be perceived as flicker or a fast “pulse,” especially on large, bright regions (e.g. fullscreen).
- On an HDR display, **tone mapping or backlight** may respond to frame-by-frame luminance. If the display or driver does any per-frame or short-term adaptation, the 30 Hz alternation could be amplified or converted into a more noticeable brightness/dimming cycle in fullscreen, where the pipeline is different from windowed.

So we have a **clear, deterministic 2-frame cycle** in draw content (shadowBlur and halo on/off every other frame) that could, in principle, produce a **30 Hz brightness modulation** that is more visible or more “processed” in fullscreen on HDR.

### 3.3 Remaining Time-Based Brightness in Draw Paths

Even with many `Math.sin`-based values replaced by constants (see BRIGHTNESS_DRIFT_FIX.md), some **object-level** draws still use time-based intensity:

- **Particles:** `pulseIntensity = 0.7 + Math.sin(time*3 + ...)*0.3` (period ~2.1 s).
- **Bullet ring:** `Math.sin(time*4)*0.3+0.7` (period ~1.57 s).
- **Bell pairs (drawPairs):** `bondPulse = 0.5 + Math.sin(time*1.5 + pairIndex)*0.3`, `puzzlePulse = 0.8 + Math.sin(time*3 + pairIndex)*0.2` (multiple periods).
- **Ships / UI:** Various `Math.sin(t)*...` for panel/cockpit pulse.

These add **slower** (sub-Hz) luminance variation. They could contribute to a general “breathing” or “pulsing” over several seconds. They do **not** explain why the issue is **fullscreen-only** unless the fullscreen pipeline (or our fullscreen-only workload, e.g. cache build) amplifies or gates their visibility.

### 3.4 Frame Time Spikes (Delta Time Caps and Smoothing)

**Location:** Game loop (~55814–55844).

- `rawDelta` is capped at 100 ms; **severe spikes** (> 50 ms) are capped at 50 ms for update, but **draw** still runs every frame. So when a spike happens, the **next frame** is drawn after a long interval (e.g. 50 ms). That frame is then visible for that longer duration (or until the next present).
- So we have **irregular frame timing**: sometimes 16 ms, sometimes 30–50 ms or more (e.g. after GC, cache build, or tab focus). That creates **aperiodic** variation in both “time between frames” and “how long a given frame is on screen.”

If the display or driver does any of the following:

- Holds the previous frame until the next present (so “long” frames are held longer),
- Adjusts tone mapping or backlight based on recent frame luminance or frame rate,
- Or if VRR changes refresh rate with frame timing,

then **variable frame timing** could translate into **variable perceived brightness** (e.g. “bright” frame held longer, or tone mapping reacting to a burst of “dim” or “bright” frames). Research (Section 5) supports that **temporal context** and **stimulus duration** affect perceived brightness and that **VRR + variable frame times** can increase flicker. So **performance spikes** are a plausible **enabler** of brightness/dimming perception in fullscreen, even if they are not the only factor.

### 3.5 No Game-Side HDR When Game HDR Is Off

When the user turns **game HDR off**:

- `updateHdrCompensation()` returns early when `!comp.enabled && !comp.auto`; it clears `canvas.style.filter` (and cutscene canvas) so **no** `brightness(...)` filter is applied.
- The canvas is drawn with **no post-process** and **no CSS filter**. So the **only** luminance variation we send is from the **actual draw content** (every-other-frame glow, time-based pulse, and frame-time-induced timing).

So under “game HDR off, fullscreen, OS HDR on,” the **only** sources of luminance change are:

1. **Content:** 2-frame cycle (drawHeavy), time-based pulse (particles, pairs, bullets, ships, UI).
2. **Timing:** Variable frame delivery (spikes, VRR, etc.) affecting how long each frame is shown and possibly how the display responds.

The game is **not** adding a second layer of correction that could fight or worsen the display; we are only feeding raw canvas content and timing into the fullscreen HDR pipeline.

---

## 4. Why the Game’s HDR Correction Might Make It Worse

The in-game HDR system was meant to correct brightness but **makes the issue worse** when enabled. Plausible reasons (without changing code):

- **Feedback loop:** It samples **frame luminance** (e.g. every 6 frames), computes a **target** (windowed vs fullscreen), and applies a **brightness()** filter so that “current luma” tracks “target luma.” In fullscreen, the **display** may already be doing its own mapping (SDR→HDR, backlight, tone mapping). Our **correction** then reacts to the **result** of that mapping (e.g. “frame looks dim” → we boost; display reacts to the boosted frame → next sample looks different → we adjust again). So we get **two** adaptive systems (game + display) interacting, which can **oscillate** or overcorrect and feel like stronger brightness/dimming cycles.
- **Wrong reference:** The target luma is derived from an EMA of sampled luminance. In fullscreen on HDR, the **meaning** of “luminance” in the buffer may not match what the user sees (e.g. display applies its own curve). So we might be correcting toward a reference that doesn’t match the user’s perception, making the image too bright or too dim and increasing the **range** of perceived change.
- **Temporal mismatch:** We sample every 6 frames and smooth (EMA, correction smoothing). If the **display** reacts faster (e.g. per-frame or per–present), our slower correction can lag and create a visible “chase” (brightness overshooting then undershooting), which could feel like a cycle.

So “game HDR makes it worse” is consistent with the game’s correction **conflicting** with or **duplicating** the display’s adaptation, rather than fixing the underlying cause (which we hypothesize is pipeline + content/timing, not “too dim on average”).

---

## 5. Research Perspective (MIT, Stanford, Oxford, UCLA, and Related Work)

We frame the problem and our methods in terms of published vision and display science to see what might explain **fullscreen-only** brightness/dimming and to guide future fixes.

### 5.1 Temporal Brightness Perception and Context (Nature, PNAS)

- **Nature (2004) – Perceived luminance depends on temporal context:**  
  Perceived brightness depends on **temporal context**. Two streams (adapting and non-adapting) encode brightness; the **relation in time** between stimuli affects what we perceive. So the **same** luminance can look brighter or dimmer depending on what came before and when.  
  **Implication:** If in fullscreen the **timing** of frames (or the **content** of adjacent frames) differs from windowed—e.g. due to compositor, VRR, or our every-other-frame pattern—the **perceived** brightness could differ even if per-frame luminance were identical. So “only in fullscreen” could be explained by a **different temporal context** in that mode (e.g. different present timing or buffer handling).

- **PNAS (2012) – Optimizing the temporal dynamics of light to human perception:**  
  **Temporal brightness constancy** and the **Broca–Sulzer effect**: perceived contrast peaks at **50–100 ms** stimulus duration. So the **duration** each frame is visible (which depends on frame rate and frame time variance) affects perceived brightness.  
  **Implication:** **Variable frame timing** (e.g. 16 ms vs 50 ms visible time) could make some frames appear brighter or dimmer than others, contributing to a **cycle** feeling. In fullscreen, present timing and VRR behavior can differ from windowed, so this effect could be stronger there.

### 5.2 Lightness Constancy and Adaptation (UCLA, Optics)

- **Lightness constancy under temporally varying illumination (e.g. temporal sinusoid):**  
  The visual system **adapts** to changing illumination over time. Adaptation has a **time course**; if our **content** or the **display’s** mapping varies in time (e.g. 30 Hz from drawHeavy, or slow sine from particles), the adaptation stream may not fully stabilize, so perceived brightness can **drift** or **oscillate**.  
  **Implication:** Any **periodic or quasi-periodic** variation we introduce (every-other-frame, or sin(time) pulse) could prevent the system from reaching a stable adaptation in fullscreen, especially if the display pipeline adds its own temporal variation (e.g. tone mapping, backlight).

### 5.3 VRR and Flicker (Display / Perception)

- **VRR and flicker:**  
  Variable Refresh Rate can cause **aperiodic** luminance waveforms (frame times and refresh rate both vary). This is associated with **increased perceived flicker**, especially when luminance is high and stimulus size is large. Flicker perception is not fully captured by simple flicker indices when the waveform is aperiodic.  
  **Implication:** In fullscreen we may be more likely to use a **different** present/refresh path (e.g. VRR, or different vsync behavior). If our **content** already has a 30 Hz component (drawHeavy) or irregular frame timing (spikes), the combination **fullscreen + VRR (or fullscreen-specific timing)** could produce **flicker or brightness cycles** that are not present in windowed mode.

### 5.4 SDR on HDR Display and Fullscreen (Microsoft, Chromium, User Reports)

- **Windows HDR fullscreen:**  
  SDR content on HDR displays in fullscreen can have **mismatches** (e.g. blank screens, color/brightness distortion). The **path** for SDR→HDR and backlight/zone control can differ between fullscreen and windowed.  
  **Implication:** Our SDR canvas, in fullscreen, may be **mapped** or **interpreted** differently (e.g. different effective gamma, or different per-frame or per-window adaptation) so that the **same** pixel values produce different perceived brightness or different **temporal** behavior (e.g. more sensitive to frame-to-frame variation).

- **Chromium / SDR slider:**  
  In some configurations, the SDR brightness slider affects HDR content in windowed mode but not in fullscreen; fullscreen HDR can use different backlight control.  
  **Implication:** Again, **fullscreen uses a different pipeline**; our SDR canvas in that pipeline may be more sensitive to content or timing, explaining “only in fullscreen.”

### 5.5 Gamma and Compositor (Microsoft DXGI, Gamedev)

- **Fullscreen vs windowed:**  
  In true fullscreen exclusive, the app can control gamma at the end of the pipeline; in windowed mode the compositor (DWM) controls the pipeline. So **gamma and final brightness** can differ between the two.  
  **Implication:** Even with **identical** canvas content, fullscreen could look systematically different (e.g. dimmer or brighter on average) and could **respond differently** to temporal variation (e.g. different effective curve or temporal smoothing), making a 30 Hz or spike-driven variation more visible as “brightness/dimming” in fullscreen.

---

## 6. Synthesis: Hypotheses That Fit the Premise

We combine: (1) fullscreen-only, (2) game HDR off (so no game-side filter), (3) OS HDR on, (4) pipeline and research above.

**Hypothesis A – Every-other-frame luminance (drawHeavy)**  
We send a **30 Hz** luminance modulation (more glow vs less glow every other frame). In **windowed** mode, the compositor or display may smooth or ignore this. In **fullscreen on HDR**, the pipeline (SDR→HDR, tone mapping, or backlight) may **respond** to it, so the user perceives it as brightness/dimming or flicker. Vision research (temporal context, Broca–Sulzer, VRR flicker) supports that such a **periodic** signal can be perceived as brightness variation, especially at fullscreen size and with possible VRR.

**Hypothesis B – Variable frame timing + fullscreen pipeline**  
**Frame time spikes** (cache build, GC, resume, etc.) and **variable frame delivery** create **aperiodic** variation in “how long each frame is on screen” and “what the display sees” (e.g. frame rate). In fullscreen, the **display or driver** (tone mapping, VRR, backlight) may react to this variation more than in windowed, producing perceived **brightness/dimming cycles** that track performance. PNAS (stimulus duration) and VRR flicker research support that **timing** variance can translate into **brightness** perception.

**Hypothesis C – SDR→HDR mapping and temporal context**  
In fullscreen, SDR content is mapped into the HDR path. That mapping may be **sensitive to frame content or history** (e.g. per-frame or short-term average). Our **content** (30 Hz + slow sin(time) pulse + irregular timing) then produces a **varying** input to that mapping, and **Nature**-style temporal context makes the **same** luminance look different in different frames. So the **combination** of our varying signal and the fullscreen HDR pipeline could produce the perceived cycle, even if windowed mode does not.

**Hypothesis D – Game HDR as amplifier**  
When game HDR is **on**, we add a **second** temporal loop (sample → target → correct → display → sample). The **display** also adapts. The two loops can **interact** (e.g. oscillate or overcorrect), so the user sees **stronger** or more erratic brightness/dimming. When game HDR is **off**, we remove our loop but the **underlying** driver (A–C) remains; so the issue is still there but not worsened by our correction.

---

## 7. Summary Table: What We Do vs What the Pipeline Does

| Layer | Windowed | Fullscreen (OS HDR on) |
|-------|----------|-------------------------|
| **Game draw** | Same content: 2-frame cycle (drawHeavy), time-based pulse, variable frame timing. | Same. |
| **Game HDR** | If on: filter applied; if off: no filter. | Same. |
| **Browser** | Presents window; normal compositor path. | Fullscreen API; possibly different present/compositor path. |
| **OS / GPU** | DWM; SDR window; possibly different gamma and SDR→HDR handling. | Possibly different path (gamma, exclusive/borderless, metadata). |
| **Display** | SDR content in HDR mode; backlight/slider behavior can differ. | Different backlight/zone or tone mapping behavior in some configs. |
| **Perception** | Temporal context and adaptation from one set of timings and pipeline. | Temporal context and adaptation from **another** set of timings and pipeline → symptom appears. |

---

## 9. G-Sync, VRR, and Anti-Aliasing: Will They Help?

Research and display testing (RTINGS, NVIDIA, AMD, Blur Busters, display manufacturers) clarify how G-Sync / VRR and anti-aliasing interact with brightness flicker and our fullscreen-HDR scenario. **Summary:** G-Sync/VRR often **worsen** or **expose** brightness flicker when frame timing is variable; they do **not** fix it. Anti-aliasing in our 2D canvas context has limited relevance; driver-level AA is speculative.

### 9.1 G-Sync / VRR: Do They Help?

**Short answer: No — and they can make the problem worse.** Enabling G-Sync (or FreeSync / VESA Adaptive Sync) does **not** prevent VRR-related brightness flicker; in many setups it is part of the chain that produces it.

**Mechanism (research and testing):**

- **Refresh rate ↔ brightness:** Many panels (especially OLED and VA, but also some IPS) show **different brightness at different refresh rates**. With VRR, the monitor’s refresh rate tracks the game’s frame rate. So when frame rate **varies** (e.g. 60 → 55 → 48 → 60), refresh rate varies → **perceived brightness varies** → user sees brightness flicker or dimming/brightening cycles.
- **RTINGS and others:** VRR flicker is measured by switching between high and slightly lower refresh (e.g. 120 Hz vs 110 Hz) and measuring **brightness change**. Gaming OLEDs and many VA/IPS panels show measurable and sometimes severe VRR brightness flicker. **G-Sync, FreeSync, and Adaptive Sync do not eliminate it**; the effect is tied to the panel and driver behavior, not the brand of VRR.
- **Low Frame Rate Compensation (LFC):** When FPS drops below the monitor’s VRR minimum (e.g. 48 Hz), the display may “double” frames (e.g. 30 fps presented as 60 Hz). **Transitions in and out of LFC** (e.g. FPS hovering around 48) cause **refresh rate to jump** (e.g. 48 Hz ↔ 96 Hz), which again changes brightness and produces visible flicker. So **variable frame timing** (e.g. our cache build, GC, or draw spikes) that pushes FPS near the VRR minimum can trigger LFC boundary flicker.

**Implication for our game:**

- Our fullscreen scenario already has **variable frame timing** (cache build on fullscreen enter, possible GC, 2-frame drawHeavy cycle). With **G-Sync on**, the display’s refresh rate **follows** that variation → more opportunity for **refresh-rate-dependent brightness change** → flicker or dimming cycles can **increase** in fullscreen with VRR, not decrease.
- So **G-Sync is not a fix**. It can **amplify** the symptom when frame rate is inconsistent.

**What can help (user / system level):**

- **Cap frame rate** (e.g. 60 fps or 2–3 fps below max refresh) so that refresh rate stays **stable**. That reduces VRR-induced brightness variation. Many guides recommend this to reduce or eliminate VRR flicker.
- **Stay above the VRR minimum** (e.g. cap at 60 if minimum is 48) to avoid LFC boundary transitions and the associated brightness jumps.
- **Disable G-Sync / VRR** for this game (or globally) if the issue persists; that removes refresh-rate variation and returns to fixed refresh, which often eliminates this type of flicker at the cost of possible tearing.

So: **G-Sync and similar VRR do not help** with our kind of fullscreen brightness/dimming; they can make it worse. **Stable frame rate** (e.g. cap) or **disabling VRR** for this title are more likely to help.

### 9.2 Anti-Aliasing: Will It Help?

**Context:** Our game is a **2D canvas** (no 3D pipeline, no TAA/MSAA in the GPU sense). “Anti-aliasing” here means: (1) **canvas** `imageSmoothingEnabled` / `imageSmoothingQuality` when we scale draws (e.g. cached frames), and (2) **driver-level** AA (e.g. NVIDIA Control Panel “Antialiasing”) applied to the browser window.

**Canvas smoothing (2D):**

- `imageSmoothingEnabled` (default true) controls whether scaled `drawImage` calls use bilinear (or better) filtering vs nearest-neighbor. It affects **edge sharpness** and **sub-pixel shimmer** when the same content is drawn at slightly different positions or scales frame-to-frame. **Smoothing on** can reduce high-frequency **spatial** variation at edges (less “crawling” or “shimmer” on scaled sprites). That could, in theory, slightly reduce high-frequency luminance variation that might interact with tone mapping or flicker perception — but the effect is **small** and not well documented for our exact scenario. It does **not** address the **30 Hz** (every-other-frame) or **frame-timing** sources we identified.
- So: canvas smoothing is good for **image quality** and might marginally reduce edge-related shimmer; it is **not** a meaningful fix for fullscreen brightness/dimming cycles.

**Driver-level AA (FXAA, MSAA, etc.):**

- If the user forces AA (e.g. FXAA) on the browser process, the GPU applies a post-pass that blurs/smooths edges. That could **low-pass filter** the final image slightly. Theoretically that might **attenuate** very high-frequency spatial or temporal variation (e.g. make a 30 Hz content cycle slightly less sharp), but:
  - There is **no** strong evidence that driver AA reduces **brightness** flicker or **refresh-rate-dependent** flicker; most AA discussion is about **spatial** aliasing and **temporal** shimmer in 3D (TAA).
  - In 2D canvas in a browser, the pipeline (compositor, scaling) is different; driver AA may have limited or unpredictable effect.
- **TAA** (temporal anti-aliasing) in 3D is **not** applicable here (we have no TAA). TAA is also known to **introduce** temporal artifacts (shimmer, ghosting) when not tuned well; we are not adding that.

**Conclusion on AA:** Anti-aliasing in our context is **unlikely to fix** fullscreen brightness/dimming. Enabling or improving **canvas** smoothing may help **image quality** and edge stability when we scale; **driver** AA is speculative and not a relied-on solution for this issue.

### 9.3 Summary: G-Sync and AA

| Approach | Helps? | Notes |
|----------|--------|------|
| **Enable G-Sync / VRR** | **No** — can worsen | Refresh rate tracks frame rate; variable FPS → variable refresh → brightness variation. VRR does not prevent this. |
| **Cap frame rate (with or without G-Sync)** | **Yes, often** | Keeps refresh rate stable → less brightness flicker from VRR; avoids LFC boundary if cap is above VRR minimum. |
| **Disable G-Sync / VRR for this game** | **Yes, often** | Removes refresh-rate variation; fixed refresh can eliminate VRR-induced brightness flicker (may see tearing instead). |
| **Canvas imageSmoothingEnabled (2D)** | **Marginal** | Reduces edge shimmer when scaling; small possible benefit for high-frequency variation, not a fix for 30 Hz or timing. |
| **Driver-level AA** | **Unclear / speculative** | No strong evidence it reduces brightness flicker; might slightly smooth image; not a primary lever. |

So for **our** fullscreen-HDR brightness/dimming issue: **G-Sync and VRR do not help** and can make it worse; **frame rate capping** or **disabling VRR** for this game are the user-side levers that align with research. **Anti-aliasing** (canvas or driver) is at best a minor, secondary consideration, not a solution.

---

## 10. Conclusion and Next Steps (Discussion Only)

- The issue is **fullscreen-only** with **game HDR off** and **OS HDR on**. The game’s HDR does not fix it and makes it worse when enabled; disabling OS HDR or leaving fullscreen removes the symptom.
- **Pipeline:** Fullscreen changes the path (compositor, SDR→HDR, gamma, backlight/tone mapping). That different path is a necessary condition for the symptom; the “cause” may be **our** content or timing becoming visible or amplified there.
- **Internal cycles and spikes:** We have (1) a **deterministic 30 Hz** component from **drawHeavy** (every-other-frame glow), (2) **slower** time-based luminance from particles/pairs/bullets/ships, and (3) **irregular frame timing** (fullscreen cache build, GC, delta cap). Research (MIT/Stanford/Oxford/UCLA, Nature, PNAS, VRR flicker, SDR/HDR fullscreen) supports that **temporal context**, **stimulus duration**, **periodic modulation**, and **variable frame timing** can all affect perceived brightness and flicker, and that **fullscreen + HDR** can use a pipeline that reacts differently to the same content.
- **Plausible mechanisms:** (A) 30 Hz drawHeavy cycle is visible or amplified in fullscreen HDR; (B) frame time variance + fullscreen pipeline produces brightness cycles; (C) SDR→HDR mapping + temporal context turns our varying content into perceived dimming/brightness; (D) game HDR adds a second adaptive loop that worsens the effect.

**No code changes** were made. This document is for **discussion and analysis** only. The next step would be to design **experiments or mitigations** (e.g. remove or smooth the 2-frame cycle, stabilize frame timing where possible, cap in-game frame rate for VRR stability, or test with OS HDR off vs on and windowed vs fullscreen) and then implement and validate in a later phase.

---

## 11. Why Toggling Fullscreen Resets Brightness to Stable (Not a Constant Drift)

**Observation:** The problem is a **global** gradual dimming (or brightness drift) in fullscreen. **Exiting fullscreen and re-entering fullscreen** does **not** leave the image at the drifted level — it brings the image back to a **stable** brightness. So the drift is not “the game keeps getting dimmer forever”; it is something that **accumulates or adapts over time** in fullscreen and is **reset** when the user toggles fullscreen.

### 11.1 What “Reset” Implies

- The **source** of the slow drift is almost certainly **outside** the game’s draw content: if it were purely our canvas luminance, toggling fullscreen would not “fix” it — we would still be drawing the same values and the drift would continue from wherever it was.
- So the drift is coming from a **stateful** part of the pipeline that:
  1. **Runs (or matters) mainly in fullscreen** — hence “only in fullscreen.”
  2. **Changes over time** — hence gradual dimming/brightness change.
  3. **Is reinitialized when the fullscreen mode changes** — hence “windowed then back to fullscreen” gives a stable brightness again.

That points to **display, driver, or OS** behavior that keeps **temporal state** in fullscreen and **drops that state** when the presentation mode changes.

### 11.2 Why the Pipeline State Resets on Fullscreen Toggle

When the user exits fullscreen and then goes fullscreen again, several things happen that can clear or reset that state:

1. **Swap chain / present path change**  
   Exiting fullscreen tears down the current fullscreen swap chain (or borderless-fullscreen path). The compositor may switch from “fullscreen app” to “windowed app.” Re-entering fullscreen creates a **new** fullscreen swap chain or reuses a different path. Many drivers and OS components **reinitialize** state when a swap chain is created or when the presentation mode (exclusive fullscreen vs windowed vs borderless) changes. So any **running averages**, **tone-mapping history**, or **backlight adaptation** that were drifting in the old fullscreen session are **discarded** when that session ends; the new fullscreen session starts with **fresh** state → stable brightness until the drift builds up again.

2. **SDR→HDR mapping and “scene” memory**  
   On SDR-on-HDR displays, the mapping from SDR input to HDR output (or to backlight/zone control) often uses **per-scene** or **per-session** state: e.g. a running estimate of max or average luminance, or a tone curve that adapts over time. In **fullscreen**, that state is tied to the fullscreen surface. When you **exit** fullscreen, that surface is destroyed or no longer “active” for HDR; the display or driver may **reset** that adaptation (or the OS may hand control back to the desktop compositor, which has its own state). When you **re-enter** fullscreen, a new fullscreen surface is created and the SDR→HDR or backlight logic starts again from **default/initial** state → stable brightness, then over the next minutes it **readapts** and the drift reappears.

3. **Backlight / ABL (Auto Brightness Limiting) and temporal filtering**  
   Some panels use **ABL** or similar logic that adjusts backlight (or zone brightness) based on recent content. That logic often has a **time constant** (e.g. slow integration over many seconds). In fullscreen, the “content” it sees is our game; it may slowly **reduce** backlight if it thinks the scene is “bright” on average, or vice versa. When you **exit** fullscreen, the display briefly shows the desktop (different APL); the backlight/ABL logic may **reset** or **re-sample** because the “scene” changed. When you go **back** fullscreen, it starts again from that new baseline → stable, then drift resumes as it re-adapts to the game.

4. **DWM / compositor handoff**  
   On Windows, going from fullscreen to windowed means the DWM (or other compositor) takes over composition again; going back to fullscreen may bypass DWM again. That handoff can **clear** any per-fullscreen-app state the compositor or driver was holding (e.g. cached tone mapping, gamma, or HDR metadata). So again: **new** fullscreen session → **fresh** state → stable until the same adaptation runs again.

### 11.3 Summary: Why the Reset Happens

| Question | Answer |
|----------|--------|
| **Why does toggling fullscreen give stable brightness?** | Exiting fullscreen **tears down** the current fullscreen presentation path (swap chain, HDR path, or compositor mode). Re-entering fullscreen **creates a new** path. Display, driver, and OS components **reinitialize** their state when the mode changes, so any **temporal adaptation** (tone mapping, backlight, SDR→HDR “memory”) that was **drifting** in the previous fullscreen session is **reset**. The new session starts from a clean state → stable brightness; the drift then **reaccumulates** over time in the new session. |
| **Why is the problem “global” and only in fullscreen?** | The drift comes from **pipeline state** (tone mapping, backlight, or SDR→HDR adaptation) that is **tied to the fullscreen path** and that **changes over time**. It is applied **globally** to the whole image (e.g. backlight or global tone curve), so the whole screen dims or brightens. In windowed mode, either that path is not used or its state is different (e.g. compositor-driven, or reset more often), so the drift is not seen. |
| **What can we do about it?** | The **root cause** is in the display/driver/OS fullscreen+HDR pipeline, not in the game’s pixel output. **In-game** options are limited. **User-side** options: disable OS HDR, stay windowed, or periodically toggle fullscreen to “reset” (workaround). **System/display** options: firmware/driver updates, different fullscreen or HDR settings, or cap frame rate / disable VRR to reduce timing-driven adaptation (see Section 9). A periodic fullscreen reset from code was considered but reverted as too disruptive for the player. |

---

## 12. How Might We Fix This? (Pipeline-Aware Options)

The **root cause** is in the fullscreen+HDR pipeline (display/driver/OS): temporal adaptation (tone mapping, backlight, SDR→HDR "memory") that drifts in fullscreen and resets when fullscreen is toggled. We cannot change that pipeline from the game; we can only **work around** it or **reduce** what we feed into it.

### 12.1 Game-Side Options

| Option | Description | Trade-off |
|--------|-------------|-----------|
| **Reset fullscreen periodically** | Exit then re-enter fullscreen on a timer (e.g. every 10 s) to reset display/driver state (Section 11). | **Not implemented** — considered too disruptive for the player (repeated flash). |
| **Borderless fullscreen** | Offer "fullscreen (borderless)" — maximize the window to screen size with no chrome instead of using the Fullscreen API. That may use the **windowed** compositor path and avoid the fullscreen-only pipeline that drifts. | Would require implementing a maximized-window mode; behavior is browser/OS-dependent. |
| **Minimize temporal variation** | We already did this (drawHeavy always on, constant pulses, deferred cache build). Continuing to remove or smooth any remaining time-based luminance or frame-timing variance reduces the **signal** the pipeline adapts to. | No downside; we keep the current mitigations. |
| **Frame rate cap** | Expose or default a 60 fps (or user refresh) cap so VRR and frame timing are stable. That can reduce **refresh-rate-dependent** brightness variation (Section 9). | Already available (fps cap setting); document as a stability tip for fullscreen HDR. |

### 12.2 User-Side Options (Document in Game or Readme)

- **Disable OS HDR** when playing — removes the fullscreen HDR path where the drift occurs.
- **Stay windowed** or use borderless if we add it — avoids the fullscreen-only pipeline.
- **Toggle fullscreen** when drift gets bad (F11 out, F11 in) — manually resets pipeline state.
- **Cap frame rate** (e.g. 60) and/or **disable G-Sync/VRR** for this game — reduces timing-driven brightness variation (Section 9).
- **Update GPU drivers and display firmware** — pipeline behavior can improve with updates.

### 12.3 HTML/CSS Fix Attempt (gameContainer + backdrop-filter)

Comparison with a version that **does not** exhibit the issue showed HTML/CSS differences that may have **induced** the drift rather than fixed it:

- **#gameContainer:** The issue version had added `overflow: hidden`, `z-index: 1`, and `background: #000` to the container (intended to "avoid fullscreen compositor dim"). The working version has only `width: 100vw; height: 100vh; position: relative;`. Those extra properties can change stacking context and compositor layer handling in fullscreen.
- **Backdrop-filter:** The issue version had disabled live `backdrop-filter` on all major UI/overlay elements ("avoid compositor issues"). The working version leaves backdrop-filter on (preload, #ui, #score, etc.). Disabling blur may have switched the page to a different compositor path that exhibits the drift.

**Change applied:** Reverted `#gameContainer` to the simpler layout (no overflow, z-index, or background) and restored backdrop-filter (removed the global `backdrop-filter: none !important` override; restored `backdrop-filter: blur(10px)` on #score). If the issue was triggered by these HTML/CSS changes, this should reduce or eliminate the fullscreen brightness drift. **Note:** The issue also surfaced around the time of improved controller support for menus; that timing does not imply causation but is worth keeping in mind if the HTML/CSS revert does not fully fix the issue (e.g. focus/layout or input handling could interact with fullscreen in some setups).

### 12.4 Controller / menu navigation patch (possible trigger)

The issue surfaced around the time of improved controller support for menus. Comparison of **backup (issue)** vs **working (no issue)** shows the following **backup-only** code that runs in the game loop when a gamepad is connected:

| Feature | Working | Backup | Possible impact |
|--------|---------|--------|------------------|
| **handleGamepadScroll** | Not present | Called **every frame** from updateGamepad() | When right stick Y or D-pad (non–level-up) is used, updates `panel.scrollTop` on all visible scrollable panels (instructions, settings, crafting, shop, etc.). With stick drift or light input this can cause **continuous DOM writes** (scrollTop) and **getVisibleScrollablePanels()** (classList / layout reads) every frame. In fullscreen, repeated scroll/layout can change compositor or layer behavior. |
| **getVisibleScrollablePanels()** | Not present | Used by handleGamepadScroll | Builds list of panels to scroll; reads classList and panel state. |
| **Weapon / hammer wheel gamepad** | Simpler or absent | Full block with gamepadWheelNavCooldown, D-pad/stick for wheel | Only runs when wheel is open; then returns early. Unlikely to run during normal fullscreen gameplay. |
| **handleMenuNavigation** | Present | Present, with more paths (e.g. Continue → shop, scrollIntoView) | Both use scrollIntoView({ behavior: 'smooth' }). Backup has more navigation paths. Smooth scroll triggers ongoing animation; difference is modest. |
| **Per-frame cursor hide** | Same | Same | Both set canvas/body cursor in game loop when playing. Not a difference. |

**Most plausible culprit:** **handleGamepadScroll** — it is the only code that runs **every frame** (when gamepad connected) and can cause **per-frame DOM updates** (scrollTop) whenever the right stick Y is outside the dead zone or D-pad up/down is pressed. Joystick drift can make scrollDelta non-zero even when the user is not touching the stick, so scroll and getVisibleScrollablePanels() could run continuously. That may keep the compositor in a different state (e.g. “scrolling” or frequent layout) and interact badly with fullscreen HDR.

**Test applied:** Skip `handleGamepadScroll` when in fullscreen — **reverted**; it did not fix the issue.

### 12.5 What else could be the issue? (remaining hypotheses)

Given what we’ve tried (HTML/CSS revert, gamepad scroll skip in fullscreen, drawHeavy always on, constant pulses, deferred cache build), the following are **other** plausible contributors that could differ between backup (issue) and working (no issue):

| Hypothesis | Rationale | How to check / try |
|------------|------------|--------------------|
| **Fullscreen cache build** | Backup runs `buildExactFullscreenBackgroundCaches()` after entering fullscreen (deferred 350 ms, with yields). Working might not run an equivalent heavy build, or might build smaller caches. Sustained main-thread work in fullscreen could keep the compositor or GPU in a different state and feed into HDR/tone mapping. | Compare: does working call any “build fullscreen cache” on fullscreenchange? Try **disabling** the fullscreen cache build entirely (e.g. skip `buildExactFullscreenBackgroundCaches()` when entering fullscreen) and see if the drift goes away. Trade-off: possible jitter or fallback draw when going fullscreen. |
| **Resize / canvas dimensions in fullscreen** | Backup may use different logic for canvas width/height or style in fullscreen (e.g. `innerWidth`/`innerHeight`, `clientWidth`/`clientHeight`, `devicePixelRatio`). Different buffer size or CSS size can change how the compositor layers or scales the canvas and trigger a different fullscreen path. | Compare `resize`, `resizeCanvasOnly`, and fullscreen handler between backup and working: what gets set on `canvas.width`/`height` and `canvas.style` when entering fullscreen? Align backup with working if a difference is found. |
| **`is-fullscreen` class / CSS** | Backup toggles `document.documentElement.classList.toggle('is-fullscreen', isFs)` and `document.body.classList.toggle('is-fullscreen', isFs)`. If working does not use this class, or has no CSS targeting it, then the backup might be applying extra fullscreen-only CSS that affects compositing or layers. | Search working index.html for `.is-fullscreen` or `fullscreen` in styles; compare with backup. If backup has rules that working doesn’t, try removing the class toggles or the fullscreen-specific CSS as a test. |
| **HDR code path when disabled** | Backup calls `updateHdrCompensation()` every frame; when HDR is off it clears `canvas.style.filter` and returns. That still touches style every frame. Working might not have this function, so no per-frame style write. Some browsers might treat “repeatedly set filter to ''” differently in fullscreen. | In backup, when HDR is disabled, **don’t call** `updateHdrCompensation()` at all (guard at the call site). If the issue disappears, the per-frame style clear could be the trigger. |
| **Blur / UI overlay updates** | Backup has blur host and overlay updates (e.g. for menus). If these run or update in fullscreen (e.g. blur canvas, positioning), they could add layers or compositor work that the working version doesn’t have. | Compare blur/overlay code and when it runs (e.g. during gameplay in fullscreen). If backup does more overlay/blur work in fullscreen, try disabling or simplifying it as a test. |
| **Frame timing / deltaTime** | Backup has more complex deltaTime (resume smoothing, spike capping, etc.). Different update cadence or frame delivery could, in theory, interact with VRR or present timing in fullscreen. | Lower priority; harder to tie directly to “brightness drift.” Could compare game loop structure (when lastTime is updated, when update/draw run) between backup and working. |
| **Pipeline-only (nothing left in our code)** | The drift might be entirely display/driver/OS: same code in both, but different machine, driver version, or browser version. Working might have been tested on a setup where the pipeline doesn’t drift. | Confirm whether working was tested on the **same** machine, browser, and OS/driver version as backup. If not, the difference may be environmental rather than code. |

**Suggested next steps:** (1) Compare **fullscreen handler and resize/canvas dimensions** between backup and working (and align if different). (2) Try **disabling the fullscreen cache build** on fullscreen enter to see if drift stops. (3) Try **not calling updateHdrCompensation() when HDR is disabled** to rule out per-frame style touch.

### 12.6 Summary

We **cannot fix** the pipeline itself from the game. We **can**: (1) **Align HTML/CSS with working version** — applied (did not fix). (2) **Skip gamepad scroll in fullscreen** — tried and reverted (did not fix). (3) **Remaining levers** — fullscreen cache build, resize/dimensions, is-fullscreen CSS, HDR code path when off, blur/overlays; see §12.5. (4) **User-side** — disable OS HDR, stay windowed, cap FPS, disable VRR, update drivers.
