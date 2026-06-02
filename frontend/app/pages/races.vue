<script setup lang="ts">
const store = useRacesStore()
const { formattedDate, races } = storeToRefs(store)

// Available dates with data (match data folder structure)
const availableDates = ['2025-05-29', '2025-06-01']

// Default to most recent race date
const defaultDate = getMostRecentRaceDate()

// Initialize store
await useAsyncData('races', async () => {
  await store.setDate(defaultDate)
  return store.races
})

// Computed
const hasRaces = computed(() => races.value.length > 0)
const isHistory = computed(() => races.value.some((r: any) => r.status === 'final' || r.stats?.bets?.length > 0))
const totalEntries = computed(() => races.value.reduce((sum: number, r: any) => sum + (r.entries?.length || 0), 0))
const totalBetsForDate = computed(() => races.value.reduce((sum: number, r: any) => sum + (r.stats?.totalBets || 0), 0))
const totalProfit = computed(() => races.value.reduce((sum: number, r: any) => sum + (r.stats?.profit || 0), 0))

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

// Functions
function goToToday() {
  const today = getToday()
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

function getProfitColor(profit: number): string {
  if (profit > 0) return 'text-success'
  if (profit < 0) return 'text-error'
  return 'text-base-content'
}

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount).toFixed(2)
  return amount >= 0 ? `$${abs}` : `-$${abs}`
}

function getTopPicks(race: any) {
  if (!race.entries?.length) return []
  return [...race.entries]
    .sort((a: any, b: any) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
    .slice(0, 3)
}

function getRaceStatus(race: any): string {
  if (race.status === 'final' || race.results || race.stats?.bets?.some((b: any) => b.result === 'won' || b.result === 'lost')) return 'Final'
  if (race.status === 'open') return 'Open'
  if (race.status === 'closed') return 'Closed'
  return 'Upcoming'
}

function getRaceBetsSummary(race: any): string {
  const stats = race.stats
  if (!stats || stats.totalBets === 0) return ''
  
  const won = stats.bets?.filter((b: any) => b.result === 'won').length || 0
  const returnStr = stats.profit >= 0 ? `+${formatCurrency(stats.profit)}` : formatCurrency(stats.profit)
  return `${stats.totalBets} bets, ${won} W | ${returnStr}`
}
</script>

<template>
  <div class="container mx-auto p-4">
    <!-- Header -->
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
          <p class="text-sm text-base-content/50 mt-1">{{ formattedDate }}</p>
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
          Upload
        </button>
      </div>
    </div>
    
    <!-- Track Info & Session Stats -->
    <div v-if="hasRaces" class="flex flex-wrap items-center gap-3 mb-4">
      <div class="flex items-center gap-2">
        <Icon name="lucide:map-pin" class="text-primary" />
        <span class="font-semibold">{{ trackName }}</span>
      </div>
      
      <span class="badge badge-sm" :class="isHistory ? 'badge-neutral' : 'badge-success'">
        {{ isHistory ? 'Historical' : 'Live' }}
      </span>
      
      <span class="text-sm text-base-content/50">{{ races.length }} races, {{ totalEntries }} entries</span>
      
      <!-- Session P/L -->
      <div v-if="totalBetsForDate > 0" class="ml-auto flex items-center gap-2">
        <span class="text-sm text-base-content/50">Session:</span>
        <span class="font-bold" :class="getProfitColor(totalProfit)">
          {{ totalProfit >= 0 ? '+' : '' }}{{ formatCurrency(totalProfit) }}
        </span>
        <span class="text-sm text-base-content/50">({{ totalBetsForDate }} bets)</span>
      </div>
    </div>
    
    <!-- No Races State -->
    <div v-if="!hasRaces" class="card bg-base-100 shadow">
      <div class="card-body text-center py-12">
        <Icon name="lucide:calendar-x" class="w-16 h-16 mx-auto text-base-content/20 mb-4" />
        
        <h2 class="text-xl font-semibold mb-2">No races for {{ formattedDate }}</h2>
        
        <p class="text-base-content/50 mb-4">Upload a race program or view historical dates</p>
        
        <div class="flex gap-2 justify-center">
          <button class="btn btn-primary" @click="$router.push('/upload')">
            <Icon name="lucide:upload" class="mr-2" />
            Upload
          </button>
          
          <button class="btn btn-outline" @click="goToToday">
            <Icon name="lucide:history" class="mr-2" />
            History
          </button>
        </div>
        
        <div class="mt-6 text-sm">
          <p class="text-base-content/50 mb-2">Available:</p>
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
        class="card bg-base-100 shadow hover:shadow-lg transition-all cursor-pointer group"
        @click="$router.push(`/race/${race.date}/${race.number}`)"
      >
        <div class="card-body p-4">
          <!-- Race Header -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="badge badge-primary badge-lg">Race {{ race.number }}</span>
              <span class="badge badge-sm" :class="getRaceStatus(race) === 'Final' ? 'badge-neutral' : 'badge-success'">
                {{ getRaceStatus(race) }}
              </span>
            </div>
            
            <span class="text-sm text-base-content/50">{{ formatRaceTime(race.postTime) }}</span>
          </div>
          
          <!-- Race Info -->
          <h3 class="card-title text-lg">{{ race.distance }} {{ race.type }}</h3>
          
          <div class="flex flex-wrap gap-2 mt-1">
            <span v-if="race.surface" class="badge badge-ghost badge-sm">{{ race.surface }}</span>
            <span class="text-sm text-base-content/50">${{ race.purse?.toLocaleString() }}</span>
          </div>
          
          <!-- Quick Stats Row -->
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-base-200">
            <div class="flex items-center gap-3">
              <div class="flex -space-x-2">
                <div
                  v-for="i in Math.min(race.entries?.length || 0, 4)"
                  :key="i"
                  class="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs border border-base-100"
                >
                  {{ i }}
                </div>
                <span v-if="(race.entries?.length || 0) > 4" class="text-xs ml-1">+{{ race.entries.length - 4 }}</span>
              </div>
              <span class="text-sm text-base-content/50">{{ race.entries?.length || 0 }} entries</span>
            </div>
            
            <!-- Bet Stats for this race -->
            <div v-if="race.stats?.totalBets" class="text-right">
              <div class="text-xs text-base-content/50">Bets: {{ race.stats.totalBets }}</div>
              <div class="text-sm font-bold" :class="getProfitColor(race.stats.profit)">
                {{ race.stats.profit >= 0 ? '+' : '' }}{{ formatCurrency(race.stats.profit) }}
              </div>
            </div>
          </div>
          
          <!-- Top Picks -->
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
          
          <!-- View Details Hint -->
          <div class="mt-3 pt-3 border-t border-base-200 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="flex items-center justify-center text-sm text-primary">
              <Icon name="lucide:arrow-right" class="w-4 h-4 mr-1" />
              View Details
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
