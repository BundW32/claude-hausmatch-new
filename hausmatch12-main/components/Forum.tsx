
import React, { useState, useEffect, useContext, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { AuthContext } from '../App';
import { db, COLLECTIONS, addDocument } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, increment } from 'firebase/firestore';
import { ForumThread, ForumReply } from '../types';

const CATEGORIES = ['Recht & Urteile', 'Software & Tech', 'Best Practice', 'Handwerker & Services', 'Feedback', 'Off-Topic'];

const Forum = () => {
  const { user } = useContext(AuthContext);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [newReplyText, setNewReplyText] = useState('');
  
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
        console.warn("Firestore Forum Threads error (using fallback):", error.message);
        // Fallback Mock Threads
        setThreads([
          {
            id: 'mock-t1',
            title: 'Wie geht ihr mit der neuen WEG-Reform um?',
            content: 'Ich habe Fragen zur Beschlussfassung bei energetischen Sanierungen...',
            author: 'Max Verwalter',
            authorId: 'm1',
            category: 'Recht & Urteile',
            replies: 2,
            views: 45,
            createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
            date: new Date().toLocaleDateString('de-DE')
          }
        ]);
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
        content: newReplyText
      });
      await updateDoc(doc(db, COLLECTIONS.THREADS, selectedThread.id), {
        replies: increment(1),
        lastActivity: new Date()
      });
      setNewReplyText('');
    } catch (err) { console.error(err); }
  };

  const filteredThreads = useMemo(() => {
    const searchLower = search.toLowerCase();
    return threads.filter(t => {
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-fade-in">
             <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl">
                        {selectedThread.author[0]}
                     </div>
                     <div>
                       <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1 rounded-full">
                            {selectedThread.category}
                          </span>
                       </div>
                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedThread.title}</h2>
                     </div>
                   </div>
                   <button onClick={() => setSelectedThread(null)} className="w-14 h-14 flex items-center justify-center hover:bg-slate-200 rounded-full transition-all">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                   <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100/50 shadow-inner">
                      <div className="flex justify-between items-center mb-6">
                         <span className="text-sm font-black text-slate-900">{selectedThread.author}</span>
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{selectedThread.date}</span>
                      </div>
                      <p className="text-xl text-slate-700 leading-relaxed font-medium whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedThread.content) }}></p>
                   </div>

                   <div className="relative py-4 flex items-center">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-6 text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">
                        {repliesLoading ? 'Lade Antworten...' : `${replies.length} Antworten`}
                      </span>
                      <div className="flex-grow border-t border-slate-100"></div>
                   </div>

                   <div className="space-y-8">
                      {repliesLoading ? (
                        <div className="flex flex-col items-center py-10 gap-4">
                           <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                           <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Diskussion wird geladen</span>
                        </div>
                      ) : replies.length === 0 ? (
                        <div className="text-center py-10 opacity-30 italic font-medium text-slate-400">Keine Antworten vorhanden.</div>
                      ) : (
                        replies.map(reply => (
                          <div key={reply.id} className="flex gap-6 animate-fade-in group">
                             <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black shrink-0 border border-slate-200">
                               {reply.author[0]}
                             </div>
                             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex-1 group-hover:shadow-md transition-all">
                                <div className="flex justify-between mb-4">
                                   <span className="text-sm font-black text-slate-800">{reply.author}</span>
                                   <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                     {reply.createdAt ? new Date(reply.createdAt.seconds * 1000).toLocaleDateString('de-DE') : 'Gerade jetzt'}
                                   </span>
                                </div>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.content) }}></p>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>

                <div className="p-10 border-t border-slate-50 bg-white">
                   <div className="max-w-4xl mx-auto flex items-end gap-6">
                      <textarea 
                        value={newReplyText}
                        onChange={(e) => setNewReplyText(e.target.value)}
                        placeholder="Antwort verfassen..."
                        className="flex-1 bg-slate-50 border-0 rounded-[2rem] px-8 py-6 text-slate-900 ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 transition-all resize-none font-medium h-20 min-h-[80px] focus:h-40"
                      />
                      <button 
                        onClick={handlePostReply}
                        disabled={!newReplyText.trim() || repliesLoading}
                        className="bg-slate-900 text-white px-10 h-20 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-600 disabled:opacity-20 transition-all active:scale-95"
                      >
                        Senden
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Forum Feed UI */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Community Hub</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Exklusiver Austausch für Immobilienprofis</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 uppercase text-xs tracking-[0.2em]"
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
              {filteredThreads.map(thread => (
                <div key={thread.id} onClick={() => setSelectedThread(thread)} className="group bg-white p-10 rounded-[3rem] border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-slate-50 group-hover:bg-indigo-600 transition-colors"></div>
                  <div className="flex justify-between items-start gap-8">
                    <div className="flex-1">
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
                    <div className="flex gap-6 text-center">
                      <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                        <p className="text-xl font-black text-slate-900 group-hover:text-indigo-600">{thread.replies}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Replies</p>
                      </div>
                      <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
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
           <div className="bg-white w-full max-w-3xl rounded-[4rem] p-12 md:p-16 shadow-2xl animate-fade-in-up border border-white/20">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black tracking-tighter text-slate-900">Neuer Beitrag</h2>
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
