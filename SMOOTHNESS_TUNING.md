# Smoothness Tuning - Reducing Incremental Appearance and Ghosting

## Current Issue

After fixing pulsation and initial blur:
- **Incremental Appearance**: Rotation appears stepped/jumpy, not smooth
- **Ghosting**: Still seeing both positions of moving elements

## Root Causes

1. **Threshold Too High**: 5% threshold causes too many single-frame renders → stepping
2. **Alpha Quantization**: 128 levels may not be smooth enough → visible steps
3. **Blending Frequency**: Not blending often enough → incremental appearance

## Adjustments Made

### 1. Reduced Interpolation Threshold
**Changed**: `0.05` (5%) → `0.02` (2%)

**Effect**:
- Blends 96% of the time (was 90%)
- Only skips blending at exact frame boundaries (0% and 100%)
- Much smoother rotation, less stepping

### 2. Increased Alpha Quantization
**Changed**: `128 levels` → `256 levels`

**Effect**:
- More granular interpolation steps
- Smoother transitions between frames
- Reduces visible stepping in blended frames

## Current Values

```javascript
// Interpolation
interpolationThreshold = 0.02        // 2% - smooth rotation, minimal ghosting
alphaQuantization = 256 levels      // Maximum smoothness

// Compositing
globalCompositeOperation = 'lighter' // True linear interpolation

// Cache
cacheMaxSize = 64                    // Good hit rate

// Speed
speedScale = 0.7                     // Balanced rotation speed
```

## Fine-Tuning Guide

### If Still Too Steppy (Incremental):
```javascript
// Reduce threshold further (blend more often)
const interpolationThreshold = 0.01; // 1% - blend almost always

// Or increase frame count for smoother base animation
this._ensembleClassicBgFrameCount = 512; // More frames = smoother
```

### If Ghosting Too Strong:
```javascript
// Increase threshold (blend less often)
const interpolationThreshold = 0.03; // 3% - blend less, sharper frames

// Or reduce alpha quantization (fewer interpolation steps)
const alphaKey = Math.floor(alpha * 128) / 128; // 128 levels
```

### If Rotation Too Fast/Slow:
```javascript
// Adjust speed scale
const speedScale = 0.6;  // Slower
const speedScale = 0.8;  // Faster
```

## Testing Strategy

1. **Start with current values** (2% threshold, 256 levels)
2. **If stepping visible**: Reduce threshold to 0.01
3. **If ghosting visible**: Increase threshold to 0.03
4. **If still not smooth**: Consider increasing frame count to 512

## Expected Behavior

With 2% threshold and 256 levels:
- ✅ **Smooth rotation** - Blends 96% of the time
- ✅ **Minimal stepping** - Only at exact frame boundaries
- ⚠️ **Some ghosting** - Inevitable when blending frames with motion
- ✅ **No pulsation** - Correct "lighter" compositing formula

## Next Steps

If still not smooth enough:
1. Reduce threshold to 0.01 (1%)
2. Increase frame count to 512
3. Consider motion-aware blending (more complex)

If ghosting is too strong:
1. Increase threshold to 0.03 (3%)
2. Accept some stepping for sharper frames
3. Consider frame-rate dependent threshold
