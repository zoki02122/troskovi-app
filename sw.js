const CACHE_NAME = 'troskovi-cache-v2';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Mrežni odgovor ako ima interneta (da se AI pozivi i osvezenja normalno provuku),
// a ako nema veze, koristi sacuvanu kopiju iz kesa (offline rad).
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;

  // AI/API pozivi (Google Gemini) uvek idu direktno na mrezu, nikad iz kesa
  if(event.request.url.includes('generativelanguage.googleapis.com')){
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((resp) => {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, respClone));
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
