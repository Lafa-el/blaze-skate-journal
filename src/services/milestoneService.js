import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { JOURNAL_SCHEMA_VERSION } from '../constants/skatingx'
import { createRecordMetadata, updateRecordMetadata } from '../utils/firestoreMetadata'
import { requireUid } from '../utils/validation'

export const milestoneService = {
  async list(filters = {}, athleteId) {
    requireUid(athleteId, 'milestoneService.list')
    let q = query(
      collection(db, COLLECTIONS.MILESTONES),
      where('athleteId', '==', athleteId),
      orderBy('date', 'desc'),
    )
    if (filters.category) {
      q = query(q, where('category', '==', filters.category))
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ docId: d.id, data: d.data() }))
  },

  async getById(docId, athleteId) {
    requireUid(athleteId, 'milestoneService.getById')
    const q = query(
      collection(db, COLLECTIONS.MILESTONES),
      where('athleteId', '==', athleteId),
      where('__name__', '==', docId),
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const d = snapshot.docs[0]
    return { docId: d.id, data: d.data() }
  },

  async create(data, athleteId) {
    requireUid(athleteId, 'milestoneService.create')
    const ref = await addDoc(collection(db, COLLECTIONS.MILESTONES), {
      date: data.date || new Date().toISOString().slice(0, 10),
      ...data,
      ...createRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId: ref.id, created: true }
  },

  async update(docId, data, athleteId) {
    requireUid(athleteId, 'milestoneService.update')
    const milestone = await this.getById(docId, athleteId)
    if (!milestone) return null

    await updateDoc(doc(db, COLLECTIONS.MILESTONES, docId), {
      ...data,
      ...updateRecordMetadata(athleteId, JOURNAL_SCHEMA_VERSION),
    })
    return { docId, created: false }
  },

  async delete(docId, athleteId) {
    requireUid(athleteId, 'milestoneService.delete')
    const milestone = await this.getById(docId, athleteId)
    if (milestone) {
      await deleteDoc(doc(db, COLLECTIONS.MILESTONES, docId))
    }
  },
}
