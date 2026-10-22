/* Cool Hub service worker – makes the whole app work offline. */
const CACHE = "coolhub-v7";
const ROUTES = ["/", "/billing", "/jobs", "/settings"];
const ASSETS = ["/manifest.json", "/logo.jpg", "/icons/icon-192.png", "/icons/icon-512.png"];

// Cache every page plus the JS/CSS each page references, so routes that were
// never opened online still work offline.
async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(ASSETS);
  const files = new Set();
  await Promise.all(
    ROUTES.map(async (route) => {
      try {
        const res = await fetch(route, { cache: "reload" });
        if (!res.ok) return;
        await cache.put(route, res.clone());
        const html = await res.text();
        for (const m of html.matchAll(/\/_next\/static\/[^"'\\\s)]+/g)) files.add(m[0]);
      } catch {
        /* offline during install – runtime caching will fill in later */
      }
    }),
  );
  await Promise.all([...files].map((f) => cache.add(f).catch(() => undefined)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first so updates arrive, fall back to the cached copy offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(url.pathname)) || (await caches.match("/"))),
    );
    return;
  }

  // Static assets and Next data: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
