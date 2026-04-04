const CACHE_NAME = 'signalrtc-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/signalrtc.css',
    '/favicon.ico',
    '/pics/icon-192.png',
    '/pics/icon-512.png',
    '/Scripts/config.js',
    '/Scripts/dom.js',
    '/Scripts/video.js',
    '/Scripts/signalr.js',
    '/Scripts/utils.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network-first for SignalR hub, cache-first for static assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Let SignalR/WebRTC traffic go straight to network
    if (url.pathname.startsWith('/signalr') || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
