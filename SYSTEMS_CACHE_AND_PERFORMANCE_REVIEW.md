# Systems, Cache & Performance – Comprehensive Review

**Date:** February 2026  
**Source:** Direct code analysis of `game.js` (56,000+ lines)  
**Purpose:** Full review of frame caches, sprites, hi-fidelity graphics, and performance; identify enhancement opportunities

---

## 1. Executive Summary

The game uses a **three-tier rendering strategy**:

1. **Frame caches** – Pre-rendered animation cycles (bullets, particles, molecules, materials, backgrounds)
2. **Static sprites** – Pre-shaded single-frame or variant sprites (ship effects, explosions, cutscenes)
3. **Runtime fallback** – Gradients, live drawing when cache miss or quality downgrade

**Status:** Most high-frequency paths use frame caches or sprites. Remaining opportunities focus on fallback simplification, cache hit optimization, and a few uncached systems.

---

## 2. Frame Cache Systems (Animation Caches)

### 2.1 Inventory

| System | Frames | Sizes/Tiers | Getter | Draw Path | Status |
|--------|--------|-------------|--------|-----------|--------|
| **Bullet animations** | 128 | 5 sizes × 5 quality tiers | `getBulletFrame()` | drawBullets | ✅ Full |
| **Default blue particles** | 64 | 4 sizes | `getDefaultParticleFrame()` | drawTargets | ✅ Full |
| **Quantum plasma particles** | 64 | 4 sizes × 5 tiers | `getQuantumPlasmaFrame()` | drawTargets | ✅ Full |
| **Bell pair particles** | 64 | 4 sizes | `getBellPairFrame()` | drawPairs | ✅ Full |
| **Ethereal materials** | 64 | 4 sizes × 5 tiers × 5 types | `getEtherealMaterialsFrame()` | drawItems | ✅ Full |
| **Fire/explosion particles** | 64 | 4 size buckets | (direct lookup) | drawParticles | ✅ Full |
| **Molecule atoms** | 256 | 5 health × 5 sizes × 4 colors | `getMoleculeAtomFrame()` | drawMoleculeDefault | ✅ Full |
| **Player glow** | 32 | 4 sizes | (direct lookup) | drawPlayer | ✅ Full |
| **Energy ripple** | 32 | 5 radii | (direct lookup) | drawPlayer | ✅ Full |
| **Ensemble background** | 64 | Per canvas size | `slerpFrameSelection` | drawEnsembleModeBackground | ✅ Full |
| **Individual background** | 64 | Per canvas size | `getIndividualClassicBackgroundFrame()` | drawIndividualModeBackground | ✅ Full |
| **Bell pair background** | 256 | Per canvas size | (chunked build) | drawBellModeBackground | ✅ Full |

### 2.2 Frame Cache Architecture

**Preload order (runPreload):**
1. Bullet static sprites (spread, rapid, basic)
2. Molecule movement effects (trail, glow, energy flow)
3. Ship effects (wobble, stretch, depth)
4. Collision effects (explosion, impact, ripple)
5. Cutscenes (WWS intro, SpaceBell, opening, level)
6. Boss scenes (background, network, puzzle, enemies)
7. Game init/start screens
8. Audio preload
9. Gradient warm-up
10. Object pool warm-up
11. Sprite decode warm-up
12. Puzzles (bell pair, orb, glow)
13. Material drops (static)
14. **Quantum plasma** (64 frames × 5 tiers × 4 sizes)
15. **Default blue particles** (64 frames × 4 sizes)
16. **Fire/explosion** (64 frames × 4 sizes)
17. **Bell pair particles** (64 frames × 4 sizes)
18. **Ethereal materials** (64 frames × 5 tiers × 4 sizes × 5 types)
19. Ensemble background (64 frames, full build)
20. Individual/Bell backgrounds (incremental)
21. Player glow (32 frames × 4 sizes)
22. Energy ripple (32 frames × 5 radii)
23. **Molecule atoms** (256 frames × 5 health × 5 sizes × 4 colors)
24. **Bullet animations** (128 frames × 5 tiers × 4 sizes × 3 types)

### 2.3 Frame Selection Logic

- **Phase-based:** `animationPhase = (time + index * 0.375) % (2π)` for particles
- **Sub-frame blend:** Bullets and molecules use `frameA + blend * (frameB - frameA)` for smooth interpolation
- **Size lookup:** Closest size variant; scale applied at draw time
- **Quality fallback:** Minimal/low tiers may skip cache and use simpler live path

### 2.4 Enhancement Opportunities – Frame Caches

| Opportunity | Impact | Effort | Notes |
|-------------|--------|--------|-------|
| **Reduce bullet frame count** | Medium | Low | 128 → 64 if sub-frame blend is sufficient; saves memory |
| **Lazy-load rare quality tiers** | Low | Medium | Build minimal/low only when first used |
| **Ensemble cache by size** | Done | — | `_ensembleClassicBgCacheBySize` (max 2) already in place |
| **Bell background chunk size** | Low | Low | Tune `_bellClassicBgChunkSize` (32) vs build time |

---

## 3. Static Sprites (Pre-Shaded)

### 3.1 Inventory

| Sprite | Type | Variants | Use |
|--------|------|----------|-----|
| basic, rapid, spread | Bullet body | 1–3 scales | Fallback when animation cache miss |
| moleculeTrail, moleculeGlow, moleculeEnergyFlow | Molecule effects | Single | Fast-moving molecule trail/glow |
| shipWobble, shipStretch, shipDepth | Ship motion | Single | Player motion effects |
| explosion, impactParticles, energyRipple | Collision | Single | Explosions, impacts |
| Cutscenes (willsWayIntro, wwsLogo, etc.) | UI | Single | Intro, level transitions |
| Boss (background, network, puzzle, enemies) | Boss | Single | Boss battles |
| bellPairConnection, bellPairPuzzle, puzzleOrb, puzzleGlow | Puzzle | Single | Bell pair mode |
| quantumParticle, energyCore, metalScrap, crystal, token | Material drops | Single | Item pickups (default skin) |

### 3.2 Sprite vs Frame Cache

- **Static sprites:** One or few variants; `getPreShadedSprite(name, radius)` picks closest
- **Frame caches:** Many frames; `getXxxFrame(time, ...)` picks frame by phase
- **Bullets:** Prefer `getBulletFrame()` (animation); fallback to `getPreShadedSprite()` (static) then gradient

### 3.3 Enhancement Opportunities – Sprites

| Opportunity | Impact | Effort | Notes |
|-------------|--------|--------|-------|
| **Remove duplicate bullet sprites** | Low | Medium | basic/rapid/spread static sprites overlap with animation cache; keep only for fallback |
| **Sprite sheet for material drops** | Low | High | Combine quantum/energy/metal/crystal into one texture; likely overkill for canvas 2D |
| **Boss enemy sprite reuse** | Low | Low | Some boss sprites may share geometry |

---

## 4. Gradient & Other Caches

### 4.1 Gradient Cache (`_cachedGradients`)

- **Key:** String (e.g. `tail_outer_basic_20`)
- **Factory:** `getCachedGradient(key, factory)` – create on miss, reuse on hit
- **Invalidation:** Cleared on resize (dimension-dependent)
- **Use:** Bullet tails, molecule bonds, particle effects

### 4.2 Molecule / Particle Caches

- **moleculeGradientCache:** Health buckets
- **particleGradientCache:** Color × size
- **moleculeHealthBuckets:** [1.0, 0.75, 0.5, 0.25, 0.1]

### 4.3 Enhancement Opportunities – Gradients

| Opportunity | Impact | Effort | Notes |
|-------------|--------|--------|-------|
| **Cache key stability** | Low | Low | Ensure keys don’t churn (e.g. tail bucket rounding) |
| **Gradient count audit** | Medium | Medium | Log gradient creation rate; find hot paths still creating per-frame |

---

## 5. Background Cache Systems

### 5.1 Mode 1 (Ensemble)

- **Cache:** `_ensembleClassicBgCacheBySize` (Map, max 2 entries)
- **Frames:** 64; geometry interpolation (Option E)
- **Data per frame:** canvas, lineEndpoints, particleData, nodeData
- **Build:** Incremental (16 frames/tick); `_ensembleClassicBgDirty` on resize

### 5.2 Mode 2 (Individual)

- **Cache:** `_individualClassicBgCache`
- **Frames:** 64
- **Build:** Incremental; `_individualClassicBgDirty` on resize

### 5.3 Mode 3 (Bell Pair)

- **Cache:** `_bellClassicBgCache`
- **Frames:** 256; chunked build (32 frames/tick)
- **Build:** `_bellClassicBgDirty` on resize

### 5.4 Enhancement Opportunities – Backgrounds

| Opportunity | Impact | Effort | Notes |
|-------------|--------|--------|-------|
| **Prebuild both sizes** | Medium | Low | On first fullscreen toggle, build second size in background |
| **Reduce Bell frame count** | Low | Low | 256 → 128 if motion still smooth |
| **Interpolation cache size** | Low | Low | `_ensembleInterpolationCacheMaxSize` (64); tune if memory pressure |

---

## 6. Draw Path Flow (High-Frequency)

### 6.1 Bullets

```
getBulletFrame(type, time, size, quality)
  → if hit: drawImage(cachedFrame) + optional tail (getCachedGradient)
  → else: getPreShadedSprite() → drawImage
  → else: live gradient rendering
```

**Tail rendering:** Even with cached frame, ultra/high quality still draws tail with `getCachedGradient` (3 gradients per bullet). Opportunity: pre-render tail into frame or reduce tail buckets.

### 6.2 Targets (Blue Particles)

```
drawParticleSkin() / drawDefaultParticle() / drawQuantumPlasmaParticle()
  → getDefaultParticleFrame() or getQuantumPlasmaFrame()
  → if hit: drawImage(cachedFrame) + overlays (reveal, pulse)
  → else: live gradient rendering
```

### 6.3 Molecules

```
drawMoleculeDefault() / drawQuantumNebulaMolecule()
  → per atom: getMoleculeAtomFrame(healthBucket, radius, color, time, index)
  → if hit: drawImage (with sub-frame blend)
  → else: live gradient + arc
```

### 6.4 Items (Materials)

```
drawMaterialSkin() → drawEtherealMaterials() or drawNeonMaterials()
  → getEtherealMaterialsFrame()
  → if hit: drawImage(cachedFrame)
  → else: live gradient rendering
```

---

## 7. Hi-Fidelity Graphics

### 7.1 Quality Tiers

- **ultra, high, medium, low, minimal**
- **adaptiveQuality:** Set from FPS (avgFps < 30 → medium, < 45 → high)
- **settings.particlesQuality:** User override

### 7.2 Quality-Based Behavior

| Tier | Bullets | Particles | Materials | Shadows |
|------|---------|-----------|-----------|---------|
| ultra | Full animation + tail | Full cache | Full cache | Full |
| high | Full animation + tail | Full cache | Full cache | Full |
| medium | Animation, simpler tail | Full cache | Full cache | Reduced |
| low | Static sprite / simple | Cache | Cache | Minimal |
| minimal | Simple arc | Cache | Cache | 0 (shadowBlur=0) |

### 7.3 Enhancement Opportunities – Hi-Fidelity

| Opportunity | Impact | Effort | Notes |
|-------------|--------|--------|-------|
| **Skip tail in medium** | Medium | Low | Don’t draw tail gradients when quality=medium |
| **Reduce ring/particle count in medium** | Low | Low | Fewer orbiting elements in bullet/particle cache |
| **Quality tier preload** | Low | Medium | Only preload ultra/high initially; lazy-load low/minimal |

---

## 8. Performance Hot Paths

### 8.1 Confirmed Optimized

- Bullet draw: Frame cache → drawImage
- Particle draw: Frame cache → drawImage
- Molecule atom draw: Frame cache → drawImage
- Material draw: Frame cache → drawImage
- Backgrounds: Frame cache + geometry interpolation
- Collision: Squared distance, pooled arrays
- DOM: Cached elements
- Object pools: Bullets, particles, items, explosions

### 8.2 Remaining Cost Centers

| Path | Frequency | Current | Opportunity |
|------|-----------|---------|-------------|
| Bullet tail (ultra/high) | Per bullet | 3 gradients + paths | Pre-render tail into frame or cache more aggressively |
| Shield drawing | Per frame | 10–30+ gradients | Cache by shield type/size |
| Boss helix/advanced | Per boss part | Per-frame arrays (fixed) | — |
| Laser beam | When active | Gradients, arcs | Cache beam segments if repetitive |
| Auto-collector field | When active | Gradient per frame | Frame cache for rotation cycle |
| drawCompleteDescriptionMatrix | When upgrade active | Per-frame work | Frame cache for matrix cycle |

### 8.3 Fallback Path Audit

When frame cache returns `null` (preload not done, invalid input, wrong quality):

- **Bullets:** Fallback to static sprite or gradient – acceptable
- **Particles:** Fallback to gradient – can be heavy with many particles
- **Molecules:** Fallback to gradient – heavy with many molecules
- **Recommendation:** Ensure preload completes before gameplay; add guards so fallback is rare

---

## 9. Preload & Memory

### 9.1 Preload Sequence

- ~50+ tasks; each yields with `requestAnimationFrame`
- Ensemble background blocks until 64 frames built
- Bullet/molecule/particle caches built in parallel with other tasks

### 9.2 Memory Estimate (Rough)

| System | Frames | Canvas size (est.) | Total (est.) |
|--------|--------|--------------------|--------------|
| Bullet animations | 3 × 128 × 5 × 4 = 7,680 | ~40×40 | ~12 MB |
| Particles (4 systems) | 4 × 64 × 4 = 1,024 | ~50×50 | ~2.5 MB |
| Ethereal materials | 64 × 5 × 4 × 5 = 6,400 | ~30×30 | ~6 MB |
| Molecule atoms | 256 × 5 × 5 × 4 = 25,600 | ~50×50 | ~64 MB |
| Backgrounds | 64 + 64 + 256 | Full res | Variable |
| **Total (order of magnitude)** | | | **~100–150 MB** |

### 9.3 Enhancement Opportunities – Memory

| Opportunity | Impact | Effort | Notes |
|-------------|--------|--------|-------|
| **Molecule atom frame reduction** | High | Medium | 256 → 64 or 128; test visual smoothness |
| **Bullet frame reduction** | Medium | Low | 128 → 64 |
| **Ethereal material size buckets** | Low | Low | 4 → 3 sizes if quality acceptable |
| **Lazy background build** | Low | Medium | Build Mode 2/3 only when mode first selected |

---

## 10. Implementation Recommendations

### 10.1 Quick Wins

1. **Bullet tail at medium quality:** Skip tail gradient drawing when `renderingQuality === 'medium'`.
2. **Molecule atom frame count:** Experiment 256 → 128; measure memory and smoothness.
3. **Bullet frame count:** Experiment 128 → 64 with sub-frame blend.
4. **Fallback logging:** Optional debug counter for cache miss rate per system.

### 10.2 Medium Effort

1. **Shield gradient cache:** Cache by type/size; reuse across frames.
2. **Auto-collector field frame cache:** 32-frame rotation cycle.
3. **Complete Description Matrix frame cache:** 64-frame cycle when upgrade active.
4. **Quality-tier lazy load:** Build low/minimal caches only when first needed.

### 10.3 Larger Effort

1. **Pre-render bullet tail into frame:** Include tail in bullet animation frames for ultra/high; eliminates 3 gradients per bullet.
2. **Molecule atom cache consolidation:** Reduce size/color buckets if visually acceptable.
3. **Background prebuild on resize:** When windowed↔fullscreen, prebuild second size in background.

---

## 11. Code Reference

| System | Key Functions | Key State |
|--------|---------------|-----------|
| Bullet frames | `getBulletFrame`, `createPreShadedBulletAnimationFrames` | `bulletAnimation_basic/rapid/spread` |
| Default particle | `getDefaultParticleFrame`, `createPreShadedDefaultParticle` | `defaultParticle` |
| Quantum plasma | `getQuantumPlasmaFrame`, `createPreShadedQuantumPlasmaParticle` | `quantumPlasmaParticle` |
| Bell pair | `getBellPairFrame`, `createPreShadedBellPairParticle` | `bellPairParticle` |
| Ethereal materials | `getEtherealMaterialsFrame`, `createPreShadedEtherealMaterials` | `etherealMaterials` |
| Molecule atoms | `getMoleculeAtomFrame`, `createPreShadedMoleculeAtoms` | `moleculeAtoms` |
| Fire/explosion | `createPreShadedFireParticle` | `fireParticle` |
| Ensemble bg | `ensureEnsembleClassicBackgroundCache`, `slerpFrameSelection` | `_ensembleClassicBgCacheBySize` |
| Individual bg | `ensureIndividualClassicBackgroundCache` | `_individualClassicBgCache` |
| Bell bg | Chunked build in `drawBellModeBackgroundClassic` | `_bellClassicBgCache` |
| Gradients | `getCachedGradient` | `_cachedGradients` |

---

## 12. Related Documents

- `FRAME_CACHE_COMPREHENSIVE_REVIEW.md` – Frame cache candidates
- `BULLET_CACHE_SYSTEM_IMPLEMENTATION.md` – Bullet animation details
- `MODE1_OPTION_E_FRAME_CACHE_COMPLETE_REFERENCE.md` – Ensemble background
- `MOLECULE_ATOM_CACHING_IMPLEMENTATION_DETAILS.md` – Molecule atoms
- `COMPREHENSIVE_OPTIMIZATION_PLAN.md` – General optimization plan
- `PRE_RENDERING_REVIEW.md` – Pre-rendering status

---

*This document reflects code analysis as of February 2026. Implement enhancements incrementally; validate each change before proceeding.*
