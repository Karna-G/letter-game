import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Feather, 
  Search, 
  X, 
  MessageSquare, 
  Send, 
  Loader2, 
  PenTool,
  Clock,
  Tag,
  Trash2,
  Shield
} from 'lucide-react';
import { 
  getNamelessLetters, 
  getNamelessLetterById, 
  addNamelessThought, 
  resonateNamelessLetter, 
  deleteNamelessLetter,
  getStoredUser,
  type NamelessLetterItem 
} from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';
import HandwrittenLetterPaper from '../components/HandwrittenLetterPaper';
import { notify, confirmAction } from '../components/RealmDialog';

const RESONANCE_OPTIONS = [
  { id: 'fire', icon: '🔥', label: 'Fire', desc: 'Passion & Burning Truth' },
  { id: 'rose', icon: '🌹', label: 'Rose', desc: 'Admiration & Beauty' },
  { id: 'withered', icon: '🥀', label: 'Withered', desc: 'Did Not Resonate' },
  { id: 'neutral', icon: '⚖️', label: 'Neutral', desc: 'Contemplative & Impartial' }
] as const;

export default function NamelessWordsPage() {
  const [letters, setLetters] = useState<NamelessLetterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'handwritten'>('all');
  
  // Current user info
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === 'admin';

  // Selected letter for reading & viewing thoughts
  const [selectedLetter, setSelectedLetter] = useState<NamelessLetterItem | null>(null);
  
  // New thought input state
  const [newThoughtContent, setNewThoughtContent] = useState('');
  const [thoughtBadge, setThoughtBadge] = useState('🕯️');
  const [submittingThought, setSubmittingThought] = useState(false);
  const [thoughtSuccessNotice, setThoughtSuccessNotice] = useState(false);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const data = await getNamelessLetters(activeTab, searchQuery);
      setLetters(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Could not load nameless letters:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLetters();
  };

  const handleOpenLetter = async (item: NamelessLetterItem) => {
    waxSealAudio.playWaxCrack();
    setTimeout(() => {
      waxSealAudio.playParchmentUnroll();
    }, 150);

    setSelectedLetter(item);
    setNewThoughtContent('');
    setThoughtBadge('🕯️');

    try {
      const detailed = await getNamelessLetterById(item._id);
      setSelectedLetter(detailed);
    } catch (e) {
      console.error('Could not fetch detailed letter:', e);
    }
  };

  const handleCloseLetter = () => {
    waxSealAudio.playParchmentUnroll();
    setTimeout(() => {
      waxSealAudio.playWaxStampThud();
      setSelectedLetter(null);
    }, 200);
  };

  const handleDeleteLetter = async (letterId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!(await confirmAction({ title: 'Delete Anonymous Letter', message: 'Delete this anonymous letter for good? It cannot be recovered, and the thoughts left on it will go with it.', confirmLabel: 'Delete Forever', tone: 'danger' }))) {
      return;
    }
    try {
      waxSealAudio.playWaxCrack();
      await deleteNamelessLetter(letterId);
      setLetters(prev => prev.filter(l => l._id !== letterId));
      if (selectedLetter?._id === letterId) {
        setSelectedLetter(null);
      }
    } catch (e: any) {
      notify.error(e.message || 'Could not delete the letter. Please try again.');
    }
  };

  const handleResonate = async (type: 'fire' | 'rose' | 'withered' | 'neutral') => {
    if (!selectedLetter) return;
    
    // Author cannot resonate with their own letter
    if (selectedLetter.isMine) {
      notify.info('This is your own letter — you cannot react to it.');
      return;
    }
    
    // Each user can resonate only once
    if (selectedLetter.myResonance) {
      notify.info('You have already reacted to this letter.');
      return;
    }

    waxSealAudio.playWaxStampThud();
    try {
      const res = await resonateNamelessLetter(selectedLetter._id, type);
      setSelectedLetter(prev => prev ? { 
        ...prev, 
        resonances: res.resonances, 
        myResonance: res.myResonance 
      } : null);
      setLetters(prev => prev.map(l => l._id === selectedLetter._id ? { 
        ...l, 
        resonances: res.resonances,
        myResonance: res.myResonance 
      } : l));
    } catch (e: any) {
      notify.error(e.message || 'Could not save your reaction. Please try again.');
    }
  };

  const handlePostThought = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter || !newThoughtContent.trim()) return;

    if (selectedLetter.isMine) {
      notify.info('This is your own letter — you cannot comment on it.');
      return;
    }

    if (selectedLetter.hasCommented) {
      notify.info('You have already left your one thought on this letter.');
      return;
    }

    setSubmittingThought(true);
    try {
      waxSealAudio.playWaxStampThud();
      const added = await addNamelessThought(selectedLetter._id, {
        content: newThoughtContent.trim(),
        resonanceBadge: thoughtBadge,
        avatarIcon: thoughtBadge
      });

      setSelectedLetter(prev => {
        if (!prev) return null;
        const updatedThoughts = [...(prev.thoughts || []), added];
        return {
          ...prev,
          thoughts: updatedThoughts,
          thoughtsCount: updatedThoughts.length,
          hasCommented: true
        };
      });

      setLetters(prev => prev.map(l => {
        if (l._id === selectedLetter._id) {
          return {
            ...l,
            thoughtsCount: (l.thoughtsCount || 0) + 1,
            hasCommented: true
          };
        }
        return l;
      }));

      setNewThoughtContent('');
      setThoughtSuccessNotice(true);
      setTimeout(() => setThoughtSuccessNotice(false), 3500);
    } catch (e: any) {
      notify.error(e.message || 'Could not post your thought. Please try again.');
    } finally {
      setSubmittingThought(false);
    }
  };

  const getFontFamily = (fontName: string) => {
    switch (fontName) {
      case 'Cinzel': return "'Cinzel', serif";
      case 'Cinzel Decorative': return "'Cinzel Decorative', serif";
      case 'MedievalSharp': return "'MedievalSharp', cursive";
      case 'UnifrakturMaguntia': return "'UnifrakturMaguntia', cursive";
      case 'Great Vibes': return "'Great Vibes', cursive";
      case 'Alex Brush': return "'Alex Brush', cursive";
      case 'Pirata One': return "'Pirata One', cursive";
      case 'Cormorant Garamond': return "'Cormorant Garamond', serif";
      default: return "'Cinzel', serif";
    }
  };

  return (
    <div className="space-y-8 min-h-screen pb-16">
      {/* ── HERO BANNER: THE CHAMBER OF NAMELESS WORDS ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-10 border-2 border-[#D4AF37]/60 shadow-2xl"
        style={{
          background: 'radial-gradient(ellipse at top, #2C1B18 0%, #15100D 60%, #0D0A08 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.2)'
        }}
      >
        {/* Subtle Ethereal Particles Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-900/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs uppercase tracking-[0.25em] font-bold bg-amber-950/90 border border-amber-400/60 text-[#FDE047] shadow-md">
              <span className="animate-pulse">🕯️</span>
              <span>The Sanctuary of Anonymity • 15-Day Ephemeral Parchments</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl font-extrabold tracking-wide drop-shadow-[0_4px_15px_rgba(0,0,0,0.95)]"
              style={{ 
                fontFamily: "'Cinzel Decorative', serif", 
                color: '#FFE600', 
                textShadow: '0 0 25px rgba(255, 230, 0, 0.7), 0 4px 15px rgba(0,0,0,0.95)' 
              }}
            >
              Nameless Words
            </h1>

            <p
              className="text-sm sm:text-base text-[#FDE047] italic max-w-2xl font-serif leading-relaxed drop-shadow"
            >
              “Words with no name and no address, drifting for 15 days before they fade to ash. Read what wandering souls left behind, react with fire or roses, and add a thought of your own — anonymously.”
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isAdmin && (
              <div className="px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-bold flex items-center gap-1.5 shadow font-serif">
                <Shield className="w-4 h-4 text-red-400" />
                <span>Guild Master Judicial Authority Active</span>
              </div>
            )}
            {!isAdmin && (
              <Link
                to="/compose"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7A1E2E] via-[#8B2535] to-[#B38F26] text-amber-100 border border-amber-400/60 hover:brightness-110 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <PenTool className="w-4 h-4 text-amber-300" />
                <span>Write an Anonymous Letter</span>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── FILTER TABS & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs with High Contrast Radiant Typography */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Whispers', icon: '🌌' },
            { id: 'handwritten', label: 'Handwritten Scrolls', icon: '✍️' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F59E0B] via-[#D4AF37] to-[#B45309] text-stone-950 font-black shadow-[0_4px_20px_rgba(212,175,55,0.4)] scale-105 border border-amber-300'
                    : 'bg-[#1F1712] text-[#FDE047] border border-amber-500/40 hover:bg-[#322319] hover:text-[#FFF8E7] hover:border-amber-400 shadow-md'
                }`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="Search by topic or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#1A130E] border border-amber-500/50 rounded-xl text-xs sm:text-sm text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 shadow-inner font-serif"
          />
          <Search className="w-4 h-4 text-amber-400/70 absolute left-3 top-3 pointer-events-none" />
        </form>
      </div>

      {/* ── FLOATING MISSIVES GRID ── */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[#FDE047] font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
            Summoning nameless scrolls from the ether...
          </p>
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-20 px-4 bg-[#18120E]/90 border border-amber-500/40 rounded-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-3xl">
            🕯️
          </div>
          <h3 className="text-xl font-bold text-[#FDE047]" style={{ fontFamily: "'Cinzel', serif" }}>
            The Chamber is in Quiet Solitude
          </h3>
          <p className="text-xs italic text-amber-200/90 font-serif max-w-md mx-auto">
            No anonymous letters match your search. Be the first to write one.
          </p>
          {!isAdmin && (
            <Link
              to="/compose"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-950/90 border border-amber-400 text-[#FDE047] hover:bg-amber-900 transition-colors"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Feather className="w-4 h-4 text-[#D4AF37]" />
              <span>Pen a Nameless Epistle</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {letters.map((letter) => {
            return (
              <motion.div
                key={letter._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => handleOpenLetter(letter)}
                className="group relative cursor-pointer bg-gradient-to-b from-[#241A14] to-[#16100C] border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 sm:p-6 shadow-xl hover:shadow-[0_10px_35px_rgba(212,175,55,0.25)] transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {/* Topic Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/90 border border-amber-500/50 text-[11px] font-bold text-[#FDE047] truncate max-w-[180px] font-serif shadow-inner">
                    <Tag className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                    <span className="truncate">{letter.topic || 'Whisper of the Realm'}</span>
                  </div>

                  {/* Badges & Admin Purge */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteLetter(letter._id, e)}
                        className="p-1 rounded bg-red-950/80 hover:bg-red-800 text-red-300 border border-red-500/50 transition-colors cursor-pointer"
                        title="Purge Nameless Epistle (Admin Tribunal)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {letter.isMine && (
                      <span className="bg-gradient-to-l from-amber-600 to-yellow-600 text-stone-900 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded shadow font-serif">
                        👑 Mine
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/70 text-[#FDE047] font-mono border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{letter.expiresInDays !== undefined ? `${letter.expiresInDays}d left` : '15d'}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  {/* Content Snippet */}
                  {letter.isHandwritten ? (
                    <div className="p-3 rounded-xl bg-[#120E0A] border border-amber-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[#FDE047] font-serif">
                        <span>✍️ Physical Handwritten Scroll</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-[#FDE047] font-mono font-bold">
                        {letter.handwrittenPages?.length || 1} {letter.handwrittenPages?.length === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                  ) : (
                    <p
                      className="text-xs sm:text-sm text-stone-200 line-clamp-4 leading-relaxed italic font-serif"
                      style={{ fontFamily: getFontFamily(letter.font) }}
                    >
                      "{letter.content}"
                    </p>
                  )}
                </div>

                {/* Footer: Reactions Breakdown & Thought Count */}
                <div className="pt-4 mt-3 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                  {/* Resonances Summary */}
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="flex items-center gap-0.5" title="Fire">
                      🔥 <span>{letter.resonances?.fire || 0}</span>
                    </span>
                    <span className="flex items-center gap-0.5" title="Rose">
                      🌹 <span>{letter.resonances?.rose || 0}</span>
                    </span>
                    <span className="flex items-center gap-0.5" title="Withered">
                      🥀 <span>{letter.resonances?.withered || 0}</span>
                    </span>
                    <span className="flex items-center gap-0.5" title="Neutral">
                      ⚖️ <span>{letter.resonances?.neutral || 0}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-serif text-[11px] text-[#FDE047]" title="Anonymous Reflections">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>{letter.thoughtsCount || letter.thoughts?.length || 0}</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#FDE047] group-hover:underline font-serif">
                      Unroll →
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── DETAILED READING & ANONYMOUS THOUGHT STREAM MODAL ── */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
            onClick={handleCloseLetter}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl w-full my-auto bg-[#18110D] border-2 border-[#D4AF37] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]"
            >
              {/* Modal Top Ribbon */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2B1B15] to-[#1C120D] border-b border-amber-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md border-2 border-amber-400/50"
                    style={{ backgroundColor: selectedLetter.sealColor || '#7A1E2E' }}
                  >
                    {selectedLetter.authorAvatarIcon || '🕯️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-[#FFF8E7] font-serif">
                        {selectedLetter.topic || 'Whisper of the Realm'}
                      </h3>
                      {selectedLetter.isMine && (
                        <span className="bg-gradient-to-l from-amber-600 to-yellow-600 text-stone-900 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded font-serif">
                          👑 Your Letter
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#FDE047] font-mono">
                      Inscribed {new Date(selectedLetter.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • <span className="text-amber-300">⏳ Fades in {selectedLetter.expiresInDays !== undefined ? `${selectedLetter.expiresInDays} days` : '15 days'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLetter(selectedLetter._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-200 bg-red-950/90 hover:bg-red-900 border border-red-500/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Purge Nameless Epistle (Admin Tribunal)"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>Purge from Chamber</span>
                    </button>
                  )}
                  <button
                    onClick={handleCloseLetter}
                    className="p-2 rounded-xl text-amber-400 hover:text-white bg-black/40 hover:bg-black/80 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content: Manuscript + Thoughts Stream */}
              <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {/* 1. Manuscript Body */}
                <div
                  className="p-6 sm:p-8 rounded-xl border-2 border-amber-500/40 relative shadow-inner"
                  style={{
                    backgroundColor: '#FFFDF9',
                    color: '#1A1816',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  {selectedLetter.isHandwritten && selectedLetter.handwrittenPages?.length ? (
                    <HandwrittenLetterPaper
                      handwrittenPages={selectedLetter.handwrittenPages}
                      senderName="A Nameless Scribe"
                      dateStr={new Date(selectedLetter.createdAt).toLocaleDateString()}
                    />
                  ) : (
                    <div className="space-y-4">
                      <p
                        className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif text-stone-900"
                        style={{ fontFamily: getFontFamily(selectedLetter.font) }}
                      >
                        {selectedLetter.content}
                      </p>
                      <div className="pt-4 border-t border-stone-300 flex items-center justify-between">
                        <span className="italic text-xs text-stone-700 font-serif">
                          Topic: <strong>{selectedLetter.topic || 'General Whisper'}</strong>
                        </span>
                        <span className="italic text-xs text-stone-500 font-serif">
                          — Sealed in anonymity
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Resonance Reaction Bar (Fire, Rose, Withered, Neutral) */}
                <div className="p-4 rounded-xl bg-black/70 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#FDE047] uppercase tracking-wider font-serif block">
                      Resonate with this Letter:
                    </span>
                    <span className="text-[10px] text-amber-300/80 font-serif">
                      {selectedLetter.isMine 
                        ? '(Authors may not resonate with their own letter)'
                        : selectedLetter.myResonance
                        ? `(You have resonated with: ${selectedLetter.myResonance.toUpperCase()})`
                        : '(Each scribe may resonate once)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {RESONANCE_OPTIONS.map((res) => {
                      const count = selectedLetter.resonances?.[res.id] || 0;
                      const isSelected = selectedLetter.myResonance === res.id;
                      const isDisabled = !!selectedLetter.isMine || !!selectedLetter.myResonance;

                      return (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => handleResonate(res.id)}
                          disabled={isDisabled}
                          title={res.desc}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5A93C] text-stone-950 border-amber-300 shadow-[0_0_15px_rgba(212,175,55,0.6)] scale-105'
                              : isDisabled
                              ? 'bg-[#1C1510] border-amber-500/20 text-stone-500 opacity-60'
                              : 'bg-[#2A1F18] border-amber-500/40 text-[#FDE047] hover:border-amber-400 hover:bg-[#382B20] active:scale-95'
                          }`}
                          style={{ fontFamily: "'Cinzel', serif" }}
                        >
                          <span className="text-sm">{res.icon}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Inscribe Anonymous Thought Form */}
                <div className="bg-[#241913] border border-amber-500/40 rounded-xl p-5 space-y-4">
                  {/* Case A: User is the Author */}
                  {selectedLetter.isMine ? (
                    <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-xl text-center space-y-1 font-serif">
                      <p className="text-xs sm:text-sm font-bold text-[#FDE047]">
                        📜 Author's Observation Chamber
                      </p>
                      <p className="text-xs text-amber-200 italic">
                        This is your letter. You can read what others wrote below, but you cannot comment on your own.
                      </p>
                    </div>
                  ) : selectedLetter.hasCommented ? (
                    /* Case B: User already commented once */
                    <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-center space-y-1 font-serif">
                      <p className="text-xs sm:text-sm font-bold text-emerald-200">
                        ✨ Reflection Sealed
                      </p>
                      <p className="text-xs text-emerald-300/80 italic">
                        You have already left your one thought on this letter.
                      </p>
                    </div>
                  ) : (
                    /* Case C: User can inscribe their single reflection */
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-[#FDE047] uppercase tracking-wider flex items-center gap-2 font-serif">
                          <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                          <span>Inscribe an Anonymous Thought</span>
                        </h4>
                        <span className="text-[10px] text-amber-300 font-serif italic">
                          100% Anonymous • 1 Reflection per Scribe
                        </span>
                      </div>

                      <form onSubmit={handlePostThought} className="space-y-3">
                        <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-[#FDE047] font-serif flex items-center justify-between">
                          <span>We will generate a random pseudonym for you — nobody can trace it back.</span>
                          <span className="text-[11px] font-mono text-amber-300">Randomized Alias</span>
                        </div>

                        <div>
                          <textarea
                            rows={3}
                            value={newThoughtContent}
                            onChange={(e) => setNewThoughtContent(e.target.value)}
                            placeholder="Leave a word of comfort, a resonant quote, or a quiet reflection..."
                            className="w-full p-3 bg-[#17100B] border border-amber-500/40 rounded-lg text-xs sm:text-sm text-amber-100 focus:outline-none focus:border-amber-400 font-serif resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[10px] italic text-amber-300/80 font-serif">
                            * The author can read your thought, but cannot reply.
                          </p>

                          <button
                            type="submit"
                            disabled={submittingThought || !newThoughtContent.trim()}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 font-black hover:brightness-110 active:scale-[0.98] transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            style={{ fontFamily: "'Cinzel', serif" }}
                          >
                            {submittingThought ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>{submittingThought ? 'Sealing...' : 'Inscribe Single Reflection'}</span>
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                  {thoughtSuccessNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs rounded-lg flex items-center gap-2 font-serif"
                    >
                      <span>✨ Your thought is now attached to this letter for good.</span>
                    </motion.div>
                  )}
                </div>

                {/* 4. Thoughts & Reflections Stream */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#FDE047] uppercase tracking-wider flex items-center gap-2 font-serif">
                    <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                    <span>Inscribed Thoughts & Reflections ({selectedLetter.thoughts?.length || 0})</span>
                  </h4>

                  {!selectedLetter.thoughts || selectedLetter.thoughts.length === 0 ? (
                    <div className="p-6 bg-black/40 border border-amber-500/20 rounded-xl text-center space-y-1">
                      <p className="text-xs italic text-amber-300/80 font-serif">
                        No thoughts have been inscribed upon this scroll yet. Be the first to leave a gentle reflection.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedLetter.thoughts.map((thought, idx) => (
                        <div
                          key={thought._id || idx}
                          className="p-3.5 rounded-xl bg-gradient-to-r from-[#201610] to-[#17100C] border border-amber-500/30 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#FDE047] font-serif flex items-center gap-1.5">
                              <span>{thought.resonanceBadge || '🕯️'}</span>
                              <span>{thought.authorAlias || 'A Wandering Soul'}</span>
                            </span>
                            <span className="text-[10px] text-amber-300/70 font-mono">
                              {new Date(thought.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs text-amber-100 italic font-serif pl-5 border-l border-amber-500/40">
                            "{thought.content}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
