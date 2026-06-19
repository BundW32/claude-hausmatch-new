import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barth@bundwimmobilien.de';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';

type Company = { name: string; address?: string; phone?: string; email?: string };

const baseStyle = `
  body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
  .header { background: #2563eb; padding: 40px 48px 36px; }
  .header-logo { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
  .header-logo span { color: #bfdbfe; }
  .body { padding: 48px; }
  .greeting { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
  .intro { font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 32px; }
  .section-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin: 0 0 12px; }
  .company-list { background: #f8fafc; border-radius: 16px; padding: 20px 24px; margin: 0 0 32px; list-style: none; padding-left: 24px; padding-right: 24px; }
  .company-item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px; }
  .company-item:last-child { border-bottom: none; }
  .dot { width: 8px; height: 8px; background: #2563eb; border-radius: 50%; flex-shrink: 0; }
  .company-name { font-weight: 700; color: #1e293b; font-size: 15px; }
  .company-meta { font-size: 13px; color: #94a3b8; margin-top: 2px; }
  .info-box { background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0 12px 12px 0; padding: 16px 20px; margin: 0 0 40px; }
  .info-box p { margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6; font-weight: 500; }
  .footer { background: #f8fafc; padding: 32px 48px; border-top: 1px solid #e2e8f0; }
  .footer-name { font-weight: 800; color: #0f172a; font-size: 15px; margin: 0 0 4px; }
  .footer-role { font-size: 13px; color: #64748b; margin: 0 0 12px; }
  .footer-links { font-size: 13px; color: #94a3b8; }
  .footer-links a { color: #2563eb; text-decoration: none; font-weight: 600; }
  .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; margin-bottom: 20px; }
`;

const ownerConfirmationHtml = (
  senderName: string,
  senderEmail: string,
  city: string,
  companies: Company[]
) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyle}</style></head><body>
<div class="wrapper">
  <div class="header">
    <div class="header-logo">Haus<span>Match</span></div>
  </div>
  <div class="body">
    <span class="badge">Express-Matching</span>
    <h1 class="greeting">Ihre Anfrage ist eingegangen, ${senderName.split(' ')[0]}!</h1>
    <p class="intro">
      Wir haben <strong>${companies.length} Hausverwaltung${companies.length !== 1 ? 'en' : ''}</strong> in <strong>${city}</strong>
      diskret um ein Angebot gebeten. Die Verwaltungen werden sich direkt bei Ihnen melden
      und ihr Angebot an <strong>${senderEmail}</strong> senden.
    </p>

    <p class="section-label">Kontaktierte Hausverwaltungen</p>
    <div class="company-list">
      ${companies.map(c => `
        <div class="company-item">
          <div class="dot"></div>
          <div>
            <div class="company-name">${c.name}</div>
            ${c.address ? `<div class="company-meta">${c.address}${c.phone ? ' · ' + c.phone : ''}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="info-box">
      <p>💡 <strong>Wie geht es weiter?</strong><br>
      Sobald Sie die Angebote erhalten haben, können Sie diese in Ruhe vergleichen und
      die passende Verwaltung für Ihr Objekt auswählen. Bei Fragen stehen wir jederzeit zur Verfügung.</p>
    </div>
  </div>
  <div class="footer">
    <p class="footer-name">Ihr HausMatch-Team</p>
    <p class="footer-role">Ihr Partner für die perfekte Hausverwaltung</p>
    <p class="footer-links">
      <a href="https://haus-match.de">haus-match.de</a> &nbsp;·&nbsp;
      <a href="mailto:barth@bundwimmobilien.de">barth@bundwimmobilien.de</a>
    </p>
  </div>
</div>
</body></html>`;

const managerInquiryHtml = (
  senderName: string,
  senderEmail: string,
  senderPhone: string | undefined,
  city: string,
  note: string
) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyle}
  .data-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .data-row:last-child { border-bottom: none; }
  .data-label { color: #94a3b8; font-weight: 700; width: 90px; flex-shrink: 0; }
  .data-value { color: #1e293b; font-weight: 600; }
  .cta { display: block; background: #2563eb; color: #ffffff !important; text-align: center; padding: 16px 32px; border-radius: 14px; font-weight: 900; font-size: 15px; text-decoration: none; margin: 32px 0; letter-spacing: -0.3px; }
</style></head><body>
<div class="wrapper">
  <div class="header">
    <div class="header-logo">Haus<span>Match</span></div>
  </div>
  <div class="body">
    <span class="badge">Neue Angebotsanfrage</span>
    <h1 class="greeting">Ein Eigentümer sucht eine Hausverwaltung</h1>
    <p class="intro">
      Über <strong>HausMatch (haus-match.de)</strong> hat ein Immobilieneigentümer in
      <strong>${city}</strong> eine Angebotsanfrage gestellt. Er vergleicht aktuell mehrere
      Angebote — bitte melden Sie sich zeitnah, um Ihre Chancen zu erhöhen.
    </p>

    <p class="section-label">Kontaktdaten des Eigentümers</p>
    <div class="company-list">
      <div class="data-row"><span class="data-label">Name</span><span class="data-value">${senderName}</span></div>
      <div class="data-row"><span class="data-label">E-Mail</span><span class="data-value">${senderEmail}</span></div>
      <div class="data-row"><span class="data-label">Telefon</span><span class="data-value">${senderPhone || 'nicht angegeben'}</span></div>
      <div class="data-row"><span class="data-label">Region</span><span class="data-value">${city}</span></div>
    </div>

    ${note ? `<div class="info-box"><p>📋 <strong>Objektbeschreibung:</strong><br>${note}</p></div>` : ''}

    <a class="cta" href="mailto:${senderEmail}">Angebot an ${senderName} senden →</a>

    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">
      Senden Sie Ihr Angebot direkt an <strong>${senderEmail}</strong>
    </p>
  </div>
  <div class="footer">
    <p class="footer-name">HausMatch-Team</p>
    <p class="footer-role">Die Plattform für professionelle Hausverwaltungen</p>
    <p class="footer-links"><a href="https://haus-match.de">haus-match.de</a></p>
  </div>
</div>
</body></html>`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY fehlt');
    return res.status(500).json({ error: 'E-Mail-Dienst nicht konfiguriert.' });
  }

  const { senderName, senderEmail, senderPhone, message, city, companies } = req.body || {};

  if (!senderName || !senderEmail) {
    return res.status(400).json({ error: 'Name und E-Mail sind erforderlich.' });
  }

  const companyArr: Company[] = Array.isArray(companies) ? companies : [];
  const note = message?.trim() || '';

  const companyListText = companyArr.length > 0
    ? companyArr.map(c => `• ${c.name}${c.address ? ` – ${c.address}` : ''}${c.phone ? ` | ${c.phone}` : ''}${c.email ? ` | ${c.email}` : ''}`).join('\n')
    : 'Keine Unternehmen angegeben';

  // E-Mail 1: Admin-Benachrichtigung
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      replyTo: senderEmail,
      subject: `Neue Anfrage HausMatch – ${city || 'unbekannte Stadt'}`,
      text: `Neue Verwaltungsanfrage\n\nName:    ${senderName}\nE-Mail:  ${senderEmail}\nTelefon: ${senderPhone || 'nicht angegeben'}\nStadt:   ${city || 'nicht angegeben'}${note ? `\n\nObjekt:\n"${note}"` : ''}\n\nAusgewählte Hausverwaltungen:\n${companyListText}\n\n---\nHausMatch.de`,
    });
  } catch (err) {
    console.error('Admin-E-Mail Fehler:', err);
    return res.status(500).json({ error: 'Anfrage konnte nicht gesendet werden.' });
  }

  // E-Mail 2: Bestätigung an Eigentümer (HTML)
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [senderEmail],
      subject: `Ihre Angebotsanfrage in ${city || 'Ihrer Region'} – HausMatch`,
      html: ownerConfirmationHtml(senderName, senderEmail, city || 'Ihrer Region', companyArr),
    });
  } catch (err) {
    console.warn('Bestätigungs-E-Mail Fehler:', err);
  }

  // E-Mail 3: Angebotsanfrage an Hausverwaltungen (HTML)
  for (const company of companyArr.filter(c => !!c.email)) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [company.email!],
        replyTo: senderEmail,
        subject: `Angebotsanfrage über HausMatch – ${city || 'Neue Anfrage'}`,
        html: managerInquiryHtml(senderName, senderEmail, senderPhone, city || 'nicht angegeben', note),
      });
    } catch (err) {
      console.warn(`E-Mail an ${company.email} fehlgeschlagen:`, err);
    }
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
