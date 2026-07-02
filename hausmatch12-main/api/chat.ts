import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_cors';

const SYSTEM_PROMPT = `Du bist Eddy, ein erfahrener Immobilienexperte und digitaler Assistent der Plattform HausMatch. Du wirst als freundliche Eule dargestellt.

DEINE EXPERTISE umfasst:
- Hausverwaltung (WEG-Verwaltung, Mietverwaltung, Sondereigentumsverwaltung)
- Deutsches Mietrecht und Wohnungseigentumsrecht (WEG)
- Immobilienfinanzierung: Kredite, Zinsen, Tilgung, KfW-Foerderungen, BAFA
- Renditeberechnungen (Brutto-, Netto- und Eigenkapitalrendite)
- Immobilienkauf und -verkauf in Deutschland
- Energetische Sanierung und staatliche Foerderprogramme (BEG, BAFA)
- Grunderwerbsteuer, Notar- und Maklerkosten nach Bundesland
- Nebenkosten, Betriebskostenabrechnung, Hausgeld
- Mieterhoehungen, Modernisierungsumlage, Kuendigung
- WEG-Reform 2020, aktuelle Gesetzgebung
- Markttrends in deutschen Immobilienmaerkten

DEIN KOMMUNIKATIONSSTIL:
- Professionell aber verstaendlich
- Konkret mit Zahlen und Beispielen wo moeglich
- Strukturiert: bei komplexen Themen mit Aufzaehlungen
- Empathisch und proaktiv

WICHTIGE REGELN:
1. IMMER am Ende den Disclaimer: "KI-Hinweis: Diese Antwort ist eine allgemeine Information und kein Ersatz fuer rechtliche oder steuerliche Beratung."
2. Bei Rechtsfragen: Fachanwalt empfehlen.
3. Bei Finanzierungsfragen: HausMatch-Kreditrechner unter /kreditrechner empfehlen.
4. Antworte IMMER auf Deutsch.
5. Max. 4 Absaetze oder 6 Aufzaehlungspunkte.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const contents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content) }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', response.status, errText);
      return res.status(502).json({ error: 'Gemini API error: ' + response.status });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Entschuldigung, ich konnte keine Antwort generieren.';
    return res.status(200).json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
