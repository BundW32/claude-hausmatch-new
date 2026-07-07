// Zentrale Gewerke-Liste für die Multi-Profi-Suche. Steuert die Auswahl auf
// der Startseite, den Google-Suchbegriff (/api/search), die Netzwerk-Abfrage
// (userType-Filter) und die Beschriftungen auf der Ergebnisseite.

import { UserType } from '../types';

export interface Profession {
  id: string;
  label: string;      // Singular, z. B. "Hausverwaltung"
  plural: string;     // z. B. "Hausverwaltungen" (für Texte wie "Passende ... in Köln")
  searchTerm: string; // Google-Suchbegriff, wird mit der Stadt kombiniert
  userTypes: UserType[]; // passende Netzwerk-Profile
}

export const PROFESSIONS: Profession[] = [
  { id: 'hausverwaltung', label: 'Hausverwaltung',   plural: 'Hausverwaltungen',  searchTerm: 'Hausverwaltung',                              userTypes: ['hausverwaltung'] },
  { id: 'makler',         label: 'Immobilienmakler', plural: 'Immobilienmakler',  searchTerm: 'Immobilienmakler',                            userTypes: ['makler'] },
  { id: 'anwalt',         label: 'Rechtsanwalt',     plural: 'Rechtsanwälte',     searchTerm: 'Rechtsanwalt Mietrecht Immobilienrecht',      userTypes: ['anwalt'] },
  { id: 'handwerker',     label: 'Handwerker',       plural: 'Handwerksbetriebe', searchTerm: 'Handwerksbetrieb Sanierung Instandhaltung',   userTypes: ['handwerker'] },
  { id: 'energieberater', label: 'Energieberater',   plural: 'Energieberater',    searchTerm: 'Energieberater Gebäude',                      userTypes: ['energieberater'] },
  { id: 'gutachter',      label: 'Gutachter',        plural: 'Gutachter',         searchTerm: 'Immobiliengutachter Sachverständiger',        userTypes: ['gutachter'] },
  { id: 'architekt',      label: 'Architekt',        plural: 'Architekten',       searchTerm: 'Architekturbüro',                             userTypes: ['architekt'] },
];

export const getProfession = (id?: string | null): Profession =>
  PROFESSIONS.find(p => p.id === id) || PROFESSIONS[0];
