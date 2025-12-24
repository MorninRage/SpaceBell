# Beyond Bell: Complete Game Stats & Formulas Reference

## Table of Contents
1. [Player Stats](#player-stats)
2. [Equipment Stats](#equipment-stats)
3. [Upgrade System](#upgrade-system)
4. [Enemy Scaling](#enemy-scaling)
5. [Molecule/Obstacle Stats](#moleculeobstacle-stats)
6. [Spawn Rates](#spawn-rates)
7. [Drop Rates](#drop-rates)
8. [Crafting Recipes](#crafting-recipes)
9. [Survival System](#survival-system)
10. [Level Progression](#level-progression)
11. [Boss Mechanics](#boss-mechanics)
12. [Damage Calculations](#damage-calculations)

---

## Player Stats

### Base Stats (Starting Values)
```javascript
health: 100
maxHealth: 100
baseMaxHealth: 100
shield: 0
maxShield: 0
speed: 150 (varies by ship)
baseSpeed: 150 (varies by ship)
fireRate: 0.5 shots/second (varies by weapon)
baseFireRate: 0.5 (varies by weapon)
damage: 10
baseDamage: 10
```

### RPG Stats (All start at 0)
```javascript
criticalHitChance: 0% (0-100%)
criticalHitDamage: 2.0x (base multiplier)
shieldCapacityBonus: 0% (percentage increase)
shieldRegenBonus: 0/s (flat regen per second)
damageReduction: 0% (0-100%)
evasion: 0% (0-100%)
materialDropRate: 0% (percentage increase)
tokenDropRate: 0% (percentage increase)
levelTimeReduction: 0% (0-40% max)
projectileSpeed: 0% (0-200% max)
healthRegen: 0 HP/s (0-10 HP/s max)
```

### Stat Caps
| Stat | Cap Formula | Example (Basic Ship/Weapon) | Notes |
|------|-------------|----------------------------|-------|
| Speed | `baseSpeed + 600` | 150 + 600 = 750 | Almost doubled from previous +300 cap |
| Fire Rate | `baseFireRate + 8.0` | 0.5 + 8.0 = 8.5 shots/sec | Performance-safe cap |
| Damage | `baseDamage + 100` | 10 + 100 = 110 | Prevents game-breaking damage |
| Max Health | `baseMaxHealth + 500` | 100 + 500 = 600 | Significant health boost |
| Critical Hit Damage | `5.0x` | 5.0x multiplier | Hard cap |
| Shield Regen Bonus | `50/s` | 50 HP/s | Hard cap |
| Health Regen | `10 HP/s` | 10 HP/s | Hard cap |
| Projectile Speed | `200%` | 200% increase | Hard cap |
| Material Drop Rate | `300%` | 300% increase | Hard cap |
| Token Drop Rate | `200%` | 200% increase | Hard cap |
| Level Time Reduction | `40%` | 40% reduction | Minimum 10s per level |

---

## Equipment Stats

### Ships

| Ship | Speed | Health | Size | Shape | Special Bonus |
|------|-------|--------|------|-------|---------------|
| Basic | 150 | 100 | 20 | triangle | None |
| Fast | 220 | 75 | 18 | sleek | +15% speed boost |
| Tank | 90 | 250 | 28 | wide | +damage resistance |
| Agile | 190 | 110 | 16 | diamond | +evasion |
| Individual Stabilizer | 250 | 200 | 18 | sleek | stabilized |
| Complete Description Vessel | 280 | 350 | 22 | diamond | complete |

### Weapons

| Weapon | Fire Rate | Damage | Color | Special | Description |
|--------|-----------|--------|-------|---------|-------------|
| Basic | 0.5/s | 10 | #4caf50 | None | Starter weapon |
| Rapid | 1.0/s | 8 | #ff9800 | None | Fast firing |
| Spread | 0.4/s | 12 | #9c27b0 | 3 projectiles | Spread shot |
| Laser | 0.3/s | 20 | #f44336 | Beam, 2s active, 3s cooldown | Continuous beam |
| Automatic | 2.0/s | 7 | #00bcd4 | Automatic | Auto-fire |
| Transformation Predictor | 0.8/s | 35 | #ff6b00 | None | High damage |
| Deterministic Engine | 1.5/s | 45 | #8b00ff | 5 projectiles | Devastating spread |
| Individual System Core | 3.0/s | 60 | #00ffff | Automatic, omnidirectional | Ultimate weapon |

### Weapon Upgrades

#### Rapid Weapon (4 Tiers)
- **Tier 1**: +0.9 fire rate (cost: 8 quantum, 5 crystals, 3 energy cores)
- **Tier 2**: +0.9 fire rate (cost: 15 quantum, 10 crystals, 6 energy, 3 metal)
- **Tier 3**: +0.9 fire rate (cost: 25 quantum, 18 crystals, 12 energy, 8 metal)
- **Tier 4**: +0.9 fire rate (cost: 40 quantum, 30 crystals, 20 energy, 15 metal)
- **Total Bonus**: +3.6 fire rate (4.6 total with base 1.0)

#### Spread Weapon (4 Tiers)
- **Tier 1**: 3→4 projectiles (cost: 10 quantum, 7 crystals, 4 energy)
- **Tier 2**: 4→5 projectiles (cost: 18 quantum, 12 crystals, 8 energy, 5 metal)
- **Tier 3**: 5→6 projectiles (cost: 28 quantum, 20 crystals, 14 energy, 10 metal)
- **Tier 4**: 6→7 projectiles (cost: 42 quantum, 32 crystals, 22 energy, 18 metal)
- **Total**: Up to 7 projectiles per shot

#### Laser Weapon (4 Tiers)
- **Tier 1**: +0.8s duration, +8 damage (cost: 12 quantum, 8 crystals, 5 energy, 3 metal)
- **Tier 2**: +1.0s duration, +10 damage (cost: 22 quantum, 15 crystals, 10 energy, 8 metal)
- **Tier 3**: +1.3s duration, +13 damage (cost: 35 quantum, 25 crystals, 18 energy, 15 metal)
- **Tier 4**: +1.6s duration, +16 damage (cost: 50 quantum, 38 crystals, 28 energy, 25 metal)
- **Total Bonus**: +4.7s duration, +47 damage

#### Automatic Weapon (1 Tier)
- **Tier 1**: Omnidirectional shooting (8 directions) (cost: 50 quantum, 40 crystals, 25 energy, 30 metal)

### Shields

| Shield | Capacity | Regen | Description |
|--------|----------|-------|-------------|
| None | 0 | 0 | No protection |
| Basic | 50 | 0 | Early tier |
| Reinforced | 100 | 0 | Mid tier |
| Quantum | 150 | 15/s | Only shield with regen |
| Ontological Reality | 300 | 30/s | High tier |
| Individual System Barrier | 500 | 50/s | Ultimate shield |

### Upgrades

| Upgrade | Effect | Description |
|---------|--------|-------------|
| Targeting Computer | Enables crosshair | Aim assist |
| Auto Collector | Attracts all items | Auto-collection |
| Complete Description Matrix | +50% damage, +30% fire rate | High tier |
| Ensemble Bypass | +100% resource drops, +50% speed | Ultra tier |
| Transformation Time Scanner | +40% critical hit chance | High tier |
| Individual System Amplifier | +75% all stats, +200% resource drops | Highest tier |

---

## Upgrade System

### Upgrade Cost Formula
**Logarithmic Scaling** (prevents exponential cost spikes):
```javascript
baseCost = 10 + (upgradeLevel * 5)
costMultiplier = 1 + Math.log(level + 1) * 0.5
finalCost = baseCost * costMultiplier
```

**Example Calculations:**
- Level 1, first upgrade: `(10 + 0*5) * (1 + log(2) * 0.5) = 10 * 1.35 = 13.5 tokens`
- Level 10, 5th upgrade: `(10 + 5*5) * (1 + log(11) * 0.5) = 35 * 1.70 = 59.5 tokens`
- Level 50, 10th upgrade: `(10 + 10*5) * (1 + log(51) * 0.5) = 60 * 2.45 = 147 tokens`

### Upgrade Increments
| Stat | Increment | Cap | Max Upgrades |
|------|-----------|-----|--------------|
| Speed | +30 | baseSpeed + 600 | 20 upgrades |
| Fire Rate | +0.2 | baseFireRate + 8.0 | 40 upgrades |
| Damage | +5 | baseDamage + 100 | 20 upgrades |
| Max Health | +25 | baseMaxHealth + 500 | 20 upgrades |
| Critical Hit Chance | +2% | 100% | 50 upgrades |
| Critical Hit Damage | +0.1x | 5.0x | 30 upgrades |
| Shield Capacity | +5% | No cap | Unlimited |
| Shield Regen | +2/s | 50/s | 25 upgrades |
| Damage Reduction | +1% | No cap | Unlimited |
| Evasion | +1% | No cap | Unlimited |
| Material Drop Rate | +5% | 300% | 60 upgrades |
| Token Drop Rate | +5% | 200% | 40 upgrades |
| Level Time Reduction | +3% | 40% | 13 upgrades |
| Projectile Speed | +10% | 200% | 20 upgrades |
| Health Regen | +0.5 HP/s | 10 HP/s | 20 upgrades |

---

## Enemy Scaling

### Enemy Difficulty Formula
```javascript
baseDifficulty = 0.5
levelBonus = (level - 1) * 0.02  // +2% per level
damageMultiplier = (baseDamage - 10) / 50 * 0.3  // Up to +30%
weaponCountBonus = weaponCount * 0.05  // +5% per weapon
speedMultiplier = speedBonus / 200 * 0.2  // Up to +20%
levelBasedMinimum = Math.min(3.0, 0.5 + level * 0.025)  // +2.5% per level, caps at 3.0

difficulty = baseDifficulty + levelBonus + damageMultiplier + weaponCountBonus + speedMultiplier
difficulty = Math.max(levelBasedMinimum, Math.min(3.0, difficulty))
```

**Difficulty Range**: 0.5x to 3.0x

### Enemy Ship Stats (Bell Mode)
```javascript
baseSpeed = 50
speed = baseSpeed * difficulty
baseHealth = 60 + level * 10
health = baseHealth * difficulty
```

### Enemy Bullet Stats
```javascript
damage = 5 + level * 2
speed = 200 + level * 5
fireRate = 1.5 seconds between shots
```

---

## Molecule/Obstacle Stats

### Speed Scaling Formula
```javascript
if (level <= 50) {
    baseSpeed = 80 + level * 15
} else if (level <= 70) {
    level50Speed = 80 + 50 * 15  // 830
    baseSpeed = level50Speed + (level - 50) * 8
} else if (level <= 150) {
    level70Speed = 80 + 50 * 15 + 20 * 8  // 990
    baseSpeed = level70Speed + (level - 70) * 3
} else {
    level150Speed = 80 + 50 * 15 + 20 * 8 + 80 * 3  // 1110
    baseSpeed = level150Speed + (level - 150) * 1
}
baseSpeed = Math.min(baseSpeed, 1200)  // Hard cap at 1200
```

**Speed Examples:**
- Level 1: 95
- Level 50: 830
- Level 70: 990
- Level 100: 1080
- Level 150: 1110
- Level 200: 1160 (capped at 1200)

### Size Scaling Formula
```javascript
if (level < 50) {
    baseSize = 45 + (level - 1) * 1.5
} else if (level < 70) {
    baseSize = 45 + 49 * 1.5 + (level - 50) * 1.0
} else if (level < 150) {
    level70Size = 45 + 49 * 1.5 + 20 * 1.0  // ~139
    baseSize = level70Size + (level - 70) * 0.15
} else {
    level150Size = 45 + 49 * 1.5 + 20 * 1.0 + 80 * 0.15  // ~152
    baseSize = Math.min(level150Size + (level - 150) * 0.05, 160)
}
```

**Size Examples:**
- Level 1: 45
- Level 20: 73.5
- Level 50: ~120
- Level 70: ~139
- Level 150: ~152
- Level 200: ~154.5 (capped at 160)

### Health Formula
```javascript
damagePerShot = calculateCombinedDamage()  // Player's total damage
hitsToKill = 3 + Math.floor(Math.random() * 3)  // 3, 4, or 5 hits
baseHealth = damagePerShot * hitsToKill

// Scale by molecule complexity
if (level >= 100) {
    healthMultiplier = 2.0  // Complex molecules
} else if (level >= 50) {
    healthMultiplier = 1.5  // Medium molecules
} else {
    healthMultiplier = 1.0  // Simple molecules
}

maxHealth = Math.floor(baseHealth * healthMultiplier)
```

### Molecule Types
- **Simple** (Levels 1-49): H2O, CO2, NH3 - 3 atoms
- **Medium** (Levels 50-99): C6H6, CH4 - 4+ atoms
- **Complex** (Levels 100+): Large organic molecules - 6+ atoms

---

## Spawn Rates

### Target Spawn Rate (Particles/Pairs)
**Levels 1-5** (more particles, lighter start):
```javascript
targetSpawnRate = 2200 - (level - 1) * 180
```
- Level 1: 2200ms
- Level 2: 2020ms
- Level 3: 1840ms
- Level 4: 1660ms
- Level 5: 1480ms

**Levels 6-15** (keeps particles flowing while easing difficulty):
```javascript
targetSpawnRate = Math.max(900, 1500 - (level - 6) * 60)
```
- Level 6: 1500ms
- Level 10: 1260ms
- Level 15: 960ms (floor at 900ms)

**Levels 16+**:
```javascript
targetSpawnRate = Math.max(500, 2000 - level * 100)
```
- Level 16+: minimum 500ms

### Obstacle Spawn Rate (Molecules)
**Levels 1-5** (fewer early molecules):
```javascript
obstacleSpawnRate = 3200 - (level - 1) * 200
```
- Level 1: 3200ms
- Level 2: 3000ms
- Level 3: 2800ms
- Level 4: 2600ms
- Level 5: 2400ms

**Levels 6-15** (keeps molecule pressure modest):
```javascript
obstacleSpawnRate = Math.max(1400, 2400 - (level - 6) * 110)
```
- Level 6: 2400ms
- Level 10: 1960ms
- Level 15: 1410ms (floor at 1400ms)

**Levels 16+**:
```javascript
obstacleSpawnRate = Math.max(1000, 3000 - level * 150)
```
- Level 16+: minimum 1000ms

### Enemy Spawn Rate (Bell Mode)
```javascript
enemySpawnRate = 8000ms  // 8 seconds between enemy ships
enemyShotRate = 1500ms   // 1.5 seconds between enemy shots
```

---

## Drop Rates

### Material Drops (from Particles/Pairs)
**Mode-Specific:**
- **Ensemble Mode**: 50% quantum particles, 50% crystals
- **Individual Mode**: 50% energy cores, 50% metal scraps
- **Bell Mode**: 50% quantum particles, 35% crystals, 10% metal scraps, 5% energy cores

### Biological Drops (from Molecules)
**Drop Probabilities:**
- **ATP**: 0.00-0.30 (30%)
- **Amino Acids**: 0.30-0.60 (30%)
- **Simple Sugars**: 0.60-0.90 (30%)
- **Fatty Acids**: 0.90-0.95 (5%)
- **Nucleotides**: 0.80-0.86 (6%)
- **Vitamins**: 0.86-0.92 (6%)
- **Minerals**: 0.92-1.00 (8%)

**Drop Count**: Base 8 biological materials per molecule (increased from 5)

### Token Drops
```javascript
baseTokens = 1 + Math.floor(level / 2)
tokenMultiplier = mode === 'bell' ? 2 : 1
tokenDropBonus = 1 + (tokenDropRate / 100)
finalTokens = baseTokens * tokenMultiplier * tokenDropBonus
```

**Examples:**
- Level 1: 1 token (2 in Bell mode)
- Level 10: 5 tokens (10 in Bell mode)
- Level 50: 25 tokens (50 in Bell mode)

---

## Crafting Recipes

### Weapons

| Weapon | Quantum | Crystals | Energy | Metal | Tokens | Level Req |
|--------|---------|----------|--------|-------|--------|-----------|
| Basic | 1 | 1 | 0 | 1 | 0 | 1 |
| Rapid | 8 | 5 | 2 | 0 | 0 | 3 |
| Spread | 12 | 8 | 3 | 2 | 0 | 5 |
| Laser | 18 | 12 | 6 | 4 | 0 | 10 |
| Automatic | 25 | 18 | 8 | 8 | 0 | 15 |
| Transformation Predictor | 120 | 100 | 80 | 60 | 50 | 30 |
| Deterministic Engine | 180 | 150 | 120 | 100 | 80 | 50 |
| Individual System Core | 250 | 200 | 180 | 150 | 120 | 75 |

### Ships

| Ship | Quantum | Crystals | Energy | Metal | Tokens | Level Req |
|------|---------|----------|--------|-------|--------|-----------|
| Basic | 2 | 1 | 0 | 2 | 0 | 1 |
| Fast | 5 | 3 | 0 | 5 | 0 | 1 |
| Tank | 8 | 5 | 0 | 8 | 0 | 1 |
| Agile | 10 | 5 | 2 | 5 | 0 | 1 |
| Individual Stabilizer | 100 | 80 | 60 | 50 | 40 | 35 |
| Complete Description Vessel | 180 | 150 | 120 | 100 | 80 | 60 |

### Shields

| Shield | Quantum | Crystals | Energy | Metal | Tokens | Level Req |
|--------|---------|----------|--------|-------|--------|-----------|
| Basic | 3 | 2 | 0 | 3 | 0 | 1 |
| Reinforced | 6 | 4 | 0 | 5 | 0 | 1 |
| Quantum | 15 | 10 | 5 | 8 | 0 | 1 |
| Ontological Reality | 120 | 100 | 80 | 60 | 50 | 40 |
| Individual System Barrier | 200 | 180 | 150 | 120 | 100 | 70 |

### Upgrades

| Upgrade | Quantum | Crystals | Energy | Metal | Tokens | Level Req |
|---------|---------|----------|--------|-------|--------|-----------|
| Targeting Computer | 15 | 10 | 5 | 8 | 0 | 1 |
| Auto Collector | 25 | 20 | 10 | 15 | 0 | 1 |
| Complete Description Matrix | 150 | 120 | 100 | 80 | 60 | 35 |
| Transformation Time Scanner | 180 | 150 | 120 | 100 | 80 | 40 |
| Ensemble Bypass | 250 | 200 | 180 | 150 | 120 | 65 |
| Individual System Amplifier | 300 | 250 | 220 | 200 | 150 | 80 |

### Consumables

| Item | Materials | Effect |
|------|-----------|--------|
| Atom Split | 30 quantum, 25 crystals, 15 energy, 20 metal | Clears screen, doubles resources |
| Health Pack | Shop only (tokens) | Restores 50 HP |

### Food Items

| Food | ATP | Amino Acids | Sugars | Fatty Acids | Vitamins | Minerals | Hunger | Methane |
|------|-----|-------------|--------|-------------|----------|----------|--------|---------|
| Basic Meal | 5 | 3 | 2 | 0 | 0 | 0 | 20 | 0 |
| Protein Bar | 0 | 8 | 4 | 0 | 0 | 0 | 35 | 0 |
| Energy Drink | 10 | 0 | 6 | 0 | 0 | 0 | 35 | +5 |
| Balanced Meal | 8 | 6 | 5 | 3 | 2 | 0 | 50 | 0 |
| Super Food | 15 | 12 | 10 | 5 | 4 | 3 | 100 | +15 |
| Methane Snack | 0 | 0 | 3 | 2 | 0 | 0 | 10 | +10 |

### Tools

| Tool | Quantum | Crystals | Energy | Metal | Level Req | Effect |
|------|---------|----------|--------|-------|-----------|--------|
| Hammer | 12 | 8 | 5 | 10 | 10 | Repairs items 10% per use |

---

## Survival System

### Hunger System
```javascript
maxHunger = 100
hungerDecayRate = 0.5 per second
deathThreshold = 0 (instant death when reached)
```

### Methane System
```javascript
maxMethane = 100
boostSpeedMultiplier = 1.5x
boostDamageMultiplier = 1.3x
boostDepletionRate = 20 per second
boostCooldown = 5000ms (5 seconds after boost ends)
```

### Boost Duration
```javascript
boostDuration = methane / depletionRate
// Example: 100 methane = 5 seconds of boost
```

---

## Level Progression

### Time Per Level
```javascript
baseTimePerLevel = 30 seconds
timeReduction = Math.min(40%, levelTimeReduction)
adjustedTimePerLevel = Math.max(10, baseTimePerLevel * (1 - timeReduction))
```

**Examples:**
- No upgrades: 30 seconds per level
- 40% reduction: 18 seconds per level
- Minimum: 10 seconds per level

### Level Calculation
```javascript
level = Math.floor(time / adjustedTimePerLevel) + 1
```

### Boss Levels
Boss battles occur every 15 levels: 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, etc.

---

## Boss Mechanics

### Boss Types

| Level | Boss Type | Structure | Destruction Order |
|-------|-----------|-----------|-------------------|
| 15 | Neurotransmitter | Ship → Vesicles → Neuron | Ship → Outer → Core |
| 30 | DNA Helix | Ship → Strand1 → Strand2 → Core | Ship → Outer → Core |
| 45 | Protein Complex | Ship → Subunits (1-4) → Core | Ship → Outer → Core |
| 60 | Cell Membrane | Ship → Outer Membrane → Inner Membrane → Nucleus | Ship → Outer → Core |
| 75+ | Advanced | Ship → Core | Ship → Core |

### Individual System Core Bypass
The Individual System Core weapon bypasses all boss order restrictions and can damage any boss part immediately.

---

## Damage Calculations

### Player Damage Formula
```javascript
// Base weapon damage
weaponDamage = weapon.damage

// Add weapon upgrades
weaponUpgradeBonus = calculateWeaponUpgradeBonus(weapon)

// Add RPG stat bonuses
rpgDamageBonus = playerStats.damage - playerStats.baseDamage

// Apply upgrade bonuses
if (hasCompleteDescriptionMatrix) {
    damage *= 1.5  // +50%
}
if (hasIndividualSystemAmplifier) {
    damage *= 1.75  // +75%
}

// Apply boost multiplier
if (boostActive) {
    damage *= 1.3  // +30%
}

// Critical hit calculation
if (Math.random() < criticalHitChance / 100) {
    damage *= criticalHitDamage
}
```

### Combined Damage (Multiple Weapons)
```javascript
combinedDamage = sum of all weapon damages
// Each weapon's damage is calculated separately
// Spread weapons multiply damage by projectile count
```

### Enemy Damage to Player
```javascript
baseDamage = enemy.damage || (10 + level)
finalDamage = baseDamage * (1 - damageReduction / 100)

// Evasion check
if (Math.random() < evasion / 100) {
    finalDamage = 0  // Dodged!
}

// Apply to health or shield
if (shield > 0) {
    shield -= finalDamage
} else {
    health -= finalDamage
}
```

---

## Performance Optimizations

### Bullet Management
- Bullets are removed when they go off-screen
- Maximum bullets on screen: ~200 (performance limit)
- Bullet lifetime tracking prevents memory leaks

### Particle System
- Explosion particles: 15 per explosion
- Maximum particles: ~500 (performance limit)
- Particles fade out over time

### Spawn Rate Limits
- Minimum spawn rates prevent excessive object creation
- Target spawn: 500ms minimum
- Obstacle spawn: 1000ms minimum

---

## Game Balance Notes

### Early Game (Levels 1-5)
- Slower particle spawning (3.1-3.5s) to allow molecule access
- Faster molecule spawning (2.1-2.5s) for food crafting
- Balanced for survival system introduction

### Mid Game (Levels 6-50)
- Normal spawn rate scaling
- Progressive difficulty increase
- Weapon and ship upgrades become available

### Late Game (Levels 50-200)
- Molecule speeds: 830-1200
- Player speed cap: baseSpeed + 600 (allows keeping up)
- Fire rate cap: baseFireRate + 8.0 (performance-safe)
- Logarithmic upgrade costs prevent exponential scaling

### Very Late Game (Levels 200+)
- Hard caps on all stats prevent game-breaking
- Enemy difficulty scales to 3.0x maximum
- Boss battles every 15 levels maintain challenge

---

## Version Information

**Last Updated**: December 18, 2025
**Game Version**: Full Space Shooter with RPG, Survival, and Crafting Systems
**Balance Version**: Post-caps and logarithmic scaling implementation

---

## Notes

- All formulas use JavaScript Math functions
- Percentages are stored as whole numbers (e.g., 50% = 50)
- Time values are in milliseconds unless specified
- Damage values are integers (rounded down)
- Health values are integers (rounded down)
- Speed values are in pixels per second
- Fire rate values are in shots per second

