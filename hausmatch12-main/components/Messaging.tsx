import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { auth } from '../services/firebase';
import { sendMessage, uploadFile } from '../services/dataService';
import { Message, MessageAttachment } from '../types';

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: Message;
  messages: Message[];
  unreadCount: number;
}

const ACCEPT_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const formatTime = (ts: any): string => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Gestern';
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

const formatDateDivider = (ts: any): string => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Heute';
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Gestern';
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
};

const AttachmentPreview = ({ att, isMe }: { att: MessageAttachment; isMe: boolean }) => {
  if (att.type.startsWith('image/')) {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={att.url} alt={att.name} className="max-w-[220px] rounded-xl border border-white/20 hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 mt-2 rounded-xl px-3 py-2 max-w-[260px] transition-colors ${
        isMe ? 'bg-white/15 hover:bg-white/25' : 'bg-slate-100 hover:bg-slate-200'
      }`}
    >
      <svg className="w-7 h-7 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-bold truncate">{att.name}</p>
        <p className="text-[10px] opacity-60 font-medium">{formatFileSize(att.size)}</p>
      </div>
    </a>
  );
};

const Messaging = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildConversations = useCallback((sent: Message[], received: Message[]): Conversation[] => {
    if (!user) return [];
    const byId = new Map<string, Message>();
    [...sent, ...received].forEach(m => { if (m.id) byId.set(m.id, m); });
    const all = Array.from(byId.values());

    const groups: Record<string, Message[]> = {};
    all.forEach(msg => {
      const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      if (!partnerId) return;
      if (!groups[partnerId]) groups[partnerId] = [];
      groups[partnerId].push(msg);
    });

    return Object.entries(groups)
      .map(([partnerId, msgs]) => {
        const sorted = [...msgs].sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        const last = sorted[sorted.length - 1];
        const partnerName = last.senderId === user.id
          ? (last.receiverName || 'Unbekannt')
          : (last.senderName || 'Unbekannt');
        const unread = msgs.filter(m => !m.read && m.receiverId === user.id).length;
        return { partnerId, partnerName, lastMessage: last, messages: sorted, unreadCount: unread };
      })
      .sort((a, b) => (b.lastMessage.timestamp?.seconds || 0) - (a.lastMessage.timestamp?.seconds || 0));
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user?.id || !auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 503) {
        setError(
          'Nachrichtendienst nicht konfiguriert. Bitte Firebase Admin SDK Umgebungsvariablen in Vercel hinzufügen oder Firestore-Regeln in der Firebase-Konsole aktualisieren.'
        );
        setLoading(false);
        return;
      }
      if (res.status === 401) {
        setError('Sitzung abgelaufen. Bitte neu anmelden.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConversations(buildConversations(data.sent || [], data.received || []));
      setError(null);
    } catch (err: any) {
      console.error('[Postfach] API-Fehler:', err);
      setError('Nachrichten konnten nicht geladen werden: ' + (err.message || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, buildConversations]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [user?.id, fetchMessages]);

  // IMPORTANT: activeConvo must be declared before the scroll useEffect
  const activeConvo = conversations.find(c => c.partnerId === selectedPartnerId) || null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedPartnerId, activeConvo?.messages.length]);

  const filteredConvos = searchQuery.trim()
    ? conversations.filter(c => c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const handleSelectConvo = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setShowMobileList(false);
    const convo = conversations.find(c => c.partnerId === partnerId);
    if (convo && user && auth.currentUser) {
      const unread = convo.messages.filter(m => !m.read && m.receiverId === user.id);
      if (unread.length > 0) {
        auth.currentUser.getIdToken().then(token => {
          unread.forEach(m => {
            fetch('/api/messages', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'markRead', messageId: m.id }),
            }).catch(() => {});
          });
        }).catch(() => {});
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
    e.target.value = '';
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !activeConvo || (!replyText.trim() && !attachedFile)) return;

    const textToSend = replyText.trim();
    setReplyText('');
    setUploading(true);

    let attachments: MessageAttachment[] = [];
    if (attachedFile) {
      try {
        const url = await uploadFile(attachedFile, `messages/${user.id}/${Date.now()}_${attachedFile.name}`);
        attachments = [{ name: attachedFile.name, url, type: attachedFile.type, size: attachedFile.size }];
      } catch (uploadErr) {
        console.error('[Postfach] Upload fehlgeschlagen:', uploadErr);
      }
      setAttachedFile(null);
    }

    try {
      await sendMessage({
        senderId: user.id,
        senderName: user.name,
        receiverId: activeConvo.partnerId,
        receiverName: activeConvo.partnerName,
        subject: 'Chat',
        content: textToSend,
        ...(attachments.length > 0 ? { attachments } : {})
      });
      setTimeout(() => fetchMessages(), 1500);
    } catch (sendErr) {
      console.error('[Postfach] Senden fehlgeschlagen:', sendErr);
    } finally {
      setUploading(false);
    }
  };

  // --- LOADING ---
  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nachrichten laden...</p>
      </div>
    );
  }

  // --- ERROR ---
  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50 gap-5 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-black text-slate-900 mb-1">Postfach nicht verfügbar</p>
          <p className="text-slate-500 font-medium text-sm max-w-sm">{error}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setError(null); setLoading(true); fetchMessages(); }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all"
          >
            Erneut versuchen
          </button>
          <button
            onClick={() => navigate('/network')}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
          >
            Zum Netzwerk
          </button>
        </div>
      </div>
    );
  }

  // --- SIDEBAR ---
  const Sidebar = (
    <div className={`flex flex-col h-full bg-white border-r border-slate-100 ${
      showMobileList ? 'flex' : 'hidden md:flex'
    } md:w-[320px] lg:w-[380px] shrink-0`}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-50">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-4">Postfach</h2>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConvos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-black text-slate-900 mb-1">
              {conversations.length === 0 ? 'Noch keine Nachrichten' : 'Keine Ergebnisse'}
            </p>
            <p className="text-xs text-slate-400 font-medium mb-5">
              {conversations.length === 0
                ? 'Schreiben Sie Profis im Netzwerk an.'
                : 'Suchbegriff anpassen.'}
            </p>
            {conversations.length === 0 && (
              <button
                onClick={() => navigate('/network')}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all"
              >
                Netzwerk erkunden
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {filteredConvos.map(convo => {
              const isActive = selectedPartnerId === convo.partnerId;
              return (
                <li key={convo.partnerId}>
                  <button
                    onClick={() => handleSelectConvo(convo.partnerId)}
                    className={`w-full text-left px-5 py-4 transition-all ${
                      isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shrink-0 ${
                        isActive ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                      }`}>
                        {convo.partnerName[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span className={`text-sm font-black truncate ${isActive ? 'text-indigo-700' : 'text-slate-900'}`}>
                            {convo.partnerName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {formatTime(convo.lastMessage.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {convo.lastMessage.attachments?.length ? (
                            <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          ) : null}
                          <p className={`text-xs truncate flex-1 ${
                            convo.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'
                          }`}>
                            {convo.lastMessage.content || 'Datei-Anhang'}
                          </p>
                          {convo.unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  // --- CHAT VIEW ---
  const ChatView = (
    <div className={`flex-1 flex flex-col bg-slate-50 min-w-0 ${
      showMobileList ? 'hidden md:flex' : 'flex'
    }`}>
      {activeConvo ? (
        <>
          {/* Chat header */}
          <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center gap-4">
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden -ml-1 p-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
              {activeConvo.partnerName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-slate-900 text-base leading-tight truncate">{activeConvo.partnerName}</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HausMatch Mitglied</span>
            </div>
            <button
              onClick={() => navigate('/network')}
              className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors hidden sm:block"
            >
              Profil
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3" ref={scrollRef}>
            {activeConvo.messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id;
              const prevMsg = activeConvo.messages[idx - 1];
              const showDate = idx === 0 ||
                new Date((msg.timestamp?.seconds || 0) * 1000).toDateString() !==
                new Date((prevMsg?.timestamp?.seconds || 0) * 1000).toDateString();

              return (
                <React.Fragment key={msg.id || idx}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                        {formatDateDivider(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0 mr-2 mt-auto mb-0.5">
                        {activeConvo.partnerName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[75%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
                      }`}>
                        {msg.content && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                        )}
                        {msg.attachments?.map((att, i) => (
                          <AttachmentPreview key={i} att={att} isMe={isMe} />
                        ))}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className="text-[10px] font-bold text-slate-400">{formatTime(msg.timestamp)}</span>
                        {isMe && (
                          <svg
                            className={`w-3 h-3 ${msg.read ? 'text-indigo-500' : 'text-slate-300'}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Input area */}
          <div className="px-4 pb-4 pt-2 bg-white border-t border-slate-100">
            {attachedFile && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 mb-2">
                <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-xs font-black text-indigo-700 truncate flex-1">{attachedFile.name}</span>
                <span className="text-[10px] text-indigo-400 font-medium shrink-0">{formatFileSize(attachedFile.size)}</span>
                <button onClick={() => setAttachedFile(null)} className="text-indigo-300 hover:text-red-500 transition-colors ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <form
              onSubmit={handleSend}
              className="flex items-end gap-2 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 focus-within:border-indigo-400 focus-within:bg-white transition-all"
            >
              <input type="file" accept={ACCEPT_TYPES} ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Datei anhängen"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white transition-all shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <textarea
                rows={1}
                value={replyText}
                onChange={e => {
                  setReplyText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Nachricht... (Enter senden, Shift+Enter neue Zeile)"
                className="flex-1 bg-transparent border-0 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-0 outline-none resize-none overflow-hidden"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={(!replyText.trim() && !attachedFile) || uploading}
                className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
              >
                {uploading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">Konversation wählen</h3>
          <p className="text-slate-400 font-medium text-sm max-w-xs">
            {conversations.length > 0
              ? 'Klicken Sie auf eine Konversation in der Liste.'
              : 'Sie haben noch keine Nachrichten. Kontaktieren Sie Profis im Netzwerk.'}
          </p>
          {conversations.length === 0 && (
            <button
              onClick={() => navigate('/network')}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
            >
              Zum Netzwerk
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-100 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {Sidebar}
        {ChatView}
      </div>
    </div>
  );
};

export default Messaging;
