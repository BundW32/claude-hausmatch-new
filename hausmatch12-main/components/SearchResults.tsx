import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { searchPropertyManagers } from '../services/geminiService';
import { getManagersByCity } from '../services/dataService';
import { resolveSearchTarget } from '../services/professions';
import { ManagerSearchResult, SearchCompany, User } from '../types';
import { resolveGewerk, GewerkDef, FUNNEL_MESSAGE_KEY } from '../services/gewerke';
import { AuthContext } from '../App';

// Offene Anfrage, die vor der Registrierung zwischengespeichert wird, damit die
// Auswahl nach dem Registrieren erhalten bleibt.
const PENDING_INQUIRY_KEY = 'hm_pending_inquiry';

const EDDY_URL = "/eddy-eule.png";

interface SelectableEntry {
  key: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
}

// ─── Checkbox ──────────────────────────────────────────────────────────────────
const Checkbox = ({ checked, onToggle }: { checked: boolean; onToggle: () => void }) => (
  <button
    onClick={e => { e.stopPropagation(); onToggle(); }}
    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
      checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 hover:border-indigo-400'
    }`}
    aria-label={checked ? 'Abwählen' : 'Auswählen'}
  >
    {checked && (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
    )}
  </button>
);

// ─── StarRating ─────────────────────────────────────────────────────────────────
const StarRating = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= full ? 'text-amber-400' : i === full + 1 && half ? 'text-amber-300' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// ─── CompanyCard ────────────────────────────────────────────────────────────────
const CompanyCard = ({ company, selected, onToggle }: { company: SearchCompany; selected: boolean; onToggle: () => void }) => {
  const [showContact, setShowContact] = useState(false);
  return (
    <div className={`bg-white rounded-3xl border-2 shadow-sm hover:shadow-md transition-all overflow-hidden ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-start gap-3 mb-4">
          <Checkbox checked={selected} onToggle={onToggle} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {company.isPartner && <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Partner</span>}
              <h3 className="text-lg sm:text-xl font-black text-slate-900 break-words leading-snug">{company.name}</h3>
            </div>
            <p className="text-slate-500 text-sm font-medium truncate">{company.address || company.city}</p>
          </div>
          {company.rating > 0 && (
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{company.rating.toFixed(1)}</div>
              <StarRating rating={company.rating} />
              {company.reviews > 0 && <p className="text-slate-400 text-xs mt-0.5">{company.reviews} Bewertungen</p>}
            </div>
          )}
        </div>

        {company.specialization && (
          <div className="flex flex-wrap gap-2 mb-6">
            {company.specialization.split(',').map((s, i) => (
              <span key={i} className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">{s.trim()}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowContact(!showContact)}
            className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors active:scale-95">
            {showContact ? 'Verbergen' : 'Kontakt anzeigen'}
          </button>
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-100 text-slate-700 py-3 px-5 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Website
            </a>
          )}
        </div>

        {showContact && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            {company.phone && (
              <a href={`tel:${company.phone}`} className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span className="font-semibold">{company.phone}</span>
              </a>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <span className="font-semibold">{company.email}</span>
              </a>
            )}
            {!company.phone && !company.email && <p className="text-slate-400 text-sm">Keine Kontaktdaten verfügbar. Bitte Website besuchen.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── NetworkManagerCard ─────────────────────────────────────────────────────────
const NetworkManagerCard = ({ manager, selected, onToggle }: { manager: User; selected: boolean; onToggle: () => void }) => {
  const [showContact, setShowContact] = useState(false);
  const displayName = manager.companyName || manager.name;
  const location = manager.city || manager.location || '';
  const specs = (manager.specialization || []).join(', ');
  return (
    <div className={`bg-white rounded-3xl border-2 shadow-sm hover:shadow-md transition-all overflow-hidden relative ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-indigo-200'}`}>
      <div className="absolute top-4 right-4">
        <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">HausMatch Netzwerk</span>
      </div>
      <div className="p-4 pt-8 sm:p-6 sm:pt-10 md:p-8 md:pt-12">
        <div className="flex items-start gap-3 mb-4">
          <Checkbox checked={selected} onToggle={onToggle} />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 pr-24 sm:pr-32 break-words leading-snug">{displayName}</h3>
            {location && <p className="text-slate-500 text-sm font-medium mt-0.5">{location}</p>}
          </div>
        </div>
        {specs && (
          <div className="flex flex-wrap gap-2 mb-6">
            {specs.split(',').map((s, i) => (
              <span key={i} className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">{s.trim()}</span>
            ))}
          </div>
        )}
        {manager.bio && <p className="text-slate-500 text-sm mb-6 leading-relaxed">{manager.bio}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowContact(!showContact)}
            className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors active:scale-95">
            {showContact ? 'Verbergen' : 'Kontakt anzeigen'}
          </button>
          {manager.website && (
            <a href={manager.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-100 text-slate-700 py-3 px-5 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Website
            </a>
          )}
        </div>
        {showContact && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            {manager.phone && (
              <a href={`tel:${manager.phone}`} className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span className="font-semibold">{manager.phone}</span>
              </a>
            )}
            <a href={`mailto:${manager.email}`} className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <span className="font-semibold">{manager.email}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ExpressModal ───────────────────────────────────────────────────────────────
const ExpressModal = ({ selected, city, gewerk, onClose }: { selected: SelectableEntry[]; city: string; gewerk: GewerkDef; onClose: () => void }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [ownerEmail, setOwnerEmail] = useState(user?.email || '');
  const [ownerPhone, setOwnerPhone] = useState('');
  // Beschreibung mit dem im Wizard zusammengestellten Text vorbelegen (falls vorhanden).
  const [description, setDescription] = useState(() => {
    try { return sessionStorage.getItem(FUNNEL_MESSAGE_KEY) || ''; } catch { return ''; }
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/send-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: ownerName,
          senderEmail: ownerEmail,
          senderPhone: ownerPhone,
          message: description,
          city,
          serviceType: gewerk.key,
          companies: selected.map(s => ({ name: s.name, email: s.email, address: s.address, phone: s.phone })),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Fehler beim Senden');
      }
      setDone(true);
      try { sessionStorage.removeItem(PENDING_INQUIRY_KEY); } catch { /* ignore */ }
    } catch (err: any) {
      setError(err.message || 'Anfrage konnte nicht gesendet werden.');
    } finally {
      setSending(false);
    }
  };

  // Nicht eingeloggt: Auswahl zwischenspeichern und zur Registrierung schicken.
  // Nach der Registrierung kehrt der Nutzer über ?resume=1 hierher zurück.
  const goToRegister = (mode: 'register' | 'login') => {
    try {
      sessionStorage.setItem(PENDING_INQUIRY_KEY, JSON.stringify({ city, gewerkKey: gewerk.key, entries: selected }));
    } catch { /* ignore */ }
    const ret = `/search-results?city=${encodeURIComponent(city)}&gewerk=${encodeURIComponent(gewerk.key)}&resume=1`;
    navigate(`/${mode}?redirect=${encodeURIComponent(ret)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="bg-indigo-600 px-5 py-5 sm:px-8 sm:py-6 flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#2563FF' }}>
            <img src={EDDY_URL} alt="Eddy" width={48} height={48} style={{ display: 'block', objectFit: 'cover' }} />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-black text-xl">Express-Matching</h2>
            <p className="text-indigo-200 text-sm font-medium">{selected.length} {selected.length === 1 ? gewerk.label : gewerk.labelPlural} werden kontaktiert</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-8">
          {!done && !user ? (
            <div className="py-4">
              <div className="bg-indigo-50 rounded-2xl p-4 mb-6">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Ausgewählte {gewerk.labelPlural} ({selected.length})</p>
                <div className="space-y-1">
                  {selected.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center px-2">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Kostenlos registrieren, um Angebote zu erhalten</h3>
                <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                  Legen Sie ein kostenloses Konto an, damit wir Ihre Anfrage an die ausgewählten {gewerk.labelPlural} senden
                  und die Angebote sicher in Ihrem Postfach bündeln können. Ihre Auswahl bleibt dabei erhalten.
                </p>
                <button
                  onClick={() => goToRegister('register')}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-base hover:bg-indigo-700 transition-colors active:scale-95 shadow-xl shadow-indigo-200/50 mb-3"
                >
                  Kostenlos registrieren & Angebote anfragen
                </button>
                <button
                  onClick={() => goToRegister('login')}
                  className="w-full bg-white text-slate-700 py-3.5 rounded-2xl font-black text-sm border-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  Bereits ein Konto? Jetzt einloggen
                </button>
                <p className="text-slate-400 text-xs mt-4">Kostenlos & unverbindlich. Ihre Auswahl wird zwischengespeichert.</p>
              </div>
            </div>
          ) : done ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Anfragen versendet!</h3>
              <p className="text-slate-500 font-medium mb-2">
                Wir haben <span className="font-black text-indigo-600">{selected.length} {selected.length === 1 ? gewerk.label : gewerk.labelPlural}</span> in {city} um ein Angebot gebeten.
              </p>
              <p className="text-slate-400 text-sm mb-8">Die Angebote werden direkt an <span className="font-semibold">{ownerEmail}</span> gesendet.</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-left mb-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Kontaktierte {gewerk.labelPlural}</p>
                {selected.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                    {!s.email && <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">keine E-Mail, via HausMatch</span>}
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-colors">
                Schließen
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-5">
              <div className="bg-indigo-50 rounded-2xl p-4 mb-6">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Ausgewählte {gewerk.labelPlural} ({selected.length})</p>
                <div className="space-y-1">
                  {selected.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ihr Name *</label>
                <input required value={ownerName} onChange={e => setOwnerName(e.target.value)}
                  placeholder="Max Mustermann"
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-slate-900 font-medium ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ihre E-Mail *</label>
                <input required type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-slate-900 font-medium ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Telefon (optional)</label>
                <input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
                  placeholder="+49 ..."
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-slate-900 font-medium ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ihr Anliegen *</label>
                <textarea required rows={5} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Beschreiben Sie Ihr Anliegen …"
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-slate-900 font-medium ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-2xl border border-red-100">{error}</div>
              )}

              <button type="submit" disabled={sending}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 shadow-xl shadow-indigo-200/50">
                {sending ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Anfragen werden gesendet...
                  </span>
                ) : `Angebote bei ${selected.length} ${selected.length === 1 ? gewerk.label : gewerk.labelPlural} anfragen`}
              </button>
              <p className="text-slate-400 text-xs text-center">Die {gewerk.labelPlural} erhalten Ihre Anfrage und senden ihr Angebot direkt an Ihre E-Mail.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SearchResults ──────────────────────────────────────────────────────────────
const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const city = searchParams.get('city') || 'Deutschland';
  // Zwei Einstiege: der Funnel (Wizard) nutzt ?gewerk=<Gewerk-Key>, die
  // Startseiten-Suche ?beruf=<Beruf>&gewerk=<Handwerks-Gewerk>. Ist beruf
  // gesetzt, bezeichnet gewerk also das konkrete Handwerks-Gewerk.
  const beruf = searchParams.get('beruf');
  const gewerkParam = searchParams.get('gewerk');
  const professionId = beruf || gewerkParam || 'hausverwaltung';
  const tradeId = beruf ? gewerkParam : null;
  const gewerk = resolveGewerk(professionId); // Funnel-Definition (serviceType, Resume-Link)
  const target = resolveSearchTarget(professionId, tradeId); // Label/Plural/Suchbegriff/userTypes
  const [result, setResult] = useState<ManagerSearchResult | null>(null);
  const [networkManagers, setNetworkManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const { user } = useContext(AuthContext);
  // Nach der Registrierung wiederhergestellte Auswahl (überlebt die Navigation).
  const [resumeEntries, setResumeEntries] = useState<SelectableEntry[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [data, managers] = await Promise.all([
        searchPropertyManagers(city, { searchTerm: target.searchTerm, label: target.label, labelPlural: target.plural }),
        // Hausverwaltung: wie bisher über role=manager; andere Gewerke über userType.
        getManagersByCity(city, professionId === 'hausverwaltung' ? undefined : target.userTypes),
      ]);
      setResult(data);
      setNetworkManagers(managers);
      setLoading(false);
    };
    fetchData();
  }, [city, professionId, tradeId]);

  // Rückkehr aus der Registrierung: gespeicherte Anfrage wiederherstellen und
  // das Absende-Modal (jetzt eingeloggt) direkt wieder öffnen.
  useEffect(() => {
    if (!user || searchParams.get('resume') !== '1') return;
    try {
      const raw = sessionStorage.getItem(PENDING_INQUIRY_KEY);
      if (!raw) return;
      const pending = JSON.parse(raw) as { entries?: SelectableEntry[] };
      if (Array.isArray(pending.entries) && pending.entries.length > 0) {
        setResumeEntries(pending.entries);
        setShowModal(true);
      }
    } catch { /* ignore */ }
  }, [user, searchParams]);

  const toggle = (key: string) => setSelectedKeys(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const getSelectedEntries = (): SelectableEntry[] => {
    const entries: SelectableEntry[] = [];
    networkManagers.forEach(m => {
      if (selectedKeys.has(`net_${m.id}`)) {
        entries.push({ key: `net_${m.id}`, name: m.companyName || m.name, email: m.email, phone: m.phone, address: m.city || m.location });
      }
    });
    result?.companies.forEach((c, i) => {
      if (selectedKeys.has(`comp_${i}`)) {
        entries.push({ key: `comp_${i}`, name: c.name, email: c.email, phone: c.phone, address: c.address });
      }
    });
    return entries;
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-8 sm:pt-12 pb-32 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 mb-6 md:mb-12">
          <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">Live Matching</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">Empfohlene {target.plural} in {city}</h1>
        </div>

        <p className="text-xs text-slate-500 font-medium leading-relaxed bg-white border border-slate-200 rounded-2xl px-4 py-3 mb-6 md:mb-10">
          <span className="font-black text-slate-700">KI-generierte Vorschläge:</span> Diese Liste wird von einem
          KI-System aus öffentlich verfügbaren Informationen zusammengestellt (Kennzeichnung nach Art. 50
          EU-KI-Verordnung). Sie ist unverbindlich, kann Fehler oder veraltete Angaben enthalten und stellt keine
          Empfehlung oder Bewertung der Qualität dar. Wen Sie kontaktieren, entscheiden allein Sie.{' '}
          <Link to="/legal/ki" className="text-indigo-600 underline font-bold">KI-Transparenzhinweise</Link>
        </p>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
          <div className="lg:col-span-2 space-y-6">

            {loading ? (
              <div className="bg-white p-8 sm:p-16 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 flex flex-col items-center text-center shadow-sm">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden" style={{ background: '#2563FF' }}>
                    <img src={EDDY_URL} alt="Eddy" width={96} height={96} style={{ display: 'block', objectFit: 'cover' }} className="animate-pulse" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Eddy sucht für Sie...</h3>
                <p className="text-slate-400 font-medium">Passende {target.plural} in <span className="text-indigo-600 font-black">{city}</span> werden geprüft</p>
                <p className="text-slate-300 text-sm mt-2 font-medium">Kontaktdaten werden direkt von den Websites geladen</p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-slate-600 font-medium">{result.introText}</p>
                  </div>
                  {(networkManagers.length + (result.companies?.length || 0)) > 0 && (
                    <button
                      onClick={() => {
                        const allKeys = new Set<string>();
                        networkManagers.forEach(m => allKeys.add(`net_${m.id}`));
                        result.companies.forEach((_, i) => allKeys.add(`comp_${i}`));
                        setSelectedKeys(selectedKeys.size === allKeys.size ? new Set() : allKeys);
                      }}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors flex-shrink-0"
                    >
                      {selectedKeys.size > 0 ? 'Alle abwählen' : 'Alle auswählen'}
                    </button>
                  )}
                </div>

                {networkManagers.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">HausMatch Netzwerk: Verifizierte Partner</span>
                    </div>
                    {networkManagers.map((m) => (
                      <NetworkManagerCard key={m.id} manager={m} selected={selectedKeys.has(`net_${m.id}`)} onToggle={() => toggle(`net_${m.id}`)} />
                    ))}
                    {result.companies.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-4">
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Weitere Ergebnisse aus dem Web</span>
                      </div>
                    )}
                  </div>
                )}

                {result.companies.length > 0 ? (
                  result.companies.map((company, idx) => (
                    <CompanyCard key={idx} company={company} selected={selectedKeys.has(`comp_${idx}`)} onToggle={() => toggle(`comp_${idx}`)} />
                  ))
                ) : networkManagers.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
                    <p className="text-slate-400 font-medium">Keine Ergebnisse gefunden. Bitte versuchen Sie eine andere Stadt.</p>
                    <button onClick={() => navigate('/')} className="mt-6 bg-indigo-600 text-white py-3 px-8 rounded-2xl font-black hover:bg-indigo-700 transition-colors">
                      Neue Suche
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 sm:p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white sticky top-24 shadow-2xl shadow-indigo-200/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[1rem] overflow-hidden flex-shrink-0" style={{ background: '#2563FF' }}>
                  <img src={EDDY_URL} alt="Eddy" width={64} height={64} style={{ display: 'block', objectFit: 'cover' }} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight">Express-Matching</h4>
                  <p className="text-indigo-200 text-sm font-medium">Angebote direkt anfragen</p>
                </div>
              </div>
              <p className="text-indigo-100 text-base mb-8 leading-relaxed font-semibold">
                Wählen Sie {target.plural} aus der Liste aus und fordern Sie mit einem Klick Angebote an, diskret und kostenlos.
              </p>
              {selectedKeys.size > 0 ? (
                <button onClick={() => setShowModal(true)} className="w-full bg-white text-indigo-700 py-5 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all shadow-xl active:scale-95">
                  {selectedKeys.size} Angebot{selectedKeys.size > 1 ? 'e' : ''} anfragen →
                </button>
              ) : (
                <div className="w-full bg-white/20 text-white/70 py-5 rounded-2xl font-black text-base text-center">
                  Bitte erst Anbieter auswählen
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky selection bar */}
      {selectedKeys.size > 0 && !showModal && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <div className="bg-slate-900 rounded-3xl px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4 shadow-2xl shadow-slate-900/40">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm">{selectedKeys.size} {target.plural} ausgewählt</p>
                <p className="text-slate-400 text-xs font-medium truncate">
                  {getSelectedEntries().map(e => e.name).join(', ')}
                </p>
              </div>
              <button onClick={() => setShowModal(true)}
                className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-indigo-500 transition-colors active:scale-95 flex-shrink-0 whitespace-nowrap">
                Angebote anfragen
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ExpressModal
          selected={resumeEntries || getSelectedEntries()}
          city={city}
          gewerk={gewerk}
          onClose={() => { setShowModal(false); setResumeEntries(null); }}
        />
      )}
    </div>
  );
};

export default SearchResults;
