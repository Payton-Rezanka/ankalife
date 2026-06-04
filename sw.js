/* AnkaLife service worker — offline support + installability */
const CACHE = 'ankalife-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Network-first for the app shell so updates land immediately; cache fallback offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
                .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Cache-first for static assets (icons, fonts, manifest)
  e.respondWith(
    caches.match(req).then(c => c || fetch(req).then(r => {
      if (r && r.status === 200 && (req.url.includes('.png') || req.url.includes('manifest') || req.url.includes('fonts.') || req.url.includes('phosphor'))) {
        const cp = r.clone(); caches.open(CACHE).then(cc => cc.put(req, cp));
      }
      return r;
    }).catch(() => c))
  );
});
