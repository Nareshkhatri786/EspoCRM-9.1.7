/**
 * PWA (Progressive Web App) Manager
 * Handles offline data storage, push notifications, and advanced PWA features
 */
define('custom:modules/pwa/pwa-manager', [], function() {
    
    var PwaManager = function() {
        this.dbName = 'EspoCRM-PWA';
        this.dbVersion = 1;
        this.db = null;
        this.storeName = 'offlineData';
    };

    _.extend(PwaManager.prototype, {

        /**
         * Initialize PWA manager
         */
        init: function() {
            this.initIndexedDB();
            this.initPushNotifications();
            this.setupBackgroundSync();
        },

        /**
         * Initialize IndexedDB for offline storage
         */
        initIndexedDB: function() {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported');
                return;
            }

            var request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = function(event) {
                console.error('IndexedDB error:', event.target.error);
            };

            request.onsuccess = function(event) {
                this.db = event.target.result;
                console.log('IndexedDB initialized successfully');
            }.bind(this);

            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                
                // Create object store for offline data
                if (!db.objectStoreNames.contains(this.storeName)) {
                    var objectStore = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    objectStore.createIndex('entityType', 'entityType', { unique: false });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('synced', 'synced', { unique: false });
                }
            }.bind(this);
        },

        /**
         * Save data for offline access
         */
        saveOfflineData: function(entityType, entityId, data) {
            if (!this.db) return Promise.reject('IndexedDB not available');

            return new Promise(function(resolve, reject) {
                var transaction = this.db.transaction([this.storeName], 'readwrite');
                var objectStore = transaction.objectStore(this.storeName);
                
                var record = {
                    entityType: entityType,
                    entityId: entityId,
                    data: data,
                    timestamp: Date.now(),
                    synced: true
                };

                var request = objectStore.put(record);
                
                request.onsuccess = function() {
                    resolve(record);
                };
                
                request.onerror = function() {
                    reject(request.error);
                };
            }.bind(this));
        },

        /**
         * Get offline data
         */
        getOfflineData: function(entityType, entityId) {
            if (!this.db) return Promise.reject('IndexedDB not available');

            return new Promise(function(resolve, reject) {
                var transaction = this.db.transaction([this.storeName], 'readonly');
                var objectStore = transaction.objectStore(this.storeName);
                var index = objectStore.index('entityType');
                
                var request = index.getAll(entityType);
                
                request.onsuccess = function() {
                    var results = request.result;
                    if (entityId) {
                        results = results.filter(function(item) {
                            return item.entityId === entityId;
                        });
                    }
                    resolve(results);
                };
                
                request.onerror = function() {
                    reject(request.error);
                };
            });
        },

        /**
         * Save pending changes for background sync
         */
        savePendingChange: function(method, url, data) {
            if (!this.db) return Promise.reject('IndexedDB not available');

            return new Promise(function(resolve, reject) {
                var transaction = this.db.transaction([this.storeName], 'readwrite');
                var objectStore = transaction.objectStore(this.storeName);
                
                var record = {
                    type: 'pendingChange',
                    method: method,
                    url: url,
                    data: data,
                    timestamp: Date.now(),
                    synced: false
                };

                var request = objectStore.add(record);
                
                request.onsuccess = function() {
                    resolve(record);
                };
                
                request.onerror = function() {
                    reject(request.error);
                };
            }.bind(this));
        },

        /**
         * Initialize push notifications
         */
        initPushNotifications: function() {
            if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.warn('Push notifications not supported');
                return;
            }

            // Request notification permission if not already granted
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(function(permission) {
                    console.log('Notification permission:', permission);
                });
            }
        },

        /**
         * Subscribe to push notifications
         */
        subscribeToPush: function() {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                return Promise.reject('Push notifications not supported');
            }

            return navigator.serviceWorker.ready.then(function(registration) {
                return registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    // Note: In production, you would need a proper VAPID key
                    applicationServerKey: null
                });
            }).then(function(subscription) {
                console.log('Push subscription:', subscription);
                // Send subscription to server
                return this.sendSubscriptionToServer(subscription);
            }.bind(this));
        },

        /**
         * Send push subscription to server
         */
        sendSubscriptionToServer: function(subscription) {
            // This would send the subscription to your EspoCRM backend
            // to store and use for sending push notifications
            return fetch('/api/v1/PushNotification/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscription
                })
            });
        },

        /**
         * Setup background sync for offline changes
         */
        setupBackgroundSync: function() {
            if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
                console.warn('Background sync not supported');
                return;
            }

            navigator.serviceWorker.ready.then(function(registration) {
                return registration.sync.register('background-sync');
            }).catch(function(error) {
                console.error('Background sync registration failed:', error);
            });
        },

        /**
         * Check if app is running in standalone mode (installed as PWA)
         */
        isStandalone: function() {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   window.navigator.standalone === true;
        },

        /**
         * Get app installation status
         */
        getInstallationStatus: function() {
            return {
                isInstallable: !!window.deferredPrompt,
                isInstalled: this.isStandalone(),
                isServiceWorkerSupported: 'serviceWorker' in navigator,
                isPushSupported: 'PushManager' in window,
                isNotificationSupported: 'Notification' in window
            };
        },

        /**
         * Clear offline data cache
         */
        clearOfflineData: function() {
            if (!this.db) return Promise.reject('IndexedDB not available');

            return new Promise(function(resolve, reject) {
                var transaction = this.db.transaction([this.storeName], 'readwrite');
                var objectStore = transaction.objectStore(this.storeName);
                
                var request = objectStore.clear();
                
                request.onsuccess = function() {
                    resolve();
                };
                
                request.onerror = function() {
                    reject(request.error);
                };
            }.bind(this));
        }
    });

    return PwaManager;
});