import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Website-Scraping für Kontaktdaten ──────────────────────────────────────
async function extractContactFromWebsite(
  website: string
): Promise<{ email: string; phone: string }> {
  const baseUrl = website.startsWith('http') ? website : `https://${website}`;
  const pagesToTry = ['', '/impressum', '/kontakt', '/contact', '/ueber-uns', '/about'];

  let email = '';
  let phone = '';

  for (const path of pagesToTry) {
    if (email && phone) break;
    try {
      const resp = await fetch(baseUrl + path, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HausMatchBot/1.0; +https://haus-match.de)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(5000),
        redirect: 'follow',
      } as RequestInit);

      if (!resp.ok) continue;
      const html = await resp.text();

      // E-Mail extrahieren
      if (!email) {
        const mailtoMatch = html.match(/href="mailto:([^"@\s]+@[^"@\s]+\.[a-zA-Z]{2,})"/i);
        if (mailtoMatch) {
          email = mailtoMatch[1];
        } else {
          const emailMatch = html.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
          if (
            emailMatch &&
            !emailMatch[1].includes('example.') &&
            !emailMatch[1].includes('domain.') &&
            !emailMatch[1].includes('@sentry') &&
            !emailMatch[1].includes('@pixel') &&
            !emailMatch[1].endsWith('.png') &&
            !emailMatch[1].endsWith('.jpg')
          ) {
            email = emailMatch[1];
          }
        }
      }

      // Telefon extrahieren
      if (!phone) {
        const telMatch = html.match(/href="tel:([+0-9\s\-\/()]{6,20})"/i);
        if (telMatch) {
          phone = telMatch[1].trim();
        } else {
          const phoneMatch = html.match(/(\+49[\s\-]?|0)[0-9]{2,5}[\s\-\/]?[0-9]{3,10}/);
          if (phoneMatch) {
            phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
          }
        }
      }
    } catch {
      // Timeout oder Netzwerkfehler — nächste Seite probieren
    }
  }

  return { email, phone };
}

// ─── Handler ─────────────────────────────────────────────────────────────────
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

1. EXAKTE ÜBEREINSTIMMUNG: Firmenname UND Stadt müssen genau übereinstimmen. "B&W Immobilien Gladbeck" und "B&W Immobilien München" sind VÖLLIG VERSCHIEDENE Firmen.

2. WEBSITE-VERIFIZIERUNG: Die Domain der Website muss zum GENAUEN Firmennamen und GENAU dieser Stadt passen. Im Zweifelsfall: Website-Feld LEER lassen.

3. KONTAKTDATEN-VERIFIKATION: Telefon, E-Mail und Adresse müssen zu GENAU DIESEM Unternehmen in GENAU DIESER Stadt gehören. Keine Verwechslungen zwischen gleichnamigen Firmen in verschiedenen Städten.

4. ECHTE WEBSITE: Suche aktiv nach der korrekten Website dieses Unternehmens. Eine Website-URL ist sehr wertvoll – gib sie nur an wenn du dir SICHER bist dass sie zu genau diesem Unternehmen gehört.

5. LIEBER WENIGER ALS FALSCH: Gib 3–6 Ergebnisse zurück. Felder die du nicht sicher kennst als leeren String "" angeben.

Antworte NUR mit einem JSON-Array (kein Markdown, kein Text davor/danach):
[
  {
    "name": "Firmenname GmbH",
    "address": "Musterstraße 1, 45964 Gladbeck",
    "city": "Gladbeck",
    "phone": "+49 2043 12345",
    "website": "https://example.de",
    "email": "info@example.de",
    "rating": 4.7,
    "reviews": 83,
    "specialization": "WEG-Verwaltung, Mietverwaltung"
  }
]`;

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
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
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

    // Daten bereinigen
    let cleaned = companies.map((c) => ({
      name: String(c.name || ''),
      address: String(c.address || ''),
      city: String(c.city || ''),
      phone: String(c.phone || ''),
      website: String(c.website || ''),
      email: String(c.email || ''),
      rating: Math.min(5, Math.max(0, Number(c.rating) || 0)),
      reviews: Math.max(0, Number(c.reviews) || 0),
      specialization: String(c.specialization || 'Hausverwaltung'),
      isPartner: false,
    }));

    // ─── Website scrapen: fehlende Kontaktdaten ergänzen ───────────────────
    const enriched = await Promise.all(
      cleaned.map(async (company) => {
        if (!company.website) return company;
        const needsEmail = !company.email;
        const needsPhone = !company.phone;
        if (!needsEmail && !needsPhone) return company;

        const contact = await extractContactFromWebsite(company.website);
        return {
          ...company,
          email: company.email || contact.email,
          phone: company.phone || contact.phone,
        };
      })
    );

    const result = enriched.sort(
      (a, b) => (b.rating as number) - (a.rating as number)
    );

    return res.status(200).json({ companies: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
