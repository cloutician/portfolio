const STREAMLINE_CACHE_PREFIX = "george-portfolio-streamline-";
const ASSET_CACHE = `${STREAMLINE_CACHE_PREFIX}assets-v3`;
const DOCUMENT_CACHE = `${STREAMLINE_CACHE_PREFIX}documents-v3`;
const BUILD_REVISION = "__STREAMLINE_REVISION__";
const ASSET_REVISIONS = /* __STREAMLINE_ASSETS__ */ {};
const MANIFEST_KEY = new URL("/__streamline_manifest__", self.location.origin).href;
const MAX_ASSETS = 320;
let manifestPromise;
let writeQueue = Promise.resolve();

function revisionKey(pathname, revision) {
  const url = new URL(pathname, self.location.origin);
  url.searchParams.set("__revision", revision);
  return url.href;
}

function manifest() {
  return manifestPromise ||= caches.open(ASSET_CACHE)
    .then((cache) => cache.match(MANIFEST_KEY))
    .then((response) => response?.json())
    .then((value) => value || { current: ASSET_REVISIONS, previous: {} });
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(ASSET_CACHE);
    const oldResponse = await cache.match(MANIFEST_KEY);
    const oldManifest = oldResponse ? await oldResponse.json() : {};
    const currentManifest = oldManifest.revision === BUILD_REVISION ? oldManifest : {
      revision: BUILD_REVISION, current: ASSET_REVISIONS, previous: oldManifest.current || {},
    };
    await cache.put(MANIFEST_KEY, new Response(JSON.stringify(currentManifest), {
      headers: { "Content-Type": "application/json" },
    }));
    manifestPromise = Promise.resolve(currentManifest);
    // Keep the previous build's fingerprints too, so an already open page or
    // the last offline document can still retrieve its exact script bundles.
    const valid = new Set([MANIFEST_KEY]);
    for (const assets of [currentManifest.current, currentManifest.previous]) {
      Object.entries(assets).forEach(([pathname, revision]) => valid.add(revisionKey(pathname, revision)));
    }
    await Promise.all((await cache.keys())
      .filter((request) => !valid.has(request.url))
      .map((request) => cache.delete(request)));
    await Promise.all((await caches.keys())
      .filter((name) => name.startsWith(STREAMLINE_CACHE_PREFIX)
        && name !== ASSET_CACHE && name !== DOCUMENT_CACHE)
      .map((name) => caches.delete(name)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

function storeAsset(cache, key, response) {
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    await cache.put(key, response);
    const keys = (await cache.keys()).filter((request) => request.url !== MANIFEST_KEY);
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))
      .map((request) => cache.delete(request)));
  });
  return writeQueue.catch(() => {});
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // The unbuilt development worker must never retain local source files.
  if (BUILD_REVISION === "__STREAMLINE_" + "REVISION__") return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(DOCUMENT_CACHE);
      try {
        const response = await event.preloadResponse || await fetch(request);
        if (response.ok) event.waitUntil(cache.put("/", response.clone()).catch(() => {}));
        return response;
      } catch (error) {
        const cached = await cache.match("/");
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  if (!ASSET_REVISIONS[url.pathname] && !url.pathname.startsWith("/assets/")) return;
  event.respondWith((async () => {
    const cache = await caches.open(ASSET_CACHE);
    const revision = ASSET_REVISIONS[url.pathname] || (await manifest()).previous[url.pathname];
    if (!revision) return fetch(request);
    const key = revisionKey(url.pathname, revision);
    const cached = await cache.match(key);
    if (cached) return cached;
    // Fetch fresh bytes when a fingerprint changes, even if the HTTP cache
    // contains a still-fresh older response at the same public URL.
    const response = await fetch(request, { cache: "reload" });
    if (response.ok) event.waitUntil(storeAsset(cache, key, response.clone()));
    return response;
  })());
});
