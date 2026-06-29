import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const EDDY_URL = "https://cdn.jsdelivr.net/gh/BundW32/claude-hausmatch-new@main/hf_20260616_092652_b3b38af5-a913-44c1-80ef-1ac5d9adedb4.png";

const EddyOwl = ({ size = 40 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.25) + 'px', overflow: 'hidden', background: '#2563FF', display: 'inline-block', flexShrink: 0 }}>
    <img src={EDDY_URL} width={size} height={size} alt="Eddy" style={{ display: 'block', objectFit: 'cover' }} />
  </div>
);

const EddyOwl3D = ({ size = 180 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.2) + 'px', overflow: 'hidden', background: '#2563FF', display: 'inline-block', boxShadow: '0 20px 60px rgba(37,99,255,0.4)', flexShrink: 0 }}>
    <img src={EDDY_URL} width={size} height={size} alt="Eddy die HausMatch-Eule" style={{ display: 'block', objectFit: 'cover' }} />
  </div>
);

const LandingHome = () => {
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  const handleStartFunnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      navigate(`/search-results?city=${encodeURIComponent(city)}`);
    } else {
      navigate('/wizard');
    }
  };

  return (
    <article className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="hidden sm:block absolute top-0 right-0 -mr-20 -mt-20 w-[50rem] h-[50rem] bg-blue-50 rounded-full blur-[120px] opacity-40"></div>
        <div className="hidden sm:block absolute bottom-0 left-0 -ml-20 -mb-20 w-[40rem] h-[40rem] bg-indigo-50 rounded-full blur-[120px] opacity-40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <header>
              <div className="inline-flex items-center gap-2 mb-6 md:mb-8 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                  Deutschlands Immobilien-Community
                </span>
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-tight sm:leading-[0.95] mb-6 md:mb-10 tracking-tighter">
                Hausverwaltung finden.<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
                  Gemeinsam stärker.
                </span>
              </h1>
            </header>

            <p className="text-lg md:text-xl text-slate-500 mb-6 md:mb-10 leading-relaxed font-medium max-w-2xl mx-auto px-4 md:px-0">
              HausMatch ist Ihre Community für Immobilienprofis und Eigentümer. Vernetzen Sie sich, tauschen Sie Erfahrungen aus und finden Sie geprüfte Experten in Ihrer Region.
            </p>

            <form onSubmit={handleStartFunnel} className="max-w-2xl mx-auto relative group px-2 sm:px-0">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-[2.5rem] md:rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative flex flex-col md:flex-row items-center p-2 md:p-3 bg-white rounded-[2rem] md:rounded-[2.8rem] shadow-2xl border border-slate-100">
                <div className="flex-1 flex items-center px-4 md:px-6 w-full mb-2 md:mb-0">
                  <svg className="w-6 h-6 text-blue-600 mr-3 md:mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <label htmlFor="city-input" className="sr-only">Stadt eingeben</label>
                  <input
                    id="city-input"
                    name="location"
                    type="text"
                    placeholder="In welcher Stadt suchen Sie?"
                    className="w-full py-4 md:py-5 bg-transparent border-none focus:ring-0 text-slate-900 text-lg md:text-xl font-black placeholder-slate-300 text-center md:text-left"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto bg-blue-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2.2rem] font-black text-base md:text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 whitespace-nowrap"
                >
                  Jetzt vernetzen
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
              </div>
            </form>

            <div className="mt-8 md:mt-10 flex flex-wrap justify-center items-center gap-x-6 gap-y-3 opacity-70">
              {['Community-Forum', 'Experten-Netzwerk', 'KI-Ratgeber', 'Kreditrechner'].map(feature => (
                <div key={feature} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-widest">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Eddy — KI-Berater Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 py-12 md:py-16">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl scale-75 pointer-events-none" />
              <EddyOwl3D size={180} />
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-white mb-4 uppercase tracking-widest">
                🦉 KI-Immobilienassistent
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-3">
                Hallo, ich bin Eddy!
              </h2>
              <p className="text-indigo-100 font-medium text-base mb-6 max-w-md leading-relaxed">
                Ihr persönlicher KI-Immobilienberater von HausMatch. Ich beantworte Ihre Fragen zu Hausverwaltung, Mietrecht, Finanzierung und Investment — sofort und kostenlos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  to="/ki-berater"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
                >
                  <EddyOwl size={24} />
                  Mit Eddy chatten
                </Link>
                <div className="flex items-center justify-center gap-2 text-indigo-200 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Kostenlos · Rund um die Uhr
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-16 md:py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-3">Alles an einem Ort</h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm md:text-base">Von der Vernetzung bis zur Renditeanalyse — HausMatch ist Ihre zentrale Plattform.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, title: 'Aufgaben Board', desc: 'Eigentümer posten Aufträge, Spezialisten bewerben sich — einfach und direkt.', link: '/aufgaben', linkText: 'Zum Aufgaben Board' },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, title: 'Schwarzes Brett', desc: 'Community-Pinnwand für Aufträge, Gesuche, Angebote und Empfehlungen.', link: '/schwarzes-brett', linkText: 'Zum Schwarzen Brett' },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, title: 'Community', desc: 'Vernetzen Sie sich mit Eigentümern und Verwaltern in ganz Deutschland.', link: '/network', linkText: 'Zum Netzwerk' },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, title: 'Forum & Austausch', desc: 'Stellen Sie Fragen, teilen Sie Erfahrungen und lernen Sie von der Community.', link: '/forum', linkText: 'Zum Forum' },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, title: 'Kreditrechner', desc: 'Berechnen Sie Rendite, monatliche Rate und Nebenkosten für Ihr Projekt.', link: '/kreditrechner', linkText: 'Zum Rechner' },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, title: 'Ratgeber', desc: 'Expertenwissen zu Recht, Verwaltung und Investitionen — klar und praxisnah.', link: '/ratgeber', linkText: 'Zum Ratgeber' }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm font-medium mb-4 leading-relaxed">{item.desc}</p>
                <Link to={item.link} className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-700 flex items-center gap-1">
                  {item.linkText}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-3">So funktioniert HausMatch</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">In drei Schritten zur perfekten Hausverwaltung</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {[
              { step: '01', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, title: 'Profil anlegen', desc: 'Registrieren Sie sich kostenlos und beschreiben Sie Ihr Objekt oder Angebot als Verwalter.' },
              { step: '02', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: 'KI-Matching', desc: 'Unsere KI analysiert Bedarf und Angebot und schlägt die besten Matches in Ihrer Region vor.' },
              { step: '03', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, title: 'Vernetzen & profitieren', desc: 'Treten Sie mit Experten in Kontakt, tauschen Sie sich im Forum aus und nutzen Sie das volle Netzwerk.' }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform">{s.icon}</div>
                  <span className="absolute -top-3 -right-3 w-7 h-7 bg-slate-900 text-white rounded-full text-[10px] font-black flex items-center justify-center">{s.step}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4">Werden Sie Teil der Community</h2>
          <p className="text-slate-400 font-medium mb-8 text-sm md:text-base">Kostenlos registrieren und sofort mit Experten und Eigentümern vernetzen.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 active:scale-95">Kostenlos starten</Link>
            <Link to="/ratgeber" className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all border border-white/10 active:scale-95">Ratgeber lesen</Link>
          </div>
        </div>
      </section>
    </article>
  );
};

export default LandingHome;
