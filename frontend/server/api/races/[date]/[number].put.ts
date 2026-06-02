// Update race entries, scratches, and results - save to GitHub
export default defineEventHandler(async (event) => {
  if (event.method !== 'PUT') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { date, number: raceNumber, entries, results, raceDetail } = body

    if (!date || !raceNumber || !entries?.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: date, raceNumber, or entries'
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

    // Merge updates into the race
    races[raceIndex] = {
      ...races[raceIndex],
      ...raceDetail,
      entries: entries.map((e: any) => ({
        ...e,
        scratched: e.scratched || false,
        result: e.result || undefined // '1st', '2nd', '3rd' or undefined
      })),
      results: results || races[raceIndex].results
    }
    
    // Mark as final if results exist
    if (results && (results.winner || results.places?.length > 0)) {
      races[raceIndex].status = 'final'
    }

    // Save back to GitHub
    const updatedContent = Buffer.from(JSON.stringify({ races }, null, 2)).toString('base64')

    await $fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: {
        message: `Update race ${raceNumber} for ${date} - entries and results`,
        content: updatedContent,
        sha: existingSha,
      },
    })

    return {
      success: true,
      message: `Race ${raceNumber} updated successfully`,
      race: races[raceIndex]
    }

  } catch (e: any) {
    console.error('[API] Race update error:', e)
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || e.message || 'Failed to update race'
    })
  }
})
