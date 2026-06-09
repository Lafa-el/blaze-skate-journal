import { getFirestore } from 'firebase/firestore'
import app from './firebaseConfig'

export const db = getFirestore(app)

export const COLLECTIONS = {
  ATHLETES: 'athletes',
  JOURNAL_DAYS: 'journal_days',
  TRAINING_SESSIONS: 'training_sessions',
  COACH_NOTES: 'coach_notes',
  BODY_STATUS: 'body_status',
  PERFORMANCE_RECORDS: 'performance_records',
  VIDEO_REFS: 'video_refs',
  WEEKLY_REVIEWS: 'weekly_reviews',
  MILESTONES: 'milestones',
}

export const DEFAULT_ATHLETE_ID = 'lindsay_lin'
export const SOURCE_APP = 'blaze-skate-journal'
