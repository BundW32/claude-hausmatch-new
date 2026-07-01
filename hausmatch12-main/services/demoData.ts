// Klar gekennzeichnete MUSTER-/Beispieldaten. Werden in der UI angezeigt,
// solange die echten Firestore-Collections leer sind, damit die Seite belebt
// wirkt. Alle Einträge sind bewusst mit "MUSTER" markiert und stammen von
// Platzhalter-Autoren (authorId: 'muster'), sind also keine echten Nutzer.

import { User, SchwarztesBrettPost, ForumThread } from '../types';

const daysAgo = (d: number) => {
  const seconds = Math.floor(Date.now() / 1000) - d * 86400;
  return { seconds, nanoseconds: 0, toDate: () => new Date(seconds * 1000) };
};

// ─── Muster-Hausverwaltungen (Netzwerk / Firmen) ────────────────────────────────
export const DEMO_MANAGERS: User[] = [
  {
    id: 'muster-hv-1', email: 'kontakt@muster-rheinland.example', name: 'MUSTER · Hausverwaltung Rheinland GmbH',
    role: 'manager', userType: 'hausverwaltung', companyName: 'MUSTER Hausverwaltung Rheinland GmbH',
    city: 'Köln', location: 'Köln', region: 'Nordrhein-Westfalen',
    specialization: ['WEG-Verwaltung', 'Mietverwaltung'], bio: 'Beispieldaten (Muster) – WEG- und Mietverwaltung im Rheinland.', verified: true, friends: [],
  },
  {
    id: 'muster-hv-2', email: 'info@muster-isar.example', name: 'MUSTER · Isar Immobilienmanagement',
    role: 'manager', userType: 'hausverwaltung', companyName: 'MUSTER Isar Immobilienmanagement',
    city: 'München', location: 'München', region: 'Bayern',
    specialization: ['WEG-Verwaltung', 'Sondereigentum'], bio: 'Beispieldaten (Muster) – Verwaltung im Großraum München.', verified: true, friends: [],
  },
  {
    id: 'muster-hv-3', email: 'team@muster-spree.example', name: 'MUSTER · Spree Verwaltung Berlin',
    role: 'manager', userType: 'hausverwaltung', companyName: 'MUSTER Spree Verwaltung Berlin',
    city: 'Berlin', location: 'Berlin', region: 'Berlin',
    specialization: ['Mietverwaltung', 'Gewerbe'], bio: 'Beispieldaten (Muster) – Miet- und Gewerbeverwaltung in Berlin.', friends: [],
  },
  {
    id: 'muster-hv-4', email: 'hallo@muster-elbe.example', name: 'MUSTER · Elbe Hausverwaltung',
    role: 'manager', userType: 'hausverwaltung', companyName: 'MUSTER Elbe Hausverwaltung',
    city: 'Hamburg', location: 'Hamburg', region: 'Hamburg',
    specialization: ['WEG-Verwaltung', 'Technisches Management'], bio: 'Beispieldaten (Muster) – WEG-Spezialist im Norden.', verified: true, friends: [],
  },
  {
    id: 'muster-profi-1', email: 'kanzlei@muster-mietrecht.example', name: 'MUSTER · Kanzlei Mietrecht Süd',
    role: 'profi', userType: 'anwalt', companyName: 'MUSTER Kanzlei Mietrecht Süd',
    city: 'Stuttgart', location: 'Stuttgart', region: 'Baden-Württemberg',
    specialization: ['Mietrecht', 'WEG-Recht'], bio: 'Beispieldaten (Muster) – Rechtsberatung rund um Miet- und WEG-Recht.', friends: [],
  },
  {
    id: 'muster-profi-2', email: 'buero@muster-energie.example', name: 'MUSTER · Energieberatung Mitte',
    role: 'profi', userType: 'energieberater', companyName: 'MUSTER Energieberatung Mitte',
    city: 'Frankfurt', location: 'Frankfurt', region: 'Hessen',
    specialization: ['Energieberatung', 'Sanierung'], bio: 'Beispieldaten (Muster) – Energieausweise und Sanierungsfahrpläne.', friends: [],
  },
];

// ─── Muster-Marktplatz-Beiträge ─────────────────────────────────────────────────
export const DEMO_POSTS: SchwarztesBrettPost[] = [
  {
    id: 'muster-post-1', title: '[MUSTER] Hausverwaltung für WEG mit 24 Einheiten gesucht',
    content: 'Beispieldaten (Muster). Wir suchen zum nächsten Quartal eine zuverlässige WEG-Verwaltung in Köln. Bestandsobjekt, gepflegt, 24 Einheiten.',
    category: 'Auftrag', authorId: 'muster', authorName: 'MUSTER · Eigentümergemeinschaft', authorType: 'weg',
    city: 'Köln', budget: 'ca. 22 €/Einheit/Monat', contactInfo: 'kontakt@muster.example', createdAt: daysAgo(1),
  },
  {
    id: 'muster-post-2', title: '[MUSTER] Biete Sondereigentumsverwaltung im Raum München',
    content: 'Beispieldaten (Muster). Freie Kapazitäten für SEV in München und Umland. Digitale Abrechnung, kurze Reaktionszeiten.',
    category: 'Angebot', authorId: 'muster', authorName: 'MUSTER · Isar Immobilienmanagement', authorType: 'hausverwaltung',
    city: 'München', budget: 'auf Anfrage', contactInfo: 'info@muster.example', createdAt: daysAgo(2),
  },
  {
    id: 'muster-post-3', title: '[MUSTER] Suche Handwerker-Partner (Sanitär/Heizung)',
    content: 'Beispieldaten (Muster). Für laufende Objekte in Berlin suchen wir einen verlässlichen SHK-Betrieb für Wartung und kleinere Reparaturen.',
    category: 'Handwerker', authorId: 'muster', authorName: 'MUSTER · Spree Verwaltung Berlin', authorType: 'hausverwaltung',
    city: 'Berlin', contactInfo: 'team@muster.example', createdAt: daysAgo(3),
  },
  {
    id: 'muster-post-4', title: '[MUSTER] Empfehlung: Energieberater für Sanierungsfahrplan',
    content: 'Beispieldaten (Muster). Können die Energieberatung Mitte für iSFP und Energieausweise weiterempfehlen – gute Erfahrung bei zwei Objekten.',
    category: 'Empfehlung', authorId: 'muster', authorName: 'MUSTER · Elbe Hausverwaltung', authorType: 'hausverwaltung',
    city: 'Hamburg', createdAt: daysAgo(4),
  },
  {
    id: 'muster-post-5', title: '[MUSTER] Gesuch: Übernahme Mietverwaltung 8 Einheiten',
    content: 'Beispieldaten (Muster). Privater Eigentümer sucht Mietverwaltung für ein Mehrfamilienhaus in Stuttgart, 8 Wohneinheiten.',
    category: 'Gesuch', authorId: 'muster', authorName: 'MUSTER · Privateigentümer', authorType: 'owner',
    city: 'Stuttgart', budget: 'nach Vereinbarung', contactInfo: 'eigentuemer@muster.example', createdAt: daysAgo(6),
  },
  {
    id: 'muster-post-6', title: '[MUSTER] Ankündigung: Info-Webinar WEG-Reform',
    content: 'Beispieldaten (Muster). Kostenloses Online-Webinar zu den Neuerungen im WEG-Recht – für Eigentümer und Verwalter.',
    category: 'Ankündigung', authorId: 'muster', authorName: 'MUSTER · Kanzlei Mietrecht Süd', authorType: 'anwalt',
    city: 'Stuttgart', createdAt: daysAgo(8),
  },
];

// ─── Muster-Forum-Themen ────────────────────────────────────────────────────────
export const DEMO_THREADS: ForumThread[] = [
  {
    id: 'muster-thread-1', title: '[MUSTER] Wie oft prüft ihr die Betriebskostenabrechnung nach?',
    content: 'Beispieldaten (Muster). Wie geht ihr bei der Nachprüfung der Betriebskostenabrechnung vor? Stichprobe oder alles?',
    author: 'MUSTER · Isar Immobilienmanagement', authorId: 'muster', authorType: 'hausverwaltung',
    category: 'Best Practice', replies: 4, views: 128, likes: 6, createdAt: daysAgo(2), date: '—',
  },
  {
    id: 'muster-thread-2', title: '[MUSTER] Urteil: Zustimmung zur baulichen Veränderung',
    content: 'Beispieldaten (Muster). Kurze Zusammenfassung eines aktuellen Urteils zur baulichen Veränderung in der WEG.',
    author: 'MUSTER · Kanzlei Mietrecht Süd', authorId: 'muster', authorType: 'anwalt',
    category: 'Recht & Urteile', replies: 7, views: 342, likes: 12, createdAt: daysAgo(3), date: '—',
  },
  {
    id: 'muster-thread-3', title: '[MUSTER] Welche Verwalter-Software nutzt ihr?',
    content: 'Beispieldaten (Muster). Suche Erfahrungswerte zu gängiger Verwalter-Software – Buchhaltung, Portal, App.',
    author: 'MUSTER · Spree Verwaltung Berlin', authorId: 'muster', authorType: 'hausverwaltung',
    category: 'Software & Tech', replies: 11, views: 507, likes: 9, createdAt: daysAgo(5), date: '—',
  },
  {
    id: 'muster-thread-4', title: '[MUSTER] Guter SHK-Betrieb im Raum Hamburg?',
    content: 'Beispieldaten (Muster). Empfehlungen für zuverlässige Sanitär-/Heizungsbetriebe im Hamburger Norden?',
    author: 'MUSTER · Elbe Hausverwaltung', authorId: 'muster', authorType: 'hausverwaltung',
    category: 'Handwerker & Services', replies: 3, views: 96, likes: 2, createdAt: daysAgo(7), date: '—',
  },
  {
    id: 'muster-thread-5', title: '[MUSTER] Feedback zur neuen Marktplatz-Ansicht',
    content: 'Beispieldaten (Muster). Wie gefällt euch der zusammengeführte Marktplatz? Was fehlt euch noch?',
    author: 'MUSTER · Energieberatung Mitte', authorId: 'muster', authorType: 'energieberater',
    category: 'Feedback', replies: 5, views: 174, likes: 4, createdAt: daysAgo(9), date: '—',
  },
];
