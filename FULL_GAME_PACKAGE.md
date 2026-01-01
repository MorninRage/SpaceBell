# Full Game Package Documentation

## Package Details

- **Name**: SpaceBell
- **Location**: `C:\Full Backup Bell\bell-game`
- **Executable**: `spacebell.exe`
- **Installer**: `SpaceBell-Setup.exe`
- **App ID**: `com.spacebellgames.spacebell`
- **User Data Path**: `%APPDATA%\spacebell`

---

## Configuration Files

### forge.config.js

```javascript
{
  name: "SpaceBell",
  executableName: "spacebell",
  setupExe: "SpaceBell-Setup.exe",
  appId: "com.spacebellgames.spacebell",
  // ... other config
}
```

### package.json

```json
{
  "name": "spacebell",
  "productName": "SpaceBell",
  "version": "1.0.0",
  "description": "SpaceBell: Space Shooter - Ensemble vs Individual Systems",
  "main": "src/main/main.js"
}
```

---

## Key Features

### 1. Complete Game
- All levels (no level cap)
- All game modes (Bell, Ensemble, Individual)
- Full progression system
- All cutscenes and endings

### 2. Persistent Storage
- Leaderboard: `%APPDATA%\spacebell\leaderboard.json`
- Cosmetics: `%APPDATA%\spacebell\cosmetics.json`
- Player Name: `%APPDATA%\spacebell\playerName.json`

### 3. Pre-shaded Sprite Rendering
- Performance optimization system
- Pre-renders bullet sprites at startup
- Shows preload progress UI
- Caches sprites for reuse

### 4. Name Handling
- Name can be entered in settings menu
- Name can be entered via 'L' key (leaderboard)
- Name required on death screen if not set
- Name persists between sessions

---

## Build Process

1. **Prepare Files**
   - Ensure all game files are in place
   - Verify `index.html` (not `index-dev.html`)
   - Check that server folder exists

2. **Build Command**
   ```bash
   cd "C:\Full Backup Bell\bell-game"
   npm run make
   ```

3. **Output Location**
   ```
   out/make/squirrel.windows/x64/SpaceBell-Setup.exe
   ```

4. **Installer Details**
   - Silent installer (no UI)
   - Installs to `%LOCALAPPDATA%\spacebell`
   - Creates desktop and Start Menu shortcuts
   - Uninstaller included

---

## Testing Checklist

- [ ] Installer runs without errors
- [ ] Desktop shortcut created with correct icon
- [ ] Start Menu shortcut created
- [ ] Game launches successfully
- [ ] Fullscreen mode hides menu bar
- [ ] Leaderboard saves and loads
- [ ] Neurokeys persist between sessions
- [ ] Store purchases persist
- [ ] Player name saves and loads
- [ ] Name input works in settings
- [ ] Name input works on death screen
- [ ] Pre-shaded sprite system loads
- [ ] All game modes work
- [ ] All levels accessible
- [ ] Server runs locally

---

## File Modifications for Packaging

### game.js Changes
- Replaced "Beyond Bell" with "SpaceBell"
- Updated storage functions to use `electronAPI`
- Made storage functions `async`
- Added pre-shaded sprite rendering system
- Enhanced name handling logic

### main.js Changes
- Updated application name
- Implemented shortcut creation (VBS scripts)
- Added fullscreen menu bar hiding
- Implemented IPC handlers for storage
- Set user data path to `spacebell`

### index.html Changes
- Updated title to "SpaceBell"
- Added preload overlay UI
- Added player name input ID for settings

---

## Distribution

### For Website
- Copy installer to website's `public/downloads/` folder
- Update download link on website
- File: `SpaceBell-Setup.exe`

### For Steam
- See `STEAM_PREPARATION.md`
- May need additional Steam-specific configurations
- Consider Steam achievements integration

---

## Troubleshooting

### Installer Issues
- **Antivirus warnings**: Expected for unsigned installers
- **Installation fails**: Check if previous version is running
- **Shortcuts not created**: Check VBS script execution permissions

### Runtime Issues
- **Game won't start**: Check console for errors
- **Storage not working**: Verify IPC handlers in main.js
- **Server not running**: Check server folder is included

### Performance Issues
- **Slow startup**: Pre-shaded sprite system may be loading
- **High memory**: Check for memory leaks in game loop
- **Lag**: Verify ASAR packaging is enabled

---

## Version History

- **v1.0.0** - Initial packaged release
  - Full game with all features
  - Persistent storage implemented
  - Pre-shaded sprite system
  - Name handling system


