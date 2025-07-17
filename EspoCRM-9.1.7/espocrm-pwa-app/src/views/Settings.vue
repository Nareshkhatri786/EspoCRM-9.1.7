<template>
  <div class="settings">
    <div class="container">
      <div class="settings-header">
        <h1>Settings</h1>
        <p>Manage your EspoCRM PWA preferences</p>
      </div>

      <div class="settings-grid">
        <!-- Connection Settings -->
        <div class="card">
          <div class="card-header">
            <h3>Connection</h3>
          </div>
          <div class="card-content">
            <div class="form-group">
              <label class="form-label">EspoCRM Server URL</label>
              <input
                v-model="serverUrl"
                type="url"
                class="form-input"
                placeholder="https://your-espocrm.com"
                readonly
              />
              <small class="form-help">Contact your administrator to change the server URL</small>
            </div>

            <div class="form-group">
              <label class="form-label">Current User</label>
              <div class="user-info">
                <div class="user-avatar">
                  {{ user?.name?.charAt(0) || 'U' }}
                </div>
                <div class="user-details">
                  <strong>{{ user?.name || 'Unknown User' }}</strong>
                  <div class="user-email">{{ user?.emailAddress || 'No email' }}</div>
                </div>
              </div>
            </div>

            <div class="connection-status">
              <div class="status-indicator" :class="{ online, offline: !online }">
                <span class="status-dot"></span>
                {{ online ? 'Connected' : 'Offline' }}
              </div>
              <button @click="testConnection" class="btn btn-primary" :disabled="testing">
                {{ testing ? 'Testing...' : 'Test Connection' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="card">
          <div class="card-header">
            <h3>Notifications</h3>
          </div>
          <div class="card-content">
            <div class="setting-item">
              <div class="setting-info">
                <h4>Push Notifications</h4>
                <p>Receive notifications for tasks and meetings</p>
              </div>
              <div class="setting-control">
                <button 
                  @click="toggleNotifications" 
                  class="btn"
                  :class="notificationsEnabled ? 'btn-success' : 'btn-primary'"
                >
                  {{ notificationsEnabled ? 'Enabled' : 'Enable' }}
                </button>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>Task Reminders</h4>
                <p>Get notified 15 minutes before tasks start</p>
              </div>
              <div class="setting-control">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.taskReminders"
                    @change="saveSettings"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>Meeting Reminders</h4>
                <p>Get notified 10 minutes before meetings start</p>
              </div>
              <div class="setting-control">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.meetingReminders"
                    @change="saveSettings"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Call Settings -->
        <div class="card">
          <div class="card-header">
            <h3>Call Features</h3>
          </div>
          <div class="card-content">
            <div class="setting-item">
              <div class="setting-info">
                <h4>Auto Call Logging</h4>
                <p>Automatically log calls to EspoCRM</p>
              </div>
              <div class="setting-control">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.autoCallLogging"
                    @change="saveSettings"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>Default Call Duration</h4>
                <p>Default duration for logged calls (minutes)</p>
              </div>
              <div class="setting-control">
                <input
                  type="number"
                  v-model.number="settings.defaultCallDuration"
                  @change="saveSettings"
                  class="form-input"
                  min="1"
                  max="60"
                  style="width: 80px;"
                />
              </div>
            </div>

            <div class="call-history-section">
              <h4>Call History</h4>
              <p>{{ callHistory.length }} calls stored locally</p>
              <div class="call-history-actions">
                <button @click="syncCallHistory" class="btn btn-primary" :disabled="syncing">
                  {{ syncing ? 'Syncing...' : 'Sync to EspoCRM' }}
                </button>
                <button @click="clearCallHistory" class="btn btn-danger">
                  Clear History
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- App Settings -->
        <div class="card">
          <div class="card-header">
            <h3>App Preferences</h3>
          </div>
          <div class="card-content">
            <div class="setting-item">
              <div class="setting-info">
                <h4>Theme</h4>
                <p>Choose your preferred app theme</p>
              </div>
              <div class="setting-control">
                <select 
                  v-model="settings.theme" 
                  @change="saveSettings"
                  class="form-input"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>Auto Refresh</h4>
                <p>Automatically refresh dashboard data</p>
              </div>
              <div class="setting-control">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.autoRefresh"
                    @change="saveSettings"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="app-info">
              <h4>App Information</h4>
              <div class="info-grid">
                <div class="info-item">
                  <strong>Version:</strong> 1.0.0
                </div>
                <div class="info-item">
                  <strong>Installation:</strong> {{ isInstalled ? 'Installed' : 'Browser' }}
                </div>
                <div class="info-item">
                  <strong>Storage Used:</strong> {{ storageUsed }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="message" class="alert" :class="messageType">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { authStore } from '../stores/auth'
import { callStore } from '../stores/call'
import { espoCrmApi } from '../services/api'
import { notificationService } from '../services/notifications'

export default {
  name: 'Settings',
  setup() {
    const online = ref(navigator.onLine)
    const testing = ref(false)
    const syncing = ref(false)
    const message = ref('')
    const messageType = ref('alert-success')
    const notificationsEnabled = ref(Notification.permission === 'granted')
    const isInstalled = ref(false)
    
    const settings = ref({
      taskReminders: true,
      meetingReminders: true,
      autoCallLogging: true,
      defaultCallDuration: 5,
      theme: 'light',
      autoRefresh: true
    })

    const user = computed(() => authStore.user)
    const serverUrl = computed(() => authStore.serverUrl)
    const callHistory = computed(() => callStore.callHistory)

    const storageUsed = computed(() => {
      try {
        const used = JSON.stringify(localStorage).length
        const mb = (used / 1024 / 1024).toFixed(2)
        return `${mb} MB`
      } catch {
        return 'Unknown'
      }
    })

    const loadSettings = () => {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        Object.assign(settings.value, JSON.parse(savedSettings))
      }
    }

    const saveSettings = () => {
      localStorage.setItem('app_settings', JSON.stringify(settings.value))
      showMessage('Settings saved successfully', 'alert-success')
    }

    const showMessage = (text, type = 'alert-success') => {
      message.value = text
      messageType.value = type
      setTimeout(() => {
        message.value = ''
      }, 3000)
    }

    const testConnection = async () => {
      testing.value = true
      
      try {
        await espoCrmApi.getCurrentUser()
        showMessage('Connection successful', 'alert-success')
      } catch (error) {
        console.error('Connection test failed:', error)
        showMessage('Connection failed: ' + error.message, 'alert-error')
      } finally {
        testing.value = false
      }
    }

    const toggleNotifications = async () => {
      if (notificationsEnabled.value) {
        showMessage('Notifications are already enabled', 'alert-success')
        return
      }

      const granted = await notificationService.requestPermission()
      notificationsEnabled.value = granted
      
      if (granted) {
        showMessage('Notifications enabled successfully', 'alert-success')
        notificationService.showNotification('Notifications Enabled', {
          body: 'You will now receive reminders for tasks and meetings'
        })
      } else {
        showMessage('Failed to enable notifications', 'alert-error')
      }
    }

    const syncCallHistory = async () => {
      syncing.value = true
      
      try {
        await callStore.syncPendingCalls()
        showMessage('Call history synced successfully', 'alert-success')
      } catch (error) {
        console.error('Sync failed:', error)
        showMessage('Failed to sync call history', 'alert-error')
      } finally {
        syncing.value = false
      }
    }

    const clearCallHistory = () => {
      if (confirm('Are you sure you want to clear all call history? This action cannot be undone.')) {
        callStore.callHistory.length = 0
        localStorage.removeItem('call_history')
        showMessage('Call history cleared', 'alert-success')
      }
    }

    const checkInstallation = () => {
      // Check if app is installed (running in standalone mode)
      isInstalled.value = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone ||
                         document.referrer.includes('android-app://')
    }

    onMounted(() => {
      loadSettings()
      checkInstallation()
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        online.value = true
      })
      
      window.addEventListener('offline', () => {
        online.value = false
      })
    })

    return {
      online,
      testing,
      syncing,
      message,
      messageType,
      notificationsEnabled,
      isInstalled,
      settings,
      user,
      serverUrl,
      callHistory,
      storageUsed,
      saveSettings,
      testConnection,
      toggleNotifications,
      syncCallHistory,
      clearCallHistory
    }
  }
}
</script>

<style scoped>
.settings {
  padding: 20px 0;
}

.settings-header {
  margin-bottom: 30px;
}

.settings-header h1 {
  margin-bottom: 5px;
  color: #2c5282;
}

.settings-header p {
  color: #666;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.card-header h3 {
  margin: 0;
  color: #374151;
}

.form-help {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #2c5282;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.user-details {
  flex: 1;
}

.user-email {
  color: #6b7280;
  font-size: 14px;
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-top: 15px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.status-indicator.online {
  color: #10b981;
}

.status-indicator.offline {
  color: #dc2626;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.online .status-dot {
  background-color: #10b981;
}

.status-indicator.offline .status-dot {
  background-color: #dc2626;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-info h4 {
  margin: 0 0 4px 0;
  color: #374151;
  font-size: 16px;
}

.setting-info p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.setting-control {
  margin-left: 20px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #2c5282;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.call-history-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.call-history-section h4 {
  margin: 0 0 8px 0;
  color: #374151;
}

.call-history-section p {
  color: #6b7280;
  margin: 0 0 15px 0;
}

.call-history-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.app-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.app-info h4 {
  margin: 0 0 15px 0;
  color: #374151;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #6b7280;
  font-size: 14px;
}

.alert {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 300px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .setting-control {
    margin-left: 0;
    text-align: right;
  }
  
  .connection-status {
    flex-direction: column;
    gap: 10px;
  }
  
  .call-history-actions {
    flex-direction: column;
  }
}
</style>