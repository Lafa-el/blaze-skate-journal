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
import { db, COLLECTIONS } from '../firebase/firestore'
import { PROFILE_SCHEMA_VERSION } from '../constants/skatingx'
import { createRecordMetadata, updateRecordMetadata } from '../utils/firestoreMetadata'
import { requireUid } from '../utils/validation'

export const athleteService = {
  async getAthleteProfile(uid) {
    requireUid(uid, 'athleteService.getAthleteProfile')
    const snap = await getDoc(doc(db, COLLECTIONS.ATHLETES, uid))
    if (!snap.exists()) return null
    return { docId: snap.id, data: snap.data() }
  },

  async createAthleteProfile(uid, data = {}) {
    requireUid(uid, 'athleteService.createAthleteProfile')
    const metadata = createRecordMetadata(uid, PROFILE_SCHEMA_VERSION)
    await setDoc(doc(db, COLLECTIONS.ATHLETES, uid), {
      ...data,
      ...metadata,
      createdAt: data.createdAt || metadata.createdAt,
    })
    return { docId: uid, created: true }
  },

  async updateAthleteProfile(uid, data = {}) {
    requireUid(uid, 'athleteService.updateAthleteProfile')
    await updateDoc(doc(db, COLLECTIONS.ATHLETES, uid), {
      ...data,
      ...updateRecordMetadata(uid, PROFILE_SCHEMA_VERSION),
    })
    return { docId: uid, created: false }
  },

  async upsertAthleteProfile(uid, data = {}) {
    requireUid(uid, 'athleteService.upsertAthleteProfile')
    const existing = await this.getAthleteProfile(uid)
    if (existing) {
      return this.updateAthleteProfile(uid, data)
    }

    return this.createAthleteProfile(uid, data)
  },

  async getLegacyAthleteProfilesByAthleteId(uid) {
    requireUid(uid, 'athleteService.getLegacyAthleteProfilesByAthleteId')
    const q = query(collection(db, COLLECTIONS.ATHLETES), where('athleteId', '==', uid))
    const snapshot = await getDocs(q)
    return snapshot.docs
      .filter((docSnap) => docSnap.id !== uid)
      .map((docSnap) => ({ docId: docSnap.id, data: docSnap.data() }))
  },
}
