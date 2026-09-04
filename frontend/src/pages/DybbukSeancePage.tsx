import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Ghost, Sparkles, Send, ArrowLeft, RefreshCw, Feather, BookOpen, X, Flame
} from 'lucide-react';
import { 
  summonDybbukLetter, toggleDybbukMode, getMyMailbox, 
  getUserProfile, sendLetter 
} from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';
import { notify } from '../components/RealmDialog';

export default function DybbukSeancePage({ user }: { user: any }) {
  const [dybbukMode, setDybbukMode] = useState(false);
  const [tone, setTone] = useState<'classical' | 'modern'>('classical');
  const [summoning, setSummoning] = useState(false);
  const [summonResult, setSummonResult] = useState<any>(null);
  const [spectralLetters, setSpectralLetters] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [openLetter, setOpenLetter] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Spectral dispatch composer state
  const [showSpectralComposer, setShowSpectralComposer] = useState(false);
  const [spectralRecipient, setSpectralRecipient] = useState('');
  const [spectralContent, setSpectralContent] = useState('');
  const [spectralFont, setSpectralFont] = useState('Great Vibes');
  const [sendingSpectral, setSendingSpectral] = useState(false);

  useEffect(() => {
    if (user?.id || user?._id) {
      getUserProfile(user.id || user._id).then(prof => {
        if (prof && typeof prof.dybbukMode === 'boolean') {
          setDybbukMode(prof.dybbukMode);
        }
      }).catch(console.error);

      fetchSpectralHistory();
    }
  }, [user]);

  const fetchSpectralHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getMyMailbox();
      if (Array.isArray(data)) {
        const spectralOnly = data.filter(l => l.type === 'dybbuk' || l.type === 'dibbyuk');
        setSpectralLetters(spectralOnly);
      }
    } catch (e) {
      console.error('Could not load spectral history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSummon = async () => {
    setSummoning(true);
    setSummonResult(null);
    setActionMsg(null);
    waxSealAudio.playDybbukWhisper();
    try {
      const res = await summonDybbukLetter(user.id || user._id, tone);
      setSummonResult(res.letter);
      setActionMsg(res.message || '👻 A Dybbuk Letter has manifested from the Astral Veil!');
      await fetchSpectralHistory();
    } catch (e: any) {
      notify.error(e.message || 'The Astral Veil resisted. Please try again.');
    } finally {
      setSummoning(false);
    }
  };

  const handleToggleMode = async () => {
    try {
      const res = await toggleDybbukMode(user.id || user._id, !dybbukMode);
      setDybbukMode(res.dybbukMode);
      if (res.dybbukMode) waxSealAudio.playDybbukWhisper();
      setActionMsg(res.dybbukMode 
        ? '👻 Automatic Dybbuk letters are on. They will arrive from time to time.' 
        : '👻 Dybbuk Mode Quieted. The Astral Veil rests.');
      setTimeout(() => setActionMsg(null), 4500);
    } catch (e: any) {
      notify.error(e.message || 'Could not toggle Dybbuk Mode');
    }
  };

  const handleSendSpectralMissive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spectralContent.trim()) {
      notify.error('Write something before you part the veil.');
      return;
    }
    setSendingSpectral(true);
    waxSealAudio.playWaxStampThud();
    try {
      await sendLetter({
        senderRef: user.id || user._id,
        receiverRef: spectralRecipient.trim() || undefined,
        content: spectralContent,
        type: 'dybbuk',
        font: spectralFont,
        status: 'pending'
      });
      setActionMsg('✨ Your spectral epistle has crossed the ethereal boundary!');
      setShowSpectralComposer(false);
      setSpectralRecipient('');
      setSpectralContent('');
      setTimeout(() => setActionMsg(null), 4000);
    } catch (e: any) {
      notify.error(e.message || 'Could not dispatch spectral letter');
    } finally {
      setSendingSpectral(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }} 
      className="max-w-5xl mx-auto space-y-8 pb-12"
    >
      {/* Back Navigation Bar & Tone Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <Link to="/" className="btn-gold-saloon text-xs py-2 px-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Writing
        </Link>
        
        {/* Language Tone Switcher */}
        <div className="inline-flex items-center p-1 rounded-sm shadow-md" style={{ background: 'rgba(26,15,43,0.9)', border: '1px solid rgba(168,85,247,0.4)' }}>
          <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 text-purple-300" style={{ fontFamily: "'Cinzel', serif" }}>
            Language Tone:
          </span>
          <button
            onClick={() => setTone('classical')}
            className={`px-3 py-1 text-xs font-bold rounded-sm transition-all ${tone === 'classical' ? 'bg-purple-700 text-white shadow-md' : 'text-purple-300 hover:text-white'}`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            🏛️ Classical / 18th-C
          </button>
          <button
            onClick={() => setTone('modern')}
            className={`px-3 py-1 text-xs font-bold rounded-sm transition-all ${tone === 'modern' ? 'bg-purple-700 text-white shadow-md' : 'text-purple-300 hover:text-white'}`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            📱 Modern / Normal
          </button>
        </div>

        <Link to="/schrodinger" className="btn-quantum-ghost text-xs py-2 px-4 flex items-center gap-2">
          <span>⚛️ Explore Schrödinger's Vault</span> →
        </Link>
      </div>

      {/* Hero Banner: The Astral Chamber */}
      <div className="astral-card p-8 sm:p-12 relative overflow-hidden text-center rounded-sm">
        {/* Animated ethereal background mist */}
        <div className="absolute inset-0 bg-radial from-purple-900/30 via-transparent to-black pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold animate-float-slow" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#D8B4FE', fontFamily: "'Cinzel', serif" }}>
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>The Outer Mists & Ethereal Seance</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            The Dybbuk Astral Chamber
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base italic leading-relaxed" style={{ color: '#E9D5FF' }}>
            {tone === 'modern'
              ? 'Beyond standard messaging lies the Astral Veil—where eerie spectral entities and forgotten authors transmit messages across reality using your history.'
              : 'Beyond the boundaries of ink and parchment lies the Astral Veil — where departed scribes, phantom couriers, and forgotten alchemists whisper across the centuries.'}
          </p>

          {/* 3D Astral Seance Altar & Ethereal Spirit Portal */}
          <div className="py-6 relative">
            {/* Occult Levitating Alchemical Candles */}
            <div className="absolute top-2 left-6 sm:left-16 flex flex-col items-center animate-float-gentle">
              <div className="w-2 h-3 bg-purple-300 rounded-full shadow-[0_0_12px_#C084FC] animate-ping" />
              <Flame className="w-5 h-5 text-purple-300 -mt-2 drop-shadow-[0_0_8px_#A855F7]" />
              <div className="w-2.5 h-8 bg-amber-100/90 rounded-sm shadow-md border border-amber-300" />
            </div>

            <div className="absolute top-2 right-6 sm:right-16 flex flex-col items-center animate-float-gentle-alt">
              <div className="w-2 h-3 bg-cyan-300 rounded-full shadow-[0_0_12px_#38BDF8] animate-ping" />
              <Flame className="w-5 h-5 text-cyan-300 -mt-2 drop-shadow-[0_0_8px_#38BDF8]" />
              <div className="w-2.5 h-8 bg-amber-100/90 rounded-sm shadow-md border border-amber-300" />
            </div>

            <div className="astral-3d-scene mx-auto">
              {/* Rotating 3D Concentric Seance Platform */}
              <div className="astral-seance-platform">
                {/* Outer Celestial Sigils Ring */}
                <div className="astral-seance-inner-ring flex items-center justify-center">
                  <span className="text-[11px] text-purple-200 font-mono tracking-widest opacity-85 select-none drop-shadow">
                    ✦ ☉ ☽ ☿ ♀ ♂ ♃ ♄ ✦
                  </span>
                </div>
              </div>

              {/* 3D Orbiting Spirit Orbs */}
              <div className="astral-orb-3d" style={{ animationDelay: '0s' }} />
              <div className="astral-orb-3d" style={{ animationDelay: '1.6s', background: 'radial-gradient(circle, #FFF 0%, #38BDF8 50%, #0369A1 100%)' }} />
              <div className="astral-orb-3d" style={{ animationDelay: '3.3s', background: 'radial-gradient(circle, #FFF 0%, #F472B6 50%, #BE185D 100%)' }} />

              {/* Floating 3D Ghost Spirit Entity with Occult Aura */}
              <div className={`astral-ghost-3d flex flex-col items-center justify-center transition-all duration-500 ${summoning ? 'scale-125' : ''}`}>
                <div className="relative group cursor-pointer" onClick={() => waxSealAudio.playDybbukWhisper()}>
                  {/* Spectral Aura Halo */}
                  <div className="absolute inset-0 -m-3 rounded-full bg-purple-500/30 blur-xl animate-pulse pointer-events-none" />
                  <div className="absolute inset-0 -m-6 rounded-full bg-cyan-400/20 blur-2xl animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />

                  {/* Translucent Spirit Wrappings */}
                  <Ghost className={`w-28 h-28 text-purple-200 filter drop-shadow-[0_0_20px_#C084FC] ${summoning ? 'animate-bounce' : 'animate-pulse'}`} />
                  
                  {/* Piercing Glowing Spectral Eyes */}
                  <div className="absolute top-8 left-7 w-3 h-3 rounded-full bg-cyan-200 shadow-[0_0_15px_#22D3EE] animate-pulse" />
                  <div className="absolute top-8 right-7 w-3 h-3 rounded-full bg-cyan-200 shadow-[0_0_15px_#22D3EE] animate-pulse" />
                </div>

                <span className="mt-3 text-xs uppercase tracking-widest px-3.5 py-1 rounded-full font-bold font-mono shadow-lg animate-spectral-mist" style={{ background: 'rgba(88,28,135,0.85)', color: '#F3E8FF', border: '1px solid #C084FC' }}>
                  {summoning ? '⚡ Invoking the Astral Veil...' : '✦ Living Dybbuk Specter ✦'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Message Alert */}
          {actionMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="p-3.5 max-w-xl mx-auto rounded-sm text-sm font-bold flex items-center justify-center gap-2 shadow-lg" 
              style={{ background: 'rgba(147,51,234,0.25)', border: '1px solid #A855F7', color: '#FAF5FF' }}
            >
              <Ghost className="w-4 h-4 text-purple-300 animate-bounce" /> {actionMsg}
            </motion.div>
          )}

          {/* Interactive Seance Controls */}
          <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={handleSummon}
              disabled={summoning}
              className="btn-astral text-xs sm:text-sm py-3 px-6 flex items-center gap-2.5 animate-spectral-mist shadow-xl"
            >
              <Sparkles className={`w-4 h-4 text-purple-200 ${summoning ? 'animate-spin' : ''}`} />
              <span>{summoning ? 'Parting the Astral Veil...' : `✦ Invoke Spectral Letter (${tone === 'modern' ? 'Modern' : 'Classical'})`}</span>
            </button>

            <button
              onClick={handleToggleMode}
              className="px-5 py-3 rounded-sm font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg"
              style={{
                fontFamily: "'Cinzel', serif",
                background: dybbukMode ? 'linear-gradient(135deg, #047857 0%, #065F46 100%)' : 'rgba(255,253,249,0.06)',
                color: dybbukMode ? '#FFF' : '#D8B4FE',
                border: dybbukMode ? '1px solid #10B981' : '1px solid rgba(168,85,247,0.4)',
              }}
            >
              <Ghost className={`w-4 h-4 ${dybbukMode ? 'text-emerald-200 animate-bounce' : 'text-purple-400'}`} />
              <span>Automatic Dybbuk letters: {dybbukMode ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowSpectralComposer(true)}
              className="btn-gold-saloon text-xs sm:text-sm py-3 px-5 flex items-center gap-2"
            >
              <Feather className="w-4 h-4" /> <span>Write a Spectral Letter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manifested Summon Card Spotlight */}
      <AnimatePresence>
        {summonResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="astral-card p-6 sm:p-8 rounded-sm relative overflow-hidden"
            style={{ border: '2px solid rgba(168,85,247,0.7)', boxShadow: '0 0 35px rgba(168,85,247,0.3)' }}
          >
            <div className="flex items-start justify-between pb-4 mb-4" style={{ borderBottom: '1px solid rgba(168,85,247,0.3)' }}>
              <div>
                <span className="text-[11px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-sm" style={{ background: '#581C87', color: '#F3E8FF', fontFamily: "'Cinzel', serif" }}>
                  ✦ Newly Summoned
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mt-2" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                  {summonResult.spectralSender?.name || 'Spectral Entity'}
                </h3>
                <p className="text-xs italic" style={{ color: '#D8B4FE' }}>
                  {summonResult.spectralSender?.title} • Origin: {summonResult.spectralSender?.realmOrigin || 'The Astral Veil'}
                </p>
              </div>
              <button 
                onClick={() => setSummonResult(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div 
              className="p-5 rounded-sm whitespace-pre-wrap leading-relaxed shadow-inner max-h-72 overflow-y-auto"
              style={{
                fontFamily: summonResult.font || "'Cormorant Garamond', serif",
                background: '#FFFDF9',
                color: '#1A1A1A',
                border: '1px solid rgba(168,85,247,0.3)',
                fontSize: '1.15rem'
              }}
            >
              {summonResult.content}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button 
                onClick={() => setOpenLetter(summonResult)}
                className="btn-astral text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" /> Read Full Inscription
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spectral Scriptorium Modal */}
      <AnimatePresence>
        {showSpectralComposer && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <div className="astral-card p-6 sm:p-8 max-w-xl w-full relative rounded-sm shadow-2xl" style={{ border: '2px solid #A855F7' }}>
              <button 
                onClick={() => setShowSpectralComposer(false)} 
                className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <Ghost className="w-6 h-6 text-purple-400" />
                <h3 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                  Send Into the Astral Veil
                </h3>
              </div>
              <p className="text-xs italic mb-5" style={{ color: '#D8B4FE' }}>
                Letters sent here cross the boundary of mortal time and arrive as spectral parchment.
              </p>

              <form onSubmit={handleSendSpectralMissive} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-1" style={{ color: '#E9D5FF', fontFamily: "'Cinzel', serif" }}>
                    Recipient Scholar / Spirit (Leave empty for Open Astral Drift)
                  </label>
                  <input
                    type="text"
                    value={spectralRecipient}
                    onChange={(e) => setSpectralRecipient(e.target.value)}
                    placeholder="e.g. friend@bracu.edu or Madame Vesper..."
                    className="w-full p-3 rounded-sm text-sm font-serif focus:outline-none"
                    style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid rgba(168,85,247,0.4)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-1" style={{ color: '#E9D5FF', fontFamily: "'Cinzel', serif" }}>
                    Spectral Calligraphy
                  </label>
                  <select
                    value={spectralFont}
                    onChange={(e) => setSpectralFont(e.target.value)}
                    className="w-full p-2.5 rounded-sm text-sm font-serif focus:outline-none"
                    style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid rgba(168,85,247,0.4)' }}
                  >
                    <option value="Great Vibes">Great Vibes (Ethereal Cursive)</option>
                    <option value="MedievalSharp">MedievalSharp (Gothic Tome)</option>
                    <option value="Cinzel Decorative">Cinzel Decorative (Aristocratic)</option>
                    <option value="Pirata One">Pirata One (Abyssal Sea)</option>
                    <option value="Special Elite">Special Elite (Clockwork Automaton)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-1" style={{ color: '#E9D5FF', fontFamily: "'Cinzel', serif" }}>
                    Your Spectral Words
                  </label>
                  <textarea
                    rows={6}
                    value={spectralContent}
                    onChange={(e) => setSpectralContent(e.target.value)}
                    placeholder="Speak into the void, knowing that words recorded in spirit ink never fade..."
                    className="w-full p-3.5 rounded-sm text-base font-serif italic focus:outline-none shadow-inner"
                    style={{
                      background: '#FFFDF9',
                      color: '#1A1A1A',
                      border: '1px solid rgba(168,85,247,0.4)',
                      fontFamily: spectralFont
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSpectralComposer(false)}
                    className="btn-gold-saloon text-xs py-2.5 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingSpectral}
                    className="btn-astral text-xs py-2.5 px-6 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingSpectral ? 'Parting Dimensions...' : 'Cast into the Veil'}</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spectral Chronicles: Received Dybbuk Letters */}
      <div className="astral-card p-6 sm:p-10 rounded-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 gap-2" style={{ borderBottom: '1px solid rgba(168,85,247,0.3)' }}>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
              <Ghost className="w-6 h-6 text-purple-400" />
              Spectral Letters ({spectralLetters.length})
            </h2>
            <p className="text-xs sm:text-sm italic" style={{ color: '#D8B4FE' }}>
              Chronicles delivered from historical shades and astral entities.
            </p>
          </div>
          <button
            onClick={fetchSpectralHistory}
            className="btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loadingHistory ? (
          <div className="py-12 text-center text-purple-300 italic">
            <Sparkles className="w-8 h-8 mx-auto animate-spin mb-2" />
            <p className="font-serif">Scrying the astral archives...</p>
          </div>
        ) : spectralLetters.length === 0 ? (
          <div className="py-12 text-center rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(168,85,247,0.3)', color: '#D8B4FE' }}>
            <Ghost className="w-12 h-12 mx-auto mb-2 opacity-50 text-purple-400" />
            <p className="font-bold text-base" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>No spectral letters have arrived yet.</p>
            <p className="text-xs sm:text-sm mt-1 italic font-serif">Click "Invoke Spectral Letter" or enable Dybbuk Mode to invite communications from beyond the veil.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spectralLetters.map((l, i) => (
              <div 
                key={l._id || i}
                className="p-5 rounded-sm transition-all flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(145deg, rgba(38,18,58,0.85) 0%, rgba(18,10,28,0.95) 100%)',
                  border: '1px solid rgba(168,85,247,0.4)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                }}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(168,85,247,0.2)' }}>
                    <div>
                      <h4 className="font-bold text-base sm:text-lg flex items-center gap-1.5" style={{ color: '#FAF5FF', fontFamily: "'Cinzel', serif" }}>
                        <Ghost className="w-4 h-4 text-purple-400" />
                        {l.spectralSender?.name || 'Dybbuk Entity'}
                      </h4>
                      <p className="text-[11px] italic" style={{ color: '#D8B4FE' }}>
                        {l.spectralSender?.realmOrigin || 'The Astral Veil'} • {new Date(l.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p 
                    className="text-sm font-serif line-clamp-3 p-3 rounded-sm mb-3 shadow-inner leading-relaxed"
                    style={{
                      background: '#FFFDF9',
                      color: '#1A1A1A',
                      border: '1px solid rgba(168,85,247,0.25)',
                      fontFamily: l.font || "'Cormorant Garamond', serif"
                    }}
                  >
                    {l.content}
                  </p>
                </div>

                <div className="flex justify-end pt-2" style={{ borderTop: '1px solid rgba(168,85,247,0.2)' }}>
                  <button
                    onClick={() => setOpenLetter(l)}
                    className="btn-astral text-xs py-1.5 px-3.5 flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Read Inscription
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reader Modal with Parchment Scroll Unfurling */}
      <AnimatePresence>
        {openLetter && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          >
            <div className="max-w-lg w-full relative animate-scroll-unroll">
              {/* Top Wooden Rod with Gold Caps */}
              <div className="scroll-rod-top" />

              <div className="parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl">
                <button 
                  onClick={() => setOpenLetter(null)} 
                  className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-2 mb-1">
                  <Ghost className="w-6 h-6 text-purple-700 animate-pulse" />
                  <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#2E1065' }}>
                    {openLetter.spectralSender?.name || 'Spectral Dybbuk Letter'}
                  </h3>
                </div>
                <p className="text-xs italic mb-4" style={{ color: '#7E22CE' }}>
                  {openLetter.spectralSender?.title} • {openLetter.spectralSender?.realmOrigin || 'The Astral Veil'}
                </p>

                <div 
                  className="p-4 rounded-sm whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto leading-relaxed border"
                  style={{
                    fontFamily: openLetter.font || "'Cormorant Garamond', serif",
                    background: 'rgba(255, 255, 255, 0.7)',
                    color: '#1A1A1A',
                    borderColor: 'rgba(168,85,247,0.3)',
                    fontSize: '1.2rem'
                  }}
                >
                  {openLetter.content}
                </div>

                <div className="mt-5 text-right">
                  <button
                    onClick={() => setOpenLetter(null)}
                    className="btn-astral text-xs py-2 px-5"
                  >
                    Roll Up Scroll & Return
                  </button>
                </div>
              </div>

              {/* Bottom Wooden Rod with Gold Caps */}
              <div className="scroll-rod-bottom" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
