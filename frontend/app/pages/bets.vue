<script setup lang="ts">
// Coming soon - active bets management
const building = ref(true)
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6"><Icon name="lucide:ticket" class="w-8 h-8 inline mr-2" />Bet Slip</h1>
    
    <div class="card bg-base-100 shadow">
      <div class="card-body items-center text-center">
        <div class="badge badge-info">Coming Soon</div>
        <h2 class="card-title mt-4">🎟️ Wager Management</h2>
        
        <p class="text-base-content/70">
          Enter bets, track active wagers, calculate stakes based on confidence scores.
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
