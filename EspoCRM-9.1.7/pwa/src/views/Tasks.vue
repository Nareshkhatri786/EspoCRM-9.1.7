<template>
  <div class="tasks">
    <div class="header">
      <h1>Tasks</h1>
      <div class="filters">
        <select v-model="filter" @change="loadTasks" class="filter-select">
          <option value="all">All Tasks</option>
          <option value="not-completed">Not Completed</option>
          <option value="completed">Completed</option>
          <option value="today">Due Today</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading tasks...</div>
    
    <div v-else-if="tasks.length === 0" class="no-data">
      No tasks found
    </div>
    
    <div v-else class="task-list">
      <div 
        v-for="task in tasks" 
        :key="task.id" 
        class="task-card"
        :class="{ 'completed': task.status === 'Completed', 'overdue': isOverdue(task) }"
      >
        <div class="task-header">
          <div class="task-info">
            <h3 class="task-name">{{ task.name }}</h3>
            <p v-if="task.description" class="task-description">{{ task.description }}</p>
          </div>
          <button 
            @click="toggleTaskStatus(task)" 
            class="toggle-btn"
            :class="{ 'completed': task.status === 'Completed' }"
          >
            {{ task.status === 'Completed' ? '✅' : '⏳' }}
          </button>
        </div>
        
        <div class="task-details">
          <div class="detail-row">
            <span class="label">Status:</span>
            <span class="status" :class="task.status?.toLowerCase()">{{ task.status }}</span>
          </div>
          
          <div v-if="task.priority" class="detail-row">
            <span class="label">Priority:</span>
            <span class="priority" :class="task.priority?.toLowerCase()">{{ task.priority }}</span>
          </div>
          
          <div v-if="task.dateEnd" class="detail-row">
            <span class="label">Due Date:</span>
            <span class="date" :class="{ 'overdue': isOverdue(task) }">
              {{ formatDate(task.dateEnd) }}
            </span>
          </div>
          
          <div v-if="task.assignedUserName" class="detail-row">
            <span class="label">Assigned to:</span>
            <span class="assigned">{{ task.assignedUserName }}</span>
          </div>
          
          <div v-if="task.parentName" class="detail-row">
            <span class="label">Related to:</span>
            <span class="related">{{ task.parentName }}</span>
          </div>
        </div>
        
        <div class="task-actions">
          <button @click="editTask(task)" class="action-btn edit">
            📝 Edit
          </button>
          <button @click="viewTask(task)" class="action-btn view">
            👁️ View
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMoreTasks" class="load-more-btn">
        Load More
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { apiService } from '../services/api'

export default {
  name: 'Tasks',
  setup() {
    const tasks = ref([])
    const loading = ref(false)
    const filter = ref('not-completed')
    const offset = ref(0)
    const limit = ref(20)
    const hasMore = ref(true)

    const loadTasks = async (reset = true) => {
      loading.value = true
      
      if (reset) {
        offset.value = 0
        tasks.value = []
      }

      try {
        const params = {
          offset: offset.value,
          limit: limit.value,
          orderBy: 'dateEnd',
          order: 'asc'
        }

        // Apply filters
        switch (filter.value) {
          case 'not-completed':
            params.where = [{ type: 'isNotCompleted', value: true }]
            break
          case 'completed':
            params.where = [{ type: 'equals', field: 'status', value: 'Completed' }]
            break
          case 'today':
            params.where = [{ type: 'today', field: 'dateEnd' }]
            break
          case 'overdue':
            params.where = [{ type: 'past', field: 'dateEnd' }]
            break
        }

        const response = await apiService.getTasks(params)
        
        if (reset) {
          tasks.value = response.list || []
        } else {
          tasks.value.push(...(response.list || []))
        }
        
        hasMore.value = (response.list?.length || 0) === limit.value
        offset.value += limit.value
        
      } catch (error) {
        console.error('Failed to load tasks:', error)
      } finally {
        loading.value = false
      }
    }

    const loadMoreTasks = () => {
      loadTasks(false)
    }

    const toggleTaskStatus = async (task) => {
      try {
        const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed'
        await apiService.updateTask(task.id, { status: newStatus })
        task.status = newStatus
        
        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Task Updated', {
            body: `Task "${task.name}" marked as ${newStatus}`,
            icon: '/favicon.ico'
          })
        }
      } catch (error) {
        console.error('Failed to update task:', error)
        alert('Failed to update task. Please try again.')
      }
    }

    const editTask = (task) => {
      // In a real app, this would open an edit modal or navigate to edit page
      alert(`Edit functionality for "${task.name}" would be implemented here`)
    }

    const viewTask = (task) => {
      // In a real app, this would open a detail modal or navigate to detail page
      alert(`View functionality for "${task.name}" would be implemented here`)
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }

    const isOverdue = (task) => {
      if (!task.dateEnd || task.status === 'Completed') return false
      return new Date(task.dateEnd) < new Date()
    }

    onMounted(() => {
      loadTasks()
    })

    return {
      tasks,
      loading,
      filter,
      hasMore,
      loadTasks,
      loadMoreTasks,
      toggleTaskStatus,
      editTask,
      viewTask,
      formatDate,
      isOverdue
    }
  }
}
</script>

<style scoped>
.tasks {
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

.filters {
  display: flex;
  gap: 1rem;
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

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
  transition: all 0.3s;
}

.task-card.completed {
  border-left-color: #28a745;
  opacity: 0.8;
}

.task-card.overdue {
  border-left-color: #dc3545;
  background-color: #fff5f5;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.task-info {
  flex: 1;
}

.task-name {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.task-description {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.toggle-btn {
  background: none;
  border: 2px solid #ddd;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.toggle-btn.completed {
  border-color: #28a745;
  background: #28a745;
  color: white;
}

.task-details {
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
}

.status {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}

.status.in-progress {
  background: #fff3cd;
  color: #856404;
}

.status.not-started {
  background: #f8d7da;
  color: #721c24;
}

.priority.high {
  color: #dc3545;
  font-weight: 600;
}

.priority.medium {
  color: #ffc107;
  font-weight: 600;
}

.priority.low {
  color: #28a745;
  font-weight: 600;
}

.date.overdue {
  color: #dc3545;
  font-weight: 600;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
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

.action-btn.edit:hover {
  border-color: #667eea;
  color: #667eea;
}

.action-btn.view:hover {
  border-color: #28a745;
  color: #28a745;
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
  .tasks {
    padding: 0.75rem;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .task-card {
    padding: 1rem;
  }
  
  .task-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .toggle-btn {
    align-self: flex-end;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .task-actions {
    flex-direction: column;
  }
}
</style>