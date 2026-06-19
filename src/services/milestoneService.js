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
import { db, SOURCE_APP, COLLECTIONS } from '../firebase/firestore'

const makeBaseFilters = (athleteId) => ({
  athleteId,
  sourceApp: SOURCE_APP,
})

export const milestoneService = {
  async list(filters = {}, athleteId) {
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
    const ref = await addDoc(collection(db, COLLECTIONS.MILESTONES), {
      ...makeBaseFilters(athleteId),
      date: data.date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    })
    return { docId: ref.id, created: true }
  },

  async update(docId, data, athleteId) {
    const milestone = await this.getById(docId, athleteId)
    if (!milestone) return null

    await updateDoc(doc(db, COLLECTIONS.MILESTONES, docId), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return { docId, created: false }
  },

  async delete(docId, athleteId) {
    const milestone = await this.getById(docId, athleteId)
    if (milestone) {
      await deleteDoc(doc(db, COLLECTIONS.MILESTONES, docId))
    }
  },
}
