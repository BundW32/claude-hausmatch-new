import React, { useState, useEffect, useContext, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { AuthContext } from '../App';
import { db, COLLECTIONS, addDocument } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ForumThread, ForumReply } from '../types';
import { DEMO_THREADS } from '../services/demoData';

const CATEGORIES = ['Recht & Urteile', 'Software & Tech', 'Best Practice', 'Handwerker & Services', 'Feedback', 'Off-Topic'];

// Datum + Uhrzeit – bei vielen Antworten hilft die Uhrzeit, die Reihenfolge zu erkennen.
const formatDateTime = (ts?: { seconds: number; toDate?: () => Date }): string => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const Forum = () => {
  const { user } = useContext(AuthContext);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [newReplyText, setNewReplyText] = useState('');
  const [replySort, setReplySort] = useState<'neueste' | 'beliebt'>('neueste');

  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [search, setSearch] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', category: CATEGORIES[0], content: '' });

  // Threads laden
  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.THREADS), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                date: d.createdAt ? new Date(d.createdAt.toDate()).toLocaleDateString('de-DE') : 'Neu'
            } as ForumThread;
        });
        setThreads(data);
    }, (error) => {
        console.warn("Firestore Forum Threads error:", error.message);
        // Leeres Forum anzeigen wenn Firebase nicht erreichbar
        setThreads([]);
    });
    return () => unsubscribe();
  }, []);

  // Antworten für gewählten Thread laden
  useEffect(() => {
    if (!selectedThread) {
      setReplies([]);
      return;
    }

    setRepliesLoading(true);
    // WICHTIG: Kein orderBy hier, um Composite Index Fehler zu vermeiden
    const q = query(
      collection(db, COLLECTIONS.REPLIES),
      where("threadId", "==", selectedThread.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ForumReply));

      // Sortierung clientseitig nach Zeitstempel
      const sortedReplies = data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      setReplies(sortedReplies);
      setRepliesLoading(false);
    }, (error) => {
      console.error("Firestore Error in Replies:", error);
      setRepliesLoading(false);
    });

    // View Counter erhöhen
    updateDoc(doc(db, COLLECTIONS.THREADS, selectedThread.id), {
      views: increment(1)
    });

    return () => unsubscribe();
  }, [selectedThread]);

  // Vollbild-Ansicht: Hintergrund-Scroll sperren, solange ein Thread geöffnet ist.
  useEffect(() => {
    if (!selectedThread) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [selectedThread]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
        await addDocument(COLLECTIONS.THREADS, {
            title: newTopic.title,
            author: user.name,
            authorId: user.id,
            category: newTopic.category,
            content: newTopic.content,
            replies: 0,
            views: 0
        });
        setIsCreateModalOpen(false);
        setNewTopic({ title: '', category: CATEGORIES[0], content: '' });
    } catch (err) { console.error(err); }
  };

  const handlePostReply = async () => {
    if (!user || !selectedThread || !newReplyText.trim()) return;
    try {
      await addDocument(COLLECTIONS.REPLIES, {
        threadId: selectedThread.id,
        author: user.name,
        authorId: user.id,
        content: newReplyText,
        likes: 0,
        likedBy: []
      });
      await updateDoc(doc(db, COLLECTIONS.THREADS, selectedThread.id), {
        replies: increment(1),
        lastActivity: new Date()
      });
      setNewReplyText('');
    } catch (err) { console.error(err); }
  };

  // Antwort liken / Like zurücknehmen. Aktualisiert nur die Like-Felder des
  // Reply-Dokuments; der onSnapshot-Listener übernimmt die neue Zahl in Echtzeit.
  const handleToggleLike = async (reply: ForumReply) => {
    if (!user || reply.authorId === user.id) return; // kein Self-Like
    const hasLiked = (reply.likedBy || []).includes(user.id);
    try {
      await updateDoc(doc(db, COLLECTIONS.REPLIES, reply.id), {
        likes: increment(hasLiked ? -1 : 1),
        likedBy: hasLiked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
    } catch (err) { console.error('Like fehlgeschlagen:', err); }
  };

  // Anzeige-Sortierung der Antworten: Standard "Neueste", umschaltbar auf "Meistgeliked".
  const sortedReplies = useMemo(() => {
    const list = [...replies];
    if (replySort === 'beliebt') {
      return list.sort((a, b) => {
        const diff = (b.likes || 0) - (a.likes || 0);
        return diff !== 0 ? diff : (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
    }
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [replies, replySort]);

  // Solange keine echten Themen da sind, Platzhalter-Themen zeigen (belebtes Forum).
  const filteredThreads = useMemo(() => {
    const src = threads.length ? threads : DEMO_THREADS;
    const searchLower = search.toLowerCase();
    return src.filter(t => {
      const matchesCategory = selectedCategory === 'Alle' || t.category === selectedCategory;
      const matchesSearch = t.title.toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    });
  }, [threads, selectedCategory, search]);

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Thread Detail Modal */}
        {selectedThread && (
          <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col animate-fade-in">
             {/* Sticky Kopfzeile – bleibt beim Scrollen sichtbar */}
             <header className="flex-shrink-0 bg-white border-b border-slate-100">
                <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center gap-3">
                   <button
                     onClick={() => setSelectedThread(null)}
                     className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
                     title="Zurück zur Übersicht"
                   >
                      <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                   </button>
                   <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full">{selectedThread.category}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                           {repliesLoading ? '…' : `${replies.length} Antwort${replies.length === 1 ? '' : 'en'}`}
                         </span>
                      </div>
                      <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">{selectedThread.title}</h2>
                   </div>
                   <button
                     onClick={() => setSelectedThread(null)}
                     className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
                     title="Schließen"
                   >
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
             </header>

             {/* Scrollbarer Diskussionsbereich – Lesespalte zentriert für lesbare Zeilenlänge */}
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
                   {/* Ursprungsbeitrag */}
                   <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                            {selectedThread.author[0]}
                         </div>
                         <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{selectedThread.author}</p>
                            <p className="text-[11px] font-bold text-slate-400">{formatDateTime(selectedThread.createdAt) || selectedThread.date}</p>
                         </div>
                         <span className="ml-auto text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full flex-shrink-0">Thema</span>
                      </div>
                      <div className="text-[15px] sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedThread.content) }}></div>
                   </article>

                   {/* Trenner + Sortier-Umschalter */}
                   <div className="flex items-center gap-3 pt-1">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">
                        {repliesLoading ? 'Lade Antworten…' : replies.length === 0 ? 'Noch keine Antworten' : `${replies.length} Antwort${replies.length === 1 ? '' : 'en'}`}
                      </span>
                      <div className="flex-grow border-t border-slate-200"></div>
                      {!repliesLoading && replies.length > 1 && (
                        <div className="inline-flex bg-slate-100 rounded-xl p-0.5 flex-shrink-0">
                          {([['neueste', 'Neueste'], ['beliebt', 'Meistgeliked']] as const).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setReplySort(key)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                replySort === key ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                   </div>

                   {/* Antworten – kompakt & gleichmäßig für gute Lesbarkeit bei vielen Nachrichten */}
                   {repliesLoading ? (
                     <div className="flex flex-col items-center py-12 gap-3">
                        <div className="w-9 h-9 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Diskussion wird geladen</span>
                     </div>
                   ) : replies.length === 0 ? (
                     <div className="text-center py-12">
                        <p className="text-sm font-bold text-slate-400">Sei der Erste, der antwortet 👇</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {sortedReplies.map(reply => {
                          const isMe = reply.authorId === user?.id;
                          const hasLiked = !!user && (reply.likedBy || []).includes(user.id);
                          const likeCount = reply.likes || 0;
                          return (
                            <div key={reply.id} className="flex gap-3">
                               <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${isMe ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                 {reply.author[0]}
                               </div>
                               <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
                                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                                     <span className="text-sm font-black text-slate-800 truncate">
                                       {reply.author}{isMe && <span className="text-indigo-500"> · Du</span>}
                                     </span>
                                     <span className="text-[10px] font-bold text-slate-300 whitespace-nowrap flex-shrink-0">
                                       {formatDateTime(reply.createdAt) || 'Gerade'}
                                     </span>
                                  </div>
                                  <div className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.content) }}></div>
                                  <div className="flex items-center mt-3 pt-2 border-t border-slate-50">
                                     <button
                                       onClick={() => handleToggleLike(reply)}
                                       disabled={isMe}
                                       title={isMe ? 'Eigene Antwort' : hasLiked ? 'Like zurücknehmen' : 'Gefällt mir'}
                                       className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all ${hasLiked ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'} ${isMe ? 'cursor-default opacity-60' : 'active:scale-95'}`}
                                     >
                                       <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                       </svg>
                                       <span>{likeCount > 0 ? likeCount : 'Like'}</span>
                                     </button>
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                     </div>
                   )}
                </div>
             </div>

             {/* Sticky Eingabefeld unten */}
             <div className="flex-shrink-0 bg-white border-t border-slate-100">
                <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3 flex items-end gap-3">
                   <textarea
                     value={newReplyText}
                     onChange={(e) => setNewReplyText(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePostReply(); }
                     }}
                     placeholder="Antwort verfassen… (Strg/⌘ + Enter zum Senden)"
                     rows={1}
                     className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-medium text-[15px] max-h-40 min-h-[48px]"
                   />
                   <button
                     onClick={handlePostReply}
                     disabled={!newReplyText.trim() || repliesLoading}
                     className="bg-indigo-600 text-white px-5 sm:px-7 h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-30 transition-all active:scale-95 flex-shrink-0"
                   >
                     Senden
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Forum Feed UI */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tighter">Community Hub</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Exklusiver Austausch für Immobilienprofis</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 text-white px-5 sm:px-10 py-3 sm:py-5 rounded-2xl sm:rounded-3xl font-black shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 uppercase text-xs tracking-[0.2em]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Neuer Thread
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Kategorien</h3>
              <div className="space-y-3">
                <button onClick={() => setSelectedCategory('Alle')} className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-black transition-all ${selectedCategory === 'Alle' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>Alle Themen</button>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-black transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>{cat}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="flex-1 flex items-center px-6 gap-4">
                    <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Beiträge durchsuchen..." className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold placeholder-slate-300" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="grid gap-6">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-20 opacity-30 font-black uppercase tracking-[0.2em] text-slate-400">
                  {search || selectedCategory !== 'Alle' ? 'Keine passenden Beiträge gefunden.' : 'Noch keine Beiträge vorhanden. Starten Sie die erste Diskussion!'}
                </div>
              ) : filteredThreads.map(thread => (
                <div key={thread.id} onClick={() => setSelectedThread(thread)} className="group bg-white p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-slate-50 group-hover:bg-indigo-600 transition-colors"></div>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-8">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{thread.category}</span>
                        <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{thread.date}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-4 tracking-tighter">{thread.title}</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[11px] font-black text-slate-400 uppercase border border-slate-100">{thread.author[0]}</div>
                        <span className="text-xs font-black text-slate-400">Gepostet von {thread.author}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 sm:gap-6 text-center flex-shrink-0">
                      <div className="px-4 sm:px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                        <p className="text-xl font-black text-slate-900 group-hover:text-indigo-600">{thread.replies}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Replies</p>
                      </div>
                      <div className="px-4 sm:px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xl font-black text-slate-900">{thread.views}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Views</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
           <div className="bg-white w-full max-w-3xl rounded-xl sm:rounded-[2.5rem] md:rounded-[4rem] p-5 sm:p-8 md:p-12 shadow-2xl animate-fade-in-up border border-white/20">
              <div className="flex justify-between items-center mb-8 md:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Neuer Beitrag</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleCreateThread} className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-4">Kategorie wählen</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewTopic({...newTopic, category: cat})}
                        className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${newTopic.category === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-4">Thema & Inhalt</label>
                  <input
                    required
                    placeholder="Was ist Ihr Thema?"
                    className="w-full p-6 bg-slate-50 border-0 rounded-[2rem] font-bold text-xl ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder-slate-300"
                    value={newTopic.title}
                    onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                  />
                  <textarea
                    required
                    placeholder="Beschreiben Sie Ihr Anliegen im Detail..."
                    className="w-full h-56 p-8 bg-slate-50 border-0 rounded-[2.5rem] font-medium text-lg ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none placeholder-slate-300"
                    value={newTopic.content}
                    onChange={e => setNewTopic({...newTopic, content: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Abbrechen</button>
                   <button type="submit" className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Beitrag Veröffentlichen</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
