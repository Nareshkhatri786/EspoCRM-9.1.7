<template>
  <div class="meetings">
    <div class="header">
      <h1>Meetings</h1>
      <div class="filters">
        <select v-model="filter" @change="loadMeetings" class="filter-select">
          <option value="all">All Meetings</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="planned">Planned</option>
          <option value="held">Held</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading meetings...</div>
    
    <div v-else-if="meetings.length === 0" class="no-data">
      No meetings found
    </div>
    
    <div v-else class="meeting-list">
      <div 
        v-for="meeting in meetings" 
        :key="meeting.id" 
        class="meeting-card"
        :class="{ 'past': isPast(meeting), 'today': isToday(meeting) }"
      >
        <div class="meeting-header">
          <div class="meeting-info">
            <h3 class="meeting-name">{{ meeting.name }}</h3>
            <p v-if="meeting.description" class="meeting-description">{{ meeting.description }}</p>
          </div>
          <div class="meeting-status">
            <span class="status-badge" :class="meeting.status?.toLowerCase()">
              {{ meeting.status }}
            </span>
          </div>
        </div>
        
        <div class="meeting-details">
          <div class="detail-row">
            <span class="label">📅 Date & Time:</span>
            <span class="datetime">
              {{ formatDateTime(meeting.dateStart) }}
              <span v-if="meeting.dateEnd"> - {{ formatTime(meeting.dateEnd) }}</span>
            </span>
          </div>
          
          <div v-if="meeting.assignedUserName" class="detail-row">
            <span class="label">👤 Organizer:</span>
            <span class="organizer">{{ meeting.assignedUserName }}</span>
          </div>
          
          <div v-if="meeting.parentName" class="detail-row">
            <span class="label">🔗 Related to:</span>
            <span class="related">{{ meeting.parentName }}</span>
          </div>
          
          <div v-if="meeting.acceptanceStatus" class="detail-row">
            <span class="label">✅ Your Status:</span>
            <span class="acceptance" :class="meeting.acceptanceStatus?.toLowerCase()">
              {{ meeting.acceptanceStatus }}
            </span>
          </div>
        </div>
        
        <!-- Attendees -->
        <div v-if="meeting.users && meeting.users.length > 0" class="attendees">
          <h4>👥 Attendees:</h4>
          <div class="attendee-list">
            <span 
              v-for="user in meeting.users" 
              :key="user.id" 
              class="attendee"
            >
              {{ user.name }}
            </span>
          </div>
        </div>
        
        <div class="meeting-actions">
          <button 
            v-if="canJoin(meeting)" 
            @click="joinMeeting(meeting)" 
            class="action-btn join"
          >
            🎥 Join
          </button>
          <button 
            v-if="canMarkHeld(meeting)" 
            @click="markAsHeld(meeting)" 
            class="action-btn complete"
          >
            ✅ Mark as Held
          </button>
          <button @click="editMeeting(meeting)" class="action-btn edit">
            📝 Edit
          </button>
          <button @click="viewMeeting(meeting)" class="action-btn view">
            👁️ View
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMoreMeetings" class="load-more-btn">
        Load More
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { apiService } from '../services/api'

export default {
  name: 'Meetings',
  setup() {
    const meetings = ref([])
    const loading = ref(false)
    const filter = ref('upcoming')
    const offset = ref(0)
    const limit = ref(20)
    const hasMore = ref(true)

    const loadMeetings = async (reset = true) => {
      loading.value = true
      
      if (reset) {
        offset.value = 0
        meetings.value = []
      }

      try {
        const params = {
          offset: offset.value,
          limit: limit.value,
          orderBy: 'dateStart',
          order: 'asc'
        }

        // Apply filters
        switch (filter.value) {
          case 'today':
            params.where = [{ type: 'today', field: 'dateStart' }]
            break
          case 'upcoming':
            params.where = [{ type: 'future', field: 'dateStart' }]
            break
          case 'past':
            params.where = [{ type: 'past', field: 'dateStart' }]
            break
          case 'planned':
            params.where = [{ type: 'equals', field: 'status', value: 'Planned' }]
            break
          case 'held':
            params.where = [{ type: 'equals', field: 'status', value: 'Held' }]
            break
        }

        const response = await apiService.getMeetings(params)
        
        if (reset) {
          meetings.value = response.list || []
        } else {
          meetings.value.push(...(response.list || []))
        }
        
        hasMore.value = (response.list?.length || 0) === limit.value
        offset.value += limit.value
        
      } catch (error) {
        console.error('Failed to load meetings:', error)
      } finally {
        loading.value = false
      }
    }

    const loadMoreMeetings = () => {
      loadMeetings(false)
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString()
    }

    const formatTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const isToday = (meeting) => {
      if (!meeting.dateStart) return false
      const today = new Date()
      const meetingDate = new Date(meeting.dateStart)
      return meetingDate.toDateString() === today.toDateString()
    }

    const isPast = (meeting) => {
      if (!meeting.dateStart) return false
      return new Date(meeting.dateStart) < new Date()
    }

    const canJoin = (meeting) => {
      return meeting.status === 'Planned' && 
             isToday(meeting) && 
             new Date(meeting.dateStart) <= new Date()
    }

    const canMarkHeld = (meeting) => {
      return meeting.status === 'Planned' && isPast(meeting)
    }

    const joinMeeting = (meeting) => {
      // In a real app, this would open meeting link or start video call
      alert(`Joining meeting "${meeting.name}"`)
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Meeting Started', {
          body: `Joined meeting: ${meeting.name}`,
          icon: '/favicon.ico'
        })
      }
    }

    const markAsHeld = async (meeting) => {
      try {
        await apiService.updateMeeting(meeting.id, { status: 'Held' })
        meeting.status = 'Held'
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Meeting Updated', {
            body: `Meeting "${meeting.name}" marked as held`,
            icon: '/favicon.ico'
          })
        }
      } catch (error) {
        console.error('Failed to update meeting:', error)
        alert('Failed to update meeting. Please try again.')
      }
    }

    const editMeeting = (meeting) => {
      alert(`Edit functionality for "${meeting.name}" would be implemented here`)
    }

    const viewMeeting = (meeting) => {
      alert(`View functionality for "${meeting.name}" would be implemented here`)
    }

    onMounted(() => {
      loadMeetings()
    })

    return {
      meetings,
      loading,
      filter,
      hasMore,
      loadMeetings,
      loadMoreMeetings,
      formatDateTime,
      formatTime,
      isToday,
      isPast,
      canJoin,
      canMarkHeld,
      joinMeeting,
      markAsHeld,
      editMeeting,
      viewMeeting
    }
  }
}
</script>

<style scoped>
.meetings {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h1 {
  color: #333;
  margin: 0;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.loading, .no-data {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.meeting-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meeting-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
  transition: all 0.3s;
}

.meeting-card.today {
  border-left-color: #ffc107;
  background-color: #fffcf0;
}

.meeting-card.past {
  border-left-color: #6c757d;
  opacity: 0.8;
}

.meeting-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.meeting-info {
  flex: 1;
}

.meeting-name {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.meeting-description {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.meeting-status {
  margin-left: 1rem;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.planned {
  background: #fff3cd;
  color: #856404;
}

.status-badge.held {
  background: #d4edda;
  color: #155724;
}

.status-badge.not-held {
  background: #f8d7da;
  color: #721c24;
}

.meeting-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.label {
  color: #666;
  font-weight: 500;
  min-width: 120px;
}

.datetime {
  color: #333;
  font-weight: 500;
}

.acceptance.accepted {
  color: #28a745;
  font-weight: 600;
}

.acceptance.declined {
  color: #dc3545;
  font-weight: 600;
}

.acceptance.tentative {
  color: #ffc107;
  font-weight: 600;
}

.attendees {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.attendees h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.9rem;
}

.attendee-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.attendee {
  padding: 0.2rem 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #666;
}

.meeting-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #f8f9fa;
}

.action-btn.join {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.action-btn.join:hover {
  background: #218838;
}

.action-btn.complete {
  background: #17a2b8;
  color: white;
  border-color: #17a2b8;
}

.action-btn.complete:hover {
  background: #138496;
}

.action-btn.edit:hover {
  border-color: #667eea;
  color: #667eea;
}

.action-btn.view:hover {
  border-color: #6c757d;
  color: #6c757d;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.load-more-btn:hover {
  background: #5a6fd8;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .meetings {
    padding: 0.75rem;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .meeting-card {
    padding: 1rem;
  }
  
  .meeting-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .meeting-status {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .label {
    min-width: auto;
  }
  
  .meeting-actions {
    flex-direction: column;
  }
  
  .action-btn {
    text-align: center;
  }
}
</style>