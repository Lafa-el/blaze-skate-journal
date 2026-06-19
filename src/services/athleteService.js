import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db, DEFAULT_ATHLETE_ID, SOURCE_APP, COLLECTIONS } from '../firebase/firestore'

/**
 * Resolve the athlete document ID.
 * If an athlete with the given athleteId already exists, return its Firestore doc ID.
 * Otherwise create one and return the new doc ID.
 */
async function resolveAthleteId(athleteId = DEFAULT_ATHLETE_ID) {
  const q = query(collection(db, COLLECTIONS.ATHLETES), where('athleteId', '==', athleteId))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    return snapshot.docs[0].id
  }

  const newAthleteRef = doc(collection(db, COLLECTIONS.ATHLETES))
  await setDoc(newAthleteRef, {
    athleteId,
    sourceApp: SOURCE_APP,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    displayName: athleteId,
  })

  return newAthleteRef.id
}

export const athleteService = {
  /**
   * Get the athlete document by athleteId string.
   * Returns { docId, data } or null.
   */
  async get(athleteId = DEFAULT_ATHLETE_ID) {
    const q = query(collection(db, COLLECTIONS.ATHLETES), where('athleteId', '==', athleteId))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const docSnap = snapshot.docs[0]
    return { docId: docSnap.id, data: docSnap.data() }
  },

  /**
   * Create or ensure an athlete record exists.
   * Returns the Firestore doc ID.
   */
  async createOrUpdate(athleteId = DEFAULT_ATHLETE_ID, updates = {}) {
    const docId = await resolveAthleteId(athleteId)
    await updateDoc(doc(db, COLLECTIONS.ATHLETES, docId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    return docId
  },

  /**
   * Get a raw Firestore doc ref object by athleteId string.
   */
  async getDocRef(athleteId = DEFAULT_ATHLETE_ID) {
    const q = query(collection(db, COLLECTIONS.ATHLETES), where('athleteId', '==', athleteId))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return doc(db, COLLECTIONS.ATHLETES, snapshot.docs[0].id)
  },
}
