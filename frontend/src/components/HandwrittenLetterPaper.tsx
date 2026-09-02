import React from 'react';

export interface HandwrittenStyleConfig {
  id: string;
  name: string;
  label: string;
  fontFamily: string;
  category: string;
  letterSpacing?: string;
  lineHeight?: string;
}

export interface InkColorConfig {
  id: string;
  name: string;
  color: string;
  label: string;
  shadow: string;
}

export interface ParchmentPaperConfig {
  id: string;
  name: string;
  label: string;
  background: string;
  border: string;
  boxShadow: string;
  backgroundLines?: boolean;
}

export const HANDWRITING_STYLES: HandwrittenStyleConfig[] = [
  { id: 'elegant', name: 'Royal Calligraphy', label: '📜 Royal Calligraphy', fontFamily: "'Great Vibes', cursive", category: 'Calligraphy', letterSpacing: '0.04em', lineHeight: '2.1' },
  { id: 'calligraphy', name: 'Flowing Feathertip', label: '✒️ Flowing Feathertip', fontFamily: "'Alex Brush', cursive", category: 'Quill Script', letterSpacing: '0.03em', lineHeight: '2.0' },
  { id: 'romantic', name: 'Romantic Penmanship', label: '💌 Romantic Penmanship', fontFamily: "'Marck Script', cursive", category: 'Romantic', letterSpacing: '0.02em', lineHeight: '1.9' },
  { id: 'casual', name: 'Casual Quill Scribble', label: '✍️ Casual Quill', fontFamily: "'Caveat', cursive", category: 'Casual', letterSpacing: '0.01em', lineHeight: '1.8' },
  { id: 'old-fashioned', name: 'Graceful Script', label: '🕊️ Graceful Script', fontFamily: "'Sacramento', cursive", category: 'Old-Fashioned', letterSpacing: '0.03em', lineHeight: '2.1' },
  { id: 'flourish', name: 'Fluid Quill Ink', label: '🪶 Fluid Quill', fontFamily: "'Dancing Script', cursive", category: 'Quill Script', letterSpacing: '0.02em', lineHeight: '1.9' },
];

export const INK_COLORS: InkColorConfig[] = [
  { id: 'iron-gall', name: 'Iron Gall Black', color: '#1B1816', label: '🖋️ Iron Gall', shadow: 'rgba(27, 24, 22, 0.25)' },
  { id: 'royal-sepia', name: 'Walnut Sepia', color: '#3E2723', label: '🍂 Walnut Sepia', shadow: 'rgba(62, 39, 35, 0.25)' },
  { id: 'midnight-indigo', name: 'Midnight Indigo', color: '#1E293B', label: '🌌 Midnight Indigo', shadow: 'rgba(30, 41, 59, 0.25)' },
  { id: 'burgundy-wine', name: 'Burgundy Velvet', color: '#581C28', label: '🍷 Burgundy Velvet', shadow: 'rgba(88, 28, 40, 0.25)' },
  { id: 'forest-emerald', name: 'Forest Emerald', color: '#064E3B', label: '🌲 Forest Emerald', shadow: 'rgba(6, 78, 59, 0.25)' },
];

export const PARCHMENT_PAPERS: ParchmentPaperConfig[] = [
  { 
    id: 'vintage-cream', 
    name: 'Vintage Cream Vellum', 
    label: '📜 Vintage Cream', 
    background: 'linear-gradient(135deg, #FFFDF8 0%, #FBF6E9 50%, #F5ECCF 100%)',
    border: '1px solid rgba(180, 140, 70, 0.35)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15), inset 0 0 60px rgba(212, 175, 55, 0.12)'
  },
  { 
    id: 'lined-ledger', 
    name: 'Ruled Ledger Sheet', 
    label: '📖 Ruled Ledger', 
    background: 'repeating-linear-gradient(#FBF7EB, #FBF7EB 31px, rgba(180, 140, 70, 0.22) 32px)',
    border: '1px solid rgba(180, 140, 70, 0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.18), inset 0 0 50px rgba(180, 140, 70, 0.1)',
    backgroundLines: true
  },
  { 
    id: 'aged-vellum', 
    name: 'Aged Tea-Stained Vellum', 
    label: '☕ Aged Vellum', 
    background: 'radial-gradient(ellipse at center, #F8EED6 0%, #EBD5A8 75%, #DCBF8A 100%)',
    border: '1px solid rgba(130, 90, 40, 0.5)',
    boxShadow: '0 12px 35px rgba(0,0,0,0.22), inset 0 0 80px rgba(120, 75, 25, 0.2)'
  },
  { 
    id: 'royal-parchment', 
    name: 'Royal Court Stationery', 
    label: '👑 Royal Court', 
    background: 'linear-gradient(145deg, #FCFBF7 0%, #F7F3E6 50%, #EFE8CE 100%)',
    border: '2px solid rgba(212, 175, 55, 0.65)',
    boxShadow: '0 15px 40px rgba(0,0,0,0.2), inset 0 0 70px rgba(212, 175, 55, 0.18)'
  }
];
interface HandwrittenLetterPaperProps {
  content: string;
  senderName?: string;
  recipientName?: string;
  styleId?: string;
  inkId?: string;
  paperId?: string;
  fontSize?: string;
  dateStr?: string;
  isAnonymous?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function HandwrittenLetterPaper({
  content,
  senderName = 'Thy Noble Correspondent',
  recipientName,
  styleId = 'elegant',
  inkId = 'iron-gall',
  paperId = 'vintage-cream',
  fontSize = 'medium',
  dateStr,
  isAnonymous = false,
  className = '',
  style = {}
}: HandwrittenLetterPaperProps) {
  const currentStyle = HANDWRITING_STYLES.find(s => s.id === styleId) || HANDWRITING_STYLES[0];
  const currentInk = INK_COLORS.find(i => i.id === inkId) || INK_COLORS[0];
  const currentPaper = PARCHMENT_PAPERS.find(p => p.id === paperId) || PARCHMENT_PAPERS[0];

  const getFontSizeStyle = (size: string) => {
    switch (size) {
      case 'small': return { fontSize: '1.25rem' };
      case 'large': return { fontSize: '1.85rem' };
      case 'huge': return { fontSize: '2.25rem' };
      case 'medium':
      default: return { fontSize: '1.55rem' };
    }
  };

  return (
    <div
      className={`relative w-full rounded-sm p-6 sm:p-10 md:p-12 select-text overflow-hidden transition-all duration-300 font-serif ${className}`}
      style={{
        background: currentPaper.background,
        border: currentPaper.border,
        boxShadow: currentPaper.boxShadow,
        ...style
      }}
    >
      {/* Subtle Antique Corner Flourishes */}
      <div className="absolute top-2 left-2 text-stone-700/20 text-xs select-none pointer-events-none">❦</div>
      <div className="absolute top-2 right-2 text-stone-700/20 text-xs select-none pointer-events-none">❦</div>
      <div className="absolute bottom-2 left-2 text-stone-700/20 text-xs select-none pointer-events-none">❦</div>
      <div className="absolute bottom-2 right-2 text-stone-700/20 text-xs select-none pointer-events-none">❦</div>

      {/* Red Ledger Margin Line (if ruled paper) */}
      {currentPaper.backgroundLines && (
        <div 
          className="absolute top-0 bottom-0 left-8 sm:left-12 w-[1px] select-none pointer-events-none"
          style={{ background: 'rgba(239, 68, 68, 0.25)' }}
        />
      )}

      {/* Top Header: Date and Postal Inscription */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-800/15 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentInk.color }} />
          <span className="text-[11px] uppercase tracking-[0.2em] font-mono font-bold text-stone-600">
            Handwritten Epistle • {currentStyle.name}
          </span>
        </div>

        {dateStr && (
          <div 
            className="text-sm sm:text-base italic font-serif"
            style={{ 
              color: currentInk.color,
              fontFamily: currentStyle.fontFamily,
              textShadow: `0 0 1px ${currentInk.shadow}`
            }}
          >
            {dateStr}
          </div>
        )}
      </div>

      {/* Salutation */}
      {recipientName && (
        <div 
          className="mb-4 text-lg sm:text-xl font-medium"
          style={{
            color: currentInk.color,
            fontFamily: currentStyle.fontFamily,
            textShadow: `0 0 1px ${currentInk.shadow}`
          }}
        >
          Dearest {recipientName},
        </div>
      )}

      {/* Main Handwritten Letter Content (Preserves all spacing, breaks, and indentation) */}
      <div
        className="whitespace-pre-wrap leading-relaxed transition-colors duration-200 text-left"
        style={{
          color: currentInk.color,
          fontFamily: currentStyle.fontFamily,
          letterSpacing: currentStyle.letterSpacing || '0.02em',
          lineHeight: currentStyle.lineHeight || '2.0',
          textShadow: `0.5px 0.5px 1px ${currentInk.shadow}`,
          wordBreak: 'break-word',
          ...getFontSizeStyle(fontSize)
        }}
      >
        {content}
      </div>

      {/* Sign-off & Signature Area */}
      <div className="mt-8 pt-6 border-t border-stone-800/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div 
            className="text-base sm:text-lg italic"
            style={{
              color: currentInk.color,
              fontFamily: currentStyle.fontFamily,
              textShadow: `0 0 1px ${currentInk.shadow}`
            }}
          >
            Yours in fellowship & remembrance,
          </div>
          <div 
            className="text-xl sm:text-2xl font-bold pt-1"
            style={{
              color: currentInk.color,
              fontFamily: currentStyle.fontFamily,
              textShadow: `0.5px 0.5px 1px ${currentInk.shadow}`
            }}
          >
            {isAnonymous ? 'An Anonymous Scribe' : senderName}
          </div>
        </div>

        {/* Vintage Postmark Wax Impression */}
        <div className="flex items-center gap-2 self-end sm:self-center opacity-85 select-none">
          <div 
            className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center font-serif text-lg shadow-sm"
            style={{ borderColor: currentInk.color, color: currentInk.color }}
          >
            🪶
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-600 leading-tight">
            <span>Sealed with</span>
            <br />
            <strong>Authentic Ink</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
