
import { User, UserRole, UserType, Inquiry, ForumThread, Message, MatchRequest, MatchApplication, AufgabenCategory } from "../types";
import { auth, db, storage, COLLECTIONS, addDocument } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  arrayRemove,
  onSnapshot,
  increment,
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
    if (uid === 'm1') return { id: 'm1', name: 'Max Mustermann', email: 'max@hausverwaltung-berlin.de', role: 'manager', userType: 'hausverwaltung', bio: 'Experte für WEG-Verwaltung in Berlin.', friends: [] };
    if (uid === 'm2') return { id: 'm2', name: 'Erika Musterfrau', email: 'erika@immobilien-muenchen.de', role: 'manager', userType: 'hausverwaltung', bio: 'Spezialistin für Mietverwaltung und Sanierung.', friends: [] };
    if (uid === 's1') return { id: 's1', name: 'John Doe', email: 'john@owner.com', role: 'seeker', userType: 'owner', bio: 'Immobilienbesitzer mit Fokus auf Mehrfamilienhäuser.', friends: [] };
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
        userType: 'owner',
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

export const registerUser = async (email: string, password: string, name: string, role: UserRole, avatar?: string, bio?: string, city?: string, userType?: UserType): Promise<User> => {
  const resolvedUserType: UserType = userType ?? (role === 'manager' ? 'hausverwaltung' : role === 'profi' ? 'sonstige_profi' : 'owner');
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const newUser: User = {
      id: uid,
      email,
      name,
      role,
      userType: resolvedUserType,
      avatar: avatar || '',
      bio: bio || '',
      friends: [],
      pendingFriends: [],
      city: city || '',
      location: city || '',
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
      { id: 'm1', name: 'Max Mustermann', email: 'max@hausverwaltung-berlin.de', role: 'manager', userType: 'hausverwaltung', bio: 'Experte für WEG-Verwaltung in Berlin.', friends: [] },
      { id: 'm2', name: 'Erika Musterfrau', email: 'erika@immobilien-muenchen.de', role: 'manager', userType: 'hausverwaltung', bio: 'Spezialistin für Mietverwaltung und Sanierung.', friends: [] },
      { id: 's1', name: 'John Doe', email: 'john@owner.com', role: 'seeker', userType: 'owner', bio: 'Immobilienbesitzer mit Fokus auf Mehrfamilienhäuser.', friends: [] }
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

const geocodeCity = async (cityName: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + ' Deutschland')}&format=json&limit=1&countrycodes=de`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getManagersByCity = async (city: string): Promise<User[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "manager"), limit(50));
    const snapshot = await getDocs(q);
    const managers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    if (managers.length === 0) return [];

    // Geocode search city; fall back to string match if unavailable
    const searchCoords = await geocodeCity(city);
    if (!searchCoords) {
      const needle = city.trim().toLowerCase();
      return managers.filter(m => {
        const mc = (m.city || m.location || '').toLowerCase();
        return mc.includes(needle) || needle.includes(mc.split(',')[0].trim());
      });
    }

    // Geocode each unique manager city sequentially (respects Nominatim 1 req/s limit)
    const uniqueCities = [...new Set(
      managers.map(m => (m.city || m.location || '').split(',')[0].trim()).filter(Boolean)
    )];
    const coordMap = new Map<string, { lat: number; lon: number } | null>();
    for (const c of uniqueCities) {
      coordMap.set(c, await geocodeCity(c));
      await new Promise(r => setTimeout(r, 300));
    }

    return managers.filter(m => {
      const mc = (m.city || m.location || '').split(',')[0].trim();
      const coords = coordMap.get(mc);
      if (!coords) return false;
      return haversineKm(searchCoords.lat, searchCoords.lon, coords.lat, coords.lon) <= 20;
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

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

// ─── AUFGABEN BOARD ─────────────────────────────────────────────────────────────

export const subscribeToAufgaben = (
  callback: (tasks: MatchRequest[]) => void,
  onError?: (e: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.AUFGABEN),
    where('status', '==', 'offen')
  );
  return onSnapshot(q, snapshot => {
    const tasks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as MatchRequest))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    callback(tasks);
  }, onError ?? console.error);
};

export const subscribeToOwnerAufgaben = (
  ownerId: string,
  callback: (tasks: MatchRequest[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.AUFGABEN),
    where('ownerId', '==', ownerId)
  );
  return onSnapshot(q, snapshot => {
    const tasks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as MatchRequest))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    callback(tasks);
  }, console.error);
};

export const createAufgabe = async (
  data: Omit<MatchRequest, 'id' | 'createdAt' | 'status' | 'applicationCount'>
): Promise<string> => {
  try {
    const ref = await addDocument(COLLECTIONS.AUFGABEN, {
      ...data,
      status: 'offen',
      applicationCount: 0,
    });
    return ref.id;
  } catch (err: any) {
    console.warn('createAufgabe error (simulating):', err.message);
    return 'mock-aufgabe-' + Date.now();
  }
};

export const getBewerbungenForAufgabe = async (
  aufgabeId: string
): Promise<MatchApplication[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.BEWERBUNGEN),
      where('requestId', '==', aufgabeId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as MatchApplication))
      .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
  } catch (err: any) {
    console.warn('getBewerbungenForAufgabe error:', err.message);
    return [];
  }
};

export const createBewerbung = async (
  data: Omit<MatchApplication, 'id' | 'createdAt' | 'status'>
): Promise<void> => {
  try {
    await addDocument(COLLECTIONS.BEWERBUNGEN, {
      ...data,
      status: 'ausstehend',
    });
    await updateDoc(doc(db, COLLECTIONS.AUFGABEN, data.requestId), {
      applicationCount: increment(1),
      status: 'inBearbeitung',
    });
  } catch (err: any) {
    console.warn('createBewerbung error (simulating):', err.message);
  }
};

export const acceptBewerbung = async (
  aufgabeId: string,
  bewerbungId: string,
  managerId: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.AUFGABEN, aufgabeId), {
      status: 'vergeben',
      selectedManagerId: managerId,
    });
    await updateDoc(doc(db, COLLECTIONS.BEWERBUNGEN, bewerbungId), {
      status: 'angenommen',
    });
    const others = await getDocs(
      query(collection(db, COLLECTIONS.BEWERBUNGEN), where('requestId', '==', aufgabeId))
    );
    const rejectPromises = others.docs
      .filter(d => d.id !== bewerbungId)
      .map(d => updateDoc(d.ref, { status: 'abgelehnt' }));
    await Promise.all(rejectPromises);
  } catch (err: any) {
    console.warn('acceptBewerbung error:', err.message);
  }
};
