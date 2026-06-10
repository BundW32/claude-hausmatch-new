import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchPropertyManagers } from '../services/geminiService';
import { ManagerSearchResult, SearchCompany } from '../types';

const MATCHING_STEPS = [
  { id: 1, label: "Initialisiere HausMatch Engine v3.1", status: "pending" },
  { id: 2, label: "Abfrage Google Search Grounding API", status: "pending" },
  { id: 3, label: "Filtere lokale Verwaltungen in Region", status: "pending" },
  { id: 4, label: "Extrahiere Web-Referenzen (Grounding Chunks)", status: "pending" },
  { id: 5, label: "Semantische Analyse der Service-Expertise", status: "pending" },
  { id: 6, label: "Generiere kuratierte Empfehlungsliste", status: "pending" }
];

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
          <defs><linearGradient id="half-search"><stop offset="50%" stopColor="currentColor"/><stop offset="50%" stopColor="#e5e7eb"/></linearGradient></defs>
          <path fill="url(#half-search)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

const buildMailto = (companies: SearchCompany[], city: string): string => {
  const emails = companies.map(c => c.email).filter((e): e is string => !!e);
  const subject = `Anfrage Hausverwaltung über HausMatch – ${city}`;
  const list = companies.map(c => `- ${c.name}${c.address ? ` (${c.address})` : ''}`).join('\n');
  const body = `Sehr geehrte Damen und Herren,

über die Plattform HausMatch suche ich für eine Immobilie in ${city} eine professionelle Hausverwaltung.

Folgende Unternehmen habe ich über HausMatch ausgewählt und möchte Sie gerne kontaktieren:
${list}

Ich würde mich freuen, wenn Sie mit mir Kontakt aufnehmen, um die Details und Ihr Leistungsangebot zu besprechen.

Mit freundlichen Grüßen,
[Ihr Name]
[Ihre Telefonnummer]

---
Diese Anfrage wurde über HausMatch.de vermittelt.`;

  return `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const ResultCard = ({ company, selected, onToggle }: { company: SearchCompany; selected: boolean; onToggle: () => void }) => (
  <div className={`bg-white rounded-[2rem] border-2 p-6 flex flex-col gap-4 transition-all ${selected ? 'border-indigo-400 shadow-lg shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'}`}>
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={selected ? `${company.name} abwählen` : `${company.name} auswählen`}
        className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}
      >
        {selected && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-black text-slate-900 text-lg leading-snug">{company.name}</h3>
          {company.rating > 0 && (
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-sm font-black text-slate-900">{company.rating.toFixed(1)}</span>
              <StarRating rating={company.rating} />
              {company.reviews > 0 && <span className="text-[10px] text-slate-400 mt-0.5">{company.reviews} Bewertungen</span>}
            </div>
          )}
        </div>
        {company.specialization && (
          <p className="text-xs text-indigo-600 font-black uppercase tracking-wider mt-1">{company.specialization}</p>
        )}
      </div>
    </div>

    <div className="space-y-1.5 text-sm text-slate-500 pl-10">
      {company.address && (
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="font-medium">{company.address}</span>
        </div>
      )}
      {company.phone && (
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <a href={`tel:${company.phone}`} className="font-medium hover:text-indigo-600 transition-colors">{company.phone}</a>
        </div>
      )}
      {company.website && (
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
          <a
            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-indigo-600 transition-colors truncate max-w-[220px]"
          >
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}
      {company.email ? (
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="font-medium truncate">{company.email}</span>
        </div>
      ) : (
        <div className="text-xs text-amber-600 font-bold uppercase tracking-wide">Keine E-Mail-Adresse verfügbar</div>
      )}
    </div>
  </div>
);

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const city = searchParams.get('city') || 'Deutschland';
  const [result, setResult] = useState<ManagerSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setCurrentStep(0);
    setSelected(new Set());

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < MATCHING_STEPS.length ? prev + 1 : prev));
    }, 700);

    const data = await searchPropertyManagers(city);
    setResult(data);

    clearInterval(stepInterval);
    setCurrentStep(MATCHING_STEPS.length);
    setTimeout(() => setLoading(false), 500);
  }, [city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const companies = result?.companies ?? [];

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(companies.map((_, idx) => idx)));
  const clearSelection = () => setSelected(new Set());

  const selectedCompanies = companies.filter((_, idx) => selected.has(idx));
  const selectedWithEmail = selectedCompanies.filter(c => !!c.email);
  const mailtoHref = selectedWithEmail.length > 0 ? buildMailto(selectedWithEmail, city) : undefined;

  return (
    <div className="bg-slate-50 min-h-screen pt-12 pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">Live Matching</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Empfohlene Partner in {city}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            {showLogs ? "Logs ausblenden" : "Vorgang zeigen"}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">

            {showLogs && (
              <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">Matching Engine Log</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-500 font-bold">STATUS: {loading ? 'PROCESSING' : 'COMPLETED'}</span>
                </div>

                <div className="space-y-4 font-mono">
                  {MATCHING_STEPS.map((step, idx) => (
                    <div key={step.id} className={`flex items-center gap-4 text-xs transition-opacity duration-300 ${idx < currentStep ? 'opacity-100' : 'opacity-20'}`}>
                      {idx < currentStep - 1 ? (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      ) : idx === currentStep - 1 && loading ? (
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      ) : (
                        <div className="w-4 h-4 border-2 border-slate-700 rounded-full flex-shrink-0"></div>
                      )}
                      <span className={idx < currentStep - 1 ? 'text-slate-300' : 'text-indigo-400 font-bold'}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-8">
                <div className="bg-white p-16 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Netzwerk-Abfrage läuft...</h3>
                  <p className="text-slate-400 font-medium">Wir durchsuchen live das Web nach Hausverwaltungen in {city}.</p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8"></div>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Kuratierte Empfehlungen</h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Live durchsucht von HausMatch KI</p>
                    </div>
                  </div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                    {result.introText}
                  </div>
                  {companies.length === 0 && (
                    <button
                      onClick={fetchData}
                      className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Erneut suchen
                    </button>
                  )}
                </div>

                {companies.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {companies.map((company, idx) => (
                      <ResultCard
                        key={`${company.name}-${idx}`}
                        company={company}
                        selected={selected.has(idx)}
                        onToggle={() => toggleSelect(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[3rem] text-white sticky top-24 shadow-2xl shadow-indigo-200/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h4 className="text-2xl font-black tracking-tight italic">Ihre Auswahl</h4>
              </div>
              <p className="text-indigo-100 text-base mb-8 leading-relaxed font-semibold">
                Wählen Sie passende Hausverwaltungen aus und kontaktieren Sie alle ausgewählten Unternehmen gleichzeitig per E-Mail.
              </p>

              <div className="bg-white/10 rounded-2xl p-5 mb-6">
                <div className="text-4xl font-black leading-none">{selectedCompanies.length}</div>
                <div className="text-xs uppercase tracking-widest text-indigo-200 font-bold mt-2">
                  Ausgewählt{selectedCompanies.length > 0 ? ` · ${selectedWithEmail.length} mit E-Mail` : ''}
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={selectAll}
                  disabled={companies.length === 0}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Alle auswählen
                </button>
                <button
                  onClick={clearSelection}
                  disabled={selectedCompanies.length === 0}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Auswahl leeren
                </button>
              </div>

              <a
                href={mailtoHref}
                onClick={(e) => { if (!mailtoHref) e.preventDefault(); }}
                aria-disabled={!mailtoHref}
                className={`w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-lg transition-all shadow-xl ${
                  mailtoHref
                    ? 'bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95'
                    : 'bg-white/20 text-white/50 cursor-not-allowed pointer-events-none'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Anfrage per E-Mail senden
              </a>

              {selectedCompanies.length === 0 ? (
                <p className="text-xs text-indigo-200 mt-4 text-center leading-relaxed">
                  Wählen Sie links Hausverwaltungen über die Checkbox aus.
                </p>
              ) : selectedWithEmail.length === 0 ? (
                <p className="text-xs text-indigo-200 mt-4 text-center leading-relaxed">
                  Für die ausgewählten Unternehmen liegt keine E-Mail-Adresse vor. Nutzen Sie Telefon oder Website.
                </p>
              ) : (
                <p className="text-xs text-indigo-200 mt-4 text-center leading-relaxed">
                  Öffnet Ihr E-Mail-Programm mit einer vorausgefüllten Anfrage an {selectedWithEmail.length} Empfänger.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
