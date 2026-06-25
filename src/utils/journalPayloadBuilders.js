import { JOURNAL_SCHEMA_VERSION, SOURCE_APP } from '../constants/skatingx.js'
import { getWeekStart, isValidDateString } from './dateUtils.js'

const METADATA_FIELDS = new Set([
  'athleteId',
  'sourceApp',
  'schemaVersion',
  'createdAt',
  'updatedAt',
])

function currentDateString() {
  return new Date().toISOString().slice(0, 10)
}

function contextNow(context = {}) {
  return context.nowIso || new Date().toISOString()
}

function contextDate(context = {}) {
  const nowIso = contextNow(context)
  const dateStr = nowIso.slice(0, 10)
  return isValidDateString(dateStr) ? dateStr : currentDateString()
}

function assertPayloadContext(context = {}) {
  if (!context.athleteId) {
    throw new Error('journalPayloadBuilders requires context.athleteId')
  }
}

function cleanInput(input = {}) {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => !METADATA_FIELDS.has(key)),
  )
}

function metadata(context = {}) {
  assertPayloadContext(context)
  const nowIso = contextNow(context)
  const base = {
    athleteId: context.athleteId,
    sourceApp: context.sourceApp || SOURCE_APP,
    schemaVersion: context.schemaVersion || JOURNAL_SCHEMA_VERSION,
    updatedAt: nowIso,
  }

  if (context.mode === 'update') return base

  return {
    ...base,
    createdAt: nowIso,
  }
}

function validDateOrFallback(dateStr, context = {}) {
  return isValidDateString(dateStr) ? dateStr : contextDate(context)
}

function normalizeNumber(value, fallback = 0) {
  if (value === '' || value === undefined || value === null) return fallback
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function normalizeNonNegativeNumber(value, fallback = 0) {
  return Math.max(0, normalizeNumber(value, fallback))
}

function normalizeIntegerInRange(value, fallback, min, max) {
  const numberValue = Math.round(normalizeNumber(value, fallback))
  return Math.min(max, Math.max(min, numberValue))
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true
    if (['false', '0', 'no', 'n'].includes(normalized)) return false
  }
  return fallback
}

function normalizeReflection(value) {
  const reflection = value && typeof value === 'object' ? value : {}

  return {
    bestThing: normalizeText(reflection.bestThing),
    needsWork: normalizeText(reflection.needsWork),
    tomorrowFocus: normalizeText(reflection.tomorrowFocus),
  }
}

export function buildJournalDayPayload(input = {}, context = {}) {
  const data = cleanInput(input)

  return {
    ...data,
    date: validDateOrFallback(data.date, context),
    overallFeeling: normalizeIntegerInRange(data.overallFeeling, 3, 1, 5),
    energy: normalizeIntegerInRange(data.energy, 3, 1, 5),
    soreness: normalizeText(data.soreness),
    trainingFocus: normalizeText(data.trainingFocus),
    coachFeedback: normalizeText(data.coachFeedback),
    lindsayReflection: normalizeReflection(data.lindsayReflection),
    ...metadata(context),
  }
}

export function buildTrainingSessionPayload(input = {}, context = {}) {
  const data = cleanInput(input)

  return {
    ...data,
    date: validDateOrFallback(data.date, context),
    sessionLabel: normalizeText(data.sessionLabel),
    location: normalizeText(data.location),
    durationMinutes: normalizeNonNegativeNumber(data.durationMinutes, 0),
    intensity: normalizeIntegerInRange(data.intensity, 3, 1, 5),
    focusTags: normalizeArray(data.focusTags),
    coachName: normalizeText(data.coachName),
    notes: normalizeText(data.notes),
    iceTimeMinutes: normalizeNonNegativeNumber(data.iceTimeMinutes, 0),
    drylandMinutes: normalizeNonNegativeNumber(data.drylandMinutes, 0),
    technicalFocus: normalizeText(data.technicalFocus),
    mainSet: normalizeText(data.mainSet),
    startsPractice: normalizeBoolean(data.startsPractice),
    cornerFocus: normalizeBoolean(data.cornerFocus),
    straightawayFocus: normalizeBoolean(data.straightawayFocus),
    relayPractice: normalizeBoolean(data.relayPractice),
    raceSimulation: normalizeBoolean(data.raceSimulation),
    lapTimesNote: normalizeText(data.lapTimesNote),
    equipmentNote: normalizeText(data.equipmentNote),
    recoveryNote: normalizeText(data.recoveryNote),
    ...metadata(context),
  }
}

export function buildCoachNotePayload(input = {}, context = {}) {
  const data = cleanInput(input)

  return {
    ...data,
    date: validDateOrFallback(data.date, context),
    technicalTags: normalizeArray(data.technicalTags),
    ...metadata(context),
  }
}

export function buildBodyStatusPayload(input = {}, context = {}) {
  const data = cleanInput(input)

  return {
    ...data,
    date: validDateOrFallback(data.date, context),
    sleepHours: normalizeNonNegativeNumber(data.sleepHours, 0),
    fatigueLevel: normalizeIntegerInRange(data.fatigueLevel, 3, 1, 6),
    sorenessAreas: normalizeArray(data.sorenessAreas),
    bodyWeightLb: normalizeNonNegativeNumber(data.bodyWeightLb, 0),
    heightCm: normalizeNonNegativeNumber(data.heightCm, 0),
    mood: normalizeIntegerInRange(data.mood, 3, 1, 6),
    ...metadata(context),
  }
}

export function buildPerformanceRecordPayload(input = {}, context = {}) {
  const data = cleanInput(input)

  return {
    ...data,
    date: validDateOrFallback(data.date, context),
    timeSeconds: normalizeNonNegativeNumber(data.timeSeconds, 0),
    value: normalizeNonNegativeNumber(data.value, 0),
    ...metadata(context),
  }
}

export function buildVideoRefPayload(input = {}, context = {}) {
  const data = cleanInput(input)

  return {
    ...data,
    technicalTags: normalizeArray(data.technicalTags),
    ...metadata(context),
  }
}

export function buildWeeklyReviewPayload(input = {}, context = {}) {
  const data = cleanInput(input)
  const weekDate = validDateOrFallback(data.weekStart, context)

  return {
    ...data,
    weekStart: getWeekStart(weekDate),
    iceSessions: normalizeNonNegativeNumber(data.iceSessions, 0),
    drylandSessions: normalizeNonNegativeNumber(data.drylandSessions, 0),
    privateLessons: normalizeNonNegativeNumber(data.privateLessons, 0),
    totalTrainingMinutes: normalizeNonNegativeNumber(data.totalTrainingMinutes, 0),
    ...metadata(context),
  }
}
