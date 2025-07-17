import axios from 'axios'

class ApiService {
  // Get dashboard data
  async getDashboardData() {
    try {
      const [tasks, meetings, calls] = await Promise.all([
        this.getTasks({ limit: 10, where: [{ type: 'isNotCompleted', value: true }] }),
        this.getMeetings({ limit: 10, where: [{ type: 'today', value: true }] }),
        this.getCalls({ limit: 5, orderBy: 'dateStart', order: 'desc' })
      ])

      return {
        tasks: tasks.list || [],
        meetings: meetings.list || [],
        calls: calls.list || []
      }
    } catch (error) {
      console.error('Dashboard data error:', error)
      return { tasks: [], meetings: [], calls: [] }
    }
  }

  // Tasks
  async getTasks(params = {}) {
    try {
      const response = await axios.get('/Task', { params })
      return response.data
    } catch (error) {
      console.error('Get tasks error:', error)
      return { list: [] }
    }
  }

  async updateTask(id, data) {
    try {
      const response = await axios.put(`/Task/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Update task error:', error)
      throw error
    }
  }

  // Meetings
  async getMeetings(params = {}) {
    try {
      const response = await axios.get('/Meeting', { params })
      return response.data
    } catch (error) {
      console.error('Get meetings error:', error)
      return { list: [] }
    }
  }

  async updateMeeting(id, data) {
    try {
      const response = await axios.put(`/Meeting/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Update meeting error:', error)
      throw error
    }
  }

  // Calls
  async getCalls(params = {}) {
    try {
      const response = await axios.get('/Call', { params })
      return response.data
    } catch (error) {
      console.error('Get calls error:', error)
      return { list: [] }
    }
  }

  async createCall(data) {
    try {
      const response = await axios.post('/Call', data)
      return response.data
    } catch (error) {
      console.error('Create call error:', error)
      throw error
    }
  }

  async updateCall(id, data) {
    try {
      const response = await axios.put(`/Call/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Update call error:', error)
      throw error
    }
  }

  // Contacts
  async getContacts(params = {}) {
    try {
      const response = await axios.get('/Contact', { params })
      return response.data
    } catch (error) {
      console.error('Get contacts error:', error)
      return { list: [] }
    }
  }

  // Accounts
  async getAccounts(params = {}) {
    try {
      const response = await axios.get('/Account', { params })
      return response.data
    } catch (error) {
      console.error('Get accounts error:', error)
      return { list: [] }
    }
  }

  // Leads
  async getLeads(params = {}) {
    try {
      const response = await axios.get('/Lead', { params })
      return response.data
    } catch (error) {
      console.error('Get leads error:', error)
      return { list: [] }
    }
  }

  // Notifications
  async getNotifications() {
    try {
      const response = await axios.get('/Notification')
      return response.data
    } catch (error) {
      console.error('Get notifications error:', error)
      return { list: [] }
    }
  }

  async markNotificationRead(id) {
    try {
      const response = await axios.post(`/Notification/${id}/read`)
      return response.data
    } catch (error) {
      console.error('Mark notification read error:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()