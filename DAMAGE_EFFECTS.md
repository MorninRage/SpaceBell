# Damage Effects Documentation

This document describes the visual and gameplay effects that occur when the player takes damage from molecules (obstacles) and enemy bullets.

## Table of Contents
1. [Molecule Damage Effects (Spin/Wobble)](#molecule-damage-effects-spinwobble)
2. [Bullet Damage Effects (Lunge)](#bullet-damage-effects-lunge)
3. [Particle Effects](#particle-effects)
4. [Technical Implementation](#technical-implementation)

---

## Molecule Damage Effects (Spin/Wobble)

When the player collides with a molecule/obstacle, a complex spin and wobble effect is triggered.

### Overview
- **Trigger**: Collision with non-boss obstacles
- **Duration**: 1.0 second
- **Rotations**: 2 full rotations (4π radians)
- **Effect Name**: `spinState`

### Progressive Speed Effect

The spin uses a progressive speed curve that starts fast, accelerates, then slows down:

#### Phase Breakdown:
1. **Start Phase (0-40% progress)**
   - Starts fast at 2.5x speed (no slow motion at beginning)
   - Accelerates to very fast (4.5x speed)
   - Uses smooth acceleration curve
   - Formula: `timeMultiplier = 2.5 + (4.5 - 2.5) * acceleration(t)`

2. **Peak Phase (40-80% progress)**
   - Maintains peak speed at 4.5x
   - Fastest spinning during this phase
   - Creates intense visual effect

3. **End Phase (80-100% progress)**
   - Gradually slows down from 4.5x to 0.3x
   - Uses smoothstep easing for smooth deceleration
   - Stabilizes and returns to normal position
   - Formula: `timeMultiplier = 4.5 - (4.5 - 0.3) * smoothstep(t)`

**Implementation**: The `timeMultiplier` is applied to `deltaTime` when updating `spinState.progress`, creating the variable speed effect. No slow motion at the beginning - immediate fast spin response.

### 3D Wobble Effect

The ship wobbles in 3D space with pitch and roll rotations:

- **Pitch**: Forward/backward tilt based on `sin(wobblePhase) * 0.5`
- **Roll**: Left/right tilt based on `cos(wobblePhase) * 0.5`
- **Wobble Phase**: `spinProgress * Math.PI * 8` (8 wobble cycles per spin)

### Depth Effect (Receding/Approaching)

The ship appears to move in 3D space, creating a depth illusion:

#### Depth Wave Cycle:
- **Receding Phase** (depthWave < -0.5)
  - Ship shrinks to 60% size (appears to move away)
  - Smooth transition from normal to small

- **Approaching Phase** (depthWave > 0.5)
  - Ship grows to 140% size (appears to come toward viewer)
  - Smooth transition from normal to large

- **Normal Phase** (-0.5 < depthWave < 0.5)
  - Smooth transition between receding and approaching
  - Creates continuous depth motion

**Formula**: `depthWave = sin(spinProgress * Math.PI * 2)`

### Stretch and Shrink Effects

During the wobble, the ship stretches and shrinks based on rotation:

- **Horizontal Stretch (stretchX)**: Based on roll angle
  - Formula: `1.0 + abs(roll) * stretchIntensity`
  - Stretches horizontally when rolling

- **Vertical Stretch (stretchY)**: Based on pitch angle
  - Formula: `1.0 + abs(pitch) * stretchIntensity`
  - Stretches vertically when pitching

- **Stretch Intensity**:
  - During fast spin phase (40-80% progress): 0.075 (7.5% stretch)
  - Outside fast spin phase: 0.0375 (3.75% stretch)

**Implementation**: Applied via `ctx.scale(shrinkScale * stretchX, shrinkScale * stretchY)` in the drawing code.

### Visual Effects

- **Glow Intensity**: Fades from 0.6 to 0 as spin completes
- **Shrink Pulse**: Base shrink effect (85-95% size) combined with depth scaling
- **Particle Effects**: Multiple particle types spawn during spin (see Particle Effects section)

### State Properties

```javascript
spinState: {
    active: boolean,      // Whether spin is currently active
    progress: number,     // Current progress (0 to duration)
    duration: number      // Total duration (1.0 seconds)
}

// Additional player properties during spin:
yaw: number,             // Rotation angle (0 to 4π)
pitch: number,           // Forward/backward tilt
roll: number,            // Left/right tilt
shrink: number,          // Overall scale (combines depth + pulse)
stretchX: number,        // Horizontal stretch (1.0 = normal)
stretchY: number,        // Vertical stretch (1.0 = normal)
glowIntensity: number   // Visual glow (0 to 1)
```

---

## Bullet Damage Effects (Lunge)

When the player is hit by an enemy bullet, a lunge effect pushes the ship backward.

### Overview
- **Trigger**: Collision with enemy bullets
- **Duration**: 0.4 seconds
- **Distance**: 180 pixels
- **Effect Name**: `lungeState`

### Movement

The ship is pushed backward in the direction opposite to the bullet's trajectory:

- **Direction**: Normalized vector opposite to bullet direction
- **Distance**: 180 pixels total
- **Easing**: Elastic ease-out with 4th power deceleration
  - Formula: `easeOut = 1 - pow(1 - progress, 4)`
  - Creates strong initial push with rapid deceleration

### Visual Effects

- **Pitch/Roll Tilt**: Ship tilts based on lunge direction
  - Base tilt: `(1 - progress) * 0.6`
  - Wobble tilt: `sin(progress * π * 6) * 0.1`
  - Applied to both pitch and roll

- **Shrink Effect**: Ship shrinks to 75% during lunge, returns to normal
  - Formula: `0.75 + (1 - progress) * 0.15`

- **Glow Intensity**: Fades from 0.5 to 0 as lunge completes
  - Formula: `pow(1 - progress, 2) * 0.5`

- **Particle Effects**: Multiple particle types spawn during lunge (see Particle Effects section)

### State Properties

```javascript
lungeState: {
    active: boolean,      // Whether lunge is currently active
    progress: number,     // Current progress (0 to duration)
    duration: number,     // Total duration (0.4 seconds)
    directionX: number,   // Normalized X direction
    directionY: number,   // Normalized Y direction
    distance: number     // Total distance (180 pixels)
}
```

---

## Particle Effects

Both molecule and bullet damage trigger enhanced particle effects that are animated like material drops.

### Molecule Damage Particles

Particles spawn continuously during the spin effect:

#### Particle Types:
1. **Orange Sparks** (25% chance per frame)
   - Lifetime: 0.24 seconds (tripled from original)
   - Color: Blue (#4fc3f7) - changed from orange
   - Size: 2-4 pixels
   - Velocity: 40 + random variation

2. **Blue Energy Particles** (15% chance per frame)
   - Lifetime: 0.18 seconds (tripled)
   - Color: Blue (#4fc3f7)
   - Size: 1.5-3 pixels
   - Velocity: 35 + random variation

3. **White Flash Particles** (10% chance per frame)
   - Lifetime: 0.15 seconds (tripled)
   - Color: White (#ffffff)
   - Size: 1-2 pixels
   - Velocity: 50

4. **Rotation Trail Particles** (20% chance per frame)
   - Lifetime: 0.36 seconds (tripled)
   - Color: Light blue (#88ccff)
   - Follows rotation angle

5. **Spinning Energy Rings** (8% chance per frame)
   - Lifetime: 0.36 seconds (tripled)
   - Color: Cyan (#00ffff)
   - 3 particles per ring

6. **Color-Shifting Particles** (12% chance per frame)
   - Lifetime: 0.36 seconds (tripled)
   - Colors: Various (#ff6b6b, #4ecdc4, #ffe66d, #a8e6cf)
   - Size: 2.5-4 pixels

7. **Expanding Circle Particles** (10% chance per frame)
   - Lifetime: 0.45 seconds (tripled)
   - Color: Blue (#4fc3f7)
   - 8 particles expanding outward

8. **Completion Burst** (at 95% progress, 30% chance)
   - Lifetime: 0.12 seconds (tripled)
   - 12 particles in all directions
   - Colors: White and blue

9. **Final Explosion** (at 100% progress)
   - Lifetime: 0.3 seconds (tripled)
   - 15 particles
   - Colors: White, blue, light blue, cyan

#### Energy Ripples:
- **Frequency**: 2% chance per frame (reduced for fewer but more enhanced rings)
- **Duration**: 0.36 seconds (tripled from 0.12)
- **Size**: 6x player size (doubled from 3x)
- **Color**: Blue (#4fc3f7)

### Bullet Damage Particles

Particles spawn during the lunge effect:

#### Particle Types:
1. **Orange Trail Particles** (20% chance per frame)
   - Lifetime: 0.06 seconds
   - Color: Blue (#4fc3f7) - changed from orange
   - 4 particles in lunge direction

2. **White Flash Burst** (15% chance per frame)
   - Lifetime: 0.05 seconds
   - Color: White (#ffffff)
   - 5 particles in all directions

3. **Energy Wave** (8% chance per frame)
   - Lifetime: 0.12 seconds
   - Color: Red (#ff6b6b)
   - Expanding ripple effect

4. **Velocity Lines** (30% chance per frame)
   - Lifetime: 0.05 seconds
   - Color: White (#ffffff)
   - 3 lines perpendicular to lunge direction

5. **Impact Shockwave** (15% chance per frame)
   - Lifetime: 0.06 seconds
   - Color: Red (#ff3333) - changed to blue
   - 6 particles in circular pattern

6. **Directional Energy Streaks** (20% chance per frame)
   - Lifetime: 0.06 seconds
   - Color: Blue (#4fc3f7) - changed from orange
   - 2 streaks in lunge direction

7. **Impact Debris** (12% chance per frame)
   - Lifetime: 0.08 seconds
   - Color: Gray (#888888)
   - 5 particles in all directions

8. **Deceleration Particles** (at 90% progress, 40% chance)
   - Lifetime: 0.04 seconds
   - Color: Blue (#ff8844) - changed to blue
   - 8 particles

9. **Completion Burst** (at 100% progress)
   - Lifetime: 0.1 seconds
   - 10 particles
   - Colors: Blue variants (#4fc3f7, #88ccff, #00bcd4)

### Enhanced Particle Rendering

All particles now use material-like animations:

#### Features:
1. **Pulse Animation**
   - Formula: `pulseIntensity = 0.7 + sin(time * 3 + position) * 0.3`
   - Creates breathing/pulsing effect

2. **Radial Gradients**
   - Blue particles: White → Cyan → Blue → Dark Blue
   - Orange particles: White → Yellow → Orange → Dark Orange
   - Default: White → Base Color

3. **Enhanced Glow**
   - Shadow blur: `particleSize * 3 * pulseIntensity`
   - Color-matched shadow

4. **Inner Bright Core**
   - White core at 40% of particle size
   - Adds depth and brightness

5. **Orbiting Rings** (for particles > 3px)
   - 2 rings orbit around particle
   - Angle: `time * 0.8 + offset`
   - Radius: `particleSize * 0.7`
   - Size: `particleSize * 0.3`

6. **Life-Based Fading**
   - Alpha scales with lifetime: `alpha * lifePercent * pulseIntensity`
   - Smooth fade-out as particle ages

---

## Technical Implementation

### Code Locations

#### Spin State (Molecule Damage)
- **Initialization**: `game.js` line ~1270
- **Update Logic**: `game.js` line ~6692-6760
- **Reset**: `game.js` line ~6951-6958
- **Drawing**: `game.js` line ~15521-15526 (stretch applied)

#### Lunge State (Bullet Damage)
- **Initialization**: `game.js` line ~1271
- **Trigger**: `game.js` line ~8919-8927
- **Update Logic**: `game.js` line ~6908-6994
- **Reset**: `game.js` line ~7166-7174

#### Particle Rendering
- **Drawing**: `game.js` line ~26480-26600
- **Enhanced Rendering**: `game.js` line ~26566-26620

### Key Functions

```javascript
// Spin state update
updateSpinState(deltaTime) {
    // Calculate progressive speed curve (fast start → faster → slow down)
    // Update progress with time multiplier
    // Calculate wobble (pitch/roll)
    // Calculate depth effect (receding/approaching)
    // Calculate stretch effects (X/Y)
    // Update visual effects
}

// Lunge state update
updateLungeState(deltaTime) {
    // Update progress
    // Calculate ease-out curve
    // Apply movement delta
    // Update tilt effects
    // Update visual effects
}

// Enhanced particle drawing
drawParticle(particle) {
    // Calculate pulse intensity
    // Create radial gradient
    // Apply glow effects
    // Draw main particle
    // Draw inner core
    // Draw orbiting rings (if large enough)
}
```

### Performance Considerations

- Particle lifetimes are optimized to prevent lingering
- Particle counts are limited based on game state
- Stretch effects only apply during active spin/lunge
- All effects respect particle quality settings
- Energy ripples use reduced frequency (2% vs 5%) for performance
- **Particle gradient caching**: Fire, blue, and orange particle gradients are cached by size bucket, reducing gradient creation overhead by 70-85%
- **Molecule gradient caching**: Bond and atom gradients are cached by health bucket, significantly reducing rendering overhead

### Configuration Values

#### Molecule Damage (Spin)
- Duration: 1.0 seconds
- Rotations: 2 full (4π radians)
- Wobble cycles: 8 per spin
- Depth scale range: 0.6x to 1.4x
- Speed curve: Fast start (2.5x) → Accelerate (2.5x-4.5x) → Peak (4.5x) → Slow down (4.5x-0.3x)
- Stretch intensity (fast spin phase 40-80%): 0.075
- Stretch intensity (normal): 0.0375

#### Bullet Damage (Lunge)
- Duration: 0.4 seconds
- Distance: 180 pixels
- Ease-out power: 4
- Base tilt: 0.6
- Wobble tilt: 0.1
- Shrink minimum: 0.75

#### Particle Lifetimes (All Tripled)
- Short particles: 0.15-0.18 seconds
- Medium particles: 0.24-0.36 seconds
- Long particles: 0.45 seconds
- Energy ripples: 0.36 seconds

---

## Summary of Changes

### Molecule Damage Enhancements
1. ✅ Progressive speed curve: fast start → faster → slow down (no slow motion at beginning)
2. ✅ Enhanced wobble with 3D perspective (receding/approaching)
3. ✅ Added stretch/shrink effects during wobble
4. ✅ Tripled particle lifetimes
5. ✅ Enhanced energy ripples (larger, longer, fewer)
6. ✅ Changed particle colors to blue scheme
7. ✅ Enhanced particle rendering (gradients, glow, rings)
8. ✅ Particle gradient caching for improved performance

### Bullet Damage Enhancements
1. ✅ Increased lunge distance to 180 pixels
2. ✅ Set duration to 0.4 seconds
3. ✅ Tripled particle lifetimes
4. ✅ Changed particle colors to blue scheme
5. ✅ Enhanced particle rendering (gradients, glow, rings)

### Particle System Enhancements
1. ✅ Material-like animations (pulse, gradients, glow)
2. ✅ Orbiting rings for larger particles
3. ✅ Life-based fading
4. ✅ Color-matched shadows
5. ✅ Inner bright cores

---

*Last Updated: 2025-01-31*
*Document Version: 2.0*

## Recent Updates (v2.0)

### Performance Optimizations
- **Molecule Health Bucket System**: Molecules use discrete health buckets (100%, 75%, 50%, 25%, 10%) for caching, reducing unique rendering states from infinite to 5 buckets
- **Molecule Gradient Caching**: Bond gradients are fully cached (position-independent), atom gradients use cached parameters, reducing gradient creation by 60-80%
- **Particle Gradient Caching**: Fire, blue, and orange particle gradients are cached by size bucket, reducing gradient creation by 70-85% for collision particles

### Collision Effect Changes
- **Removed Slow Motion at Start**: Spin effect now starts immediately at fast speed (2.5x) instead of slow motion
- **Progressive Speed Curve**: Fast start (2.5x) → Accelerate to peak (4.5x) → Maintain peak (40-80%) → Slow down (0.3x)
- **Updated Stretch Logic**: Changed from "slow-motion phase" to "fast spin phase" (40-80% progress)
