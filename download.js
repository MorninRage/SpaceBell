// Download helper for packaging the game for offline use
(function () {
    const defaultConfig = '// Game Configuration\n// Update this with your API URL if needed\nwindow.API_URL = window.API_URL || "";\n';
    const cacheOptions = {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        }
    };
    const cacheBuster = () => '?v=' + Date.now() + '&r=' + Math.random().toString(36).slice(2);
    const directZip = 'beyond-bell-offline.zip';

    const textFiles = [
        'index.html',
        'index-dev.html',
        'game.js',
        'config.js',
        'download.js',
        'sw.js',
        'readme.md',
        'readme_audio.md',
        'audio_implementation_guide.md',
        'audio_resources.md',
        'audio_setup.md',
        'convert_audio.js',
        'convert_audio.md',
        'CRAFTING_REVIEW.md',
        'GAME_STATS_REFERENCE.md',
        'OPTIMIZATION_OPPORTUNITIES.md',
        'OPTIMIZATION_STATUS.md',
        'PERFORMANCE_ANALYSIS.md',
        'STAT_APPLICATION_REVIEW.md',
        'BALANCE_ANALYSIS.md',
        'thruster_test.txt',
        'start_server.ps1',
        'start_server.bat',
        'generate_voices.html',
        'server/deploy.md',
        'server/package.json',
        'server/procfile',
        'server/railway.json',
        'server/readme.md',
        'server/server.js'
    ];

    const binaryFiles = [
        'jszip.min.js',
        'music/main_theme.ogg',
        'music/galactic_rap.ogg'
    ];

    function findDownloadButton() {
        let btn = document.querySelector('#instructions button[onclick*="downloadGame"]');
        if (btn) return btn;
        const buttons = document.querySelectorAll('#instructions button');
        for (const b of buttons) {
            if (b.textContent.includes('Download Game') || b.textContent.includes('📥')) {
                return b;
            }
        }
        return null;
    }

    async function fetchText(path) {
        try {
            const res = await fetch(path + cacheBuster(), cacheOptions);
            if (res.ok) return res.text();
        } catch (e) {
            console.warn(`Could not fetch ${path}:`, e);
        }
        return null;
    }

    async function fetchBinary(path) {
        try {
            const res = await fetch(path + cacheBuster(), cacheOptions);
            if (res.ok) return res.blob();
        } catch (e) {
            console.warn(`Could not fetch ${path}:`, e);
        }
        return null;
    }

    async function tryDirectZip(btn, originalText) {
        // If running from file://, just navigate to the zip (no fetch restrictions).
        if (location.protocol === 'file:') {
            btn.textContent = '↓ Downloading ZIP...';
            window.location.href = directZip;
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1500);
            return true;
        }

        try {
            const res = await fetch(directZip, { method: 'HEAD', cache: 'no-store' });
            if (res.ok) {
                btn.textContent = '↓ Downloading ZIP...';
                window.location.href = directZip;
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 1500);
                return true;
            }
        } catch (e) {
            console.warn('Direct ZIP unavailable, falling back to JSZip:', e);
        }
        return false;
    }

    async function downloadGame() {
        const btn = findDownloadButton();
        if (!btn) {
            alert('Download button not found');
            return;
        }

        const originalText = btn.textContent;
        btn.textContent = '⏳ Checking ZIP...';
        btn.disabled = true;

        // Prefer the prebuilt offline ZIP
        const directWorked = await tryDirectZip(btn, originalText);
        if (directWorked) return;

        // Fallback: build ZIP in-browser
        if (typeof JSZip === 'undefined') {
            alert('Download unavailable: prebuilt ZIP not found and JSZip failed to load.');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        btn.textContent = '⏳ Creating download...';
        try {
            const zip = new JSZip();
            const missing = [];

            // Text assets
            for (const path of textFiles) {
                let content = await fetchText(path);
                if (!content && path === 'index.html' && (window.location.pathname.includes('index.html') || !window.location.pathname.includes('index-dev.html'))) {
                    content = document.documentElement.outerHTML;
                }
                if (!content && path === 'config.js') {
                    content = defaultConfig;
                }
                if (content) {
                    zip.file(path, content);
                } else {
                    missing.push(path);
                }
            }

            // Binary assets
            for (const path of binaryFiles) {
                const blob = await fetchBinary(path);
                if (blob) {
                    zip.file(path, blob);
                } else {
                    missing.push(path);
                }
            }

            // README fallback if fetch failed
            if (!zip.file('readme.md')) {
                const readmeContent = `# Beyond Bell: Space Shooter

## How to Play Locally

1. Extract all files to a folder
2. **IMPORTANT:** Open the correct file in a web browser (Chrome, Firefox, Edge, etc.):
   - **Regular Mode:** Double-click \`index.html\` (or right-click → Open with → Browser)
   - **Developer Mode:** Double-click \`index-dev.html\` (or right-click → Open with → Browser)
3. Both files are included in the download - choose the one you want to play!
4. Enjoy the game!

**Note:** Make sure you're opening the files directly (not through a server) if you want to play offline. Both \`index.html\` and \`index-dev.html\` work offline!

**Note:** The game works offline, but the leaderboard feature requires an API server. You can play the full game without it!

## Game Modes

### Regular Mode (\`index.html\`)
The standard game experience with all features.

### Developer Mode (\`index-dev.html\`)
Developer mode includes all regular features plus:
- **F1**: Toggle dev panel
- **F5**: Spawn boss
- **F6**: Next level
- **F7**: Set level
- **F8**: Max health
- **F9**: Max resources
- **F10**: Kill all enemies
- **F11**: Max shield
- **F12**: Toggle debug display

See the dev mode help panel (bottom-left) for all shortcuts and options.

## Controls

- **WASD** or **Arrow Keys**: Move
- **Click** or **Space**: Shoot
- **1/2/3**: Switch game modes
- **C**: Crafting (during level-up only)
- **U**: Upgrade Shop (during level-up only)
- **E**: Equipment/Inventory (anytime)
- **H**: Use Health Pack
- **ESC**: Pause/Show All Panels (includes Tutorial & Guide button)
- **L**: Leaderboard
- **R**: Restart

## Game Modes (In-Game)

- **Ensemble QM**: Probabilistic shooting with uncertainty
- **Individual System**: Precise, deterministic shooting
- **Bell Pairs**: Correlated pairs behavior with enemy ships (double rewards!)

## Features

- **Interactive Tutorial & Guide** - Press ESC and click "Tutorial & Guide" for comprehensive game instructions, item descriptions, and strategies
- Level-based progression (craft/buy upgrades after each level)
- Crafting system (weapons, ships, shields, upgrades)
- Equipment inventory (equip/unequip anytime)
- Multiple game modes with different material drops
- Health packs (consumable items)
- Red molecules (destructible) - destroy for triple resources! Affected by critical hits and RPG stats.
- Boss battles at levels 15, 30, 45, 60, and beyond
- High-tier items based on Einstein's physics concepts

## Tips

- Switch between modes to gather different materials
- Bell Pairs mode gives double tokens
- Destroy red molecules for triple resources (they're affected by critical hits and RPG stats!)
- Health packs can be used anytime during gameplay (H key)
- Crafting and shopping only available during level-up
- Boss battles require solving puzzles to defeat them

## Additional Files

- \`convert_audio.js\`: Script to convert audio files to OGG format
- \`generate_voices.html\`: Tool to generate voice clips for the game
- \`music/\`: Background music files (OGG format)

Enjoy the game!
`;
                zip.file('README.md', readmeContent);
            }

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'beyond-bell-space-shooter.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const successText = missing.length ? `Downloaded (missing: ${missing.join(', ')})` : '✓ Downloaded!';
            btn.textContent = successText;
            btn.style.background = '#4caf50';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);

            if (missing.length) {
                alert('Download completed with missing files: ' + missing.join(', ') + '. If you opened this page directly from the file system, run a local server (e.g., start_server.ps1) so the downloader can fetch everything.');
            }
        } catch (error) {
            console.error('Error creating download:', error);
            btn.textContent = '❌ Error - Try Again';
            btn.disabled = false;
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
            alert('Error creating download. Please try again or download files manually from the repository.');
        }
    }

    window.downloadGame = downloadGame;
})();

