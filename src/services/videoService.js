import {
  collection,
  query,
  where,
  orderBy,
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

export const videoService = {
  /**
   * Get video references, optionally filtered.
   * @param {object} [filters] - { sessionId, analysisStatus, technicalTag, limit }
   */
  async list(filters = {}, athleteId = DEFAULT_ATHLETE_ID) {
    const q = query(
      collection(db, COLLECTIONS.VIDEO_REFS),
      where('athleteId', '==', athleteId),
      orderBy('createdAt', 'desc'),
    )

    const snapshot = await getDocs(q)
    let results = snapshot.docs.map((d) => ({ docId: d.id, data: d.data() }))

    // Server-side filters applied via where
    // Client-side filters (for array-contains, analysisStatus, technicalTag)
    if (filters.analysisStatus) {
      results = results.filter((r) => r.data.analysisStatus === filters.analysisStatus)
    }
    if (filters.technicalTag) {
      results = results.filter((r) => {
        const tags = r.data.technicalTags || []
        return tags.includes(filters.technicalTag)
      })
    }
    if (filters.sessionId) {
      results = results.filter((r) => r.data.sessionId === filters.sessionId)
    }

    if (filters.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  },

  /**
   * Get a single video reference.
   */
  async getById(docId, athleteId = DEFAULT_ATHLETE_ID) {
    const q = query(
      collection(db, COLLECTIONS.VIDEO_REFS),
      where('athleteId', '==', athleteId),
      where('__name__', '==', docId),
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const d = snapshot.docs[0]
    return { docId: d.id, data: d.data() }
  },

  /**
   * Create a new video reference.
   * @param {object} data - Video fields (title, fileName, externalUrl, sessionId, technicalTags, analysisStatus, notes)
   */
  async create(data, athleteId = DEFAULT_ATHLETE_ID) {
    const ref = await addDoc(collection(db, COLLECTIONS.VIDEO_REFS), {
      ...makeBaseFilters(athleteId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    })
    return { docId: ref.id, created: true }
  },

  /**
   * Update an existing video reference.
   */
  async update(docId, data, athleteId = DEFAULT_ATHLETE_ID) {
    const video = await this.getById(docId, athleteId)
    if (!video) return null

    await updateDoc(doc(db, COLLECTIONS.VIDEO_REFS, docId), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return { docId, created: false }
  },

  /**
   * Delete a video reference.
   */
  async delete(docId, athleteId = DEFAULT_ATHLETE_ID) {
    const video = await this.getById(docId, athleteId)
    if (video) {
      await deleteDoc(doc(db, COLLECTIONS.VIDEO_REFS, docId))
    }
  },
}
