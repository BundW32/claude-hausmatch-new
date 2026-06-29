
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

  const navLinks = [
    { to: '/', label: 'Start' },
    { to: '/vermittlung', label: 'Verwalter finden' },
    { to: '/marktplatz', label: 'Marktplatz' },
    { to: '/network', label: 'Netzwerk' },
    { to: '/ratgeber', label: 'Ratgeber' },
    { to: '/kreditrechner', label: 'Rechner' },
    { to: '/ki-berater', label: 'KI-Berater' },
    ...(user ? [
      { to: '/forum', label: 'Forum' },
      { to: '/messages', label: 'Postfach' },
      ...(user.role === 'manager' ? [{ to: '/dashboard', label: 'Lead-Center' }] : [])
    ] : [])
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">H</div>
            <span className="text-xl font-black tracking-tighter text-slate-900">HausMatch</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}

            {!user ? (
              <div className="flex items-center gap-2 ml-3">
                <Link to="/login" className="px-5 py-2 rounded-full text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Login</Link>
                <Link to="/register" className="px-5 py-2 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Registrieren</Link>
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
          {navLinks.map(l => (
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
    <footer className="bg-white border-t border-slate-100 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div>
          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 md:mb-4">HausMatch</h4>
          <ul className="space-y-2 text-sm text-slate-500 font-medium">
            <li><Link to="/about" className="hover:text-blue-600">Über uns</Link></li>
            <li><Link to="/blog" className="hover:text-blue-600">Blog</Link></li>
            <li><Link to="/ratgeber" className="hover:text-blue-600">Ratgeber</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 md:mb-4">Tools</h4>
          <ul className="space-y-2 text-sm text-slate-500 font-medium">
            <li><Link to="/kreditrechner" className="hover:text-blue-600">Kreditrechner</Link></li>
            <li><Link to="/ki-berater" className="hover:text-blue-600">KI-Berater Eddy</Link></li>
            <li><Link to="/marktplatz" className="hover:text-blue-600">Marktplatz</Link></li>
            <li><Link to="/network" className="hover:text-blue-600">Netzwerk</Link></li>
            <li><Link to="/forum" className="hover:text-blue-600">Forum</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 md:mb-4">Rechtliches</h4>
          <ul className="space-y-2 text-sm text-slate-500 font-medium">
            <li><Link to="/legal/impressum" className="hover:text-blue-600">Impressum</Link></li>
            <li><Link to="/legal/privacy" className="hover:text-blue-600">Datenschutz</Link></li>
            <li><Link to="/legal/agb" className="hover:text-blue-600">AGB</Link></li>
          </ul>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-black text-xs">H</div>
            <span className="font-black text-slate-900 text-sm">HausMatch</span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Die Community für Immobilienprofis und Eigentümer in Deutschland.
            © 2026 B&W Immobilien Management UG (haftungsbeschränkt).
          </p>
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
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-300">Lädt...</div>}>
      <Routes>
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
