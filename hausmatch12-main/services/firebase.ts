
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Kein Firebase/Google Analytics: Tracking würde eine Einwilligung nach
// § 25 TDDDG erfordern; die Datenschutzerklärung sichert zu, dass keine
// Tracking-Identifier gesetzt werden.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const COLLECTIONS = {
  USERS: 'users',
  INQUIRIES: 'inquiries',
  THREADS: 'forum_threads',
  REPLIES: 'forum_replies',
  MESSAGES: 'messages',
  AUFGABEN: 'aufgaben',
  BEWERBUNGEN: 'bewerbungen',
  SCHWARZES_BRETT: 'schwarzes_brett',
};

export const addDocument = async (collectionName: string, data: any) => {
  return await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp()
  });
};

console.log("🔥 Firebase initialized (Stability Mode)");
