<script setup lang="ts">
useHead({
  title: 'Horse Racing Analysis'
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center text-center p-8">
    <h1 class="text-4xl font-bold mb-4">🏇 Horse Racing Analysis</h1>
    <p class="text-text-secondary mb-8">QH Sprint Handicapping System</p>
    
    <div class="card bg-bg-secondary p-6 max-w-md">
      <h2 class="text-xl font-semibold mb-4">Getting Started</h2>
      <p class="text-text-secondary mb-4">Upload race programs to analyze Quarter Horse sprints.</p>
      <button class="btn btn-primary">Upload Race Card</button>
    </div>
  </div>
</template>