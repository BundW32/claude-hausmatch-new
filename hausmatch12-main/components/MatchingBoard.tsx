import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/dataService';

interface Company {
  id?: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  email: string;
  rating: number;
  reviews: number;
  specialization: string;
  isPartner: boolean;
  partnerProfile?: {
    uid: string;
    name: string;
    profileImage?: string;
    description?: string;
  };
}

const StarRating = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(full)].map((_, i) => (
        <svg key={'f' + i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {half && (
        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <defs><linearGradient id="half"><stop offset="50%" stopColor="currentColor"/><stop offset="50%" stopColor="#e5e7eb"/></linearGradient></defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {[...Array(empty)].map((_, i) => (
        <svg key={'e' + i} className="w-3.5 h-3.5 text-slate-200" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
};

const ContactModal = ({ company, onClose }: { company: Company; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);

  const emailSubject = `Anfrage Hausverwaltung über HausMatch – ${company.name}`;
  const emailBody = `Sehr geehrte Damen und Herren,

Über die Plattform HausMatch bin ich auf Ihr Unternehmen aufmerksam geworden und interessiere mich für Ihre Verwaltungsdienstleistungen.

Ich bin Eigentümer einer Immobilie und suche eine professionelle Hausverwaltung (${company.specialization || 'WEG- oder Mietverwaltung'}).

Ich würde mich freuen, wenn Sie mit mir Kontakt aufnehmen, um die Details zu besprechen.

Mit freundlichen Grüßen,
[Ihr Name]
[Ihre Telefonnummer]

---
Diese Anfrage wurde über HausMatch.de vermittelt.`;

  const mailtoLink = `mailto:${company.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 rounded-t-2xl flex items-start justify-between">
          <div>
            <h3 className="text-white font-black text-lg">{company.name}</h3>
            <p className="text-blue-200 text-sm mt-0.5">{company.city} · {company.specialization}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors ml-4 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Contact info */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            {company.address && (
              <div className="flex items-start gap-2 text-slate-600">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{company.address}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${company.phone}`} className="hover:text-blue-600 transition-colors">{company.phone}</a>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-600">{company.email}</span>
              </div>
            )}
          </div>

          {/* Email template */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Vorgefertigte Nachricht</label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
              {emailBody}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {company.email ? (
              <a
                href={mailtoLink}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                E-Mail senden
              </a>
            ) : (
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    Kopiert!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Nachricht kopieren
                  </>
                )}
              </button>
            )}
            {company.website && (
              <a
                href={company.website.startsWith('http') ? company.website : 'https://' + company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-black uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Website
              </a>
            )}
          </div>

          {!company.email && !company.website && (
            <p className="text-xs text-slate-400 text-center">
              Kopieren Sie die Nachricht und kontaktieren Sie das Unternehmen direkt.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const CompanyCard = ({ company, onContact }: { company: Company; onContact: (c: Company) => void }) => (
  <div className={`bg-white rounded-2xl border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 p-5 flex flex-col gap-3 ${company.isPartner ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-slate-100'}`}>
    {/* Header */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-black text-slate-900 text-sm leading-snug">{company.name}</h3>
          {company.isPartner && (
            <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              HausMatch Partner
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{company.specialization}</p>
      </div>
      {company.rating > 0 && (
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-sm font-black text-slate-900">{company.rating.toFixed(1)}</span>
          <StarRating rating={company.rating} />
          {company.reviews > 0 && <span className="text-[10px] text-slate-400 mt-0.5">{company.reviews} Bewertungen</span>}
        </div>
      )}
    </div>

    {/* Details */}
    <div className="space-y-1.5 text-xs text-slate-500">
      {company.address && (
        <div className="flex items-start gap-1.5">
          <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="font-medium">{company.address}</span>
        </div>
      )}
      {company.phone && (
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <a href={`tel:${company.phone}`} className="font-medium hover:text-blue-600 transition-colors">{company.phone}</a>
        </div>
      )}
      {company.website && (
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
          <a href={company.website.startsWith('http') ? company.website : 'https://' + company.website}
             target="_blank" rel="noopener noreferrer"
             className="font-medium hover:text-blue-600 transition-colors truncate max-w-[200px]">
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}
    </div>

    {/* CTA */}
    <button
      onClick={() => onContact(company)}
      className={`mt-1 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
        company.isPartner
          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
          : 'bg-slate-900 text-white hover:bg-slate-700'
      }`}
    >
      Kontakt aufnehmen
    </button>
  </div>
);

const MatchingBoard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [partnerCount, setPartnerCount] = useState(0);

  const fetchPartners = useCallback(async (q: string): Promise<Company[]> => {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'manager'))
      );
      const managers: Company[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const city: string = (data.city || data.location || data.name || '').toLowerCase();
        const qLower = q.toLowerCase();
        // Match if query appears in name, city, or specialization
        if (
          city.includes(qLower) ||
          (data.name || '').toLowerCase().includes(qLower) ||
          (Array.isArray(data.specialization) ? data.specialization.join(' ') : (data.specialization || '')).toLowerCase().includes(qLower) ||
          q.length < 3 // show all partners for very short queries
        ) {
          managers.push({
            id: doc.id,
            name: data.companyName || data.name || 'Unbekannt',
            address: data.address || '',
            city: data.city || data.location || '',
            phone: data.phone || '',
            website: data.website || '',
            email: data.email || '',
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            specialization: Array.isArray(data.specialization) ? data.specialization.join(', ') : (data.specialization || 'Hausverwaltung'),
            isPartner: true,
            partnerProfile: { uid: doc.id, name: data.name || '', profileImage: data.profileImage }
          });
        }
      });
      return managers;
    } catch (err) {
      console.error('Firestore error:', err);
      return [];
    }
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearchQuery(q);
    setLoading(true);
    setError('');
    setCompanies([]);

    try {
      // Run both in parallel
      const [searchRes, partners] = await Promise.all([
        fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q })
        }).then(r => r.json()),
        fetchPartners(q)
      ]);

      const external: Company[] = (searchRes.companies || []).map((c: Company) => ({ ...c, isPartner: false }));

      // Merge: deduplicate by name, partners first
      const partnerNames = new Set(partners.map((p: Company) => p.name.toLowerCase()));
      const externalFiltered = external.filter((c: Company) => !partnerNames.has(c.name.toLowerCase()));

      const merged = [...partners, ...externalFiltered];
      setCompanies(merged);
      setPartnerCount(partners.length);
    } catch (err) {
      setError('Suche fehlgeschlagen. Bitte erneut versuchen.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchPartners]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(inputValue);
  };

  const suggestions = ['Hausverwaltung München', 'WEG-Verwaltung Berlin', 'Mietverwaltung Hamburg', 'Hausverwaltung Frankfurt', 'Immobilienverwaltung Köln'];

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
            Verwalter finden
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-3">
            Echte Hausverwaltungen<br />in Ihrer Region
          </h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Realtime-Suche über Google · Bewertungen direkt vergleichen · HausMatch-Partner bevorzugt angezeigt
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="z.B. Hausverwaltung München oder WEG Berlin"
                className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => handleSearch(inputValue)}
              disabled={loading || !inputValue.trim()}
              className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-200 whitespace-nowrap"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Suchen'}
            </button>
          </div>

          {/* Suggestions */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-2 mt-3">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInputValue(s); handleSearch(s); }}
                  className="text-xs bg-white border border-slate-200 text-slate-600 font-medium px-3 py-1.5 rounded-full hover:border-blue-300 hover:text-blue-600 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
              <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="font-black text-slate-700 text-sm uppercase tracking-widest">Suche läuft…</span>
            </div>
            <p className="text-slate-400 text-xs mt-3">Google-Suche + Netzwerk-Abfrage gleichzeitig</p>
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto bg-red-50 border border-red-100 text-red-700 rounded-xl px-5 py-4 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && companies.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  {companies.length} Ergebnisse für „{searchQuery}"
                </h2>
                {partnerCount > 0 && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">
                    {partnerCount} HausMatch-Partner in Ihrer Region ✓
                  </p>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">Sortiert nach Bewertung</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company, i) => (
                <CompanyCard key={company.id || company.name + i} company={company} onContact={setSelectedCompany} />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && searchQuery && companies.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Keine Ergebnisse</p>
            <p className="text-slate-500 text-sm mt-1">Versuchen Sie eine andere Stadt oder Region.</p>
          </div>
        )}

        {/* Intro state */}
        {!loading && !searchQuery && (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="font-black uppercase tracking-widest text-sm">Geben Sie eine Stadt oder Region ein</p>
            <p className="text-xs mt-1">Wir suchen gleichzeitig bei Google und in unserem Netzwerk</p>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {selectedCompany && (
        <ContactModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
};

export default MatchingBoard;
