<script setup lang="ts">
// Root page - redirects based on auth status
const { data: auth } = await useFetch('/api/auth/status')

if (auth.value?.authenticated) {
  await navigateTo('/races')
} else {
  await navigateTo('/login')
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
</template>
