/**
 * EspoCRM PWA Module
 * Handles PWA-specific functionality including notifications, offline sync, and call integration
 */

define('modules/pwa/pwa-manager', ['module'], function (module) {

    class PWAManager {
        constructor(app) {
            this.app = app;
            this.notificationManager = new NotificationManager(app);
            this.offlineManager = new OfflineManager(app);
            this.callManager = new CallManager(app);
            this.syncManager = new SyncManager(app);
            
            this.initialize();
        }

        initialize() {
            console.log('PWA Manager initialized');
            
            // Set up periodic sync for reminders
            this.setupReminderSync();
            
            // Set up call integration
            this.setupCallIntegration();
            
            // Set up offline detection
            this.setupOfflineDetection();
        }

        setupReminderSync() {
            // Check for upcoming meetings and tasks every minute
            setInterval(() => {
                this.checkUpcomingReminders();
            }, 60000);
        }

        async checkUpcomingReminders() {
            try {
                const now = new Date();
                const inFiveMinutes = new Date(now.getTime() + 5 * 60000);
                
                // Check meetings
                const upcomingMeetings = await this.app.getCollectionFactory().create('Meeting')
                    .fetch({
                        where: [
                            {
                                type: 'and',
                                value: [
                                    {
                                        type: 'greaterThan',
                                        attribute: 'dateStart',
                                        value: now.toISOString()
                                    },
                                    {
                                        type: 'lessThan',
                                        attribute: 'dateStart',
                                        value: inFiveMinutes.toISOString()
                                    }
                                ]
                            }
                        ]
                    });

                // Check tasks
                const upcomingTasks = await this.app.getCollectionFactory().create('Task')
                    .fetch({
                        where: [
                            {
                                type: 'and',
                                value: [
                                    {
                                        type: 'greaterThan',
                                        attribute: 'dateEnd',
                                        value: now.toISOString()
                                    },
                                    {
                                        type: 'lessThan',
                                        attribute: 'dateEnd',
                                        value: inFiveMinutes.toISOString()
                                    },
                                    {
                                        type: 'notEquals',
                                        attribute: 'status',
                                        value: 'Completed'
                                    }
                                ]
                            }
                        ]
                    });

                // Send notifications
                upcomingMeetings.models.forEach(meeting => {
                    this.notificationManager.showMeetingReminder(meeting);
                });

                upcomingTasks.models.forEach(task => {
                    this.notificationManager.showTaskReminder(task);
                });

            } catch (error) {
                console.error('Error checking reminders:', error);
            }
        }

        setupCallIntegration() {
            // Override phone number links to use PWA call functionality
            document.addEventListener('click', (event) => {
                if (event.target.matches('a[href^="tel:"]')) {
                    event.preventDefault();
                    const phoneNumber = event.target.href.replace('tel:', '');
                    this.callManager.initiateCall(phoneNumber, event.target);
                }
            });
        }

        setupOfflineDetection() {
            window.addEventListener('online', () => {
                this.onOnline();
            });

            window.addEventListener('offline', () => {
                this.onOffline();
            });
        }

        onOnline() {
            console.log('App is online');
            this.app.getBaseController().notify('Back online. Syncing data...', 'success', 3000);
            this.syncManager.syncPendingChanges();
        }

        onOffline() {
            console.log('App is offline');
            this.app.getBaseController().notify('You are offline. Changes will be saved locally.', 'warning', 5000);
        }
    }

    class NotificationManager {
        constructor(app) {
            this.app = app;
        }

        async showMeetingReminder(meeting) {
            if (!this.canShowNotifications()) return;

            const title = 'Meeting Reminder';
            const body = `Meeting "${meeting.get('name')}" starts in 5 minutes`;
            
            await this.showNotification(title, {
                body: body,
                icon: '/client/img/meeting-icon-192.png',
                tag: 'meeting-' + meeting.id,
                data: {
                    type: 'meeting',
                    id: meeting.id,
                    url: '#Meeting/view/' + meeting.id
                },
                actions: [
                    {
                        action: 'view',
                        title: 'View Meeting',
                        icon: '/client/img/view-icon.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss',
                        icon: '/client/img/dismiss-icon.png'
                    }
                ]
            });
        }

        async showTaskReminder(task) {
            if (!this.canShowNotifications()) return;

            const title = 'Task Reminder';
            const body = `Task "${task.get('name')}" is due in 5 minutes`;
            
            await this.showNotification(title, {
                body: body,
                icon: '/client/img/task-icon-192.png',
                tag: 'task-' + task.id,
                data: {
                    type: 'task',
                    id: task.id,
                    url: '#Task/view/' + task.id
                },
                actions: [
                    {
                        action: 'view',
                        title: 'View Task',
                        icon: '/client/img/view-icon.png'
                    },
                    {
                        action: 'complete',
                        title: 'Mark Complete',
                        icon: '/client/img/complete-icon.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss',
                        icon: '/client/img/dismiss-icon.png'
                    }
                ]
            });
        }

        canShowNotifications() {
            return 'Notification' in window && Notification.permission === 'granted';
        }

        async showNotification(title, options) {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                // Use service worker to show notification
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title: title,
                    options: options
                });
            } else {
                // Fallback to direct notification
                new Notification(title, options);
            }
        }
    }

    class OfflineManager {
        constructor(app) {
            this.app = app;
            this.dbName = 'EspoCRM-PWA';
            this.dbVersion = 1;
            this.db = null;
            
            this.initializeDatabase();
        }

        async initializeDatabase() {
            try {
                this.db = await this.openDatabase();
                console.log('Offline database initialized');
            } catch (error) {
                console.error('Failed to initialize offline database:', error);
            }
        }

        openDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create stores for different entity types
                    const entities = ['Meeting', 'Task', 'Call', 'Contact', 'Account', 'Lead', 'Opportunity'];
                    
                    entities.forEach(entityType => {
                        if (!db.objectStoreNames.contains(entityType)) {
                            const store = db.createObjectStore(entityType, { keyPath: 'id' });
                            store.createIndex('modifiedAt', 'modifiedAt', { unique: false });
                        }
                    });
                    
                    // Create sync queue store
                    if (!db.objectStoreNames.contains('syncQueue')) {
                        const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };
            });
        }

        async saveOfflineData(entityType, data) {
            if (!this.db) return false;
            
            try {
                const transaction = this.db.transaction([entityType], 'readwrite');
                const store = transaction.objectStore(entityType);
                
                data.modifiedAt = new Date().toISOString();
                data.offlineModified = true;
                
                await store.put(data);
                return true;
            } catch (error) {
                console.error('Failed to save offline data:', error);
                return false;
            }
        }

        async getOfflineData(entityType, id) {
            if (!this.db) return null;
            
            try {
                const transaction = this.db.transaction([entityType], 'readonly');
                const store = transaction.objectStore(entityType);
                
                return await store.get(id);
            } catch (error) {
                console.error('Failed to get offline data:', error);
                return null;
            }
        }

        async getAllOfflineData(entityType) {
            if (!this.db) return [];
            
            try {
                const transaction = this.db.transaction([entityType], 'readonly');
                const store = transaction.objectStore(entityType);
                
                return await store.getAll();
            } catch (error) {
                console.error('Failed to get all offline data:', error);
                return [];
            }
        }

        async queueForSync(operation, entityType, data) {
            if (!this.db) return false;
            
            try {
                const transaction = this.db.transaction(['syncQueue'], 'readwrite');
                const store = transaction.objectStore('syncQueue');
                
                const syncItem = {
                    operation: operation, // 'create', 'update', 'delete'
                    entityType: entityType,
                    data: data,
                    timestamp: new Date().toISOString()
                };
                
                await store.add(syncItem);
                return true;
            } catch (error) {
                console.error('Failed to queue for sync:', error);
                return false;
            }
        }
    }

    class CallManager {
        constructor(app) {
            this.app = app;
            this.currentCall = null;
        }

        initiateCall(phoneNumber, element) {
            // Get contact information from the element or context
            const contactData = this.extractContactData(element);
            
            this.currentCall = {
                phoneNumber: phoneNumber,
                contactData: contactData,
                startTime: new Date(),
                element: element
            };
            
            // Open the default dialer
            if (this.isMobile()) {
                window.open('tel:' + phoneNumber);
                
                // Show call outcome dialog after a delay
                setTimeout(() => {
                    this.showCallOutcomeDialog();
                }, 3000); // 3 seconds delay to allow for call initiation
            } else {
                // For desktop, show a message
                this.app.getBaseController().notify(
                    'Call initiated to ' + phoneNumber + '. Please use your phone to complete the call.',
                    'info',
                    5000
                );
                
                // Still show outcome dialog for tracking
                setTimeout(() => {
                    this.showCallOutcomeDialog();
                }, 1000);
            }
        }

        extractContactData(element) {
            // Try to extract contact information from the element's context
            let contactData = {};
            
            // Look for contact information in parent elements
            let parent = element.closest('[data-id]');
            if (parent) {
                contactData.id = parent.getAttribute('data-id');
            }
            
            // Look for contact name
            let nameElement = element.closest('.record-row, .list-row, .detail-view')?.querySelector('.name, .field-name, [data-name="name"]');
            if (nameElement) {
                contactData.name = nameElement.textContent?.trim();
            }
            
            return contactData;
        }

        showCallOutcomeDialog() {
            if (!this.currentCall) return;
            
            // Create a modal dialog for call outcome
            this.app.getBaseController().notify(
                'How did your call go? Please record the outcome.',
                'info',
                0 // Don't auto-hide
            );
            
            // Use EspoCRM's modal system to show outcome options
            const viewOptions = {
                callData: this.currentCall,
                outcomeOptions: [
                    { value: 'Answered', label: 'Answered' },
                    { value: 'Not Answered', label: 'Not Answered' },
                    { value: 'Busy', label: 'Busy' },
                    { value: 'Voicemail', label: 'Voicemail' },
                    { value: 'No Answer', label: 'No Answer' }
                ]
            };
            
            // For now, use a simple confirm dialog
            this.app.getBaseController().confirm(
                'Call completed. Was the call answered?',
                {
                    confirmText: 'Yes - Answered',
                    cancelText: 'No - Not Answered'
                },
                () => {
                    this.recordCallOutcome('Answered');
                },
                () => {
                    this.recordCallOutcome('Not Answered');
                }
            );
        }

        recordCallOutcome(outcome, notes = '') {
            if (!this.currentCall) return;
            
            const callRecord = {
                name: `Call to ${this.currentCall.contactData.name || this.currentCall.phoneNumber}`,
                phoneNumber: this.currentCall.phoneNumber,
                status: outcome === 'Answered' ? 'Held' : 'Not Held',
                direction: 'Outbound',
                dateStart: this.currentCall.startTime.toISOString(),
                dateEnd: new Date().toISOString(),
                description: notes,
                outcome: outcome
            };
            
            // Link to contact if available
            if (this.currentCall.contactData.id) {
                callRecord.parentId = this.currentCall.contactData.id;
                callRecord.parentType = 'Contact';
            }
            
            // Try to save to server
            this.saveCallRecord(callRecord);
            
            // Clear current call
            this.currentCall = null;
        }

        async saveCallRecord(callRecord) {
            try {
                const callModel = this.app.getModelFactory().create('Call');
                callModel.set(callRecord);
                
                await callModel.save();
                
                this.app.getBaseController().notify('Call record saved successfully', 'success');
                
            } catch (error) {
                console.error('Failed to save call record:', error);
                
                // Save offline for later sync
                const offlineManager = new OfflineManager(this.app);
                await offlineManager.saveOfflineData('Call', callRecord);
                await offlineManager.queueForSync('create', 'Call', callRecord);
                
                this.app.getBaseController().notify('Call record saved offline. Will sync when online.', 'warning');
            }
        }

        isMobile() {
            return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
    }

    class SyncManager {
        constructor(app) {
            this.app = app;
            this.offlineManager = new OfflineManager(app);
            this.syncing = false;
        }

        async syncPendingChanges() {
            if (this.syncing) return;
            
            this.syncing = true;
            console.log('Starting sync of pending changes...');
            
            try {
                // Get all pending sync items
                const syncQueue = await this.getSyncQueue();
                
                for (const item of syncQueue) {
                    try {
                        await this.syncItem(item);
                        await this.removeSyncItem(item.id);
                    } catch (error) {
                        console.error('Failed to sync item:', item, error);
                        // Keep in queue for next sync attempt
                    }
                }
                
                console.log('Sync completed');
                
            } catch (error) {
                console.error('Sync failed:', error);
            } finally {
                this.syncing = false;
            }
        }

        async getSyncQueue() {
            if (!this.offlineManager.db) return [];
            
            try {
                const transaction = this.offlineManager.db.transaction(['syncQueue'], 'readonly');
                const store = transaction.objectStore('syncQueue');
                return await store.getAll();
            } catch (error) {
                console.error('Failed to get sync queue:', error);
                return [];
            }
        }

        async syncItem(item) {
            const { operation, entityType, data } = item;
            
            switch (operation) {
                case 'create':
                    return this.syncCreate(entityType, data);
                case 'update':
                    return this.syncUpdate(entityType, data);
                case 'delete':
                    return this.syncDelete(entityType, data);
                default:
                    throw new Error('Unknown operation: ' + operation);
            }
        }

        async syncCreate(entityType, data) {
            const model = this.app.getModelFactory().create(entityType);
            model.set(data);
            return model.save();
        }

        async syncUpdate(entityType, data) {
            const model = this.app.getModelFactory().create(entityType);
            model.id = data.id;
            model.set(data);
            return model.save();
        }

        async syncDelete(entityType, data) {
            const model = this.app.getModelFactory().create(entityType);
            model.id = data.id;
            return model.destroy();
        }

        async removeSyncItem(id) {
            if (!this.offlineManager.db) return;
            
            const transaction = this.offlineManager.db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            await store.delete(id);
        }
    }

    return PWAManager;
});

// Initialize PWA Manager when EspoCRM app is ready
define('modules/pwa/init', ['modules/pwa/pwa-manager'], function (PWAManager) {
    
    let pwaManager = null;
    
    const init = function(app) {
        if (!pwaManager) {
            pwaManager = new PWAManager(app);
            
            // Make PWA manager available globally
            app.pwaManager = pwaManager;
            window.EspoCRMPWA = window.EspoCRMPWA || {};
            window.EspoCRMPWA.manager = pwaManager;
        }
        
        return pwaManager;
    };
    
    return {
        init: init
    };
});