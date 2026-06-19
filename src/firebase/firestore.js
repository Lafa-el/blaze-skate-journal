import { getFirestore } from 'firebase/firestore'
import app from './firebaseConfig'
export { COLLECTIONS, SOURCE_APP } from '../constants/skatingx'

export const db = getFirestore(app)
