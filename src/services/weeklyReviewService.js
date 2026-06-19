import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db, DEFAULT_ATHLETE_ID, SOURCE_APP, COLLECTIONS } from '../firebase/firestore'
import { sessionService } from './sessionService'
import { coachNoteService } from './coachNoteService'
import { performanceService } from './performanceService'

const makeBaseFilters = (athleteId = DEFAULT_ATHLETE_ID) => ({
  athleteId,
  sourceApp: SOURCE_APP,
})

/**
 * Helper to derive a stable document ID for a weekly review.
 * Since there should be one review per week, we derive the ID from the week start date.
 */
async function getWeeklyReviewDocId(weekStartStr, athleteId = DEFAULT_ATHLETE_ID) {
  const q = query(
    collection(db, COLLECTIONS.WEEKLY_REVIEWS),
    where('athleteId', '==', athleteId),
    where('weekStart', '==', weekStartStr),
  )
  const snapshot = await getDocs(q)
  if (!snapshot.empty) {
    return snapshot.docs[0].id
  }
  return null
}

/**
 * Check if a date string falls within the given week (Monday to Sunday).
 */
function isDateInWeek(dateStr, weekStartStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const ws = new Date(weekStartStr + 'T00:00:00')
  const we = new Date(ws)
  we.setDate(we.getDate() + 6)
  d.setHours(0, 0, 0, 0)
  ws.setHours(0, 0, 0, 0)
  we.setHours(0, 0, 0, 0)
  return d >= ws && d <= we
}

/**
 * Aggregate session stats for a given week.
 */
async function aggregateSessions(weekStartStr, athleteId) {
  const allSessions = await sessionService.list(athleteId, 'date')
  const weekSessions = allSessions.filter((s) => isDateInWeek(s.data.date || s.data.createdAt?.slice(0, 10), weekStartStr))

  const iceSessions = weekSessions.filter((s) => s.data.sessionType === 'ice').length
  const drylandSessions = weekSessions.filter((s) => s.data.sessionType === 'dryland').length
  const privateLessons = weekSessions.filter((s) => s.data.sessionType === 'private_lesson').length
  const totalTrainingMinutes = weekSessions.reduce(
    (sum, s) => sum + (s.data.durationMinutes || 0),
    0,
  )

  return { iceSessions, drylandSessions, privateLessons, totalTrainingMinutes, weekSessions }
}

/**
 * Find top technical issues from coach notes in a week.
 */
async function aggregateTopTechnicalIssues(weekStartStr, athleteId) {
  const allNotes = await coachNoteService.list({}, athleteId)
  const weekNotes = allNotes.filter((n) => isDateInWeek(n.data.date || n.data.createdAt?.slice(0, 10), weekStartStr))

  const tagCounts = {}
  weekNotes.forEach((n) => {
    const tags = n.data.technicalTags || []
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))

  return topTags
}

/**
 * Find top coach notes (high priority first, then recent).
 */
async function aggregateTopCoachNotes(weekStartStr, athleteId) {
  const allNotes = await coachNoteService.list({ limit: 50 }, athleteId)
  const weekNotes = allNotes.filter((n) => isDateInWeek(n.data.date || n.data.createdAt?.slice(0, 10), weekStartStr))

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  weekNotes.sort((a, b) => {
    const aPriority = priorityOrder[a.data.priority] ?? 3
    const bPriority = priorityOrder[b.data.priority] ?? 3
    if (aPriority !== bPriority) return aPriority - bPriority
    return (b.data.date || '').localeCompare(a.data.date || '')
  })

  return weekNotes.slice(0, 5).map((n) => ({
    docId: n.docId,
    coachName: n.data.coachName || 'Unknown',
    note: n.data.note || '',
    priority: n.data.priority || 'medium',
    date: n.data.date || '',
  }))
}

/**
 * Find best performance (lowest time) for each event type in the week.
 */
async function aggregateBestPerformance(weekStartStr, athleteId) {
  const allRecords = await performanceService.list({}, athleteId)
  const weekRecords = allRecords.filter((r) => isDateInWeek(r.data.date || r.data.createdAt?.slice(0, 10), weekStartStr))

  const bestByEvent = {}
  weekRecords.forEach((r) => {
    const event = r.data.event || r.data.metric
    const time = r.data.timeSeconds ?? r.data.value
    if (!event || !time) return
    if (!bestByEvent[event] || time < bestByEvent[event]) {
      bestByEvent[event] = time
    }
  })

  const bestPerformances = Object.entries(bestByEvent)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([event, time]) => ({ event, time }))

  return bestPerformances
}

export const weeklyReviewService = {
  /**
   * Get weekly reviews.
   * @param {object} [filters] - { limit }
   */
  async list(filters = {}, athleteId = DEFAULT_ATHLETE_ID) {
    let q = query(
      collection(db, COLLECTIONS.WEEKLY_REVIEWS),
      where('athleteId', '==', athleteId),
      orderBy('weekStart', 'desc'),
    )
    if (filters.limit) {
      q = query(q, limit(filters.limit))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ docId: d.id, data: d.data() }))
  },

  /**
   * Get a weekly review by week start date (YYYY-MM-DD).
   */
  async getByWeek(weekStartStr, athleteId = DEFAULT_ATHLETE_ID) {
    const q = query(
      collection(db, COLLECTIONS.WEEKLY_REVIEWS),
      where('athleteId', '==', athleteId),
      where('weekStart', '==', weekStartStr),
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const d = snapshot.docs[0]
    return { docId: d.id, data: d.data() }
  },

  /**
   * Auto-generate stats for a given week.
   * Fetches all session, coach note, and performance data and aggregates by week.
   * @param {string} weekStartStr - Week start date (YYYY-MM-DD)
   */
  async autoGenerateStats(weekStartStr, athleteId = DEFAULT_ATHLETE_ID) {
    const [sessions, topTechnicalIssues, topCoachNotes, bestPerformances] = await Promise.all([
      aggregateSessions(weekStartStr, athleteId),
      aggregateTopTechnicalIssues(weekStartStr, athleteId),
      aggregateTopCoachNotes(weekStartStr, athleteId),
      aggregateBestPerformance(weekStartStr, athleteId),
    ])

    return {
      ...sessions,
      topTechnicalIssues,
      topCoachNotes,
      bestPerformances,
    }
  },

  /**
   * Create or update a weekly review.
   * @param {object} data - Review fields (weekStart, scores, highlights, achievements, bestMoment, nextWeekFocus, parentSummary, etc.)
   */
  async save(data, athleteId = DEFAULT_ATHLETE_ID) {
    const existingDocId = await getWeeklyReviewDocId(data.weekStart, athleteId)

    const base = {
      ...makeBaseFilters(athleteId),
      weekStart: data.weekStart,
      updatedAt: new Date().toISOString(),
    }

    if (existingDocId) {
      await updateDoc(doc(db, COLLECTIONS.WEEKLY_REVIEWS, existingDocId), {
        ...data,
        ...base,
      })
      return { docId: existingDocId, created: false }
    }

    const ref = await addDoc(collection(db, COLLECTIONS.WEEKLY_REVIEWS), {
      ...base,
      createdAt: new Date().toISOString(),
      ...data,
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Delete a weekly review.
   */
  async delete(docId) {
    const snap = await getDoc(doc(db, COLLECTIONS.WEEKLY_REVIEWS, docId))
    if (snap.exists()) {
      await deleteDoc(doc(db, COLLECTIONS.WEEKLY_REVIEWS, docId))
    }
  },
}
