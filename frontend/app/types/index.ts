export interface Track {
  code: string
  name: string
  location: string
  surface: 'dirt' | 'turf' | 'mixed'
  type: 'QH' | 'TB' | 'mixed'
}

export interface Horse {
  name: string
  breed: 'QH' | 'TB'
  age?: number
  sex?: 'C' | 'G' | 'F' | 'M' | 'H' | 'R'
  color?: string
  lifetimeStats?: {
    starts: number
    wins: number
    places: number
    shows: number
    earnings: number
  }
}

export interface Jockey {
  name: string
  stats?: {
    currentMeet: { mounts: number; wins: number }
    currentYear: { mounts: number; wins: number }
  }
}

export interface Trainer {
  name: string
  stats?: {
    currentMeet: { starts: number; wins: number }
    currentYear: { starts: number; wins: number }
  }
}

export interface PastPerformance {
  date: string
  track: string
  distance: string
  surface: string
  finish: number
  margin: string
  time: string
  speedFigure?: number
  odds: string
  comment: string
}

export interface Entry {
  postPosition: number
  horse: Horse
  jockey: Jockey
  trainer: Trainer
  owner: string
  morningLineOdds: string
  morningLineProb: number
  weight: number
  equipment: string[]
  pastPerformances: PastPerformance[]
}

export interface Race {
  id: string
  trackCode: string
  date: string
  number: number
  distance: string
  surface: string
  type: string
  purse: number
  postTime: string
  entries: Entry[]
  results?: RaceResult
}

export interface RaceResult {
  winner: string
  exacta?: string
  trifecta?: string
  superfecta?: string
  times?: { quarter?: string; half?: string; final: string }
}

export type BetType = 
  | 'WIN' 
  | 'PLACE' 
  | 'SHOW' 
  | 'WPS'
  | 'EXACTA'
  | 'EXACTA_BOX'
  | 'TRIFECTA'
  | 'TRIFECTA_BOX'
  | 'SUPERFECTA'

export interface Bet {
  id: string
  raceId: string
  placedAt: string
  selections: BetSelection[]
  amount: number
  type: BetType
  oddsTaken: string
  potentialPayout: number
  actualPayout?: number
  result: 'pending' | 'won' | 'lost' | 'cancelled'
  notes?: string
}

export interface BetSelection {
  postPosition: number
  horseName: string
  confidence: number
  notes: string
}

export interface HorseSelection {
  entry: Entry
  rank: number
  confidence: number
  reasoning: string[]
  betRecommendation?: BetType
  stake?: number
}

export interface RaceAnalysis {
  raceId: string
  analyzedAt: string
  selections: HorseSelection[]
  confidence: number
  notes: string
}

export interface DailySession {
  id: string
  date: string
  trackCode: string
  bankrollStart: number
  bankrollEnd?: number
  bets: Bet[]
  racesAnalyzed: RaceAnalysis[]
}

export interface PerformanceSummary {
  totalSessions: number
  totalBets: number
  totalWagered: number
  totalReturned: number
  overallRoi: number
  overallHitRate: number
  byType: BetTypeStats[]
  byTrack: Record<string, BetTypeStats>
}

export interface BetTypeStats {
  type: BetType
  count: number
  wins: number
  totalWagered: number
  totalReturned: number
  roi: number
  hitRate: number
}
