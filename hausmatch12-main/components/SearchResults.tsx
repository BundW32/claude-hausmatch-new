import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchPropertyManagers } from '../services/geminiService';
import { ManagerSearchResult, SearchCompany } from '../types';

const TOTAL_STEPS = 6;

// ─── Star Rating ────────────────────────────────────────────────────────────
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
          <defs><linearGradient id="half-sr"><stop offset="50%" stopColor="currentColor"/><stop offset="50%" stopColor="#e5e7eb"/></linearGradient></defs>
          <path fill="url(#half-sr)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

// ─── Result Card ─────────────────────────────────────────────────────────────
const ResultCard = ({ company, selected, onToggle }: {
  company: SearchCompany;
  selected: boolean;
  onToggle: () => void;
}) => (
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
        <div className="text-xs text-amber-600 font-bold uppercase tracking-wide">Keine E-Mail verfügbar</div>
      )}
    </div>
  </div>
);

// ─── Anfrage-Modal ────────────────────────────────────────────────────────────
type ModalState = 'idle' | 'sending' | 'success' | 'error';

const InquiryModal = ({
  companies,
  city,
  onClose,
}: {
  companies: SearchCompany[];
  city: string;
  onClose: () => void;
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<ModalState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setState('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/send-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: name.trim(),
          senderEmail: email.trim(),
          senderPhone: phone.trim(),
          message: message.trim(),
          city,
          companies: companies.map(c => ({
            name: c.name,
            address: c.address,
            phone: c.phone,
            email: c.email,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unbekannter Fehler');
      }

      setState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Anfrage konnte nicht gesendet werden.';
      setErrorMsg(msg);
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={state !== 'sending' ? onClose : undefined}
      />
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
        {state !== 'sending' && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {state === 'success' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Anfrage gesendet!</h3>
            <p className="text-slate-500 font-medium mb-2">Ihre Anfrage wurde erfolgreich übermittelt.</p>
            <p className="text-slate-400 text-sm mb-8">Sie erhalten in Kürze eine Bestätigung an <strong>{email}</strong>.</p>
            <button onClick={onClose} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all">Schließen</button>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-black text-slate-900 mb-1">Anfrage senden</h3>
            <p className="text-slate-400 text-sm font-medium mb-6">An {companies.length} Hausverwaltung{companies.length !== 1 ? 'en' : ''} in {city}</p>
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-1.5 max-h-32 overflow-y-auto">
              {companies.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-slate-700">{c.name}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Ihr Name <span className="text-red-400">*</span></label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-900 font-medium transition-colors" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Telefon <span className="text-slate-300">(optional)</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 89 12345678" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-900 font-medium transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Ihre E-Mail <span className="text-red-400">*</span></label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="max@beispiel.de" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-900 font-medium transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Nachricht <span className="text-slate-300">(optional)</span></label>
                <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Kurze Beschreibung Ihrer Immobilie, Wünsche, Fragen..." className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-900 font-medium transition-colors resize-none" />
              </div>
              {state === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">{errorMsg}</div>
              )}
              <button type="submit" disabled={state === 'sending' || !name.trim() || !email.trim()} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3">
                {state === 'sending' ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Wird gesendet...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Anfrage absenden</>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center">Sie erhalten eine Bestätigung per E-Mail. Ihre Daten werden nur zur Anfragevermittlung verwendet.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const city = searchParams.get('city') || 'Deutschland';

  const [result, setResult] = useState<ManagerSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setCurrentStep(0);
    setSelected(new Set());

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < TOTAL_STEPS ? prev + 1 : prev));
    }, 700);

    const data = await searchPropertyManagers(city);
    setResult(data);

    clearInterval(stepInterval);
    setCurrentStep(TOTAL_STEPS);
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
  const selectAll = () => setSelected(new Set(companies.map((_, i) => i)));
  const clearSelection = () => setSelected(new Set());
  const selectedCompanies = companies.filter((_, i) => selected.has(i));
  const canSend = selectedCompanies.length > 0;

  const progress = Math.min(100, Math.round((currentStep / TOTAL_STEPS) * 100));

  const progressLabels = [
    'Suche wird gestartet…',
    'Lokale Hausverwaltungen werden gesucht…',
    'Ergebnisse werden gefiltert…',
    'Kontaktdaten werden geprüft…',
    'Qualität wird bewertet…',
    'Empfehlungen werden zusammengestellt…',
    'Fertig!',
  ];
  const progressLabel = progressLabels[Math.min(currentStep, progressLabels.length - 1)];

  return (
    <>
      <div className="bg-slate-50 min-h-screen pt-12 pb-24 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">
                Live Matching
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Empfohlene Partner in {city}
              </h1>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              {loading ? (
                <div className="bg-white p-14 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-8">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                    Hausverwaltungen werden gesucht
                  </h3>
                  <p className="text-slate-400 font-medium mb-10">
                    Wir finden die besten Anbieter in {city}.
                  </p>
                  <div className="w-full max-w-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-400">{progressLabel}</span>
                      <span className="text-xs font-black text-indigo-600">{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8" />
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Kuratierte Empfehlungen</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Live durchsucht von HausMatch KI</p>
                      </div>
                    </div>
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-lg">{result.introText}</div>
                    {companies.length === 0 && (
                      <button onClick={fetchData} className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Erneut suchen
                      </button>
                    )}
                  </div>
                  {companies.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {companies.map((company, idx) => (
                        <ResultCard key={`${company.name}-${idx}`} company={company} selected={selected.has(idx)} onToggle={() => toggleSelect(idx)} />
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
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-black tracking-tight italic">Ihre Auswahl</h4>
                </div>
                <p className="text-indigo-100 text-base mb-8 leading-relaxed font-semibold">
                  Wählen Sie passende Hausverwaltungen aus und senden Sie eine Sammelanfrage direkt über HausMatch.
                </p>
                <div className="bg-white/10 rounded-2xl p-5 mb-6">
                  <div className="text-4xl font-black leading-none">{selectedCompanies.length}</div>
                  <div className="text-xs uppercase tracking-widest text-indigo-200 font-bold mt-2">Ausgewählt</div>
                </div>
                <div className="flex gap-3 mb-6">
                  <button onClick={selectAll} disabled={companies.length === 0} className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all">Alle</button>
                  <button onClick={clearSelection} disabled={selectedCompanies.length === 0} className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all">Leeren</button>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  disabled={!canSend}
                  className={`w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-lg transition-all shadow-xl ${canSend ? 'bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 cursor-pointer' : 'bg-white/20 text-white/40 cursor-not-allowed'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Anfrage senden
                </button>
                <p className="text-xs text-indigo-200 mt-4 text-center leading-relaxed">
                  {selectedCompanies.length === 0
                    ? 'Wählen Sie links Hausverwaltungen über die Checkbox aus.'
                    : `${selectedCompanies.length} Unternehmen ausgewählt – Ihre Kontaktdaten werden sicher übermittelt.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <InquiryModal companies={selectedCompanies} city={city} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default SearchResults;
