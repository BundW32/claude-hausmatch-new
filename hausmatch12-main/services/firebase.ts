
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC1o_LoqOxhmK4J0lhIzf8qcHABS7XNoY8",
  authDomain: "hausmatch-1.firebaseapp.com",
  projectId: "hausmatch-1",
  storageBucket: "hausmatch-1.firebasestorage.app",
  messagingSenderId: "540537424170",
  appId: "1:540537424170:web:1e5c03694e6bf167523653",
  measurementId: "G-Z57VNN046G"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

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
