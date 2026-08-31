import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Sparkles, CheckCircle, Crown, Feather, Inbox, X } from 'lucide-react';
import { waxSealAudio } from '../utils/waxSealAudio';

export interface HandoverData {
  letterId?: string;
  token?: string;
  stage: 'pickup' | 'delivery' | 'direct';
  senderId?: string;
  senderName: string;
  receiverId?: string;
  receiverName: string;
  mailmanId?: string;
  mailmanName?: string;
  transferredFrom: string;
  transferredTo: string;
  message?: string;
}

interface Props {
  handover: HandoverData | null;
  onClose: () => void;
}

export default function LetterTransferModal({ handover, onClose }: Props) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!handover) return;

    // Play aerodynamic envelope flight whoosh + royal seal arrival chime
    waxSealAudio.playLetterHandoverGlide();

    const duration = 3800; // 3.8s total duration
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [handover, onClose]);

  if (!handover) return null;

  const isPickup = handover.stage === 'pickup';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="theatrical-card max-w-lg w-full relative overflow-hidden p-6 sm:p-8 rounded-sm text-center shadow-2xl"
          style={{
            background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
            border: '2px solid var(--antique-gold)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(212,175,55,0.25)'
          }}
        >
          {/* Top Gold Rule */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-stone-400 hover:text-amber-300 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Title & Stage Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{isPickup ? '✦ Royal Saddlebag Pickup Handover ✦' : '✦ Sovereign Mailbox Handover ✦'}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-wide mb-1" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            Missive Transfer In Progress
          </h3>
          <p className="text-xs sm:text-sm italic text-amber-200/80 font-serif mb-6">
            {handover.message || `${handover.transferredFrom} → ${handover.transferredTo}`}
          </p>

          {/* ── 3D Theatrical Gliding Envelope Handover Stage ── */}
          <div className="relative py-8 px-4 my-2 rounded-sm overflow-hidden flex items-center justify-between" style={{
            background: 'linear-gradient(135deg, rgba(30,24,18,0.7) 0%, rgba(15,12,9,0.9) 100%)',
            border: '1px solid rgba(212,175,55,0.25)'
          }}>
            {/* Origin Participant */}
            <div className="flex flex-col items-center z-10 w-24">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/15 border border-amber-400/50 shadow-md mb-2">
                {isPickup ? <Feather className="w-6 h-6 text-amber-300" /> : <Crown className="w-6 h-6 text-amber-300" />}
              </div>
              <span className="text-xs font-bold text-stone-200 truncate w-full" style={{ fontFamily: "'Cinzel', serif" }}>
                {handover.transferredFrom}
              </span>
              <span className="text-[10px] text-amber-400/70 uppercase tracking-wider font-mono">
                {isPickup ? 'Sender Scribe' : 'Imperial Courier'}
              </span>
            </div>

            {/* Middle Flight Trajectory & Flying Envelope */}
            <div className="flex-1 relative h-16 flex items-center justify-center mx-2">
              {/* Flight Arc Path */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-amber-500/30" />

              {/* Gliding Envelope */}
              <motion.div
                initial={{ x: '-90%', y: 0, scale: 0.8, rotate: -15 }}
                animate={{
                  x: ['-90%', '0%', '90%'],
                  y: [0, -22, 0],
                  scale: [0.8, 1.25, 0.95],
                  rotate: [-15, 0, 15]
                }}
                transition={{
                  duration: 2.2,
                  ease: [0.25, 1, 0.5, 1],
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="relative z-20 flex flex-col items-center justify-center p-2 rounded-sm shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #FDFBF7 0%, #E8DFCC 100%)',
                  border: '1.5px solid #8B263E',
                  boxShadow: '0 8px 25px rgba(212,175,55,0.4)'
                }}
              >
                <Mail className="w-6 h-6 text-[#8B263E]" />
                {/* Wax Stamp Dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#8B263E] border border-amber-300 shadow-sm" />
              </motion.div>
            </div>

            {/* Destination Participant */}
            <div className="flex flex-col items-center z-10 w-24">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/15 border border-emerald-400/50 shadow-md mb-2">
                {isPickup ? <Crown className="w-6 h-6 text-emerald-300" /> : <Inbox className="w-6 h-6 text-emerald-300" />}
              </div>
              <span className="text-xs font-bold text-stone-200 truncate w-full" style={{ fontFamily: "'Cinzel', serif" }}>
                {handover.transferredTo}
              </span>
              <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-mono">
                {isPickup ? 'Saddlebag' : 'Mailbox'}
              </span>
            </div>
          </div>

          {/* Success Banner Notice */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-300 pt-3 font-mono">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Seal Authenticated & Handover Complete</span>
          </div>

          {/* Auto-Dismiss Progress Bar */}
          <div className="w-full bg-stone-900 rounded-full h-1.5 mt-5 overflow-hidden border border-stone-700">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="pt-4">
            <button
              onClick={onClose}
              className="btn-gold-saloon text-xs py-2 px-6 shadow"
            >
              Acknowledge & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
