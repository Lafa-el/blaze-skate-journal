const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function toLocalDate(dateStr) {
  if (!DATE_STRING_PATTERN.test(dateStr)) return null

  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  date.setHours(0, 0, 0, 0)
  return date
}

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidDateString(dateStr) {
  return typeof dateStr === 'string' && toLocalDate(dateStr) !== null
}

export function getWeekStart(dateStr) {
  const date = toLocalDate(dateStr)
  if (!date) return ''

  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diffToMonday)
  return formatLocalDate(date)
}

export function isDateInWeek(dateStr, weekStartStr) {
  const date = toLocalDate(dateStr)
  const weekStart = toLocalDate(weekStartStr)
  if (!date || !weekStart) return false

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(0, 0, 0, 0)

  return date >= weekStart && date <= weekEnd
}
