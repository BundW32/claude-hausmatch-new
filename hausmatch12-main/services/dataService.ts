
import { User, UserRole, UserType, Inquiry, ForumThread, Message, MatchRequest, MatchApplication, AufgabenCategory, SchwarztesBrettPost } from "../types";
import { auth, db, storage, COLLECTIONS, addDocument } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
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
import { categorizeRegion } from "./regions";

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

// DSGVO Art. 17 (Recht auf Löschung): löscht das Firestore-Profil und das
// Firebase-Auth-Konto des aktuell eingeloggten Nutzers. Mit Passwort wird vorab
// re-authentifiziert, damit Firebase die Löschung nicht wegen 'requires-recent-login'
// ablehnt. Das Profil-Dokument muss VOR dem Auth-Konto gelöscht werden, weil die
// Firestore-Regeln danach keinen Zugriff mehr erlauben.
export const deleteAccount = async (password?: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Nicht angemeldet.');
  const { deleteDoc } = await import('firebase/firestore');
  const { deleteUser, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');

  if (password && currentUser.email) {
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  }

  await deleteDoc(doc(db, 'users', currentUser.uid));
  await deleteUser(currentUser);
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
      region: categorizeRegion(city),
      specialization: []
    };
    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  } catch (error: any) {
    console.error("Registration error details:", error.code, error.message);
    throw error;
  }
};

// ─── EINLADUNG / MAGIC-LINK (nur für eingeladene Verwalter) ──────────────────────

const INVITE_EMAIL_KEY = 'hm_invite_email';
const INVITE_CITY_KEY = 'hm_invite_city';
const INVITE_COMPANY_KEY = 'hm_invite_company';

// Schickt einem (noch nicht registrierten) Verwalter einen passwortlosen Login-Link.
// Voraussetzung in der Firebase Console:
//   Authentication -> Sign-in method -> Email/Password -> "Email link (passwordless sign-in)" aktiviert
//   Authentication -> Settings -> Authorized domains -> App-Domain eingetragen
export const sendInviteSignInLink = async (email: string, city?: string, company?: string): Promise<void> => {
  const cleanEmail = email.trim().toLowerCase();
  const continueUrl = `${window.location.origin}/?finishInvite=1&inviteEmail=${encodeURIComponent(cleanEmail)}`;
  await sendSignInLinkToEmail(auth, cleanEmail, { url: continueUrl, handleCodeInApp: true });
  try {
    window.localStorage.setItem(INVITE_EMAIL_KEY, cleanEmail);
    if (city) window.localStorage.setItem(INVITE_CITY_KEY, city);
    if (company) window.localStorage.setItem(INVITE_COMPANY_KEY, company);
  } catch (_) { /* localStorage evtl. nicht verfügbar */ }
};

// Prüft, ob die aktuelle URL ein Firebase-Magic-Link ist.
export const isInviteSignInLink = (): boolean => {
  try { return isSignInWithEmailLink(auth, window.location.href); } catch { return false; }
};

// Schließt den Magic-Link-Login ab und legt – falls nötig – das Verwalter-Profil an.
// Gibt true zurück, wenn ein Sign-in stattgefunden hat.
export const completeInviteSignIn = async (): Promise<boolean> => {
  if (!isInviteSignInLink()) return false;
  const params = new URLSearchParams(window.location.search);
  let email = '';
  try { email = window.localStorage.getItem(INVITE_EMAIL_KEY) || ''; } catch (_) {}
  if (!email) email = params.get('inviteEmail') || '';
  if (!email) throw new Error('Für den Login wird die eingeladene E-Mail benötigt.');

  const cred = await signInWithEmailLink(auth, email, window.location.href);
  const uid = cred.user.uid;

  const existing = await getDoc(doc(db, 'users', uid));
  if (!existing.exists()) {
    let city = ''; let company = '';
    try {
      city = window.localStorage.getItem(INVITE_CITY_KEY) || '';
      company = window.localStorage.getItem(INVITE_COMPANY_KEY) || '';
    } catch (_) {}
    const newUser: User = {
      id: uid,
      email,
      name: company || email.split('@')[0],
      role: 'manager',
      userType: 'hausverwaltung',
      avatar: '',
      bio: '',
      friends: [],
      pendingFriends: [],
      city,
      location: city,
      region: categorizeRegion(city),
      companyName: company,
      specialization: [],
    };
    await setDoc(doc(db, 'users', uid), newUser);
  }
  try {
    window.localStorage.removeItem(INVITE_EMAIL_KEY);
    window.localStorage.removeItem(INVITE_CITY_KEY);
    window.localStorage.removeItem(INVITE_COMPANY_KEY);
  } catch (_) {}
  return true;
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
    // Stadt/Standort geändert -> Region im Backend neu kategorisieren.
    const payload: Partial<User> =
      data.city !== undefined || data.location !== undefined
        ? { ...data, region: categorizeRegion(data.city ?? data.location) }
        : data;
    await updateDoc(doc(db, "users", uid), payload);
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

// Netzwerk-Partner in einer Stadt finden. Ohne userTypes: Hausverwaltungen
// (role manager, wie bisher). Mit userTypes: passende Profis des Gewerks
// (z. B. ['makler'] oder ['anwalt']) für die Multi-Profi-Suche.
export const getManagersByCity = async (city: string, userTypes?: string[]): Promise<User[]> => {
  try {
    const q = userTypes && userTypes.length > 0
      ? query(collection(db, "users"), where("userType", "in", userTypes.slice(0, 10)), limit(50))
      : query(collection(db, "users"), where("role", "==", "manager"), limit(50));
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

// ─── SCHWARZES BRETT ─────────────────────────────────────────────────────────────

export const subscribeToSchwarztesBrett = (
  callback: (posts: SchwarztesBrettPost[]) => void,
  onError?: (e: Error) => void
): (() => void) => {
  const q = query(collection(db, COLLECTIONS.SCHWARZES_BRETT));
  return onSnapshot(q, snapshot => {
    const posts = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as SchwarztesBrettPost))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    callback(posts);
  }, onError ?? console.error);
};

export const createSchwarztesBrettPost = async (
  data: Omit<SchwarztesBrettPost, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const ref = await addDocument(COLLECTIONS.SCHWARZES_BRETT, data);
    return ref.id;
  } catch (err: any) {
    console.warn('createSchwarztesBrettPost error (simulating):', err.message);
    return 'mock-post-' + Date.now();
  }
};

export const deleteSchwarztesBrettPost = async (postId: string): Promise<void> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, COLLECTIONS.SCHWARZES_BRETT, postId));
  } catch (err: any) {
    console.warn('deleteSchwarztesBrettPost error:', err.message);
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
