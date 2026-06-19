import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db, SOURCE_APP, COLLECTIONS } from '../firebase/firestore'
import { aggregateCampStats } from './summerCampService'

/**
 * Check if a date string falls within a date range.
 */
function isDateInRange(dateStr, startStr, endStr) {
  if (!startStr || !endStr) return true
  const d = new Date(dateStr + 'T00:00:00')
  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')
  d.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return d >= start && d <= end
}

/**
 * Check if a date falls within a week (Monday to Sunday).
 */
function isDateInWeek(dateStr, weekStartStr) {
  if (!weekStartStr) return true
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
 * Fetch all documents from a collection for an athlete.
 */
async function fetchCollection(collectionName, athleteId) {
  const q = query(
    collection(db, collectionName),
    where('athleteId', '==', athleteId),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ _docId: d.id, _data: d.data() }))
}

/**
 * Build a flat record list from raw documents.
 */
function flattenRecords(docs) {
  return docs.map((d) => {
    const copy = { ...d._data, _docId: d._docId }
    // Remove internal keys
    delete copy.athleteId
    delete copy.sourceApp
    return copy
  })
}

/**
 * Filter records by date based on export scope.
 * @param {Array} records - Records with 'date' or 'weekStart' field
 * @param {string} scope - 'all' | 'dateRange' | 'summerCamp' | 'singleWeek'
 * @param {object} params - { dateStart, dateEnd, campStart, campEnd, weekStart }
 */
function filterByScope(records, scope, params) {
  if (scope === 'all') return records

  return records.filter((r) => {
    const dateStr = r.date || r.createdAt?.slice(0, 10)
    if (!dateStr) return false

    switch (scope) {
      case 'dateRange':
        return isDateInRange(dateStr, params.dateStart, params.dateEnd)
      case 'summerCamp':
        return isDateInRange(dateStr, params.campStart, params.campEnd)
      case 'singleWeek':
        return isDateInWeek(dateStr, params.weekStart)
      default:
        return true
    }
  })
}

/**
 * Convert data to JSON string.
 */
function toJson(data) {
  return JSON.stringify(data, null, 2)
}

/**
 * Convert array of objects to CSV string.
 */
function toCsv(rows) {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const csvRows = []

  // Header row
  csvRows.push(headers.map((h) => `"${h}"`).join(','))

  // Data rows
  rows.forEach((row) => {
    csvRows.push(
      headers
        .map((h) => {
          let val = row[h]
          if (val === null || val === undefined) return '""'
          if (typeof val === 'object') return `"${JSON.stringify(val)}"`
          // Escape quotes and wrap in quotes
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(','),
    )
  })

  return csvRows.join('\n')
}

/**
 * Download a file by creating a blob and triggering download.
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate export data based on scope.
 */
export async function generateExportData(
  scope,
  params,
  athleteId,
) {
  const timestamp = new Date().toISOString()
  const exportObj = {
    app: SOURCE_APP,
    exportedAt: timestamp,
    scope,
    athleteId,
    ...params,
    collections: {},
  }

  // Collection name to Firestore path and display name
  const collections = [
    { name: COLLECTIONS.TRAINING_SESSIONS, key: 'training_sessions', dateField: 'date' },
    { name: COLLECTIONS.COACH_NOTES, key: 'coach_notes', dateField: 'date' },
    { name: COLLECTIONS.PERFORMANCE_RECORDS, key: 'performance_records', dateField: 'date' },
    { name: COLLECTIONS.VIDEO_REFS, key: 'video_refs', dateField: 'createdAt' },
    { name: COLLECTIONS.WEEKLY_REVIEWS, key: 'weekly_reviews', dateField: 'weekStart' },
    { name: COLLECTIONS.BODY_STATUS, key: 'body_status', dateField: 'date' },
    { name: COLLECTIONS.JOURNAL_DAYS, key: 'journal_days', dateField: 'date' },
    { name: COLLECTIONS.MILESTONES, key: 'milestones', dateField: 'date' },
  ]

  // Fetch all collections in parallel
  const fetchPromises = collections.map(async ({ name, key }) => {
    try {
      const rawDocs = await fetchCollection(name, athleteId)
      const flatRecords = flattenRecords(rawDocs)

      // Filter by scope
      const filtered = filterByScope(flatRecords, scope, {
        dateStart: params.dateStart,
        dateEnd: params.dateEnd,
        campStart: params.campStart,
        campEnd: params.campEnd,
        weekStart: params.weekStart,
      })

      exportObj.collections[key] = filtered
      return { key, count: filtered.length }
    } catch {
      exportObj.collections[key] = []
      return { key, count: 0, error: true }
    }
  })

  // Also add Summer Camp stats if scope is summerCamp or all
  if (scope === 'summerCamp' && params.campStart && params.campEnd) {
    try {
      const campStats = await aggregateCampStats(params.campStart, params.campEnd, athleteId)
      exportObj.collections.summer_camp_stats = {
        campStart: campStats.campStart,
        campEnd: campStats.campEnd,
        totalCampDays: campStats.totalCampDays,
        daysWithRecords: campStats.daysWithRecords,
        daysTrained: campStats.daysTrained,
        iceSessions: campStats.iceSessions,
        drylandSessions: campStats.drylandSessions,
        privateLessons: campStats.privateLessons,
        totalTrainingMinutes: campStats.totalTrainingMinutes,
        pbChanges: campStats.pbChanges,
        highFreqTechIssues: campStats.highFreqTechIssues,
        milestones: campStats.campMilestones,
      }
    } catch {
      exportObj.collections.summer_camp_stats = { error: 'Failed to generate camp stats' }
    }
  }

  // Wait for all collections to be fetched
  await Promise.all(fetchPromises)

  return exportObj
}

/**
 * Export data in specified format and download it.
 */
export async function exportData(
  format,
  scope,
  params,
  athleteId,
) {
  const data = await generateExportData(scope, params, athleteId)

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const scopeLabel = {
    all: 'all-data',
    dateRange: `date-range-${params.dateStart}-${params.dateEnd}`,
    summerCamp: `summer-camp-${params.campStart}-${params.campEnd}`,
    singleWeek: `week-${params.weekStart}`,
  }[scope] || 'export'

  const filename = `${SOURCE_APP}_${scopeLabel}_${dateStr}`

  if (format === 'json') {
    const content = toJson(data)
    downloadFile(content, `${filename}.json`, 'application/json')
  } else if (format === 'csv') {
    // For CSV, flatten all collections into separate sheets concept (multiple CSV files not possible from single download, so we create one CSV with all data prefixed by collection name)
    const allRows = []
    Object.entries(data.collections).forEach(([collectionName, records]) => {
      // If records is an object (e.g. summer_camp_stats), flatten its entries as rows
      if (typeof records === 'object' && !Array.isArray(records)) {
        Object.entries(records).forEach(([key, value]) => {
          allRows.push({ _sourceCollection: collectionName, field: key, value })
        })
      } else if (Array.isArray(records)) {
        records.forEach((record) => {
          const row = { ...record, _sourceCollection: collectionName }
          allRows.push(row)
        })
      }
    })
    const csvContent = toCsv(allRows)
    downloadFile(csvContent, `${filename}.csv`, 'text/csv')
  }

  return data
}
