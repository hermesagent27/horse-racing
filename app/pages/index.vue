<script setup lang="ts">
useHead({ title: 'Horse Racing Analysis' })
</script>

<template>
  <div class="min-h-screen bg-bg-primary text-text-primary p-8">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl font-bold mb-4">Horse Racing Analysis</h1>
      <p class="text-text-secondary mb-8">Nuxt + Tailwind v4 + DaisyUI v5 🐎</p>
      
      <div class="grid gap-4 md:grid-cols-3 mb-8">
        <div class="card bg-bg-secondary shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-accent">Tailwind v4</h2>
            <p>Using @tailwindcss/vite plugin</p>
          </div>
        </div>
        <div class="card bg-bg-secondary shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-accent-blue">DaisyUI v5</h2>
            <p>Component library enabled</p>
          </div>
        </div>
        <div class="card bg-bg-secondary shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-emerald-400">Nuxt 3</h2>
            <p>Full-stack Vue framework</p>
          </div>
        </div>
      </div>
      
      <button class="btn btn-primary">Primary Button</button>
      <button class="btn btn-secondary ml-2">Secondary</button>
      <button class="btn btn-accent ml-2">Accent</button>
    </div>
  </div>
</template>