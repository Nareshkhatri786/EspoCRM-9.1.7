<template>
  <div class="login-form">
    <div class="logo">
      <h1>EspoCRM</h1>
      <p>Mobile App</p>
    </div>
    
    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          v-model="credentials.username"
          type="text"
          required
          class="form-input"
          placeholder="Enter your username"
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="credentials.password"
          type="password"
          required
          class="form-input"
          placeholder="Enter your password"
        />
      </div>
      
      <button type="submit" :disabled="loading" class="login-btn">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { authService } from '../services/auth'

export default {
  name: 'Login',
  emits: ['login'],
  setup(props, { emit }) {
    const credentials = ref({
      username: '',
      password: ''
    })
    const loading = ref(false)
    const error = ref('')

    const handleSubmit = async () => {
      loading.value = true
      error.value = ''

      try {
        const result = await authService.login(
          credentials.value.username,
          credentials.value.password
        )

        if (result.success) {
          emit('login', true)
        } else {
          error.value = result.error
        }
      } catch (err) {
        error.value = 'Login failed. Please try again.'
      } finally {
        loading.value = false
      }
    }

    return {
      credentials,
      loading,
      error,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.logo {
  text-align: center;
  margin-bottom: 2rem;
}

.logo h1 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.logo p {
  color: #666;
  font-size: 1rem;
}

.form {
  width: 100%;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  text-align: center;
}
</style>