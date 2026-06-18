import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barth@bundwimmobilien.de';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';

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
        text: `Guten Tag,\n\nein Interessent sucht eine WEG-Verwaltung in ${city || 'Ihrer Region'} für ${einheiten}.\n\nUm Ihr Angebot abzugeben und die Kontaktdaten des Interessenten zu erhalten, registrieren Sie sich bitte kostenlos auf:\n\nhttps://www.haus-match.de/register\n\nNach der Registrierung können Sie direkt mit dem Interessenten in Kontakt treten.\n\nMit freundlichen Grüßen,\nIhr HausMatch-Team`,
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
