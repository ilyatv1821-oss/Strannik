var CACHE = 'strannik-v2';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Cache everything that comes through
      return Promise.resolve();
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        // Return cached version immediately if available
        if (cached) {
          // Also fetch fresh version in background
          fetch(e.request).then(function(response) {
            if (response && response.status === 200) {
              cache.put(e.request, response.clone());
            }
          }).catch(function() {});
          return cached;
        }
        // Not in cache — fetch from network and cache it
        return fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(function() {
          // Offline fallback — return any cached HTML page
          return caches.match(e.request, {ignoreSearch: true});
        });
      });
    })
  );
});
