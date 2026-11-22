import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || 'AIzaSyDqqUWHo5YSe5KB0VDxdETBwdjLzG0kYYg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || 'lane-automotive.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || 'lane-automotive',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || 'lane-automotive.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '148895330524',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '1:148895330524:web:5421692bd5cf8b5ddcc419',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const firebaseApp = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
export const LANE_ADMIN_EMAIL = 'wessamy2012@gmail.com';

