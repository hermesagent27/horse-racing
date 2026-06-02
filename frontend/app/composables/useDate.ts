// Unified date utilities for consistent date handling
// Uses LOCAL timezone methods to avoid UTC offset issues

/**
 * Format a Date to YYYY-MM-DD in LOCAL timezone
 * Does NOT use toISOString() which returns UTC
 */
export function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateISO(date) : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's date as YYYY-MM-DD in LOCAL timezone
 */
export function getToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM-DD string to Date (local timezone)
 */
export function parseDateISO(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Add/subtract days from a date string
 */
export function addDays(dateString: string, days: number): string {
  const date = parseDateISO(dateString)
  date.setDate(date.getDate() + days)
  return formatDateISO(date)
}

/**
 * Format date for display (e.g., "Monday, June 2, 2025")
 */
export function formatDisplayDate(dateString: string): string {
  const date = parseDateISO(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format date as short string (e.g., "Jun 2")
 */
export function formatShortDate(dateString: string): string {
  const date = parseDateISO(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Validate date string format
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day
}

/**
 * Get all dates that have race data in history
 * Returns array of date strings from available data files
 */
export function getAvailableDates(): string[] {
  // These are the dates we have data for
  // In production, this would scan the data directory
  return ['2025-05-29', '2025-06-01']
}

/**
 * Get the most recent race date (today or prior)
 */
export function getMostRecentRaceDate(): string {
  const dates = getAvailableDates().sort()
  const today = getToday()
  
  // Find the most recent date that isn't in the future
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i] <= today) {
      return dates[i]
    }
  }
  
  return dates[dates.length - 1] || getToday()
}
