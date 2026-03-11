# RPG Stat Caps and Progression

**Location:** `C:\Backup Bell\bell-game\RPG_STAT_CAPS_AND_PROGRESSION.md` (this file).

This document describes how RPG stats are capped in this project. Caps increase **every 10 levels** after each stat's unlock level so progression stays balanced and grindable without breaking the game.

---

## 1. Progressive stat caps

**Formula:** `cap = baseCap + floor((level - unlockLevel) / 10) * bonusPer10`

- **level** = current game level  
- **unlockLevel** = level at which the stat becomes available in the shop  
- Every **10 levels** after unlock, the cap increases by **bonusPer10**

Implemented via `getProgressiveCap(baseCap, unlockLevel, bonusPer10)` and `getStatCapsForLevel()` in `game.js`. If a purchase would exceed the cap, tokens are refunded. The shop UI shows "Cap: X" for each stat.

### Combat

| Stat | Base cap | Unlock level | +per 10 levels | Shop unlock |
|------|----------|--------------|----------------|-------------|
| Fire rate (bonus) | 8.0/s | 1 | 0.5 | 1 |
| Damage (bonus) | 100 | 1 | 25 | 1 |
| Projectile speed | 200% | 1 | 25% | 1 |
| Critical hit chance | 100% | 1 | 5% | 1 |
| Critical hit damage | 5.0x | 1 | 0.25x | 1 |

### Defense

| Stat | Base cap | Unlock level | +per 10 levels | Shop unlock |
|------|----------|--------------|----------------|-------------|
| Shield capacity | 100% | 10 | 25% | 10 |
| Shield regen | 50/s | 10 | 10/s | 10 |
| Damage reduction | 50% | 10 | 10% | 10 |
| Evasion | 30% | 10 | 5% | 10 |

### Economy / progression

| Stat | Base cap | Unlock level | +per 10 levels | Shop unlock |
|------|----------|--------------|----------------|-------------|
| Material drop rate | 300% | 20 | 50% | 20 |
| Token drop rate | 200% | 20 | 50% | 20 |
| Level time reduction | 40% | 20 | 5% | 20 |

### Quality of life

| Stat | Base cap | Unlock level | +per 10 levels | Shop unlock |
|------|----------|--------------|----------------|-------------|
| Max health (bonus) | 500 | 30 | 100 | 30 |
| Health regen | 10 HP/s | 30 | 2 HP/s | 30 |

### Speed (ship-based, not progressive)

Speed uses fixed caps per ship (e.g. basic 850, individualStabilizer 1200, etc.) in `upgradeStat`; not derived from `getProgressiveCap`.

---

## 2. Example: fire rate at level 21

- Unlock level 1, base cap 8.0, +0.5 per 10 levels.  
- Level 1–10: cap = 8.0/s  
- Level 11–20: cap = 8.5/s  
- **Level 21–30: cap = 9.0/s**

So at level 21 the fire rate cap is **9.0/s** and the shop shows that.

---

## 3. Implementation in game.js

- **getProgressiveCap(baseCap, unlockLevel, bonusPer10)** – returns the current cap for the given parameters using `level` and `/ 10`.  
- **getStatCapsForLevel()** – returns an object of all caps (fireRateBonus, damageBonus, …, materialDropRateCap, tokenDropRateCap) computed via the same every-10-level formula.  
- **upgradeStat(stat, cost)** – enforces caps per stat and refunds tokens when at cap. Material and token drop rate use `getProgressiveCap(300, 20, 50)` and `getProgressiveCap(200, 20, 50)`.  
- **Shop UI** – uses `getStatCapsForLevel()` and displays "Cap: X" for each upgrade.
