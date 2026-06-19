import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getCountFromServer,
} from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { JOURNAL_SCHEMA_VERSION } from '../constants/skatingx'
import { createRecordMetadata, updateRecordMetadata } from '../utils/firestoreMetadata'
import { requireUid } from '../utils/validation'

export const sessionService = {
  /**
   * Get training sessions, optionally filtered by date range.
   * @param {string} [athleteId]
   * @param {string} [sortBy] - 'date' or 'createdAt' (default 'date')
   * @param {number} [limitCount]
   * @returns { Promise<Array<{ docId: string, data: object }>> }
   */
  async list(athleteId, sortBy = 'date', limitCount = null) {
    requireUid(athleteId, 'sessionService.list')
    let q = query(
      collection(db, COLLECTIONS.TRAINING_SESSIONS),
      where('athleteId', '==', athleteId),
      orderBy(sortBy, 'desc'),
    )
    if (limitCount) q = query(q, limit(limitCount))

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ docId: d.id, data: d.data() }))
  },

  /**
   * Get a single session by Firestore doc ID.
   */
  async getById(docId, athleteId) {
    requireUid(athleteId, 'sessionService.getById')
    const q = query(
      collection(db, COLLECTIONS.TRAINING_SESSIONS),
      where('athleteId', '==', athleteId),
      where('__name__', '==', docId),
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const d = snapshot.docs[0]
    return { docId: d.id, data: d.data() }
  },

  /**
   * Create a new training session.
   * @param {object} data - Session fields (exclude athleteId, sourceApp, timestamps)
   */
  async create(data, athleteId) {
    requireUid(athleteId, 'sessionService.create')
    const ref = await addDoc(collection(db, COLLECTIONS.TRAINING_SESSIONS), {
      ...data,
      ...createRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Update an existing training session.
   */
  async update(docId, data, athleteId) {
    requireUid(athleteId, 'sessionService.update')
    const session = await this.getById(docId, athleteId)
    if (!session) return null

    await updateDoc(doc(db, COLLECTIONS.TRAINING_SESSIONS, docId), {
      ...data,
      ...updateRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId, created: false }
  },

  /**
   * Delete a training session.
   */
  async delete(docId, athleteId) {
    requireUid(athleteId, 'sessionService.delete')
    const session = await this.getById(docId, athleteId)
    if (session) {
      await deleteDoc(doc(db, COLLECTIONS.TRAINING_SESSIONS, docId))
    }
  },

  /**
   * Count sessions for the athlete.
   */
  async count(athleteId) {
    requireUid(athleteId, 'sessionService.count')
    const q = query(
      collection(db, COLLECTIONS.TRAINING_SESSIONS),
      where('athleteId', '==', athleteId),
    )
    const snapshot = await getCountFromServer(q)
    return snapshot.data().count
  },
}
