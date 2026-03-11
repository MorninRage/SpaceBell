# Full Systems Review – Optimization & Enhancement Opportunities

**Date:** February 2026  
**Scope:** All game systems in `game.js` (56,000+ lines)  
**Purpose:** Comprehensive audit of every system with optimization and enhancement recommendations

---

## 1. Executive Summary

The game implements many best practices: object pooling, frame caches, gradient caching, DOM caching, squared-distance collision, swap buffers, background prebuild for windowed+fullscreen. Remaining opportunities span **41 Math.sqrt calls**, **~147 DOM queries** outside cache, **667 gradient creations**, **357 save/restore** pairs, **shield/laser/auto-collector** uncached paths, and several **obstacles.find/filter** hot paths.

---

## 2. System Inventory & Status

### 2.1 Core Loop & Timing

| Component | Status | Notes |
|-----------|--------|-------|
| gameLoop | ✅ | RAF, delta-time, FPS cap |
| update(deltaTime) | ✅ | Early returns, resume smoothing |
| draw() | ✅ | Dimension check uses clientWidth/Height (fixed) |
| Spike rejection | ✅ | rawDelta > 50ms |
| Resume smoothing | ✅ | Smooths pause/resume transitions |

**Opportunities:** None critical.

---

### 2.2 Canvas & Resize

| Component | Status | Notes |
|-----------|--------|-------|
| resizeCanvasOnly | ✅ | Uses clientWidth/Height |
| scheduleResize | ✅ | 500ms debounce |
| Fullscreen enter | ✅ | RAF-deferred resize |
| Fullscreen exit | ✅ | forceFullscreen=false, scheduleResize |
| Dimension check in draw | ✅ | Uses document.documentElement.clientWidth/Height |

**Opportunities:**
- **DPR investigation:** Fullscreen on HiDPI may change effective DPR; add optional diagnostic logging (clientW, innerW, DPR) on fullscreen enter/exit.

---

### 2.3 Background Systems

| Mode | Cache | Prebuild | Status |
|------|-------|---------|--------|
| Ensemble (1) | _ensembleClassicBgCacheBySize | Windowed + fullscreen | ✅ Complete |
| Individual (2) | _individualClassicBgCacheBySize | Windowed + fullscreen | ✅ Complete |
| Bell Pair (3) | _bellClassicBgCacheBySize | Windowed + fullscreen | ✅ Complete |

**Opportunities:**
- Reduce Bell frame count 256→128 if motion still smooth (memory).
- Lazy-build Mode 2/3 only when mode first selected (low priority).

---

### 2.4 Frame Caches (Animation)

| System | Frames | Status |
|--------|--------|--------|
| Bullet animations | 128 × 5 tiers × 4 sizes × 3 types | ✅ |
| Default blue particles | 64 × 4 sizes | ✅ |
| Quantum plasma particles | 64 × 5 tiers × 4 sizes | ✅ |
| Bell pair particles | 64 × 4 sizes | ✅ |
| Ethereal materials | 64 × 5 tiers × 4 sizes × 5 types | ✅ |
| Fire/explosion | 64 × 4 sizes | ✅ |
| Molecule atoms | 256 × 5 health × 5 sizes × 4 colors | ✅ |
| Player glow | 32 × 4 sizes | ✅ |
| Energy ripple | 32 × 5 radii | ✅ |

**Opportunities:**
- Bullet 128→64 frames (sub-frame blend sufficient).
- Molecule atom 256→128 (memory ~64MB→32MB).
- Quality-tier lazy load: build minimal/low only when first used.

---

### 2.5 Object Pools & Swap Buffers

| Pool | Status |
|------|--------|
| _bulletPool | ✅ 200 |
| _particlePool | ✅ 500 |
| _tempAliveTargets / Alt | ✅ Swap buffer |
| _tempAlivePairs / Alt | ✅ Swap buffer |
| _tempAliveBullets / Alt | ✅ Swap buffer |
| _tempAliveItems / Alt | ✅ Swap buffer |
| _tempAliveObstacles / Alt | ✅ Swap buffer |
| _tempAliveEnemyShips / Alt | ✅ Swap buffer |
| _tempAliveEnemyBullets / Alt | ✅ Swap buffer |
| _tempEnergyRipples / Alt | ✅ Swap buffer |
| _tempVisibleObstacles | ✅ Reused |
| _tempEntities | ✅ Reused |
| _tempHelixPoints, _tempHelixStrand1, _tempHelixStrand2 | ✅ Reused |

**Opportunities:** None critical.

---

### 2.6 Collision Detection

| Function | Status |
|----------|--------|
| checkCollision | ✅ Squared distance |
| checkMaterialCollection | ✅ Squared distance |
| checkObstacleCollision | ✅ Squared distance |

**Remaining:** ~41 `Math.sqrt` calls in:
- Laser beam (~3)
- Auto-collector (~4)
- Targeting (~8+)
- Boss helix/advanced (~4)
- Molecule speed checks (~3)
- Player speed (~1)
- Other distance checks

**Opportunity:** Replace sqrt with squared comparison where only comparison needed. Where actual distance required (normalization), consider caching.

---

### 2.7 DOM & UI

| Component | Status |
|-----------|--------|
| _cachedElements | ✅ ~55 elements cached |
| updateStats | ✅ Batched (_statsNeedsUpdate) |
| updateInventoryUI | On change |
| updateCraftingUI | On change |

**Remaining:** ~147 getElementById/querySelector outside _cachedElements.

**Opportunities:**
- Audit remaining DOM queries; add high-frequency ones to _cachedElements.
- Consider DocumentFragment for batch DOM updates in inventory/crafting.

---

### 2.8 Gradient & Context

| Cache | Status |
|-------|--------|
| _cachedGradients | ✅ Cleared on resize |
| moleculeGradientCache | ✅ |
| particleGradientCache | ✅ |

**Current:** 667 createRadialGradient/createLinearGradient calls. Many in fallback paths; hot paths use frame caches.

**Opportunities:**
- **Shield drawing:** 10–30+ gradients per frame; cache by type/size.
- **Laser beam:** Gradient per frame; cache beam segments if repetitive.
- **Auto-collector field:** Gradient per frame; frame cache for rotation cycle.
- **drawCompleteDescriptionMatrix:** Per-frame work; frame cache for matrix cycle.
- **Context property caching:** Only set fillStyle/strokeStyle when changed (many draw paths set repeatedly).

---

### 2.9 Rendering Hot Paths

| System | Status | Opportunities |
|--------|--------|----------------|
| Bullets | ✅ Frame cache, culling | Integer coords (|0), skip tail at medium quality |
| Particles | ✅ Frame cache | shadowBlur=0 at minimal (done) |
| Molecules | ✅ Frame cache, atom cache | — |
| Items | ✅ Frame cache | — |
| Player | ✅ Glow cache, flame skins | — |
| Backgrounds | ✅ Mode caches | — |
| Shields | ⚠️ Per-frame gradients | Cache by type/size |
| Laser beam | ⚠️ Per-frame gradient | Cache segments |
| Auto-collector | ⚠️ Per-frame gradient | Frame cache |
| Boss helix | ✅ Temp array reuse | — |

**Additional:**
- **save/restore:** 357 pairs; audit for redundant saves.
- **shadowBlur:** Many draw paths; reduce at minimal quality (partial), consider tier-based reduction.
- **Integer coordinates:** Apply (x|0), (y|0) in bullet/particle/item draw positions.

---

### 2.10 Boss Systems

| Component | Status |
|-----------|--------|
| _cachedBossCore | ✅ Cached, refreshed when _cleanupNeeded |
| _cachedCellBossParts | ✅ outer/inner membrane cached |
| Helix temp arrays | ✅ _tempHelixPoints, _tempHelixStrand1, _tempHelixStrand2 |

**Remaining:** Multiple `obstacles.find(o => o.isBoss && o.bossPart === '...')` in boss logic (neuron, strand2, core, innerMembrane, nucleus, etc.). Some cached; others in update/draw paths.

**Opportunity:** Expand boss reference caching; invalidate on boss defeat/exit.

---

### 2.11 Obstacle Cleanup

| Pattern | Status |
|---------|--------|
| `obstacles.filter(o => !o._remove)` | ⚠️ Allocates new array |
| `obstacles.filter(o => !o.isBoss)` | ⚠️ On boss exit |
| Swap-buffer for targets/pairs/bullets | ✅ |

**Opportunity:** Use swap-buffer for obstacle cleanup instead of filter (like targets).

---

### 2.12 Audio

| Component | Status |
|-----------|--------|
| AudioManager | ✅ Preload pools, throttling |
| Music session guard | ✅ |
| Failed file cache | ✅ |

**Opportunities:** None critical.

---

### 2.13 Input

| Component | Status |
|-----------|--------|
| updateGamepad | Poll every frame |
| Mouse/keyboard | ✅ |
| mousemove | ✅ passive: true |
| wheel | Non-passive (uses preventDefault during gameplay) |

**Opportunities:** None critical.

---

### 2.14 Puzzle & Crafting

| System | Status |
|--------|--------|
| Bell pair puzzle | ✅ |
| Crafting UI | On change |
| Shop UI | On change |
| allButtons.filter(panel) | Multiple; UI-only, not hot path |

**Opportunities:** Low priority; filter on panel is infrequent.

---

## 3. Prioritized Optimization Roadmap

### 3.1 HIGH PRIORITY (Impact + Feasibility)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | **Shield gradient cache** – Cache by type/size; 10–30+ gradients/frame | Medium | High |
| 2 | **Replace remaining Math.sqrt** – Laser, auto-collector, targeting (comparison-only) | Medium | Medium |
| 3 | **Obstacle cleanup swap-buffer** – Replace `obstacles.filter(o => !o._remove)` | Low | Medium |
| 4 | **Boss find() consolidation** – Cache all boss parts when boss spawns; single invalidation on exit | Low | Medium |

### 3.2 MEDIUM PRIORITY

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 5 | **Auto-collector field frame cache** – 32-frame rotation cycle | Medium | Medium |
| 6 | **Laser beam gradient cache** – Cache beam segments by angle/width | Low | Low |
| 7 | **drawCompleteDescriptionMatrix frame cache** – When upgrade active | Medium | Low |
| 8 | **Skip bullet tail at medium quality** | Low | Low |
| 9 | **DOM query audit** – Add remaining high-frequency to _cachedElements | Medium | Low |
| 10 | **Context property caching** – fillStyle/strokeStyle only on change | Medium | Low |

### 3.3 LOWER PRIORITY

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 11 | **Integer coordinates** – (x\|0), (y\|0) in draw positions | Low | Low |
| 12 | **Molecule atom 256→128** – Memory vs smoothness | Low | Memory |
| 13 | **Bullet 128→64 frames** | Low | Memory |
| 14 | **Batch path drawing** – Boss helix, grid into single beginPath/stroke | Medium | Low |
| 15 | **save/restore audit** – Remove redundant | Medium | Low |
| 16 | **Quality-tier lazy load** – minimal/low only when first used | Medium | Memory |
| 17 | **DPR diagnostic logging** – Fullscreen enter/exit | Low | Diagnostic |

---

## 4. Enhancement Opportunities (Features, Not Just Performance)

### 4.1 Visual Enhancements

- **Aurora Borealis Bell background:** Add frame cache (currently live-rendered).
- **Shield visual variety:** More shield types/skins.
- **Particle trail improvements:** Smoother trails at high FPS.

### 4.2 UX Enhancements

- **Preload progress:** More granular task names (e.g., "Bullets 3/3").
- **Settings persistence:** Ensure all toggles persist across sessions.
- **Tutorial skip:** Allow skip after first completion.

### 4.3 Gameplay Enhancements

- **Boss telegraphing:** Clearer attack indicators.
- **Difficulty scaling:** Optional adaptive difficulty.
- **New weapon types:** Expand beyond basic/rapid/spread.

### 4.4 Technical Debt

- **Modularization:** Consider splitting game.js into modules (build step).
- **TypeScript:** Optional migration for type safety.
- **Unit tests:** Critical paths (collision, pooling).

---

## 5. Code Reference (Key Locations)

| System | Location (approx) |
|--------|------------------|
| draw() | ~17800 |
| resizeCanvasOnly | ~1765 |
| handleFullscreenChange | ~877 |
| getCachedGradient | ~2440 |
| drawShield | ~20291 |
| drawLaserBeam | ~32665 |
| drawAutoCollectorField | ~31933 |
| drawCompleteDescriptionMatrix | ~32018 |
| obstacles.filter | ~13527, 6785, 8804 |
| obstacles.find (boss) | ~12052, 12063, 13491, 13540, 18111 |
| _cachedElements | ~774 |
| Math.sqrt | 41 occurrences (grep) |

---

## 6. Summary

**Already strong:** Core loop, resize, backgrounds (all 3 modes prebuilt), frame caches, object pools, swap buffers, collision (main paths), DOM caching, audio, temp array reuse.

**Highest-impact remaining:** Shield gradient cache, Math.sqrt replacement, obstacle swap-buffer, boss find consolidation.

**Quick wins:** Skip bullet tail at medium, obstacle swap-buffer, boss cache expansion.

---

*This document consolidates COMPREHENSIVE_OPTIMIZATION_PLAN.md, SYSTEMS_CACHE_AND_PERFORMANCE_REVIEW.md, OPTIMIZATION_OPPORTUNITIES.md, and JITTER_ANALYSIS_AND_IMPROVEMENTS.md. Implement in phases; validate each change.*
