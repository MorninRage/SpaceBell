# Demo Package Documentation

## Package Details

- **Name**: SpaceBell Demo
- **Location**: `C:\DEMO`
- **Executable**: `spacebelldemo.exe`
- **Installer**: `SpaceBell-Demo-Setup.exe`
- **App ID**: `com.spacebellgames.spacebelldemo`
- **User Data Path**: `%APPDATA%\spacebell-demo`

---

## Configuration Files

### forge.config.js

```javascript
{
  name: "SpaceBell Demo",
  executableName: "spacebelldemo",
  setupExe: "SpaceBell-Demo-Setup.exe",
  appId: "com.spacebellgames.spacebelldemo",
  // ... other config
}
```

### package.json

```json
{
  "name": "spacebell-demo",
  "productName": "SpaceBell Demo",
  "version": "1.0.0",
  "description": "SpaceBell Demo: Space Shooter - Ensemble vs Individual Systems (Playtest)",
  "main": "src/main/main.js"
}
```

---

## Key Differences from Full Game

### 1. Level Cap
- **Demo**: Levels 1-25 only
- **Full Game**: All levels (no cap)
- Level 25 includes ending cutscene

### 2. Separate Storage
- Uses `spacebell-demo` folder in AppData
- Prevents conflicts with full game
- Separate leaderboard, currency, purchases

### 3. Demo-Specific Features
- Ending cutscene at level 25
- "Playtest Version" branding
- Same features as full game (up to level 25)

### 4. Identical Features (Limited Scope)
- All game modes work (up to level 25)
- Persistent storage (separate location)
- Pre-shaded sprite rendering system
- Name handling system
- Local leaderboard server

---

## Build Process

1. **Prepare Files**
   - Ensure demo game files are in place
   - Verify level 25 cap is set in `game.js`
   - Check ending cutscene is included

2. **Build Command**
   ```bash
   cd "C:\DEMO"
   npm run make
   ```

3. **Output Location**
   ```
   out/make/squirrel.windows/x64/SpaceBell-Demo-Setup.exe
   ```

4. **Installer Details**
   - Silent installer (no UI)
   - Installs to `%LOCALAPPDATA%\spacebell-demo`
   - Creates desktop and Start Menu shortcuts
   - Uninstaller included

---

## Demo Limitations

### Level Restrictions
- Game ends at level 25
- Ending cutscene plays
- Cannot progress beyond level 25
- All features work within level 1-25

### Storage Isolation
- Demo and full game have separate:
  - Leaderboards
  - Neurokeys
  - Store purchases
  - Player names
- Installing both won't conflict

---

## Testing Checklist

- [ ] Installer runs without errors
- [ ] Desktop shortcut created with correct icon
- [ ] Start Menu shortcut created
- [ ] Game launches successfully
- [ ] Level 25 cap enforced
- [ ] Ending cutscene plays at level 25
- [ ] Cannot progress beyond level 25
- [ ] Fullscreen mode hides menu bar
- [ ] Leaderboard saves and loads (separate from full game)
- [ ] Neurokeys persist between sessions
- [ ] Store purchases persist
- [ ] Player name saves and loads
- [ ] Name input works in settings
- [ ] Name input works on death screen
- [ ] Pre-shaded sprite system loads
- [ ] All game modes work (up to level 25)
- [ ] Server runs locally

---

## File Modifications for Demo

### game.js Changes
- Level cap set to 25
- Ending cutscene at level 25
- All other features identical to full game

### main.js Changes
- User data path set to `spacebell-demo`
- Application name set to "SpaceBell Demo"
- Shortcut names updated

### forge.config.js Changes
- Package name: "SpaceBell Demo"
- Executable name: `spacebelldemo`
- Setup exe: `SpaceBell-Demo-Setup.exe`
- App ID: `com.spacebellgames.spacebelldemo`

---

## Distribution

### For Website
- Copy installer to website's `public/downloads/` folder
- File: `SpaceBell-Demo-Setup.exe`
- Download link: `/downloads/SpaceBell-Demo-Setup.exe`
- File size: ~123 MB

### Website Integration
- Demo page at `/demo`
- Download button links to installer
- Installation instructions included
- Antivirus warning explanation

---

## Troubleshooting

### Installer Issues
- **Antivirus warnings**: Expected for unsigned installers
- **Installation fails**: Check if previous version is running
- **Shortcuts not created**: Check VBS script execution permissions

### Runtime Issues
- **Game won't start**: Check console for errors
- **Level 25 not enforced**: Verify level cap in game.js
- **Storage conflicts**: Ensure using `spacebell-demo` folder

### Demo-Specific Issues
- **Can progress past level 25**: Check level cap logic
- **Ending cutscene not playing**: Verify cutscene code
- **Full game data showing**: Check user data path

---

## Version History

- **v1.0.0** - Initial demo release
  - Level 1-25 gameplay
  - Ending cutscene
  - Separate storage location
  - All features working (limited scope)


