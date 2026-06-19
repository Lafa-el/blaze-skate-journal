import { SOURCE_APP } from '../constants/skatingx'
import { requireUid } from './validation'

export function createRecordMetadata(uid, schemaVersion) {
  requireUid(uid, 'createRecordMetadata')
  const now = new Date().toISOString()

  return {
    athleteId: uid,
    sourceApp: SOURCE_APP,
    schemaVersion,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateRecordMetadata(uid, schemaVersion) {
  requireUid(uid, 'updateRecordMetadata')

  return {
    athleteId: uid,
    sourceApp: SOURCE_APP,
    schemaVersion,
    updatedAt: new Date().toISOString(),
  }
}
