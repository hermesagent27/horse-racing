<script setup lang="ts">
// Breadcrumbs component for nested navigation
defineProps<{
  items: { label: string; path?: string }[]
}>()
</script>

<template>
  <nav class="breadcrumbs text-sm mb-4">
    <ul>
      <li v-for="(item, index) in items" :key="item.label">
        <a
          v-if="item.path && index < items.length - 1"
          :href="item.path"
          class="text-primary hover:underline"
          @click.prevent="$router.push(item.path)"
        >
          {{ item.label }}
        </a>
        <span v-else class="text-base-content/60">{{ item.label }}</span>
      </li>
    </ul>
  </nav>
</template>
