// Service Worker para Club FAMA VALLE PWA
const CACHE_NAME = 'fama-valle-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/css/players.css',
  '/css/payments.css',
  '/css/calendar.css',
  '/css/formations.css',
  '/css/reports.css',
  '/js/auth.js',
  '/js/main.js',
  '/js/dashboard.js',
  '/js/players.js',
  '/js/payments.js',
  '/js/calendar.js',
  '/js/formations.js',
  '/js/reports.js',
  '/images/logo.jpg',
  '/pages/dashboard.html',
  '/pages/players.html',
  '/pages/payments.html',
  '/pages/calendar.html',
  '/pages/formations.html',
  '/pages/reports.html',
  '/pages/register.html',
  '/pages/player-dashboard.html',
  '/pages/player-calendar.html',
  '/pages/player-formations.html',
  '/pages/player-profile.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('Error al cachear recursos:', err);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - estrategia Cache First, luego Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retornar respuesta del cache
        if (response) {
          return response;
        }

        // Clonar la request porque es un one-time use
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Verificar si recibimos una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta porque es un one-time use
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla la red y no está en cache, retornar página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Manejar mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
