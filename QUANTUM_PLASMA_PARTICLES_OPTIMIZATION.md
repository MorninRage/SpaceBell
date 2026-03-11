# Quantum Plasma Particles Optimization System

**Date**: Optimization Review  
**Status**: ✅ **UPDATED** - Thresholds doubled

---

## 📋 CURRENT OPTIMIZATION SYSTEM

The quantum plasma particles skin has an optimization system that automatically reduces rendering load when many particles are on screen.

### Optimization Features

1. **Count-Based Quality Reduction** (Count-Based)
   - Reduces quality tier instead of skipping frames
   - **No strobe effect** - all particles are still rendered
   - Reduces effects (rings, stars, spikes) based on particle count
   - Maintains smooth frame rate during high particle counts

2. **Distance-Based LOD** (Level of Detail)
   - Reduces quality based on distance from player
   - Maintains full quality for close particles
   - Automatically scales down for distant particles

---

## 🎯 CURRENT THRESHOLDS (UPDATED)

### Regular Targets (drawTargets function)
- **Count-Based Quality Reduction**: Activates at **60+ targets**
  - 60-80 targets: Medium quality
  - 80-100 targets: Low quality
  - 100+ targets: Minimal quality
- **Distance LOD**:
  - Distance > 400px: Medium quality
  - Distance > 600px: Low quality
  - Distance > 800px: Minimal quality

### Bell Pairs (drawPairs function)
- **Count-Based Quality Reduction**: Activates at **40+ pairs**
  - 40-50 pairs: Medium quality
  - 50-60 pairs: Low quality
  - 60+ pairs: Minimal quality
  - Note: Each pair has 2 particles, so 40 pairs = 80 particles
- **Distance LOD**:
  - Distance > 400px: Medium quality
  - Distance > 600px: Low quality
  - Distance > 800px: Minimal quality

---

## 📊 HOW IT WORKS

### Count-Based Quality Reduction
When the particle count exceeds the threshold:
1. **All particles are still rendered** (no frame skipping)
2. Quality tier is reduced based on count:
   - 60-80 targets / 40-50 pairs: Medium quality (reduced effects)
   - 80-100 targets / 50-60 pairs: Low quality (minimal effects)
   - 100+ targets / 60+ pairs: Minimal quality (core only)
3. This reduces rendering operations without creating strobe effect
4. Visual quality gradually decreases instead of flickering

### Distance-Based LOD
For each particle:
1. Calculate distance from player to particle
2. If distance > 400px: Reduce to medium quality
3. If distance > 600px: Reduce to low quality
4. If distance > 800px: Reduce to minimal quality
5. Combine with base quality (use lower of the two)

### Quality Tiers
- **Ultra/High**: Full effects (4 rings, 8 stars/ring, 3 spikes/star, 6 sparkles, 3 waves)
- **Medium**: Reduced effects (3 rings, 6 stars/ring, 2 spikes/star, 4 sparkles, 2 waves)
- **Low**: Minimal effects (2 rings, 4 stars/ring, 1 spike/star, 3 sparkles, 1 wave)
- **Minimal**: Core only (1 ring, 0 stars, 0 spikes, 2 sparkles, 0 waves)

---

## ✅ WHAT WAS CHANGED

### Before (Frame Skipping - Created Strobe Effect)
- **Regular targets**: Frame skipping at 30+ targets
- **Bell pairs**: Frame skipping at 20+ pairs (40 particles)
- **Problem**: Created strobe light effect when activated

### After (Quality Reduction - No Strobe Effect)
- **Regular targets**: Quality reduction at **60+ targets**
  - 60-80: Medium quality
  - 80-100: Low quality
  - 100+: Minimal quality
- **Bell pairs**: Quality reduction at **40+ pairs** (80 particles)
  - 40-50: Medium quality
  - 50-60: Low quality
  - 60+: Minimal quality
- **Solution**: All particles rendered, but with reduced effects (no strobe)

---

## 🎮 USER EXPERIENCE

### Before Update (Frame Skipping)
- Frame skipping created strobe light effect
- Particles flickered on/off alternating frames
- Unpleasant visual experience

### After Update (Quality Reduction)
- **No strobe effect** - all particles always rendered
- Quality gradually reduces based on count
- Smooth visual experience
- Full quality maintained until 60+ targets / 40+ pairs
- Gradual quality reduction instead of flickering

---

## 📈 PERFORMANCE IMPACT

### Count-Based Quality Reduction Impact
- **When active**: Reduces effects (rings, stars, spikes) instead of skipping frames
- **Regular targets**: 
  - 60-80: Medium quality (3 rings, 6 stars, 2 spikes)
  - 80-100: Low quality (2 rings, 4 stars, 1 spike)
  - 100+: Minimal quality (1 ring, 0 stars, 0 spikes)
- **Bell pairs**: 
  - 40-50: Medium quality
  - 50-60: Low quality
  - 60+: Minimal quality
- **Result**: No strobe effect, smooth quality reduction, all particles visible

### Distance LOD Impact
- **Close particles** (< 400px): Full quality maintained
- **Medium distance** (400-600px): Medium quality
- **Far particles** (600-800px): Low quality
- **Very far** (> 800px): Minimal quality

---

## 🔍 CODE LOCATIONS

### Regular Targets
- **Function**: `drawTargets()` (line ~24111)
- **Count-based quality**: Line ~24120-24130
- **Distance LOD**: Line ~24138-24146
- **Quality application**: Line ~24149-24170

### Bell Pairs
- **Function**: `drawPairs()` (line ~24203)
- **Count-based quality**: Line ~24290-24305
- **Distance LOD**: Line ~24308-24315
- **Quality application**: Line ~24318-24340

---

## 📝 NOTES

1. **No Strobe Effect**: Quality reduction replaces frame skipping, so all particles are always visible. No more flickering or strobe light effect.

2. **Visual Quality**: Full quality maintained until 60+ targets / 40+ pairs, then gradually reduces. Smooth quality transition instead of flickering.

3. **Performance**: Quality reduction reduces rendering operations by reducing effects (rings, stars, spikes) rather than skipping frames. Maintains smooth performance without visual artifacts.

4. **Distance LOD**: Distance-based quality reduction still works independently and combines with count-based reduction (uses lowest quality of the two).

5. **Bell Pairs**: Note that each pair has 2 particles, so 40 pairs = 80 individual particles. Quality reduction thresholds account for this.

---

**Document Status**: Complete - Thresholds updated and documented
