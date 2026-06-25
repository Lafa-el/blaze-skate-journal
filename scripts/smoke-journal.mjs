import assert from 'node:assert/strict'

import { getWeekStart, isValidDateString } from '../src/utils/dateUtils.js'
import {
  buildBodyStatusPayload,
  buildCoachNotePayload,
  buildJournalDayPayload,
  buildPerformanceRecordPayload,
  buildTrainingSessionPayload,
  buildVideoRefPayload,
  buildWeeklyReviewPayload,
} from '../src/utils/journalPayloadBuilders.js'
import {
  aggregateWeeklyReviewSample,
} from '../src/utils/journalSmokeFixtures.js'

const checks = []
const createContext = {
  athleteId: 'athlete-smoke',
  sourceApp: 'blaze-skate-journal',
  schemaVersion: 'skatingx-journal-v1',
  nowIso: '2026-06-25T12:00:00.000Z',
}
const updateContext = {
  ...createContext,
  mode: 'update',
  nowIso: '2026-06-26T12:00:00.000Z',
}

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

check('builds a journal day payload with metadata', () => {
  const payload = buildJournalDayPayload({
    date: '2026-06-25',
    dayType: 'training',
    overallFeeling: 4,
    lindsayReflection: { bestThing: 'Strong edges today' },
    parentNote: 'Good focus',
    isCompleted: false,
  }, createContext)

  assert.equal(payload.date, '2026-06-25')
  assert.equal(payload.dayType, 'training')
  assert.equal(payload.overallFeeling, 4)
  assert.deepEqual(payload.lindsayReflection, { bestThing: 'Strong edges today' })
  assert.equal(payload.parentNote, 'Good focus')
  assert.equal(payload.isCompleted, false)
  assert.equal(payload.athleteId, 'athlete-smoke')
  assert.equal(payload.sourceApp, 'blaze-skate-journal')
  assert.equal(payload.schemaVersion, 'skatingx-journal-v1')
  assert.equal(payload.createdAt, '2026-06-25T12:00:00.000Z')
  assert.equal(payload.updatedAt, '2026-06-25T12:00:00.000Z')
})

check('builds a training session payload with normalized basics', () => {
  const payload = buildTrainingSessionPayload({
    date: '2026-06-25',
    sessionType: 'ice',
    durationMinutes: '90',
    intensity: '4',
    focusTags: ['starts'],
    coachName: 'Coach',
  }, createContext)

  assert.equal(payload.date, '2026-06-25')
  assert.equal(payload.sessionType, 'ice')
  assert.equal(payload.durationMinutes, 90)
  assert.equal(payload.intensity, 4)
  assert.deepEqual(payload.focusTags, ['starts'])
  assert.equal(payload.coachName, 'Coach')
  assert.equal(payload.createdAt, '2026-06-25T12:00:00.000Z')
  assert.equal(payload.updatedAt, '2026-06-25T12:00:00.000Z')
})

check('builds coach note, body status, performance, video, and weekly payloads', () => {
  const coachNote = buildCoachNotePayload({
    date: '2026-06-25',
    coachName: 'Coach A',
    note: 'Improve starts',
    priority: 'high',
    technicalTags: ['starts'],
  }, createContext)
  assert.equal(coachNote.date, '2026-06-25')
  assert.equal(coachNote.priority, 'high')
  assert.deepEqual(coachNote.technicalTags, ['starts'])

  const bodyStatus = buildBodyStatusPayload({
    date: '2026-06-25',
    sleepHours: '8.5',
    fatigueLevel: '4',
    mood: '5',
    bodyWeightLb: '88',
    heightCm: '142',
  }, createContext)
  assert.equal(bodyStatus.sleepHours, 8.5)
  assert.equal(bodyStatus.fatigueLevel, 4)
  assert.equal(bodyStatus.mood, 5)
  assert.equal(bodyStatus.bodyWeightLb, 88)
  assert.equal(bodyStatus.heightCm, 142)

  const performanceRecord = buildPerformanceRecordPayload({
    date: '2026-06-25',
    event: '500m',
    timeSeconds: '50.9',
    metric: '500m',
    value: '50.9',
    isPB: true,
  }, createContext)
  assert.equal(performanceRecord.timeSeconds, 50.9)
  assert.equal(performanceRecord.value, 50.9)
  assert.equal(performanceRecord.isPB, true)

  const videoRef = buildVideoRefPayload({
    title: 'Start drill',
    fileName: 'start.mp4',
    externalUrl: 'https://example.com/start.mp4',
    sessionId: 'session-1',
    technicalTags: ['starts'],
    analysisStatus: 'pending',
  }, createContext)
  assert.equal(videoRef.analysisStatus, 'pending')
  assert.deepEqual(videoRef.technicalTags, ['starts'])

  const weeklyReview = buildWeeklyReviewPayload({
    weekStart: '2026-06-25',
    iceSessions: '2',
    drylandSessions: '1',
    privateLessons: '1',
    totalTrainingMinutes: '165',
    bestMoment: 'Strong final lap',
  }, createContext)
  assert.equal(weeklyReview.weekStart, '2026-06-22')
  assert.equal(weeklyReview.iceSessions, 2)
  assert.equal(weeklyReview.totalTrainingMinutes, 165)
})

check('falls back invalid date fields to context date', () => {
  const journal = buildJournalDayPayload({ date: '2026-02-30', dayType: 'training' }, createContext)
  const session = buildTrainingSessionPayload({ date: 'bad-date', sessionType: 'ice' }, createContext)

  assert.equal(journal.date, '2026-06-25')
  assert.equal(session.date, '2026-06-25')
})

check('builds update payloads without createdAt', () => {
  const payload = buildTrainingSessionPayload({
    date: '2026-06-25',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    sessionType: 'ice',
  }, updateContext)

  assert.equal(payload.athleteId, 'athlete-smoke')
  assert.equal(payload.updatedAt, '2026-06-26T12:00:00.000Z')
  assert.equal(Object.hasOwn(payload, 'createdAt'), false)
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
