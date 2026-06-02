// API endpoint to fetch races from GitHub
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = query.date as string || new Date().toISOString().split('T')[0]
  
  const config = useRuntimeConfig()
  const { githubToken, githubRepo } = config
  
  try {
    if (!githubToken) {
      // Fallback to empty if no token
      return { date, races: [], total: 0, source: 'none' }
    }
    
    // Fetch from GitHub
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
    
    // Decode base64 content
    const content = JSON.parse(
      Buffer.from(response.content, 'base64').toString('utf-8')
    )
    
    return {
      date,
      races: content.races || [],
      total: content.races?.length || 0,
      source: 'github'
    }
  } catch (error: any) {
    // 404 = file doesn't exist yet, that's OK
    if (error.statusCode === 404) {
      return { date, races: [], total: 0, source: 'github' }
    }
    
    console.error('[API] Error fetching races:', error.message)
    return { date, races: [], total: 0, error: 'Failed to load races' }
  }
})
