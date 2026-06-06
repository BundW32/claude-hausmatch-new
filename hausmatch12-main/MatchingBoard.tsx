import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { IS_PRO_TYPE } from '../types';
import { getBadgeIcon, getBadgeTierColor } from '../services/pointsService';
import {
  collection, query, orderBy, getDocs, addDoc, serverTimestamp,
  doc, updateDoc, arrayUnion, getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { MatchRequest, MatchApplication } from '../types';

const PROPERTY_TYPES = ['WEG', 'Mietshaus', 'Gewerbe', 'Eigentumswohnung'];
const SERVICES = ['WEG-Verwaltung', 'Mietverwaltung', 'Buchhaltung', 'Reparaturmanagement', 'Hausgeldabrechnung', 'Eigentümerversammlung'];

const StatusBadge = ({ status }: { status: MatchRequest['status'] }) => {
  const map = { offen: 'bg-green-50 text-green-700 border-green-200', inBearbeitung: 'bg-blue-50 text-blue-700 border-blue-200', vergeben: 'bg-slate-100 text-slate-500 border-slate-200', archiviert: 'bg-red-50 text-red-500 border-red-200' };
  const labels = { offen: 'Offen', inBearbeitung: 'In Bearbeitung', vergeben: 'Vergeben', archiviert: 'Archiviert' };
  return <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[status]}`}>{labels[status]}</span>;
};

const MatchingBoard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwner = !user || !IS_PRO_TYPE(user.userType);
  const isPro = user && IS_PRO_TYPE(user.userType);
  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'matchRequests'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchRequest)));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return <div className="min-h-screen bg-slate-50 py-12"><div className="max-w-7xl mx-auto px-4"><h1 className="text-3xl font-black text-slate-900 mb-8">Anfragen-Board</h1>{loading ? <div>Lädt...</div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{requests.map(r => <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"><div className="font-black text-slate-900">{r.city}   {r.units} Einheiten</div><StatusBadge status={r.status} /></div>)}</div>}</div></div>;
};

export default MatchingBoard;
