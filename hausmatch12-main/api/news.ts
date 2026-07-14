import type { VercelRequest, VercelResponse } from '@vercel/node';

// Eddys News der Woche, serverseitige Recherche über Gemini + Google-Suche.
// Der GEMINI_API_KEY bleibt auf dem Server (wie bei /api/chat und /api/search);
// der Client ruft nur diesen Endpoint auf. Pro Ausgabe (?edition=YYYY-MM-DD)
// wird die Antwort am Vercel-Edge gecacht, damit nicht jeder Besuch eine neue
// KI-Recherche auslöst.

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  keyPoints: string[];
  category: string;
  date: string;
  sources: { title: string; url: string }[];
}

const CATEGORIES = ['Recht', 'Technik', 'Management', 'News'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  // Ausgabedatum aus der Query (YYYY-MM-DD), sonst heute.
  const editionParam = typeof req.query.edition === 'string' ? req.query.edition : '';
  const editionISO = /^\d{4}-\d{2}-\d{2}$/.test(editionParam)
    ? editionParam
    : new Date().toISOString().slice(0, 10);
  const [y, m, d] = editionISO.split('-');
  const editionStr = `${d}.${m}.${y}`;

  const prompt = `Du bist Eddy, der KI-Immobilienassistent von HausMatch. Erstelle "Eddys News der Woche", Ausgabe vom ${editionStr}.

Recherchiere über die Google-Suche die 4 aktuellsten und wichtigsten ECHTEN Nachrichten der letzten 7 Tage für Immobilieneigentümer und Hausverwaltungen in Deutschland (rechtliche Änderungen & Urteile, Markt & Mieten, Zinsen & Finanzierung, Energie & Technik). Nutze nur reale, aktuelle Meldungen aus seriösen Quellen, keine erfundenen Inhalte. Schreibe auf Deutsch.
Schreibe natürliche, menschliche Sätze und verwende keine Gedankenstriche ("–" oder "—"). Nutze stattdessen Kommas, Punkte oder Doppelpunkte.

Jeder Artikel ist ein VOLLSTÄNDIGER Bericht wie in einem professionellen Immobilien-Blog:
- fullContent: 400–600 Wörter, gegliedert mit Markdown: "## " für 2–4 Zwischenüberschriften, "- " für Aufzählungen, **fett** für zentrale Begriffe und Zahlen.
- Aufbau: prägnanter Einstieg (worum geht es, warum jetzt wichtig) → Hintergrund & Details mit konkreten Zahlen, Daten, Fristen und Namen → Abschnitt "## Was heißt das für Eigentümer und Verwalter?" → letzter Absatz beginnt mit "Eddys Einordnung:" (kurze, ehrliche, praktische Einschätzung).
- keyPoints: 3–5 prägnante Stichpunkte "Das Wichtigste in Kürze" (je max. 15 Wörter).
- summary: 1–2 Sätze Teaser ohne Wiederholung des Titels.
- category: genau eines von "Recht", "Technik", "Management", "News".
- date: "${editionStr}".
- sources: die tatsächlich genutzten Quellen mit echten URLs.

Antworte NUR mit einem JSON-Array (kein Markdown-Codeblock, kein erklärender Text):
[
  {
    "id": "1",
    "title": "...",
    "summary": "...",
    "fullContent": "...",
    "keyPoints": ["...", "..."],
    "category": "Recht",
    "date": "${editionStr}",
    "sources": [{ "title": "Quelle", "url": "https://..." }]
  }
]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: [{ googleSearch: {} }],
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 16384
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini news error:', response.status, errText.substring(0, 300));
      return res.status(502).json({ error: 'Gemini API error: ' + response.status });
    }

    const data = await response.json();
    const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p.text || '').join('');

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array in news response:', text.substring(0, 300));
      return res.status(502).json({ error: 'Unerwartetes Antwortformat' });
    }

    let articles: NewsArticle[] = [];
    try {
      articles = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('News JSON parse error:', e);
      return res.status(502).json({ error: 'Antwort konnte nicht gelesen werden' });
    }

    // Minimal validieren & normalisieren, damit der Client sich darauf verlassen kann.
    const cleaned = articles
      .filter(a => a && a.title && a.fullContent)
      .slice(0, 6)
      .map((a, i) => ({
        id: String(a.id || i + 1),
        title: String(a.title),
        summary: String(a.summary || ''),
        fullContent: String(a.fullContent),
        keyPoints: Array.isArray(a.keyPoints) ? a.keyPoints.map(String).slice(0, 6) : [],
        category: CATEGORIES.includes(a.category) ? a.category : 'News',
        date: editionStr,
        isLatest: i === 0,
        sources: Array.isArray(a.sources)
          ? a.sources.filter(s => s && s.url).map(s => ({ title: String(s.title || s.url), url: String(s.url) })).slice(0, 6)
          : []
      }));

    if (cleaned.length === 0) {
      return res.status(502).json({ error: 'Keine Artikel erhalten' });
    }

    // Edge-Cache: pro Ausgabe-URL 24h am CDN, damit die Recherche nur einmal läuft.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json({ edition: editionISO, articles: cleaned });
  } catch (error) {
    console.error('News handler error:', error);
    return res.status(500).json({ error: 'News konnten nicht geladen werden' });
  }
}
