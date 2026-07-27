import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser, registerUser } from '../services/dataService';
import { UserRole, UserType, USER_TYPE_LABELS } from '../types';

interface LoginProps {
  initialView?: 'login' | 'role_select' | 'register_form';
}

const PROFI_TYPES: { type: UserType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'makler',
    label: 'Immobilienmakler',
    desc: 'Kauf, Verkauf & Vermietung',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    type: 'anwalt',
    label: 'Rechtsanwalt',
    desc: 'Miet- & Immobilienrecht',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
  },
  {
    type: 'architekt',
    label: 'Architekt / Planer',
    desc: 'Planung & Bauleitung',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  },
  {
    type: 'handwerker',
    label: 'Handwerker',
    desc: 'Facility & Instandhaltung',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    type: 'gutachter',
    label: 'Gutachter',
    desc: 'Bewertung & Expertise',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    type: 'energieberater',
    label: 'Energieberater',
    desc: 'Sanierung & Effizienz',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    type: 'versicherungsmakler',
    label: 'Versicherungsmakler',
    desc: 'Gebäude-, Haftpflicht- & Mietausfall',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    type: 'sonstige_profi',
    label: 'Sonstiger Profi',
    desc: 'Andere Immobilienberufe',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

const Login: React.FC<LoginProps> = ({ initialView = 'login' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Nach erfolgreichem Login/Registrierung ggf. zu diesem Ziel zurückkehren
  // (z. B. zurück zur offenen Express-Anfrage). Sonst rollenbasierte Standardseite.
  const redirect = searchParams.get('redirect');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<'login' | 'role_select' | 'profi_type_select' | 'register_form'>(initialView);
  const [role, setRole] = useState<UserRole>('seeker');
  const [userType, setUserType] = useState<UserType>('owner');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { setError('Das Bild ist zu groß. Bitte wählen Sie ein Bild unter 1MB.'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await loginUser(email, password);
      if (redirect) navigate(redirect);
      else if (user.role === 'manager') navigate('/dashboard');
      else if (user.role === 'profi') navigate('/profile');
      else navigate('/wizard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('E-Mail oder Passwort ungültig.');
      } else {
        setError('E-Mail oder Passwort ungültig.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      setError('Bitte geben Sie Ihre Stadt an.');
      return;
    }
    if (!acceptedTerms) {
      setError('Bitte akzeptieren Sie die AGB und nehmen Sie die Datenschutzerklärung zur Kenntnis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await registerUser(email, password, name, role, avatar, bio, city.trim(), userType);
      if (redirect) navigate(redirect);
      else if (role === 'manager') navigate('/dashboard');
      else if (role === 'profi') navigate('/profile');
      else navigate('/wizard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('Diese E-Mail-Adresse wird bereits verwendet.');
      else if (err.code === 'auth/weak-password') setError('Das Passwort sollte mindestens 6 Zeichen lang sein.');
      else setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // ─── ROLE SELECT ──────────────────────────────────────────────────────────────
  if (view === 'role_select') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">HausMatch beitreten</h2>
          <p className="text-slate-500 font-medium text-lg">Wählen Sie Ihre Rolle auf der Plattform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
          {/* Eigentümer */}
          <div
            onClick={() => { setRole('seeker'); setUserType('owner'); setView('register_form'); }}
            className="group relative bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-slate-100 cursor-pointer p-10 flex flex-col items-center text-center"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-indigo-600 group-hover:text-white">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Immobilieneigentümer</h3>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">Finden Sie die perfekte Hausverwaltung für Ihr Objekt.</p>
            <div className="mt-6 flex items-center text-indigo-600 font-bold gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
              <span>Jetzt anfangen</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>

          {/* Hausverwaltung */}
          <div
            onClick={() => { setRole('manager'); setUserType('hausverwaltung'); setView('register_form'); }}
            className="group relative bg-slate-900 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-slate-800 cursor-pointer p-10 flex flex-col items-center text-center"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-indigo-500 group-hover:text-white">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-black text-white mb-2">Hausverwaltung</h3>
            <p className="text-slate-400 font-medium leading-relaxed text-sm">Gewinnen Sie neue Mandate und digitalisieren Sie Ihr Lead-Management.</p>
            <div className="mt-6 flex items-center text-indigo-400 font-bold gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
              <span>Partner werden</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>

          {/* Immobilienprofi */}
          <div
            onClick={() => { setRole('profi'); setView('profi_type_select'); }}
            className="group relative bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-pointer p-10 flex flex-col items-center text-center"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-white/30" />
            <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-white/25">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-black text-white mb-2">Immobilienprofi</h3>
            <p className="text-white/70 font-medium leading-relaxed text-sm">Handwerker, Architekt, Anwalt, Makler & weitere Fachleute.</p>
            <div className="mt-6 flex items-center text-white font-bold gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
              <span>Profil anlegen</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </div>

        <button onClick={() => setView('login')} className="mt-12 text-slate-500 hover:text-indigo-600 font-bold transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Bereits ein Konto? Zum Login
        </button>
      </div>
    );
  }

  // ─── PROFI TYPE SELECT ────────────────────────────────────────────────────────
  if (view === 'profi_type_select') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse" />
        </div>

        <div className="text-center mb-10">
          <span className="inline-block bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">Immobilienprofi</span>
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Was ist Ihr Fachgebiet?</h2>
          <p className="text-slate-500 font-medium">Wählen Sie Ihren Beruf. Sie können ihn später im Profil ändern.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl px-4 mb-10">
          {PROFI_TYPES.map(pt => (
            <button
              key={pt.type}
              onClick={() => { setUserType(pt.type); setView('register_form'); }}
              className="group bg-white rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-xl border-2 border-slate-100 hover:border-indigo-400 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                {pt.icon}
              </div>
              <span className="font-black text-slate-900 text-sm leading-tight mb-1">{pt.label}</span>
              <span className="text-[11px] text-slate-400 font-medium">{pt.desc}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setView('role_select')} className="text-slate-500 hover:text-indigo-600 font-bold transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Zurück zur Rollenauswahl
        </button>
      </div>
    );
  }

  // ─── LOGIN / REGISTER FORM ────────────────────────────────────────────────────
  const isLogin = view === 'login';
  const formTitle = isLogin
    ? 'Willkommen zurück'
    : role === 'manager'
      ? 'Verwalter-Profil erstellen'
      : role === 'profi'
        ? `${USER_TYPE_LABELS[userType]}-Profil erstellen`
        : 'Eigentümer-Profil erstellen';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className={`w-full ${!isLogin ? 'max-w-3xl' : 'max-w-lg'} bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white p-8 sm:p-12 relative animate-fade-in-up transition-all duration-700`}>
        <div className={`absolute top-0 left-0 w-full h-2 rounded-t-[2.5rem] ${isLogin ? 'bg-slate-900' : role === 'profi' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`} />

        <div className="text-center mb-10">
          {!isLogin && role === 'profi' && (
            <span className="inline-block bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              {USER_TYPE_LABELS[userType]}
            </span>
          )}
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{formTitle}</h2>
          <p className="text-slate-500 font-medium mt-2">
            {isLogin ? 'Loggen Sie sich ein, um fortzufahren' : 'Vervollständigen Sie Ihre Angaben'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-2xl flex items-center gap-3 border border-red-100">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
          {!isLogin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-3xl bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer transition-transform group-hover:scale-105" onClick={() => fileInputRef.current?.click()}>
                      {avatar ? (
                        <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      )}
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-indigo-600 shadow-xl p-2 rounded-xl text-white hover:bg-indigo-700 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-3 uppercase font-black tracking-[0.2em]">Profilbild</span>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    {role === 'profi' ? 'Name / Firma' : 'Vollständiger Name / Firma'}
                  </label>
                  <input
                    required type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Stadt / Standort <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    required type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                    placeholder="z.B. Gladbeck"
                  />
                </div>
              </div>
              <div className="space-y-6 h-full flex flex-col">
                <div className="flex-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kurzbeschreibung</label>
                  <textarea
                    value={bio} onChange={e => setBio(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 transition-all resize-none h-full min-h-[200px] font-medium"
                    placeholder={
                      role === 'manager' ? 'Z.B. Spezialisiert auf WEG-Verwaltung in Berlin...'
                      : role === 'profi' ? `Z.B. ${USER_TYPE_LABELS[userType]} mit 10 Jahren Erfahrung...`
                      : 'Z.B. Suche Verwaltung für mein Zinshaus...'
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div className={`grid ${!isLogin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-Mail-Adresse</label>
              <input
                required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                placeholder="name@beispiel.de"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Passwort</label>
              <input
                required type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                placeholder="••••••••" minLength={6}
              />
            </div>
          </div>

          {!isLogin && (
            <label className="flex items-start gap-3 cursor-pointer select-none bg-slate-50 rounded-2xl px-5 py-4 ring-1 ring-slate-200">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded accent-indigo-600 shrink-0"
              />
              <span className="text-sm text-slate-600 font-medium leading-relaxed">
                Ich akzeptiere die{' '}
                <Link to="/legal/agb" target="_blank" className="text-indigo-600 underline font-bold">AGB</Link>
                {' '}und habe die{' '}
                <Link to="/legal/privacy" target="_blank" className="text-indigo-600 underline font-bold">Datenschutzerklärung</Link>
                {' '}zur Kenntnis genommen. <span className="text-indigo-500">*</span>
              </span>
            </label>
          )}

          <button
            type="submit" disabled={loading}
            className={`w-full py-5 rounded-2xl text-white font-black uppercase text-sm tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 ${
              isLogin ? 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800'
              : role === 'profi' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-600/30'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-600/30'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Wird verarbeitet...
              </span>
            ) : isLogin ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <div className="mt-10 text-center pt-8 border-t border-slate-50">
          {isLogin ? (
            <p className="text-slate-600 font-medium">
              Noch kein Konto?{' '}
              <button onClick={() => setView('role_select')} className="font-black text-indigo-600 hover:text-indigo-500 underline decoration-2 underline-offset-4">
                Kostenlos registrieren
              </button>
            </p>
          ) : (
            <p className="text-slate-600 font-medium">
              Schon registriert?{' '}
              <button onClick={() => setView('login')} className="font-black text-indigo-600 hover:text-indigo-500 underline decoration-2 underline-offset-4">
                Zum Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
