class NotificationService {
  constructor() {
    this.permission = Notification.permission
    this.reminderIntervals = new Map()
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission()
      return this.permission === 'granted'
    }
    return false
  }

  showNotification(title, options = {}) {
    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        ...options
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    }
  }

  scheduleTaskReminder(task) {
    if (!task.dateStart) return

    const taskDate = new Date(task.dateStart)
    const now = new Date()
    const timeUntilTask = taskDate.getTime() - now.getTime()
    
    // Schedule notification 15 minutes before task
    const reminderTime = timeUntilTask - (15 * 60 * 1000) // 15 minutes in milliseconds
    
    if (reminderTime > 0) {
      const timeoutId = setTimeout(() => {
        this.showNotification(`Task Reminder`, {
          body: `${task.name} is starting in 15 minutes`,
          tag: `task-${task.id}`,
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Task'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        })
      }, reminderTime)
      
      this.reminderIntervals.set(`task-${task.id}`, timeoutId)
    }
  }

  scheduleMeetingReminder(meeting) {
    if (!meeting.dateStart) return

    const meetingDate = new Date(meeting.dateStart)
    const now = new Date()
    const timeUntilMeeting = meetingDate.getTime() - now.getTime()
    
    // Schedule notification 10 minutes before meeting
    const reminderTime = timeUntilMeeting - (10 * 60 * 1000) // 10 minutes in milliseconds
    
    if (reminderTime > 0) {
      const timeoutId = setTimeout(() => {
        this.showNotification(`Meeting Reminder`, {
          body: `${meeting.name} is starting in 10 minutes`,
          tag: `meeting-${meeting.id}`,
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Meeting'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        })
      }, reminderTime)
      
      this.reminderIntervals.set(`meeting-${meeting.id}`, timeoutId)
    }
  }

  clearReminder(type, id) {
    const key = `${type}-${id}`
    if (this.reminderIntervals.has(key)) {
      clearTimeout(this.reminderIntervals.get(key))
      this.reminderIntervals.delete(key)
    }
  }

  clearAllReminders() {
    this.reminderIntervals.forEach(timeoutId => clearTimeout(timeoutId))
    this.reminderIntervals.clear()
  }

  setupUpcomingActivityReminders(tasks, meetings) {
    // Clear existing reminders
    this.clearAllReminders()
    
    // Set up new reminders
    tasks.forEach(task => this.scheduleTaskReminder(task))
    meetings.forEach(meeting => this.scheduleMeetingReminder(meeting))
  }

  showCallNotification(phoneNumber, contactName = null) {
    const title = 'Click to Call'
    const body = contactName 
      ? `Call ${contactName} (${phoneNumber})`
      : `Call ${phoneNumber}`
    
    return this.showNotification(title, {
      body,
      tag: 'click-to-call',
      requireInteraction: false,
      actions: [
        {
          action: 'call',
          title: 'Call Now'
        },
        {
          action: 'dismiss',
          title: 'Cancel'
        }
      ]
    })
  }
}

export const notificationService = new NotificationService()

// Handle notification clicks
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      const { action, notification } = event.data
      
      if (action === 'call' && notification.tag === 'click-to-call') {
        // Handle call action
        const phoneNumber = notification.data?.phoneNumber
        if (phoneNumber) {
          window.open(`tel:${phoneNumber}`)
        }
      }
    }
  })
}