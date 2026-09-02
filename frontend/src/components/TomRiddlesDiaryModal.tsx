import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { BookOpen, Feather, X, Sparkles, Lock, Unlock, Users } from 'lucide-react';
import { waxSealAudio } from '../utils/waxSealAudio';

interface TomRiddlesDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { _id?: string; id?: string; name: string; role?: string } | null;
  socket: Socket | null;
  initialPartner?: { _id?: string; id?: string; name: string } | null;
  fellowScribes?: Array<{ _id?: string; id?: string; name: string; role?: string }>;
}

export const TomRiddlesDiaryModal: React.FC<TomRiddlesDiaryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  socket,
  initialPartner = null,
  fellowScribes = [],
}) => {
  const [partner, setPartner] = useState<{ _id?: string; id?: string; name: string } | null>(initialPartner);
  const [partnerSearch, setPartnerSearch] = useState('');
  
  // Real-time diary state
  const [isJoined, setIsJoined] = useState(false);
  const [currentWriterId, setCurrentWriterId] = useState<string | null>(null);
  const [currentWriterName, setCurrentWriterName] = useState<string | null>(null);
  const [partnerIsOnline, setPartnerIsOnline] = useState(false);

  // Ink states
  const [inputText, setInputText] = useState('');
  const [liveStreamText, setLiveStreamText] = useState('');
  const [inscribedText, setInscribedText] = useState<string | null>(null);
  const [inscribedAuthor, setInscribedAuthor] = useState<string | null>(null);
  const [isAbsorbing, setIsAbsorbing] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const absorptionTimerRef = useRef<any>(null);

  const currentUserId = String(currentUser?.id || currentUser?._id || '');
  const partnerId = String(partner?.id || partner?._id || '');

  // Generate deterministic roomKey for 1-on-1 session
  const getRoomKey = () => {
    if (!currentUserId || !partnerId) return '';
    const ids = [currentUserId, partnerId].sort();
    return `${ids[0]}_${ids[1]}`;
  };

  useEffect(() => {
    if (initialPartner) {
      setPartner(initialPartner);
    }
  }, [initialPartner]);

  // Join / Leave Socket room when partner changes or modal toggles
  useEffect(() => {
    if (!isOpen || !socket || !currentUserId || !partnerId) {
      if (isJoined && socket && currentUserId && partnerId) {
        const roomKey = getRoomKey();
        socket.emit('leave-diary-session', {
          roomKey,
          userId: currentUserId,
          userName: currentUser?.name,
        });
        setIsJoined(false);
      }
      return;
    }

    const roomKey = getRoomKey();
    if (!roomKey) return;

    waxSealAudio.playParchmentUnroll();

    socket.emit('join-diary-session', {
      roomKey,
      userId: currentUserId,
      userName: currentUser?.name,
    });
    setIsJoined(true);

    // Socket Event Listeners
    const onSessionState = (data: any) => {
      if (data.roomKey === roomKey) {
        setCurrentWriterId(data.currentWriterId ? String(data.currentWriterId) : null);
        setCurrentWriterName(data.currentWriterName);
        const otherPresent = (data.activeUsers || []).some(
          (u: any) => String(u.userId) === partnerId
        );
        setPartnerIsOnline(otherPresent);
      }
    };

    const onPresenceUpdate = (data: any) => {
      if (data.roomKey === roomKey) {
        const otherPresent = (data.activeUsers || []).some(
          (u: any) => String(u.userId) === partnerId
        );
        setPartnerIsOnline(otherPresent);
      }
    };

    const onLockAcquired = (data: any) => {
      if (data.roomKey === roomKey) {
        setCurrentWriterId(data.currentWriterId ? String(data.currentWriterId) : null);
        setCurrentWriterName(data.currentWriterName);
        if (String(data.currentWriterId) === currentUserId) {
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    };

    const onLockReleased = (data: any) => {
      if (data.roomKey === roomKey) {
        setCurrentWriterId(null);
        setCurrentWriterName(null);
        setLiveStreamText('');
      }
    };

    const onInkStream = (data: any) => {
      if (data.roomKey === roomKey && String(data.userId) !== currentUserId) {
        setLiveStreamText(data.inkText);
      }
    };

    const onInkInscribed = (data: any) => {
      if (data.roomKey === roomKey) {
        setInscribedText(data.inkText);
        setInscribedAuthor(data.authorName);
        setLiveStreamText('');
        setInputText('');
        setIsAbsorbing(true);
        waxSealAudio.playWaxCrack();

        // 3.8s absorption duration before clear
        if (absorptionTimerRef.current) clearTimeout(absorptionTimerRef.current);
        absorptionTimerRef.current = setTimeout(() => {
          setIsAbsorbing(false);
          setInscribedText(null);
          setInscribedAuthor(null);
          socket.emit('diary-ink-erased', { roomKey });
        }, 3800);
      }
    };

    const onPageCleared = (data: any) => {
      if (data.roomKey === roomKey) {
        setInscribedText(null);
        setInscribedAuthor(null);
        setIsAbsorbing(false);
        setLiveStreamText('');
        setCurrentWriterId(null);
        setCurrentWriterName(null);
      }
    };

    socket.on('diary-session-state', onSessionState);
    socket.on('diary-presence-update', onPresenceUpdate);
    socket.on('diary-lock-acquired', onLockAcquired);
    socket.on('diary-lock-released', onLockReleased);
    socket.on('diary-ink-stream', onInkStream);
    socket.on('diary-ink-inscribed', onInkInscribed);
    socket.on('diary-page-cleared', onPageCleared);

    return () => {
      socket.off('diary-session-state', onSessionState);
      socket.off('diary-presence-update', onPresenceUpdate);
      socket.off('diary-lock-acquired', onLockAcquired);
      socket.off('diary-lock-released', onLockReleased);
      socket.off('diary-ink-stream', onInkStream);
      socket.off('diary-ink-inscribed', onInkInscribed);
      socket.off('diary-page-cleared', onPageCleared);

      socket.emit('leave-diary-session', {
        roomKey,
        userId: currentUserId,
        userName: currentUser?.name,
      });
      if (absorptionTimerRef.current) clearTimeout(absorptionTimerRef.current);
    };
  }, [isOpen, socket, currentUserId, partnerId]);

  if (!isOpen) return null;

  const roomKey = getRoomKey();
  const isMyTurn = !!currentWriterId && String(currentWriterId) === currentUserId;
  const isSomeoneElseWriting = !!currentWriterId && String(currentWriterId) !== currentUserId;

  // Handlers
  const handleClaimQuill = () => {
    if (!socket || !currentUserId || !roomKey || isSomeoneElseWriting) return;
    waxSealAudio.playUiTap();
    socket.emit('diary-request-lock', {
      roomKey,
      userId: currentUserId,
      userName: currentUser?.name || 'Fellow Scribe',
    });
  };

  const handleReleaseQuill = () => {
    if (!socket || !currentUserId || !roomKey) return;
    waxSealAudio.playUiTap();
    socket.emit('diary-release-lock', {
      roomKey,
      userId: currentUserId,
    });
    setInputText('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (socket && roomKey && currentUserId) {
      socket.emit('diary-ink-update', {
        roomKey,
        userId: currentUserId,
        inkText: val,
      });
    }
  };

  const handleSubmitInk = () => {
    if (!inputText.trim() || !socket || !currentUserId || !roomKey) return;
    waxSealAudio.playWaxStampThud();
    socket.emit('diary-submit-ink', {
      roomKey,
      userId: currentUserId,
      userName: currentUser?.name || 'Fellow Scribe',
      inkText: inputText.trim(),
    });
    setInputText('');
  };

  const filteredScribes = fellowScribes.filter((s) => {
    const sId = String(s.id || s._id || '');
    return sId !== currentUserId && s.name?.toLowerCase().includes(partnerSearch.toLowerCase());
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 25 }}
          className="relative w-full max-w-4xl h-[88vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border-4 border-[#3D2517] bg-[#140D0A]"
        >
          {/* Top Leather Book Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#D4AF37]/30 bg-gradient-to-r from-[#2A160E] via-[#3B1F14] to-[#2A160E] text-[#F3E5AB]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#FFD700] shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-[#FFD700]" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                  Tom Riddle's Ephemeral Diary
                </h2>
                <p className="text-xs text-[#EEDC82]/70 italic flex items-center gap-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Synchronous Magical Parchment • Words Vanish Into the Fibers
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#EEDC82]/60 hover:text-[#FFD700] hover:bg-[#D4AF37]/10 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Scribe Companion Selector */}
            <div className="w-full md:w-72 bg-[#1A0F0A] border-r border-[#D4AF37]/20 flex flex-col p-4 space-y-3">
              <div className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider flex items-center justify-between" style={{ fontFamily: "'Cinzel', serif" }}>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Fellow Scribes
                </span>
                {partner && (
                  <button
                    onClick={() => setPartner(null)}
                    className="text-[10px] text-[#EEDC82]/60 hover:text-amber-300 underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {!partner ? (
                <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="Search scribe name..."
                    className="w-full bg-[#2B1B17] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-amber-100 placeholder:text-stone-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {filteredScribes.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-6 italic">
                        No companions found. Invite a fellow scribe to the realm!
                      </p>
                    ) : (
                      filteredScribes.map((scribe) => (
                        <button
                          key={scribe.id || scribe._id}
                          onClick={() => {
                            setPartner(scribe);
                            waxSealAudio.playUiTap();
                          }}
                          className="w-full text-left p-2.5 rounded-xl border border-[#D4AF37]/20 hover:border-[#D4AF37] bg-[#22130C] hover:bg-[#2F1B12] transition-all flex items-center justify-between group"
                        >
                          <div>
                            <span className="text-sm font-semibold text-amber-200 group-hover:text-amber-100 block">
                              {scribe.name}
                            </span>
                            <span className="text-[10px] text-amber-400/60 uppercase tracking-wider">
                              {scribe.role || 'Scribe'}
                            </span>
                          </div>
                          <Feather className="w-4 h-4 text-[#D4AF37]/40 group-hover:text-[#D4AF37] transition-colors" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Partner Card & Presence Status */
                <div className="p-3.5 rounded-2xl bg-[#26150E] border border-[#D4AF37]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#EEDC82]/60">Diary Counterpart:</span>
                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        partnerIsOnline
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-stone-900 text-stone-400 border-stone-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${partnerIsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                      {partnerIsOnline ? 'Active on Page' : 'Offline / Distant'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-[#FFD700]" style={{ fontFamily: "'Cinzel', serif" }}>
                      {partner.name}
                    </h4>
                    <p className="text-xs text-amber-200/70 italic">
                      Linked by the enchanted inkwell
                    </p>
                  </div>

                  {/* Lock Status Banner */}
                  <div className="p-2.5 rounded-xl bg-[#140D0A] border border-[#D4AF37]/20 text-xs">
                    {isMyTurn ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <Unlock className="w-4 h-4" /> Thou art holding the Quill!
                      </span>
                    ) : isSomeoneElseWriting ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                        <Lock className="w-4 h-4" /> {partner.name} is dipping quill...
                      </span>
                    ) : (
                      <span className="text-stone-300 flex items-center gap-1.5">
                        <Feather className="w-4 h-4 text-amber-400" /> Quill is resting on desk.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: The Magical Parchment Page */}
            <div className="flex-1 flex flex-col bg-[#F4EAD4] relative overflow-hidden shadow-inner">
              {/* Parchment Aging Vignette Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(61,37,23,0.22)_100%)]" />

              {/* Top Page Status Bar */}
              <div className="relative z-10 px-6 py-3 border-b border-[#C8B28A] flex items-center justify-between text-xs text-[#4A2E1B]" style={{ fontFamily: "'Cinzel', serif" }}>
                <span className="font-semibold tracking-wider flex items-center gap-2">
                  <Feather className={`w-4 h-4 ${isSomeoneElseWriting ? 'quill-active-bob text-[#8B4513]' : 'text-[#A07855]'}`} />
                  {isAbsorbing ? (
                    <span className="text-amber-800 font-bold animate-pulse">
                      ✨ Ink is absorbing into the parchment...
                    </span>
                  ) : isSomeoneElseWriting ? (
                    <span className="text-amber-900 font-bold">
                      ✍️ {currentWriterName || partner?.name} is writing in real-time...
                    </span>
                  ) : isMyTurn ? (
                    <span className="text-emerald-800 font-bold">
                      ✍️ Thou art inking the page. Press Inscribe to submit.
                    </span>
                  ) : (
                    <span>The parchment awaits words...</span>
                  )}
                </span>

                {!partner ? (
                  <span className="text-stone-600 italic">Select a companion to begin</span>
                ) : (
                  <div className="flex items-center gap-2">
                    {!isMyTurn && !isSomeoneElseWriting && !isAbsorbing && (
                      <button
                        onClick={handleClaimQuill}
                        className="py-1 px-3 bg-[#4A2E1B] hover:bg-[#3D2517] text-[#FAF5E8] rounded-lg font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                      >
                        <Feather className="w-3.5 h-3.5 text-[#FFD700]" />
                        Take Quill
                      </button>
                    )}
                    {isMyTurn && !isAbsorbing && (
                      <button
                        onClick={handleReleaseQuill}
                        className="py-1 px-2.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-xs transition-colors"
                      >
                        Yield Quill
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* The Diary Page Canvas */}
              <div className="relative z-10 flex-1 p-8 sm:p-12 overflow-y-auto flex flex-col justify-center items-center text-center">
                {!partner ? (
                  <div className="space-y-4 max-w-sm text-stone-700">
                    <BookOpen className="w-16 h-16 mx-auto text-[#8B5A2B]/40" />
                    <h3 className="text-2xl font-bold text-[#4A2E1B]" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                      Blank Diary of the Scribes
                    </h3>
                    <p className="text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Choose a fellow scribe on the left panel to link your quills across the realm.
                    </p>
                  </div>
                ) : isAbsorbing && inscribedText ? (
                  /* Animated Absorbing / Erasing State */
                  <div className="space-y-4 max-w-xl diary-ink-absorbing">
                    <span className="text-xs uppercase tracking-widest text-[#8B5A2B]/70 block" style={{ fontFamily: "'Cinzel', serif" }}>
                      — Inscribed by {inscribedAuthor || 'Scribe'} —
                    </span>
                    <p
                      className="text-3xl sm:text-4xl text-[#1A0F08] font-bold leading-relaxed transition-all"
                      style={{ fontFamily: "'Dancing Script', 'Alex Brush', cursive" }}
                    >
                      "{inscribedText}"
                    </p>
                  </div>
                ) : isSomeoneElseWriting ? (
                  /* Live Counterpart Streaming State */
                  <div className="space-y-4 max-w-xl">
                    <span className="text-xs uppercase tracking-widest text-amber-900/70 block" style={{ fontFamily: "'Cinzel', serif" }}>
                      — {currentWriterName || partner.name} is penning —
                    </span>
                    <p
                      className="text-3xl sm:text-4xl text-[#2B1B17] font-semibold leading-relaxed"
                      style={{ fontFamily: "'Dancing Script', 'Alex Brush', cursive" }}
                    >
                      {liveStreamText || '... dipping feathertip into sepia ink ...'}
                    </p>
                  </div>
                ) : isMyTurn ? (
                  /* Active Writer Input State */
                  <div className="w-full max-w-2xl flex flex-col items-center space-y-4">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder="Inscribe thy words upon the diary... (e.g. 'Hello, dost thou hear me?')"
                      rows={4}
                      className="w-full bg-transparent border-b-2 border-[#8B5A2B]/40 focus:border-[#4A2E1B] p-4 text-2xl sm:text-3xl text-[#1A0F08] placeholder:text-[#8B5A2B]/30 focus:outline-none resize-none text-center font-bold"
                      style={{ fontFamily: "'Dancing Script', 'Alex Brush', cursive" }}
                      autoFocus
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSubmitInk}
                        disabled={!inputText.trim()}
                        className="py-2.5 px-6 bg-gradient-to-r from-[#4A2E1B] via-[#633E24] to-[#4A2E1B] hover:brightness-110 text-[#FFFDF9] rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 border border-[#8B5A2B] disabled:opacity-40 disabled:pointer-events-none transition-all"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        <Feather className="w-4 h-4 text-[#FFD700]" />
                        Inscribe upon Parchment
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Resting Page State */
                  <div className="space-y-4 max-w-md text-[#6D4C34]/80">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#EAD8B8] flex items-center justify-center text-[#8B5A2B] shadow-inner">
                      <Feather className="w-6 h-6" />
                    </div>
                    <p className="text-xl italic text-[#4A2E1B]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      "The inkwell is still, and the leaves of the diary remain pristine."
                    </p>
                    <button
                      onClick={handleClaimQuill}
                      className="py-2 px-5 bg-[#4A2E1B] hover:bg-[#382213] text-[#FAF5E8] rounded-xl text-sm font-bold shadow-lg transition-all"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      ✍️ Take the Quill & Write
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Footer Lore Bar */}
              <div className="relative z-10 px-6 py-2.5 bg-[#E6D7BD] border-t border-[#C8B28A] text-center text-xs text-[#5C3A21]/80 italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                "Whatever is inscribed into this book dissolveth into the ether once read, leaving no mortal chronicle behind."
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default TomRiddlesDiaryModal;
