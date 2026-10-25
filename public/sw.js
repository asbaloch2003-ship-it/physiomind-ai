// Network-first pages prevent outdated clinical educational material from persisting.
const CACHE = "physiosmart-pwa-v2";
const SHELL = ["/", "/physiosmart-logo.svg", "/manifest.webmanifest"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("physiosmart-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/")) || Response.error()));
    return;
  }
  if (!/\\.(?:svg|png|ico|css|js|woff2?|webmanifest)$/i.test(url.pathname)) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  }).catch(() => caches.match(request)));
});
