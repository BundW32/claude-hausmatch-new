import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barth@bundwimmobilien.de';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';

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

  const companyList = Array.isArray(companies) && companies.length > 0
    ? companies.map((c: { name: string; address?: string; phone?: string; email?: string }) =>
        `• ${c.name}${c.address ? ` – ${c.address}` : ''}${c.phone ? ` | Tel: ${c.phone}` : ''}${c.email ? ` | ${c.email}` : ''}`
      ).join('\n')
    : 'Keine Unternehmen angegeben';

  const userNote = message?.trim() ? `\n\nNachricht:\n"${message.trim()}"` : '';

  // E-Mail 1: Admin-Benachrichtigung (immer gesendet)
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      replyTo: senderEmail,
      subject: `Neue Anfrage HausMatch – ${city || 'unbekannte Stadt'}`,
      text: `Neue Verwaltungsanfrage\n\nName:    ${senderName}\nE-Mail:  ${senderEmail}\nTelefon: ${senderPhone || 'nicht angegeben'}\nStadt:   ${city || 'nicht angegeben'}${userNote}\n\nAusgewählte Hausverwaltungen:\n${companyList}\n\n---\nHausMatch.de`,
    });
  } catch (err) {
    console.error('Admin-E-Mail Fehler:', err);
    return res.status(500).json({ error: 'Anfrage konnte nicht gesendet werden.' });
  }

  // E-Mail 2: Bestätigung an Nutzer
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [senderEmail],
      subject: 'Ihre Angebotsanfrage bei HausMatch ist eingegangen',
      text: `Hallo ${senderName},\n\nvielen Dank für Ihre Angebotsanfrage über HausMatch!\n\nWir haben folgende Hausverwaltungen in ${city || 'Ihrer Region'} um ein Angebot gebeten:\n\n${companyList}\n\nDie Verwaltungen werden sich direkt bei Ihnen melden und ihr Angebot an ${senderEmail} senden.\n\nSobald Sie die Angebote erhalten haben, können Sie diese in Ruhe vergleichen und die passende Verwaltung auswählen.\n\nMit freundlichen Grüßen\nIhr HausMatch-Team\n\n---\nhaus-match.de`,
    });
  } catch (err) {
    console.warn('Bestätigungs-E-Mail Fehler:', err);
  }

  // E-Mail 3: Angebotsanfrage direkt an Hausverwaltungen mit bekannter E-Mail
  if (Array.isArray(companies)) {
    for (const company of companies.filter((c: { email?: string }) => !!c.email)) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [company.email],
          replyTo: senderEmail,
          subject: `Angebotsanfrage über HausMatch – ${city || 'Neue Anfrage'}`,
          text: `Sehr geehrte Damen und Herren,\n\nüber HausMatch (haus-match.de) liegt uns eine Angebotsanfrage eines Immobilieneigentümers vor, der nach einer neuen Hausverwaltung in ${city || 'Ihrer Region'} sucht.\n\nEigentümer:\nName:    ${senderName}\nE-Mail:  ${senderEmail}\nTelefon: ${senderPhone || 'nicht angegeben'}\nRegion:  ${city || 'nicht angegeben'}${userNote}\n\nWir bitten Sie, Ihr Angebot direkt an den Eigentümer zu senden:\n  ${senderEmail}${senderPhone ? `\n  ${senderPhone}` : ''}\n\nDer Eigentümer vergleicht aktuell mehrere Angebote und entscheidet sich anschließend für einen Verwalter. Bitte melden Sie sich zeitnah, um Ihre Chancen zu erhöhen.\n\nVielen Dank für Ihr Interesse.\n\nMit freundlichen Grüßen\nHausMatch-Team\nhaus-match.de`,
        });
      } catch (err) {
        console.warn(`E-Mail an ${company.email} fehlgeschlagen:`, err);
      }
    }
  }

  return res.status(200).json({
    success: true,
    message: `Anfrage gesendet. Bestätigung kommt an ${senderEmail}.`,
  });
}
