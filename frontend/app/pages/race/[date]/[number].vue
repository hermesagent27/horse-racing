<script setup lang="ts">
const route = useRoute()
const date = route.params.date as string
const number = parseInt(route.params.number as string)

const { data: race, pending, error, refresh } = await useFetch(`/api/races/${date}/${number}`, {
  key: `race-${date}-${number}`
})

const editMode = ref(false)

const editForm = ref({
  entries: [] as any[],
  results: {
    first: null as number | null,
    second: null as number | null,
    third: null as number | null
  }
})

const editingEntry = ref<number | null>(null)

function startEdit() {
  editForm.value = {
    entries: race.value?.entries?.map((e: any) => ({
      ...e,
      scratched: e.scratched || false,
      result: e.result || undefined
    })) || [],
    results: parseResults(race.value?.results)
  }
  editMode.value = true
}

function parseResults(results?: any) {
  if (!results?.places) return { first: null, second: null, third: null }
  const [first, second, third] = results.places
  return { first: first?.postPosition || null, second: second?.postPosition || null, third: third?.postPosition || null }
}

const isSaving = ref(false)
const saveError = ref('')

async function saveRaceEdits() {
  isSaving.value = true
  saveError.value = ''

  try {
    // Build results from selected places
    const results = {
      winner: editForm.value.results.first
        ? editForm.value.entries.find((e: any) => e.postPosition === editForm.value.results.first)?.horse?.name
        : undefined,
      places: [
        editForm.value.results.first ? { postPosition: editForm.value.results.first, place: 1 } : null,
        editForm.value.results.second ? { postPosition: editForm.value.results.second, place: 2 } : null,
        editForm.value.results.third ? { postPosition: editForm.value.results.third, place: 3 } : null,
      ].filter(Boolean)
    }

    await $fetch(`/api/races/${date}/${number}`, {
      method: 'PUT',
      body: {
        date,
        number,
        entries: editForm.value.entries.map((e: any) => ({
          ...e,
          scratched: e.scratched || false,
          result: e.result || undefined
        })),
        results: results.winner ? results : null
      }
    })

    editMode.value = false
    await refresh()
  } catch (e: any) {
    saveError.value = e.message || 'Failed to save changes'
  } finally {
    isSaving.value = false
  }
}

function cancelEdit() {
  editMode.value = false
  editingEntry.value = null
}

function toggleScratched(postPosition: number) {
  const entry = editForm.value.entries.find((e: any) => e.postPosition === postPosition)
  if (entry) {
    entry.scratched = !entry.scratched
    // Clear any results if scratching
    if (entry.scratched) {
      entry.result = undefined
    }
  }
}

function setResult(postPosition: number, place: string | null) {
  const entry = editForm.value.entries.find((e: any) => e.postPosition === postPosition)
  if (entry) {
    entry.result = place
  }
  // Update results form
  if (place === '1st') editForm.value.results.first = entry.scratched ? null : postPosition
  if (place === '2nd') editForm.value.results.second = entry.scratched ? null : postPosition
  if (place === '3rd') editForm.value.results.third = entry.scratched ? null : postPosition
}

function getResultForEntry(entry: any): string {
  // First check explicit result on entry
  if (entry.result === '1st') return '🥇 1st'
  if (entry.result === '2nd') return '🥈 2nd'
  if (entry.result === '3rd') return '🥉 3rd'
  if (entry.scratched) return '🚫 Scratched'

  // Then check race results
  const results = race.results || race.stats?.results
  if (results?.places) {
    const place = results.places.find((p: any) => p.postPosition === entry.postPosition)
    if (place?.place === 1) return '🥇 1st'
    if (place?.place === 2) return '🥈 2nd'
    if (place?.place === 3) return '🥉 3rd'
  }

  return ''
}

function canEdit() {
  return !editMode.value
}

const expandedPick = ref<number | null>(null)

function togglePickExpansion(postPosition: number) {
  expandedPick.value = expandedPick.value === postPosition ? null : postPosition
}

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Home', path: '/' },
  { label: 'Races', path: '/races' },
  { label: `Race ${race.value?.number || number}` }
])

// Computed
const activeEntries = computed(() => {
  return race.value?.entries?.filter((e: any) => !e.scratched) || []
})

const topPicks = computed(() => {
  if (!activeEntries.value.length) return []
  return [...activeEntries.value]
    .sort((a: any, b: any) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
    .slice(0, 4)
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

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getConfidenceColor(score: number): string {
  if (score >= 90) return 'text-error'
  if (score >= 80) return 'text-warning'
  if (score >= 70) return 'text-info'
  return 'text-base-content'
}

function getEntryNote(entry: any): string {
  // Return analysis note for top picks dropdown
  const notes = []
  if (entry.confidenceScore >= 85) notes.push(`High confidence pick (${entry.confidenceScore}%)`)
  if (entry.scratched) notes.push('Scratched from race')
  if (entry.horse?.lifetimeStats?.wins > 0) {
    notes.push(`${entry.horse.lifetimeStats.wins} career wins`)
  }
  if (entry.jockey?.name) {
    notes.push(`Jockey: ${entry.jockey.name}`)
  }
  return notes.join(' • ') || 'Standard entry'
}

function getEntryCaution(entry: any): string[] {
  const cautions = []
  if (entry.confidenceScore < 70) cautions.push('Lower confidence score')
  if (entry.morningLineOdds > '10/1') cautions.push('Longshot - higher odds')
  if (!entry.horse?.lifetimeStats?.wins) cautions.push('No prior race data')
  return cautions
}
</script>

<template>
  <div class="container mx-auto p-4">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs :items="breadcrumbs" />

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
        <div v-if="hasBets" class="card bg-slate-800/50 border border-slate-700 p-4 min-w-[200px]">
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

        <div v-else class="card bg-slate-800/50 border border-slate-700 p-4">
          <div class="text-sm text-base-content/50 mb-2">No bets placed</div>

          <button class="btn btn-primary btn-sm" @click="$router.push(`/bets/${date}/${number}`)">
            <Icon name="lucide:plus" class="mr-1" />
            Add Bet
          </button>
        </div>
      </div>


      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Entries -->
        <div class="lg:col-span-2">
          <div class="card bg-slate-800/50 border border-slate-700">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <h2 class="card-title"><Icon name="lucide:list" /> Entries</h2>
                <button v-if="!editMode" class="btn btn-sm btn-outline" @click="startEdit">
                  <Icon name="lucide:edit" class="w-4 h-4 mr-1" /> Edit
                </button>
              </div>

              <!-- Edit Mode Controls -->
              <div v-if="editMode" class="alert alert-info mb-4">
                <div>
                  <Icon name="lucide:info" class="mr-2" />
                  <span>Select scratched horses and place winners (🥇🥈🥉)</span>
                </div>
                <div class="flex gap-2">
                  <button class="btn btn-sm" :class="isSaving ? 'loading' : ''" @click="saveRaceEdits" :disabled="isSaving">Save</button>
                  <button class="btn btn-sm btn-ghost" @click="cancelEdit" :disabled="isSaving">Cancel</button>
                </div>
                <p v-if="saveError" class="text-error text-sm mt-2">{{ saveError }}</p>
              </div>

              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr class="border-b border-slate-600">
                      <th>Post</th>
                      <th>Horse</th>
                      <th>ML Odds</th>
                      <th>Jockey/Trainer</th>
                      <th>Confidence</th>
                      <th v-if="raceResults || editMode">Result</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="entry in editMode ? editForm.entries : race.entries"
                      :key="entry.postPosition"
                      :class="{ 'bg-slate-700/50': topPicks.some(p => p.postPosition === entry.postPosition), 'opacity-50': entry.scratched }"
                    >
                      <td class="font-mono">{{ entry.postPosition }}</td>

                      <td>
                        <div class="font-semibold" :class="entry.scratched ? 'line-through' : ''">{{ entry.horse.name }}</div>
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

                      <td v-if="raceResults || editMode">
                        <div v-if="!editMode" class="flex items-center gap-2">
                          <span v-if="getResultForEntry(entry)" class="font-semibold">{{ getResultForEntry(entry) }}</span>
                        </div>
                        <div v-else class="flex flex-col gap-1">
                          <label class="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              :checked="entry.scratched"
                              @change="toggleScratched(entry.postPosition)"
                              class="checkbox checkbox-sm"
                            />
                            Scratched
                          </label>
                          <div v-if="!entry.scratched" class="flex gap-2 mt-1">
                            <button
                              class="btn btn-xs"
                              :class="entry.result === '1st' ? 'btn-warning' : 'btn-ghost'"
                              @click="setResult(entry.postPosition, '1st')"
                            >
                              🥇
                            </button>
                            <button
                              class="btn btn-xs"
                              :class="entry.result === '2nd' ? 'btn-neutral' : 'btn-ghost'"
                              @click="setResult(entry.postPosition, '2nd')"
                            >
                              🥈
                            </button>
                            <button
                              class="btn btn-xs"
                              :class="entry.result === '3rd' ? 'btn-accent' : 'btn-ghost'"
                              @click="setResult(entry.postPosition, '3rd')"
                            >
                              🥉
                            </button>
                          </div>
                        </div>
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
          <div class="card bg-slate-800/50 border border-slate-700">
            <div class="card-body">
              <h3 class="card-title text-lg"><Icon name="lucide:star" /> Top Picks</h3>

              <div v-if="topPicks.length" class="space-y-2">
                <div
                  v-for="(pick, i) in topPicks"
                  :key="pick.postPosition"
                  class="cursor-pointer"
                >
                  <div
                    class="flex items-center justify-between p-2 rounded"
                    :class="i === 0 ? 'bg-warning/20 border border-warning/30' : 'bg-slate-700/50'"
                    @click="togglePickExpansion(pick.postPosition)"
                  >
                    <div class="flex items-center gap-2">
                      <span class="badge" :class="i === 0 ? 'badge-warning' : 'badge-ghost'">#{{ i + 1 }}</span>

                      <span class="font-semibold">{{ pick.horse.name }}</span>
                      <Icon
                        :name="expandedPick === pick.postPosition ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                        class="w-4 h-4 text-base-content/50"
                      />
                    </div>

                    <span class="font-bold" :class="getConfidenceColor(pick.confidenceScore)">
                      {{ pick.confidenceScore }}%
                    </span>
                  </div>
                  <!-- Dropdown with analysis -->
                  <div
                    v-if="expandedPick === pick.postPosition"
                    class="bg-slate-900/50 rounded-b-lg p-3 border-x border-b border-slate-700"
                  >
                    <div class="text-sm">
                      <p class="text-base-content/70 mb-2">
                        {{ getEntryNote(pick) }}
                      </p>
                      <div v-if="getEntryCaution(pick).length">
                        <p class="text-warning text-xs font-semibold mb-1">⚠️ Caution:</p>
                        <ul class="text-warning/70 text-xs space-y-0.5">
                          <li v-for="caution in getEntryCaution(pick)" :key="caution">• {{ caution }}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p v-else class="text-base-content/50">No confidence scores available</p>
            </div>          </div>

          <!-- Bet History -->
          <div v-if="hasBets" class="card bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors"
            @click="$router.push(`/bets/${date}/${number}`)" >
            <div class="card-body">
              <h3 class="card-title text-lg flex justify-between">
                <span><Icon name="lucide:receipt" /> Your Bets</span>
                <Icon name="lucide:chevron-right" class="text-base-content/50" />
              </h3>

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
          <div class="card bg-slate-800/50 border border-slate-700">
            <div class="card-body">
              <button class="btn btn-primary w-full mb-2" @click="$router.push(`/bets/${date}/${number}`)">
                <Icon name="lucide:plus" class="mr-2" />
                {{ hasBets ? 'Add/Edit Bets' : 'Add Bet' }}
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