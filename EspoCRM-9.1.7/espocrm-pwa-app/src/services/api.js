import axios from 'axios'

class EspoCrmApi {
  constructor() {
    this.baseURL = ''
    this.token = ''
    this.client = null
  }

  setAuth(serverUrl, token) {
    this.baseURL = serverUrl.replace(/\/$/, '') // Remove trailing slash
    this.token = token
    
    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
  }

  clearAuth() {
    this.baseURL = ''
    this.token = ''
    this.client = null
  }

  async login(serverUrl, username, password) {
    const url = `${serverUrl.replace(/\/$/, '')}/api/v1/App/user`
    
    const response = await axios.post(url, {
      username,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data && response.data.token) {
      return {
        token: response.data.token,
        user: response.data.user
      }
    } else {
      throw new Error('Invalid response from server')
    }
  }

  async getCurrentUser() {
    if (!this.client) throw new Error('Not authenticated')
    
    const response = await this.client.get('/App/user')
    return response.data
  }

  async getTasks(params = {}) {
    if (!this.client) throw new Error('Not authenticated')
    
    const queryParams = {
      maxSize: 20,
      orderBy: 'dateStart',
      order: 'asc',
      ...params
    }
    
    const response = await this.client.get('/Task', { params: queryParams })
    return response.data
  }

  async getMeetings(params = {}) {
    if (!this.client) throw new Error('Not authenticated')
    
    const queryParams = {
      maxSize: 20,
      orderBy: 'dateStart',
      order: 'asc',
      ...params
    }
    
    const response = await this.client.get('/Meeting', { params: queryParams })
    return response.data
  }

  async getCalls(params = {}) {
    if (!this.client) throw new Error('Not authenticated')
    
    const queryParams = {
      maxSize: 20,
      orderBy: 'dateStart',
      order: 'desc',
      ...params
    }
    
    const response = await this.client.get('/Call', { params: queryParams })
    return response.data
  }

  async createCall(callData) {
    if (!this.client) throw new Error('Not authenticated')
    
    const response = await this.client.post('/Call', callData)
    return response.data
  }

  async getContacts(params = {}) {
    if (!this.client) throw new Error('Not authenticated')
    
    const queryParams = {
      maxSize: 50,
      ...params
    }
    
    const response = await this.client.get('/Contact', { params: queryParams })
    return response.data
  }

  async searchContacts(query) {
    if (!this.client) throw new Error('Not authenticated')
    
    const response = await this.client.get('/Contact', {
      params: {
        q: query,
        maxSize: 10
      }
    })
    return response.data
  }

  async getUpcomingActivities() {
    if (!this.client) throw new Error('Not authenticated')
    
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const [tasks, meetings] = await Promise.all([
      this.getTasks({
        where: [
          {
            type: 'and',
            value: [
              {
                type: 'isNotNull',
                attribute: 'dateStart'
              },
              {
                type: 'greaterThanOrEqual',
                attribute: 'dateStart',
                value: now.toISOString()
              },
              {
                type: 'lessThan',
                attribute: 'dateStart',
                value: tomorrow.toISOString()
              }
            ]
          }
        ]
      }),
      this.getMeetings({
        where: [
          {
            type: 'and',
            value: [
              {
                type: 'isNotNull',
                attribute: 'dateStart'
              },
              {
                type: 'greaterThanOrEqual',
                attribute: 'dateStart',
                value: now.toISOString()
              },
              {
                type: 'lessThan',
                attribute: 'dateStart',
                value: tomorrow.toISOString()
              }
            ]
          }
        ]
      })
    ])

    return {
      tasks: tasks.list || [],
      meetings: meetings.list || []
    }
  }

  async getDashboardData() {
    if (!this.client) throw new Error('Not authenticated')
    
    const [upcomingActivities, recentCalls] = await Promise.all([
      this.getUpcomingActivities(),
      this.getCalls({ maxSize: 5 })
    ])

    return {
      upcomingTasks: upcomingActivities.tasks,
      upcomingMeetings: upcomingActivities.meetings,
      recentCalls: recentCalls.list || []
    }
  }
}

export const espoCrmApi = new EspoCrmApi()