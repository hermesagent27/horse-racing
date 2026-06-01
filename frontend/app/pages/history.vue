<script setup lang="ts">
// Coming soon - historical performance
const building = ref(true)
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6"><Icon name="lucide:history" class="w-8 h-8 inline mr-2" />History</h1>
    
    <div class="card bg-base-100 shadow">
      <div class="card-body items-center text-center">
        <div class="badge badge-info">Coming Soon</div>
        
        <h2 class="card-title mt-4">📊 Past Performance</h2>
        
        <p class="text-base-content/70">
          View past race days, bet history, ROI analytics, pattern recognition.
        </p>
        
        <div class="mt-6">
          <NuxtLink to="/races" class="btn btn-primary">
            <Icon name="lucide:calendar" class="w-4 h-4 mr-2" />
            Go to Races
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
