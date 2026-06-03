import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchPropertyManagers } from '../services/geminiService';
import { ManagerSearchResult } from '../types';

const MATCHING_STEPS = [
  { id: 1, label: "Initialisiere HausMatch Engine v3.1", status: "pending" },
  { id: 2, label: "Abfrage Google Search Grounding API", status: "pending" },
  { id: 3, label: "Filtere lokale Verwaltungen in Region", status: "pending" },
  { id: 4, label: "Extrahiere Web-Referenzen (Grounding Chunks)", status: "pending" },
  { id: 5, label: "Semantische Analyse der Service-Expertise", status: "pending" },
  { id: 6, label: "Generiere kuratierte Empfehlungsliste", status: "pending" }
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const city = searchParams.get('city') || 'Deutschland';
  const [result, setResult] = useState<ManagerSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setCurrentStep(0);
      
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => (prev < MATCHING_STEPS.length ? prev + 1 : prev));
      }, 700);

      const data = await searchPropertyManagers(city);
      setResult(data);
      
      clearInterval(stepInterval);
      setTimeout(() => setLoading(false), 500);
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
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Geprüfte Qualität von HausMatch KI</p>
                    </div>
                  </div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                    {result.introText}
                  </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                  </div>
                  <h3 className="text-xs font-black text-indigo-400 mb-2 uppercase tracking-[0.3em] relative z-10">Live-Quellen</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                    {result.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-indigo-500/50 transition-all group"
                      >
                        <span className="text-indigo-400 text-[10px] font-black uppercase mb-2 tracking-widest">Geprüfte Webseite</span>
                        <span className="text-lg font-black text-white truncate mb-4">{source.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[3rem] text-white sticky top-24 shadow-2xl shadow-indigo-200/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h4 className="text-2xl font-black tracking-tight italic">HausMatch Premium</h4>
              </div>
              <p className="text-indigo-100 text-lg mb-10 leading-relaxed font-semibold">
                Lassen Sie unsere Experten-KI die Vorauswahl treffen. Wir kontaktieren passende Firmen diskret für Sie.
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