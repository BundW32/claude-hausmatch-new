import { InquiryAnalysis, ManagerSearchResult, BlogArticle, SearchCompany } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

// Wir lesen den Key sicher aus
const API_KEY = process.env.GEMINI_API_KEY || "";

// --- FALLBACK / MOCK DATEN ---
const getMockAnalysis = (reason: string): InquiryAnalysis => {
  console.warn(`Nutze Mock-Daten. Grund: ${reason}`);
  return {
    summary: "KI-Analyse nicht verfügbar (Demo-Modus). Dies ist eine automatische Schätzung basierend auf Ihren Eingaben.",
    keyRequirements: ["Objektbegehung notwendig", "Unterlagenprüfung", "WEG-Verwaltung prüfen"],
    estimatedEffort: "Mittel",
    legalAdviceSnippet: "Bitte prüfen Sie die aktuelle WEG-Gesetzgebung manuell.",
    recommendedTags: ["Manuelle Prüfung", "WEG"]
  };
};

export const analyzePropertyRequirement = async (formData: {
  city: string;
  units: number;
  propertyType: string;
  buildingAge: string;
  condition: string;
  description: string;
}): Promise<InquiryAnalysis> => {
  // 1. Check: Haben wir überhaupt einen Key?
  if (!API_KEY) {
    return getMockAnalysis("Kein API Key gefunden (GEMINI_API_KEY fehlt)");
  }

  try {
    // 2. Initialisierung
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
      Analysiere diese Immobilien-Anfrage.
      Stadt: ${formData.city}, Einheiten: ${formData.units}, Typ: ${formData.propertyType},
      Baujahr: ${formData.buildingAge}, Zustand: ${formData.condition}, Text: ${formData.description}

      Antworte im JSON-Format auf Deutsch.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedEffort: { type: Type.STRING, description: "Niedrig, Mittel oder Hoch" },
            legalAdviceSnippet: { type: Type.STRING },
            recommendedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "keyRequirements", "estimatedEffort", "legalAdviceSnippet", "recommendedTags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Keine Antwort von der KI erhalten");

    return JSON.parse(text) as InquiryAnalysis;

  } catch (error) {
    console.error("KI-Fehler:", error);
    return getMockAnalysis("API Fehler oder Limit erreicht");
  }
};

// ─── Eddys News der Woche ───────────────────────────────────────────────────
// Zwei Ausgaben pro Woche: Montag & Donnerstag. Die eigentliche KI-Recherche
// läuft serverseitig in /api/blog (nur dort existiert der GEMINI_API_KEY);
// hier wird nur abgerufen und pro Ausgabe im localStorage gecacht, damit nicht
// jeder Seitenaufruf einen Netzwerk-Abruf auslöst.

export const getCurrentEditionDate = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (d.getDay() !== 1 && d.getDay() !== 4) d.setDate(d.getDate() - 1); // Mo=1, Do=4
  return d;
};

const EDITION_CACHE_BASE = 'hm_eddy_news_';
// v3: Artikel kommen aus /api/blog (echte Recherche mit Quellen-Links) –
// alte Cache-Versionen werden beim Schreiben mit aufgeräumt.
const EDITION_CACHE_PREFIX = EDITION_CACHE_BASE + 'v3_';

const readEditionCache = (key: string): BlogArticle[] | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as BlogArticle[]) : null;
  } catch { return null; }
};

const writeEditionCache = (key: string, articles: BlogArticle[]) => {
  try {
    // Alte Ausgaben (auch alte Cache-Versionen) aufräumen, dann aktuelle speichern.
    Object.keys(window.localStorage)
      .filter(k => k.startsWith(EDITION_CACHE_BASE) && k !== key)
      .forEach(k => window.localStorage.removeItem(k));
    window.localStorage.setItem(key, JSON.stringify(articles));
  } catch { /* localStorage evtl. voll/nicht verfügbar */ }
};

export const fetchLatestIndustryBlog = async (): Promise<BlogArticle[]> => {
  const edition = getCurrentEditionDate();
  const editionStr = edition.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const cacheKey = EDITION_CACHE_PREFIX + edition.toISOString().slice(0, 10);

  const cached = readEditionCache(cacheKey);
  if (cached && cached.length > 0) return cached;

  try {
    const res = await fetch('/api/blog');
    if (!res.ok) throw new Error(`Blog-Abruf fehlgeschlagen (Status ${res.status})`);

    const data = await res.json();
    const articles: BlogArticle[] = Array.isArray(data?.articles) ? data.articles : [];
    if (articles.length === 0) throw new Error('Keine Artikel erhalten');

    writeEditionCache(cacheKey, articles);
    return articles;
  } catch (error) {
    console.error("Blog-Abruf-Fehler:", error);
    return [
      {
        id: "err-1",
        title: "Eddys News sind gerade nicht erreichbar",
        summary: "Die aktuelle Ausgabe konnte nicht geladen werden – bitte später erneut versuchen.",
        fullContent: "Die KI-Recherche für diese Ausgabe ist momentan nicht erreichbar. Schauen Sie in Kürze wieder vorbei.\n\nEddys Einordnung: Manchmal braucht auch eine Eule eine kurze Pause. 🦉",
        category: "News",
        date: editionStr,
        isLatest: true,
        sources: [{ title: "Tagesschau Wirtschaft", url: "https://www.tagesschau.de/wirtschaft" }]
      }
    ];
  }
};

export const searchPropertyManagers = async (city: string): Promise<ManagerSearchResult> => {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `Hausverwaltung ${city}` })
    });

    if (!res.ok) {
      throw new Error(`Suche fehlgeschlagen (Status ${res.status})`);
    }

    const data = await res.json();
    const companies: SearchCompany[] = Array.isArray(data?.companies) ? data.companies : [];

    return {
      introText: companies.length > 0
        ? `${companies.length} Hausverwaltungen in ${city} gefunden – live durchsucht über Google Search.`
        : `Es konnten keine Hausverwaltungen in ${city} gefunden werden. Versuchen Sie es mit einer anderen Stadt oder Region.`,
      sources: [],
      companies
    };
  } catch (error) {
    console.error("Live-Suche Fehler:", error);
    return {
      introText: "Die Live-Suche ist momentan nicht erreichbar. Bitte versuchen Sie es in Kürze erneut.",
      sources: [],
      companies: []
    };
  }
};

export const getAIAdvisorResponse = async (history: { role: string; parts: { text: string }[] }[], message: string) => {
  return "Der KI-Chat ist im Demo-Modus derzeit eingeschränkt.";
};
