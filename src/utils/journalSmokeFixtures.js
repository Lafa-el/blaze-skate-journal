import { isDateInWeek, isValidDateString } from './dateUtils.js'

export function buildJournalEntryPayload(data = {}) {
  const date = isValidDateString(data.date) ? data.date : new Date().toISOString().slice(0, 10)

  return {
    ...data,
    date,
  }
}

export function buildTrainingSessionPayload(data = {}) {
  const date = isValidDateString(data.date) ? data.date : new Date().toISOString().slice(0, 10)

  return {
    ...data,
    date,
  }
}

function sortTagCounts(tagCounts) {
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }))
}

function getRecordTime(record) {
  return record.timeSeconds ?? record.value
}

export function aggregateWeeklyReviewSample({
  weekStart,
  sessions = [],
  coachNotes = [],
  performanceRecords = [],
}) {
  const weekSessions = sessions.filter((session) => isDateInWeek(session.date, weekStart))
  const weekNotes = coachNotes.filter((note) => isDateInWeek(note.date, weekStart))
  const weekRecords = performanceRecords.filter((record) => isDateInWeek(record.date, weekStart))

  const tagCounts = {}
  weekNotes.forEach((note) => {
    ;(note.technicalTags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const topCoachNotes = [...weekNotes]
    .sort((a, b) => {
      const aPriority = priorityOrder[a.priority] ?? 3
      const bPriority = priorityOrder[b.priority] ?? 3
      if (aPriority !== bPriority) return aPriority - bPriority
      return (b.date || '').localeCompare(a.date || '')
    })
    .slice(0, 5)
    .map((note) => ({
      coachName: note.coachName || 'Unknown',
      note: note.note || '',
      priority: note.priority || 'medium',
      date: note.date || '',
    }))

  const bestByEvent = {}
  weekRecords.forEach((record) => {
    const event = record.event || record.metric
    const time = getRecordTime(record)
    if (!event || time === undefined || time === null) return
    if (!bestByEvent[event] || time < bestByEvent[event]) {
      bestByEvent[event] = time
    }
  })

  return {
    iceSessions: weekSessions.filter((session) => session.sessionType === 'ice').length,
    drylandSessions: weekSessions.filter((session) => session.sessionType === 'dryland').length,
    privateLessons: weekSessions.filter((session) => session.sessionType === 'private_lesson').length,
    totalTrainingMinutes: weekSessions.reduce(
      (sum, session) => sum + (session.durationMinutes || 0),
      0,
    ),
    topTechnicalIssues: sortTagCounts(tagCounts).slice(0, 5),
    topCoachNotes,
    bestPerformances: Object.entries(bestByEvent)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([event, time]) => ({ event, time })),
  }
}
