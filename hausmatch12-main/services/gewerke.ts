// ─── Zentrale Gewerk-Konfiguration ──────────────────────────────────────────
// Eine Quelle der Wahrheit für den Vermittlungs-Funnel: pro Gewerk die passenden
// Fragen, der Google-Suchbegriff, die Labels und der serviceType, der an die
// E-Mail-/Magic-Link-Logik (api/send-inquiry.ts, api/_emailTemplates.ts) geht.
// Die "key"-Werte entsprechen den UserType-Werten aus types.ts.

export type FieldKind = 'text' | 'number' | 'select' | 'chips' | 'textarea';

export interface FunnelField {
  kind: FieldKind;
  key: string;
  label: string;
  placeholder?: string;
  options?: string[];   // für select / chips
  required?: boolean;
}

export interface GewerkDef {
  key: string;
  /** Was der Nutzer sucht, z. B. "Hausverwaltung" */
  label: string;
  labelPlural: string;
  /** Akkusativ mit unbestimmtem Artikel, z. B. "eine Hausverwaltung" / "einen Rechtsanwalt" */
  akk: string;
  /** kurze Erklärung für die Auswahl-Kachel */
  tagline: string;
  /** Emoji-Icon für die Kachel (leichtgewichtig, kein SVG nötig) */
  icon: string;
  /** Basis-Suchbegriff für die Google-Suche in /api/search */
  searchTerm: string;
  /** Fragen des Funnels (ohne Stadt, die wird immer separat abgefragt) */
  fields: FunnelField[];
}

// Antworten des Funnels: Feld-Key -> Wert (String oder String-Liste bei chips).
export type FunnelAnswers = Record<string, string | string[]>;

// Schlüssel, unter dem der Wizard die zusammengebaute Anfrage-Beschreibung für
// die nächste Funnel-Station (SearchResults/ExpressModal) im sessionStorage ablegt.
export const FUNNEL_MESSAGE_KEY = 'hm_funnel_message';

const DESCRIPTION_FIELD = (placeholder: string): FunnelField => ({
  kind: 'textarea', key: 'description', label: 'Beschreibung / Freitext', placeholder,
});

export const GEWERKE: GewerkDef[] = [
  {
    key: 'hausverwaltung',
    label: 'Hausverwaltung', labelPlural: 'Hausverwaltungen', akk: 'eine Hausverwaltung',
    tagline: 'WEG-, Miet- & Sondereigentumsverwaltung',
    icon: '🏢',
    searchTerm: 'Hausverwaltung',
    fields: [
      { kind: 'number', key: 'units', label: 'Anzahl Einheiten', placeholder: 'z. B. 12' },
      { kind: 'select', key: 'propertyType', label: 'Objekttyp', options: ['WEG (Wohnungseigentum)', 'Mietshaus (Globalobjekt)', 'Gewerbeimmobilie'], required: true },
      { kind: 'text', key: 'buildingAge', label: 'Baujahr (ca.)', placeholder: 'z. B. 1980' },
      { kind: 'select', key: 'condition', label: 'Zustand des Objekts', options: ['Sehr gut / Saniert', 'Gepflegt', 'Renovierungsbedürftig', 'Sanierungsstau'] },
      { kind: 'chips', key: 'services', label: 'Benötigte Leistungen', options: ['WEG-Verwaltung', 'Mietverwaltung', 'Sondereigentum (SEV)', 'Buchhaltung & Abrechnung', 'Technische Betreuung', 'Instandhaltung', 'Eigentümerversammlung'] },
      DESCRIPTION_FIELD('Besonderheiten, Probleme oder Wünsche an die neue Verwaltung …'),
    ],
  },
  {
    key: 'makler',
    label: 'Immobilienmakler', labelPlural: 'Immobilienmakler', akk: 'einen Immobilienmakler',
    tagline: 'Kauf, Verkauf & Vermietung',
    icon: '🔑',
    searchTerm: 'Immobilienmakler',
    fields: [
      { kind: 'select', key: 'intent', label: 'Ihr Anliegen', options: ['Verkaufen', 'Vermieten', 'Kaufen', 'Nur Bewertung'], required: true },
      { kind: 'select', key: 'propertyType', label: 'Objektart', options: ['Eigentumswohnung', 'Einfamilienhaus', 'Mehrfamilienhaus', 'Grundstück', 'Gewerbeimmobilie'], required: true },
      { kind: 'text', key: 'priceIdea', label: 'Preisvorstellung (optional)', placeholder: 'z. B. 350.000 €' },
      DESCRIPTION_FIELD('Beschreiben Sie das Objekt und Ihr Anliegen …'),
    ],
  },
  {
    key: 'anwalt',
    label: 'Rechtsanwalt', labelPlural: 'Rechtsanwälte', akk: 'einen Rechtsanwalt',
    tagline: 'Miet-, WEG- & Immobilienrecht',
    icon: '⚖️',
    searchTerm: 'Rechtsanwalt Mietrecht Immobilienrecht',
    fields: [
      { kind: 'select', key: 'area', label: 'Rechtsgebiet', options: ['Mietrecht', 'WEG-Recht', 'Kauf-/Vertragsrecht', 'Baurecht', 'Erbrecht (Immobilie)', 'Sonstiges'], required: true },
      { kind: 'select', key: 'urgency', label: 'Dringlichkeit', options: ['Dringend (Frist läuft)', 'Zeitnah', 'Unverbindliche Erstberatung'], required: true },
      DESCRIPTION_FIELD('Schildern Sie Ihr Anliegen kurz (ohne sensible Details) …'),
    ],
  },
  {
    key: 'architekt',
    label: 'Architekt', labelPlural: 'Architekten', akk: 'einen Architekten',
    tagline: 'Planung, Umbau & Bauleitung',
    icon: '📐',
    searchTerm: 'Architekt',
    fields: [
      { kind: 'select', key: 'projectType', label: 'Projektart', options: ['Neubau', 'Umbau / Anbau', 'Sanierung', 'Nur Planung / Beratung'], required: true },
      { kind: 'chips', key: 'phases', label: 'Gewünschte Leistungen', options: ['Entwurfsplanung', 'Genehmigungsplanung', 'Ausführungsplanung', 'Bauleitung', 'Beratung'] },
      { kind: 'text', key: 'budget', label: 'Budgetrahmen (optional)', placeholder: 'z. B. 200.000 €' },
      DESCRIPTION_FIELD('Beschreiben Sie Ihr Bauvorhaben …'),
    ],
  },
  {
    key: 'gutachter',
    label: 'Gutachter', labelPlural: 'Gutachter', akk: 'einen Gutachter',
    tagline: 'Immobilienbewertung & Sachverständige',
    icon: '📋',
    searchTerm: 'Immobiliengutachter Sachverständiger',
    fields: [
      { kind: 'select', key: 'purpose', label: 'Anlass der Bewertung', options: ['Verkauf', 'Kauf', 'Erbschaft / Schenkung', 'Steuer / Finanzamt', 'Scheidung', 'Beleihung / Finanzierung'], required: true },
      { kind: 'select', key: 'propertyType', label: 'Objektart', options: ['Eigentumswohnung', 'Einfamilienhaus', 'Mehrfamilienhaus', 'Grundstück', 'Gewerbeimmobilie'], required: true },
      DESCRIPTION_FIELD('Beschreiben Sie das zu bewertende Objekt …'),
    ],
  },
  {
    key: 'handwerker',
    label: 'Handwerker', labelPlural: 'Handwerker', akk: 'einen Handwerker',
    tagline: 'Instandhaltung, Sanierung & Facility',
    icon: '🔧',
    searchTerm: 'Handwerker',
    fields: [
      { kind: 'select', key: 'trade', label: 'Fachbereich', options: ['Sanitär / Heizung', 'Elektro', 'Malerei / Bodenleger', 'Dach / Zimmerei', 'Fenster / Türen', 'Garten / Außenanlagen', 'Sonstiges'], required: true },
      { kind: 'select', key: 'urgency', label: 'Dringlichkeit', options: ['Notfall', 'Dringend', 'Planbar'], required: true },
      DESCRIPTION_FIELD('Beschreiben Sie die auszuführenden Arbeiten …'),
    ],
  },
  {
    key: 'energieberater',
    label: 'Energieberater', labelPlural: 'Energieberater', akk: 'einen Energieberater',
    tagline: 'Sanierung, Förderung & GEG',
    icon: '⚡',
    searchTerm: 'Energieberater',
    fields: [
      { kind: 'select', key: 'goal', label: 'Ihr Ziel', options: ['Individueller Sanierungsfahrplan (iSFP)', 'Förderberatung (BEG/BAFA/KfW)', 'GEG-Nachweis / Energieausweis', 'Vor-Ort-Energieberatung'], required: true },
      { kind: 'text', key: 'buildingAge', label: 'Baujahr (ca.)', placeholder: 'z. B. 1975' },
      DESCRIPTION_FIELD('Beschreiben Sie Ihr Gebäude und Vorhaben …'),
    ],
  },
  {
    key: 'versicherungsmakler',
    label: 'Versicherungsmakler', labelPlural: 'Versicherungsmakler', akk: 'einen Versicherungsmakler',
    tagline: 'Gebäude-, Haftpflicht- & Mietausfallschutz',
    icon: '🛡️',
    searchTerm: 'Versicherungsmakler Gebäudeversicherung Immobilien',
    fields: [
      { kind: 'chips', key: 'insurances', label: 'Gewünschte Versicherungen', options: ['Wohngebäudeversicherung', 'Haus- & Grundbesitzerhaftpflicht', 'Mietausfallversicherung', 'Vermieter-Rechtsschutz', 'Elementarschaden', 'Glasversicherung', 'D&O / Verwalterhaftpflicht'] },
      { kind: 'select', key: 'propertyType', label: 'Objektart', options: ['Eigentumswohnung', 'Einfamilienhaus', 'Mehrfamilienhaus', 'WEG-Objekt', 'Gewerbeimmobilie'], required: true },
      { kind: 'number', key: 'units', label: 'Anzahl Einheiten', placeholder: 'z. B. 12' },
      { kind: 'select', key: 'intent', label: 'Ihr Anliegen', options: ['Bestehende Policen prüfen / vergleichen', 'Neuabschluss', 'Nach Schadensfall wechseln', 'Unverbindliche Beratung'], required: true },
      DESCRIPTION_FIELD('Beschreiben Sie das Objekt und Ihren Versicherungsbedarf …'),
    ],
  },
  {
    key: 'sonstige_profi',
    label: 'Sonstiger Dienstleister', labelPlural: 'Dienstleister', akk: 'einen Dienstleister',
    tagline: 'Andere Immobilienprofis',
    icon: '🧩',
    searchTerm: 'Immobiliendienstleister',
    fields: [
      { kind: 'text', key: 'topic', label: 'Worum geht es?', placeholder: 'z. B. Home Staging, Umzug, Reinigung', required: true },
      DESCRIPTION_FIELD('Beschreiben Sie Ihr Anliegen …'),
    ],
  },
];

const GEWERK_MAP: Record<string, GewerkDef> = Object.fromEntries(GEWERKE.map(g => [g.key, g]));

/** Gewerk zu einem Key; Fallback ist Hausverwaltung. */
export const resolveGewerk = (key?: string | null): GewerkDef =>
  (key && GEWERK_MAP[key]) || GEWERK_MAP.hausverwaltung;

/** Baut aus den Funnel-Antworten einen lesbaren Beschreibungstext für die Anfrage/E-Mail. */
export function buildInquiryMessage(gewerk: GewerkDef, city: string, answers: FunnelAnswers): string {
  const lines: string[] = [`Gesuchtes Gewerk: ${gewerk.label}`, `Region: ${city || 'nicht angegeben'}`];
  for (const field of gewerk.fields) {
    const val = answers[field.key];
    if (val == null || (Array.isArray(val) && val.length === 0) || val === '') continue;
    const text = Array.isArray(val) ? val.join(', ') : String(val);
    lines.push(`${field.label}: ${text}`);
  }
  return lines.join('\n');
}

/** Suchbegriff für /api/search (Google), z. B. "Immobilienmakler München". */
export const buildSearchQuery = (gewerk: GewerkDef, city: string): string =>
  `${gewerk.searchTerm} ${city}`.trim();
