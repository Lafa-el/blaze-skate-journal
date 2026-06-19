import { initializeApp, getApps } from 'firebase/app'

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

// Only initialize Firebase if config is complete
const hasAllConfig = Object.values(firebaseConfig).every((v) => v !== '' && v !== undefined)

let app
if (hasAllConfig) {
  const apps = getApps()
  app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig)
} else {
  // Create a placeholder app to prevent crashes
  // This allows the app to render the login page even without Firebase config
  try {
    app = initializeApp({ projectId: 'placeholder' }, 'placeholder-app')
  } catch {
    // If even placeholder init fails, create a minimal object
    app = { options: { projectId: 'placeholder' } }
  }
}

export default app
