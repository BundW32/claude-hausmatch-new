import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchPropertyManagers } from '../services/geminiService';
import { getManagersByCity } from '../services/dataService';
import { ManagerSearchResult, SearchCompany, User } from '../types';

const EDDY_URL = "https://cdn.jsdelivr.net/gh/BundW32/claude-hausmatch-new@main/hf_20260616_092652_b3b38af5-a913-44c1-80ef-1ac5d9adedb4.png";

const StarRating = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= full ? 'text-amber-400' : i === full + 1 && half ? 'text-amber-300' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const CompanyCard = ({ company }: { company: SearchCompany }) => {
  const [showContact, setShowContact] = useState(false);
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {company.isPartner && (
                <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Partner</span>
              )}
              <h3 className="text-xl font-black text-slate-900 truncate">{company.name}</h3>
            </div>
            <p className="text-slate-500 text-sm font-medium truncate">{company.address || company.city}</p>
          </div>
          {company.rating > 0 && (
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black text-slate-900">{company.rating.toFixed(1)}</div>
              <StarRating rating={company.rating} />
              {company.reviews > 0 && <p className="text-slate-400 text-xs mt-0.5">{company.reviews} Bewertungen</p>}
            </div>
          )}
        </div>

        {company.specialization && (
          <div className="flex flex-wrap gap-2 mb-6">
            {company.specialization.split(',').map((s, i) => (
              <span key={i} className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">{s.trim()}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowContact(!showContact)}
            className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors active:scale-95"
          >
            {showContact ? 'Verbergen' : 'Kontakt anzeigen'}
          </button>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-100 text-slate-700 py-3 px-5 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Website
            </a>
          )}
        </div>

        {showContact && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            {company.phone && (
              <a href={`tel:${company.phone}`} className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span className="font-semibold">{company.phone}</span>
              </a>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <span className="font-semibold">{company.email}</span>
              </a>
            )}
            {!company.phone && !company.email && (
              <p className="text-slate-400 text-sm">Keine Kontaktdaten verfügbar. Bitte Website besuchen.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const NetworkManagerCard = ({ manager }: { manager: User }) => {
  const [showContact, setShowContact] = useState(false);
  const displayName = manager.companyName || manager.name;
  const location = manager.city || manager.location || '';
  const specs = (manager.specialization || []).join(', ');
  return (
    <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
      <div className="absolute top-4 right-4">
        <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">HausMatch Netzwerk</span>
      </div>
      <div className="p-8 pt-10">
        <div className="mb-4">
          <h3 className="text-xl font-black text-slate-900 pr-36">{displayName}</h3>
          {location && <p className="text-slate-500 text-sm font-medium mt-0.5">{location}</p>}
        </div>
        {specs && (
          <div className="flex flex-wrap gap-2 mb-6">
            {specs.split(',').map((s, i) => (
              <span key={i} className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">{s.trim()}</span>
            ))}
          </div>
        )}
        {manager.bio && <p className="text-slate-500 text-sm mb-6 leading-relaxed">{manager.bio}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowContact(!showContact)}
            className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors active:scale-95"
          >
            {showContact ? 'Verbergen' : 'Kontakt anzeigen'}
          </button>
          {manager.website && (
            <a href={manager.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-100 text-slate-700 py-3 px-5 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Website
            </a>
          )}
        </div>
        {showContact && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            {manager.phone && (
              <a href={`tel:${manager.phone}`} className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span className="font-semibold">{manager.phone}</span>
              </a>
            )}
            <a href={`mailto:${manager.email}`} className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <span className="font-semibold">{manager.email}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const city = searchParams.get('city') || 'Deutschland';
  const [result, setResult] = useState<ManagerSearchResult | null>(null);
  const [networkManagers, setNetworkManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [data, managers] = await Promise.all([
        searchPropertyManagers(city),
        getManagersByCity(city),
      ]);
      setResult(data);
      setNetworkManagers(managers);
      setLoading(false);
    };
    fetchData();
  }, [city]);

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
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">

            {loading ? (
              <div className="bg-white p-16 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center shadow-sm">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden" style={{ background: '#2563FF' }}>
                    <img src={EDDY_URL} alt="Eddy" width={96} height={96} style={{ display: 'block', objectFit: 'cover' }} className="animate-pulse" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Eddy sucht für Sie...</h3>
                <p className="text-slate-400 font-medium">Passende Hausverwaltungen in <span className="text-indigo-600 font-black">{city}</span> werden geprüft</p>
                <p className="text-slate-300 text-sm mt-2 font-medium">Kontaktdaten werden direkt von den Websites geladen</p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Suchergebnis</h2>
                  </div>
                  <p className="text-slate-600 font-medium">{result.introText}</p>
                </div>

                {networkManagers.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">HausMatch Netzwerk — Verifizierte Partner</span>
                    </div>
                    {networkManagers.map((m) => (
                      <NetworkManagerCard key={m.id} manager={m} />
                    ))}
                    {result.companies.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-4">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Weitere Ergebnisse aus dem Web</span>
                      </div>
                    )}
                  </div>
                )}

                {result.companies.length > 0 ? (
                  result.companies.map((company, idx) => (
                    <CompanyCard key={idx} company={company} />
                  ))
                ) : networkManagers.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
                    <p className="text-slate-400 font-medium">Keine Ergebnisse gefunden. Bitte versuchen Sie eine andere Stadt.</p>
                    <button onClick={() => navigate('/')} className="mt-6 bg-indigo-600 text-white py-3 px-8 rounded-2xl font-black hover:bg-indigo-700 transition-colors">
                      Neue Suche
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[3rem] text-white sticky top-24 shadow-2xl shadow-indigo-200/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[1rem] overflow-hidden flex-shrink-0" style={{ background: '#2563FF' }}>
                  <img src={EDDY_URL} alt="Eddy" width={64} height={64} style={{ display: 'block', objectFit: 'cover' }} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight">Eddy hilft Ihnen</h4>
                  <p className="text-indigo-200 text-sm font-medium">Ihr KI-Assistent</p>
                </div>
              </div>
              <p className="text-indigo-100 text-base mb-8 leading-relaxed font-semibold">
                Lassen Sie Eddy die Vorauswahl treffen. Wir kontaktieren passende Firmen diskret für Sie.
              </p>
              <button onClick={() => navigate('/wizard')} className="w-full bg-white text-indigo-700 py-5 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all shadow-xl active:scale-95">
                Express-Matching
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
