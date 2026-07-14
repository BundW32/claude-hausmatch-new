
import React, { useState, useContext, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { updateUserProfile, getUserProfile, addFriend, removeFriend, sendMessage, deleteAccount } from '../services/dataService';
import { User, UserType, USER_TYPE_LABELS } from '../types';

const DAYS = [
  { key: 'mon', label: 'Montag' },
  { key: 'tue', label: 'Dienstag' },
  { key: 'wed', label: 'Mittwoch' },
  { key: 'thu', label: 'Donnerstag' },
  { key: 'fri', label: 'Freitag' },
  { key: 'sat', label: 'Samstag' },
  { key: 'sun', label: 'Sonntag' }
];

// Echter "Expertise-Score" = Profil-Vollständigkeit (Anteil ausgefüllter Kernfelder).
// Ersetzt den früheren festen Platzhalter "100 %", der für jeden gleich war.
const computeProfileScore = (u: User): number => {
  const checks = [
    !!u.avatar,
    !!(u.bio && u.bio.trim()),
    !!(u.location || u.city),
    !!u.phone,
    !!u.website,
    !!(u.specialization && u.specialization.length > 0),
    !!u.experienceYears,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};

const Profile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useContext(AuthContext);
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<User>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !uid || uid === currentUser?.id;

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      if (isOwnProfile) {
        if (currentUser) {
          setProfileUser(currentUser);
          setFormData({
            name: currentUser.name,
            email: currentUser.email || '',
            bio: currentUser.bio || '',
            location: currentUser.location || currentUser.city || '',
            phone: currentUser.phone || '',
            website: currentUser.website || '',
            avatar: currentUser.avatar || '',
            userType: currentUser.userType || 'owner',
            teamSize: currentUser.teamSize || 0,
            foundedYear: currentUser.foundedYear || 0,
            vatId: currentUser.vatId || '',
            openingHours: currentUser.openingHours || {}
          });
        }
      } else {
        const profile = await getUserProfile(uid!);
        setProfileUser(profile);
      }
      setLoading(false);
    };
    fetchUser();
  }, [uid, currentUser, isOwnProfile]);

  const handleSave = async () => {
    if (!currentUser) return;
    if (!formData.location?.trim()) {
      alert('Bitte geben Sie Ihren Standort (Stadt) an. Dieser wird für die Verwalter-Suche benötigt.');
      return;
    }
    setSaveLoading(true);
    await updateUserProfile(currentUser.id, {
      ...formData,
      city: formData.location.trim(),
      location: formData.location.trim(),
      ...(formData.userType ? { userType: formData.userType } : {}),
    });
    await refreshUser();
    setIsEditing(false);
    setSaveLoading(false);
  };

  const handleToggleFriend = async () => {
    if (!currentUser || !profileUser) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    const isFriend = currentUser.friends?.includes(profileUser.id);
    try {
      if (isFriend) {
        await removeFriend(currentUser.id, profileUser.id);
      } else {
        await addFriend(currentUser.id, profileUser.id);
      }
      await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendDirectMessage = async () => {
    if (!currentUser || !profileUser || !msgText.trim()) return;
    await sendMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId: profileUser.id,
      receiverName: profileUser.name,
      subject: "Profil-Anfrage",
      content: msgText
    });
    setMsgText('');
    setShowMsgModal(false);
    navigate('/messages');
  };

  // DSGVO Art. 17: endgültige Löschung von Profil + Zugangsdaten.
  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword || undefined);
      // onAuthStateChanged setzt den Nutzer automatisch auf null.
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setDeleteError('Das eingegebene Passwort ist nicht korrekt.');
      } else if (err.code === 'auth/requires-recent-login') {
        setDeleteError('Aus Sicherheitsgründen müssen Sie sich zunächst neu anmelden. Bitte loggen Sie sich aus, wieder ein und versuchen Sie es erneut.');
      } else {
        setDeleteError('Löschung fehlgeschlagen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns unter info@bundwimmobilien.de.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Bild ist zu groß (Max. 1MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
       <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
       <span className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">HausMatch Profil wird geladen</span>
    </div>
  );

  if (!profileUser) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
       <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter">Profil nicht gefunden</h1>
       <button onClick={() => navigate('/network')} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Zum Netzwerk</button>
    </div>
  );

  const isManager = profileUser.role === 'manager';
  const isProfi = profileUser.role === 'profi';
  const roleLabel = profileUser.userType
    ? USER_TYPE_LABELS[profileUser.userType]
    : isManager ? 'Hausverwaltung' : 'Eigentümer';
  const isFriend = currentUser?.friends?.includes(profileUser.id);
  const currentDisplayName = isEditing ? (formData.name || '') : profileUser.name;
  const currentAvatar = isEditing ? formData.avatar : profileUser.avatar;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        
        {/* Profile Card Container */}
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] overflow-hidden border border-slate-100 flex flex-col">
           
           {/* Visual Header / Cover */}
           <div className="bg-slate-900 h-40 md:h-72 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900 to-slate-900"></div>
              <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
           </div>

           {/* Identity Row - Re-Engineered for perfect visibility */}
           <div className="px-6 md:px-12 pb-10 relative flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 -mt-20 md:-mt-28">
              
              {/* Logo / Avatar - High Definition */}
              <div className="relative shrink-0">
                <div className="w-44 h-44 md:w-64 md:h-64 rounded-[3.5rem] md:rounded-[4.5rem] bg-white p-3 md:p-4 shadow-2xl border border-slate-50 flex items-center justify-center overflow-hidden">
                   <div className="w-full h-full rounded-[2.8rem] md:rounded-[3.8rem] bg-slate-50 flex items-center justify-center overflow-hidden">
                      {currentAvatar ? (
                        <img src={currentAvatar} alt={currentDisplayName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-7xl md:text-9xl font-black text-slate-200">{currentDisplayName?.[0]}</span>
                      )}
                   </div>
                </div>
                {isEditing && isOwnProfile && (
                  <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm rounded-[3.5rem] md:rounded-[4.5rem] flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300"
                  >
                     <svg className="w-10 h-10 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">Logo ändern</span>
                  </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              {/* Name and Basic Info - Optimized Typography */}
              <div className="flex-1 flex flex-col md:pt-32 text-center md:text-left min-w-0 w-full">
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
                    <div className="min-w-0">
                       <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 leading-[1.05]">
                         {currentDisplayName}
                       </h1>
                       <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          <span className={`px-5 py-2 rounded-full text-white text-[11px] font-black uppercase tracking-widest shadow-lg ${isProfi ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-indigo-600 shadow-indigo-100'}`}>
                            {roleLabel}
                          </span>
                          {profileUser.location && !isEditing && (
                            <span className="px-5 py-2 rounded-full bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-2">
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                               {profileUser.location}
                            </span>
                          )}
                       </div>
                    </div>
                    
                    {/* Action Buttons Container */}
                    <div className="flex gap-4 shrink-0 pb-1 justify-center">
                       {isOwnProfile ? (
                         <button 
                           onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                           disabled={saveLoading}
                           className={`px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95 ${isEditing ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                         >
                           {saveLoading ? 'Speichern...' : (isEditing ? 'Speichern' : 'Profil bearbeiten')}
                         </button>
                       ) : (
                         <>
                           <button 
                             onClick={handleToggleFriend}
                             disabled={actionLoading}
                             className={`px-8 py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl flex items-center gap-3 ${isFriend ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                           >
                             {actionLoading ? '...' : (isFriend ? 'Vernetzt' : 'Vernetzen')}
                           </button>
                           <button 
                             onClick={() => setShowMsgModal(true)}
                             className="px-8 py-5 bg-white text-indigo-600 rounded-3xl font-black uppercase text-xs tracking-widest border-2 border-indigo-100 shadow-sm hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                           >
                             Nachricht
                           </button>
                         </>
                       )}
                    </div>
                 </div>
              </div>
           </div>

           {/* Profile Body - Grid System */}
           <div className="px-6 md:px-12 pb-12">
              {isEditing ? (
                <div className="max-w-4xl mx-auto space-y-12 animate-fade-in-up">
                   <div className="grid md:grid-cols-2 gap-10">
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Firma / Name</label>
                       <input className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-5 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                     </div>
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Stadt / Standort <span className="text-indigo-500">*</span></label>
                       <input required className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-5 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-xl" placeholder="z.B. Gladbeck" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                     </div>
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">E-Mail</label>
                       <input type="email" className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-5 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-xl" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@firma.de" />
                     </div>
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Telefon</label>
                       <input type="tel" className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-5 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-xl" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+49 ..." />
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Website</label>
                       <input className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-5 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-xl" value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="www.firma.de" />
                     </div>
</div>

                   {isProfi && (
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Berufsfeld</label>
                       <select
                         className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-5 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-xl"
                         value={formData.userType || 'sonstige_profi'}
                         onChange={e => setFormData({ ...formData, userType: e.target.value as UserType })}
                       >
                         {(Object.entries(USER_TYPE_LABELS) as [UserType, string][])
                           .filter(([t]) => !['owner', 'weg', 'hausverwaltung'].includes(t))
                           .map(([t, label]) => (
                             <option key={t} value={t}>{label}</option>
                           ))}
                       </select>
                     </div>
                   )}

                   {isManager && (
                     <div className="bg-slate-50 p-10 md:p-14 rounded-[3.5rem] border border-slate-100">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Geschäftszeiten & Firmendaten</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                           {DAYS.map(day => (
                             <div key={day.key} className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">{day.label}</label>
                                <input 
                                  className="w-full bg-white border-0 rounded-2xl px-5 py-4 text-black font-bold ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm" 
                                  value={(formData.openingHours as any)?.[day.key] || ''} 
                                  onChange={e => setFormData({
                                    ...formData, 
                                    openingHours: {...formData.openingHours, [day.key]: e.target.value}
                                  })} 
                                  placeholder="z.B. 09:00 - 17:00"
                                />
                             </div>
                           ))}
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 pt-10 border-t border-slate-200">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Team-Größe</label>
                               <input type="number" className="w-full bg-white border-0 rounded-2xl px-5 py-4 text-black font-bold ring-1 ring-slate-200" value={formData.teamSize} onChange={e => setFormData({...formData, teamSize: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Gegründet</label>
                               <input type="number" className="w-full bg-white border-0 rounded-2xl px-5 py-4 text-black font-bold ring-1 ring-slate-200" value={formData.foundedYear} onChange={e => setFormData({...formData, foundedYear: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">USt-ID</label>
                               <input className="w-full bg-white border-0 rounded-2xl px-5 py-4 text-black font-bold ring-1 ring-slate-200" value={formData.vatId} onChange={e => setFormData({...formData, vatId: e.target.value})} placeholder="DE..." />
                            </div>
                        </div>
                     </div>
                   )}

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Biografie / Expertise</label>
                      <textarea className="w-full h-64 bg-slate-50 border-0 rounded-[2.5rem] px-10 py-8 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none resize-none transition-all text-xl" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                   </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
                   
                   {/* Left Column: Vision and Expertise */}
                   <div className="lg:col-span-8 space-y-10 min-w-0">
                      
                      {/* Detailed Bio - Only if set */}
                      {profileUser.bio ? (
                        <section>
                           <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6 md:mb-10">Unternehmens-Porträt</h3>
                           <p className="text-lg sm:text-2xl md:text-3xl text-slate-800 font-medium leading-[1.7] md:leading-[1.6] italic border-l-4 md:border-l-[6px] border-indigo-600 pl-5 md:pl-10 break-words">
                             "{profileUser.bio}"
                           </p>
                        </section>
                      ) : null}
                      
                      {/* Operational Hours - Manager exclusive and only if set */}
                      {isManager && profileUser.openingHours && Object.values(profileUser.openingHours).some(v => v && v !== '') ? (
                        <section className="bg-slate-50 p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Präsenzzeiten (Telefon & Büro)</h3>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8">
                              {DAYS.map(day => {
                                const hours = (profileUser.openingHours as any)?.[day.key];
                                if (!hours) return null;
                                return (
                                  <div key={day.key} className="flex flex-col">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{day.label}</span>
                                     <span className="text-base font-black text-slate-900 tracking-tight">{hours}</span>
                                  </div>
                                );
                              })}
                           </div>
                        </section>
                      ) : null}

                      {/* Stat Cards / Badges */}
                      <section className="grid sm:grid-cols-2 gap-8">
                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Expertise-Score</h4>
                            <div className="flex items-end gap-3">
                               <div className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">{computeProfileScore(profileUser)}%</div>
                               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Profil ausgefüllt</span>
                            </div>
                         </div>
                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Partner-Netzwerk</h4>
                            <div className="flex items-end gap-3">
                               <div className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">{profileUser.friends?.length || 0}</div>
                               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Kontakte</span>
                            </div>
                         </div>
                      </section>
                   </div>

                   {/* Right Column: Contact Details & Stats */}
                   <div className="lg:col-span-4 space-y-8 order-first lg:order-none min-w-0">
                      <div className="p-6 md:p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:bg-indigo-600 transition-all duration-500"></div>
                         
                         <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8 border-b border-slate-50 pb-5 relative z-10">Kontakt-Zentrale</h4>
                         
                         <ul className="space-y-6 relative z-10">
                            {profileUser.location ? (
                              <li className="flex items-center gap-4 group/item">
                                 <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 transition-colors group-hover/item:bg-indigo-600 group-hover/item:text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                 </div>
                                 <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Region</span>
                                    <span className="text-slate-900 font-black text-base tracking-tight truncate">{profileUser.location}</span>
                                 </div>
                              </li>
                            ) : null}

                            {profileUser.phone ? (
                              <li className="flex items-center gap-4 group/item">
                                 <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 transition-colors group-hover/item:bg-blue-600 group-hover/item:text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                 </div>
                                 <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Direktwahl</span>
                                    <span className="text-slate-900 font-black text-base tracking-tight truncate">{profileUser.phone}</span>
                                 </div>
                              </li>
                            ) : null}

                            {profileUser.email ? (
                              <li className="flex items-center gap-4 group/item">
                                <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 transition-colors group-hover/item:bg-green-600 group-hover/item:text-white">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">E-Mail</span>
                                  <a href={`mailto:${profileUser.email}`} className="block text-slate-900 font-black text-base hover:text-indigo-600 transition-colors tracking-tight truncate">{profileUser.email}</a>
                                </div>
                              </li>
                            ) : null}

                            {profileUser.website ? (
                              <li className="flex items-center gap-4 group/item">
                                 <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 transition-colors group-hover/item:bg-purple-600 group-hover/item:text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                 </div>
                                 <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Webseite</span>
                                    <a href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} target="_blank" rel="noreferrer" className="block text-slate-900 font-black text-base hover:text-indigo-600 transition-colors tracking-tight truncate">
                                      {profileUser.website.replace(/(^\w+:|^)\/\//, '')}
                                    </a>
                                 </div>
                              </li>
                            ) : null}
                         </ul>
                         
                         {/* Firmendaten Info Boxes - Conditional Rendering */}
                         {(profileUser.teamSize || profileUser.foundedYear) ? (
                           <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
                              {profileUser.teamSize ? (
                                <div className="bg-slate-50 p-6 rounded-3xl">
                                   <span className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Personal</span>
                                   <span className="text-lg font-black text-slate-900 tracking-tight">{profileUser.teamSize} Pers.</span>
                                </div>
                              ) : null}
                              {profileUser.foundedYear ? (
                                <div className="bg-slate-50 p-6 rounded-3xl">
                                   <span className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Etabliert</span>
                                   <span className="text-lg font-black text-slate-900 tracking-tight">{profileUser.foundedYear}</span>
                                </div>
                              ) : null}
                           </div>
                         ) : null}

                         {isManager && profileUser.vatId ? (
                           <div className="mt-10 pt-4 text-[9px] font-bold text-slate-200 uppercase tracking-[0.2em] relative z-10">
                             USt-ID verifiziert: {profileUser.vatId}
                           </div>
                         ) : null}
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Konto löschen (DSGVO Art. 17), nur im eigenen Profil */}
      {isOwnProfile && currentUser && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
          <div className="bg-white rounded-[2rem] border border-red-100 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">Konto löschen</h3>
              <p className="text-sm text-slate-500 font-medium max-w-xl">
                Löscht Ihr Profil und Ihre Zugangsdaten endgültig (Art. 17 DSGVO). Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <button
              onClick={() => { setDeleteError(''); setDeletePassword(''); setShowDeleteModal(true); }}
              className="shrink-0 px-8 py-4 rounded-2xl border-2 border-red-200 text-red-600 font-black uppercase text-xs tracking-widest hover:bg-red-50 hover:border-red-400 transition-all"
            >
              Konto endgültig löschen
            </button>
          </div>
        </div>
      )}

      {/* Lösch-Bestätigung */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-fade-in-up border border-white">
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 mb-3">Konto wirklich löschen?</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              Ihr Profil, Ihre Zugangsdaten und Ihre Plattform-Daten werden endgültig gelöscht.
              Zur Bestätigung geben Sie bitte Ihr Passwort ein.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder="Ihr Passwort"
              className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-red-500 transition-all font-medium mb-4"
            />
            {deleteError && (
              <p className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl mb-4">{deleteError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all disabled:opacity-60"
              >
                {deleteLoading ? 'Wird gelöscht…' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {showMsgModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
           <div className="bg-white w-full max-w-3xl rounded-[4rem] p-10 md:p-14 shadow-2xl animate-fade-in-up border border-white">
              <div className="flex items-center gap-8 mb-12">
                 <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-100">
                    {profileUser.name[0]}
                 </div>
                 <div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Anfrage an {profileUser.name}</h2>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-2">Gesichert über HausMatch Netzwerkknoten</p>
                 </div>
              </div>
              <textarea 
                className="w-full h-64 bg-slate-50 border-0 rounded-[3rem] p-10 text-black font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none mb-12 text-xl shadow-inner"
                placeholder="Wie können wir Ihnen weiterhelfen? Beschreiben Sie kurz Ihr Anliegen..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-6">
                 <button onClick={() => setShowMsgModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Abbrechen</button>
                 <button onClick={handleSendDirectMessage} className="flex-1 py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Sicher absenden</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
