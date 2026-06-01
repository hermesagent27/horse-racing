<script setup lang="ts">
const { data: authStatus, refresh } = await useFetch('/api/auth/status')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refresh()
  await navigateTo('/login')
}
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold">🏇 Race Day Dashboard</h1>
        <p class="text-base-content/70">Track races, place bets, manage bankroll</p>
      </div>
      
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm" @click="logout">
          Logout
        </button>
      </div>
    </div>
    
    <div class="alert alert-info">
      <span>Auth working! Choose what to build next:</span>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">📅 Race Day</h2>
          <p>View upcoming races, analyze entries</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm">View</button>
          </div>
        </div>
      </div>
      
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">🎟️ Bet Slip</h2>
          <p>Enter wagers, track stakes</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm">Open</button>
          </div>
        </div>
      </div>
      
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">📊 Bankroll</h2>
          <p>P/L tracking, unit sizing</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm">View</button>
          </div>
        </div>
      </div>
      
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">📥 Upload</h2>
          <p>Import race programs (PDF)</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm">Upload</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
