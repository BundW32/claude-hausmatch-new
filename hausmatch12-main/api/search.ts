import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { city, units, propertyType, services } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!city) return res.status(400).json({ error: 'City required' });

  const servicesList = Array.isArray(services) && services.length > 0
    ? services.join(', ')
    : 'allgemeine Hausverwaltung';

  const prompt = `Du bist ein Experte für den deutschen Immobilienmarkt. Suche nach echten, existierenden Hausverwaltungsunternehmen in ${city}, Deutschland.

Objekttyp des Suchenden: ${propertyType || 'WEG'}
Anzahl Einheiten: ${units || 'ca. 10-50'}
Gewünschte Leistungen: ${servicesList}

Gib mir eine JSON-Liste von genau 5 echten Hausverwaltungsunternehmen in ${city} oder der näheren Region zurück.

Jedes Objekt MUSS folgende Felder haben:
{
  "name": "Vollständiger Firmenname",
  "address": "Straße Hausnummer, PLZ ${city}",
  "phone": "Telefonnummer oder leerer String",
  "email": "E-Mail-Adresse (falls unbekannt: info@[firmenname-kleinbuchstaben].de)",
  "website": "Website-URL ohne https:// oder leerer String",
  "description": "1-2 Sätze über das Unternehmen und seine Stärken",
  "specializations": ["Array", "mit", "Spezialgebieten"],
  "units_managed": "Anzahl verwalteter Einheiten als Text"
}

Antworte AUSSCHLIESSLICH mit dem JSON-Array. Kein Text davor oder danach.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'Gemini API error', details: errText });
    }

