# How to Convert Audio Files to OGG Format

## Quick Methods

### Method 1: Online Converter (Easiest - No Installation)
1. Go to: **https://convertio.co/audio-converter/**
2. Click "Choose Files" and select your audio file from Downloads
3. Select **OGG** as the output format
4. Click "Convert"
5. Download the converted file
6. Rename it (e.g., `main_theme.ogg`) and place in `bell-game/music/` folder

### Method 2: Audacity (Free Software - Best Quality)
1. Download Audacity: **https://www.audacityteam.org/download/**
2. Install Audacity
3. Open Audacity
4. File → Open → Select your audio file from Downloads
5. File → Export → Export as OGG
6. Choose settings:
   - Format: OGG Vorbis
   - Quality: 5 (good balance)
7. Save to `bell-game/music/` folder with appropriate name

### Method 3: FFmpeg (Command Line - Fast)
1. Install FFmpeg:
   - Download from: **https://ffmpeg.org/download.html**
   - Or use: `winget install ffmpeg` in PowerShell
2. Open PowerShell in the bell-game folder
3. Run:
   ```powershell
   ffmpeg -i "C:\Users\Limin\Downloads\your_file.mp3" -acodec libvorbis -q:a 5 "music\main_theme.ogg"
   ```
   (Replace `your_file.mp3` with your actual filename)

### Method 4: Using the Converter Script
1. Make sure you have Node.js installed
2. Run:
   ```powershell
   node convert_audio.js "C:\Users\Limin\Downloads\your_file.mp3" "music\main_theme.ogg"
   ```

## File Naming
After converting, name your files:
- `main_theme.ogg` - Main gameplay music
- `boss1_neurotransmitter.ogg` - Boss 1 music
- `boss2_dna_helix.ogg` - Boss 2 music
- etc.

## Recommended Settings
- **Format**: OGG Vorbis
- **Quality**: 5 (good balance of quality and file size)
- **Sample Rate**: 44.1 kHz (or keep original)
- **Channels**: Stereo for music, Mono acceptable for SFX












