import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_cors';
import { resolveGewerk, ownerHtml, managerHtml } from './_emailTemplates';
import { inquiryTokenConfigured, normalizeEmail, verifyCompanyEmail } from './_inquiryToken';
import { allowRequest, clientIp, todayKey } from './_ratelimit';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barth@bundwimmobilien.de';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';
const FIREBASE_PROJECT = 'hausmatch-1';
// Kein hardcodierter Fallback: der Key kommt ausschließlich aus der Umgebung.
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || '';
// Basis-URL der App (HashRouter -> Routen mit /#/...). haus-match.de ist die offizielle Domain.
// Per Env (APP_URL) überschreibbar.
const APP_URL = (process.env.APP_URL || 'https://haus-match.de').replace(/\/$/, '');

// ─── Grenzen (Sicherheitsbericht 23.10.2026, H-09) ─────────────────────────────
// Der Endpunkt steht ohne Anmeldung offen und löst Mails mit HausMatch-Absender
// aus. Deshalb: wenige Anfragen je IP, ein Tageskontingent, höchstens zehn
// Empfänger je Anfrage, und jede Empfängeradresse muss nachweislich aus der
// eigenen Suche oder aus der eigenen Nutzerdatenbank stammen.
const IP_LIMIT_PER_HOUR = Number(process.env.INQUIRY_IP_LIMIT_PER_HOUR) || 5;
const DAILY_LIMIT = Number(process.env.INQUIRY_DAILY_LIMIT) || 300;
const MAX_COMPANIES = 10;
const EMAIL_RE = /^[^\s@<>"',;]{1,64}@[^\s@<>"',;]{1,255}\.[a-zA-Z]{2,}$/;

/** Freitext ohne Steuerzeichen und auf eine Länge gekappt. */
function cleanText(v: unknown, max: number): string {
  return String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
}

function isEmail(v: string): boolean {
  return v.length <= 254 && EMAIL_RE.test(v);
}

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
  if (!FIREBASE_API_KEY) { console.error('FIREBASE_API_KEY fehlt, Inquiry wird nicht gespeichert.'); return; }
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

type CompanyInput = { name: string; address?: string; phone?: string; email?: string; token?: string };

/** Firmenliste aus dem Request bereinigen: feste Längen, höchstens MAX_COMPANIES. */
function cleanCompanies(raw: unknown): CompanyInput[] {
  if (!Array.isArray(raw)) return [];
  const out: CompanyInput[] = [];
  for (const c of raw.slice(0, MAX_COMPANIES)) {
    if (!c || typeof c !== 'object') continue;
    const name = cleanText((c as any).name, 120);
    if (!name) continue;
    const email = normalizeEmail((c as any).email);
    out.push({
      name,
      address: cleanText((c as any).address, 200) || undefined,
      phone: cleanText((c as any).phone, 50) || undefined,
      email: email && isEmail(email) ? email : undefined,
      token: typeof (c as any).token === 'string' ? (c as any).token : undefined,
    });
  }
  return out;
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

  // Grenze je IP, bevor irgendetwas gelesen oder verschickt wird.
  const ip = clientIp(req);
  if (!(await allowRequest('inquiry_ip', ip, IP_LIMIT_PER_HOUR, 3600))) {
    return res.status(429).json({ error: 'Zu viele Anfragen. Bitte versuchen Sie es in einer Stunde erneut.' });
  }

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const senderName = cleanText(body.senderName, 120);
  const senderEmail = normalizeEmail(body.senderEmail);
  const senderPhone = cleanText(body.senderPhone, 50);
  const note = cleanText(body.message, 3000);
  const city = cleanText(body.city, 100);

  if (!senderName || !senderEmail) {
    return res.status(400).json({ error: 'Name und E-Mail sind erforderlich.' });
  }
  if (!isEmail(senderEmail)) {
    return res.status(400).json({ error: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' });
  }

  // Tageskontingent: schützt Resend-Guthaben und Ruf der Absenderdomain.
  if (!(await allowRequest('inquiry_day', todayKey(), DAILY_LIMIT, 86400))) {
    console.error('Tageskontingent für Express-Matching erschöpft.');
    return res.status(429).json({ error: 'Das Tageskontingent ist erschöpft. Bitte versuchen Sie es morgen erneut.' });
  }

  // Gewerk bestimmen (z. B. hausverwaltung, makler, anwalt …); Fallback Hausverwaltung.
  const gewerk = resolveGewerk(cleanText(body.serviceType, 40));

  const companyArr = cleanCompanies(body.companies);
  const einheiten = note.match(/\d+/)?.[0] ? note.match(/\d+/)![0] + ' Einheiten' : 'eine WEG';
  const propertyType = 'WEG';
  const companyNames = companyArr.length > 0 ? companyArr.map(c => c.name).join(', ') : `Keine ${gewerk.labelPlural} ausgewählt`;

  // E-Mail 1: Admin-Benachrichtigung (plain text reicht für intern)
  const adminResult = await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: [ADMIN_EMAIL],
    reply_to: senderEmail,
    subject: `Neue Anfrage (${gewerk.labelSing}): ${city || 'unbekannte Stadt'}`,
    text: `Neue Express-Matching Anfrage\n\nGewerk: ${gewerk.labelSing}\nVon: ${senderName}\nE-Mail: ${senderEmail}\nTelefon: ${senderPhone || 'nicht angegeben'}\nStadt: ${city || 'nicht angegeben'}\nIP: ${ip}\n\nNachricht:\n${note || '(keine Nachricht)'}\n\nAngefragte ${gewerk.labelPlural}: ${companyNames}`,
  });

  if (!adminResult.ok) {
    return res.status(500).json({ error: 'Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.' });
  }

  // Empfänger bestimmen. Drei Quellen, und nur diese:
  //   1. registrierte Verwalter der Stadt (aus der eigenen Nutzerdatenbank),
  //   2. im Formular gewählte Netzwerk-Partner — ihre Adresse muss zu einem
  //      registrierten Nutzer gehören,
  //   3. im Formular gewählte Firmen aus der Live-Suche — ihre Adresse muss das
  //      Token tragen, das /api/search dafür ausgestellt hat.
  // Alles andere wird verworfen und protokolliert. Vorher reichte jede
  // beliebige Adresse im Request, um eine Mail auszulösen (H-09).
  const users = await listUsers();
  const registeredEmails = new Set(users.filter(u => u.email).map(u => u.email));
  const registeredManagers = managersInCity(users, city);
  const tokenAktiv = inquiryTokenConfigured();
  if (!tokenAktiv) {
    console.error('INQUIRY_SIGNING_SECRET fehlt oder ist zu kurz: Firmen aus der Live-Suche werden nicht angeschrieben.');
  }
  let verworfen = 0;
  const formCompaniesWithEmail: { name: string; email: string }[] = [];
  for (const c of companyArr) {
    if (!c.email) continue;
    const erlaubt = registeredEmails.has(c.email) || (tokenAktiv && verifyCompanyEmail(c.email, c.token));
    if (erlaubt) formCompaniesWithEmail.push({ name: c.name, email: c.email });
    else verworfen += 1;
  }
  if (verworfen > 0) {
    console.warn(`Express-Matching: ${verworfen} Empfängeradresse(n) ohne gültiges Token verworfen (IP ${ip}).`);
  }

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
    city, senderName, senderEmail, senderPhone, message: note,
    companies: companyArr, managerEmails: allManagers.map(m => m.email),
  }).catch(err => console.error('Firestore save failed:', err));

  // ─── LAUNCH-SCHALTER (per Vercel-Umgebungsvariable) ──────────────────────────
  // Standard = false: E-Mails gehen NUR an @bundwimmobilien.de (sicherer
  //   Vor-Launch-/Testbetrieb), auch wenn die Variable fehlt.
  // ALLOW_EXTERNAL_EMAILS=true in Vercel setzen, damit an ALLE Empfänger
  //   (externe Eigentümer & Verwalter) gesendet wird. Voraussetzung: die
  //   Resend-Domain (z. B. haus-match.de) ist verifiziert UND RESEND_FROM_EMAIL
  //   ist auf eine Adresse dieser Domain gesetzt (z. B. "HausMatch <noreply@haus-match.de>").
  const ALLOW_EXTERNAL_EMAILS = process.env.ALLOW_EXTERNAL_EMAILS === 'true';
  const isAllowed = (email: string) => ALLOW_EXTERNAL_EMAILS || email.toLowerCase().endsWith('@bundwimmobilien.de');

  // E-Mail 2: Bestätigung an Eigentümer (nur wenn @bundwimmobilien.de in Test).
  // Je Absenderadresse höchstens drei Bestätigungen pro Stunde — sonst wäre
  // dieser Weg ein Versandwerkzeug für fremde Postfächer.
  if (isAllowed(senderEmail) && (await allowRequest('inquiry_sender', senderEmail, 3, 3600))) {
    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [senderEmail],
      subject: `Ihre Angebotsanfrage in ${city || 'Ihrer Region'} bei HausMatch`,
      html: ownerHtml(gewerk, senderName, senderEmail, city || 'Ihrer Region', companyArr),
    });
  } else {
    console.log(`Bestätigungs-Mail an ${senderEmail} übersprungen (Testbetrieb oder Limit).`);
  }

  // E-Mail 3: Angebotsanfrage an Verwalter, grobe Daten + Lead-Center-Link.
  const allowedManagers = allManagers.filter(m => isAllowed(m.email));
  console.log(`Manager-Mails: ${allManagers.length} gesamt, ${allowedManagers.length} erlaubt`);

  const cityParam = encodeURIComponent(city || '');
  for (const manager of allowedManagers) {
    const registered = registeredEmails.has(manager.email);
    const ctaUrl = registered
      ? `${APP_URL}/#/login`
      : `${APP_URL}/#/einladung?email=${encodeURIComponent(manager.email)}&city=${cityParam}&company=${encodeURIComponent(manager.name || '')}&type=${encodeURIComponent(gewerk.key)}`;
    const ctaLabel = registered ? 'Im Lead Center ansehen →' : 'Jetzt registrieren & Anfrage ansehen →';
    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [manager.email],
      subject: registered
        ? `Neue Anfrage in ${city || 'Ihrer Region'}: jetzt im Lead Center ansehen`
        : `Neue Anfrage über HausMatch aus ${city || 'Ihrer Region'}`,
      html: managerHtml(gewerk, city || 'nicht angegeben', einheiten, propertyType, ctaUrl, ctaLabel, registered),
    });
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
