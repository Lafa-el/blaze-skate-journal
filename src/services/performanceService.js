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

export const performanceService = {
  /**
   * Get performance records, optionally filtered.
   * @param {object} [filters] - { metric, limit }
   */
  async list(filters = {}, athleteId) {
    requireUid(athleteId, 'performanceService.list')
    const q = query(
      collection(db, COLLECTIONS.PERFORMANCE_RECORDS),
      where('athleteId', '==', athleteId),
    )

    const snapshot = await getDocs(q)
    let results = snapshot.docs.map((d) => ({ docId: d.id, data: d.data() }))

    if (filters.metric) {
      results = results.filter((r) => {
        const event = r.data.event || r.data.metric
        return event === filters.metric
      })
    }

    results.sort((a, b) => (b.data.date || '').localeCompare(a.data.date || ''))

    if (filters.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  },

  /**
   * Get a single performance record.
   */
  async getById(docId, athleteId) {
    requireUid(athleteId, 'performanceService.getById')
    const snap = await getDoc(doc(db, COLLECTIONS.PERFORMANCE_RECORDS, docId))
    if (!snap.exists()) return null
    const data = snap.data()
    if (data.athleteId !== athleteId) return null
    return { docId: snap.id, data }
  },

  /**
   * Create a new performance record.
   * @param {object} data - Performance fields (metric, value, notes, etc.)
   */
  async create(data, athleteId) {
    requireUid(athleteId, 'performanceService.create')
    const ref = await addDoc(collection(db, COLLECTIONS.PERFORMANCE_RECORDS), {
      date: data.date || new Date().toISOString().slice(0, 10),
      ...data,
      ...createRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Update an existing performance record.
   */
  async update(docId, data, athleteId) {
    requireUid(athleteId, 'performanceService.update')
    const record = await this.getById(docId, athleteId)
    if (!record) return null

    await updateDoc(doc(db, COLLECTIONS.PERFORMANCE_RECORDS, docId), {
      ...data,
      ...updateRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId, created: false }
  },

  /**
   * Delete a performance record.
   */
  async delete(docId, athleteId) {
    requireUid(athleteId, 'performanceService.delete')
    const record = await this.getById(docId, athleteId)
    if (record) {
      await deleteDoc(doc(db, COLLECTIONS.PERFORMANCE_RECORDS, docId))
    }
  },
}
