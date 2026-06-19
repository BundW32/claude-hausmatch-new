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
        arrayValue: { values: data.companies.map(c => ({ stringValue: c.name })) }
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

async function getManagersInCity(city: string): Promise<{ name: string; email: string }[]> {
  if (!city) return [];
  try {
    const token = await getAnonFirebaseToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const url = token
      ? `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users?pageSize=200`
      : `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users?key=${FIREBASE_API_KEY}&pageSize=200`;
    const res = await fetch(url, { headers });
    if (!res.ok) { console.error('Firebase listDocuments error:', res.status, await res.text()); return []; }
    const data = await res.json();
    const docs = data.documents || [];
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
        return m.city.includes(cityLower) || cityLower.includes(m.city);
      })
      .map((m: any) => ({ name: m.name, email: m.email }));
    console.log(`Found ${managers.length} matching managers in ${city}`);
    return managers;
  } catch (err) {
    console.error('getManagersInCity error:', err);
    return [];
  }
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
    <p class="intro">Wir haben <strong>${companies.length} Hausverwaltung${companies.length !== 1 ? 'en' : ''}</strong> in <strong>${city}</strong> diskret um ein Angebot gebeten. Die Verwaltungen werden ihr Angebot direkt an <strong>${email}</strong> senden.</p>
    <p class="lbl">Kontaktierte Hausverwaltungen</p>
    <div class="list">
      ${companies.map(c => `<div class="row"><div class="dot"></div><div><div class="rname">${c.name}</div>${c.address || c.phone ? `<div class="rmeta">${[c.address, c.phone].filter(Boolean).join(' · ')}</div>` : ''}</div></div>`).join('')}
    </div>
    <div class="box"><p>💡 <strong>Wie geht es weiter?</strong><br>Sobald Sie Angebote erhalten haben, können Sie diese in Ruhe vergleichen und die passende Verwaltung für Ihr Objekt auswählen. Bei Fragen stehen wir jederzeit zur Verfügung.</p></div>
  </div>
  <div class="ftr">
    <p class="fname">Ihr HausMatch-Team</p>
    <p class="frole">Ihr Partner für die perfekte Hausverwaltung</p>
    <p class="flinks"><a href="https://haus-match.de">haus-match.de</a> &nbsp;·&nbsp; <a href="mailto:barth@bundwimmobilien.de">barth@bundwimmobilien.de</a></p>
  </div>
</div></body></html>`;

const managerHtml = (
  ownerName: string, ownerEmail: string, ownerPhone: string | undefined,
  city: string, einheiten: string, note: string
) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="wrap">
  <div class="hdr"><div class="logo">Haus<span>Match</span></div></div>
  <div class="body">
    <span class="badge">Neue Angebotsanfrage</span>
    <h1>Ein Eigentümer sucht eine Hausverwaltung in ${city}</h1>
    <p class="intro">Über <strong>HausMatch</strong> hat ein Immobilieneigentümer eine Angebotsanfrage für <strong>${einheiten}</strong> in <strong>${city}</strong> gestellt. Er vergleicht mehrere Angebote — bitte melden Sie sich zeitnah.</p>
    <p class="lbl">Kontaktdaten des Eigentümers</p>
    <div class="list">
      <div class="drow"><span class="dlbl">Name</span><span class="dval">${ownerName}</span></div>
      <div class="drow"><span class="dlbl">E-Mail</span><span class="dval">${ownerEmail}</span></div>
      <div class="drow"><span class="dlbl">Telefon</span><span class="dval">${ownerPhone || 'nicht angegeben'}</span></div>
      <div class="drow"><span class="dlbl">Region</span><span class="dval">${city}</span></div>
    </div>
    ${note ? `<div class="box"><p>📋 <strong>Objektbeschreibung:</strong><br>${note}</p></div>` : ''}
    <a class="cta" href="mailto:${ownerEmail}">Angebot an ${ownerName} senden →</a>
    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0">Senden Sie Ihr Angebot direkt an <strong>${ownerEmail}</strong></p>
  </div>
  <div class="ftr">
    <p class="fname">HausMatch-Team</p>
    <p class="frole">Die Plattform für professionelle Hausverwaltungen</p>
    <p class="flinks"><a href="https://haus-match.de">haus-match.de</a></p>
  </div>
</div></body></html>`;

// ─── Handler ───────────────────────────────────────────────────────────────────

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

  const companyArr: { name: string; address?: string; phone?: string; email?: string }[] =
    Array.isArray(companies) ? companies : [];
  const note = message?.trim() || '';
  const einheiten = note.match(/\d+/)?.[0] ? note.match(/\d+/)![0] + ' Einheiten' : 'eine WEG';
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

  // Firestore: Anfrage speichern (non-blocking)
  saveToFirestore({ city, senderName, senderEmail, senderPhone: senderPhone || '', message: note, companies: companyArr })
    .catch(err => console.error('Firestore save failed:', err));

  const isProduction = process.env.VERCEL_ENV === 'production';
  const isAllowed = (email: string) => isProduction || email.toLowerCase().endsWith('@bundwimmobilien.de');

  // E-Mail 2: Bestätigung an Eigentümer (nur wenn @bundwimmobilien.de)
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

  // E-Mail 3: Angebotsanfrage an Verwalter (nur @bundwimmobilien.de Empfänger)
  const registeredManagers = await getManagersInCity(city || '');
  const formCompaniesWithEmail = companyArr.filter(c => !!c.email);

  const seenEmails = new Set<string>();
  const allManagers: { name: string; email: string }[] = [];
  for (const m of [...registeredManagers, ...formCompaniesWithEmail]) {
    if (m.email && !seenEmails.has(m.email)) {
      seenEmails.add(m.email);
      allManagers.push({ name: m.name || '', email: m.email });
    }
  }

  const allowedManagers = allManagers.filter(m => isAllowed(m.email));
  console.log(`Manager-Mails: ${allManagers.length} gesamt, ${allowedManagers.length} erlaubt (@bundwimmobilien.de)`);

  for (const manager of allowedManagers) {
    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [manager.email],
      reply_to: senderEmail,
      subject: `Angebotsanfrage über HausMatch – ${city || 'Neue Anfrage'}`,
      html: managerHtml(senderName, senderEmail, senderPhone, city || 'nicht angegeben', einheiten, note),
    });
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
