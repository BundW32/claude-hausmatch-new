import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_cors';
import { resolveGewerk, ownerHtml, managerHtml } from './_emailTemplates';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barth@bundwimmobilien.de';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';
const FIREBASE_PROJECT = 'hausmatch-1';
// Kein hardcodierter Fallback: der Key kommt ausschließlich aus der Umgebung.
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || '';
// Basis-URL der App (HashRouter -> Routen mit /#/...). haus-match.de ist die offizielle Domain.
// Per Env (APP_URL) überschreibbar.
const APP_URL = (process.env.APP_URL || 'https://haus-match.de').replace(/\/$/, '');

async function sendEmail(apiKey: string, payload: object): Promise<{ ok: boolean; error?: string }> {
  // In Resend test mode, RESEND_TEST_EMAIL overrides all TO addresses
  const testEmail = process.env.RESEND_TEST_EMAIL;
  const p = testEmail ? { ...(payload as any), to: [testEmail] } : payload;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify(p),
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
  senderPhone: string; message: string;
  companies: { name: string; email?: string }[];
  managerEmails: string[];
}): Promise<void> {
  if (!FIREBASE_API_KEY) { console.error('FIREBASE_API_KEY fehlt — Inquiry wird nicht gespeichert.'); return; }
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
        arrayValue: { values: data.companies.map(c => ({ stringValue: c.name })) }
      },
      // Angeschriebene Verwalter-Emails (lowercase). Damit das Lead Center auch
      // gezielt angeschriebene (nach Registrierung) Verwalter den Lead zeigen kann.
      managerEmails: {
        arrayValue: { values: data.managerEmails.map(e => ({ stringValue: e })) }
      },
    },
  };
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/inquiries?key=${FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) console.error('Firestore save error:', res.status, await res.text());
  else console.log('Inquiry saved to Firestore');
}

async function getAnonFirebaseToken(): Promise<string | null> {
  if (!FIREBASE_API_KEY) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) }
    );
    if (!res.ok) { console.error('Anonymous auth failed:', res.status, await res.text()); return null; }
    const data = await res.json();
    return data.idToken || null;
  } catch (err) {
    console.error('Anonymous auth error:', err);
    return null;
  }
}

type UserRow = { name: string; email: string; role: string; city: string };

// Lädt alle Nutzer einmal und liefert sie als normalisierte Liste zurück.
async function listUsers(): Promise<UserRow[]> {
  try {
    const token = await getAnonFirebaseToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const url = token
      ? `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users?pageSize=300`
      : `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users?key=${FIREBASE_API_KEY}&pageSize=300`;
    const res = await fetch(url, { headers });
    if (!res.ok) { console.error('Firebase listDocuments error:', res.status, await res.text()); return []; }
    const data = await res.json();
    const docs = data.documents || [];
    return docs.map((doc: any) => {
      const f = doc.fields || {};
      return {
        name: f.name?.stringValue || f.displayName?.stringValue || '',
        email: (f.email?.stringValue || '').toLowerCase().trim(),
        role: f.role?.stringValue || '',
        city: (f.city?.stringValue || f.location?.stringValue || '').toLowerCase().trim(),
      };
    });
  } catch (err) {
    console.error('listUsers error:', err);
    return [];
  }
}

function managersInCity(users: UserRow[], city: string): { name: string; email: string }[] {
  if (!city) return [];
  const cityLower = city.toLowerCase().trim();
  return users
    .filter(m => m.role === 'manager' && m.email && (m.city.includes(cityLower) || cityLower.includes(m.city)))
    .map(m => ({ name: m.name, email: m.email }));
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY fehlt');
    return res.status(500).json({ error: 'E-Mail-Dienst nicht konfiguriert.' });
  }

  const { senderName, senderEmail, senderPhone, message, city, companies, serviceType } = req.body || {};

  if (!senderName || !senderEmail) {
    return res.status(400).json({ error: 'Name und E-Mail sind erforderlich.' });
  }

  // Gewerk bestimmen (z. B. hausverwaltung, makler, anwalt …); Fallback Hausverwaltung.
  const gewerk = resolveGewerk(serviceType);

  const companyArr: { name: string; address?: string; phone?: string; email?: string }[] =
    Array.isArray(companies) ? companies : [];
  const note = message?.trim() || '';
  const einheiten = note.match(/\d+/)?.[0] ? note.match(/\d+/)![0] + ' Einheiten' : 'eine WEG';
  const propertyType = 'WEG';
  const companyNames = companyArr.length > 0 ? companyArr.map(c => c.name).join(', ') : `Keine ${gewerk.labelPlural} ausgewählt`;

  // E-Mail 1: Admin-Benachrichtigung (plain text reicht für intern)
  const adminResult = await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: [ADMIN_EMAIL],
    reply_to: senderEmail,
    subject: `Neue Anfrage (${gewerk.labelSing}) – ${city || 'unbekannte Stadt'}`,
    text: `Neue Express-Matching Anfrage\n\nGewerk: ${gewerk.labelSing}\nVon: ${senderName}\nE-Mail: ${senderEmail}\nTelefon: ${senderPhone || 'nicht angegeben'}\nStadt: ${city || 'nicht angegeben'}\n\nNachricht:\n${note || '(keine Nachricht)'}\n\nAngefragte ${gewerk.labelPlural}: ${companyNames}`,
  });

  if (!adminResult.ok) {
    return res.status(500).json({ error: 'Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.' });
  }

  // Empfänger bestimmen: registrierte Verwalter der Stadt + im Formular gewählte Firmen mit Email.
  const users = await listUsers();
  const registeredEmails = new Set(users.filter(u => u.email).map(u => u.email));
  const registeredManagers = managersInCity(users, city || '');
  const formCompaniesWithEmail = companyArr
    .filter(c => !!c.email)
    .map(c => ({ name: c.name || '', email: (c.email as string).toLowerCase().trim() }));

  const seenEmails = new Set<string>();
  const allManagers: { name: string; email: string }[] = [];
  for (const m of [...registeredManagers, ...formCompaniesWithEmail]) {
    if (m.email && !seenEmails.has(m.email)) {
      seenEmails.add(m.email);
      allManagers.push({ name: m.name || '', email: m.email });
    }
  }

  // Firestore: Anfrage speichern inkl. angeschriebener Verwalter-Emails (non-blocking)
  saveToFirestore({
    city, senderName, senderEmail, senderPhone: senderPhone || '', message: note,
    companies: companyArr, managerEmails: allManagers.map(m => m.email),
  }).catch(err => console.error('Firestore save failed:', err));

  // ─── LAUNCH-SCHALTER (bewusst hartkodiert) ───────────────────────────────────
  // false  = E-Mails gehen NUR an @bundwimmobilien.de (sicherer Vor-Launch-/Testbetrieb).
  // true   = E-Mails gehen an ALLE Empfänger (externe Verwalter etc.).
  // Erst auf true setzen, wenn die Resend-Domain haus-match.de verifiziert UND
  // RESEND_FROM_EMAIL auf z.B. "HausMatch <noreply@haus-match.de>" gesetzt ist.
  const ALLOW_EXTERNAL_EMAILS = false;
  const isAllowed = (email: string) => ALLOW_EXTERNAL_EMAILS || email.toLowerCase().endsWith('@bundwimmobilien.de');

  // E-Mail 2: Bestätigung an Eigentümer (nur wenn @bundwimmobilien.de in Test)
  if (isAllowed(senderEmail)) {
    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [senderEmail],
      subject: `Ihre Angebotsanfrage in ${city || 'Ihrer Region'} – HausMatch`,
      html: ownerHtml(gewerk, senderName, senderEmail, city || 'Ihrer Region', companyArr),
    });
  } else {
    console.log(`Bestätigungs-Mail an ${senderEmail} übersprungen (kein @bundwimmobilien.de)`);
  }

  // E-Mail 3: Angebotsanfrage an Verwalter — grobe Daten + Lead-Center-Link.
  const allowedManagers = allManagers.filter(m => isAllowed(m.email));
  console.log(`Manager-Mails: ${allManagers.length} gesamt, ${allowedManagers.length} erlaubt`);

  const cityParam = encodeURIComponent(city || '');
  for (const manager of allowedManagers) {
    const registered = registeredEmails.has(manager.email);
    const ctaUrl = registered
      ? `${APP_URL}/#/login`
      : `${APP_URL}/#/einladung?email=${encodeURIComponent(manager.email)}&city=${cityParam}&company=${encodeURIComponent(manager.name || '')}`;
    const ctaLabel = registered ? 'Im Lead Center ansehen →' : 'Jetzt registrieren & Anfrage ansehen →';
    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [manager.email],
      subject: registered
        ? `Neue Anfrage in ${city || 'Ihrer Region'} – im Lead Center ansehen`
        : `Neue Anfrage über HausMatch – ${city || 'Ihrer Region'}`,
      html: managerHtml(gewerk, city || 'nicht angegeben', einheiten, propertyType, ctaUrl, ctaLabel, registered),
    });
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
