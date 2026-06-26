// ─── USER TYPES ───────────────────────────────────────────────────────────────

export type UserRole = 'seeker' | 'manager' | 'profi';

export type UserType =
  | 'owner'          // Privater Eigentümer
  | 'weg'            // WEG / Eigentümergemeinschaft
  | 'hausverwaltung' // Professionelle Hausverwaltung
  | 'makler'         // Immobilienmakler
  | 'anwalt'         // Rechtsanwalt (Miet-/Immobilienrecht)
  | 'architekt'      // Architekt / Planer
  | 'gutachter'      // Immobiliengutachter
  | 'handwerker'     // Handwerker / Facility
  | 'energieberater' // Energieberater
  | 'sonstige_profi'; // Sonstige Immobilienprofis

export const USER_TYPE_LABELS: Record<UserType, string> = {
  owner: 'Eigentümer',
  weg: 'WEG / Eigentümergemeinschaft',
  hausverwaltung: 'Hausverwaltung',
  makler: 'Immobilienmakler',
  anwalt: 'Rechtsanwalt',
  architekt: 'Architekt',
  gutachter: 'Gutachter',
  handwerker: 'Handwerker',
  energieberater: 'Energieberater',
  sonstige_profi: 'Sonstiger Profi',
};

export const IS_PRO_TYPE = (t: UserType) =>
  !['owner', 'weg'].includes(t);

// ─── BADGE & POINTS SYSTEM ─────────────────────────────────────────────────────

export type BadgeTier = 'bronze' | 'silber' | 'gold' | 'platin';

export interface Badge {
  id: string;
  tier: BadgeTier;
  label: string;
  description: string;
  pointsRequired: number;
  icon: string; // emoji
}

export const BAGGE_TIERS: Badge[] = [
  { id: 'bronze',  tier: 'bronze',  label: 'Bronze-Experte',  description: 'Aktiv in der Community',       pointsRequired: 50,   icon: '🥉' },
  { id: 'silber',  tier: 'silber',  label: 'Silber-Experte',  description: 'Regelmäßig hilfreiche Beiträge', pointsRequired: 200,  icon: '🥈' },
  { id: 'gold',    tier: 'gold',    label: 'Gold-Experte',    description: 'Top-Contributor der Community', pointsRequired: 500,  icon: '🥇' },
  { id: 'platin',  tier: 'platin',  label: 'Platin-Experte',  description: 'Herausragende Expertise',       pointsRequired: 1000, icon: '💎' },
];

export type SpecialtyBadge =
  | 'weg_experte'
  | 'mietrecht_profi'
  | 'energie_berater'
  | 'wohnraum_experte'
  | 'top_responder'
  | 'community_star';

export const SPECIACTY_BADGD_LABELS: Record<SpecialtyBadge, { label: string; icon: string }> = {
  weg_experte:       { label: 'WEG-Experte',       icon: '🏛️' },
  mietrecht_profi:   { label: 'Mietrecht-Profi',   icon: '⚖️' },
  energie_berater:   { label: 'Energie-Experte',   icon: '♻️' },
  wohnraum_experte:  { label: 'Wohnraum-Experte',  icon: '🏠' },
  top_responder:     { label: 'Top-Responder',     icon: '💬' },
  community_star:    { label: 'Community-Star',    icon: '⭐' },
};

export interface UserPoints {
  userId: string;
  total: number;
  tier: BadgeTier | null;
  specialtyBadges: SpecialtyBadge[];
  breakdown: {
    forumPosts: number;
    forumReplies: number;
    helpfulAnswers: number;
    likesReceived: number;
  };
  updatedAt: FirebaseTimestamp;
}

// Points per action
export const POINT_VALUES = {
  forumPost: 10,
  forumReply: 5,
  helpfulAnswer: 20,
  likeReceived: 2,
};

export function getTierForPoints(points: number): BadgeTier | null {
  if (points >= 1000) return 'platin';
  if (points >= 500)  return 'gold';
  if (points >= 200)  return 'silber';
  if (points >= 50)   return 'bronze';
  return null;
}

// ─── USER ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole; // legacy, keep for compatibility
  userType: UserType;
  avatar?: string;
  bio?: string;
  location?: string;
  city?: string;
  specialization?: string[];
  experienceYears?: number;
  phone?: string;
  website?: string;
  friends?: string[];
  pendingFriends?: string[];
  // Points & Badges (denormalized for quick display)
  points?: number;
  badgeTier?: BadgeTier | null;
  specialtyBadges?: SpecialtyBadge[];
  // Pro fields
  companyName?: string;
  serviceAreas?: string[]; // Städte/PLZ-Bereiche
  openingHours?: {
    mon?: string; tue?: string; wed?: string;
    thu?: string; fri?: string; sat?: string; sun?: string;
  };
  teamSize?: number;
  foundedYear?: number;
  vatId?: string;
  verified?: boolean;
  // Owner fields
  propertyCount?: number;
  propertyTypes?: string[];
}

// ─── AUFGABEN BOARD ────────────────────────────────────────────────────────────

export const AUFGABEN_CATEGORIES = [
  'Hausverwaltung',
  'Reparatur & Handwerk',
  'Energieberatung',
  'Rechtsberatung',
  'Gutachten & Bewertung',
  'Makler',
  'Sanierung & Umbau',
  'Sonstiges',
] as const;

export type AufgabenCategory = typeof AUFGABEN_CATEGORIES[number];

// ─── MATCHING / REQUESTS ──────────────────────────────────────────────────────

export type MatchRequestStatus =
  | 'offen'       // Sichtbar für alle Profis
  | 'inBearbeitung' // Mind. 1 Bewerbung eingegangen
  | 'vergeben'    // Verwalter ausgewählt
  | 'archiviert'; // Geschlossen

export interface MatchRequest {
  id: string;
  // Owner info
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  // Property info
  city: string;
  zip?: string;
  units: number;
  propertyType: 'WEG' | 'Mietshaus' | 'Gewerbe' | 'Eigentumswohnung';
  buildingAge: string;
  condition: string;
  servicesNeeded: string[];
  description: string;
  budget?: string; // z.B. "bis 30€ pro Einheit"
  title?: string;
  category?: AufgabenCategory;
  applicationCount?: number;
  // Meta
  status: MatchRequestStatus;
  createdAt: FirebaseTimestamp;
  applications?: MatchApplication[];
  selectedManagerId?: string;
  aiAnalysis?: InquiryAnalysis;
}

export interface MatchApplication {
  id: string;
  requestId: string;
  managerId: string;
  managerName: string;
  managerAvatar?: string;
  badgeTier?: BadgeTier | null;
  coverText: string;
  proposedPrice?: string;
  createdAt: FirebaseTimestamp;
  status: 'ausstehend' | 'angenommen' | 'abgelehnt';
}

// ─── FORUM ─────────────────────────────────────────────────────────────────────

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  authorType?: UserType;
  authorBadgeTier?: BadgeTier | null;
  category: string;
  replies: number;
  views: number;
  likes?: number;
  likedBy?: string[];
  helpfulAnswerCount?: number;
  createdAt: FirebaseTimestamp;
  lastActivity?: FirebaseTimestamp;
  hasRead?: boolean;
  date?: string;
  pinned?: boolean;
}

export interface ForumReply {
  id: string;
  threadId: string;
  author: string;
  authorId: string;
  authorType?: UserType;
  authorBadgeTier?: BadgeTier | null;
  content: string;
  likes?: number;
  likedBy?: string[];
  isHelpful?: boolean;
  markedHelpfulBy?: string;
  createdAt: FirebaseTimestamp;
}

// ─── REVIEW ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  requestId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  createdAt: FirebaseTimestamp;
}

// ─── MESSAGING ─────────────────────────────────────────────────────────────────

export interface MessageAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: FirebaseTimestamp;
  read: boolean;
  attachments?: MessageAttachment[];
}

// ─── LEGACY / COMPATIBILITY ────────────────────────────────────────────────────

export interface Inquiry {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  city: string;
  units: number;
  propertyType: 'WEG' | 'Mietshaus' | 'Gewerbe';
  servicesNeeded: string[];
  buildingAge: string;
  condition: string;
  description: string;
  status: 'neu' | 'kontaktiert' | 'archiviert' | 'offen' | 'claimed' | 'closed';
  createdAt: FirebaseTimestamp;
  aiAnalysis?: InquiryAnalysis;
}

export interface InquiryAnalysis {
  summary: string;
  keyRequirements: string[];
  estimatedEffort: 'Niedrig' | 'Mittel' | 'Hoch';
  recommendedTags: string[];
  legalAdviceSnippet: string;
}

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

export interface SearchCompany {
  name: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  email: string;
  rating: number;
  reviews: number;
  specialization: string;
  isPartner?: boolean;
}

export interface ManagerSearchResult {
  introText: string;
  sources: { title: string; url: string }[];
  companies: SearchCompany[];
}

export interface BlogArticle {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  category: 'Recht' | 'Technik' | 'Management' | 'News';
  date: string;
  isLatest: boolean;
  sources?: { title: string; url: string }[];
}
