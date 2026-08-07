import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Feather, PenTool, Scroll, Shield, LogOut, User, Crown, Scan, X, CheckCircle, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { register, login, logout, getStoredUser, getStoredToken, sendLetter, scanLetter, getActiveQuests, getMyLetters, getMyMailbox, updateLetter, deleteLetter } from './api';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import MailmenDirectory from './components/MailmenDirectory';

// ============================================
// AESTHETIC DECORATIONS & STATIC COMPONENTS
// ============================================
const HierarchyBadges = () => {
  const ranks = [
    { name: 'Novice', req: '0 XP', icon: '📝', desc: 'A beginner carrier learning the routes.' },
    { name: 'Courier', req: '100 XP', icon: '🏃', desc: 'A reliable runner for standard missives.' },
    { name: 'Rider', req: '500 XP', icon: '🐎', desc: 'Fast delivery across greater distances.' },
    { name: 'Postmaster', req: '1000 XP', icon: '🎩', desc: 'Oversees regional distributions.' },
    { name: 'Guild Master', req: '5000 XP', icon: '👑', desc: 'A legend among letter carriers.' },
  ];
  return (
    <div className="bg-[#FAF0E6] p-8 rounded-lg shadow-2xl border border-[#D2B48C] mt-8">
      <h3 className="text-3xl font-bold mb-6 text-[#5C3A21] italic text-center">Guild Hierarchy & Badges</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ranks.map((r, i) => (
          <div key={i} className="bg-[#FDF5E6] p-4 rounded border-2 border-[#D2B48C] text-center shadow">
            <span className="text-4xl mb-2 block">{r.icon}</span>
            <h4 className="font-bold text-[#8B5A2B] text-xl">{r.name}</h4>
            <p className="text-sm font-semibold text-[#5C3A21] mb-2">{r.req}</p>
            <p className="text-xs italic text-gray-600">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuillAnimation = () => {
  return (
    <div className="relative w-full h-16 flex justify-center items-center mb-4 overflow-hidden">
      <motion.svg
        width="200"
        height="60"
        viewBox="0 0 200 60"
        className="text-[#8B5A2B] opacity-70"
      >
        <motion.path
          d="M44.43 47.39L44.43 47.39Q44.05 47.39 44.05 46.77L44.05 46.77Q44.05 45.90 44.74 44.30Q45.44 42.69 46.74 40.29L46.74 40.29L50.10 34Q47.02 36.64 42.51 38.75L42.51 38.75Q39.63 40.14 36.42 41.01Q33.20 41.87 30.22 41.87L30.22 41.87Q25.04 41.87 22.16 39.47Q19.28 37.07 19.28 33.14L19.28 33.14Q19.28 25.79 28.16 18.21L28.16 18.21Q30.32 16.38 33.06 14.75Q35.79 13.12 38.82 11.90Q41.84 10.67 44.86 9.98Q47.89 9.28 50.58 9.28L50.58 9.28Q52.83 9.28 54.82 9.90Q56.82 10.53 58.09 11.70Q59.36 12.88 59.36 14.61L59.36 14.61Q59.36 16.05 58.40 17.44Q57.44 18.83 55.93 19.94Q54.42 21.04 52.66 21.71Q50.91 22.38 49.28 22.38L49.28 22.38Q44.91 22.38 44.82 17.68L44.82 17.68Q44.72 15.28 45.63 15.28L45.63 15.28Q46.45 15.28 46.26 17.34L46.26 17.34Q45.78 21.28 49.57 21.28L49.57 21.28Q50.86 21.28 52.35 20.80Q53.84 20.32 55.11 19.46Q56.38 18.59 57.20 17.54Q58.02 16.48 58.02 15.33L58.02 15.33Q58.02 13.89 56.98 13Q55.95 12.11 54.34 11.68Q52.74 11.25 50.91 11.25L50.91 11.25Q47.02 11.25 43.09 12.47Q39.15 13.70 35.50 15.88Q31.86 18.06 28.88 20.94L28.88 20.94Q22.02 27.66 22.02 33.28L22.02 33.28Q22.02 36.64 24.54 38.63Q27.06 40.62 31.14 40.62L31.14 40.62Q34.40 40.62 37.81 39.38Q41.22 38.13 44.29 36.35L44.29 36.35Q50.53 32.85 53.65 28.91L53.65 28.91L55.04 26.85Q54.42 26.85 52.62 26.99Q50.82 27.14 47.74 27.38L47.74 27.38Q44.53 27.62 42.68 27.83Q40.83 28.05 40.35 28.14L40.35 28.14Q39.78 28.29 39.20 28.29L39.20 28.29Q37.62 28.29 37.62 27.52L37.62 27.52Q37.62 26.32 41.84 25.41L41.84 25.41Q43.33 25.07 46.45 24.90Q49.57 24.74 54.32 24.74L54.32 24.74Q62.29 24.74 65.07 25.41L65.07 25.41Q65.50 25.46 65.50 25.65L65.50 25.65Q65.50 26.13 62.19 26.42L62.19 26.42L59.84 26.61Q58.50 26.75 57.97 26.75L57.97 26.75Q53.07 33.14 45.30 46.62L45.30 46.62Q44.86 47.39 44.43 47.39ZM62 40.53L62 40.53Q59.84 40.53 59.84 37.79L59.84 37.79Q59.84 36.74 60.49 35.27Q61.14 33.81 62.34 32.18L62.34 32.18Q62.34 32.18 61.47 32.99Q60.61 33.81 59.50 35.06L59.50 35.06Q59.31 35.25 59.02 35.25L59.02 35.25Q58.83 35.25 58.83 35.01L58.83 35.01Q58.83 34.77 59.26 34.19L59.26 34.19L65.89 26.42Q67.14 24.98 68.62 24.98L68.62 24.98Q69.73 24.98 69.73 25.84L69.73 25.84Q69.73 26.18 69.44 26.46L69.44 26.46Q68.53 27.33 67.21 28.91Q65.89 30.50 64.64 32.32Q63.39 34.14 62.55 35.80Q61.71 37.46 61.71 38.46L61.71 38.46Q61.71 39.33 62.29 39.33L62.29 39.33Q62.62 39.33 63.34 39.06Q64.06 38.80 65.26 37.96Q66.46 37.12 68.14 35.34L68.14 35.34Q68.43 35.06 69.68 33.62Q70.93 32.18 73.04 29.49L73.04 29.49Q76.78 24.83 77.94 24.83L77.94 24.83Q79.52 24.83 79.66 26.13L79.66 26.13Q79.76 26.56 77.65 28.96L77.65 28.96Q74.91 32.27 73.90 33.71L73.90 33.71Q72.03 36.45 72.03 37.98L72.03 37.98Q72.03 39.04 72.75 39.04L72.75 39.04Q73.47 39.04 74.60 38.34Q75.73 37.65 76.98 36.57Q78.22 35.49 79.40 34.31Q80.58 33.14 81.44 32.13L81.44 32.13Q81.73 31.79 82.02 31.79L82.02 31.79Q82.30 31.79 82.30 32.08L82.30 32.08Q82.30 32.18 82.26 32.37Q82.21 32.56 81.97 32.80L81.97 32.80Q81.20 33.66 80 34.94Q78.80 36.21 77.41 37.46Q76.02 38.70 74.72 39.52Q73.42 40.34 72.51 40.34L72.51 40.34Q71.41 40.34 70.59 39.74Q69.78 39.14 69.78 38.08L69.78 38.08Q69.78 37.02 70.11 35.94Q70.45 34.86 70.64 34.10L70.64 34.10Q68.38 36.74 66.68 38.13Q64.98 39.52 63.82 40.02Q62.67 40.53 62 40.53ZM90.75 23.49L90.75 23.49Q89.94 23.49 89.34 22.96Q88.74 22.43 88.74 21.76L88.74 21.76Q88.74 20.42 90.56 20.42L90.56 20.42Q91.23 20.42 91.90 20.87Q92.58 21.33 92.58 22L92.58 22Q92.58 22.58 91.95 23.03Q91.33 23.49 90.75 23.49ZM81.87 40.53L81.87 40.53Q80.82 40.53 80.12 39.83Q79.42 39.14 79.42 37.36L79.42 37.36Q79.42 36.35 79.88 35.03Q80.34 33.71 81.03 32.37Q81.73 31.02 82.40 29.97L82.40 29.97Q85.09 25.60 86.82 25.55L86.82 25.55Q87.25 25.55 87.87 25.91Q88.50 26.27 88.50 26.70L88.50 26.70Q88.50 26.70 84.85 31.41L84.85 31.41Q81.25 36.06 81.25 38.03L81.25 38.03Q81.25 39.57 82.45 39.57L82.45 39.57Q83.22 39.57 84.44 38.92Q85.66 38.27 87.01 37.26Q88.35 36.26 89.58 35.10Q90.80 33.95 91.57 32.99L91.57 32.99Q92.05 32.37 92.41 32.13Q92.77 31.89 92.86 31.89L92.86 31.89Q93.06 31.89 93.06 32.18L93.06 32.18Q93.06 32.42 92.50 33.14Q91.95 33.86 90.99 34.82L90.99 34.82Q89.84 35.97 88.45 37.31Q87.06 38.66 85.42 39.59Q83.79 40.53 81.87 40.53ZM94.64 40.10L94.64 40.10Q93.25 40.10 92.05 39.40Q90.85 38.70 90.85 37.07L90.85 37.07Q90.85 34.82 92.46 31.70Q94.06 28.58 96.13 25.22L96.13 25.22Q101.74 16.10 104.10 16.10L104.10 16.10Q104.58 16.10 105.08 16.46Q105.58 16.82 105.63 17.25L105.63 17.25L102.27 21.76Q100.30 24.40 98.72 26.63Q97.14 28.86 95.98 30.64L95.98 30.64Q95.41 31.55 94.69 32.70Q93.97 33.86 93.42 35.08Q92.86 36.30 92.86 37.55L92.86 37.55Q92.86 38.13 93.20 38.58Q93.54 39.04 94.40 39.04L94.40 39.04Q95.94 39.04 98.43 37.38Q100.93 35.73 103.38 32.80L103.38 32.80Q103.62 32.51 103.90 32.27Q104.19 32.03 104.38 32.03L104.38 32.03Q104.62 32.03 104.62 32.32L104.62 32.32Q104.62 32.46 104.31 32.87Q104 33.28 103.81 33.52L103.81 33.52L102.66 34.82Q101.70 35.87 100.38 37.12Q99.06 38.37 97.59 39.23Q96.13 40.10 94.64 40.10ZM105.87 40.24L105.87 40.24Q104.43 40.24 103.42 39.45Q102.42 38.66 102.27 37.50L102.27 37.50Q102.08 35.97 102.73 34.41Q103.38 32.85 104.50 31.41Q105.63 29.97 106.93 28.72L106.93 28.72Q112.02 23.63 116.10 23.63L116.10 23.63Q117.49 23.63 117.97 24.35L117.97 24.35Q118.16 24.59 118.40 25.46L118.40 25.46Q123.78 16.72 125.89 16.72L125.89 16.72Q126.37 16.72 126.90 16.96Q127.42 17.20 127.42 17.58L127.42 17.58Q127.42 17.82 127.18 18.21L127.18 18.21Q125.74 19.98 124.30 21.74Q122.86 23.49 121.47 25.26L121.47 25.26Q119.12 28.24 117.68 30.45Q116.24 32.66 115.62 34.19L115.62 34.19Q115.42 34.67 115.26 35.37Q115.09 36.06 115.09 36.78L115.09 36.78Q115.09 37.70 115.47 38.37Q115.86 39.04 116.86 39.04L116.86 39.04Q118.45 39.04 120.75 37.50Q123.06 35.97 126.13 32.46L126.13 32.46Q126.32 32.27 126.49 32.13Q126.66 31.98 126.85 31.94L126.85 31.94Q127.28 31.84 127.28 32.13L127.28 32.13Q127.28 32.27 126.99 32.66L126.99 32.66Q125.50 34.43 123.68 36.16Q121.86 37.89 119.96 39.02Q118.06 40.14 116.43 40.14L116.43 40.14Q114.80 40.14 114.13 39.04Q113.46 37.94 113.46 36.54L113.46 36.54Q113.46 35.10 113.98 33.90L113.98 33.90L110.10 37.79Q108.80 39.09 107.72 39.66Q106.64 40.24 105.87 40.24ZM105.44 39.18L105.44 39.18Q107.50 39.18 112.30 33.52L112.30 33.52Q112.54 33.23 113.98 31.38Q115.42 29.54 118.06 25.98L118.06 25.98Q117.73 25.41 116.91 25.41L116.91 25.41Q113.94 25.41 108.94 30.11L108.94 30.11Q104.24 34.48 104.24 37.46L104.24 37.46Q104.24 39.18 105.44 39.18Z"
          fill="transparent"
          strokeWidth="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
        />
      </motion.svg>
      <motion.div
        className="absolute"
        initial={{ x: -80, y: 15, rotate: -20 }}
        animate={{ x: 25, y: 0, rotate: 10 }}
        transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
      >
        <PenTool className="w-10 h-10 text-[#5C3A21] drop-shadow-lg" style={{ filter: 'drop-shadow(2px 4px 2px rgba(92, 58, 33, 0.4))' }} />
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
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#8B5A2B] m-3 opacity-40"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#8B5A2B] m-3 opacity-40"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#8B5A2B] m-3 opacity-40"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#8B5A2B] m-3 opacity-40"></div>

          <div className="flex border-b-2 border-[#D2B48C]">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-4 text-lg font-bold tracking-wider transition-all ${mode === 'login' ? 'bg-[#8B5A2B] text-[#FDF5E6] shadow-inner' : 'text-[#8B5A2B] hover:bg-[#F5DEB3]'
                }`}
            >
              Enter the Guild
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-4 text-lg font-bold tracking-wider transition-all ${mode === 'register' ? 'bg-[#8B5A2B] text-[#FDF5E6] shadow-inner' : 'text-[#8B5A2B] hover:bg-[#F5DEB3]'
                }`}
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
  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <Router>
      <div className="min-h-screen bg-[#FDF5E6] text-[#2C1A0B] font-serif" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}>
        <nav className="flex flex-col md:flex-row justify-between items-center p-4 md:p-6 border-b-2 border-[#8B5A2B] bg-[#FDF5E6] bg-opacity-90 shadow-md">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <Feather className="w-8 h-8 text-[#8B5A2B]" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-[#5C3A21] uppercase text-center">The Postmaster's Guild</h1>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-0 md:space-x-6 text-base md:text-lg">
            <Link to="/" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><User className="w-5 h-5" /> <span>My Profile</span></Link>
            <Link to="/scanner" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Scan className="w-5 h-5" /> <span>Scan Wax Seal</span></Link>
            {user.role === 'mailman' && <Link to="/mailman" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Feather className="w-5 h-5" /> <span>Guild Dashboard</span></Link>}
            <Link to="/directory" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Crown className="w-5 h-5" /> <span>Guild Roster</span></Link>
            <Link to="/gallery" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Scroll className="w-5 h-5" /> <span>Gallery & Stamps</span></Link>

            <div className="flex items-center space-x-3 md:ml-4 md:pl-4 border-l-0 md:border-l-2 border-[#D2B48C]">
              <div className="flex items-center space-x-2 bg-[#FAF0E6] px-3 py-1 rounded border border-[#D2B48C]">
                {user.role === 'mailman' ? <Crown className="w-4 h-4 text-[#8B5A2B]" /> : <User className="w-4 h-4 text-[#8B5A2B]" />}
                <span className="text-sm font-semibold text-[#5C3A21]">{user.name}</span>
                <span className="text-xs italic text-[#8B5A2B]">({user.role})</span>
              </div>
              <button onClick={() => { logout(); setUser(null); }} className="flex items-center space-x-1 text-[#8B5A2B] hover:text-red-700 transition-colors" title="Depart the Guild"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto p-8">
          <Routes>
            <Route path="/" element={<UserProfile user={user} />} />
            <Route path="/compose" element={<ComposeLetter />} />
            <Route path="/mailbox" element={<MyMailbox />} />
            <Route path="/sent" element={<SentLetters />} />
            <Route path="/map" element={<MapTracker />} />
            <Route path="/mailman" element={user.role === 'mailman' ? <MailmanDashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/directory" element={<MailmenDirectory />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="/gallery" element={<Gallery />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// ============================================
// USER PROFILE (Landing Page)
// ============================================
function UserProfile({ user }: { user: any }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto space-y-8">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C] relative overflow-hidden text-center">
        <QuillAnimation />
        <h2 className="text-4xl font-bold text-[#5C3A21] italic mb-2">Welcome back, <span className="text-[#8B5A2B]">{user.name}</span></h2>
        <p className="text-[#D2B48C] text-lg mt-1 italic mb-8">May thy quill be sharp and thy ink plentiful.</p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-8">
          <Link to="/compose" className="w-full md:w-auto bg-[#8B5A2B] hover:bg-[#5C3A21] text-[#FDF5E6] px-8 py-4 rounded text-xl font-bold tracking-wider transition-colors shadow-lg border border-[#3E2723] flex flex-col items-center">
            <span className="text-3xl mb-2">✍️</span>
            Compose Thy Epistle
          </Link>
          <Link to="/mailbox" className="w-full md:w-auto bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B] px-8 py-4 rounded text-xl font-bold tracking-wider transition-colors shadow border-2 border-[#D2B48C] flex flex-col items-center">
            <span className="text-3xl mb-2">📬</span>
            Thy Mailbox
          </Link>
          <Link to="/sent" className="w-full md:w-auto bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B] px-8 py-4 rounded text-xl font-bold tracking-wider transition-colors shadow border-2 border-[#D2B48C] flex flex-col items-center">
            <span className="text-3xl mb-2">🕊️</span>
            Thy Dispatched Missives
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
  const [loading, setLoading] = useState(false);
  const [createdQR, setCreatedQR] = useState('');
  const [error, setError] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.draft) {
      const draft = location.state.draft;
      setContent(draft.content || '');
      if (draft.receiverRef && typeof draft.receiverRef === 'object') {
        setReceiverRef(draft.receiverRef.name || '');
      } else {
        setReceiverRef(draft.receiverRef || '');
      }
      setCurrentDraftId(draft._id);
    }
  }, [location]);

  const handleSend = async () => {
    if (!content.trim()) { setError('The missive cannot be empty.'); return; }
    setLoading(true); setError('');
    try {
      let res;
      if (currentDraftId) {
        res = await updateLetter(currentDraftId, receiverRef, content, 'pending');
      } else {
        res = await sendLetter(receiverRef, content, 'standard', 'pending');
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
        await updateLetter(currentDraftId, receiverRef, content, 'draft');
      } else {
        const res = await sendLetter(receiverRef, content, 'standard', 'draft');
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

        <h2 className="text-4xl font-bold text-center mb-8 text-[#5C3A21] italic">Compose Thine Epistle</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#8B5A2B]">To Whom It May Concern (User ID / Email / Open):</label>
            <input type="text" value={receiverRef} onChange={(e) => setReceiverRef(e.target.value)} className="w-full bg-transparent border-b-2 border-[#D2B48C] p-2 focus:outline-none focus:border-[#8B5A2B] text-xl font-serif italic" placeholder="Recipient's Name or Address (Optional)" />
          </div>
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#8B5A2B]">The Missive:</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-4 rounded focus:outline-none focus:border-[#8B5A2B] text-lg font-serif resize-none shadow-inner" placeholder="Write thy words of wisdom..."></textarea>
          </div>
          {error && <p className={`font-bold italic ${error.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>{error}</p>}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-6 gap-4">
            <div className="flex items-center space-x-2 text-[#8B5A2B]"><Shield className="w-5 h-5" /><span className="text-sm font-semibold">Wax Seal Required</span></div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto space-y-3 sm:space-y-0 sm:space-x-4">
              <button onClick={handleSaveDraft} disabled={loading} className="w-full sm:w-auto bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B] px-6 py-3 rounded text-lg font-bold tracking-wider transition-colors shadow border-2 border-[#D2B48C]">
                {loading && !createdQR ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={handleSend} disabled={loading} className="w-full sm:w-auto bg-[#8B5A2B] hover:bg-[#5C3A21] text-[#FDF5E6] px-8 py-3 rounded text-lg font-bold tracking-wider transition-colors shadow-lg border border-[#3E2723]">
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
// MY MAILBOX (Inbox)
// ============================================
function MyMailbox() {
  const [myMailbox, setMyMailbox] = useState<any[]>([]);

  useEffect(() => {
    const fetchMyMailbox = async () => {
      try {
        const data = await getMyMailbox();
        setMyMailbox(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMyMailbox();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-[#5C3A21] italic">Thy Mailbox</h2>
          <Link to="/" className="text-[#8B5A2B] hover:text-[#5C3A21] font-bold">← Back to Profile</Link>
        </div>
        {myMailbox.length === 0 ? (
          <p className="text-center text-[#8B5A2B] italic py-8">Thy mailbox is currently empty.</p>
        ) : (
          <div className="space-y-4">
            {myMailbox.map((l: any, i) => (
              <div key={i} className="bg-[#FDF5E6] p-4 rounded border border-[#D2B48C]">
                <p className="font-bold text-[#5C3A21]">
                  Letter from {l.senderRef?.name || 'Unknown'}
                </p>
                <p className="text-sm italic text-[#8B5A2B]">Received on: {new Date(l.deliveredAt).toLocaleDateString()}</p>
                <div className="mt-4 p-4 bg-white border-2 border-[#D2B48C] rounded text-lg font-serif whitespace-pre-wrap shadow-inner">{l.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// SENT LETTERS (Outbox)
// ============================================
function SentLetters() {
  const [myLetters, setMyLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdQR, setCreatedQR] = useState('');
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
    // Navigate to compose and pass state (or we can just let Compose handle it if we passed draft ID via URL. 
    // For simplicity without changing routing logic, we can pass it via router state)
    navigate('/compose', { state: { draft: letter } });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-[#5C3A21] italic">Thy Dispatched Missives</h2>
          <Link to="/" className="text-[#8B5A2B] hover:text-[#5C3A21] font-bold">← Back to Profile</Link>
        </div>
        {myLetters.length === 0 ? (
          <p className="text-center text-[#8B5A2B] italic py-8">Thou hast sent no letters yet.</p>
        ) : (
          <div className="space-y-4">
            {myLetters.map((l: any, i) => (
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
    </motion.div>
  );
}

// ============================================
// MAILMAN DASHBOARD (role-gated)
// ============================================
function MailmanDashboard({ user }: { user: any }) {
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQR, setSelectedQR] = useState<{ token: string, receiverName: string } | null>(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const data = await getActiveQuests();
      setQuests(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto space-y-8">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <h2 className="text-4xl font-bold text-center mb-2 text-[#5C3A21] italic">The Postmaster's Registry</h2>
        <p className="text-center text-[#8B5A2B] italic mb-8">Carrier: {user.name} • Rank: Novice • XP: 0</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:border-r-2 border-[#D2B48C] md:pr-8">
            <h3 className="text-2xl font-bold text-[#8B5A2B] mb-4">Thy Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#FDF5E6] p-3 rounded border border-[#D2B48C]"><span className="text-[#5C3A21] font-semibold">Deliveries Completed</span><span className="text-[#8B5A2B] font-bold text-xl">0</span></div>
              <div className="flex justify-between items-center bg-[#FDF5E6] p-3 rounded border border-[#D2B48C]"><span className="text-[#5C3A21] font-semibold">Reputation Score</span><span className="text-[#8B5A2B] font-bold text-xl">0</span></div>
              <div className="flex justify-between items-center bg-[#FDF5E6] p-3 rounded border border-[#D2B48C]"><span className="text-[#5C3A21] font-semibold">Badges Earned</span><span className="text-[#8B5A2B] font-bold text-xl">0</span></div>
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
                      <button onClick={() => setSelectedQR({ token: q.qrCodeToken, receiverName: q.receiverRef?.name || 'Unknown' })} className="w-full sm:w-auto bg-[#8B5A2B] text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-[#5C3A21]">Show QR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchy Badges (Replaced Mailbox) */}
      <HierarchyBadges />
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
  const defaultPosition: [number, number] = [51.505, -0.09];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="bg-[#FAF0E6] p-6 rounded-lg shadow-2xl border border-[#D2B48C]">
      <h2 className="text-3xl font-bold text-center mb-6 text-[#5C3A21] italic">The Mailman's Journey</h2>
      <div className="h-[600px] w-full rounded-lg overflow-hidden border-4 border-[#8B5A2B] shadow-inner relative">
        <MapContainer {...{ center: defaultPosition, zoom: 13, scrollWheelZoom: false } as any} className="h-full w-full">
          <TileLayer {...{ attribution: '© OpenStreetMap contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" } as any} />
          <Marker position={defaultPosition}>
            <Popup><div className="font-serif text-[#5C3A21] text-center"><strong>Thy Letter Carrier</strong><br />Currently en route.</div></Popup>
          </Marker>
        </MapContainer>
        <div className="absolute inset-0 pointer-events-none bg-[#D2B48C] mix-blend-color opacity-30"></div>
        <div className="absolute inset-0 pointer-events-none border-[12px] border-[#FAF0E6] opacity-50"></div>
      </div>
    </motion.div>
  );
}

function Gallery() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <h2 className="text-4xl font-bold text-center mb-2 text-[#5C3A21] italic">The Royal Stamp Gallery</h2>
        <p className="text-center text-[#8B5A2B] italic mb-8">Collect stamps from thy travels across the realm.</p>
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
          ].map((stamp, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05, rotate: 2 }} className={`p-4 rounded-lg border-2 text-center transition-all ${stamp.earned ? 'border-[#8B5A2B] bg-[#FDF5E6] shadow-lg' : 'border-[#D2B48C] bg-[#FAF0E6] opacity-50'}`}>
              <span className="text-3xl block mb-2">{stamp.emoji}</span>
              <p className="font-bold text-[#5C3A21] text-sm leading-tight">{stamp.name}</p>
              <p className="text-[10px] italic text-[#8B5A2B] mt-1 leading-tight">{stamp.desc}</p>
              {!stamp.earned && <p className="text-[10px] font-bold text-[#D2B48C] mt-2">🔒 LOCKED</p>}
            </motion.div>
          ))}
        </div>
      </div>
      <HierarchyBadges />
    </motion.div>
  );
}

export default App;
