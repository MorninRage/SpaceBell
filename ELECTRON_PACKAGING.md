# Electron Packaging Documentation

## Overview

SpaceBell is packaged as an Electron application for Windows distribution. We created two separate packages:
1. **Full Game** - Complete game with all levels
2. **Demo** - Limited to level 25 with ending cutscene

Both packages use Electron Forge with Squirrel installer for Windows.

---

## Technology Stack

- **Electron Forge** - Build and packaging tool
- **Squirrel.Windows** - Windows installer (creates `.exe` installer)
- **Node.js** - Runtime environment
- **ASAR** - Archive format for packaging app files

---

## Package Locations

- **Full Game**: `C:\Full Backup Bell\bell-game`
- **Demo**: `C:\DEMO`

---

## Key Components

### 1. Main Process (`src/main/main.js`)
- Creates Electron window
- Handles application lifecycle
- Manages persistent storage (AppData)
- Creates desktop/Start Menu shortcuts
- Hides menu bar in fullscreen mode

### 2. Preload Script (`src/preload/preload.js`)
- Securely exposes Node.js APIs to renderer
- Provides `electronAPI` for file system access

### 3. Game Files
- `game.js` - Core game logic
- `index.html` - Main game HTML
- `server/` - Local leaderboard server
- `music/`, `sfx/` - Audio assets
- All game assets and resources

---

## Build Configuration

### forge.config.js

Key settings:
- **Application Name**: "SpaceBell" (full) / "SpaceBell Demo" (demo)
- **Executable Name**: `spacebell.exe` / `spacebelldemo.exe`
- **App ID**: `com.spacebellgames.spacebell` / `com.spacebellgames.spacebelldemo`
- **ASAR Packaging**: Enabled (app files archived)
- **Extra Resources**: `music/`, `sfx/`, `server/` (not archived, accessible via path)

### Package.json

- **Product Name**: Display name
- **Version**: Semantic versioning (e.g., `1.0.0`)
- **Build Scripts**: `npm run make` (creates installer)

---

## Installation Process

### What Gets Installed

1. **Application Files**
   - Location: `%LOCALAPPDATA%\spacebell` (full) / `%LOCALAPPDATA%\spacebell-demo` (demo)
   - Includes: All game files, server, assets

2. **Shortcuts**
   - Desktop shortcut (with game icon)
   - Start Menu shortcut
   - Created automatically on first launch

3. **Persistent Storage**
   - Location: `%APPDATA%\spacebell` (full) / `%APPDATA%\spacebell-demo` (demo)
   - Stores: Leaderboard, Neurokeys, store purchases, player name

---

## Features Implemented

### 1. Persistent Storage
- Leaderboard saves between sessions
- Neurokeys currency persists
- Store purchases (cosmetics) saved
- Player name saved
- Uses Node.js `fs` module via IPC

### 2. Fullscreen Mode
- Menu bar automatically hidden when entering fullscreen (F11)
- Menu bar restored when exiting fullscreen

### 3. Icon System
- Application icon embedded in executable
- Desktop shortcut uses executable icon
- Icons generated from game graphics

### 4. Local Server
- Leaderboard server included in package
- Runs locally for current implementation
- Ready for global server integration

---

## Build Commands

### Full Game
```bash
cd "C:\Full Backup Bell\bell-game"
npm run make
```

Output: `out/make/squirrel.windows/x64/SpaceBell-Setup.exe`

### Demo
```bash
cd "C:\DEMO"
npm run make
```

Output: `out/make/squirrel.windows/x64/SpaceBell-Demo-Setup.exe`

---

## File Structure

```
package-root/
├── src/
│   ├── main/
│   │   └── main.js          # Main Electron process
│   └── preload/
│       └── preload.js       # Preload script
├── game.js                  # Game logic
├── index.html               # Main HTML
├── server/                  # Leaderboard server
├── music/                     # Music files
├── sfx/                      # Sound effects
├── assets/                   # Game assets
├── forge.config.js          # Electron Forge config
└── package.json             # Project metadata
```

---

## Excluded Files

The following are NOT included in the package:
- `index-dev.html` - Development HTML
- `*.md` - Documentation files
- `download.js` - Download functionality
- `beyond-bell-offline.zip` - Offline package
- `package_offline.ps1` - Packaging script
- `convert_audio.js` - Audio conversion
- `start_server.bat` / `start_server.ps1` - Server scripts
- `.git/` - Version control
- `node_modules/` - Dependencies (installed during build)

---

## Next Steps

See:
- `FULL_GAME_PACKAGE.md` - Full game specific details
- `DEMO_PACKAGE.md` - Demo specific details
- `UPDATING_PACKAGES.md` - How to update packages
- `STEAM_PREPARATION.md` - Preparing for Steam


