import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { AuthContext } from '../App';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { sendMessage, uploadFile, markMessageRead } from '../services/dataService';
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

const AttachmentPreview = ({ att }: { att: MessageAttachment }) => {
  const isImage = att.type.startsWith('image/');
  if (isImage) {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-3">
        <img src={att.url} alt={att.name} className="max-w-[240px] rounded-2xl border border-white/20 hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 mt-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-4 py-3 max-w-[280px]"
    >
      <svg className="w-8 h-8 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-black truncate">{att.name}</p>
        <p className="text-[10px] opacity-60 font-bold">{formatFileSize(att.size)}</p>
      </div>
    </a>
  );
};

const Messaging = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [allMessages, setAllMessages] = useState<{ sent: Message[]; received: Message[] }>({ sent: [], received: [] });
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build conversations from the two message arrays
  const buildConversations = useCallback((sent: Message[], received: Message[]): Conversation[] => {
    if (!user) return [];

    // Merge + deduplicate by message id
    const byId = new Map<string, Message>();
    [...sent, ...received].forEach(m => byId.set(m.id, m));
    const all = Array.from(byId.values());

    // Group by the partner (the other person)
    const groups: Record<string, Message[]> = {};
    all.forEach(msg => {
      const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      if (!groups[partnerId]) groups[partnerId] = [];
      groups[partnerId].push(msg);
    });

    return Object.entries(groups)
      .map(([partnerId, msgs]) => {
        const sorted = [...msgs].sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        const lastMsg = sorted[sorted.length - 1];
        const partnerName = lastMsg.senderId === user.id ? lastMsg.receiverName : lastMsg.senderName;
        const unread = msgs.filter(m => !m.read && m.receiverId === user.id).length;
        return { partnerId, partnerName, lastMessage: lastMsg, messages: sorted, unreadCount: unread };
      })
      .sort((a, b) => (b.lastMessage.timestamp?.seconds || 0) - (a.lastMessage.timestamp?.seconds || 0));
  }, [user]);

  // Two simple single-field queries — no composite index needed
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);

    let sentMsgs: Message[] = [];
    let receivedMsgs: Message[] = [];
    let sentReady = false;
    let receivedReady = false;

    const update = () => {
      if (!sentReady || !receivedReady) return;
      setAllMessages({ sent: sentMsgs, received: receivedMsgs });
      setLoading(false);
    };

    const qSent = query(collection(db, 'messages'), where('senderId', '==', user.id), limit(200));
    const qReceived = query(collection(db, 'messages'), where('receiverId', '==', user.id), limit(200));

    const unsubSent = onSnapshot(qSent, snap => {
      sentMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      sentReady = true;
      update();
    }, err => {
      console.error('Messaging sent query error:', err);
      setError('Nachrichten konnten nicht geladen werden. Bitte Seite neu laden.');
      setLoading(false);
    });

    const unsubReceived = onSnapshot(qReceived, snap => {
      receivedMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      receivedReady = true;
      update();
    }, err => {
      console.error('Messaging received query error:', err);
      setError('Nachrichten konnten nicht geladen werden. Bitte Seite neu laden.');
      setLoading(false);
    });

    return () => { unsubSent(); unsubReceived(); };
  }, [user]);

  const conversations = buildConversations(allMessages.sent, allMessages.received);

  const filteredConvos = searchQuery.trim()
    ? conversations.filter(c => c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  // Scroll to bottom when conversation changes or new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedPartnerId, conversations.find(c => c.partnerId === selectedPartnerId)?.messages.length]);

  const activeConvo = conversations.find(c => c.partnerId === selectedPartnerId);

  const handleSelectConvo = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    // Mark all unread received messages in this conversation as read
    const convo = conversations.find(c => c.partnerId === partnerId);
    if (convo && user) {
      convo.messages
        .filter(m => !m.read && m.receiverId === user.id)
        .forEach(m => markMessageRead(m.id).catch(() => {}));
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

    const textToSend = replyText;
    setReplyText('');
    setUploading(true);

    let attachments: MessageAttachment[] = [];
    if (attachedFile) {
      try {
        const url = await uploadFile(attachedFile, `messages/${user.id}/${Date.now()}_${attachedFile.name}`);
        attachments = [{ name: attachedFile.name, url, type: attachedFile.type, size: attachedFile.size }];
      } catch (e) {
        console.error('Upload failed:', e);
      }
      setAttachedFile(null);
    }

    await sendMessage({
      senderId: user.id,
      senderName: user.name,
      receiverId: activeConvo.partnerId,
      receiverName: activeConvo.partnerName,
      subject: 'Chat-Nachricht',
      content: textToSend,
      ...(attachments.length > 0 ? { attachments } : {})
    });

    setUploading(false);
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const formatDateDivider = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);
    return date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
  };

  // --- Loading & Error states ---
  if (loading) return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50 gap-4">
      <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <p className="text-slate-500 font-bold text-sm">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all">
        Neu laden
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-6rem)]">
      <div className="flex h-full bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">

        {/* Sidebar */}
        <div className="w-full md:w-[350px] lg:w-[400px] border-r border-slate-50 flex flex-col bg-slate-50/30 shrink-0">
          <div className="p-8 pb-4 bg-white/50 backdrop-blur-md">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-5">Postfach</h2>
            <input
              type="text"
              placeholder="Gespräche suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-black font-bold focus:ring-2 focus:ring-indigo-600 transition-all outline-none placeholder-slate-400 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2 space-y-1">
            {filteredConvos.length === 0 ? (
              <div className="text-center py-20">
                <p className="opacity-20 font-black uppercase tracking-widest text-slate-400 text-xs">
                  {conversations.length === 0 ? 'Noch keine Nachrichten' : 'Keine Ergebnisse'}
                </p>
                {conversations.length === 0 && (
                  <button
                    onClick={() => navigate('/network')}
                    className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all"
                  >
                    Netzwerk erkunden
                  </button>
                )}
              </div>
            ) : filteredConvos.map(convo => (
              <div
                key={convo.partnerId}
                onClick={() => handleSelectConvo(convo.partnerId)}
                className={`p-4 rounded-[2rem] cursor-pointer transition-all border-2 ${
                  selectedPartnerId === convo.partnerId
                    ? 'bg-white border-indigo-100 shadow-lg translate-x-1'
                    : 'bg-transparent border-transparent hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-white shrink-0 text-base shadow-sm">
                    {convo.partnerName[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className={`text-sm font-black truncate ${selectedPartnerId === convo.partnerId ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {convo.partnerName}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">{formatTime(convo.lastMessage.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {convo.lastMessage.attachments?.length ? (
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      ) : null}
                      <p className={`text-xs truncate flex-1 ${convo.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>
                        {DOMPurify.sanitize(convo.lastMessage.content) || 'Datei'}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col bg-white relative min-w-0">
          {activeConvo ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm">
                    {activeConvo.partnerName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{activeConvo.partnerName}</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HausMatch Mitglied</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/network?search=${encodeURIComponent(activeConvo.partnerName)}`)}
                  className="text-slate-400 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest transition-colors"
                >
                  Profil ansehen
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50/30" ref={scrollRef}>
                {activeConvo.messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  const prevMsg = activeConvo.messages[idx - 1];
                  const showDate = idx === 0 ||
                    new Date((msg.timestamp?.seconds || 0) * 1000).toDateString() !==
                    new Date((prevMsg.timestamp?.seconds || 0) * 1000).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-white px-4 py-1.5 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 shadow-sm">
                            {formatDateDivider(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-5 py-4 rounded-[1.8rem] shadow-sm ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                          {msg.content && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium"
                               dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
                          )}
                          {msg.attachments?.map((att, i) => (
                            <AttachmentPreview key={i} att={att} />
                          ))}
                          <div className={`flex items-center gap-1.5 mt-1.5 text-[9px] font-bold ${isMe ? 'text-indigo-300 justify-end' : 'text-slate-400'}`}>
                            {formatTime(msg.timestamp)}
                            {isMe && (
                              <svg className={`w-3 h-3 ${msg.read ? 'text-blue-300' : 'text-indigo-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                {msg.read && <path d="M10 13l4 4L24 7" strokeLinecap="round" strokeLinejoin="round" transform="translate(-5, 0)" />}
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Input */}
              <div className="px-6 py-4 bg-white border-t border-slate-50">
                {attachedFile && (
                  <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2.5 mb-3">
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    <span className="text-xs font-black text-indigo-700 truncate flex-1">{attachedFile.name}</span>
                    <span className="text-[10px] text-indigo-400 font-bold shrink-0">{formatFileSize(attachedFile.size)}</span>
                    <button onClick={() => setAttachedFile(null)} className="text-indigo-400 hover:text-red-500 transition-colors shrink-0 ml-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-100 p-2 rounded-[2rem] border border-slate-200 focus-within:border-indigo-500 transition-all">
                  <input type="file" accept={ACCEPT_TYPES} ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Datei anhängen"
                    className="w-10 h-10 rounded-[1.2rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0 ml-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <textarea
                    rows={1}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Nachricht schreiben... (Enter zum Senden)"
                    className="flex-1 bg-transparent border-0 px-4 py-3.5 text-black font-bold focus:ring-0 outline-none resize-none h-[52px] min-h-[52px] max-h-36 placeholder-slate-400 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={(!replyText.trim() && !attachedFile) || uploading}
                    className="bg-indigo-600 text-white w-11 h-11 rounded-[1.3rem] flex items-center justify-center shadow-lg hover:bg-indigo-700 disabled:opacity-30 transition-all active:scale-90 shrink-0"
                  >
                    {uploading
                      ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                      : <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    }
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Nachrichten-Hub</h3>
              <p className="text-slate-400 font-medium text-sm max-w-xs">
                {conversations.length > 0
                  ? 'Wählen Sie einen Chat aus der Liste links.'
                  : 'Noch keine Nachrichten. Schreiben Sie jemanden im Netzwerk an.'}
              </p>
              {conversations.length === 0 && (
                <button
                  onClick={() => navigate('/network')}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Zum Netzwerk
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;
