const CACHE = 'compras-v1.3.7';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: pre-cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete old caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first strategy for app assets, network-only for version.json
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // version.json always from network (no cache)
  if (e.request.url.includes('version.json')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Serve from cache immediately, update cache in background
        const networkUpdate = fetch(e.request).then(resp => {
          if (resp && resp.status === 200) {
            caches.open(CACHE).then(cache => cache.put(e.request, resp.clone()));
          }
          return resp;
        }).catch(() => {});
        return cached;
      }
      // Not in cache: fetch from network and cache it
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
