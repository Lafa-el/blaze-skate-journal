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
} from 'firebase/firestore'
import { db, DEFAULT_ATHLETE_ID, SOURCE_APP, COLLECTIONS } from '../firebase/firestore'

const makeBaseFilters = (athleteId = DEFAULT_ATHLETE_ID) => ({
  athleteId,
  sourceApp: SOURCE_APP,
})

export const coachNoteService = {
  /**
   * Get coach notes, optionally filtered by coach name or priority.
   * @param {object} [filters] - { coach, priority, limit }
   */
  async list(filters = {}, athleteId = DEFAULT_ATHLETE_ID) {
    let q = query(
      collection(db, COLLECTIONS.COACH_NOTES),
      where('athleteId', '==', athleteId),
      orderBy('date', 'desc'),
    )

    if (filters.coach) {
      q = query(q, where('coach', '==', filters.coach))
    }
    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority))
    }
    if (filters.limit) {
      q = query(q, limit(filters.limit))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ docId: d.id, data: d.data() }))
  },

  /**
   * Get a single coach note by Firestore doc ID.
   */
  async getById(docId, athleteId = DEFAULT_ATHLETE_ID) {
    const q = query(
      collection(db, COLLECTIONS.COACH_NOTES),
      where('athleteId', '==', athleteId),
      where('__name__', '==', docId),
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const d = snapshot.docs[0]
    return { docId: d.id, data: d.data() }
  },

  /**
   * Create a new coach note.
   * @param {object} data - Note fields (exclude athleteId, sourceApp, timestamps)
   */
  async create(data, athleteId = DEFAULT_ATHLETE_ID) {
    const ref = await addDoc(collection(db, COLLECTIONS.COACH_NOTES), {
      ...makeBaseFilters(athleteId),
      date: data.date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Update an existing coach note.
   */
  async update(docId, data, athleteId = DEFAULT_ATHLETE_ID) {
    const note = await this.getById(docId, athleteId)
    if (!note) return null

    await updateDoc(doc(db, COLLECTIONS.COACH_NOTES, docId), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return { docId, created: false }
  },

  /**
   * Delete a coach note.
   */
  async delete(docId, athleteId = DEFAULT_ATHLETE_ID) {
    const note = await this.getById(docId, athleteId)
    if (note) {
      await deleteDoc(doc(db, COLLECTIONS.COACH_NOTES, docId))
    }
  },
}
