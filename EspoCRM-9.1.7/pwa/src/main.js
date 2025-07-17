import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'
import { notificationService } from './services/notifications'

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Show prompt to user to refresh the app
    if (confirm('New content is available. Click OK to refresh.')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
    // Show notification that app is ready to work offline
    notificationService.showNotification('EspoCRM PWA', {
      body: 'App is now ready to work offline!',
      icon: '/favicon.ico'
    })
  }
})

// Initialize notification service
notificationService.init()

const app = createApp(App)
app.use(router)
app.mount('#app')