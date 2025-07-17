const CACHE_NAME = 'espocrm-pwa-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
  
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  self.clients.claim()
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html')
        })
    )
    return
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            
            // Cache the response for future use
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
            
            return response
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/index.html')
            }
          })
      })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)
  
  const options = {
    body: 'You have a new notification from EspoCRM',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }

  if (event.data) {
    try {
      const data = event.data.json()
      options.body = data.body || options.body
      options.title = data.title || 'EspoCRM PWA'
      options.data = { ...options.data, ...data }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
    }
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'EspoCRM PWA', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((windowClients) => {
        const data = event.notification.data || {}
        const urlToOpen = data.url || '/'

        // Check if app is already open
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }

        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )

  // Send message to client about notification click
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'NOTIFICATION_CLICK',
        action: event.action,
        notification: {
          tag: event.notification.tag,
          data: event.notification.data
        }
      })
    })
  })
})

// Background sync event (for offline call logging)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-calls') {
    event.waitUntil(syncPendingCalls())
  }
})

// Sync pending calls when back online
async function syncPendingCalls() {
  try {
    // This would typically communicate with the main app
    // to sync pending call data
    console.log('[SW] Syncing pending calls...')
    
    // Send message to client to trigger sync
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_CALLS'
      })
    })
  } catch (error) {
    console.error('[SW] Error syncing calls:', error)
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})