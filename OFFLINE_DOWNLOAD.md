# Offline Download & Packaging

This project supports offline play via a prebuilt archive and an in-browser fallback.

## What the download button does
- Prefers the prebuilt archive `beyond-bell-offline.zip` at the project root.
- If the archive is unavailable, falls back to building a ZIP in-browser (JSZip) that includes the key files listed in `download.js` (HTML, JS, assets, server folder, docs).
- A service worker caches assets after the first load when served over `http/https` (not `file://`), enabling offline re-visits.

## Keeping the download up to date
When you want the latest changes (e.g., after editing `game.js`) to be downloadable via the button:
1) Rebuild the archive (from project root in PowerShell):
```
Remove-Item beyond-bell-offline.zip -ErrorAction SilentlyContinue; `
  $items = Get-ChildItem -Force | Where-Object { $_.Name -notin '.git' -and $_.Name -ne 'beyond-bell-offline.zip' }; `
  Compress-Archive -Path $items.FullName -DestinationPath beyond-bell-offline.zip -Force
```
2) Commit and push the updated `beyond-bell-offline.zip` along with your code changes.

## Notes
- If you add new files or folders that must be in the JSZip fallback, add them to `textFiles` / `binaryFiles` in `download.js`.
- The service worker does not affect the ZIP; it only caches assets for revisits.
- Running from `file://` can block the JSZip fallback fetches; use a local server (e.g., `start_server.ps1`) for the fallback path. The prebuilt ZIP download works regardless.***

