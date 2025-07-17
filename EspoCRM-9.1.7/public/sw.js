// EspoCRM PWA Service Worker
const CACHE_NAME = 'espocrm-v1.0.0';
const CACHE_SUFFIX = Date.now();
const DYNAMIC_CACHE = `espocrm-dynamic-${CACHE_SUFFIX}`;
const OFFLINE_URL = '/offline.html';

// Resources to cache immediately
const STATIC_CACHE_RESOURCES = [
    '/',
    '/offline.html',
    '/client/css/espo/hazyblue.css',
    '/client/lib/espo-main.js',
    '/client/img/logo.png',
    '/manifest.json',
    // Add more static resources as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/v1\/App$/,
    /\/api\/v1\/Settings$/,
    /\/api\/v1\/Metadata$/,
    /\/api\/v1\/I18n$/,
    /\/api\/v1\/User\/\w+$/,
];

// API endpoints that should trigger background sync
const SYNC_PATTERNS = [
    /\/api\/v1\/Meeting/,
    /\/api\/v1\/Task/,
    /\/api\/v1\/Call/,
    /\/api\/v1\/Contact/,
    /\/api\/v1\/Account/,
    /\/api\/v1\/Lead/,
    /\/api\/v1\/Opportunity/,
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static resources');
                return cache.addAll(STATIC_CACHE_RESOURCES);
            })
            .then(() => {
                console.log('[ServiceWorker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }
    
    // Handle other requests (CSS, JS, images)
    event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first or network-first strategy
async function handleApiRequest(request) {
    const url = new URL(request.url);
    
    // Check if this is a cacheable API endpoint
    const isCacheable = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
    
    if (isCacheable && request.method === 'GET') {
        return handleCacheableApiRequest(request);
    }
    
    // For non-cacheable or write operations, try network first
    return handleNetworkFirstRequest(request);
}

// Handle cacheable API requests (cache-first strategy)
async function handleCacheableApiRequest(request) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Serve from cache, but also try to update in background
            updateCacheInBackground(request, cache);
            return cachedResponse;
        }
        
        // Not in cache, fetch from network
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
        
    } catch (error) {
        console.error('[ServiceWorker] API request failed:', error);
        // Return cached version if available
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'You are currently offline. Data will sync when connection is restored.'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle network-first requests (for write operations)
async function handleNetworkFirstRequest(request) {
    try {
        const response = await fetch(request);
        
        // If it's a write operation that needs sync, register for background sync
        if (shouldRegisterSync(request)) {
            registerBackgroundSync(request);
        }
        
        return response;
        
    } catch (error) {
        console.error('[ServiceWorker] Network request failed:', error);
        
        // For write operations, store for later sync
        if (request.method !== 'GET' && shouldRegisterSync(request)) {
            await storeForSync(request);
            return new Response(JSON.stringify({
                success: true,
                message: 'Changes saved locally. Will sync when online.',
                queued: true
            }), {
                status: 202,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // For read operations, return cached data if available
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        console.log('[ServiceWorker] Navigation offline, returning cached page');
        const cache = await caches.open(CACHE_NAME);
        return cache.match('/') || cache.match(OFFLINE_URL);
    }
}

// Handle static resource requests
async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[ServiceWorker] Static request failed:', error);
        throw error;
    }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
    } catch (error) {
        console.log('[ServiceWorker] Background update failed:', error);
    }
}

// Check if request should register for background sync
function shouldRegisterSync(request) {
    const url = new URL(request.url);
    return SYNC_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Register background sync
function registerBackgroundSync(request) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        self.registration.sync.register('background-sync');
    }
}

// Store request for later sync
async function storeForSync(request) {
    const syncData = {
        url: request.url,
        method: request.method,
        headers: [...request.headers.entries()],
        body: request.method !== 'GET' ? await request.text() : null,
        timestamp: Date.now()
    };
    
    // Store in IndexedDB
    const db = await openDatabase();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.add(syncData);
}

// Background sync event
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('[ServiceWorker] Background sync');
        event.waitUntil(syncPendingRequests());
    }
});

// Sync pending requests
async function syncPendingRequests() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const requests = await store.getAll();
        
        for (const requestData of requests) {
            try {
                const response = await fetch(requestData.url, {
                    method: requestData.method,
                    headers: new Headers(requestData.headers),
                    body: requestData.body
                });
                
                if (response.ok) {
                    // Remove from sync queue
                    await store.delete(requestData.id);
                    console.log('[ServiceWorker] Synced request:', requestData.url);
                }
            } catch (error) {
                console.error('[ServiceWorker] Sync failed for:', requestData.url, error);
                // Keep in queue for next sync attempt
            }
        }
    } catch (error) {
        console.error('[ServiceWorker] Background sync error:', error);
    }
}

// Open IndexedDB database
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('EspoCRM-PWA', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('syncQueue')) {
                const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('offlineData')) {
                const store = db.createObjectStore('offlineData', { keyPath: 'id' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('lastModified', 'lastModified', { unique: false });
            }
        };
    });
}

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');
    
    const options = {
        body: 'You have new updates in EspoCRM',
        icon: '/client/img/logo-192.png',
        badge: '/client/img/badge-72.png',
        tag: 'espocrm-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Open EspoCRM',
                icon: '/client/img/open-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/client/img/dismiss-icon.png'
            }
        ]
    };
    
    if (event.data) {
        const data = event.data.json();
        options.title = data.title || 'EspoCRM Notification';
        options.body = data.body || options.body;
        options.tag = data.tag || options.tag;
        options.data = data;
    }
    
    event.waitUntil(
        self.registration.showNotification(options.title || 'EspoCRM', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification click:', event.action);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    const urlToOpen = event.action === 'open' || !event.action 
        ? '/' 
        : event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            event.waitUntil(cacheUrls(data.urls));
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(clearCaches());
            break;
            
        case 'GET_OFFLINE_DATA':
            event.waitUntil(getOfflineData(data.type).then(result => {
                event.ports[0].postMessage({ success: true, data: result });
            }));
            break;
            
        default:
            console.log('[ServiceWorker] Unknown message type:', type);
    }
});

// Cache specific URLs
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    return cache.addAll(urls);
}

// Clear all caches
async function clearCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Get offline data
async function getOfflineData(type) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['offlineData'], 'readonly');
        const store = transaction.objectStore('offlineData');
        
        if (type) {
            const index = store.index('type');
            return await index.getAll(type);
        }
        
        return await store.getAll();
    } catch (error) {
        console.error('[ServiceWorker] Error getting offline data:', error);
        return [];
    }
}

console.log('[ServiceWorker] Loaded');