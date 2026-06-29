import React, { useState } from 'react';
import AufgabenBoard from './AufgabenBoard';
import SchwarztesBrett from './SchwarztesBrett';

export type MarktplatzTab = 'auftraege' | 'pinnwand';

interface MarktplatzProps {
  initialTab?: MarktplatzTab;
}

// Vereinheitlichte Marktplatz-Seite: führt Aufgaben-Board (bezahlte Aufträge mit
// Bewerbung) und Schwarzes Brett (Community-Pinnwand) auf EINER Seite zusammen.
// Ein Segmented-Toggle wechselt zwischen beiden Ansichten — kein zweiter Menüpunkt nötig.
const Marktplatz: React.FC<MarktplatzProps> = ({ initialTab = 'auftraege' }) => {
  const [tab, setTab] = useState<MarktplatzTab>(initialTab);

  const tabs: { id: MarktplatzTab; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'auftraege',
      label: 'Aufträge',
      desc: 'Konkrete Aufträge ausschreiben & sich darauf bewerben',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'pinnwand',
      label: 'Pinnwand',
      desc: 'Gesuche, Angebote, Empfehlungen aus der Community',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  const active = tabs.find(t => t.id === tab)!;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Unified header + segmented toggle (sticky under the navbar) */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
            Marktplatz
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 mb-4">{active.desc}</p>

          <div className="inline-flex bg-slate-100 rounded-2xl p-1 gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${
                  tab === t.id
                    ? 'bg-white text-indigo-700 shadow'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active view (keeps each board's own logic, header & actions) */}
      <div>
        {tab === 'auftraege' ? <AufgabenBoard /> : <SchwarztesBrett />}
      </div>
    </div>
  );
};

export default Marktplatz;
