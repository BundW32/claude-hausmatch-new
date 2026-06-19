import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barth@bundwimmobilien.de';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';
const FIREBASE_PROJECT = 'hausmatch-1';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyC1o_LoqOxhmK4J0lhIzf8qcHABS7XNoY8';

async function sendEmail(apiKey: string, payload: object): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true };
  try {
    const body = await res.json();
    console.error('Resend error:', res.status, JSON.stringify(body));
  } catch (_) {
    console.error('Resend error (non-JSON):', res.status);
  }
  return { ok: false, error: 'E-Mail-Versand fehlgeschlagen.' };
}

async function saveToFirestore(data: {
  city: string; senderName: string; senderEmail: string;
  senderPhone: string; message: string; companies: { name: string; email?: string }[];
}): Promise<void> {
  const units = parseInt(data.message?.match(/\d+/)?.[0] || '0') || 0;
  const body = {
    fields: {
      city: { stringValue: data.city || '' },
      ownerName: { stringValue: data.senderName },
      ownerEmail: { stringValue: data.senderEmail },
      ownerPhone: { stringValue: data.senderPhone || '' },
      description: { stringValue: data.message || '' },
      units: { integerValue: String(units) },
      propertyType: { stringValue: 'WEG' },
      status: { stringValue: 'neu' },
      source: { stringValue: 'express-matching' },
      companiesRequested: {
        arrayValue: {
          values: data.companies.map(c => ({ stringValue: c.name }))
        }
      },
    },
  };
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/inquiries?key=${FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    console.error('Firestore save error:', res.status, await res.text());
  } else {
    console.log('Inquiry saved to Firestore');
  }
}

async function getAnonFirebaseToken(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true }),
      }
    );
    if (!res.ok) {
      console.error('Anonymous auth failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    console.log('Anonymous Firebase token obtained');
    return data.idToken || null;
  } catch (err) {
    console.error('Anonymous auth error:', err);
    return null;
  }
}

async function getManagersInCity(city: string): Promise<{ name: string; email: string }[]> {
  if (!city) return [];
  try {
    const token = await getAnonFirebaseToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const url = token
      ? `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users?pageSize=200`
      : `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users?key=${FIREBASE_API_KEY}&pageSize=200`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error('Firebase listDocuments error:', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const docs = data.documents || [];
    console.log(`Firebase returned ${docs.length} user documents`);
    const cityLower = city.toLowerCase().trim();
    const managers = docs
      .map((doc: any) => {
        const f = doc.fields || {};
        return {
          name: f.name?.stringValue || f.displayName?.stringValue || '',
          email: f.email?.stringValue || '',
          role: f.role?.stringValue || '',
          city: (f.city?.stringValue || f.location?.stringValue || '').toLowerCase().trim(),
        };
      })
      .filter((m: any) => {
        if (m.role !== 'manager' || !m.email) return false;
        const match = m.city.includes(cityLower) || cityLower.includes(m.city);
        console.log(`Manager ${m.name} (city: "${m.city}") vs "${cityLower}": ${match ? 'MATCH' : 'no match'}`);
        return match;
      })
      .map((m: any) => ({ name: m.name, email: m.email }));
    console.log(`Found ${managers.length} matching managers in ${city}`);
    return managers;
  } catch (err) {
    console.error('getManagersInCity error:', err);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY fehlt');
    return res.status(500).json({ error: 'E-Mail-Dienst nicht konfiguriert.' });
  }

  const { senderName, senderEmail, senderPhone, message, city, companies } = req.body || {};

  if (!senderName || !senderEmail) {
    return res.status(400).json({ error: 'Name und E-Mail sind erforderlich.' });
  }

  const companyList =
    Array.isArray(companies) && companies.length > 0
      ? companies.map((c: { name: string }) => c.name).join(', ')
      : 'Keine Unternehmen ausgewählt';

  // E-Mail 1: Admin-Benachrichtigung
  const adminResult = await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: [ADMIN_EMAIL],
    reply_to: senderEmail,
    subject: `Neue Express-Matching Anfrage – ${city || 'unbekannte Stadt'}`,
    text: `Neue Express-Matching Anfrage\n\nVon: ${senderName}\nE-Mail: ${senderEmail}\nTelefon: ${senderPhone || 'nicht angegeben'}\nStadt: ${city || 'nicht angegeben'}\n\nNachricht:\n${message || '(keine Nachricht)'}\n\nAngefragte Unternehmen: ${companyList}`,
  });

  if (!adminResult.ok) {
    return res.status(500).json({ error: 'Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.' });
  }

  // Firestore: Anfrage speichern (non-blocking)
  saveToFirestore({ city, senderName, senderEmail, senderPhone: senderPhone || '', message: message || '', companies: Array.isArray(companies) ? companies : [] })
    .catch(err => console.error('Firestore save failed:', err));

  // E-Mail 2: Bestätigung an Interessent
  await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: [senderEmail],
    subject: 'Ihre Anfrage bei HausMatch wurde empfangen',
    text: `Hallo ${senderName},\n\nvielen Dank für Ihre Anfrage bei HausMatch.\n\nWir haben Ihre Anfrage für folgende Unternehmen in ${city || 'Ihrer Stadt'} erhalten: ${companyList}\n\nWir werden uns in Kürze bei Ihnen melden.\n\nMit freundlichen Grüßen,\nIhr HausMatch-Team`,
  });

  // E-Mail 3: Verwalter-Benachrichtigung
  const einheiten = message?.match(/\d+/)?.[0]
    ? message.match(/\d+/)![0] + ' Einheiten'
    : 'eine WEG';

  // Registrierte Verwalter in der Stadt aus Firebase laden
  const registeredManagers = await getManagersInCity(city || '');

  // Unternehmen aus dem Formular mit E-Mail-Adresse
  const formCompaniesWithEmail = Array.isArray(companies)
    ? companies.filter((c: { email?: string }) => !!c.email)
    : [];

  // Alle Empfänger kombinieren (ohne Duplikate)
  const seenEmails = new Set<string>();
  const allManagers: { name: string; email: string }[] = [];
  for (const m of [...registeredManagers, ...formCompaniesWithEmail]) {
    if (m.email && !seenEmails.has(m.email)) {
      seenEmails.add(m.email);
      allManagers.push({ name: m.name || '', email: m.email });
    }
  }

  console.log(`Sending Verwalter emails to ${allManagers.length} managers (registered: ${registeredManagers.length}, form: ${formCompaniesWithEmail.length})`);

  for (const manager of allManagers) {
    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [manager.email],
      subject: `Neue WEG-Anfrage in ${city || 'Ihrer Region'} – ${einheiten}`,
      text: `Guten Tag${manager.name ? ' ' + manager.name : ''},\n\nüber das HausMatch Express-Matching ist eine neue Anfrage für die WEG-Verwaltung eingegangen:\n\nStadt: ${city || 'nicht angegeben'}\nUmfang: ${einheiten}\n\nUm die Kontaktdaten des Interessenten zu erhalten, melden Sie sich bitte in Ihrem HausMatch-Account an:\n\nhttps://www.haus-match.de/#/register\n\nNach der Anmeldung finden Sie die Anfrage direkt in Ihrem Lead Center.\n\nMit freundlichen Grüßen,\nIhr HausMatch-Team`,
    });
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
