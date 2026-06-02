<script setup lang="ts">
const store = useRacesStore()
const { formattedDate, races } = storeToRefs(store)

// Available dates with data
const availableDates = ['2025-05-29', '2025-06-01']

// Default to most recent race date (not necessarily today)
const defaultDate = getMostRecentRaceDate()

// Initialize store with default date on client+server
await useAsyncData('races', async () => {
  await store.setDate(defaultDate)
  return store.races
})

// Get races for selected date
const hasRaces = computed(() => races.value.length > 0)

// Date is in history (past races with results)
const isHistory = computed(() => {
  return races.value.some(r => r.results || r.status === 'final')
})

// Quick stats
const totalEntries = computed(() => 
  races.value.reduce((sum, r) => sum + (r.entries?.length || 0), 0)
)

const trackName = computed(() => {
  if (!races.value.length) return 'Unknown Track'
  const code = races.value[0]?.trackCode
  const tracks: Record<string, string> = {
    RP: 'Remington Park',
    LS: 'Lone Star Park',
    RD: 'Ruidoso Downs',
    FG: 'Fair Grounds',
    DD: 'Delta Downs'
  }
  return tracks[code] || code
})

function goToToday() {
  const today = getToday()
  // Only go to today if there's data for it, otherwise show most recent
  if (availableDates.includes(today)) {
    store.setDate(today)
  } else {
    store.setDate(getMostRecentRaceDate())
  }
}

function formatRaceTime(time: string): string {
  if (!time) return 'TBD'
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

function getConfidenceColor(score: number): string {
  if (score >= 90) return 'bg-error text-error-content'
  if (score >= 80) return 'bg-warning text-warning-content'
  if (score >= 70) return 'bg-info text-info-content'
  return 'bg-base-300 text-base-content'
}

function getTopPicks(race: any) {
  if (!race.entries || race.entries.length === 0) return []
  return [...race.entries]
    .sort((a: any, b: any) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
    .slice(0, 3)
}

function getRaceStatus(race: any): string {
  if (race.status === 'final' || race.results) return 'Final'
  if (race.status === 'open') return 'Open'
  if (race.status === 'closed') return 'Closed'
  return 'Upcoming'
}
</script>

<template>
  <div class="container mx-auto p-4">
    <!-- Header with Date Navigation -->
    <div class="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
      <div class="flex items-center gap-2">
        <button class="btn btn-circle btn-ghost btn-sm" @click="store.prevDate()">
          <Icon name="lucide:chevron-left" />
        </button>
        
        <div class="flex flex-col items-center">
          <input
            v-model="store.currentDate"
            type="date"
            class="input input-sm input-bordered w-40"
            @change="(e) => store.setDate((e.target as HTMLInputElement).value)"
            :min="'2025-01-01'"
            :max="'2025-12-31'"
          />
          <p class="text-sm text-base-content/50 mt-1">
            {{ formattedDate }}
          </p>
        </div>
        
        <button class="btn btn-circle btn-ghost btn-sm" @click="store.nextDate()">
          <Icon name="lucide:chevron-right" />
        </button>
      </div>
      
      <div class="flex gap-2">
        <button class="btn btn-sm btn-ghost" @click="goToToday">
          <Icon name="lucide:calendar" class="mr-1" />
          {{ availableDates.includes(getToday()) ? 'Today' : 'Most Recent' }}
        </button>
        
        <button class="btn btn-sm btn-primary" @click="$router.push('/upload')">
          <Icon name="lucide:upload" class="mr-1" />
          Upload Race Card
        </button>
      </div>
    </div>
    
    <!-- Track Info -->
    <div v-if="hasRaces" class="flex items-center gap-2 mb-4">
      <Icon name="lucide:map-pin" class="text-primary" />
      <span class="font-semibold">{{ trackName }}</span>
      <span class="badge badge-sm" :class="isHistory ? 'badge-neutral' : 'badge-success'">
        {{ isHistory ? 'Historical Data' : 'Live' }}
      </span>
      <span class="text-sm text-base-content/50 ml-2">{{ races.length }} races, {{ totalEntries }} entries</span>
    </div>
    
    <div v-if="!hasRaces" class="card bg-base-100 shadow">
      <div class="card-body text-center py-12">
        <Icon name="lucide:calendar-x" class="w-16 h-16 mx-auto text-base-content/20 mb-4" />
        
        <h2 class="text-xl font-semibold mb-2">No races found for {{ formattedDate }}</h2>
        
        <p class="text-base-content/50 mb-4">Upload a race program or view historical dates</p>
        
        <div class="flex gap-2 justify-center">
          <button class="btn btn-primary" @click="$router.push('/upload')">
            <Icon name="lucide:upload" class="mr-2" />
            Upload Race Card
          </button>
          
          <button class="btn btn-outline" @click="goToToday">
            <Icon name="lucide:history" class="mr-2" />
            View Historical
          </button>
        </div>
        
        <!-- Available Dates -->
        <div class="mt-6 text-sm">
          <p class="text-base-content/50 mb-2">Available dates:</p>
          <div class="flex flex-wrap gap-2 justify-center">
            <button
              v-for="date in availableDates"
              :key="date"
              class="badge badge-outline cursor-pointer hover:badge-primary"
              @click="store.setDate(date)"
            >
              {{ formatShortDate(date) }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Race Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="race in races"
        :key="race.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
        @click="$router.push(`/race/${race.date}/${race.number}`)"
      >
        <div class="card-body p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="badge badge-primary badge-lg">Race {{ race.number }}</span>
              <span :class="['badge badge-sm', race.status === 'final' ? 'badge-neutral' : 'badge-success']">
                {{ getRaceStatus(race) }}
              </span>
            </div>
            
            <span class="text-sm text-base-content/50">{{ formatRaceTime(race.postTime) }}</span>
          </div>
          
          <h3 class="card-title text-lg">
            {{ race.distance }} {{ race.type }}
          </h3>
          
          <p class="text-sm text-base-content/60">${{ race.purse?.toLocaleString() }} purse</p>
          
          <div class="mt-3 space-y-1">
            <p v-if="race.surface" class="text-sm">
              <span class="badge badge-ghost badge-sm">{{ race.surface }}</span>
            </p>
            
            <p class="text-sm text-base-content/50">{{ race.entries?.length || 0 }} entries</p>
          </div>
          
          <!-- Top Picks Preview -->
          <div v-if="getTopPicks(race).length" class="mt-3 pt-3 border-t border-base-200">
            <p class="text-xs text-base-content/50 uppercase mb-2">Top Picks</p>
            
            <div class="space-y-1">
              <div
                v-for="(entry, idx) in getTopPicks(race)"
                :key="entry?.horse?.name"
                class="flex items-center justify-between text-sm"
              >
                <span class="flex items-center gap-1">
                  <span class="badge badge-xs" :class="getConfidenceColor(entry?.confidenceScore || 0)">{{ idx + 1 }}</span>
                  {{ entry?.horse?.name }}
                </span>
                
                <span class="text-xs text-base-content/50">{{ entry?.morningLineOdds }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
