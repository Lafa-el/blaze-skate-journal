import {
  collection,
  query,
  where,
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

export const journalService = {
  /**
   * Get today's journal day document.
   * @param {string} [dateStr] - YYYY-MM-DD, defaults to today
   * @returns { Promise<{ docId: string, data: object } | null> }
   */
  async getByDate(dateStr = new Date().toISOString().slice(0, 10), athleteId = DEFAULT_ATHLETE_ID) {
    const q = query(
      collection(db, COLLECTIONS.JOURNAL_DAYS),
      where('athleteId', '==', athleteId),
      where('date', '==', dateStr),
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const d = snapshot.docs[0]
    return { docId: d.id, data: d.data() }
  },

  /**
   * Create or update a journal day document.
   * @param {object} data - Journal fields (athleteId/sourceApp/updatedAt are auto-filled; date and other fields are merged)
   */
  async save(data, athleteId = DEFAULT_ATHLETE_ID) {
    const dateStr = data.date || new Date().toISOString().slice(0, 10)
    const existing = await this.getByDate(dateStr, athleteId)

    const base = {
      ...makeBaseFilters(athleteId),
      date: dateStr,
      updatedAt: new Date().toISOString(),
    }

    if (existing) {
      await updateDoc(doc(db, COLLECTIONS.JOURNAL_DAYS, existing.docId), {
        ...data,
        ...base,
      })
      return { docId: existing.docId, created: false }
    }

    const ref = await addDoc(collection(db, COLLECTIONS.JOURNAL_DAYS), {
      ...base,
      createdAt: new Date().toISOString(),
      ...data,
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Delete a journal day document.
   */
  async delete(docId) {
    // Delete the document by docId
    await deleteDoc(doc(db, COLLECTIONS.JOURNAL_DAYS, docId))
  },
}
