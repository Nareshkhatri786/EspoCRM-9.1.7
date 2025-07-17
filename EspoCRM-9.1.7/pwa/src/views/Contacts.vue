<template>
  <div class="contacts">
    <div class="header">
      <h1>Contacts</h1>
      <div class="search-bar">
        <input
          v-model="searchQuery"
          @input="searchContacts"
          type="text"
          placeholder="Search contacts..."
          class="search-input"
        />
      </div>
    </div>

    <div v-if="loading" class="loading">Loading contacts...</div>
    
    <div v-else-if="contacts.length === 0" class="no-data">
      No contacts found
    </div>
    
    <div v-else class="contact-list">
      <div 
        v-for="contact in contacts" 
        :key="contact.id" 
        class="contact-card"
      >
        <div class="contact-header">
          <div class="contact-info">
            <h3 class="contact-name">{{ contact.name }}</h3>
            <p v-if="contact.title" class="contact-title">{{ contact.title }}</p>
            <p v-if="contact.accountName" class="contact-company">
              🏢 {{ contact.accountName }}
            </p>
          </div>
          <div class="contact-avatar">
            {{ getInitials(contact.name) }}
          </div>
        </div>
        
        <div class="contact-details">
          <div v-if="contact.emailAddress" class="detail-row">
            <span class="label">📧 Email:</span>
            <a :href="`mailto:${contact.emailAddress}`" class="email-link">
              {{ contact.emailAddress }}
            </a>
          </div>
          
          <div v-if="contact.phoneNumber" class="detail-row">
            <span class="label">📱 Phone:</span>
            <span class="phone-number">{{ contact.phoneNumber }}</span>
          </div>
          
          <div v-if="contact.phoneNumberMobile" class="detail-row">
            <span class="label">📞 Mobile:</span>
            <span class="phone-number">{{ contact.phoneNumberMobile }}</span>
          </div>
          
          <div v-if="contact.addressCity || contact.addressCountry" class="detail-row">
            <span class="label">📍 Location:</span>
            <span class="location">
              {{ [contact.addressCity, contact.addressCountry].filter(Boolean).join(', ') }}
            </span>
          </div>
          
          <div v-if="contact.assignedUserName" class="detail-row">
            <span class="label">👤 Assigned to:</span>
            <span class="assigned">{{ contact.assignedUserName }}</span>
          </div>
        </div>
        
        <div class="contact-actions">
          <button 
            v-if="contact.phoneNumber" 
            @click="makeCall(contact, contact.phoneNumber, 'phone')"
            class="action-btn call-btn"
          >
            📞 Call
          </button>
          
          <button 
            v-if="contact.phoneNumberMobile" 
            @click="makeCall(contact, contact.phoneNumberMobile, 'mobile')"
            class="action-btn call-btn mobile"
          >
            📱 Call Mobile
          </button>
          
          <button 
            v-if="contact.emailAddress" 
            @click="sendEmail(contact)"
            class="action-btn email-btn"
          >
            📧 Email
          </button>
          
          <button @click="viewContact(contact)" class="action-btn view-btn">
            👁️ View
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMoreContacts" class="load-more-btn">
        Load More
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { apiService } from '../services/api'

export default {
  name: 'Contacts',
  setup() {
    const contacts = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const offset = ref(0)
    const limit = ref(20)
    const hasMore = ref(true)
    let searchTimeout = null

    const loadContacts = async (reset = true) => {
      loading.value = true
      
      if (reset) {
        offset.value = 0
        contacts.value = []
      }

      try {
        const params = {
          offset: offset.value,
          limit: limit.value,
          orderBy: 'name',
          order: 'asc'
        }

        // Add search filter if query exists
        if (searchQuery.value.trim()) {
          params.where = [
            {
              type: 'or',
              value: [
                { type: 'contains', field: 'name', value: searchQuery.value },
                { type: 'contains', field: 'emailAddress', value: searchQuery.value },
                { type: 'contains', field: 'phoneNumber', value: searchQuery.value },
                { type: 'contains', field: 'accountName', value: searchQuery.value }
              ]
            }
          ]
        }

        const response = await apiService.getContacts(params)
        
        if (reset) {
          contacts.value = response.list || []
        } else {
          contacts.value.push(...(response.list || []))
        }
        
        hasMore.value = (response.list?.length || 0) === limit.value
        offset.value += limit.value
        
      } catch (error) {
        console.error('Failed to load contacts:', error)
      } finally {
        loading.value = false
      }
    }

    const loadMoreContacts = () => {
      loadContacts(false)
    }

    const searchContacts = () => {
      // Debounce search
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        loadContacts(true)
      }, 300)
    }

    const getInitials = (name) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }

    const makeCall = (contact, phoneNumber, type) => {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '')
      
      // Create call URL for mobile dialer
      const callUrl = `tel:${cleanNumber}`
      
      // Log call initiation
      console.log(`Initiating call to ${contact.name} at ${phoneNumber}`)
      
      // Trigger custom event for call tracking
      const callEvent = new CustomEvent('call-started', {
        detail: {
          contactId: contact.id,
          contactName: contact.name,
          phoneNumber: phoneNumber,
          type: type
        }
      })
      window.dispatchEvent(callEvent)
      
      // Open dialer
      window.location.href = callUrl
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Call Started', {
          body: `Calling ${contact.name} at ${phoneNumber}`,
          icon: '/favicon.ico'
        })
      }
    }

    const sendEmail = (contact) => {
      const emailUrl = `mailto:${contact.emailAddress}`
      window.location.href = emailUrl
    }

    const viewContact = (contact) => {
      // In a real app, this would navigate to contact detail page
      alert(`View functionality for "${contact.name}" would be implemented here`)
    }

    onMounted(() => {
      loadContacts()
    })

    return {
      contacts,
      loading,
      searchQuery,
      hasMore,
      loadContacts,
      loadMoreContacts,
      searchContacts,
      getInitials,
      makeCall,
      sendEmail,
      viewContact
    }
  }
}
</script>

<style scoped>
.contacts {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  margin-bottom: 1.5rem;
}

h1 {
  color: #333;
  margin: 0 0 1rem 0;
  text-align: center;
}

.search-bar {
  display: flex;
  justify-content: center;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 1rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.loading, .no-data {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
}

.contact-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.contact-info {
  flex: 1;
}

.contact-name {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.contact-title {
  margin: 0 0 0.25rem 0;
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
}

.contact-company {
  margin: 0;
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 500;
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
  margin-left: 1rem;
}

.contact-details {
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.label {
  color: #666;
  font-weight: 500;
  min-width: 100px;
  margin-right: 0.5rem;
}

.email-link {
  color: #667eea;
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

.phone-number {
  color: #333;
  font-weight: 500;
  font-family: monospace;
}

.location, .assigned {
  color: #333;
}

.contact-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.call-btn {
  background: #28a745;
  color: white;
}

.call-btn:hover {
  background: #218838;
  transform: scale(1.05);
}

.call-btn.mobile {
  background: #17a2b8;
}

.call-btn.mobile:hover {
  background: #138496;
}

.email-btn {
  background: #ffc107;
  color: #212529;
}

.email-btn:hover {
  background: #e0a800;
  transform: scale(1.05);
}

.view-btn {
  background: #6c757d;
  color: white;
}

.view-btn:hover {
  background: #5a6268;
  transform: scale(1.05);
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
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.load-more-btn:hover {
  background: #5a6fd8;
  transform: scale(1.05);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .contacts {
    padding: 0.75rem;
  }
  
  .contact-card {
    padding: 1rem;
  }
  
  .contact-header {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    text-align: center;
  }
  
  .contact-avatar {
    margin-left: 0;
    order: -1;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .label {
    min-width: auto;
    margin-right: 0;
  }
  
  .contact-actions {
    justify-content: center;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
    min-width: 80px;
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .contact-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>