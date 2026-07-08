const CACHE_NAME = "dropping-v4-cache";
const FILES = [
  "./",
  "./index.html",
  "./admin.html",
  "./styles.css",
  "./data.js",
  "./app.js",
  "./admin.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
