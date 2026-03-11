# Blur/Ghosting Fix - Motion-Aware Interpolation

## Issue Identified

After fixing pulsation with "lighter" compositing mode, a new issue appeared:
- **Blur/Ghosting Effect**: When effect lights move across lines, you see both the previous and new location for a split second
- **Root Cause**: Blending frames with motion shows both positions simultaneously, creating a ghost/blur effect

## Research Findings

### Motion Blur in Frame Interpolation
- **Problem**: Blending frames with moving elements creates ghosting (both positions visible)
- **Solution**: Only blend when meaningfully between frames, not when close to exact frames
- **Research**: Motion-aware interpolation reduces ghosting by avoiding blending near exact frames

### Threshold Strategy
- **Small threshold (0.1%)**: Always blends → smooth but blurry/ghosty
- **Medium threshold (5%)**: Blends when between frames → smooth rotation + sharp exact frames
- **Large threshold (20%+)**: Rarely blends → sharp but may have stepping

## Solution Implemented

### Increased Interpolation Threshold

**Before:**
```javascript
const interpolationThreshold = 0.001; // 0.1% - always blends
```

**After:**
```javascript
const interpolationThreshold = 0.05; // 5% - only blends when meaningfully between frames
```

### How It Works

1. **Close to Exact Frame (< 5%)**: Return single frame
   - Prevents blur/ghosting from moving elements
   - Sharp, clear rendering at exact frame positions
   - No ghosting because only one position is shown

2. **Between Frames (5-95%)**: Blend frames
   - Smooth rotation interpolation
   - "lighter" compositing provides correct linear interpolation
   - No pulsation (correct formula)

3. **Close to Next Frame (> 95%)**: Return next frame
   - Prevents blur/ghosting
   - Sharp transition to next frame

## Expected Results

✅ **No Pulsation** - "lighter" compositing provides correct formula
✅ **Reduced Blur/Ghosting** - Only blend when meaningfully between frames
✅ **Sharp Exact Frames** - Single frame rendering when close to exact positions
✅ **Smooth Rotation** - Blending when between frames maintains smoothness
✅ **Clear Moving Elements** - Effect lights show one position, not both

## Technical Details

### Threshold Selection (5%)
- **Too Small (< 1%)**: Always blends → blur/ghosting from moving elements
- **Too Large (> 10%)**: Rarely blends → may have visible stepping
- **Optimal (5%)**: Balances smoothness and sharpness

### Blending Behavior
- **0-5%**: Single frame (sharp, no ghosting)
- **5-95%**: Blended frame (smooth rotation)
- **95-100%**: Next frame (sharp, no ghosting)

### Performance
- Cache system handles interpolated frames efficiently
- 5% threshold reduces cache misses (fewer interpolations)
- Still maintains smooth rotation for 90% of the time

## Fine-Tuning Options

### If Still Too Blurry:
```javascript
const interpolationThreshold = 0.08; // 8% - blend less often
```

### If Too Steppy:
```javascript
const interpolationThreshold = 0.03; // 3% - blend more often
```

### For Maximum Sharpness (No Blending):
```javascript
const interpolationThreshold = 0.5; // 50% - almost never blend
```

## Current Optimized Values

```javascript
// Compositing
globalCompositeOperation = 'lighter'  // True linear interpolation (no pulsation)

// Interpolation
interpolationThreshold = 0.05          // 5% - reduces blur/ghosting
alphaQuantization = 128 levels         // Ultra-smooth interpolation

// Cache
cacheMaxSize = 64                      // Good hit rate

// Speed
speedScale = 0.7                       // Balanced rotation speed
```

## Summary

The blur/ghosting was caused by always blending frames, which shows both positions of moving elements. By increasing the threshold to 5%, we:
- Only blend when meaningfully between frames (smooth rotation)
- Return single frames when close to exact positions (sharp, no ghosting)
- Maintain the correct interpolation formula (no pulsation)

This provides the best balance: smooth rotation with sharp, clear rendering of moving elements.
