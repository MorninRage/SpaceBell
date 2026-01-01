# Updating Packaged Versions

## Overview

This guide explains how to update the packaged Electron applications (Full Game and Demo) after making changes to the game code.

---

## Update Process

### Step 1: Make Your Changes

1. **Edit Game Files**
   - Modify `game.js` for game logic changes
   - Update `index.html` for UI changes
   - Change assets in respective folders
   - Update server code if needed

2. **Test Changes Locally**
   - Run the game in development mode
   - Test all affected features
   - Verify no breaking changes

### Step 2: Update Version Number

**Full Game** (`C:\Full Backup Bell\bell-game\package.json`):
```json
{
  "version": "1.0.1"  // Increment version
}
```

**Demo** (`C:\DEMO\package.json`):
```json
{
  "version": "1.0.1"  // Increment version
}
```

**Also update in forge.config.js**:
```javascript
win32metadata: {
  FileVersion: "1.0.1.0",
  ProductVersion: "1.0.1.0"
}
```

### Step 3: Rebuild Package

**Full Game**:
```bash
cd "C:\Full Backup Bell\bell-game"
npm run make
```

**Demo**:
```bash
cd "C:\DEMO"
npm run make
```

### Step 4: Test New Installer

1. **Uninstall Previous Version**
   - Use Windows "Add or Remove Programs"
   - Or delete `%LOCALAPPDATA%\spacebell` (full) / `spacebell-demo` (demo)

2. **Install New Version**
   - Run the new installer
   - Verify installation works
   - Test all features

3. **Verify Updates**
   - Check version number in game
   - Test changed features
   - Ensure persistent data still works

### Step 5: Distribute Update

**For Website**:
1. Copy new installer to `C:\SpaceBell.games\website\public\downloads\`
2. Replace old installer file
3. Rebuild website: `npm run build`
4. Deploy updated website

**For Steam**:
- See `STEAM_PREPARATION.md`
- Follow Steam update procedures

---

## Update Scenarios

### Scenario 1: Game Logic Changes

**Example**: Adding new weapon, fixing bug, balancing

**Steps**:
1. Edit `game.js`
2. Test locally
3. Update version
4. Rebuild package
5. Test installer
6. Distribute

**Files Changed**: `game.js`, `package.json`, `forge.config.js`

### Scenario 2: UI Changes

**Example**: New menu, updated HUD, visual improvements

**Steps**:
1. Edit `index.html` and/or CSS
2. Test locally
3. Update version
4. Rebuild package
5. Test installer
6. Distribute

**Files Changed**: `index.html`, CSS files, `package.json`, `forge.config.js`

### Scenario 3: Asset Updates

**Example**: New music, sound effects, graphics

**Steps**:
1. Add/replace files in `music/`, `sfx/`, `assets/`
2. Test locally
3. Update version
4. Rebuild package (assets included automatically)
5. Test installer
6. Distribute

**Files Changed**: Asset files, `package.json`, `forge.config.js`

### Scenario 4: Server Updates

**Example**: Leaderboard changes, new API endpoints

**Steps**:
1. Edit files in `server/` folder
2. Test locally
3. Update version
4. Rebuild package (server included as extraResource)
5. Test installer
6. Distribute

**Files Changed**: Server files, `package.json`, `forge.config.js`

### Scenario 5: Electron/Configuration Changes

**Example**: New Electron features, config updates

**Steps**:
1. Edit `main.js`, `preload.js`, or `forge.config.js`
2. Test locally
3. Update version
4. Rebuild package
5. Test installer thoroughly
6. Distribute

**Files Changed**: Electron files, `package.json`, `forge.config.js`

---

## Version Numbering

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backwards compatible (e.g., 1.0.0 → 1.0.1)

### Examples

- `1.0.0` → `1.0.1` - Bug fix
- `1.0.1` → `1.1.0` - New feature
- `1.1.0` → `2.0.0` - Breaking change

---

## Preserving User Data

### Important Notes

- **User data is preserved** when updating
- Data stored in `%APPDATA%\spacebell` (full) or `spacebell-demo` (demo)
- Uninstalling does NOT delete user data (by design)
- Users keep: leaderboard, Neurokeys, purchases, name

### Data Migration (if needed)

If you need to migrate data format:

1. **Check for old format** in load functions
2. **Convert to new format** if detected
3. **Save in new format**
4. **Test migration** with old data

Example in `game.js`:
```javascript
async loadLeaderboardLocal() {
  const data = await electronAPI.loadGameData('leaderboard.json');
  if (data && data.version === '1.0.0') {
    // Migrate old format
    return migrateLeaderboard(data);
  }
  return data || [];
}
```

---

## Testing Updates

### Pre-Release Checklist

- [ ] Version number updated
- [ ] All changes tested locally
- [ ] New installer builds successfully
- [ ] Installer installs correctly
- [ ] Game launches without errors
- [ ] All features work as expected
- [ ] Persistent data loads correctly
- [ ] No regressions in existing features
- [ ] Fullscreen mode works
- [ ] Shortcuts created correctly

### Post-Release Checklist

- [ ] Update website with new installer
- [ ] Update download links
- [ ] Test download from website
- [ ] Monitor for user issues
- [ ] Document changes in release notes

---

## Rollback Procedure

If an update has issues:

1. **Identify the problem**
2. **Revert code changes** (if in git)
3. **Rebuild previous version**
4. **Distribute previous installer**
5. **Notify users** if needed

---

## Automation (Future)

Consider automating updates with:
- **Electron Auto Updater** - Electron's built-in update system
- **Custom update server** - Host update manifests
- **Steam Workshop** - For Steam distribution

See Electron documentation for auto-updater implementation.

---

## Best Practices

1. **Always increment version** before building
2. **Test thoroughly** before distribution
3. **Keep changelog** of updates
4. **Backup previous installers** for rollback
5. **Document breaking changes** clearly
6. **Test on clean install** (not just update)
7. **Verify persistent data** after updates

---

## Common Issues

### Issue: Users don't see update

**Solution**: Ensure version number is incremented and installer is replaced

### Issue: Update breaks user data

**Solution**: Implement data migration in load functions

### Issue: Update doesn't install

**Solution**: Users may need to uninstall previous version first

### Issue: Shortcuts not updated

**Solution**: Shortcuts are recreated on first launch after install


