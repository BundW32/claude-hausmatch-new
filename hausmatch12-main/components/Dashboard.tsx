import React, { useEffect, useState, useContext } from 'react';
import { getInquiries, updateInquiryStatus, sendMessage } from '../services/dataService';
import { Inquiry, Message } from '../types';
import { AuthContext } from '../App';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getInquiries().then(data => {
      // Manager sehen einen Lead, wenn sie gezielt angeschrieben wurden (Email in
      // managerEmails) ODER die Stadt zu ihrem Profil passt.
      const filtered = (user.role === 'manager')
        ? data.filter(i => {
            const myEmail = (user.email || '').toLowerCase().trim();
            const emailMatch = !!myEmail && (i.managerEmails || [])
              .map(e => (e || '').toLowerCase().trim())
              .includes(myEmail);
            const iCity = (i.city || '').toLowerCase().trim();
            const uCity = (user.city || '').toLowerCase().trim();
            const cityMatch = !!uCity && !!iCity && (iCity.includes(uCity) || uCity.includes(iCity));
            return emailMatch || cityMatch;
          })
        : data;
      setInquiries(filtered);
      setLoading(false);
    });
  }, [user]);

  const handleStatusUpdate = async (id: string, status: Inquiry['status']) => {
    try {
      await updateInquiryStatus(id, status);
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (err) {
      console.error("Fehler beim Status-Update:", err);
    }
  };

  const selectedInquiry = inquiries.find(i => i.id === selectedId);

  const handleSendResponse = async () => {
    if (!selectedInquiry || !user || !replyText.trim()) return;
    await sendMessage({
      senderId: user.id,
      senderName: user.name,
      receiverId: selectedInquiry.ownerId,
      receiverName: selectedInquiry.ownerName,
      subject: `Angebot für Ihr Objekt in ${selectedInquiry.city}`,
      content: replyText,
    });
    setReplyText('');
    setShowReply(false);
    handleStatusUpdate(selectedInquiry.id, 'kontaktiert');
    alert("Nachricht wurde über das HausMatch-System versendet!");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row p-3 md:p-6 gap-3 md:gap-6 bg-slate-50">

      {/* Lead Liste */}
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 md:min-w-[320px] bg-white rounded-[2rem] md:rounded-[2.5rem] flex-col shadow-xl border border-slate-200 overflow-hidden`}>
        <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">LEAD CENTER</h2>
          <div className="mt-4 flex gap-2">
            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-200">
              {inquiries.filter(i => i.status === 'neu').length} Neu
            </span>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              {inquiries.filter(i => i.status !== 'archiviert').length} Aktiv
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col gap-4 p-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse"></div>
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-20 opacity-20 font-black uppercase tracking-widest text-slate-400">Keine Leads</div>
          ) : inquiries.map(inquiry => {
            const isSelected = selectedId === inquiry.id;
            const isArchived = inquiry.status === 'archiviert';
            
            return (
              <div 
                key={inquiry.id}
                onClick={() => setSelectedId(inquiry.id)}
                className={`p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border relative group ${
                    isSelected 
                    ? 'bg-slate-900 text-white shadow-2xl border-slate-900 translate-x-2' 
                    : isArchived 
                      ? 'bg-slate-50 border-slate-100 opacity-60 grayscale'
                      : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-lg truncate pr-16">{inquiry.city}</h3>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${inquiry.status === 'neu' ? 'bg-indigo-500 animate-pulse' : inquiry.status === 'kontaktiert' ? 'bg-green-400' : 'bg-slate-300'}`}></span>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {inquiry.units} WE
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {inquiry.propertyType}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {inquiry.aiAnalysis ? (
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-200/20 rounded-full overflow-hidden">
                        <div className={`h-full ${inquiry.aiAnalysis.estimatedEffort === 'Niedrig' ? 'bg-green-400 w-1/3' : inquiry.aiAnalysis.estimatedEffort === 'Hoch' ? 'bg-red-400 w-full' : 'bg-yellow-400 w-2/3'}`}></div>
                      </div>
                    </div>
                  ) : <div className="flex-1"></div>}

                  {/* Schnellaktionen */}
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    {inquiry.status !== 'kontaktiert' && inquiry.status !== 'archiviert' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(inquiry.id, 'kontaktiert'); }}
                        title="Als kontaktiert markieren"
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </button>
                    )}
                    {inquiry.status !== 'archiviert' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(inquiry.id, 'archiviert'); }}
                        title="Lead archivieren"
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                    {inquiry.status === 'archiviert' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(inquiry.id, 'neu'); }}
                        title="Wiederherstellen"
                        className="p-2 rounded-xl bg-slate-200 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Ansicht */}
      <div className={`${!selectedId ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex-col`}>
        {selectedInquiry ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 custom-scrollbar">
            {/* Zurück-Button, nur auf Mobile */}
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden flex items-center gap-2 mb-4 text-slate-500 font-black text-xs uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              Zurück
            </button>
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-12 gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${selectedInquiry.status === 'neu' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      Status: {selectedInquiry.status}
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Projekt #{selectedInquiry.id.substring(0,6)}</h1>
                  </div>
                  <p className="text-slate-500 font-medium">Eingegangen am {new Date(selectedInquiry.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 sm:gap-4 flex-shrink-0">
                   <button 
                    onClick={() => handleStatusUpdate(selectedInquiry.id, 'archiviert')} 
                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                   >
                    Archiv
                   </button>
                   <button 
                    onClick={() => setShowReply(true)} 
                    className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                   >
                    Angebot senden
                   </button>
                </div>
              </div>

              {/* AI Analyse Sektion */}
              {selectedInquiry.aiAnalysis && (
                <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 text-white shadow-2xl mb-6 md:mb-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-20 -mt-20"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       </div>
                       <div>
                         <h2 className="text-2xl font-black tracking-tighter uppercase">Intelligente Objektdaten</h2>
                         <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                           KI-generiert
                         </span>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 mb-10">
                       <div>
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">KI-Zusammenfassung</label>
                          <p className="text-lg text-slate-300 font-light leading-relaxed italic">"{selectedInquiry.aiAnalysis.summary}"</p>
                       </div>
                       <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Kernanforderungen</label>
                            <div className="flex flex-wrap gap-2">
                               {selectedInquiry.aiAnalysis.keyRequirements.map(r => (
                                 <span key={r} className="bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold">{r}</span>
                               ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Rechtlicher Hinweis</label>
                            <p className="text-sm text-slate-400 bg-white/5 p-4 rounded-2xl border border-white/10">{selectedInquiry.aiAnalysis.legalAdviceSnippet}</p>
                          </div>
                       </div>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed border-t border-white/10 pt-5">
                      Diese Auswertung wurde automatisch von einem KI-System erzeugt (Kennzeichnung nach Art. 50 EU-KI-Verordnung).
                      Sie ist ein unverbindlicher Vorschlag zur Vorsortierung, kann Fehler enthalten und ersetzt weder Ihre eigene
                      Prüfung noch eine Rechtsberatung. Die Entscheidung über die Anfrage treffen ausschließlich Sie.
                    </p>
                  </div>
                </div>
              )}

              {/* Stammdaten */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-12">
                <div className="p-4 sm:p-6 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Objekt</div>
                  <div className="text-2xl font-black text-slate-900 mb-1">{selectedInquiry.city}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">{selectedInquiry.propertyType}</div>
                </div>
                <div className="p-4 sm:p-6 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Einheiten</div>
                  <div className="text-2xl font-black text-slate-900 mb-1">{selectedInquiry.units} WE</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Skalierung: {selectedInquiry.units > 20 ? 'Groß' : 'Mittel'}</div>
                </div>
                <div className="p-4 sm:p-6 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Eigentümer</div>
                  <div className="text-2xl font-black text-slate-900 mb-1">{selectedInquiry.ownerName}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase truncate">{selectedInquiry.ownerEmail}</div>
                </div>
              </div>

              {/* Beschreibung */}
              <div className="mb-6 md:mb-12">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Objektbeschreibung des Eigentümers</h3>
                <div className="p-4 sm:p-6 md:p-8 bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] shadow-sm text-slate-700 leading-relaxed font-light">
                  {selectedInquiry.description || "Keine zusätzliche Beschreibung vorhanden."}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
            <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-xl font-black uppercase tracking-widest">Wählen Sie einen Lead zur Analyse</p>
          </div>
        )}

        {/* Modal: Antwort Senden */}
        {showReply && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
             <div className="bg-white w-full max-w-3xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-white animate-fade-in-up">
                <div className="p-4 sm:p-6 md:p-10 bg-slate-900 text-white flex justify-between items-center">
                   <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Angebot erstellen</h3>
                   <button onClick={() => setShowReply(false)} className="text-white/40 hover:text-white transition-colors">Schließen</button>
                </div>
                <div className="p-4 sm:p-6 md:p-10">
                   <p className="text-slate-500 mb-6 font-medium">An: <span className="text-slate-900 font-bold">{selectedInquiry?.ownerName}</span></p>
                   <textarea
                     value={replyText}
                     onChange={(e) => setReplyText(e.target.value)}
                     rows={8}
                     className="w-full bg-slate-50 border-0 rounded-[1.5rem] md:rounded-[2rem] p-4 sm:p-6 md:p-8 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all mb-4 sm:mb-6 md:mb-8"
                     placeholder="Schreiben Sie Ihre Nachricht oder nutzen Sie einen KI-Vorschlag..."
                   />
                   <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button onClick={handleSendResponse} className="flex-1 bg-slate-900 text-white py-4 sm:py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all">Nachricht Senden</button>
                      <button onClick={() => setReplyText(`Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage bezüglich Ihres Objekts in ${selectedInquiry?.city}. Gerne übernehmen wir die Verwaltung der ${selectedInquiry?.units} Einheiten...`)} className="sm:px-8 bg-indigo-50 text-indigo-600 py-4 sm:py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-100 transition-all">KI Entwurf</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
