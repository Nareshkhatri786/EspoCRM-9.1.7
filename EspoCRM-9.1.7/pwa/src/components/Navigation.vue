<template>
  <nav class="navigation">
    <div class="nav-header">
      <h2>EspoCRM</h2>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>
    
    <div class="nav-items">
      <router-link to="/" class="nav-item" active-class="active">
        <span class="icon">🏠</span>
        Dashboard
      </router-link>
      
      <router-link to="/tasks" class="nav-item" active-class="active">
        <span class="icon">✅</span>
        Tasks
      </router-link>
      
      <router-link to="/meetings" class="nav-item" active-class="active">
        <span class="icon">📅</span>
        Meetings
      </router-link>
      
      <router-link to="/contacts" class="nav-item" active-class="active">
        <span class="icon">👥</span>
        Contacts
      </router-link>
    </div>
  </nav>
</template>

<script>
import { authService } from '../services/auth'

export default {
  name: 'Navigation',
  setup() {
    const logout = () => {
      authService.logout()
    }

    return {
      logout
    }
  }
}
</script>

<style scoped>
.navigation {
  background: white;
  border-bottom: 1px solid #e1e5e9;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.nav-header h2 {
  color: #333;
  margin: 0;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background: #c82333;
}

.nav-items {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
  white-space: nowrap;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #333;
}

.nav-item.active {
  background: #667eea;
  color: white;
}

.icon {
  font-size: 1.2rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .navigation {
    padding: 0.75rem;
  }
  
  .nav-header {
    margin-bottom: 0.75rem;
  }
  
  .nav-header h2 {
    font-size: 1.2rem;
  }
  
  .logout-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .nav-items {
    gap: 0.5rem;
  }
  
  .nav-item {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
</style>