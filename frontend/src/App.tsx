import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Feather, Map, Mail, Scroll, Shield, LogOut, User, Crown, Sparkles, Scan, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { register, login, logout, getStoredUser, getStoredToken, sendLetter, scanLetter, getActiveQuests, getMyLetters, updateLetter, deleteLetter } from './api';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

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
          <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}>
            <Feather className="w-16 h-16 mx-auto text-[#8B5A2B] mb-4" />
          </motion.div>
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
              className={`flex-1 py-4 text-lg font-bold tracking-wider transition-all ${
                mode === 'login' ? 'bg-[#8B5A2B] text-[#FDF5E6] shadow-inner' : 'text-[#8B5A2B] hover:bg-[#F5DEB3]'
              }`}
            >
              Enter the Guild
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-4 text-lg font-bold tracking-wider transition-all ${
                mode === 'register' ? 'bg-[#8B5A2B] text-[#FDF5E6] shadow-inner' : 'text-[#8B5A2B] hover:bg-[#F5DEB3]'
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
        <nav className="flex justify-between items-center p-6 border-b-2 border-[#8B5A2B] bg-[#FDF5E6] bg-opacity-90 shadow-md">
          <div className="flex items-center space-x-3">
            <Feather className="w-8 h-8 text-[#8B5A2B]" />
            <h1 className="text-3xl font-bold tracking-widest text-[#5C3A21] uppercase">The Postmaster's Guild</h1>
          </div>
          <div className="flex items-center space-x-6 text-lg">
            <Link to="/" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Mail className="w-5 h-5" /> <span>My Letters</span></Link>
            <Link to="/scanner" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Scan className="w-5 h-5" /> <span>Scan Wax Seal</span></Link>
            {user.role === 'mailman' && <Link to="/mailman" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Feather className="w-5 h-5" /> <span>Guild Dashboard</span></Link>}
            <Link to="/gallery" className="flex items-center space-x-2 hover:text-[#8B5A2B] transition-colors"><Scroll className="w-5 h-5" /> <span>Gallery & Stamps</span></Link>
            
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l-2 border-[#D2B48C]">
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
            <Route path="/" element={<Home user={user} />} />
            <Route path="/map" element={<MapTracker />} />
            <Route path="/mailman" element={user.role === 'mailman' ? <MailmanDashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="/gallery" element={<Gallery />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// ============================================
// HOME — Compose Letter / Inbox
// ============================================
function Home({ user }: { user: any }) {
  const [receiverRef, setReceiverRef] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdQR, setCreatedQR] = useState('');
  const [error, setError] = useState('');
  const [myLetters, setMyLetters] = useState<any[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState('');

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
      setContent('');
      setReceiverRef('');
      setCurrentDraftId('');
      fetchMyLetters();
    } catch (e: any) {
      setError(e.message || 'Failed to dispatch letter');
    } finally {
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
      fetchMyLetters();
    } catch (e: any) {
      setError(e.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (!window.confirm("Are you sure you wish to burn this draft?")) return;
    setLoading(true);
    try {
      await deleteLetter(id);
      if (currentDraftId === id) {
        setContent('');
        setReceiverRef('');
        setCurrentDraftId('');
      }
      fetchMyLetters();
    } catch (e: any) {
      setError(e.message || 'Failed to delete draft');
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = (letter: any) => {
    setContent(letter.content);
    // receiverRef might be a populated object { _id, name } or a plain string/null
    if (letter.receiverRef && typeof letter.receiverRef === 'object') {
      setReceiverRef(letter.receiverRef.name || '');
    } else {
      setReceiverRef(letter.receiverRef || '');
    }
    setCurrentDraftId(letter._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl text-[#8B5A2B] italic">Welcome back, <span className="font-bold text-[#5C3A21]">{user.name}</span></h2>
        <p className="text-[#D2B48C] text-sm mt-1">May thy quill be sharp and thy ink plentiful.</p>
      </div>

      {/* Compose Letter Card */}
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
          <div className="flex justify-between items-center pt-6">
            <div className="flex items-center space-x-2 text-[#8B5A2B]"><Shield className="w-5 h-5" /><span className="text-sm font-semibold">Wax Seal Required</span></div>
            <div className="flex space-x-4">
              <button onClick={handleSaveDraft} disabled={loading} className="bg-[#FAF0E6] hover:bg-[#FDF5E6] text-[#8B5A2B] px-6 py-3 rounded text-lg font-bold tracking-wider transition-colors shadow border-2 border-[#D2B48C]">
                {loading && !createdQR ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={handleSend} disabled={loading} className="bg-[#8B5A2B] hover:bg-[#5C3A21] text-[#FDF5E6] px-8 py-3 rounded text-lg font-bold tracking-wider transition-colors shadow-lg border border-[#3E2723]">
                {loading && createdQR ? 'Sealing...' : 'Seal & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Received/Sent Letters List */}
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <h2 className="text-3xl font-bold mb-6 text-[#5C3A21] italic">Thy Correspondences</h2>
        {myLetters.length === 0 ? (
          <p className="text-center text-[#8B5A2B] italic">Thy pigeonhole is empty.</p>
        ) : (
          <div className="space-y-4">
            {myLetters.map((l: any, i) => (
              <div key={i} className="bg-[#FDF5E6] p-4 rounded border border-[#D2B48C] flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#5C3A21]">
                    {l.senderRef?._id === user.id ? 'Sent Letter' : 'Received Letter'}
                    {l.senderRef?.name ? ` from ${l.senderRef.name}` : ''}
                    {l.status === 'draft' && ' (Draft)'}
                  </p>
                  <p className="text-sm italic text-[#8B5A2B]">Status: {l.status} {l.qrCodeToken ? `| Token: ${l.qrCodeToken.substring(0,8)}...` : ''}</p>
                  {(l.status === 'delivered' || l.status === 'draft') && l.senderRef?._id !== user.id && (
                     <div className="mt-2 p-3 bg-white border border-[#D2B48C] rounded text-lg font-serif whitespace-pre-wrap">{l.content}</div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {l.senderRef?._id === user.id && l.status === 'draft' && (
                    <>
                      <button onClick={() => loadDraft(l)} className="px-4 py-2 bg-[#FAF0E6] text-[#8B5A2B] border border-[#D2B48C] rounded shadow hover:bg-[#FDF5E6]">Edit</button>
                      <button onClick={() => handleDeleteDraft(l._id)} disabled={loading} className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded shadow hover:bg-red-200">Burn</button>
                    </>
                  )}
                  {l.senderRef?._id === user.id && l.status === 'pending' && (
                    <button onClick={() => setCreatedQR(l.qrCodeToken)} className="px-4 py-2 bg-[#8B5A2B] text-[#FDF5E6] rounded shadow hover:bg-[#5C3A21]">Show QR</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal for Sender */}
      <AnimatePresence>
        {createdQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-[#8B5A2B] text-center shadow-2xl">
              <button onClick={() => setCreatedQR('')} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
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
// MAILMAN DASHBOARD (role-gated)
// ============================================
function MailmanDashboard({ user }: { user: any }) {
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQR, setSelectedQR] = useState('');

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
            <h3 className="text-2xl font-bold text-[#8B5A2B] mb-4">Active Quests</h3>
            <div className="bg-[#FDF5E6] p-6 rounded border border-[#D2B48C] shadow-inner mb-4 text-center">
              {quests.length === 0 ? (
                <>
                  <Sparkles className="w-8 h-8 mx-auto text-[#D2B48C] mb-2" />
                  <p className="text-[#8B5A2B] italic">No active quests at this time.</p>
                  <p className="text-sm text-[#D2B48C] mt-1">Await thy summons, brave carrier.</p>
                </>
              ) : (
                <div className="space-y-3 text-left">
                  {quests.map((q, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 border border-[#D2B48C] rounded">
                       <div>
                         <p className="font-bold text-[#5C3A21]">Letter from {q.senderRef?.name}</p>
                         <p className="text-xs italic text-[#8B5A2B]">Status: {q.status}</p>
                       </div>
                       <button onClick={() => setSelectedQR(q.qrCodeToken)} className="bg-[#8B5A2B] text-white px-3 py-1 rounded text-sm font-bold shadow hover:bg-[#5C3A21]">Show QR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-[#8B5A2B] text-center shadow-2xl">
              <button onClick={() => setSelectedQR('')} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-[#5C3A21]"><X className="w-8 h-8" /></button>
              <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">Delivery Wax Seal</h3>
              <p className="text-[#8B5A2B] italic mb-6">Present this to the Receiver so they may scan and read the letter.</p>
              <div className="flex justify-center p-4 bg-white border-2 border-[#D2B48C] rounded mb-4 inline-block">
                <QRCodeCanvas value={selectedQR} size={250} fgColor="#5C3A21" />
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
        (errorMessage) => {
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
        <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
        <div className="grid grid-cols-3 gap-6">
          {[ { name: 'Novice Seal', desc: 'First letter sent', emoji: '📜', earned: false }, { name: 'Swift Courier', desc: '10 deliveries made', emoji: '🏇', earned: false }, { name: 'Royal Decree', desc: 'Endorsed by the Crown', emoji: '👑', earned: false }, { name: 'Night Owl', desc: 'Delivery after midnight', emoji: '🦉', earned: false }, { name: 'Storm Rider', desc: 'Delivered in the rain', emoji: '⚡', earned: false }, { name: 'Phantom Post', desc: 'Received a Dibbyuk letter', emoji: '👻', earned: false } ].map((stamp, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05, rotate: 2 }} className={`p-6 rounded-lg border-2 text-center transition-all ${stamp.earned ? 'border-[#8B5A2B] bg-[#FDF5E6] shadow-lg' : 'border-[#D2B48C] bg-[#FAF0E6] opacity-50'}`}>
              <span className="text-4xl block mb-2">{stamp.emoji}</span>
              <p className="font-bold text-[#5C3A21]">{stamp.name}</p>
              <p className="text-xs italic text-[#8B5A2B] mt-1">{stamp.desc}</p>
              {!stamp.earned && <p className="text-xs text-[#D2B48C] mt-2">🔒 Locked</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default App;
