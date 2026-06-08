import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { IS_PRO_TYPE } from '../types';
import { getBadgeIcon, getBadgeTierColor } from '../services/pointsService';
import {
  collection, query, orderBy, getDocs, addDoc, serverTimestamp,
  doc, updateDoc, arrayUnion, getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { MatchRequest, MatchApplication } from '../types';

const PROPERTY_TYPES = ['WEG', 'Mietshaus', 'Gewerbe', 'Eigentumswohnung'];
const SERVICES = ['WEG-Verwaltung', 'Mietverwaltung', 'Buchhaltung', 'Reparaturmanagement', 'Hausgeldabrechnung', 'Eigentümerversammlung'];

const StatusBadge = ({ status }: { status: MatchRequest['status'] }) => {
  const map = {
    offen: 'bg-green-50 text-green-700 border-green-200',
    inBearbeitung: 'bg-blue-50 text-blue-700 border-blue-200',
    vergeben: 'bg-slate-100 text-slate-500 border-slate-200',
    archiviert: 'bg-red-50 text-red-500 border-red-200',
  };
  const labels = { offen: 'Offen', inBearbeitung: 'In Bearbeitung', vergeben: 'Vergeben', archiviert: 'Archiviert' };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[status]}`}>
      {labels[status]}
    </span>
  );
};

// ── New Request Form ─────────────────────────────────────────────────────────

const NewRequestForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    city: '', zip: '', units: 1, propertyType: 'WEG' as MatchRequest['propertyType'],
    buildingAge: 'vor 1990', condition: 'Gut', servicesNeeded: [] as string[],
    description: '', budget: ''
  });
  const [loading, setLoading] = useState(false);

  const toggleService = (s: string) => {
    setForm(f => ({
      ...f,
      servicesNeeded: f.servicesNeeded.includes(s)
        ? f.servicesNeeded.filter(x => x !== s)
        : [...f.servicesNeeded, s]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'matchRequests'), {
        ...form,
        ownerId: user.id,
        ownerName: user.name,
        ownerEmail: user.email,
        status: 'offen',
        applications: [],
        createdAt: serverTimestamp(),
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const label = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900 mb-5">Neue Anfrage einstellen</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={label}>Stadt *</label>
          <input className={input} required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="z.B. München" />
        </div>
        <div>
          <label className={label}>PLZ</label>
          <input className={input} value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="z.B. 80331" />
        </div>
        <div>
          <label className={label}>Anzahl Einheiten *</label>
          <input type="number" min={1} className={input} required value={form.units} onChange={e => setForm(f => ({ ...f, units: +e.target.value }))} />
        </div>
        <div>
          <label className={label}>Objekttyp *</label>
          <select className={input} value={form.propertyType} onChange={e => setForm(f => ({ ...f, propertyType: e.target.value as any }))}>
            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Baujahr</label>
          <select className={input} value={form.buildingAge} onChange={e => setForm(f => ({ ...f, buildingAge: e.target.value }))}>
            {['vor 1950', '1950-1980', '1980-2000', 'nach 2000'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Budget (optional)</label>
          <input className={input} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="z.B. bis 30€ pro Einheit" />
        </div>
      </div>
      <div className="mb-4">
        <label className={label}>Gewünschte Leistungen</label>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map(s => (
            <button key={s} type="button"
              onClick={() => toggleService(s)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                form.servicesNeeded.includes(s)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >{s}</button>
          ))}
        </div>
      </div>
      <div className="mb-5">
        <label className={label}>Beschreibung</label>
        <textarea rows={3} className={input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Beschreiben Sie kurz Ihr Objekt und Ihre Wünsche..." />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 active:scale-95">
        {loading ? 'Wird eingestellt...' : 'Anfrage veröffentlichen'}
      </button>
    </form>
  );
};

// ── Application Modal ─────────────────────────────────────────────────────────

const ApplyModal = ({ request, onClose, onSuccess }: { request: MatchRequest; onClose: () => void; onSuccess: () => void }) => {
  const { user } = useContext(AuthContext);
  const [coverText, setCoverText] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!user || !coverText.trim()) return;
    setLoading(true);
    try {
      const requestRef = doc(db, 'matchRequests', request.id);
      const application: Omit<MatchApplication, 'id'> = {
        requestId: request.id,
        managerId: user.id,
        managerName: user.name,
        managerAvatar: user.avatar,
        badgeTier: user.badgeTier,
        coverText,
        proposedPrice,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
        status: 'ausstehend',
      };
      await updateDoc(requestRef, {
        applications: arrayUnion({ ...application, id: crypto.randomUUID() }),
        status: 'inBearbeitung',
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-slate-900 text-lg">Auf Anfrage bewerben</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm">
          <div className="font-black text-slate-900">{request.city} · {request.units} Einheiten · {request.propertyType}</div>
          <div className="text-slate-500 mt-1 line-clamp-2">{request.description}</div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Ihr Anschreiben *</label>
          <textarea rows={4} value={coverText} onChange={e => setCoverText(e.target.value)}
            placeholder="Warum sind Sie der richtige Verwalter für dieses Objekt?"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <div className="mb-5">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Preisvorschlag (optional)</label>
          <input value={proposedPrice} onChange={e => setProposedPrice(e.target.value)}
            placeholder="z.B. 28€ pro Einheit/Monat"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <button onClick={handleApply} disabled={loading || !coverText.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg active:scale-95">
          {loading ? 'Wird gesendet...' : 'Bewerbung abschicken'}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const MatchingBoard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [applyTarget, setApplyTarget] = useState<MatchRequest | null>(null);
  const [filter, setFilter] = useState<'alle' | 'offen' | 'inBearbeitung'>('offen');
  const [cityFilter, setCityFilter] = useState('');

  const isOwner = !user || !IS_PRO_TYPE(user.userType);
  const isPro = user && IS_PRO_TYPE(user.userType);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'matchRequests'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchRequest)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const filtered = requests.filter(r => {
    if (filter !== 'alle' && r.status !== filter) return false;
    if (cityFilter && !r.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Vermittlung</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">Anfragen-Board</h1>
              <p className="text-slate-500 font-medium text-sm md:text-base">
                {isOwner
                  ? 'Stellen Sie eine Anfrage ein — geprüfte Verwalter melden sich bei Ihnen.'
                  : 'Finden Sie passende Objekte und bewerben Sie sich direkt.'}
              </p>
            </div>
            {user && isOwner && (
              <button onClick={() => setShowNewForm(s => !s)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 whitespace-nowrap">
                + Anfrage einstellen
              </button>
            )}
            {!user && (
              <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 whitespace-nowrap">
                Anmelden & Anfrage stellen
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* New Request Form */}
        {showNewForm && user && (
          <div className="mb-6">
            <NewRequestForm onSuccess={() => { setShowNewForm(false); loadRequests(); }} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="flex gap-2 bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
            {(['alle', 'offen', 'inBearbeitung'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}>
                {f === 'alle' ? 'Alle' : f === 'offen' ? 'Offen' : 'In Bearbeitung'}
              </button>
            ))}
          </div>
          <input
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            placeholder="Nach Stadt filtern..."
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Request List */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📋</div>
            <p className="font-black text-slate-900 text-lg mb-2">Keine Anfragen gefunden</p>
            <p className="text-slate-500 text-sm font-medium">
              {isOwner ? 'Stellen Sie die erste Anfrage ein!' : 'Versuchen Sie andere Filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(req => (
              <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-black text-slate-900 text-base">{req.city} {req.zip && `· ${req.zip}`}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">{req.propertyType} · {req.units} Einheiten</div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                {req.servicesNeeded?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {req.servicesNeeded.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full">{s}</span>
                    ))}
                    {req.servicesNeeded.length > 3 && (
                      <span className="text-[10px] font-medium text-slate-400">+{req.servicesNeeded.length - 3}</span>
                    )}
                  </div>
                )}

                {req.description && (
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-3 line-clamp-2">{req.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {req.budget && (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        💰 {req.budget}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">
                      {req.applications?.length || 0} Bewerbung{req.applications?.length !== 1 ? 'en' : ''}
                    </span>
                  </div>
                  {isPro && req.status === 'offen' && (
                    <button onClick={() => setApplyTarget(req)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95">
                      Bewerben
                    </button>
                  )}
                  {isOwner && user && req.ownerId === user.id && (
                    <Link to={`/profile`} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">
                      Meine Anfrage →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {applyTarget && (
        <ApplyModal
          request={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSuccess={() => { setApplyTarget(null); loadRequests(); }}
        />
      )}
    </div>
  );
};

export default MatchingBoard;
