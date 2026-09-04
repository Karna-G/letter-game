import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Compass, Trash2, X } from 'lucide-react';
import type { PickupAlertData } from './PickupRadiusAlertToast';

interface NotificationChronicleDrawerProps {
  alerts: PickupAlertData[];
  onClearAlerts: () => void;
  onNavigateToMap: () => void;
}

export const NotificationChronicleDrawer: React.FC<NotificationChronicleDrawerProps> = ({
  alerts,
  onClearAlerts,
  onNavigateToMap
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnreadCount(alerts.length);
  }, [alerts]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative" ref={drawerRef}>
      {/* Letter Radar Range Trigger Button in Navbar */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-sm text-[var(--antique-gold)] hover:text-amber-200 transition-all hover:bg-white/5 flex items-center justify-center group"
        title="Letter Range Radar & Dispatch Alerts"
      >
        <Radio className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-300" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold shadow-md animate-pulse"
            style={{
              background: '#DC2626',
              color: '#FFF',
              border: '1px solid #F87171',
              fontFamily: "'Cinzel', serif"
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-sm shadow-2xl z-50 overflow-hidden theatrical-card"
            style={{
              background: 'linear-gradient(165deg, #1C1814 0%, #12100E 100%)',
              border: '1px solid var(--antique-gold)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.85), 0 0 20px rgba(212,175,55,0.2)'
            }}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-amber-500/25 flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold tracking-wider" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                  Perimeter Chronicle
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {alerts.length > 0 && (
                  <button
                    onClick={onClearAlerts}
                    className="text-[10px] text-red-300 hover:text-red-200 transition-colors p-1"
                    title="Clear all alerts"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-amber-200/60 hover:text-amber-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chronicle List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-amber-500/10 p-2 space-y-1">
              {alerts.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <Compass className="w-8 h-8 mx-auto text-amber-500/40 mb-2 animate-spin-slow" />
                  <p className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                    No couriers are near you right now.
                  </p>
                  <p className="text-[10px] text-amber-200/50 mt-1">
                    When a courier comes close to you, the alert will appear here.
                  </p>
                </div>
              ) : (
                alerts.map((al) => (
                  <div
                    key={al.id}
                    className="p-2.5 rounded-sm hover:bg-white/5 transition-colors text-left relative group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-300" style={{ fontFamily: "'Cinzel', serif" }}>
                        {al.mailmanName}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                        {al.distanceMeters}m away
                      </span>
                    </div>

                    <p className="text-[11px] italic leading-tight mb-2" style={{ color: 'var(--gold-muted)' }}>
                      {al.message || `Came within your alert radius.`}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-amber-200/50">
                      <span>{new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => {
                          onNavigateToMap();
                          setIsOpen(false);
                        }}
                        className="text-amber-400 hover:text-amber-200 underline font-semibold"
                      >
                        View Map Radar →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-amber-500/20 bg-black/40 flex items-center justify-between text-[11px]">
              <span className="text-amber-200/60 italic">Live GPS Proximity Radar</span>
              <button
                onClick={() => {
                  onNavigateToMap();
                  setIsOpen(false);
                }}
                className="text-xs font-bold text-amber-300 hover:text-amber-100 flex items-center gap-1"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>Open Radar Map</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
