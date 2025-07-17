<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>EspoCRM PWA</h1>
        <p>Sign in to your EspoCRM account</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="serverUrl" class="form-label">Server URL</label>
          <input
            id="serverUrl"
            v-model="loginForm.serverUrl"
            type="url"
            class="form-input"
            placeholder="https://your-espocrm.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            class="form-input"
            placeholder="Enter your username"
            required
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            class="form-input"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary login-btn"
          :disabled="loading"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="login-footer">
        <div class="install-prompt" v-if="showInstallPrompt">
          <p>Install this app for a better experience</p>
          <button @click="installApp" class="btn btn-success">
            Install App
          </button>
        </div>
        
        <div class="offline-indicator" v-if="!online">
          <span class="offline-dot"></span>
          You are offline. Please connect to the internet to sign in.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../stores/auth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const error = ref('')
    const online = ref(navigator.onLine)
    const showInstallPrompt = ref(false)
    const deferredPrompt = ref(null)
    
    const loginForm = ref({
      serverUrl: authStore.serverUrl || 'https://',
      username: '',
      password: ''
    })

    const handleLogin = async () => {
      if (!online.value) {
        error.value = 'Please connect to the internet to sign in'
        return
      }

      loading.value = true
      error.value = ''

      try {
        const result = await authStore.login(
          loginForm.value.serverUrl,
          loginForm.value.username,
          loginForm.value.password
        )

        if (result.success) {
          router.push('/dashboard')
        } else {
          error.value = result.error
        }
      } catch (err) {
        error.value = 'An unexpected error occurred'
        console.error('Login error:', err)
      } finally {
        loading.value = false
      }
    }

    const installApp = async () => {
      if (deferredPrompt.value) {
        deferredPrompt.value.prompt()
        const { outcome } = await deferredPrompt.value.userChoice
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt')
        }
        
        deferredPrompt.value = null
        showInstallPrompt.value = false
      }
    }

    onMounted(() => {
      // Listen for online/offline events
      window.addEventListener('online', () => {
        online.value = true
      })
      
      window.addEventListener('offline', () => {
        online.value = false
      })

      // Listen for install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt.value = e
        showInstallPrompt.value = true
      })

      // Check if already installed
      window.addEventListener('appinstalled', () => {
        showInstallPrompt.value = false
        deferredPrompt.value = null
      })
    })

    return {
      loginForm,
      loading,
      error,
      online,
      showInstallPrompt,
      handleLogin,
      installApp
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #2c5282;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: bold;
}

.login-header p {
  color: #666;
  font-size: 16px;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
}

.install-prompt {
  margin-bottom: 20px;
  padding: 15px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
}

.install-prompt p {
  margin-bottom: 10px;
  color: #0284c7;
  font-size: 14px;
}

.offline-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #dc2626;
  font-size: 14px;
}

.offline-dot {
  width: 8px;
  height: 8px;
  background: #dc2626;
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

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .login-header h1 {
    font-size: 24px;
  }
}
</style>