const CACHE_NAME = "checklist-gardu-v1";

const APP_SHELL = [
  "./",
  "./Checklist.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* Simpan app shell saat instalasi */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* Bersihkan cache versi lama */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Cache-first untuk file app shell sendiri.
   Request ke Apps Script (POST, atau domain lain seperti script.google.com)
   TIDAK disentuh sama sekali — selalu langsung ke jaringan, karena itu
   data live (template checklist & submit), bukan sesuatu yang boleh
   di-cache. */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
