// Service Worker pour l'horloge Bahá'í
const CACHE_NAME = 'bahai-clock-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mise en cache des ressources');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Active immédiatement le nouveau SW
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression du cache ancien:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes API externes
  if (event.request.url.includes('api.sunrise-sunset.org') || 
      event.request.url.includes('nominatim.openstreetmap.org')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourne le cache si disponible
        if (response) {
          console.log('Service Worker: Chargement depuis le cache', event.request.url);
          return response;
        }
        
        // Sinon, fait la requête réseau
        return fetch(event.request)
          .then(response => {
            // Met en cache la nouvelle réponse
            if (event.request.method === 'GET' && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                  console.log('Service Worker: Mise en cache', event.request.url);
                });
            }
            return response;
          })
          .catch(err => {
            console.error('Service Worker: Erreur de réseau', err);
            // Retourne une page d'erreur personnalisée si hors ligne
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Gestion des messages (optionnel pour futures fonctionnalités)
self.addEventListener('message', event => {
  console.log('Service Worker: Message reçu', event.data);
});