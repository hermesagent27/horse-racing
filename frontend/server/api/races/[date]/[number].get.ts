// Get specific race by date and number
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')
  const number = parseInt(getRouterParam(event, 'number') || '0')
  
  if (!date || !number) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing date or race number'
    })
  }
  
  try {
    // Try to load race data
    let races: any[] = []
    const raceFilePath = join(process.cwd(), '..', '..', 'data', 'races', `${date}.json`)
    
    try {
      const content = readFileSync(raceFilePath, 'utf-8')
      const parsed = JSON.parse(content)
      races = parsed.races || parsed
    } catch {
      // Try sample data if no file
      const samplePath = join(process.cwd(), '..', '..', 'data', 'races', '2025-06-01.json')
      const content = readFileSync(samplePath, 'utf-8')
      const parsed = JSON.parse(content)
      races = parsed.races || parsed
      // Filter for the requested date/number
      races = races.filter((r: any) => r.date === date && r.number === number)
    }
    
    // Find specific race
    const race: any = races.find((r: any) => r.number === number) || races[number - 1]
    
    if (!race) {
      throw createError({
        statusCode: 404,
        statusMessage: `Race ${number} not found for ${date}`
      })
    }
    
    // Load bets for this race
    let bets: any[] = []
    try {
      const sessionPath = join(process.cwd(), '..', '..', 'data', 'sessions', `${date}.json`)
      const session = JSON.parse(readFileSync(sessionPath, 'utf-8'))
      bets = session.bets?.filter((b: any) => 
        b.raceId === race.id || b.raceId?.includes(`R${number}`)
      ) || []
    } catch {
      // No session data
    }
    
    // Calculate stats
    const totalBets = bets.length
    const totalWagered = bets.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
    const totalReturned = bets
      .filter((b: any) => b.result === 'won')
      .reduce((sum: number, b: any) => sum + (b.actualPayout || 0), 0)
    
    return {
      ...race,
      stats: {
        totalBets,
        totalWagered,
        totalReturned,
        profit: totalReturned - totalWagered,
        bets
      }
    }
    
  } catch (error: any) {
    console.error('[API] Error fetching race:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch race'
    })
  }
})
