import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../App';
import {
  subscribeToAufgaben,
  subscribeToOwnerAufgaben,
  createAufgabe,
  getBewerbungenForAufgabe,
  createBewerbung,
  acceptBewerbung,
} from '../services/dataService';
import {
  MatchRequest,
  MatchApplication,
  BadgeTier,
  AUFGABEN_CATEGORIES,
  AufgabenCategory,
} from '../types';

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatDate = (ts: MatchRequest['createdAt']): string => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const badgeTierColor = (tier: BadgeTier | null | undefined) => {
  if (tier === 'platin') return 'bg-violet-100 text-violet-700';
  if (tier === 'gold')   return 'bg-amber-100 text-amber-700';
  if (tier === 'silber') return 'bg-slate-200 text-slate-600';
  if (tier === 'bronze') return 'bg-orange-100 text-orange-700';
  return 'bg-slate-100 text-slate-400';
};

const statusDot = (status: MatchRequest['status']) => {
  if (status === 'offen')         return 'bg-indigo-500 animate-pulse';
  if (status === 'inBearbeitung') return 'bg-amber-400';
  if (status === 'vergeben')      return 'bg-green-400';
  return 'bg-slate-300';
};

const statusLabel = (status: MatchRequest['status']) => {
  if (status === 'offen')         return 'Offen';
  if (status === 'inBearbeitung') return 'In Bearbeitung';
  if (status === 'vergeben')      return 'Vergeben';
  return 'Archiviert';
};

// ─── AufgabeCard ──────────────────────────────────────────────────────────────

interface AufgabeCardProps {
  aufgabe: MatchRequest;
  isSelected: boolean;
  onClick: () => void;
}

const AufgabeCard: React.FC<AufgabeCardProps> = ({ aufgabe, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all border mb-2 group ${
      isSelected
        ? 'bg-indigo-50 border-indigo-200 shadow-md'
        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${statusDot(aufgabe.status)}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-black text-sm truncate ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
          {aufgabe.title || aufgabe.description?.slice(0, 60)}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          <span className="text-xs text-slate-500 font-medium">{aufgabe.city}</span>
          {aufgabe.category && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              {aufgabe.category}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-slate-400 font-medium">{formatDate(aufgabe.createdAt)}</span>
          {(aufgabe.applicationCount ?? 0) > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-full">
              {aufgabe.applicationCount} Bewerbung{aufgabe.applicationCount !== 1 ? 'en' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  </button>
);

// ─── BewerbungCard ────────────────────────────────────────────────────────────

interface BewerbungCardProps {
  bewerbung: MatchApplication;
  isOwner: boolean;
  onAccept?: () => void;
}

const BewerbungCard: React.FC<BewerbungCardProps> = ({ bewerbung, isOwner, onAccept }) => (
  <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
    bewerbung.status === 'angenommen'
      ? 'border-green-200 bg-green-50'
      : bewerbung.status === 'abgelehnt'
      ? 'border-slate-100 bg-slate-50 opacity-50'
      : 'border-slate-100 bg-white'
  }`}>
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0">
        {bewerbung.managerName?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-black text-sm text-slate-900">{bewerbung.managerName}</span>
          {bewerbung.badgeTier && (
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeTierColor(bewerbung.badgeTier)}`}>
              {bewerbung.badgeTier}
            </span>
          )}
          {bewerbung.status === 'angenommen' && (
            <span className="text-[10px] bg-green-100 text-green-700 font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              Angenommen ✓
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{bewerbung.coverText}</p>
        {bewerbung.proposedPrice && (
          <p className="text-xs font-black text-indigo-600 mt-1">Angebot: {bewerbung.proposedPrice}</p>
        )}
        {isOwner && bewerbung.status === 'ausstehend' && onAccept && (
          <button
            onClick={onAccept}
            className="mt-3 px-4 py-2 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-colors"
          >
            Annehmen
          </button>
        )}
      </div>
    </div>
  </div>
);

// ─── AufgabeDetail ────────────────────────────────────────────────────────────

interface AufgabeDetailProps {
  aufgabe: MatchRequest;
  bewerbungen: MatchApplication[];
  bewerbungenLoading: boolean;
  onBewerben: () => void;
  onAccept: (bewerbungId: string, managerId: string) => void;
  onBack: () => void;
}

const AufgabeDetail: React.FC<AufgabeDetailProps> = ({
  aufgabe, bewerbungen, bewerbungenLoading, onBewerben, onAccept, onBack
}) => {
  const { user } = useContext(AuthContext);
  const isOwner = user?.id === aufgabe.ownerId;
  const canApply = (user?.role === 'manager' || user?.role === 'profi') && !isOwner;
  const alreadyApplied = bewerbungen.some(b => b.managerId === user?.id);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100">
        <button
          onClick={onBack}
          className="md:hidden flex items-center gap-2 mb-4 text-slate-500 font-black text-xs uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </button>

        <div className="flex flex-wrap items-start gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
            aufgabe.status === 'offen'         ? 'bg-indigo-100 text-indigo-700' :
            aufgabe.status === 'inBearbeitung' ? 'bg-amber-100 text-amber-700' :
            aufgabe.status === 'vergeben'      ? 'bg-green-100 text-green-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(aufgabe.status)}`} />
            {statusLabel(aufgabe.status)}
          </span>
          {aufgabe.category && (
            <span className="text-xs bg-indigo-50 text-indigo-600 font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
              {aufgabe.category}
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-1">
          {aufgabe.title || 'Aufgabe'}
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          {aufgabe.city}{aufgabe.zip ? ` · ${aufgabe.zip}` : ''} · {formatDate(aufgabe.createdAt)}
        </p>
      </div>

      <div className="p-4 sm:p-6 md:p-8 space-y-5 flex-1">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Beschreibung</h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aufgabe.description}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-2xl p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Einheiten</p>
            <p className="text-sm font-black text-slate-900">{aufgabe.units}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Typ</p>
            <p className="text-sm font-black text-slate-900">{aufgabe.propertyType}</p>
          </div>
          {aufgabe.budget && (
            <div className="bg-indigo-50 rounded-2xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Budget</p>
              <p className="text-sm font-black text-indigo-700">{aufgabe.budget}</p>
            </div>
          )}
        </div>

        {aufgabe.servicesNeeded?.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Leistungen</h3>
            <div className="flex flex-wrap gap-2">
              {aufgabe.servicesNeeded.map(s => (
                <span key={s} className="text-xs bg-white border border-slate-200 text-slate-600 font-black px-3 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Specialist CTA */}
        {canApply && aufgabe.status !== 'vergeben' && aufgabe.status !== 'archiviert' && (
          <div className="pt-2">
            {alreadyApplied ? (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                <p className="text-sm font-black text-green-700">Du hast dich bereits beworben ✓</p>
              </div>
            ) : (
              <button
                onClick={onBewerben}
                className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Jetzt bewerben
              </button>
            )}
          </div>
        )}

        {aufgabe.status === 'vergeben' && canApply && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-slate-500">Diese Aufgabe wurde bereits vergeben.</p>
          </div>
        )}

        {/* Guest CTA */}
        {!user && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center">
            <p className="text-sm font-black text-indigo-700 mb-3">Melde dich an um dich zu bewerben</p>
            <a href="#/login" className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors">
              Anmelden
            </a>
          </div>
        )}

        {/* Owner: Bewerbungen */}
        {isOwner && (
          <div className="pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Bewerbungen ({bewerbungen.length})
            </h3>
            {bewerbungenLoading ? (
              <div className="text-xs text-slate-400 font-black uppercase tracking-widest text-center py-6">Lädt...</div>
            ) : bewerbungen.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-5 text-center">
                <p className="text-sm text-slate-400 font-medium">Noch keine Bewerbungen eingegangen.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bewerbungen.map(b => (
                  <BewerbungCard
                    key={b.id}
                    bewerbung={b}
                    isOwner={isOwner}
                    onAccept={() => {
                      if (window.confirm(`${b.managerName} als Spezialist annehmen?`)) {
                        onAccept(b.id, b.managerId);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── CreateAufgabeModal ───────────────────────────────────────────────────────

interface CreateAufgabeModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const SERVICES_OPTIONS = [
  'Verwaltung', 'Abrechnung', 'Reparatur', 'Sanierung',
  'Energieberatung', 'Rechtsberatung', 'Gutachten', 'Reinigung', 'Sonstiges',
];

const CreateAufgabeModal: React.FC<CreateAufgabeModalProps> = ({ onClose, onCreated }) => {
  const { user } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: AUFGABEN_CATEGORIES[0] as AufgabenCategory,
    city: '',
    zip: '',
    budget: '',
    propertyType: 'WEG' as MatchRequest['propertyType'],
    units: 1,
    buildingAge: '',
    condition: '',
    servicesNeeded: [] as string[],
  });

  const toggleService = (s: string) => {
    setForm(f => ({
      ...f,
      servicesNeeded: f.servicesNeeded.includes(s)
        ? f.servicesNeeded.filter(x => x !== s)
        : [...f.servicesNeeded, s],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.description.trim() || !form.city.trim()) return;
    setSubmitting(true);
    try {
      await createAufgabe({
        ...form,
        ownerId: user.id,
        ownerName: user.name,
        ownerEmail: user.email,
      });
      onCreated();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-5 sm:p-8 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Aufgabe erstellen</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Titel *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="z.B. Suche Hausverwaltung für WEG in München"
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Kategorie</label>
              <div className="flex flex-wrap gap-2">
                {AUFGABEN_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                      form.category === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Beschreibung *</label>
              <textarea
                required
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Beschreiben Sie Ihre Anforderungen..."
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Stadt *</label>
                <input
                  required
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="München"
                  className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">PLZ</label>
                <input
                  value={form.zip}
                  onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
                  placeholder="80331"
                  className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Objekttyp</label>
                <select
                  value={form.propertyType}
                  onChange={e => setForm(f => ({ ...f, propertyType: e.target.value as MatchRequest['propertyType'] }))}
                  className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {(['WEG', 'Mietshaus', 'Gewerbe', 'Eigentumswohnung'] as const).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Einheiten</label>
                <input
                  type="number"
                  min={1}
                  value={form.units}
                  onChange={e => setForm(f => ({ ...f, units: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Budget (optional)</label>
              <input
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="z.B. bis 30€ pro Einheit/Monat"
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Benötigte Leistungen</label>
              <div className="flex flex-wrap gap-2">
                {SERVICES_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                      form.servicesNeeded.includes(s)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200"
              >
                {submitting ? 'Erstelle...' : 'Aufgabe erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── BewerbungModal ───────────────────────────────────────────────────────────

interface BewerbungModalProps {
  aufgabe: MatchRequest;
  onClose: () => void;
  onSubmitted: () => void;
}

const BewerbungModal: React.FC<BewerbungModalProps> = ({ aufgabe, onClose, onSubmitted }) => {
  const { user } = useContext(AuthContext);
  const [coverText, setCoverText] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !coverText.trim()) return;
    setSubmitting(true);
    try {
      await createBewerbung({
        requestId: aufgabe.id,
        managerId: user.id,
        managerName: user.name,
        managerAvatar: user.avatar,
        badgeTier: user.badgeTier,
        coverText,
        proposedPrice,
      });
      onSubmitted();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-lg shadow-2xl">
        <div className="p-5 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Bewerbung abschicken</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 mb-5">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-0.5">Aufgabe</p>
            <p className="text-sm font-black text-slate-800 truncate">{aufgabe.title || aufgabe.description?.slice(0, 60)}</p>
            <p className="text-xs text-slate-500">{aufgabe.city}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Anschreiben *</label>
              <textarea
                required
                value={coverText}
                onChange={e => setCoverText(e.target.value)}
                rows={5}
                placeholder="Warum sind Sie der richtige Spezialist für diese Aufgabe?"
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Preisvorschlag (optional)</label>
              <input
                value={proposedPrice}
                onChange={e => setProposedPrice(e.target.value)}
                placeholder="z.B. 28€ pro Einheit/Monat"
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting || !coverText.trim()}
                className="flex-1 py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200"
              >
                {submitting ? 'Abschicken...' : 'Bewerben'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── AufgabenBoard (main) ─────────────────────────────────────────────────────

const AufgabenBoard: React.FC = () => {
  const { user } = useContext(AuthContext);

  const [aufgaben, setAufgaben] = useState<MatchRequest[]>([]);
  const [myAufgaben, setMyAufgaben] = useState<MatchRequest[]>([]);
  const [bewerbungen, setBewerbungen] = useState<MatchApplication[]>([]);
  const [bewerbungenLoading, setBewerbungenLoading] = useState(false);

  const [selectedAufgabe, setSelectedAufgabe] = useState<MatchRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'mine'>('board');
  const [filterCategory, setFilterCategory] = useState('Alle');
  const [filterCity, setFilterCity] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBewerbungOpen, setIsBewerbungOpen] = useState(false);

  // Subscribe to public open tasks
  useEffect(() => {
    const unsub = subscribeToAufgaben(setAufgaben);
    return unsub;
  }, []);

  // Subscribe to owner's own tasks
  useEffect(() => {
    if (!user || user.role !== 'seeker') return;
    const unsub = subscribeToOwnerAufgaben(user.id, setMyAufgaben);
    return unsub;
  }, [user?.id, user?.role]);

  // Fetch Bewerbungen when owner opens a task
  useEffect(() => {
    if (!selectedAufgabe || user?.id !== selectedAufgabe.ownerId) {
      setBewerbungen([]);
      return;
    }
    setBewerbungenLoading(true);
    getBewerbungenForAufgabe(selectedAufgabe.id)
      .then(data => { setBewerbungen(data); setBewerbungenLoading(false); });
  }, [selectedAufgabe?.id, user?.id]);

  const isOwner = user?.role === 'seeker';

  const filteredAufgaben = useMemo(() =>
    aufgaben.filter(a => {
      const matchCat = filterCategory === 'Alle' || a.category === filterCategory;
      const matchCity = !filterCity || a.city.toLowerCase().includes(filterCity.toLowerCase());
      return matchCat && matchCity;
    }),
    [aufgaben, filterCategory, filterCity]
  );

  const displayList = activeTab === 'mine' ? myAufgaben : filteredAufgaben;

  const handleAccept = async (bewerbungId: string, managerId: string) => {
    if (!selectedAufgabe) return;
    await acceptBewerbung(selectedAufgabe.id, bewerbungId, managerId);
    setBewerbungen(prev =>
      prev.map(b => ({
        ...b,
        status: b.id === bewerbungId ? 'angenommen' : 'abgelehnt',
      }))
    );
    setSelectedAufgabe(prev => prev ? { ...prev, status: 'vergeben' } : null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
              Aufgaben Board
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Offene Aufträge · Bewerben & Vergeben
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Aufgabe erstellen
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col md:flex-row p-3 md:p-6 gap-3 md:gap-6 max-w-7xl mx-auto w-full">
        {/* Left Panel */}
        <div className={`${selectedAufgabe ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-white rounded-[2rem] md:rounded-[2.5rem] flex-col shadow-xl border border-slate-200 overflow-hidden flex-shrink-0`}>
          {/* Tabs */}
          <div className="flex border-b border-slate-100 p-3 gap-2">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === 'board' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Board
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('mine')}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                  activeTab === 'mine' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Meine
              </button>
            )}
          </div>

          {/* Filters (board tab only) */}
          {activeTab === 'board' && (
            <div className="p-3 border-b border-slate-50 space-y-2">
              <input
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                placeholder="Stadt filtern..."
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="Alle">Alle Kategorien</option>
                {AUFGABEN_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3">
            {displayList.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {activeTab === 'mine' ? 'Noch keine Aufgaben' : 'Keine Aufgaben gefunden'}
                </p>
              </div>
            ) : (
              displayList.map(a => (
                <AufgabeCard
                  key={a.id}
                  aufgabe={a}
                  isSelected={selectedAufgabe?.id === a.id}
                  onClick={() => setSelectedAufgabe(a)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={`${!selectedAufgabe ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex-col`}>
          {selectedAufgabe ? (
            <AufgabeDetail
              aufgabe={selectedAufgabe}
              bewerbungen={bewerbungen}
              bewerbungenLoading={bewerbungenLoading}
              onBewerben={() => setIsBewerbungOpen(true)}
              onAccept={handleAccept}
              onBack={() => setSelectedAufgabe(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Aufgabe auswählen</p>
              <p className="text-sm text-slate-400 font-medium mt-1">Klicken Sie links auf eine Aufgabe für Details</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isCreateOpen && (
        <CreateAufgabeModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => setActiveTab('mine')}
        />
      )}
      {isBewerbungOpen && selectedAufgabe && (
        <BewerbungModal
          aufgabe={selectedAufgabe}
          onClose={() => setIsBewerbungOpen(false)}
          onSubmitted={() => {
            setBewerbungen(prev => [...prev]);
          }}
        />
      )}
    </div>
  );
};

export default AufgabenBoard;
