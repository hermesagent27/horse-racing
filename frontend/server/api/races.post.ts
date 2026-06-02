// Upload and save races to GitHub
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { date, races } = body
    
    if (!date || !races) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing date or races data'
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
    const contentBase64 = Buffer.from(JSON.stringify({ races }, null, 2)).toString('base64')
    
    // Try to get existing file SHA (for update vs create)
    let sha: string | undefined
    try {
      const existing = await $fetch(
        `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )
      sha = existing.sha
    } catch {
      // File doesn't exist yet, that's fine
    }
    
    // Save to GitHub
    await $fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'HorseRacingTracker/1.0',
      },
      body: {
        message: `Add races for ${date}`,
        content: contentBase64,
        sha,
      },
    })
    
    return {
      success: true,
      races: races.length,
      date,
      source: 'github'
    }
    
  } catch (e: any) {
    console.error('[API] Upload error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: e.message || 'Failed to save races'
    })
  }
})
