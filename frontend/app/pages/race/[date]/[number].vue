<script setup lang="ts">
const route = useRoute()
const date = route.params.date as string
const number = parseInt(route.params.number as string)

const { data: race, pending, error } = await useFetch(`/api/races/${date}/${number}`, {
  key: `race-${date}-${number}`
})

// Computed
const topPicks = computed(() => {
  if (!race.value?.entries?.length) return []
  return [...race.value.entries]
    .sort((a: any, b: any) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
    .slice(0, 3)
})

const raceResults = computed(() => {
  return race.value?.results || race.value?.stats?.results
})

const hasBets = computed(() => {
  return (race.value?.stats?.totalBets || 0) > 0
})

const totalWagered = computed(() => race.value?.stats?.totalWagered || 0)
const totalReturned = computed(() => race.value?.stats?.totalReturned || 0)
const profit = computed(() => totalReturned.value - totalWagered.value)

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount).toFixed(2)
  return amount >= 0 ? `$${abs}` : `-$${abs}`
}

function getConfidenceColor(score: number): string {
  if (score >= 90) return 'text-error'
  if (score >= 80) return 'text-warning'
  if (score >= 70) return 'text-info'
  return 'text-base-content'
}

function getResultForEntry(entry: any): string {
  if (!raceResults.value) return ''
  const winnerName = raceResults.value.winner
  if (entry.horse.name === winnerName) return '🥇 WIN'
  return ''
}
</script>

<template>
  <div class="container mx-auto p-4">
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <!-- Error -->
    <div v-else-if="error" class="card bg-error text-error-content">
      <div class="card-body">
        <h2 class="card-title">Error loading race</h2>
        <p>{{ error.message }}</p>
        <button class="btn" @click="$router.push('/races')">Back to Races</button>
      </div>
    </div>
    
    <!-- Race Detail -->
    <div v-else-if="race">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <button class="btn btn-ghost btn-sm" @click="$router.push('/races')">
              <Icon name="lucide:arrow-left" />
            </button>
            
            <span class="badge badge-primary badge-lg">Race {{ race.number }}</span>
            
            <span class="badge badge-sm" :class="race.status === 'final' ? 'badge-neutral' : 'badge-success'">
              {{ race.status || 'Upcoming' }}
            </span>
          </div>
          
          <h1 class="text-3xl font-bold">{{ race.distance }} {{ race.type }}</h1>
          
          <p class="text-base-content/60">{{ formatDisplayDate(race.date) }} | ${{ race.purse?.toLocaleString() }} purse</p>
        </div>
        
        <!-- Betting Stats -->
        <div v-if="hasBets" class="card bg-base-100 shadow p-4">
          <div class="text-sm text-base-content/50 mb-1">Your Results</div>
          
          <div class="flex items-center gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold">{{ race.stats?.totalBets || 0 }}</div>
              <div class="text-xs text-base-content/50">Bets</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold" :class="profit >= 0 ? 'text-success' : 'text-error'">
                {{ formatCurrency(profit) }}
              </div>
              <div class="text-xs text-base-content/50">Profit/Loss</div>
            </div>
          </div>
        </div>
        
        <div v-else class="card bg-base-100 shadow p-4">
          <div class="text-sm text-base-content/50 mb-2">No bets placed</div>
          
          <button class="btn btn-primary btn-sm" @click="$router.push('/bets/new')">
            <Icon name="lucide:plus" class="mr-1" />
            Add Bet
          </button>
        </div>
      </div>
      
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Entries -->
        <div class="lg:col-span-2">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title"><Icon name="lucide:list" /> Entries</h2>
              
              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Post</th>
                      <th>Horse</th>
                      <th>ML Odds</th>
                      <th>Jockey/Trainer</th>
                      <th>Confidence</th>
                      <th v-if="raceResults">Result</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    <tr
                      v-for="entry in race.entries"
                      :key="entry.postPosition"
                      :class="{ 'bg-primary/10': topPicks.some(p => p.postPosition === entry.postPosition) }"
                    >
                      <td class="font-mono">{{ entry.postPosition }}</td>
                      
                      <td>
                        <div class="font-semibold">{{ entry.horse.name }}</div>
                        <div v-if="entry.horse.lifetimeStats" class="text-xs text-base-content/50">
                          {{ entry.horse.lifetimeStats.starts }} starts, {{ entry.horse.lifetimeStats.wins }} wins
                        </div>
                      </td>
                      
                      <td>{{ entry.morningLineOdds }}</td>
                      
                      <td class="text-sm">
                        <div v-if="entry.jockey?.name">{{ entry.jockey.name }}</div>
                        <div v-else>{{ entry.horse.jockey }}</div>
                        
                        <div v-if="entry.trainer?.name" class="text-base-content/60">
                          {{ entry.trainer.name }}
                        </div>
                        <div v-else class="text-base-content/60">{{ entry.horse.trainer }}</div>
                      </td>
                      
                      <td>
                        <span v-if="entry.confidenceScore" class="font-bold" :class="getConfidenceColor(entry.confidenceScore)">
                          {{ entry.confidenceScore }}
                        </span>
                        <span v-else class="text-base-content/30">-</span>
                      </td>
                      
                      <td v-if="raceResults">
                        {{ getResultForEntry(entry) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right: Analysis & Bets -->
        <div class="space-y-4">
          <!-- Top Picks -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="card-title text-lg"><Icon name="lucide:star" /> Top Picks</h3>
              
              <div v-if="topPicks.length" class="space-y-2">
                <div
                  v-for="(pick, i) in topPicks"
                  :key="pick.postPosition"
                  class="flex items-center justify-between p-2 rounded"
                  :class="i === 0 ? 'bg-warning/20 border border-warning/30' : 'bg-base-200'"
                >
                  <div class="flex items-center gap-2">
                    <span class="badge" :class="i === 0 ? 'badge-warning' : 'badge-ghost'">#{{ i + 1 }}</span>
                    
                    <span class="font-semibold">{{ pick.horse.name }}</span>
                  </div>
                  
                  <span class="font-bold" :class="getConfidenceColor(pick.confidenceScore)">
                    {{ pick.confidenceScore }}%
                  </span>
                </div>
              </div>
              
              <p v-else class="text-base-content/50">No confidence scores available</p>
            </div>          </div>
          <!-- Bet History -->
          <div v-if="hasBets" class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="card-title text-lg"><Icon name="lucide:receipt" /> Your Bets</h3>
              
              <div class="space-y-2">
                <div
                  v-for="bet in race.stats?.bets"
                  :key="bet.id"
                  class="p-3 rounded border-l-4"
                  :class="bet.result === 'won' ? 'bg-success/10 border-success' : 'bg-error/10 border-error'"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-semibold">{{ bet.type }}</span>
                    
                    <span class="badge badge-sm" :class="bet.result === 'won' ? 'badge-success' : 'badge-error'">
                      {{ bet.result.toUpperCase() }}
                    </span>
                  </div>
                  
                  <div class="text-sm text-base-content/60 mt-1">
                    ${{ bet.amount }} @ {{ bet.oddsTaken }}
                  </div>
                  
                  <div v-if="bet.selections?.length" class="text-xs text-base-content/50 mt-1">
                    {{ bet.selections.map(s => s.horseName).join(', ') }}
                  </div>
                  
                  <div v-if="bet.result === 'won' && bet.actualPayout" class="text-success font-bold">
                    Payout: ${{ bet.actualPayout.toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>          </div>
          
          <!-- Actions -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <button class="btn btn-primary w-full mb-2" @click="$router.push('/bets/new')">
                <Icon name="lucide:plus" class="mr-2" />
                Add Bet
              </button>
              
              <button class="btn btn-outline w-full" @click="$router.push('/history')">
                <Icon name="lucide:history" class="mr-2" />
                Full History
              </button>
            </div>          </div>
        </div>
      </div>
    </div>
  </div>
</template>
