<template>
  <div id="app">
    <div v-if="!isAuthenticated" class="login-container">
      <Login @login="handleLogin" />
    </div>
    <div v-else class="app-container">
      <Navigation />
      <router-view />
      <CallPopup v-if="showCallPopup" @close="handleCallEnd" :contact="currentContact" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Login from './components/Login.vue'
import Navigation from './components/Navigation.vue'
import CallPopup from './components/CallPopup.vue'
import { authService } from './services/auth'

export default {
  name: 'App',
  components: {
    Login,
    Navigation,
    CallPopup
  },
  setup() {
    const isAuthenticated = ref(false)
    const showCallPopup = ref(false)
    const currentContact = ref(null)

    onMounted(() => {
      // Check if user is already logged in
      const token = localStorage.getItem('espoCrmToken')
      if (token) {
        authService.setToken(token)
        isAuthenticated.value = true
      }
    })

    const handleLogin = (success) => {
      isAuthenticated.value = success
    }

    const handleCallEnd = (status) => {
      showCallPopup.value = false
      // Log call status to EspoCRM
      if (currentContact.value) {
        // Call logging will be handled in CallPopup component
        console.log(`Call ended with status: ${status}`)
      }
      currentContact.value = null
    }

    // Listen for call events
    window.addEventListener('call-started', (event) => {
      currentContact.value = event.detail
      showCallPopup.value = true
    })

    return {
      isAuthenticated,
      showCallPopup,
      currentContact,
      handleLogin,
      handleCallEnd
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>