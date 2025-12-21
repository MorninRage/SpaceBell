# Audio Setup - IMPORTANT!

## The Problem
Browsers block audio files when opening HTML directly from the file system (`file://` protocol) due to CORS security policies.

## The Solution
You **MUST** run the game from a local web server.

## Quick Start

### Option 1: Use the Server Script (Easiest)
1. Double-click `start_server.bat` (Windows)
2. Or run `.\start_server.ps1` in PowerShell
3. Open your browser to: **http://localhost:8000**

### Option 2: Python (If you have Python installed)
1. Open PowerShell or Command Prompt in the `bell-game` folder
2. Run: `python -m http.server 8000`
3. Open your browser to: **http://localhost:8000**

### Option 3: Node.js (If you have Node.js installed)
1. Open PowerShell or Command Prompt in the `bell-game` folder
2. Run: `npx http-server -p 8000`
3. Open your browser to: **http://localhost:8000**

## What to Expect
- Once running from the server, you should see console logs like:
  - "Audio system initialized"
  - "Loading music from: music/main_theme.ogg"
  - "Music loaded successfully"
  - "Music started playing"

- If you see CORS errors, you're still opening from `file://` - use the server instead!

## Your Music File
Your converted `main_theme.ogg` is in the `music/` folder and will play automatically when the game starts (after you interact with the page).

## Troubleshooting
- **No sound?** Make sure you've clicked/interacted with the page (browsers require user interaction to start audio)
- **Still CORS errors?** Make sure you're accessing via `http://localhost:8000`, not `file://`
- **Music not loading?** Check the browser console (F12) for error messages












