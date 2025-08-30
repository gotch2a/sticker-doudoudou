const CACHE_NAME = 'sticker-doudou-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert')
        return cache.addAll(urlsToCache)
      })
  )
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourne la réponse en cache si elle existe
        if (response) {
          return response
        }
        
        // Sinon, fait la requête réseau
        return fetch(event.request).then((response) => {
          // Vérifie si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone la réponse
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        })
      })
  )
})

// Gestion des notifications push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ouvrir l\'application',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icon-192x192.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Doudoudou', options)
  )
})

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
