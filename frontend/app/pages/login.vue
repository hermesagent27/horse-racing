<script setup lang="ts">
definePageMeta({
  layout: false // No layout for login page
})

const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value }
    })
    // Redirect to dashboard on success
    await navigateTo('/races')
  } catch (e: any) {
    error.value = e.statusMessage || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-300 flex items-center justify-center">
    <div class="card bg-base-100 w-96 shadow-xl">
      <div class="card-body">
        <h1 class="card-title text-2xl justify-center mb-4">
          🏇 Horse Racing Tracker
        </h1>
        
        <form @submit.prevent="handleLogin">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter password"
              class="input input-bordered"
              required
            />
          </div>
          
          <div v-if="error" class="alert alert-error mt-4">
            {{ error }}
          </div>
          
          <div class="card-actions justify-end mt-6">
            <button
              type="submit"
              class="btn btn-primary w-full"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner"></span>
              <span v-else>Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
