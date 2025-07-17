<template>
  <div id="app">
    <nav class="navbar" v-if="isAuthenticated">
      <div class="nav-container">
        <div class="nav-brand">
          <router-link to="/dashboard">EspoCRM PWA</router-link>
        </div>
        <div class="nav-menu">
          <router-link to="/dashboard" class="nav-item">Dashboard</router-link>
          <router-link to="/settings" class="nav-item">Settings</router-link>
          <button @click="logout" class="nav-item logout-btn">Logout</button>
        </div>
      </div>
    </nav>
    
    <main class="main-content" :class="{ 'with-nav': isAuthenticated }">
      <router-view />
    </main>

    <!-- Call popup modal -->
    <CallPopup v-if="showCallPopup" @close="closeCallPopup" @submit="submitCallData" />
  </div>
</template>

<script>
import { computed } from 'vue'
import { authStore } from './stores/auth'
import { callStore } from './stores/call'
import CallPopup from './components/CallPopup.vue'

export default {
  name: 'App',
  components: {
    CallPopup
  },
  setup() {
    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const showCallPopup = computed(() => callStore.showPopup)

    const logout = () => {
      authStore.logout()
    }

    const closeCallPopup = () => {
      callStore.hidePopup()
    }

    const submitCallData = (callData) => {
      callStore.logCall(callData)
    }

    return {
      isAuthenticated,
      showCallPopup,
      logout,
      closeCallPopup,
      submitCallData
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

.navbar {
  background-color: #2c5282;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.nav-brand a {
  color: white;
  text-decoration: none;
  font-size: 20px;
  font-weight: bold;
}

.nav-menu {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-item {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.main-content {
  min-height: 100vh;
  padding: 20px;
}

.main-content.with-nav {
  padding-top: 80px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #2c5282;
  color: white;
}

.btn-primary:hover {
  background-color: #2a4e7c;
}

.btn-success {
  background-color: #38a169;
  color: white;
}

.btn-success:hover {
  background-color: #2f855a;
}

.btn-danger {
  background-color: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background-color: #c53030;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.alert-error {
  background-color: #fed7d7;
  color: #c53030;
  border: 1px solid #feb2b2;
}

.alert-success {
  background-color: #c6f6d5;
  color: #2f855a;
  border: 1px solid #9ae6b4;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
  }
  
  .nav-menu {
    gap: 10px;
  }
  
  .main-content {
    padding: 15px;
  }
  
  .main-content.with-nav {
    padding-top: 75px;
  }
}
</style>