# Interactive SpaceBell Logo Documentation

## Overview

The SpaceBell website features an interactive logo on the homepage where users can shoot letters with the ship cursor to light them up. Each letter has unique visual effects and colors based on the game's three modes (Bell, Ensemble, Individual).

**Location**: `C:\SpaceBell.games\website\app\page.tsx`

---

## How It Works

### 1. Letter Structure

The logo displays "SpaceBell" with each letter as an independent interactive element:

- **Display Letters**: `['S', 'p', 'a', 'c', 'e', 'B', 'e', 'l', 'l']`
- **Unique IDs**: `['S', 'p', 'a', 'c', 'e1', 'B', 'e2', 'l1', 'l2']`

**Why Unique IDs?**
- The word "SpaceBell" contains duplicate letters (two 'e's and two 'l's)
- Each letter must be shot individually to light up
- Unique IDs (`e1`, `e2`, `l1`, `l2`) ensure each letter is tracked separately
- Without unique IDs, shooting one 'e' would toggle both 'e's simultaneously

### 2. Shooting Mechanics

**How to Light Letters**:
1. Move mouse to position ship cursor
2. Click to shoot a bullet
3. Bullet travels from ship to click position
4. When bullet hits a letter, it lights up
5. Each letter must be shot individually

**Implementation**:
- Ship cursor component (`ShipCursor.tsx`) detects bullet collisions with letter elements
- Uses `document.elementsFromPoint()` to find letter at bullet position
- Checks for `data-letter-id` attribute to identify which letter was hit
- Dispatches `letter-hit` custom event with unique letter ID

### 3. Visual States

**Unlit Letters** (Default):
- Dim white fill: `rgba(255, 255, 255, 0.25)`
- Colored border stroke matching letter's theme color
- Reduced brightness filter
- No glow effects

**Lit Letters** (After Being Shot):
- Bright gradient fill matching letter's color theme
- Pulsing glow effect with shadow
- Enhanced brightness and saturation
- Smooth transition animation (0.5s cubic-bezier)

### 4. Letter Color Themes

Each letter has a unique color scheme based on game modes:

| Letter | Color Theme | Mode Association | Colors |
|--------|------------|------------------|--------|
| **S** | Purple/Pink | Bell Mode | `#9c27b0` → `#e91e63` |
| **p** | Orange/Amber | Ensemble Mode | `#ff9800` → `#ffb74d` |
| **a** | Cyan/Blue | Individual Mode | `#00bcd4` → `#2196f3` |
| **c** | Pink/Magenta | Bell Mode variant | `#e91e63` → `#f06292` |
| **e1** (first e) | Deep Orange | Ensemble Mode variant | `#ff6f00` → `#ffa726` |
| **B** | Deep Purple | Bell Mode variant | `#7b1fa2` → `#9c27b0` |
| **e2** (second e) | Deep Orange | Ensemble Mode variant | `#ff6f00` → `#ffa726` |
| **l1** (first l) | Teal/Cyan | Individual Mode variant | `#0097a7` → `#00bcd4` |
| **l2** (second l) | Teal/Cyan | Individual Mode variant | `#0097a7` → `#00bcd4` |

### 5. Hit Effects

When a letter is shot, a ring effect animation appears:

**Ring Animation**:
- Multiple concentric rings expand from letter center
- 4 rings per hit, each with slight delay (0.12s stagger)
- Rings fade out over 0.8 seconds
- Color matches letter's theme color
- Includes glow, border, and inner highlight layers

**Ring Layers**:
1. **Outer Glow**: Radial gradient with blur effect
2. **Main Ring**: Colored border with shadow
3. **Inner Highlight**: Radial gradient highlight

### 6. Technical Implementation

**Letter Rendering** (`page.tsx`):
```typescript
const letterDisplay = ['S', 'p', 'a', 'c', 'e', 'B', 'e', 'l', 'l'];
const letterIds = ['S', 'p', 'a', 'c', 'e1', 'B', 'e2', 'l1', 'l2'];

letterDisplay.map((letter, index) => {
  const letterId = letterIds[index];
  const isLightOn = letterLights[letterId] === true;
  // ... render letter with conditional styling
})
```

**Letter Elements**:
- Each letter is a `<span>` with:
  - `data-letter={letter}` - Display character
  - `data-letter-id={letterId}` - Unique tracking ID
  - `data-letter-index={index}` - Position index
  - `className="letter-target"` - For hit detection

**Hit Detection** (`ShipCursor.tsx`):
```typescript
const letterTarget = elementsAtPoint.find(el => 
  el.hasAttribute('data-letter-id') && 
  el.classList.contains('letter-target')
);

const letterId = letterTarget.getAttribute('data-letter-id');
// Dispatch event with letterId
```

**Event Handling** (`page.tsx`):
```typescript
window.addEventListener('letter-hit', (event) => {
  const { letterId } = event.detail;
  setLetterLights(prev => ({
    ...prev,
    [letterId]: !prev[letterId] // Toggle light state
  }));
});
```

### 7. State Management

**Letter Light States**:
- Stored in React state: `useState<Record<string, boolean>>({})`
- Key: Unique letter ID (e.g., `'e1'`, `'l2'`)
- Value: `true` if lit, `undefined`/`false` if unlit
- Explicit check: `letterLights[letterId] === true` (not just truthy)

**Hit Effect States**:
- Stored separately: `useState<Record<string, LetterHitEffect>>({})`
- Tracks active ring animations
- Auto-removes after 1 second
- Includes position data for ring rendering

**Duplicate Prevention**:
- Processing ref tracks last processed time per letter
- 200ms cooldown prevents duplicate toggles
- Ensures each bullet hit is processed once

---

## Code Locations

### Website Implementation

**Main Component**: `C:\SpaceBell.games\website\app\page.tsx`
- Lines 467-636: Logo rendering and letter mapping
- Lines 82-188: Letter hit event handler
- Lines 21-38: State management for lights and effects

**Ship Cursor**: `C:\SpaceBell.games\website\app\components\ShipCursor.tsx`
- Lines 172-235: Letter hit detection
- Uses `data-letter-id` attribute for unique identification

### Game Implementation

**Cutscene**: `C:\Full Backup Bell\bell-game\game.js`
- Lines 28036-28298: `drawSpaceBellInteractive()` function
- Lines 28499-28548: `checkLetterHit()` function
- Lines 28437-28498: `shootInSpaceBellPhase()` function

**Key Differences**:
- Game uses canvas rendering (not DOM elements)
- Game uses bullet collision detection with letter bounding boxes
- Game tracks letter positions for hit detection
- Both use unique IDs for duplicate letters

---

## User Experience

### Interaction Flow

1. **User visits homepage**
   - Logo displays with all letters unlit (dim with colored borders)
   - Ship cursor appears at mouse position

2. **User shoots at letters**
   - Click to shoot bullet
   - Bullet travels toward click position
   - When bullet hits a letter:
     - Letter lights up with bright gradient
     - Ring effect animation plays
     - Letter stays lit permanently

3. **All letters lit**
   - Each letter can be shot independently
   - No requirement to light all letters (purely visual/interactive)
   - Users can shoot letters in any order

### Visual Feedback

- **Unlit**: Dim appearance indicates letter hasn't been shot
- **Lit**: Bright gradient indicates letter has been activated
- **Hit Effect**: Ring animation provides immediate visual feedback
- **Pulsing**: Lit letters have subtle pulsing glow effect

---

## Design Philosophy

### Why Interactive?

- **Engagement**: Makes the logo more than just text
- **Game Integration**: Connects website to game mechanics
- **Discovery**: Encourages users to explore and interact
- **Brand Identity**: Reinforces SpaceBell's interactive nature

### Color System

- **Mode Representation**: Each letter represents a game mode
- **Visual Hierarchy**: Different colors help distinguish letters
- **Theme Consistency**: Colors match game's mode themes
- **Accessibility**: High contrast for visibility

### Animation Principles

- **Smooth Transitions**: 0.5s cubic-bezier for state changes
- **Performance**: CSS animations (GPU-accelerated)
- **Feedback**: Immediate visual response to interactions
- **Subtlety**: Pulsing effects are subtle, not distracting

---

## Troubleshooting

### Issue: Letters Not Lighting Up

**Possible Causes**:
1. Ship cursor not shooting bullets
2. Bullets not hitting letter elements
3. Event handler not receiving events
4. State not updating

**Solutions**:
- Check browser console for errors
- Verify `data-letter-id` attributes are present
- Check that `letter-hit` events are being dispatched
- Verify state updates in React DevTools

### Issue: Both 'e's or 'l's Toggle Together

**Cause**: Not using unique IDs

**Solution**: Ensure `data-letter-id` uses unique values (`e1`, `e2`, `l1`, `l2`)

### Issue: Ring Effects Not Appearing

**Cause**: Letter rect calculation or position issue

**Solution**: Check `letterRect` in event detail, verify letter center calculation

---

## Future Enhancements

### Potential Improvements

1. **Completion Animation**: Special effect when all letters are lit
2. **Sound Effects**: Audio feedback when letters are hit
3. **Particle Effects**: Additional visual effects on hit
4. **Progress Indicator**: Show how many letters are lit
5. **Reset Function**: Button to reset all letters to unlit state
6. **Persistence**: Save lit state in localStorage
7. **Achievement**: Unlock achievement when all letters lit

---

## Related Documentation

- `WEBSITE_DESIGN.md` - Overall website architecture
- `GAME_INTRO.md` - Game intro implementation (similar interactive logo)
- `NETLIFY_DEPLOYMENT.md` - How to deploy website updates

---

*Last Updated: December 28, 2025*
*Location: C:\SpaceBell.games\website\app\page.tsx*

