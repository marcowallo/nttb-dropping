// v4.3: offline cache uitgeschakeld.
// Als een oudere service worker nog actief was, ruimt deze zichzelf op.
self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then(clients => clients.forEach(client => client.navigate(client.url)))
  );
});
