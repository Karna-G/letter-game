import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Flame, Shield, Crown, Lock, Clock, Sparkles } from 'lucide-react';
import { waxSealAudio } from '../utils/waxSealAudio';
import { markLetterRead } from '../api';

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
  const [now, setNow] = useState(Date.now());

  // 1-second ticking interval for live countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // When letter is unsealed and opened, mark as read
  useEffect(() => {
    if (stage === 'open' && letter?._id && !letter.isRead && !letter.firstReadAt) {
      markLetterRead(letter._id).catch(() => {});
    }
  }, [stage, letter]);

  // Check if letter is a Time Capsule that hasn't unlocked yet
  const scheduledTime = letter?.scheduledFor ? new Date(letter.scheduledFor).getTime() : 0;
  const isTimeLocked = scheduledTime > now;
  const lockDiff = Math.max(0, scheduledTime - now);
  const lockDays = Math.floor(lockDiff / (1000 * 60 * 60 * 24));
  const lockHours = Math.floor((lockDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const lockMins = Math.floor((lockDiff % (1000 * 60 * 60)) / (1000 * 60));
  const lockSecs = Math.floor((lockDiff % (1000 * 60)) / 1000);

  useEffect(() => {
    if (isOpen) {
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

  // Action to Break Seal and Reveal Letter
  const handleBreakSeal = () => {
    if (isTimeLocked) {
      // Locked - play subtle dull thud / rattle
      waxSealAudio.playWaxCrack();
      return;
    }
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
              className="w-full min-h-[320px] rounded-sm relative shadow-2xl overflow-hidden border-2 border-amber-900/60 flex flex-col justify-between p-6 text-center"
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
                  {isTimeLocked ? '⏳ Enchanted Time Capsule' : '✦ Sealed Letter in Transit ✦'}
                </span>
                <p className="text-xs font-serif italic text-amber-900 mt-1">
                  Dispatched & Delivered by: <strong className="text-amber-950 font-bold text-sm">{senderName}</strong>
                </p>
              </div>

              {/* CENTER: 3D Embossed Wax Seal with Break Particles or Lock */}
              <div className="relative z-20 flex flex-col items-center justify-center my-auto py-2">
                <button
                  type="button"
                  onClick={handleBreakSeal}
                  className={`group relative cursor-pointer transform transition-transform active:scale-95 focus:outline-none ${
                    isTimeLocked ? 'cursor-not-allowed opacity-90' : ''
                  }`}
                  title={isTimeLocked ? 'Time Capsule is sealed until the appointed solar hour' : 'Click to break wax seal and reveal letter'}
                >
                  {/* Outer Wax Seal Disc */}
                  <div
                    className={`w-24 h-24 rounded-full relative flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.6)] border-2 border-white/40 transition-transform ${
                      stage === 'sealed' && !isTimeLocked ? 'group-hover:scale-110 group-hover:rotate-3 animate-pulse' : ''
                    }`}
                    style={{
                      background: isTimeLocked
                        ? 'radial-gradient(circle at 35% 30%, #3D2D1E 0%, #22180F 60%, #100B06 100%)'
                        : `radial-gradient(circle at 35% 30%, ${sealColor}ee 0%, ${sealColor} 60%, #1a0505 100%)`,
                      boxShadow: isTimeLocked
                        ? '0 12px 28px rgba(0,0,0,0.7), inset 0 3px 8px rgba(212,175,55,0.4), 0 0 20px rgba(212,175,55,0.3)'
                        : `0 12px 28px rgba(0,0,0,0.7), inset 0 3px 8px rgba(255,255,255,0.6), 0 0 20px ${sealColor}66`
                    }}
                  >
                    {/* Inner Embossed Ring & Crown/Lock Insignia */}
                    <div className="w-16 h-16 rounded-full border border-white/40 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                      {isTimeLocked ? (
                        <Lock className="w-7 h-7 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse" />
                      ) : (
                        <Crown className="w-7 h-7 text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      )}
                      <span className="text-[9px] font-serif font-bold text-amber-100 uppercase tracking-widest mt-0.5">
                        {isTimeLocked ? 'LOCKED' : 'SEAL'}
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

                {/* Status Message or Live Countdown Timer */}
                {isTimeLocked ? (
                  <div className="mt-3 px-4 py-2 rounded-xl bg-black/70 border border-amber-500/50 shadow-lg text-center max-w-xs">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Time Capsule Sealed</span>
                    </div>
                    <div className="font-mono text-base font-bold text-amber-100 tracking-wider">
                      {lockDays > 0 ? `${lockDays}d ` : ''}
                      {String(lockHours).padStart(2, '0')}:{String(lockMins).padStart(2, '0')}:{String(lockSecs).padStart(2, '0')}
                    </div>
                    <p className="text-[10px] text-amber-300/80 mt-0.5 font-serif">
                      Opens on {new Date(scheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-serif font-bold text-amber-950 mt-3 flex items-center gap-1.5 animate-bounce">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Click Wax Seal to Break & Open</span>
                  </p>
                )}
              </div>

              {/* Bottom Envelope Details */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-amber-900/80 font-mono border-t border-amber-900/20 pt-2">
                <span>Wax: {sealName}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-stone-700 hover:text-stone-950 underline font-bold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STAGE 3 & 4: UNROLLED PARCHMENT MISSIVE (OPEN READER) ── */}
        {(stage === 'unrolling' || stage === 'open' || stage === 'closing') && (
          <motion.div
            initial={{ scale: 0.7, rotateX: 30, opacity: 0 }}
            animate={{ scale: 1, rotateX: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="max-w-2xl w-full max-h-[90vh] flex flex-col relative select-text"
          >
            {/* Parchment Scroll Container */}
            <div 
              className="w-full rounded-lg relative overflow-hidden border-2 border-[#D4AF37] shadow-2xl flex flex-col"
              style={{
                background: 'linear-gradient(135deg, #FBF4E6 0%, #F5E8C9 50%, #EDE0BE 100%)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.9), inset 0 0 100px rgba(180, 130, 70, 0.25)'
              }}
            >
              {/* Ornate Header Filigree */}
              <div className="border-b border-[#D4AF37]/40 px-6 py-4 flex items-center justify-between bg-black/5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full border border-white/60 shadow-sm"
                    style={{ backgroundColor: sealColor }}
                  />
                  <span className="text-xs font-serif uppercase tracking-widest text-[#5C3D1E] font-bold">
                    Royal Letter • {sealName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onReport && (
                    <button
                      type="button"
                      onClick={() => {
                        onReport(letter);
                        onClose();
                      }}
                      className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-black/5 rounded transition-colors"
                      title="Report Letter to Tribunal"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  )}
                  {onTrash && (
                    <button
                      type="button"
                      onClick={() => {
                        onTrash(letter._id);
                        onClose();
                      }}
                      className="p-1.5 text-stone-600 hover:text-red-700 hover:bg-black/5 rounded transition-colors"
                      title="Move to Scraps"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {onBurn && letter.burnAfterReading && (
                    <button
                      type="button"
                      onClick={() => {
                        onBurn(letter._id);
                        onClose();
                      }}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-black/5 rounded transition-colors"
                      title="Burn epistle immediately"
                    >
                      <Flame className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResealAndClose}
                    className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-black/5 rounded transition-colors"
                    title="Reseal with Brass Stamp & Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Letter Body / Content Area */}
              <div className="p-8 sm:p-10 overflow-y-auto max-h-[60vh] space-y-6">
                {/* Salutation */}
                <div className="border-b border-amber-900/15 pb-4 flex items-baseline justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-amber-950" style={{ fontFamily: letterFont }}>
                      {letter.title || 'Noble Dispatch'}
                    </h3>
                    <p className="text-xs font-serif italic text-amber-900/80 mt-1">
                      From: <strong className="text-amber-950">{senderName}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-900/60 uppercase">
                    {new Date(letter.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                {/* The Letter Ink Content */}
                <div
                  className="text-base sm:text-lg text-amber-950 leading-relaxed whitespace-pre-wrap font-serif"
                  style={{ fontFamily: letterFont }}
                >
                  {letter.content}
                </div>
              </div>

              {/* Scroll Bottom Bar */}
              <div className="border-t border-[#D4AF37]/30 px-6 py-3.5 bg-black/5 flex items-center justify-between">
                <span className="text-[11px] font-serif text-amber-900/70 italic">
                  Sealed with Royal Honor
                </span>
                <button
                  type="button"
                  onClick={handleResealAndClose}
                  className="px-4 py-1.5 rounded bg-[#3D2817] hover:bg-[#2B1B0E] text-[#FAF0E6] text-xs font-serif font-bold tracking-wider shadow border border-[#D4AF37]/50 flex items-center gap-1.5 transition-all"
                >
                  <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Reseal & Close</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
