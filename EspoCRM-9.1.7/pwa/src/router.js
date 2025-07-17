import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Tasks from './views/Tasks.vue'
import Meetings from './views/Meetings.vue'
import Contacts from './views/Contacts.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: Tasks
  },
  {
    path: '/meetings',
    name: 'Meetings',
    component: Meetings
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: Contacts
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router