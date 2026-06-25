import { isDateInWeek, isValidDateString } from './dateUtils.js'

function recordData(record) {
  return record?.data || record || {}
}

function toLocalDate(dateStr) {
  if (!isValidDateString(dateStr)) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addCount(map, key) {
  if (!key) return
  map[key] = (map[key] || 0) + 1
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function sessionTypeBucket(sessionType) {
  if (sessionType === 'competition') return 'race'
  if (sessionType === 'recovery') return 'recovery'
  if (sessionType === 'dryland') return 'dryland'
  if (sessionType === 'ice' || sessionType === 'private_lesson') return 'ice'
  return null
}

function collectSessionFocus(session) {
  const focus = []
  if (session.technicalFocus) focus.push(session.technicalFocus)
  if (session.trainingFocus) focus.push(session.trainingFocus)
  if (Array.isArray(session.focusTags)) focus.push(...session.focusTags)
  if (session.notes) focus.push(session.notes)
  return focus
}

export function getDateRangeDays(startDate, endDate) {
  const start = toLocalDate(startDate)
  const end = toLocalDate(endDate)
  if (!start || !end || start > end) return []

  const days = []
  const cursor = new Date(start)
  while (cursor <= end) {
    days.push(formatDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function summarizeSessionsByDate(sessions = []) {
  return sessions.reduce((acc, record) => {
    const data = recordData(record)
    const date = data.date || data.createdAt?.slice(0, 10)
    if (!isValidDateString(date)) return acc
    if (!acc[date]) acc[date] = []
    acc[date].push({ ...record, data })
    return acc
  }, {})
}

export function summarizeDailyLogsByDate(days = []) {
  return days.reduce((acc, record) => {
    const data = recordData(record)
    const date = data.date || data.createdAt?.slice(0, 10)
    if (!isValidDateString(date)) return acc
    acc[date] = { ...record, data }
    return acc
  }, {})
}

export function buildCalendarDaySummary({ date, days = [], sessions = [] }) {
  const dailyByDate = summarizeDailyLogsByDate(days)
  const sessionsByDate = summarizeSessionsByDate(sessions)
  const daily = dailyByDate[date]?.data || null
  const daySessions = sessionsByDate[date] || []
  const sessionData = daySessions.map((session) => session.data)

  return {
    date,
    hasDaily: Boolean(daily),
    dailyCompleted: Boolean(daily?.isCompleted),
    daily,
    sessions: daySessions,
    sessionCount: daySessions.length,
    sessionTypes: unique(sessionData.map((session) => session.sessionType)),
    totalTrainingMinutes: sessionData.reduce(
      (sum, session) => sum + (session.durationMinutes || 0),
      0,
    ),
    focusSummary: unique([
      daily?.trainingFocus,
      ...sessionData.flatMap(collectSessionFocus),
    ]).slice(0, 5),
  }
}

export function buildWeeklySummary({ startDate, endDate, days = [], sessions = [] }) {
  const range = getDateRangeDays(startDate, endDate)
  const dailyByDate = summarizeDailyLogsByDate(days)
  const sessionsByDate = summarizeSessionsByDate(sessions)
  const rangeSet = new Set(range)
  const weekSessions = sessions
    .map(recordData)
    .filter((session) => rangeSet.has(session.date || session.createdAt?.slice(0, 10)))
  const weekDaily = days
    .map(recordData)
    .filter((day) => rangeSet.has(day.date || day.createdAt?.slice(0, 10)))

  const sessionTypeCounts = {
    ice: 0,
    dryland: 0,
    race: 0,
    recovery: 0,
  }
  weekSessions.forEach((session) => {
    const bucket = sessionTypeBucket(session.sessionType)
    if (bucket) sessionTypeCounts[bucket] += 1
  })

  const trainingDates = new Set(weekSessions.map((session) => session.date).filter(Boolean))
  const energyValues = weekDaily
    .map((day) => day.energy)
    .filter((energy) => typeof energy === 'number' && Number.isFinite(energy))
  const focusCounts = {}

  weekDaily.forEach((day) => addCount(focusCounts, day.trainingFocus))
  weekSessions.forEach((session) => {
    collectSessionFocus(session).forEach((focus) => addCount(focusCounts, focus))
  })

  return {
    startDate,
    endDate,
    range,
    trainingDays: trainingDates.size,
    sessionCount: weekSessions.length,
    totalTrainingMinutes: weekSessions.reduce(
      (sum, session) => sum + (session.durationMinutes || 0),
      0,
    ),
    sessionTypeCounts,
    averageEnergy: energyValues.length
      ? Math.round((energyValues.reduce((sum, value) => sum + value, 0) / energyValues.length) * 10) / 10
      : null,
    sorenessNotes: unique(weekDaily.map((day) => day.soreness)),
    topTechnicalFocus: Object.entries(focusCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([focus, count]) => ({ focus, count })),
    missingDailyLogs: range.filter((date) => !dailyByDate[date]),
    dailyByDate,
    sessionsByDate,
  }
}

export function buildCurrentWeekSummary({ weekStart, days = [], sessions = [] }) {
  const start = toLocalDate(weekStart)
  if (!start) {
    return buildWeeklySummary({ startDate: '', endDate: '', days: [], sessions: [] })
  }
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return buildWeeklySummary({
    startDate: weekStart,
    endDate: formatDate(end),
    days: days.filter((day) => isDateInWeek(recordData(day).date, weekStart)),
    sessions: sessions.filter((session) => isDateInWeek(recordData(session).date, weekStart)),
  })
}
