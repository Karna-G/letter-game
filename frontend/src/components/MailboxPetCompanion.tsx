import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, RefreshCw, X, Award, Feather } from 'lucide-react';
import { updateMailboxPet, type MailboxPetType } from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';

export interface MailboxPetData {
  id: MailboxPetType;
  name: string;
  title: string;
  species: string;
  emoji: string;
  description: string;
  specialActionName: string;
  quotes: string[];
  perchStyle: string;
}

export const MAILBOX_PETS: Record<Exclude<MailboxPetType, 'none'>, MailboxPetData> = {
  pigeon: {
    id: 'pigeon',
    name: 'Barnaby',
    title: 'Imperial Carrier Pigeon',
    species: 'Columba Postalis',
    emoji: '🐦',
    description: 'Swift sky-bearer of royal epistolary seals. Trained in the imperial aviaries to navigate any storm.',
    specialActionName: 'Wing Flutter & Flap',
    quotes: [
      'Coo-coo! The skies were clear today, and I guarded thy postal chamber.',
      'Coo! I sense a courier riding near with fresh sealing wax!',
      'Rrr-coo! Thy letters are safely roosted beside me.',
      'Flap! All horizons are clear and ready for flight.',
    ],
    perchStyle: 'from-amber-950 to-stone-950 border-amber-600/50'
  },
  cat: {
    id: 'cat',
    name: 'Scholastica',
    title: 'Grand Library Cat',
    species: 'Felis Epistola',
    emoji: '🐱',
    description: 'Curled guardian of quiet midnight scrolls. Known to nap exclusively upon warm, freshly pressed wax missives.',
    specialActionName: 'Spine Stretch & Paw Reach',
    quotes: [
      'Purrrr... warm parchment is the finest bedding in the entire realm.',
      'Meow. No vermin shall nibble at thy precious wax seals while I am on watch.',
      'Purrr... dost thou smell the fresh iron gall ink on those missives?',
      'A fine hour for an epistolary nap beside thy mailbox.'
    ],
    perchStyle: 'from-rose-950 to-stone-950 border-amber-600/50'
  },
  fox: {
    id: 'fox',
    name: 'Ignis',
    title: 'Frontier Scout Fox',
    species: 'Vulpes Cursoria',
    emoji: '🦊',
    description: 'Agile wilderness pathfinder. Keeps watch for highwaymen and guides couriers along secret forest trade paths.',
    specialActionName: 'Alert Sniff & Keen Survey',
    quotes: [
      'Yip! I know all the hidden forest shortcuts the couriers use!',
      'Sniffs the air... I scent the aroma of aged parchment and courier leather!',
      'A cunning scribe always keeps a sharp eye on their mailbox.',
      'No stealthy highwaymen can slip past my bushy tail unnoticed!'
    ],
    perchStyle: 'from-amber-900 to-stone-950 border-amber-600/50'
  },
  owl: {
    id: 'owl',
    name: 'Archimedes',
    title: "Postmaster's Night Owl",
    species: 'Bubo Nocturnus',
    emoji: '🦉',
    description: 'Silent sentinel of twilight dispatches. Pierces through the thickest fog to watch over undelivered missives.',
    specialActionName: 'Wise Double-Blink & Feather Puff',
    quotes: [
      'Hoo-hoo! The night mail is the swiftest mail in the kingdom.',
      'Blinks with golden eyes... Wisdom lies sealed within every thoughtful letter.',
      'Hoot! From atop the postal tower, I watch the realm sleep.',
      'I delivered secrets under the moonlight before thou wert awake.'
    ],
    perchStyle: 'from-indigo-950 to-stone-950 border-amber-600/50'
  }
};
interface MailboxPetCompanionProps {
  currentPet: MailboxPetType;
  userId: string;
  unreadCount?: number;
  onPetChanged?: (newPet: MailboxPetType) => void;
  compact?: boolean;
}

export default function MailboxPetCompanion({
  currentPet = 'pigeon',
  userId,
  unreadCount = 0,
  onPetChanged,
  compact = false
}: MailboxPetCompanionProps) {
  const [activePet, setActivePet] = useState<MailboxPetType>(currentPet || 'pigeon');
  const [isSpecialAnimating, setIsSpecialAnimating] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const bubbleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentPet) setActivePet(currentPet);
  }, [currentPet]);

  useEffect(() => {
    if (activePet === 'none') return;

    let timeoutId: number;
    const scheduleNextAnimation = () => {
      const delay = Math.floor(Math.random() * 7000) + 7000;
      timeoutId = window.setTimeout(() => {
        triggerSpecialAnimation(false);
        scheduleNextAnimation();
      }, delay);
    };

    scheduleNextAnimation();
    return () => clearTimeout(timeoutId);
  }, [activePet]);

  const triggerSpecialAnimation = (isManualClick = false) => {
    if (isSpecialAnimating || activePet === 'none') return;
    setIsSpecialAnimating(true);

    if (isManualClick) {
      try {
        waxSealAudio.playUiTap();
      } catch (_) {}

      const newHeart = { id: Date.now(), x: Math.random() * 40 - 20, y: -10 };
      setHearts(prev => [...prev.slice(-4), newHeart]);

      const petData = MAILBOX_PETS[activePet as Exclude<MailboxPetType, 'none'>];
      if (petData) {
        let quote = '';
        if (unreadCount > 0 && Math.random() > 0.4) {
          quote = `${unreadCount} unread ${unreadCount === 1 ? 'missive rests' : 'missives rest'} in thy postal satchel!`;
        } else {
          const idx = Math.floor(Math.random() * petData.quotes.length);
          quote = petData.quotes[idx];
        }
        setSpeechBubble(quote);
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = window.setTimeout(() => setSpeechBubble(null), 4500);
      }
    }

    setTimeout(() => {
      setIsSpecialAnimating(false);
    }, 2200);
  };

  const handleSelectPet = async (petId: MailboxPetType) => {
    setSaving(true);
    try {
      if (userId) {
        await updateMailboxPet(userId, petId);
      }
      setActivePet(petId);
      if (onPetChanged) onPetChanged(petId);
      try {
        waxSealAudio.playWaxStampThud();
      } catch (_) {}
      setShowSelectorModal(false);
      
      if (petId !== 'none') {
        const petData = MAILBOX_PETS[petId];
        setSpeechBubble(`*${petData.name} the ${petData.species} settles attentively beside thy mailbox.*`);
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = window.setTimeout(() => setSpeechBubble(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update companion');
    } finally {
      setSaving(false);
    }
  };

  if (activePet === 'none') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSelectorModal(true)}
          className="btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
          title="Appoint a Mailbox Pet Companion"
        >
          <span>🐾</span>
          <span>Adopt Mailbox Companion</span>
        </button>

        {showSelectorModal && (
          <PetSelectorModal
            activePet={activePet}
            saving={saving}
            onSelectPet={handleSelectPet}
            onClose={() => setShowSelectorModal(false)}
          />
        )}
      </div>
    );
  }

  const petData = MAILBOX_PETS[activePet as Exclude<MailboxPetType, 'none'>] || MAILBOX_PETS.pigeon;

  return (
    <>
      <div className={`relative flex flex-col items-center select-none ${compact ? 'scale-90 sm:scale-100' : ''}`}>
        <AnimatePresence>
          {hearts.map(h => (
            <motion.div
              key={h.id}
              initial={{ opacity: 1, y: 0, x: h.x, scale: 0.8 }}
              animate={{ opacity: 0, y: -45, x: h.x * 1.5, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute pointer-events-none z-30 text-rose-400 font-bold text-sm"
              style={{ top: '10%' }}
            >
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {speechBubble && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute -top-16 z-30 max-w-[210px] sm:max-w-[240px] px-3 py-1.5 rounded shadow-xl text-center pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, #FFFDF9 0%, #F5ECD7 100%)',
                border: '1px solid #C89D3C',
                color: '#2A1810',
                boxShadow: '0 8px 25px rgba(0,0,0,0.5), 0 0 10px rgba(212,175,55,0.3)'
              }}
            >
              <div className="text-[11px] font-serif leading-tight italic font-medium">
                "{speechBubble}"
              </div>
              <div
                className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
                style={{
                  background: '#F5ECD7',
                  borderRight: '1px solid #C89D3C',
                  borderBottom: '1px solid #C89D3C'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          onClick={() => triggerSpecialAnimation(true)}
          className="group relative cursor-pointer flex flex-col items-center transition-transform active:scale-95"
          title={`Click to pet ${petData.name} the ${petData.title}`}
        >
          <div className="absolute inset-0 rounded-full bg-amber-500/10 filter blur-md opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
            {activePet === 'pigeon' && <PigeonSvg isSpecial={isSpecialAnimating} />}
            {activePet === 'cat' && <CatSvg isSpecial={isSpecialAnimating} />}
            {activePet === 'fox' && <FoxSvg isSpecial={isSpecialAnimating} />}
            {activePet === 'owl' && <OwlSvg isSpecial={isSpecialAnimating} />}
          </div>

          <div
            className={`w-20 sm:w-24 h-4 sm:h-5 rounded-full bg-gradient-to-r ${petData.perchStyle} border shadow-lg flex items-center justify-between px-2 -mt-1.5 z-10 relative`}
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-inner" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300/90 font-mono truncate px-1">
              {petData.name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-inner" />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <button
            onClick={() => triggerSpecialAnimation(true)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/60 hover:bg-amber-900/80 text-amber-300/90 hover:text-amber-200 border border-amber-600/40 transition-all font-serif flex items-center gap-1 shadow-sm"
            title="Interact with companion"
          >
            <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
            <span>Pet</span>
          </button>

          <button
            onClick={() => setShowSelectorModal(true)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900/70 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-700 hover:border-amber-500/50 transition-all font-serif flex items-center gap-1 shadow-sm"
            title="Switch your companion"
          >
            <RefreshCw className="w-2.5 h-2.5 text-amber-400" />
            <span>Change</span>
          </button>
        </div>
      </div>

      {showSelectorModal && (
        <PetSelectorModal
          activePet={activePet}
          saving={saving}
          onSelectPet={handleSelectPet}
          onClose={() => setShowSelectorModal(false)}
        />
      )}
    </>
  );
}
interface PetSelectorModalProps {
  activePet: MailboxPetType;
  saving: boolean;
  onSelectPet: (pet: MailboxPetType) => void;
  onClose: () => void;
}

function PetSelectorModal({ activePet, saving, onSelectPet, onClose }: PetSelectorModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(7, 6, 5, 0.88)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="theatrical-card p-6 sm:p-8 max-w-2xl w-full rounded-sm relative overflow-hidden shadow-2xl space-y-6"
          style={{
            background: 'linear-gradient(160deg, #1D1915 0%, #110F0D 100%)',
            border: '2px solid var(--antique-gold)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 30px rgba(212,175,55,0.2)'
          }}
        >
          <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-500/10 border border-amber-500/40">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
                  The Royal Postal Menagerie
                </h3>
                <p className="text-xs sm:text-sm italic" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
                  Appoint a loyal companion to perch faithfully beside thy mailbox.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(MAILBOX_PETS) as (keyof typeof MAILBOX_PETS)[]).map((key) => {
              const pet = MAILBOX_PETS[key];
              const isSelected = activePet === key;

              return (
                <div
                  key={key}
                  onClick={() => onSelectPet(key)}
                  className={`relative p-4 rounded-sm border transition-all cursor-pointer group flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-950/80 to-stone-900/90 border-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                      : 'bg-stone-950/60 border-stone-800 hover:border-amber-700/60 hover:bg-stone-900/60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/60">
                      <Award className="w-3 h-3" /> Selected
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center p-1 rounded bg-stone-900/80 border border-amber-900/40">
                      {key === 'pigeon' && <PigeonSvg isSpecial={false} />}
                      {key === 'cat' && <CatSvg isSpecial={false} />}
                      {key === 'fox' && <FoxSvg isSpecial={false} />}
                      {key === 'owl' && <OwlSvg isSpecial={false} />}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{pet.emoji}</span>
                        <h4 className="font-bold text-sm text-stone-100 group-hover:text-amber-200 transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
                          {pet.name}
                        </h4>
                      </div>
                      <p className="text-[11px] font-semibold text-amber-400/90 font-mono">
                        {pet.title}
                      </p>
                      <p className="text-[11px] italic text-stone-400 line-clamp-2 leading-tight">
                        {pet.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-amber-900/20 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400 font-mono flex items-center gap-1">
                      <Feather className="w-2.5 h-2.5 text-amber-400" />
                      <span>{pet.specialActionName}</span>
                    </span>

                    <span className={`font-bold uppercase tracking-wider ${isSelected ? 'text-amber-300' : 'text-stone-400 group-hover:text-amber-200'}`}>
                      {isSelected ? 'Active Companion' : 'Select →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-amber-900/30">
            <button
              onClick={() => onSelectPet('none')}
              className="text-xs text-stone-400 hover:text-stone-200 underline font-serif"
            >
              I prefer no pet companion at my mailbox
            </button>

            <button
              onClick={onClose}
              disabled={saving}
              className="btn-gold-saloon text-xs py-2 px-5 font-bold shadow"
            >
              {saving ? 'Appointing...' : 'Close Menagerie'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// 🐦 PIGEON
function PigeonSvg({ isSpecial }: { isSpecial: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full overflow-visible"
      animate={
        isSpecial
          ? {
              y: [0, -12, 0, -10, 0, -4, 0],
              rotate: [0, -6, 6, -4, 4, 0],
              scale: [1, 1.08, 1, 1.05, 1],
            }
          : {
              y: [0, -2.5, 0],
              rotate: [0, 1.5, 0],
            }
      }
      transition={
        isSpecial
          ? { duration: 1.8, ease: 'easeInOut' }
          : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.35)" />
      <path d="M 28 62 L 10 74 L 18 58 Z" fill="#4B5563" />
      <path d="M 26 64 L 12 78 L 20 60 Z" fill="#374151" />
      <line x1="44" y1="78" x2="40" y2="87" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="56" y1="78" x2="58" y2="87" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="50" cy="62" rx="22" ry="18" fill="#6B7280" />
      <ellipse cx="50" cy="62" rx="19" ry="15" fill="#9CA3AF" />
      <path d="M 52 46 Q 66 50 64 62 Q 56 60 52 46 Z" fill="#059669" opacity="0.85" />
      <path d="M 54 48 Q 65 52 62 60 Q 56 58 54 48 Z" fill="#9333EA" opacity="0.65" />

      <motion.g
        animate={
          isSpecial
            ? { rotate: [0, 15, -10, 8, 0], y: [0, -3, 0] }
            : { rotate: [0, 3, 0, -2, 0], y: [0, -1, 0] }
        }
        transition={{ duration: isSpecial ? 1.5 : 3.2, repeat: isSpecial ? 0 : Infinity }}
        style={{ transformOrigin: '60px 45px' }}
      >
        <circle cx="64" cy="40" r="13" fill="#6B7280" />
        <circle cx="64" cy="40" r="11" fill="#9CA3AF" />
        <circle cx="68" cy="38" r="3.5" fill="#F97316" />
        <circle cx="68" cy="38" r="1.8" fill="#111827" />
        <circle cx="69" cy="37" r="0.8" fill="#FFFFFF" />
        <path d="M 74 41 L 86 43 L 74 46 Z" fill="#D97706" />
        <ellipse cx="73" cy="40" rx="2.5" ry="1.5" fill="#E5E7EB" />
      </motion.g>

      <motion.g
        animate={
          isSpecial
            ? {
                rotate: [0, -55, 20, -50, 15, -35, 0],
                y: [0, -10, 2, -8, 2, -4, 0],
                scaleY: [1, 0.7, 1.2, 0.7, 1.1, 1],
              }
            : {
                rotate: [0, -2, 0],
              }
        }
        transition={
          isSpecial
            ? { duration: 1.6, ease: 'easeInOut' }
            : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ transformOrigin: '40px 52px' }}
      >
        <path d="M 36 50 Q 56 46 64 60 Q 52 74 34 68 Q 28 58 36 50 Z" fill="#4B5563" />
        <path d="M 40 54 Q 54 50 60 62 Q 50 72 38 66 Z" fill="#374151" />
        <line x1="42" y1="58" x2="52" y2="65" stroke="#F3F4F6" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="45" y1="54" x2="55" y2="61" stroke="#F3F4F6" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      <path d="M 52 64 Q 56 70 54 74" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <circle cx="54" cy="74" r="2.5" fill="#D4AF37" />
    </motion.svg>
  );
}

// 🐱 CAT
function CatSvg({ isSpecial }: { isSpecial: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full overflow-visible"
      animate={
        isSpecial
          ? {
              y: [0, -8, 0, -4, 0],
              scaleX: [1, 1.15, 0.92, 1.05, 1],
            }
          : {
              y: [0, -1.8, 0],
              scaleY: [1, 1.03, 1],
            }
      }
      transition={
        isSpecial
          ? { duration: 2.0, ease: 'easeInOut' }
          : { duration: 3.0, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="rgba(0,0,0,0.35)" />

      <motion.path
        d="M 24 70 Q 10 65 12 50 Q 14 38 22 36"
        fill="none"
        stroke="#78350F"
        strokeWidth="6"
        strokeLinecap="round"
        animate={
          isSpecial
            ? {
                d: [
                  'M 24 70 Q 10 65 12 50 Q 14 38 22 36',
                  'M 24 70 Q 6 55 10 32 Q 14 20 26 18',
                  'M 24 70 Q 10 65 12 50 Q 14 38 22 36'
                ]
              }
            : {
                d: [
                  'M 24 70 Q 10 65 12 50 Q 14 38 22 36',
                  'M 24 70 Q 14 68 16 52 Q 18 42 26 40',
                  'M 24 70 Q 10 65 12 50 Q 14 38 22 36'
                ]
              }
        }
        transition={{ duration: isSpecial ? 1.8 : 3.5, repeat: isSpecial ? 0 : Infinity, ease: 'easeInOut' }}
      />

      <motion.path
        d="M 26 72 Q 35 52 55 54 Q 72 56 74 74 Q 65 84 45 84 Q 28 82 26 72 Z"
        fill="#92400E"
        animate={
          isSpecial
            ? {
                d: [
                  'M 26 72 Q 35 52 55 54 Q 72 56 74 74 Q 65 84 45 84 Q 28 82 26 72 Z',
                  'M 26 72 Q 40 32 58 38 Q 72 50 78 78 Q 65 82 45 82 Q 28 82 26 72 Z',
                  'M 26 72 Q 35 52 55 54 Q 72 56 74 74 Q 65 84 45 84 Q 28 82 26 72 Z'
                ]
              }
            : {}
        }
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />

      <ellipse cx="58" cy="68" rx="12" ry="10" fill="#FEF3C7" />

      <motion.g
        animate={
          isSpecial
            ? { x: [0, 8, 12, 6, 0], y: [0, -2, -4, 0, 0] }
            : {}
        }
        transition={{ duration: 1.8 }}
      >
        <ellipse cx="62" cy="82" rx="5" ry="4" fill="#FEF3C7" />
        <ellipse cx="72" cy="82" rx="5" ry="4" fill="#FEF3C7" />
      </motion.g>

      <motion.g
        animate={
          isSpecial
            ? { y: [0, -4, 2, -2, 0], rotate: [0, -5, 5, 0] }
            : { y: [0, -1, 0] }
        }
        transition={{ duration: isSpecial ? 1.8 : 3.0, repeat: isSpecial ? 0 : Infinity }}
        style={{ transformOrigin: '64px 44px' }}
      >
        <polygon points="52,36 58,20 66,32" fill="#78350F" />
        <polygon points="55,34 59,23 64,31" fill="#FCA5A5" />
        <polygon points="68,32 76,20 82,36" fill="#78350F" />
        <polygon points="70,31 75,23 79,34" fill="#FCA5A5" />

        <circle cx="67" cy="44" r="15" fill="#B45309" />
        <ellipse cx="67" cy="47" rx="10" ry="7" fill="#FEF3C7" />

        {isSpecial ? (
          <>
            <path d="M 59 42 Q 63 38 65 42" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 69 42 Q 71 38 75 42" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="61" cy="41" rx="2.8" ry="3.2" fill="#10B981" />
            <ellipse cx="61" cy="41" rx="1.2" ry="2.8" fill="#111827" />
            <circle cx="62" cy="40" r="0.8" fill="#FFFFFF" />

            <ellipse cx="73" cy="41" rx="2.8" ry="3.2" fill="#10B981" />
            <ellipse cx="73" cy="41" rx="1.2" ry="2.8" fill="#111827" />
            <circle cx="74" cy="40" r="0.8" fill="#FFFFFF" />
          </>
        )}

        <polygon points="66,46 68,46 67,48" fill="#F43F5E" />
        <path d="M 67 48 Q 65 52 63 51 M 67 48 Q 69 52 71 51" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <line x1="56" y1="46" x2="48" y2="44" stroke="#FEF3C7" strokeWidth="1.2" />
        <line x1="56" y1="48" x2="46" y2="49" stroke="#FEF3C7" strokeWidth="1.2" />
        <line x1="78" y1="46" x2="86" y2="44" stroke="#FEF3C7" strokeWidth="1.2" />
        <line x1="78" y1="48" x2="88" y2="49" stroke="#FEF3C7" strokeWidth="1.2" />
      </motion.g>

      <path d="M 56 56 Q 66 60 76 56" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="66" cy="60" r="3" fill="#D4AF37" />
    </motion.svg>
  );
}

// 🦊 FOX
function FoxSvg({ isSpecial }: { isSpecial: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full overflow-visible"
      animate={
        isSpecial
          ? {
              y: [0, -3, 0, -2, 0],
            }
          : {
              y: [0, -2, 0],
            }
      }
      transition={{ duration: isSpecial ? 1.8 : 2.8, repeat: isSpecial ? 0 : Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="rgba(0,0,0,0.35)" />

      <motion.g
        animate={
          isSpecial
            ? {
                rotate: [0, -18, 22, -14, 18, 0],
                scale: [1, 1.08, 0.95, 1.05, 1]
              }
            : {
                rotate: [0, -6, 6, 0],
              }
        }
        transition={{ duration: isSpecial ? 1.6 : 3.2, repeat: isSpecial ? 0 : Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '32px 75px' }}
      >
        <path d="M 30 76 C 10 70 6 46 20 38 C 30 32 38 48 34 68 Z" fill="#EA580C" />
        <path d="M 20 38 C 16 42 12 50 18 52 C 24 54 28 44 20 38 Z" fill="#FFFFFF" />
      </motion.g>

      <path d="M 32 74 Q 42 50 56 54 Q 68 58 70 78 Q 60 86 46 86 Q 34 84 32 74 Z" fill="#C2410C" />
      <path d="M 44 56 Q 54 54 58 70 Q 50 82 44 56 Z" fill="#FFFBEB" />

      <ellipse cx="52" cy="84" rx="4.5" ry="3" fill="#18181B" />
      <ellipse cx="64" cy="84" rx="4.5" ry="3" fill="#18181B" />

      <motion.g
        animate={
          isSpecial
            ? {
                rotate: [0, -18, 20, -12, 14, 0],
                x: [0, -4, 4, -2, 2, 0],
              }
            : {
                rotate: [0, 2, -2, 0],
              }
        }
        transition={{ duration: isSpecial ? 1.8 : 3.6, repeat: isSpecial ? 0 : Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '60px 48px' }}
      >
        <polygon points="46,32 50,12 62,28" fill="#9A3412" />
        <polygon points="48,30 52,16 59,27" fill="#18181B" />
        <polygon points="62,28 74,12 78,32" fill="#9A3412" />
        <polygon points="65,27 72,16 76,30" fill="#18181B" />

        <path d="M 48 36 Q 62 30 76 36 Q 74 54 62 60 Q 50 54 48 36 Z" fill="#EA580C" />
        <path d="M 49 42 Q 62 46 62 60 Q 54 54 49 42 Z" fill="#FFFBEB" />
        <path d="M 75 42 Q 62 46 62 60 Q 70 54 75 42 Z" fill="#FFFBEB" />

        <ellipse cx="54" cy="42" rx="2.5" ry="3" fill="#18181B" />
        <circle cx="55" cy="41" r="0.8" fill="#FFFFFF" />
        <ellipse cx="70" cy="42" rx="2.5" ry="3" fill="#18181B" />
        <circle cx="71" cy="41" r="0.8" fill="#FFFFFF" />

        <polygon points="60,57 64,57 62,60" fill="#18181B" />
      </motion.g>

      <circle cx="56" cy="62" r="3" fill="#D4AF37" />
      <polygon points="56,60 57,62 56,64 55,62" fill="#991B1B" />
    </motion.svg>
  );
}

// 🦉 OWL
function OwlSvg({ isSpecial }: { isSpecial: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full overflow-visible"
      animate={
        isSpecial
          ? {
              y: [0, -4, 0, -2, 0],
              scale: [1, 1.05, 1, 1.03, 1]
            }
          : {
              y: [0, -1.8, 0],
              scaleY: [1, 1.02, 1]
            }
      }
      transition={{ duration: isSpecial ? 1.8 : 3.2, repeat: isSpecial ? 0 : Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.35)" />

      <ellipse cx="50" cy="60" rx="22" ry="24" fill="#451A03" />
      <ellipse cx="50" cy="62" rx="18" ry="20" fill="#78350F" />

      <ellipse cx="50" cy="65" rx="13" ry="14" fill="#FEF3C7" opacity="0.9" />
      <path d="M 44 60 Q 47 63 50 60 Q 53 63 56 60" stroke="#B45309" strokeWidth="1.5" fill="none" />
      <path d="M 42 66 Q 46 70 50 66 Q 54 70 58 66" stroke="#B45309" strokeWidth="1.5" fill="none" />
      <path d="M 45 72 Q 48 75 50 72 Q 52 75 55 72" stroke="#B45309" strokeWidth="1.5" fill="none" />

      <path d="M 28 48 Q 24 64 34 76 Q 38 68 34 50 Z" fill="#290E02" />
      <path d="M 72 48 Q 76 64 66 76 Q 62 68 66 50 Z" fill="#290E02" />

      <line x1="43" y1="82" x2="41" y2="88" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="47" y1="82" x2="47" y2="88" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="53" y1="82" x2="53" y2="88" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="57" y1="82" x2="59" y2="88" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />

      <motion.g
        animate={
          isSpecial
            ? {
                rotate: [0, 45, -35, 20, 0],
                y: [0, -3, 1, -1, 0]
              }
            : {
                rotate: [0, 3, -3, 0],
              }
        }
        transition={{ duration: isSpecial ? 1.8 : 4.0, repeat: isSpecial ? 0 : Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 38px' }}
      >
        <polygon points="32,24 28,10 42,20" fill="#290E02" />
        <polygon points="68,24 72,10 58,20" fill="#290E02" />

        <circle cx="50" cy="36" r="18" fill="#451A03" />
        <circle cx="50" cy="36" r="16" fill="#78350F" />

        <circle cx="42" cy="36" r="9" fill="#FEF3C7" />
        <circle cx="58" cy="36" r="9" fill="#FEF3C7" />

        <motion.g
          animate={
            isSpecial
              ? {
                  scaleY: [1, 0.1, 1, 0.1, 1],
                }
              : {
                  scaleY: [1, 1, 0.2, 1],
                }
          }
          transition={{ duration: isSpecial ? 1.2 : 4.5, repeat: isSpecial ? 0 : Infinity }}
          style={{ transformOrigin: '50px 36px' }}
        >
          <circle cx="42" cy="36" r="6.5" fill="#F59E0B" />
          <circle cx="42" cy="36" r="3.8" fill="#111827" />
          <circle cx="44" cy="34" r="1.2" fill="#FFFFFF" />

          <circle cx="58" cy="36" r="6.5" fill="#F59E0B" />
          <circle cx="58" cy="36" r="3.8" fill="#111827" />
          <circle cx="60" cy="34" r="1.2" fill="#FFFFFF" />
        </motion.g>

        <polygon points="48,36 52,36 50,45" fill="#D97706" />
      </motion.g>

      <circle cx="50" cy="54" r="3" fill="#D4AF37" />
      <path d="M 50 54 L 54 44" stroke="#D4AF37" strokeWidth="1" strokeDasharray="1,1" />
    </motion.svg>
  );
}
