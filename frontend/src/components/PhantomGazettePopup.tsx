import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, X, Pin, ExternalLink, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getNotices } from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';

const pageVariants: Record<string, any> = {
  enter: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? 55 : -55,
    x: direction > 0 ? 40 : -40,
    scale: 0.96,
    transformOrigin: direction > 0 ? 'right center' : 'left center'
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? -55 : 55,
    x: direction > 0 ? -40 : 40,
    scale: 0.96,
    transformOrigin: direction > 0 ? 'left center' : 'right center',
    transition: {
      duration: 0.3
    }
  })
};

export default function PhantomGazettePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const fetchNoticeData = async () => {
    try {
      const data = await getNotices();
      const list = Array.isArray(data) ? data : [];
      setNotices(list);

      const lastReadStr = localStorage.getItem('postmaster_last_read_notice_at');
      const lastReadTime = lastReadStr ? new Date(lastReadStr).getTime() : 0;

      const unreadList = list.filter(n => new Date(n.createdAt).getTime() > lastReadTime);
      setHasUnread(unreadList.length > 0);
      setUnreadCount(unreadList.length);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNoticeData();
    const interval = setInterval(fetchNoticeData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenGazette = () => {
    try {
      waxSealAudio.playParchmentUnroll();
    } catch (_) {}
    setCurrentPage(0);
    setDirection(1);
    setIsOpen(true);
    setHasUnread(false);
    setUnreadCount(0);
    localStorage.setItem('postmaster_last_read_notice_at', new Date().toISOString());
  };

  const handleClose = () => {
    try {
      waxSealAudio.playParchmentUnroll();
    } catch (_) {}
    setIsOpen(false);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      try {
        waxSealAudio.playParchmentUnroll();
      } catch (_) {}
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      try {
        waxSealAudio.playParchmentUnroll();
      } catch (_) {}
      setDirection(-1);
      setCurrentPage(prev => prev - 1);
    }
  };

  // Only show the gazette launcher if there is an unread notice, or if the modal is currently open
  if (!hasUnread && !isOpen) {
    return null;
  }

  const recentNotices = notices.slice(0, 5);
  const totalPages = Math.max(1, recentNotices.length);
  const currentNotice = recentNotices[currentPage] || null;

  const PAGE_TITLES = [
    { title: 'Shaping History', subtitle: 'THE ROLE OF NOTICES & DECREES IN THE REALM', issue: 'PAGE I • FRONT BROADSIDE' },
    { title: 'The Scriptorium Gazette', subtitle: 'IMPERIAL GUILD PROCLAMATIONS & EDICTS', issue: 'PAGE II • INNER CHRONICLE' },
    { title: "The Courier's Dispatch", subtitle: 'DISPATCHES ACROSS REALM HIGHWAYS', issue: 'PAGE III • POSTAL GAZETTE' },
    { title: 'The Grand Archive', subtitle: 'PRESERVED DECREES & HISTORICAL NOTICES', issue: 'PAGE IV • HISTORIC RECORD' },
    { title: 'The Postmaster Ledger', subtitle: 'SOVEREIGN CORRESPONDENCE AUDIT', issue: 'PAGE V • REALM BULLETIN' }
  ];

  const activePageHeader = PAGE_TITLES[currentPage % PAGE_TITLES.length];

  return (
    <>
      {/* ── FLOATING SIDE CORNER NEWSPAPER BADGE (ONLY VISIBLE ON NEW NOTICE) ── */}
      {hasUnread && (
        <div className="fixed bottom-6 right-6 z-40 print:hidden select-none animate-bounce">
          <motion.button
            onClick={handleOpenGazette}
            whileHover={{ scale: 1.1, rotate: -3 }}
            whileTap={{ scale: 0.94 }}
            className="relative p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 border-2 border-amber-400 text-amber-200 animate-glow-pulse shadow-[0_0_30px_rgba(245,158,11,0.7)] cursor-pointer"
            title="A new proclamation has arrived upon the Postmaster's Newsstand!"
          >
            <Newspaper className="w-6 h-6 text-amber-300" />
            <span className="hidden sm:inline-block font-serif font-bold text-xs uppercase tracking-wider text-amber-200">
              New Gazette
            </span>

            {/* Pulsing Red Badge */}
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-extrabold text-[10px] border border-amber-300 shadow-md">
              {unreadCount > 0 ? `${unreadCount} NEW` : 'NEW'}
            </span>
          </motion.button>
        </div>
      )}

      {/* ── AUTHENTIC HISTORIC BROADSIDE MODAL WITH PAGE TURNING ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden"
            onClick={handleClose}
          >
            {/* TALL ELEGANT BROADSIDE CONTAINER */}
            <motion.div
              initial={{ scale: 0.94, y: 25 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 25 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full h-[88vh] max-h-[880px] min-h-[600px] flex flex-col justify-between rounded-none shadow-2xl text-stone-900 font-serif select-text border-2 border-stone-800 p-3 sm:p-6 md:p-7 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FBF6E9 0%, #F6ECD4 50%, #EFE1BF 100%)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.92), inset 0 0 100px rgba(180,140,70,0.2)',
                color: '#15110B',
                perspective: 1200
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-2.5 right-2.5 p-1 rounded-full bg-stone-900/10 hover:bg-stone-900/20 text-stone-800 transition-colors z-30 cursor-pointer"
                title="Close Gazette"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Double Border Frame */}
              <div className="border-4 border-double border-stone-900 p-2.5 sm:p-4 flex flex-col justify-between h-full overflow-hidden">
                
                {/* ── 1. COMPACT GOTHIC MASTHEAD (TIGHTENED NAMEPLATE) ── */}
                <header className="text-center border-b-2 border-stone-900 pb-2 mb-2 flex-shrink-0">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-stone-700 px-1">
                    <span>{activePageHeader.issue}</span>
                    <span className="font-extrabold text-red-900">ROYAL IMPRIMATUR</span>
                    <span>PRICE: TWO FARTHINGS</span>
                  </div>

                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight uppercase my-0.5 transition-all"
                    style={{
                      fontFamily: "'UnifrakturMaguntia', 'MedievalSharp', 'Cinzel Decorative', serif",
                      color: '#B91C1C',
                      letterSpacing: '0.02em',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                    }}
                  >
                    {activePageHeader.title}
                  </h1>

                  {/* Compact Bordered Subheader Box */}
                  <div className="border border-stone-900 py-0.5 px-2 max-w-xl mx-auto bg-stone-900/5 my-0.5">
                    <h2
                      className="text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-wider text-stone-900"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {activePageHeader.subtitle}
                    </h2>
                  </div>

                  <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800 font-serif pt-0.5">
                    POSTMASTER GENERAL • {currentNotice ? `PROCLAIMED ON ${new Date(currentNotice.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}` : 'ROYAL SCRIPTORIUM'}
                  </div>
                </header>

                {/* ── 2. PAGE CONTENT WITH 3D PAGE TURNING TRANSITION ── */}
                <div className="flex-1 overflow-y-auto pr-1 relative" style={{ perspective: 1000 }}>
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={currentPage}
                      custom={direction}
                      variants={pageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-3"
                    >
                      {currentNotice ? (
                        <article className="space-y-2.5">
                          {/* Headline & Author Bar */}
                          <div className="border-b border-stone-900/40 pb-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div>
                              <h3 className="text-base sm:text-xl font-extrabold leading-tight text-stone-950" style={{ fontFamily: "'Cinzel', serif" }}>
                                {currentNotice.title}
                              </h3>
                              <div className="text-[11px] font-bold italic text-stone-700 mt-0.5">
                                Proclaimed by: <span className="text-stone-900">{currentNotice.postedByName || 'The High Post'}</span>
                              </div>
                            </div>

                            {currentNotice.isPinned && (
                              <span className="self-start sm:self-center px-2 py-0.5 text-[9px] font-mono font-bold bg-red-900 text-amber-200 border border-red-700 flex items-center gap-1">
                                <Pin className="w-2.5 h-2.5 fill-amber-200" /> PINNED DECREE
                              </span>
                            )}
                          </div>

                          {/* Boxed Dateline Header */}
                          <div className="border border-stone-900 py-1 px-2 bg-stone-900/5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider font-mono">
                            OFFICIAL DISPATCH • INSCRIBED IN THE SOVEREIGN LEDGER
                          </div>

                          {/* Multi-Column Article Content: Long text automatically wraps across 3 newspaper columns seamlessly */}
                          <div
                            className="columns-1 md:columns-3 gap-5 text-justify text-xs sm:text-[13px] leading-relaxed text-stone-900"
                            style={{
                              columnRule: '1px solid rgba(28, 21, 12, 0.3)',
                              hyphens: 'auto'
                            }}
                          >
                            <p className="first-letter:float-left first-letter:text-4xl first-letter:pr-1.5 first-letter:font-bold first-letter:font-serif first-letter:text-stone-950 whitespace-pre-line leading-relaxed">
                              {currentNotice.content}
                            </p>
                          </div>

                          {/* Bottom Proclamation Box for Page */}
                          <div className="border-2 border-stone-900 p-2 bg-stone-900/5 space-y-0.5 mt-3">
                            <div className="border-b border-stone-900 pb-0.5 text-center font-bold text-[10px] uppercase tracking-widest font-mono text-stone-800">
                              ROYAL SCRIPTORIUM SEAL
                            </div>
                            <p className="text-[10px] italic text-center text-stone-700">
                              "Verba Volant, Scripta Manent — Spoken words fly away, written words remain preserved forever."
                            </p>
                          </div>
                        </article>
                      ) : (
                        <div className="p-8 text-center bg-stone-900/5 border-2 border-dashed border-stone-700/40 space-y-2">
                          <Sparkles className="w-8 h-8 mx-auto text-amber-800 animate-pulse" />
                          <h3 className="text-base font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                            The Printing Press Rests Quietly
                          </h3>
                          <p className="text-xs italic text-stone-600 max-w-md mx-auto">
                            No recent decrees have been proclaimed. The Postmaster General shall publish fresh broadsides shortly.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ── 3. AUTHENTIC NEWSPAPER PAGE TURNING CONTROLS & FOOTER ── */}
                <footer className="border-t-2 border-stone-900 pt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs flex-shrink-0">
                  {/* Page Turning Controls with 3D Page Turning Transition */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      className={`px-3 py-1 border border-stone-900 font-serif font-bold text-xs flex items-center gap-1 transition-all ${
                        currentPage === 0
                          ? 'opacity-35 cursor-not-allowed bg-stone-900/5 text-stone-400'
                          : 'bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 cursor-pointer shadow-sm hover:scale-105 active:scale-95'
                      }`}
                      title="Turn to previous broadside page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous Page</span>
                    </button>

                    <span className="font-mono font-bold text-[11px] uppercase px-2 text-stone-800">
                      PAGE {currentPage + 1} OF {totalPages}
                    </span>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages - 1}
                      className={`px-3 py-1 border border-stone-900 font-serif font-bold text-xs flex items-center gap-1 transition-all ${
                        currentPage >= totalPages - 1
                          ? 'opacity-35 cursor-not-allowed bg-stone-900/5 text-stone-400'
                          : 'bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 cursor-pointer shadow-sm hover:scale-105 active:scale-95'
                      }`}
                      title="Turn to next broadside page"
                    >
                      <span>Next Page</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Direct Link to Full Notice Board */}
                  <Link
                    to="/notice-board"
                    onClick={handleClose}
                    className="px-3.5 py-1 rounded-none text-xs font-bold font-serif bg-amber-950 hover:bg-amber-900 text-amber-200 border border-stone-900 shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>📜 Enter Full Notice Board</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </footer>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}