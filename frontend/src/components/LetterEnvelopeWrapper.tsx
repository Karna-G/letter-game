import { type ReactNode } from 'react';
import { Feather } from 'lucide-react';

// ── VINTAGE FOUNTAIN PEN LOGO (Angled nib resting on parchment) ──
export function FountainPenLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={{ filter: 'drop-shadow(1px 2px 3px rgba(60,30,10,0.28))' }}
    >
      {/* 45-degree angled vintage fountain pen matching the postal seal */}
      <g transform="rotate(-45 32 32)">
        {/* End Finial */}
        <path d="M28.5 4 C28.5 2.5 35.5 2.5 35.5 4 L35.5 8 L28.5 8 Z" fill="#361B0B" />
        {/* Polished Rosewood Barrel */}
        <rect x="28" y="8" width="8" height="27" rx="1.5" fill="#583119" stroke="#361B0B" strokeWidth="0.8" />
        <rect x="29.5" y="10" width="1.8" height="23" fill="#874D28" opacity="0.65" rx="0.5" />
        {/* Engraved Brass Band */}
        <rect x="27.5" y="35" width="9" height="3" rx="0.5" fill="#D4AF37" stroke="#9E7E1D" strokeWidth="0.7" />
        {/* Black Ebonite Section */}
        <path d="M28.5 38 L35.5 38 L34.5 46.5 L29.5 46.5 Z" fill="#1C1815" stroke="#0D0B0A" strokeWidth="0.8" />
        {/* Gold Collar */}
        <rect x="29.5" y="46.5" width="5" height="1.5" fill="#D4AF37" />
        {/* 14k Gold Nib with scrollwork */}
        <path d="M29.5 48 L32 61.5 L34.5 48 Z" fill="#F3D472" stroke="#B88A1A" strokeWidth="0.8" />
        <circle cx="32" cy="54" r="0.75" fill="#3D2010" />
        <line x1="32" y1="48" x2="32" y2="60.5" stroke="#4A2609" strokeWidth="0.6" />
      </g>
    </svg>
  );
}

// ── VINTAGE TYPEWRITER LOGO ──
export function TypewriterLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={{ filter: 'drop-shadow(1px 2px 3px rgba(30,30,40,0.28))' }}
    >
      {/* Paper page rising from carriage */}
      <rect x="22" y="7" width="20" height="16" rx="1" fill="#FFFDF8" stroke="#8C7355" strokeWidth="1" />
      <line x1="26" y1="12" x2="38" y2="12" stroke="#B89E7D" strokeWidth="0.8" strokeDasharray="1 1.5" />
      <line x1="26" y1="15" x2="35" y2="15" stroke="#B89E7D" strokeWidth="0.8" strokeDasharray="1 1.5" />
      <line x1="26" y1="18" x2="37" y2="18" stroke="#B89E7D" strokeWidth="0.8" strokeDasharray="1 1.5" />
      
      {/* Carriage / Roller Platen */}
      <rect x="14" y="20" width="36" height="7" rx="3" fill="#24211E" stroke="#52463D" strokeWidth="1" />
      <circle cx="13" cy="23.5" r="2.5" fill="#8C7355" stroke="#52463D" strokeWidth="0.8" />
      <circle cx="51" cy="23.5" r="2.5" fill="#8C7355" stroke="#52463D" strokeWidth="0.8" />
      
      {/* Slanted Chassis */}
      <path d="M12 27 L18 25 L46 25 L52 27 L55 49 L9 49 Z" fill="#2A2421" stroke="#423630" strokeWidth="1.2" />
      
      {/* Keyboard Bed */}
      <rect x="14" y="34" width="36" height="11" rx="1.5" fill="#171412" />
      {/* Round Keys */}
      <circle cx="18" cy="37" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="23" cy="37" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="28" cy="37" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="33" cy="37" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="38" cy="37" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="43" cy="37" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      
      <circle cx="20.5" cy="41" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="25.5" cy="41" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="30.5" cy="41" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="35.5" cy="41" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      <circle cx="40.5" cy="41" r="1.4" fill="#F5EEDB" stroke="#8C7355" strokeWidth="0.5" />
      
      {/* Spacebar */}
      <rect x="23" y="45" width="18" height="1.8" rx="0.6" fill="#D4AF37" />
    </svg>
  );
}

interface LetterEnvelopeWrapperProps {
  isHandwritten: boolean;
  senderName?: string;
  isAnonymous?: boolean;
  dateStr?: string;
  penStyle?: string; // e.g. "Casual Quill Scribble" or font name
  children: ReactNode;
}

export default function LetterEnvelopeWrapper({
  isHandwritten,
  senderName,
  isAnonymous,
  dateStr,
  penStyle,
  children,
}: LetterEnvelopeWrapperProps) {
  const displaySender = isAnonymous ? 'An Anonymous Soul' : (senderName || 'Your Correspondent');
  
  // Format Date (e.g. September 3, 2026)
  const formattedDate = dateStr 
    ? (new Date(dateStr).toString() !== 'Invalid Date'
        ? new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : dateStr)
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Header Title Label (matches user mockup: "HANDWRITTEN EPISTLE • CASUAL QUILL SCRIBBLE")
  const defaultHandwrittenStyle = penStyle || 'CASUAL QUILL SCRIBBLE';
  const defaultTypedStyle = penStyle || 'ROYAL TYPEWRITER';
  
  const headerSubtitle = isHandwritten
    ? `HANDWRITTEN EPISTLE \u2022 ${defaultHandwrittenStyle.toUpperCase()}`
    : `TYPED EPISTLE \u2022 ${defaultTypedStyle.toUpperCase()}`;

  return (
    <div
      className="rounded-sm overflow-hidden border relative my-2 select-text"
      style={{
        background: 'linear-gradient(178deg, #FAF6EE 0%, #F5EEDB 100%)',
        borderColor: 'rgba(180, 140, 70, 0.35)',
        boxShadow: '0 6px 28px rgba(0,0,0,0.12), inset 0 0 60px rgba(180,140,70,0.06)'
      }}
    >
      {/* Four Antique Corner Screw/Pin Accents */}
      <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-[#8C6D46]/40 pointer-events-none" />
      <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#8C6D46]/40 pointer-events-none" />
      <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-[#8C6D46]/40 pointer-events-none" />
      <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#8C6D46]/40 pointer-events-none" />

      {/* ── HEADER ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 gap-2"
        style={{ borderBottom: '1px solid rgba(160, 120, 60, 0.28)' }}
      >
        {/* Left: Dot & Small Logo & Label */}
        <div className="flex items-center gap-2.5">
          {/* Small Dot */}
          <span 
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: isHandwritten ? '#3D2010' : '#1C2E4A' }}
          />

          {/* Small Pen or Typewriter Logo */}
          <div className="flex-shrink-0">
            {isHandwritten ? (
              <FountainPenLogo size={18} />
            ) : (
              <TypewriterLogo size={18} />
            )}
          </div>

          {/* Header Title */}
          <span
            className="text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase"
            style={{
              fontFamily: "'Cinzel', serif",
              color: isHandwritten ? '#4A2A14' : '#1A2B47'
            }}
          >
            {headerSubtitle}
          </span>
        </div>

        {/* Right: Date */}
        <div className="sm:text-right">
          <span
            className="text-sm sm:text-base italic"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif", 
              color: '#6B4E31',
              fontWeight: 500
            }}
          >
            {formattedDate}
          </span>
        </div>
      </div>

      {/* ── LETTER BODY ── */}
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {children}
      </div>

      {/* ── FOOTER ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between px-6 py-4 sm:py-5 gap-4"
        style={{ borderTop: '1px solid rgba(160, 120, 60, 0.28)' }}
      >
        {/* Left: Salutation & Signer Name */}
        <div className="space-y-0.5">
          <p
            className="text-sm sm:text-base italic"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif", 
              color: '#5C3F22',
              fontWeight: 500 
            }}
          >
            Yours in fellowship &amp; remembrance,
          </p>
          <p
            className="text-2xl sm:text-3xl font-bold tracking-wide"
            style={{ 
              fontFamily: "'Caveat', 'Great Vibes', cursive", 
              color: '#381E0C'
            }}
          >
            {displaySender}
          </p>
        </div>

        {/* Right Side: Pen/Typewriter graphic + Authentic Seal Stamp */}
        <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
          {/* Logo Illustration (Angled Pen or Vintage Typewriter) */}
          <div className="flex-shrink-0" title={isHandwritten ? "Inscribed with Authentic Fountain Pen" : "Typeset with Digital Mechanical Press"}>
            {isHandwritten ? (
              <FountainPenLogo size={36} />
            ) : (
              <TypewriterLogo size={36} />
            )}
          </div>

          {/* Postal Seal Badge with Dashed Circle */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Dashed Circle */}
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform hover:rotate-12"
              style={{
                border: '1.5px dashed #8C6D46',
                background: 'rgba(140, 109, 70, 0.04)'
              }}
            >
              {isHandwritten ? (
                <Feather className="w-5 h-5 text-[#8C6D46]" />
              ) : (
                <TypewriterLogo size={22} />
              )}
            </div>

            {/* Stamp Text */}
            <div className="text-left flex flex-col justify-center">
              <span
                className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest leading-tight block"
                style={{ fontFamily: "'Cinzel', serif", color: '#8C6D46' }}
              >
                SEALED WITH
              </span>
              <span
                className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest leading-tight block"
                style={{ fontFamily: "'Cinzel', serif", color: '#8C6D46' }}
              >
                {isHandwritten ? 'AUTHENTIC INK' : 'DIGITAL PRESS'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}