import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from 'firebase/firestore'
import { db, SOURCE_APP, COLLECTIONS } from '../firebase/firestore'

function assertUid(uid) {
  if (!uid) {
    throw new Error('A Firebase Auth UID is required for athlete profile operations.')
  }
}

export const athleteService = {
  async getAthleteProfile(uid) {
    assertUid(uid)
    const snap = await getDoc(doc(db, COLLECTIONS.ATHLETES, uid))
    if (!snap.exists()) return null
    return { docId: snap.id, data: snap.data() }
  },

  async createAthleteProfile(uid, data = {}) {
    assertUid(uid)
    const now = new Date().toISOString()
    await setDoc(doc(db, COLLECTIONS.ATHLETES, uid), {
      ...data,
      athleteId: uid,
      sourceApp: SOURCE_APP,
      createdAt: data.createdAt || now,
      updatedAt: now,
    })
    return { docId: uid, created: true }
  },

  async updateAthleteProfile(uid, data = {}) {
    assertUid(uid)
    await updateDoc(doc(db, COLLECTIONS.ATHLETES, uid), {
      ...data,
      athleteId: uid,
      sourceApp: SOURCE_APP,
      updatedAt: new Date().toISOString(),
    })
    return { docId: uid, created: false }
  },

  async upsertAthleteProfile(uid, data = {}) {
    assertUid(uid)
    const existing = await this.getAthleteProfile(uid)
    if (existing) {
      return this.updateAthleteProfile(uid, data)
    }

    return this.createAthleteProfile(uid, data)
  },

  async getLegacyAthleteProfilesByAthleteId(uid) {
    assertUid(uid)
    const q = query(collection(db, COLLECTIONS.ATHLETES), where('athleteId', '==', uid))
    const snapshot = await getDocs(q)
    return snapshot.docs
      .filter((docSnap) => docSnap.id !== uid)
      .map((docSnap) => ({ docId: docSnap.id, data: docSnap.data() }))
  },
}
