/* Service worker para PWA con caché offline. */
const CACHE_NAME = "servipartz-pos-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/favicon.png",
        "/manifest.webmanifest",
      ]).catch(() => {});
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;
  if (request.method !== "GET") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/favicon.png" || url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) =>
          cached || fetch(request).then((res) => {
            cache.put(request, res.clone());
            return res;
          })
        )
      )
    );
  } else {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/"))
      )
    );
  }
});
