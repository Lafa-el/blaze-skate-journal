import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { JOURNAL_SCHEMA_VERSION } from '../constants/skatingx'
import { createRecordMetadata, updateRecordMetadata } from '../utils/firestoreMetadata'
import { requireUid } from '../utils/validation'

export const journalService = {
  /**
   * Get today's journal day document.
   * @param {string} [dateStr] - YYYY-MM-DD, defaults to today
   * @returns { Promise<{ docId: string, data: object } | null> }
   */
  async getByDate(dateStr = new Date().toISOString().slice(0, 10), athleteId) {
    requireUid(athleteId, 'journalService.getByDate')
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
  async save(data, athleteId) {
    requireUid(athleteId, 'journalService.save')
    const dateStr = data.date || new Date().toISOString().slice(0, 10)
    const existing = await this.getByDate(dateStr, athleteId)

    const base = {
      date: dateStr,
    }

    if (existing) {
      await updateDoc(doc(db, COLLECTIONS.JOURNAL_DAYS, existing.docId), {
        ...data,
        ...base,
        ...updateRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
      })
      return { docId: existing.docId, created: false }
    }

    const ref = await addDoc(collection(db, COLLECTIONS.JOURNAL_DAYS), {
      ...base,
      ...data,
      ...createRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Delete a journal day document.
   */
  async delete(docId, athleteId) {
    requireUid(athleteId, 'journalService.delete')
    const snap = await getDoc(doc(db, COLLECTIONS.JOURNAL_DAYS, docId))
    if (snap.exists() && snap.data().athleteId === athleteId) {
      await deleteDoc(doc(db, COLLECTIONS.JOURNAL_DAYS, docId))
    }
  },
}
