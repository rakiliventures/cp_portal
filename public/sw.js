const CACHE_NAME = "cp-portal-v2";

const PRECACHE_URLS = ["/offline.html"];

// Routes the SW should never touch — let the browser/server handle them
const BYPASS_PREFIXES = ["/api/", "/login", "/app/", "/_next/"];

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
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip auth, app, API, and Next.js internal routes — always go to network
  if (BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p))) return;

  // For remaining static assets: network-first, cache on success, offline fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.pathname.match(/\.(png|ico|svg|jpg|jpeg|webp|woff2?)$/)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) => cached ?? caches.match("/offline.html")
        )
      )
  );
});
