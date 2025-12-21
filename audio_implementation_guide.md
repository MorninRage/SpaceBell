# Audio Implementation Guide - Quick Setup

## Overview
This guide will help you quickly add real audio files to replace the procedural sounds.

## Step 1: Download Sound Effects (5-10 minutes)

### Recommended: Freesound.org
1. Go to https://freesound.org
2. Create a free account
3. Search and download these sounds (as OGG or convert to OGG):
   - `shoot.ogg` - Search "laser shoot" or "weapon fire"
   - `laser.ogg` - Search "laser beam" or "energy beam"
   - `hit.ogg` - Search "impact" or "hit"
   - `explosion.ogg` - Search "explosion" or "blast"
   - `enemy_hit.ogg` - Search "enemy hit" or "damage"
   - `enemy_destroy.ogg` - Search "enemy death" or "destroy"
   - `boss_hit.ogg` - Search "boss hit" or "heavy impact"
   - `boss_destroy.ogg` - Search "boss death" or "epic explosion"
   - `level_up.ogg` - Search "level up" or "achievement"
   - `equip.ogg` - Search "equip" or "item pickup"
   - `button_click.ogg` - Search "button click" or "ui click"

4. Place all files in `bell-game/sfx/` folder

## Step 2: Download Background Music (10-15 minutes)

### Recommended: Incompetech.com (Kevin MacLeod)
1. Go to https://incompetech.com/music/royalty-free/
2. Search for these styles:
   - **Main Theme**: Search "techno", "electronic", "retro", or "arcade"
   - **Boss Themes**: Search "epic", "intense", "battle", or "boss"
   - **Menu Theme**: Search "ambient", "menu", or "intro"

3. Download tracks and convert to OGG format
4. Rename and place in `bell-game/music/` folder:
   - `main_theme.ogg` - Main gameplay music
   - `boss1_neurotransmitter.ogg` - Boss 1 music
   - `boss2_dna_helix.ogg` - Boss 2 music
   - `boss3_protein_complex.ogg` - Boss 3 music
   - `boss4_cell_membrane.ogg` - Boss 4 music
   - `boss_advanced.ogg` - Advanced boss music
   - `menu_theme.ogg` - Menu/cutscene music

**Note**: Remember to add attribution for Kevin MacLeod's music in your game credits!

## Step 3: Generate Voice Clips (15-20 minutes)

### Option A: ElevenLabs.io (Best Quality - Recommended)
1. Go to https://elevenlabs.io
2. Sign up for free account (10,000 characters/month free)
3. Use the text-to-speech interface
4. Generate voice clips for:

**Bell's Voice Clips** (place in `bell-game/voice/bell/`):
- `bell_thought_1.ogg` - "Quantum mechanics reveals hidden variables that Einstein missed."
- `bell_thought_2.ogg` - "Einstein's objections must be addressed through experiment."
- `bell_thought_3.ogg` - "The statistical nature of quantum theory is fundamental, not incomplete."
- `bell_quantum_1.ogg` - "Bell's theorem proves that quantum mechanics is non-local."
- `bell_quantum_2.ogg` - "Quantum entanglement defies all classical understanding of physics."
- `bell_einstein_1.ogg` - "Einstein was wrong about the completeness of quantum mechanics."
- `bell_einstein_2.ogg` - "The quantum world operates on probability, not determinism."

**Einstein's Voice Clips** (place in `bell-game/voice/einstein/`):
- `einstein_reply_1.ogg` - "Quantum mechanics is incomplete. It cannot describe individual systems."
- `einstein_reply_2.ogg` - "God does not play dice. The universe follows deterministic laws."
- `einstein_quantum_1.ogg` - "The theory must describe individual systems, not just ensembles."
- `einstein_quantum_2.ogg` - "Hidden variables must exist to explain quantum behavior."
- `einstein_complete_1.ogg` - "Reality cannot be purely statistical. There must be underlying causes."
- `einstein_complete_2.ogg` - "A complete description of individual systems is necessary for physics."

5. Download as MP3, convert to OGG, place in appropriate folders

### Option B: Google Cloud TTS (More Technical)
1. Sign up for Google Cloud (free trial)
2. Enable Text-to-Speech API
3. Use API to generate voice clips
4. See Google Cloud TTS documentation for details

## Step 4: Convert Audio Files to OGG Format

### Using Audacity (Free):
1. Download Audacity: https://www.audacityteam.org
2. Open audio file
3. File → Export → Export as OGG
4. Choose OGG Vorbis format
5. Save with .ogg extension

### Using Online Converter:
1. Go to https://convertio.co/audio-converter/
2. Upload audio file
3. Select OGG format
4. Download converted file

## Step 5: File Structure

After adding files, your structure should look like:
```
bell-game/
├── music/
│   ├── main_theme.ogg
│   ├── boss1_neurotransmitter.ogg
│   ├── boss2_dna_helix.ogg
│   ├── boss3_protein_complex.ogg
│   ├── boss4_cell_membrane.ogg
│   ├── boss_advanced.ogg
│   └── menu_theme.ogg
├── sfx/
│   ├── shoot.ogg
│   ├── laser.ogg
│   ├── hit.ogg
│   ├── explosion.ogg
│   ├── enemy_hit.ogg
│   ├── enemy_destroy.ogg
│   ├── boss_hit.ogg
│   ├── boss_destroy.ogg
│   ├── level_up.ogg
│   ├── equip.ogg
│   └── button_click.ogg
└── voice/
    ├── bell/
    │   ├── bell_thought_1.ogg
    │   ├── bell_thought_2.ogg
    │   ├── bell_thought_3.ogg
    │   ├── bell_quantum_1.ogg
    │   ├── bell_quantum_2.ogg
    │   ├── bell_einstein_1.ogg
    │   └── bell_einstein_2.ogg
    └── einstein/
        ├── einstein_reply_1.ogg
        ├── einstein_reply_2.ogg
        ├── einstein_quantum_1.ogg
        ├── einstein_quantum_2.ogg
        ├── einstein_complete_1.ogg
        └── einstein_complete_2.ogg
```

## Quick Links

- **Sound Effects**: https://freesound.org
- **Music**: https://incompetech.com/music/royalty-free/
- **Voice Generation**: https://elevenlabs.io
- **Audio Converter**: https://convertio.co/audio-converter/
- **Audacity**: https://www.audacityteam.org

## Notes

- All files should be in OGG Vorbis format (.ogg)
- If files are missing, procedural sounds will be generated automatically
- The game will work with or without audio files
- Remember to add attribution for any CC-licensed content












