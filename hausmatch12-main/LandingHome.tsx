import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const BADGE_PROS = [
  { name: 'Stefan M.', type: 'Hausverwaltung', city: 'München', badge: '💎', tier: 'Platin', points: 1240, specialty: 'WEG-Experte' },
  { name: 'Kerstin B.', type: 'Hausverwaltung', city: 'Berlin', badge: '🥇', tier: 'Gold', points: 780, specialty: 'Mietrecht-Profi' },
  { name: 'Thomas K.', type: 'Rechtsanwalt', city: 'Hamburg', badge: '🥇', tier: 'Gold', points: 620, specialty: 'WEG-Experte' },
  { name: 'Anna W.', type: 'Hausverwaltung', city: 'Frankfurt', badge: '🥈', tier: 'Silber', points: 310, specialty: 'Energie-Expertin' },
];

const OWNER_BENEFITS = [
  { icon: '🔍', title: 'Geprüfte Experten', desc: 'Alle Profis sind verifiziert und nach Community-Aktivität bewertet.' },
  { icon: '💡', title: 'Kostenlos & unverbindlich', desc: 'Kein Risiko — Sie erhalten Angebote ohne Verpflichtung.' },
  { icon: '⚡', title: 'Schnelles Matching', desc: 'Passende Verwalter melden sich direkt auf Ihre Anfrage.' },
  { icon: '🏆', title: 'Badge-System', desc: 'Sehen Sie sofort, welche Profis sich durch Expertise auszeichnen.' },
  { icon: '💬', title: 'Community-Forum', desc: 'Stellen Sie Fragen und erhalten Sie Antworten von echten Experten.' },
  { icon: '📊', title: 'Kreditrechner', desc: 'Analysieren Sie Rendite und Kosten Ihres Projekts kostenlos.' },
];

const STEPS = [
  { n: '01', title: 'Objekt beschreiben', desc: 'Geben Sie Ihre Immobilie und Wünsche ein — dauert 2 Minuten.' },
  { n: '02', title: 'Angebote erhalten', desc: 'Geprüfte Verwalter mit echten Badges bewerben sich bei Ihnen.' },
  { n: '03', title: 'Den Besten wählen', desc: 'Vergleichen Sie Badges, Bewertungen und Angebote — kostenlos.' },
];

const STATS = [
  { value: '2.400+', label: 'registrierte Profis' },
  { value: '12.000+', label: 'zufriedene Eigentümer' },
  { value: '94%', label: 'erfolgreiche Vermittlungen' },
  { value: '48h', label: 'Ø Zeit bis zum Angebot' },
];

const LandingHome = () => {
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(city.trim() ? `/wizard?city=${encodeURIComponent(city)}` : '/wizard');
  };

  return (
    <article className="bg-white">
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-white">
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 leading-[0.95] mb-6 tracking-tighter">
            Die beste Hausverwaltung<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">für Ihre Immobilie.</span>
          </h1>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-6">
            <div className="relative flex flex-col md:flex-row items-center p-2 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100">
              <input type="text" placeholder="In welcher Stadt suchen Sie?" value={city} onChange={e => setCity(e.target.value)} className="w-full py-4 bg-transparent border-none focus:ring-0 text-slate-900 text-lg font-black placeholder-slate-300 px-4" />
              <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 whitespace-nowrap">Jetzt Verwalter finden →</button>
            </div>
          </form>
        </div>
      </section>
    </article>
  );
};

export default LandingHome;
