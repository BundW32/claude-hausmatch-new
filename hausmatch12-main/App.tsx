
import React, { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { User, UserRole, USER_TYPE_LABELS } from './types';
import { auth, getUserProfile, logoutUser, isInviteSignInLink, completeInviteSignIn } from './services/dataService';
import { onAuthStateChanged } from 'firebase/auth';

const Wizard = lazy(() => import('./components/Wizard'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Forum = lazy(() => import('./components/Forum'));
const SearchResults = lazy(() => import('./components/SearchResults'));
const Login = lazy(() => import('./components/Login'));
const Messaging = lazy(() => import('./components/Messaging'));
const LandingHome = lazy(() => import('./components/LandingHome'));
const ForManagers = lazy(() => import('./components/ForManagers'));
const ForSeekers = lazy(() => import('./components/ForSeekers'));
const Network = lazy(() => import('./components/Network'));
const Profile = lazy(() => import('./components/Profile'));
const Ratgeber = lazy(() => import('./components/Ratgeber'));
const Kreditrechner = lazy(() => import('./components/Kreditrechner'));
const MatchingBoard = lazy(() => import('./components/MatchingBoard'));
const KIBerater = lazy(() => import('./components/KIBerater'));
const Einladung = lazy(() => import('./components/Einladung'));
const Marktplatz = lazy(() => import('./components/Marktplatz'));
import { AboutPage, BlogPage, ContactPage, LegalPage } from './components/StaticPages';
import ChatBot from './components/ChatBot';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const profile = await getUserProfile(uid);
    if (profile) {
      setUser(profile);
    } else {
      setUser({
        id: uid,
        email: auth.currentUser?.email || '',
        name: 'Nutzer',
        role: 'seeker',
        userType: 'owner',
        friends: []
      } as User);
    }
  };

  // Magic-Link aus der Einladungs-Email abschließen. Wegen HashRouter hängt Firebase
  // seine Parameter an die normale Query (?...) an – daher zentral hier behandeln.
  useEffect(() => {
    if (!isInviteSignInLink()) return;
    (async () => {
      try {
        const ok = await completeInviteSignIn();
        if (ok) {
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.hash = '#/dashboard';
        }
      } catch (e) {
        console.error('Magic-Link Login fehlgeschlagen:', e);
        window.location.hash = '#/login';
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-blue-600 bg-blue-50 shadow-inner'
      : 'text-slate-600 hover:text-slate-900';

  // Hauptlinks · gebündelte Hilfsmittel (KI-Berater, Rechner, Ratgeber) · eingeloggte Links
  const mainLinks = [
    { to: '/', label: 'Start' },
    { to: '/marktplatz', label: 'Marktplatz' },
    { to: '/network', label: 'Netzwerk' },
  ];
  const toolLinks = [
    { to: '/ki-berater', label: 'KI-Berater' },
    { to: '/kreditrechner', label: 'Rechner' },
    { to: '/ratgeber', label: 'Ratgeber' },
  ];
  const userLinks = user ? [
    { to: '/forum', label: 'Forum' },
    { to: '/messages', label: 'Postfach' },
    ...(user.role === 'manager' ? [{ to: '/dashboard', label: 'Lead-Center' }] : [])
  ] : [];
  const toolsActive = toolLinks.some(l => l.to === location.pathname);

  return (
    <nav className="fixed top-0 w-full z-50 hm-glass border-b border-slate-200/60 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-200/60 group-hover:shadow-indigo-300/80 group-hover:scale-105 transition-all">H</div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tighter text-slate-900">HausMatch</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 hidden sm:block">Immobilien-Community</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {mainLinks.map(l => (
              <Link key={l.to} to={l.to} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}

            {/* Hilfsmittel — Dropdown (öffnet bei Hover) */}
            <div className="relative group">
              <button
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  toolsActive ? 'text-blue-600 bg-blue-50 shadow-inner' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hilfsmittel
                <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
                <div className="w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col">
                  {toolLinks.map(l => (
                    <Link key={l.to} to={l.to} className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive(l.to)}`}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {userLinks.map(l => (
              <Link key={l.to} to={l.to} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}

            {!user ? (
              <div className="flex items-center gap-2 ml-3">
                <Link to="/login" className="px-5 py-2 rounded-full text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Login</Link>
                <Link to="/register" className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 hover:shadow-indigo-300/60 transition-all shadow-lg shadow-indigo-200">Registrieren</Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-100">
                <Link to="/profile" className="flex flex-col items-end group">
                  <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</span>
                  <span className="text-[9px] uppercase font-black text-blue-600 tracking-tighter">
                    {user.userType ? USER_TYPE_LABELS[user.userType] : user.role === 'manager' ? 'Hausverwaltung' : 'Eigentümer'}
                  </span>
                </Link>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Abmelden">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Burger */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menü öffnen"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl px-4 py-4 space-y-1">
          {mainLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`block px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${isActive(l.to)}`}
            >
              {l.label}
            </Link>
          ))}

          {/* Hilfsmittel-Gruppe */}
          <p className="px-4 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hilfsmittel</p>
          {toolLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`block px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${isActive(l.to)}`}
            >
              {l.label}
            </Link>
          ))}

          {userLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`block px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${isActive(l.to)}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {!user ? (
              <>
                <Link to="/login" className="w-full text-center px-4 py-3 rounded-xl border border-slate-200 text-sm font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all">Login</Link>
                <Link to="/register" className="w-full text-center px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">Registrieren</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="block px-4 py-3 rounded-xl text-sm font-black text-slate-900 hover:bg-slate-50 transition-all">
                  Profil — <span className="text-blue-600">{user.name}</span>
                  <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    {user.userType ? USER_TYPE_LABELS[user.userType] : user.role === 'manager' ? 'Hausverwaltung' : 'Eigentümer'}
                  </span>
                </Link>
                <button onClick={logout} className="w-full text-center px-4 py-3 rounded-xl border border-red-100 text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all">
                  Abmelden
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="relative bg-slate-950 text-slate-400 overflow-hidden">
      {/* Feine Gradient-Linie als oberer Abschluss */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8 mb-12 md:mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5 pr-0 md:pr-16">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-900/40">H</div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-black tracking-tighter text-white">HausMatch</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Immobilien-Community</span>
              </div>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-400 max-w-sm mb-6">
              Die Plattform für Immobilienprofis und Eigentümer in Deutschland —
              Verwaltung finden, vernetzen, Wissen teilen.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Made in Germany · DSGVO-konform
            </div>
          </div>

          {/* Link-Spalten */}
          <div className="md:col-span-2">
            <h4 className="font-black text-white uppercase text-[10px] tracking-[0.25em] mb-4 md:mb-5">Plattform</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li><Link to="/marktplatz" className="hover:text-white transition-colors">Marktplatz</Link></li>
              <li><Link to="/network" className="hover:text-white transition-colors">Netzwerk</Link></li>
              <li><Link to="/forum" className="hover:text-white transition-colors">Forum</Link></li>
              <li><Link to="/vermittlung" className="hover:text-white transition-colors">Verwalter finden</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-black text-white uppercase text-[10px] tracking-[0.25em] mb-4 md:mb-5">Hilfsmittel</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li><Link to="/ki-berater" className="hover:text-white transition-colors">KI-Berater Eddy</Link></li>
              <li><Link to="/kreditrechner" className="hover:text-white transition-colors">Kreditrechner</Link></li>
              <li><Link to="/ratgeber" className="hover:text-white transition-colors">Ratgeber</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Eddys News</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h4 className="font-black text-white uppercase text-[10px] tracking-[0.25em] mb-4 md:mb-5">Unternehmen</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li><Link to="/about" className="hover:text-white transition-colors">Über uns</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Kontakt</Link></li>
              <li><Link to="/legal/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-white transition-colors">Datenschutz</Link></li>
              <li><Link to="/legal/agb" className="hover:text-white transition-colors">AGB</Link></li>
            </ul>
          </div>
        </div>

        {/* Legal-Leiste */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-500">
            © 2026 B&W Immobilien Management UG (haftungsbeschränkt). Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-5 text-xs font-medium text-slate-500">
            <Link to="/legal/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Datenschutz</Link>
            <Link to="/legal/agb" className="hover:text-white transition-colors">AGB</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const ProtectedRoute = ({ children, allowedRoles }: React.PropsWithChildren<{ allowedRoles?: UserRole[] }>) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-300">Lädt...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-300">Lädt...</div>}>
      <div key={location.pathname} className="animate-fade-in">
      <Routes location={location}>
        <Route path="/" element={<LandingHome />} />
        <Route path="/seekers" element={<ForSeekers />} />
        <Route path="/managers" element={<ForManagers />} />
        <Route path="/ratgeber" element={<Ratgeber />} />
        <Route path="/kreditrechner" element={<Kreditrechner />} />
        <Route path="/vermittlung" element={<MatchingBoard />} />
        <Route path="/marktplatz" element={<Marktplatz />} />
        {/* Vereinter Marktplatz: alte Einzel-Links bleiben gültig und leiten dorthin um */}
        <Route path="/aufgaben" element={<Navigate to="/marktplatz" replace />} />
        <Route path="/schwarzes-brett" element={<Navigate to="/marktplatz" replace />} />
        <Route path="/ki-berater" element={
          <ProtectedRoute>
            <KIBerater />
          </ProtectedRoute>
        } />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/legal/impressum" element={<LegalPage type="impressum" />} />
        <Route path="/legal/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/legal/agb" element={<LegalPage type="agb" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login initialView="role_select" />} />
        <Route path="/einladung" element={<Einladung />} />
        <Route path="/wizard" element={<Wizard />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/network" element={<Network />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/profile/:uid" element={<Profile />} />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/forum" element={
          <ProtectedRoute>
            <Forum />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <Messaging />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </Suspense>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen pt-16 bg-slate-50 selection:bg-blue-100 selection:text-blue-900 flex flex-col">
          <Navbar />
          <div className="flex-1">
            <AppRoutes />
          </div>
          <Footer />
          <ChatBot />
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
export { AuthContext };
