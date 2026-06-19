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
  getDoc,
} from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { JOURNAL_SCHEMA_VERSION } from '../constants/skatingx'
import { createRecordMetadata, updateRecordMetadata } from '../utils/firestoreMetadata'
import { requireUid } from '../utils/validation'

export const bodyStatusService = {
  /**
   * Get body status readings, optionally limited.
   */
  async list(athleteId, limitCount = null) {
    requireUid(athleteId, 'bodyStatusService.list')
    let q = query(
      collection(db, COLLECTIONS.BODY_STATUS),
      where('athleteId', '==', athleteId),
      orderBy('date', 'desc'),
    )
    if (limitCount) q = query(q, limit(limitCount))

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ docId: d.id, data: d.data() }))
  },

  /**
   * Get the latest body status reading.
   */
  async getLatest(athleteId) {
    requireUid(athleteId, 'bodyStatusService.getLatest')
    const readings = await this.list(athleteId, 1)
    return readings[0] || null
  },

  /**
   * Create a new body status reading.
   * @param {object} data - Body metrics (weight, bodyFatPercent, restingHR, vo2Max, energyLevel, etc.)
   */
  async create(data, athleteId) {
    requireUid(athleteId, 'bodyStatusService.create')
    const ref = await addDoc(collection(db, COLLECTIONS.BODY_STATUS), {
      date: data.date || new Date().toISOString().slice(0, 10),
      ...data,
      ...createRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Update an existing body status reading.
   */
  async update(docId, data, athleteId) {
    requireUid(athleteId, 'bodyStatusService.update')
    const snap = await getDoc(doc(db, COLLECTIONS.BODY_STATUS, docId))
    if (!snap.exists() || snap.data().athleteId !== athleteId) return null

    await updateDoc(doc(db, COLLECTIONS.BODY_STATUS, docId), {
      ...data,
      ...updateRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId, created: false }
  },

  /**
   * Delete a body status reading.
   */
  async delete(docId, athleteId) {
    requireUid(athleteId, 'bodyStatusService.delete')
    const snap = await getDoc(doc(db, COLLECTIONS.BODY_STATUS, docId))
    if (snap.exists() && snap.data().athleteId === athleteId) {
      await deleteDoc(doc(db, COLLECTIONS.BODY_STATUS, docId))
    }
  },
}
