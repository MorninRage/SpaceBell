# Audio System Setup Guide

This document describes the audio system implementation and required audio files.

## Overview

The game uses a comprehensive audio system with:
- **Background Music**: Different tracks for gameplay and each boss type
- **Sound Effects**: Combat, UI, and gameplay events
- **Voice Clips**: John Bell thoughts and Einstein replies that play randomly during gameplay

## Audio System Architecture

The `AudioManager` class uses the Web Audio API for:
- High-performance audio playback
- Volume control per channel (master, music, SFX, voice)
- Crossfading between music tracks
- Efficient audio buffer caching

## Required Audio Files

### Directory Structure

```
bell-game/
├── music/
│   ├── main_theme.ogg              # Main gameplay music (techno/dub/EDM + 80s arcade)
│   ├── boss1_neurotransmitter.ogg  # Neurotransmitter Boss (Level 15)
│   ├── boss2_dna_helix.ogg         # DNA Helix Boss (Level 30)
│   ├── boss3_protein_complex.ogg   # Protein Complex Boss (Level 45)
│   ├── boss4_cell_membrane.ogg     # Cell Membrane Boss (Level 60)
│   ├── boss_advanced.ogg           # Advanced Bosses (Level 75+)
│   └── menu_theme.ogg              # Menu/cutscene music
│
├── sfx/
│   ├── shoot.ogg                   # Regular weapon fire
│   ├── laser.ogg                   # Laser weapon fire
│   ├── hit.ogg                     # Target hit
│   ├── explosion.ogg               # Explosion sound
│   ├── enemy_hit.ogg               # Enemy ship hit
│   ├── enemy_destroy.ogg           # Enemy ship destroyed
│   ├── boss_hit.ogg                # Boss hit
│   ├── boss_destroy.ogg            # Boss destroyed
│   ├── player_hit.ogg              # Player hit
│   ├── player_death.ogg            # Player death
│   ├── shield_hit.ogg              # Shield hit
│   ├── shield_break.ogg            # Shield broken
│   ├── health_pickup.ogg           # Health item collected
│   ├── shield_pickup.ogg           # Shield item collected
│   ├── level_up.ogg                # Level up sound
│   ├── craft.ogg                   # Item crafted
│   ├── equip.ogg                   # Item equipped
│   ├── unequip.ogg                 # Item unequipped
│   ├── purchase.ogg                # Shop purchase
│   ├── button_click.ogg            # UI button click
│   ├── menu_open.ogg               # Menu opened
│   ├── menu_close.ogg              # Menu closed
│   ├── bell_pair.ogg               # Bell pair mode sound
│   ├── quantum.ogg                 # Quantum effect sound
│   ├── repair.ogg                  # Item repair sound
│   └── hammer.ogg                  # Hammer use sound
│
└── voice/
    ├── bell/
    │   ├── bell_thought_1.ogg      # Bell's thoughts about quantum mechanics
    │   ├── bell_thought_2.ogg      # Bell's thoughts about quantum mechanics
    │   ├── bell_thought_3.ogg      # Bell's thoughts about quantum mechanics
    │   ├── bell_quantum_1.ogg      # Bell on quantum mechanics
    │   ├── bell_quantum_2.ogg      # Bell on quantum mechanics
    │   ├── bell_einstein_1.ogg     # Bell's thoughts about Einstein
    │   └── bell_einstein_2.ogg     # Bell's thoughts about Einstein
    │
    └── einstein/
        ├── einstein_reply_1.ogg    # Einstein's reply/argument
        ├── einstein_reply_2.ogg    # Einstein's reply/argument
        ├── einstein_quantum_1.ogg  # Einstein on quantum mechanics
        ├── einstein_quantum_2.ogg  # Einstein on quantum mechanics
        ├── einstein_complete_1.ogg # Einstein on completeness
        └── einstein_complete_2.ogg # Einstein on completeness
```

## Audio File Requirements

### Format
- **Format**: OGG Vorbis (`.ogg`) - Best browser compatibility and compression
- **Sample Rate**: 44.1 kHz recommended
- **Bit Depth**: 16-bit minimum
- **Channels**: Stereo for music, mono acceptable for SFX

### Music Tracks

#### Main Theme (`main_theme.ogg`)
- **Style**: Fusion of techno, dub, EDM with 80s arcade game aesthetics
- **Duration**: 2-4 minutes (will loop)
- **Mood**: Energetic, futuristic, retro-futuristic
- **Elements**: 
  - 80s arcade game chiptune elements
  - Modern techno/dub basslines
  - EDM-style builds and drops
  - Quantum/atomic theme

#### Boss Tracks
Each boss track should:
- **Duration**: 2-3 minutes (will loop)
- **Style**: More intense version of main theme, boss-specific variations
- **Boss 1 (Neurotransmitter)**: Neural/electrical theme
- **Boss 2 (DNA Helix)**: Genetic/biological theme
- **Boss 3 (Protein Complex)**: Molecular/chemical theme
- **Boss 4 (Cell Membrane)**: Cellular/organic theme
- **Advanced Bosses**: Epic, final boss style

### Sound Effects

All SFX should be:
- **Duration**: 0.1-2 seconds (most under 1 second)
- **Format**: OGG Vorbis
- **Volume**: Normalized to prevent clipping
- **Style**: Retro-futuristic, arcade-like, but modern

#### Combat SFX
- `shoot.ogg`: Sharp, punchy weapon fire
- `laser.ogg`: High-energy beam sound
- `hit.ogg`: Impact sound
- `explosion.ogg`: Satisfying explosion
- `enemy_hit.ogg`: Enemy impact
- `enemy_destroy.ogg`: Enemy destruction
- `boss_hit.ogg`: Heavy boss impact
- `boss_destroy.ogg`: Epic boss destruction

#### Player SFX
- `player_hit.ogg`: Player damage sound
- `player_death.ogg`: Game over sound
- `shield_hit.ogg`: Shield impact
- `shield_break.ogg`: Shield breaking

#### UI SFX
- `level_up.ogg`: Achievement/level up fanfare
- `craft.ogg`: Crafting success
- `equip.ogg`: Item equipped
- `purchase.ogg`: Shop purchase
- `button_click.ogg`: UI interaction
- `menu_open.ogg`: Menu opening
- `menu_close.ogg`: Menu closing

### Voice Clips

#### John Bell Clips
- **Content**: Bell's thoughts about quantum mechanics, Einstein, and the quantum world
- **Style**: As if hearing Bell's internal thoughts
- **Duration**: 3-10 seconds each
- **Tone**: Contemplative, scientific, sometimes questioning

#### Einstein Clips
- **Content**: Einstein's replies/arguments about quantum mechanics and completeness
- **Style**: As if Einstein is responding to Bell's thoughts
- **Duration**: 3-10 seconds each
- **Tone**: Authoritative, sometimes argumentative, philosophical

#### Voice Clip Timing
- Voice clips play randomly during gameplay
- Interval: 15-45 seconds between clips
- 60% chance for Bell, 40% for Einstein
- Einstein sometimes "argues back" 2-5 seconds after Bell

## Implementation Details

### Audio Initialization
Audio context is initialized on first user interaction (click or keypress) to comply with browser autoplay policies.

### Volume Controls
Volume controls are available in the Settings menu (ESC):
- Master Volume: Controls all audio
- Music Volume: Background music only
- Sound Effects Volume: All SFX
- Voice Volume: Voice clips only

### Music Transitions
Music crossfades smoothly between tracks (1 second fade time) when:
- Entering boss battles
- Exiting boss battles
- Starting the game

### Performance
- Audio buffers are cached after first load
- Sound effects use efficient buffer sources
- Voice clips don't interrupt each other
- Music uses looping buffers for efficiency

## Creating Audio Files

### Recommended Tools
- **DAW**: FL Studio, Ableton Live, Reaper, or similar
- **SFX**: Audacity, Bfxr, or similar
- **Voice**: Record with good microphone, process with Audacity

### Music Creation Tips
1. Start with 80s arcade game chiptune elements
2. Add modern techno/dub basslines
3. Layer EDM-style builds and drops
4. Use quantum/atomic sound effects
5. Keep energy high but not overwhelming

### SFX Creation Tips
1. Use retro-futuristic synthesizers
2. Add arcade game-style beeps and boops
3. Keep sounds punchy and immediate
4. Normalize all files to prevent clipping
5. Test in-game to ensure proper volume balance

### Voice Recording Tips
1. Use clear, professional recordings of Bell and Einstein speeches
2. Process to remove background noise
3. Normalize volume levels
4. Keep clips concise and impactful
5. Ensure clear pronunciation

## Testing

After adding audio files:
1. Test all sound effects trigger correctly
2. Verify music transitions smoothly
3. Check voice clips play at appropriate times
4. Test volume controls work properly
5. Ensure no audio glitches or delays

## Notes

- All audio files should be optimized for web (compressed but high quality)
- OGG Vorbis is preferred for best browser compatibility
- Audio files are loaded on-demand (not preloaded) for performance
- Missing audio files will log warnings but won't break the game












