// Server-side PDF processing - extracts race data
import { readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data received'
      })
    }

    const file = formData.find(f => f.name === 'file')
    
    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No PDF file provided'
      })
    }

    // Parse the PDF text by reading as string and extracting patterns
    const pdfText = file.data.toString('utf-8').substring(0, 50000) // First 50KB
    
    // Extract race information
    const races = extractRacesFromText(pdfText)
    
    // Extract date from PDF text
    const dateMatch = pdfText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i)
    const extractedDate = formatDateFromMatch(dateMatch)
    
    // Try to identify track from text
    const trackMatch = pdfText.match(/(Remington Park|Lone Star|Ruidoso Downs|Fair Grounds|Delta Downs)/i)
    const trackCode = trackMatch ? getTrackCode(trackMatch[1]) : 'RP'

    return {
      success: true,
      races,
      date: extractedDate,
      trackCode,
      total: races.length
    }

  } catch (e: any) {
    console.error('Upload processing error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: e.message || 'Failed to process PDF'
    })
  }
})

function extractRacesFromText(text: string): any[] {
  const races: any[] = []
  const lines = text.split('\n').filter(l => l.trim())
  
  let currentRace: any = null
  let raceNum = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Look for race headers - various patterns
    // Pattern 1: "Race 1" or "RACE 1"
    const raceMatch = trimmed.match(/Race\s+(\d+)/i)
    // Pattern 2: Distance markers like "300 Yards" or "350Y"
    const distanceMatch = trimmed.match(/(\d+)\s*[Yy]ards?|\d+Y/i)
    
    if (raceMatch) {
      // Save previous race
      if (currentRace) {
        races.push(currentRace)
      }
      
      raceNum = parseInt(raceMatch[1])
      currentRace = createRaceTemplate(raceNum, lines)
      
      // Try to extract distance from same line or next few lines
      const dist = extractDistance(trimmed) || extractDistanceFromContext(lines, lines.indexOf(line))
      if (dist) currentRace.distance = dist
    }
    
    // Extract entries (horse names with post positions)
    if (currentRace && trimmed.match(/^\d+\s+[A-Z]/)) {
      const entry = parseEntryLine(trimmed, currentRace.entries.length + 1)
      if (entry) {
        currentRace.entries.push(entry)
      }
    }
    
    // Extract race type (Maiden, Claiming, Allowance, Stakes)
    const typeMatch = trimmed.match(/\b(Maiden|Claiming|Allowance|Stakes)\b/i)
    if (currentRace && typeMatch) {
      currentRace.type = typeMatch[1]
    }
  }
  
  // Don't forget the last race
  if (currentRace) {
    races.push(currentRace)
  }
  
  return races
}

function createRaceTemplate(number: number, allLines: string[]): any {
  return {
    id: `R${number}`,
    number,
    distance: '330 yards', // Default, will be overridden if found
    surface: 'Fast',
    type: 'Unknown',
    postTime: '',
    purse: 10000,
    status: 'upcoming',
    entries: []
  }
}

function extractDistance(line: string): string | null {
  const match = line.match(/(\d+)\s*(?:Y|yards?)/i)
  return match ? `${match[1]} yards` : null
}

function extractDistanceFromContext(lines: string[], startIdx: number): string | null {
  // Check next 3 lines for distance
  for (let i = startIdx; i < Math.min(startIdx + 3, lines.length); i++) {
    const dist = extractDistance(lines[i])
    if (dist) return dist
  }
  return null
}

function parseEntryLine(line: string, postPosition: number): any | null {
  const parts = line.split(/\s+/).filter(p => p)
  if (parts.length < 2) return null
  
  // First part should be post position number
  const postMatch = parts[0].match(/^(\d+)$/)
  if (!postMatch) return null
  
  const post = parseInt(postMatch[1])
  
  // Look for horse name (usually uppercase words)
  const nameParts: string[] = []
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    // Stop at odds or other markers
    if (part.match(/^\d+[/-]/)) break
    if (part.match(/^[A-Z][a-zA-Z]+$/)) {
      nameParts.push(part)
    }
    if (nameParts.length >= 3) break // Max 3 words for name
  }
  
  if (nameParts.length === 0) return null
  
  // Look for odds in the line
  const oddsMatch = line.match(/(\d+[/-]\d+|\d+-1)/)
  const odds = oddsMatch ? oddsMatch[1] : '5-1'
  
  return {
    postPosition: post,
    horse: {
      name: nameParts.join(' '),
      postPosition: post,
      morningLineOdds: odds,
      jockey: 'TBD',
      trainer: 'TBD',
      lifetimeStats: { starts: 0, wins: 0, places: 0, shows: 0 }
    },
    morningLineOdds: odds,
    confidenceScore: null
  }
}

function formatDateFromMatch(match: RegExpMatchArray | null): string {
  if (!match) return new Date().toISOString().split('T')[0]
  
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  }
  
  const month = months[match[1].toLowerCase()]
  const day = parseInt(match[2])
  const year = parseInt(match[3])
  
  if (!month) return new Date().toISOString().split('T')[0]
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getTrackCode(trackName: string): string {
  const tracks: Record<string, string> = {
    'remington park': 'RP',
    'lone star': 'LS',
    'lone star park': 'LS',
    'ruidoso downs': 'RD',
    'fair grounds': 'FG',
    'delta downs': 'DD'
  }
  
  return tracks[trackName.toLowerCase()] || 'RP'
}
