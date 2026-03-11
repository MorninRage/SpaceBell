# Jitter and Brightness Fix Analysis

## Issue 1: Global Brightness Oscillation (Bright → Dim → Bright)

**Root Cause:** Backgrounds, materials, and particles use `Math.sin(time * X)` extensively for pulse/twinkle effects. When many elements share similar periods (e.g. `time * 2` ≈ 3.14s period), they pulse in phase, creating a perceived **global brightness oscillation** across the entire game.

**Affected Areas:**
- Background stars: `twinkle = Math.sin(time * 0.5 + ...) * 0.3 + 0.7`
- Background particles/nodes: `pulse = Math.sin(time * 2 + ...) * 0.3 + 0.7`
- Material items: `pulseIntensity = 0.7 + Math.sin(time * 2 + ...) * 0.3`
- Blue particles: `basePulse = 0.8 + Math.sin(time + ...) * 0.2`
- Boss background nodes, quantum field elements, etc.

**Fix:** Use constant values for global brightness-affecting elements, or use much slower/subtler pulse (e.g. amplitude 0.05 instead of 0.3, or period 60+ seconds).

---

## Issue 2: Jitter Every ~5 Seconds

**Likely Causes:**

### A. JavaScript Garbage Collection (GC)
- GC runs periodically (typically every 2-5 seconds when memory pressure builds)
- When GC runs, the main thread blocks for 20-50ms
- One frame takes 50ms instead of 16ms → visible stutter/jitter
- **Mitigation:** Reduce allocations, reuse objects, avoid creating temporary arrays/objects in hot paths

### B. Audio `timeupdate` Event
- Fires ~4 times per second (browser-dependent)
- Callback runs synchronously on main thread
- When music **restarts** (track end): `audio.currentTime = 0` can cause brief main-thread block
- If track is short (~5 sec), restart happens every 5 seconds → **periodic jitter**
- **Fix:** Throttle the callback; defer `audio.currentTime = 0` to `requestAnimationFrame` or `setTimeout(0)` so it doesn't block during the event

### C. Background Frame Cache
- Ensemble/Individual mode use pre-rendered frame caches
- During incremental build or cache invalidation, heavy work can cause frame spikes
- Less likely to be exactly 5 seconds

### D. Dev Mode `updateDevUI`
- `setInterval(..., 1000)` - runs every 1 second in dev mode only
- Would cause 1-second jitter, not 5-second

---

## Recommended Fixes

1. **Brightness:** Replace time-based pulse with constant values in background drawing (or use amplitude 0.05)
2. **Audio:** Throttle `timeupdate` callback to max once per 150ms; defer `audio.currentTime = 0` to next frame
3. **GC:** Review hot paths for unnecessary allocations (particle creation, array spreads, etc.)

---

## Implemented Fixes (Follow-up)

### GC Mitigation - Object Pooling for Particles
- **Lunge impact particles:** All 9 direct object literal pushes in the lunge impact effect (lines ~11114-11294) were converted to use `createParticle()` for pooled allocation
- **Particle pool return on clear:** Added `returnParticlesToPool()` and call it before `this.particles = []` in all reset/clear paths (new game, level reset, dev reset, dev clear)
- **Effect:** Reduces GC pressure from lunge effects (triggered frequently during combat) and prevents pool exhaustion when clearing state
