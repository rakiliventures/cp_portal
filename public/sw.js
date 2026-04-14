const CACHE_NAME = "cp-portal-v1";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests; skip cross-origin and API routes
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful navigation and static asset responses
        if (
          response.ok &&
          (event.request.mode === "navigate" || url.pathname.match(/\.(png|ico|svg|jpg|jpeg|webp|css|js|woff2?)$/))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve cached page or offline.html for navigations
        return caches.match(event.request).then(
          (cached) => cached ?? caches.match("/offline.html")
        );
      })
  );
});
