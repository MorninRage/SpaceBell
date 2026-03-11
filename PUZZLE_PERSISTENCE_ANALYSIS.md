# Puzzle System Persistence Analysis

## How Puzzles Persist Across Modes

### Core Puzzle Architecture

The puzzle system is **mode-agnostic** and designed to work across all three game modes:

1. **Puzzle State** (`this.puzzleState`):
   - Persists across mode switches
   - Contains: `sequence`, `progress`, `completed`, `currentId`, `expireAt`, etc.
   - **NOT cleared** when switching modes
   - Location: Initialized at line 1137, updated throughout gameplay

2. **Puzzle Targets** (`this.targets` array):
   - Puzzle targets are regular targets with `puzzleId` property
   - Remain in `this.targets` array across mode switches
   - Can be hit directly in **all modes** (individual, ensemble, bell)
   - Location: Created via `spawnPuzzleTarget()` at line 4926

3. **Puzzle Pairs** (`this.pairs` array):
   - Created **only in bell mode** via `ensurePuzzleTargetPaired()`
   - Used to make puzzle targets visible as pairs in bell mode
   - Should be collapsed/removed when leaving bell mode
   - Location: Created at line 4949-5005

### Puzzle Flow Across Modes

#### In Bell Mode (Mode 3):
- Puzzle targets get paired via `ensurePuzzleTargetPaired()` (line 4057-4064)
- Player can hit either:
  - The puzzle target directly (in `this.targets`)
  - The pair partner (via `puzzleProxyId` in `this.pairs`)
- Both paths call `handlePuzzleTargetHit()` to advance puzzle progress

#### In Individual/Ensemble Mode (Modes 1 & 2):
- Puzzle targets remain as **single targets** in `this.targets`
- Player hits targets directly (no pairs involved)
- Same `handlePuzzleTargetHit()` function advances puzzle progress
- Pairs should NOT exist or be interactable

### Current Problem

**Issue**: Non-puzzle pairs persist in `this.pairs` when switching from bell mode to other modes, and bullets can hit them even though they're invisible.

**Why this breaks puzzle persistence**:
- Puzzle targets themselves work correctly (they're in `this.targets`)
- But leftover non-puzzle pairs in `this.pairs` can be accidentally hit
- This creates confusion and breaks mode isolation

## Puzzle Persistence Requirements

### What MUST Persist:

1. ✅ **Puzzle State** (`this.puzzleState`):
   - Sequence IDs, progress, completion status
   - Timers (expireAt, totalEnd, cooldownUntil)
   - Completed count for difficulty scaling
   - **Action**: Keep completely intact across mode switches

2. ✅ **Puzzle Targets** (`this.targets` with `puzzleId`):
   - The actual puzzle targets must remain
   - Their `puzzleId` and `puzzleActive` flags must persist
   - **Action**: Never clear puzzle targets when switching modes

3. ✅ **Puzzle Progress**:
   - Current step in sequence (`puzzleState.progress`)
   - Active puzzle target (`puzzleState.currentId`)
   - **Action**: Preserve puzzle progress when switching modes

### What Should NOT Persist:

1. ❌ **Non-Puzzle Pairs** (`this.pairs` without puzzle IDs):
   - Regular bell pairs that aren't part of puzzle
   - Should be cleared when leaving bell mode
   - **Action**: Clear all non-puzzle pairs on mode switch

2. ❌ **Puzzle Pair Structures** (when not in bell mode):
   - Pair structures should be removed when leaving bell mode
   - Puzzle targets remain, but pair wrappers are removed
   - **Action**: Collapse puzzle pairs to singles when leaving bell mode

## How Puzzle Works in Each Mode

### Mode 1: Ensemble QM
- Puzzle targets: Single targets in `this.targets`
- Hit detection: Direct collision with targets (line ~9058-9073)
- Puzzle pairs: **None** (should not exist)
- Code path: `handlePuzzleTargetHit()` called directly from target collision

### Mode 2: Individual System (Deterministic)
- Puzzle targets: Single targets in `this.targets`
- Hit detection: Direct collision with targets (line ~9058-9073)
- Puzzle pairs: **None** (should not exist)
- Code path: `handlePuzzleTargetHit()` called directly from target collision
- **THIS IS WHERE THE BUG OCCURS** - leftover pairs can be hit

### Mode 3: Bell Pairs
- Puzzle targets: Paired via `ensurePuzzleTargetPaired()` (line 4057-4064)
- Hit detection: Can hit either:
  - Pair partner (via `puzzleProxyId`) - line ~8867-8894
  - Direct target (in `this.targets`) - line ~9058-9073
- Puzzle pairs: Created dynamically when entering bell mode
- Code path: `handlePuzzleTargetHit()` called from either pair or target collision

## Critical Code Sections

### 1. Puzzle State Management
```javascript
// Line 1137: Puzzle state initialization
this.puzzleState = {
    sequence: [],        // Array of puzzle IDs
    progress: 0,          // Current step
    currentId: null,      // Active puzzle target ID
    completed: false,     // Completion status
    expireAt: 0,          // When current step expires
    // ... more fields
}
```

### 2. Mode Switch Logic (setMode function)
```javascript
// Line 4057-4064: When entering bell mode
if (this.puzzleState && this.puzzleState.sequence && this.puzzleState.sequence.length > 0) {
    const currentId = this.puzzleState.sequence[this.puzzleState.progress];
    const activePuzzleTarget = this.targets.find(t => t.puzzleId === currentId);
    if (activePuzzleTarget) {
        this.ensurePuzzleTargetPaired(activePuzzleTarget);  // Create pair
        this.setActivePuzzleTarget();
    }
}

// Line 4032, 4043: When leaving bell mode
this.collapsePuzzlePairsToSingles();  // Collapse puzzle pairs
```

### 3. Puzzle Target Hit Detection (Individual/Ensemble Mode)
```javascript
// Line ~9058-9073: Direct target collision
for (let target of this.targets) {
    if (target.puzzleId && this.checkCollision(bullet, target)) {
        this.handlePuzzleTargetHit(target);  // Advance puzzle
        // ...
    }
}
```

### 4. Puzzle Pair Hit Detection (Bell Mode)
```javascript
// Line ~8867-8894: Pair collision
for (let pair of this.pairs) {
    const hitA = this.checkCollision(bullet, pair.a);
    const hitB = this.checkCollision(bullet, pair.b);
    const aIsPuzzle = hitA && (pair.a.puzzleId === currentId || pair.a.puzzleProxyId === currentId);
    const bIsPuzzle = hitB && (pair.b.puzzleId === currentId || pair.b.puzzleProxyId === currentId);
    
    if (aIsPuzzle || bIsPuzzle) {
        const targetRef = this.getPuzzleTargetById(currentId);
        if (targetRef) {
            this.handlePuzzleTargetHit(targetRef);  // Advance puzzle
        }
    }
}
```

## Updated Fix Strategy

### Revised Approach to Preserve Puzzle Persistence

#### Fix 1: Mode Guard in Bullet Collision (UNCHANGED)
- **Location**: Line ~8865
- **Action**: Wrap pair collision check in `if (this.mode === 'bell')`
- **Impact**: Prevents hitting pairs when not in bell mode
- **Puzzle Impact**: ✅ **NONE** - puzzle targets still work via direct collision

#### Fix 2: Smart Pair Cleanup (REVISED)
- **Location**: `collapsePuzzlePairsToSingles()` at line 5122
- **Action**: 
  - Remove ALL non-puzzle pairs when leaving bell mode
  - Keep puzzle pair structures but collapse them (puzzle targets remain in `this.targets`)
  - **CRITICAL**: Don't touch puzzle targets themselves
- **Puzzle Impact**: ✅ **NONE** - puzzle targets remain intact, only pair wrappers removed

#### Fix 3: Enhanced Collapse Function (NEW)
```javascript
collapsePuzzlePairsToSingles() {
    if (!this.pairs || this.pairs.length === 0) return;
    
    // Filter pairs: remove puzzle pairs (they'll be recreated if needed)
    // and remove all non-puzzle pairs
    this.pairs = this.pairs.filter(pair => {
        const hasPuzzleA = !!pair.a?.puzzleId || !!pair.a?.puzzleProxyId;
        const hasPuzzleB = !!pair.b?.puzzleId || !!pair.b?.puzzleProxyId;
        
        if (hasPuzzleA || hasPuzzleB) {
            // This is a puzzle pair - remove the pair structure
            // BUT keep the puzzle target in this.targets
            // The puzzle target will be re-paired if player switches back to bell mode
            if (hasPuzzleA && pair.a.puzzleId) {
                // Ensure puzzle target flag is preserved
                pair.a.puzzleActive = true;  // Keep active if it's the current puzzle
            }
            if (hasPuzzleB && pair.b.puzzleId) {
                pair.b.puzzleActive = true;
            }
            return false; // Remove pair structure
        }
        
        // Non-puzzle pair - remove it when leaving bell mode
        return false; // Remove all pairs when not in bell mode
    });
}
```

#### Fix 4: Pair Creation Guard (REVISED)
- **Location**: `ensurePuzzleTargetPaired()` at line 4949
- **Action**: Add mode check at start
- **Impact**: Prevents creating pairs outside bell mode
- **Puzzle Impact**: ✅ **NONE** - puzzle targets still work as singles

```javascript
ensurePuzzleTargetPaired(puzzleTarget) {
    // Only create pairs in bell mode
    if (this.mode !== 'bell') return;
    
    // ... rest of existing logic ...
}
```

## Puzzle Persistence Test Cases

### Test Case 1: Puzzle Progress Across Mode Switch
1. Start puzzle in bell mode (mode 3)
2. Complete step 1 of puzzle (hit pair)
3. Switch to individual mode (mode 2)
4. **Expected**: 
   - Puzzle progress preserved (`puzzleState.progress === 1`)
   - Puzzle target for step 2 visible as single target
   - Can hit target directly to continue puzzle
   - No pairs visible or interactable

### Test Case 2: Puzzle Completion in Different Mode
1. Start puzzle in bell mode
2. Complete 2 steps in bell mode
3. Switch to ensemble mode (mode 1)
4. Complete final step in ensemble mode
5. **Expected**:
   - Puzzle completes successfully
   - Neurokeys awarded
   - Next puzzle sequence starts after cooldown

### Test Case 3: Rapid Mode Switching During Puzzle
1. Start puzzle in bell mode
2. Switch to individual mode
3. Switch back to bell mode
4. **Expected**:
   - Puzzle progress preserved
   - Puzzle target re-paired when entering bell mode
   - Can continue puzzle seamlessly

### Test Case 4: Puzzle Timeout Across Modes
1. Start puzzle in bell mode
2. Switch to individual mode mid-puzzle
3. Wait for puzzle timeout
4. **Expected**:
   - Puzzle restarts with new sequence
   - Works correctly in individual mode

## Implementation Safety Checklist

When implementing fixes, ensure:

- [ ] `this.puzzleState` is never cleared or reset on mode switch
- [ ] Puzzle targets in `this.targets` with `puzzleId` are never removed
- [ ] `puzzleState.progress` and `puzzleState.currentId` persist
- [ ] `handlePuzzleTargetHit()` works in all modes
- [ ] Puzzle pairs are recreated when entering bell mode (if puzzle active)
- [ ] Non-puzzle pairs are cleared when leaving bell mode
- [ ] Puzzle targets remain hittable in individual/ensemble mode
- [ ] Puzzle timeout works correctly in all modes

## Summary

**Key Insight**: The puzzle system is designed to be mode-agnostic. Puzzle targets persist in `this.targets` and can be hit in any mode. Pairs are just a visual/mechanical wrapper in bell mode.

**The Fix**: 
1. Prevent pair collision detection when not in bell mode
2. Clear non-puzzle pairs when leaving bell mode
3. Preserve puzzle targets and puzzle state at all times
4. Recreate puzzle pairs when entering bell mode (if puzzle active)

**Result**: Puzzle continues to work seamlessly across all modes, but invisible pairs can no longer be hit in non-bell modes.
