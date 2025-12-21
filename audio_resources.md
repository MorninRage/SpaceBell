# Free Audio Resources for Beyond Bell Game

## Sound Effects

### 1. **Freesound.org** (Recommended)
- **URL**: https://freesound.org
- **License**: CC0, CC BY, CC BY-NC (check license per sound)
- **How to use**: 
  - Search for sounds (e.g., "laser", "explosion", "shoot")
  - Download as OGG or WAV
  - Convert to OGG if needed (use Audacity or online converter)
  - Place in `bell-game/sfx/` folder

### 2. **Zapsplat** (Free with account)
- **URL**: https://www.zapsplat.com
- **License**: Free with attribution (requires free account)
- **Quality**: Professional quality
- **How to use**: Sign up for free account, download sounds

### 3. **OpenGameArt.org**
- **URL**: https://opengameart.org
- **License**: Various (CC0, CC BY, GPL)
- **How to use**: Browse sound effects, download, check license

### 4. **Kenney.nl** (Game Assets)
- **URL**: https://kenney.nl/assets
- **License**: CC0 (public domain)
- **Quality**: Professional game assets

## Background Music

### 1. **Incompetech** (Kevin MacLeod)
- **URL**: https://incompetech.com/music/royalty-free/
- **License**: CC BY 3.0 (free with attribution)
- **Style**: Wide variety including techno, electronic, retro
- **How to use**: 
  - Search for "techno", "electronic", "retro", "arcade"
  - Download MP3, convert to OGG
  - Place in `bell-game/music/` folder
  - Add attribution in game credits

### 2. **OpenGameArt.org Music**
- **URL**: https://opengameart.org/content/tags/music
- **License**: Various (check per track)
- **Style**: Game music, electronic, chiptune

### 3. **FreePD.com**
- **URL**: https://freepd.com
- **License**: CC0 (public domain)
- **Style**: Various genres

### 4. **Bensound** (Free with attribution)
- **URL**: https://www.bensound.com
- **License**: Free with attribution
- **Style**: Professional quality, various genres

### 5. **YouTube Audio Library**
- **URL**: https://studio.youtube.com/channel/UC/music
- **License**: Free to use (check individual licenses)
- **Style**: Wide variety

## Voice/Speech Synthesis

### 1. **ElevenLabs** (Best Quality - Free Tier)
- **URL**: https://elevenlabs.io
- **Free Tier**: 10,000 characters/month
- **Quality**: Very human-like, can clone voices
- **API**: Yes (requires API key)
- **How to use**: 
  - Sign up for free account
  - Use web interface to generate speech
  - Download as MP3, convert to OGG
  - Or use API for programmatic generation

### 2. **Google Cloud Text-to-Speech** (Free Tier)
- **URL**: https://cloud.google.com/text-to-speech
- **Free Tier**: 0-4 million characters/month (first 4M free)
- **Quality**: Very good, multiple voices
- **API**: Yes (requires API key)
- **How to use**: 
  - Sign up for Google Cloud (free trial)
  - Use API to generate speech
  - Download audio files

### 3. **Azure Cognitive Services TTS** (Free Tier)
- **URL**: https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/
- **Free Tier**: 0-5 million characters/month
- **Quality**: Excellent, neural voices
- **API**: Yes (requires API key)

### 4. **Play.ht** (Free Tier)
- **URL**: https://play.ht
- **Free Tier**: Limited characters
- **Quality**: Good, multiple voices
- **API**: Yes

### 5. **Murf.ai** (Free Trial)
- **URL**: https://murf.ai
- **Free Tier**: 10 minutes of voice generation
- **Quality**: Professional
- **API**: Yes

## Recommended Implementation Strategy

### For Sound Effects:
1. Use **Freesound.org** for most effects
2. Use **Zapsplat** for professional quality effects
3. Download as OGG or convert to OGG format
4. Place in `bell-game/sfx/` folder

### For Music:
1. Use **Incompetech** (Kevin MacLeod) - best for game music
2. Search for: "techno", "electronic", "retro", "arcade", "dubstep"
3. Download, convert to OGG
4. Place in `bell-game/music/` folder
5. Add attribution in game

### For Voices:
1. **Best Option**: Use **ElevenLabs** web interface to generate voice clips
   - Create voice clips for Bell and Einstein
   - Download as MP3, convert to OGG
   - Place in `bell-game/voice/bell/` and `bell-game/voice/einstein/` folders
2. **Alternative**: Use **Google Cloud TTS** or **Azure TTS** via API
   - More technical but allows dynamic generation
   - Better for large amounts of text

## Quick Start Guide

### Step 1: Get Sound Effects
1. Go to https://freesound.org
2. Search for each sound effect needed
3. Download as OGG or convert to OGG
4. Place in `bell-game/sfx/` folder

### Step 2: Get Music
1. Go to https://incompetech.com/music/royalty-free/
2. Search for "techno" or "electronic"
3. Download tracks, convert to OGG
4. Rename and place in `bell-game/music/` folder:
   - `main_theme.ogg`
   - `boss1_neurotransmitter.ogg`
   - `boss2_dna_helix.ogg`
   - etc.

### Step 3: Get Voice Clips
1. Go to https://elevenlabs.io
2. Sign up for free account
3. Use text-to-speech to generate voice clips
4. Download as MP3, convert to OGG
5. Place in `bell-game/voice/bell/` and `bell-game/voice/einstein/` folders

## File Format Requirements
- **Format**: OGG Vorbis (.ogg)
- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit minimum
- **Channels**: Stereo for music, mono acceptable for SFX

## Conversion Tools
- **Audacity**: Free audio editor (can convert formats)
- **Online Converter**: https://convertio.co/audio-converter/
- **FFmpeg**: Command-line tool (advanced)












