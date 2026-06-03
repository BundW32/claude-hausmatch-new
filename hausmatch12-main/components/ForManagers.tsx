import React from 'react';
import { useNavigate } from 'react-router-dom';

const ForManagers = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50">
      {/* Dark Professional Hero */}
      <section className="bg-slate-900 text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 L100 0 L100 100 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block py-1 px-3 mb-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest border border-indigo-500/30">
                Wachstum für Ihr Unternehmen
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
                Gewinnen Sie wertvolle <span className="text-indigo-400">Verwaltungsmandate.</span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                Schluss mit Kaltakquise. Erhalten Sie Zugang zu geprüften Anfragen von Eigentümern, die aktiv eine professionelle Hausverwaltung suchen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/50">
                  Jetzt kostenlos registrieren
                </button>
                <button onClick={() => navigate('/pricing')} className="bg-slate-800 text-slate-300 px-8 py-4 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all">
                  Preise ansehen
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-700 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">dashboard.hausmatch.de</span>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-slate-700 rounded-full w-2/3"></div>
                  <div className="h-20 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-300 font-bold mb-1">Neue Anfrage erhalten</p>
                      <p className="text-sm font-semibold">WEG 24 Einheiten, München</p>
                    </div>
                    <div className="bg-indigo-600 px-3 py-1 rounded-lg text-xs font-bold">Details</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-slate-700/50 rounded-2xl flex flex-col justify-center items-center">
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Aktive Leads</p>
                    </div>
                    <div className="h-24 bg-slate-700/50 rounded-2xl flex flex-col justify-center items-center">
                      <p className="text-2xl font-bold text-green-400">85%</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Response Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Effiziente Akquise für moderne Verwalter</h2>
            <p className="text-slate-600">Wir haben den Prozess der Mandatsvergabe digitalisiert, um Ihnen Zeit und Kosten bei der Neukundengewinnung zu sparen.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-indigo-600 mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.519 1.298-3.002 2.118-4.51" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Verifizierte Leads</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Wir telefonieren mit jedem Interessenten vorab, um die Echtheit und Qualität der Anfrage sicherzustellen.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-indigo-600 mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Gezieltes Targeting</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Wählen Sie genau aus, welche Objekttypen (WEG, Mietverwaltung, Gewerbe) und Regionen Sie bedienen möchten.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-indigo-600 mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-4">AI-Matching Support</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Unsere KI analysiert die Anforderungen und schlägt Ihnen nur die Leads vor, die perfekt zu Ihrem Portfolio passen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 text-slate-900">Bereit für neue Aufträge?</h2>
          <p className="text-xl text-slate-600 mb-10">Schließen Sie sich über 500 erfolgreichen Hausverwaltungen an.</p>
          <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
            Kostenlos Partner werden
          </button>
        </div>
      </section>
    </div>
  );
};

export default ForManagers;