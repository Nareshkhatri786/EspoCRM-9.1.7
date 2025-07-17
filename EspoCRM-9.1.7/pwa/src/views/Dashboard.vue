<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    
    <div class="dashboard-grid">
      <!-- Upcoming Tasks -->
      <div class="card">
        <h3>📋 Upcoming Tasks</h3>
        <div v-if="loading.tasks" class="loading">Loading...</div>
        <div v-else-if="dashboardData.tasks.length === 0" class="no-data">
          No upcoming tasks
        </div>
        <div v-else class="task-list">
          <div 
            v-for="task in dashboardData.tasks" 
            :key="task.id" 
            class="task-item"
            @click="toggleTask(task)"
          >
            <div class="task-header">
              <span class="task-name">{{ task.name }}</span>
              <span class="task-status" :class="task.status">{{ task.status }}</span>
            </div>
            <div class="task-details">
              <span v-if="task.dateEnd" class="task-date">Due: {{ formatDate(task.dateEnd) }}</span>
              <span v-if="task.assignedUserName" class="task-assigned">{{ task.assignedUserName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Today's Meetings -->
      <div class="card">
        <h3>📅 Today's Meetings</h3>
        <div v-if="loading.meetings" class="loading">Loading...</div>
        <div v-else-if="dashboardData.meetings.length === 0" class="no-data">
          No meetings today
        </div>
        <div v-else class="meeting-list">
          <div 
            v-for="meeting in dashboardData.meetings" 
            :key="meeting.id" 
            class="meeting-item"
          >
            <div class="meeting-header">
              <span class="meeting-name">{{ meeting.name }}</span>
              <span class="meeting-status" :class="meeting.status">{{ meeting.status }}</span>
            </div>
            <div class="meeting-details">
              <span v-if="meeting.dateStart" class="meeting-time">
                {{ formatTime(meeting.dateStart) }}
              </span>
              <span v-if="meeting.assignedUserName" class="meeting-assigned">
                {{ meeting.assignedUserName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Calls -->
      <div class="card">
        <h3>📞 Recent Calls</h3>
        <div v-if="loading.calls" class="loading">Loading...</div>
        <div v-else-if="dashboardData.calls.length === 0" class="no-data">
          No recent calls
        </div>
        <div v-else class="call-list">
          <div 
            v-for="call in dashboardData.calls" 
            :key="call.id" 
            class="call-item"
          >
            <div class="call-header">
              <span class="call-name">{{ call.name }}</span>
              <span class="call-status" :class="call.status">{{ call.status }}</span>
            </div>
            <div class="call-details">
              <span v-if="call.dateStart" class="call-date">{{ formatDate(call.dateStart) }}</span>
              <span v-if="call.phoneNumber" class="call-phone">{{ call.phoneNumber }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Refresh Button -->
    <button @click="refreshData" :disabled="refreshing" class="refresh-btn">
      {{ refreshing ? 'Refreshing...' : '🔄 Refresh' }}
    </button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { apiService } from '../services/api'

export default {
  name: 'Dashboard',
  setup() {
    const dashboardData = ref({
      tasks: [],
      meetings: [],
      calls: []
    })
    
    const loading = ref({
      tasks: false,
      meetings: false,
      calls: false
    })
    
    const refreshing = ref(false)

    const loadDashboardData = async () => {
      loading.value = { tasks: true, meetings: true, calls: true }
      
      try {
        const data = await apiService.getDashboardData()
        dashboardData.value = data
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        loading.value = { tasks: false, meetings: false, calls: false }
      }
    }

    const refreshData = async () => {
      refreshing.value = true
      await loadDashboardData()
      refreshing.value = false
    }

    const toggleTask = async (task) => {
      try {
        const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed'
        await apiService.updateTask(task.id, { status: newStatus })
        task.status = newStatus
      } catch (error) {
        console.error('Failed to update task:', error)
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }

    const formatTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    onMounted(() => {
      loadDashboardData()
    })

    return {
      dashboardData,
      loading,
      refreshing,
      refreshData,
      toggleTask,
      formatDate,
      formatTime
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.loading, .no-data {
  text-align: center;
  color: #666;
  padding: 1rem;
}

.task-item, .meeting-item, .call-item {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.3s;
}

.task-item:hover, .meeting-item:hover, .call-item:hover {
  background-color: #f8f9fa;
}

.task-item:last-child, .meeting-item:last-child, .call-item:last-child {
  border-bottom: none;
}

.task-header, .meeting-header, .call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.task-name, .meeting-name, .call-name {
  font-weight: 500;
  color: #333;
}

.task-status, .meeting-status, .call-status {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.task-status.completed, .meeting-status.held, .call-status.held {
  background: #d4edda;
  color: #155724;
}

.task-status.in-progress, .meeting-status.planned, .call-status.planned {
  background: #fff3cd;
  color: #856404;
}

.task-status.not-started, .meeting-status.not-held, .call-status.not-held {
  background: #f8d7da;
  color: #721c24;
}

.task-details, .meeting-details, .call-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
}

.refresh-btn {
  display: block;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .dashboard {
    padding: 0.75rem;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .card {
    padding: 1rem;
  }
  
  .task-details, .meeting-details, .call-details {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>