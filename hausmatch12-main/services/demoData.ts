// Platzhalter-/Seed-Daten. Werden in der UI angezeigt, solange die echten
// Firestore-Collections leer sind, damit die Seite zum Start belebt wirkt.
// Sobald echte Inhalte existieren, verschwinden sie automatisch. Es sind keine
// echten Nutzer (interne authorId: 'muster'); sie sind nicht in der Datenbank
// gespeichert. Zum Entfernen: Verweise auf DEMO_* in Network/Forum/Marktplatz lösen.

import { User, SchwarztesBrettPost, ForumThread } from '../types';

const daysAgo = (d: number) => {
  const seconds = Math.floor(Date.now() / 1000) - d * 86400;
  return { seconds, nanoseconds: 0, toDate: () => new Date(seconds * 1000) };
};

// ─── Hausverwaltungen / Profis (Netzwerk) ───────────────────────────────────────
export const DEMO_MANAGERS: User[] = [
  {
    id: 'muster-hv-1', email: 'kontakt@hausverwaltung-rheinland.de', name: 'Hausverwaltung Rheinland GmbH',
    role: 'manager', userType: 'hausverwaltung', companyName: 'Hausverwaltung Rheinland GmbH',
    city: 'Köln', location: 'Köln', region: 'Nordrhein-Westfalen',
    specialization: ['WEG-Verwaltung', 'Mietverwaltung'], bio: 'WEG- und Mietverwaltung im Rheinland mit Fokus auf transparente Abrechnung.', verified: true, friends: [],
  },
  {
    id: 'muster-hv-2', email: 'info@isar-immobilien.de', name: 'Isar Immobilienmanagement',
    role: 'manager', userType: 'hausverwaltung', companyName: 'Isar Immobilienmanagement',
    city: 'München', location: 'München', region: 'Bayern',
    specialization: ['WEG-Verwaltung', 'Sondereigentum'], bio: 'Verwaltung im Großraum München, digitale Abrechnung und kurze Reaktionszeiten.', verified: true, friends: [],
  },
  {
    id: 'muster-hv-3', email: 'team@spree-verwaltung.de', name: 'Spree Verwaltung Berlin',
    role: 'manager', userType: 'hausverwaltung', companyName: 'Spree Verwaltung Berlin',
    city: 'Berlin', location: 'Berlin', region: 'Berlin',
    specialization: ['Mietverwaltung', 'Gewerbe'], bio: 'Miet- und Gewerbeverwaltung in Berlin und Umland.', friends: [],
  },
  {
    id: 'muster-hv-4', email: 'hallo@elbe-hausverwaltung.de', name: 'Elbe Hausverwaltung',
    role: 'manager', userType: 'hausverwaltung', companyName: 'Elbe Hausverwaltung',
    city: 'Hamburg', location: 'Hamburg', region: 'Hamburg',
    specialization: ['WEG-Verwaltung', 'Technisches Management'], bio: 'WEG-Spezialist im Norden mit technischem Objektmanagement.', verified: true, friends: [],
  },
  {
    id: 'muster-profi-1', email: 'kanzlei@mietrecht-sued.de', name: 'Kanzlei Mietrecht Süd',
    role: 'profi', userType: 'anwalt', companyName: 'Kanzlei Mietrecht Süd',
    city: 'Stuttgart', location: 'Stuttgart', region: 'Baden-Württemberg',
    specialization: ['Mietrecht', 'WEG-Recht'], bio: 'Rechtsberatung rund um Miet- und WEG-Recht.', friends: [],
  },
  {
    id: 'muster-profi-2', email: 'buero@energieberatung-mitte.de', name: 'Energieberatung Mitte',
    role: 'profi', userType: 'energieberater', companyName: 'Energieberatung Mitte',
    city: 'Frankfurt', location: 'Frankfurt', region: 'Hessen',
    specialization: ['Energieberatung', 'Sanierung'], bio: 'Energieausweise, Sanierungsfahrpläne und Fördermittelberatung.', friends: [],
  },
];

// ─── Marktplatz-Beiträge ────────────────────────────────────────────────────────
export const DEMO_POSTS: SchwarztesBrettPost[] = [
  {
    id: 'muster-post-1', title: 'Hausverwaltung für WEG mit 24 Einheiten gesucht',
    content: 'Wir suchen zum nächsten Quartal eine zuverlässige WEG-Verwaltung in Köln. Bestandsobjekt, gepflegt, 24 Einheiten.',
    category: 'Auftrag', authorId: 'muster', authorName: 'Eigentümergemeinschaft Köln', authorType: 'weg',
    city: 'Köln', budget: 'ca. 22 €/Einheit/Monat', contactInfo: 'Kontakt über HausMatch', createdAt: daysAgo(1),
  },
  {
    id: 'muster-post-2', title: 'Biete Sondereigentumsverwaltung im Raum München',
    content: 'Freie Kapazitäten für SEV in München und Umland. Digitale Abrechnung, kurze Reaktionszeiten.',
    category: 'Angebot', authorId: 'muster', authorName: 'Isar Immobilienmanagement', authorType: 'hausverwaltung',
    city: 'München', budget: 'auf Anfrage', contactInfo: 'Kontakt über HausMatch', createdAt: daysAgo(2),
  },
  {
    id: 'muster-post-3', title: 'Suche Handwerker-Partner (Sanitär/Heizung)',
    content: 'Für laufende Objekte in Berlin suchen wir einen verlässlichen SHK-Betrieb für Wartung und kleinere Reparaturen.',
    category: 'Handwerker', authorId: 'muster', authorName: 'Spree Verwaltung Berlin', authorType: 'hausverwaltung',
    city: 'Berlin', contactInfo: 'Kontakt über HausMatch', createdAt: daysAgo(3),
  },
  {
    id: 'muster-post-4', title: 'Empfehlung: Energieberater für Sanierungsfahrplan',
    content: 'Können die Energieberatung Mitte für iSFP und Energieausweise weiterempfehlen, gute Erfahrung bei zwei Objekten.',
    category: 'Empfehlung', authorId: 'muster', authorName: 'Elbe Hausverwaltung', authorType: 'hausverwaltung',
    city: 'Hamburg', createdAt: daysAgo(4),
  },
  {
    id: 'muster-post-5', title: 'Gesuch: Übernahme Mietverwaltung 8 Einheiten',
    content: 'Privater Eigentümer sucht Mietverwaltung für ein Mehrfamilienhaus in Stuttgart, 8 Wohneinheiten.',
    category: 'Gesuch', authorId: 'muster', authorName: 'Privateigentümer Stuttgart', authorType: 'owner',
    city: 'Stuttgart', budget: 'nach Vereinbarung', contactInfo: 'Kontakt über HausMatch', createdAt: daysAgo(6),
  },
  {
    id: 'muster-post-6', title: 'Info-Webinar zur WEG-Reform',
    content: 'Kostenloses Online-Webinar zu den Neuerungen im WEG-Recht, für Eigentümer und Verwalter.',
    category: 'Ankündigung', authorId: 'muster', authorName: 'Kanzlei Mietrecht Süd', authorType: 'anwalt',
    city: 'Stuttgart', createdAt: daysAgo(8),
  },
];

// ─── Forum-Themen ───────────────────────────────────────────────────────────────
export const DEMO_THREADS: ForumThread[] = [
  {
    id: 'muster-thread-1', title: 'Wie oft prüft ihr die Betriebskostenabrechnung nach?',
    content: 'Wie geht ihr bei der Nachprüfung der Betriebskostenabrechnung vor? Stichprobe oder alles?',
    author: 'Isar Immobilienmanagement', authorId: 'muster', authorType: 'hausverwaltung',
    category: 'Best Practice', replies: 4, views: 128, likes: 6, createdAt: daysAgo(2), date: '—',
  },
  {
    id: 'muster-thread-2', title: 'Urteil: Zustimmung zur baulichen Veränderung',
    content: 'Kurze Zusammenfassung eines aktuellen Urteils zur baulichen Veränderung in der WEG.',
    author: 'Kanzlei Mietrecht Süd', authorId: 'muster', authorType: 'anwalt',
    category: 'Recht & Urteile', replies: 7, views: 342, likes: 12, createdAt: daysAgo(3), date: '—',
  },
  {
    id: 'muster-thread-3', title: 'Welche Verwalter-Software nutzt ihr?',
    content: 'Suche Erfahrungswerte zu gängiger Verwalter-Software: Buchhaltung, Portal, App.',
    author: 'Spree Verwaltung Berlin', authorId: 'muster', authorType: 'hausverwaltung',
    category: 'Software & Tech', replies: 11, views: 507, likes: 9, createdAt: daysAgo(5), date: '—',
  },
  {
    id: 'muster-thread-4', title: 'Guter SHK-Betrieb im Raum Hamburg?',
    content: 'Empfehlungen für zuverlässige Sanitär-/Heizungsbetriebe im Hamburger Norden?',
    author: 'Elbe Hausverwaltung', authorId: 'muster', authorType: 'hausverwaltung',
    category: 'Handwerker & Services', replies: 3, views: 96, likes: 2, createdAt: daysAgo(7), date: '—',
  },
  {
    id: 'muster-thread-5', title: 'Feedback zur neuen Marktplatz-Ansicht',
    content: 'Wie gefällt euch der zusammengeführte Marktplatz? Was fehlt euch noch?',
    author: 'Energieberatung Mitte', authorId: 'muster', authorType: 'energieberater',
    category: 'Feedback', replies: 5, views: 174, likes: 4, createdAt: daysAgo(9), date: '—',
  },
];
