# SpaceBell Documentation

This directory contains comprehensive documentation for:
- Electron game packaging (Full Game & Demo)
- Website design and deployment
- Game intro and interactive features
- Update procedures
- Game development guides

## Documentation Structure

1. **Electron Packaging**
   - `ELECTRON_PACKAGING.md` - Overview and setup
   - `FULL_GAME_PACKAGE.md` - Full game packaging details
   - `DEMO_PACKAGE.md` - Demo packaging details
   - `UPDATING_PACKAGES.md` - How to update packaged versions

2. **Website**
   - `WEBSITE_DESIGN.md` - Website architecture and design
   - `WEBSITE_UPDATES.md` - How to update the website
   - `NETLIFY_DEPLOYMENT.md` - Netlify deployment guide and troubleshooting (includes MCP and CLI deployment)
   - `INTERACTIVE_LOGO.md` - Interactive SpaceBell logo documentation (how it works on website)

3. **Game Intro**
   - `GAME_INTRO.md` - New intro sequence documentation (Will's-Way-Studios + SpaceBell interactive phases)
   
4. **Game Balance & Progression**
   - `GAME_BALANCE_UPDATES.md` - Level requirements, ship speeds, UI improvements, and progression updates

4. **Steam Deployment**
   - `STEAM_PREPARATION.md` - Preparing packages for Steam

5. **Game Development** (from bell-game directory)
   - `START_HERE.md` - Quick start guide for game development
   - `ARCHITECTURE.md` - Game architecture overview
   - `audio_implementation_guide.md` - Audio system implementation
   - `audio_resources.md` - Audio resource management
   - `audio_setup.md` - Audio setup instructions
   - `BALANCE_ANALYSIS.md` - Game balance analysis
   - `convert_audio.md` - Audio conversion guide
   - `CRAFTING_REVIEW.md` - Crafting system review
   - `GAME_STATS_REFERENCE.md` - Game statistics reference
   - `OFFLINE_DOWNLOAD.md` - Offline download functionality
   - `OPTIMIZATION_OPPORTUNITIES.md` - Performance optimization opportunities
   - `OPTIMIZATION_STATUS.md` - Current optimization status
   - `PERFORMANCE_ANALYSIS.md` - Performance analysis
   - `readme.md` - Game readme (original from bell-game)
   - `readme_audio.md` - Audio readme
   - `STAT_APPLICATION_REVIEW.md` - Stat application system review

---

## Quick Links

- [Full Game Package Location](../Full Backup Bell/bell-game)
- [Demo Package Location](../DEMO)
- [Website Location](../SpaceBell.games/website)
- [Website Build Output](C:\SpaceBell.games\website\out)

---

## Recent Updates (December 28, 2025)

### New Documentation
- **INTERACTIVE_LOGO.md**: Complete documentation of the interactive SpaceBell logo on the website
  - How shooting mechanics work
  - Letter structure and unique IDs (e1, e2, l1, l2)
  - Visual states and color themes
  - Technical implementation details
  - Comparison with game intro implementation

- **GAME_INTRO.md**: Documentation of the new two-phase intro sequence
  - Will's-Way-Studios logo phase (8 seconds)
  - SpaceBell interactive logo phase (shoot all letters)
  - Shooting mechanics and completion detection
  - Technical implementation
  - Code locations and troubleshooting

### Website Updates
- **Branding**: Changed from "Sci-HyG" to "Sci-Hy" throughout
- **Shooting Mechanics**: Fixed continuous shooting bug, set rate limit to 1.5 seconds
- **Color Themes**: Switched Ensemble (orange/amber) and Individual (cyan/blue) mode colors to match game
- **Icons**: Updated homepage icon colors to match new themes
- **Pioneering Message**: Added emphasis that SpaceBell is the first Sci-Hy game
- **Comment Form**: Added Netlify Forms comment form on homepage
- **Interactive Logo**: Implemented shootable letters with unique IDs (e1, e2, l1, l2) for duplicate letters
  - Each letter must be shot individually
  - Ring effects on hit
  - Color themes match game modes

### Game Updates
- **New Intro**: Two-phase intro sequence with puzzle system
  - Phase 0: Will's-Way-Studios animated logo with interactive shooting and physics
    - Default duration: 8 seconds (extends with puzzle solving)
    - Puzzle system: 32 hidden sequences that extend time limits
    - Physics-based logo movement when shot
    - Impact effects: particles, shockwaves, glow
  - Phase 1: SpaceBell interactive logo (shoot all 9 letters to proceed)
- **Ship Cursor**: Ship replaces mouse cursor throughout intro
- **Letter Separation**: Duplicate letters (e's and l's) now use unique IDs for independent tracking
- **Shooting**: Reduced cooldown to 0.1s for better responsiveness
- **Completion**: Automatic transition when all letters are lit
- **Preshader Timing**: Preshader rendering happens in background during Phase 0/1, not after
- **Locations**: 
  - `C:\Full Backup Bell\bell-game\game.js` (Primary development version)
  - `C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\game.js` (Ensemble model version)

### Key Features
- Ship cursor with shooting mechanics (1 bullet every 1.5 seconds on website, 0.1s in game intro)
- Mode-specific color themes matching game
- Netlify Forms integration for user feedback
- Pioneering Sci-Hy genre messaging
- Interactive logo on both website and game intro
- Unique letter IDs ensure each letter is tracked independently

---

## Netlify Deployment

### Quick Reference

**Deploy via CLI** (Recommended for large sites):
```bash
cd "C:\SpaceBell.games\website"
npm run build
netlify deploy --dir=out --prod
```

**Site IDs**:
- SpaceBell.games: `54f5facd-e9b3-46f8-91dd-6828f5d54a65`
- Willswaystudios.com: `01de1272-3190-4f16-923a-4274c99ef4a9`

**Link Site**:
```bash
netlify link --id <site-id>
```

See `NETLIFY_DEPLOYMENT.md` for complete deployment guide including:
- MCP deployment options
- CLI setup and usage
- Troubleshooting
- Best practices

---

## Documentation by Topic

### Getting Started
- `START_HERE.md` - Game development quick start
- `WEBSITE_DESIGN.md` - Website overview

### Deployment
- `NETLIFY_DEPLOYMENT.md` - Netlify deployment (MCP and CLI)
- `ELECTRON_PACKAGING.md` - Game packaging
- `STEAM_PREPARATION.md` - Steam deployment

### Features
- `INTERACTIVE_LOGO.md` - Interactive logo mechanics
- `GAME_INTRO.md` - Intro sequence implementation
- `WEBSITE_DESIGN.md` - Website features

### Development
- `ARCHITECTURE.md` - Game architecture
- `audio_implementation_guide.md` - Audio system
- `PERFORMANCE_ANALYSIS.md` - Performance optimization
- `BALANCE_ANALYSIS.md` - Game balance

### Updates
- `WEBSITE_UPDATES.md` - Website update procedures
- `UPDATING_PACKAGES.md` - Package update procedures

---

## File Locations Reference

### SpaceBell.games Website
- **Source**: `C:\SpaceBell.games\website`
- **Build Output**: `C:\SpaceBell.games\website\out`
- **Config**: `C:\SpaceBell.games\website\netlify.toml`
- **Netlify Site ID**: `54f5facd-e9b3-46f8-91dd-6828f5d54a65`
- **URL**: https://spacebell.games

### Willswaystudios Website
- **Source**: `C:\Users\Limin\willswaystudios-website`
- **Build Output**: `C:\Users\Limin\willswaystudios-website\out`
- **Config**: `C:\Users\Limin\willswaystudios-website\netlify.toml`
- **Netlify Site ID**: `01de1272-3190-4f16-923a-4274c99ef4a9`
- **URL**: https://willswaystudios.com

### Game Source
- **Full Game (Primary)**: `C:\Full Backup Bell\bell-game`
  - **Game File**: `C:\Full Backup Bell\bell-game\game.js`
  - **Game HTML**: `C:\Full Backup Bell\bell-game\index.html`
- **Ensemble Model Version**: `C:\Users\Limin\bell_ensemble_model\bell-game\bell-game`
  - **Game File**: `C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\game.js`
  - **Game HTML**: `C:\Users\Limin\bell_ensemble_model\bell-game\bell-game\index.html`

### Demo Installer
- **Source**: `C:\SpaceBell.games\website\public\downloads\SpaceBell-Demo-Setup.exe`
- **Deployed**: `https://spacebell.games/downloads/SpaceBell-Demo-Setup.exe`
- **Size**: ~123 MB

---

*Last Updated: December 29, 2025*
*All documentation consolidated in C:\Docs*

## Latest Updates (December 29, 2025)

### Game Balance & Progression Updates
- **Weapon Requirements**: Spread weapon moved to Level 40 (from Level 20)
- **Ship Speeds**: individualStabilizer (400 base/1000 max), completeDescriptionVessel (500 base/1100 max)
- **Ship Unlock Levels**: tank (Level 2), fast (Level 3), agile (Level 4)
- **Shield Requirements**: basic (Level 1), reinforced (Level 5), quantum (Level 20)
- **Upgrade Requirements**: autoCollector now requires Level 70
- **Crafting UI**: All items now ordered by unlock level for better progression clarity
- **Cursor Visibility**: Fixed cursor visibility in menus and scrollbars
- **Intro Skip Prevention**: Phase 0 and Phase 1 of new intro cannot be skipped
- **See**: `GAME_BALANCE_UPDATES.md` for complete details

## Latest Updates (December 29, 2025)

### Intro System Enhancements
- **Puzzle System**: Added 32 hidden puzzle sequences to Phase 0
  - Puzzles extend time limits when solved
  - Sequential solving required (must solve in order 1-32)
  - Timer resets when each puzzle is solved
  - Visual feedback with success messages
- **Direction Detection**: Lenient diagonal detection (30% threshold for vertical/horizontal classification)
- **Preshader Timing**: Clarified that preshader rendering happens during Phase 0/1, not after
- **Multi-Location Support**: Intro system now implemented in both primary and ensemble model versions
