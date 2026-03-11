Atomic Fighter Visual Enhancements
==================================

Scope: Basic ship (Atomic Fighter) visuals and effects in gameplay.

Always-on/Base visuals
- Fighter fuselage/wings with gradients, panel lines, canopy highlights, intakes, rocket pods, stabilizers.
- Engine core glow with turbine blades, nozzle details.

Motion/impact-driven effects
- Speed wake dust/ionized particulates: spawn continuously when normalized speed > 0.55; extra streaks > 0.85; respects particle quality and rendering quality (off in minimal).
- Wingtip micro-thrusters: lateral jets light up when strong strafing (|vx| > ~0.25 max speed).
- Afterimage ghost trails: appear at very high speed or boost (speedNorm > 0.8 or boost).
- Impact scorch + repair shimmer: dark scorch on recent hit (hitFlash), then cool-blue shimmer fade.
- Low-health lighting: canopy dims and wingtip status lights flicker when health < 50%.
- Oxygen/sublimation venting: small vapor puffs on hard decel or when boost ends.
- Shield-hit diffraction: brief hex-like shimmer when shield takes a hit (recent hit + shield up).
- Hover dust: subtle dust puffs near screen bottom (player low on screen) if particles enabled.

Engine flames (skin-based)
- Default: compact classic flame (blue/orange gradient).
- Plasma Serration Flame (store skin, 5 neurokeys): long serrated plasma plume with outer layer and ribbon core; boost adds hotter glow.
- Vortex Spiral Flame (store skin, 6 neurokeys): multi-band spiral ribbons with soft aura; animated twist per band.
- Quantum Plasma Flame (store skin, 1 neurokey test): high-fidelity plasma plume with volumetric gradients, a warmer orange/yellow center, spark/filament motes, golden helical plasma dust wrapping the full plume, and boosted glow; folds in molecule/material-like wake accents near the nozzle.
- Hull skins: Default Atomic Fighter hull (cyan fighter jet styling) and Eclipse Nova Hull (store skin, 1 neurokey test, unlocked for testing) featuring obsidian/wine plating, magenta-gold ribbons, amber canopy/tip, and warm tail glow; works with all engine flame skins.

Muzzle/weapon cues
- Weapon-synced muzzle glow at hardpoints, tinted by weapon color, scales slightly with speed/boost.

Quality gating
- Most extras disable in minimal quality; particle-heavy pieces respect `particlesQuality` (off/low/medium/high).

Auto-equipping from store
- Engine flame skins auto-equip on purchase (plasma/vortex). Default remains available and free.
