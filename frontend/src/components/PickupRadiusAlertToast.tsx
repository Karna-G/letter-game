import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Feather, MapPin, X, QrCode } from 'lucide-react';
import { waxSealAudio } from '../utils/waxSealAudio';

export interface PickupAlertData {
  id: string;
  mailmanId: string;
  mailmanName: string;
  mailmanRank?: string;
  distanceMeters: number;
  alertRadius?: number;
  soundEnabled?: boolean;
  timestamp: string;
  pendingCount?: number;
  pendingLetters?: Array<{
    id: string;
    receiverName: string;
    qrCodeToken?: string;
    type?: string;
  }>;
  message?: string;
}

interface PickupRadiusAlertToastProps {
  alert: PickupAlertData | null;
  onDismiss: () => void;
  onNavigateToMap: () => void;
  onViewLetters?: () => void;
}

export const PickupRadiusAlertToast: React.FC<PickupRadiusAlertToastProps> = ({
  alert,
  onDismiss,
  onNavigateToMap,
  onViewLetters
}) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const DURATION = 12000; // 12 seconds auto-dismiss

  useEffect(() => {
    if (!alert) return;

    // Play Victorian acoustic postal chime
    if (alert.soundEnabled !== false) {
      waxSealAudio.playCourierProximityChime();
    }

    setProgress(100);
    const interval = 100;
    const step = (interval / DURATION) * 100;

    const timer = setInterval(() => {
      if (!isHovered) {
        setProgress(prev => {
          if (prev <= step) {
            clearInterval(timer);
            onDismiss();
            return 0;
          }
          return prev - step;
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [alert, isHovered, onDismiss]);

  if (!alert) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed top-20 right-4 md:right-8 z-50 max-w-md w-[calc(100vw-2rem)] pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="theatrical-card p-5 rounded-sm relative overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #241D17 0%, #161310 100%)',
            border: '2px solid var(--antique-gold)',
            boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(212,175,55,0.25)'
          }}
        >
          {/* Top Gold Foil Bar */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '3px',
              width: `${progress}%`,
              background: 'linear-gradient(to right, #F59E0B, var(--antique-gold), #FDE68A)',
              transition: 'width 0.1s linear'
            }} 
          />

          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center border shadow-md flex-shrink-0 animate-float-gentle"
                style={{
                  background: 'radial-gradient(circle, #54141E 0%, #2A090F 100%)',
                  borderColor: 'var(--antique-gold)'
                }}
              >
                <Compass className="w-5 h-5" style={{ color: 'var(--antique-gold)' }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: 'var(--antique-gold)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      fontFamily: "'Cinzel', serif"
                    }}
                  >
                    Mailman In Vicinity
                  </span>
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    {alert.distanceMeters}m away
                  </span>
                </div>
                <h4 
                  className="text-base font-bold tracking-wide mt-1"
                  style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel Decorative', serif" }}
                >
                  {alert.mailmanName}
                </h4>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="p-1 rounded-sm text-amber-300/60 hover:text-amber-300 hover:bg-white/5 transition-colors"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mailman Rank & Status Description */}
          <div className="mb-4 text-xs leading-relaxed" style={{ color: 'var(--gold-muted)' }}>
            <p className="italic">
              {alert.message || `Royal Mailman ${alert.mailmanName} (${alert.mailmanRank || 'Mailman'}) has come within your alert range.`}
            </p>
            
            {alert.pendingCount && alert.pendingCount > 0 ? (
              <div 
                className="mt-2.5 p-2.5 rounded-sm flex items-center justify-between gap-2"
                style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px dashed rgba(212, 175, 55, 0.35)'
                }}
              >
                <div className="flex items-center gap-2">
                  <Feather className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} />
                  <span className="text-xs font-bold" style={{ color: 'var(--parchment)', fontFamily: "'Cinzel', serif" }}>
                    {alert.pendingCount} Letter{alert.pendingCount !== 1 ? 's' : ''} Ready for Hand-off
                  </span>
                </div>
                <span className="text-[10px] text-amber-200/70">Awaiting Saddlebag</span>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20">
            <button
              onClick={() => {
                onNavigateToMap();
                onDismiss();
              }}
              className="flex-1 py-2 px-3 text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-all text-white"
              style={{
                background: 'linear-gradient(135deg, #7A1C28 0%, #4D0F18 100%)',
                border: '1px solid var(--antique-gold)',
                fontFamily: "'Cinzel', serif"
              }}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Track on Radar</span>
            </button>

            {onViewLetters && alert.pendingCount && alert.pendingCount > 0 ? (
              <button
                onClick={() => {
                  onViewLetters();
                  onDismiss();
                }}
                className="py-2 px-3 text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: 'var(--antique-gold)',
                  fontFamily: "'Cinzel', serif"
                }}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Hand-off QR</span>
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
