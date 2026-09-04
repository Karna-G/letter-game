import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Stamp } from 'lucide-react';
import { waxSealAudio } from '../utils/waxSealAudio';

export interface HandwrittenPageData {
  pageNumber: number;
  imageData: string;
  strokesData?: string;
  inkColor?: string;
  parchmentPaper?: string;
}

interface HandwrittenLetterPaperProps {
  content?: string;
  senderName?: string;
  recipientName?: string;
  dateStr?: string;
  isAnonymous?: boolean;
  styleId?: string;
  inkId?: string;
  paperId?: string;
  fontSize?: string;
  handwrittenPages?: HandwrittenPageData[];
}

export const HANDWRITING_STYLES = [
  { id: 'elegant', name: 'Royal Calligraphy', label: 'Royal Calligraphy', fontFamily: "'Great Vibes', cursive", category: 'Formal' },
  { id: 'romantic', name: 'Romantic Penmanship', label: 'Romantic Penmanship', fontFamily: "'Marck Script', cursive", category: 'Intimate' },
  { id: 'casual', name: 'Casual Quill', label: 'Casual Quill', fontFamily: "'Caveat', cursive", category: 'Modern' },
  { id: 'flourish', name: 'Flowing Feathertip', label: 'Flowing Feathertip', fontFamily: "'Alex Brush', cursive", category: 'Artistic' },
  { id: 'old-fashioned', name: 'Graceful Script', label: 'Graceful Script', fontFamily: "'Sacramento', cursive", category: 'Antique' },
  { id: 'calligraphy', name: 'Fluid Quill', label: 'Fluid Quill', fontFamily: "'Dancing Script', cursive", category: 'Expressive' }
];

export const INK_COLORS = [
  { id: 'iron-gall', label: 'Iron Gall Black', color: '#1B1816' },
  { id: 'royal-sepia', label: 'Walnut Sepia', color: '#3E2723' },
  { id: 'midnight-indigo', label: 'Midnight Indigo', color: '#1E293B' },
  { id: 'burgundy-wine', label: 'Burgundy Velvet', color: '#581C28' },
  { id: 'forest-emerald', label: 'Forest Emerald', color: '#064E3B' },
];

export const PARCHMENT_PAPERS = [
  { id: 'vintage-cream', label: 'Vintage Cream Vellum', bgClass: 'bg-[#FAF7F0]' },
  { id: 'lined-ledger', label: 'Ruled Ledger Sheet', bgClass: 'bg-[#FBF7EB]' },
  { id: 'aged-vellum', label: 'Aged Antique Vellum', bgClass: 'bg-[#F4ECE1]' },
  { id: 'royal-parchment', label: 'Royal Court Stationery', bgClass: 'bg-[#FFFDF7]' },
];

export default function HandwrittenLetterPaper({
  content,
  senderName,
  recipientName,
  dateStr,
  isAnonymous,
  styleId = 'elegant',
  inkId = 'iron-gall',
  paperId = 'vintage-cream',
  fontSize = 'medium',
  handwrittenPages = []
}: HandwrittenLetterPaperProps) {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const hasCanvasPages = Array.isArray(handwrittenPages) && handwrittenPages.length > 0;
  const currentPage = hasCanvasPages ? handwrittenPages[activePageIndex] : null;
  const totalPages = hasCanvasPages ? handwrittenPages.length : 1;

  const handlePrevPage = () => {
    if (activePageIndex > 0) {
      try {
        waxSealAudio.playParchmentUnroll();
      } catch (_) {}
      setActivePageIndex(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (activePageIndex < totalPages - 1) {
      try {
        waxSealAudio.playParchmentUnroll();
      } catch (_) {}
      setActivePageIndex(prev => prev + 1);
    }
  };

  // ── CASE 1: PHYSICAL FREEHAND DRAWN CANVAS PAGES ──
  if (hasCanvasPages && currentPage) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 w-full max-w-xl mx-auto select-none">
        {/* Top Postal Header Bar */}
        <div className="w-full flex items-center justify-between text-xs font-serif italic text-amber-900/80 px-2">
          <span>
            {dateStr ? `Inscribed on ${dateStr}` : 'Authentic Physical Letter'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-1 rounded bg-amber-950/10 hover:bg-amber-950/20 text-amber-950 flex items-center gap-1 font-mono text-[11px] font-bold cursor-pointer"
              title={isZoomed ? 'Standard View' : 'Zoom In on Ink Strokes'}
            >
              {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
              <span>{isZoomed ? 'Zoom Out' : 'Magnify'}</span>
            </button>
          </div>
        </div>

        {/* Physical Sheet Surface */}
        <div 
          className={`w-full rounded-sm shadow-2xl relative border border-stone-800/40 transition-all overflow-hidden ${
            isZoomed ? 'scale-110 sm:scale-125 z-30 my-6' : 'scale-100'
          }`}
          style={{
            background: 'linear-gradient(135deg, #FDFBF7 0%, #F8F3E6 100%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 0 40px rgba(180,140,70,0.12)'
          }}
        >
          {/* Subtle Corner Postmarks */}
          <div className="absolute top-3 right-3 opacity-20 pointer-events-none select-none">
            <Stamp className="w-10 h-10 text-amber-900 rotate-12" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full aspect-[800/1060] relative"
            >
              <img
                src={currentPage.imageData}
                alt={`Handwritten page ${activePageIndex + 1}`}
                className="w-full h-full object-contain block select-none pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

          {/* Bottom Author Postmark on Last Page */}
          {activePageIndex === totalPages - 1 && (
            <div className="absolute bottom-4 right-6 text-right pointer-events-none">
              <span className="text-xs font-serif italic text-stone-800 block">
                — {isAnonymous ? 'An Anonymous Soul' : (senderName || 'Your Correspondent')}
              </span>
            </div>
          )}
        </div>

        {/* Multi-page Navigation Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between w-full px-4 py-1.5 bg-amber-950/20 border border-amber-900/30 rounded-sm text-xs font-serif">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={activePageIndex === 0}
              className={`px-3 py-1 rounded font-bold flex items-center gap-1 transition-all ${
                activePageIndex === 0
                  ? 'opacity-30 cursor-not-allowed text-stone-600'
                  : 'bg-amber-950 text-amber-200 hover:bg-amber-900 shadow cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev Sheet</span>
            </button>

            <span className="font-mono font-bold text-amber-950 uppercase tracking-wider">
              Sheet {activePageIndex + 1} of {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={activePageIndex >= totalPages - 1}
              className={`px-3 py-1 rounded font-bold flex items-center gap-1 transition-all ${
                activePageIndex >= totalPages - 1
                  ? 'opacity-30 cursor-not-allowed text-stone-600'
                  : 'bg-amber-950 text-amber-200 hover:bg-amber-900 shadow cursor-pointer'
              }`}
            >
              <span>Next Sheet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── CASE 2: FALLBACK TEXT-RENDERED PARCHMENT ──
  const activeStyle = HANDWRITING_STYLES.find(s => s.id === styleId) || HANDWRITING_STYLES[0];
  const activeInk = INK_COLORS.find(i => i.id === inkId) || INK_COLORS[0];
  const activePaper = PARCHMENT_PAPERS.find(p => p.id === paperId) || PARCHMENT_PAPERS[0];

  return (
    <div
      className={`relative p-6 sm:p-10 rounded-sm shadow-xl border border-stone-400/40 ${activePaper.bgClass} text-stone-900 font-serif leading-relaxed select-text transition-all`}
      style={{
        fontFamily: activeStyle.fontFamily,
        color: activeInk.color,
        boxShadow: '0 15px 40px rgba(0,0,0,0.25), inset 0 0 50px rgba(180,140,70,0.15)',
        fontSize: fontSize === 'huge' ? '2.0rem' : fontSize === 'large' ? '1.75rem' : fontSize === 'small' ? '1.25rem' : '1.45rem',
        lineHeight: '2.1'
      }}
    >
      {/* Date Header */}
      {dateStr && (
        <div className="text-right text-base italic opacity-85 mb-4 border-b border-amber-900/10 pb-1">
          {dateStr}
        </div>
      )}

      {/* Salutation */}
      {recipientName && (
        <div className="mb-4 text-xl font-medium">
          Dearest {recipientName},
        </div>
      )}

      {/* Content */}
      <div className="whitespace-pre-wrap leading-relaxed">
        {content || '(Blank Handwritten Letter)'}
      </div>

      {/* Signature */}
      <div className="mt-8 text-right text-xl font-medium pt-3 border-t border-amber-900/10">
        With solemn quill,<br />
        <span className="font-bold text-2xl mt-1 block">
          {isAnonymous ? 'An Anonymous Soul' : (senderName || 'Your Noble Self')}
        </span>
      </div>
    </div>
  );
}
