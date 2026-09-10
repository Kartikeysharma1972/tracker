/* Momentum service worker (v5)
   - navigation + app code (css/js) -> network-first  (always the latest build when online)
   - other static assets            -> cache-first    (icons, manifest)
   Bump CACHE on each release so old caches are purged. */
const CACHE = "momentum-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
  "./assets/css/tokens.css",
  "./assets/css/base.css",
  "./assets/css/components.css",
  "./assets/css/views.css",
  "./assets/js/core.js",
  "./assets/js/data.exercises.js",
  "./assets/js/data.foods.js",
  "./assets/js/store.js",
  "./assets/js/nutrition.js",
  "./assets/js/programs.js",
  "./assets/js/ui.js",
  "./assets/js/habits.js",
  "./assets/js/gym.js",
  "./assets/js/gym-log.js",
  "./assets/js/diet.js",
  "./assets/js/report.js",
  "./assets/js/app.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isDoc = req.mode === "navigate" || req.destination === "document";
  const isCode = /\.(css|js)$/.test(url.pathname);

  if (isDoc || isCode) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(r => r || (isDoc ? caches.match("./index.html") : undefined)))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached)
    )
  );
});
