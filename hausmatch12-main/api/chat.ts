import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `Du bist Max, ein freundlicher und kompetenter Immobilien-Assistent von HausMatch. Du hilfst Eigentümern und Immobilienprofis in Deutschland bei Fragen rund um:

- Hausverwaltung: Kosten, Aufgaben, Verträge, WEG-Verwaltung
- Mietrecht: Mieterhöhung, Kündigung, Nebenkostenabrechnung, Mängel
- Immobilienfinanzierung: Kredit, Zinsen, Tilgung, KfW-Förderung
- Immobilieninvestment: Renditeberechnung, Kaufnebenkosten, Steuer
- Instandhaltung: Sanierung, Energieeffizienz, Handwerker
- WEG: Eigentümerversammlung, Hausordnung, Beschlüsse

Antworte immer auf Deutsch, freundlich und klar strukturiert. Verwende bei Bedarf kurze Aufzählungen. Halte Antworten prägnant (max. 200 Wörter).

WICHTIG: Du bist eine KI und kein Rechtsanwalt oder Steuerberater. Bei rechtlichen oder steuerlichen Fragen weise immer darauf hin, dass ein Fachanwalt oder Steuerberater konsultiert werden sollte.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  try {
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ error: 'Gemini API error', details: errText });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.';

    return res.status(200).json({ reply });
  } catch (error: unknown) {
    console.error('Handler error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
