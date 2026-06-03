
export type UserRole = 'seeker' | 'manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  location?: string;
  specialization?: string[]; // Für Verwalter: WEG, Miet, Gewerbe
  experienceYears?: number;
  phone?: string;
  website?: string;
  friends?: string[]; // Liste von User-IDs
  pendingFriends?: string[];
  // Erweiterte Unternehmens-Felder
  openingHours?: {
    mon?: string;
    tue?: string;
    wed?: string;
    thu?: string;
    fri?: string;
    sat?: string;
    sun?: string;
  };
  teamSize?: number;
  foundedYear?: number;
  vatId?: string;
}

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

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

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: string;
  replies: number;
  views: number;
  createdAt: FirebaseTimestamp;
  lastActivity?: FirebaseTimestamp;
  hasRead?: boolean;
  date?: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: FirebaseTimestamp;
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
}

export interface ManagerSearchResult {
  introText: string;
  sources: { title: string; url: string }[];
}

export interface BlogArticle {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  category: "Recht" | "Technik" | "Management" | "News";
  date: string;
  isLatest: boolean;
  sources?: { title: string; url: string }[];
}
