// Unified date utilities for consistent date handling
// All dates use user's local timezone to avoid UTC offset issues

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function parseDateISO(dateString: string): Date {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getToday(): string {
  return formatDateISO(new Date())
}

export function addDays(dateString: string, days: number): string {
  const date = parseDateISO(dateString)
  date.setDate(date.getDate() + days)
  return formatDateISO(date)
}

export function formatDisplayDate(dateString: string): string {
  const date = parseDateISO(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatShortDate(dateString: string): string {
  const date = parseDateISO(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = parseDateISO(dateString)
  return formatDateISO(date) === dateString
}
