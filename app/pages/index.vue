<script setup lang="ts">
useHead({
  title: 'QH Sprint Analysis - Dashboard',
  meta: [{ name: 'description', content: 'Quarter Horse Sprint Handicapping System' }]
})

const { data: raceDays, pending } = await useFetch('/api/race-days')

const stats = [
  { label: 'Races Analyzed', value: '12', trend: '+3 this week' },
  { label: 'Win Rate', value: '68%', trend: 'Last 30 days' },
  { label: 'ROI', value: '+12.4%', trend: 'Cumulative' },
  { label: 'Bankroll', value: '$1,247', trend: 'Starting: $100' }
]
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <!-- Header -->
    <header class="border-b border-bg-secondary bg-bg-secondary/50 backdrop-blur">
      <div class="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="text-3xl">🏇</div>
          <div>
            <h1 class="text-xl font-bold text-text-primary">QH Sprint Analysis</h1>
            <p class="text-xs text-text-secondary">Quarter Horse Sprint Handicapping</p>
          </div>
        </div>
        <NuxtLink to="/upload" class="btn btn-primary btn-sm">
          + Upload Race Card
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- Stats Grid -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div v-for="stat in stats" :key="stat.label" class="card bg-bg-secondary shadow-lg">
          <div class="card-body p-5">
            <p class="text-text-secondary text-xs uppercase tracking-wider mb-1">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-text-primary">{{ stat.value }}</p>
            <p class="text-xs text-accent mt-1">{{ stat.trend }}</p>
          </div>
        </div>
      </section>

      <!-- Recent Race Days -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-text-primary">Recent Race Days</h2>
          <NuxtLink 
            v-if="raceDays?.length"
            :to="`/race-day/${raceDays[0].year}/${raceDays[0].month}/${raceDays[0].day}`"
            class="text-accent text-sm hover:underline"
          >
            View Latest →
          </NuxtLink>
        </div>

        <div v-if="pending" class="text-text-secondary text-center py-12">
          Loading race days...
        </div>

        <div v-else-if="raceDays?.length" class="grid gap-4">
          <NuxtLink 
            v-for="day in raceDays.slice(0, 5)" 
            :key="day.key"
            :to="`/race-day/${day.year}/${day.month}/${day.day}`"
            class="card bg-bg-secondary hover:bg-slate-800 transition-colors p-5 flex items-center justify-between"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-lg bg-bg-primary flex items-center justify-center text-xl">
                🏇
              </div>
              <div>
                <h3 class="font-semibold text-text-primary">{{ day.track }}</h3>
                <p class="text-sm text-text-secondary">{{ day.displayDate }} • {{ day.races }} races</p>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <div class="text-right hidden sm:block">
                <p class="text-xs text-text-secondary">Top Pick</p>
                <p class="text-sm font-medium text-accent">{{ day.topPick }}</p>
              </div>
              <div class="text-right hidden sm:block">
                <p class="text-xs text-text-secondary">Confidence</p>
                <p class="text-sm font-medium text-text-primary">{{ day.confidence }}</p>
              </div>
              <div class="text-text-secondary">→</div>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="card bg-bg-secondary p-12 text-center">
          <div class="text-4xl mb-3">📄</div>
          <h3 class="text-text-primary font-medium mb-2">No race days yet</h3>
          <p class="text-text-secondary text-sm mb-4">Upload a race program PDF to get started</p>
          <NuxtLink to="/upload" class="btn btn-primary">
            Upload First Race
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>