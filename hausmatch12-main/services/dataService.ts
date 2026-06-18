
import { User, UserRole, Inquiry, ForumThread, Message } from "../types";
import { auth, db } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
} from "firebase/auth";
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  or,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

export { auth, db };

// --- AUTHENTICATION ---

// Fix: Added exported getUserProfile function to satisfy imports in App.tsx
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
  } catch (error: any) {
    console.warn("Firestore getUserProfile error (using fallback):", error.message);
    // Return a mock user if requested UID matches a mock
    if (uid === 'm1') return { id: 'm1', name: 'Max Mustermann', email: 'max@hausverwaltung-berlin.de', role: 'manager', bio: 'Experte für WEG-Verwaltung in Berlin.', friends: [] };
    if (uid === 'm2') return { id: 'm2', name: 'Erika Musterfrau', email: 'erika@immobilien-muenchen.de', role: 'manager', bio: 'Spezialistin für Mietverwaltung und Sanierung.', friends: [] };
    if (uid === 's1') return { id: 's1', name: 'John Doe', email: 'john@owner.com', role: 'seeker', bio: 'Immobilienbesitzer mit Fokus auf Mehrfamilienhäuser.', friends: [] };
  }
  return null;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    // Fix: Reused getUserProfile for consistency
    const profile = await getUserProfile(uid);
    
    if (profile) {
      return profile;
    } else {
      return { 
        id: uid, 
        email: email, 
        name: email.split('@')[0], 
        role: 'seeker',
        friends: []
      } as User;
    }
  } catch (error: any) {
    console.error("Login error details:", error.code, error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const registerUser = async (email: string, password: string, name: string, role: UserRole, avatar?: string, bio?: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const newUser: User = { 
      id: uid, 
      email, 
      name, 
      role,
      avatar: avatar || '',
      bio: bio || '',
      friends: [],
      pendingFriends: [],
      location: '',
      specialization: []
    };
    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  } catch (error: any) {
    console.error("Registration error details:", error.code, error.message);
    throw error;
  }
};

// --- USER & NETWORKING ---

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    let q;
    if (searchTerm) {
      // Simple prefix search (case-sensitive in Firestore)
      q = query(
        collection(db, "users"), 
        where("name", ">=", searchTerm), 
        where("name", "<=", searchTerm + "\uf8ff"),
        limit(50)
      );
    } else {
      q = query(collection(db, "users"), limit(50));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error: any) {
    console.warn("Firestore searchUsers error (using fallback):", error.message);
    // Fallback Mock Data for Networking
    const mockUsers: User[] = [
      { id: 'm1', name: 'Max Mustermann', email: 'max@hausverwaltung-berlin.de', role: 'manager', bio: 'Experte für WEG-Verwaltung in Berlin.', friends: [] },
      { id: 'm2', name: 'Erika Musterfrau', email: 'erika@immobilien-muenchen.de', role: 'manager', bio: 'Spezialistin für Mietverwaltung und Sanierung.', friends: [] },
      { id: 's1', name: 'John Doe', email: 'john@owner.com', role: 'seeker', bio: 'Immobilienbesitzer mit Fokus auf Mehrfamilienhäuser.', friends: [] }
    ];
    if (!searchTerm) return mockUsers;
    return mockUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }
};

export const updateUserProfile = async (uid: string, data: Partial<User>) => {
  try {
    await updateDoc(doc(db, "users", uid), data);
  } catch (error: any) {
    console.error("Firestore updateUserProfile error:", error.message);
    throw error;
  }
};

export const addFriend = async (myUid: string, friendUid: string) => {
  try {
    await updateDoc(doc(db, "users", myUid), {
      friends: arrayUnion(friendUid)
    });
    await updateDoc(doc(db, "users", friendUid), {
      friends: arrayUnion(myUid)
    });
  } catch (error: any) {
    console.error("Firestore addFriend error:", error.message);
    throw error;
  }
};

export const getManagersByCity = async (city: string): Promise<User[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "manager"), limit(50));
    const snapshot = await getDocs(q);
    const managers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    const needle = city.trim().toLowerCase();
    return managers.filter(m => {
      const managerCity = (m.city || m.location || '').toLowerCase();
      const areas = (m.serviceAreas || []).map(a => a.toLowerCase());
      return managerCity.includes(needle) || needle.includes(managerCity.split(',')[0].trim()) ||
             areas.some(a => a.includes(needle) || needle.includes(a));
    });
  } catch {
    return [];
  }
};

export const removeFriend = async (myUid: string, friendUid: string) => {
  try {
    await updateDoc(doc(db, "users", myUid), {
      friends: arrayRemove(friendUid)
    });
    await updateDoc(doc(db, "users", friendUid), {
      friends: arrayRemove(myUid)
    });
  } catch (error: any) {
    console.error("Firestore removeFriend error:", error.message);
    throw error;
  }
};

// --- INQUIRIES, FORUM, MESSAGING (Existing maintained) ---

export const createInquiry = async (inquiryData: Omit<Inquiry, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, "inquiries"), {
      ...inquiryData,
      createdAt: serverTimestamp(),
      status: inquiryData.status || 'offen' 
    });
    return docRef.id;
  } catch (error: any) {
    console.warn("Firestore createInquiry error (simulating success):", error.message);
    return "mock-inquiry-id-" + Date.now();
  }
};

export const getInquiries = async (): Promise<Inquiry[]> => {
  try {
    const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
  } catch (error: any) {
    console.warn("Firestore getInquiries error (using fallback):", error.message);
    return [
      {
        id: 'mock1',
        ownerId: 's1',
        ownerName: 'John Doe',
        ownerEmail: 'john@owner.com',
        city: 'Berlin',
        units: 12,
        propertyType: 'WEG',
        servicesNeeded: ['Verwaltung', 'Abrechnung'],
        buildingAge: '1995',
        condition: 'Gepflegt',
        description: 'Suche neue Verwaltung für unser 12-Parteien Haus.',
        status: 'neu',
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        aiAnalysis: {
          summary: "Standard WEG-Anfrage mit mittlerem Aufwand.",
          keyRequirements: ["Abrechnungserstellung", "Beiratskommunikation"],
          estimatedEffort: "Mittel",
          legalAdviceSnippet: "Prüfen Sie die aktuelle WEG-Reform.",
          recommendedTags: ["WEG", "Berlin"]
        }
      }
    ];
  }
};

export const updateInquiryStatus = async (inquiryId: string, newStatus: Inquiry['status']) => {
  try {
    await updateDoc(doc(db, "inquiries", inquiryId), { status: newStatus });
  } catch (error: any) {
    console.warn("Firestore updateInquiryStatus error (ignoring):", error.message);
  }
};

export const getMessages = async (userId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, "messages"), 
      or(where("senderId", "==", userId), where("receiverId", "==", userId)),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
  } catch (error: any) {
    console.warn("Firestore getMessages error (using fallback):", error.message);
    return [];
  }
};

export const sendMessage = async (messageData: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
  try {
    await addDoc(collection(db, "messages"), {
      ...messageData,
      timestamp: serverTimestamp(),
      read: false
    });
  } catch (error: any) {
    console.warn("Firestore sendMessage error (simulating success):", error.message);
  }
};

export const markMessageRead = async (messageId: string) => {
  await updateDoc(doc(db, "messages", messageId), { read: true });
};
