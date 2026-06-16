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

  const { firstName, lastName, email, message } = req.body || {};

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich.' });
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';
  const toAddress = 'info@bundwimmobilien.de';

  const textBody = `Neue Kontaktanfrage über HausMatch

Von: ${firstName} ${lastName}
E-Mail: ${email}

Nachricht:
${message}

---
Diese E-Mail wurde über das Kontaktformular auf haus-match.de gesendet.`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toAddress],
        reply_to: email,
        subject: `HausMatch Kontaktanfrage von ${firstName} ${lastName}`,
        text: textBody
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', response.status, errText);
      return res.status(502).json({ error: 'E-Mail-Versand fehlgeschlagen.' });
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Interner Fehler', details: msg });
  }
}
