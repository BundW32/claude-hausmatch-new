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
    const err = await res.text();
    console.error('Firestore save error:', res.status, err);
  } else {
    console.log('Inquiry saved to Firestore');
  }
}

// Fetch all registered managers in the given city from Firebase
async function getManagersInCity(city: string): Promise<{ name: string; email: string }[]> {
  if (!city) return [];
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'users' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'role' },
          op: 'EQUAL',
          value: { stringValue: 'manager' },
        },
      },
      limit: 100,
    },
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    const cityLower = city.toLowerCase().trim();
    return data
      .filter(item => item.document?.fields)
      .map(item => {
        const f = item.document.fields;
        return {
          name: f.name?.stringValue || '',
          email: f.email?.stringValue || '',
          city: (f.city?.stringValue || f.location?.stringValue || '').toLowerCase().trim(),
        };
      })
      .filter(m => m.email && (m.city.includes(cityLower) || cityLower.includes(m.city)))
      .map(m => ({ name: m.name, email: m.email }));
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

  // E-Mail 1: Admin-Benachrichtigung (kritisch)
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

  // Firestore: Anfrage speichern (optional)
  saveToFirestore({
    city,
    senderName,
    senderEmail,
    senderPhone: senderPhone || '',
    message: message || '',
    companies: Array.isArray(companies) ? companies : [],
  }).catch(err => console.error('Firestore save failed:', err));

  // E-Mail 2: Bestätigung an Interessent (optional)
  await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: [senderEmail],
    subject: 'Ihre Anfrage bei HausMatch wurde empfangen',
    text: `Hallo ${senderName},\n\nvielen Dank für Ihre Anfrage bei HausMatch.\n\nWir haben Ihre Anfrage für folgende Unternehmen in ${city || 'Ihrer Stadt'} erhalten: ${companyList}\n\nWir werden uns in Kürze bei Ihnen melden.\n\nMit freundlichen Grüßen,\nIhr HausMatch-Team`,
  });

  // E-Mail 3: An registrierte Verwalter in der Stadt (aus Firebase) + companies mit E-Mail
  const einheiten = message?.match(/\d+/)?.[0]
    ? message.match(/\d+/)![0] + ' Einheiten'
    : 'eine WEG';

  // Aus Firebase: registrierte Manager in der Stadt
  const firebaseManagers = await getManagersInCity(city || '');

  // Aus dem Formular: companies mit bekannter E-Mail (z.B. aus Gemini-Suche)
  const formCompanies: { name: string; email: string }[] = Array.isArray(companies)
    ? companies.filter((c: { email?: string }) => !!c.email).map((c: { name: string; email: string }) => ({ name: c.name, email: c.email }))
    : [];

  // Kombinieren und deduplizieren
  const emailSet = new Set<string>();
  const allManagers: { name: string; email: string }[] = [];
  for (const m of [...firebaseManagers, ...formCompanies]) {
    if (!emailSet.has(m.email.toLowerCase())) {
      emailSet.add(m.email.toLowerCase());
      allManagers.push(m);
    }
  }

  console.log(`Sending Verwalter email to ${allManagers.length} managers in ${city}`);

  for (const manager of allManagers) {
    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [manager.email],
      subject: `Neue Anfrage über HausMatch – ${city || 'Ihre Region'}`,
      text: `Guten Tag${manager.name ? ' ' + manager.name : ''},\n\nein Eigentümer sucht eine WEG-Verwaltung in ${city || 'Ihrer Region'} für ${einheiten}.\n\nUm Ihr Angebot abzugeben und die Kontaktdaten des Eigentümers zu erhalten, melden Sie sich bitte an auf:\n\nhttps://www.haus-match.de/#/register\n\nNach der Anmeldung sehen Sie die Anfrage direkt in Ihrem Dashboard.\n\nMit freundlichen Grüßen,\nIhr HausMatch-Team`,
    });
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
