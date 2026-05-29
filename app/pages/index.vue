<script setup lang="ts">
const message = 'Horse Racing Analysis - Fresh Start'
</script>

<template>
  <div class="home">
    <h1>{{ message }}</h1>
    <p>Nuxt app is running 🐎</p>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  color: var(--text-secondary);
}
</style>