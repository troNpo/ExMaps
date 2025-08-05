const CACHE_NAME = 'mapa-cache-v1';
const urlsToCache = ['/', '/index.html', '/styles.css', '/js/app.js'];

// Instala el SW y cachea archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activa el SW y limpia cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});

// Intercepta peticiones de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});

// Gestiona mensajes desde la página
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SYNC_POIS') {
    sendPendingPOIs();
  }
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pois') {
    event.waitUntil(sendPendingPOIs());
  }
});

// 💾 Funciones de IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('POIDB', 1);
    request.onupgradeneeded = event => {
      event.target.result.createObjectStore('pendingPOIs', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error al abrir IndexedDB');
  });
}

async function sendPendingPOIs() {
  const db = await openDB();
  const tx = db.transaction('pendingPOIs', 'readonly');
  const store = tx.objectStore('pendingPOIs');
  const pois = await store.getAll();

  for (const poi of pois) {
    try {
      const response = await fetch('/api/pois', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poi)
      });
      if (response.ok) {
        const txDel = db.transaction('pendingPOIs', 'readwrite');
        txDel.objectStore('pendingPOIs').delete(poi.id);
        self.registration.showNotification('POI enviado con éxito');
      }
    } catch (err) {
      console.error('Error al enviar POI:', err);
    }
  }
}        return fetch(event.request);
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
