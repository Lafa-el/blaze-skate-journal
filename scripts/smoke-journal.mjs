import assert from 'node:assert/strict'

import { getWeekStart, isValidDateString } from '../src/utils/dateUtils.js'
import {
  aggregateWeeklyReviewSample,
  buildJournalEntryPayload,
  buildTrainingSessionPayload,
} from '../src/utils/journalSmokeFixtures.js'

const checks = []

function check(name, fn) {
  fn()
  checks.push(name)
  console.log(`PASS ${name}`)
}

check('validates YYYY-MM-DD date strings', () => {
  assert.equal(isValidDateString('2026-06-25'), true)
  assert.equal(isValidDateString('2026-6-25'), false)
  assert.equal(isValidDateString('2026-02-30'), false)
})

check('calculates Monday week starts', () => {
  assert.equal(getWeekStart('2026-06-22'), '2026-06-22')
  assert.equal(getWeekStart('2026-06-25'), '2026-06-22')
  assert.equal(getWeekStart('2026-06-28'), '2026-06-22')
})

check('builds a journal entry payload with required basics', () => {
  const payload = buildJournalEntryPayload({
    date: '2026-06-25',
    dayType: 'training',
    overallFeeling: 4,
    lindsayReflection: 'Strong edges today',
    parentNote: 'Good focus',
    isCompleted: false,
  })

  assert.equal(payload.date, '2026-06-25')
  assert.equal(payload.dayType, 'training')
  assert.equal(payload.overallFeeling, 4)
  assert.equal(payload.lindsayReflection, 'Strong edges today')
  assert.equal(payload.parentNote, 'Good focus')
  assert.equal(payload.isCompleted, false)
})

check('builds a training session payload with required basics', () => {
  const payload = buildTrainingSessionPayload({
    date: '2026-06-25',
    sessionType: 'ice',
    durationMinutes: 90,
    intensity: 4,
    focusTags: ['starts'],
    coachName: 'Coach',
  })

  assert.equal(payload.date, '2026-06-25')
  assert.equal(payload.sessionType, 'ice')
  assert.equal(payload.durationMinutes, 90)
  assert.equal(payload.intensity, 4)
  assert.deepEqual(payload.focusTags, ['starts'])
  assert.equal(payload.coachName, 'Coach')
})

check('aggregates a minimal weekly review sample', () => {
  const result = aggregateWeeklyReviewSample({
    weekStart: '2026-06-22',
    sessions: [
      { date: '2026-06-22', sessionType: 'ice', durationMinutes: 60 },
      { date: '2026-06-24', sessionType: 'dryland', durationMinutes: 45 },
      { date: '2026-06-29', sessionType: 'ice', durationMinutes: 90 },
    ],
    coachNotes: [
      { date: '2026-06-25', coachName: 'Coach A', note: 'Improve starts', priority: 'high', technicalTags: ['starts', 'edges'] },
      { date: '2026-06-26', coachName: 'Coach B', note: 'More edge pressure', priority: 'medium', technicalTags: ['edges'] },
    ],
    performanceRecords: [
      { date: '2026-06-25', event: '500m', timeSeconds: 51.2 },
      { date: '2026-06-26', event: '500m', timeSeconds: 50.9 },
      { date: '2026-06-29', event: '500m', timeSeconds: 50.1 },
    ],
  })

  assert.equal(result.iceSessions, 1)
  assert.equal(result.drylandSessions, 1)
  assert.equal(result.totalTrainingMinutes, 105)
  assert.deepEqual(result.topTechnicalIssues[0], { tag: 'edges', count: 2 })
  assert.equal(result.topCoachNotes[0].priority, 'high')
  assert.deepEqual(result.bestPerformances, [{ event: '500m', time: 50.9 }])
})

console.log(`Journal smoke checks passed: ${checks.length}`)
