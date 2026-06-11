import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'E-Mail-Versand ist nicht konfiguriert (RESEND_API_KEY fehlt).' });
  }

  const { senderName, senderEmail, message, city, recipients } = req.body || {};

  if (!senderName || typeof senderName !== 'string') {
    return res.status(400).json({ error: 'senderName ist erforderlich' });
  }
  if (!senderEmail || typeof senderEmail !== 'string') {
    return res.status(400).json({ error: 'senderEmail ist erforderlich' });
  }
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message ist erforderlich' });
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'recipients ist erforderlich' });
  }

  const toAddresses = recipients
    .map((r: { email?: string }) => (r && typeof r.email === 'string' ? r.email.trim() : ''))
    .filter((email: string) => email.length > 0);

  if (toAddresses.length === 0) {
    return res.status(400).json({ error: 'Keine gültigen Empfänger-E-Mail-Adressen gefunden' });
  }

  const recipientList = recipients
    .map((r: { name?: string; email?: string }) => '- ' + (r?.name || '') + (r?.email ? ' (' + r.email + ')' : ''))
    .join('\n');

  const subject = 'Anfrage Hausverwaltung über HausMatch' + (city ? ' - ' + city : '');

  const textBody =
    message +
    '\n\n---\n' +
    'Gesendet über HausMatch von: ' + senderName + ' (' + senderEmail + ')\n\n' +
    'Angefragte Unternehmen:\n' +
    recipientList;

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toAddresses,
        reply_to: senderEmail,
        subject,
        text: textBody
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', response.status, errText);
      return res.status(502).json({ error: 'E-Mail-Versand fehlgeschlagen (Resend ' + response.status + ')', details: errText });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, id: data?.id });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', details: errMessage });
  }
}
