<script setup lang="ts">
const store = useRacesStore()

// Fetch races on mount
await callOnce(async () => {
  await store.fetchRaces()
})

// Computed - use unified date formatter
const formattedDate = computed(() => {
  return formatDisplayDate(store.currentDate)
})

// Get track name
const trackName = computed(() => {
  const track = store.races[0]?.trackCode
  return track === 'RP' ? 'Remington Park' : track || 'Unknown Track'
})

// Confidence color helper
const getConfidenceColor = (score: number) => {
  if (score >= 85) return 'badge-success'
  if (score >= 70) return 'badge-warning'
  return 'badge-ghost'
}

// Status badge helper
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'upcoming': return 'badge-info'
    case 'open': return 'badge-success'
    case 'closed': return 'badge-warning'
    case 'final': return 'badge-neutral'
    default: return 'badge-ghost'
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold">🏇 {{ trackName }}</h1>
        <p class="text-base-content/70">{{ formattedDate }}</p>
      </div>
      
      <div class="flex items-center gap-2">
        <button class="btn btn-ghost btn-sm" @click="store.prevDate">
          <Icon name="lucide:chevron-left" />
        </button>
        
        <input
          v-model="store.currentDate"
          type="date"
          class="input input-bordered input-sm"
          @change="store.fetchRaces(store.currentDate)"
        />
        
        <button class="btn btn-ghost btn-sm" @click="store.nextDate">
          <Icon name="lucide:chevron-right" />
        </button>
        
        <button class="btn btn-primary btn-sm ml-2" @click="store.today">
          Today
        </button>
      </div>
    </div>
    
    <!-- Stats Summary -->
    <div class="stats shadow bg-base-100 mb-6">
      <div class="stat">
        <div class="stat-title">Races Today</div>
        <div class="stat-value text-3xl">{{ store.races.length }}</div>
      </div>
      
      <div class="stat">
        <div class="stat-title">Confirmed Picks</div>
        <div class="stat-value text-3xl text-success">
          {{ store.races.filter(r => r.entries.some(e => e.confidenceScore >= 70)).length }}
        </div>
      </div>
      
      <div class="stat">
        <div class="stat-title">Track Surface</div>
        <div class="stat-value text-3xl">{{ store.races[0]?.surface || '-' }}</div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="store.loading" class="flex justify-center p-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <!-- Error State -->
    <div v-else-if="store.error" class="alert alert-error">
      <span>{{ store.error }}</span>
    </div>
    
    <!-- No Races State -->
    <div v-else-if="store.races.length === 0" class="alert alert-info">
      <span>No races found for {{ formattedDate }}. Select another date or upload a race program.</span>
    </div>
    
    <!-- Race Cards Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="race in store.races"
        :key="race.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="card-body">
          <!-- Race Header -->
          <div class="flex justify-between items-start mb-4">
            <div>
              <h2 class="card-title text-2xl">Race {{ race.number }}</h2>
              <div class="badge badge-outline">{{ race.type }}</div>
            </div>
            
            <div class="badge" :class="getStatusBadge(race.status)">
              {{ race.status }}
            </div>
          </div>
          
          <!-- Race Details -->
          <div class="grid grid-cols-2 gap-2 text-sm mb-4">
            <div>
              <span class="text-base-content/50">Distance:</span>
              <span class="font-mono">{{ race.distance }}</span>
            </div>
            <div>
              <span class="text-base-content/50">Post Time:</span>
              <span class="font-mono">{{ race.postTime }}</span>
            </div>
            <div>
              <span class="text-base-content/50">Surface:</span>
              <span>{{ race.surface }}</span>
            </div>
            <div>
              <span class="text-base-content/50">Purse:</span>
              <span>${{ race.purse.toLocaleString() }}</span>
            </div>
          </div>
          
          <!-- Entries Preview -->
          <div class="mb-4">
            <p class="text-sm font-semibold mb-2">Top Entries:</p>
            
            <div class="space-y-1">
              <div
                v-for="entry in race.entries.slice(0, 3)"
                :key="entry.postPosition"
                class="flex justify-between items-center py-1 px-2 rounded hover:bg-base-200"
              >
                <div class="flex items-center gap-2">
                  <span class="badge badge-sm badge-outline">{{ entry.postPosition }}</span>
                  <span class="font-medium">{{ entry.horse.name }}</span>
                </div>
                
                <div class="flex items-center gap-2">
                  <span class="text-xs text-base-content/70">{{ entry.morningLineOdds }}</span>
                  <span
                    v-if="entry.confidenceScore"
                    class="badge badge-xs"
                    :class="getConfidenceColor(entry.confidenceScore)"
                  >
                    {{ entry.confidenceScore }}
                  </span>
                </div>
              </div>
            </div>
            
            <p v-if="race.entries.length > 3" class="text-xs text-center text-base-content/50 mt-2">
              +{{ race.entries.length - 3 }} more entries
            </p>
          </div>
          
          <!-- Card Actions -->
          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm">
              View Race
              <Icon name="lucide:arrow-right" class="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
