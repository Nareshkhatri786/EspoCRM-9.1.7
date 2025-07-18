const CACHE_NAME = 'espocrm-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache immediately on install
const STATIC_CACHE_FILES = [
  '/',
  '/offline.html',
  '/client/css/espo/hazyblue-vertical.css',
  '/client/lib/jquery.min.js',
  '/client/lib/underscore.min.js',
  '/client/lib/backbone.min.js',
  '/client/lib/handlebars.min.js',
  '/client/lib/moment.min.js',
  '/client/lib/bootstrap.min.js',
  '/client/lib/bootstrap/css/bootstrap.min.css',
  '/client/img/favicon.ico',
  '/client/img/logo.png'
];

// API routes that should be cached
const API_CACHE_PATTERNS = [
  /^\/api\/v1\/User\/[a-zA-Z0-9]+$/,
  /^\/api\/v1\/Settings$/,
  /^\/api\/v1\/I18n$/,
  /^\/api\/v1\/Metadata$/
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Ensure the service worker takes control immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip requests from other origins
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static files and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-then-network strategy for specific endpoints
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (shouldCache) {
    try {
      // Try network first for API requests
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Clone and cache the response
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, responseToCache);
      }
      
      return networkResponse;
    } catch (error) {
      // If network fails, try cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline response for API calls
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Network unavailable. Please check your connection.' 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // For non-cached API requests, just try network
  return fetch(request);
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache successful responses
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // If both cache and network fail, show offline page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, show offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // For other requests, return a generic offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for form submissions and data updates
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  try {
    // Get pending data from IndexedDB
    const pendingData = await getPendingData();
    
    for (const item of pendingData) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });
        
        // Remove successfully synced item
        await removePendingData(item.id);
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData = {
        title: 'EspoCRM Notification',
        body: event.data.text() || 'You have a new notification',
        icon: '/client/img/icon/192x192.png',
        badge: '/client/img/icon/96x96.png'
      };
    }
  }
  
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/client/img/icon/192x192.png',
    badge: notificationData.badge || '/client/img/icon/96x96.png',
    data: notificationData.data || {},
    tag: notificationData.tag || 'espocrm-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/client/img/icon/48x48.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'EspoCRM Notification',
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window/tab open with the target URL
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If no window/tab is already open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Helper functions for IndexedDB operations (for background sync)
async function getPendingData() {
  // Implementation would depend on your IndexedDB structure
  // This is a placeholder for the actual implementation
  return [];
}

async function removePendingData(id) {
  // Implementation would depend on your IndexedDB structure
  // This is a placeholder for the actual implementation
}