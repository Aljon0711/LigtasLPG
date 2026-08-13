import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

/**
 * Firebase web config (Auth for Google popup on browser).
 * Native Android uses google-services.json + @capacitor-firebase/authentication.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseWebConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  )
}

export function getFirebaseApp() {
  if (!isFirebaseWebConfigured()) {
    throw new Error(
      'Firebase web config missing. Add VITE_FIREBASE_* keys to .env'
    )
  }
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig)
  }
  return getApps()[0]
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}
