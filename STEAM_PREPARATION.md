# Steam Preparation Guide

## Overview

This guide covers preparing SpaceBell packages for Steam distribution.

---

## Steam Requirements

### 1. Steamworks SDK

- Download Steamworks SDK from Steam
- Required for Steam integration
- Provides Steam API for achievements, leaderboards, etc.

### 2. Steam App Configuration

- Create Steam app in Steamworks
- Get App ID
- Configure store page
- Set up achievements (optional)
- Configure leaderboards (optional)

---

## Package Modifications for Steam

### 1. Update forge.config.js

Add Steam-specific settings:

```javascript
{
  // ... existing config
  win: {
    target: [
      {
        target: 'nsis',  // NSIS installer for Steam
        arch: ['x64']
      }
    ],
    // Steam-specific metadata
    publisherName: 'Will\'s-Way-Studios',
    // ... other settings
  }
}
```

### 2. Steam Integration Code

**In main.js**, add Steam initialization:

```javascript
const { app } = require('electron');

// Steam initialization (if Steam is running)
if (process.platform === 'win32') {
  const steamAppId = 'YOUR_STEAM_APP_ID';
  process.env.STEAM_APP_ID = steamAppId;
  
  // Check if running under Steam
  if (process.env.SteamAppId) {
    // Steam-specific initialization
    console.log('Running under Steam');
  }
}
```

### 3. Steam Achievements (Optional)

Create achievement system:

```javascript
// In game.js or separate Steam module
const steamworks = require('steamworks.js'); // If using steamworks.js

function unlockAchievement(achievementId) {
  if (steamworks && steamworks.achievements) {
    steamworks.achievements.activate(achievementId);
  }
}

// Example achievements:
// - 'FIRST_KILL' - Get first kill
// - 'LEVEL_25' - Reach level 25
// - 'BELL_MODE_COMPLETE' - Complete Bell mode
// etc.
```

### 4. Steam Leaderboards (Optional)

Replace local leaderboard with Steam leaderboard:

```javascript
// In game.js
async function submitScore(score, name) {
  if (steamworks && steamworks.leaderboards) {
    await steamworks.leaderboards.uploadScore('HIGH_SCORES', score);
  } else {
    // Fallback to local leaderboard
    await saveLeaderboardLocal(score, name);
  }
}
```

---

## Build Process for Steam

### 1. Build Package

```bash
cd "C:\Full Backup Bell\bell-game"
npm run make
```

### 2. Prepare Steam Build

Steam typically requires:
- **Windows**: `.exe` installer or portable build
- **Linux**: AppImage, deb, or tar.gz
- **macOS**: `.dmg` or `.app`

### 3. Upload to Steam

1. **Steamworks Partner Portal**
   - Log in to Steamworks
   - Navigate to your app
   - Go to "Installation" tab

2. **Upload Build**
   - Use Steam Pipe (Steam's upload tool)
   - Or upload installer directly
   - Set build description
   - Configure depots

3. **Configure Depots**
   - Create depots for different platforms
   - Set installation directories
   - Configure file mappings

---

## Steam-Specific Considerations

### 1. DRM (Optional)

Steam provides Steam DRM:
- Can be enabled in Steamworks
- Protects executable
- Optional for Electron apps

### 2. Steam Overlay

- Works automatically with Electron
- Users can access Steam features in-game
- Screenshots, friends, etc.

### 3. Steam Cloud (Optional)

For save data sync:

```javascript
// In main.js
const steamworks = require('steamworks.js');

async function saveToSteamCloud(data) {
  if (steamworks && steamworks.cloud) {
    await steamworks.cloud.writeFile('savegame.json', JSON.stringify(data));
  }
}

async function loadFromSteamCloud() {
  if (steamworks && steamworks.cloud) {
    const data = await steamworks.cloud.readFile('savegame.json');
    return JSON.parse(data);
  }
  return null;
}
```

### 4. Steam Input (Optional)

For controller support:
- Steam Input API
- Better controller support
- Controller configuration

---

## Testing on Steam

### 1. Steam Test Account

- Create test account
- Add to beta testers
- Test installation and launch

### 2. Local Testing

- Install Steam client
- Add non-Steam game (for testing)
- Or use Steam's testing tools

### 3. Beta Testing

- Set up beta branch in Steamworks
- Invite beta testers
- Collect feedback
- Fix issues before release

---

## Store Page Setup

### Required Assets

- **Header Image**: 460x215px
- **Main Capsule**: 616x353px
- **Small Capsule**: 231x87px
- **Page Background**: 1920x1080px
- **Logo**: 512x512px
- **Screenshots**: 1920x1080px (at least 5)
- **Trailer Video**: MP4 format

### Store Description

- Game description
- Features list
- System requirements
- Release date
- Pricing

---

## System Requirements

### Minimum Requirements

- **OS**: Windows 10 (64-bit)
- **Processor**: Intel Core i3 or equivalent
- **Memory**: 4 GB RAM
- **Graphics**: DirectX 11 compatible
- **Storage**: 500 MB available space
- **Network**: Internet connection (for leaderboards)

### Recommended Requirements

- **OS**: Windows 11 (64-bit)
- **Processor**: Intel Core i5 or equivalent
- **Memory**: 8 GB RAM
- **Graphics**: DirectX 12 compatible
- **Storage**: 1 GB available space

---

## Pricing and Release

### Pricing Strategy

- Set base price
- Configure regional pricing
- Set up discounts/sales
- Configure bundles (if applicable)

### Release Process

1. **Prepare Release Build**
   - Final testing
   - All features complete
   - No critical bugs

2. **Submit for Review**
   - Steam reviews all games
   - Can take several days
   - May request changes

3. **Set Release Date**
   - Choose release date
   - Can be immediate or scheduled
   - Consider marketing timing

4. **Launch**
   - Release goes live
   - Monitor for issues
   - Respond to user feedback

---

## Post-Release Updates

### Updating on Steam

1. **Build New Version**
   - Follow update process (see `UPDATING_PACKAGES.md`)
   - Increment version number

2. **Upload to Steam**
   - Upload new build via Steamworks
   - Set as default build
   - Steam auto-updates for users

3. **Release Notes**
   - Document changes
   - Post in Steam community
   - Update store page if needed

---

## Resources

- **Steamworks Documentation**: https://partner.steamgames.com/doc/home
- **Steam API Reference**: https://partner.steamgames.com/doc/api
- **Steam Community**: https://steamcommunity.com/

---

## Notes

- Steam integration is optional
- Game can work without Steam features
- Local leaderboard can remain as fallback
- Consider Steam features as enhancements, not requirements

---

## Checklist

Before Steam submission:
- [ ] Steamworks SDK integrated (if using Steam features)
- [ ] App ID configured
- [ ] Store page assets prepared
- [ ] System requirements documented
- [ ] Build tested on Steam
- [ ] Achievements configured (if using)
- [ ] Leaderboards configured (if using)
- [ ] Cloud saves configured (if using)
- [ ] Pricing set
- [ ] Release date chosen
- [ ] Beta testing completed
- [ ] All bugs fixed
- [ ] Ready for review


