import axios from 'axios'

class AuthService {
  constructor() {
    this.baseURL = window.location.origin + '/api/v1'
    this.token = null
    this.setupAxios()
  }

  setupAxios() {
    axios.defaults.baseURL = this.baseURL
    axios.defaults.headers.common['Content-Type'] = 'application/json'
    
    // Add token to requests if available
    axios.interceptors.request.use((config) => {
      if (this.token) {
        config.headers['X-Auth-Token'] = this.token
      }
      return config
    })

    // Handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout()
        }
        return Promise.reject(error)
      }
    )
  }

  async login(username, password) {
    try {
      const response = await axios.post('/App/user', {
        username,
        password
      })

      if (response.data && response.data.token) {
        this.token = response.data.token
        localStorage.setItem('espoCrmToken', this.token)
        localStorage.setItem('espoCrmUser', JSON.stringify(response.data.user))
        return { success: true, user: response.data.user }
      } else {
        return { success: false, error: 'Invalid credentials' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  logout() {
    this.token = null
    localStorage.removeItem('espoCrmToken')
    localStorage.removeItem('espoCrmUser')
    window.location.reload()
  }

  setToken(token) {
    this.token = token
  }

  getToken() {
    return this.token || localStorage.getItem('espoCrmToken')
  }

  getCurrentUser() {
    const userData = localStorage.getItem('espoCrmUser')
    return userData ? JSON.parse(userData) : null
  }

  isAuthenticated() {
    return !!this.getToken()
  }
}

export const authService = new AuthService()