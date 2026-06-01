<script setup lang="ts">
// Check auth status
const { data: auth } = await useFetch('/api/auth/status')

// If not authenticated, redirect to login (but don't block)
// This is a fallback - middleware should handle most cases
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Navigation Bar (if authenticated) -->
    <AppNavbar v-if="auth?.authenticated" />
    
    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
