import type { VercelRequest, VercelResponse } from '@vercel/node';

// Kontaktdaten von Unternehmens-Website scrapen
async function scrapeWebsite(url: string): Promise<{ email?: string; phone?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HausMatchBot/1.0)',
        'Accept': 'text/html'
      }
    });
    clearTimeout(timeout);
    if (!resp.ok) return {};
    const html = await resp.text();

    // E-Mail extrahieren — bevorzugt mailto:-Links
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
    const emailMatch = mailtoMatch
      ? mailtoMatch[1]
      : (html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0]);

    // Deutsche Telefonnummer extrahieren
    const phoneMatch = html.match(/(?:Tel\.?|Telefon|Fon|Phone)[\s:]*(\+?[\d\s\/\-\(\)]{7,20})/i);
    const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, ' ').trim() : undefined;

    return {
      email: emailMatch || undefined,
      phone: phone || undefined
    };
  } catch {
    return {};
  }
}

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
    const prompt = `Suche nach echten, aktiven deutschen Hausverwaltungsunternehmen fuer die Suchanfrage: "${query}".

Nutze Google-Suchergebnisse um ECHTE Unternehmen mit echten Kontaktdaten zu finden.
Gib exakt 8 Unternehmen zurueck, sortiert nach Google-Bewertung (hoechste zuerst).

Antworte NUR mit einem JSON-Array (kein Markdown, kein erklaerende Text), in diesem Format:
[
  {
    "name": "Firmenname GmbH",
    "address": "Musterstrasse 1, 80331 Muenchen",
    "city": "Muenchen",
    "phone": "+49 89 123456",
    "website": "https://example.de",
    "email": "info@example.de",
    "rating": 4.7,
    "reviews": 83,
    "specialization": "WEG-Verwaltung, Mietverwaltung"
  }
]

Felder die unbekannt sind als leeren String "" angeben, rating als 0 wenn unbekannt.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: [{ googleSearch: {} }],
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
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

    let companies: Record<string, unknown>[] = [];
    try {
      companies = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return res.status(200).json({ companies: [] });
    }

    if (!Array.isArray(companies)) companies = [];

    // Unternehmen normalisieren
    companies = companies.map((c) => ({
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
    }));

    // Websites parallel scrapen fuer fehlende Kontaktdaten
    const scrapeResults = await Promise.allSettled(
      companies.map((c) => {
        const needsEmail = !c.email;
        const needsPhone = !c.phone;
        const hasWebsite = typeof c.website === 'string' && c.website.startsWith('http');
        if (hasWebsite && (needsEmail || needsPhone)) {
          return scrapeWebsite(c.website as string);
        }
        return Promise.resolve({});
      })
    );

    // Gescrapte Daten zusammenfuehren
    companies = companies.map((c, i) => {
      const scraped = scrapeResults[i].status === 'fulfilled' ? scrapeResults[i].value : {};
      return {
        ...c,
        email: c.email || scraped.email || '',
        phone: c.phone || scraped.phone || ''
      };
    });

    companies.sort((a, b) => (b.rating as number) - (a.rating as number));

    return res.status(200).json({ companies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
