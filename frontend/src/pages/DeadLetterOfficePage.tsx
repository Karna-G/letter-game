import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Feather, Ghost, Atom, Waves, Inbox, Archive, X, Clock, Sparkles } from 'lucide-react';
import { getDeadLetters } from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';
import deadLetterOfficeBg from '../assets/dead_letter_office_bg.jpg';
import HandwrittenLetterPaper from '../components/HandwrittenLetterPaper';
import LetterEnvelopeWrapper from '../components/LetterEnvelopeWrapper';

export default function DeadLetterOfficePage() {
  const [deadLetters, setDeadLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'dybbuk' | 'schrodinger' | 'bottle' | 'standard'>('all');
  const [openLetter, setOpenLetter] = useState<any>(null);
  const [isClosingScroll, setIsClosingScroll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchDeadLetters = async () => {
    setLoading(true);
    try {
      const data = await getDeadLetters();
      const arr = Array.isArray(data) ? data : [];
      // Latest to oldest sort
      arr.sort((a, b) => new Date(b.abandonedAt || b.createdAt || 0).getTime() - new Date(a.abandonedAt || a.createdAt || 0).getTime());
      setDeadLetters(arr);
    } catch (e) {
      console.error("Could not load Dead Letter Office:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadLetters();
  }, []);

  const handleOpenLetter = (letter: any) => {
    waxSealAudio.playWaxCrack();
    setTimeout(() => {
      waxSealAudio.playParchmentUnroll();
    }, 180);
    setOpenLetter(letter);
    setIsClosingScroll(false);
  };

  const handleCloseLetter = () => {
    setIsClosingScroll(true);
    waxSealAudio.playParchmentUnroll();
    setTimeout(() => {
      waxSealAudio.playWaxStampThud();
    }, 220);
    setTimeout(() => {
      setOpenLetter(null);
      setIsClosingScroll(false);
    }, 550);
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

  const getFontSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'text-xs sm:text-sm';
      case 'large': return 'text-lg sm:text-xl';
      default: return 'text-sm sm:text-base';
    }
  };

  const filteredLetters = deadLetters.filter(l => {
    if (activeTab === 'dybbuk' && l.type !== 'dybbuk' && l.type !== 'dibbyuk') return false;
    if (activeTab === 'schrodinger' && l.type !== 'schrodinger') return false;
    if (activeTab === 'bottle' && l.type !== 'bottle') return false;
    if (activeTab === 'standard' && (l.type === 'dybbuk' || l.type === 'dibbyuk' || l.type === 'schrodinger' || l.type === 'bottle')) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.content?.toLowerCase().includes(q) ||
      l.senderRef?.name?.toLowerCase().includes(q) ||
      l.spectralSender?.name?.toLowerCase().includes(q) ||
      l.bottleMoniker?.toLowerCase().includes(q) ||
      l.abandonReason?.toLowerCase().includes(q)
    );
  });

  const displayedLetters = filteredLetters.slice(0, visibleCount);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 25 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} 
      className="max-w-6xl mx-auto space-y-6"
    >
      <div 
        className="theatrical-card p-6 sm:p-10 relative overflow-hidden rounded-sm"
        style={{
          background: `linear-gradient(175deg, rgba(16,13,11,0.92) 0%, rgba(8,6,5,0.98) 100%), url(${deadLetterOfficeBg}) center/cover no-repeat`,
          border: '1px solid rgba(63, 169, 122, 0.45)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
        }}
      >
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 pb-5" style={{ borderBottom: '1px solid rgba(63, 169, 122,0.25)' }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold mb-2 animate-float-gentle" style={{ background: 'rgba(63, 169, 122,0.15)', border: '1px solid rgba(63, 169, 122,0.4)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              <span>🏛️ The Public Realm Repository</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-wide flex items-center gap-3" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
              <Archive className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" style={{ color: 'var(--antique-gold)' }} />
              The Dead Letter Office
            </h1>
            <p className="text-sm sm:text-base italic mt-1 font-serif" style={{ color: 'var(--gold-muted)' }}>
              Letters that were ignored, never delivered, or abandoned by their owners — kept in a public archive for anyone to read.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/mailbox" className="btn-gold-saloon text-xs py-2 px-4 flex items-center gap-1.5 shadow">
              <Inbox className="w-4 h-4 text-amber-500" /> Your Mailbox
            </Link>
            <Link to="/" className="btn-velvet-burgundy text-xs py-2 px-4 shadow">
              ← My Desk
            </Link>
          </div>
        </div>

        {/* Thematic Banner */}
        <div className="p-4 sm:p-5 mb-6 rounded-sm flex items-start gap-3.5" style={{ background: 'rgba(63, 169, 122,0.08)', border: '1px solid rgba(63, 169, 122,0.25)' }}>
          <Sparkles className="w-6 h-6 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--parchment-light)' }}>
            <strong className="text-amber-300 font-bold" style={{ fontFamily: "'Cinzel', serif" }}>The Law of Abandoned Inscriptions:</strong> When someone releases a letter from their mailbox, or a letter goes unclaimed too long, it is placed here in these pigeonholes. Anyone may open it, read it, and make of it what they will.
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by phrase, sender, origin, or why it was abandoned…" 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(5); }} 
              className="w-full p-3.5 pl-11 rounded-sm text-base sm:text-lg font-serif italic focus:outline-none transition-all shadow-inner"
              style={{
                background: '#FFFDF9',
                color: '#1A1A1A',
                border: '1px solid var(--border-subtle)'
              }}
            />
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6" style={{ borderBottom: '1px solid rgba(63, 169, 122,0.2)' }}>
          {[
            { key: 'all', label: 'All Dead Letters', count: deadLetters.length },
            { key: 'standard', label: 'Classic Epistles', count: deadLetters.filter(l => l.type === 'standard' || !l.type).length },
            { key: 'dybbuk', label: 'Spectral Shards', count: deadLetters.filter(l => l.type === 'dybbuk' || l.type === 'dibbyuk').length },
            { key: 'schrodinger', label: 'Quantum Collapses', count: deadLetters.filter(l => l.type === 'schrodinger').length },
            { key: 'bottle', label: 'Castaway Bottles', count: deadLetters.filter(l => l.type === 'bottle').length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key as any); setVisibleCount(5); }}
              className="px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-sm transition-all flex items-center gap-2"
              style={{
                fontFamily: "'Cinzel', serif",
                background: activeTab === t.key ? 'linear-gradient(135deg, #12513A 0%, #08251A 100%)' : 'transparent',
                color: activeTab === t.key ? '#FFF' : 'var(--gold-muted)',
                border: activeTab === t.key ? '1px solid var(--antique-gold)' : '1px solid transparent',
                borderBottom: 'none'
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 text-center italic" style={{ color: 'var(--gold-muted)' }}>
            <Feather className="w-9 h-9 mx-auto animate-spin mb-3" style={{ color: 'var(--antique-gold)' }} />
            <p className="text-lg font-serif">Unlocking the vaults of the Dead Letter Office...</p>
          </div>
        ) : filteredLetters.length === 0 ? (
          <div className="text-center py-16 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(63, 169, 122,0.3)', color: 'var(--gold-muted)' }}>
            <Archive className="w-12 h-12 mx-auto mb-3 opacity-60" style={{ color: 'var(--antique-gold)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>No dead letters here yet.</p>
            <p className="text-sm mt-1 italic font-serif">When someone abandons a letter from their mailbox, it appears here for everyone to read.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedLetters.map((l: any, i) => {
                const isDybbuk = l.type === 'dybbuk' || l.type === 'dibbyuk';
                const isSchrodinger = l.type === 'schrodinger';
                const isBottle = l.type === 'bottle';

                let badgeText = '📜 FORSAKEN SCROLL';
                let badgeColor = '#78350F';
                if (isDybbuk) {
                  badgeText = '🔮 SPECTRAL SHARD';
                  badgeColor = '#6B21A8';
                } else if (isSchrodinger) {
                  badgeText = '⚛️ QUANTUM PARADOX';
                  badgeColor = '#0284C7';
                } else if (isBottle) {
                  badgeText = '🌊 CASTAWAY BOTTLE';
                  badgeColor = '#065F46';
                }

                let senderTitle = l.senderRef?.name || 'A Lost Scribe';
                if (isDybbuk) {
                  senderTitle = l.spectralSender?.name || 'Spectral Entity';
                } else if (isBottle) {
                  senderTitle = l.isAnonymous ? 'An Anonymous Mariner' : (l.senderRef?.name || 'A Sailor');
                }

                return (
                  <div 
                    key={l._id || i} 
                    className="theatrical-card p-5 rounded-sm flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-1"
                    style={{
                      background: isDybbuk 
                        ? 'linear-gradient(145deg, rgba(38,18,58,0.88) 0%, rgba(18,10,28,0.96) 100%)' 
                        : isSchrodinger 
                          ? 'linear-gradient(145deg, rgba(8,47,73,0.88) 0%, rgba(3,21,38,0.96) 100%)'
                          : isBottle
                            ? 'linear-gradient(145deg, rgba(6,95,70,0.88) 0%, rgba(2,44,34,0.96) 100%)'
                            : 'linear-gradient(145deg, #24201C 0%, #151311 100%)',
                      border: '1px solid rgba(63, 169, 122,0.3)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.6)'
                    }}
                  >
                    {/* Top Pigeonhole Tag */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {l.abandonedAt ? `Abandoned ${new Date(l.abandonedAt).toLocaleDateString()}` : `Archived ${new Date(l.createdAt).toLocaleDateString()}`}
                      </span>

                      <span 
                        className="px-2 py-0.5 text-[9px] font-bold text-white rounded-sm uppercase tracking-wider shadow"
                        style={{ background: badgeColor, fontFamily: "'Cinzel', serif" }}
                      >
                        {badgeText}
                      </span>
                    </div>

                    <div>
                      <div className="mb-3 pb-2" style={{ borderBottom: '1px solid rgba(63, 169, 122,0.2)' }}>
                        <p className="font-bold text-base sm:text-lg flex items-center gap-1.5 truncate" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                          {isDybbuk && <Ghost className="w-4 h-4 text-purple-400" />}
                          {isSchrodinger && <Atom className="w-4 h-4 text-sky-400 animate-spin" />}
                          {isBottle && <Waves className="w-4 h-4 text-emerald-400" />}
                          <span className="truncate">From: {senderTitle}</span>
                        </p>
                        <p className="text-xs italic mt-0.5 line-clamp-1" style={{ color: 'var(--gold-muted)' }}>
                          {l.abandonReason || 'Unclaimed in mailbox & released to public archive'}
                        </p>
                      </div>

                      {/* Content Preview */}
                      <div 
                        className="text-sm sm:text-base whitespace-pre-wrap line-clamp-4 p-3 rounded-sm shadow-inner mb-4 leading-relaxed"
                        style={{
                          background: '#FFFDF9',
                          color: '#1A1A1A',
                          border: '1px solid var(--border-subtle)',
                          fontFamily: getFontFamily(l.font)
                        }}
                      >
                        {l.content}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 mt-auto flex items-center justify-between" style={{ borderTop: '1px solid rgba(63, 169, 122,0.2)' }}>
                      <span className="text-[11px] font-serif italic text-stone-400">
                        {isBottle ? `Bottle: "${l.bottleMoniker || 'Ocean Relic'}"` : `Script: ${l.font || 'Cinzel'}`}
                      </span>

                      <button
                        onClick={() => handleOpenLetter(l)}
                        className="py-1.5 px-4 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-all shadow"
                        style={{
                          background: isDybbuk ? '#7E22CE' : (isSchrodinger ? '#0284C7' : (isBottle ? '#059669' : 'var(--burgundy)')),
                          color: '#FFF',
                          fontFamily: "'Cinzel', serif"
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Read Lost Epistle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination / Load More Controls ── */}
            <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(63, 169, 122,0.25)' }}>
              <p className="text-xs sm:text-sm font-mono" style={{ color: 'var(--gold-muted)' }}>
                Showing <strong className="text-amber-300">{Math.min(visibleCount, filteredLetters.length)}</strong> of <strong className="text-amber-300">{filteredLetters.length}</strong> dead letters (newest first)
              </p>
              
              <div className="flex flex-wrap items-center gap-2.5">
                {visibleCount < filteredLetters.length && (
                  <button
                    onClick={() => setVisibleCount(c => c + 5)}
                    className="btn-gold-saloon text-xs py-2 px-5 shadow"
                  >
                    See More (+5 Letters)
                  </button>
                )}
                {visibleCount < filteredLetters.length && (
                  <button
                    onClick={() => setVisibleCount(filteredLetters.length)}
                    className="btn-velvet-burgundy text-xs py-2 px-5 shadow font-bold"
                  >
                    SEE ALL ({filteredLetters.length})
                  </button>
                )}
                {visibleCount >= filteredLetters.length && filteredLetters.length > 5 && (
                  <button
                    onClick={() => setVisibleCount(5)}
                    className="btn-gold-saloon text-xs py-2 px-4 shadow opacity-80 hover:opacity-100"
                  >
                    Show Less (First 5)
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reader Modal with 3D Parchment Scroll Unfurling */}
      <AnimatePresence>
        {openLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
            <div className={`max-w-lg w-full relative ${isClosingScroll ? 'animate-scroll-roll-close' : 'animate-scroll-unroll'}`}>
              {/* Top Wooden Rod */}
              <div className="scroll-rod-top" />

              <div className="parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl">
                <button onClick={handleCloseLetter} className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1 transition-colors">
                  <X className="w-6 h-6" />
                </button>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/20 border border-amber-800/40 text-amber-900 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    <span>🏛️ Dead Letter Office Record</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: '#3A1F04' }}>
                    {openLetter.type === 'bottle' ? (openLetter.bottleMoniker || 'Ocean Castaway Scroll') : `Letter from ${openLetter.senderRef?.name || openLetter.spectralSender?.name || 'A Lost Author'}`}
                  </h3>

                  <p className="text-xs italic mb-4" style={{ color: '#78350F' }}>
                    Abandoned on {new Date(openLetter.abandonedAt || openLetter.createdAt).toLocaleString()} • Note: {openLetter.abandonReason || 'Public realm archive'}
                  </p>
                </div>

                {(() => {
                  const deadSenderName = openLetter.senderRef?.name || openLetter.spectralSender?.name || 'A Lost Author';
                  const deadDate = openLetter.createdAt ? new Date(openLetter.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : undefined;
                  return (
                    <LetterEnvelopeWrapper
                      isHandwritten={!!openLetter.isHandwritten}
                      senderName={deadSenderName}
                      isAnonymous={openLetter.isAnonymous}
                      dateStr={deadDate}
                      penStyle={openLetter.isHandwritten ? 'Physical Quill Canvas' : (openLetter.font || 'Cinzel')}
                    >
                      {openLetter.isHandwritten ? (
                        <div className="my-2 max-h-[500px] overflow-y-auto">
                          <HandwrittenLetterPaper
                            content={openLetter.content}
                            senderName={deadSenderName}
                            recipientName={openLetter.receiverRef?.name || openLetter.receiverRef}
                            styleId={openLetter.handwritingStyle}
                            inkId={openLetter.inkColor}
                            paperId={openLetter.parchmentPaper}
                            fontSize={openLetter.fontSize}
                            handwrittenPages={openLetter.handwrittenPages}
                            dateStr={deadDate}
                            isAnonymous={openLetter.isAnonymous}
                          />
                        </div>
                      ) : (
                        <div
                          style={{ fontFamily: getFontFamily(openLetter.font), color: '#1A1A1A' }}
                          className={`px-2 py-3 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed ${getFontSizeClass(openLetter.fontSize)}`}
                        >
                          {openLetter.content}
                        </div>
                      )}
                    </LetterEnvelopeWrapper>
                  );
                })()}

                <div className="mt-5 text-right">
                  <button
                    onClick={handleCloseLetter}
                    className="btn-gold-saloon text-xs py-2 px-5 shadow"
                  >
                    Roll Up Scroll & Close
                  </button>
                </div>
              </div>

              {/* Bottom Wooden Rod */}
              <div className="scroll-rod-bottom" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
