<template>
  <div class="call-popup-overlay" @click="closePopup">
    <div class="call-popup" @click.stop>
      <div class="popup-header">
        <h3>📞 Call Completed</h3>
        <button @click="closePopup" class="close-btn">✕</button>
      </div>
      
      <div class="call-info">
        <div class="contact-details">
          <div class="contact-avatar">
            {{ getInitials(contact.contactName) }}
          </div>
          <div class="contact-info-text">
            <h4>{{ contact.contactName }}</h4>
            <p>{{ contact.phoneNumber }}</p>
          </div>
        </div>
      </div>
      
      <div class="call-status-section">
        <h4>How did the call go?</h4>
        <div class="status-buttons">
          <button 
            @click="setCallStatus('Answered')"
            class="status-btn answered"
            :class="{ active: selectedStatus === 'Answered' }"
          >
            ✅ Answered
          </button>
          <button 
            @click="setCallStatus('Not Answered')"
            class="status-btn not-answered"
            :class="{ active: selectedStatus === 'Not Answered' }"
          >
            ❌ Not Answered
          </button>
          <button 
            @click="setCallStatus('Busy')"
            class="status-btn busy"
            :class="{ active: selectedStatus === 'Busy' }"
          >
            📵 Busy
          </button>
          <button 
            @click="setCallStatus('Voicemail')"
            class="status-btn voicemail"
            :class="{ active: selectedStatus === 'Voicemail' }"
          >
            📭 Voicemail
          </button>
        </div>
      </div>
      
      <div class="call-duration-section">
        <label for="duration">Call Duration (minutes):</label>
        <input 
          id="duration"
          v-model.number="callDuration"
          type="number"
          min="0"
          step="1"
          class="duration-input"
          placeholder="0"
        />
      </div>
      
      <div class="notes-section">
        <label for="notes">Call Notes (optional):</label>
        <textarea 
          id="notes"
          v-model="callNotes"
          class="notes-textarea"
          placeholder="Add any notes about this call..."
          rows="3"
        ></textarea>
      </div>
      
      <div class="popup-actions">
        <button @click="closePopup" class="action-btn cancel">
          Cancel
        </button>
        <button 
          @click="saveCall" 
          :disabled="!selectedStatus || saving"
          class="action-btn save"
        >
          {{ saving ? 'Saving...' : 'Save Call Log' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { apiService } from '../services/api'

export default {
  name: 'CallPopup',
  props: {
    contact: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const selectedStatus = ref('')
    const callDuration = ref(0)
    const callNotes = ref('')
    const saving = ref(false)

    const getInitials = (name) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }

    const setCallStatus = (status) => {
      selectedStatus.value = status
    }

    const closePopup = () => {
      emit('close', null)
    }

    const saveCall = async () => {
      if (!selectedStatus.value) return

      saving.value = true

      try {
        const callData = {
          name: `Call to ${props.contact.contactName}`,
          status: selectedStatus.value === 'Answered' ? 'Held' : 'Not Held',
          phoneNumber: props.contact.phoneNumber,
          direction: 'Outbound',
          dateStart: new Date().toISOString(),
          durationHours: Math.floor(callDuration.value / 60),
          durationMinutes: callDuration.value % 60,
          description: callNotes.value || `${selectedStatus.value} call to ${props.contact.contactName}`,
          // Link to contact if contactId is available
          ...(props.contact.contactId && { 
            parentType: 'Contact',
            parentId: props.contact.contactId,
            parentName: props.contact.contactName
          })
        }

        // Add custom fields for call outcome
        callData.callOutcome = selectedStatus.value
        callData.actualDuration = callDuration.value

        await apiService.createCall(callData)

        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Call Logged', {
            body: `Call to ${props.contact.contactName} has been logged as ${selectedStatus.value}`,
            icon: '/favicon.ico'
          })
        }

        emit('close', selectedStatus.value)
      } catch (error) {
        console.error('Failed to save call log:', error)
        alert('Failed to save call log. Please try again.')
      } finally {
        saving.value = false
      }
    }

    return {
      selectedStatus,
      callDuration,
      callNotes,
      saving,
      getInitials,
      setCallStatus,
      closePopup,
      saveCall
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.call-popup {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.popup-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.call-info {
  margin-bottom: 1.5rem;
}

.contact-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.contact-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.contact-info-text h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1.1rem;
}

.contact-info-text p {
  margin: 0;
  color: #666;
  font-family: monospace;
  font-size: 0.9rem;
}

.call-status-section {
  margin-bottom: 1.5rem;
}

.call-status-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1rem;
}

.status-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.status-btn {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.status-btn:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

.status-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.status-btn.answered.active {
  border-color: #28a745;
  background: #28a745;
}

.status-btn.not-answered.active,
.status-btn.busy.active {
  border-color: #dc3545;
  background: #dc3545;
}

.status-btn.voicemail.active {
  border-color: #ffc107;
  background: #ffc107;
  color: #212529;
}

.call-duration-section,
.notes-section {
  margin-bottom: 1.5rem;
}

.call-duration-section label,
.notes-section label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.duration-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.duration-input:focus {
  outline: none;
  border-color: #667eea;
}

.notes-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.notes-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.popup-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn.cancel {
  background: #6c757d;
  color: white;
}

.action-btn.cancel:hover {
  background: #5a6268;
}

.action-btn.save {
  background: #667eea;
  color: white;
}

.action-btn.save:hover:not(:disabled) {
  background: #5a6fd8;
}

.action-btn.save:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .call-popup {
    margin: 0.5rem;
    padding: 1rem;
  }
  
  .contact-details {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .status-buttons {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .popup-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>