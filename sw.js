const CACHE_NAME = 'exmaps-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/logo192.png',
  './icons/logo512.png',
  './css/styles.css',
  './js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
             .map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, devuelve el recurso
        if (response) return response;
        // Si no, realiza la petición normalmente
        return fetch(event.request);
      })
  );
});
self.addEventListener('sync', event => {
  if (event.tag === 'sync-new-poi') {
    event.waitUntil(sendPendingPOIs());
  }
});

async function sendPendingPOIs() {
  const pending = await getPendingPOIs(); // ← Podemos crear esta función con IndexedDB
  for (const poi of pending) {
    await fetch('/api/pois', {
      method: 'POST',
      body: JSON.stringify(poi),
      headers: { 'Content-Type': 'application/json' }
    });
    // Aquí puedes borrar el POI si fue exitoso
  }
        }
