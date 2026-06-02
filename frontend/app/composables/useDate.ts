// Unified date utilities for consistent date handling
// Works for both server (Node) and client (browser)

/**
 * Get local date string YYYY-MM-DD from an ISO date string
 * Handles isomorphic dates by splitting on 'T' to get local date portion
 */
export function formatDateISO(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  // Use toISOString and split on T to avoid timezone issues
  return dateObj.toISOString().split('T')[0]
}

/**
 * Get today's date as YYYY-MM-DD in local timezone
 */
export function getToday(): string {
  return formatDateISO(new Date())
}

/**
 * Parse an ISO date string and return a Date object
 */
export function parseDateISO(dateString: string): Date {
  // Parse as local date by appending time
  return new Date(dateString + 'T00:00:00')
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
  
  const date = parseDateISO(dateString)
  return !isNaN(date.getTime())
}
