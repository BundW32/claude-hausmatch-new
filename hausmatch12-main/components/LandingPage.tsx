
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LandingPage = () => {
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-slate-50">
        <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-200/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-200/20 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-widest mb-8 border border-indigo-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              PropTech Innovation 2026
            </span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85] mb-8">
              Hausverwaltung <br/>
              <span className="text-indigo-600">neu definiert.</span>
            </h1>
            <p className="text-xl text-slate-600 font-light leading-relaxed mb-12 max-w-xl">
              HausMatch verbindet deutsche Immobilieneigentümer mit verifizierten Verwaltern. KI-gestützte Bedarfsanalyse und direkter Match-Prozess.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); navigate(`/wizard?city=${city}`); }} className="relative max-w-lg group">
              <div className="absolute inset-0 bg-indigo-600 blur-[30px] opacity-10 group-focus-within:opacity-20 transition-opacity"></div>
              <div className="relative flex items-center bg-white p-2 rounded-[2rem] shadow-2xl border border-slate-200 ring-1 ring-slate-900/5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="In welcher Stadt suchen Sie?" 
                  className="flex-1 bg-transparent border-0 px-6 py-4 text-slate-900 placeholder-slate-400 focus:ring-0 font-medium"
                />
                <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                  Suchen
                </button>
              </div>
            </form>
            
            <div className="mt-8 flex items-center gap-6 text-sm">
              <span className="text-slate-400">Beliebte Städte:</span>
              <div className="flex gap-4">
                {['Berlin', 'München', 'Hamburg'].map(c => (
                  <button key={c} onClick={() => setCity(c)} className="text-slate-600 font-bold hover:text-indigo-600 transition-colors">
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white animate-float">
              <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop" className="w-full h-[600px] object-cover" alt="Modern Architecture" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-8 rounded-[2rem] border border-white/50 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black">AI</div>
                  <div>
                    <div className="text-slate-900 font-black text-lg">Objekt-Analyse</div>
                    <div className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Echtzeit-Scoring aktiv</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 w-3/4 animate-pulse"></div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
