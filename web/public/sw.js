// Service Worker de TrainingLoja (PWA instalable en Android e iOS).
// Estrategia ONLINE-FIRST: siempre intenta la red (para tener la ultima
// version del sistema) y solo cae al cache como respaldo si no hay internet.
// Asi nunca queda "pegado" en una version vieja al desplegar cambios.

const CACHE = 'trainingloja-v1';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .catch(() => {}),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Las llamadas al backend SIEMPRE en vivo: no las cachea el SW.
  if (url.pathname.startsWith('/api/')) return;

  // Navegacion (abrir una pagina): red primero, index.html de respaldo offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }

  // Recursos estaticos (JS/CSS/imagenes): red primero guardando copia; si no
  // hay internet, se sirve la copia cacheada.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches
          .open(CACHE)
          .then((c) => c.put(req, copy))
          .catch(() => {});
        return res;
      })
      .catch(() => caches.match(req)),
  );
});
