import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// Warn in development if Firebase credentials are missing
if (import.meta.env.DEV) {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  if (missingKeys.length > 0) {
    console.warn(
      '[Firebase] Missing environment variables:',
      missingKeys.join(', '),
      '. Firebase operations will fail. Please set VITE_FIREBASE_* variables.',
    )
  }
}

const app = initializeApp(firebaseConfig)

export default app
