# Mode 1 (Ensemble) Option E Frame Cache – Complete Reference

**Date:** January 30, 2026  
**Status:** Implemented and in use. This document is the authoritative reference for the Mode 1 classic-ensemble background system.

---

## 1. Overview

Mode 1 (Ensemble QM) uses **Option E**: a frame cache with **geometry interpolation** (not pixel blending). The primary draw path:

1. Blits the nearest cached base frame
2. Interpolates geometry (line endpoints, particles, nodes) between two cached frames
3. Draws flow dots at exact phase along the interpolated lines
4. Draws particles, nodes, and core with phase-based pulsing

**Fallback:** When the cache is not ready (dimensions mismatch, incremental build in progress, or error), the path calls `drawEnsembleClassicFrameAtPhase` for a full live redraw.

**Why Option E:** Pixel blending between two cached frames causes ghosting (double lights on lines) because flow dots appear in different positions. Geometry interpolation avoids this by interpolating **positions**, not pixels.

---

## 2. Parameters

| Parameter | Value | Location |
|-----------|--------|----------|
| Time source | `Date.now() * 0.0015` or `this.time` | `drawEnsembleModeBackground()` |
| speedScale | `0.54` | `drawEnsembleModeBackground()` |
| cycleSpan | `Math.PI * 20` (20π) | `drawEnsembleModeBackground()`, cache |
| Frame count (default) | `64` | `_ensembleClassicBgFrameCount` |
| Frame count (clamp) | 32–1024 | `ensureEnsembleClassicBackgroundCache()` |
| Base blend strength | `0` (no pixel blending) | `_ensembleBaseBlendStrength` |
| Cache chunk size | `16` frames per tick | `_backgroundCacheChunkSize` |
| Max background resolution | 16384 (uncapped) | `_maxBackgroundResolution` |

---

## 3. Data Structures

### 3.1 Cached Frame

Each frame in `_ensembleClassicBgCache.frames[i]` stores:

```js
{
  canvas: HTMLCanvasElement,      // Base layer (gradient, stars, lines, nodes, core – no flow dots)
  lineEndpoints: Array<{x1,y1,x2,y2}>,  // 20 line endpoints for flow-dot geometry
  particleData: Array<{x,y}>,     // 40 particle positions
  nodeData: Array<{x,y}>,        // 25 node positions
}
```

### 3.2 Cache Object

```js
_ensembleClassicBgCache = {
  frames: [...],
  frameCount: number,
  cycleSpan: Math.PI * 20,
}
```

### 3.3 Instance Variables (game.js)

| Variable | Purpose |
|----------|---------|
| `_ensembleClassicBgCache` | Cache object |
| `_ensembleClassicBgCacheSize` | `{ w, h }` – cached dimensions |
| `_ensembleClassicBgFrameCount` | Default 64 |
| `_ensembleClassicBgDirty` | True when cache needs rebuild |
| `_ensembleClassicBgBuildIndex` | Current build progress (incremental) |
| `_ensembleBaseBlendStrength` | 0 = no pixel blending |
| `_backgroundCacheChunkSize` | 16 frames per build tick |

---

## 4. Draw Path (Primary – Cache Valid)

**Entry:** `drawEnsembleModeBackground()` when `skinId === 'classic-ensemble'`

### 4.1 Per-Frame Flow

```
1. time = this.time ?? Date.now() * 0.0015
2. phase = (time * 0.54) % (20π)
3. ensureEnsembleClassicBackgroundCache(frameCount)
4. frameSelection = slerpFrameSelection(phase, cache.frameCount, cycleSpan)
   → { idx1, idx2, t }
5. f1 = cache.frames[idx1], f2 = cache.frames[idx2]
6. If cacheValid (dimensions match, f1/f2 have canvas/lineEndpoints/particleData/nodeData):
   a. Blit nearest base frame: drawImage(baseFrame.canvas)  // baseFrame = t < 0.5 ? f1 : f2
   b. For each of 40 particles: interpolate (p1*(1-t) + p2*t), draw arc
   c. For each of 20 lines: interpolate endpoints, stroke line, draw flow dot at flowPos(phase)
   d. For each of 25 nodes: interpolate (n1*(1-t) + n2*t), draw arc
   e. Draw core (4 rings + center) with phase-based pulsing
7. Else: fallback to drawEnsembleClassicFrameAtPhase(ctx, phase, w, h)
```

### 4.2 Geometry Interpolation Formulas

**Line endpoints (20 lines):**
```js
ep.x1 = (ep1.x1 * (1 - t) + ep2.x1 * t) * sx
ep.y1 = (ep1.y1 * (1 - t) + ep2.y1 * t) * sy
ep.x2 = (ep1.x2 * (1 - t) + ep2.x2 * t) * sx
ep.y2 = (ep1.y2 * (1 - t) + ep2.y2 * t) * sy
```
Where `sx = cw/bw`, `sy = ch/bh` (canvas/cache dimension scale).

**Flow dot position along line:**
```js
flowPos = ((phase * 0.3 + i * 0.1) % 1 + 1) % 1
flowX = ep.x1 + (ep.x2 - ep.x1) * flowPos
flowY = ep.y1 + (ep.y2 - ep.y1) * flowPos
```

**Particles (40):**
```js
px = (p1.x * (1 - t) + p2.x * t) * sx
py = (p1.y * (1 - t) + p2.y * t) * sy
```

**Nodes (25):** Same as particles.

---

## 5. Cache Build

**Function:** `ensureEnsembleClassicBackgroundCache(frameCount)`

### 5.1 When Rebuild Occurs

- `_ensembleClassicBgDirty` is true
- Cache is null or dimensions changed
- `frameCount` changed
- Resize callback sets `_ensembleClassicBgDirty = true`

### 5.2 Build Process (Incremental)

- Builds `_backgroundCacheChunkSize` (16) frames per call
- For each frame `i`: `phase = (i / frameCount) * cycleSpan`
- Calls `drawEnsembleClassicFrameBaseOnly(ctx, phase, w, h)` for base canvas
- Calls `computeEnsembleLineEndpoints(phase, w, h)` for 20 line endpoints
- Calls `computeEnsembleParticleData(phase, w, h)` for 40 particle positions
- Calls `computeEnsembleNodeData(phase, w, h)` for 25 node positions
- Stores `{ canvas, lineEndpoints, particleData, nodeData }` in `cache.frames[i]`

### 5.3 Base Layer Contents (`drawEnsembleClassicFrameBaseOnly`)

- Radial gradient (dark blue/purple)
- 300 stars (phase-based twinkle)
- 20 field lines (no flow dots)
- 25 nodes
- Central core
- No flow dots (drawn at runtime with interpolation)

### 5.4 Line Endpoint Math (`computeEnsembleLineEndpoints`)

For each of 20 lines:
```js
angle1 = phase * 0.1 + i * 0.3
angle2 = phase * 0.1 + (i + 4) * 0.3
radius = 120 + (i % 5) * 30
x1 = w/2 + cos(angle1) * radius, y1 = h/2 + sin(angle1) * radius
x2 = w/2 + cos(angle2) * radius, y2 = h/2 + sin(angle2) * radius
```

---

## 6. Frame Selection (`slerpFrameSelection`)

**Input:** `phase`, `frameCount`, `span` (cycleSpan)

**Output:** `{ idx1, idx2, t }`

**Logic:**
```js
normalizedPhase = ((phase % span) + span) % span / span  // [0, 1)
exactFrame = normalizedPhase * frameCount
idx1 = floor(exactFrame)
idx2 = idx1 + 1
// Wrap idx1, idx2 to [0, frameCount-1]
t = exactFrame - idx1  // interpolation factor [0, 1)
```

---

## 7. Fallback Conditions

Cache path is **skipped** (fallback to `drawEnsembleClassicFrameAtPhase`) when:

1. **Dimensions mismatch:** `|bw - cw| >= 2` or `|bh - ch| >= 2` (cache built at different size)
2. **Cache incomplete:** `f1` or `f2` missing `canvas`, `lineEndpoints`, `particleData`, or `nodeData`
3. **Frame selection null:** `cache.frames.length < 2`
4. **Exception:** Any error in the cache path (with `globalAlpha` and `shadowBlur` reset)

---

## 8. Key Functions Reference

| Function | Purpose |
|----------|---------|
| `drawEnsembleModeBackground()` | Entry point; Option E cache path or fallback |
| `drawEnsembleClassicFrameAtPhase(ctx, phase, w, h)` | Full live draw; fallback and cache build |
| `drawEnsembleClassicFrameBaseOnly(ctx, phase, w, h)` | Base layer only; used when building cache frames |
| `ensureEnsembleClassicBackgroundCache(frameCount)` | Builds/rebuilds cache incrementally |
| `slerpFrameSelection(phase, frameCount, span)` | Returns idx1, idx2, t for interpolation |
| `computeEnsembleLineEndpoints(phase, w, h)` | Returns 20 line endpoints |
| `computeEnsembleParticleData(phase, w, h)` | Returns 40 particle positions |
| `computeEnsembleNodeData(phase, w, h)` | Returns 25 node positions |
| `getEnsembleClassicBackgroundFrame(time)` | Returns nearest cached frame (used by other code paths) |

---

## 9. Comparison with Mode 2 and Mode 3

| Mode | Technique | Cache on hot path? | Interpolation |
|------|-----------|--------------------|---------------|
| 1 (Ensemble) | Option E – cache + geometry interpolation | Yes | Geometry (positions) |
| 2 (Individual) | Cache + nearest-frame | Yes | None |
| 3 (Bell) | Cache + nearest-frame | Yes | None |

Mode 1 is the only mode that uses geometry interpolation. Mode 2 and Mode 3 blit a single cached frame per frame (nearest by phase).

---

## 10. Preload

**Task:** `'Backgrounds: Ensemble Classic Frames'` in `runPreload()`

- Calls `ensureEnsembleClassicBackgroundCache(frameCount)` in a loop until cache is complete
- Uses `_backgroundCacheChunkSize = 64` during preload for faster build
- Blocks until `_ensembleClassicBgCache.frames.length >= frameCount`

---

## 11. Tuning Notes

- **Frame count:** 64 default; 32–1024 allowed. Higher = smoother, more memory.
- **Base blend:** `_ensembleBaseBlendStrength = 0` disables pixel blending (avoids ghosting).
- **Speed:** `speedScale = 0.54`; `cycleSpan = 20π` so all phase multipliers align at wrap.
- **Resolution:** Cache built at canvas size, capped by `_maxBackgroundResolution` (16384).

---

## 12. Related Documentation

- `MODE1_ENSEMBLE_BACKGROUND_SYSTEM.md` – Design history and replication guide
- `FRAME_CACHE_SYSTEMS_AND_MODE1_ACADEMIC_REVIEW.md` – Option E rationale and alternatives
- `ARCHITECTURE.md` – High-level Mode 1 description
