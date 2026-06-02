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
    } catch (err) {
      throw createError({
        statusCode: 404,
        statusMessage: `No race data found for ${date}`
      })
    }
    
    // Find specific race
    const race: any = races.find((r: any) => r.number === number)
    
    if (!race) {
      throw createError({
        statusCode: 404,
        statusMessage: `Race ${number} not found for ${date}`
      })
    }
    
    // Load bets for this race from session data
    let bets: any[] = []
    try {
      const sessionPath = join(process.cwd(), '..', '..', 'data', 'sessions', `${date}.json`)
      const session = JSON.parse(readFileSync(sessionPath, 'utf-8'))
      const sessionData = session.sessions?.[0] || session
      bets = sessionData.bets?.filter((b: any) => 
        b.raceId === race.id || b.raceId?.includes(`R${number}`)
      ) || []
    } catch {
      // No session data - that's okay
    }
    
    // Calculate stats
    const totalBets = bets.length
    const totalWagered = bets.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
    const totalReturned = bets
      .filter((b: any) => b.result === 'won')
      .reduce((sum: number, b: any) => sum + (b.actualPayout || 0), 0)
    const profit = totalReturned - totalWagered
    
    return {
      ...race,
      date,
      stats: {
        totalBets,
        totalWagered,
        totalReturned,
        profit,
        bets
      }
    }
    
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) throw error
    
    console.error('[API] Error fetching race:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch race'
    })
  }
})