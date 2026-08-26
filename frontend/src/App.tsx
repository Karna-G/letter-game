import AdminDashboard from './AdminDashboard'; // Added for Admin Tribunal
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Feather, PenTool, Scroll, Shield, LogOut, User, Crown, Scan, X, CheckCircle, Star, Flame, Trophy, Clock, Award, Users, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { register, login, logout, getStoredUser, getStoredToken, sendLetter, scanLetter, getActiveQuests, getMyLetters, getMyMailbox, updateLetter, deleteLetter, getUserProfile, markLetterRead, burnLetter, getLeaderboard, getMyFriends, addFriend, reportUser } from './api';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import MailmenDirectory from './components/MailmenDirectory';

// ============================================
// AESTHETIC DECORATIONS & STATIC COMPONENTS
// ============================================
// FIXED: Removed "export" to prevent the Vite White Screen crash!
const getRankFromXP = (xp: number) => {
  const ranks = [
    { name: 'Novice', req: 0, icon: '📝', desc: 'A beginner carrier learning the routes.' },
    { name: 'Courier', req: 100, icon: '🏃', desc: 'A reliable runner for standard missives.' },
    { name: 'Rider', req: 500, icon: '🐎', desc: 'Fast delivery across greater distances.' },
    { name: 'Navigator', req: 1000, icon: '🧭', desc: 'Expert pathfinder in uncharted lands.' },
    { name: 'Postmaster', req: 2500, icon: '🎩', desc: 'Oversees regional distributions.' },
    { name: 'Guild Elder', req: 5000, icon: '📜', desc: 'A venerable keeper of guild traditions.' },
    { name: 'Grandmaster', req: 10000, icon: '👑', desc: 'A legend among letter carriers.' },
    { name: 'Mythic Carrier', req: 25000, icon: '🦄', desc: 'Deliveries that defy natural law.' },
    { name: 'Realm Legend', req: 50000, icon: '✨', desc: 'A name whispered in postal mythology.' },
  ];
  let currentRank = ranks[0];
  let earnedCount = 0;
  for (const rank of ranks) {
    if (xp >= rank.req) {
      currentRank = rank;
      earnedCount++;
    }
  }
  return { currentRank, ranks, earnedCount };
};

const HierarchyBadges = ({ userXP }: { userXP?: number }) => {
  const { ranks } = getRankFromXP(userXP || 0);
  
  return (
    <div className="bg-[#FAF0E6] p-8 rounded-lg shadow-2xl border border-[#D2B48C] mt-8">
      <h3 className="text-3xl font-bold mb-6 text-[#5C3A21] italic text-center">Guild Hierarchy & Badges</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ranks.map((r, i) => {
          const earned = userXP !== undefined ? userXP >= r.req : true;
          return (
            <div key={i} className={`p-4 rounded border-2 text-center shadow transition-all ${earned ? 'bg-[#FDF5E6] border-[#D2B48C]' : 'bg-gray-100 border-gray-300 opacity-60 grayscale'}`}>
              <span className="text-4xl mb-2 block">{r.icon}</span>
              <h4 className={`font-bold text-xl ${earned ? 'text-[#8B5A2B]' : 'text-gray-500'}`}>{r.name}</h4>
              <p className={`text-sm font-semibold mb-2 ${earned ? 'text-[#5C3A21]' : 'text-gray-400'}`}>{r.req} XP</p>
              <p className="text-xs italic text-gray-600">{r.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Shorter, cleaner animation using Lucide icons!
const QuillAnimation = () => {
  return (
    <div className="relative w-full h-16 flex justify-center items-center mb-4 overflow-hidden">
      <motion.div
        initial={{ x: -20, y: 5, rotate: -15 }}
        animate={{ x: 20, y: -5, rotate: 5 }}
        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
      >
        <PenTool className="w-12 h-12 text-[#8B5A2B] drop-shadow-lg" />
      </motion.div>
    </div>
  );
};

// ============================================
// AUTH PAGE — Login & Register
// ============================================
function AuthPage({ onAuth }: { onAuth: (user: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sender');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (mode === 'register') {
        data = await register(name, email, password, role);
      } else {
        data = await login(email, password);
      }
      onAuth(data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF5E6] flex items-center justify-center p-4" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <QuillAnimation />
          <h1 className="text-4xl font-bold tracking-widest text-[#5C3A21] uppercase font-serif">The Postmaster's Guild</h1>
          <p className="text-[#8B5A2B] italic mt-2 text-lg">
            {mode === 'login' ? '"Present thy credentials, traveller."' : '"Inscribe thy name upon the rolls of the Guild."'}
          </p>
        </div>

        <div className="bg-[#FAF0E6] rounded-lg shadow-2xl border-2 border-[#D2B48C] relative overflow-hidden">
          <div className="flex border-b-2 border-[#D2B48C]">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-4 text-lg font-bold tracking-wider transition-all ${mode === 'login' ? 'bg-[#8B5A2B] text-[#FDF5E6] shadow-inner' : 'text-[#8B5A2B] hover:bg-[#F5DEB3]'}`}
            >
              Enter the Guild
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-4 text-lg font-bold tracking-wider transition-all ${mode === 'register' ? 'bg-[#8B5A2B] text-[#FDF5E6] shadow-inner' : 'text-[#8B5A2B] hover:bg-[#F5DEB3]'}`}
            >
              Join the Guild
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <label className="block text-sm font-semibold mb-1 text-[#8B5A2B] uppercase tracking-wider">Thy Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-[#8B5A2B] font-serif text-lg shadow-inner" placeholder="Sir Reginald von Quill" required />
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#8B5A2B] uppercase tracking-wider">Thy Scroll Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-[#8B5A2B] font-serif text-lg shadow-inner" placeholder="quill@postmasters.guild" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#8B5A2B] uppercase tracking-wider">Secret Passphrase</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-[#8B5A2B] font-serif text-lg shadow-inner" placeholder="••••••••" required minLength={6} />
            </div>
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <label className="block text-sm font-semibold mb-2 text-[#8B5A2B] uppercase tracking-wider">Thy Station</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'sender', label: 'Letter Writer', icon: '✍️', desc: 'Compose & send letters' },
                      { value: 'mailman', label: 'Letter Carrier', icon: '📮', desc: 'Deliver the realm\'s post' },
                    ].map((r) => (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)} className={`p-4 rounded border-2 text-left transition-all ${role === r.value ? 'border-[#8B5A2B] bg-[#8B5A2B] text-[#FDF5E6] shadow-lg' : 'border-[#D2B48C] hover:border-[#8B5A2B] bg-[#FDF5E6]'}`}>
                        <span className="text-2xl block mb-1">{r.icon}</span>
                        <span className="font-bold block">{r.label}</span>
                        <span className={`text-xs italic ${role === r.value ? 'text-[#F5DEB3]' : 'text-[#8B5A2B]'}`}>{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm italic">⚠ {error}</motion.div>}
            <button type="submit" disabled={loading} className="w-full bg-[#8B5A2B] hover:bg-[#5C3A21] disabled:bg-[#D2B48C] text-[#FDF5E6] py-4 rounded text-xl font-bold tracking-widest transition-colors shadow-lg border-2 border-[#3E2723] uppercase">
              {loading ? 'Verifying thy identity...' : mode === 'login' ? 'Unseal the Gates' : 'Inscribe & Enter'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// REACT CUSTOM CURSOR (Guaranteed to work)
// ============================================
const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hidden, setHidden] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasMouse, setHasMouse] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(any-hover: hover)').matches) {
      return;
    }
    setHasMouse(true);

    const style = document.createElement('style');
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    const mMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const clickable = target.closest('a, button, [role="button"], input, select, textarea, .cursor-pointer');
      setIsHovering(!!clickable);
    };

    const mEnter = () => setHidden(false);
    const mLeave = () => setHidden(true);

    document.addEventListener('mousemove', mMove);
    document.addEventListener('mouseenter', mEnter);
    document.addEventListener('mouseleave', mLeave);

    return () => {
      document.removeEventListener('mousemove', mMove);
      document.removeEventListener('mouseenter', mEnter);
      document.removeEventListener('mouseleave', mLeave);
      document.head.removeChild(style);
    };
  }, []);

  if (!hasMouse) return null;

  return (
    <div 
      className="pointer-events-none fixed top-0 left-0 z-[99999]"
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${isHovering ? '-15deg' : '0deg'}) scale(${isHovering ? 1.2 : 1})`,
        opacity: hidden ? 0 : 1,
        transition: 'transform 0.15s ease-out, opacity 0.2s',
        transformOrigin: 'top left'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" className="drop-shadow-xl">
        <path d="M11 7 L24 20 L20 24 L7 11 Z" fill={isHovering ? "#8B5A2B" : "#5C3A21"} stroke="#3E2723" strokeWidth="1" />
        <path d="M7 11 L11 7 L9 5 L5 9 Z" fill="#D2B48C" stroke="#3E2723" strokeWidth="1" />
        <path d="M5 9 L9 5 L0 0 Z" fill="#E5E7EB" stroke="#3E2723" strokeWidth="1" />
        <line x1="0" y1="0" x2="5" y2="5" stroke="#3E2723" strokeWidth="1" />
        <circle cx="5" cy="5" r="0.5" fill="#3E2723" />
      </svg>
    </div>
  );
};

// ============================================
// MAIN APP (shown after login)
// ============================================
function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    const token = getStoredToken();
    if (stored && token) setUser(stored);
    setAuthChecked(true);
  }, []);

  if (!authChecked) return null;
  if (!user) return (
    <>
      <CustomCursor />
      <AuthPage onAuth={(loggedInUser) => {
        // Feature: Admin Auto-Redirect
        if (loggedInUser.role === 'admin') {
          window.history.pushState({}, '', '/admin');
        }
        setUser(loggedInUser);
      }} />
    </>
  );

  return (
    <>
    <CustomCursor />
    <Router>
      <div className="min-h-screen bg-[#FDF5E6] text-[#2C1A0B] font-serif" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}>
        <nav className="flex flex-col md:flex-row justify-between items-center p-4 md:p-6 border-b-2 border-[#8B5A2B] bg-[#FDF5E6] bg-opacity-90 shadow-md">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <Feather className="w-8 h-8 text-[#8B5A2B]" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-[#5C3A21] uppercase text-center">The Postmaster's Guild</h1>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-0 md:space-x-6 text-base md:text-lg">
            
            {/* Admin Dashboard Link */}
            {user.role === 'admin' && (
              <Link to="/admin" className="flex items-center space-x-2 text-red-700 hover:text-red-900 font-bold transition-colors">
                <Shield className="w-5 h-5" /> <span>Admin Panel</span>
              </Link>
            )}

            <Link to="/" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><User className="w-5 h-5" /> <span>My Profile</span></Link>
            <Link to="/scanner" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Scan className="w-5 h-5" /> <span>Scan Wax Seal</span></Link>
            {user.role === 'mailman' && <Link to="/map" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Feather className="w-5 h-5" /> <span>Letter Map</span></Link>}
            
            {/* Fellowship Link */}
            {user.role !== 'admin' && (
              <Link to="/fellowship" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Users className="w-5 h-5" /> <span>My Fellowship</span></Link>
            )}

            <Link to="/directory" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Crown className="w-5 h-5" /> <span>Guild Roster</span></Link>
            <Link to="/leaderboard" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Trophy className="w-5 h-5" /> <span>Leaderboards</span></Link>
            <Link to="/gallery" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Scroll className="w-5 h-5" /> <span>Gallery & Stamps</span></Link>

            <div className="flex items-center space-x-3 md:ml-4 md:pl-4 border-l-0 md:border-l-2 border-[#D2B48C]">
              <div className="flex items-center space-x-2 bg-[#FAF0E6] px-3 py-1 rounded border border-[#D2B48C]">
                {user.role === 'admin' ? <Shield className="w-4 h-4 text-red-700" /> : (user.role === 'mailman' ? <Crown className="w-4 h-4 text-[#8B5A2B]" /> : <User className="w-4 h-4 text-[#8B5A2B]" />)}
                <span className="text-sm font-semibold text-[#5C3A21]">{user.name}</span>
                <span className="text-xs italic text-[#8B5A2B]">({user.role})</span>
              </div>
              <button onClick={() => { logout(); setUser(null); }} className="flex items-center space-x-1 text-[#8B5A2B] hover:text-red-700 transition-colors" title="Depart the Guild"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto p-8">
          <Routes>
            <Route path="/admin" element={user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/" element={<UserProfile user={user} />} />
            <Route path="/compose" element={<ComposeLetter />} />
            <Route path="/mailbox" element={<MyMailbox />} />
            <Route path="/sent" element={<SentLetters />} />
            <Route path="/archive" element={<LetterArchive />} />
            <Route path="/map" element={<MapTracker />} />
            <Route path="/fellowship" element={<Fellowship user={user} />} />
            <Route path="/mailman" element={user.role === 'mailman' ? <MailmanDashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/directory" element={<MailmenDirectory />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="/gallery" element={<Gallery user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
    </>
  );
}

// ============================================
// USER PROFILE (Landing Page)
// ============================================
function UserProfile({ user }: { user: any }) {
  const [liveUser, setLiveUser] = useState<any>(user);

  useEffect(() => {
    getUserProfile(user.id || user._id).then(setLiveUser).catch(() => {});
  }, []);

  const isBanned = liveUser?.restrictedUntil && new Date(liveUser.restrictedUntil) > new Date();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto space-y-8">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C] relative overflow-hidden text-center">
        <QuillAnimation />

        {/* Feature: Ban UI Banner */}
        {isBanned && (
          <div className="bg-red-700 text-white p-4 rounded shadow-inner border-2 border-red-900 mb-6 flex flex-col items-center justify-center animate-pulse">
            <span className="font-bold text-lg tracking-widest uppercase flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              Guild Sanction Imposed
              <Flame className="w-6 h-6 text-orange-400" />
            </span>
            <span className="mt-2 text-red-100 italic">
              Thou art forbidden from sending missives until: <br/>
              <strong className="text-white bg-red-800 px-3 py-1 rounded mt-2 inline-block shadow">
                {new Date(liveUser.restrictedUntil).toLocaleString()}
              </strong>
            </span>
          </div>
        )}

        <h2 className="text-4xl font-bold text-[#5C3A21] italic mb-2">Welcome back, <span className="text-[#8B5A2B]">{user.name}</span></h2>
        <p className="text-[#D2B48C] text-lg mt-1 italic mb-4">May thy quill be sharp and thy ink plentiful.</p>

        {user.role !== 'mailman' && (
          <div className="inline-flex items-center gap-2 bg-[#FDF5E6] border-2 border-[#D2B48C] px-4 py-2 rounded-full shadow mb-4">
            <Award className="w-5 h-5 text-[#8B5A2B]" />
            <span className="text-[#5C3A21] font-bold">Reputation: {liveUser?.reputationScore ?? 0}</span>
            <span className="text-xs italic text-[#8B5A2B]">• {liveUser?.lettersSent ?? 0} letters sent</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          
          {/* Feature: Ban UI Lock */}
          {isBanned ? (
            <div className="w-full bg-gray-300 text-gray-500 p-4 rounded text-lg font-bold tracking-wider shadow-inner border border-gray-400 flex flex-col items-center justify-center text-center cursor-not-allowed opacity-70">
              <span className="text-3xl mb-2">🔒</span>
              Compose Locked
            </div>
          ) : (
            <Link to="/compose" className="w-full bg-[#8B5A2B] hover:bg-[#5C3A21] text-[#FDF5E6] p-4 rounded text-lg font-bold tracking-wider transition-colors shadow-lg border border-[#3E2723] flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">✍️</span>
              Compose Thy Epistle
            </Link>
          )}

          <Link to="/mailbox" className="w-full bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B] p-4 rounded text-lg font-bold tracking-wider transition-colors shadow border-2 border-[#D2B48C] flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">📬</span>
            Thy Mailbox
          </Link>
          <Link to="/sent" className="w-full bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B] p-4 rounded text-lg font-bold tracking-wider transition-colors shadow border-2 border-[#D2B48C] flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">🕊️</span>
            Thy Dispatched Missives
          </Link>
          <Link to="/fellowship" className="w-full bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B] p-4 rounded text-lg font-bold tracking-wider transition-colors shadow border-2 border-[#D2B48C] flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">🤝</span>
            My Fellowship
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// COMPOSE LETTER
// ============================================
function ComposeLetter() {
  const [receiverRef, setReceiverRef] = useState('');
  const [content, setContent] = useState('');
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdQR, setCreatedQR] = useState('');
  const [error, setError] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState('');
  
  const [liveUser, setLiveUser] = useState<any>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const u = getStoredUser();
    if (u) getUserProfile(u.id || u._id).then(setLiveUser).catch(() => {});

    if (location.state?.draft) {
      const draft = location.state.draft;
      setContent(draft.content || '');
      if (draft.receiverRef && typeof draft.receiverRef === 'object') {
        setReceiverRef(draft.receiverRef.name || '');
      } else {
        setReceiverRef(draft.receiverRef || '');
      }
      setBurnAfterReading(!!draft.burnAfterReading);
      setCurrentDraftId(draft._id);
    }
  }, [location]);

  const isBanned = liveUser?.restrictedUntil && new Date(liveUser.restrictedUntil) > new Date();

  const handleSend = async () => {
    if (!content.trim()) { setError('The missive cannot be empty.'); return; }
    setLoading(true); setError('');
    try {
      let res;
      if (currentDraftId) {
        res = await updateLetter(currentDraftId, receiverRef, content, 'pending', burnAfterReading);
      } else {
        res = await sendLetter(receiverRef, content, 'standard', 'pending', burnAfterReading);
      }
      setCreatedQR(res.qrCodeToken);
    } catch (e: any) {
      setError(e.message || 'Failed to dispatch letter');
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) { setError('Cannot save an empty draft.'); return; }
    setLoading(true); setError('');
    try {
      if (currentDraftId) {
        await updateLetter(currentDraftId, receiverRef, content, 'draft', burnAfterReading);
      } else {
        const res = await sendLetter(receiverRef, content, 'standard', 'draft', burnAfterReading);
        setCurrentDraftId(res._id);
      }
      setError('Draft saved successfully!');
      setTimeout(() => navigate('/sent'), 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleQRClose = () => {
    setCreatedQR('');
    navigate('/sent');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#8B5A2B] m-4 opacity-50"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#8B5A2B] m-4 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#8B5A2B] m-4 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#8B5A2B] m-4 opacity-50"></div>

        {/* Ban UI Protection */}
        {isBanned && (
          <div className="bg-red-700 text-white p-4 rounded shadow-inner border-2 border-red-900 mb-6 text-center">
            <span className="font-bold text-lg uppercase flex items-center justify-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" /> Guild Sanction Active <Flame className="w-6 h-6 text-orange-400" />
            </span>
            <p className="mt-2 text-red-100 italic">
              Thy parchment and quill have been confiscated until {new Date(liveUser.restrictedUntil).toLocaleString()}
            </p>
          </div>
        )}

        <h2 className="text-4xl font-bold text-center mb-8 text-[#5C3A21] italic">Compose Thine Epistle</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#8B5A2B]">To Whom It May Concern (User ID / Email / Open):</label>
            <input 
              type="text" 
              value={receiverRef} 
              onChange={(e) => setReceiverRef(e.target.value)} 
              disabled={isBanned}
              className={`w-full p-2 focus:outline-none focus:border-[#8B5A2B] text-xl font-serif italic border-b-2 border-[#D2B48C] ${isBanned ? 'bg-gray-300 opacity-50 cursor-not-allowed' : 'bg-transparent'}`} 
              placeholder="Recipient's Name or Address (Optional)" 
            />
          </div>
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#8B5A2B]">The Missive:</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              rows={6} 
              disabled={isBanned}
              className={`w-full border-2 border-[#D2B48C] p-4 rounded focus:outline-none focus:border-[#8B5A2B] text-lg font-serif resize-none shadow-inner ${isBanned ? 'bg-gray-300 opacity-50 cursor-not-allowed' : 'bg-[#FDF5E6]'}`} 
              placeholder="Write thy words of wisdom..."
            ></textarea>
          </div>
          <label className={`flex items-center gap-3 border-2 border-[#D2B48C] p-3 rounded ${isBanned ? 'bg-gray-300 opacity-50 cursor-not-allowed' : 'bg-[#FDF5E6] cursor-pointer'}`}>
            <input type="checkbox" checked={burnAfterReading} disabled={isBanned} onChange={(e) => setBurnAfterReading(e.target.checked)} className="w-5 h-5 accent-[#8B5A2B]" />
            <Flame className="w-5 h-5 text-red-700" />
            <span className="text-[#5C3A21] font-semibold">Burn After Reading — the ink fades to ash 60 seconds after the receiver opens it</span>
          </label>
          {error && <p className={`font-bold italic ${error.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>{error}</p>}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-6 gap-4">
            <div className="flex items-center space-x-2 text-[#8B5A2B]"><Shield className="w-5 h-5" /><span className="text-sm font-semibold">Wax Seal Required</span></div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto space-y-3 sm:space-y-0 sm:space-x-4">
              <button onClick={handleSaveDraft} disabled={loading || isBanned} className={`w-full sm:w-auto px-6 py-3 rounded text-lg font-bold tracking-wider transition-colors shadow border-2 border-[#D2B48C] ${isBanned ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B]'}`}>
                {loading && !createdQR ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={handleSend} disabled={loading || isBanned} className={`w-full sm:w-auto px-8 py-3 rounded text-lg font-bold tracking-wider transition-colors shadow-lg border border-[#3E2723] ${isBanned ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-[#8B5A2B] hover:bg-[#5C3A21] text-[#FDF5E6]'}`}>
                {loading && createdQR ? 'Sealing...' : 'Seal & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {createdQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-[#8B5A2B] text-center shadow-2xl">
              <button onClick={handleQRClose} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
              <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">Letter Sealed!</h3>
              <p className="text-[#8B5A2B] italic mb-6">Present this Wax Seal (QR Code) to a Mailman for pickup.</p>
              <div className="flex justify-center p-4 bg-white border-2 border-[#D2B48C] rounded mb-4 inline-block">
                <QRCodeCanvas value={createdQR} size={250} fgColor="#5C3A21" />
              </div>
              <p className="font-mono text-sm text-[#8B5A2B] bg-[#FDF5E6] p-2 rounded border border-[#D2B48C]">{createdQR}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// LETTER ARCHIVE (Feature #12)
// ============================================
function LetterArchive() {
  const [letters, setLetters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [inbox, outbox] = await Promise.all([getMyMailbox(), getMyLetters()]);
        
        const markedInbox = inbox.map((l: any) => ({ ...l, direction: 'incoming' }));
        const markedOutbox = outbox.map((l: any) => ({ ...l, direction: 'outgoing' }));
        
        const merged = [...markedInbox, ...markedOutbox];
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLetters(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredLetters = letters.filter(l => 
    l.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.senderRef?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.receiverRef?.name || l.receiverRef)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-6xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-bold text-[#5C3A21] italic mb-2">The Grand Archive</h2>
            <p className="text-[#8B5A2B] italic">A chronicle of all missives sent, received, and drafted.</p>
          </div>
          <Link to="/" className="text-[#8B5A2B] hover:text-[#5C3A21] font-bold border-2 border-[#D2B48C] px-4 py-2 rounded">← Back to Profile</Link>
        </div>
        
        <div className="mb-8">
          <input 
            type="text" 
            placeholder="Search the archive by name, words, or status..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-4 rounded focus:outline-none focus:border-[#8B5A2B] text-xl font-serif italic shadow-inner"
          />
        </div>

        {loading ? (
          <p className="text-center text-[#8B5A2B] italic py-12 text-xl">Dusting off the ancient tomes...</p>
        ) : filteredLetters.length === 0 ? (
          <p className="text-center text-[#8B5A2B] italic py-12 text-xl">No records found matching thy query in the archives.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLetters.map((l: any, i) => (
              <div key={i} className="bg-[#FDF5E6] p-6 rounded-lg border-2 border-[#D2B48C] flex flex-col justify-between shadow-lg relative overflow-hidden transition-transform hover:-translate-y-1">
                <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg ${l.direction === 'incoming' ? 'bg-[#5C3A21]' : 'bg-[#8B5A2B]'}`}>
                  {l.direction === 'incoming' ? 'INCOMING' : (l.status === 'draft' ? 'DRAFT' : 'OUTGOING')}
                </div>
                <div>
                  <div className="mb-4 pt-4 border-b border-[#D2B48C] pb-2">
                    <p className="font-bold text-[#5C3A21] text-lg">
                      {l.direction === 'incoming' ? `From: ${l.senderRef?.name || 'Unknown'}` : `To: ${l.receiverRef?.name || l.receiverRef || 'Unknown'}`}
                    </p>
                    <p className="text-xs italic text-[#8B5A2B] mt-1">{new Date(l.createdAt).toLocaleDateString()} • Status: {l.status}</p>
                  </div>
                  <div className="text-md font-serif text-[#3E2723] whitespace-pre-wrap line-clamp-6">
                    {l.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// MY MAILBOX (Inbox)
// ============================================
// ============================================
// MY MAILBOX (Inbox)
// ============================================
function MyMailbox() {
  const [myMailbox, setMyMailbox] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [openLetter, setOpenLetter] = useState<any>(null); 
  const [fadeProgress, setFadeProgress] = useState(0); 
  const [reportingUser, setReportingUser] = useState<any>(null); 
  const burnTimerRef = React.useRef<number | null>(null); 
  const BURN_WINDOW_MS = 60000;

  const fetchMyMailbox = async () => { 
    try { 
      const data = await getMyMailbox(); 
      setMyMailbox(data); 
    } catch (e) {} 
  };
  
  useEffect(() => { 
    fetchMyMailbox(); 
    return () => { if (burnTimerRef.current) window.clearInterval(burnTimerRef.current); }; 
  }, []);

  const startFadeTimer = (letterId: string, readAtMs: number) => {
    if (burnTimerRef.current) window.clearInterval(burnTimerRef.current);
    burnTimerRef.current = window.setInterval(async () => {
      const progress = Math.min(1, (Date.now() - readAtMs) / BURN_WINDOW_MS); 
      setFadeProgress(progress);
      if (progress >= 1) { 
        if (burnTimerRef.current) window.clearInterval(burnTimerRef.current); 
        try { await burnLetter(letterId); } catch (e) {} 
        setOpenLetter(null); 
        fetchMyMailbox(); 
      }
    }, 400);
  };

  const openLetterView = async (letter: any) => {
    setOpenLetter(letter); 
    setFadeProgress(0);
    if (letter.burnAfterReading && letter.status === 'delivered') { 
      try { 
        const updated = await markLetterRead(letter._id); 
        startFadeTimer(letter._id, new Date(updated.firstReadAt).getTime()); 
      } catch (e) { 
        setOpenLetter(null); 
        fetchMyMailbox(); 
      } 
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <div className="flex items-center justify-between mb-6"><h2 className="text-3xl font-bold text-[#5C3A21] italic">Thy Mailbox</h2><Link to="/" className="text-[#8B5A2B] hover:text-[#5C3A21] font-bold">← Back to Profile</Link></div>
        <div className="mb-6"><input type="text" placeholder="Search missives by sender or content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-[#8B5A2B] text-lg font-serif italic shadow-inner" /></div>
        {myMailbox.length === 0 ? <p className="text-center text-[#8B5A2B] italic py-8">Thy mailbox is currently empty.</p> : (
          <div className="space-y-4">
            {myMailbox.filter(l => l.content?.toLowerCase().includes(searchQuery.toLowerCase()) || l.senderRef?.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((l: any, i) => {
              
              // FIX: Safely check for ANY admin name regardless of what is typed after it!
              const senderNameStr = l.senderRef?.name || '';
              const isFromAdmin = l.senderRef?.role === 'admin' || senderNameStr.toLowerCase().includes('guild master') || senderNameStr.toLowerCase().includes('admin');
              const displaySender = isFromAdmin ? 'The Guild Master' : (senderNameStr || 'Unknown');

              return (
              <div key={i} className="bg-[#FDF5E6] p-4 rounded border border-[#D2B48C]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="font-bold text-[#5C3A21] flex items-center flex-wrap gap-2">
                      Letter from {displaySender} 
                      {l.burnAfterReading && <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-300 px-2 py-0.5 rounded-full"><Flame className="w-3 h-3" /> Burns after reading</span>}
                    </p>
                    <p className="text-sm italic text-[#8B5A2B]">{l.status === 'burned' ? 'This letter has burned to ash' : `Received on: ${new Date(l.deliveredAt).toLocaleDateString()}`}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* FIX: Prevent reporting an Admin! */}
                    {l.senderRef && l.status !== 'burned' && !isFromAdmin && <button onClick={() => setReportingUser(l.senderRef)} className="px-3 py-2 bg-red-100 text-red-800 rounded text-sm font-bold shadow hover:bg-red-200 whitespace-nowrap flex items-center gap-1 border border-red-300"><AlertTriangle className="w-4 h-4"/> Report</button>}
                    {l.status !== 'burned' && <button onClick={() => openLetterView(l)} className="px-4 py-2 bg-[#8B5A2B] text-white rounded text-sm font-bold shadow hover:bg-[#5C3A21] whitespace-nowrap flex-1 sm:flex-none">Open Missive</button>}
                  </div>
                </div>
                {l.status === 'burned' && <div className="mt-3 p-4 bg-black bg-opacity-5 border-2 border-dashed border-gray-400 rounded text-center italic text-gray-500 flex items-center justify-center gap-2"><Flame className="w-5 h-5 text-orange-400" /> {l.content}</div>}
              </div>
            )})}
          </div>
        )}
      </div>

      <AnimatePresence>
        {openLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-lg w-full relative border-4 border-[#8B5A2B] shadow-2xl">
              <button onClick={() => { setOpenLetter(null); fetchMyMailbox(); }} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
              <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">
                Letter from {(openLetter.senderRef?.role === 'admin' || (openLetter.senderRef?.name || '').toLowerCase().includes('guild master') || (openLetter.senderRef?.name || '').toLowerCase().includes('admin')) ? 'The Guild Master' : (openLetter.senderRef?.name || 'Unknown')}
              </h3>
              {openLetter.burnAfterReading && <p className="text-red-700 text-sm italic mb-4 flex items-center gap-1"><Flame className="w-4 h-4" /> This missive is burning as thou readeth — {Math.max(0, Math.ceil(60 * (1 - fadeProgress)))}s remain.</p>}
              <motion.div animate={{ opacity: openLetter.burnAfterReading ? 1 - fadeProgress : 1 }} className="p-4 bg-white border-2 border-[#D2B48C] rounded text-lg font-serif whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto">{openLetter.content}</motion.div>
              {openLetter.burnAfterReading && <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden"><div className="bg-orange-500 h-2 transition-all" style={{ width: `${fadeProgress * 100}%` }} /></div>}
            </div>
          </motion.div>
        )}
        {reportingUser && <ReportModal reportedUser={reportingUser} onClose={() => setReportingUser(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
// ============================================
// REAL-TIME DISPATCH TRACKING (Feature 6)
// ============================================
function DispatchTimeline({ letter, onClose }: { letter: any; onClose: () => void }) {
  const stages = [
    { key: 'drafted', label: 'Drafted', time: letter.createdAt },
    { key: 'sealed', label: 'Sealed & Dispatched', time: letter.sealedAt },
    { key: 'transit', label: 'In-Transit', time: letter.pickedUpAt },
    { key: 'delivered', label: 'Delivered', time: letter.deliveredAt },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-[#8B5A2B] shadow-2xl">
        <button onClick={onClose} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
        <h3 className="text-2xl font-bold text-[#5C3A21] mb-6 font-serif flex items-center gap-2"><Clock className="w-6 h-6" /> Thy Letter's Journey</h3>
        <div className="space-y-4">
          {stages.map((s, i) => (
            <div key={s.key} className="flex items-start gap-3 relative">
              {i < stages.length - 1 && <div className={`absolute left-[7px] top-5 w-0.5 h-8 ${s.time ? 'bg-[#8B5A2B]' : 'bg-[#D2B48C]'}`} />}
              <div className={`w-4 h-4 rounded-full mt-1 border-2 flex-shrink-0 ${s.time ? 'bg-[#8B5A2B] border-[#5C3A21]' : 'bg-transparent border-[#D2B48C]'}`} />
              <div>
                <p className={`font-bold ${s.time ? 'text-[#5C3A21]' : 'text-gray-400'}`}>{s.label}</p>
                <p className="text-xs italic text-[#8B5A2B]">{s.time ? new Date(s.time).toLocaleString() : 'Awaiting...'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// SENT LETTERS (Outbox)
// ============================================
function SentLetters() {
  const [myLetters, setMyLetters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdQR, setCreatedQR] = useState('');
  const [trackingLetter, setTrackingLetter] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyLetters();
  }, []);

  const fetchMyLetters = async () => {
    try {
      const data = await getMyLetters();
      setMyLetters(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (!window.confirm("Are you sure you wish to burn this draft?")) return;
    setLoading(true);
    try {
      await deleteLetter(id);
      fetchMyLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to delete draft');
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = (letter: any) => {
    navigate('/compose', { state: { draft: letter } });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-[#5C3A21] italic">Thy Dispatched Missives</h2>
          <Link to="/" className="text-[#8B5A2B] hover:text-[#5C3A21] font-bold">← Back to Profile</Link>
        </div>
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search dispatched missives by recipient or content..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-[#8B5A2B] text-lg font-serif italic shadow-inner"
          />
        </div>
        {myLetters.length === 0 ? (
          <p className="text-center text-[#8B5A2B] italic py-8">Thou hast sent no letters yet.</p>
        ) : (
          <div className="space-y-4">
            {myLetters.filter(l => 
              l.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (l.receiverRef?.name || l.receiverRef)?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((l: any, i) => (
              <div key={i} className="bg-[#FDF5E6] p-4 rounded border border-[#D2B48C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto">
                  <p className="font-bold text-[#5C3A21]">
                    {l.status === 'draft' ? 'Draft to ' : 'Sent Letter to '}
                    {l.receiverRef?.name || l.receiverRef || 'Unknown'}
                  </p>
                  <p className="text-sm italic text-[#8B5A2B] truncate w-full">Status: {l.status} {l.qrCodeToken ? `| Token: ${l.qrCodeToken.substring(0, 8)}...` : ''}</p>
                </div>
                <div className="flex w-full sm:w-auto flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {l.status === 'draft' && (
                    <>
                      <button onClick={() => loadDraft(l)} className="w-full sm:w-auto px-4 py-2 bg-[#FAF0E6] text-[#8B5A2B] border border-[#D2B48C] rounded shadow hover:bg-[#FDF5E6]">Edit</button>
                      <button onClick={() => handleDeleteDraft(l._id)} disabled={loading} className="w-full sm:w-auto px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded shadow hover:bg-red-200">Burn</button>
                    </>
                  )}
                  {l.status === 'pending' && (
                    <button onClick={() => setCreatedQR(l.qrCodeToken)} className="w-full sm:w-auto px-4 py-2 bg-[#8B5A2B] text-[#FDF5E6] rounded shadow hover:bg-[#5C3A21]">Show QR</button>
                  )}
                  {l.status !== 'draft' && (
                    <button onClick={() => setTrackingLetter(l)} className="w-full sm:w-auto px-4 py-2 bg-[#FAF0E6] text-[#8B5A2B] border border-[#D2B48C] rounded shadow hover:bg-[#FDF5E6] flex items-center justify-center gap-1"><Clock className="w-4 h-4" /> Track</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {createdQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-[#8B5A2B] text-center shadow-2xl">
              <button onClick={() => setCreatedQR('')} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
              <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">Delivery Wax Seal</h3>
              <p className="text-[#8B5A2B] italic mb-6">Present this to the Receiver so they may scan and read the letter.</p>
              <div className="flex justify-center p-4 bg-white border-2 border-[#D2B48C] rounded mb-4 inline-block">
                <QRCodeCanvas value={createdQR} size={250} fgColor="#5C3A21" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trackingLetter && <DispatchTimeline letter={trackingLetter} onClose={() => setTrackingLetter(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// MAILMAN DASHBOARD (role-gated)
// ============================================
function MailmanDashboard({ user }: { user: any }) {
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQR, setSelectedQR] = useState<{ token: string, receiverName: string } | null>(null);
  const [showBadges, setShowBadges] = useState(false);
  const [liveUser, setLiveUser] = useState<any>(user);

  useEffect(() => {
    fetchQuests();
    fetchLiveUser();
  }, []);

  const fetchLiveUser = async () => {
    try {
      const data = await getUserProfile(user.id || user._id);
      setLiveUser(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuests = async () => {
    try {
      const data = await getActiveQuests();
      setQuests(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeizeMissive = async (token: string) => {
    try {
      const res = await scanLetter(token);
      alert(res.message || 'Missive seized successfully!');
      fetchQuests();
      fetchLiveUser();
    } catch (e: any) {
      alert(e.message || 'Error seizing missive');
    }
  };

  const xp = liveUser.xp || 0;
  const deliveries = liveUser.deliveriesCompleted || 0;
  const { currentRank, earnedCount } = getRankFromXP(xp);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto space-y-8">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <h2 className="text-4xl font-bold text-center mb-2 text-[#5C3A21] italic">The Postmaster's Registry</h2>
        <p className="text-center text-[#8B5A2B] italic mb-8">Carrier: {user.name} • Rank: {currentRank.name} • XP: {xp}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:border-r-2 border-[#D2B48C] md:pr-8">
            <h3 className="text-2xl font-bold text-[#8B5A2B] mb-4">Thy Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#FDF5E6] p-3 rounded border border-[#D2B48C]"><span className="text-[#5C3A21] font-semibold">Deliveries Completed</span><span className="text-[#8B5A2B] font-bold text-xl">{deliveries}</span></div>
              <div className="flex justify-between items-center bg-[#FDF5E6] p-3 rounded border border-[#D2B48C]"><span className="text-[#5C3A21] font-semibold">Experience (XP)</span><span className="text-[#8B5A2B] font-bold text-xl">{xp}</span></div>
              <div className="flex justify-between items-center bg-[#FDF5E6] p-3 rounded border border-[#D2B48C]">
                <span className="text-[#5C3A21] font-semibold">Badges Earned</span>
                <div className="flex items-center gap-4">
                  <span className="text-[#8B5A2B] font-bold text-xl">{earnedCount}</span>
                  <button onClick={() => setShowBadges(!showBadges)} className="bg-[#8B5A2B] text-white px-3 py-1 rounded text-sm shadow hover:bg-[#5C3A21]">
                    {showBadges ? 'Hide Badges' : 'Thy Badges'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[#8B5A2B] mb-4">Thy Deliveries</h3>
            <div className="bg-[#FDF5E6] p-6 rounded border border-[#D2B48C] shadow-inner mb-4 text-center">
              {quests.length === 0 ? (
                <>
                  <Star className="w-8 h-8 mx-auto text-[#D2B48C] mb-2" />
                  <p className="text-[#8B5A2B] italic">No active deliveries at this time.</p>
                  <p className="text-sm text-[#D2B48C] mt-1">Await thy summons, brave carrier.</p>
                </>
              ) : (
                <div className="space-y-3 text-left">
                  {quests.map((q, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-[#D2B48C] rounded gap-3">
                      <div className="w-full sm:w-auto">
                        <p className="font-bold text-[#5C3A21]">Deliver to {q.receiverRef?.name || 'Unknown'}</p>
                        <p className="text-xs italic text-[#8B5A2B]">From: {q.senderRef?.name}</p>
                      </div>
                      {(q.receiverRef?._id === user.id || q.receiverRef === user.id) ? (
                        <button onClick={() => handleSeizeMissive(q.qrCodeToken)} className="w-full sm:w-auto bg-[#8B5A2B] text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-[#5C3A21]">Seize Missive</button>
                      ) : (
                        <button onClick={() => setSelectedQR({ token: q.qrCodeToken, receiverName: q.receiverRef?.name || 'Unknown' })} className="w-full sm:w-auto bg-[#8B5A2B] text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-[#5C3A21]">Show QR</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBadges && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <HierarchyBadges userXP={xp} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {selectedQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-[#8B5A2B] text-center shadow-2xl">
              <button onClick={() => setSelectedQR(null)} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
              <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">Delivery Wax Seal</h3>
              <p className="text-[#8B5A2B] italic mb-2 text-lg font-bold">For: {selectedQR.receiverName}</p>
              <p className="text-[#8B5A2B] italic mb-6">Present this to the Receiver so they may scan and read the letter.</p>
              <div className="flex justify-center p-4 bg-white border-2 border-[#D2B48C] rounded mb-4 inline-block">
                <QRCodeCanvas value={selectedQR.token} size={250} fgColor="#5C3A21" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// GUILD LEADERBOARDS (Feature 11)
// ============================================
function Leaderboard() {
  const [data, setData] = useState<{ mailmanOfTheMonth: any; topMailmen: any[]; topSenders: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center p-8 text-[#5C3A21] animate-pulse">Consulting the Guild Ledger...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-[#5C3A21] italic flex items-center justify-center gap-3"><Trophy className="w-9 h-9" /> Guild Leaderboards</h2>
        <p className="text-[#8B5A2B] italic mt-2">Public appreciation for the realm's finest carriers and correspondents.</p>
      </div>

      {data?.mailmanOfTheMonth && (
        <div className="bg-gradient-to-br from-[#F5DEB3] to-[#FAF0E6] p-8 rounded-lg shadow-2xl border-4 border-[#8B5A2B] text-center">
          <Crown className="w-12 h-12 mx-auto text-[#8B5A2B] mb-2" />
          <p className="uppercase tracking-widest text-sm text-[#8B5A2B] font-bold">Mailman of the Month</p>
          <h3 className="text-3xl font-bold text-[#5C3A21] mt-1">{data.mailmanOfTheMonth.name}</h3>
          <p className="italic text-[#8B5A2B] mt-1">{data.mailmanOfTheMonth.rank} • {data.mailmanOfTheMonth.xp} XP • {data.mailmanOfTheMonth.deliveriesCompleted} deliveries</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#FAF0E6] p-6 rounded-lg shadow-xl border border-[#D2B48C]">
          <h4 className="text-xl font-bold text-[#5C3A21] mb-4 flex items-center gap-2"><Feather className="w-5 h-5" /> Top Mailmen (by XP)</h4>
          <div className="space-y-2">
            {(data?.topMailmen ?? []).length === 0 && <p className="italic text-[#8B5A2B] text-sm">No mailmen have earned XP yet.</p>}
            {(data?.topMailmen ?? []).map((m: any, i: number) => (
              <div key={m._id} className="flex items-center justify-between bg-[#FDF5E6] px-4 py-2 rounded border border-[#D2B48C]">
                <span className="font-bold text-[#5C3A21]">#{i + 1} {m.name}</span>
                <span className="text-sm text-[#8B5A2B] font-semibold">{m.xp} XP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#FAF0E6] p-6 rounded-lg shadow-xl border border-[#D2B48C]">
          <h4 className="text-xl font-bold text-[#5C3A21] mb-4 flex items-center gap-2"><Award className="w-5 h-5" /> Top Senders (by Reputation)</h4>
          <div className="space-y-2">
            {(data?.topSenders ?? []).length === 0 && <p className="italic text-[#8B5A2B] text-sm">No senders have earned reputation yet.</p>}
            {(data?.topSenders ?? []).map((s: any, i: number) => (
              <div key={s._id} className="flex items-center justify-between bg-[#FDF5E6] px-4 py-2 rounded border border-[#D2B48C]">
                <span className="font-bold text-[#5C3A21]">#{i + 1} {s.name}</span>
                <span className="text-sm text-[#8B5A2B] font-semibold">{s.reputationScore} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// QR SCANNER
// ============================================
function QRScanner() {
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      setScannerError('');
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }
      setCameraActive(true);
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!loading) {
            handleScan(decodedText);
          }
        },
        (_errorMessage) => {
          // parse errors are normal (no QR found yet)
        }
      );
    } catch (err: any) {
      setCameraActive(false);
      setScannerError(`Camera error: ${err.message || err}`);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setCameraActive(false);
      } catch (e) {
        console.error("Error stopping camera", e);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleScan = async (text: string) => {
    if (!text || loading) return;
    setLoading(true);
    setResult(text);
    await stopCamera();
    try {
      const res = await scanLetter(text);
      setMessage(res.message || 'Scan successful!');
      setTimeout(() => navigate('/'), 3000);
    } catch (e: any) {
      setMessage(e.message || 'Invalid Wax Seal');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <h2 className="text-3xl font-bold mb-6 text-[#5C3A21] italic">Scan Wax Seal (QR Code)</h2>

      {message ? (
        <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border-4 border-[#8B5A2B] flex flex-col items-center justify-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600" />
          <h3 className="text-2xl font-bold text-[#5C3A21]">{message}</h3>
          <p className="text-[#8B5A2B] italic">Redirecting to thy desk...</p>
        </div>
      ) : (
        <div className="bg-[#FAF0E6] p-4 rounded-lg shadow-2xl border-4 border-[#8B5A2B] relative overflow-hidden flex flex-col justify-center items-center">
          {scannerError ? (
            <div className="p-8 text-center bg-red-50 border border-red-200 rounded">
              <h3 className="text-red-700 font-bold mb-2">Camera Access Failed</h3>
              <p className="text-red-600 mb-4">{scannerError}</p>
              <button onClick={startCamera} className="mt-4 bg-[#8B5A2B] text-white px-6 py-2 rounded font-bold">Try Again</button>
            </div>
          ) : !cameraActive && (
            <div className="p-12 flex flex-col items-center space-y-4">
              <Scan className="w-16 h-16 text-[#8B5A2B]" />
              <p className="text-[#8B5A2B] italic">Tap the button below to activate thy magical lens.</p>
              <button onClick={startCamera} className="bg-[#8B5A2B] hover:bg-[#5C3A21] text-[#FDF5E6] px-8 py-3 rounded text-lg font-bold tracking-wider transition-colors shadow-lg">
                Activate Camera
              </button>
            </div>
          )}

          <div className="w-full">
            <div id="reader" className="w-full bg-black rounded overflow-hidden"></div>
            {cameraActive && (
              <button onClick={stopCamera} className="mt-4 bg-red-600 text-white px-6 py-2 rounded font-bold shadow w-full">Stop Camera</button>
            )}
          </div>
        </div>
      )}

      {/* Manual Fallback for testing on Desktop without webcam */}
      <div className="bg-[#FDF5E6] p-6 rounded border border-[#D2B48C] shadow-inner mt-8">
        <h4 className="font-bold text-[#5C3A21] mb-2">Manual Token Entry (For Sages without magical lenses)</h4>
        <div className="flex space-x-2">
          <input type="text" value={result} onChange={(e) => setResult(e.target.value)} placeholder="Enter QR Token ID..." className="flex-1 p-3 border-2 border-[#D2B48C] rounded font-mono text-sm focus:border-[#8B5A2B] bg-white" />
          <button onClick={() => handleScan(result)} disabled={loading} className="bg-[#8B5A2B] text-[#FDF5E6] px-6 py-3 rounded font-bold shadow hover:bg-[#5C3A21]">Submit</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAP TRACKER & GALLERY (Unchanged)
// ============================================
function MapTracker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [letters, setLetters] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const user = getStoredUser();
  const PICKUP_RADIUS = 500;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setError("Could not locate thee. Please allow location access.")
    );
  }, []);

  useEffect(() => {
    if (!position) return;
    fetch(`/api/letters/nearby?lat=${position[0]}&lng=${position[1]}&radius=${PICKUP_RADIUS}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('postmaster_token')}` }
    })
      .then(r => r.json())
      .then(setLetters)
      .catch(() => {});
  }, [position]);

  const claimLetter = async (letter: any) => {
    try {
      const res = await scanLetter(letter.qrCodeToken);
      alert(res.message || 'Letter claimed!');
      if (position) {
        fetch(`/api/letters/nearby?lat=${position[0]}&lng=${position[1]}&radius=${PICKUP_RADIUS}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('postmaster_token')}` }
        }).then(r => r.json()).then(setLetters);
      }
    } catch (e: any) {
      alert(e.message || 'Could not claim letter.');
    }
  };

  // Fix Leaflet marker icon bug with Vite
  useEffect(() => {
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="bg-[#FAF0E6] p-6 rounded-lg shadow-2xl border border-[#D2B48C]">
      <h2 className="text-3xl font-bold text-center mb-2 text-[#5C3A21] italic">The Mailman's Journey</h2>
      <p className="text-center text-[#8B5A2B] italic mb-6">Letters awaiting collection within {PICKUP_RADIUS}m of thy position.</p>

      {error && <p className="text-center text-red-700 italic mb-4">{error}</p>}
      {!position && !error && <p className="text-center text-[#8B5A2B] italic mb-4">Locating thee upon the realm...</p>}

      {position && (
        <>
          <div className="h-[600px] w-full rounded-lg overflow-hidden border-4 border-[#8B5A2B] shadow-inner relative">
            <MapContainer center={position} zoom={15} scrollWheelZoom={true} className="h-full w-full">
              <TileLayer
                url={`https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=${import.meta.env.VITE_STADIA_KEY}`}
                attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
              />
              {/* Your position */}
              <Marker position={position}>
                <Popup>
                  <div className="font-serif text-[#5C3A21] text-center">
                    <strong>Thou art here</strong>
                  </div>
                </Popup>
              </Marker>
              {/* Pickup radius circle - import Circle from react-leaflet at top */}
              <Circle
                center={position}
                radius={PICKUP_RADIUS}
                pathOptions={{ color: '#92400e', fillColor: '#D2B48C', fillOpacity: 0.15 }}
              />
              {/* Nearby letter pins */}
              {letters.map((letter: any) => (
                letter.senderLocation?.lat && (
                  <Marker key={letter._id} position={[letter.senderLocation.lat, letter.senderLocation.lng]}>
                    <Popup>
                      <div className="font-serif text-[#5C3A21]">
                        <p><strong>Letter awaits</strong></p>
                        <p>From: {letter.senderRef?.name || 'Unknown'}</p>
                        {letter.receiverRef && <p>To: {letter.receiverRef?.name || 'Unknown'}</p>}
                        {user?.role === 'mailman' && (
                          <button
                            onClick={() => claimLetter(letter)}
                            style={{ marginTop: 8, padding: '4px 12px', background: '#92400e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'serif' }}
                          >
                            Claim this missive
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>

          {letters.length > 0 && (
            <div className="mt-4 p-4 bg-[#FDF5E6] border border-[#D2B48C] rounded">
              <p className="font-bold text-[#5C3A21]">{letters.length} letter{letters.length !== 1 ? 's' : ''} awaiting collection nearby</p>
            </div>
          )}
          {letters.length === 0 && (
            <p className="text-center text-[#8B5A2B] italic mt-4">No letters await collection in thy vicinity.</p>
          )}
        </>
      )}
    </motion.div>
  );
}

function Gallery({ user }: { user: any }) {
  const [liveUser, setLiveUser] = useState<any>(user);

  useEffect(() => {
    getUserProfile(user.id || user._id).then(setLiveUser).catch(() => {});
  }, []);

  // Feature 8: Sender Reputation Score — a free stamp unlocks for every letter dispatched
  const unlockedCount = Math.min(30, liveUser?.lettersSent || 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <h2 className="text-4xl font-bold text-center mb-2 text-[#5C3A21] italic">The Royal Stamp Gallery</h2>
        <p className="text-center text-[#8B5A2B] italic mb-2">Collect stamps from thy travels across the realm.</p>
        {user?.role !== 'mailman' && (
          <p className="text-center text-sm mb-8 text-[#5C3A21] font-semibold flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-[#8B5A2B]" /> Reputation: {liveUser?.reputationScore ?? 0} • {unlockedCount}/30 stamps unlocked
          </p>
        )}
        {user?.role === 'mailman' && <div className="mb-8" />}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'Novice Seal', desc: 'First letter sent', emoji: '📜', earned: false },
            { name: 'Swift Courier', desc: '10 deliveries made', emoji: '🏇', earned: false },
            { name: 'Royal Decree', desc: 'Endorsed by the Crown', emoji: '👑', earned: false },
            { name: 'Night Owl', desc: 'Delivery after midnight', emoji: '🦉', earned: false },
            { name: 'Storm Rider', desc: 'Delivered in the rain', emoji: '⚡', earned: false },
            { name: 'Phantom Post', desc: 'Received a Dibbyuk letter', emoji: '👻', earned: false },
            { name: 'Pigeon Friend', desc: 'Used the bird network', emoji: '🕊️', earned: false },
            { name: 'Dragon Scaled', desc: 'Survive extreme heat', emoji: '🐉', earned: false },
            { name: 'Ocean Bottle', desc: 'Sent a message in a bottle', emoji: '🍾', earned: false },
            { name: 'Time Traveler', desc: 'Sent a time capsule', emoji: '⏳', earned: false },
            { name: 'Secret Keeper', desc: 'Sent an encrypted missive', emoji: '🗝️', earned: false },
            { name: 'Wax Master', desc: 'Used 5 different wax colors', emoji: '🕯️', earned: false },
            { name: 'Guild Initiate', desc: 'Joined the postmaster guild', emoji: '🤝', earned: false },
            { name: 'Mountain Climber', desc: 'Delivered to high altitudes', emoji: '⛰️', earned: false },
            { name: 'Desert Nomad', desc: 'Crossed the arid dunes', emoji: '🐪', earned: false },
            { name: 'Frost Walker', desc: 'Delivered in snowstorms', emoji: '❄️', earned: false },
            { name: 'Iron Horse', desc: 'Used the steam train', emoji: '🚂', earned: false },
            { name: 'Sea Captain', desc: 'Delivered via ship', emoji: '⛵', earned: false },
            { name: 'Star Gazer', desc: 'Nighttime delivery expert', emoji: '✨', earned: false },
            { name: 'Sun Bringer', desc: 'First delivery of the dawn', emoji: '🌅', earned: false },
            { name: 'Forest Ranger', desc: 'Navigated the deep woods', emoji: '🌲', earned: false },
            { name: 'City Dweller', desc: '100 urban deliveries', emoji: '🏙️', earned: false },
            { name: 'Rural Charm', desc: '100 countryside deliveries', emoji: '🏡', earned: false },
            { name: 'Speed Demon', desc: 'Delivered under 1 hour', emoji: '⚡', earned: false },
            { name: 'Heavy Load', desc: 'Delivered a large parcel', emoji: '📦', earned: false },
            { name: 'Featherweight', desc: 'Carried a single feather', emoji: '🪶', earned: false },
            { name: 'Ink Stained', desc: 'Wrote 50 letters', emoji: '🖋️', earned: false },
            { name: 'Parchment Hoarder', desc: 'Collected 100 letters', emoji: '📚', earned: false },
            { name: 'Golden Compass', desc: 'Perfect navigation score', emoji: '🧭', earned: false },
            { name: 'Mythic Carrier', desc: 'Legendary status achieved', emoji: '🦄', earned: false }
          ].map((stamp, i) => {
            const earned = i < unlockedCount;
            return (
              <motion.div key={i} whileHover={{ scale: 1.05, rotate: 2 }} className={`p-4 rounded-lg border-2 text-center transition-all ${earned ? 'border-[#8B5A2B] bg-[#FDF5E6] shadow-lg' : 'border-[#D2B48C] bg-[#FAF0E6] opacity-50'}`}>
                <span className="text-3xl block mb-2">{stamp.emoji}</span>
                <p className="font-bold text-[#5C3A21] text-sm leading-tight">{stamp.name}</p>
                <p className="text-[10px] italic text-[#8B5A2B] mt-1 leading-tight">{stamp.desc}</p>
                {!earned && <p className="text-[10px] font-bold text-[#D2B48C] mt-2">🔒 LOCKED</p>}
              </motion.div>
            );
          })}
        </div>
      </div>
      {user?.role !== 'mailman' && <HierarchyBadges />}
    </motion.div>
  );
}


// ============================================
// REPORT MODAL (Shared Component)
// ============================================
function ReportModal({ reportedUser, onClose }: { reportedUser: any, onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setStatus('submitting');
    try {
      await reportUser(reportedUser._id || reportedUser.id, reason);
      setStatus('success');
      setTimeout(onClose, 2500);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Failed to submit report.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-red-800 shadow-2xl">
        <button onClick={onClose} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-red-700"><X className="w-8 h-8" /></button>
        <h3 className="text-2xl font-bold text-red-800 mb-2 font-serif flex items-center gap-2"><AlertTriangle className="w-6 h-6"/> Report Traveller</h3>
        <p className="text-[#5C3A21] font-bold mb-4">Reporting: {reportedUser.name}</p>
        
        {status === 'success' ? (
          <div className="p-4 bg-green-100 border border-green-400 text-green-800 rounded text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2"/>
            <p className="font-bold">Report Filed</p>
            <p className="text-sm italic">The Guild Tribunal has been notified.</p>
          </div>
        ) : (
          <>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              rows={4} 
              className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-red-700 text-sm font-serif resize-none shadow-inner mb-4" 
              placeholder="Detail the transgressions of this individual here..."
            ></textarea>
            {status === 'error' && <p className="text-red-600 font-bold text-sm mb-2">{errorMsg}</p>}
            <button onClick={handleSubmit} disabled={status === 'submitting'} className="w-full bg-red-800 hover:bg-red-900 text-white px-4 py-3 rounded font-bold shadow transition-colors">
              {status === 'submitting' ? 'Filing Report...' : 'Submit to Tribunal'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// FRIEND SCANNER MODAL (New Phase 2)
// ============================================
function FriendScannerModal({ onClose, onScan }: { onClose: () => void, onScan: (code: string) => void }) {
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode("friend-reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().then(() => onScan(decodedText)).catch(console.error);
            } else { onScan(decodedText); }
          },
          () => {}
        );
      } catch (err: any) { setError('Camera failed to start. Ensure permissions are granted.'); }
    };
    startScanner();
    return () => { if (scannerRef.current && scannerRef.current.isScanning) { scannerRef.current.stop().catch(console.error); } };
  }, [onScan]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-[#8B5A2B] text-center shadow-2xl">
        <button onClick={onClose} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
        <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">Scan Friend's Seal</h3>
        <p className="text-[#8B5A2B] italic mb-6">Align thy magical lens with their QR Code to forge a bond.</p>
        {error && <p className="text-red-600 font-bold mb-4">{error}</p>}
        <div className="w-full bg-black rounded overflow-hidden"><div id="friend-reader" className="w-full h-[250px]"></div></div>
      </div>
    </motion.div>
  );
}

// ============================================
// FELLOWSHIP / FRIENDS SYSTEM (New Phase 2)
// ============================================
function Fellowship({ user }: { user: any }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportingUser, setReportingUser] = useState<any>(null); // For Report Modal
  const [showMyQR, setShowMyQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const fetchFriends = async () => {
    try {
      const data = await getMyFriends();
      setFriends(data);
    } catch (e) {
      console.error("Failed to fetch friends:", e);
    }
  };

  useEffect(() => { fetchFriends(); }, []);

  const handleAddFriend = async (codeToUse?: string) => {
    const code = codeToUse || friendCode;
    if (!code.trim()) { setError('Pray tell, what is the scroll address or ID?'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await addFriend(code);
      setSuccess('Friendship forged! Ye are now bound mutually.');
      setFriendCode('');
      fetchFriends(); // Refresh list
    } catch (e: any) {
      setError(e.message || 'Failed to add friend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto space-y-8">
      
      {/* Search & Add Friend Block */}
      <div className="bg-[#FAF0E6] p-8 rounded-lg shadow-2xl border border-[#D2B48C]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-[#5C3A21] italic flex items-center gap-3"><Users className="w-8 h-8"/> Expand Thy Fellowship</h2>
          <Link to="/" className="text-[#8B5A2B] hover:text-[#5C3A21] font-bold">← Back to Profile</Link>
        </div>
        <p className="text-[#8B5A2B] italic mb-6">Enter a traveller's Scroll Address (email) or their secret MongoDB ID Code to forge a bond.</p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={friendCode} 
            onChange={(e) => setFriendCode(e.target.value)} 
            placeholder="e.g. friend@bracu.edu OR 64a7b..." 
            className="flex-1 bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-[#8B5A2B] text-lg font-serif shadow-inner"
          />
          <button onClick={() => handleAddFriend()} disabled={loading} className="bg-[#8B5A2B] hover:bg-[#5C3A21] text-[#FDF5E6] px-8 py-3 rounded text-lg font-bold tracking-wider shadow-lg border border-[#3E2723] whitespace-nowrap">
            {loading ? 'Searching...' : 'Add Friend'}
          </button>
          
          <button onClick={() => setShowScanner(true)} className="bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B] px-6 py-3 rounded text-lg font-bold tracking-wider shadow border-2 border-[#D2B48C] flex items-center justify-center gap-2 whitespace-nowrap">
            <Scan className="w-5 h-5"/> Scan QR
          </button>
        </div>
        
        {error && <p className="text-red-600 font-bold mt-3 text-sm italic">⚠ {error}</p>}
        {success && <p className="text-green-700 font-bold mt-3 text-sm italic"><CheckCircle className="w-4 h-4 inline mr-1"/>{success}</p>}
        
        <div className="mt-6 pt-6 border-t-2 border-dashed border-[#D2B48C]">
          <p className="text-sm font-bold text-[#5C3A21] mb-2">Thy Secret Identification Code:</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="bg-[#FDF5E6] p-3 rounded border border-[#D2B48C] flex-1 flex justify-between items-center select-all cursor-pointer shadow-inner">
              <span className="font-mono text-[#8B5A2B]">{user.id || user._id}</span>
              <span className="text-xs text-[#D2B48C] font-sans uppercase font-bold tracking-widest hidden sm:inline">Share to connect</span>
            </div>
            <button onClick={() => setShowMyQR(true)} className="bg-[#8B5A2B] hover:bg-[#5C3A21] text-white px-6 py-3 rounded font-bold shadow transition-colors whitespace-nowrap">
              Show My QR
            </button>
          </div>
        </div>
      </div>

      {/* Friends List Block */}
      <div className="bg-[#FAF0E6] p-8 rounded-lg shadow-2xl border border-[#D2B48C]">
        <h3 className="text-2xl font-bold text-[#5C3A21] mb-6 italic">Thy Current Companions</h3>
        
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-[#D2B48C] mx-auto mb-4 opacity-50"/>
            <p className="text-[#8B5A2B] italic">Thy fellowship is currently empty.</p>
            <p className="text-sm text-[#D2B48C] mt-2">The realm is vast; go forth and meet fellow travellers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friends.map((f: any) => (
              <div key={f._id} className="bg-[#FDF5E6] p-4 rounded-lg border-2 border-[#D2B48C] shadow flex flex-col justify-between">
                <div>
                  <h4 className="text-xl font-bold text-[#5C3A21]">{f.name}</h4>
                  <p className="text-sm italic text-[#8B5A2B] mb-2">{f.email}</p>
                  <div className="flex gap-2 mb-4">
                    <span className="text-xs bg-[#FAF0E6] border border-[#D2B48C] px-2 py-1 rounded text-[#5C3A21] font-bold uppercase tracking-wider">{f.role}</span>
                    <span className="text-xs bg-yellow-50 border border-yellow-200 px-2 py-1 rounded text-yellow-800 font-bold flex items-center gap-1"><Award className="w-3 h-3"/> Rep: {f.reputationScore || 0}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto border-t border-[#D2B48C] pt-3">
                  <Link to="/compose" state={{ draft: { receiverRef: f.name } }} className="flex-1 text-center bg-[#8B5A2B] hover:bg-[#5C3A21] text-white px-3 py-2 rounded text-sm font-bold shadow transition-colors">Send Letter</Link>
                  {/* FIX: Catch ANY admin name to hide report button! */}
               {f.role !== 'admin' && !(f.name || '').toLowerCase().includes('guild master') && !(f.name || '').toLowerCase().includes('admin') && (
                 <button onClick={() => setReportingUser(f)} className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded text-sm font-bold shadow flex items-center gap-1 justify-center" title="Report this traveller to the Guild"><AlertTriangle className="w-4 h-4"/></button>
               )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMyQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-sm w-full relative border-4 border-[#8B5A2B] text-center shadow-2xl">
              <button onClick={() => setShowMyQR(false)} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
              <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">Thy Friendship Seal</h3>
              <p className="text-[#8B5A2B] italic mb-6">Let another traveller scan this to forge a bond.</p>
              <div className="flex justify-center p-4 bg-white border-2 border-[#D2B48C] rounded mb-4 inline-block">
                <QRCodeCanvas value={user.id || user._id} size={200} fgColor="#5C3A21" />
              </div>
            </div>
          </motion.div>
        )}
        
        {showScanner && (
          <FriendScannerModal 
            onClose={() => setShowScanner(false)} 
            onScan={(code) => { setShowScanner(false); handleAddFriend(code); }} 
          />
        )}

        {reportingUser && <ReportModal reportedUser={reportingUser} onClose={() => setReportingUser(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

export default App;