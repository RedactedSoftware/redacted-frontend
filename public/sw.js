// Service Worker for GPS Tracker Dashboard PWA
const CACHE_NAME = 'gps-tracker-v4';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v4');
  self.skipWaiting();
});

// Activate event - aggressively clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null));
    console.log('[SW] Old caches deleted, claiming clients');
    await self.clients.claim();
  })());
});

// Fetch event - network first for everything, minimal caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and chrome extensions
  if (url.origin !== location.origin) {
    return;
  }

  // NEVER cache _next chunks - always fetch fresh
  if (url.pathname.includes('/_next/')) {
    event.respondWith(fetch(request));
    return;
  }

  // API: ALWAYS network, NEVER cache
  // Use cache: 'no-store' to prevent any browser-level caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
    );
    return;
  }

  // For everything else (HTML, CSS, images, fonts, etc), cache with network fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-telemetry') {
    event.waitUntil(
      // Sync telemetry data when back online
      fetch('/api/telemetry/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {
        console.log('[SW] Sync failed, will retry');
      })
    );
  }
});
