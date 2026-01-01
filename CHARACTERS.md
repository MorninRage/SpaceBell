# Character Rendering Documentation

This document describes the high-fidelity character rendering system used for Einstein and Bell characters in cutscenes.

## Overview

The game features a professional character rendering system that creates realistic, detailed characters with advanced lighting, animations, and textures. This system is used for:
- **Einstein Character**: Appears in tutorial intro cutscene ("Welcome, Pilot!") and opening cutscene (time machine)
- **Bell Character**: Appears in opening cutscene (time machine creation)

## High-Fidelity Rendering System

### Three-Point Lighting

All characters use professional three-point lighting for realistic depth and dimension:

1. **Key Light (Primary)**
   - Position: Top-left
   - Color: Warm white (`rgba(255, 250, 245, 0.8)`)
   - Creates main highlights and defines shape

2. **Fill Light (Secondary)**
   - Position: Right side
   - Color: Soft warm (`rgba(255, 240, 220, 0.4)`)
   - Softens shadows and adds depth

3. **Rim Light (Back Light)**
   - Position: Back edge
   - Color: Cool blue-white (`rgba(200, 200, 220, 0.2)`)
   - Creates edge separation and depth

### Character Features

#### Einstein Character

**Proportions:**
- Head radius: 26 pixels
- Hair radius: 34 pixels
- Body height: 38 pixels
- Realistic anatomical structure

**Hair:**
- 35 individual hair strands with physics-based movement
- 7 top hair spikes (signature Einstein look)
- Realistic white hair gradients
- Wave and sway animations based on time

**Facial Features:**
- 7 forehead wrinkles with curved patterns
- 5 crow's feet on each side
- Realistic brown eyes with blinking animation
- Eye bags for age detail
- Nose with realistic shadows and nostrils
- 30 individual mustache hairs with movement

**Body:**
- Professional sweater with knit texture (7 horizontal lines, 9 vertical lines)
- Realistic fabric gradients
- Detailed arms with shadows
- Hands with 4 fingers each (realistic positioning)

**Skin Tones:**
- Warm skin gradients: `#faf0e6` → `#c8b090`
- Realistic lighting on face
- Age-appropriate shading

**Animations:**
- Natural breathing (0.75x speed, 1.2px vertical offset, 0.6% scale variation)
- Physics-based hair movement (0.5x speed for strands, 0.4x for spikes)
- Realistic blinking (0.15x speed, triggered when `sin(t * 0.15) < -0.92`)
- Mustache movement (0.25x speed, 2px vertical offset)

**Function**: `drawEinsteinCharacter(ctx, x, y, scale = 1, alpha = 1, time = 0)`
**Location**: `game.js` lines 30372-30782 (approximate)

#### Bell Character

**Proportions:**
- Head radius: 24 pixels
- Hair radius: 30 pixels
- Realistic proportions matching Irish physicist appearance

**Hair:**
- 30 individual dark hair strands with physics-based movement
- Realistic dark hair gradients
- Wave and sway animations

**Facial Features:**
- Glasses with thick frames and animated reflections
- Blue-gray irises with realistic depth
- Realistic blinking animation
- Age-appropriate features

**Body:**
- Professional lab coat with fabric texture
- Buttons and collar details
- Realistic fabric gradients

**Skin Tones (Irish Complexion):**
- Fair, pale skin with pink/rosy undertones
- Colors: `#fff8f5` → `#d8c8c0`
- Realistic lighting for fair complexion

**Animations:**
- Natural breathing
- Hair movement
- Blinking
- Glasses reflections

**Function**: `drawBellCharacter(ctx, x, y, scale = 1, alpha = 1, time = 0)`
**Location**: `game.js` lines 29980-30368 (approximate)

## Rendering Techniques

### Gradient Creation

**Head Gradients:**
- Radial gradients for realistic skin tones
- Multiple color stops for smooth transitions
- Lighting gradients for three-point lighting system

**Hair Gradients:**
- Radial gradients for individual strands
- Linear gradients for hair spikes
- White to light grey color stops

**Clothing Gradients:**
- Linear gradients for fabric depth
- Multiple color stops for realistic shading
- Texture lines for knit patterns

### Shadow System

**Character Shadow:**
- Soft shadow with falloff
- Color: `rgba(0, 0, 0, 0.4)`
- Blur: 50 pixels
- Offset: (12, 12) pixels

**Hair Shadow:**
- Individual strand shadows
- Color: `rgba(255, 255, 255, 0.5)`
- Blur: 8 pixels
- Creates depth and separation

### Animation System

**Time-Based Animations:**
- All animations use `time` parameter (typically `cutsceneTime` or `animTime`)
- Sine and cosine waves for smooth motion
- Different speeds for different features (breathing, hair, blinking)

**Physics-Based Movement:**
- Hair strands use wave functions: `Math.sin(t * 0.5 + strand * 0.15) * 5`
- Individual strand sizes vary: `4.5 + Math.sin(t * 0.9 + strand) * 1.8`
- Mustache hairs move independently: `Math.sin(t * 0.25 + i * 0.12) * 2`

## Usage in Cutscenes

### Tutorial Intro Cutscene ("Welcome, Pilot!")

**Left Character:**
- Position: `w * 0.28, h * 0.6`
- Scale: `1.05` with breathing variation
- Alpha: `0.88` with breathing variation
- Floating: `Math.sin(animTime * 0.5) * 2.5`
- Sway: `Math.sin(animTime * 0.3) * 1`

**Ship Cockpit Character:**
- Position: Inside `drawEinsteinShip` function
- Scale: `0.4` (scaled down for cockpit)
- Alpha: `0.85`
- Floating: `Math.sin(t * 0.6) * 1.5`
- Sway: `Math.sin(t * 0.3) * 0.5`

### Opening Cutscene (Time Machine)

**Einstein Character:**
- Used during shrinking animation
- Scale varies from 1.2 to 0.1 (shrinking effect)
- Position animates during shrinking
- Warning glow appears when scale < 0.5

**Bell Character:**
- Positioned on left side
- Interacts with time machine
- Full scale and animations

## Performance Considerations

### Real-Time Rendering

Characters are rendered in real-time (not preshaded) because:
- Animations require dynamic updates
- Multiple instances may have different states
- Cutscenes have varying timing

### Optimization Techniques

1. **Efficient Gradient Creation**
   - Gradients created once per frame
   - Reused where possible
   - Cached for static elements

2. **Selective Shadow Rendering**
   - Shadows only applied where needed
   - Shadow blur reset after use
   - Shadow offset reset after use

3. **Animation Efficiency**
   - Time-based calculations (not frame-based)
   - Sine/cosine waves for smooth motion
   - Cached calculations where possible

4. **Layer Management**
   - Drawing order optimized (background → character → effects)
   - Alpha blending used efficiently
   - Transform stack managed carefully

## Code Structure

### Function Signature

```javascript
drawEinsteinCharacter(ctx, x, y, scale = 1, alpha = 1, time = 0)
drawBellCharacter(ctx, x, y, scale = 1, alpha = 1, time = 0)
```

**Parameters:**
- `ctx`: Canvas 2D rendering context
- `x, y`: Character position (center point)
- `scale`: Overall scale multiplier (default: 1.0)
- `alpha`: Opacity (0.0 to 1.0, default: 1.0)
- `time`: Animation time in seconds (default: 0)

### Drawing Order

1. Save context state
2. Apply global alpha and transform
3. Apply breathing animation (translate and scale)
4. Apply shadow
5. Draw head (base, lighting layers)
6. Draw hair (base, strands, spikes)
7. Draw facial features (wrinkles, eyes, nose, mustache, mouth)
8. Draw body (sweater/lab coat, arms, hands)
9. Reset shadow
10. Restore context state

### Coordinate System

- Origin (0, 0) is at character center
- Y-axis: Negative is up, positive is down (standard canvas)
- Head center: `y = -14` (Einstein), `y = -12` (Bell)
- Body starts: `y = 8` (Einstein), `y = 6` (Bell)

## Future Enhancements

Potential improvements to the character rendering system:

1. **Preshading for Static Elements**
   - Preshade hair base and clothing textures
   - Cache static gradients
   - Reduce real-time gradient creation

2. **Level of Detail (LOD)**
   - Simplified versions for distant characters
   - Reduced strand counts for performance
   - Simplified lighting for small scales

3. **Animation Blending**
   - Smooth transitions between animation states
   - Blended breathing and movement
   - Dynamic animation speed adjustment

4. **Additional Characters**
   - Extend system to other characters
   - Character-specific features and animations
   - Consistent rendering quality

---

*Last Updated: December 29, 2025*
*Locations: 
  - C:\Full Backup Bell\bell-game\game.js (Primary development version)
  - C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\game.js (Ensemble model version)*
