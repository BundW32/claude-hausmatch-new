import type { VercelRequest, VercelResponse } from '@vercel/node';

// Firebase Admin SDK — bypasses Firestore security rules
// Requires env vars: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
let adminReady = false;
let admin: any = null;

function initAdmin() {
  if (adminReady) return admin;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const firebaseAdmin = require('firebase-admin');
    if (firebaseAdmin.apps.length === 0) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    }
    admin = firebaseAdmin;
    adminReady = true;
    return admin;
  } catch (e) {
    console.error('[messages] firebase-admin init failed:', e);
    return null;
  }
}

function toSerializable(doc: any) {
  const data = doc.data();
  const ts = data.timestamp;
  return {
    id: doc.id,
    ...data,
    timestamp: ts
      ? { seconds: ts._seconds ?? ts.seconds ?? 0, nanoseconds: ts._nanoseconds ?? ts.nanoseconds ?? 0 }
      : null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Kein Autorisierungs-Token' });
  }
  const idToken = authHeader.slice(7);

  const a = initAdmin();
  if (!a) {
    return res.status(503).json({
      error: 'messaging_unavailable',
      details: 'Firebase Admin SDK nicht konfiguriert. Bitte Umgebungsvariablen in Vercel setzen.',
    });
  }

  let uid: string;
  try {
    const decoded = await a.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err: any) {
    console.error('[messages] Token-Verifikation fehlgeschlagen:', err.code, err.message);
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
  }

  const db = a.firestore();

  try {
    if (req.method === 'GET') {
      const [sentSnap, receivedSnap] = await Promise.all([
        db.collection('messages').where('senderId', '==', uid).orderBy('timestamp', 'desc').limit(300).get(),
        db.collection('messages').where('receiverId', '==', uid).orderBy('timestamp', 'desc').limit(300).get(),
      ]);

      return res.status(200).json({
        sent: sentSnap.docs.map(toSerializable),
        received: receivedSnap.docs.map(toSerializable),
      });
    }

    if (req.method === 'POST') {
      const { action, messageId } = req.body || {};
      if (action === 'markRead' && messageId) {
        const msgRef = db.collection('messages').doc(messageId);
        const msgDoc = await msgRef.get();
        if (msgDoc.exists && msgDoc.data()?.receiverId === uid) {
          await msgRef.update({ read: true });
        }
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'Ungültige Aktion' });
    }

    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  } catch (err: any) {
    console.error('[messages] Firestore-Fehler:', err.message);
    return res.status(500).json({ error: err.message || 'Interner Fehler' });
  }
}
