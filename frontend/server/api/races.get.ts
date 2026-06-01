// API endpoint to fetch races for a date
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = query.date as string || new Date().toISOString().split('T')[0]
  
  try {
    // Read from local JSON file
    const filePath = `./data/races/${date}.json`
    const races = await import(filePath)
      .then(m => m.default)
      .catch(() => [])
    
    return {
      date,
      races,
      total: races.length
    }
  } catch (error) {
    // Return empty if file doesn't exist
    return {
      date,
      races: [],
      total: 0
    }
  }
})
