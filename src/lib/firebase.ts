import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// IMPORTANT: Replace this with your actual Firebase project configuration
const firebaseConfig = {
  "projectId": "visitas-sagacy",
  "appId": "1:835253296541:web:8ada22aab3e879c27b2374",
  "storageBucket": "visitas-sagacy.firebasestorage.app",
  "apiKey": "AIzaSyD8A9QypKybW_OseOptedl8geQwK4BiOh8",
  "authDomain": "visitas-sagacy.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "835253296541"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
