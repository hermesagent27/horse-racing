import { readFileSync } from 'fs'
import { join } from 'path'

// API endpoint to fetch races - tries GitHub first, falls back to local
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = query.date as string || getToday()
  
  const config = useRuntimeConfig()
  const { githubToken, githubRepo } = config
  
  let races: any[] = []
  let bets: any[] = []
  
  try {
    // Try GitHub first if token exists
    if (githubToken && githubRepo) {
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
        races = content.races || content // Handle both formats
      } catch (githubError: any) {
        if (githubError.statusCode !== 404) {
          console.log('[API] GitHub fetch failed, trying local:', githubError.message)
        }
      }
    }
    
    // Fallback to local file
    if (races.length === 0) {
      try {
        const localPath = join(process.cwd(), '..', '..', 'data', 'races', `${date}.json`)
        const content = readFileSync(localPath, 'utf-8')
        const parsed = JSON.parse(content)
        races = parsed.races || parsed
      } catch (localError) {
        // No local file either
      }
    }
    
    // Also load betting/session data for this date
    try {
      const sessionPath = join(process.cwd(), '..', '..', 'data', 'sessions', `${date}.json`)
      const sessionContent = readFileSync(sessionPath, 'utf-8')
      const session = JSON.parse(sessionContent)
      bets = session.bets || []
    } catch (sessionError) {
      // No session data
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
