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
        'game.js',
        'config.js',
        'download.js',
        'sw.js',
        'ARCHITECTURE.md',
        'audio_implementation_guide.md',
        'audio_resources.md',
        'audio_setup.md',
        'BALANCE_ANALYSIS.md',
        'CHARACTERS.md',
        'convert_audio.md',
        'CRAFTING_REVIEW.md',
        'DAMAGE_EFFECTS.md',
        'DEMO_PACKAGE.md',
        'ELECTRON_PACKAGING.md',
        'FULL_GAME_PACKAGE.md',
        'GAME_BALANCE_UPDATES.md',
        'GAME_INTRO.md',
        'GAME_STATS_REFERENCE.md',
        'INTERACTIVE_LOGO.md',
        'NETLIFY_DEPLOYMENT.md',
        'OFFLINE_DOWNLOAD.md',
        'OPTIMIZATION_OPPORTUNITIES.md',
        'OPTIMIZATION_STATUS.md',
        'PERFORMANCE_ANALYSIS.md',
        'PRE_RENDERING_REVIEW.md',
        'readme.md',
        'readme_audio.md',
        'SHIP_VISUALS.md',
        'START_HERE.md',
        'STAT_APPLICATION_REVIEW.md',
        'STEAM_PREPARATION.md',
        'UPDATING_PACKAGES.md',
        'WEBSITE_DESIGN.md',
        'WEBSITE_UPDATES.md'
    ];

    const binaryFiles = [
        'jszip.min.js',
        'music/main_theme.ogg',
        'music/galactic_rap.ogg',
        'sfx/zap.wav'
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
                const readmeContent = `# Beyond Bell (Min Main)

## Play Offline

1. Extract all files to a folder.
2. Open \`index.html\` in a modern browser (Chrome/Edge/Firefox).
3. The game runs fully offline. The leaderboard stays offline unless you set an API URL in \`config.js\`.

## Controls
- Move: WASD / Arrows
- Shoot: Click or Space
- Modes: 1/2/3
- Pause: ESC
- Restart: R

Enjoy the game!`;
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

