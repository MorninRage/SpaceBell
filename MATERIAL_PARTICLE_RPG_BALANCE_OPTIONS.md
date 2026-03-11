# Material & Particle RPG Balance – Design Options

**Date:** January 30, 2026  
**Goal:** Modes 1 and 2 need more materials from particles, but we want a system that:
- Lets you progress and grind the whole time
- Does not break the game by accumulating too many resources
- Is not too difficult to unlock everything
- Gives more resources when starting (without a dramatic increase)
- Optionally ties particle behavior to RPG stats (e.g. material drop)

---

## 1. Current System Summary

### 1.1 Particle (Blue Target) Drops
- **Each particle:** 1 material drop (via `dropItem()`)
- **RPG stats:** Particles are **not** affected by `materialDropRate` – fixed 1 drop per kill
- **Mode 1 (Ensemble):** Spawns **2** targets per tick
- **Mode 2 (Individual):** Spawns **1** target per tick
- **Mode 3 (Bell):** Spawns pairs; 2x material multiplier on **collection** (not on drop)

### 1.2 Molecule (Red Obstacle) Drops
- **Base:** 8 materials per molecule
- **materialDropRate:** Additive bonus (e.g. 100% = 2x, 300% = 4x), capped at 300% + 33% per 20 levels
- **ensembleBypass:** 2x
- **individualSystemAmplifier:** 3x
- **resourceDropMultiplier cap:** 6x total

### 1.3 Material Collection
- **Bell mode:** `inventory[type] += 2` (double materials when collecting)
- **Modes 1 & 2:** `inventory[type] += 1`

---

## 2. Design Options

### Option A: Mode-Specific Base Boost (Simplest)

**Idea:** Give Modes 1 and 2 a small base multiplier when collecting materials from particles.

| Mode | Current | Proposed |
|------|---------|----------|
| Mode 1 (Ensemble) | 1 material per particle | 1.2 materials per particle |
| Mode 2 (Individual) | 1 material per particle | 1.3 materials per particle |
| Mode 3 (Bell) | 2 materials per pair | Unchanged |

**Implementation:** When collecting a particle drop in Mode 1/2, add `Math.floor(1.2)` or `1.3` instead of 1. (Or: 20% chance for +1 extra, 30% for Mode 2.)

**Pros:** Simple, no RPG stat changes, addresses "not enough at start"  
**Cons:** Does not tie to RPG stats; late game still gets the boost

---

### Option B: Inverse Material Drop (Your Idea)

**Idea:** Higher `materialDropRate` = **fewer** particles spawn, but each gives **more** materials.

- At 0% materialDropRate: Normal particle spawn, 1 material each
- At 100% materialDropRate: 10% fewer particles, each gives 1.2 materials
- At 200%: 20% fewer particles, each gives 1.5 materials
- At 300%: 30% fewer particles, each gives 2 materials

**Formula (example):**
```
particleSpawnMultiplier = 1 - (materialDropRate / 1000)   // e.g. 0.7 at 300%
materialValuePerParticle = 1 + (materialDropRate / 300)   // e.g. 2 at 300%
```
Net materials ≈ same or slightly higher, but fewer on-screen items (less clutter, better performance).

**Pros:** Ties to RPG stats; prevents particle spam at high levels  
**Cons:** Feels counterintuitive ("material drop" = fewer drops); may need different stat name (e.g. "Material Efficiency")

---

### Option C: Diminishing Returns on materialDropRate

**Idea:** Keep `materialDropRate` as "more materials," but use **sqrt** or **log** so early upgrades matter more and late upgrades add less.

**Current:** `dropMultiplier *= (1 + materialDropRate/100)` → 300% = 4x  
**Proposed:** `effectiveBonus = 100 * (1 - 1/(1 + materialDropRate/100))` or `sqrt(materialDropRate)`

| materialDropRate | Current | Sqrt-style | Log-style |
|------------------|---------|------------|-----------|
| 0% | 1.0x | 1.0x | 1.0x |
| 50% | 1.5x | 1.22x | 1.20x |
| 100% | 2.0x | 1.41x | 1.35x |
| 200% | 3.0x | 1.73x | 1.55x |
| 300% | 4.0x | 2.0x | 1.70x |

**Pros:** Early game feels rewarding; late game does not explode  
**Cons:** High-investment players may feel capped; does not directly boost particle drops (particles still ignore it)

---

### Option D: Apply materialDropRate to Particles (With Cap)

**Idea:** Particles currently ignore `materialDropRate`. Apply it, but with a **soft cap** so particles never give more than ~1.5 materials each.

```
materialsFromParticle = 1 + min(0.5, materialDropBonus * 0.2)  // cap at 1.5
```

Or: 20% chance for +1 extra material per 100% materialDropRate, capped at 50% chance.

**Pros:** materialDropRate finally affects particles; upgrade feels meaningful  
**Cons:** Can still accumulate; need a cap to avoid breaking economy

---

### Option E: Early-Game Boost + Late-Game Soft Cap

**Idea:** Level-based scaling.

- **Levels 1–20:** +15% materials from particles (and/or slightly faster particle spawn in Modes 1/2)
- **Levels 21–50:** Base (no modifier)
- **Levels 51+:** -5% materials from particles (gentle reduction to prevent overflow)

**Pros:** Directly addresses "not enough at start"; late game self-balances  
**Cons:** Does not tie to RPG stats; may feel arbitrary

---

### Option F: Quality Over Quantity (Rarity System)

**Idea:** `materialDropRate` increases chance of **enhanced** drops (each counts as 2) instead of raw count.

- Base: 1 material per particle
- At 100% materialDropRate: 25% chance particle gives 2 materials
- At 200%: 40% chance
- At 300%: 50% chance

**Pros:** Same particle count; progression = better drops, not more drops; less clutter  
**Cons:** More RNG; implementation slightly more complex

---

### Option G: Hybrid (Recommended)

**Combine several approaches:**

1. **Base boost for Modes 1 & 2:** Particles give 1.2x materials (round: 20% chance for +1 extra). Addresses "not enough at start."
2. **Apply materialDropRate to particles with diminishing returns:**  
   `effectiveBonus = sqrt(materialDropRate/100)`  
   So 100% → 1.1x, 200% → 1.14x, 300% → 1.17x per particle. Small but meaningful.
3. **Diminishing returns on molecule drops:** Use sqrt for `materialDropBonus` so molecule drops do not scale to 4x. Keeps late-game economy in check.
4. **Optional inverse component:** At very high materialDropRate (e.g. 250%+), slightly reduce particle spawn rate (e.g. 5–10%) so screen does not get flooded. Trade quantity for quality.

**Pros:** Early game boost, RPG stat matters for particles, late game controlled  
**Cons:** More moving parts; needs tuning

---

## 3. Implementation Notes

### 3.1 Where to Change Particle Drops
- **Collection:** `game.js` ~line 12840 – when item is collected, `inventory[item.type] += materialMultiplier`
- **Drop:** `dropItem()` creates 1 item per call; collection is where multiplier is applied
- **Particle kill:** `dropItem(target.x, target.y, 'quantumParticles')` – type is overridden by `getMaterialTypeForMode()`

### 3.2 Where materialDropRate Is Used
- Molecule drops: ~lines 12044–12057
- Enemy ship drops: ~lines 11702–11714
- Boost collision drops: ~lines 12478–12488
- **Particles:** Not used – add new branch for particle-collected items

### 3.3 Mode-Specific Collection Multiplier
Current collection logic:
```js
const materialMultiplier = this.mode === 'bell' ? 2 : 1;
this.inventory[item.type] += materialMultiplier;
```

Change to:
```js
let materialMultiplier = this.mode === 'bell' ? 2 : 1;
if (this.mode === 'ensemble') materialMultiplier = 1.2;  // or 1 + 0.2
if (this.mode === 'individual') materialMultiplier = 1.3;
// Then apply materialDropRate bonus for particle-origin items if desired
```

(Need to track item origin: particle vs molecule vs enemy.)

---

## 4. Recommendation Summary

| Priority | Option | Effort | Impact |
|----------|--------|--------|--------|
| 1 | **Option A** – Mode 1/2 base boost (1.2x, 1.3x) | Low | Fixes "not enough at start" |
| 2 | **Option D** – Apply materialDropRate to particles (capped) | Medium | RPG stat matters for particles |
| 3 | **Option C** – Diminishing returns on molecule drops | Medium | Prevents late-game overflow |
| 4 | **Option B** – Inverse at high levels (optional) | Medium | Reduces clutter at 250%+ |

**Suggested path:** Start with **Option A** (quick win). If more control is needed, add **Option D** with a cap, then **Option C** for molecules.

---

## 5. References

- `game.js` – `dropItem`, `getMaterialTypeForMode`, molecule/enemy drop logic, collection
- `GAME_STATS_REFERENCE.md` – Stat caps, drop formulas
- `ARCHITECTURE.md` – Mode drop balance
