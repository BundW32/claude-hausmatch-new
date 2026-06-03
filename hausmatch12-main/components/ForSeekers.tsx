import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAIAdvisorResponse } from '../services/geminiService';

const ForSeekers = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await getAIAdvisorResponse([], query);
      setAiResponse(res || '');
    } catch (err) {
      setAiResponse("Fehler bei der Abfrage. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen relative">
      {/* Floating Action Button for Wizard */}
      <div className="fixed bottom-8 right-8 z-[100] hidden lg:block animate-in slide-in-from-bottom-10 duration-1000">
        <button 
          onClick={() => navigate('/wizard')}
          className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black shadow-2xl flex items-center gap-3 hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="w-8 h-8 bg-blue-600 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          Jetzt kostenlos anfragen
        </button>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block py-2 px-6 mb-8 rounded-full bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-500/20 shadow-lg">
             Kostenfreies Eigentümer-Portal
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-10 tracking-tight leading-[1.1]">Die Suche nach der <br/>perfekten Verwaltung.</h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-14 max-w-3xl mx-auto font-medium leading-relaxed">
            Nutzen Sie unseren Express-Matching Prozess: In weniger als 2 Minuten erhalten Sie Zugriff auf die Top-Verwaltungen Ihrer Region.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <button onClick={() => navigate('/wizard')} className="bg-blue-600 text-white px-12 py-6 rounded-3xl font-black text-xl shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3">
              Kostenloses Matching starten
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* AI Advisor Tool */}
      <section className="py-24 -mt-16 relative z-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-slate-100 p-10 md:p-16">
            <div className="flex items-center mb-12">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mr-6 shadow-xl shadow-indigo-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">HausMatch KI-Berater</h2>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Stellen Sie eine Experten-Frage</p>
              </div>
            </div>
            
            <form onSubmit={askAi} className="space-y-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
                <textarea 
                  required
                  className="relative w-full h-48 p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:border-indigo-600 focus:bg-white outline-none transition-all text-slate-900 text-xl font-bold placeholder-slate-400"
                  placeholder="Z.B. Worauf muss ich beim Verwaltervertrag besonders achten?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="absolute bottom-8 right-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Analysiere...
                    </>
                  ) : 'Antwort generieren'}
                </button>
              </div>

              {aiResponse && (
                <div className="p-10 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">KI-Experten Meinung</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-bold text-xl">{aiResponse}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForSeekers;