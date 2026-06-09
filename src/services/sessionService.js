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
import { db, DEFAULT_ATHLETE_ID, SOURCE_APP, COLLECTIONS } from '../firebase/firestore'

const makeBaseFilters = (athleteId = DEFAULT_ATHLETE_ID) => ({
  athleteId,
  sourceApp: SOURCE_APP,
})

export const sessionService = {
  /**
   * Get training sessions, optionally filtered by date range.
   * @param {string} [athleteId]
   * @param {string} [sortBy] - 'date' or 'createdAt' (default 'date')
   * @param {number} [limitCount]
   * @returns { Promise<Array<{ docId: string, data: object }>> }
   */
  async list(athleteId = DEFAULT_ATHLETE_ID, sortBy = 'date', limitCount = null) {
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
  async getById(docId, athleteId = DEFAULT_ATHLETE_ID) {
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
  async create(data, athleteId = DEFAULT_ATHLETE_ID) {
    const ref = await addDoc(collection(db, COLLECTIONS.TRAINING_SESSIONS), {
      ...makeBaseFilters(athleteId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Update an existing training session.
   */
  async update(docId, data, athleteId = DEFAULT_ATHLETE_ID) {
    const session = await this.getById(docId, athleteId)
    if (!session) return null

    await updateDoc(doc(db, COLLECTIONS.TRAINING_SESSIONS, docId), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return { docId, created: false }
  },

  /**
   * Delete a training session.
   */
  async delete(docId, athleteId = DEFAULT_ATHLETE_ID) {
    const session = await this.getById(docId, athleteId)
    if (session) {
      await deleteDoc(doc(db, COLLECTIONS.TRAINING_SESSIONS, docId))
    }
  },

  /**
   * Count sessions for the athlete.
   */
  async count(athleteId = DEFAULT_ATHLETE_ID) {
    const q = query(
      collection(db, COLLECTIONS.TRAINING_SESSIONS),
      where('athleteId', '==', athleteId),
    )
    const snapshot = await getCountFromServer(q)
    return snapshot.data().count
  },
}
