import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { articles, categories } from '../data/ratgeberArticles';

const Ratgeber = () => {
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [openArticle, setOpenArticle] = useState<number | null>(null);

  const filtered = activeCategory === 'Alle' ? articles : articles.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Expertenwissen</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">Immobilien-Ratgeber</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">
            Praxisnahe Guides zu Recht, Verwaltung, Investment und Förderungen. Fundiert, verständlich und kostenlos.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {articles.length} Artikel
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Ø 7 min Lesezeit
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Zuletzt aktualisiert: 2026
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(article => (
            <div key={article.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{article.icon}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    {article.category}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-2 leading-snug">{article.title}</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">{article.summary}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {article.readTime} Lesezeit
                  </span>
                  <button
                    onClick={() => setOpenArticle(openArticle === article.id ? null : article.id)}
                    className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    {openArticle === article.id ? 'Schließen' : 'Vollständig lesen'}
                    <svg className={`w-3 h-3 transition-transform ${openArticle === article.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {openArticle === article.id && (
                <div className="border-t border-slate-100 px-6 py-5 bg-slate-50">
                  <div className="prose prose-sm max-w-none text-slate-700 space-y-1">
                    {article.content.trim().split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-black text-slate-900 mt-5 mb-1 first:mt-0 text-sm">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('- ')) {
                        return <p key={i} className="pl-4 text-slate-600 text-sm font-medium before:content-['•'] before:mr-2 before:text-blue-500">{line.slice(2)}</p>;
                      }
                      if (line.startsWith('☐ ')) {
                        return <p key={i} className="pl-4 text-slate-600 text-sm font-medium">☐ {line.slice(2)}</p>;
                      }
                      if (line.trim() === '') return null;
                      return <p key={i} className="text-slate-600 text-sm font-medium leading-relaxed">{line}</p>;
                    })}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap gap-3">
                    <Link to="/ki-berater" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      Eddy fragen
                    </Link>
                    <span className="text-slate-200">|</span>
                    <Link to="/kreditrechner" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      Kreditrechner
                    </Link>
                    <span className="text-slate-200">|</span>
                    <Link to="/network" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Experten finden
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-3">Haben Sie konkrete Fragen?</h3>
            <p className="text-blue-100 font-medium mb-6 text-sm md:text-base">
              Eddy, unser KI-Immobilienberater, beantwortet Ihre persönlichen Fragen zu Recht, Verwaltung und Investment, rund um die Uhr und kostenlos. Für rechtliche und steuerliche Einzelfragen empfehlen wir zusätzlich einen Fachberater.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/ki-berater" className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all shadow-lg active:scale-95">
                Eddy, der KI-Berater
              </Link>
              <Link to="/network" className="px-6 py-3 bg-white/15 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/25 transition-all border border-white/30 active:scale-95">
                Experten im Netzwerk
              </Link>
              <Link to="/kreditrechner" className="px-6 py-3 bg-white/15 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/25 transition-all border border-white/30 active:scale-95">
                Kreditrechner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ratgeber;
