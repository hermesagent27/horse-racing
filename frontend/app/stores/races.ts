import { defineStore } from 'pinia'

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
  const currentDate = ref(new Date().toISOString().split('T')[0])
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
    currentDate.value = date
    fetchRaces(date)
  }

  const nextDate = () => {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().split('T')[0])
  }

  const prevDate = () => {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }

  const today = () => {
    setDate(new Date().toISOString().split('T')[0])
  }

  return {
    races,
    currentDate,
    loading,
    error,
    fetchRaces,
    setDate,
    nextDate,
    prevDate,
    today
  }
})
