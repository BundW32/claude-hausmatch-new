import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'Was kostet eine Hausverwaltung?',
  'Wie berechne ich die Mietrendite?',
  'Was darf ich bei der Mieterhöhung beachten?',
  'Welche KfW-Förderungen gibt es?',
  'Was ist eine WEG-Verwaltung?',
  'Wie funktioniert die Nebenkostenabrechnung?',
];

const KIBerater: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hallo! Ich bin Max, Ihr Immobilien-Assistent von HausMatch. 🏠\n\nIch helfe Ihnen bei Fragen zu Hausverwaltung, Mietrecht, Finanzierung und Immobilieninvestments. Was möchten Sie wissen?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-black mb-4">
            M
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Max — Ihr KI-Immobilienberater
          </h1>
          <p className="text-slate-500 font-medium">
            Fragen zu Hausverwaltung, Mietrecht, Finanzierung & Investment
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
            ⚠️ KI-generierte Antworten · Kein Ersatz für Rechts- oder Steuerberatung
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Häufige Fragen
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-4 py-2 rounded-full border border-blue-200 bg-white text-blue-700 text-sm font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-4 mb-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm mr-3 flex-shrink-0 mt-1">
                  M
                </div>
              )}
              <div
                className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm mr-3 flex-shrink-0">
                M
              </div>
              <div className="bg-white border border-slate-100 shadow-sm px-5 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1 items-center h-5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg flex items-end gap-3 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Stellen Sie Ihre Frage... (Enter zum Senden)"
              rows={1}
              className="flex-1 resize-none text-sm text-slate-700 placeholder-slate-400 focus:outline-none py-1 px-1 max-h-32"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
            Max ist eine KI · Antworten sind allgemeine Informationen · Kein Rechtsrat
          </p>
        </div>
      </div>
    </div>
  );
};

export default KIBerater;
