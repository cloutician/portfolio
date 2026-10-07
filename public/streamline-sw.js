const STREAMLINE_CACHE_PREFIX = "george-portfolio-streamline-";
const STREAMLINE_CACHE = `${STREAMLINE_CACHE_PREFIX}20260925-02`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(STREAMLINE_CACHE_PREFIX) && key !== STREAMLINE_CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Development must always see the newest local asset. Production uses the
  // primed cache so project transitions never wait on the visitor's network.
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(STREAMLINE_CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match(request) || await cache.match("/");
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  const isInterfaceCode = url.pathname === "/styles.css"
    || url.pathname === "/script.js";
  const isStreamlineResource = url.pathname.startsWith("/assets/") || isInterfaceCode;
  if (!isStreamlineResource) return;

  event.respondWith((async () => {
    const cache = await caches.open(STREAMLINE_CACHE);

    // Interface code is network-first so a returning visitor cannot remain on
    // stale interaction logic. Cached code remains available when offline.
    if (isInterfaceCode) {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
      }
    }

    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
