
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics initialization (optional/async)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export const COLLECTIONS = {
  USERS: 'users',
  INQUIRIES: 'inquiries',
  THREADS: 'forum_threads',
  REPLIES: 'forum_replies',
  MESSAGES: 'messages'
};

export const addDocument = async (collectionName: string, data: any) => {
  return await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp()
  });
};

console.log("🔥 Firebase initialized (Stability Mode)");
