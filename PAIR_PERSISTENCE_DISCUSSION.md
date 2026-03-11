# Bell Pair Persistence Across Mode Switches - Discussion

## Current Problem

**Issue**: When you leave bell pair mode and come back, all pairs are recreated from scratch. But in other modes (ensemble/individual), when you switch modes, the particles/targets stay.

**User Requirement**: Bell pair mode should remember the amount of particles/pairs and keep them when leaving and entering, just like other modes do.

## Current Behavior Analysis

### How Targets Persist in Ensemble/Individual Mode

**Targets Array** (`this.targets`):
- Targets are created via `spawnTarget()` 
- Targets persist in `this.targets` array across mode switches
- When switching from ensemble to individual (or vice versa), targets remain
- Only cleared on reset, level up, or boss mode

**Evidence**:
- Line 9695: `this.targets = this.targets.filter(...)` - Only filters dead targets
- No clearing of targets on mode switch
- Targets continue to update and exist regardless of mode

### How Pairs Are Currently Handled

**Pairs Array** (`this.pairs`):
- Pairs are created in bell mode via `spawnTarget()` (when `mode === 'bell'`)
- **Problem 1**: Update loop clears pairs when not in bell mode (line ~9783)
- **Problem 2**: `collapsePuzzlePairsToSingles()` removes pairs when leaving bell mode
- **Problem 3**: `onPuzzleModeSwitch()` removes puzzle wrappers when leaving bell mode

**Current Code Issues**:

1. **Update Loop** (line ~9783):
```javascript
if (this.mode === 'bell') {
    // Update pairs
} else {
    // Clear all pairs when not in bell mode
    this.pairs = [];  // ❌ This clears all pairs!
}
```

2. **collapsePuzzlePairsToSingles()** (line ~5198):
```javascript
collapsePuzzlePairsToSingles() {
    // Removes ALL pairs when leaving bell mode
    this.pairs = this.pairs.filter(pair => {
        // ... removes all pairs
        return false; // Remove all pairs
    });
}
```

3. **onPuzzleModeSwitch()** (line ~5056):
```javascript
onPuzzleModeSwitch(oldMode, newMode) {
    if (oldMode === 'bell' && newMode !== 'bell') {
        // Remove wrappers when leaving bell mode
        activePuzzles.forEach(target => {
            this.removePuzzleWrapper(target.puzzleId);  // ❌ Removes puzzle pairs
        });
    }
}
```

## Root Cause

**The Problem**: Our enhanced puzzle system was designed to:
1. Clear pairs when leaving bell mode (to prevent ghost pairs)
2. Only keep puzzle targets (which persist)

**But**: This means **regular pairs** (non-puzzle) are also cleared, which breaks the user's expectation that pairs should persist like targets do.

## Solution Options

### Option A: Preserve All Pairs (Like Targets)

**Concept**: Treat pairs like targets - they persist across mode switches.

**Implementation**:
1. **Update Loop**: Don't clear pairs when leaving bell mode
   - Instead, just stop updating them
   - Keep them in the array but don't process them

2. **Mode Switch**: Don't remove pairs when leaving bell mode
   - Keep all pairs in the array
   - Only remove dead pairs (health <= 0)

3. **Rendering**: Only render pairs in bell mode
   - Pairs exist but aren't visible in other modes
   - When returning to bell mode, they're visible again

**Pros**:
- Matches user expectation (pairs persist like targets)
- Simple implementation
- Consistent with how targets work

**Cons**:
- Pairs exist but aren't visible in other modes (could be confusing)
- Need to ensure pairs don't interfere with other modes

### Option B: Preserve Pair State, Recreate on Return

**Concept**: Store pair state when leaving, recreate when returning.

**Implementation**:
1. **When Leaving Bell Mode**:
   - Store pair data (positions, health, etc.)
   - Clear pairs array
   - Store in `this.bellModeState.pairs`

2. **When Entering Bell Mode**:
   - Check if stored pairs exist
   - Recreate pairs from stored state
   - Restore positions, health, etc.

**Pros**:
- Pairs don't exist when not in bell mode
- Can restore exact state

**Cons**:
- More complex (need to serialize/deserialize)
- Need to handle edge cases (pairs destroyed while away)
- More code to maintain

### Option C: Hybrid - Preserve Non-Puzzle Pairs, Manage Puzzle Wrappers

**Concept**: 
- **Regular pairs** (non-puzzle): Persist like targets
- **Puzzle wrappers**: Managed separately (created/removed as needed)

**Implementation**:
1. **Regular Pairs**: 
   - Don't clear on mode switch
   - Stop updating when not in bell mode
   - Resume updating when returning to bell mode

2. **Puzzle Wrappers**:
   - Remove when leaving bell mode (current behavior)
   - Recreate when entering bell mode (current behavior)
   - Puzzle targets persist (current behavior)

**Pros**:
- Regular pairs persist (user expectation)
- Puzzle system still works correctly
- Clear separation of concerns

**Cons**:
- Need to distinguish regular pairs from puzzle wrappers
- Slightly more complex logic

## Recommended Solution: Option C (Hybrid)

### Why Option C?

1. **Matches User Expectation**: Regular pairs persist like targets
2. **Puzzle System Intact**: Puzzle wrappers still managed correctly
3. **Clear Logic**: Regular pairs = persistent, Puzzle wrappers = managed
4. **Consistent**: Regular pairs work like targets, puzzle wrappers work like puzzle system

### Implementation Details

#### 1. Update Loop Enhancement

**Current**:
```javascript
if (this.mode === 'bell') {
    // Update pairs
} else {
    this.pairs = [];  // Clear all pairs
}
```

**Enhanced**:
```javascript
if (this.mode === 'bell') {
    // Update all pairs (regular + puzzle)
    this.pairs = this.pairs.filter(pair => {
        // Update logic...
    });
} else {
    // Don't clear pairs - just stop updating them
    // They'll be there when we return to bell mode
    // Only remove dead pairs to prevent memory leak
    this.pairs = this.pairs.filter(pair => {
        if (pair.isPuzzlePair) {
            // Remove puzzle wrappers (they'll be recreated)
            return false;
        }
        // Keep regular pairs (they persist)
        return (pair.a.health > 0 || pair.b.health > 0);
    });
}
```

#### 2. Mode Switch Enhancement

**Current**:
```javascript
onPuzzleModeSwitch(oldMode, newMode) {
    if (oldMode === 'bell' && newMode !== 'bell') {
        // Remove all puzzle wrappers
        activePuzzles.forEach(target => {
            this.removePuzzleWrapper(target.puzzleId);
        });
    }
}
```

**Enhanced**:
```javascript
onPuzzleModeSwitch(oldMode, newMode) {
    if (oldMode === 'bell' && newMode !== 'bell') {
        // Only remove puzzle wrappers (not regular pairs)
        activePuzzles.forEach(target => {
            this.removePuzzleWrapper(target.puzzleId);
        });
        // Regular pairs remain in array (will be visible when returning)
    }
    
    if (newMode === 'bell' && oldMode !== 'bell') {
        // Create puzzle wrappers for active puzzles
        activePuzzles.forEach(target => {
            if (!this.getPuzzlePair(target.puzzleId)) {
                this.ensurePuzzleTargetPaired(target);
            }
        });
        // Regular pairs are already there, just start updating them
    }
}
```

#### 3. Collapse Function Enhancement

**Current**:
```javascript
collapsePuzzlePairsToSingles() {
    // Removes ALL pairs
    this.pairs = this.pairs.filter(pair => {
        return false; // Remove all pairs
    });
}
```

**Enhanced**:
```javascript
collapsePuzzlePairsToSingles() {
    // Only remove puzzle wrappers, keep regular pairs
    this.pairs = this.pairs.filter(pair => {
        if (pair.isPuzzlePair) {
            // Remove puzzle wrapper
            return false;
        }
        // Keep regular pairs
        return true;
    });
}
```

## Key Changes Needed

### 1. Update Loop (Line ~9783)
- Don't clear pairs when leaving bell mode
- Only remove puzzle wrappers
- Keep regular pairs for when returning

### 2. collapsePuzzlePairsToSingles() (Line ~5198)
- Only remove puzzle wrappers
- Keep regular pairs

### 3. onPuzzleModeSwitch() (Line ~5056)
- Only manage puzzle wrappers
- Don't touch regular pairs

### 4. Rendering
- Already correct - only renders pairs in bell mode
- Pairs exist but aren't visible in other modes (fine)

## Benefits

1. **User Expectation Met**: Pairs persist like targets
2. **Puzzle System Works**: Puzzle wrappers still managed correctly
3. **Consistent Behavior**: Regular pairs work like targets
4. **No Breaking Changes**: Puzzle system unaffected

## Edge Cases to Consider

1. **Pairs Destroyed While Away**: 
   - Update loop removes dead pairs even when not in bell mode
   - Health check ensures dead pairs are removed

2. **New Pairs Spawned**:
   - `spawnTarget()` only creates pairs in bell mode (already correct)
   - Won't create pairs when not in bell mode

3. **Puzzle Pairs**:
   - Still managed separately (created/removed as needed)
   - Don't interfere with regular pairs

4. **Memory**:
   - Dead pairs are removed (health check)
   - No memory leak

## Summary

**Problem**: Pairs are cleared when leaving bell mode, but user wants them to persist like targets.

**Solution**: Preserve regular pairs across mode switches (like targets), but continue managing puzzle wrappers separately.

**Key Insight**: Regular pairs should work like targets (persist), while puzzle wrappers are special (managed).

**Implementation**: 
- Update loop: Keep regular pairs, remove puzzle wrappers when not in bell mode
- Mode switch: Only manage puzzle wrappers, don't touch regular pairs
- Collapse function: Only remove puzzle wrappers

This gives the user the behavior they want (pairs persist) while maintaining puzzle system functionality.
