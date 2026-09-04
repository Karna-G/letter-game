import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Newspaper, Sparkles, BookOpen, Award, 
  Send, Inbox, Shield, Compass, ChevronRight, Check, Printer, RefreshCw
} from 'lucide-react';
import { 
  getMyGazettes, markGazetteRead, generateSpecialGazette, 
  type GazetteEdition 
} from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';
import { notify } from '../components/RealmDialog';

export default function PhantomGazettePage() {
  const [gazettes, setGazettes] = useState<GazetteEdition[]>([]);
  const [activeGazette, setActiveGazette] = useState<GazetteEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [summoning, setSummoning] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchGazettes = async (selectId?: string) => {
    try {
      setLoading(true);
      const res = await getMyGazettes();
      const list = res.gazettes || [];
      setGazettes(list);
      
      if (list.length > 0) {
        if (selectId) {
          const found = list.find(g => g._id === selectId) || list[0];
          setActiveGazette(found);
          handleAutoMarkRead(found);
        } else if (!activeGazette) {
          setActiveGazette(list[0]);
          handleAutoMarkRead(list[0]);
        }
      }
    } catch (err) {
      console.error('Could not load gazettes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGazettes();
  }, []);

  const handleAutoMarkRead = async (g: GazetteEdition) => {
    if (g && !g.isRead) {
      try {
        await markGazetteRead(g._id);
        g.isRead = true;
        setGazettes(prev => prev.map(item => item._id === g._id ? { ...item, isRead: true } : item));
      } catch (_) {}
    }
  };

  const handleSelectEdition = (g: GazetteEdition) => {
    try {
      waxSealAudio.playParchmentUnroll();
    } catch (_) {}
    setActiveGazette(g);
    handleAutoMarkRead(g);
  };

  const handleSummonSpecial = async () => {
    setSummoning(true);
    try {
      try {
        waxSealAudio.playWaxStampThud();
      } catch (_) {}
      const res = await generateSpecialGazette();
      setActionMsg(res.message || 'An extraordinary broadside has been printed!');
      setTimeout(() => setActionMsg(null), 5000);
      await fetchGazettes(res.gazette._id);
    } catch (err: any) {
      notify.error(err.message || 'Could not summon special gazette');
    } finally {
      setSummoning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto space-y-6 pb-12 print:p-0 print:m-0"
    >
      {/* Top Controls & Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-sm bg-stone-950/80 border border-amber-900/40 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400">
            <Newspaper className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-400 font-mono block">
              Royal Newsstand & Chronicle
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
              The Postmaster's Phantom Gazette
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSummonSpecial}
            disabled={summoning}
            className="btn-gold-saloon text-xs py-2 px-3.5 flex items-center gap-1.5 shadow"
            title="Request the Master Printer to publish an extraordinary edition"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${summoning ? 'animate-spin' : ''}`} />
            <span>{summoning ? 'Printing Press...' : 'Summon Extra Dispatch'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-gold-saloon text-xs py-2 px-3 flex items-center gap-1.5"
            title="Print or Save Broadside"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Broadside</span>
          </button>

          <Link to="/" className="btn-velvet-burgundy text-xs py-2 px-3.5">
            ← My Desk
          </Link>
        </div>
      </div>

      {actionMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-sm text-xs font-mono font-bold text-center bg-amber-950/80 text-amber-200 border border-amber-500/50 shadow-lg"
        >
          {actionMsg}
        </motion.div>
      )}

      {/* Main Grid: Archive Shelf (Left/Drawer) & Active Broadside (Right/Center) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Gazette Archive Shelf (3 cols) */}
        <div className="lg:col-span-3 space-y-3 print:hidden">
          <div className="theatrical-card p-4 rounded-sm border border-amber-900/40 bg-stone-950/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Archive Shelf ({gazettes.length})</span>
              </span>

              <button
                onClick={() => fetchGazettes()}
                className="text-stone-400 hover:text-amber-300 p-1"
                title="Refresh Archives"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading && gazettes.length === 0 ? (
              <div className="text-xs italic text-stone-400 py-6 text-center">
                Unrolling archived broadsides...
              </div>
            ) : gazettes.length === 0 ? (
              <div className="text-xs italic text-stone-400 py-6 text-center">
                No archived editions found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {gazettes.map((g) => {
                  const isSelected = activeGazette?._id === g._id;
                  return (
                    <div
                      key={g._id}
                      onClick={() => handleSelectEdition(g)}
                      className={`p-2.5 rounded-sm border transition-all cursor-pointer group flex flex-col gap-1 ${
                        isSelected
                          ? 'selected-glow-gold bg-amber-950/80 text-amber-100'
                          : 'bg-stone-900/60 border-stone-800 hover:border-amber-700/50 hover:bg-stone-900/90 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-amber-400/90 font-bold">{g.volume} • #{g.editionNumber}</span>
                        {!g.isRead ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-900/80 text-rose-200 border border-rose-600/50 text-[9px] font-bold">
                            NEW
                          </span>
                        ) : (
                          <span className="text-stone-400 flex items-center gap-0.5 text-[9px]">
                            <Check className="w-2.5 h-2.5 text-emerald-400" /> Read
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold font-serif line-clamp-1 group-hover:text-amber-200 transition-colors">
                        {g.headline}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-stone-400 italic">
                        <span>{new Date(g.date).toLocaleDateString()}</span>
                        <span className="text-amber-400 font-serif flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* Right Column: The Vintage Newspaper Broadside (9 cols) */}
        <div className="lg:col-span-9">
          {activeGazette ? (
            <article
              className="relative p-6 sm:p-10 md:p-12 rounded-sm shadow-2xl text-stone-900 overflow-hidden font-serif select-text border border-amber-900/60"
              style={{
                background: 'linear-gradient(135deg, #FBF6E9 0%, #F5E8C7 50%, #EDE0BC 100%)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 0 100px rgba(180,140,80,0.15)',
                color: '#1C150C'
              }}
            >
              {/* Outer Decorative Double Border Rule */}
              <div className="border-4 border-double border-stone-800 p-4 sm:p-6 md:p-8 space-y-6">
                
                {/* ── TOP NEWSPAPER MASTHEAD ── */}
                <header className="border-b-4 border-stone-900 pb-4 text-center space-y-2">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-widest font-mono border-b border-stone-800 pb-1.5 px-2 text-stone-700">
                    <span>{activeGazette.volume} • NO. {activeGazette.editionNumber}</span>
                    <span className="font-bold text-amber-900">ROYAL IMPRIMATUR</span>
                    <span>PRICE: TWO FARTHINGS</span>
                  </div>

                  {/* Grand Newspaper Title */}
                  <h1
                    className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-wider uppercase pt-2"
                    style={{
                      fontFamily: "'Cinzel Decorative', serif",
                      letterSpacing: '0.05em',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.15)'
                    }}
                  >
                    {activeGazette.title}
                  </h1>

                  {/* Motto & Date Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t-2 border-b-2 border-stone-800 py-1.5 px-2 text-xs sm:text-sm italic font-medium">
                    <span>❦ "Verba Volant, Scripta Manent" ❦</span>
                    <span className="font-bold not-italic font-mono uppercase tracking-wide">
                      {activeGazette.formattedDateStr || new Date(activeGazette.date).toDateString()}
                    </span>
                    <span>Dispatched across all Realm Provinces</span>
                  </div>

                  {/* Postal Weather & Celestial Conditions */}
                  {activeGazette.weatherForecast && (
                    <div className="bg-stone-900/10 border border-stone-800/30 p-2 text-xs italic flex items-center justify-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-stone-700 flex-shrink-0" />
                      <span><strong>Imperial Weather Scribe:</strong> {activeGazette.weatherForecast}</span>
                    </div>
                  )}
                </header>

                {/* ── SUBTITLE / BANNER ── */}
                <div className="text-center border-b border-stone-800/40 pb-3">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                    {activeGazette.headline}
                  </h2>
                  {activeGazette.subtitle && (
                    <p className="text-xs sm:text-sm italic text-stone-700 mt-1">
                      {activeGazette.subtitle}
                    </p>
                  )}
                </div>

                {/* ── THREE-COLUMN NEWSPAPER CONTENT BODY ── */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  
                  {/* Lead Story & Editorial (md: 7 cols) */}
                  <div className="md:col-span-7 space-y-4 md:border-r md:border-stone-800/40 md:pr-6">
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                        {activeGazette.leadStory.heading}
                      </h3>

                      {/* Woodcut Engraving Art Frame */}
                      <div className="p-3 bg-stone-900/5 border-2 border-stone-800 text-center my-3 shadow-inner flex flex-col items-center">
                        <WoodcutIcon name={activeGazette.leadStory.woodcutIllustration} />
                        <span className="text-[10px] uppercase font-mono tracking-widest text-stone-600 mt-2 block border-t border-stone-800/30 pt-1 w-full">
                          Fig. I — Woodcut Engraving from the Postmaster’s Press
                        </span>
                      </div>

                      {/* Article Text with Lead Drop Cap */}
                      <p className="text-sm sm:text-base leading-relaxed text-justify first-letter:float-left first-letter:text-5xl first-letter:pr-2 first-letter:font-bold first-letter:font-serif first-letter:text-stone-900">
                        {activeGazette.leadStory.content}
                      </p>
                    </div>

                    {/* Editorial Soliloquy Quote Box */}
                    {activeGazette.editorialQuote?.quote && (
                      <div className="p-4 bg-stone-900/10 border-l-4 border-stone-800 italic text-sm sm:text-base space-y-1 shadow-sm">
                        <p>{activeGazette.editorialQuote.quote}</p>
                        <span className="block text-right text-xs not-italic font-mono font-bold text-stone-700">
                          — {activeGazette.editorialQuote.author}
                        </span>
                      </div>
                    )}

                    {/* Community Highlights & Dispatches */}
                    {activeGazette.communityHighlights?.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-stone-800/30">
                        <h4 className="text-xs uppercase tracking-[0.2em] font-bold font-mono text-stone-800 border-b border-stone-800 pb-1">
                          Royal Scriptorium Dispatches
                        </h4>
                        {activeGazette.communityHighlights.map((ch, idx) => (
                          <div key={idx} className="space-y-0.5 text-xs sm:text-sm">
                            <strong className="block font-serif text-stone-900">✦ {ch.title}:</strong>
                            <p className="italic text-stone-800 leading-normal">{ch.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sidebar Columns: User Postal Journey & Classifieds (md: 5 cols) */}
                  <div className="md:col-span-5 space-y-6">
                    
                    {/* ── THY PERSONAL POSTAL JOURNEY BOX ── */}
                    <div className="p-4 rounded-sm bg-amber-950/10 border-2 border-stone-800 space-y-3 shadow-inner">
                      <div className="border-b border-stone-800 pb-1.5 text-center">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-amber-900 block">
                          Official Recipient Audit
                        </span>
                        <h4 className="text-base font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                          Your Postal Chronicle
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2 bg-stone-900/10 border border-stone-800/40 rounded">
                          <Send className="w-3.5 h-3.5 mx-auto text-amber-900 mb-0.5" />
                          <span className="font-mono font-extrabold text-base block text-stone-900">
                            {activeGazette.userPostalJourney.lettersSent}
                          </span>
                          <span className="text-[10px] uppercase font-serif text-stone-700">Penned & Sent</span>
                        </div>

                        <div className="p-2 bg-stone-900/10 border border-stone-800/40 rounded">
                          <Inbox className="w-3.5 h-3.5 mx-auto text-amber-900 mb-0.5" />
                          <span className="font-mono font-extrabold text-base block text-stone-900">
                            {activeGazette.userPostalJourney.lettersReceived}
                          </span>
                          <span className="text-[10px] uppercase font-serif text-stone-700">Received</span>
                        </div>

                        <div className="p-2 bg-stone-900/10 border border-stone-800/40 rounded">
                          <Award className="w-3.5 h-3.5 mx-auto text-amber-900 mb-0.5" />
                          <span className="font-mono font-extrabold text-base block text-stone-900">
                            {activeGazette.userPostalJourney.reputationScore}
                          </span>
                          <span className="text-[10px] uppercase font-serif text-stone-700">Honour Score</span>
                        </div>

                        <div className="p-2 bg-stone-900/10 border border-stone-800/40 rounded">
                          <Shield className="w-3.5 h-3.5 mx-auto text-amber-900 mb-0.5" />
                          <span className="font-mono font-extrabold text-base block text-stone-900">
                            {activeGazette.userPostalJourney.deliveriesCompleted}
                          </span>
                          <span className="text-[10px] uppercase font-serif text-stone-700">Deliveries</span>
                        </div>
                      </div>

                      {activeGazette.userPostalJourney.milestoneAchieved && (
                        <div className="p-2 bg-amber-200/50 border border-amber-800 text-center rounded text-xs font-bold text-amber-950 font-serif">
                          🎖️ {activeGazette.userPostalJourney.milestoneAchieved}
                        </div>
                      )}

                      <div className="text-[11px] italic text-center text-stone-700 pt-1">
                        Rank: <strong>{activeGazette.userPostalJourney.rank}</strong> • Unread in Box: <strong>{activeGazette.userPostalJourney.unreadMailboxCount}</strong>
                      </div>
                    </div>

                    {/* ── POSTAL CLASSIFIEDS & NOTICES ── */}
                    {activeGazette.fictionalPostalClassifieds?.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="border-b-2 border-stone-800 pb-1 text-center">
                          <h4 className="text-xs uppercase tracking-[0.25em] font-mono font-bold text-stone-900">
                            Postal Classifieds & Notices
                          </h4>
                        </div>

                        <div className="space-y-2 text-xs">
                          {activeGazette.fictionalPostalClassifieds.map((cl, idx) => (
                            <div key={idx} className="p-2 bg-stone-900/5 border-l-2 border-stone-800 space-y-0.5">
                              <span className="font-mono font-bold text-[10px] text-amber-900 uppercase">
                                [{cl.tag}]
                              </span>
                              <p className="italic text-stone-800 leading-tight">
                                {cl.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wax Seal Medallion Stamp of Authenticity */}
                    <div className="pt-4 text-center flex flex-col items-center justify-center space-y-1">
                      <div className="w-14 h-14 rounded-full bg-red-900 text-amber-200 border-2 border-amber-400 shadow-md flex items-center justify-center text-2xl font-bold font-serif">
                        ⚜️
                      </div>
                      <span className="text-[9px] uppercase tracking-widest font-mono text-stone-700 font-bold">
                        Certified by High Post Office
                      </span>
                    </div>

                  </div>
                </div>

                {/* ── FOOTER BAR ── */}
                <footer className="border-t-2 border-stone-800 pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-600 font-mono gap-2">
                  <span>PRINTED AT THE EPISTOLARY PRESS, STATIONERS LANE</span>
                  <span>PRESERVED IN SOVEREIGN ARCHIVE</span>
                  <span>NO COPYING WITHOUT POSTAL SEAL</span>
                </footer>
              </div>
            </article>
          ) : (
            <div className="theatrical-card p-12 text-center rounded-sm border border-amber-900/40 bg-stone-950/80">
              <p className="text-stone-400 italic font-serif">
                Select an archived edition from the shelf or summon a fresh dispatch above.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// VINTAGE WOODCUT VECTOR ILLUSTRATIONS
// ============================================
function WoodcutIcon({ name }: { name?: string }) {
  if (name === 'pigeon') {
    return (
      <svg viewBox="0 0 100 70" className="w-32 h-24 text-stone-900 stroke-current fill-none">
        <path d="M 20 45 Q 40 20 65 30 Q 85 40 75 55 Q 55 65 30 55 Z" strokeWidth="2.5" />
        <path d="M 65 30 Q 75 15 85 22 Q 80 32 75 35" strokeWidth="2" />
        <circle cx="78" cy="24" r="2" fill="currentColor" />
        <path d="M 30 45 Q 45 10 55 35" strokeWidth="2" strokeDasharray="3,2" />
        <line x1="15" y1="50" x2="5" y2="40" strokeWidth="2" />
        <line x1="18" y1="52" x2="8" y2="48" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'owl') {
    return (
      <svg viewBox="0 0 100 70" className="w-32 h-24 text-stone-900 stroke-current fill-none">
        <ellipse cx="50" cy="40" rx="20" ry="25" strokeWidth="2.5" />
        <circle cx="42" cy="28" r="6" strokeWidth="2" />
        <circle cx="58" cy="28" r="6" strokeWidth="2" />
        <circle cx="42" cy="28" r="2.5" fill="currentColor" />
        <circle cx="58" cy="28" r="2.5" fill="currentColor" />
        <polygon points="48,32 52,32 50,38" fill="currentColor" />
        <path d="M 32 18 L 38 24 M 68 18 L 62 24" strokeWidth="2.5" />
      </svg>
    );
  }
  if (name === 'ship') {
    return (
      <svg viewBox="0 0 100 70" className="w-32 h-24 text-stone-900 stroke-current fill-none">
        <path d="M 15 50 Q 50 62 85 50 L 78 62 L 22 62 Z" strokeWidth="2.5" />
        <line x1="50" y1="50" x2="50" y2="15" strokeWidth="3" />
        <path d="M 50 18 Q 72 25 50 42" strokeWidth="2" strokeDasharray="4,2" />
        <path d="M 50 20 Q 30 28 50 45" strokeWidth="2" />
        <path d="M 10 66 Q 30 62 50 66 Q 70 70 90 66" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'carriage') {
    return (
      <svg viewBox="0 0 100 70" className="w-32 h-24 text-stone-900 stroke-current fill-none">
        <rect x="25" y="20" width="50" height="30" rx="4" strokeWidth="2.5" />
        <circle cx="35" cy="55" r="10" strokeWidth="2.5" />
        <circle cx="68" cy="55" r="10" strokeWidth="2.5" />
        <line x1="10" y1="40" x2="25" y2="40" strokeWidth="2" />
        <rect x="35" y="26" width="12" height="12" strokeWidth="1.5" />
        <rect x="53" y="26" width="12" height="12" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === 'wax_seal') {
    return (
      <svg viewBox="0 0 100 70" className="w-32 h-24 text-stone-900 stroke-current fill-none">
        <circle cx="50" cy="35" r="22" strokeWidth="2.5" />
        <circle cx="50" cy="35" r="16" strokeWidth="1.5" strokeDasharray="3,2" />
        <path d="M 44 35 L 50 25 L 56 35 L 50 45 Z" strokeWidth="2" />
      </svg>
    );
  }
  // Default: Quill & Scroll
  return (
    <svg viewBox="0 0 100 70" className="w-32 h-24 text-stone-900 stroke-current fill-none">
      <path d="M 30 55 Q 50 35 70 15 Q 75 25 55 45 Q 40 58 30 55 Z" strokeWidth="2.5" />
      <line x1="30" y1="55" x2="68" y2="18" strokeWidth="1.5" />
      <circle cx="28" cy="57" r="2" fill="currentColor" />
      <path d="M 20 62 Q 50 58 80 62" strokeWidth="2" strokeDasharray="4,2" />
    </svg>
  );
}
