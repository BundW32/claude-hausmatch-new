import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const prompt = `Du hilfst dabei, echte Hausverwaltungsunternehmen für die Anfrage "${query}" zu finden.

STRENGE QUALITÄTSREGELN – diese sind ABSOLUT verbindlich:

1. EXAKTE ÜBEREINSTIMMUNG: Stelle sicher, dass Firmenname UND Stadt genau übereinstimmen. "B&W Immobilien Gladbeck" und "B&W Immobilien München" sind VÖLLIG VERSCHIEDENE Firmen – verwechsle sie NIEMALS.

2. WEBSITE-VERIFIZIERUNG: Prüfe, ob die Domain der Website zum GENAUEN Firmennamen passt. Beispiel: Wenn du "Müller Hausverwaltung Köln" suchst, darf die Website NICHT von "Müller & Partner Immobilien Hamburg" sein. Im Zweifelsfall: Website-Feld LEER lassen.

3. KONTAKTDATEN-VERIFIKATION: Telefonnummer, E-Mail und Adresse müssen zu GENAU DIESEM Unternehmen in GENAU DIESER Stadt gehören. Keine Daten von ähnlichen Firmen übernehmen.

4. LIEBER WENIGER ALS FALSCH: Gib nur 3–6 Ergebnisse zurück, wenn du dir bei mehr nicht sicher bist. Qualität vor Quantität.

5. FELDER LEER LASSEN statt erfinden: Wenn du dir bei Website, Telefon oder E-Mail nicht 100% sicher bist, dass sie zu genau diesem Unternehmen gehören – lass das Feld als leeren String "".

Antworte NUR mit einem JSON-Array (kein Markdown, kein Text davor/danach):
[
  {
    "name": "Exakter Firmenname",
    "address": "Straße Hausnummer, PLZ Stadt",
    "city": "Stadt",
    "phone": "+49 ...",
    "website": "https://...",
    "email": "info@...",
    "rating": 4.5,
    "reviews": 47,
    "specialization": "WEG-Verwaltung, Mietverwaltung"
  }
]

Unbekannte Felder als "" angeben, rating als 0 wenn unbekannt.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: [{ googleSearch: {} }],
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 0 }
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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array in response:', text.substring(0, 200));
      return res.status(200).json({ companies: [] });
    }

    let companies = [];
    try {
      companies = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return res.status(200).json({ companies: [] });
    }

    if (!Array.isArray(companies)) companies = [];
    companies = companies
      .map((c: Record<string, unknown>) => ({
        name: String(c.name || ''),
        address: String(c.address || ''),
        city: String(c.city || ''),
        phone: String(c.phone || ''),
        website: String(c.website || ''),
        email: String(c.email || ''),
        rating: Math.min(5, Math.max(0, Number(c.rating) || 0)),
        reviews: Math.max(0, Number(c.reviews) || 0),
        specialization: String(c.specialization || 'Hausverwaltung'),
        isPartner: false
      }))
      .filter((c: { name: string }) => c.name.length > 0)
      .sort((a: { rating: number }, b: { rating: number }) => b.rating - a.rating);

    return res.status(200).json({ companies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
