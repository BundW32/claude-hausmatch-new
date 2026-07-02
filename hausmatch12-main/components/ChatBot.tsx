import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const EDDY_URL = "/eddy-eule.png";

const EddyAvatar = ({ size = 40 }: { size?: number }) => (
  <div style={{ width: size, height: size, background: '#2563FF', borderRadius: size * 0.25, overflow: 'hidden', flexShrink: 0 }}>
    <img src={EDDY_URL} alt="Eddy" width={size} height={size} style={{ display: 'block', objectFit: 'cover' }} />
  </div>
);

const ChatBot = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hallo! Ich bin Eddy 🦉, Ihr Immobilien-Assistent von HausMatch.\n\nIch helfe Ihnen bei Fragen zu Hausverwaltung, Mietrecht, Finanzierung und Investment. Was möchten Sie wissen?\n\n⚠️ Hinweis: Ich bin eine KI. Meine Antworten sind allgemeine Informationen und kein Ersatz für rechtliche oder steuerliche Beratung.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const allMessages = [...messages, { role: 'user' as const, text }].map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const replyText = data.reply || 'Entschuldigung, ich konnte keine Antwort generieren.';
      setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Es tut mir leid, ich konnte Ihre Anfrage gerade nicht verarbeiten. Bitte versuchen Sie es erneut.\n\n⚠️ KI-Hinweis: Diese Antwort ist eine allgemeine Information und kein Ersatz für rechtliche oder steuerliche Beratung.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const suggestions = [
    'Was kostet eine Hausverwaltung?',
    'Wie berechne ich die Rendite?',
    'Mieterhöhung — was muss ich beachten?'
  ];

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('⚠️')) {
        return (
          <p key={i} style={{ fontSize: '10px', color: '#92400e', background: '#fef3c7', borderRadius: '6px', padding: '4px 8px', marginTop: '6px' }}>
            {line}
          </p>
        );
      }
      if (line === '') return <br key={i} />;
      return <span key={i} style={{ display: 'block' }}>{line}</span>;
    });
  };

  // Im Postfach ausblenden – sonst überdeckt Eddys Button den Sende-Button.
  if (location.pathname === '/messages') return null;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300/60 hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden"
        aria-label="Eddy — KI-Immobilienberater öffnen"
      >
        {open ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <img src={EDDY_URL} alt="Eddy" width={52} height={52} style={{ display: 'block', objectFit: 'cover' }} />
        )}
      </button>

      {!open && (
        <div className="hidden sm:block fixed bottom-[5.5rem] right-6 z-50 bg-white text-indigo-700 text-xs font-black px-2 py-0.5 rounded-full shadow-md border border-indigo-100 pointer-events-none select-none">
          Eddy 🦉
        </div>
      )}

      {open && (
        <div className="fixed bottom-24 left-2 right-2 sm:left-auto sm:right-6 sm:w-96 z-50 max-h-[75vh] sm:max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
            <EddyAvatar size={40} />
            <div>
              <div className="text-white font-black text-sm">Eddy — Immobilien-KI 🦉</div>
              <div className="text-indigo-200 text-xs font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Powered by Gemini · Nur allgemeine Info
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/60 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-[10px] text-amber-700 font-medium leading-snug">
              KI-generierte Antworten — keine Rechtsberatung. Bei rechtlichen Fragen immer einen Fachanwalt konsultieren.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-80">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                    <img src={EDDY_URL} alt="Eddy" width={28} height={28} style={{ display: 'block', objectFit: 'cover' }} />
                  </div>
                )}
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? formatText(msg.text) : msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <EddyAvatar size={26} />
                </div>
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-600 font-medium px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 p-3 flex gap-2 items-center">
            <input
              ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Eddy fragen..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
