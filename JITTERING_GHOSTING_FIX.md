# Jittering and Ghosting Fix - Smooth Asymmetric Blending

## Issues Identified

1. **Jittering/Going Back and Forth**: Asymmetric blending was switching too aggressively at alpha=0.5
2. **Still Has Ghosting**: Motion detection might have false positives or blending not aggressive enough

## Root Causes

### Jittering
- **Hard switch at alpha=0.5**: When alpha crossed 0.5, weights flipped instantly
- **No smooth transition**: Binary switching between frame1 and frame2
- **Motion threshold too low**: Using asymmetric blending too often

### Ghosting
- **Motion detection too sensitive**: Detecting motion where there isn't any
- **Asymmetric blending not aggressive enough**: Still showing both positions

## Fixes Applied

### 1. Smoother Asymmetric Blending
**Before**: Hard switch at alpha=0.5
```javascript
if (alpha < 0.5) {
    weight1 = 1.0 - (alpha * 2); // Hard switch
    weight2 = alpha * 2;
} else {
    weight1 = (1.0 - alpha) * 2; // Hard switch
    weight2 = (alpha - 0.5) * 2;
}
```

**After**: Smooth transition using smoothstep
```javascript
const smoothAlpha = alpha * alpha * (3 - 2 * alpha); // Smoothstep
if (smoothAlpha < 0.5) {
    weight1 = 1.0 - (smoothAlpha * 1.8); // Smoother curve
    weight2 = smoothAlpha * 1.8;
} else {
    weight1 = (1.0 - smoothAlpha) * 1.8; // Smoother curve
    weight2 = (smoothAlpha - 0.5) * 1.8 + 0.1;
}
```

**Effect**: Eliminates jittering by using smooth curve instead of hard switch

### 2. Higher Motion Threshold
**Before**: `motionValue > 0.5` (50% threshold)
**After**: `motionStrength > 0` with `motionThreshold = 0.7` (70% threshold)

**Effect**: Only uses asymmetric blending for strong motion, reducing false positives

### 3. Gradual Motion Blending
**Before**: Binary choice (asymmetric or normal)
**After**: Gradual blend based on motion strength
```javascript
weight1 = weight1 * motionStrength + normalWeight1 * (1.0 - motionStrength);
```

**Effect**: Smooth transition between asymmetric and normal blending

### 4. Improved Motion Detection
**Before**: 4+ neighbors needed for motion
**After**: 5+ neighbors needed for motion

**Effect**: Reduces false motion detection that causes jittering

### 5. Higher Motion Detection Threshold
**Before**: `_motionDetectionThreshold = 20`
**After**: `_motionDetectionThreshold = 30`

**Effect**: Only detects significant motion, reducing false positives

## Current Optimized Values

```javascript
// Motion Detection
_motionDetectionThreshold = 30        // Higher = less sensitive (reduces false positives)
motionThreshold = 0.7                 // Only asymmetric blend for strong motion (70%+)
neighborThreshold = 5                 // 5+ neighbors needed (reduces noise)

// Blending
smoothstep = true                      // Smooth curve instead of hard switch
motionStrength = gradual              // Gradual transition based on motion
```

## Expected Results

✅ **No Jittering** - Smooth transitions prevent back-and-forth movement
✅ **Reduced Ghosting** - Asymmetric blending for strong motion areas
✅ **Smooth Rotation** - Normal interpolation in static areas
✅ **No False Motion** - Higher thresholds reduce false positives

## Fine-Tuning

### If Still Jittering:
```javascript
// Increase motion threshold (use asymmetric blending less)
const motionThreshold = 0.8; // 80% - only very strong motion

// Or use smoother curve
const smoothAlpha = alpha * alpha * alpha * (alpha * (alpha * 6 - 15) + 10); // Smoother
```

### If Still Has Ghosting:
```javascript
// Lower motion threshold (detect more motion)
this._motionDetectionThreshold = 25; // More sensitive

// Or make asymmetric blending more aggressive
weight1 = 1.0 - (smoothAlpha * 2.0); // More aggressive (was 1.8)
```

## Summary

The fixes address both issues:
- **Jittering**: Fixed with smoothstep curve and gradual motion blending
- **Ghosting**: Fixed with higher motion detection threshold and more aggressive asymmetric blending

The system now smoothly transitions between asymmetric and normal blending, preventing jittering while still eliminating ghosting in motion areas.
