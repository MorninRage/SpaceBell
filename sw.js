const CACHE_NAME = 'beyond-bell-minmain-v2';
const ASSETS = [
    './',
    './index.html',
    './game.js',
    './config.js',
    './download.js',
    './jszip.min.js',
    './music/main_theme.ogg',
    './music/galactic_rap.ogg',
    './sfx/zap.wav',
    './ARCHITECTURE.md',
    './audio_implementation_guide.md',
    './audio_resources.md',
    './audio_setup.md',
    './BALANCE_ANALYSIS.md',
    './CHARACTERS.md',
    './convert_audio.md',
    './CRAFTING_REVIEW.md',
    './DAMAGE_EFFECTS.md',
    './DEMO_PACKAGE.md',
    './ELECTRON_PACKAGING.md',
    './FULL_GAME_PACKAGE.md',
    './GAME_BALANCE_UPDATES.md',
    './GAME_INTRO.md',
    './GAME_STATS_REFERENCE.md',
    './INTERACTIVE_LOGO.md',
    './NETLIFY_DEPLOYMENT.md',
    './OFFLINE_DOWNLOAD.md',
    './OPTIMIZATION_OPPORTUNITIES.md',
    './OPTIMIZATION_STATUS.md',
    './PERFORMANCE_ANALYSIS.md',
    './PRE_RENDERING_REVIEW.md',
    './readme.md',
    './readme_audio.md',
    './SHIP_VISUALS.md',
    './START_HERE.md',
    './STAT_APPLICATION_REVIEW.md',
    './STEAM_PREPARATION.md',
    './UPDATING_PACKAGES.md',
    './WEBSITE_DESIGN.md',
    './WEBSITE_UPDATES.md'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request)
                .then(response => {
                    if (!response || response.status !== 200 || response.type === 'opaque') {
                        return response;
                    }
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => cached);
        })
    );
});

