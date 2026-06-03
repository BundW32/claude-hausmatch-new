
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { AuthContext } from '../App';
import { db } from '../services/firebase';
import { collection, query, or, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { sendMessage } from '../services/dataService';
import { Message } from '../types';

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: Message;
  messages: Message[];
  unreadCount: number;
}

const Messaging = () => {
  const { user } = useContext(AuthContext);
  // Initialized navigate hook to fix line 174 error
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "messages"), 
      or(where("senderId", "==", user.id), where("receiverId", "==", user.id)),
      orderBy("timestamp", "desc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      
      // Gruppierung nach Partner
      const groups: Record<string, Message[]> = {};
      allMsgs.forEach(msg => {
        const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        if (!groups[partnerId]) groups[partnerId] = [];
        groups[partnerId].push(msg);
      });

      const convoList: Conversation[] = Object.entries(groups).map(([partnerId, msgs]) => {
        const sorted = msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        const lastMsg = sorted[sorted.length - 1];
        const partnerName = lastMsg.senderId === user.id ? lastMsg.receiverName : lastMsg.senderName;
        const unread = msgs.filter(m => !m.read && m.receiverId === user.id).length;

        return {
          partnerId,
          partnerName,
          lastMessage: lastMsg,
          messages: sorted,
          unreadCount: unread
        };
      }).sort((a, b) => (b.lastMessage.timestamp?.seconds || 0) - (a.lastMessage.timestamp?.seconds || 0));

      setConversations(convoList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Messaging listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedPartnerId, conversations]);

  const activeConvo = conversations.find(c => c.partnerId === selectedPartnerId);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !activeConvo || !replyText.trim()) return;

    const textToSend = replyText;
    setReplyText('');

    await sendMessage({
      senderId: user.id,
      senderName: user.name,
      receiverId: activeConvo.partnerId,
      receiverName: activeConvo.partnerName,
      subject: "Chat-Nachricht",
      content: textToSend
    });
  };

  const formatTime = (ts: any) => {
    if (!ts) return "Jetzt";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-6rem)]">
      <div className="flex h-full bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">
        
        {/* Sidebar: Conversations */}
        <div className="w-full md:w-[350px] lg:w-[400px] border-r border-slate-50 flex flex-col bg-slate-50/30">
          <div className="p-8 pb-6 bg-white/50 backdrop-blur-md">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-6">Chats</h2>
            <div className="relative">
               <input 
                 type="text" 
                 placeholder="Gespräche suchen..." 
                 className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-black font-bold focus:ring-2 focus:ring-indigo-600 transition-all outline-none placeholder-slate-400"
               />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="text-center py-20 opacity-20 font-black uppercase tracking-widest text-slate-400">Keine Chats</div>
            ) : conversations.map(convo => (
              <div 
                key={convo.partnerId}
                onClick={() => setSelectedPartnerId(convo.partnerId)}
                className={`p-5 rounded-[2rem] cursor-pointer transition-all relative group border-2 ${
                  selectedPartnerId === convo.partnerId 
                  ? 'bg-white border-indigo-100 shadow-lg translate-x-1' 
                  : 'bg-transparent border-transparent hover:bg-white/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center font-black text-slate-400 border border-white shrink-0 overflow-hidden">
                       {convo.partnerName[0]}
                    </div>
                    <div className="truncate">
                       <h4 className={`text-sm font-black truncate ${selectedPartnerId === convo.partnerId ? 'text-indigo-600' : 'text-slate-900'}`}>
                         {convo.partnerName}
                       </h4>
                       <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                         {DOMPurify.sanitize(convo.lastMessage.content)}
                       </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{formatTime(convo.lastMessage.timestamp)}</span>
                    {convo.unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{convo.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Main View */}
        <div className="flex-1 flex flex-col bg-white relative">
          {activeConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg border border-slate-100">
                     {activeConvo.partnerName[0]}
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">{activeConvo.partnerName}</h3>
                     <span className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                       Aktiv im Chat
                     </span>
                   </div>
                </div>
                <button 
                  onClick={() => navigate(`/network?search=${activeConvo.partnerName}`)}
                  className="text-slate-400 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest"
                >
                  Profil ansehen
                </button>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar" ref={scrollRef}>
                {activeConvo.messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  const showDate = idx === 0 || new Date(msg.timestamp?.seconds * 1000).toDateString() !== new Date(activeConvo.messages[idx-1].timestamp?.seconds * 1000).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-6">
                           <span className="bg-white px-4 py-1.5 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 shadow-sm">
                             {new Date(msg.timestamp?.seconds * 1000).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
                           </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                         <div className={`max-w-[75%] p-5 rounded-[2rem] shadow-sm border ${
                           isMe 
                           ? 'bg-slate-900 text-white rounded-tr-none border-slate-800' 
                           : 'bg-white text-slate-800 rounded-tl-none border-slate-100'
                         }`}>
                            <p className="text-base leading-relaxed whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}></p>
                            <div className={`flex items-center gap-2 mt-2 text-[9px] font-bold ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                               {formatTime(msg.timestamp)}
                               {isMe && (
                                  <svg className={`w-3 h-3 ${msg.read ? 'text-blue-400' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
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

              {/* Input Area */}
              <div className="p-8 bg-white border-t border-slate-50">
                 <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-100 p-2 rounded-[2.5rem] border border-slate-200 focus-within:border-indigo-600 transition-all">
                    <textarea 
                      rows={1}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Nachricht schreiben..."
                      className="flex-1 bg-transparent border-0 px-6 py-4 text-black font-bold focus:ring-0 outline-none resize-none h-14 min-h-[56px] max-h-40 placeholder-slate-400"
                    />
                    <button 
                      type="submit"
                      disabled={!replyText.trim()}
                      className="bg-indigo-600 text-white w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-lg hover:bg-indigo-700 disabled:opacity-20 transition-all active:scale-90 shrink-0"
                    >
                      <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                 </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
               <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-inner">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Nachrichten-Hub</h3>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-xs">Wählen Sie einen Chat aus der Liste links aus, um fortzufahren.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;
