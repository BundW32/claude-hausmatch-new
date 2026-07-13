import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GEWERKE, resolveGewerk, buildInquiryMessage, FunnelField, FunnelAnswers, FUNNEL_MESSAGE_KEY } from '../services/gewerke';

const Wizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Schritt 0 = Gewerk-Auswahl, Schritt 1 = Fragen zum Gewerk.
  const [step, setStep] = useState(0);
  const [gewerkKey, setGewerkKey] = useState<string | null>(null);
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [answers, setAnswers] = useState<FunnelAnswers>({});

  const gewerk = gewerkKey ? resolveGewerk(gewerkKey) : null;

  const setField = (key: string, value: string | string[]) =>
    setAnswers(a => ({ ...a, [key]: value }));

  const toggleChip = (key: string, option: string) =>
    setAnswers(a => {
      const cur = Array.isArray(a[key]) ? (a[key] as string[]) : [];
      return { ...a, [key]: cur.includes(option) ? cur.filter(x => x !== option) : [...cur, option] };
    });

  const chooseGewerk = (key: string) => {
    setGewerkKey(key);
    setAnswers({});
    setStep(1);
  };

  const handleSubmit = () => {
    if (!gewerk) return;
    if (!city.trim()) { alert('Bitte geben Sie eine Stadt/Region an.'); return; }
    // Pflichtfelder prüfen
    const missing = gewerk.fields.find(f => f.required && !answers[f.key]);
    if (missing) { alert(`Bitte füllen Sie das Feld „${missing.label}" aus.`); return; }

    const message = buildInquiryMessage(gewerk, city.trim(), answers);
    try { sessionStorage.setItem(FUNNEL_MESSAGE_KEY, message); } catch { /* ignore */ }
    navigate(`/search-results?city=${encodeURIComponent(city.trim())}&gewerk=${encodeURIComponent(gewerk.key)}`);
  };

  // ─── Schritt 0: Gewerk-Auswahl ────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Wen suchen Sie?</h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Wählen Sie das passende Gewerk — danach stellen wir Ihnen die richtigen Fragen und finden
            passende Anbieter in Ihrer Region.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {GEWERKE.map(g => (
            <button
              key={g.key}
              onClick={() => chooseGewerk(g.key)}
              className="group bg-white rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-sm hover:shadow-xl border-2 border-slate-100 hover:border-indigo-400 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-indigo-600 group-hover:scale-110 transition-all duration-300">
                {g.icon}
              </div>
              <span className="font-black text-slate-900 text-sm sm:text-base leading-tight mb-1">{g.label}</span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium leading-snug">{g.tagline}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Schritt 1: Fragen zum gewählten Gewerk ───────────────────────────────
  const renderField = (f: FunnelField) => {
    const val = answers[f.key];
    switch (f.kind) {
      case 'select':
        return (
          <select
            value={typeof val === 'string' ? val : ''}
            onChange={e => setField(f.key, e.target.value)}
            className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          >
            <option value="">Bitte wählen …</option>
            {f.options!.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      case 'chips':
        return (
          <div className="flex flex-wrap gap-2">
            {f.options!.map(o => {
              const active = Array.isArray(val) && val.includes(o);
              return (
                <button
                  key={o} type="button" onClick={() => toggleChip(f.key, o)}
                  className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                    active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        );
      case 'textarea':
        return (
          <textarea
            value={typeof val === 'string' ? val : ''}
            onChange={e => setField(f.key, e.target.value)}
            rows={5}
            placeholder={f.placeholder}
            className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-6 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
          />
        );
      default: // text / number
        return (
          <input
            type={f.kind === 'number' ? 'number' : 'text'}
            value={typeof val === 'string' ? val : ''}
            onChange={e => setField(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
          <span className="text-base">{gewerk!.icon}</span> {gewerk!.label} finden
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Ihre Anfrage</h1>
      </div>

      <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-2xl border border-slate-100 animate-fade-in-up space-y-8">
        {/* Stadt ist für jedes Gewerk Pflicht */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
            Stadt / Region <span className="text-indigo-500">*</span>
          </label>
          <input
            type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="z. B. Gladbeck"
            className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>

        {gewerk!.fields.map(f => (
          <div key={f.key} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
              {f.label}{f.required && <span className="text-indigo-500"> *</span>}
            </label>
            {renderField(f)}
          </div>
        ))}

        <div className="flex justify-between pt-8 border-t border-slate-50">
          <button
            onClick={() => { setStep(0); setGewerkKey(null); }}
            className="px-8 py-4 rounded-2xl text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-900 transition-all"
          >
            Zurück
          </button>
          <button
            onClick={handleSubmit}
            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.05] transition-all"
          >
            Passende {gewerk!.labelPlural} finden
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wizard;
