import { reactive } from 'vue'
import { espoCrmApi } from '../services/api'

export const callStore = reactive({
  showPopup: false,
  currentCall: null,
  callHistory: [],

  showCallPopup(phoneNumber, contactName = null, contactId = null) {
    this.currentCall = {
      phoneNumber,
      contactName,
      contactId,
      startTime: new Date()
    }
    this.showPopup = true
  },

  hidePopup() {
    this.showPopup = false
    this.currentCall = null
  },

  async logCall(callData) {
    try {
      const callRecord = {
        ...this.currentCall,
        ...callData,
        endTime: new Date(),
        duration: Math.round((new Date() - this.currentCall.startTime) / 1000)
      }

      // Save to local storage for offline capability
      this.callHistory.unshift(callRecord)
      localStorage.setItem('call_history', JSON.stringify(this.callHistory))

      // Try to sync with EspoCRM
      await this.syncCallToEspoCRM(callRecord)
      
      this.hidePopup()
      
      return { success: true }
    } catch (error) {
      console.error('Error logging call:', error)
      return { success: false, error: error.message }
    }
  },

  async syncCallToEspoCRM(callRecord) {
    try {
      const callData = {
        name: `Call to ${callRecord.contactName || callRecord.phoneNumber}`,
        status: callRecord.answered ? 'Held' : 'Not Held',
        phoneNumber: callRecord.phoneNumber,
        dateStart: callRecord.startTime.toISOString(),
        dateEnd: callRecord.endTime.toISOString(),
        duration: callRecord.duration,
        description: callRecord.notes || '',
        direction: 'Outbound'
      }

      if (callRecord.contactId) {
        callData.parentType = 'Contact'
        callData.parentId = callRecord.contactId
      }

      await espoCrmApi.createCall(callData)
      
      // Mark as synced
      callRecord.synced = true
      localStorage.setItem('call_history', JSON.stringify(this.callHistory))
      
    } catch (error) {
      console.error('Failed to sync call to EspoCRM:', error)
      // Keep in local storage for later sync
      callRecord.synced = false
    }
  },

  async syncPendingCalls() {
    const pendingCalls = this.callHistory.filter(call => !call.synced)
    
    for (const call of pendingCalls) {
      try {
        await this.syncCallToEspoCRM(call)
      } catch (error) {
        console.error('Failed to sync pending call:', error)
      }
    }
  },

  loadCallHistory() {
    const history = localStorage.getItem('call_history')
    if (history) {
      this.callHistory = JSON.parse(history)
    }
  }
})

// Load call history on initialization
callStore.loadCallHistory()