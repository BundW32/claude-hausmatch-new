import React, { useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../App';
import { analyzePropertyRequirement } from '../services/geminiService';
import { createInquiry } from '../services/dataService';

const Wizard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    city: searchParams.get('city') || '',
    units: 10,
    propertyType: 'WEG',
    servicesNeeded: [] as string[],
    buildingAge: '',
    condition: '',
    description: '',
  });

  const handleSubmit = async () => {
    if (!formData.city) {
      alert("Bitte geben Sie eine Stadt ein.");
      return;
    }
    setLoading(true);
    try {
      const analysis = await analyzePropertyRequirement(formData);
      createInquiry({
        ...formData,
        ownerId: user?.id || 'gast',
        ownerName: user?.name || 'Gast',
        ownerEmail: user?.email || 'gast@example.de',
        status: 'neu',
        aiAnalysis: analysis,
        units: Number(formData.units),
        propertyType: formData.propertyType as 'WEG' | 'Mietshaus' | 'Gewerbe',
      }).catch(e => console.error('Anfrage speichern fehlgeschlagen:', e));
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => navigate(`/search-results?city=${encodeURIComponent(formData.city)}`), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden mx-auto shadow-xl shadow-indigo-200" style={{ background: '#2563FF' }}>
            <img src="https://cdn.jsdelivr.net/gh/BundW32/claude-hausmatch-new@main/hf_20260616_092652_b3b38af5-a913-44c1-80ef-1ac5d9adedb4.png"
              alt="Eddy" width={80} height={80} style={{ display: 'block', objectFit: 'cover' }} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Eddy sucht für Sie...</h3>
            <p className="text-slate-400 font-medium">Verwalter in <span className="text-indigo-600 font-black">{formData.city}</span> werden analysiert</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-indigo-600 rounded-full animate-[progress_3s_ease-in-out_forwards]"
              style={{ animation: 'progress 3s ease-in-out forwards' }} />
          </div>
          <style>{`@keyframes progress { from { width: 0% } to { width: 92% } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Objekt-Konfigurator</h1>
        <div className="flex justify-center gap-3">
          {[0,1,2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-12 bg-indigo-600' : 'w-4 bg-slate-200'}`}></div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 animate-fade-in-up">
        {step === 0 && (
          <div className="space-y-10">
            <h2 className="text-2xl font-black text-slate-800">Basis-Informationen</h2>
            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Stadt</label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Anzahl Einheiten</label>
                  <input 
                    type="number" 
                    value={formData.units} 
                    onChange={e => setFormData({...formData, units: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
               </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-10">
            <h2 className="text-2xl font-black text-slate-800">Objekt-Spezifikationen</h2>
            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Objekttyp</label>
                  <select 
                    value={formData.propertyType}
                    onChange={e => setFormData({...formData, propertyType: e.target.value as any})}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  >
                    <option value="WEG">WEG (Wohnungseigentum)</option>
                    <option value="Mietshaus">Mietshaus (Globalobjekt)</option>
                    <option value="Gewerbe">Gewerbeimmobilie</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Baujahr (Ca.)</label>
                  <input 
                    type="text" 
                    value={formData.buildingAge} 
                    onChange={e => setFormData({...formData, buildingAge: e.target.value})}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="z.B. 1980"
                  />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Zustand des Objekts</label>
                  <select 
                    value={formData.condition}
                    onChange={e => setFormData({...formData, condition: e.target.value})}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  >
                    <option value="">Zustand wählen...</option>
                    <option value="Sehr gut / Saniert">Sehr gut / Saniert</option>
                    <option value="Gepflegt">Gepflegt</option>
                    <option value="Renovierungsbedürftig">Renovierungsbedürftig</option>
                    <option value="Sanierungsstau">Sanierungsstau</option>
                  </select>
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10">
            <h2 className="text-2xl font-black text-slate-800">Bedarfs-Analyse (KI-Input)</h2>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Freitext-Beschreibung</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={6}
                className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-6 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                placeholder="Beschreiben Sie Besonderheiten, Probleme oder Wünsche an die neue Verwaltung..."
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-4">Tipp: Je detaillierter, desto besser der KI-Match.</p>
            </div>
          </div>
        )}

        <div className="mt-16 flex justify-between pt-10 border-t border-slate-50">
          <button 
            onClick={() => setStep(s => s - 1)} 
            disabled={step === 0}
            className="px-8 py-4 rounded-2xl text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-900 disabled:opacity-0 transition-all"
          >
            Zurück
          </button>
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.05] transition-all">
              Weiter
            </button>
          ) : (
            <button onClick={handleSubmit} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.05] transition-all">
              Matches Finden
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wizard;