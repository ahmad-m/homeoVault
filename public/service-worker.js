/**
 * HomeoVault - PWA Service Worker
 * Handles offline caching, static assets intercepts, and fallbacks.
 */

const CACHE_VERSION = 'homeovault-cache-v1';
const STATIC_ASSETS = [
  '/offline.html',
  '/css/styles.css',
  '/css/core.css',
  '/css/offline.css',
  '/js/app.js',
  '/js/core.js',
  '/js/offline.js',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

// 1. Install event: Cache core static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[Service Worker] Pre-caching static application shell.');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up stale caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            console.log('[Service Worker] Clearing stale cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Intercept network calls
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET requests (e.g. POST, PUT, DELETE exports/movements cannot be cached)
  if (e.request.method !== 'GET') {
    return;
  }

  // A. Cache-First Strategy for static assets (css, js, images, icons)
  const isStaticAsset = STATIC_ASSETS.includes(url.pathname) || 
                        url.pathname.startsWith('/css/') || 
                        url.pathname.startsWith('/js/') ||
                        url.pathname.startsWith('/assets/') ||
                        e.request.destination === 'image' ||
                        e.request.destination === 'style' ||
                        e.request.destination === 'script';

  if (isStaticAsset) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached, but refresh cache in the background (stale-while-revalidate)
          fetch(e.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_VERSION).then((cache) => {
                cache.put(e.request, networkResponse);
              });
            }
          }).catch(() => {/* Ignore background network failures */});
          
          return cachedResponse;
        }

        // Fallback to network if not in cache
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(e.request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // B. Network-First falling back to Cache Strategy for API endpoints
  const isApiRequest = url.pathname.startsWith('/api/');
  if (isApiRequest) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(e.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline: Fallback to cache for read-only GET APIs
          return caches.match(e.request);
        })
    );
    return;
  }

  // C. Default: Network first, fallback to offline.html for HTML page navigation
  e.respondWith(
    fetch(e.request).catch(() => {
      if (e.request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
    })
  );
});
