# Game Intro Documentation

## Overview

The SpaceBell game features a two-phase interactive intro sequence that plays before the main game starts. The intro includes:

1. **Phase 0**: Will's-Way-Studios logo with interactive shooting mechanics - players can shoot the logo to make it move with physics-based reactions
2. **Phase 1**: Interactive SpaceBell logo where players must shoot all 9 letters to light them up and proceed

Both phases feature:
- Ship cursor that follows the mouse
- Shooting mechanics with bullet physics
- Distinct background themes (Studio/Development vs Deep Space/Quantum)
- Smooth transitions and visual effects

**Locations**: 
- `C:\Full Backup Bell\bell-game\game.js` (Primary development version)
- `C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\game.js` (Ensemble model version)

---

## Intro Flow

### Complete Sequence

1. **Will's-Way-Studios Logo** (Phase 0)
   - Animated logo display
   - Duration: 8 seconds
   - Automatic transition to next phase

2. **SpaceBell Interactive Logo** (Phase 1)
   - Interactive logo with shootable letters
   - Player must shoot all 9 letters to light them up
   - Ship cursor replaces mouse cursor
   - Automatic transition when all letters lit

3. **Preshading Rendering Screen** (Conditional)
   - Asset preloading screen (only shown if preload not complete)
   - Shows loading progress
   - **Note**: Preshader rendering happens in the BACKGROUND during Phase 0 and Phase 1
   - If preload completes during Phase 0/1, the preshader screen is skipped entirely
   - If preload is still running when Phase 1 completes, the preshader screen appears briefly

4. **Tutorial Intro Cutscene ("Welcome, Pilot!")**
   - Enhanced tutorial intro with high-fidelity visuals
   - Realistic deep space background with nebula clouds and quantum energy effects
   - High-fidelity Einstein character on left side with natural animations
   - Enhanced Einstein ship on right side with Einstein character in cockpit
   - Stunning animated text boxes with phase-based positioning and colors
   - Phase-based fade-in animations for smooth transitions
   - See [Tutorial Intro Cutscene](#tutorial-intro-cutscene-welcome-pilot) section for details

5. **Menu Phase**
   - Game menu
   - Press ESC to close

6. **Bell Cutscene**
   - Story cutscene with Bell creating time machine
   - Einstein shrinking animation

7. **Game Start**
   - Main game begins

---

## Phase 0: Will's-Way-Studios Logo

### Duration
- **8 seconds** total (default)
- **Extends with puzzles**: Time limit increases as puzzles are solved
- Automatic transition to Phase 1 (only if time limit reached)
- **Interactive**: Player can shoot the logo during this phase
- **Puzzle System**: Hidden sequences extend time and keep player on Phase 0

### Interactive Features

**Shooting the Logo**:
- Player can click to shoot bullets at the logo
- Logo reacts to hits with physics-based movement
- Logo moves away from impact point when hit
- Impact creates visual effects (particles, shockwaves, glow)

**Logo Physics**:
- Logo has position (`logoX`, `logoY`) and velocity (`logoVx`, `logoVy`)
- When hit, logo receives velocity push away from bullet impact
- Friction applied (0.98 multiplier per frame) for smooth deceleration
- Logo constrained within screen bounds (50px padding)
- Velocity stops when very small (< 1 pixel/second)

**Impact Effects**:
- **Shockwave Rings**: Multiple expanding rings from hit point (3 rings, 200px max radius)
- **Particle Burst**: 20 particles explode outward from impact
- **Impact Glow**: Radial gradient overlay intensifies on hit
- **Hit Tracking**: Stores last hit time and position for visual feedback
- **Particle Physics**: Particles have velocity, friction, and lifetime

**Visual Feedback**:
- Logo glow intensity increases when recently hit
- Impact glow fades over 0.5 seconds
- Multiple glow layers pulse and respond to hits
- Light sweep effect animates across text

### Animation Features

**Text Animation**:
- Fade in effect over 1 second
- Pulsing effect (sinusoidal, 0.9-1.1 scale)
- Multiple glow layers (3 outer layers + main text + highlight)
- Dynamic gradient intensity based on pulse and hit state
- Animated light sweep across text
- Subtitle: "Game Development Studio" with cyan glow

**Visual Effects**:
- **Studio/Development Theme Background**: Dark space with purple/blue/gold accents
- **Floating Stars**: 150 twinkling stars (purple, blue, gold)
- **Quantum Energy Particles**: Orbiting particles around 3 centers
- **Energy Connection Lines**: Flowing lines between particles
- **Pulsing Energy Rings**: Expanding rings around logo

**Background Theme** (Studio/Development):
- Dark radial gradient (deep purple-black to pure black)
- Subtle color accent overlay (purple/blue hints)
- 150 floating stars with twinkling animation
- 3 quantum energy particle systems (60 particles total)
- 12 energy connection lines
- Distinct from Phase 1's quantum theme

**Implementation**:
- Function: `drawWillsWayStudiosLogo(ctx, w, h, time)`
- Location: `game.js` lines 28650-28837
- Background: `drawWWSStudioBackground(ctx, w, h)` - lines 28127-28280
- Shooting: `shootInWWSLogoPhase(e)` - lines 29350-29446
- Hit Detection: `checkWWSLogoHit(bullet, data, w, h)` - lines 29448-29523
- Uses `cutsceneTime` for animation timing
- Uses `willsWayIntroData` for physics state

### Ship Cursor

- Ship appears at mouse position from the start
- Ship follows mouse smoothly (15% interpolation per frame)
- Ship rotates to face movement direction
- Default browser cursor is hidden
- Ship drawn using game's basic ship model
- Same ship behavior as Phase 1

### Shooting Mechanics (Phase 0)

**How to Shoot**:
1. Move mouse to position ship
2. Click to shoot bullet toward click position
3. Bullet travels from ship to target
4. Bullet hits logo → logo moves and creates effects
5. Continue shooting during 8-second phase

**Shooting Details**:
- **Cooldown**: 0.1 seconds between shots (100ms throttle)
- **Bullet Speed**: 800 pixels/second
- **Bullet Lifetime**: 2 seconds
- **Hit Detection**: Bounding box collision (400x100px logo area)
- **Force Applied**: Up to 800 pixels/second velocity push
- **Sound**: 'shoot' sound plays on fire, 'hit' sound on impact

**Implementation**:
- Function: `shootInWWSLogoPhase(e)`
- Location: `game.js` lines 29350-29446
- Event: `mousedown` on cutscene canvas (Phase 0)
- Coordinate conversion: Screen → Cutscene canvas coordinates

### Puzzle System

**Overview**:
The Phase 0 intro features a hidden puzzle system where players can discover sequences by shooting the logo in specific directional patterns. Solving puzzles extends the time limit and keeps the player on Phase 0 longer.

**How It Works**:
1. Each time the logo is hit, the system tracks the direction the logo moves (up, down, left, right)
2. The last 10 hit directions are stored in a sequence
3. When a sequence matches a puzzle pattern, the puzzle is solved
4. Solving puzzles extends the time limit and shows a success message
5. Player stays on Phase 0 until the extended time limit is reached

**Direction Detection**:
- **Up**: Logo moves up (bullet hit from below logo center)
- **Down**: Logo moves down (bullet hit from above logo center)
- **Left**: Logo moves left (bullet hit from right of logo center)
- **Right**: Logo moves right (bullet hit from left of logo center)
- **Lenient Diagonal Detection**: 
  - Diagonals are classified as vertical (up/down) if vertical component is ≥30% of horizontal component
  - This ensures diagonal shots count as up/down when they have any significant vertical component
  - Pure horizontal shots (no vertical component) count as left/right
  - Makes puzzle solving more forgiving and intuitive

**Puzzle Sequences** (All 32 Puzzles):

**Puzzle 1-2: Foundation Puzzles**
1. **Puzzle 1**: `['down', 'down', 'up']`
   - Shoot from above twice (logo moves down), then from below once (logo moves up)
   - Reward: Time extended to 20 seconds
   - Message: "Puzzle Solved!"
   - Requirements: None

2. **Puzzle 2**: `['down', 'up', 'left', 'right']`
   - Shoot from above, below, right, then left
   - Reward: Time extended to 30 seconds
   - Message: "2nd Puzzle Solved!"
   - Requirements: Puzzle 1

**Puzzle 3-32: Extended Sequences** (Each requires the previous puzzle)

3. `['up', 'up', 'down', 'down']` → 25s - "3rd Puzzle Solved!" (Requires Puzzle 2)
4. `['left', 'right', 'left', 'right']` → 28s - "4th Puzzle Solved!" (Requires Puzzle 3)
5. `['up', 'down', 'up', 'down', 'up']` → 32s - "5th Puzzle Solved!" (Requires Puzzle 4)
6. `['right', 'right', 'left', 'left']` → 30s - "6th Puzzle Solved!" (Requires Puzzle 5)
7. `['down', 'left', 'up', 'right']` → 35s - "7th Puzzle Solved!" (Requires Puzzle 6)
8. `['up', 'left', 'down', 'right']` → 35s - "8th Puzzle Solved!" (Requires Puzzle 7)
9. `['left', 'up', 'right', 'down']` → 35s - "9th Puzzle Solved!" (Requires Puzzle 8)
10. `['right', 'down', 'left', 'up']` → 35s - "10th Puzzle Solved!" (Requires Puzzle 9)
11. `['up', 'up', 'up', 'down']` → 30s - "11th Puzzle Solved!" (Requires Puzzle 10)
12. `['down', 'down', 'down', 'up']` → 30s - "12th Puzzle Solved!" (Requires Puzzle 11)
13. `['left', 'left', 'right', 'right']` → 30s - "13th Puzzle Solved!" (Requires Puzzle 12)
14. `['right', 'right', 'left', 'left']` → 30s - "14th Puzzle Solved!" (Requires Puzzle 13)
15. `['up', 'right', 'down', 'left', 'up']` → 38s - "15th Puzzle Solved!" (Requires Puzzle 14)
16. `['down', 'left', 'up', 'right', 'down']` → 38s - "16th Puzzle Solved!" (Requires Puzzle 15)
17. `['left', 'up', 'right', 'down', 'left']` → 38s - "17th Puzzle Solved!" (Requires Puzzle 16)
18. `['right', 'down', 'left', 'up', 'right']` → 38s - "18th Puzzle Solved!" (Requires Puzzle 17)
19. `['up', 'down', 'left', 'right', 'up']` → 40s - "19th Puzzle Solved!" (Requires Puzzle 18)
20. `['down', 'up', 'right', 'left', 'down']` → 40s - "20th Puzzle Solved!" (Requires Puzzle 19)
21. `['left', 'right', 'up', 'down', 'left']` → 40s - "21st Puzzle Solved!" (Requires Puzzle 20)
22. `['right', 'left', 'down', 'up', 'right']` → 40s - "22nd Puzzle Solved!" (Requires Puzzle 21)
23. `['up', 'up', 'left', 'left', 'down', 'down']` → 42s - "23rd Puzzle Solved!" (Requires Puzzle 22)
24. `['down', 'down', 'right', 'right', 'up', 'up']` → 42s - "24th Puzzle Solved!" (Requires Puzzle 23)
25. `['left', 'up', 'up', 'right', 'down', 'down']` → 42s - "25th Puzzle Solved!" (Requires Puzzle 24)
26. `['right', 'down', 'down', 'left', 'up', 'up']` → 42s - "26th Puzzle Solved!" (Requires Puzzle 25)
27. `['up', 'left', 'down', 'right', 'up', 'left']` → 45s - "27th Puzzle Solved!" (Requires Puzzle 26)
28. `['down', 'right', 'up', 'left', 'down', 'right']` → 45s - "28th Puzzle Solved!" (Requires Puzzle 27)
29. `['left', 'down', 'right', 'up', 'left', 'down']` → 45s - "29th Puzzle Solved!" (Requires Puzzle 28)
30. `['right', 'up', 'left', 'down', 'right', 'up']` → 45s - "30th Puzzle Solved!" (Requires Puzzle 29)
31. `['up', 'right', 'right', 'down', 'left', 'left']` → 45s - "31st Puzzle Solved!" (Requires Puzzle 30)
32. `['down', 'left', 'left', 'up', 'right', 'right']` → 45s - "32nd Puzzle Solved!" (Requires Puzzle 31)

**Puzzle Progression**:
- **Sequential Solving Required**: All puzzles must be solved in order (1, 2, 3, 4, ... 32)
- Each puzzle requires the previous puzzle to be solved first
- Puzzle 1: No requirements
- Puzzle 2: Requires Puzzle 1
- Puzzle 3: Requires Puzzle 2
- Puzzle 4: Requires Puzzle 3
- ... and so on through Puzzle 32
- Time limits stack (uses maximum time limit achieved)
- Timer resets to 0 when each puzzle is solved
- Each puzzle can only be solved once per session

**Technical Implementation**:
- Sequence tracking: `willsWayIntroData.hitSequence` (max 10 entries)
- Puzzle state: `puzzleSolved` (object tracking solved puzzle IDs)
- Total solved: `totalPuzzlesSolved` (counter)
- Time limit: `puzzleTimeLimit` (starts at 8, extends with puzzles, uses maximum)
- Message display: `puzzleMessage` and `puzzleMessageTime` for visual feedback
- Function: `checkPuzzleSequences(data)` - checks sequences against all puzzle patterns
- Function: `checkSequenceMatch(hitSequence, puzzleSequence)` - matches end of sequence
- Puzzle requirements: Each puzzle can specify required puzzles that must be solved first
- Time limit stacking: Uses maximum time limit from all solved puzzles

**Visual Feedback**:
- Puzzle solved messages appear at top of screen (30% from top)
- Cyan glow effect with fade in/out animation
- Messages display for 3 seconds
- Background gradient with shadow effects

**Code Locations**:
- Puzzle checking: `game.js` lines 29630-29670 (approximate)
- Direction detection: `game.js` lines 29579-29602
- Message display: `game.js` lines 28840-28880 (approximate)

---

## Phase 1: SpaceBell Interactive Logo

### Objective
Shoot all 9 letters of "SpaceBell" to light them up. Once all letters are lit, the intro automatically proceeds to the next phase.

### Letter Structure

**Display Letters**: `['S', 'p', 'a', 'c', 'e', 'B', 'e', 'l', 'l']`

**Unique IDs**: `['S', 'p', 'a', 'c', 'e1', 'B', 'e2', 'l1', 'l2']`

**Important: Letters Are Now Separated**
- **UPDATE**: The duplicate letters (e's and l's) were previously paired together but are now **SEPARATED**
- Each letter now has independent tracking, effects, and interaction state
- Letters are NO LONGER paired - they work completely independently

**Why Unique IDs?**
- "SpaceBell" contains duplicate letters (two 'e's and two 'l's)
- **Letters are SEPARATED**: Each letter is tracked independently with unique IDs
- Each letter must be shot individually - they are NO LONGER paired together
- Unique IDs (`e1`, `e2`, `l1`, `l2`) ensure complete separation
- Shooting one 'e' does NOT affect the other 'e' - they are independent
- Shooting one 'l' does NOT affect the other 'l' - they are independent
- This separation allows each letter to have its own effects and interaction state
- **Previous behavior**: Letters were paired (shooting one affected both)
- **Current behavior**: Letters are separated (each works independently)

### Shooting Mechanics

**How to Shoot**:
1. Move mouse to position ship
2. Click to shoot bullet
3. Bullet travels from ship toward click position
4. Bullet hits letter → letter lights up
5. Continue until all 9 letters are lit

**Shooting Details**:
- **Cooldown**: 0.1 seconds between shots (reduced from 0.5s for responsiveness)
- **Bullet Speed**: 800 pixels/second
- **Bullet Lifetime**: 2 seconds
- **Hit Detection**: Bounding box collision with letter positions

**Implementation**:
- Function: `shootInSpaceBellPhase(e)`
- Location: `game.js` lines 28437-28498
- Event: `mousedown` on cutscene canvas

### Ship Cursor

**Features**:
- Ship follows mouse position smoothly
- Ship rotates to face movement direction
- Uses game's actual "basic" ship model (not simple triangle)
- Default cursor hidden throughout intro
- Ship drawn at mouse position

**Ship Model**:
- Detailed fighter jet design
- Metallic cyan to deep blue gradient
- Wings, stabilizers, cockpit
- Glow effects
- Size: 25 pixels

**Implementation**:
- Function: `drawIntroShip(ctx, x, y, angle)`
- Location: `game.js` lines 28299-28435
- Uses same drawing logic as main game's `drawPlayer()` for 'basic' ship

### Letter Visual States

**Unlit Letters** (Default):
- Dim white fill: `rgba(255, 255, 255, 0.25)`
- Colored border stroke matching letter's theme
- Reduced brightness filter
- No glow effects

**Lit Letters** (After Being Shot):
- Bright gradient fill matching letter's color theme
- Pulsing glow effect with shadow
- Enhanced brightness and saturation
- Smooth transition animation

### Letter Color Themes

Each letter has a unique color scheme:

| Letter | Color | Theme |
|--------|-------|-------|
| **S** | `#9c27b0` | Purple (Bell Mode) |
| **p** | `#ff9800` | Orange (Ensemble Mode) |
| **a** | `#00bcd4` | Cyan (Individual Mode) |
| **c** | `#e91e63` | Pink (Bell Mode variant) |
| **e1** | `#ff6f00` | Deep Orange (Ensemble variant) |
| **B** | `#7b1fa2` | Deep Purple (Bell Mode variant) |
| **e2** | `#ff6f00` | Deep Orange (Ensemble variant) |
| **l1** | `#0097a7` | Teal (Individual Mode variant) |
| **l2** | `#0097a7` | Teal (Individual Mode variant) |

### Hit Effects

**Ring Animation**:
- Multiple concentric rings expand from letter center
- Color matches letter's theme
- Fades out over 1 second
- Includes glow and highlight layers

**Sound Effects**:
- 'hit' sound plays when letter is shot
- 'shoot' sound plays when bullet is fired

### Completion Detection

**All Letters Lit Check**:
```javascript
// Note: Letters are separated - e1/e2 and l1/l2 are independent
const letterIds = ['S', 'p', 'a', 'c', 'e1', 'B', 'e2', 'l1', 'l2'];
const allLit = letterIds.every(letterId => 
  willsWayIntroData.letterLights[letterId] === true
);
// Each letter must be lit individually - no pairing between duplicates
```

**Auto-Transition**:
- When all letters are lit, sets `allLettersLit = true`
- 1-second delay (`transitionTime`)
- Calls `endCutscene()`
- Checks if preshader/preload is complete:
  - If complete: Skips preshader screen, goes directly to `'intro'` cutscene
  - If not complete: Shows preshader screen, waits for completion, then goes to `'intro'` cutscene

### Preventing Scene Skipping

**Protection Mechanisms**:
- Clicks during SpaceBell phase don't skip the scene
- `e.preventDefault()` and `e.stopPropagation()` on mousedown
- Double-click skip only works on overlay (not during interactive phase)
- Keyboard shortcuts (Space/Enter) can skip, but only outside interactive phase

---

## Technical Implementation

### Cutscene Management

**Cutscene ID**: `'willsWayIntro'`

**Phase Tracking**:
- `cutscenePhase = 0`: Will's-Way-Studios logo
- `cutscenePhase = 1`: SpaceBell interactive logo

**Time Tracking**:
- `cutsceneTime`: Elapsed time in cutscene
- Used for animations and transitions

### Data Structure

**willsWayIntroData** (Shared between Phase 0 and Phase 1):
```javascript
{
  // Phase 0: Logo Physics
  logoX: w * 0.5,            // Logo X position (center)
  logoY: h * 0.5,            // Logo Y position (center)
  logoVx: 0,                  // Logo X velocity
  logoVy: 0,                  // Logo Y velocity
  lastHitTime: 0,             // Time of last logo hit (for glow effects)
  lastHitX: undefined,       // X position of last hit
  lastHitY: undefined,        // Y position of last hit
  hitParticles: [],           // Particle effects from logo hits
  
  // Phase 1: Letter Tracking
  letterLights: {},           // Track which letters are lit (by unique ID)
  letterHitEffects: {},       // Ring effect animations
  letterPositions: {},        // Cached letter bounding boxes
  allLettersLit: false,       // Completion flag
  transitionTime: 0,          // Time to transition after completion
  
  // Shared: Ship and Bullets
  shipX: w * 0.5,            // Ship X position
  shipY: h * 0.8,            // Ship Y position
  shipAngle: Math.PI / 2,     // Ship rotation angle
  bullets: [],                // Active bullets (used in both phases)
  lastShootTime: 0           // Throttle shooting (used in both phases)
}
```

### Key Functions

**updateCutscene(deltaTime)**:
- Updates cutscene time and phase
- Manages phase transitions
- Updates bullets and effects
- Checks for completion

**drawWillsWayIntroCutscene(ctx, w, h)**:
- Main drawing function for intro
- Calls phase-specific background functions
- Calls phase-specific drawing functions
- Handles cursor hiding
- Location: `game.js` lines 28080-28125

**drawWWSStudioBackground(ctx, w, h)**:
- Draws Phase 0 background (Studio/Development theme)
- Dark space gradient with purple/blue/gold accents
- Floating stars, quantum particles, energy lines
- Location: `game.js` lines 28127-28280

**drawSpaceBellQuantumBackground(ctx, w, h)**:
- Draws Phase 1 background (Deep Space/Quantum theme)
- Purple/blue quantum field gradient
- Entangled particle pairs, quantum waves, field particles
- Location: `game.js` lines 28420-28620

**drawWillsWayStudiosLogo(ctx, w, h, time)**:
- Renders Phase 0 logo with physics position
- Multiple glow layers, pulsing effects, impact feedback
- Draws bullets and ship cursor
- Location: `game.js` lines 28650-28837

**drawSpaceBellInteractive(ctx, w, h)**:
- Renders interactive SpaceBell logo (Phase 1)
- Updates ship position from mouse
- Draws letters with lighting states
- Draws bullets and effects
- Draws ship cursor
- Location: `game.js` lines 28840-29348

**shootInWWSLogoPhase(e)**:
- Creates bullet on click (Phase 0)
- Calculates bullet trajectory from ship to target
- Applies physics force to logo on hit
- Adds bullet to array
- Plays shoot sound
- Throttles rapid clicks (100ms cooldown)
- Location: `game.js` lines 29350-29446

**checkWWSLogoHit(bullet, data, w, h)**:
- Detects bullet collision with logo (Phase 0)
- Uses bounding box (400x100px centered on logo)
- Applies velocity push to logo (away from impact)
- Creates particle burst (20 particles)
- Stores hit time/position for visual effects
- Location: `game.js` lines 29448-29523

**checkLetterHit(bullet, data, w, h)**:
- Detects bullet collision with letters (Phase 1)
- Uses stored letter positions for accuracy
- Lights up letter on hit
- Triggers ring effect
- Removes bullet after hit
- Location: `game.js` lines 28548-28620 (approximate)

**shootInSpaceBellPhase(e)**:
- Creates bullet on click (Phase 1)
- Calculates bullet trajectory
- Adds bullet to array
- Plays shoot sound
- Throttles rapid clicks
- Location: `game.js` lines 29525-29600 (approximate)

### Coordinate Systems

**Mouse to Canvas Conversion**:
- Converts mouse coordinates to cutscene canvas coordinates
- Accounts for canvas position and scaling
- Clamps ship position to canvas bounds

**Letter Position Calculation**:
- Uses `ctx.measureText()` for accurate letter widths
- Calculates total text width
- Centers text on screen
- Stores bounding boxes for hit detection

### Cursor Management

**Hiding Default Cursor**:
- `cutsceneCanvas.style.cursor = 'none'`
- `cutsceneOverlay.style.cursor = 'none'`
- `document.body.style.cursor = 'none'`

**Restoring Cursor**:
- Restored in `endCutscene()`
- All cursor styles reset to default

---

## Code Locations

### Main Cutscene Logic

**Cutscene Update**: `game.js` lines 26526-26755
- Phase 0: Updates logo physics, ship position, bullets, particles
- Phase 0: Transitions to Phase 1 after 8 seconds
- Phase 1: Updates bullets, letter effects, checks completion
- Phase 1: Transitions to preshading when all letters lit

**Cutscene Drawing**: `game.js` lines 28080-28125
- `drawWillsWayIntroCutscene(ctx, w, h)`
- Calls phase-specific background and drawing functions

### Phase 0: Will's-Way-Studios Logo

**Update Logic**: `game.js` lines 26537-26691
- Initializes logo physics data
- Updates ship position (follows mouse)
- Updates logo position and velocity (physics)
- Updates bullets and checks for logo hits
- Updates hit particles
- Auto-transitions to Phase 1 after 8 seconds

**Background Drawing**: `game.js` lines 28127-28280
- `drawWWSStudioBackground(ctx, w, h)`
- Studio/Development theme with stars and particles

**Logo Drawing**: `game.js` lines 28650-28837
- `drawWillsWayStudiosLogo(ctx, w, h, time)`
- Handles animation, glow effects, impact feedback
- Draws bullets and ship cursor

**Shooting**: `game.js` lines 29350-29446
- `shootInWWSLogoPhase(e)`
- Bullet creation and firing toward click position

**Hit Detection**: `game.js` lines 29448-29523
- `checkWWSLogoHit(bullet, data, w, h)`
- Collision detection with logo
- Applies physics force and creates effects

### Phase 1: SpaceBell Interactive Logo

**Update Logic**: `game.js` lines 26692-26754
- Updates bullets and checks for letter hits
- Updates ring effects
- Checks if all letters are lit
- Transitions to preshading after completion

**Background Drawing**: `game.js` lines 28420-28620
- `drawSpaceBellQuantumBackground(ctx, w, h)`
- Deep Space/Quantum theme with entangled particles

**Logo Drawing**: `game.js` lines 28840-29348
- `drawSpaceBellInteractive(ctx, w, h)`
- Main interactive logo implementation
- Updates ship position, draws letters, bullets, effects

**Ship Drawing**: `game.js` lines 28299-28435
- `drawIntroShip(ctx, x, y, angle)`
- Detailed ship rendering (shared between phases)

**Shooting**: `game.js` lines 29525-29600 (approximate)
- `shootInSpaceBellPhase(e)`
- Bullet creation and firing

**Hit Detection**: `game.js` lines 28548-28620 (approximate)
- `checkLetterHit(bullet, data, w, h)`
- Collision detection and letter lighting

### Event Handlers

**Mouse Down**: `game.js` lines 1792-1816
- Handles shooting in both Phase 0 and Phase 1
- Phase 0: Calls `shootInWWSLogoPhase(e)`
- Phase 1: Calls `shootInSpaceBellPhase(e)`
- Prevents scene skipping during interactive phases

**Double Click Skip**: `game.js` lines 26330-26333
- Only applies to overlay (not during interactive phase)

---

## User Experience

### Interaction Flow

1. **Intro Starts (Phase 0)**
   - Will's-Way-Studios logo appears at center
   - Studio/Development theme background loads
   - Ship cursor visible at mouse position
   - Player can shoot the logo (optional interaction)
   - Logo moves and reacts when hit
   - 8-second animation plays (auto-transitions)

2. **SpaceBell Phase Begins (Phase 1)**
   - Background switches to Deep Space/Quantum theme
   - Logo appears with unlit letters
   - Ship follows mouse smoothly
   - Instructions: "Shoot the letters to light them up!"

3. **Player Shoots Letters (Phase 1)**
   - Click to shoot bullets toward click position
   - Bullets travel from ship to target
   - Bullets hit letters → letters light up
   - Ring effects play on hit
   - Sound effects provide feedback

4. **All Letters Lit (Phase 1)**
   - Message: "All letters lit! Proceeding..."
   - 1-second delay (`transitionTime`)
   - Automatic transition to preshading/preload phase

### Visual Feedback

**Phase 0**:
- **Logo Glow**: Intensifies when hit, fades over 0.5 seconds
- **Impact Effects**: Shockwave rings and particle bursts on hit
- **Logo Movement**: Physics-based movement away from impact
- **Ship Movement**: Smooth following provides responsive feel
- **Bullet Trails**: Visual indication of shooting direction

**Phase 1**:
- **Unlit Letters**: Dim appearance indicates not yet shot
- **Lit Letters**: Bright gradient indicates activated
- **Hit Effects**: Ring animation provides immediate feedback
- **Ship Movement**: Smooth following provides responsive feel
- **Bullet Trails**: Visual indication of shooting direction

---

## Troubleshooting

### Phase 0 Issues

**Issue: Logo Not Moving When Shot**

**Possible Causes**:
1. Bullets not hitting logo
2. Hit detection not working
3. Physics not initialized

**Solutions**:
- Verify `willsWayIntroData` is initialized
- Check logo position bounds (400x100px centered)
- Verify `checkWWSLogoHit` is being called
- Check that velocity is being applied

**Issue: Logo Moves Too Fast/Slow**

**Cause**: Force calculation or friction settings

**Solution**: Adjust force multiplier in `checkWWSLogoHit` (currently 0.8 * bulletSpeed, max 800)

**Issue: Particles Not Appearing**

**Cause**: Hit particles not being created or drawn

**Solution**: 
- Verify `hitParticles` array exists in data
- Check particle lifetime and filtering
- Ensure particles are drawn in logo function

### Phase 1 Issues

**Issue: Ship Not Shooting**

**Possible Causes**:
1. Mouse events not reaching cutscene canvas
2. Shooting function not being called
3. Cooldown preventing shots

**Solutions**:
- Check event listener is attached
- Verify `shootInSpaceBellPhase` is called on mousedown
- Check cooldown timing (should be 0.1s)

**Issue: Letters Not Lighting Up**

**Possible Causes**:
1. Bullets not hitting letters
2. Hit detection not working
3. Letter positions not calculated

**Solutions**:
- Verify letter positions are stored
- Check bullet collision detection
- Ensure unique IDs are used correctly

**Issue: Both 'e's or 'l's Toggle Together**

**Cause**: Not using unique IDs (letters were previously paired)

**Solution**: Letters are now SEPARATED - Use `e1`, `e2`, `l1`, `l2` instead of just `e` and `l`. Each letter is tracked independently and no longer paired together.

### General Issues

**Issue: Cursor Still Visible**

**Cause**: Cursor hiding not applied

**Solution**: Check that `cursor: 'none'` is set on canvas, overlay, and body

**Issue: Scene Skipping Prematurely**

**Cause**: Click handlers not preventing propagation

**Solution**: Ensure `e.preventDefault()` and `e.stopPropagation()` in mousedown handler

**Issue: Background Not Rendering**

**Cause**: Background function not called or phase mismatch

**Solution**: 
- Verify `drawWWSStudioBackground` called in Phase 0
- Verify `drawSpaceBellQuantumBackground` called in Phase 1
- Check phase value is correct (0 or 1)

---

## Design Philosophy

### Why Two Phases?

- **Branding**: Establishes Will's-Way-Studios identity first
- **Engagement**: Interactive logo creates memorable experience
- **Game Integration**: Connects intro to game mechanics
- **Progression**: Builds anticipation for game start

### Why Interactive Logo?

- **Player Agency**: Gives player control during intro
- **Skill Demonstration**: Shows game's shooting mechanics
- **Visual Interest**: More engaging than static logo
- **Completion Goal**: Provides clear objective

### Why Unique Letter IDs?

- **Accuracy**: Each letter must be shot individually
- **Clarity**: Prevents confusion about which letter was hit
- **Flexibility**: Allows different behaviors per letter if needed
- **Consistency**: Matches website implementation

---

## Related Documentation

- `INTERACTIVE_LOGO.md` - Website logo implementation (similar mechanics)
- `WEBSITE_DESIGN.md` - Website architecture
- `NETLIFY_DEPLOYMENT.md` - Deployment process

---

---

## Background Themes

### Phase 0: Studio/Development Theme

**Visual Style**: Dark, professional, development-focused

**Elements**:
- **Gradient**: Deep purple-black radial gradient (#0a0515 → #000000)
- **Color Accents**: Subtle purple/blue overlay hints
- **Stars**: 150 twinkling stars (purple, blue, gold)
- **Quantum Particles**: 3 orbiting particle systems (60 particles total)
- **Energy Lines**: 12 flowing connection lines
- **Atmosphere**: Studio/development workspace feel

**Implementation**: `drawWWSStudioBackground(ctx, w, h)`

### Phase 1: Deep Space/Quantum Theme

**Visual Style**: Quantum physics, entanglement, deep space

**Elements**:
- **Gradient**: Purple/blue quantum field (#1a0a2e → #0a0a1a)
- **Stars**: 200 entangled stars (cyan/blue with twinkling)
- **Entangled Pairs**: 25 particle pairs with connection lines
- **Quantum Waves**: 4 expanding correlation rings
- **Field Particles**: 60 orbiting particles with trails
- **Energy Connections**: 15 flowing energy lines
- **Quantum Core**: Pulsing central core with rings
- **Field Nodes**: 30 intersection points with glow

**Implementation**: `drawSpaceBellQuantumBackground(ctx, w, h)`

---

## Techniques and Implementation Details

### Physics System (Phase 0)

**Logo Physics**:
- Position-based movement with velocity
- Friction coefficient: 0.98 (smooth deceleration)
- Velocity threshold: < 1 pixel/second (stops small movements)
- Boundary constraints: 50px padding from screen edges
- Force calculation: Based on bullet speed and impact direction

**Particle System**:
- 20 particles per hit
- Random angle distribution (360°)
- Speed: 50-150 pixels/second
- Size: 3-7 pixels
- Lifetime: 0.5-0.8 seconds
- Friction: 0.95 multiplier per frame

### Coordinate Conversion

**Mouse to Canvas**:
- Converts screen coordinates (`clientX`, `clientY`) to canvas coordinates
- Accounts for canvas position and scaling
- Handles both event-based and mouse position-based targeting
- Clamps ship position to canvas bounds

**Canvas Coordinate Systems**:
- Main canvas: Game rendering
- Cutscene canvas: Intro rendering
- Conversion accounts for different bounding rectangles

### Rendering Techniques

**Multi-Layer Glow**:
- Outer glow layers (3-4 layers)
- Main text with gradient
- Inner highlight layer
- Impact glow overlay (Phase 0)
- Shadow blur effects for depth

**Particle Rendering**:
- Radial gradients for soft particles
- Shadow blur for glow effects
- Alpha-based fading
- Size-based intensity

**Background Rendering**:
- Radial gradients for depth
- Procedural star generation (seeded random)
- Animated particles with orbits
- Connection lines with energy flow
- Pulsing effects with sine waves

### Performance Optimizations

**Bullet Management**:
- Bullets removed when lifetime expires
- Bullets removed on hit
- Maximum lifetime: 2 seconds
- No maximum count (but throttled by cooldown)

**Particle Management**:
- Particles filtered by lifetime
- Automatic cleanup when expired
- Friction applied for smooth decay

**Animation Efficiency**:
- Time-based animations (not frame-based)
- Cached calculations where possible
- Efficient gradient creation
- Shadow effects used sparingly

---

## Tutorial Intro Cutscene ("Welcome, Pilot!")

### Overview

After the preshader rendering completes (or is skipped), the game displays an enhanced tutorial intro cutscene that welcomes the player with stunning visuals and introduces the game's story. This cutscene features high-fidelity character rendering, realistic space environments, and animated text boxes.

### Visual Features

**Background:**
- Realistic deep space gradient with rich blues and purples (no grey backdrop)
- 3 organic, colorful nebula clouds with movement (blue, purple, dark blue)
- Subtle quantum energy glow with pulsing effects
- Enhanced twinkling starfield (200 stars with dynamic alpha)
- Quantum particles orbiting around 4 centers
- Energy connection lines showing quantum entanglement
- Subtle vignette for focus

**Characters:**
- **Left Side**: High-fidelity Einstein character with natural floating and breathing animations
- **Right Side**: Enhanced Einstein ship with high-fidelity Einstein character visible in cockpit
- Both characters use the same high-fidelity rendering system with three-point lighting

**Text Boxes:**
- Stunning animated text boxes with:
  - Animated outer glow (pulsing effect)
  - Gradient backgrounds with depth
  - Animated borders (pulsing)
  - Inner highlights
  - Sparkle effects (8 animated sparkles around each box)
  - Scale and fade-in animations
  - Individual line animations
- Phase-based positioning:
  - Phase 0: Top-center (blue theme)
  - Phase 1: Top-right (green theme)
  - Phase 2: Bottom-left (purple/magenta theme)
  - Phase 3: Bottom-center (gold theme)
- Different text colors per phase:
  - Phase 0: Light blue (`#4fc3f7`)
  - Phase 1: Green (`#66ff99`)
  - Phase 2: Magenta (`#ff6bff`)
  - Phase 3: Gold (`#ffd700`)

### Animations

**Character Animations:**
- Natural breathing (0.75x speed, subtle scale changes)
- Smooth floating (vertical: 0.5x speed, 2.5px amplitude)
- Subtle side-to-side sway (0.3x speed, 1px amplitude)
- Phase-based fade-in (1.5 second duration)

**Ship Animations:**
- Realistic floating (0.6x speed, 1.8px amplitude, out of phase with Einstein)
- Gentle side movement (0.25x speed, 0.8px amplitude)
- Very subtle rotation (0.2x speed, 0.03 radians max)
- Scale pulsing (0.3x speed, 2% variation)

**Text Box Animations:**
- Fade-in with scale animation
- Pulsing outer glow (sine wave based)
- Animated sparkles (8 per box, rotating and pulsing)
- Individual line animations (staggered appearance)

### Phase System

The cutscene uses a phase-based system for text display:

- **Phase 0**: "Welcome, Pilot!" (top-center, blue)
- **Phase 1**: Additional welcome text (top-right, green)
- **Phase 2**: Game introduction (bottom-left, magenta)
- **Phase 3**: Final message (bottom-center, gold)

Each phase has a fade-in duration and displays for a set time before transitioning to the next phase.

### Technical Implementation

**Function**: `drawIntroCutscene(ctx, w, h)`
**Location**: `game.js` lines 33161-33510 (approximate)

**Key Components:**
- Background rendering with multiple layers (gradient, nebula, stars, particles)
- Character rendering using `drawEinsteinCharacter()` (high-fidelity system)
- Ship rendering using `drawEinsteinShip()` (enhanced with cockpit character)
- Text box rendering using `drawStunningTextBox()` (animated design)

**Character Rendering:**
- Uses high-fidelity character system with:
  - Three-point lighting (key, fill, rim)
  - Realistic proportions (head radius 26, hair radius 34)
  - 35 individual hair strands with physics-based movement
  - 7 top hair spikes (animated)
  - 30 individual mustache hairs
  - 4 fingers per hand
  - Professional sweater with knit texture
  - Realistic skin tones and features

**Performance:**
- Characters rendered in real-time (not preshaded)
- Optimized animations using sine waves
- Efficient gradient creation and reuse
- Shadow effects used sparingly

### User Experience

**Flow:**
1. Cutscene begins with fade-in of background
2. Characters fade in with natural animations
3. Text boxes appear in sequence with phase-based positioning
4. Each phase displays for a set duration
5. Cutscene continues until menu phase is triggered

**Visual Quality:**
- High-fidelity character rendering creates immersive experience
- Realistic space environment enhances atmosphere
- Animated text boxes provide clear, engaging communication
- Smooth animations maintain visual interest

**Accessibility:**
- Text is clearly readable with high contrast
- Animations are smooth and not jarring
- Phase-based system allows for clear message progression

---

*Last Updated: December 29, 2025*
*Locations: 
  - C:\Full Backup Bell\bell-game\game.js (Primary development version)
  - C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\game.js (Ensemble model version)*

## Preshader Rendering Timing

**Important**: The preshader rendering does NOT happen after Phase 1 completes. Instead:

1. **Preshader starts immediately** when the game initializes (before any cutscenes)
2. **Runs in background** during Phase 0 and Phase 1 of the new intro
3. **Completion check** happens when Phase 1 completes:
   - If already complete: Preshader screen is skipped, goes directly to `'intro'` cutscene
   - If still running: Preshader screen appears briefly until completion, then goes to `'intro'` cutscene

**Why this matters**:
- On fast systems, preload often finishes during Phase 0 or early Phase 1, so the preshader screen never appears
- On slower systems or if player completes Phase 1 quickly, the preshader screen may appear briefly
- The preshader rendering is NOT blocking - it happens asynchronously while the intro plays

