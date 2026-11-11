const CACHE = 'hranene-v5';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Първо от интернет (за да идват обновленията веднага), без интернет — от кеша.
// Файловете на приложението винаги се проверяват на сървъра (no-cache), за да не се показва стара версия.
// Пазят се само успешни отговори; без връзка страниците падат обратно на index.html.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const own = new URL(req.url).origin === self.location.origin;
  const net = own ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  e.respondWith(
    net.then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return r;
    }).catch(() => caches.match(req).then(m => m || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
