// Zentrale Gewerke-Liste für die Multi-Profi-Suche. Steuert die Auswahl auf
// der Startseite, den Google-Suchbegriff (/api/search), die Netzwerk-Abfrage
// (userType-Filter) und die Beschriftungen auf der Ergebnisseite.

import { UserType } from '../types';

export interface Trade {
  id: string;
  label: string;
  plural: string;
  searchTerm: string;
}

export interface Profession {
  id: string;
  label: string;      // Singular, z. B. "Hausverwaltung"
  plural: string;     // z. B. "Hausverwaltungen" (für Texte wie "Passende ... in Köln")
  searchTerm: string; // Google-Suchbegriff, wird mit der Stadt kombiniert
  userTypes: UserType[]; // passende Netzwerk-Profile
  trades?: Trade[];   // optionale zweite Ebene (Handwerks-Gewerke)
}

// Gängige Handwerks-Gewerke rund um die Immobilie. "alle" = unspezifisch.
export const HANDWERK_GEWERKE: Trade[] = [
  { id: 'alle',        label: 'Alle Gewerke',           plural: 'Handwerksbetriebe',      searchTerm: 'Handwerksbetrieb Sanierung Instandhaltung' },
  { id: 'shk',         label: 'Sanitär & Heizung',      plural: 'SHK-Betriebe',           searchTerm: 'Sanitär Heizung Klima Installateur SHK' },
  { id: 'elektro',     label: 'Elektriker',             plural: 'Elektro-Betriebe',       searchTerm: 'Elektriker Elektroinstallation' },
  { id: 'dachdecker',  label: 'Dachdecker',             plural: 'Dachdecker-Betriebe',    searchTerm: 'Dachdeckerei Dachdecker' },
  { id: 'maler',       label: 'Maler & Lackierer',      plural: 'Maler-Betriebe',         searchTerm: 'Malerbetrieb Maler und Lackierer' },
  { id: 'fliesen',     label: 'Fliesenleger',           plural: 'Fliesenleger-Betriebe',  searchTerm: 'Fliesenleger' },
  { id: 'tischler',    label: 'Tischler / Schreiner',   plural: 'Tischlereien',           searchTerm: 'Tischlerei Schreinerei' },
  { id: 'zimmerer',    label: 'Zimmerer / Holzbau',     plural: 'Zimmereien',             searchTerm: 'Zimmerei Holzbau' },
  { id: 'maurer',      label: 'Maurer / Rohbau',        plural: 'Bau-Betriebe',           searchTerm: 'Bauunternehmen Maurer Rohbau' },
  { id: 'fenster',     label: 'Fensterbau / Glaser',    plural: 'Fensterbau-Betriebe',    searchTerm: 'Fensterbau Glaserei' },
  { id: 'bodenleger',  label: 'Bodenleger / Parkett',   plural: 'Bodenleger-Betriebe',    searchTerm: 'Bodenleger Parkettleger' },
  { id: 'trockenbau',  label: 'Trockenbau',             plural: 'Trockenbau-Betriebe',    searchTerm: 'Trockenbau' },
  { id: 'schlosser',   label: 'Schlosser / Metallbau',  plural: 'Metallbau-Betriebe',     searchTerm: 'Schlosserei Metallbau' },
  { id: 'galabau',     label: 'Garten- & Landschaftsbau', plural: 'GaLaBau-Betriebe',     searchTerm: 'Garten- und Landschaftsbau' },
  { id: 'hausmeister', label: 'Hausmeisterservice',     plural: 'Hausmeisterservices',    searchTerm: 'Hausmeisterservice Objektbetreuung' },
  { id: 'reinigung',   label: 'Gebäudereinigung',       plural: 'Reinigungs-Betriebe',    searchTerm: 'Gebäudereinigung' },
];

export const PROFESSIONS: Profession[] = [
  { id: 'hausverwaltung', label: 'Hausverwaltung',   plural: 'Hausverwaltungen',  searchTerm: 'Hausverwaltung',                              userTypes: ['hausverwaltung'] },
  { id: 'makler',         label: 'Immobilienmakler', plural: 'Immobilienmakler',  searchTerm: 'Immobilienmakler',                            userTypes: ['makler'] },
  { id: 'anwalt',         label: 'Rechtsanwalt',     plural: 'Rechtsanwälte',     searchTerm: 'Rechtsanwalt Mietrecht Immobilienrecht',      userTypes: ['anwalt'] },
  { id: 'handwerker',     label: 'Handwerker',       plural: 'Handwerksbetriebe', searchTerm: 'Handwerksbetrieb Sanierung Instandhaltung',   userTypes: ['handwerker'], trades: HANDWERK_GEWERKE },
  { id: 'energieberater', label: 'Energieberater',   plural: 'Energieberater',    searchTerm: 'Energieberater Gebäude',                      userTypes: ['energieberater'] },
  { id: 'gutachter',      label: 'Gutachter',        plural: 'Gutachter',         searchTerm: 'Immobiliengutachter Sachverständiger',        userTypes: ['gutachter'] },
  { id: 'architekt',      label: 'Architekt',        plural: 'Architekten',       searchTerm: 'Architekturbüro',                             userTypes: ['architekt'] },
];

export const getProfession = (id?: string | null): Profession =>
  PROFESSIONS.find(p => p.id === id) || PROFESSIONS[0];

// Liefert das effektive Suchziel: bei gewähltem Handwerks-Gewerk dessen
// Label/Suchbegriff, sonst das Gewerk-übergreifende der Profession.
export const resolveSearchTarget = (professionId?: string | null, tradeId?: string | null) => {
  const prof = getProfession(professionId);
  const trade = tradeId ? prof.trades?.find(t => t.id === tradeId) : undefined;
  return trade && trade.id !== 'alle'
    ? { label: trade.label, plural: trade.plural, searchTerm: trade.searchTerm, userTypes: prof.userTypes }
    : { label: prof.label, plural: prof.plural, searchTerm: prof.searchTerm, userTypes: prof.userTypes };
};
