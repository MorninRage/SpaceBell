# Puzzle System Redesign - Enhanced Architecture

## Current Problem Analysis

### Intentional Design: Puzzle Persistence Across Modes

The puzzle system is **intentionally designed** to show consistency across modes:
- Puzzle target should be visible in **all modes** (ensemble, individual, bell)
- Player can continue puzzle progress regardless of current mode
- This provides continuity and prevents puzzle reset on mode switch

### Current Primitive Implementation Issues

**Problem 1: Pair-Based Puzzle in Non-Pair Modes**
- Puzzle targets are stored in `this.targets` (works in all modes)
- But in bell mode, puzzle targets get paired via `ensurePuzzleTargetPaired()`
- When switching from bell mode to individual/ensemble mode:
  - Pair structure is removed (good)
  - But puzzle target remains in `this.targets` (good - intended)
  - **BUT**: The pair might still exist in `this.pairs` array (bad - causes invisible pairs)

**Problem 2: Mode-Specific Rendering vs Universal Puzzle**
- Puzzle target needs to be visible in all modes
- But pairs are only rendered in bell mode
- Current system tries to handle this by:
  - Keeping puzzle target in `this.targets` (visible in all modes)
  - Creating pair wrapper in `this.pairs` (only in bell mode)
  - Collapsing pair when leaving bell mode
- **Issue**: Edge cases where pairs persist or become invisible but interactable

**Problem 3: State Synchronization**
- Puzzle state (`this.puzzleState`) is mode-agnostic (good)
- Puzzle target (`this.targets` with `puzzleId`) is mode-agnostic (good)
- But pair structure (`this.pairs`) is mode-specific (causes sync issues)
- When mode switches, pair structure needs to be created/destroyed, but target persists

## Enhanced Puzzle System Architecture

### Core Principle: Separation of Concerns

**Puzzle Entity** (Mode-Agnostic):
- Puzzle state: `puzzleState` (sequence, progress, timers)
- Puzzle target: Single entity in `this.targets` with `puzzleId`
- Visible in ALL modes
- Interactable in ALL modes (via direct collision)

**Mode-Specific Wrapper** (Mode-Dependent):
- Bell mode: Creates pair wrapper around puzzle target
- Individual/Ensemble mode: No wrapper, just the target
- Wrapper is purely visual/mechanical, not the puzzle itself

### Proposed Architecture

#### 1. Puzzle Target as Primary Entity

**Concept**: Puzzle target is the **source of truth**, pairs are just visual wrappers.

**Structure**:
```javascript
// Puzzle target (always in this.targets)
{
    x, y, size, health, color,
    puzzleId: 123,           // Identifies this as puzzle target
    puzzleActive: true,      // Currently active step
    puzzleMode: 'bell' | 'individual' | 'ensemble' | null  // Mode when created
}

// Pair wrapper (only in this.pairs when mode === 'bell')
{
    a: puzzleTarget,         // Reference to puzzle target
    b: partner,              // Visual partner (puzzleProxyId)
    isPuzzlePair: true,       // Flag for puzzle pair
    puzzleId: 123            // Links to puzzle target
}
```

**Key Insight**: Pair's `a` property should be a **reference** to the puzzle target, not a copy.

#### 2. Mode-Aware Puzzle Manager

**Concept**: Centralized puzzle management that handles mode transitions.

**Structure**:
```javascript
class PuzzleManager {
    // Core puzzle state (mode-agnostic)
    puzzleState: {
        sequence: [id1, id2, id3],
        progress: 0,
        currentId: id1,
        // ...
    }
    
    // Puzzle targets (mode-agnostic, always in this.targets)
    puzzleTargets: Map<puzzleId, target>
    
    // Mode-specific wrappers
    getPuzzleWrapper(target, mode) {
        if (mode === 'bell') {
            return this.createPairWrapper(target);
        }
        return null; // No wrapper in other modes
    }
    
    // Mode transition handler
    onModeSwitch(oldMode, newMode) {
        // Remove old wrappers
        this.removeWrappers(oldMode);
        
        // Create new wrappers if needed
        if (newMode === 'bell') {
            this.createWrappersForActivePuzzles();
        }
        
        // Puzzle targets remain untouched
    }
}
```

#### 3. Rendering System

**Concept**: Render puzzle target based on current mode.

**Structure**:
```javascript
renderPuzzleTarget(target) {
    if (this.mode === 'bell') {
        // Check if pair wrapper exists
        const pair = this.findPairForPuzzleTarget(target.puzzleId);
        if (pair) {
            this.renderPair(pair);  // Render as pair
        } else {
            this.renderTarget(target);  // Fallback: render as single
        }
    } else {
        this.renderTarget(target);  // Render as single in other modes
    }
}
```

#### 4. Collision System

**Concept**: Collision detection based on mode and entity type.

**Structure**:
```javascript
checkPuzzleCollision(bullet) {
    // Always check direct target collision (works in all modes)
    for (let target of this.targets) {
        if (target.puzzleId && this.checkCollision(bullet, target)) {
            this.handlePuzzleHit(target);
            return true;
        }
    }
    
    // Only check pair collision in bell mode
    if (this.mode === 'bell') {
        for (let pair of this.pairs) {
            if (pair.isPuzzlePair && this.checkCollision(bullet, pair.b)) {
                // Hit pair partner - proxy to puzzle target
                const target = this.getPuzzleTargetById(pair.puzzleId);
                if (target) {
                    this.handlePuzzleHit(target);
                    return true;
                }
            }
        }
    }
    
    return false;
}
```

## Enhanced Implementation Options

### Option A: Reference-Based Pairs

**Concept**: Pairs store references to puzzle targets, not copies.

**Benefits**:
- Single source of truth (puzzle target in `this.targets`)
- No synchronization issues
- Easy to remove pair wrapper without affecting target

**Implementation**:
```javascript
createPuzzlePair(puzzleTarget) {
    const partner = this.createPartner(puzzleTarget);
    const pair = {
        a: puzzleTarget,        // Reference, not copy
        b: partner,
        puzzleId: puzzleTarget.puzzleId,
        isPuzzlePair: true
    };
    this.pairs.push(pair);
    return pair;
}

removePuzzlePair(puzzleId) {
    this.pairs = this.pairs.filter(p => 
        p.puzzleId !== puzzleId
    );
    // Puzzle target remains in this.targets
}
```

### Option B: Puzzle Target Registry

**Concept**: Centralized registry tracks puzzle targets and their mode-specific wrappers.

**Benefits**:
- Clear separation of puzzle vs mode-specific entities
- Easy to query puzzle state
- Clean mode transitions

**Implementation**:
```javascript
class PuzzleRegistry {
    targets: Map<puzzleId, target>
    wrappers: Map<puzzleId, wrapper>  // Mode-specific wrappers
    
    getPuzzleTarget(id) {
        return this.targets.get(id);
    }
    
    getWrapper(id, mode) {
        if (mode === 'bell') {
            return this.wrappers.get(id);
        }
        return null;
    }
    
    createWrapper(target, mode) {
        if (mode === 'bell') {
            const wrapper = this.createPairWrapper(target);
            this.wrappers.set(target.puzzleId, wrapper);
            return wrapper;
        }
        return null;
    }
    
    removeWrapper(id) {
        this.wrappers.delete(id);
        // Target remains in registry
    }
}
```

### Option C: Mode-Aware Puzzle Entity

**Concept**: Puzzle target itself knows how to render/interact based on mode.

**Benefits**:
- Self-contained puzzle logic
- No wrapper management
- Cleaner code

**Implementation**:
```javascript
class PuzzleTarget {
    constructor(id, x, y) {
        this.puzzleId = id;
        this.x = x;
        this.y = y;
        // ...
    }
    
    render(ctx, mode) {
        if (mode === 'bell') {
            this.renderAsPair(ctx);
        } else {
            this.renderAsSingle(ctx);
        }
    }
    
    checkCollision(bullet, mode) {
        // Direct collision always works
        if (this.checkDirectCollision(bullet)) {
            return true;
        }
        
        // Pair partner collision only in bell mode
        if (mode === 'bell' && this.partner) {
            return this.partner.checkCollision(bullet);
        }
        
        return false;
    }
}
```

## Recommended Approach: Hybrid (Option A + Registry Pattern)

### Architecture Overview

1. **Puzzle Target** (Primary Entity):
   - Stored in `this.targets` array
   - Always visible and interactable
   - Mode-agnostic

2. **Pair Wrapper** (Mode-Specific):
   - Only exists when `mode === 'bell'`
   - References puzzle target (not a copy)
   - Purely visual/mechanical

3. **Puzzle Manager** (Coordination):
   - Manages puzzle state
   - Handles mode transitions
   - Creates/removes wrappers as needed

### Implementation Structure

```javascript
// Puzzle Manager (new class or methods)
class PuzzleSystem {
    // Get puzzle target (always available)
    getPuzzleTarget(id) {
        return this.targets.find(t => t.puzzleId === id);
    }
    
    // Get pair wrapper (only in bell mode)
    getPuzzlePair(id) {
        if (this.mode !== 'bell') return null;
        return this.pairs.find(p => 
            p.isPuzzlePair && p.puzzleId === id
        );
    }
    
    // Create pair wrapper for puzzle target
    wrapPuzzleTarget(target) {
        if (this.mode !== 'bell') return null;
        
        // Check if wrapper already exists
        if (this.getPuzzlePair(target.puzzleId)) {
            return this.getPuzzlePair(target.puzzleId);
        }
        
        // Create partner
        const partner = this.createPartner(target);
        
        // Create pair wrapper (reference to target)
        const pair = {
            a: target,              // Reference, not copy
            b: partner,
            puzzleId: target.puzzleId,
            isPuzzlePair: true
        };
        
        this.pairs.push(pair);
        return pair;
    }
    
    // Remove pair wrapper (target remains)
    unwrapPuzzleTarget(id) {
        this.pairs = this.pairs.filter(p => 
            !(p.isPuzzlePair && p.puzzleId === id)
        );
        // Target remains in this.targets
    }
    
    // Mode transition handler
    onModeSwitch(oldMode, newMode) {
        // Get all active puzzle targets
        const activePuzzles = this.targets.filter(t => 
            t.puzzleId && this.isActivePuzzleTarget(t)
        );
        
        // Remove wrappers from old mode
        if (oldMode === 'bell') {
            activePuzzles.forEach(t => {
                this.unwrapPuzzleTarget(t.puzzleId);
            });
        }
        
        // Create wrappers for new mode
        if (newMode === 'bell') {
            activePuzzles.forEach(t => {
                this.wrapPuzzleTarget(t);
            });
        }
    }
}
```

### Rendering Logic

```javascript
renderPuzzleTargets() {
    const activePuzzleId = this.puzzleState?.currentId;
    
    for (let target of this.targets) {
        if (!target.puzzleId) continue;
        
        const isActive = target.puzzleId === activePuzzleId;
        
        if (this.mode === 'bell') {
            // Check if pair wrapper exists
            const pair = this.getPuzzlePair(target.puzzleId);
            if (pair) {
                // Render as pair
                this.renderPair(pair, isActive);
            } else {
                // Fallback: render as single (shouldn't happen, but safe)
                this.renderTarget(target, isActive);
            }
        } else {
            // Render as single target
            this.renderTarget(target, isActive);
        }
    }
}
```

### Collision Logic

```javascript
checkPuzzleCollision(bullet) {
    const activePuzzleId = this.puzzleState?.currentId;
    
    // Always check direct target collision (works in all modes)
    for (let target of this.targets) {
        if (target.puzzleId === activePuzzleId && 
            this.checkCollision(bullet, target)) {
            this.handlePuzzleHit(target);
            return true;
        }
    }
    
    // Only check pair partner collision in bell mode
    if (this.mode === 'bell') {
        for (let pair of this.pairs) {
            if (!pair.isPuzzlePair) continue;
            
            // Check partner collision (proxy to target)
            if (pair.b && this.checkCollision(bullet, pair.b)) {
                const target = this.getPuzzleTarget(pair.puzzleId);
                if (target && target.puzzleId === activePuzzleId) {
                    this.handlePuzzleHit(target);
                    return true;
                }
            }
        }
    }
    
    return false;
}
```

## Benefits of Enhanced System

### 1. Clear Separation
- Puzzle target = mode-agnostic, always exists
- Pair wrapper = mode-specific, only in bell mode
- No confusion about what persists

### 2. No Ghost Pairs
- Pairs are explicitly created/removed on mode switch
- No leftover pairs from previous mode
- Update loop can check `isPuzzlePair` flag

### 3. Single Source of Truth
- Puzzle target in `this.targets` is the source
- Pair wrapper references target (not a copy)
- No synchronization issues

### 4. Mode-Aware Updates
- Update loop can check mode and `isPuzzlePair` flag
- Only update pairs in bell mode
- Clear all non-puzzle pairs when leaving bell mode

### 5. Robust Mode Transitions
- Explicit wrapper creation/removal
- Puzzle targets always preserved
- No edge cases

## Migration Path

### Phase 1: Add Puzzle Flags
- Add `isPuzzlePair` flag to pairs
- Add `puzzleMode` tracking
- Mark existing puzzle pairs

### Phase 2: Implement Reference-Based Pairs
- Change pair creation to use references
- Update collision detection
- Update rendering

### Phase 3: Add Puzzle Manager
- Create puzzle management methods
- Implement mode transition handlers
- Centralize puzzle logic

### Phase 4: Clean Up
- Remove old primitive code
- Update all puzzle-related code
- Test thoroughly

## Summary

**Current System**: Primitive, tries to handle mode persistence but creates edge cases.

**Enhanced System**: 
- Clear separation: Puzzle target (universal) vs Pair wrapper (mode-specific)
- Reference-based: Pairs reference targets, not copies
- Mode-aware: Explicit wrapper management on mode switch
- Robust: No ghost pairs, no synchronization issues

**Key Insight**: Puzzle target is the **entity**, pair is just a **visual wrapper** that should be created/destroyed based on mode, but never interfere with the puzzle target itself.
