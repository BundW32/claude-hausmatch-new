import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_cors';

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

// ─── HTML Email Templates ──────────────────────────────────────────────────────

const css = `
  body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07)}
  .hdr{background:#2563eb;padding:36px 48px}
  .logo{font-size:22px;font-weight:900;color:#fff;letter-spacing:-.5px}
  .logo span{color:#bfdbfe}
  .body{padding:48px}
  .badge{display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;margin-bottom:20px}
  h1{font-size:24px;font-weight:800;color:#0f172a;margin:0 0 12px}
  .intro{font-size:15px;color:#475569;line-height:1.7;margin:0 0 32px}
  .lbl{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin:0 0 12px}
  .list{background:#f8fafc;border-radius:16px;padding:8px 24px;margin:0 0 32px}
  .row{padding:12px 0;border-bottom:1px solid #e2e8f0;display:flex;align-items:flex-start;gap:12px}
  .row:last-child{border-bottom:none}
  .dot{width:8px;height:8px;background:#2563eb;border-radius:50%;flex-shrink:0;margin-top:5px}
  .rname{font-weight:700;color:#1e293b;font-size:15px}
  .rmeta{font-size:13px;color:#94a3b8;margin-top:2px}
  .drow{padding:10px 0;border-bottom:1px solid #e2e8f0;display:flex;gap:16px;font-size:14px}
  .drow:last-child{border-bottom:none}
  .dlbl{color:#94a3b8;font-weight:700;width:80px;flex-shrink:0}
  .dval{color:#1e293b;font-weight:600}
  .box{background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 32px}
  .box p{margin:0;font-size:14px;color:#1e40af;line-height:1.6;font-weight:500}
  .cta{display:block;background:#2563eb;color:#fff!important;text-align:center;padding:16px 32px;border-radius:14px;font-weight:900;font-size:15px;text-decoration:none;margin:32px 0}
  .ftr{background:#f8fafc;padding:28px 48px;border-top:1px solid #e2e8f0}
  .fname{font-weight:800;color:#0f172a;font-size:15px;margin:0 0 4px}
  .frole{font-size:13px;color:#64748b;margin:0 0 10px}
  .flinks{font-size:13px;color:#94a3b8}
  .flinks a{color:#2563eb;text-decoration:none;font-weight:600}
`;

const ownerHtml = (
  name: string, email: string, city: string,
  companies: { name: string; address?: string; phone?: string }[]
) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="wrap">
  <div class="hdr"><div class="logo">Haus<span>Match</span></div></div>
  <div class="body">
    <span class="badge">Express-Matching</span>
    <h1>Ihre Anfrage ist eingegangen, ${name.split(' ')[0]}!</h1>
    <p class="intro">Wir haben <strong>${companies.length} Hausverwaltung${companies.length !== 1 ? 'en' : ''}</strong> in <strong>${city}</strong> diskret um ein Angebot gebeten. Sobald eine Verwaltung Ihr Projekt im HausMatch Lead Center annimmt, erhalten Sie das Angebot direkt über HausMatch an <strong>${email}</strong>.</p>
    <p class="lbl">Kontaktierte Hausverwaltungen</p>
    <div class="list">
      ${companies.map(c => `<div class="row"><div class="dot"></div><div><div class="rname">${c.name}</div>${c.address || c.phone ? `<div class="rmeta">${[c.address, c.phone].filter(Boolean).join(' · ')}</div>` : ''}</div></div>`).join('')}
    </div>
    <div class="box"><p>💡 <strong>Wie geht es weiter?</strong><br>Die Verwaltungen sehen zunächst nur die groben Eckdaten Ihres Objekts. Erst wenn sie im Lead Center ein Angebot abgeben, werden Ihre Kontaktdaten benötigt — so bleiben Sie geschützt.</p></div>
  </div>
  <div class="ftr">
    <p class="fname">Ihr HausMatch-Team</p>
    <p class="frole">Ihr Partner für die perfekte Hausverwaltung</p>
    <p class="flinks"><a href="https://haus-match.de">haus-match.de</a> &nbsp;·&nbsp; <a href="mailto:barth@bundwimmobilien.de">barth@bundwimmobilien.de</a></p>
  </div>
</div></body></html>`;

// Manager-Email: NUR grobe Daten (Stadt, Einheiten, Objektart) + Link ins Lead Center.
// Keine Eigentümer-Kontaktdaten, kein mailto. Der CTA unterscheidet registriert/eingeladen.
const managerHtml = (
  city: string, einheiten: string, propertyType: string,
  ctaUrl: string, ctaLabel: string, registered: boolean
) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="wrap">
  <div class="hdr"><div class="logo">Haus<span>Match</span></div></div>
  <div class="body">
    <span class="badge">Neue Angebotsanfrage</span>
    <h1>Ein Eigentümer sucht eine Hausverwaltung in ${city}</h1>
    <p class="intro">Über <strong>HausMatch</strong> ist eine neue Anfrage für Sie eingegangen. Hier die groben Eckdaten — die vollständigen Details und die Möglichkeit, ein Angebot abzugeben, finden Sie im Lead Center.</p>
    <p class="lbl">Eckdaten der Anfrage</p>
    <div class="list">
      <div class="drow"><span class="dlbl">Region</span><span class="dval">${city}</span></div>
      <div class="drow"><span class="dlbl">Einheiten</span><span class="dval">${einheiten}</span></div>
      <div class="drow"><span class="dlbl">Objektart</span><span class="dval">${propertyType}</span></div>
    </div>
    <div class="box"><p>${registered
      ? '🔒 <strong>Diskret & geschützt:</strong> Die Kontaktdaten des Eigentümers sehen Sie erst, wenn Sie im Lead Center ein Angebot abgeben.'
      : '✨ <strong>Sie sind noch nicht registriert.</strong> Registrieren Sie sich kostenlos per Magic-Link — danach liegt diese Anfrage direkt in Ihrem Lead Center.'}</p></div>
    <a class="cta" href="${ctaUrl}">${ctaLabel}</a>
    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0">Angebote geben Sie ausschließlich über das HausMatch Lead Center ab.</p>
  </div>
  <div class="ftr">
    <p class="fname">HausMatch-Team</p>
    <p class="frole">Die Plattform für professionelle Hausverwaltungen</p>
    <p class="flinks"><a href="https://haus-match.de">haus-match.de</a></p>
  </div>
</div></body></html>`;

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

  const { senderName, senderEmail, senderPhone, message, city, companies } = req.body || {};

  if (!senderName || !senderEmail) {
    return res.status(400).json({ error: 'Name und E-Mail sind erforderlich.' });
  }

  const companyArr: { name: string; address?: string; phone?: string; email?: string }[] =
    Array.isArray(companies) ? companies : [];
  const note = message?.trim() || '';
  const einheiten = note.match(/\d+/)?.[0] ? note.match(/\d+/)![0] + ' Einheiten' : 'eine WEG';
  const propertyType = 'WEG';
  const companyNames = companyArr.length > 0 ? companyArr.map(c => c.name).join(', ') : 'Keine Unternehmen ausgewählt';

  // E-Mail 1: Admin-Benachrichtigung (plain text reicht für intern)
  const adminResult = await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: [ADMIN_EMAIL],
    reply_to: senderEmail,
    subject: `Neue Express-Matching Anfrage – ${city || 'unbekannte Stadt'}`,
    text: `Neue Express-Matching Anfrage\n\nVon: ${senderName}\nE-Mail: ${senderEmail}\nTelefon: ${senderPhone || 'nicht angegeben'}\nStadt: ${city || 'nicht angegeben'}\n\nNachricht:\n${note || '(keine Nachricht)'}\n\nAngefragte Unternehmen: ${companyNames}`,
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
      html: ownerHtml(senderName, senderEmail, city || 'Ihrer Region', companyArr),
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
      html: managerHtml(city || 'nicht angegeben', einheiten, propertyType, ctaUrl, ctaLabel, registered),
    });
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
