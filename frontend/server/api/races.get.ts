import { readFileSync } from 'fs'
import { join } from 'path'

// API endpoint to fetch races from GitHub ONLY
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = query.date as string || getToday()
  
  const config = useRuntimeConfig()
  const { githubToken, githubRepo } = config
  
  if (!githubToken || !githubRepo) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GitHub token/repo not configured'
    })
  }
  
  let races: any[] = []
  let bets: any[] = []
  
  try {
    // Load races from GitHub
    try {
      const response = await $fetch(
        `https://api.github.com/repos/${githubRepo}/contents/data/races/${date}.json`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'HorseRacingTracker/1.0',
          },
        }
      )
      
      const content = JSON.parse(
        Buffer.from(response.content, 'base64').toString('utf-8')
      )
      races = content.races || content
    } catch (githubError: any) {
      console.log('[API] Races not found on GitHub:', githubError.statusCode || githubError.message)
    }
    
    // Load sessions/bets from GitHub
    try {
      const sessionResponse = await $fetch(
        `https://api.github.com/repos/${githubRepo}/contents/data/sessions/${date}.json`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'HorseRacingTracker/1.0',
          },
        }
      )
      
      const sessionData = JSON.parse(
        Buffer.from(sessionResponse.content, 'base64').toString('utf-8')
      )
      
      if (sessionData.sessions && Array.isArray(sessionData.sessions)) {
        bets = sessionData.sessions[0]?.bets || []
      } else {
        bets = sessionData.bets || []
      }
    } catch (sessionError: any) {
      console.log('[API] Sessions not found on GitHub:', sessionError.statusCode || sessionError.message)
    }
    
    // Merge bet data into races
    const racesWithStats = races.map((race: any) => {
      const raceBets = bets.filter((b: any) => b.raceId === race.id || b.raceId?.includes(`R${race.number}`))
      
      const totalBets = raceBets.length
      const totalWagered = raceBets.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
      const totalReturned = raceBets
        .filter((b: any) => b.result === 'won')
        .reduce((sum: number, b: any) => sum + (b.actualPayout || 0), 0)
      
      return {
        ...race,
        stats: {
          totalBets,
          totalWagered,
          totalReturned,
          profit: totalReturned - totalWagered,
          bets: raceBets
        }
      }
    })
    
    return {
      date,
      races: racesWithStats,
      total: racesWithStats.length,
      hasBets: bets.length > 0,
      bets: bets.length
    }
    
  } catch (error: any) {
    console.error('[API] Error fetching races:', error.message)
    return { date, races: [], total: 0, error: 'Failed to load races' }
  }
})

// Helper for today
function getToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
