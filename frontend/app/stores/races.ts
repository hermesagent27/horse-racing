export interface Horse {
  name: string
  postPosition: number
  morningLineOdds: string
  jockey: string
  trainer: string
  lifetimeStats: {
    starts: number
    wins: number
    places: number
    shows: number
  }
}

export interface Entry {
  postPosition: number
  horse: Horse
  morningLineOdds: string
  confidenceScore?: number
}

export interface Race {
  id: string
  number: number
  date: string
  trackCode: string
  distance: string
  surface: string
  type: string
  postTime: string
  purse: number
  entries: Entry[]
  status: 'upcoming' | 'open' | 'closed' | 'final'
  results?: {
    winner: string
    exacta: string
    trifecta: string
  }
}

export const useRacesStore = defineStore('races', () => {
  const races = ref<Race[]>([])
  const currentDate = ref(getToday())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchRaces = async (date?: string) => {
    const targetDate = date || currentDate.value
    loading.value = true
    error.value = null
    
    try {
      const { data } = await useFetch(`/api/races?date=${targetDate}`)
      races.value = data.value?.races || []
      currentDate.value = targetDate
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch races'
    } finally {
      loading.value = false
    }
  }

  const setDate = (date: string) => {
    if (!isValidDate(date)) return
    currentDate.value = date
    fetchRaces(date)
  }

  const nextDate = () => {
    currentDate.value = addDays(currentDate.value, 1)
    fetchRaces(currentDate.value)
  }

  const prevDate = () => {
    currentDate.value = addDays(currentDate.value, -1)
    fetchRaces(currentDate.value)
  }

  const today = () => {
    currentDate.value = getToday()
    fetchRaces(currentDate.value)
  }

  const saveRaces = async (racesData: Race[]) => {
    try {
      await $fetch('/api/races', {
        method: 'POST',
        body: {
          date: currentDate.value,
          races: racesData
        }
      })
      races.value = racesData
      return { success: true }
    } catch (e: any) {
      error.value = e.message || 'Failed to save races'
      return { success: false, error: error.value }
    }
  }

  const formattedDate = computed(() => {
    return formatDisplayDate(currentDate.value)
  })

  return {
    races,
    currentDate,
    formattedDate,
    loading,
    error,
    fetchRaces,
    setDate,
    nextDate,
    prevDate,
    today,
    saveRaces
  }
})