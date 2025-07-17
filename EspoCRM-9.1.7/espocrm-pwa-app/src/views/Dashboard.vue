<template>
  <div class="dashboard">
    <div class="container">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {{ user?.name || 'User' }}!</p>
        
        <div class="dashboard-actions">
          <button @click="refreshData" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button @click="requestNotificationPermission" class="btn btn-success" v-if="!notificationsEnabled">
            Enable Notifications
          </button>
        </div>
      </div>

      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <div class="dashboard-grid">
        <!-- Upcoming Tasks -->
        <div class="card">
          <div class="card-header">
            <h3>Upcoming Tasks</h3>
            <span class="badge">{{ upcomingTasks.length }}</span>
          </div>
          <div class="card-content">
            <div v-if="upcomingTasks.length === 0" class="empty-state">
              <p>No upcoming tasks</p>
            </div>
            <div v-else class="activity-list">
              <div 
                v-for="task in upcomingTasks" 
                :key="task.id"
                class="activity-item"
              >
                <div class="activity-info">
                  <h4>{{ task.name }}</h4>
                  <p class="activity-time">
                    {{ formatDateTime(task.dateStart) }}
                  </p>
                  <p v-if="task.description" class="activity-description">
                    {{ task.description }}
                  </p>
                </div>
                <div class="activity-actions">
                  <button @click="completeTask(task)" class="btn btn-success btn-sm">
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Meetings -->
        <div class="card">
          <div class="card-header">
            <h3>Upcoming Meetings</h3>
            <span class="badge">{{ upcomingMeetings.length }}</span>
          </div>
          <div class="card-content">
            <div v-if="upcomingMeetings.length === 0" class="empty-state">
              <p>No upcoming meetings</p>
            </div>
            <div v-else class="activity-list">
              <div 
                v-for="meeting in upcomingMeetings" 
                :key="meeting.id"
                class="activity-item"
              >
                <div class="activity-info">
                  <h4>{{ meeting.name }}</h4>
                  <p class="activity-time">
                    {{ formatDateTime(meeting.dateStart) }}
                  </p>
                  <p v-if="meeting.description" class="activity-description">
                    {{ meeting.description }}
                  </p>
                </div>
                <div class="activity-actions">
                  <button @click="joinMeeting(meeting)" class="btn btn-primary btn-sm">
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="card-content">
            <div class="quick-actions">
              <div class="quick-action-item">
                <label for="phoneNumber" class="form-label">Call a number</label>
                <div class="phone-input-group">
                  <input
                    id="phoneNumber"
                    v-model="phoneNumber"
                    type="tel"
                    class="form-input"
                    placeholder="+1234567890"
                  />
                  <button @click="makeCall" class="btn btn-success" :disabled="!phoneNumber">
                    📞 Call
                  </button>
                </div>
              </div>
              
              <div class="quick-action-item">
                <label for="contactSearch" class="form-label">Search & Call Contact</label>
                <div class="contact-search-group">
                  <input
                    id="contactSearch"
                    v-model="contactSearchQuery"
                    @input="searchContacts"
                    type="text"
                    class="form-input"
                    placeholder="Search contacts..."
                  />
                  <div v-if="searchResults.length > 0" class="contact-results">
                    <div 
                      v-for="contact in searchResults" 
                      :key="contact.id"
                      class="contact-result-item"
                      @click="selectContact(contact)"
                    >
                      <div class="contact-info">
                        <strong>{{ contact.name }}</strong>
                        <div class="contact-phones">
                          <span v-if="contact.phoneNumber" class="phone">
                            📞 {{ contact.phoneNumber }}
                          </span>
                          <span v-if="contact.phoneNumberMobile" class="phone">
                            📱 {{ contact.phoneNumberMobile }}
                          </span>
                        </div>
                      </div>
                      <button class="btn btn-success btn-sm">Call</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Calls -->
        <div class="card">
          <div class="card-header">
            <h3>Recent Calls</h3>
          </div>
          <div class="card-content">
            <div v-if="recentCalls.length === 0" class="empty-state">
              <p>No recent calls</p>
            </div>
            <div v-else class="call-list">
              <div 
                v-for="call in recentCalls" 
                :key="call.id"
                class="call-item"
              >
                <div class="call-info">
                  <h4>{{ call.name || call.phoneNumber }}</h4>
                  <p class="call-time">{{ formatDateTime(call.dateStart) }}</p>
                  <p class="call-status" :class="call.status?.toLowerCase()">
                    {{ call.status || 'Unknown' }}
                  </p>
                </div>
                <div class="call-actions">
                  <button 
                    @click="makeCall(call.phoneNumber, call.parentName)" 
                    class="btn btn-primary btn-sm"
                    v-if="call.phoneNumber"
                  >
                    📞 Call Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Offline indicator -->
      <div v-if="!online" class="offline-banner">
        <span class="offline-dot"></span>
        You are offline. Some features may be limited.
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import moment from 'moment'
import { authStore } from '../stores/auth'
import { callStore } from '../stores/call'
import { espoCrmApi } from '../services/api'
import { notificationService } from '../services/notifications'

export default {
  name: 'Dashboard',
  setup() {
    const loading = ref(false)
    const error = ref('')
    const online = ref(navigator.onLine)
    const upcomingTasks = ref([])
    const upcomingMeetings = ref([])
    const recentCalls = ref([])
    const phoneNumber = ref('')
    const contactSearchQuery = ref('')
    const searchResults = ref([])
    const searchTimeout = ref(null)
    const notificationsEnabled = ref(Notification.permission === 'granted')

    const user = computed(() => authStore.user)

    const formatDateTime = (dateString) => {
      if (!dateString) return 'No date'
      return moment(dateString).format('MMM DD, YYYY h:mm A')
    }

    const refreshData = async () => {
      if (!online.value) {
        error.value = 'Cannot refresh data while offline'
        return
      }

      loading.value = true
      error.value = ''

      try {
        const data = await espoCrmApi.getDashboardData()
        
        upcomingTasks.value = data.upcomingTasks || []
        upcomingMeetings.value = data.upcomingMeetings || []
        recentCalls.value = data.recentCalls || []

        // Set up notification reminders
        notificationService.setupUpcomingActivityReminders(
          upcomingTasks.value,
          upcomingMeetings.value
        )

        // Sync any pending calls
        await callStore.syncPendingCalls()

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        error.value = 'Failed to load dashboard data'
      } finally {
        loading.value = false
      }
    }

    const makeCall = (number = null, contactName = null, contactId = null) => {
      const phoneToCall = number || phoneNumber.value
      
      if (!phoneToCall) return

      // Open default dialer
      window.open(`tel:${phoneToCall}`)
      
      // Show call popup after a short delay
      setTimeout(() => {
        callStore.showCallPopup(phoneToCall, contactName, contactId)
      }, 1000)

      // Clear phone number input if it was used
      if (!number) {
        phoneNumber.value = ''
      }
    }

    const searchContacts = async () => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }

      searchTimeout.value = setTimeout(async () => {
        if (contactSearchQuery.value.length < 2) {
          searchResults.value = []
          return
        }

        try {
          const response = await espoCrmApi.searchContacts(contactSearchQuery.value)
          searchResults.value = response.list || []
        } catch (err) {
          console.error('Error searching contacts:', err)
          searchResults.value = []
        }
      }, 300)
    }

    const selectContact = (contact) => {
      const phoneToCall = contact.phoneNumberMobile || contact.phoneNumber
      if (phoneToCall) {
        makeCall(phoneToCall, contact.name, contact.id)
      }
      
      // Clear search
      contactSearchQuery.value = ''
      searchResults.value = []
    }

    const completeTask = async (task) => {
      // This would require implementing task update API
      console.log('Complete task:', task)
    }

    const joinMeeting = (meeting) => {
      // This could open a meeting URL if available
      console.log('Join meeting:', meeting)
    }

    const requestNotificationPermission = async () => {
      const granted = await notificationService.requestPermission()
      notificationsEnabled.value = granted
      
      if (granted) {
        notificationService.showNotification('Notifications Enabled', {
          body: 'You will now receive reminders for tasks and meetings'
        })
      }
    }

    onMounted(() => {
      // Listen for online/offline events
      window.addEventListener('online', () => {
        online.value = true
        refreshData()
      })
      
      window.addEventListener('offline', () => {
        online.value = false
      })

      // Initial data load
      refreshData()

      // Auto-refresh every 5 minutes when online
      const refreshInterval = setInterval(() => {
        if (online.value && !loading.value) {
          refreshData()
        }
      }, 5 * 60 * 1000) // 5 minutes

      // Cleanup
      return () => {
        clearInterval(refreshInterval)
        if (searchTimeout.value) {
          clearTimeout(searchTimeout.value)
        }
      }
    })

    return {
      loading,
      error,
      online,
      user,
      upcomingTasks,
      upcomingMeetings,
      recentCalls,
      phoneNumber,
      contactSearchQuery,
      searchResults,
      notificationsEnabled,
      formatDateTime,
      refreshData,
      makeCall,
      searchContacts,
      selectContact,
      completeTask,
      joinMeeting,
      requestNotificationPermission
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px 0;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  margin-bottom: 5px;
  color: #2c5282;
}

.dashboard-header p {
  color: #666;
  margin-bottom: 20px;
}

.dashboard-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h3 {
  margin: 0;
  color: #374151;
}

.badge {
  background-color: #2c5282;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.activity-list, .call-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item, .call-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #2c5282;
}

.activity-info, .call-info {
  flex: 1;
}

.activity-info h4, .call-info h4 {
  margin: 0 0 5px 0;
  color: #374151;
  font-size: 16px;
}

.activity-time, .call-time {
  margin: 0 0 5px 0;
  color: #6b7280;
  font-size: 14px;
}

.activity-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.call-status {
  margin: 0;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.call-status.held {
  color: #10b981;
}

.call-status.not-held {
  color: #ef4444;
}

.activity-actions, .call-actions {
  margin-left: 15px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.phone-input-group {
  display: flex;
  gap: 10px;
}

.phone-input-group .form-input {
  flex: 1;
}

.contact-search-group {
  position: relative;
}

.contact-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.contact-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
}

.contact-result-item:hover {
  background-color: #f9fafb;
}

.contact-result-item:last-child {
  border-bottom: none;
}

.contact-info {
  flex: 1;
}

.contact-phones {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.phone {
  font-size: 12px;
  color: #6b7280;
}

.offline-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #dc2626;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  z-index: 1000;
}

.offline-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
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
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-item, .call-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .activity-actions, .call-actions {
    margin-left: 0;
    margin-top: 10px;
  }
  
  .phone-input-group {
    flex-direction: column;
  }
}
</style>