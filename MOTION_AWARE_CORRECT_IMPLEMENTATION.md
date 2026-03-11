# Motion-Aware Interpolation - Correct Implementation

## Research Findings

### Canvas ImageData Alpha Handling
**CRITICAL DISCOVERY**: 
- `getImageData()` returns **UN-premultiplied (straight) alpha** data
- `putImageData()` expects **UN-premultiplied (straight) alpha** data
- The browser automatically handles conversion between internal premultiplied format and straight alpha
- **Previous bug**: We were trying to un-premultiply data that was already un-premultiplied!

### Correct Implementation Strategy
1. **Get pixel data**: Already in straight alpha format (no conversion needed)
2. **Blend in straight alpha space**: Direct linear interpolation
3. **Put pixel data**: Browser automatically re-premultiplies

## Implementation Details

### 1. Motion Detection
**Method**: Luminance-based frame differencing
- Compares consecutive frames pixel-by-pixel
- Uses luminance formula: `Y = 0.299*R + 0.587*G + 0.114*B`
- Threshold: 20 (0-255 scale) - detects significant motion
- Applies 3x3 neighborhood smoothing to reduce noise
- Cached for performance (32 entries)

### 2. Asymmetric Blending
**Strategy**: Different blending in motion vs static areas

**Motion Areas** (motion detected):
- **Asymmetric blending**: Prefer frame closer to target time
- If `alpha < 0.5`: Use frame1 as primary (weight1 > weight2)
- If `alpha >= 0.5`: Use frame2 as primary (weight2 > weight1)
- **Eliminates ghosting** by showing only one position, not both
- Smooth transition based on motion strength

**Static Areas** (no motion):
- **Normal linear interpolation**: `Result = (1-α) * Frame1 + α * Frame2`
- Maintains smooth rotation in static background areas
- No ghosting because nothing is moving

### 3. Correct Alpha Handling
**Key Points**:
- Data from `getImageData()` is already un-premultiplied
- Blend directly: `result = frame1 * weight1 + frame2 * weight2`
- No need to un-premultiply or re-premultiply manually
- `putImageData()` handles re-premultiplication automatically

## Code Structure

```javascript
// 1. Get pixel data (already un-premultiplied)
const imgData1 = ctx1.getImageData(0, 0, width, height);
const imgData2 = ctx2.getImageData(0, 0, width, height);

// 2. Detect motion
const motionMask = detectMotionBetweenFrames(frame1, frame2, ...);

// 3. Blend pixels
for (each pixel) {
    if (motion detected) {
        // Asymmetric blending (prefer closer frame)
        weight1 = asymmetric_weight1;
        weight2 = asymmetric_weight2;
    } else {
        // Normal interpolation
        weight1 = 1.0 - alpha;
        weight2 = alpha;
    }
    
    // Blend in straight alpha space
    result = frame1 * weight1 + frame2 * weight2;
}

// 4. Put result (browser handles re-premultiplication)
tempCtx.putImageData(resultImgData, 0, 0);
```

## Expected Results

✅ **No Ghosting** - Motion areas show only one position (asymmetric blending)
✅ **Smooth Rotation** - Static areas use normal interpolation
✅ **No Pulsation** - Correct alpha handling (no double conversion)
✅ **Sharp Moving Elements** - Effect lights show one position, not both
✅ **Smooth Transitions** - No harsh cuts at motion boundaries

## Fine-Tuning

### Motion Detection Threshold
```javascript
this._motionDetectionThreshold = 15; // More sensitive (detects smaller motions)
this._motionDetectionThreshold = 25; // Less sensitive (only large motions)
```

### Motion Blending Strength
Adjust the `motionValue > 0.5` threshold to control when asymmetric blending activates.

## Summary

This implementation correctly handles Canvas 2D's alpha format:
- Works with un-premultiplied data from `getImageData()`
- Blends in straight alpha space
- Lets browser handle re-premultiplication via `putImageData()`
- Eliminates ghosting through motion-aware asymmetric blending
- Maintains smooth rotation in static areas
