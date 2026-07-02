import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../App';
import {
  subscribeToSchwarztesBrett,
  createSchwarztesBrettPost,
  deleteSchwarztesBrettPost,
  sendMessage,
} from '../services/dataService';
import {
  SchwarztesBrettPost,
  SCHWARZES_BRETT_CATEGORIES,
  SchwarztesBrettCategory,
  USER_TYPE_LABELS,
} from '../types';
import { DEMO_POSTS } from '../services/demoData';

// Vereinheitlichter Marktplatz: EINE Liste, EIN Beitragstyp. Aufträge, Gesuche,
// Angebote & Empfehlungen liegen zusammen — die Kategorie ("Auftrag", "Gesuch", …)
// unterscheidet sie. Kein zweites Board, kein Umschalter, kein Bewerbungs-Workflow:
// Kontakt läuft direkt über "Nachricht schicken".

// ─── Utilities ───────────────────────────────────────────────────────────────

const formatDate = (ts: SchwarztesBrettPost['createdAt']): string => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const categoryColor = (cat: SchwarztesBrettCategory) => {
  switch (cat) {
    case 'Auftrag':      return 'bg-indigo-100 text-indigo-700';
    case 'Gesuch':       return 'bg-amber-100 text-amber-700';
    case 'Angebot':      return 'bg-green-100 text-green-700';
    case 'Handwerker':   return 'bg-orange-100 text-orange-700';
    case 'Empfehlung':   return 'bg-violet-100 text-violet-700';
    case 'Ankündigung':  return 'bg-blue-100 text-blue-700';
    default:             return 'bg-slate-100 text-slate-600';
  }
};

// ─── PostCard ────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: SchwarztesBrettPost;
  currentUserId?: string;
  onOpen: () => void;
  onDelete: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onOpen, onDelete }) => (
  <div
    onClick={onOpen}
    className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer p-5 sm:p-6 flex flex-col gap-3"
  >
    <div className="flex items-start justify-between gap-2">
      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex-shrink-0 ${categoryColor(post.category)}`}>
        {post.category}
      </span>
      {currentUserId === post.authorId && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
          title="Löschen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>

    <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
      {post.title}
    </h3>

    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
      {post.content}
    </p>

    {post.budget && (
      <div className="inline-flex items-center gap-1 text-xs font-black text-green-700 bg-green-50 px-3 py-1 rounded-full w-fit">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {post.budget}
      </div>
    )}

    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px] flex-shrink-0">
          {post.authorName.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-slate-500 font-medium truncate">{post.authorName}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {post.city && <span className="text-xs text-slate-400 font-medium">{post.city}</span>}
        <span className="text-xs text-slate-300">·</span>
        <span className="text-xs text-slate-400 font-medium">{formatDate(post.createdAt)}</span>
      </div>
    </div>
  </div>
);

// ─── PostDetailModal ─────────────────────────────────────────────────────────

interface PostDetailModalProps {
  post: SchwarztesBrettPost;
  currentUserId?: string;
  onClose: () => void;
  onDelete: () => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, currentUserId, onClose, onDelete }) => {
  const { user } = useContext(AuthContext);
  const [showComposer, setShowComposer] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const isDemoPost = post.authorId === 'muster';

  // Schickt eine echte Nachricht an den Beitrags-Autor – landet im Postfach beider.
  const handleSendMessage = async () => {
    if (!user || !msgText.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({
        senderId: user.id,
        senderName: user.name,
        receiverId: post.authorId,
        receiverName: post.authorName,
        subject: post.title,
        content: `Zu Ihrem Beitrag "${post.title}":\n\n${msgText.trim()}`,
      });
      setSent(true);
    } catch (err) {
      console.error('[Marktplatz] Nachricht senden fehlgeschlagen:', err);
    } finally {
      setSending(false);
    }
  };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
    <div
      className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-5 sm:p-8 md:p-10">
        <div className="flex items-start justify-between gap-3 mb-5">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${categoryColor(post.category)}`}>
            {post.category}
          </span>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-4">{post.title}</h2>

        <div className="flex flex-wrap items-center gap-3 mb-6 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[9px]">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
            <span>{post.authorName}</span>
            {post.authorType && (
              <span className="text-slate-400">· {USER_TYPE_LABELS[post.authorType]}</span>
            )}
          </div>
          {post.city && <span>📍 {post.city}</span>}
          <span>{formatDate(post.createdAt)}</span>
        </div>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap mb-6">
          {post.content}
        </p>

        {post.budget && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-0.5">Budget / Vergütung</p>
            <p className="text-sm font-black text-green-700">{post.budget}</p>
          </div>
        )}

        {post.contactInfo && currentUserId ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">Kontakt</p>
            <p className="text-sm font-black text-indigo-700">{post.contactInfo}</p>
          </div>
        ) : post.contactInfo && !currentUserId ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">
            <p className="text-xs text-slate-500 font-medium">
              <a href="#/login" className="text-indigo-600 font-black hover:underline">Anmelden</a> um Kontaktdaten zu sehen.
            </p>
          </div>
        ) : null}

        {/* Nachricht an den Autor – erstellt eine echte Nachricht im Postfach */}
        {currentUserId && currentUserId !== post.authorId && !isDemoPost && (
          sent ? (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-green-700">Nachricht gesendet ✓</p>
              <a href="#/messages" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline flex-shrink-0">
                Zum Postfach →
              </a>
            </div>
          ) : showComposer ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 space-y-3">
              <textarea
                autoFocus
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                rows={3}
                placeholder={`Ihre Nachricht an ${post.authorName}...`}
                className="w-full bg-white ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowComposer(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!msgText.trim() || sending}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
                >
                  {sending ? 'Sendet…' : 'Senden'}
                </button>
              </div>
            </div>
          ) : null
        )}

        {isDemoPost && currentUserId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-xs font-medium text-amber-800">Dies ist ein Muster-Beitrag zur Veranschaulichung — Nachrichten sind hier nicht möglich.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {currentUserId && currentUserId !== post.authorId && !isDemoPost && !showComposer && !sent && (
            <button
              onClick={() => setShowComposer(true)}
              className="flex-1 text-center py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Nachricht schicken
            </button>
          )}
          {currentUserId === post.authorId && (
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="flex-1 py-3.5 border border-red-100 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-colors"
            >
              Beitrag löschen
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

// ─── CreatePostModal ──────────────────────────────────────────────────────────

interface CreatePostModalProps {
  onClose: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose }) => {
  const { user } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: SCHWARZES_BRETT_CATEGORIES[0] as SchwarztesBrettCategory,
    city: '',
    budget: '',
    contactInfo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await createSchwarztesBrettPost({
        ...form,
        authorId: user.id,
        authorName: user.name,
        authorType: user.userType,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-5 sm:p-8 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Beitrag erstellen</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Kategorie</label>
              <div className="flex flex-wrap gap-2">
                {SCHWARZES_BRETT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                      form.category === cat
                        ? `${categoryColor(cat)} ring-2 ring-offset-1 ring-current`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-2">
                Egal ob Sie einen <span className="font-black text-slate-500">Auftrag</span> ausschreiben, etwas <span className="font-black text-slate-500">suchen</span> oder <span className="font-black text-slate-500">anbieten</span> — alles landet hier im selben Marktplatz.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Titel *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Kurze, aussagekräftige Überschrift"
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Beschreibung *</label>
              <textarea
                required
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={5}
                placeholder="Beschreiben Sie Ihren Auftrag, Ihr Angebot oder Ihr Gesuch..."
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Stadt</label>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="München"
                  className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Budget / Vergütung</label>
                <input
                  value={form.budget}
                  onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                  placeholder="z.B. 500€ VHB"
                  className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Kontakt (nur für angemeldete Nutzer sichtbar)</label>
              <input
                value={form.contactInfo}
                onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))}
                placeholder="Telefon, E-Mail oder sonstige Kontaktinfos"
                className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
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
                {submitting ? 'Veröffentliche...' : 'Veröffentlichen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Marktplatz (main) ─────────────────────────────────────────────────────────

const Marktplatz: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState<SchwarztesBrettPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<SchwarztesBrettPost | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('Alle');
  const [filterCity, setFilterCity] = useState('');

  useEffect(() => {
    const unsub = subscribeToSchwarztesBrett(setPosts);
    return unsub;
  }, []);

  // Solange keine echten Beiträge da sind, Platzhalter-Beiträge zeigen (belebte Seite).
  const filtered = useMemo(() => {
    const src = posts.length ? posts : DEMO_POSTS;
    return src.filter(p => {
      const matchCat = filterCategory === 'Alle' || p.category === filterCategory;
      const matchCity = !filterCity || (p.city || '').toLowerCase().includes(filterCity.toLowerCase());
      return matchCat && matchCity;
    });
  }, [posts, filterCategory, filterCity]);

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Beitrag wirklich löschen?')) return;
    await deleteSchwarztesBrettPost(postId);
    setSelectedPost(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                Marktplatz
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Aufträge, Gesuche, Angebote & Empfehlungen — alles an einem Ort
              </p>
            </div>
            {user ? (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Beitrag erstellen
              </button>
            ) : (
              <a
                href="#/login"
                className="flex items-center gap-2 px-6 py-3 border border-indigo-200 text-indigo-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                Anmelden zum Posten
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1">
              <button
                onClick={() => setFilterCategory('Alle')}
                className={`flex-shrink-0 text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all ${
                  filterCategory === 'Alle' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Alle
              </button>
              {SCHWARZES_BRETT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`flex-shrink-0 text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all ${
                    filterCategory === cat
                      ? `${categoryColor(cat)} ring-2 ring-current ring-offset-1`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              placeholder="Stadt filtern..."
              className="sm:w-40 bg-slate-50 ring-1 ring-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 flex-shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs mb-2">
              Noch keine Beiträge
            </p>
            {user && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 px-6 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Ersten Beitrag erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onOpen={() => setSelectedPost(post)}
                onDelete={() => handleDelete(post.id)}
              />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 font-medium mt-8">
          {filtered.length} Beitrag{filtered.length !== 1 ? 'e' : ''}
          {filterCategory !== 'Alle' || filterCity ? ' gefunden' : ' insgesamt'}
        </p>
      </div>

      {/* Modals */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          currentUserId={user?.id}
          onClose={() => setSelectedPost(null)}
          onDelete={() => handleDelete(selectedPost.id)}
        />
      )}
      {isCreateOpen && (
        <CreatePostModal onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  );
};

export default Marktplatz;
