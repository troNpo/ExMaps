// Guardar un POI pendiente
function savePOIOffline(poi) {
  const request = indexedDB.open('exmaps-db', 1);
  request.onupgradeneeded = event => {
    const db = event.target.result;
    db.createObjectStore('pendingPOIs', { keyPath: 'id', autoIncrement: true });
  };

  request.onsuccess = event => {
    const db = event.target.result;
    const transaction = db.transaction('pendingPOIs', 'readwrite');
    const store = transaction.objectStore('pendingPOIs');
    store.add(poi);
  };
}

// Obtener los POIs guardados
function getPendingPOIs() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('exmaps-db', 1);

    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction('pendingPOIs', 'readonly');
      const store = transaction.objectStore('pendingPOIs');
      const getAll = store.getAll();

      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => reject([]);
    };

    request.onerror = () => reject([]);
  });
}

// Enviar los POIs al servidor
async function sendPendingPOIs() {
  const pending = await getPendingPOIs();
  for (const poi of pending) {
    try {
      const response = await fetch('/api/pois', {
        method: 'POST',
        body: JSON.stringify(poi),
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        deletePOI(poi.id); // Borra de IndexedDB si fue exitoso
      }
    } catch (error) {
      console.error('Error enviando POI:', error);
    }
  }
}

// Borrar POI de IndexedDB
function deletePOI(id) {
  const request = indexedDB.open('exmaps-db', 1);
  request.onsuccess = event => {
    const db = event.target.result;
    const transaction = db.transaction('pendingPOIs', 'readwrite');
    const store = transaction.objectStore('pendingPOIs');
    store.delete(id);
  };
}

// Escuchar mensajes del Service Worker
navigator.serviceWorker.addEventListener('message', event => {
  if (event.data === 'sync-new-poi') {
    sendPendingPOIs();
  }
});
