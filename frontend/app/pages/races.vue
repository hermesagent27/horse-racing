<script setup lang="ts">
const store = useRacesStore()
const { formattedDate, races } = storeToRefs(store)

// Available dates with data (match data folder structure)
const availableDates = ['2025-05-29']

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

const breadcrumbs = [
  { label: 'Home', path: '/' },
  { label: 'Races' }
]

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
    <!-- Breadcrumbs -->
    <AppBreadcrumbs :items="breadcrumbs" />
    
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
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="race in races"
        :key="race.id"
        class="card bg-base-100 border-2 border-base-200 hover:border-primary hover:shadow-xl transition-all cursor-pointer group"
        @click="$router.push(`/race/${race.date}/${race.number}`)"
      >
        <div class="card-body p-5">
          <!-- Race Header -->
          <div class="flex items-center justify-between mb-3 border-b border-base-200 pb-3">
            <div class="flex items-center gap-2">
              <div class="badge badge-primary badge-lg">Race {{ race.number }}</div>
              <span class="badge badge-sm" :class="getRaceStatus(race) === 'Final' ? 'badge-neutral' : 'badge-success'">
                {{ getRaceStatus(race) }}
              </span>
            </div>
            
            <div class="flex items-center text-base-content/50">
              <Icon name="lucide:clock" class="w-4 h-4 mr-1" />
              <span class="text-sm font-medium">{{ formatRaceTime(race.postTime) }}</span>
            </div>
          </div>
          
          <!-- Race Info -->
          <div class="flex items-baseline gap-2 mb-4">
            <span class="text-2xl font-bold text-primary">{{ race.distance }}</span>
            <span class="text-lg font-medium">{{ race.type }}</span>
          </div>
          
          <div class="flex flex-wrap gap-2 mb-4">
            <span v-if="race.surface" class="badge badge-outline badge-sm">
              <Icon name="lucide:grip-vertical" class="w-3 h-3 mr-1" />
              {{ race.surface }}
            </span>
            <span class="badge badge-ghost badge-sm">
              <Icon name="lucide:banknote" class="w-3 h-3 mr-1" />
              ${{ race.purse?.toLocaleString() }}
            </span>
          </div>
          
          <!-- Quick Stats Row -->
          <div class="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 mb-4">
            <div class="flex items-center gap-2">
              <div class="flex -space-x-2">
                <div
                  v-for="i in Math.min(race.entries?.length || 0, 4)"
                  :key="i"
                  class="w-7 h-7 rounded-full bg-base-300 border-2 border-base-100 flex items-center justify-center text-xs font-bold"
                >
                  {{ i }}
                </div>
                <span v-if="(race.entries?.length || 0) > 4" class="text-xs text-base-content/60 ml-1">+{{ race.entries.length - 4 }} more</span>
              </div>
              
              <span class="text-sm text-base-content/60">{{ race.entries?.length || 0 }} entries</span>
            </div>
            
            <!-- Bet Stats for this race -->
            <div v-if="race.stats?.totalBets" class="text-right">
              <div class="text-xs text-base-content/50 mb-0.5">{{ race.stats.totalBets }} bets</div>
              <div class="text-lg font-bold" :class="race.stats.profit >= 0 ? 'text-success' : 'text-error'">
                {{ race.stats.profit >= 0 ? '+' : '' }}{{ formatCurrency(race.stats.profit) }}
              </div>
            </div>
            
            <div v-else class="badge badge-ghost">
              <Icon name="lucide:circle-dollar-sign" class="w-3 h-3 mr-1" />
              No bets
            </div>
          </div>
          
          <!-- Top Picks Section -->
          <div v-if="getTopPicks(race).length" class="bg-slate-800/30 rounded-lg p-3 mb-4">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="lucide:star" class="w-4 h-4 text-warning" />
              <span class="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Top Picks</span>
            </div>
            
            <div class="space-y-1.5">
              <div
                v-for="(entry, idx) in getTopPicks(race)"
                :key="entry?.horse?.name"
                class="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-base-200/50 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                    :class="idx === 0 ? 'bg-warning text-warning-content' : 'bg-base-300 text-base-content'"
                  >
                    {{ idx + 1 }}
                  </div>
                  <span class="font-medium">{{ entry?.horse?.name }}</span>
                </div>
                
                <div class="flex items-center gap-2">
                  <span v-if="entry?.confidenceScore" class="text-xs font-bold text-primary">{{ entry.confidenceScore }}%</span>
                  <span class="text-xs text-base-content/50">{{ entry?.morningLineOdds }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Action Footer -->
          <div class="flex items-center justify-between pt-2 border-t border-base-200">
            <div class="text-sm text-base-content/50">
              <span class="hidden sm:inline">{{ race.trackCode }}</span>
            </div>
            
            <div class="flex items-center text-primary font-medium text-sm group-hover:underline">
              View Race Details
              <Icon name="lucide:arrow-right" class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
