# Netlify Deployment Guide

## Overview

This document details the Netlify deployment process for both SpaceBell.games and Willswaystudios websites, including troubleshooting deployment issues and using Netlify CLI for efficient deployments.

---

## Table of Contents

1. [Initial Deployment Issue](#initial-deployment-issue)
2. [Solution: Netlify CLI Deployment](#solution-netlify-cli-deployment)
3. [SpaceBell.games Deployment](#spacebellgames-deployment)
4. [Willswaystudios Website Updates](#willswaystudios-website-updates)
5. [Netlify CLI Setup](#netlify-cli-setup)
6. [Deployment Workflow](#deployment-workflow)
7. [Troubleshooting](#troubleshooting)

---

## Initial Deployment Issue

### Problem

When attempting to deploy the SpaceBell.games website via drag-and-drop to Netlify:
- **Deployment size**: ~124.6 MB (130,675,496 bytes)
- **File count**: 108 files
- **Deployment method**: Drag and drop `out/` folder
- **Issue**: Deployment stuck at 65+ minutes, not completing

### Root Cause Analysis

1. **Size Limit**: Netlify recommends drag-and-drop deployments be under **50MB**
   - Our site was **2.5x larger** than recommended
   - Large sites cause prolonged upload times and potential timeouts

2. **Deployment Method Limitations**:
   - Drag-and-drop is slower for large uploads
   - Browser-based uploads can timeout
   - No progress feedback or error handling

3. **Missing Configuration**:
   - SpaceBell.games site was missing `netlify.toml` configuration file
   - Working site (willswaystudios) had proper configuration

### Comparison: Working vs. Problematic Site

| Site | Files | Size | netlify.toml | Status |
|------|-------|------|--------------|--------|
| **willswaystudios** | 71 files | ~844 MB | ✅ Present | Working |
| **spacebell.games** | 108 files | ~124.6 MB | ❌ Missing | Stuck |

---

## Solution: Netlify CLI Deployment

### Why Netlify CLI?

1. **Faster**: Completed in **1m 16s** vs. 65+ minutes (stuck)
2. **More Reliable**: Better error handling and progress feedback
3. **Recommended**: Netlify's official method for large sites
4. **Efficient**: Handles large files and many files better

### Netlify CLI Installation

```bash
npm install -g netlify-cli
```

**Verify installation**:
```bash
netlify --version
# Should show: netlify-cli/23.13.0 (or similar)
```

---

## SpaceBell.games Deployment

### Step 1: Create netlify.toml Configuration

**Location**: `C:\SpaceBell.games\website\netlify.toml`

**Content**:
```toml
# Static site configuration for Next.js export
[build]
  command = "npm run build"
  publish = "out"

# No plugins needed for static export
# [[plugins]]
#   package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"

# Redirect all routes to index.html for SPA behavior (if needed)
# [[redirects]]
#   from = "/*"
#   to = "/index.html"
#   status = 200
```

**Why this file?**
- Defines build command and output directory
- Sets Node.js version for consistent builds
- Matches configuration from working willswaystudios site

### Step 2: Link Site to Netlify Project

**Find Site ID**:
```bash
cd C:\SpaceBell.games\website
netlify sites:list
```

**Output**:
```
spacebellgame - 54f5facd-e9b3-46f8-91dd-6828f5d54a65
  url:  https://spacebell.games
```

**Link the site**:
```bash
netlify link --id 54f5facd-e9b3-46f8-91dd-6828f5d54a65
```

**Result**: Creates `.netlify` folder and links local directory to Netlify project

### Step 3: Deploy to Production

**Deploy command**:
```bash
cd C:\SpaceBell.games\website
netlify deploy --dir=out --prod
```

**What this does**:
- Uses pre-built `out/` directory (from `npm run build`)
- Uploads files to Netlify
- Deploys to production environment
- Provides progress feedback

**Deployment Results**:
- **Time**: 1m 16.8s (vs. 65+ minutes stuck)
- **Files uploaded**: 77 assets
- **Status**: ✅ Successfully deployed
- **URL**: https://spacebell.games

---

## Willswaystudios Website Updates

### Update 1: Demo Download Link

**Problem**: Demo download pointed to local path `/downloads/SpaceBell-Demo-Setup.exe`

**Solution**: Point to SpaceBell.games hosted file

**File**: `C:\Users\Limin\willswaystudios-website\app\demo\page.tsx`

**Change**:
```typescript
// Before:
href="/downloads/SpaceBell-Demo-Setup.exe"

// After:
href="https://spacebell.games/downloads/SpaceBell-Demo-Setup.exe"
```

**Location**: Line 81

**Why**: Demo file is hosted on spacebell.games, so willswaystudios should link to it

### Update 2: SpaceBell Website Link

**Problem**: "Visit SpaceBell Website" button pointed to old domain `https://spacebell.org`

**Solution**: Update to new domain `https://spacebell.games`

**File**: `C:\Users\Limin\willswaystudios-website\app\page.tsx`

**Change**:
```typescript
// Before:
href="https://spacebell.org"

// After:
href="https://spacebell.games"
```

**Location**: Line 855

**Why**: New website is deployed at spacebell.games

### Deployment Process

1. **Update files** (as shown above)

2. **Rebuild website**:
   ```bash
   cd C:\Users\Limin\willswaystudios-website
   npm run build
   ```

3. **Link to Netlify** (if not already linked):
   ```bash
   netlify link --id 01de1272-3190-4f16-923a-4274c99ef4a9
   ```

4. **Deploy to production**:
   ```bash
   netlify deploy --dir=out --prod
   ```

**Deployment Results**:
- **Time**: ~24-67 seconds
- **Status**: ✅ Successfully deployed
- **URL**: https://willswaystudios.com

---

## Netlify CLI Setup

### Initial Setup (One-Time)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```
   - Opens browser for authentication
   - Grants CLI access to your Netlify account

3. **Verify Login**:
   ```bash
   netlify status
   ```
   - Shows current user email
   - Lists teams

### Linking a Site

**Method 1: Link by Site ID**
```bash
netlify link --id <site-id>
```

**Method 2: Link by Site Name**
```bash
netlify link --name <site-name>
```

**Find Site ID/Name**:
```bash
netlify sites:list
```

**Result**: Creates `.netlify/state.json` with site configuration

---

## Deployment Workflow

### Standard Deployment Process

1. **Make Changes**
   - Edit files in project directory
   - Test locally with `npm run dev`

2. **Build Project**
   ```bash
   npm run build
   ```
   - Generates `out/` directory with static files

3. **Deploy to Production**
   ```bash
   netlify deploy --dir=out --prod
   ```

### Deployment Options

**Deploy to Production**:
```bash
netlify deploy --dir=out --prod
```

**Deploy to Preview** (for testing):
```bash
netlify deploy --dir=out
```
- Creates a unique preview URL
- Doesn't affect production site

**Deploy with Build** (if netlify.toml exists):
```bash
netlify deploy --prod
```
- Runs build command from netlify.toml
- Then deploys the output

### Deployment Output

**Successful deployment shows**:
```
🚀 Deploy complete
────────────────────────────────────────────────────────────────

   ╭───────────────── ⬥  Production deploy is live ⬥  ─────────────────╮
   │                                                                   │
   │      Deployed to production URL: https://your-site.com             │
   │                                                                   │
   │                        Unique deploy URL:                         │
   │   https://<deploy-id>--your-site.netlify.app                     │
   │                                                                   │
   ╰───────────────────────────────────────────────────────────────────╯
```

---

## Troubleshooting

### Issue: Deployment Stuck/Timeout

**Symptoms**:
- Drag-and-drop taking 65+ minutes
- No progress updates
- Browser shows "uploading" indefinitely

**Solution**:
1. Cancel the drag-and-drop deployment
2. Use Netlify CLI instead:
   ```bash
   netlify deploy --dir=out --prod
   ```

**Prevention**:
- Use Netlify CLI for sites > 50MB
- Use Git-based deployment for large sites
- Optimize assets before deployment

### Issue: Missing netlify.toml

**Symptoms**:
- Build fails or uses wrong settings
- Deployment doesn't match local build

**Solution**:
1. Create `netlify.toml` in project root
2. Add configuration (see SpaceBell.games example above)
3. Rebuild and deploy

### Issue: Site Not Linked

**Symptoms**:
```
Error: You don't appear to be in a folder that is linked to a project
```

**Solution**:
```bash
# Find your site ID
netlify sites:list

# Link the site
netlify link --id <your-site-id>
```

### Issue: 404 Error for Functions

**Symptoms**:
```
Failed to load resource: the server responded with a status of 404
/.netlify/functions/fetch-site-configuration
```

**Cause**: 
- Integration (e.g., Neon database) trying to access function
- Static site doesn't have serverless functions

**Solution**:
- This is typically a dashboard UI issue, not a deployment problem
- Check if site is actually live and working
- If site works, ignore the dashboard error
- If needed, remove the integration or set up proper functions

### Issue: Build Fails

**Symptoms**:
- `netlify deploy` fails during build step
- TypeScript or compilation errors

**Solution**:
1. Test build locally first:
   ```bash
   npm run build
   ```
2. Fix any errors shown
3. Verify `out/` directory is created
4. Deploy again

### Issue: Files Not Updating

**Symptoms**:
- Changes deployed but not visible on site

**Solution**:
1. Clear browser cache (Ctrl+F5)
2. Check deployment logs in Netlify dashboard
3. Verify correct files in `out/` directory
4. Check for build errors

---

## Best Practices

### 1. Always Test Locally First

```bash
# Test build
npm run build

# Test built site locally
npx serve out
```

### 2. Use Netlify CLI for Large Sites

- Sites > 50MB: Use CLI
- Sites < 50MB: Drag-and-drop is fine
- Large sites: Consider Git-based deployment

### 3. Keep netlify.toml in Version Control

- Ensures consistent builds
- Documents build configuration
- Makes deployment reproducible

### 4. Monitor Deployment Logs

- Check Netlify dashboard for deployment status
- Review build logs for errors
- Verify file counts and sizes

### 5. Use Preview Deployments

- Test changes before production
- Share preview URLs for review
- Deploy to production only when ready

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

### Demo Installer
- **Source**: `C:\SpaceBell.games\website\public\downloads\SpaceBell-Demo-Setup.exe`
- **Deployed**: `https://spacebell.games/downloads/SpaceBell-Demo-Setup.exe`
- **Size**: ~123 MB

---

## Quick Reference Commands

### Check Netlify Status
```bash
netlify status
```

### List All Sites
```bash
netlify sites:list
```

### Link Site
```bash
netlify link --id <site-id>
```

### Deploy to Production
```bash
netlify deploy --dir=out --prod
```

### Deploy Preview
```bash
netlify deploy --dir=out
```

### View Deployment Logs
- Netlify Dashboard → Site → Deploys → Click deploy

---

## Summary

### What We Learned

1. **Drag-and-drop has limits**: Not suitable for sites > 50MB
2. **Netlify CLI is faster**: 1m 16s vs. 65+ minutes (stuck)
3. **Configuration matters**: `netlify.toml` is essential
4. **CLI is more reliable**: Better error handling and feedback

### Key Takeaways

- ✅ Always use Netlify CLI for large sites
- ✅ Create `netlify.toml` for proper configuration
- ✅ Link sites before deploying
- ✅ Test builds locally before deploying
- ✅ Monitor deployment logs for issues

### Deployment Times Comparison

| Method | Time | Reliability |
|--------|------|-------------|
| Drag-and-drop (small) | 3-6 min | Good |
| Drag-and-drop (large) | 65+ min (stuck) | Poor |
| Netlify CLI | 1-2 min | Excellent |

---

## Future Improvements

Consider:
- **Git-based deployment**: Automatic deployments on push
- **CI/CD pipeline**: Automated testing and deployment
- **Asset optimization**: Reduce file sizes for faster uploads
- **CDN configuration**: Optimize asset delivery
- **Environment variables**: Manage secrets securely

---

*Last Updated: December 28, 2025*
*Documented by: AI Assistant*
*Sites: spacebell.games, willswaystudios.com*




