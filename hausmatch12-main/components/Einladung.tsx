import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sendInviteSignInLink } from '../services/dataService';
import { resolveGewerk } from '../services/gewerke';

// Landing-Seite aus der Einladungs-Email für noch NICHT registrierte Profis.
// Der Profi fordert hier einen passwortlosen Magic-Link an. Nach dem Klick auf
// den Link wird er eingeloggt, sein Profil (mit dem passenden Gewerk) angelegt und
// der Lead erscheint im Lead Center (Abschluss passiert zentral in App.tsx).
const Einladung: React.FC = () => {
  const [params] = useSearchParams();
  const email = (params.get('email') || '').trim();
  const city = (params.get('city') || '').trim();
  const company = (params.get('company') || '').trim();
  const gewerk = resolveGewerk(params.get('type'));

  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email) { setError('Diese Einladung enthält keine gültige E-Mail-Adresse.'); setStatus('error'); return; }
    setStatus('sending');
    setError('');
    try {
      await sendInviteSignInLink(email, city, company, gewerk.key);
      setStatus('sent');
    } catch (err: any) {
      console.error('sendInviteSignInLink error:', err);
      setError('Der Login-Link konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 px-8 py-7">
          <div className="text-2xl font-black text-white tracking-tight">Haus<span className="text-blue-200">Match</span></div>
        </div>

        <div className="p-8">
          {status === 'sent' ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Login-Link unterwegs</h1>
              <p className="text-slate-500 leading-relaxed">
                Wir haben einen passwortlosen Anmelde-Link an{' '}
                <strong className="text-slate-700">{email}</strong> geschickt. Öffnen Sie die E-Mail
                und klicken Sie auf den Link — danach liegt die Anfrage{city ? ` aus ${city}` : ''} direkt
                in Ihrem Lead Center.
              </p>
            </>
          ) : (
            <>
              <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-wide">
                Neue Anfrage für Sie
              </span>
              <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Ein Eigentümer{city ? ` in ${city}` : ''} sucht {gewerk.akk}
              </h1>
              <p className="text-slate-500 leading-relaxed mb-6">
                {company ? <><strong className="text-slate-700">{company}</strong>, über </> : 'Über '}
                HausMatch wartet eine Angebotsanfrage auf Sie. Melden Sie sich kostenlos und passwortlos
                an, um die vollständigen Details zu sehen und ein Angebot abzugeben.
              </p>

              {email && (
                <div className="bg-slate-50 rounded-2xl px-5 py-4 mb-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ihre E-Mail</div>
                  <div className="font-semibold text-slate-800">{email}</div>
                </div>
              )}

              {status === 'error' && (
                <p className="text-red-600 text-sm font-medium mb-4">{error}</p>
              )}

              <button
                onClick={handleSend}
                disabled={status === 'sending'}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Wird gesendet …' : 'Anmelde-Link anfordern'}
              </button>
              <p className="text-xs text-slate-400 text-center mt-4">
                Sie erhalten eine E-Mail mit einem sicheren Anmelde-Link. Kein Passwort nötig.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Einladung;
