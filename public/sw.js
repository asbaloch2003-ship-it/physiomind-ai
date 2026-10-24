const CACHE = "physiosmart-static-v1";
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(["/","/physiosmart-logo.svg","/manifest.webmanifest"]))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") { event.respondWith(fetch(request).catch(() => caches.match("/"))); return; }
  if (!/\.(?:svg|png|ico|css|js|woff2?)$/i.test(new URL(request.url).pathname)) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if (response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(request,copy)); } return response; })));
});