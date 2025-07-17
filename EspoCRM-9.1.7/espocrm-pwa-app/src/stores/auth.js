import { reactive } from 'vue'
import { espoCrmApi } from '../services/api'

export const authStore = reactive({
  isAuthenticated: false,
  user: null,
  token: null,
  serverUrl: localStorage.getItem('espocrm_server_url') || '',

  async login(serverUrl, username, password) {
    try {
      this.serverUrl = serverUrl
      localStorage.setItem('espocrm_server_url', serverUrl)
      
      const response = await espoCrmApi.login(serverUrl, username, password)
      
      if (response.token) {
        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true
        
        localStorage.setItem('espocrm_token', this.token)
        localStorage.setItem('espocrm_user', JSON.stringify(this.user))
        
        espoCrmApi.setAuth(serverUrl, this.token)
        
        return { success: true }
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed' 
      }
    }
  },

  logout() {
    this.isAuthenticated = false
    this.user = null
    this.token = null
    
    localStorage.removeItem('espocrm_token')
    localStorage.removeItem('espocrm_user')
    
    espoCrmApi.clearAuth()
  },

  async initializeAuth() {
    const token = localStorage.getItem('espocrm_token')
    const userStr = localStorage.getItem('espocrm_user')
    const serverUrl = localStorage.getItem('espocrm_server_url')
    
    if (token && userStr && serverUrl) {
      try {
        this.token = token
        this.user = JSON.parse(userStr)
        this.serverUrl = serverUrl
        
        espoCrmApi.setAuth(serverUrl, token)
        
        // Verify token is still valid
        await espoCrmApi.getCurrentUser()
        this.isAuthenticated = true
        
        return true
      } catch (error) {
        console.error('Token validation failed:', error)
        this.logout()
        return false
      }
    }
    
    return false
  }
})

// Initialize auth on app start
authStore.initializeAuth()