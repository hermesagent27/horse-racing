// Update bets for a specific race - save to GitHub
export default defineEventHandler(async (event) => {
  if (event.method !== 'PUT') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { date, number: raceNumber, bets } = body

    if (!date || !raceNumber || !Array.isArray(bets)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: date, raceNumber, or bets array'
      })
    }

    const config = useRuntimeConfig()
    const { githubToken, githubRepo } = config

    if (!githubToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'GitHub token not configured'
      })
    }

    const filePath = `data/races/${date}.json`
    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'HorseRacingTracker/1.0',
    }

    // Fetch existing file
    let existingSha: string | undefined
    let existingContent: any
    try {
      const existing = await $fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, { headers })
      existingSha = existing.sha
      const decoded = Buffer.from(existing.content, 'base64').toString()
      existingContent = JSON.parse(decoded)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: `Race data for ${date} not found`
      })
    }

    // Find and update the specific race
    const races = existingContent.races || []
    const raceIndex = races.findIndex((r: any) => r.number === raceNumber)

    if (raceIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: `Race ${raceNumber} not found for ${date}`
      })
    }

    // Initialize stats object if needed
    if (!races[raceIndex].stats) {
      races[raceIndex].stats = {}
    }

    // Update bets and recalculate totals
    const updatedBets = bets.map((bet: any) => ({
      ...bet,
      amount: parseFloat(bet.amount) || 0,
      result: bet.result || 'pending'
    }))

    // Calculate totals
    const totalBets = updatedBets.length
    const totalWagered = updatedBets.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
    const totalReturned = updatedBets
      .filter((b: any) => b.result === 'won' && b.actualPayout)
      .reduce((sum: number, b: any) => sum + (b.actualPayout || 0), 0)

    races[raceIndex].stats = {
      ...races[raceIndex].stats,
      bets: updatedBets,
      totalBets,
      totalWagered,
      totalReturned,
      profit: totalReturned - totalWagered
    }

    // Save back to GitHub
    const updatedContent = Buffer.from(JSON.stringify({ races }, null, 2)).toString('base64')

    await $fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: {
        message: `Update bets for race ${raceNumber} on ${date}`,
        content: updatedContent,
        sha: existingSha,
      },
    })

    return {
      success: true,
      message: `Bets updated for race ${raceNumber}`,
      stats: races[raceIndex].stats,
    }

  } catch (e: any) {
    console.error('[API] Bets update error:', e)
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || e.message || 'Failed to update bets'
    })
  }
})
