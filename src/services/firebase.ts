import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ron-harvest-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ron-harvest-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ron-harvest-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef1234567890',
};

// Check if valid Firebase configuration is supplied
export const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

export const CURRENT_PROJECT_ID = firebaseConfig.projectId;

export const ENVIRONMENT_TYPE: 'PRODUCTION' | 'DEVELOPMENT' =
  import.meta.env.PROD || (isFirebaseConfigured && !firebaseConfig.projectId.includes('demo') && !firebaseConfig.projectId.includes('dev'))
    ? 'PRODUCTION'
    : 'DEVELOPMENT';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization warning:', error);
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, db, auth };
