import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Flame, Shield, Crown } from 'lucide-react';
import { waxSealAudio } from '../utils/waxSealAudio';

interface WaxSealRevealModalProps {
  isOpen: boolean;
  letter: any;
  onClose: () => void;
  onBurn?: (letterId: string) => void;
  onTrash?: (letterId: string) => void;
  onReport?: (letter: any) => void;
}

export default function WaxSealRevealModal({
  isOpen,
  letter,
  onClose,
  onBurn,
  onTrash,
  onReport
}: WaxSealRevealModalProps) {
  // Stages: 'sealed' | 'cracking' | 'unrolling' | 'open' | 'closing'
  const [stage, setStage] = useState<'sealed' | 'cracking' | 'unrolling' | 'open' | 'closing'>('sealed');
  const [shards, setShards] = useState<Array<{ id: number; x: number; y: number; rot: number; scale: number }>>([]);

  useEffect(() => {
    if (isOpen) {
      // If letter was already read, we can open with unroll or start sealed
      setStage('sealed');
      // Generate randomized shard trajectory vectors
      const generatedShards = Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        const dist = 40 + Math.random() * 50;
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          rot: Math.random() * 360,
          scale: 0.4 + Math.random() * 0.6
        };
      });
      setShards(generatedShards);
    }
  }, [isOpen, letter]);

  if (!isOpen || !letter) return null;

  // Wax Seal Color & Name Configuration
  const sealColor = letter.sealColor || letter.bottleWaxColor || '#DC2626';
  const sealName = letter.sealName || 'Imperial Wax Seal';
  const isAnonymous = letter.isAnonymous;
  const senderName = isAnonymous ? 'An Anonymous Scribe' : (letter.senderRef?.name || letter.senderName || 'A Royal Courier');
  const letterFont = letter.font || 'Cinzel';

  // Action to Break Seal and Reveal Missive
  const handleBreakSeal = () => {
    if (stage !== 'sealed') return;
    setStage('cracking');
    waxSealAudio.playWaxCrack();

    setTimeout(() => {
      setStage('unrolling');
      waxSealAudio.playParchmentUnroll();

      setTimeout(() => {
        setStage('open');
      }, 550);
    }, 450);
  };

  // Action to Reseal with Heavy Brass Stamp & Close
  const handleResealAndClose = () => {
    if (stage === 'closing') return;
    setStage('closing');
    waxSealAudio.playParchmentUnroll();

    setTimeout(() => {
      waxSealAudio.playWaxStampThud();
      setTimeout(() => {
        onClose();
        setStage('sealed');
      }, 600);
    }, 400);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      >
        {/* ── STAGE 1 & 2: SEALED ENVELOPE / CRACKING WAX SEAL ── */}
        {(stage === 'sealed' || stage === 'cracking') && (
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-md w-full relative flex flex-col items-center select-none"
          >
            {/* Antique Envelope Package */}
            <div 
              className="w-full h-72 rounded-sm relative shadow-2xl overflow-hidden border-2 border-amber-900/60 flex flex-col justify-between p-6 text-center"
              style={{
                background: 'radial-gradient(ellipse at 50% 40%, #EDE0C8 0%, #D4C09B 60%, #B89B6A 100%)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.8), inset 0 0 60px rgba(139, 69, 19, 0.3)'
              }}
            >
              {/* Envelope Flap Creases */}
              <div 
                className="absolute top-0 left-0 right-0 h-36 border-b-2 border-amber-900/40 pointer-events-none"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  background: 'linear-gradient(180deg, rgba(220,200,165,0.95) 0%, rgba(190,165,125,0.95) 100%)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }}
              />

              {/* Envelope Metadata Header */}
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-950 font-bold bg-amber-200/60 px-3 py-0.5 rounded-full border border-amber-800/30">
                  ✦ Sealed Missive in Transit ✦
                </span>
                <p className="text-xs font-serif italic text-amber-900 mt-1">
                  Dispatched by: <strong className="text-amber-950">{senderName}</strong>
                </p>
              </div>

              {/* CENTER: 3D Embossed Wax Seal with Break Particles */}
              <div className="relative z-20 flex flex-col items-center justify-center my-auto">
                <button
                  type="button"
                  onClick={handleBreakSeal}
                  className="group relative cursor-pointer transform transition-transform active:scale-95 focus:outline-none"
                  title="Click to break wax seal and reveal letter"
                >
                  {/* Outer Wax Seal Disc */}
                  <div
                    className={`w-24 h-24 rounded-full relative flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.6)] border-2 border-white/40 transition-transform ${
                      stage === 'sealed' ? 'group-hover:scale-110 group-hover:rotate-3 animate-pulse' : ''
                    }`}
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${sealColor}ee 0%, ${sealColor} 60%, #1a0505 100%)`,
                      boxShadow: `0 12px 28px rgba(0,0,0,0.7), inset 0 3px 8px rgba(255,255,255,0.6), 0 0 20px ${sealColor}66`
                    }}
                  >
                    {/* Inner Embossed Ring & Crown/Crest Insignia */}
                    <div className="w-16 h-16 rounded-full border border-white/40 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                      <Crown className="w-7 h-7 text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      <span className="text-[9px] font-serif font-bold text-amber-100 uppercase tracking-widest mt-0.5">
                        SEAL
                      </span>
                    </div>

                    {/* Crack Fissure Overlay when cracking */}
                    {stage === 'cracking' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-1 bg-amber-200 shadow-[0_0_8px_#FFF] transform rotate-45 animate-ping" />
                        <div className="w-full h-1 bg-amber-100 shadow-[0_0_8px_#FFF] transform -rotate-45" />
                      </div>
                    )}
                  </div>

                  {/* Explosive Shard Particles when cracked */}
                  {stage === 'cracking' && shards.map((s) => (
                    <motion.div
                      key={s.id}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: s.x, y: s.y, opacity: 0, scale: s.scale, rotate: s.rot }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="absolute w-3.5 h-3.5 rounded-sm pointer-events-none"
                      style={{ background: sealColor, boxShadow: `0 0 6px ${sealColor}` }}
                    />
                  ))}
                </button>

                <p className="text-xs font-serif font-bold text-amber-950 mt-3 flex items-center gap-1.5 animate-bounce">
                  <span>🗝️</span>
                  <span>Click Wax Seal to Break & Open</span>
                </p>
              </div>

              {/* Bottom Envelope Details */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-amber-900/80 font-mono border-t border-amber-900/20 pt-2">
                <span>Wax: {sealName}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-stone-600 hover:text-stone-900 underline font-bold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STAGE 3 & 4: UNROLLED PARCHMENT MISSIVE (OPEN READER) ── */}
        {(stage === 'unrolling' || stage === 'open') && (
          <div className="max-w-2xl w-full relative animate-scroll-unroll">
            {/* Top Wooden Scroll Rod */}
            <div className="scroll-rod-top" />

            <div className="parchment-scroll-surface p-6 sm:p-10 relative rounded-sm shadow-2xl">
              {/* Close / Reseal Button */}
              <button
                type="button"
                onClick={handleResealAndClose}
                className="absolute top-4 right-4 text-stone-600 hover:text-stone-950 p-1.5 rounded-full hover:bg-amber-900/10 transition-colors"
                title="Roll up parchment and reseal"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Missive Header Banner */}
              <div className="border-b border-amber-900/30 pb-4 mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-800" />
                    <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#3E2723', fontFamily: "'Cinzel', serif" }}>
                      {letter.subject || letter.bottleMoniker || 'Imperial Epistle'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-serif font-bold text-white shadow" style={{ background: sealColor }}>
                    <span>✦</span>
                    <span>Unsealed</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs italic text-stone-700 mt-2">
                  <span>From: <strong className="font-bold text-stone-900">{senderName}</strong></span>
                  {letter.createdAt && (
                    <span className="font-mono text-[11px] text-stone-600">
                      {new Date(letter.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Letter Content Parchment Body */}
              <div
                style={{
                  fontFamily: letterFont === 'Cinzel' ? "'Cinzel', serif" : letterFont === 'Great Vibes' ? "'Great Vibes', cursive" : letterFont === 'Special Elite' ? "'Special Elite', cursive" : "'Cormorant Garamond', serif",
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: '#1A1A1A',
                  border: '1px solid rgba(160, 120, 60, 0.3)',
                  fontSize: letterFont === 'Great Vibes' ? '1.5rem' : '1.15rem'
                }}
                className="p-6 rounded-sm whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto leading-relaxed"
              >
                {letter.content}
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-amber-900/20 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {onReport && (
                    <button
                      type="button"
                      onClick={() => onReport(letter)}
                      className="px-3 py-1.5 bg-red-950 text-red-300 rounded-sm text-xs font-bold shadow hover:bg-red-900 flex items-center gap-1 border border-red-800"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Report
                    </button>
                  )}
                  {onTrash && (
                    <button
                      type="button"
                      onClick={() => onTrash(letter._id || letter.id)}
                      className="px-3 py-1.5 bg-stone-800 text-stone-300 rounded-sm text-xs font-bold shadow hover:bg-stone-700 flex items-center gap-1 border border-stone-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Trash
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  {onBurn && (
                    <button
                      type="button"
                      onClick={() => onBurn(letter._id || letter.id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-900 to-amber-900 text-amber-100 rounded-sm text-xs font-bold shadow hover:brightness-110 flex items-center gap-1.5 border border-red-700"
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-400" /> Burn Epistle
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResealAndClose}
                    className="btn-gold-saloon text-xs py-2 px-6 flex items-center gap-1.5 shadow-lg"
                  >
                    <span>✦ Reseal & Roll Up</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Wooden Scroll Rod */}
            <div className="scroll-rod-bottom" />
          </div>
        )}

        {/* ── STAGE 5: RESEALING WITH HEAVY BRASS STAMP ── */}
        {stage === 'closing' && (
          <motion.div
            initial={{ scale: 0.95, opacity: 1 }}
            animate={{ scale: 0.9, opacity: 0.7 }}
            className="max-w-md w-full relative flex flex-col items-center pointer-events-none"
          >
            <div 
              className="w-full h-64 rounded-sm relative shadow-2xl p-6 flex flex-col items-center justify-center border-2 border-amber-900/60 animate-scroll-roll-close"
              style={{
                background: 'radial-gradient(ellipse at 50% 40%, #EDE0C8 0%, #D4C09B 60%, #B89B6A 100%)'
              }}
            >
              {/* Molten Wax Dollop landing */}
              <div 
                className="w-20 h-20 rounded-full animate-cork-press relative flex items-center justify-center shadow-2xl"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${sealColor}ee 0%, ${sealColor} 60%, #1a0505 100%)`,
                  boxShadow: `0 12px 28px rgba(0,0,0,0.8), 0 0 25px ${sealColor}`
                }}
              >
                {/* Descending Brass Stamp */}
                <Crown className="w-8 h-8 text-amber-200" />
              </div>
              <p className="text-xs font-serif font-bold text-amber-950 mt-4 tracking-wider animate-pulse">
                ✦ Stamping Wax & Resealing Epistle...
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
