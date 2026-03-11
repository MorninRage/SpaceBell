# Puzzle System Mode Connection Fix - Game Plan

## Problem Statement

**Issue**: In deterministic mode 2 (Individual System mode), players can shoot and hit bell pairs (mode 3) even though they are not visible on screen. This breaks the mode isolation and allows unintended interactions.

## Root Cause Analysis

### Primary Issue: Missing Mode Check in Collision Detection

**Location**: `game.js` around line 8865 in the bullet update loop

**Problem**: The bullet collision detection code processes pairs from `this.pairs` array **regardless of the current game mode**:

```javascript
// Current problematic code (line ~8865)
for (let pair of this.pairs) {
    if (bulletHit) break;
    const hitA = this.checkCollision(bullet, pair.a);
    const hitB = this.checkCollision(bullet, pair.b);
    // ... processes hits without checking if mode === 'bell'
}
```

**Why this is a problem**:
1. Pairs are only **rendered** when `this.mode === 'bell'` (line 14677-14678)
2. But pairs can still exist in the `this.pairs` array when not in bell mode
3. Bullet collision detection doesn't verify the current mode before processing pairs
4. This allows "invisible" pairs to be hit even when not in bell mode

### Secondary Issues

1. **Incomplete Pair Cleanup**: 
   - `collapsePuzzlePairsToSingles()` (line 5122) only removes pairs that have puzzle IDs
   - Non-puzzle pairs remain in the array when switching from bell mode to other modes
   - Location: Called in `setMode()` when leaving bell mode (lines 4032, 4043)

2. **Pair Persistence**:
   - Pairs array is initialized but not fully cleared on mode switch
   - Pairs can persist from previous bell mode sessions
   - No validation that pairs should only exist in bell mode

3. **No Mode Validation**:
   - Multiple places where pairs are accessed without mode checks
   - Puzzle system assumes pairs exist but doesn't validate mode context

## Research: Best Practices for Mode-Based Collision Detection

### Pattern 1: Mode Guards in Collision Loops
- **Best Practice**: Check mode at the start of collision detection loops
- **Implementation**: Wrap pair collision checks in `if (this.mode === 'bell')`
- **Benefit**: Prevents processing irrelevant entities, improves performance

### Pattern 2: Entity State Management
- **Best Practice**: Clear mode-specific entities when switching modes
- **Implementation**: Ensure all pairs are removed when leaving bell mode
- **Benefit**: Prevents stale data and ensures clean state transitions

### Pattern 3: Validation Layers
- **Best Practice**: Add validation checks before accessing mode-specific arrays
- **Implementation**: Helper functions that validate mode before processing
- **Benefit**: Defensive programming, easier debugging

## Proposed Solution

### Solution Overview

Implement a **three-layer fix**:
1. **Mode Guard**: Add mode check in bullet collision detection
2. **Complete Cleanup**: Ensure all pairs are cleared when leaving bell mode
3. **Defensive Validation**: Add validation helpers for pair operations

### Detailed Fix Plan

#### Fix 1: Add Mode Check in Bullet Collision Detection

**Location**: `game.js` around line 8865

**Change**: Wrap pair collision detection in mode check

```javascript
// BEFORE (problematic):
for (let pair of this.pairs) {
    // ... collision detection ...
}

// AFTER (fixed):
// Only check pair collisions when in bell mode
if (this.mode === 'bell' && this.pairs.length > 0) {
    for (let pair of this.pairs) {
        // ... collision detection ...
    }
}
```

**Rationale**: 
- Pairs should only be interactable in bell mode
- Prevents invisible collisions
- Improves performance by skipping unnecessary checks

#### Fix 2: Complete Pair Cleanup on Mode Switch

**Location**: `game.js` in `setMode()` function (lines 4009-4068)

**Change**: Ensure ALL pairs are cleared when leaving bell mode, not just puzzle pairs

**Current behavior**:
- `collapsePuzzlePairsToSingles()` only removes puzzle pairs
- Non-puzzle pairs remain

**Proposed behavior**:
- When switching FROM bell mode TO another mode:
  - Clear all pairs (not just puzzle pairs)
  - Convert puzzle targets back to singles if needed
  - Ensure clean state transition

**Implementation options**:

**Option A**: Clear all pairs when leaving bell mode
```javascript
// In setMode(), when leaving bell mode:
if (oldMode === 'bell' && mode !== 'bell') {
    // Clear all pairs when leaving bell mode
    this.pairs = [];
    // Handle puzzle targets separately if needed
}
```

**Option B**: Enhanced collapse function
```javascript
collapsePuzzlePairsToSingles() {
    if (!this.pairs || this.pairs.length === 0) return;
    
    // If not in bell mode, clear ALL pairs
    if (this.mode !== 'bell') {
        this.pairs = [];
        return;
    }
    
    // Otherwise, only collapse puzzle pairs (existing logic)
    this.pairs = this.pairs.filter(pair => {
        // ... existing puzzle pair logic ...
    });
}
```

**Recommendation**: Option B is safer as it handles both cases and maintains existing puzzle logic.

#### Fix 3: Add Defensive Validation Helpers

**Location**: Add new helper methods in `game.js`

**Purpose**: Create validation functions to prevent similar issues

```javascript
// Helper to check if pairs should be processed
shouldProcessPairs() {
    return this.mode === 'bell' && this.pairs && this.pairs.length > 0;
}

// Helper to safely access pairs
getPairsForCurrentMode() {
    if (this.mode !== 'bell') return [];
    return this.pairs || [];
}
```

**Usage**: Replace direct `this.pairs` access with validated helpers where appropriate

#### Fix 4: Validate Pair Creation

**Location**: `ensurePuzzleTargetPaired()` and pair creation logic

**Change**: Add mode validation before creating pairs

```javascript
ensurePuzzleTargetPaired(puzzleTarget) {
    // Only create pairs in bell mode
    if (this.mode !== 'bell') return;
    
    // ... existing logic ...
}
```

**Rationale**: Prevents pairs from being created outside bell mode

### Testing Strategy

1. **Mode Switch Test**:
   - Start in bell mode, create pairs
   - Switch to individual mode (mode 2)
   - Verify pairs are not visible
   - Verify bullets cannot hit pairs
   - Verify pairs array is cleared/empty

2. **Puzzle System Test**:
   - Start puzzle sequence in bell mode
   - Switch to individual mode mid-puzzle
   - Verify puzzle state is handled correctly
   - Verify no invisible pairs remain

3. **Performance Test**:
   - Verify mode guard doesn't impact performance
   - Check that pair collision checks are skipped when not in bell mode

4. **Edge Cases**:
   - Rapid mode switching
   - Puzzle completion during mode switch
   - Boss mode with pairs (if applicable)

### Implementation Order

1. **Phase 1**: Add mode check in bullet collision (Fix 1)
   - Quick fix, immediate impact
   - Low risk, high value

2. **Phase 2**: Complete pair cleanup (Fix 2)
   - Ensures clean state
   - Prevents accumulation of stale pairs

3. **Phase 3**: Add validation helpers (Fix 3)
   - Defensive programming
   - Makes code more maintainable

4. **Phase 4**: Validate pair creation (Fix 4)
   - Prevents root cause
   - Ensures pairs only exist in bell mode

### Risk Assessment

**Low Risk Changes**:
- Adding mode check in collision detection (Fix 1)
- Adding validation helpers (Fix 3)

**Medium Risk Changes**:
- Complete pair cleanup (Fix 2) - need to ensure puzzle system still works
- Pair creation validation (Fix 4) - need to verify all creation paths

**Mitigation**:
- Test thoroughly after each phase
- Keep existing puzzle logic intact
- Add defensive checks before removing pairs

### Code Locations Summary

| Fix | Location | Line Range | Priority |
|-----|----------|------------|----------|
| Fix 1: Mode guard | Bullet collision loop | ~8865-8914 | **HIGH** |
| Fix 2: Complete cleanup | `setMode()` function | ~4009-4068 | **HIGH** |
| Fix 2: Enhanced collapse | `collapsePuzzlePairsToSingles()` | ~5122-5140 | **HIGH** |
| Fix 3: Validation helpers | New methods | TBD | Medium |
| Fix 4: Pair creation guard | `ensurePuzzleTargetPaired()` | ~4949-5000 | Medium |

### Success Criteria

✅ **Fixed**: Bullets cannot hit pairs when not in bell mode
✅ **Fixed**: Pairs are completely cleared when leaving bell mode
✅ **Fixed**: No invisible/interactable pairs in non-bell modes
✅ **Maintained**: Puzzle system continues to work correctly
✅ **Maintained**: Mode switching is smooth and clean
✅ **Improved**: Code is more defensive and maintainable

## Next Steps

1. **Review this plan** with the team/user
2. **Get approval** before implementing changes
3. **Implement Phase 1** (mode guard) first
4. **Test thoroughly** after each phase
5. **Iterate** based on testing results

## Notes

- The puzzle system is complex and interconnected
- Mode switching needs to preserve puzzle state correctly
- Boss mode may have special requirements (needs verification)
- Performance considerations: mode guards should improve performance by skipping unnecessary checks

## Puzzle Persistence Analysis

**CRITICAL**: The puzzle system is designed to persist across modes. See `PUZZLE_PERSISTENCE_ANALYSIS.md` for detailed analysis.

**Key Points**:
- Puzzle state (`this.puzzleState`) must NEVER be cleared on mode switch
- Puzzle targets (in `this.targets` with `puzzleId`) must persist
- Puzzle can be completed in ANY mode (individual, ensemble, or bell)
- Pairs are just visual wrappers in bell mode - puzzle targets work as singles in other modes
- The fix must preserve puzzle functionality while preventing invisible pair collisions

**Updated Strategy**:
1. Mode guard prevents pair collision when not in bell mode ✅
2. Smart cleanup: Remove pair structures but preserve puzzle targets ✅
3. Puzzle targets remain hittable in all modes via direct collision ✅
4. Puzzle pairs recreated when entering bell mode (if puzzle active) ✅
