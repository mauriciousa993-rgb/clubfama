// Service Worker para Club FAMA VALLE PWA
const CACHE_NAME = 'fama-valle-v2';
const STATIC_CACHE = 'fama-valle-static-v2';
const API_CACHE = 'fama-valle-api-v2';

// Recursos estáticos a cachear
const staticUrlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
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
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cache estático abierto');
        return cache.addAll(staticUrlsToCache);
      })
      .then(() => {
        console.log('[SW] Recursos cacheados exitosamente');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Error al cachear recursos:', err);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Helper para determinar si es una petición a la API
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('render.com') ||
         url.hostname.includes('onrender.com');
}

// Helper para determinar si es un recurso estático
function isStaticRequest(url) {
  const staticExtensions = ['.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Fetch event - estrategia híbrida
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // No interceptar peticiones de extensión chrome-extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Estrategia para API: Network First, luego Cache
  if (isAPIRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Guardar en cache de API
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar desde cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si no hay cache, retornar error offline
            return new Response(
              JSON.stringify({ error: 'Sin conexión a internet' }),
              { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }
  
  // Estrategia para recursos estáticos: Cache First, luego Network
  if (isStaticRequest(url) || event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - retornar respuesta del cache
          if (response) {
            // Actualizar cache en segundo plano
            fetch(event.request)
              .then((fetchResponse) => {
                if (fetchResponse.status === 200) {
                  caches.open(STATIC_CACHE).then((cache) => {
                    cache.put(event.request, fetchResponse);
                  });
                }
              })
              .catch(() => {
                // Silenciar errores de actualización en segundo plano
              });
            
            return response;
          }

          // No está en cache, ir a la red
          return fetch(event.request)
            .then((fetchResponse) => {
              if (!fetchResponse || fetchResponse.status !== 200) {
                return fetchResponse;
              }

              // Guardar en cache
              const responseToCache = fetchResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });

              return fetchResponse;
            })
            .catch(() => {
              // Si es navegación y falla, mostrar página offline
              if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
              }
            });
        })
    );
    return;
  }
  
  // Para otras peticiones, ir directo a la red
  event.respondWith(fetch(event.request));
});

// Manejar mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ result: 'Cache limpiado' });
    });
  }
});

// Sincronización en segundo plano (para cuando vuelva la conexión)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPendingPayments());
  }
});

// Función para sincronizar pagos pendientes
async function syncPendingPayments() {
  // Implementar lógica de sincronización si es necesario
  console.log('[SW] Sincronizando pagos pendientes...');
}
