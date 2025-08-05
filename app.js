function savePOIOffline(poi) {
  const request = indexedDB.open('POIDB', 1);

  request.onupgradeneeded = event => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('pendingPOIs')) {
      db.createObjectStore('pendingPOIs', { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onsuccess = event => {
    const db = event.target.result;
    const tx = db.transaction('pendingPOIs', 'readwrite');
    const store = tx.objectStore('pendingPOIs');
    store.add(poi);

    // 🧭 Intentamos registrar una sincronización
    navigator.serviceWorker.ready.then(swReg => {
      return swReg.sync.register('sync-pois');
    }).catch(err => {
      console.warn('❌ Error al registrar sync:', err);
      // 💡 Como fallback, mandamos mensaje directo al SW
      navigator.serviceWorker.controller?.postMessage({ type: 'SYNC_POIS' });
    });
  };

  request.onerror = () => {
    console.error('❌ Error al guardar el POI offline');
  };
}

// ✅ Pide permiso para mostrar notificaciones (una vez)
if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission();
        }
