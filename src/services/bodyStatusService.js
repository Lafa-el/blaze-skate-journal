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
import { db, SOURCE_APP, COLLECTIONS } from '../firebase/firestore'

const makeBaseFilters = (athleteId) => ({
  athleteId,
  sourceApp: SOURCE_APP,
})

export const bodyStatusService = {
  /**
   * Get body status readings, optionally limited.
   */
  async list(athleteId, limitCount = null) {
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
    const readings = await this.list(athleteId, 1)
    return readings[0] || null
  },

  /**
   * Create a new body status reading.
   * @param {object} data - Body metrics (weight, bodyFatPercent, restingHR, vo2Max, energyLevel, etc.)
   */
  async create(data, athleteId) {
    const ref = await addDoc(collection(db, COLLECTIONS.BODY_STATUS), {
      ...makeBaseFilters(athleteId),
      date: data.date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Update an existing body status reading.
   */
  async update(docId, data) {
    const snap = await getDoc(doc(db, COLLECTIONS.BODY_STATUS, docId))
    if (!snap.exists()) return null

    await updateDoc(doc(db, COLLECTIONS.BODY_STATUS, docId), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return { docId, created: false }
  },

  /**
   * Delete a body status reading.
   */
  async delete(docId) {
    const snap = await getDoc(doc(db, COLLECTIONS.BODY_STATUS, docId))
    if (snap.exists()) {
      await deleteDoc(doc(db, COLLECTIONS.BODY_STATUS, docId))
    }
  },
}
