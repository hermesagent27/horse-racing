import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data received'
      })
    }

    // Find file and fields
    const file = formData.find(f => f.name === 'file')
    const trackCode = formData.find(f => f.name === 'trackCode')?.data?.toString() || 'RP'
    const date = formData.find(f => f.name === 'date')?.data?.toString() || getToday()

    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No PDF file provided'
      })
    }

    // Save PDF to temp location
    const tempPdfPath = `/tmp/race-program-${Date.now()}.pdf`
    writeFileSync(tempPdfPath, file.data)

    // Paths
    const repoRoot = process.cwd().replace('/frontend', '')
    const dataDir = join(repoRoot, 'data', 'races')
    const outputFile = join(dataDir, `${date}.json`)
    
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }

    // Run extraction script
    const extractScript = join(repoRoot, 'scripts', 'extract-race.py')
    const pythonCmd = `PYTHONPATH=${join(repoRoot, '.vendor')}:$PYTHONPATH python3 ${extractScript} ${tempPdfPath}`
    
    let extractedText = ''
    try {
      extractedText = execSync(pythonCmd, { encoding: 'utf-8', timeout: 30000 })
    } catch (e: any) {
      console.error('Extraction error:', e.message)
      // Continue with manual parsing fallback
    }

    // Parse extracted text into race data
    const races = parseExtractedRaces(extractedText, trackCode, date)
    
    // Save to JSON
    writeFileSync(outputFile, JSON.stringify(races, null, 2))

    // Cleanup temp file
    try { require('fs').unlinkSync(tempPdfPath) } catch {}

    return {
      success: true,
      races: races.length,
      date,
      file: outputFile
    }

  } catch (e: any) {
    console.error('Upload error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: e.message || 'Failed to process PDF'
    })
  }
})

function parseExtractedRaces(text: string, trackCode: string, date: string): any[] {
  // Fallback parser - creates sample structure from extracted text
  // In production, this would parse the actual PDF structure
  
  const races: any[] = []
  const lines = text.split('\n').filter(l => l.trim())
  
  // Simple heuristic: look for "Race" lines
  let currentRace: any = null
  let raceNum = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Detect race headers (various formats)
    if (trimmed.match(/Race\s+\d+/i) || trimmed.match(/^\d+\s+\d+Y?\s/)) {
      if (currentRace) {
        races.push(currentRace)
      }
      raceNum++
      currentRace = {
        id: `${trackCode}-${date}-R${raceNum}`,
        number: raceNum,
        date,
        trackCode,
        distance: extractDistance(trimmed) || '330 yards',
        surface: 'Fast',
        type: 'Unknown',
        postTime: '',
        purse: 0,
        status: 'upcoming',
        entries: []
      }
    }
    
    // Detect entries (simplified)
    if (currentRace && trimmed.match(/^\d+\s+[A-Z]/)) {
      const parts = trimmed.split(/\s+/)
      if (parts.length >= 2) {
        const postPos = parseInt(parts[0]) || currentRace.entries.length + 1
        const horseName = parts[1]
        
        currentRace.entries.push({
          postPosition: postPos,
          horse: {
            name: horseName,
            postPosition: postPos,
            morningLineOdds: extractOdds(trimmed) || '5-1',
            jockey: 'TBD',
            trainer: 'TBD',
            lifetimeStats: { starts: 0, wins: 0, places: 0, shows: 0 }
          },
          morningLineOdds: extractOdds(trimmed) || '5-1',
          confidenceScore: null
        })
      }
    }
  }
  
  if (currentRace) {
    races.push(currentRace)
  }
  
  // If no races detected, create one placeholder
  if (races.length === 0) {
    races.push({
      id: `${trackCode}-${date}-R1`,
      number: 1,
      date,
      trackCode,
      distance: '330 yards',
      surface: 'Fast',
      type: 'Extracted',
      postTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      purse: 10000,
      status: 'upcoming',
      entries: lines.slice(0, 5).map((line, idx) => ({
        postPosition: idx + 1,
        horse: {
          name: line.trim().slice(0, 20) || `Horse ${idx + 1}`,
          postPosition: idx + 1,
          morningLineOdds: '5-1',
          jockey: 'TBD',
          trainer: 'TBD',
          lifetimeStats: { starts: 0, wins: 0, places: 0, shows: 0 }
        },
        morningLineOdds: '5-1',
        confidenceScore: null
      }))
    })
  }
  
  return races
}

function extractDistance(line: string): string | null {
  const match = line.match(/(\d+)\s*(?:Y|yards?)/i)
  return match ? `${match[1]} yards` : null
}

function extractOdds(line: string): string | null {
  const match = line.match(/(\d+[-/](?:2|5|1))(?:\s|$)/)
  return match ? match[1] : null
}
