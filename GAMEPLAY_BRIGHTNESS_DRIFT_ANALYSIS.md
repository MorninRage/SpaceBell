# Gameplay Brightness Drift - Root Cause Analysis

**Date:** February 2026  
**Key insight:** The issue happens **during gameplay**, not at level-up. Level-up returns to the correct brightness—gameplay should stay at that level but drifts.

---

## The Problem (Clarified)

- **During gameplay:** Brightness drifts (gets dimmer or brighter as the level progresses)
- **At level-up:** Brightness returns to correct level (the reference "correct" state)
- **Our previous fixes:** Focused on level-up time alignment—helped but didn't eliminate the drift

---

## Root Cause: Shadow Overlap + Phase-Dependent Positions

### Mechanism

1. **Phase advances during gameplay** – `levelTimeElapsed` goes from 0 to ~30 seconds. Phase = time × speedScale.

2. **Particle/node positions depend on phase** – e.g.:
   - Ensemble: `angle = phase * 0.2 + i * 0.4` (40 orbiting particles)
   - Flow dots: `flowPos = (phase * 0.3 + i * 0.1) % 1`
   - Nodes: `angle = phase * 0.1 + i * 0.5` (25 nodes)

3. **Heavy use of shadowBlur** – Background elements use shadowBlur 8, 10, 12, 25:
   - Particles: shadowBlur 8
   - Flow dots: shadowBlur 10
   - Nodes: shadowBlur 12
   - Core: shadowBlur 25

4. **Overlap varies with phase** – When particles cluster (same approximate position), their glows overlap. When spread out, less overlap. Canvas uses source-over: overlapping semi-transparent glows = brighter spots.

5. **Total luminance varies** – As phase advances, spatial arrangement changes → overlap changes → perceived brightness drifts.

### Why level-up "fixes" it

At level-up, `levelTimeElapsed` resets to 0. Phase = 0. Consistent spatial arrangement = consistent brightness. That's the correct reference state.

---

## The Fix: Remove shadowBlur from Background Elements

**Strategy:** Set `shadowBlur = 0` on all background elements whose positions vary with phase. This eliminates the overlap-induced brightness variation while keeping the solid fills (particles, nodes, etc.) visible.

**Trade-off:** Background will look flatter (no glow on particles/nodes). If too flat, we can try `shadowBlur = 2` as a compromise.

---

## Affected Code Paths

| Mode | Path | shadowBlur values |
|------|------|-------------------|
| Ensemble | Cache path (particles, flow, nodes, rings, core) | 8, 5, 10, 12, 8, 25 |
| Ensemble | Fallback draw | 8, 5, 10, 12, 8, 25 |
| Ensemble | drawEnsembleClassicFrameAtPhase | 8, 5, 10, 12, 8, 25 |
| Individual Precision | Nodes, etc. | 8 |
| Individual Neuro | Various | 8, etc. |
| Bell Classic | renderBellClassicBackgroundFrame | TBD |
| Bell Aurora | Motes, etc. | TBD |

---

## Implementation (Applied)

Replaced `ctx.shadowBlur = N` with `ctx.shadowBlur = 0` in all background draw functions:

- **Ensemble** (cache path + fallback + drawEnsembleClassicFrameAtPhase): particles, flow dots, nodes, rings, core
- **Individual Precision**: nodes, soma core
- **Boss background**: layer strokes

Bell Classic and Aurora Borealis did not use shadowBlur on phase-dependent elements (Bell Classic has no shadowBlur; Aurora motes use fillStyle only).
