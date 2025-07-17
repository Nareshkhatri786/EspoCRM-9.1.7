class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window
    this.permission = this.isSupported ? Notification.permission : 'denied'
  }

  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Notifications are not supported in this browser')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    try {
      this.permission = await Notification.requestPermission()
      return this.permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return false
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options
    }

    try {
      const notification = new Notification(title, defaultOptions)
      
      // Auto close after 5 seconds if not requireInteraction
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      return notification
    } catch (error) {
      console.error('Error showing notification:', error)
      return false
    }
  }

  // Show task reminder notification
  showTaskReminder(task) {
    const options = {
      body: `Task "${task.name}" is due soon`,
      icon: '/favicon.ico',
      tag: `task-${task.id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'mark-complete',
          title: 'Mark Complete'
        },
        {
          action: 'snooze',
          title: 'Snooze 15min'
        }
      ]
    }

    return this.showNotification('Task Reminder', options)
  }

  // Show meeting reminder notification
  showMeetingReminder(meeting) {
    const startTime = new Date(meeting.dateStart).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

    const options = {
      body: `Meeting "${meeting.name}" starts at ${startTime}`,
      icon: '/favicon.ico',
      tag: `meeting-${meeting.id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'join',
          title: 'Join Now'
        },
        {
          action: 'snooze',
          title: 'Remind in 5min'
        }
      ]
    }

    return this.showNotification('Meeting Reminder', options)
  }

  // Show call reminder notification
  showCallReminder(call) {
    const options = {
      body: `Scheduled call with ${call.parentName || 'contact'}`,
      icon: '/favicon.ico',
      tag: `call-${call.id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'call-now',
          title: 'Call Now'
        },
        {
          action: 'reschedule',
          title: 'Reschedule'
        }
      ]
    }

    return this.showNotification('Call Reminder', options)
  }

  // Schedule notifications for upcoming events
  scheduleReminders(events) {
    events.forEach(event => {
      const eventTime = new Date(event.dateStart || event.dateEnd)
      const now = new Date()
      
      // Schedule reminder 15 minutes before
      const reminderTime = new Date(eventTime.getTime() - 15 * 60 * 1000)
      
      if (reminderTime > now) {
        const timeUntilReminder = reminderTime.getTime() - now.getTime()
        
        setTimeout(() => {
          if (event.entityType === 'Task') {
            this.showTaskReminder(event)
          } else if (event.entityType === 'Meeting') {
            this.showMeetingReminder(event)
          } else if (event.entityType === 'Call') {
            this.showCallReminder(event)
          }
        }, timeUntilReminder)
      }
    })
  }

  // Check for overdue tasks and show notifications
  checkOverdueTasks(tasks) {
    const now = new Date()
    const overdueTasks = tasks.filter(task => {
      if (task.status === 'Completed' || !task.dateEnd) return false
      return new Date(task.dateEnd) < now
    })

    overdueTasks.forEach(task => {
      this.showNotification('Overdue Task', {
        body: `Task "${task.name}" is overdue`,
        icon: '/favicon.ico',
        tag: `overdue-task-${task.id}`,
        requireInteraction: true
      })
    })
  }

  // Show sync status notifications
  showSyncNotification(status, message) {
    const options = {
      body: message,
      icon: '/favicon.ico',
      tag: 'sync-status'
    }

    if (status === 'error') {
      options.requireInteraction = true
    }

    return this.showNotification('EspoCRM Sync', options)
  }

  // Handle notification clicks
  setupNotificationHandlers() {
    if (!this.isSupported) return

    // Handle notification clicks
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'notification-click') {
        const { action, notification } = event.data
        
        switch (action) {
          case 'mark-complete':
            // Handle task completion
            window.dispatchEvent(new CustomEvent('task-complete', {
              detail: { taskId: notification.tag.replace('task-', '') }
            }))
            break
            
          case 'join':
            // Handle meeting join
            window.dispatchEvent(new CustomEvent('meeting-join', {
              detail: { meetingId: notification.tag.replace('meeting-', '') }
            }))
            break
            
          case 'call-now':
            // Handle call initiation
            window.dispatchEvent(new CustomEvent('call-initiate', {
              detail: { callId: notification.tag.replace('call-', '') }
            }))
            break
            
          case 'snooze':
            // Handle snooze - reschedule notification
            this.snoozeNotification(notification)
            break
        }
      }
    })
  }

  snoozeNotification(notification) {
    // Reschedule notification based on type
    const isTask = notification.tag.startsWith('task-')
    const isMeeting = notification.tag.startsWith('meeting-')
    
    const snoozeTime = isMeeting ? 5 * 60 * 1000 : 15 * 60 * 1000 // 5min for meetings, 15min for tasks
    
    setTimeout(() => {
      if (isTask) {
        this.showNotification('Task Reminder (Snoozed)', {
          body: notification.body,
          icon: notification.icon,
          tag: notification.tag + '-snoozed',
          requireInteraction: true
        })
      } else if (isMeeting) {
        this.showNotification('Meeting Reminder (Snoozed)', {
          body: notification.body,
          icon: notification.icon,
          tag: notification.tag + '-snoozed',
          requireInteraction: true
        })
      }
    }, snoozeTime)
  }

  // Initialize notification service
  async init() {
    await this.requestPermission()
    this.setupNotificationHandlers()
    
    // Set up periodic checks for overdue items
    setInterval(() => {
      // This would typically fetch latest data and check for overdue items
      window.dispatchEvent(new CustomEvent('check-overdue-items'))
    }, 30 * 60 * 1000) // Check every 30 minutes
  }
}

export const notificationService = new NotificationService()