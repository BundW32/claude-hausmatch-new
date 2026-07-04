import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_cors';

// ─── Eddys News der Woche (Server-Recherche) ─────────────────────────────────
// Zwei Ausgaben pro Woche: Montag & Donnerstag. Die Recherche läuft hier auf dem
// Server, weil nur hier der GEMINI_API_KEY existiert — der Client ruft lediglich
// diese Route ab. Die Antwort wird per CDN-Cache (s-maxage) gehalten, damit pro
// Ausgabe nur wenige echte KI-Abrufe entstehen.

type Source = { title: string; url: string };
type Article = {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  keyPoints: string[];
  category: 'Recht' | 'Technik' | 'Management' | 'News';
  date: string;
  isLatest: boolean;
  sources: Source[];
};

const CATEGORIES = new Set(['Recht', 'Technik', 'Management', 'News']);

// Aktuelle Ausgabe = letzter Montag oder Donnerstag (Zeitzone Europa/Berlin).
function getEditionDate(): Date {
  const berlinNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  berlinNow.setHours(0, 0, 0, 0);
  while (berlinNow.getDay() !== 1 && berlinNow.getDay() !== 4) berlinNow.setDate(berlinNow.getDate() - 1);
  return berlinNow;
}

const isHttpUrl = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\//i.test(u);

function normalizeSources(raw: unknown, fallback: Source[]): Source[] {
  const list = Array.isArray(raw) ? raw : [];
  const cleaned = list
    .filter((s: any) => s && isHttpUrl(s.url))
    .map((s: any) => ({
      title: String(s.title || new URL(s.url).hostname.replace(/^www\./, '')),
      url: String(s.url),
    }))
    .slice(0, 5);
  return cleaned.length > 0 ? cleaned : fallback.slice(0, 3);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const edition = getEditionDate();
  const editionKey = `${edition.getFullYear()}-${String(edition.getMonth() + 1).padStart(2, '0')}-${String(edition.getDate()).padStart(2, '0')}`;
  const editionStr = edition.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const prompt = `Du bist Eddy, der KI-Immobilienassistent von HausMatch. Erstelle "Eddys News der Woche" – Ausgabe vom ${editionStr}.

Recherchiere über die Google-Suche die 4 aktuellsten und wichtigsten Nachrichten der letzten 7 Tage für Immobilieneigentümer und Hausverwaltungen in Deutschland. Decke möglichst verschiedene Themenfelder ab: rechtliche Änderungen & Urteile, Markt & Mieten, Zinsen & Finanzierung, Energie & Technik. Schreibe auf Deutsch mit korrekten Umlauten (ä, ö, ü, ß).

Jeder Artikel ist ein AUSFÜHRLICHER, vollständiger Fachbericht wie in einem professionellen Immobilien-Magazin:
- "fullContent": 900–1300 Wörter, gegliedert mit Markdown: "## " für 4–6 Zwischenüberschriften, "- " für Aufzählungen, **fett** für zentrale Begriffe und Zahlen.
- Aufbau: prägnanter Einstieg (worum geht es, warum jetzt wichtig) → "## Hintergrund" mit Kontext und Vorgeschichte → Details mit konkreten Zahlen, Daten, Fristen, Namen und wo verfügbar Zitaten oder Positionen aus den Suchergebnissen → falls relevant regionale Unterschiede oder Beispielrechnungen → Abschnitt "## Was heißt das für Eigentümer und Verwalter?" mit einer konkreten Handlungs-Checkliste als Aufzählung → letzter Absatz beginnt mit "Eddys Einordnung:" (ehrliche, praktische Einschätzung in Eddys Ton, 3–5 Sätze).
- Schreibe in ganzen, gut lesbaren Absätzen (3–6 Sätze je Absatz) — keine Stichwort-Sammlung. Erkläre Fachbegriffe kurz beim ersten Auftreten.
- "keyPoints": 4–6 prägnante Stichpunkte "Das Wichtigste in Kürze" (je max. 15 Wörter).
- "summary": 1–2 Sätze Teaser ohne Wiederholung des Titels.
- "sources": 2–4 ECHTE Quellen aus den Suchergebnissen mit vollständiger URL (z. B. Haufe, Immobilien Zeitung, Handelsblatt, Tagesschau, BGH/Gerichte, Ministerien). KEINE erfundenen URLs.
- "category": genau eine von "Recht", "Technik", "Management", "News".
- "date": "${editionStr}".

Antworte NUR mit einem JSON-Array (kein Markdown-Codeblock, kein erklärender Text) in diesem Format:
[
  {
    "id": "1",
    "title": "…",
    "summary": "…",
    "fullContent": "…",
    "keyPoints": ["…"],
    "category": "Recht",
    "date": "${editionStr}",
    "sources": [{ "title": "…", "url": "https://…" }]
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
            temperature: 0.4,
            maxOutputTokens: 32768,
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
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array in blog response:', text.substring(0, 300));
      return res.status(502).json({ error: 'Unerwartetes Antwortformat' });
    }

    let rawArticles: any[] = [];
    try {
      rawArticles = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('Blog JSON parse error:', parseErr);
      return res.status(502).json({ error: 'Antwort konnte nicht gelesen werden' });
    }
    if (!Array.isArray(rawArticles)) rawArticles = [];

    // Quellen aus dem Grounding (Google-Suche) als Fallback, falls ein Artikel
    // keine verwertbaren URLs mitliefert.
    const groundingSources: Source[] = (data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .filter((c: any) => c?.web && isHttpUrl(c.web.uri))
      .map((c: any) => ({ title: String(c.web.title || 'Quelle'), url: String(c.web.uri) }));

    const articles: Article[] = rawArticles
      .filter((a: any) => a && a.title && a.fullContent)
      .slice(0, 4)
      .map((a: any, i: number) => ({
        id: String(a.id || i + 1),
        title: String(a.title),
        summary: String(a.summary || ''),
        fullContent: String(a.fullContent),
        keyPoints: Array.isArray(a.keyPoints) ? a.keyPoints.map(String).slice(0, 5) : [],
        category: CATEGORIES.has(a.category) ? a.category : 'News',
        date: editionStr,
        isLatest: i === 0,
        sources: normalizeSources(a.sources, groundingSources),
      }));

    if (articles.length === 0) {
      return res.status(502).json({ error: 'Keine Artikel erhalten' });
    }

    // CDN-Cache: 6 h frisch, danach bis zu 2 Tage stale-while-revalidate.
    // Zusammen mit dem Ausgaben-Cache im Client bleiben es wenige Abrufe pro Ausgabe.
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=172800');
    return res.status(200).json({ edition: editionKey, editionLabel: editionStr, articles });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Blog handler error:', message);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
