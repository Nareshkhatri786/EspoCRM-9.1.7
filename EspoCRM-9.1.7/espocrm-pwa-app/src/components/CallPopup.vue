<template>
  <div class="call-popup-overlay" @click="handleOverlayClick">
    <div class="call-popup" @click.stop>
      <div class="call-popup-header">
        <h3>Call Log</h3>
        <button @click="$emit('close')" class="close-btn">
          ✕
        </button>
      </div>

      <div class="call-info">
        <div class="call-details">
          <div class="phone-number">{{ phoneNumber }}</div>
          <div v-if="contactName" class="contact-name">{{ contactName }}</div>
          <div class="call-duration">Duration: {{ formatDuration(callDuration) }}</div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="call-form">
        <div class="form-group">
          <label class="form-label">Call Status</label>
          <div class="status-buttons">
            <button
              type="button"
              @click="callData.answered = true"
              class="status-btn"
              :class="{ active: callData.answered === true }"
            >
              ✓ Answered
            </button>
            <button
              type="button"
              @click="callData.answered = false"
              class="status-btn"
              :class="{ active: callData.answered === false }"
            >
              ✗ Not Answered
            </button>
          </div>
        </div>

        <div v-if="callData.answered" class="form-group">
          <label for="notes" class="form-label">Call Notes</label>
          <textarea
            id="notes"
            v-model="callData.notes"
            class="form-textarea"
            placeholder="Enter call notes..."
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="followUp" class="form-label">Follow-up Action</label>
          <select id="followUp" v-model="callData.followUp" class="form-input">
            <option value="">No follow-up</option>
            <option value="callback">Schedule callback</option>
            <option value="email">Send email</option>
            <option value="meeting">Schedule meeting</option>
            <option value="task">Create task</option>
          </select>
        </div>

        <div v-if="callData.followUp" class="form-group">
          <label for="followUpDate" class="form-label">Follow-up Date</label>
          <input
            id="followUpDate"
            v-model="callData.followUpDate"
            type="datetime-local"
            class="form-input"
          />
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="callData.answered === null || submitting"
          >
            {{ submitting ? 'Saving...' : 'Save Call Log' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'CallPopup',
  props: {
    phoneNumber: {
      type: String,
      required: true
    },
    contactName: {
      type: String,
      default: null
    },
    contactId: {
      type: String,
      default: null
    }
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const submitting = ref(false)
    const callStartTime = ref(new Date())
    const callDuration = ref(0)
    const durationInterval = ref(null)
    
    const callData = ref({
      answered: null,
      notes: '',
      followUp: '',
      followUpDate: ''
    })

    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const updateDuration = () => {
      const now = new Date()
      callDuration.value = Math.floor((now - callStartTime.value) / 1000)
    }

    const handleOverlayClick = () => {
      emit('close')
    }

    const handleSubmit = async () => {
      if (callData.value.answered === null) {
        return
      }

      submitting.value = true

      try {
        const submitData = {
          ...callData.value,
          phoneNumber: props.phoneNumber,
          contactName: props.contactName,
          contactId: props.contactId,
          duration: callDuration.value,
          startTime: callStartTime.value,
          endTime: new Date()
        }

        emit('submit', submitData)
      } catch (error) {
        console.error('Error submitting call data:', error)
      } finally {
        submitting.value = false
      }
    }

    // Set default follow-up date to 1 hour from now
    const setDefaultFollowUpDate = () => {
      const date = new Date()
      date.setHours(date.getHours() + 1)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      
      callData.value.followUpDate = `${year}-${month}-${day}T${hours}:${minutes}`
    }

    onMounted(() => {
      // Start duration timer
      durationInterval.value = setInterval(updateDuration, 1000)
      
      // Set default follow-up date
      setDefaultFollowUpDate()

      // Focus on the first status button
      setTimeout(() => {
        const firstButton = document.querySelector('.status-btn')
        if (firstButton) {
          firstButton.focus()
        }
      }, 100)
    })

    onUnmounted(() => {
      if (durationInterval.value) {
        clearInterval(durationInterval.value)
      }
    })

    return {
      submitting,
      callDuration,
      callData,
      formatDuration,
      handleOverlayClick,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.call-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
}

.call-popup {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.call-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.call-popup-header h3 {
  margin: 0;
  color: #374151;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
}

.call-info {
  padding: 0 20px 20px 20px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.call-details {
  text-align: center;
}

.phone-number {
  font-size: 24px;
  font-weight: bold;
  color: #2c5282;
  margin-bottom: 8px;
}

.contact-name {
  font-size: 18px;
  color: #374151;
  margin-bottom: 12px;
}

.call-duration {
  font-size: 16px;
  color: #6b7280;
  font-family: 'Courier New', monospace;
}

.call-form {
  padding: 0 20px 20px 20px;
}

.status-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.status-btn {
  padding: 12px 16px;
  border: 2px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
}

.status-btn:hover {
  border-color: #2c5282;
  background-color: #f8fafc;
}

.status-btn.active {
  border-color: #2c5282;
  background-color: #2c5282;
  color: white;
}

.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

@media (max-width: 480px) {
  .call-popup {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .call-popup-header {
    padding: 15px 15px 0 15px;
  }
  
  .call-info {
    padding: 0 15px 15px 15px;
  }
  
  .call-form {
    padding: 0 15px 15px 15px;
  }
  
  .status-buttons {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .phone-number {
    font-size: 20px;
  }
  
  .contact-name {
    font-size: 16px;
  }
}

/* Animation for popup entrance */
.call-popup {
  animation: popupSlideIn 0.3s ease-out;
}

@keyframes popupSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>