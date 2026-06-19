
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { searchUsers, addFriend, removeFriend, sendMessage, uploadFile } from '../services/dataService';
import { User, USER_TYPE_LABELS, MessageAttachment } from '../types';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const REGIONS = [
  { id: 'alle', label: 'Alle Regionen' },
  { id: 'nord', label: 'Norddeutschland', cities: ['hamburg', 'bremen', 'kiel', 'lübeck', 'rostock', 'schwerin', 'hannover', 'braunschweig', 'oldenburg', 'flensburg', 'leer', 'emden', 'lüneburg', 'göttingen', 'hildesheim'] },
  { id: 'berlin', label: 'Berlin & Brandenburg', cities: ['berlin', 'potsdam', 'cottbus', 'brandenb', 'frankfurt (oder)', 'eberswalde'] },
  { id: 'nrw', label: 'NRW & West', cities: ['köln', 'düsseldorf', 'dortmund', 'essen', 'duisburg', 'bochum', 'wuppertal', 'bielefeld', 'bonn', 'münster', 'aachen', 'saarbrücken', 'trier', 'mainz', 'koblenz', 'saar', 'gelsenkirchen', 'mönchengladbach', 'krefeld'] },
  { id: 'mitte', label: 'Mitte & Ost', cities: ['frankfurt', 'wiesbaden', 'darmstadt', 'kassel', 'erfurt', 'jena', 'halle', 'magdeburg', 'leipzig', 'chemnitz', 'dresden', 'gera', 'zwickau', 'eisenach', 'weimar', 'dessau'] },
  { id: 'sued', label: 'Bayern & Süd', cities: ['münchen', 'nürnberg', 'augsburg', 'regensburg', 'würzburg', 'ingolstadt', 'erlangen', 'bamberg', 'stuttgart', 'freiburg', 'ulm', 'karlsruhe', 'mannheim', 'heidelberg', 'reutlingen', 'konstanz', 'ravensburg', 'heilbronn'] },
];

const ACCEPT_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';

const matchesRegion = (u: User, regionId: string): boolean => {
  if (regionId === 'alle') return true;
  const region = REGIONS.find(r => r.id === regionId);
  if (!region?.cities) return true;
  const city = (u.city || u.location || '').toLowerCase();
  return region.cities.some(c => city.includes(c));
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const Network = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeRegion, setActiveRegion] = useState('alle');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [msgText, setMsgText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await searchUsers(searchTerm);
      setUsers(user ? res.filter(u => u.id !== user.id) : res);
      setLoading(false);
    };
    const timer = setTimeout(fetch, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, user?.id]);

  const filteredUsers = users.filter(u => matchesRegion(u, activeRegion));

  const handleToggleFriend = async (targetUser: User) => {
    if (!user) { navigate('/login'); return; }
    setActionLoading(targetUser.id);
    const isFriend = user.friends?.includes(targetUser.id);
    try {
      if (isFriend) await removeFriend(user.id, targetUser.id);
      else await addFriend(user.id, targetUser.id);
      await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
    e.target.value = '';
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setAttachedFile(null);
    setMsgText('');
  };

  const handleDirectMessage = async () => {
    if (!user || !selectedUser || !msgText.trim()) return;
    setUploading(true);

    let attachments: MessageAttachment[] = [];
    if (attachedFile) {
      try {
        const url = await uploadFile(attachedFile, `messages/${user.id}/${Date.now()}_${attachedFile.name}`);
        attachments = [{ name: attachedFile.name, url, type: attachedFile.type, size: attachedFile.size }];
      } catch (e) {
        console.error('Upload failed:', e);
      }
    }

    await sendMessage({
      senderId: user.id,
      senderName: user.name,
      receiverId: selectedUser.id,
      receiverName: selectedUser.name,
      subject: 'Direktnachricht',
      content: msgText,
      ...(attachments.length > 0 ? { attachments } : {})
    });

    handleCloseModal();
    setUploading(false);
    navigate('/messages');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-8">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Netzwerk</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Vernetzen Sie sich mit Immobilienprofis</p>
          </div>
          <div className="w-full md:w-96 bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex items-center group focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
            <svg className="w-6 h-6 text-slate-300 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Name oder Firma suchen..."
              className="flex-1 px-4 py-3 bg-transparent border-none text-black font-bold focus:ring-0 placeholder-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Region Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: 'none' }}>
          {REGIONS.map(region => (
            <button
              key={region.id}
              onClick={() => setActiveRegion(region.id)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border ${
                activeRegion === region.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {region.label}
            </button>
          ))}
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'Mitglied' : 'Mitglieder'} gefunden
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-200 rounded-[3rem] animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredUsers.map(u => {
              const isFriend = user?.friends?.includes(u.id);
              const isLoading = actionLoading === u.id;

              return (
                <div key={u.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-indigo-50 transition-colors"></div>

                  <Link to={`/profile/${u.id}`} className="flex items-center gap-6 mb-8 relative z-10 group/link">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg group-hover/link:scale-105 transition-transform">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-4xl font-black text-slate-300">{u.name[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover/link:text-indigo-600 transition-colors truncate">{u.name}</h3>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2 inline-block border ${u.role === 'profi' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {u.userType ? USER_TYPE_LABELS[u.userType] : u.role === 'manager' ? 'Hausverwaltung' : 'Eigentümer'}
                      </span>
                      {(u.city || u.location) && (
                        <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {u.city || u.location}
                        </p>
                      )}
                    </div>
                  </Link>

                  <p className="text-slate-500 font-medium line-clamp-3 mb-10 text-base italic leading-relaxed">
                    {u.bio ? `"${u.bio}"` : 'Erfahrener Branchenexperte auf HausMatch.'}
                  </p>

                  <div className="grid grid-cols-1 gap-4 mt-auto">
                    {!user ? (
                      <button onClick={() => navigate(`/profile/${u.id}`)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Profil ansehen
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleFriend(u)}
                          disabled={isLoading}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${isFriend ? 'bg-green-50 text-green-600 border border-green-200 shadow-inner' : 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800'}`}
                        >
                          {isLoading ? 'Verarbeite...' : isFriend ? (
                            <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Vernetzt</>
                          ) : 'Vernetzen'}
                        </button>
                        <button onClick={() => setSelectedUser(u)} className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          Nachricht schreiben
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-40">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 opacity-40">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">Keine Mitglieder in dieser Region gefunden</p>
          </div>
        )}
      </div>

      {/* Direct Message Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl border border-white">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl">
                {selectedUser.name[0]}
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900">Nachricht an {selectedUser.name}</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Die Nachricht erscheint direkt im Postfach</p>
              </div>
            </div>

            <textarea
              className="w-full h-36 bg-slate-50 border-0 rounded-[2rem] p-6 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none mb-4 text-base placeholder-slate-300 shadow-inner"
              placeholder="Ihre Nachricht an den Experten..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
            />

            {/* File attachment */}
            <input type="file" accept={ACCEPT_TYPES} ref={fileInputRef} className="hidden" onChange={handleFileChange} />

            {attachedFile ? (
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3 mb-6">
                <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-indigo-700 truncate">{attachedFile.name}</p>
                  <p className="text-[10px] text-indigo-400 font-bold">{formatFileSize(attachedFile.size)}</p>
                </div>
                <button onClick={() => setAttachedFile(null)} className="text-indigo-400 hover:text-red-500 transition-colors shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-6 text-xs font-black uppercase tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                Datei anhängen (PDF, Bild, Word)
              </button>
            )}

            <div className="flex gap-4">
              <button onClick={handleCloseModal} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">
                Abbrechen
              </button>
              <button
                onClick={handleDirectMessage}
                disabled={uploading || !msgText.trim()}
                className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-40"
              >
                {uploading ? 'Sendet...' : 'Jetzt Senden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Network;
