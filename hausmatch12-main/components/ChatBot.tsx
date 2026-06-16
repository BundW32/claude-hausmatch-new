import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// Eddy die Eule — lila Farben, große Augen, Brille
const EddyOwl = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="80" rx="28" ry="22" fill="#5856D6" />
    <ellipse cx="50" cy="84" rx="17" ry="15" fill="#f0eef8" />
    <circle cx="50" cy="44" r="34" fill="#5856D6" />
    <polygon points="25,20 17,4 34,16" fill="#4c46cc" />
    <polygon points="75,20 83,4 66,16" fill="#4c46cc" />
    <ellipse cx="50" cy="47" rx="29" ry="26" fill="#f0eef8" />
    <circle cx="36" cy="43" r="13.5" fill="white" />
    <circle cx="36" cy="43" r="9" fill="#080820" />
    <circle cx="31" cy="38" r="3" fill="white" />
    <circle cx="36" cy="43" r="13.5" fill="none" stroke="#1a1a3e" strokeWidth="2.5" />
    <circle cx="64" cy="43" r="13.5" fill="white" />
    <circle cx="64" cy="43" r="9" fill="#080820" />
    <circle cx="59" cy="38" r="3" fill="white" />
    <circle cx="64" cy="43" r="13.5" fill="none" stroke="#1a1a3e" strokeWidth="2.5" />
    <line x1="49.5" y1="43" x2="50.5" y2="43" stroke="#1a1a3e" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M44,60 Q50,68 56,60 Q50,65 44,60 Z" fill="#f59e0b" />
    <ellipse cx="24" cy="78" rx="9" ry="16" fill="#4c46cc" transform="rotate(-12 24 78)" />
    <ellipse cx="76" cy="78" rx="9" ry="16" fill="#4c46cc" transform="rotate(12 76 78)" />
    <ellipse cx="41" cy="98" rx="9" ry="4" fill="#f59e0b" />
    <ellipse cx="59" cy="98" rx="9" ry="4" fill="#f59e0b" />
  </svg>
);

const EddyAvatar = () => (
  <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-700 flex items-center justify-center flex-shrink-0">
    <EddyOwl size={38} />
  </div>
);

const ChatBot = () => {
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
          <EddyOwl size={52} />
        )}
      </button>

      {!open && (
        <div className="fixed bottom-[5.5rem] right-6 z-50 bg-white text-indigo-700 text-xs font-black px-2 py-0.5 rounded-full shadow-md border border-indigo-100 pointer-events-none select-none">
          Eddy 🦉
        </div>
      )}

      {open && (
        <div className="fixed bottom-28 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
            <EddyAvatar />
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
                    <EddyOwl size={26} />
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
                  <EddyOwl size={26} />
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
