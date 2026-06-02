<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const date = route.params.date as string
const number = parseInt(route.params.raceNumber as string)

const { data: race, pending, error, refresh } = await useFetch(`/api/races/${date}/${number}`)

// Form for adding/editing bets
const betForm = ref({
  id: '',
  type: 'Win',
  amount: 0,
  oddsTaken: '',
  selections: [] as { horseName: string }[],
  result: 'pending' as 'pending' | 'won' | 'lost'
})

const isEditing = ref(false)
const isSaving = ref(false)
const saveError = ref('')

const betTypes = ['Win', 'Place', 'Show', 'Exacta', 'Trifecta', 'Superfecta', 'Daily Double']

function startNewBet() {
  betForm.value = {
    id: crypto.randomUUID(),
    type: 'Win',
    amount: 0,
    oddsTaken: '',
    selections: [{ horseName: '' }],
    result: 'pending'
  }
  isEditing.value = true
}

function editBet(bet: any) {
  betForm.value = { ...bet }
  isEditing.value = true
}

function addSelection() {
  betForm.value.selections.push({ horseName: '' })
}

function removeSelection(index: number) {
  betForm.value.selections.splice(index, 1)
}

async function saveBet() {
  isSaving.value = true
  saveError.value = ''

  try {
    const existingBets = race.value?.stats?.bets || []
    const betIndex = existingBets.findIndex((b: any) => b.id === betForm.value.id)

    let updatedBets
    if (betIndex >= 0) {
      // Update existing
      updatedBets = [...existingBets]
      updatedBets[betIndex] = { ...betForm.value }
    } else {
      // Add new
      updatedBets = [...existingBets, { ...betForm.value }]
    }

    // Save to GitHub via PUT request
    await $fetch(`/api/bets/${date}/${number}`, {
      method: 'PUT',
      body: {
        date,
        number,
        bets: updatedBets
      }
    })

    isEditing.value = false
    await refresh()
  } catch (e: any) {
    saveError.value = e.message || 'Failed to save bet'
  } finally {
    isSaving.value = false
  }
}

async function deleteBet(betId: string) {
  if (!confirm('Delete this bet?')) return

  try {
    const existingBets = race.value?.stats?.bets || []
    const updatedBets = existingBets.filter((b: any) => b.id !== betId)

    await $fetch(`/api/bets/${date}/${number}`, {
      method: 'PUT',
      body: {
        date,
        number,
        bets: updatedBets
      }
    })

    await refresh()
  } catch (e: any) {
    alert(e.message || 'Failed to delete bet')
  }
}

const existingBets = computed(() => race.value?.stats?.bets || [])

const breadcrumbs = computed(() => [
  { label: 'Home', path: '/' },
  { label: 'Races', path: '/races' },
  { label: `Race ${race.value?.number || number}`, path: `/race/${date}/${number}` },
  { label: 'Bets' }
])
</script>

<template>
  <div class="container mx-auto p-4">
    <AppBreadcrumbs :items="breadcrumbs" />

    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </div>

    <div v-else class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-2">
        {{ race.distance }} {{ race.type }} - Race {{ race.number }}
      </h1>
      <p class="text-base-content/60 mb-6">{{ date }}</p>

      <!-- Existing Bets -->
      <div v-if="existingBets.length" class="space-y-3 mb-6">
        <h2 class="text-lg font-semibold">Existing Bets</h2>
        <div
          v-for="bet in existingBets"
          :key="bet.id"
          class="card bg-slate-800/50 border border-slate-700 p-4"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ bet.type }}</span>
                <span
                  class="badge badge-sm"
                  :class="bet.result === 'won' ? 'badge-success' : bet.result === 'lost' ? 'badge-error' : 'badge-ghost'"
                >
                  {{ bet.result }}
                </span>
              </div>
              <div class="text-sm text-base-content/60 mt-1">
                ${{ bet.amount }} @ {{ bet.oddsTaken }}
              </div>
              <div v-if="bet.selections?.length" class="text-sm text-base-content/50">
                {{ bet.selections.map(s => s.horseName).filter(Boolean).join(', ') }}
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-ghost" @click="editBet(bet)">
                <Icon name="lucide:edit" class="w-4 h-4" />
              </button>
              <button class="btn btn-sm btn-ghost text-error" @click="deleteBet(bet.id)">
                <Icon name="lucide:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add New Bet Button -->
      <button v-if="!isEditing" class="btn btn-primary w-full" @click="startNewBet">
        <Icon name="lucide:plus" class="mr-2" />
        Add New Bet
      </button>

      <!-- Bet Form -->
      <div v-else class="card bg-slate-800/50 border border-slate-700 p-4">
        <h2 class="text-lg font-semibold mb-4">
          {{ betForm.id && existingBets.find((b: any) => b.id === betForm.id) ? 'Edit Bet' : 'New Bet' }}
        </h2>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Bet Type</span>
            </label>
            <select v-model="betForm.type" class="select select-bordered">
              <option v-for="type in betTypes" :key="type">{{ type }}</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Amount ($)</span>
            </label>
            <input
              v-model.number="betForm.amount"
              type="number"
              min="0"
              step="0.5"
              class="input input-bordered"
              placeholder="2.00"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Odds Taken</span>
            </label>
            <input
              v-model="betForm.oddsTaken"
              class="input input-bordered"
              placeholder="e.g. 5/2"
            />
          </div>

          <div class="form-control">
            <label class="label flex justify-between">
              <span class="label-text">Selections</span>
              <button class="btn btn-xs btn-ghost" @click="addSelection">+ Add horse</button>
            </label>
            <div class="space-y-2">
              <div
                v-for="(_, index) in betForm.selections"
                :key="index"
                class="flex gap-2"
              >
                <input
                  v-model="betForm.selections[index].horseName"
                  class="input input-bordered flex-1"
                  placeholder="Horse name"
                />
                <button
                  v-if="betForm.selections.length > 1"
                  class="btn btn-ghost btn-square"
                  @click="removeSelection(index)"
                >
                  <Icon name="lucide:x" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Result</span>
            </label>
            <select v-model="betForm.result" class="select select-bordered">
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <p v-if="saveError" class="text-error text-sm">{{ saveError }}</p>

          <div class="flex gap-2">
            <button
              class="btn btn-primary flex-1"
              :class="{ loading: isSaving }"
              :disabled="isSaving"
              @click="saveBet"
            >
              Save Bet
            </button>
            <button class="btn btn-ghost" @click="isEditing = false">Cancel</button>
          </div>
        </div>
      </div>

      <button class="btn btn-outline w-full mt-4" @click="router.push(`/race/${date}/${number}`)">
        <Icon name="lucide:arrow-left" class="mr-2" />
        Back to Race
      </button>
    </div>
  </div>
</template>