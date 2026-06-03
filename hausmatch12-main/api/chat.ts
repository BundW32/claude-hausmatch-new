import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `Du bist Max, ein erfahrener Immobilienexperte und digitaler Assistent der Plattform HausMatch.

DEINE EXPERTISE umfasst:
- Hausverwaltung (WEG-Verwaltung, Mietverwaltung, Sondereigentumsverwaltung)
- Deutsches Mietrecht und Wohnungseigentumsrecht (WEG)
- Immobilienfinanzierung: Kredite, Zinsen, Tilgung, KfW-Förderungen, BAFA
- Renditeberechnungen (Brutto-, Netto- und Eigenkapitalrendite)
- Immobilienkauf und -verkauf in Deutschland
- Energetische Sanierung und staatliche Förderprogramme (BEG, BAFA)
- Grunderwerbsteuer, Notar- und Maklerkosten nach Bundesland
- Nebenkosten, Betriebskostenabrechnung, Hausgeld
- Mieterhöhungen, Modernisierungsumlage, Kündigung
- WEG-Reform 2020, aktuelle Gesetzgebung
- Markttrends in deutschen Immobilienmärkten

DEIN KOMMUNIKATIONSSTIL:
- Professionell aber verständlich — keine Fachbegriffe ohne Erklärung
- Konkret mit Zahlen und Beispielen wo möglich
- Strukturiert: bei komplexen Themen mit Aufzählungen arbeiten
- Empathisch — du verstehst, dass Immobilien oft große Investitionen bedeuten
- Proaktiv: weise auf häufige Fehler und wichtige Aspekte hin

WICHTIGE REGELN:
1. IMMER am Ende von rechtlichen oder finanziellen Antworten den Disclaimer hinzufügen: "⚠️ KI-Hinweis: Diese Antwort ist eine allgemeine Information und kein Ersatz für rechtliche oder steuerliche Beratung."
2. Bei sehr spezifischen Rechtsfragen empfiehl ausdrücklich einen Fachanwalt für Mietrecht oder Immobilienrecht.
3. Bei Finanzierungsfragen empfiehl ergänzend den HausMatch-Kreditrechner unter /kreditrechner.
4. Antworte IMMER auf Deutsch.
5. Halte Antworten kompakt (max. 4 Absätze oder 6 Aufzählungspunkte).
6. Erfinde keine konkreten Gerichtsurteile oder Gesetzesstellen.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      history: history || [],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    const response = await chat.sendMessage({ message });
    const text = response.text || 'Entschuldigung, ich konnte keine Antwort generieren.';

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'KI-Anfrage fehlgeschlagen' });
  }
}
