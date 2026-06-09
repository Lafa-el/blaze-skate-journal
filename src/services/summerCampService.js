import { sessionService } from './sessionService'
import { coachNoteService } from './coachNoteService'
import { performanceService } from './performanceService'
import { milestoneService } from './milestoneService'

/**
 * Check if a date string falls within the camp date range.
 */
function isDateInCamp(dateStr, campStart, campEnd) {
  if (!campStart || !campEnd) return false
  const d = new Date(dateStr + 'T00:00:00')
  const start = new Date(campStart + 'T00:00:00')
  const end = new Date(campEnd + 'T00:00:00')
  d.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return d >= start && d <= end
}

/**
 * Calculate the number of days between two dates inclusive.
 */
function daysBetween(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')
  const ms = end - start
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Aggregate Summer Camp 2026 stats for a given camp period.
 * @param {string} campStart - Camp start date YYYY-MM-DD
 * @param {string} campEnd - Camp end date YYYY-MM-DD
 */
export async function aggregateCampStats(campStart, campEnd, athleteId) {
  // Parallel fetch all data sources
  const [allSessions, allNotes, allPerformances, allMilestones] = await Promise.all([
    sessionService.list(athleteId, 'date'),
    coachNoteService.list({}, athleteId),
    performanceService.list({}, athleteId),
    milestoneService.list({}, athleteId),
  ])

  // Filter by camp date range
  const campSessions = allSessions.filter((s) => isDateInCamp(s.data.date, campStart, campEnd))
  const campNotes = allNotes.filter((n) => isDateInCamp(n.data.date, campStart, campEnd))
  const campPerformances = allPerformances.filter((r) => isDateInCamp(r.data.date, campStart, campEnd))
  const campMilestones = allMilestones.filter((m) => isDateInCamp(m.data.date, campStart, campEnd))

  // 已记录天数 — days that have any record (session or journal)
  const daysWithRecords = new Set(campSessions.map((s) => s.data.date))
  const daysTrained = new Set(campSessions.filter((s) => ['ice', 'dryland', 'private_lesson'].includes(s.data.sessionType)).map((s) => s.data.date))

  // Session counts
  const iceSessions = campSessions.filter((s) => s.data.sessionType === 'ice').length
  const drylandSessions = campSessions.filter((s) => s.data.sessionType === 'dryland').length
  const privateLessons = campSessions.filter((s) => s.data.sessionType === 'private_lesson').length

  // Total training minutes
  const totalTrainingMinutes = campSessions.reduce(
    (sum, s) => sum + (s.data.durationMinutes || 0),
    0,
  )

  // PB changes — compare camp performances vs pre-camp best
  const preCampRecords = allPerformances.filter((r) => !isDateInCamp(r.data.date, campStart, campEnd))
  const preCampBest = {}
  preCampRecords.forEach((r) => {
    const event = r.data.event || r.data.metric
    const time = r.data.timeSeconds ?? r.data.value
    if (!event || !time) return
    if (!preCampBest[event] || time < preCampBest[event]) {
      preCampBest[event] = time
    }
  })

  const campBestByEvent = {}
  campPerformances.forEach((r) => {
    const event = r.data.event || r.data.metric
    const time = r.data.timeSeconds ?? r.data.value
    if (!event || !time) return
    if (!campBestByEvent[event] || time < campBestByEvent[event]) {
      campBestByEvent[event] = time
    }
  })

  const pbChanges = []
  Object.entries(campBestByEvent).forEach(([event, campBest]) => {
    const preBest = preCampBest[event]
    if (!preBest) {
      // New event type — this is a new PB
      pbChanges.push({ event, before: '--', after: campBest, changed: true })
    } else if (campBest < preBest) {
      // Improved
      pbChanges.push({ event, before: preBest, after: campBest, changed: true })
    } else {
      // No change
      pbChanges.push({ event, before: preBest, after: campBest, changed: false })
    }
  })

  // High-frequency technical issues from coach notes
  const tagCounts = {}
  campNotes.forEach((n) => {
    const tags = n.data.technicalTags || []
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  const highFreqTechIssues = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }))

  return {
    // Date range
    campStart,
    campEnd,
    totalCampDays: daysBetween(campStart, campEnd),
    // Days
    daysWithRecords: daysWithRecords.size,
    daysTrained: daysTrained.size,
    // Session counts
    iceSessions,
    drylandSessions,
    privateLessons,
    totalTrainingMinutes,
    // PB changes
    pbChanges: pbChanges.sort((a, b) => (b.changed ? 1 : 0) - (a.changed ? 1 : 0)),
    // High-freq technical issues
    highFreqTechIssues,
    // Milestones
    campMilestones,
  }
}
