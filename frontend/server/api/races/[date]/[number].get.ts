// Get specific race by date and number - uses GitHub API ONLY
export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')
  const number = parseInt(getRouterParam(event, 'number') || '0')
  
  if (!date || !number) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing date or race number'
    })
  }
  
  // GitHub config
  const config = useRuntimeConfig()
  const token = config.githubToken
  const repo = config.githubRepo || 'hermesagent27/horse-racing'
  
  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GitHub token not configured'
    })
  }
  
  try {
    let races: any[] = []
    
    // Load races from GitHub API
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/data/races/${date}.json`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const content = Buffer.from(data.content, 'base64').toString('utf-8')
        const parsed = JSON.parse(content)
        races = parsed.races || parsed
      } else if (response.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: `No race data found for ${date}`
        })
      } else {
        throw new Error(`GitHub API error: ${response.status}`)
      }
    } catch (err: any) {
      console.error('[API] GitHub fetch error:', err.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch from GitHub'
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
    
    // Load session/bet data from GitHub API
    let bets: any[] = []
    try {
      const sessionResponse = await fetch(`https://api.github.com/repos/${repo}/contents/data/sessions/${date}.json`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      })
      
      if (sessionResponse.ok) {
        const data = await sessionResponse.json()
        const content = Buffer.from(data.content, 'base64').toString('utf-8')
        const session = JSON.parse(content)
        const sessionData = session.sessions?.[0] || session
        bets = sessionData.bets?.filter((b: any) => 
          b.raceId === race.id || b.raceId?.includes(`R${number}`)
        ) || []
      }
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
    if (error.statusCode) throw error
    
    console.error('[API] Error fetching race:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch race'
    })
  }
})
