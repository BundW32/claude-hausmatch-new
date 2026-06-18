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
      city:          { stringValue: data.city || '' },
      ownerName:     { stringValue: data.senderName },
      ownerEmail:    { stringValue: data.senderEmail },
      ownerPhone:    { stringValue: data.senderPhone || '' },
      description:   { stringValue: data.message || '' },
      units:         { integerValue: String(units) },
      propertyType:  { stringValue: 'WEG' },
      status:        { stringValue: 'neu' },
      source:        { stringValue: 'express-matching' },
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

  // Firestore: Anfrage speichern (optional, Fehler werden nur geloggt)
  saveToFirestore({ city, senderName, senderEmail, senderPhone: senderPhone || '', message: message || '', companies: Array.isArray(companies) ? companies : [] })
    .catch(err => console.error('Firestore save failed:', err));

  // E-Mail 2: Bestätigung an Interessent (optional)
  await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: [senderEmail],
    subject: 'Ihre Anfrage bei HausMatch wurde empfangen',
    text: `Hallo ${senderName},\n\nvielen Dank für Ihre Anfrage bei HausMatch.\n\nWir haben Ihre Anfrage für folgende Unternehmen in ${city || 'Ihrer Stadt'} erhalten: ${companyList}\n\nWir werden uns in Kürze bei Ihnen melden.\n\nMit freundlichen Grüßen,\nIhr HausMatch-Team`,
  });

  // E-Mail 3: An Verwalter – ohne Kontaktdaten, mit Registrierungsaufforderung (optional)
  if (Array.isArray(companies)) {
    const einheiten = message?.match(/\d+/)?.[0] ? message.match(/\d+/)[0] + ' Einheiten' : 'eine WEG';
    for (const company of companies.filter((c: { email?: string }) => !!c.email)) {
      await sendEmail(apiKey, {
        from: FROM_EMAIL,
        to: [company.email],
        subject: `Neue Anfrage über HausMatch – ${city || 'Ihre Region'}`,
        text: `Guten Tag,\n\nein Interessent sucht eine WEG-Verwaltung in ${city || 'Ihrer Region'} für ${einheiten}.\n\nUm Ihr Angebot abzugeben und die Kontaktdaten des Interessenten zu erhalten, registrieren Sie sich bitte kostenlos auf:\n\nhttps://www.haus-match.de/#/register\n\nNach der Registrierung können Sie direkt mit dem Interessenten in Kontakt treten.\n\nMit freundlichen Grüßen,\nIhr HausMatch-Team`,
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
