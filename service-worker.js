const CACHE_NAME = 'bdc-static-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/css/common.css',
  '/assets/css/index.css',
  '/assets/js/app.js',
  '/assets/js/viewport.js',
  '/image/blood-drop.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkResponse) => {
        // Try to cache the fetched response (best-effort)
        caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(event.request, networkResponse.clone()); } catch (e) { /* ignore */ }
        });
        return networkResponse;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
