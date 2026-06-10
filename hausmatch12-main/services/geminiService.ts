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
      model: "gemini-3-flash-preview",
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

export const fetchLatestIndustryBlog = async (): Promise<BlogArticle[]> => {
  if (!API_KEY) {
    return [
      {
        id: "1",
        title: "WEG-Reform Update 2025",
        summary: "Neue Regelungen zur energetischen Sanierung beschlossen.",
        fullContent: "Die Eigentümerversammlung kann nun einfacher über Sanierungen entscheiden...",
        category: "Recht",
        date: new Date().toLocaleDateString('de-DE'),
        isLatest: true,
        sources: [{ title: "Haufe Immobilien", url: "https://www.haufe.de/immobilien" }]
      },
      {
        id: "2",
        title: "Digitalisierung in der Hausverwaltung",
        summary: "Warum Excel-Listen nicht mehr ausreichen.",
        fullContent: "Moderne Software-Lösungen sparen bis zu 30% Arbeitszeit...",
        category: "Management",
        date: new Date().toLocaleDateString('de-DE'),
        isLatest: false,
        sources: [{ title: "Immobilien Zeitung", url: "https://www.iz.de" }]
      }
    ];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Finde die 3 aktuellsten und wichtigsten Nachrichten für Hausverwaltungen und Immobilieneigentümer in Deutschland (März 2025). Berücksichtige rechtliche Änderungen, technische Innovationen und Markt-News.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              fullContent: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["Recht", "Technik", "Management", "News"] },
              date: { type: Type.STRING },
              sources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["title", "url"]
                }
              }
            },
            required: ["id", "title", "summary", "fullContent", "category", "date", "sources"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Keine Blog-Daten erhalten");

    const articles = JSON.parse(text) as BlogArticle[];
    return articles.map((a, i) => ({ ...a, isLatest: i === 0 }));

  } catch (error) {
    console.error("Blog-KI-Fehler:", error);
    return [
      {
        id: "err-1",
        title: "Aktuelle Marktentwicklungen 2025",
        summary: "Die Zinswende und ihre Auswirkungen auf die Mietverwaltung.",
        fullContent: "Experten erwarten eine Stabilisierung der Mietpreise...",
        category: "News",
        date: "11.03.2025",
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
