# Game Balance Updates

## Overview

This document tracks balance changes and progression updates made to the game, including level requirements, ship speeds, and UI improvements.

**Last Updated**: December 29, 2025

---

## Weapon Level Requirements

### Updated Requirements

- **spread**: Changed from Level 20 → **Level 40**
  - Moved to later in progression to balance mid-game difficulty
  - Now unlocks between transformationPredictor (Level 30) and deterministicEngine (Level 50)

### Weapon Unlock Order (by level)

1. **rapid** - Level 3
2. **laser** - Level 10
3. **automatic** - Level 15
4. **transformationPredictor** - Level 30
5. **spread** - Level 40 (moved from Level 20)
6. **deterministicEngine** - Level 50
7. **individualSystemCore** - Level 75

### Crafting UI Order

Weapons are now displayed in the crafting UI in unlock order to match progression:
- rapid → laser → automatic → transformationPredictor → spread → deterministicEngine → individualSystemCore

---

## Ship Updates

### Ship Unlock Levels

- **tank** - Level 2 (new requirement)
- **fast** - Level 3 (new requirement)
- **agile** - Level 4 (new requirement)
- **rapid** - Level 5
- **individualStabilizer** - Level 35
- **completeDescriptionVessel** - Level 60

### Ship Speed Updates

**Base Speeds**:
- **rapid**: 260 (unchanged, max: 860)
- **agile**: 190 (unchanged, max: 790)
- **individualStabilizer**: 250 → **400** (max: 850 → **1000**)
- **completeDescriptionVessel**: 280 → **500** (max: 880 → **1100**)

**Max Speed Caps**:
- **basic**: 650 (unchanged)
- **rapid**: 860 (260 + 600)
- **agile**: 790 (190 + 600)
- **individualStabilizer**: **1000** (special cap)
- **completeDescriptionVessel**: **1100** (special cap)
- All other ships: baseSpeed + 600

### Crafting UI Order

Ships are now displayed in the crafting UI in unlock order:
- tank → fast → agile → rapid → individualStabilizer → completeDescriptionVessel

---

## Shield Level Requirements

### New Requirements

- **basic** - Level 1 (new requirement)
- **reinforced** - Level 5 (new requirement)
- **quantum** - Level 20 (new requirement)
- **ontologicalReality** - Level 40 (unchanged)
- **individualSystemBarrier** - Level 70 (unchanged)

### Shield Unlock Order

1. **basic** - Level 1
2. **reinforced** - Level 5
3. **quantum** - Level 20
4. **ontologicalReality** - Level 40
5. **individualSystemBarrier** - Level 70

---

## Upgrade Level Requirements

### Updated Requirements

- **autoCollector**: Added requirement - **Level 70**
  - Previously had no level requirement
  - Now properly gated for late-game progression

### Upgrade Unlock Order

1. **targetingComputer** - No requirement (available from start)
2. **completeDescriptionMatrix** - Level 35
3. **transformationTimeScanner** - Level 40
4. **ensembleBypass** - Level 65
5. **autoCollector** - Level 70 (new requirement)
6. **individualSystemAmplifier** - Level 80

### Crafting UI Order

Upgrades are now displayed in the crafting UI in unlock order:
- targetingComputer → completeDescriptionMatrix → transformationTimeScanner → ensembleBypass → autoCollector → individualSystemAmplifier

---

## UI Improvements

### Cursor Visibility Fixes

**Menu Cursor Visibility**:
- Cursor now always visible in all menus (crafting, shop, settings, inventory, tutorial)
- Disabled buttons show "not-allowed" cursor consistently
- Enabled buttons show "pointer" cursor consistently
- Cursor remains visible when moving between elements

**Scrollbar Cursor Visibility**:
- Scrollbar thumb shows "grab" cursor when hovering
- Scrollbar thumb shows "grabbing" cursor when actively dragging
- Scrollbar track shows "default" cursor
- Custom scrollbar styling for all menu panels (12px width, cyan theme)
- Cross-browser support (WebKit and Firefox)

**Implementation**:
- Added `!important` flags to cursor styles to prevent overrides
- Menu containers set to `cursor: default !important`
- Buttons have explicit cursor styles with `!important`
- Scrollbar pseudo-elements styled with cursor visibility

---

## Intro Skip Prevention

### Phase 0 and Phase 1 Protection

**Cannot Skip**:
- Phase 0 (Will's-Way-Studios logo with puzzle system)
- Phase 1 (SpaceBell interactive logo)

**Why**:
- Phase 0 contains interactive puzzle system that players should experience
- Phase 1 requires players to shoot all letters to proceed
- Both phases are essential to the intro experience

**Implementation**:
- Skip button handler checks for `willsWayIntro` cutscene and phases 0/1
- Keyboard skip (Space/Enter) blocked for these phases
- Double-click skip blocked for these phases
- Safety check in `skipCutscene()` function prevents skipping even if called directly

**Still Functional**:
- All interactive features work normally (shooting, puzzle solving)
- Intro proceeds naturally after Phase 1 completes
- Other cutscenes can still be skipped as before

---

## Files Modified

### Game Logic (`game.js`)
- Recipes object (weapons, ships, shields, upgrades ordering)
- Equipment stats (ship speeds)
- Level requirements in crafting UI functions
- Max speed calculations
- Skip cutscene handlers

### HTML Files (`index.html`, `index-dev.html`)
- Cursor visibility CSS rules
- Scrollbar styling and cursor visibility
- Menu container cursor styles

---

## Locations

**Primary Development Version**:
- `C:\EarlyAccess\bell-game\game.js`
- `C:\EarlyAccess\bell-game\index.html`
- `C:\EarlyAccess\bell-game\index-dev.html`

**Ensemble Model Version**:
- `C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\game.js`
- `C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\index.html`
- `C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\index-dev.html`

---

*All changes have been synchronized between both versions.*

