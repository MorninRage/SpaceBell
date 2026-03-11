# Offline Download & Packaging (minMain)

## What the download button does
- Prefers the prebuilt archive `beyond-bell-offline.zip` at this folder root.
- If the archive is missing, falls back to building a ZIP in-browser (JSZip) using the file lists in `download.js` (HTML/JS + audio assets).
- The service worker (`sw.js`) caches the same core assets after the first load when served over `http/https` (not `file://`).

## Keep the download up to date
Preferred: run `package_offline.ps1` (PowerShell) from anywhere; it uses the script path to package the current `minMain` contents.

Manual fallback (from `C:\AMD\minMain` in PowerShell):
```
Remove-Item beyond-bell-offline.zip -ErrorAction SilentlyContinue;
$items = Get-ChildItem -Force | Where-Object { $_.Name -notin '.git','beyond-bell-offline.zip' };
Compress-Archive -Path $items.FullName -DestinationPath beyond-bell-offline.zip -Force
```

## When you add files
- Add new text assets to `textFiles` and binaries to `binaryFiles` in `download.js` so the fallback ZIP includes them.
- Add the same assets to `ASSETS` in `sw.js` if you want them cached for offline play.
- Rebuild `beyond-bell-offline.zip` after changes so the prebuilt download matches this folder’s contents.

