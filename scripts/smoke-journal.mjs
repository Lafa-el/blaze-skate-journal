import assert from 'node:assert/strict'

import { getWeekStart, isValidDateRange, isValidDateString } from '../src/utils/dateUtils.js'
import {
  buildCalendarDaySummary,
  buildWeeklySummary,
  getDateRangeDays,
  summarizeDailyLogsByDate,
  summarizeSessionsByDate,
} from '../src/utils/journalAggregations.js'
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

check('validates YYYY-MM-DD date ranges', () => {
  assert.equal(isValidDateRange('2026-06-01', '2026-06-30'), true)
  assert.equal(isValidDateRange('2026-06-30', '2026-06-01'), false)
  assert.equal(isValidDateRange('2026-06-01', 'bad-date'), false)
})

check('calculates Monday week starts', () => {
  assert.equal(getWeekStart('2026-06-22'), '2026-06-22')
  assert.equal(getWeekStart('2026-06-25'), '2026-06-22')
  assert.equal(getWeekStart('2026-06-28'), '2026-06-22')
})

check('builds date range days inclusively', () => {
  assert.deepEqual(getDateRangeDays('2026-06-22', '2026-06-25'), [
    '2026-06-22',
    '2026-06-23',
    '2026-06-24',
    '2026-06-25',
  ])
  assert.deepEqual(getDateRangeDays('bad-date', '2026-06-25'), [])
})

check('builds a journal day payload with metadata', () => {
  const payload = buildJournalDayPayload({
    date: '2026-06-25',
    dayType: 'training',
    overallFeeling: 4,
    energy: '5',
    soreness: 'left ankle',
    trainingFocus: 'corner exits',
    coachFeedback: 'Lower stance',
    lindsayReflection: { bestThing: 'Strong edges today' },
    parentNote: 'Good focus',
    isCompleted: false,
  }, createContext)

  assert.equal(payload.date, '2026-06-25')
  assert.equal(payload.dayType, 'training')
  assert.equal(payload.overallFeeling, 4)
  assert.equal(payload.energy, 5)
  assert.equal(payload.soreness, 'left ankle')
  assert.equal(payload.trainingFocus, 'corner exits')
  assert.equal(payload.coachFeedback, 'Lower stance')
  assert.deepEqual(payload.lindsayReflection, {
    bestThing: 'Strong edges today',
    needsWork: '',
    tomorrowFocus: '',
  })
  assert.equal(payload.parentNote, 'Good focus')
  assert.equal(payload.isCompleted, false)
  assert.equal(payload.athleteId, 'athlete-smoke')
  assert.equal(payload.sourceApp, 'blaze-skate-journal')
  assert.equal(payload.schemaVersion, 'skatingx-journal-v1')
  assert.equal(payload.createdAt, '2026-06-25T12:00:00.000Z')
  assert.equal(payload.updatedAt, '2026-06-25T12:00:00.000Z')
})

check('builds Daily defaults compatible with old journal data', () => {
  const payload = buildJournalDayPayload({
    date: '2026-06-25',
    dayType: 'training',
    overallFeeling: 3,
    parentNote: '',
    isCompleted: false,
  }, createContext)

  assert.equal(payload.energy, 3)
  assert.equal(payload.soreness, '')
  assert.equal(payload.trainingFocus, '')
  assert.equal(payload.coachFeedback, '')
  assert.deepEqual(payload.lindsayReflection, {
    bestThing: '',
    needsWork: '',
    tomorrowFocus: '',
  })
})

check('builds a training session payload with normalized basics', () => {
  const payload = buildTrainingSessionPayload({
    date: '2026-06-25',
    sessionType: 'ice',
    sessionLabel: 'AM Ice',
    location: 'Main rink',
    durationMinutes: '90',
    intensity: '4',
    focusTags: ['starts'],
    coachName: 'Coach',
    iceTimeMinutes: '60',
    drylandMinutes: '30',
    technicalFocus: 'corner exits',
    mainSet: '6x500m',
    startsPractice: 'true',
    cornerFocus: 1,
    straightawayFocus: false,
    relayPractice: 'false',
    raceSimulation: true,
    lapTimesNote: '51.2, 50.9',
    equipmentNote: 'Check left blade',
    recoveryNote: 'Stretch calves',
  }, createContext)

  assert.equal(payload.date, '2026-06-25')
  assert.equal(payload.sessionType, 'ice')
  assert.equal(payload.sessionLabel, 'AM Ice')
  assert.equal(payload.location, 'Main rink')
  assert.equal(payload.durationMinutes, 90)
  assert.equal(payload.intensity, 4)
  assert.deepEqual(payload.focusTags, ['starts'])
  assert.equal(payload.coachName, 'Coach')
  assert.equal(payload.iceTimeMinutes, 60)
  assert.equal(payload.drylandMinutes, 30)
  assert.equal(payload.technicalFocus, 'corner exits')
  assert.equal(payload.mainSet, '6x500m')
  assert.equal(payload.startsPractice, true)
  assert.equal(payload.cornerFocus, true)
  assert.equal(payload.straightawayFocus, false)
  assert.equal(payload.relayPractice, false)
  assert.equal(payload.raceSimulation, true)
  assert.equal(payload.lapTimesNote, '51.2, 50.9')
  assert.equal(payload.equipmentNote, 'Check left blade')
  assert.equal(payload.recoveryNote, 'Stretch calves')
  assert.equal(payload.createdAt, '2026-06-25T12:00:00.000Z')
  assert.equal(payload.updatedAt, '2026-06-25T12:00:00.000Z')
})

check('builds training session defaults compatible with old data', () => {
  const payload = buildTrainingSessionPayload({
    date: '2026-06-25',
    sessionType: 'ice',
  }, createContext)

  assert.equal(payload.sessionLabel, '')
  assert.equal(payload.location, '')
  assert.equal(payload.durationMinutes, 0)
  assert.equal(payload.intensity, 3)
  assert.deepEqual(payload.focusTags, [])
  assert.equal(payload.coachName, '')
  assert.equal(payload.notes, '')
  assert.equal(payload.iceTimeMinutes, 0)
  assert.equal(payload.drylandMinutes, 0)
  assert.equal(payload.technicalFocus, '')
  assert.equal(payload.mainSet, '')
  assert.equal(payload.startsPractice, false)
  assert.equal(payload.cornerFocus, false)
  assert.equal(payload.straightawayFocus, false)
  assert.equal(payload.relayPractice, false)
  assert.equal(payload.raceSimulation, false)
  assert.equal(payload.lapTimesNote, '')
  assert.equal(payload.equipmentNote, '')
  assert.equal(payload.recoveryNote, '')
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

check('normalizes training duration, intensity, and boolean fields safely', () => {
  const payload = buildTrainingSessionPayload({
    date: '2026-06-25',
    sessionType: 'ice',
    durationMinutes: '-10',
    intensity: '9',
    iceTimeMinutes: 'bad',
    drylandMinutes: '-4',
    startsPractice: 'yes',
    relayPractice: '0',
    raceSimulation: 0,
  }, createContext)

  assert.equal(payload.durationMinutes, 0)
  assert.equal(payload.intensity, 5)
  assert.equal(payload.iceTimeMinutes, 0)
  assert.equal(payload.drylandMinutes, 0)
  assert.equal(payload.startsPractice, true)
  assert.equal(payload.relayPractice, false)
  assert.equal(payload.raceSimulation, false)
})

check('builds Daily update payloads without createdAt', () => {
  const daily = buildJournalDayPayload({
    date: '2026-06-25',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    dayType: 'training',
  }, updateContext)

  assert.equal(daily.athleteId, 'athlete-smoke')
  assert.equal(daily.updatedAt, '2026-06-26T12:00:00.000Z')
  assert.equal(Object.hasOwn(daily, 'createdAt'), false)
})

check('builds training update payloads without createdAt', () => {
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

check('summarizes sessions and daily logs by date', () => {
  const sessionMap = summarizeSessionsByDate([
    { date: '2026-06-25', sessionType: 'ice', durationMinutes: 60 },
    { data: { date: '2026-06-25', sessionType: 'dryland', durationMinutes: 45 } },
  ])
  const dailyMap = summarizeDailyLogsByDate([
    { date: '2026-06-25', isCompleted: true },
    { data: { date: '2026-06-26', isCompleted: false } },
  ])

  assert.equal(sessionMap['2026-06-25'].length, 2)
  assert.equal(dailyMap['2026-06-25'].data.isCompleted, true)
  assert.equal(dailyMap['2026-06-26'].data.isCompleted, false)
})

check('builds calendar day summaries with daily and sessions', () => {
  const summary = buildCalendarDaySummary({
    date: '2026-06-25',
    days: [
      { date: '2026-06-25', isCompleted: true, trainingFocus: 'corner exits', energy: 4 },
    ],
    sessions: [
      { date: '2026-06-25', sessionType: 'ice', durationMinutes: 60, technicalFocus: 'starts' },
      { date: '2026-06-25', sessionType: 'dryland', durationMinutes: 45, notes: 'core' },
    ],
  })

  assert.equal(summary.hasDaily, true)
  assert.equal(summary.dailyCompleted, true)
  assert.equal(summary.sessionCount, 2)
  assert.equal(summary.totalTrainingMinutes, 105)
  assert.deepEqual(summary.sessionTypes, ['ice', 'dryland'])
  assert.deepEqual(summary.focusSummary, ['corner exits', 'starts', 'core'])
})

check('builds empty day calendar summaries', () => {
  const summary = buildCalendarDaySummary({
    date: '2026-06-25',
    days: [],
    sessions: [],
  })

  assert.equal(summary.hasDaily, false)
  assert.equal(summary.sessionCount, 0)
  assert.equal(summary.totalTrainingMinutes, 0)
  assert.deepEqual(summary.sessionTypes, [])
  assert.deepEqual(summary.focusSummary, [])
})

check('builds weekly summaries with missing daily logs', () => {
  const summary = buildWeeklySummary({
    startDate: '2026-06-22',
    endDate: '2026-06-28',
    days: [
      { date: '2026-06-22', isCompleted: true, energy: 4, soreness: 'calves', trainingFocus: 'starts' },
      { date: '2026-06-24', isCompleted: false, energy: 2, soreness: 'hips', trainingFocus: 'corners' },
    ],
    sessions: [
      { date: '2026-06-22', sessionType: 'ice', durationMinutes: 60, technicalFocus: 'starts' },
      { date: '2026-06-23', sessionType: 'dryland', durationMinutes: 45, focusTags: ['core'] },
      { date: '2026-06-29', sessionType: 'ice', durationMinutes: 90 },
    ],
  })

  assert.equal(summary.trainingDays, 2)
  assert.equal(summary.sessionCount, 2)
  assert.equal(summary.totalTrainingMinutes, 105)
  assert.deepEqual(summary.sessionTypeCounts, {
    ice: 1,
    dryland: 1,
    race: 0,
    recovery: 0,
  })
  assert.equal(summary.averageEnergy, 3)
  assert.deepEqual(summary.sorenessNotes, ['calves', 'hips'])
  assert.deepEqual(summary.topTechnicalFocus[0], { focus: 'starts', count: 2 })
  assert.deepEqual(summary.missingDailyLogs, [
    '2026-06-23',
    '2026-06-25',
    '2026-06-26',
    '2026-06-27',
    '2026-06-28',
  ])
})

console.log(`Journal smoke checks passed: ${checks.length}`)
