import AdminDashboard from './AdminDashboard'; // Added for Admin Tribunal
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Feather, PenTool, Scroll, Shield, LogOut, User, Crown, Scan, X, CheckCircle, Star, Flame, Trophy, Clock, Award, Users, AlertTriangle, Compass, Radio, UserPlus, UserCheck, UserX, Trash2, BookOpen, RotateCcw, Inbox, Send, Type, Ghost, Sparkles, Lock, Atom, Box, Eye, Waves, Scissors, Package, CheckSquare, Square, Archive, Megaphone, Pin, MapPin, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { register, login, logout, getStoredUser, getStoredToken, sendLetter, scanLetter, getActiveQuests, getMyLetters, getMyMailbox, updateLetter, getUserProfile, markLetterRead, toggleLetterRead, batchMarkRead, batchTrashLetters, batchRestoreLetters, batchBurnPermanent, burnLetter, getLeaderboard, getMyFriends, reportUser, getActiveMapUsers, getFriendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend, removeLetterToTrash, restoreLetterFromTrash, getTrashedLetters, emptyTrash, burnLetterPermanent, summonDybbukLetter, toggleDybbukMode, checkDybbukAutoDelivery, summonSchrodingerLetter, collapseSchrodingerLetter, uncorkBottleMessage, getPostmasterRiddle, attemptRecallLetter, abandonLetter, batchAbandonLetters, updateNoteStatus, getNotices, postNotice, togglePinNotice, deleteNotice } from './api';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import MailmenDirectory from './components/MailmenDirectory';
import DybbukSeancePage from './pages/DybbukSeancePage';
import SchrodingerVaultPage from './pages/SchrodingerVaultPage';
import BottleOceanPage from './pages/BottleOceanPage';
import DeadLetterOfficePage from './pages/DeadLetterOfficePage';
import WaxSealRevealModal from './components/WaxSealRevealModal';
import SocialTeaserModal from './components/SocialTeaserModal';
import { formatLocalDateTime } from './utils/storyCanvasRenderer';
import LetterTransferModal, { type HandoverData } from './components/LetterTransferModal';
import { PickupRadiusAlertToast, type PickupAlertData } from './components/PickupRadiusAlertToast';
import { PickupAlertSettingsCard } from './components/PickupAlertSettingsCard';
import DeliveryProofModal, { type DeliveryProofRequestData } from './components/DeliveryProofModal';
import CentralHubRegistryModal from './components/CentralHubRegistryModal';
import TomRiddlesDiaryModal from './components/TomRiddlesDiaryModal';
import { waxSealAudio, initGlobalUiClickSound } from './utils/waxSealAudio';
import manuscriptQuillDesk from './assets/manuscript_quill_desk.jpg';
import antiqueScrollsPile from './assets/antique_scrolls_pile.jpg';
import royalCrestGold from './assets/royal_crest_gold.jpg';
import mailboxChamberBg from './assets/mailbox_chamber_bg.jpg';
import grandArchiveLibraryBg from './assets/grand_archive_library_bg.jpg';
import realmMapCartographyBg from './assets/realm_map_cartography_bg.jpg';
import fellowshipScribesBg from './assets/fellowship_scribes_bg.jpg';
import philatelyStampsBg from './assets/philately_stamps_bg.jpg';
import courierDirectoryRosterBg from './assets/courier_directory_roster_bg.jpg';
import courierDispatchTerminalBg from './assets/courier_dispatch_terminal_bg.jpg';
import deadLetterOfficeBg from './assets/dead_letter_office_bg.jpg';

// ============================================
// GUILD TYPOGRAPHY & CALLIGRAPHIC SCRIPTS
// ============================================
const GUILD_FONTS = [
  { id: 'Cinzel', name: 'Cinzel', label: '🏛️ Imperial Roman', family: "'Cinzel', serif", category: 'Antique Serif' },
  { id: 'Cinzel Decorative', name: 'Cinzel Decorative', label: '👑 Royal Inscription', family: "'Cinzel Decorative', cursive", category: 'Royal Decorative' },
  { id: 'MedievalSharp', name: 'MedievalSharp', label: '⚔️ Ancient Gothic', family: "'MedievalSharp', cursive", category: 'Medieval' },
  { id: 'UnifrakturMaguntia', name: 'UnifrakturMaguntia', label: '🏰 Blackletter Chronicle', family: "'UnifrakturMaguntia', cursive", category: 'Medieval' },
  { id: 'Great Vibes', name: 'Great Vibes', label: '📜 Royal Calligraphy', family: "'Great Vibes', cursive", category: 'Calligraphy' },
  { id: 'Dancing Script', name: 'Dancing Script', label: '🪶 Fluid Quill Ink', family: "'Dancing Script', cursive", category: 'Quill Script' },
  { id: 'Alex Brush', name: 'Alex Brush', label: '✒️ Flowing Feathertip', family: "'Alex Brush', cursive", category: 'Quill Script' },
  { id: 'Caveat', name: 'Caveat', label: '✍️ Casual Quill Scribble', family: "'Caveat', cursive", category: 'Handwritten' },
  { id: 'Marck Script', name: 'Marck Script', label: '💌 Romantic Penmanship', family: "'Marck Script', cursive", category: 'Handwritten' },
  { id: 'Sacramento', name: 'Sacramento', label: '🕊️ Graceful Script', family: "'Sacramento', cursive", category: 'Calligraphy' },
  { id: 'Playfair Display', name: 'Playfair Display', label: '🗞️ Victorian Press', family: "'Playfair Display', serif", category: 'Antique Serif' },
  { id: 'Cormorant Garamond', name: 'Cormorant Garamond', label: '📖 Renaissance Tome', family: "'Cormorant Garamond', serif", category: 'Antique Serif' },
  { id: 'Fondamento', name: 'Fondamento', label: '📜 Monastery Manuscript', family: "'Fondamento', cursive", category: 'Medieval' },
  { id: 'Eagle Lake', name: 'Eagle Lake', label: '🛡️ Arthurian Kingdom', family: "'Eagle Lake', cursive", category: 'Medieval' },
  { id: 'Special Elite', name: 'Special Elite', label: '⌨️ Antique Typewriter', family: "'Special Elite', cursive", category: 'Typewriter' },
  { id: 'Courier Prime', name: 'Courier Prime', label: '📜 Bureaucrat Type', family: "'Courier Prime', monospace", category: 'Typewriter' },
  { id: 'Pirata One', name: 'Pirata One', label: '🏴‍☠️ Swashbuckler Scroll', family: "'Pirata One', cursive", category: 'Fantasy' },
  { id: 'Metamorphous', name: 'Metamorphous', label: '🔮 Mythic Lore', family: "'Metamorphous', cursive", category: 'Fantasy' },
  { id: 'Almendra', name: 'Almendra', label: '🧙 Elven Grimoire', family: "'Almendra', serif", category: 'Fantasy' },
];

const getFontFamily = (fontId?: string) => {
  const found = GUILD_FONTS.find(f => f.id === fontId || f.name === fontId);
  return found ? found.family : "'Cinzel', serif";
};

const getFontSizeClass = (fontSize?: string) => {
  switch (fontSize) {
    case 'small': return 'font-scale-modest';
    case 'large': return 'font-scale-grand';
    case 'huge': return 'font-scale-royal';
    case 'medium':
    default: return 'font-scale-standard';
  }
};

// ============================================
// AESTHETIC DECORATIONS & STATIC COMPONENTS
// ============================================
// FIXED: Removed "export" to prevent the Vite White Screen crash!
const getRankFromXP = (xp: number) => {
  const ranks = [
    { name: 'Novice', req: 0, icon: '📝', desc: 'A beginner carrier learning the routes.' },
    { name: 'Courier', req: 100, icon: '🏃', desc: 'A reliable runner for standard missives.' },
    { name: 'Rider', req: 500, icon: '🐎', desc: 'Fast delivery across greater distances.' },
    { name: 'Navigator', req: 1000, icon: '🧭', desc: 'Expert pathfinder in uncharted lands.' },
    { name: 'Postmaster', req: 2500, icon: '🎩', desc: 'Oversees regional distributions.' },
    { name: 'Guild Elder', req: 5000, icon: '📜', desc: 'A venerable keeper of guild traditions.' },
    { name: 'Grandmaster', req: 10000, icon: '👑', desc: 'A legend among letter carriers.' },
    { name: 'Mythic Carrier', req: 25000, icon: '🦄', desc: 'Deliveries that defy natural law.' },
    { name: 'Realm Legend', req: 50000, icon: '✨', desc: 'A name whispered in postal mythology.' },
  ];
  let currentRank = ranks[0];
  let earnedCount = 0;
  for (const rank of ranks) {
    if (xp >= rank.req) {
      currentRank = rank;
      earnedCount++;
    }
  }
  return { currentRank, ranks, earnedCount };
};

const HierarchyBadges = ({ userXP }: { userXP?: number }) => {
  const { ranks } = getRankFromXP(userXP || 0);
  
  return (
    <div className="bg-[#FAF0E6] p-8 rounded-lg shadow-2xl border border-[#D2B48C] mt-8">
      <h3 className="text-3xl font-bold mb-6 text-[#5C3A21] italic text-center">Guild Hierarchy & Badges</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ranks.map((r, i) => {
          const earned = userXP !== undefined ? userXP >= r.req : true;
          return (
            <div key={i} className={`p-4 rounded border-2 text-center shadow transition-all ${earned ? 'bg-[#FDF5E6] border-[#D2B48C]' : 'bg-gray-100 border-gray-300 opacity-60 grayscale'}`}>
              <span className="text-4xl mb-2 block">{r.icon}</span>
              <h4 className={`font-bold text-xl ${earned ? 'text-[#8B5A2B]' : 'text-gray-500'}`}>{r.name}</h4>
              <p className={`text-sm font-semibold mb-2 ${earned ? 'text-[#5C3A21]' : 'text-gray-400'}`}>{r.req} XP</p>
              <p className="text-xs italic text-gray-600">{r.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// FEATURE: INTERACTIVE CARTOGRAPHIC NOTE STATUS
// ============================================
export const NOTE_STATUS_MOODS: Record<string, { icon: string; label: string; desc: string }> = {
  quill: { icon: '🪶', label: 'Scribe at Desk', desc: 'Inscribing manuscripts & soliloquies' },
  horse: { icon: '🏇', label: 'Royal Courier', desc: 'Galloping along frontier highways' },
  scroll: { icon: '📜', label: 'Ancient Lore', desc: 'Consulting parchment scrolls' },
  candle: { icon: '🕯️', label: 'Midnight Scholar', desc: 'Studying under candle glow' },
  compass: { icon: '🧭', label: 'Wayfarer', desc: 'Charting uncharted territories' },
  tavern: { icon: '☕', label: 'Tavern Rest', desc: 'Partaking in warm brew & tales' },
  weather: { icon: '🌧️', label: 'Storm Bound', desc: 'Sheltered against howling gales' },
  crown: { icon: '👑', label: 'Sovereign Post', desc: 'Fulfilling high imperial duties' },
  seal: { icon: '⚜️', label: 'Sealed Decree', desc: 'Bearing confidential royal missives' },
};

export const NOTE_STATUS_PRESETS = [
  { text: '🏇 Galloping swiftly along the northern frontier.', mood: 'horse' },
  { text: '📜 Poring over delicate wax seals and parchment drafts.', mood: 'scroll' },
  { text: '🕯️ Inscribing late-night soliloquies by candlelight.', mood: 'candle' },
  { text: '☕ Paused at the Postal Tavern for warm mulled cider.', mood: 'tavern' },
  { text: '🌧️ Awaiting fair skies; storm delays upon the trail.', mood: 'weather' },
  { text: '💌 Bearing urgent sealed missives for noble scribes.', mood: 'seal' },
  { text: '🧭 Seeking postal quests upon the grand realm map.', mood: 'compass' },
  { text: '🪶 Quill dipped in midnight ink, awaiting inspiration.', mood: 'quill' },
];

export function getNoteRemainingTime(expiresAt?: string | Date | null) {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  const diff = exp - Date.now();
  if (diff <= 0) return { isExpired: true, text: 'Expired' };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return {
    isExpired: false,
    hours,
    minutes,
    text: hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`
  };
}

interface CartographicNoteStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus?: string;
  currentPrivacy?: 'public' | 'friends' | 'private';
  currentMood?: string;
  expiresAt?: string | Date | null;
  onStatusUpdated: (updatedUser: any) => void;
}

function CartographicNoteStatusModal({
  isOpen,
  onClose,
  currentStatus = '',
  currentPrivacy = 'public',
  currentMood = 'quill',
  expiresAt,
  onStatusUpdated
}: CartographicNoteStatusModalProps) {
  const [noteText, setNoteText] = useState(currentStatus);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>(currentPrivacy);
  const [mood, setMood] = useState<string>(currentMood);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNoteText(currentStatus || '');
      setPrivacy(currentPrivacy || 'public');
      setMood(currentMood || 'quill');
      setError('');
      setSuccess('');
    }
  }, [isOpen, currentStatus, currentPrivacy, currentMood]);

  if (!isOpen) return null;

  const remaining = getNoteRemainingTime(expiresAt);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await updateNoteStatus({
        noteStatus: noteText.trim(),
        privacy,
        mood
      });
      setSuccess(res.message || 'Status proclaimed across the realm!');
      onStatusUpdated(res);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (e: any) {
      setError(e.message || 'Failed to proclaim status.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await updateNoteStatus({
        noteStatus: '',
        privacy: 'public',
        mood: 'quill'
      });
      setNoteText('');
      setSuccess('Status cleared from realm records.');
      onStatusUpdated(res);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e: any) {
      setError(e.message || 'Failed to clear status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-curtain-reveal overflow-y-auto">
      <div
        className="theatrical-card p-6 sm:p-8 max-w-xl w-full relative rounded-sm shadow-2xl space-y-6 my-8"
        style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '2px solid var(--antique-gold)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(212,175,55,0.25)'
        }}
      >
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800/60 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold animate-float-gentle" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Interactive Cartographic Status</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            Proclaim Thy Note Status
          </h2>

          <p className="text-xs sm:text-sm italic leading-relaxed" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
            Inscribe a live status to be exhibited above thy avatar upon the realm map, inside the Sovereign Hall of Fame, in fellowship scrolls, and to those inspecting thy profile.
          </p>
        </div>

        {/* 1-Day Lifespan Rule Notice Banner */}
        <div className="p-3.5 rounded-sm flex items-start gap-3 text-xs" style={{ background: 'rgba(212,175,55,0.08)', border: '1px dashed rgba(212,175,55,0.35)' }}>
          <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300 uppercase tracking-wider block font-mono">
              ⏳ 1 Solar Day Duration (24 Hours)
            </span>
            <span className="italic text-stone-300">
              Each proclaimed note status remains vibrant upon the realm for exactly 24 hours. After one day, it gently fades, prompting thee to upload a new proclamation.
              {remaining && !remaining.isExpired && (
                <strong className="block text-emerald-300 font-mono mt-1">Current status: {remaining.text}</strong>
              )}
            </span>
          </div>
        </div>

        {/* Mood Stamp Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
            Select Insignia Mood:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Object.entries(NOTE_STATUS_MOODS).map(([key, item]) => {
              const isSelected = mood === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMood(key)}
                  className={`p-2 rounded-sm text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected ? 'ring-2 ring-amber-400 bg-amber-950/80 shadow-lg' : 'bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] font-serif truncate w-full text-stone-300">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visibility / Privacy Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
            Visibility & Privacy:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setPrivacy('public')}
              className={`p-3 rounded-sm text-left transition-all border ${
                privacy === 'public'
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                  : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs" style={{ fontFamily: "'Cinzel', serif" }}>
                <span>🌐</span> Public Realm
              </div>
              <p className="text-[10px] italic mt-1 text-stone-400">
                Visible on Leaderboards, Profile views, Realm Map, and to all travellers.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPrivacy('friends')}
              className={`p-3 rounded-sm text-left transition-all border ${
                privacy === 'friends'
                  ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-md ring-1 ring-purple-400'
                  : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs" style={{ fontFamily: "'Cinzel', serif" }}>
                <span>🤝</span> Fellowship Only
              </div>
              <p className="text-[10px] italic mt-1 text-stone-400">
                Visible exclusively to thy accepted companions & friends.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPrivacy('private')}
              className={`p-3 rounded-sm text-left transition-all border ${
                privacy === 'private'
                  ? 'bg-red-950/80 border-red-400 text-red-200 shadow-md ring-1 ring-red-400'
                  : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs" style={{ fontFamily: "'Cinzel', serif" }}>
                <span>🔒</span> Private Soliloquy
              </div>
              <p className="text-[10px] italic mt-1 text-stone-400">
                Visible only to thyself within thy private ledger.
              </p>
            </button>
          </div>
        </div>

        {/* Note Status Input Area */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              Inscribe Thy Note (Max 200 Characters):
            </label>
            <span className={`text-[11px] font-mono ${noteText.length > 180 ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
              {noteText.length} / 200
            </span>
          </div>

          <textarea
            value={noteText}
            maxLength={200}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Galloping across the northern ridge bearing royal parchments..."
            rows={3}
            className="w-full p-3.5 rounded-sm font-serif italic text-base sm:text-lg focus:outline-none shadow-inner resize-none"
            style={{
              background: '#FFFDF9',
              color: '#1A1A1A',
              border: '1px solid var(--border-subtle)'
            }}
          />

          {/* Quick Preset Inspirations */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono text-stone-400 block font-bold">
              ✦ Guild Preset Inspirations:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {NOTE_STATUS_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNoteText(p.text);
                    setMood(p.mood);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-sm bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 text-left truncate max-w-full font-serif italic transition-colors"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Box */}
        {noteText.trim() && (
          <div className="p-3.5 rounded-sm space-y-1.5" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <span className="text-[10px] uppercase font-mono text-amber-300 font-bold block">
              ✦ Cartographic Realm Preview:
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-float-gentle">{NOTE_STATUS_MOODS[mood]?.icon || '🪶'}</span>
              <p className="italic text-base sm:text-lg font-serif text-amber-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                “{noteText.trim()}”
              </p>
            </div>
          </div>
        )}

        {/* Error / Success Messages */}
        {error && (
          <div className="p-3 rounded-sm font-bold text-xs sm:text-sm italic flex items-center gap-2" style={{ background: 'rgba(107,29,42,0.4)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.4)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-sm font-bold text-xs sm:text-sm italic flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.4)' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" /> {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
          {currentStatus ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="text-xs text-red-400 hover:text-red-300 underline font-mono flex items-center gap-1 self-start sm:self-center"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Active Status
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-gold-saloon text-xs py-2.5 px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !noteText.trim()}
              className="btn-velvet-burgundy text-xs py-2.5 px-6 flex items-center justify-center gap-2 font-bold"
            >
              <PenTool className="w-4 h-4" />
              {loading ? 'Proclaiming...' : '✦ Proclaim to Realm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TravellerProfileModalProps {
  userId: string | null;
  viewerId?: string;
  onClose: () => void;
}

function TravellerProfileModal({ userId, viewerId, onClose }: TravellerProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      setLoading(true);
      setError('');
      getUserProfile(userId, viewerId)
        .then(setProfile)
        .catch(err => setError(err.message || 'Failed to load profile'))
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
    }
  }, [userId, viewerId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-curtain-reveal overflow-y-auto">
      <div
        className="theatrical-card p-6 sm:p-8 max-w-lg w-full relative rounded-sm shadow-2xl space-y-6 my-8"
        style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '2px solid var(--antique-gold)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(212,175,55,0.25)'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800/60 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="text-center p-8 space-y-2 animate-pulse" style={{ color: 'var(--antique-gold)' }}>
            <Scroll className="w-8 h-8 mx-auto animate-bounce" />
            <p className="font-serif italic text-sm">Consulting the Sovereign Registry...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-sm bg-red-950/60 border border-red-500/40 text-red-200 text-sm">
            {error}
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-amber-900/40 pb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold bg-amber-500/20 border-2 border-amber-400 shadow-md">
                {profile.role === 'mailman' ? '🏇' : '📜'}
              </div>
              <div>
                <h3 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                  {profile.name}
                </h3>
                <p className="text-xs uppercase tracking-widest font-mono font-bold text-amber-300">
                  {profile.role === 'mailman' ? `Royal Courier • ${profile.rank || 'Novice'}` : 'Noble Scribe'}
                </p>
              </div>
            </div>

            {/* Note Status Banner */}
            {profile.noteStatus ? (
              <div className="p-4 rounded-sm relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(60,45,15,0.5) 0%, rgba(30,22,10,0.7) 100%)', border: '1px solid rgba(212,175,55,0.4)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-300">
                    Cartographic Note Status
                  </span>
                  {profile.noteStatusPrivacy && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                      {profile.noteStatusPrivacy === 'friends' ? '🤝 Fellowship' : '🌐 Public'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{NOTE_STATUS_MOODS[profile.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                  <p className="italic text-base sm:text-lg font-serif text-amber-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    “{profile.noteStatus}”
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-stone-400 p-3 rounded-sm bg-stone-900/40 border border-stone-800 text-center">
                No active cartographic status proclaimed upon the realm.
              </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {profile.role === 'mailman' ? (
                <>
                  <div className="p-3 rounded-sm bg-stone-900/60 border border-stone-800">
                    <span className="text-[10px] font-mono uppercase text-stone-400 block font-bold">Experience (XP)</span>
                    <span className="text-xl font-bold text-amber-300 font-mono">{profile.xp || 0} XP</span>
                  </div>
                  <div className="p-3 rounded-sm bg-stone-900/60 border border-stone-800">
                    <span className="text-[10px] font-mono uppercase text-stone-400 block font-bold">Deliveries</span>
                    <span className="text-xl font-bold text-emerald-300 font-mono">{profile.deliveriesCompleted || 0} Fulfilled</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-sm bg-stone-900/60 border border-stone-800">
                    <span className="text-[10px] font-mono uppercase text-stone-400 block font-bold">Reputation</span>
                    <span className="text-xl font-bold text-amber-300 font-mono">{profile.reputationScore || 0} Honour</span>
                  </div>
                  <div className="p-3 rounded-sm bg-stone-900/60 border border-stone-800">
                    <span className="text-[10px] font-mono uppercase text-stone-400 block font-bold">Epistles Penned</span>
                    <span className="text-xl font-bold text-emerald-300 font-mono">{profile.lettersSent || 0} Dispatched</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-stone-800">
              <Link
                to="/compose"
                state={{ draft: { receiverRef: profile.name } }}
                onClick={onClose}
                className="btn-velvet-burgundy flex-1 text-xs py-2.5 justify-center gap-1.5"
              >
                <Feather className="w-3.5 h-3.5" /> Inscribe Epistle
              </Link>
              <button
                onClick={onClose}
                className="btn-gold-saloon text-xs py-2.5 px-5"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ============================================
// AUTH PAGE — Login & Register
// ============================================
function AuthPage({ onAuth }: { onAuth: (user: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sender');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (mode === 'register') {
        data = await register(name, email, password, role);
      } else {
        data = await login(email, password);
      }
      onAuth(data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden" style={{
      backgroundImage: `linear-gradient(to bottom, rgba(14, 13, 12, 0.72), rgba(14, 13, 12, 0.92)), url(${manuscriptQuillDesk})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Candlelight Atmospheric Vignette */}
      <div className="absolute inset-0 pointer-events-none animate-candle-flicker" style={{
        boxShadow: 'inset 0 0 140px rgba(0,0,0,0.92), inset 0 0 50px rgba(107,29,42,0.35)'
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10 my-6"
      >
        {/* Theatrical Proscenium Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-block relative mb-3 animate-float-slow"
          >
            <img
              src={royalCrestGold}
              alt="PostMe Royal Seal"
              className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full object-cover shadow-2xl border-2 border-[var(--antique-gold)] animate-glow-pulse"
              style={{ boxShadow: '0 0 35px rgba(212, 175, 55, 0.35), 0 0 15px rgba(107, 29, 42, 0.5)' }}
            />
          </motion.div>

          <h1 style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--antique-gold)', fontSize: '2.5rem', letterSpacing: '0.08em', fontWeight: 700, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
            PostMe
          </h1>
          
          <p className="text-xs uppercase tracking-[0.25em] font-semibold mt-1" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>
            An 18th-Century Epistle Salon & Courier Guild
          </p>

          <div className="gold-rule gold-rule-dark max-w-[200px] mx-auto my-3" />

          <p className="italic text-base md:text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--parchment-dark)', fontStyle: 'italic' }}>
            {mode === 'login' ? '“Speak thy true title, that the salon doors may part.”' : '“Inscribe thy mark upon the sovereign registry.”'}
          </p>
        </div>

        {/* Grand Form Playbill Card with slow breathing glow */}
        <div className="theatrical-card p-0 animate-glow-pulse" style={{ border: '1px solid rgba(212, 175, 55, 0.35)', boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(212, 175, 55, 0.15)' }}>
          {/* Tab Switcher */}
          <div className="flex" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)' }}>
            <button
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                flex: 1, padding: '1.1rem 1rem', fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                background: mode === 'login' ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'rgba(20, 18, 16, 0.8)',
                color: mode === 'login' ? '#FFF' : 'var(--warm-gray-light)',
                border: 'none', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              Enter the Salon
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              style={{
                flex: 1, padding: '1.1rem 1rem', fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                background: mode === 'register' ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'rgba(20, 18, 16, 0.8)',
                color: mode === 'register' ? '#FFF' : 'var(--warm-gray-light)',
                border: 'none', borderLeft: '1px solid rgba(212, 175, 55, 0.25)', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              Inscribe New Scribe
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5" style={{ background: 'linear-gradient(180deg, #181512 0%, #100E0C 100%)' }}>
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }}>
                  <label className="small-caps block text-xs mb-1.5" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>Noble Name & Epithet</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3.5 rounded-sm focus:outline-none transition-all" style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }} placeholder="Lord Byron of Westminster" required />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="small-caps block text-xs mb-1.5" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>Guild Scroll Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 rounded-sm focus:outline-none transition-all" style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }} placeholder="quill@postme.realm" required />
            </div>

            <div>
              <label className="small-caps block text-xs mb-1.5" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>Secret Cipher Passphrase</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3.5 rounded-sm focus:outline-none transition-all" style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }} placeholder="••••••••" required minLength={6} />
            </div>

            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }}>
                  <label className="small-caps block text-xs mb-2" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>Thy Realm Calling</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'sender', label: 'Salon Scribe', icon: '✍️', desc: 'Craft & dispatch epistles' },
                      { value: 'mailman', label: 'Royal Courier', icon: '📮', desc: 'Carry the realm’s post' },
                    ].map((r) => (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)} className="p-3.5 text-left transition-all rounded-sm" style={{
                        background: role === r.value ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'rgba(255, 253, 249, 0.06)',
                        color: role === r.value ? '#FFF' : 'var(--parchment-dark)',
                        border: role === r.value ? '1px solid var(--antique-gold)' : '1px solid rgba(212, 175, 55, 0.2)',
                        cursor: 'pointer',
                        boxShadow: role === r.value ? '0 0 15px rgba(107,29,42,0.5)' : 'none'
                      }}>
                        <span className="text-xl block mb-1">{r.icon}</span>
                        <span className="font-bold block text-sm" style={{ fontFamily: "'Cinzel', serif" }}>{r.label}</span>
                        <span className="text-xs italic" style={{ color: role === r.value ? 'var(--gold-bright)' : 'var(--warm-gray-light)' }}>{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-sm text-sm italic" style={{ background: '#430E17', color: '#FFF', border: '1px solid #7A1E2E' }}>⚠ {error}</motion.div>}

            <button type="submit" disabled={loading} className="w-full py-4 rounded-sm text-sm font-bold transition-all btn-velvet-burgundy justify-center" style={{ width: '100%' }}>
              {loading ? 'Verifying Credentials...' : mode === 'login' ? '✦ Unseal the Salon Doors' : '⚜ Inscribe Name & Enter'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// REACT CUSTOM CURSOR (Guaranteed to work)
// ============================================
const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hidden, setHidden] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasMouse, setHasMouse] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(any-hover: hover)').matches) {
      return;
    }
    setHasMouse(true);

    const style = document.createElement('style');
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    const mMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const clickable = target.closest('a, button, [role="button"], input, select, textarea, .cursor-pointer');
      setIsHovering(!!clickable);
    };

    const mEnter = () => setHidden(false);
    const mLeave = () => setHidden(true);

    document.addEventListener('mousemove', mMove);
    document.addEventListener('mouseenter', mEnter);
    document.addEventListener('mouseleave', mLeave);

    return () => {
      document.removeEventListener('mousemove', mMove);
      document.removeEventListener('mouseenter', mEnter);
      document.removeEventListener('mouseleave', mLeave);
      document.head.removeChild(style);
    };
  }, []);

  if (!hasMouse) return null;

  return (
    <div 
      className="pointer-events-none fixed top-0 left-0 z-[99999]"
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${isHovering ? '-15deg' : '0deg'}) scale(${isHovering ? 1.2 : 1})`,
        opacity: hidden ? 0 : 1,
        transition: 'transform 0.15s ease-out, opacity 0.2s',
        transformOrigin: 'top left'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" className="drop-shadow-xl">
        <path d="M11 7 L24 20 L20 24 L7 11 Z" fill={isHovering ? "#8B5A2B" : "#5C3A21"} stroke="#3E2723" strokeWidth="1" />
        <path d="M7 11 L11 7 L9 5 L5 9 Z" fill="#D2B48C" stroke="#3E2723" strokeWidth="1" />
        <path d="M5 9 L9 5 L0 0 Z" fill="#E5E7EB" stroke="#3E2723" strokeWidth="1" />
        <line x1="0" y1="0" x2="5" y2="5" stroke="#3E2723" strokeWidth="1" />
        <circle cx="5" cy="5" r="0.5" fill="#3E2723" />
      </svg>
    </div>
  );
};

// Helper to open Royal Story Herald Studio from anywhere in the realm
export function openStoryHeraldStudio(letterData?: any) {
  if (typeof window !== 'undefined') {
    waxSealAudio.playParchmentUnroll();
    window.dispatchEvent(new CustomEvent('open-story-herald', { detail: letterData || null }));
  }
}
export const openSocialTeaserStudio = openStoryHeraldStudio;

// Helper to open Tom Riddle's Ephemeral Diary from anywhere in the realm
export function openTomRiddlesDiary(partner?: { _id: string; name: string } | null) {
  if (typeof window !== 'undefined') {
    waxSealAudio.playParchmentUnroll();
    window.dispatchEvent(new CustomEvent('open-tom-riddles-diary', { detail: partner || null }));
  }
}

// Helper to open Central Hub Delivery Proofs Registry
export function openCentralHubRegistry() {
  if (typeof window !== 'undefined') {
    waxSealAudio.playUiTap();
    window.dispatchEvent(new CustomEvent('open-central-hub-registry'));
  }
}

// ============================================
// MAIN APP (shown after login)
// ============================================
function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [handoverPrompt, setHandoverPrompt] = useState<HandoverData | null>(null);
  const [activePickupAlert, setActivePickupAlert] = useState<PickupAlertData | null>(null);
  const [incomingPickupRequest, setIncomingPickupRequest] = useState<any | null>(null);
  const [presentQrModal, setPresentQrModal] = useState<{ token: string; title: string } | null>(null);
  const [socialTeaserLetter, setSocialTeaserLetter] = useState<any | null>(null);
  const [showStoryStudio, setShowStoryStudio] = useState<boolean>(false);
  const [deliveryProofRequest, setDeliveryProofRequest] = useState<DeliveryProofRequestData | null>(null);
  const [showCentralHubRegistry, setShowCentralHubRegistry] = useState<boolean>(false);
  const [showTomRiddlesDiary, setShowTomRiddlesDiary] = useState<boolean>(false);
  const [diaryPartner, setDiaryPartner] = useState<{ _id: string; name: string } | null>(null);
  const [fellowScribesList, setFellowScribesList] = useState<any[]>([]);
  const [appSocket, setAppSocket] = useState<Socket | null>(null);
  const alertedMailmenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleOpenStoryHeraldEvent = (e: any) => {
      if (e.detail) {
        setSocialTeaserLetter(e.detail);
        setShowStoryStudio(true);
      } else {
        setSocialTeaserLetter(null);
        setShowStoryStudio(true);
      }
    };
    const handleOpenDiaryEvent = (e: any) => {
      setDiaryPartner(e.detail || null);
      setShowTomRiddlesDiary(true);
    };
    const handleOpenHubEvent = () => {
      setShowCentralHubRegistry(true);
    };

    window.addEventListener('open-story-herald', handleOpenStoryHeraldEvent);
    window.addEventListener('open-social-teaser', handleOpenStoryHeraldEvent);
    window.addEventListener('open-tom-riddles-diary', handleOpenDiaryEvent);
    window.addEventListener('open-central-hub-registry', handleOpenHubEvent);

    return () => {
      window.removeEventListener('open-story-herald', handleOpenStoryHeraldEvent);
      window.removeEventListener('open-social-teaser', handleOpenStoryHeraldEvent);
      window.removeEventListener('open-tom-riddles-diary', handleOpenDiaryEvent);
      window.removeEventListener('open-central-hub-registry', handleOpenHubEvent);
    };
  }, []);

  useEffect(() => {
    initGlobalUiClickSound();
    const stored = getStoredUser();
    const token = getStoredToken();
    if (stored && token) setUser(stored);
    setAuthChecked(true);
  }, []);

  const handleMailmanRespondPickup = (accepted: boolean) => {
    if (!incomingPickupRequest || !user) return;
    const socket: Socket = io();
    socket.emit('mailman-respond-pickup', {
      requestId: incomingPickupRequest.requestId,
      senderId: incomingPickupRequest.senderId,
      mailmanId: user.id || user._id,
      mailmanName: user.name,
      letterId: incomingPickupRequest.letterId,
      accepted: accepted
    });
    setTimeout(() => socket.disconnect(), 200);
    setIncomingPickupRequest(null);
  };

  useEffect(() => {
    if (!user) return;
    const socket: Socket = io();
    setAppSocket(socket);

    // Fetch fellowship scribes for Tom Riddle's Diary
    getMyFriends()
      .then((friends) => {
        if (Array.isArray(friends)) setFellowScribesList(friends);
      })
      .catch(() => {});

    // Register user presence across the realm immediately upon login
    socket.emit('register-user', {
      userId: user.id || user._id,
      name: user.name,
      role: user.role
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          socket.emit('register-user', {
            userId: user.id || user._id,
            name: user.name,
            role: user.role,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      );
    }
    
    socket.on('letter-handover-animated', (data: HandoverData) => {
      const myId = (user.id || user._id)?.toString();
      if (!myId || data.senderId === myId || data.receiverId === myId || data.mailmanId === myId) {
        setHandoverPrompt(data);
        setPresentQrModal(null); // Auto-close QR modal when scanned
      }
    });

    // Proximity alert: ONLY for Scribes/Senders, and triggers ONLY ONCE per encounter
    socket.on('pickup-radius-alert', (alertData: PickupAlertData) => {
      if (user.role === 'mailman') return; // Mailmen NEVER receive proximity pings

      const mailmanKey = String(alertData.mailmanId);
      if (alertedMailmenRef.current.has(mailmanKey)) {
        return; // Deduplicate: ping happens strictly once per encounter
      }
      alertedMailmenRef.current.add(mailmanKey);

      console.log('Received single encounter pickup-radius-alert:', alertData);
      setActivePickupAlert(alertData);
    });

    // Feature: Mailman receives a live Pickup Handover Request from a Scribe
    socket.on('courier-received-pickup-request', (requestData: any) => {
      console.log('Mailman received courier-received-pickup-request:', requestData);
      if (user.role === 'mailman') {
        waxSealAudio.playCourierProximityChime();
        setIncomingPickupRequest(requestData);
      }
    });

    // Feature: Scribe receives Mailman's decision (Accepted or Declined)
    socket.on('scribe-pickup-response', (responseData: any) => {
      console.log('Scribe received scribe-pickup-response:', responseData);
      waxSealAudio.playCourierProximityChime();
    });

    // Feature: Central Hub requests Delivery Proof verification from recipient
    socket.on('delivery-proof-requested', (data: DeliveryProofRequestData) => {
      const myId = (user.id || user._id)?.toString();
      if (!data.receiverId || data.receiverId === myId || user.role === 'admin') {
        waxSealAudio.playCourierProximityChime();
        setDeliveryProofRequest(data);
      }
    });

    socket.on('delivery-proof-resolved', (data: any) => {
      console.log('Delivery proof resolved:', data);
      waxSealAudio.playWaxCrack();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  if (!authChecked) return null;
  if (!user) return (
    <>
      <CustomCursor />
      <AuthPage onAuth={(loggedInUser) => {
        // Feature: Admin Auto-Redirect
        if (loggedInUser.role === 'admin') {
          window.history.pushState({}, '', '/admin');
        }
        setUser(loggedInUser);
      }} />
    </>
  );

  return (
    <>
    <CustomCursor />
    <LetterTransferModal handover={handoverPrompt} onClose={() => setHandoverPrompt(null)} />
    <SocialTeaserModal
      isOpen={showStoryStudio || !!socialTeaserLetter}
      letter={socialTeaserLetter}
      onClose={() => {
        setSocialTeaserLetter(null);
        setShowStoryStudio(false);
      }}
      onUpdateScheduledTime={(newDate) => {
        if (socialTeaserLetter) {
          socialTeaserLetter.scheduledFor = newDate.toISOString();
        }
      }}
    />

    {/* Central Hub Delivery Proof Verification Modal */}
    <DeliveryProofModal
      isOpen={!!deliveryProofRequest}
      data={deliveryProofRequest}
      currentUser={user}
      onClose={() => setDeliveryProofRequest(null)}
      onSuccess={() => setDeliveryProofRequest(null)}
    />

    {/* Central Hub Proofs & Penalty Audit Registry Modal */}
    <CentralHubRegistryModal
      isOpen={showCentralHubRegistry}
      onClose={() => setShowCentralHubRegistry(false)}
    />

    {/* Tom Riddle's Ephemeral Synchronous Diary Modal */}
    <TomRiddlesDiaryModal
      isOpen={showTomRiddlesDiary}
      onClose={() => {
        setShowTomRiddlesDiary(false);
        setDiaryPartner(null);
      }}
      currentUser={user}
      socket={appSocket}
      initialPartner={diaryPartner}
      fellowScribes={fellowScribesList}
    />

    {/* Scribe Presentation QR Modal (Hold up for Mailman to scan physically) */}
    <AnimatePresence>
      {presentQrModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="max-w-sm w-full theatrical-card p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden border-2 border-amber-500 text-center" style={{
            background: 'linear-gradient(160deg, #1C1814 0%, #100E0C 100%)',
            boxShadow: '0 0 50px rgba(212, 175, 55, 0.45)'
          }}>
            <button onClick={() => setPresentQrModal(null)} className="absolute top-3 right-3 text-amber-300 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-400 block mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
              Present to Royal Mailman
            </span>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel Decorative', serif" }}>
              {presentQrModal.title}
            </h3>

            <div className="bg-white p-4 rounded-sm inline-block mx-auto shadow-inner border-4 border-amber-800/40 mb-4">
              <QRCodeCanvas value={presentQrModal.token} size={220} fgColor="#1A1A1A" />
            </div>

            <p className="text-xs italic text-amber-200/90 font-serif leading-relaxed">
              Hold up this seal for the Mailman to scan with their device. Custody will transfer once physically scanned!
            </p>

            <button onClick={() => setPresentQrModal(null)} className="btn-gold-saloon mt-5 w-full py-2.5 text-xs font-bold justify-center">
              Done / Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Mailman Interactive Pickup Request Modal */}
    <AnimatePresence>
      {incomingPickupRequest && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="max-w-md w-full theatrical-card p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden border-2 border-amber-500 text-center" style={{
            background: 'linear-gradient(160deg, #1C1814 0%, #100E0C 100%)',
            boxShadow: '0 0 40px rgba(245, 158, 11, 0.45)'
          }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-3.5 bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-3xl">🏇</span>
            </div>

            <span className="text-xs uppercase tracking-[0.2em] font-bold text-amber-400 block mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
              Royal Missive Handover Request
            </span>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel Decorative', serif" }}>
              Scribe {incomingPickupRequest.senderName}
            </h3>

            <div className="bg-white/[0.04] p-3.5 rounded-sm border border-amber-500/25 mb-4 text-left text-xs space-y-1.5 shadow-inner">
              <p className="flex items-center justify-between text-amber-200">
                <span className="font-semibold">Proximity:</span>
                <span className="font-bold text-emerald-400">{incomingPickupRequest.distanceMeters}m away</span>
              </p>
              <p className="flex items-center justify-between text-amber-200">
                <span className="font-semibold">Recipient:</span>
                <span className="font-bold text-white">{incomingPickupRequest.letterRecipient}</span>
              </p>
              <div className="pt-2 border-t border-amber-500/20 italic text-amber-100 font-serif">
                "{incomingPickupRequest.letterContentSnippet}"
              </div>
            </div>

            <p className="text-xs italic text-amber-300/90 mb-5 font-serif">
              "Noble Mailman, please accept custody of my sealed missive."
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleMailmanRespondPickup(false)}
                className="py-2.5 px-4 rounded-sm font-bold text-xs border border-red-500/50 bg-red-950/70 hover:bg-red-900 text-red-200 transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                ❌ Decline
              </button>
              <button
                onClick={() => handleMailmanRespondPickup(true)}
                className="btn-gold-saloon justify-center py-2.5 px-4 text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>✅ Agree to Meet</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>


    <PickupRadiusAlertToast 
      alert={activePickupAlert} 
      onDismiss={() => setActivePickupAlert(null)} 
      onNavigateToMap={() => {
        window.location.href = '/map';
      }}
      onViewLetters={() => {
        window.location.href = '/sent';
      }}
    />
    <Router>
      <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
        {/* ── Theatrical Aristocratic Navbar ── */}
        <nav className="relative z-30 flex flex-col md:flex-row justify-between items-center px-6 py-3.5 md:px-10" style={{
          background: 'linear-gradient(180deg, #161311 0%, #0D0C0B 100%)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 4px 25px rgba(0,0,0,0.6)'
        }}>
          <Link to="/" className="flex items-center space-x-3 mb-2 md:mb-0 hover:opacity-95 transition-opacity group">
            <img
              src={royalCrestGold}
              alt="PostMe Seal"
              className="w-9 h-9 rounded-full object-cover border border-[var(--antique-gold)] shadow-md transition-transform group-hover:scale-105 animate-float-gentle"
            />
            <div className="flex flex-col">
              <span style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--antique-gold)', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.08em', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                PostMe
              </span>
              <span className="text-xs uppercase tracking-[0.22em] font-semibold" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>
                Epistle Salon
              </span>
            </div>
          </Link>

          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5">
            {/* Admin vs Non-Admin Navigation Links */}
            {user.role === 'admin' ? (
              <>
                <Link to="/admin" className="nav-link-literary flex items-center gap-1.5 text-sm font-bold" style={{ color: '#EF9A9A' }}>
                  <Shield className="w-4 h-4" /> <span>Tribunal</span>
                </Link>
                <Link to="/leaderboard" className="nav-link-literary flex items-center gap-1.5 text-sm font-bold">
                  <Trophy className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} /> <span>Hall of Fame</span>
                </Link>
                <Link to="/notice-board" className="nav-link-literary flex items-center gap-1.5 text-sm font-bold">
                  <Megaphone className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} /> <span>Notice Board</span>
                </Link>
                <button
                  onClick={() => openCentralHubRegistry()}
                  className="nav-link-literary flex items-center gap-1.5 text-sm font-bold text-amber-300 hover:text-amber-100 cursor-pointer"
                  title="Central Hub Proofs & Penalties"
                >
                  <Shield className="w-4 h-4 text-[#D4AF37]" /> <span>Hub Proofs</span>
                </button>
                <button
                  onClick={() => openTomRiddlesDiary()}
                  className="nav-link-literary flex items-center gap-1.5 text-sm font-bold text-amber-200 hover:text-amber-100 cursor-pointer"
                  title="Tom Riddle's Ephemeral Synchronous Diary"
                >
                  <BookOpen className="w-4 h-4 text-[#D4AF37]" /> <span>Diary</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="nav-link-literary flex items-center gap-1.5 text-sm font-bold">
                  <User className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} /> <span>Thy Ledger</span>
                </Link>
                <Link to="/scanner" className="nav-link-literary flex items-center gap-1.5 text-sm font-bold">
                  <Scan className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} /> <span>Scan Seal</span>
                </Link>
                <Link to="/leaderboard" className="nav-link-literary flex items-center gap-1.5 text-sm font-bold">
                  <Trophy className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} /> <span>Hall of Fame</span>
                </Link>
                <Link to="/notice-board" className="nav-link-literary flex items-center gap-1.5 text-sm font-bold">
                  <Megaphone className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} /> <span>Notice Board</span>
                </Link>
                <button
                  onClick={() => openTomRiddlesDiary()}
                  className="nav-link-literary flex items-center gap-1.5 text-sm font-bold text-amber-300 hover:text-amber-100 cursor-pointer"
                  title="Tom Riddle's Ephemeral Synchronous Diary"
                >
                  <BookOpen className="w-4 h-4 text-[#D4AF37]" /> <span>Diary</span>
                </button>
                <button
                  onClick={() => openCentralHubRegistry()}
                  className="nav-link-literary flex items-center gap-1.5 text-sm font-bold text-[#EEDC82] hover:text-amber-100 cursor-pointer"
                  title="Central Postal Hub Delivery Proofs"
                >
                  <Shield className="w-4 h-4 text-[#D4AF37]" /> <span>Hub Proofs</span>
                </button>
                <button
                  onClick={() => openStoryHeraldStudio()}
                  className="nav-link-literary flex items-center gap-1.5 text-sm font-bold text-amber-300 hover:text-amber-100 cursor-pointer"
                  title="Proclaim 9:16 Royal Story Herald"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" /> <span>Story Herald</span>
                </button>
              </>
            )}

            <div className="flex items-center space-x-3 md:ml-3 md:pl-4" style={{ borderLeft: '1px solid rgba(212,175,55,0.25)' }}>
              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-sm" style={{ background: 'linear-gradient(135deg, #221D19 0%, #141210 100%)', border: '1px solid rgba(212,175,55,0.3)' }}>
                {user.role === 'admin' ? <Shield className="w-4 h-4" style={{ color: '#EF9A9A' }} /> : (user.role === 'mailman' ? <Crown className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} /> : <Feather className="w-4 h-4" style={{ color: 'var(--antique-gold)' }} />)}
                <span className="text-sm font-bold" style={{ color: 'var(--parchment)', fontFamily: "'Cinzel', serif" }}>{user.name}</span>
                <span className="text-xs italic" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>({user.role === 'mailman' ? 'Courier' : user.role === 'admin' ? 'Master' : 'Scribe'})</span>
              </div>
              <button onClick={() => { logout(); setUser(null); }} className="transition-colors p-1" style={{ color: 'var(--gold-muted)' }} title="Depart the Realm">
                <LogOut className="w-5 h-5 hover:text-red-400" />
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8 md:px-8">
          <Routes>
            <Route path="/admin" element={user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/" element={<UserProfile user={user} />} />
            <Route path="/compose" element={<ComposeLetter />} />
            <Route path="/mailbox" element={<MyMailbox />} />
            <Route path="/sent" element={<SentLetters />} />
            <Route path="/archive" element={<LetterArchive />} />
            <Route path="/trash" element={<GuildWastebin />} />
            <Route path="/map" element={<MapTracker />} />
            <Route path="/fellowship" element={<Fellowship user={user} />} />
            <Route path="/mailman" element={user.role === 'mailman' ? <MailmanDashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/directory" element={<MailmenDirectory />} />
            <Route path="/notice-board" element={<CommunityNoticeBoard user={user} />} />
            <Route path="/notices" element={<CommunityNoticeBoard user={user} />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="/gallery" element={<Gallery user={user} />} />
            <Route path="/dybbuk" element={<DybbukSeancePage user={user} />} />
            <Route path="/schrodinger" element={<SchrodingerVaultPage user={user} />} />
            <Route path="/bottle" element={<BottleOceanPage user={user} />} />
            <Route path="/dead-letters" element={<DeadLetterOfficePage />} />
            <Route path="/dead-letter-office" element={<DeadLetterOfficePage />} />
          </Routes>
        </main>
      </div>
    </Router>
    </>
  );
}

// ============================================
// USER PROFILE (Landing Page / Aristocratic Salon Hub)
// ============================================
function UserProfile({ user }: { user: any }) {
  const [liveUser, setLiveUser] = useState<any>(user);
  const [showNoteModal, setShowNoteModal] = useState(false);

  useEffect(() => {
    getUserProfile(user.id || user._id).then(setLiveUser).catch(() => {});
  }, []);

  const isBanned = liveUser?.restrictedUntil && new Date(liveUser.restrictedUntil) > new Date();

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="space-y-10">
      
      {/* ── DRAMATIC THEATRICAL HERO SALON BANNER ── */}
      <div className="relative overflow-hidden rounded-sm text-left p-6 md:p-12 shadow-2xl" style={{
        backgroundImage: `linear-gradient(to right, rgba(14, 13, 12, 0.94) 0%, rgba(14, 13, 12, 0.82) 55%, rgba(14, 13, 12, 0.65) 100%), url(${manuscriptQuillDesk})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.8)'
      }}>
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        {/* Feature: Ban UI Banner */}
        {isBanned && (
          <div className="mb-6 p-4 rounded-sm flex flex-col items-center animate-pulse" style={{ background: 'rgba(107,29,42,0.4)', border: '1px solid rgba(212,175,55,0.4)' }}>
            <span className="font-bold text-base tracking-widest uppercase flex items-center gap-2" style={{ color: '#EF9A9A', fontFamily: "'Cinzel', serif" }}>
              <Flame className="w-5 h-5 text-orange-400" />
              Sovereign Guild Sanction Imposed
              <Flame className="w-5 h-5 text-orange-400" />
            </span>
            <span className="mt-2 text-base italic text-center" style={{ color: 'var(--parchment-light)' }}>
              Thou art forbidden from dispatching epistles until:
              <strong className="block mt-1 px-3 py-1 rounded-sm text-lg" style={{ background: 'rgba(67,14,23,0.7)', color: '#FFF' }}>
                {new Date(liveUser.restrictedUntil).toLocaleString()}
              </strong>
            </span>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Welcome & Editorial Call to Action */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm uppercase tracking-[0.2em] font-bold animate-float-gentle" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              <span>❧ The Sovereign Order of PostMe ❧</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
              Welcome, <span style={{ color: 'var(--antique-gold)' }}>{user.name}</span>
            </h1>

            <p className="italic text-xl md:text-2xl max-w-xl leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--parchment-dark)', fontStyle: 'italic' }}>
              “All the realm is a stage, and every missive a silent soliloquy. Inscribe thy thoughts with immortal ink.”
            </p>

            {/* Quick Action Button Bar with subtle motion */}
            <div className="pt-3 flex flex-wrap gap-3.5 items-center">
              {isBanned ? (
                <div className="btn-gold-saloon opacity-50 cursor-not-allowed text-sm">
                  <Lock className="w-4 h-4" /> <span>Sanctioned — Quill Locked</span>
                </div>
              ) : (
                <Link to="/compose" className="btn-velvet-burgundy text-sm sm:text-base py-2.5 px-5 animate-glow-pulse">
                  <PenTool className="w-4 h-4" /> <span>✦ Inscribe Epistle</span>
                </Link>
              )}

              <Link to="/mailbox" className="btn-gold-saloon text-sm sm:text-base py-2.5 px-5">
                <Inbox className="w-4 h-4" /> <span>Mailbox</span>
              </Link>

              <Link to="/sent?tab=drafts" className="btn-gold-saloon text-sm sm:text-base py-2.5 px-4 flex items-center gap-1.5" title="Access thy preserved drafts in Scriptorium">
                <Scroll className="w-4 h-4 text-amber-400" /> <span>📜 Drafts</span>
              </Link>

              <button
                onClick={() => openStoryHeraldStudio()}
                className="btn-gold-saloon text-sm sm:text-base py-2.5 px-4 flex items-center gap-1.5 cursor-pointer"
                title="Proclaim 9:16 Royal Story Herald"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> <span>Story Herald</span>
              </button>
            </div>

            {/* ── Cartographic Note Status Proclamation Banner ── */}
            <div className="mt-4 p-4 rounded-sm relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(32, 26, 20, 0.95) 0%, rgba(18, 15, 12, 0.98) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.5)'
            }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>Interactive Cartographic Status</span>
                    </span>

                    {liveUser?.noteStatus && !liveUser?.isNoteExpired && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{
                        background: liveUser.noteStatusPrivacy === 'private' ? 'rgba(239, 68, 68, 0.2)' : liveUser.noteStatusPrivacy === 'friends' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: liveUser.noteStatusPrivacy === 'private' ? '#FCA5A5' : liveUser.noteStatusPrivacy === 'friends' ? '#D8B4FE' : '#6EE7B7',
                        border: `1px solid ${liveUser.noteStatusPrivacy === 'private' ? 'rgba(239,68,68,0.4)' : liveUser.noteStatusPrivacy === 'friends' ? 'rgba(168,85,247,0.4)' : 'rgba(16,185,129,0.4)'}`
                      }}>
                        {liveUser.noteStatusPrivacy === 'private' ? '🔒 Private' : liveUser.noteStatusPrivacy === 'friends' ? '🤝 Fellowship Only' : '🌐 Public Realm'}
                      </span>
                    )}

                    {liveUser?.noteStatus && (
                      <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {liveUser?.isNoteExpired ? (
                          <span className="text-red-400 font-bold">⚠️ Expired (1-day limit)</span>
                        ) : (
                          <span>⏳ 1-Day Lifespan</span>
                        )}
                      </span>
                    )}
                  </div>

                  {liveUser?.noteStatus && !liveUser?.isNoteExpired ? (
                    <div className="flex items-center gap-2.5 pt-1">
                      <span className="text-2xl animate-float-gentle flex-shrink-0">
                        {NOTE_STATUS_MOODS[liveUser?.noteStatusMood || 'quill']?.icon || '🪶'}
                      </span>
                      <p className="text-base sm:text-lg italic font-serif" style={{ color: 'var(--parchment-light)', fontFamily: "'Cormorant Garamond', serif" }}>
                        “{liveUser.noteStatus}”
                      </p>
                    </div>
                  ) : liveUser?.noteStatus && liveUser?.isNoteExpired ? (
                    <p className="text-xs italic text-amber-300/80 pt-1 font-serif">
                      ⚠️ Thy previous note status hath completed its 24-hour cycle. Proclaim a fresh status upon the realm!
                    </p>
                  ) : (
                    <p className="text-xs italic text-stone-400 pt-1 font-serif">
                      ❧ No active status inscribed. Inscribe a note status to be exhibited upon the map, leaderboard, and profile for 1 day.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setShowNoteModal(true)}
                  className="btn-gold-saloon text-xs py-2 px-4 whitespace-nowrap flex items-center gap-1.5 self-end sm:self-center"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{liveUser?.noteStatus && !liveUser?.isNoteExpired ? 'Update Status' : 'Inscribe Status'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Sovereign Playbill Ledger */}
          <div className="lg:col-span-5">
            <div className="theatrical-card p-5 sm:p-6 relative animate-float-gentle-alt" style={{ background: 'linear-gradient(145deg, rgba(28,24,20,0.95) 0%, rgba(14,13,12,0.95) 100%)', border: '1px solid rgba(212,175,55,0.35)' }}>
              <div className="flex items-center justify-between pb-3 mb-3.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5" style={{ color: 'var(--antique-gold)' }} />
                  <span className="small-caps text-sm font-bold" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
                    {user.role === 'mailman' ? "Courier's Royal Registry" : "Scribe's Sovereign Ledger"}
                  </span>
                </div>
                <span className="text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-sm font-bold" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--parchment-dark)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  {user.role === 'mailman' ? 'Royal Courier' : 'Noble Scribe'}
                </span>
              </div>

              {user.role === 'mailman' ? (
                (() => {
                  const mailmanXP = liveUser?.xp ?? 0;
                  const { currentRank, ranks, earnedCount } = getRankFromXP(mailmanXP);
                  const nextRank = ranks.find(r => r.req > mailmanXP) || currentRank;
                  const xpProgress = nextRank.req > currentRank.req ? Math.min(100, Math.round(((mailmanXP - currentRank.req) / (nextRank.req - currentRank.req)) * 100)) : 100;

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Mailman Rank & Badge */}
                        <div className="p-3 rounded-sm" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
                          <span className="text-[10px] uppercase tracking-wider block font-bold" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>
                            Mailman Rank & Badge
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl animate-float-gentle">{currentRank.icon}</span>
                            <div>
                              <span className="text-base sm:text-lg font-bold block" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                                {currentRank.name}
                              </span>
                              <span className="text-[10px] font-mono text-amber-300">
                                🏅 {earnedCount}/{ranks.length} Badges
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Deliveries Completed */}
                        <div className="p-3 rounded-sm" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
                          <span className="text-[10px] uppercase tracking-wider block font-bold" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>
                            Deliveries Fulfilled
                          </span>
                          <span className="text-2xl sm:text-3xl font-extrabold block mt-0.5" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                            {liveUser?.deliveriesCompleted ?? 0}
                          </span>
                          <span className="text-[10px] italic" style={{ color: 'var(--gold-muted)' }}>
                            Royal quests completed
                          </span>
                        </div>
                      </div>

                      {/* XP Progress Bar to Next Rank */}
                      <div className="p-2.5 rounded-sm" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.2)' }}>
                        <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                          <span className="text-amber-300 font-bold">⚡ XP: {mailmanXP}</span>
                          <span className="text-amber-400/90 font-semibold">
                            {nextRank.req > mailmanXP ? `${nextRank.req - mailmanXP} XP to ${nextRank.name}` : 'Max Rank Legend ✨'}
                          </span>
                        </div>
                        <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden border border-amber-900/50">
                          <div 
                            className="h-2 transition-all duration-500 rounded-full" 
                            style={{ 
                              width: `${xpProgress}%`,
                              background: 'linear-gradient(90deg, #D4AF37 0%, #F59E0B 50%, #FBBF24 100%)' 
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-sm" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
                    <span className="text-xs uppercase tracking-wider block mb-1 font-bold" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>
                      Reputation Score
                    </span>
                    <span className="text-2xl md:text-3xl font-extrabold block" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                      {liveUser?.reputationScore ?? 0}
                    </span>
                    <span className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                      Honour Points
                    </span>
                  </div>

                  <div className="p-4 rounded-sm" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
                    <span className="text-xs uppercase tracking-wider block mb-1 font-bold" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>
                      Epistles Penned
                    </span>
                    <span className="text-2xl md:text-3xl font-extrabold block" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                      {liveUser?.lettersSent ?? 0}
                    </span>
                    <span className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                      Dispatched to realm
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 flex justify-between items-center text-sm" style={{ borderTop: '1px dashed rgba(212,175,55,0.2)' }}>
                <span className="italic" style={{ color: 'var(--parchment-dark)' }}>“Verba volant, scripta manent.”</span>
                <Link to={user.role === 'mailman' ? "/mailman" : "/directory"} className="underline hover:text-white font-bold text-xs sm:text-sm" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
                  {user.role === 'mailman' ? "Mailman Ledger →" : "Inspect Roster →"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Gold Rule */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />
      </div>

      {/* ── ASYMMETRICAL SALON CHAMBERS & GUILD BUREAU ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <h2 className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: "'Cinzel', serif", color: 'var(--charcoal)' }}>
            <span>📜</span> The Guild Chambers & Post Desks
          </h2>
          <span className="text-xs uppercase tracking-widest hidden sm:inline" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>
            Select a Salon Chamber
          </span>
        </div>

        {/* ── ROW 1: SCRIPTORIUM & SOVEREIGN MAILBOX (2 Featured Heavy Chambers) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Compose Epistle Large Card with background art overlay */}
          {isBanned ? (
            <div className="theatrical-card p-6 md:p-8 opacity-50 cursor-not-allowed">
              <AlertTriangle className="w-8 h-8 mb-3 text-red-400" />
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--parchment)' }}>Compose Chamber Locked</h3>
              <p className="text-xs italic" style={{ color: 'var(--warm-gray-light)' }}>Thou must await the conclusion of thy guild sanction before inscribing missives.</p>
            </div>
          ) : (
            <Link to="/compose" className="theatrical-card p-6 md:p-8 no-underline group block relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-xl" style={{
              backgroundImage: `linear-gradient(135deg, rgba(24, 21, 18, 0.92) 0%, rgba(14, 13, 12, 0.85) 100%), url(${antiqueScrollsPile})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(212, 175, 55, 0.4)'
            }}>
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-2 max-w-md">
                  <span className="wax-seal-badge text-xs animate-float-gentle">
                    <span>✍️</span> <span>Sovereign Scriptorium</span>
                  </span>
                  <h3 className="text-2xl font-bold mt-2 transition-colors group-hover:text-white" style={{ fontFamily: "'Cinzel', serif", color: 'var(--antique-gold)' }}>
                    Compose Thy Epistle
                  </h3>
                  <p className="text-sm italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--parchment-dark)' }}>
                    Select calligraphic scripts, apply custom wax seals, choose exquisite postage stamps, and send thy missive across the realm via royal couriers.
                  </p>
                </div>
                <PenTool className="w-10 h-10 transition-transform group-hover:scale-110 group-hover:rotate-6 flex-shrink-0 animate-float-slow" style={{ color: 'var(--antique-gold)' }} />
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between text-xs relative z-10" style={{ borderTop: '1px solid rgba(212,175,55,0.25)' }}>
                <span className="small-caps" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>19 Ancient Scripts & Wax Seals</span>
                <span className="font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--antique-gold)' }}>Inscribe Now →</span>
              </div>
            </Link>
          )}

          {/* Thy Sovereign Mailbox Card with Custom Chamber Background */}
          <Link to="/mailbox" className="theatrical-card p-6 md:p-8 no-underline group block relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-xl" style={{
            backgroundImage: `linear-gradient(135deg, rgba(24, 21, 18, 0.90) 0%, rgba(14, 13, 12, 0.82) 100%), url(${mailboxChamberBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212, 175, 55, 0.4)'
          }}>
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-2 max-w-md">
                <span className="wax-seal-badge text-xs animate-float-gentle" style={{ background: 'rgba(107,29,42,0.6)', border: '1px solid rgba(212,175,55,0.4)' }}>
                  <span>📬</span> <span>Royal Letter Registry</span>
                </span>
                <h3 className="text-2xl font-bold mt-2 transition-colors group-hover:text-white" style={{ fontFamily: "'Cinzel', serif", color: 'var(--antique-gold)' }}>
                  Thy Sovereign Mailbox
                </h3>
                <p className="text-sm italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--parchment-dark)' }}>
                  Unseal incoming missives with authentic wax fractures, reveal sender seals, summon spectral Dybbuk letters, and preserve cherished epistles.
                </p>
              </div>
              <Inbox className="w-10 h-10 transition-transform group-hover:scale-110 flex-shrink-0 animate-float-slow" style={{ color: 'var(--antique-gold)' }} />
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs relative z-10" style={{ borderTop: '1px solid rgba(212,175,55,0.25)' }}>
              <span className="small-caps" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>Incoming Scrolls & Letters</span>
              <span className="font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--antique-gold)' }}>Open Mailbox →</span>
            </div>
          </Link>
        </div>

        {/* ── ROW 2: THE GRAND ARCHIVE (EXPANDED PROMINENT HERO CHAMBER) & DISPATCHED MISSIVES ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* The Grand Archive (Expanded Hero Card) */}
          <Link to="/archive" className="md:col-span-8 theatrical-card p-6 md:p-8 no-underline group block relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-2xl" style={{
            backgroundImage: `linear-gradient(135deg, rgba(22, 19, 16, 0.88) 0%, rgba(12, 11, 10, 0.80) 100%), url(${grandArchiveLibraryBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212, 175, 55, 0.45)'
          }}>
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="wax-seal-badge text-xs animate-float-gentle">
                    <span>🏛️</span> <span>Imperial Tome Registry</span>
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold uppercase tracking-wider">
                    ✦ Permanent Repository
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mt-2 transition-colors group-hover:text-white" style={{ fontFamily: "'Cinzel', serif", color: 'var(--antique-gold)' }}>
                  The Grand Archive
                </h3>
                <p className="text-sm sm:text-base italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--parchment-dark)' }}>
                  A majestic sanctuary of preserved correspondence, illuminated scrolls, sealed missives, and historical kingdom letters safeguarded eternally against time and decay.
                </p>
              </div>
              <div className="p-3.5 rounded-sm bg-amber-950/70 border border-amber-500/50 shadow-lg animate-float-gentle hidden sm:flex flex-shrink-0">
                <BookOpen className="w-9 h-9 text-amber-300" />
              </div>
            </div>
            <div className="mt-5 pt-3 flex items-center justify-between text-xs relative z-10" style={{ borderTop: '1px solid rgba(212,175,55,0.25)' }}>
              <span className="small-caps text-amber-200/90 font-serif">Searchable Historical Scrolls & Inscribed Epistles</span>
              <span className="font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform text-amber-300">Enter Grand Archive →</span>
            </div>
          </Link>

          {/* Dispatched Missives Card */}
          <Link to="/sent" className="md:col-span-4 theatrical-card p-6 no-underline group flex flex-col justify-between relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-xl" style={{
            backgroundImage: `linear-gradient(135deg, rgba(24, 21, 18, 0.94) 0%, rgba(14, 13, 12, 0.88) 100%), url(${antiqueScrollsPile})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212, 175, 55, 0.35)'
          }}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-sm animate-float-gentle" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <Send className="w-6 h-6 text-amber-300" />
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-amber-900/40 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  Live Status
                </span>
              </div>
              <h3 className="text-xl font-bold transition-colors group-hover:text-white" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                Dispatched Missives
              </h3>
              <p className="text-xs italic mt-1.5 leading-relaxed" style={{ color: 'var(--parchment-dark)' }}>
                Track dispatched missives across the 4-stage royal journey, access scriptorium drafts, and attempt postmaster riddle unsends.
              </p>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
              <span className="small-caps" style={{ color: 'var(--gold-muted)' }}>Royal Saddlebags</span>
              <span className="font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--antique-gold)' }}>Track Letters →</span>
            </div>
          </Link>
        </div>

        {/* ── SECONDARY SALON CHAMBER ROW (4 Illustrated Scenic Cards) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Realm Map & GPS with Custom Cartography Background */}
          <Link to="/map" className="theatrical-card p-5 md:p-6 no-underline group flex flex-col justify-between relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-lg" style={{
            backgroundImage: `linear-gradient(135deg, rgba(24, 21, 18, 0.88) 0%, rgba(14, 13, 12, 0.80) 100%), url(${realmMapCartographyBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212, 175, 55, 0.35)'
          }}>
            <div className="relative z-10">
              <Compass className="w-7 h-7 mb-3 transition-transform group-hover:rotate-45" style={{ color: 'var(--antique-gold)' }} />
              <h3 className="text-base font-bold transition-colors group-hover:text-white small-caps" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                Realm Map & GPS
              </h3>
              <p className="text-xs italic mt-1 leading-relaxed" style={{ color: 'var(--parchment-dark)' }}>Live courier routes & travellers.</p>
            </div>
            <div className="mt-3 pt-2 text-[11px] font-bold text-amber-300/80 relative z-10 border-t border-amber-900/30 flex items-center justify-between">
              <span>Open Map</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Fellowship Scribes with Custom Scribes Background */}
          <Link to="/fellowship" className="theatrical-card p-5 md:p-6 no-underline group flex flex-col justify-between relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-lg" style={{
            backgroundImage: `linear-gradient(135deg, rgba(24, 21, 18, 0.88) 0%, rgba(14, 13, 12, 0.80) 100%), url(${fellowshipScribesBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212, 175, 55, 0.35)'
          }}>
            <div className="relative z-10">
              <Users className="w-7 h-7 mb-3 transition-transform group-hover:scale-110" style={{ color: 'var(--antique-gold)' }} />
              <h3 className="text-base font-bold transition-colors group-hover:text-white small-caps" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                Fellowship Scribes
              </h3>
              <p className="text-xs italic mt-1 leading-relaxed" style={{ color: 'var(--parchment-dark)' }}>Guild friendships & scholars.</p>
            </div>
            <div className="mt-3 pt-2 text-[11px] font-bold text-amber-300/80 relative z-10 border-t border-amber-900/30 flex items-center justify-between">
              <span>View Scribes</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Royal Philately Gallery with Custom Stamps Background */}
          <Link to="/gallery" className="theatrical-card p-5 md:p-6 no-underline group flex flex-col justify-between relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-lg" style={{
            backgroundImage: `linear-gradient(135deg, rgba(24, 21, 18, 0.88) 0%, rgba(14, 13, 12, 0.80) 100%), url(${philatelyStampsBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212, 175, 55, 0.35)'
          }}>
            <div className="relative z-10">
              <Star className="w-7 h-7 mb-3 transition-transform group-hover:scale-110" style={{ color: 'var(--antique-gold)' }} />
              <h3 className="text-base font-bold transition-colors group-hover:text-white small-caps" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                Philately & Seals
              </h3>
              <p className="text-xs italic mt-1 leading-relaxed" style={{ color: 'var(--parchment-dark)' }}>Royal stamps & wax insignias.</p>
            </div>
            <div className="mt-3 pt-2 text-[11px] font-bold text-amber-300/80 relative z-10 border-t border-amber-900/30 flex items-center justify-between">
              <span>Inspect Seals</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Courier Directory with Custom Dispatch Ledger Background */}
          <Link to="/directory" className="theatrical-card p-5 md:p-6 no-underline group flex flex-col justify-between relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-lg" style={{
            backgroundImage: `linear-gradient(135deg, rgba(24, 21, 18, 0.88) 0%, rgba(14, 13, 12, 0.80) 100%), url(${courierDirectoryRosterBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212, 175, 55, 0.35)'
          }}>
            <div className="relative z-10">
              <Scroll className="w-7 h-7 mb-3 transition-transform group-hover:scale-110" style={{ color: 'var(--antique-gold)' }} />
              <h3 className="text-base font-bold transition-colors group-hover:text-white small-caps" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                The Mailman's Registry
              </h3>
              <p className="text-xs italic mt-1 leading-relaxed" style={{ color: 'var(--parchment-dark)' }}>Courier records & imperial roster.</p>
            </div>
            <div className="mt-3 pt-2 text-[11px] font-bold text-amber-300/80 relative z-10 border-t border-amber-900/30 flex items-center justify-between">
              <span>View Registry</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>

        {/* Courier Specific Section (If Mailman) with Custom Gate Background */}
        {user.role === 'mailman' && (
          <Link to="/mailman" className="theatrical-card p-6 md:p-8 no-underline group block animate-glow-pulse relative overflow-hidden rounded-sm shadow-2xl hover:-translate-y-2 transition-all" style={{
            backgroundImage: `linear-gradient(135deg, rgba(22, 18, 14, 0.88) 0%, rgba(10, 8, 6, 0.82) 100%), url(${courierDispatchTerminalBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212, 175, 55, 0.5)'
          }}>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-full animate-float-slow" style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid var(--antique-gold)' }}>
                  <Crown className="w-8 h-8" style={{ color: 'var(--antique-gold)' }} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold transition-colors group-hover:text-white" style={{ fontFamily: "'Cinzel', serif", color: 'var(--antique-gold)' }}>
                    Courier Dispatch & Delivery Terminal
                  </h3>
                  <p className="text-xs sm:text-sm italic mt-1 max-w-2xl leading-relaxed" style={{ color: 'var(--parchment-dark)' }}>
                    View pending parcel quests, claim deliveries across the realm, and confirm drop-offs via QR Wax Seal scan.
                  </p>
                </div>
              </div>
              <button className="btn-velvet-burgundy text-xs py-2.5 px-5 shadow-lg hidden sm:block">Enter Terminal →</button>
            </div>
          </Link>
        )}

        {/* ── THE COMMUNITY NOTICE BOARD (Public Decrees, News & Admin Announcements) ── */}
        <Link to="/notice-board" className="theatrical-card p-6 md:p-8 no-underline group block relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-2xl" style={{
          backgroundImage: `linear-gradient(135deg, rgba(24, 20, 15, 0.90) 0%, rgba(12, 10, 8, 0.95) 100%), url(${grandArchiveLibraryBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(212, 175, 55, 0.5)'
        }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="wax-seal-badge text-xs" style={{ background: 'rgba(180,83,9,0.7)', border: '1px solid rgba(212,175,55,0.4)', color: '#FEF3C7' }}>
                  <span>📢</span> <span>Imperial Gazette & Herald</span>
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live Realm Feed
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold transition-colors group-hover:text-white" style={{ fontFamily: "'Cinzel', serif", color: 'var(--antique-gold)' }}>
                Community Notice Board
              </h3>
              <p className="text-sm italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--parchment-dark)' }}>
                Stay informed with official proclamations, realm maintenance, feature announcements, and festival quests posted by the Postmasters.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="p-3.5 rounded-sm bg-amber-950/80 border border-amber-500/40 shadow-lg animate-float-gentle hidden sm:flex">
                <Megaphone className="w-8 h-8 text-amber-300" />
              </div>
              <span className="btn-velvet-burgundy text-xs py-2.5 px-5 font-bold shadow-lg">
                View Notice Board →
              </span>
            </div>
          </div>
        </Link>

        {/* ── THE DEAD LETTER OFFICE (Public Repository of Forsaken & Undelivered Epistles) ── */}
        <Link to="/dead-letters" className="theatrical-card p-6 md:p-8 no-underline group block relative overflow-hidden rounded-sm hover:-translate-y-2 transition-all shadow-2xl" style={{
          backgroundImage: `linear-gradient(135deg, rgba(20, 16, 13, 0.90) 0%, rgba(10, 8, 7, 0.95) 100%), url(${deadLetterOfficeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(212, 175, 55, 0.4)'
        }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="wax-seal-badge text-xs" style={{ background: 'rgba(120,53,15,0.7)', border: '1px solid rgba(212,175,55,0.4)', color: '#FEF3C7' }}>
                  <span>🏛️</span> <span>Public Realm Archive</span>
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                  Open Chronicle
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold transition-colors group-hover:text-white" style={{ fontFamily: "'Cinzel', serif", color: 'var(--antique-gold)' }}>
                The Dead Letter Office
              </h3>
              <p className="text-sm italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--parchment-dark)' }}>
                Explore ignored, undelivered, and abandoned letters released into the public archive. Unroll lost manuscripts and forgotten words from across the realm.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="p-3.5 rounded-sm bg-amber-950/80 border border-amber-500/40 shadow-lg animate-float-gentle hidden sm:flex">
                <Archive className="w-8 h-8 text-amber-300" />
              </div>
              <span className="btn-gold-saloon text-xs py-2.5 px-5 font-bold shadow-lg">
                Inspect Dead Letters →
              </span>
            </div>
          </div>
        </Link>

        {/* Bottom Auxiliary Links */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-900/30">
          <Link to="/dead-letters" className="inline-flex items-center gap-2 text-xs text-amber-300/80 hover:text-amber-200 transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
            <Archive className="w-3.5 h-3.5 text-amber-400" /> <span>The Dead Letter Office Archive</span>
          </Link>

          <Link to="/trash" className="inline-flex items-center gap-2 text-xs opacity-75 hover:opacity-100 transition-opacity" style={{ color: 'var(--warm-gray)', fontFamily: "'Cinzel', serif" }}>
            <Trash2 className="w-3.5 h-3.5" /> <span>Inspect Wastebin & Ash Pit</span>
          </Link>
        </div>
      </div>

      {/* Feature: Letter Pickup Radius Alerts Preferences & Vicinity Controls */}
      <PickupAlertSettingsCard userId={user.id || user._id} />

      {/* Feature: Live Active Realm Travellers directly in Profile */}
      <ProfileActiveTravellers currentUser={user} />

      {/* Feature: Mailman Active Deliveries Panel embedded in Profile */}
      {user.role === 'mailman' && <MailmanProfileDeliveries user={user} />}

      {/* ── Feature: Interactive Cartographic Note Status Modal ── */}
      <CartographicNoteStatusModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        currentStatus={liveUser?.noteStatus || ''}
        currentPrivacy={liveUser?.noteStatusPrivacy || 'public'}
        currentMood={liveUser?.noteStatusMood || 'quill'}
        expiresAt={liveUser?.noteStatusExpiresAt}
        onStatusUpdated={(updatedData) => {
          setLiveUser((prev: any) => ({
            ...prev,
            noteStatus: updatedData.noteStatus,
            noteStatusPrivacy: updatedData.noteStatusPrivacy,
            noteStatusCreatedAt: updatedData.noteStatusCreatedAt,
            noteStatusExpiresAt: updatedData.noteStatusExpiresAt,
            noteStatusMood: updatedData.noteStatusMood,
            isNoteExpired: false
          }));
        }}
      />
    </motion.div>
  );
}

// ============================================
// PROFILE ACTIVE TRAVELLERS (Real-Time Radar Widget)
// ============================================
function ProfileActiveTravellers({ currentUser }: { currentUser: any }) {
  const [activeTravellers, setActiveTravellers] = useState<any[]>([]);

  useEffect(() => {
    const myId = currentUser?.id || currentUser?._id;
    getActiveMapUsers(undefined, undefined, undefined, myId).then(users => {
      if (Array.isArray(users)) setActiveTravellers(users);
    }).catch(() => {});

    const socket: Socket = io();

    socket.on('map-users-sync', (users: any[]) => {
      if (Array.isArray(users)) setActiveTravellers(users);
    });

    socket.on('user-joined-map', (newUser: any) => {
      if (newUser && (newUser.userId || newUser._id)) {
        const newId = String(newUser.userId || newUser._id);
        setActiveTravellers(prev => [
          ...prev.filter(u => String(u.userId || u._id || u.id) !== newId),
          newUser
        ]);
      }
    });

    socket.on('user-moved', (movedData: any) => {
      if (movedData && movedData.userId) {
        const movedId = String(movedData.userId);
        setActiveTravellers(prev => prev.map(u => {
          if (String(u.userId || u._id || u.id) === movedId) {
            return { ...u, lat: movedData.lat, lng: movedData.lng, location: movedData.location };
          }
          return u;
        }));
      }
    });

    socket.on('user-note-updated', (noteData: any) => {
      if (noteData && noteData.userId) {
        const targetId = String(noteData.userId);
        setActiveTravellers(prev => prev.map(u => {
          if (String(u.userId || u._id || u.id) === targetId) {
            return {
              ...u,
              noteStatus: noteData.noteStatus,
              noteStatusPrivacy: noteData.noteStatusPrivacy,
              noteStatusExpiresAt: noteData.noteStatusExpiresAt,
              noteStatusMood: noteData.noteStatusMood
            };
          }
          return u;
        }));
      }
    });

    socket.on('user-left-map', ({ userId }: { userId: string }) => {
      if (userId) {
        const leftId = String(userId);
        setActiveTravellers(prev => prev.filter(u => String(u.userId || u._id || u.id) !== leftId));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  const otherActive = activeTravellers.filter(u => {
    const uid = String(u.userId || u._id || u.id);
    const myId = String(currentUser?.id || currentUser?._id);
    return uid !== myId;
  });

  const mailmen = otherActive.filter(u => u.role === 'mailman');
  const senders = otherActive.filter(u => u.role !== 'mailman');

  return (
    <div className="theatrical-card p-6 rounded-sm shadow-xl" style={{
      background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
      border: '1px solid rgba(212, 175, 55, 0.35)'
    }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-amber-900/40 pb-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
            <Compass className="w-6 h-6 text-amber-400" /> Active Guild Travellers on Radar
          </h3>
          <p className="text-xs italic text-amber-200/70 font-serif">
            Members currently sharing their live journey and cartographic note statuses upon the realm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {otherActive.length} Active Now
          </span>
          <Link to="/map" className="btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Open Realm Map
          </Link>
        </div>
      </div>

      {otherActive.length === 0 ? (
        <div className="p-8 text-center rounded-sm bg-stone-900/40 border border-dashed border-stone-800 text-stone-400 italic font-serif">
          <p className="font-semibold text-sm">No other travellers are currently sharing location on the map.</p>
          <p className="text-xs mt-1 text-stone-500">When fellow mailmen or senders open the Realm Map, their live location and note statuses appear here instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Mailmen */}
          <div className="p-4 rounded-sm bg-stone-900/70 border border-amber-900/30">
            <p className="font-bold text-xs uppercase tracking-wider mb-3 flex items-center justify-between font-mono text-amber-300">
              <span className="flex items-center gap-1.5"><Crown className="w-4 h-4 text-amber-400" /> Royal Mailmen ({mailmen.length})</span>
            </p>
            {mailmen.length === 0 ? (
              <p className="text-xs italic text-stone-500 font-serif">No couriers currently active on radar.</p>
            ) : (
              <div className="space-y-2">
                {mailmen.map(m => (
                  <div key={m.userId || m._id || m.id} className="p-3 rounded-sm bg-stone-950/80 border border-stone-800 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-stone-200" style={{ fontFamily: "'Cinzel', serif" }}>{m.name}</p>
                        <p className="text-[11px] text-amber-300/80 font-mono">Rank: {m.rank || 'Novice'} • {m.xp || 0} XP</p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow" title="Online"></span>
                    </div>
                    {m.noteStatus && (
                      <div className="flex items-center gap-1.5 text-xs italic font-serif p-1.5 rounded-sm bg-amber-950/40 border border-amber-500/20 text-amber-100">
                        <span className="text-sm">{NOTE_STATUS_MOODS[m.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                        <span className="truncate">"{m.noteStatus}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Senders */}
          <div className="p-4 rounded-sm bg-stone-900/70 border border-amber-900/30">
            <p className="font-bold text-xs uppercase tracking-wider mb-3 flex items-center justify-between font-mono text-amber-300">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-400" /> Senders & Scholars ({senders.length})</span>
            </p>
            {senders.length === 0 ? (
              <p className="text-xs italic text-stone-500 font-serif">No senders currently active on radar.</p>
            ) : (
              <div className="space-y-2">
                {senders.map(s => (
                  <div key={s.userId || s._id || s.id} className="p-3 rounded-sm bg-stone-950/80 border border-stone-800 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-stone-200" style={{ fontFamily: "'Cinzel', serif" }}>{s.name}</p>
                        <p className="text-[11px] text-amber-300/80 font-mono">Reputation: {s.reputationScore || 0}</p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow" title="Online"></span>
                    </div>
                    {s.noteStatus && (
                      <div className="flex items-center gap-1.5 text-xs italic font-serif p-1.5 rounded-sm bg-amber-950/40 border border-amber-500/20 text-amber-100">
                        <span className="text-sm">{NOTE_STATUS_MOODS[s.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                        <span className="truncate">"{s.noteStatus}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Mailman Active Deliveries quick panel for Profile
function MailmanProfileDeliveries({ user }: { user: any }) {
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQR, setSelectedQR] = useState<{ token: string, receiverName: string } | null>(null);

  const fetchQuests = async () => {
    try {
      const data = await getActiveQuests();
      setQuests(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleSeizeMissive = async (token: string) => {
    try {
      const res = await scanLetter(token);
      alert(res.message || 'Missive seized successfully!');
      fetchQuests();
    } catch (e: any) {
      alert(e.message || 'Error seizing missive');
    }
  };

  return (
    <div className="theatrical-card p-6 sm:p-8 relative overflow-hidden rounded-sm" style={{
      background: `linear-gradient(180deg, rgba(20,16,12,0.85) 0%, rgba(10,8,6,0.96) 100%), url(${courierDispatchTerminalBg}) center/cover no-repeat`,
      border: '1px solid rgba(212, 175, 55, 0.4)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-2 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
            <span>📜 Active Courier Scriptorium</span>
          </div>
          <h3 className="text-xl sm:text-3xl font-bold flex items-center gap-2.5" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            <Scroll className="w-7 h-7 flex-shrink-0" style={{ color: 'var(--antique-gold)' }} />
            <span>Thy Active Deliveries (In-Transit)</span>
          </h3>
          <p className="text-xs sm:text-sm italic mt-1" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
            Missives thou hast scanned and art currently conveying across the realm.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to="/map" className="btn-velvet-burgundy text-xs py-2 px-4 flex items-center gap-1.5 shadow">
            <Compass className="w-4 h-4" /> Open Realm Map
          </Link>
          <Link to="/mailman" className="btn-gold-saloon text-xs py-2 px-4 shadow">
            The Mailman's Registry
          </Link>
        </div>
      </div>

      {quests.length === 0 ? (
        <div className="p-8 text-center rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)' }}>
          <Star className="w-8 h-8 mx-auto text-amber-400/60 mb-2 animate-float-gentle" />
          <p className="font-bold text-base" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>Thou hast no missives currently in transit.</p>
          <p className="text-xs text-stone-400 mt-1 font-serif italic">Scan a sender's wax seal or claim a letter from the Realm Map to begin transport.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {quests.map((q, i) => (
            <div
              key={i}
              className="theatrical-card p-4 sm:p-5 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(35,28,18,0.85) 0%, rgba(18,14,10,0.95) 100%)',
                border: '1px solid rgba(212,175,55,0.35)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}
            >
              <div className="w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">In-Transit</span>
                  <p className="font-bold text-base sm:text-lg" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                    Deliver to: <span style={{ color: 'var(--antique-gold)' }}>{q.receiverRef?.name || 'Unknown Traveller'}</span>
                  </p>
                </div>
                <p className="text-xs italic text-stone-400 font-serif mt-1">
                  From: <span className="text-stone-300 font-semibold">{q.senderRef?.name || 'A Noble Scribe'}</span> {q.pickedUpAt ? `• Picked up: ${new Date(q.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(q.receiverRef?._id === user.id || q.receiverRef === user.id) ? (
                  <button 
                    onClick={() => handleSeizeMissive(q.qrCodeToken)} 
                    className="w-full sm:w-auto btn-velvet-burgundy text-xs py-2 px-4 shadow"
                  >
                    Seize Missive
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedQR({ token: q.qrCodeToken, receiverName: q.receiverRef?.name || 'Unknown' })} 
                    className="w-full sm:w-auto btn-gold-saloon text-xs py-2 px-4 shadow flex items-center justify-center gap-1.5"
                  >
                    <Scan className="w-3.5 h-3.5" /> Show Wax Seal QR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Gilded Wax Seal Modal in MailmanQuests ── */}
      <AnimatePresence>
        {selectedQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div
              className="theatrical-card p-6 sm:p-8 rounded-sm max-w-md w-full relative text-center shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
                border: '2px solid var(--antique-gold)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(212,175,55,0.2)'
              }}
            >
              <button
                onClick={() => setSelectedQR(null)}
                className="absolute top-3 right-3 text-stone-400 hover:text-amber-300 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-amber-500/20 border border-amber-400/50">
                <Crown className="w-6 h-6 text-amber-300" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold mb-1 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
                Delivery Wax Seal
              </h3>
              <p className="italic text-sm text-amber-300 font-serif mb-1">
                For Recipient: <strong>{selectedQR.receiverName}</strong>
              </p>
              <p className="text-xs text-stone-300 italic mb-5">
                Present this seal to the recipient so they may scan and receive their missive into their Mailbox.
              </p>

              <div className="flex justify-center p-4 bg-[#FFFDF9] border-2 border-[var(--antique-gold)] rounded-sm mb-4 inline-block shadow-inner">
                <QRCodeCanvas value={selectedQR.token} size={240} fgColor="#1A140E" />
              </div>

              {/* Copyable Token Box */}
              <div className="flex items-center justify-between p-2.5 rounded-sm bg-black/75 border border-amber-500/40 mb-4 text-xs">
                <span className="font-mono text-xs text-amber-200 truncate mr-2">{selectedQR.token}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(selectedQR.token);
                    }
                  }}
                  className="btn-gold-saloon text-[10px] py-1 px-2.5 flex items-center gap-1 flex-shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </button>
              </div>

              <div>
                <button
                  onClick={() => setSelectedQR(null)}
                  className="btn-gold-saloon text-xs py-2 px-6"
                >
                  Conceal Seal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COMPOSE LETTER (with Multi-Font Typography System)
// ============================================
// ============================================
// COMPOSE LETTER (Feature #2 - The Sovereign Scriptorium)
// ============================================
function ComposeLetter() {
  const [receiverRef, setReceiverRef] = useState('');
  const [content, setContent] = useState('');
  const [selectedFont, setSelectedFont] = useState('Cinzel');
  const [selectedFontSize, setSelectedFontSize] = useState<'small' | 'medium' | 'large' | 'huge'>('medium');
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [burnDuration, setBurnDuration] = useState(60);
  const [burnUnit, setBurnUnit] = useState<'seconds' | 'minutes'>('seconds');
  const [isTimeCapsule, setIsTimeCapsule] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [copiedQR, setCopiedQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdQR, setCreatedQR] = useState('');
  const [createdLetterId, setCreatedLetterId] = useState('');
  const [error, setError] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState('');
  
  const [liveUser, setLiveUser] = useState<any>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const u = getStoredUser();
    if (u) getUserProfile(u.id || u._id).then(setLiveUser).catch(() => {});

    if (location.state?.draft) {
      const draft = location.state.draft;
      setContent(draft.content || '');
      if (draft.receiverRef && typeof draft.receiverRef === 'object') {
        setReceiverRef(draft.receiverRef.name || '');
      } else {
        setReceiverRef(draft.receiverRef || '');
      }
      if (draft.font) setSelectedFont(draft.font);
      if (draft.fontSize) setSelectedFontSize(draft.fontSize);
      setBurnAfterReading(!!draft.burnAfterReading);
      if (draft.burnTimerSeconds) {
        if (draft.burnTimerSeconds % 60 === 0 && draft.burnTimerSeconds >= 60) {
          setBurnDuration(draft.burnTimerSeconds / 60);
          setBurnUnit('minutes');
        } else {
          setBurnDuration(draft.burnTimerSeconds);
          setBurnUnit('seconds');
        }
      }
      if (draft.scheduledFor) {
        setIsTimeCapsule(true);
        setScheduledFor(formatLocalDateTime(new Date(draft.scheduledFor)));
      }
      setCurrentDraftId(draft._id);
    }
  }, [location]);

  const isBanned = liveUser?.restrictedUntil && new Date(liveUser.restrictedUntil) > new Date();
  const totalBurnSeconds = burnUnit === 'minutes' ? burnDuration * 60 : burnDuration;

  const handleSend = async () => {
    if (!content.trim()) { setError('The missive cannot be empty.'); return; }
    setLoading(true); setError('');
    try {
      const schedValue = isTimeCapsule && scheduledFor ? new Date(scheduledFor).toISOString() : undefined;
      let res;
      if (currentDraftId) {
        res = await updateLetter(currentDraftId, receiverRef, content, 'pending', burnAfterReading, totalBurnSeconds, selectedFont, selectedFontSize, schedValue);
      } else {
        res = await sendLetter(receiverRef, content, 'standard', 'pending', burnAfterReading, totalBurnSeconds, selectedFont, selectedFontSize, undefined, schedValue);
      }
      setCreatedLetterId(res?._id || currentDraftId || '');
      setCreatedQR(res.qrCodeToken);
    } catch (e: any) {
      setError(e.message || 'Failed to dispatch letter');
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) { setError('Cannot save an empty draft.'); return; }
    setLoading(true); setError('');
    try {
      const schedValue = isTimeCapsule && scheduledFor ? new Date(scheduledFor).toISOString() : undefined;
      if (currentDraftId) {
        await updateLetter(currentDraftId, receiverRef, content, 'draft', burnAfterReading, totalBurnSeconds, selectedFont, selectedFontSize, schedValue);
      } else {
        const res = await sendLetter(receiverRef, content, 'standard', 'draft', burnAfterReading, totalBurnSeconds, selectedFont, selectedFontSize, undefined, schedValue);
        setCurrentDraftId(res._id);
      }
      setError('Draft saved to thy archives successfully!');
      setTimeout(() => navigate('/sent'), 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleQRClose = () => {
    setCreatedQR('');
    navigate('/sent');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto space-y-6 px-1 sm:px-4"
    >
      {/* Ban Notification */}
      {isBanned && (
        <div className="p-4 rounded-sm flex flex-col items-center animate-pulse" style={{ background: 'rgba(107,29,42,0.4)', border: '1px solid rgba(212,175,55,0.4)' }}>
          <span className="font-bold text-base uppercase flex items-center justify-center gap-2" style={{ color: '#EF9A9A', fontFamily: "'Cinzel', serif" }}>
            <Flame className="w-5 h-5 text-orange-400" /> Guild Sanction Imposed <Flame className="w-5 h-5 text-orange-400" />
          </span>
          <p className="mt-1 text-sm italic text-center" style={{ color: 'var(--parchment-light)' }}>
            Thy quill is locked until: <strong className="text-white">{new Date(liveUser.restrictedUntil).toLocaleString()}</strong>
          </p>
        </div>
      )}

      {/* Main Manuscript Card Wrapped in Expansive Unrolled Scroll Container */}
      <div className="parchment-scroll-container parchment-scroll-wide animate-scroll-unroll">
        <div className="scroll-rod-top" />

        <div className="theatrical-card p-5 sm:p-8 md:p-10 relative overflow-hidden rounded-none" style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          borderLeft: '3px solid rgba(212, 175, 55, 0.45)',
          borderRight: '3px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.15)'
        }}>
          {/* Top Gold Rule */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

          {/* Header Ribbon */}
          <div className="text-center pb-6 mb-6 relative" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-2 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              <span>✍️ The Sovereign Scriptorium</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
              Compose Thy Epistle
            </h2>
            <p className="italic text-base sm:text-lg mt-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold-muted)' }}>
              “Inscribe words that defy the boundaries of time and realm.”
            </p>
          </div>

          <div className="space-y-6">
            {/* Recipient Input */}
            <div>
              <label className="small-caps block text-sm sm:text-base font-bold mb-2" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
                To Whom It May Concern (Name / Realm Address / Open Missive):
              </label>
              <input 
                type="text" 
                value={receiverRef} 
                onChange={(e) => setReceiverRef(e.target.value)} 
                disabled={isBanned}
                className={`w-full p-3.5 rounded-sm focus:outline-none transition-all text-base sm:text-lg font-serif italic ${isBanned ? 'bg-gray-300 opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  background: '#FFFDF9',
                  color: '#1A1A1A',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                }}
                placeholder="e.g., Lady Gwendolyn / scholar@postme.realm (Leave blank for public missive)" 
              />
            </div>

            {/* Typography & Calligraphy Script Selector (Fully Mobile Fluid) */}
            <div className="p-4 sm:p-5 rounded-sm space-y-4" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5" style={{ color: 'var(--antique-gold)' }} />
                  <span className="small-caps text-sm sm:text-base font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                    Calligraphic Script & Scale:
                  </span>
                </div>
                
                {/* Font Size Toggle Buttons (Touch-friendly) */}
                <div className="flex items-center gap-1.5 p-1 rounded-sm flex-wrap" style={{ background: 'rgba(14,13,12,0.8)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <span className="text-xs uppercase tracking-wider font-semibold mr-1 pl-1" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>Scale:</span>
                  {[
                    { id: 'small', label: 'Modest' },
                    { id: 'medium', label: 'Standard' },
                    { id: 'large', label: 'Grand' },
                    { id: 'huge', label: 'Royal' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedFontSize(s.id as any)}
                      className="px-2.5 py-1 rounded-sm text-xs font-bold transition-all"
                      style={{
                        fontFamily: "'Cinzel', serif",
                        background: selectedFontSize === s.id ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'transparent',
                        color: selectedFontSize === s.id ? '#FFF' : 'var(--parchment-dark)',
                        border: selectedFontSize === s.id ? '1px solid var(--antique-gold)' : '1px solid transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Script Family Selector Dropdown & Live Script Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                <div className="md:col-span-6">
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    disabled={isBanned}
                    className="w-full p-3 rounded-sm font-semibold focus:outline-none text-base cursor-pointer"
                    style={{
                      background: '#FFFDF9',
                      color: '#1A1A1A',
                      border: '1px solid var(--border-subtle)',
                      fontFamily: "'Cinzel', serif"
                    }}
                  >
                    {GUILD_FONTS.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.label} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6 p-3 rounded-sm text-center overflow-hidden" style={{ background: 'rgba(14,13,12,0.6)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <span className="text-[11px] uppercase tracking-widest block mb-0.5" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>Active Script Preview:</span>
                  <span 
                    className="text-lg sm:text-xl font-medium tracking-wide block truncate"
                    style={{ color: 'var(--antique-gold)', fontFamily: getFontFamily(selectedFont) }}
                  >
                    Thy Words Carry the Wind & Fire
                  </span>
                </div>
              </div>
            </div>

            {/* Main Manuscript Writing Area */}
            <div>
              <label className="small-caps block text-sm sm:text-base font-bold mb-2" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
                The Missive Manuscript:
              </label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                rows={8} 
                disabled={isBanned}
                style={{ 
                  fontFamily: getFontFamily(selectedFont),
                  background: '#FFFDF9',
                  color: '#1A1A1A',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.12)'
                }}
                className={`w-full p-4 sm:p-6 rounded-sm focus:outline-none resize-none leading-relaxed transition-all ${getFontSizeClass(selectedFontSize)} ${isBanned ? 'bg-gray-300 opacity-50 cursor-not-allowed' : ''}`} 
                placeholder="Inscribe thy words upon the sovereign scroll..."
              />
            </div>
            
            {/* Burn After Reading with Configurable Ash Timer */}
            <div className="p-4 sm:p-5 rounded-sm space-y-3" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={burnAfterReading} 
                  disabled={isBanned} 
                  onChange={(e) => setBurnAfterReading(e.target.checked)} 
                  className="w-5 h-5 accent-[#7A1E2E] cursor-pointer" 
                />
                <Flame className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span className="text-sm sm:text-base font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                  Burn After Reading — Ink dissolves to ash after the recipient opens it
                </span>
              </label>

              {burnAfterReading && (
                <div className="pt-3 flex flex-wrap items-center gap-3 animate-curtain-reveal" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--gold-muted)', fontFamily: "'Cinzel', serif" }}>Ash Timer:</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="5" 
                      max={burnUnit === 'minutes' ? 60 : 3600} 
                      value={burnDuration} 
                      onChange={(e) => setBurnDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 p-2 rounded-sm font-bold text-center text-base focus:outline-none"
                      style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)' }}
                    />
                    <select 
                      value={burnUnit} 
                      onChange={(e) => setBurnUnit(e.target.value as 'seconds' | 'minutes')}
                      className="p-2 rounded-sm font-semibold text-base focus:outline-none"
                      style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)', fontFamily: "'Cinzel', serif" }}
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[15, 30, 60].map(s => (
                      <button 
                        key={s} 
                        type="button" 
                        onClick={() => { setBurnDuration(s); setBurnUnit('seconds'); }}
                        className="px-2.5 py-1 rounded-sm text-xs font-bold transition-colors"
                        style={{
                          background: burnDuration === s && burnUnit === 'seconds' ? 'var(--burgundy)' : 'rgba(255,253,249,0.08)',
                          color: burnDuration === s && burnUnit === 'seconds' ? '#FFF' : 'var(--parchment-dark)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          fontFamily: "'Cinzel', serif"
                        }}
                      >
                        {s}s
                      </button>
                    ))}
                    {[2, 5, 10].map(m => (
                      <button 
                        key={m} 
                        type="button" 
                        onClick={() => { setBurnDuration(m); setBurnUnit('minutes'); }}
                        className="px-2.5 py-1 rounded-sm text-xs font-bold transition-colors"
                        style={{
                          background: burnDuration === m && burnUnit === 'minutes' ? 'var(--burgundy)' : 'rgba(255,253,249,0.08)',
                          color: burnDuration === m && burnUnit === 'minutes' ? '#FFF' : 'var(--parchment-dark)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          fontFamily: "'Cinzel', serif"
                        }}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FEATURE: Sealed Until (Time Capsule Timer) */}
            <div className={`p-4 rounded-sm space-y-3 transition-all ${isTimeCapsule ? 'bg-amber-950/30 border-2 border-amber-500/70 shadow-lg' : 'bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.3)]'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-full ${isTimeCapsule ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-stone-800 text-stone-400'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ fontFamily: "'Cinzel', serif", color: 'var(--antique-gold)' }}>
                        Sealed Until (Time Lock)
                      </span>
                      {isTimeCapsule && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                          Active Lock
                        </span>
                      )}
                    </div>
                    <p className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                      The recipient receives the sealed epistle, but its inner contents remain locked until thy appointed timer reaches zero.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      waxSealAudio.playWaxCrack();
                      const nextState = !isTimeCapsule;
                      setIsTimeCapsule(nextState);
                      if (nextState && !scheduledFor) {
                        const d = new Date(Date.now() + 60 * 60 * 1000); // default +1 hour
                        setScheduledFor(formatLocalDateTime(d));
                      }
                    }}
                    className={`text-xs py-1.5 px-3.5 rounded-sm font-bold transition-all flex items-center gap-1.5 ${
                      isTimeCapsule 
                        ? 'btn-velvet-burgundy shadow-md animate-glow-pulse' 
                        : 'btn-gold-saloon'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isTimeCapsule ? 'Sealed Until: ON' : 'Set Sealed Until'}</span>
                  </button>
                </div>
              </div>

              {isTimeCapsule && (
                <div className="space-y-3 pt-3 border-t border-amber-500/30">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-amber-200 font-bold mr-1">Quick Presets:</span>
                    {[
                      { label: '+5m', mins: 5 },
                      { label: '+15m', mins: 15 },
                      { label: '+30m', mins: 30 },
                      { label: '+1h', mins: 60 },
                      { label: '+6h', mins: 360 },
                      { label: '+24h', mins: 1440 },
                      { label: '+3d', mins: 4320 },
                      { label: '+7d', mins: 10080 }
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          waxSealAudio.playWaxCrack();
                          const d = new Date(Date.now() + p.mins * 60 * 1000);
                          setScheduledFor(formatLocalDateTime(d));
                        }}
                        className="px-2.5 py-1 rounded-sm text-xs font-bold bg-amber-950/80 hover:bg-amber-800 text-amber-200 border border-amber-500/40 transition-colors shadow-sm"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-bold text-amber-300 mb-1">
                        Exact Unlock Date & Time:
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="w-full p-2.5 rounded-sm text-sm bg-[#1A120B] text-amber-100 border border-amber-500/50 focus:outline-none focus:border-amber-400 font-mono shadow-inner"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <button
                        type="button"
                        onClick={() => {
                          openStoryHeraldStudio({
                            _id: currentDraftId || 'draft-preview',
                            receiverRef: { name: receiverRef || 'Noble Scribe' },
                            scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(Date.now() + 60 * 60 * 1000),
                            sealColor: '#DC2626',
                            isAnonymous: false
                          });
                        }}
                        className="btn-gold-saloon text-xs w-full py-2.5 justify-center font-bold flex items-center gap-1.5 shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Story Herald</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && <p className={`font-bold italic text-sm p-3 rounded-sm ${error.includes('successfully') ? 'bg-green-950 text-green-200 border border-green-800' : 'bg-red-950 text-red-200 border border-red-800'}`}>⚠ {error}</p>}

            {/* Action Bar (Fluid Stacking on Mobile) */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 gap-4" style={{ borderTop: '1px solid rgba(212,175,55,0.25)' }}>
              <div className="flex items-center space-x-2 justify-center sm:justify-start" style={{ color: 'var(--antique-gold)' }}>
                <Shield className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>Wax Seal Authentication</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={handleSaveDraft} 
                  disabled={loading || isBanned} 
                  className="btn-gold-saloon justify-center text-sm py-3 px-6"
                >
                  {loading && !createdQR ? 'Preserving...' : 'Save Draft'}
                </button>
                <button 
                  type="button"
                  onClick={handleSend} 
                  disabled={loading || isBanned} 
                  className="btn-velvet-burgundy justify-center text-sm py-3 px-8 animate-glow-pulse"
                >
                  <PenTool className="w-4 h-4" />
                  <span>{loading && createdQR ? 'Affixing Seal...' : 'Seal & Dispatch'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-rod-bottom" />
      </div>

      {/* QR Code Dispatch Modal */}
      <AnimatePresence>
        {createdQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="theatrical-card p-6 sm:p-8 max-w-md w-full relative text-center shadow-2xl animate-glow-pulse" style={{ border: '2px solid var(--antique-gold)' }}>
              <button onClick={handleQRClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"><X className="w-6 h-6" /></button>
              <Crown className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--antique-gold)' }} />
              <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>Epistle Sealed!</h3>
              <p className="text-xs sm:text-sm italic mb-5" style={{ color: 'var(--gold-muted)' }}>Present this Royal Wax Seal (QR Code) to a Courier for pickup.</p>
              
              <div className="flex justify-center p-4 bg-white rounded-sm mb-4 inline-block shadow-inner" style={{ border: '2px solid var(--antique-gold)' }}>
                <QRCodeCanvas value={createdQR} size={220} fgColor="#1A1A1A" />
              </div>
              
              {/* Copyable Token Box */}
              <div className="flex items-center justify-between p-2.5 rounded-sm bg-black/75 border border-amber-500/40 mb-4 text-xs">
                <span className="font-mono text-xs text-amber-200 truncate mr-2">{createdQR}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(createdQR);
                      setCopiedQR(true);
                      setTimeout(() => setCopiedQR(false), 2500);
                    }
                  }}
                  className="btn-gold-saloon text-[10px] py-1 px-2.5 flex items-center gap-1 flex-shrink-0"
                >
                  {copiedQR ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedQR ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    openStoryHeraldStudio({
                      _id: createdLetterId,
                      receiverRef: { name: receiverRef || 'Noble Scribe' },
                      scheduledFor: isTimeCapsule && scheduledFor ? new Date(scheduledFor) : undefined,
                      sealColor: '#DC2626',
                      isAnonymous: false
                    });
                  }}
                  className="btn-gold-saloon text-xs w-full justify-center py-2.5 font-bold flex items-center gap-2 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #831843 0%, #581C87 50%, #92400E 100%)', color: '#FFF', border: '1px solid #D4AF37' }}
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>📜 Proclaim Royal Story Herald</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setCreatedQR('');
                    navigate('/map', { state: { letterId: createdLetterId, letterToken: createdQR } });
                  }} 
                  className="btn-gold-saloon text-xs w-full justify-center py-3 font-bold flex items-center gap-2 shadow-lg animate-glow-pulse"
                >
                  <Compass className="w-4 h-4 text-amber-300" />
                  <span>🏇 Hand Over to Mailman</span>
                </button>
                <button onClick={handleQRClose} className="btn-velvet-burgundy text-xs w-full justify-center">
                  Dismiss & View Dispatched Missives →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// THE GRAND ARCHIVE (Feature #12 - Sent, Received & Drafts)
// ============================================
function LetterArchive() {
  const [letters, setLetters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'outgoing' | 'drafts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openLetter, setOpenLetter] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isClosingScroll, setIsClosingScroll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleOpenLetter = async (letter: any) => {
    waxSealAudio.playWaxCrack();
    setTimeout(() => {
      waxSealAudio.playParchmentUnroll();
    }, 180);
    setOpenLetter(letter);
    setIsClosingScroll(false);

    // Auto mark as read if not already read
    if (!letter.isRead && !letter.firstReadAt && letter._id) {
      try {
        await markLetterRead(letter._id);
        setLetters(prev => prev.map(l => l._id === letter._id ? { ...l, isRead: true, firstReadAt: Date.now() } : l));
      } catch (_) {}
    }
  };

  const handleCloseLetter = () => {
    setIsClosingScroll(true);
    waxSealAudio.playParchmentUnroll();
    setTimeout(() => {
      waxSealAudio.playWaxStampThud();
    }, 220);
    setTimeout(() => {
      setOpenLetter(null);
      setIsClosingScroll(false);
      fetchArchiveLetters();
    }, 550);
  };

  const fetchArchiveLetters = async () => {
    setLoading(true);
    try {
      const [inbox, outbox] = await Promise.all([
        getMyMailbox().catch(() => []),
        getMyLetters().catch(() => [])
      ]);
      
      const markedInbox = inbox.map((l: any) => ({ ...l, direction: 'incoming' }));
      const markedOutbox = outbox.map((l: any) => ({ 
        ...l, 
        direction: l.status === 'draft' ? 'draft' : 'outgoing' 
      }));
      
      // De-duplicate by _id
      const seen = new Set();
      const merged: any[] = [];
      for (const item of [...markedInbox, ...markedOutbox]) {
        if (!item._id || !seen.has(item._id)) {
          if (item._id) seen.add(item._id);
          merged.push(item);
        }
      }
      // Strict latest to oldest sort
      merged.sort((a, b) => new Date(b.deliveredAt || b.createdAt || b.updatedAt || 0).getTime() - new Date(a.deliveredAt || a.createdAt || a.updatedAt || 0).getTime());
      setLetters(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchiveLetters();
  }, []);

  const handleToggleRead = async (id: string, currentReadState: boolean) => {
    try {
      await toggleLetterRead(id, !currentReadState);
      setLetters(prev => prev.map(l => l._id === id ? { ...l, isRead: !currentReadState, firstReadAt: !currentReadState ? Date.now() : undefined } : l));
    } catch (e: any) {
      alert(e.message || 'Failed to update read state');
    }
  };

  const handleBatchMarkRead = async (isRead: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await batchMarkRead(selectedIds, isRead);
      setActionMsg(`Marked ${selectedIds.length} missives as ${isRead ? 'read' : 'unread'}.`);
      setTimeout(() => setActionMsg(null), 3500);
      setLetters(prev => prev.map(l => selectedIds.includes(l._id) ? { ...l, isRead, firstReadAt: isRead ? Date.now() : undefined } : l));
      setSelectedIds([]);
    } catch (e: any) {
      alert(e.message || 'Failed to batch update');
    }
  };

  const handleBatchTrash = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Move ${selectedIds.length} selected missives to thy Guild Wastebin?`)) return;
    try {
      await batchTrashLetters(selectedIds);
      setActionMsg(`Moved ${selectedIds.length} missives to thy Wastebin.`);
      setTimeout(() => setActionMsg(null), 3500);
      setLetters(prev => prev.filter(l => !selectedIds.includes(l._id)));
      setSelectedIds([]);
      fetchArchiveLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to trash selected missives');
    }
  };

  const handleBatchAbandon = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Abandon ${selectedIds.length} selected missives to The Dead Letter Office? They will be deposited in the public realm archive for anyone to read.`)) return;
    try {
      await batchAbandonLetters(selectedIds);
      setActionMsg(`Released ${selectedIds.length} missives to The Dead Letter Office.`);
      setTimeout(() => setActionMsg(null), 4000);
      setLetters(prev => prev.filter(l => !selectedIds.includes(l._id)));
      setSelectedIds([]);
      fetchArchiveLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to batch abandon missives.');
    }
  };

  const handleAbandonLetter = async (id: string, title: string) => {
    if (!window.confirm(`Abandon "${title}" to The Dead Letter Office? It will be preserved in the public realm archive for anyone to read.`)) return;
    try {
      await abandonLetter(id);
      setActionMsg('Missive released to The Dead Letter Office.');
      setTimeout(() => setActionMsg(null), 4000);
      setLetters(prev => prev.filter(l => l._id !== id));
      fetchArchiveLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to abandon missive.');
    }
  };

  const handleRemoveLetter = async (id: string, title: string) => {
    if (!window.confirm(`Move "${title}" to the Guild Wastebin?`)) return;
    setLetters(prev => prev.filter(l => l._id !== id));
    try {
      await removeLetterToTrash(id);
      setActionMsg('Missive transferred to thy Wastebin.');
      setTimeout(() => setActionMsg(null), 3500);
      fetchArchiveLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to remove letter.');
      fetchArchiveLetters();
    }
  };

  const filteredLetters = letters.filter(l => {
    if (activeTab === 'incoming' && l.direction !== 'incoming') return false;
    if (activeTab === 'outgoing' && l.direction !== 'outgoing') return false;
    if (activeTab === 'drafts' && l.direction !== 'draft' && l.status !== 'draft') return false;

    const q = searchQuery.toLowerCase();
    return (
      l.content?.toLowerCase().includes(q) || 
      l.senderRef?.name?.toLowerCase().includes(q) ||
      (l.receiverRef?.name || l.receiverRef)?.toLowerCase().includes(q) ||
      l.status?.toLowerCase().includes(q)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLetters.length && filteredLetters.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLetters.map(l => l._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const displayedLetters = filteredLetters.slice(0, visibleCount);

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto space-y-6">
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
        background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 pb-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-2 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              <span>📖 The Scribe's Tome</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-wide flex items-center gap-3" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
              <BookOpen className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--antique-gold)' }} />
              The Grand Archive
            </h2>
            <p className="text-sm sm:text-base italic mt-1" style={{ color: 'var(--gold-muted)' }}>
              A comprehensive chronicle of all missives written, received, and sealed upon the realm (Latest to Oldest).
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/trash" className="btn-gold-saloon text-xs py-2 px-4 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-amber-500" /> Open Wastebin
            </Link>
            <Link to="/" className="btn-velvet-burgundy text-xs py-2 px-4">
              ← Thy Ledger
            </Link>
          </div>
        </div>

        {actionMsg && (
          <div className="p-3.5 mb-6 rounded-sm text-sm font-bold flex items-center gap-2 shadow-md animate-curtain-reveal" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--parchment-light)', border: '1px solid var(--antique-gold)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--antique-gold)' }} /> {actionMsg}
          </div>
        )}
        
        {/* Search Bar with Gold Accent */}
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search the archive by recipient, sender, text phrases, or status..." 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(5); }} 
            className="w-full p-3.5 rounded-sm text-base sm:text-lg font-serif italic focus:outline-none transition-all shadow-inner"
            style={{
              background: '#FFFDF9',
              color: '#1A1A1A',
              border: '1px solid var(--border-subtle)'
            }}
          />
        </div>

        {/* Archive Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
          {[
            { key: 'all', label: 'All Chronicles', count: letters.length },
            { key: 'incoming', label: 'Incoming Missives', count: letters.filter(l => l.direction === 'incoming').length },
            { key: 'outgoing', label: 'Dispatched Missives', count: letters.filter(l => l.direction === 'outgoing').length },
            { key: 'drafts', label: 'Unsealed Drafts', count: letters.filter(l => l.status === 'draft').length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key as any); setVisibleCount(5); setSelectedIds([]); }}
              className="px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-sm transition-all flex items-center gap-2"
              style={{
                fontFamily: "'Cinzel', serif",
                background: activeTab === t.key ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'transparent',
                color: activeTab === t.key ? '#FFF' : 'var(--gold-muted)',
                border: activeTab === t.key ? '1px solid var(--antique-gold)' : '1px solid transparent',
                borderBottom: 'none'
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* ── Selection & Multi-Batch Action Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
            >
              {selectedIds.length === filteredLetters.length && filteredLetters.length > 0 ? (
                <><CheckSquare className="w-3.5 h-3.5 text-amber-300" /> Deselect All</>
              ) : (
                <><Square className="w-3.5 h-3.5" /> Select All ({filteredLetters.length})</>
              )}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs font-mono font-bold text-amber-300">
                ✦ {selectedIds.length} Selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBatchMarkRead(true)}
                className="btn-gold-saloon text-[11px] py-1.5 px-3"
              >
                Mark Read
              </button>
              <button
                onClick={() => handleBatchMarkRead(false)}
                className="btn-gold-saloon text-[11px] py-1.5 px-3"
              >
                Mark Unread
              </button>
              <button
                onClick={handleBatchAbandon}
                className="btn-gold-saloon text-[11px] py-1.5 px-3 flex items-center gap-1"
                style={{ background: '#78350F', color: '#FEF3C7', border: '1px solid #D97706' }}
                title="Abandon selected missives to The Dead Letter Office public archive"
              >
                <Archive className="w-3 h-3 text-amber-300" /> Abandon ({selectedIds.length})
              </button>
              <button
                onClick={handleBatchTrash}
                className="btn-velvet-burgundy text-[11px] py-1.5 px-3 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3 text-amber-400" /> Move to Wastebin
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center italic" style={{ color: 'var(--gold-muted)' }}>
            <Feather className="w-8 h-8 mx-auto animate-spin mb-3" style={{ color: 'var(--antique-gold)' }} />
            <p className="text-lg font-serif">Dusting off the ancient archive tomes...</p>
          </div>
        ) : filteredLetters.length === 0 ? (
          <div className="text-center py-16 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold-muted)' }}>
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-60" style={{ color: 'var(--antique-gold)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>No chronicles found matching thy query.</p>
            <p className="text-sm mt-1 italic font-serif">Inscribe missives or await correspondence to populate thy archives.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedLetters.map((l: any, i) => {
                const isDybbuk = l.type === 'dybbuk' || l.type === 'dibbyuk';
                const isSchrodinger = l.type === 'schrodinger';
                const isBottle = l.type === 'bottle';
                const isIncoming = l.direction === 'incoming';
                const isDraft = l.status === 'draft';
                const isRead = l.isRead || !!l.firstReadAt;
                const isSelected = selectedIds.includes(l._id);
                
                let badgeText = isDraft ? 'DRAFT' : (isIncoming ? 'INCOMING' : 'OUTGOING');
                let badgeColor = isDraft ? '#92400E' : (isIncoming ? '#430E17' : '#7A1E2E');
                if (isDybbuk) {
                  badgeText = '🔮 DYBBUK';
                  badgeColor = '#6B21A8';
                } else if (isSchrodinger) {
                  badgeText = '⚛️ SCHRÖDINGER';
                  badgeColor = '#0284C7';
                } else if (isBottle) {
                  badgeText = '🌊 OCEAN BOTTLE';
                  badgeColor = '#065F46';
                }

                let title = isIncoming 
                  ? `From: ${l.senderRef?.name || 'Unknown'}` 
                  : (isDraft ? `Draft to ${l.receiverRef?.name || l.receiverRef || 'Unspecified'}` : `To: ${l.receiverRef?.name || l.receiverRef || 'Unknown'}`);
                
                if (isDybbuk) {
                  title = `Spectral: ${l.spectralSender?.name || 'Dybbuk Entity'}`;
                } else if (isSchrodinger) {
                  title = isIncoming 
                    ? `Schrödinger from ${l.senderRef?.name || 'A Scholar'}` 
                    : (isDraft ? `Draft Schrödinger Box` : `Schrödinger to ${l.receiverRef?.name || l.receiverRef || 'Quantum Reality'}`);
                } else if (isBottle) {
                  title = isIncoming
                    ? (l.isAnonymous ? `Ocean Bottle: "${l.bottleMoniker || 'Ocean Relic'}"` : `Bottle from ${l.senderRef?.name || 'A Mariner'}`)
                    : `Dispatched Bottle: "${l.bottleMoniker || 'Ocean Relic'}"`;
                }

                return (
                  <div 
                    key={l._id || i} 
                    className="theatrical-card p-5 rounded-sm flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-1"
                    style={{
                      background: isDybbuk 
                        ? 'linear-gradient(145deg, rgba(38,18,58,0.85) 0%, rgba(18,10,28,0.95) 100%)' 
                        : isSchrodinger 
                          ? 'linear-gradient(145deg, rgba(8,47,73,0.85) 0%, rgba(3,21,38,0.95) 100%)'
                          : isBottle
                            ? 'linear-gradient(145deg, rgba(6,95,70,0.85) 0%, rgba(2,44,34,0.95) 100%)'
                            : 'linear-gradient(145deg, #24201C 0%, #151311 100%)',
                      border: isSelected
                        ? '2px solid var(--antique-gold)'
                        : isDybbuk 
                          ? '1px solid rgba(168,85,247,0.5)' 
                          : isSchrodinger
                            ? '1px solid rgba(56,189,248,0.5)'
                            : isBottle
                              ? '1px solid rgba(52,211,153,0.5)'
                              : '1px solid rgba(212,175,55,0.25)',
                      boxShadow: isSelected ? '0 0 20px rgba(212,175,55,0.3)' : '0 10px 25px rgba(0,0,0,0.5)'
                    }}
                  >
                    {/* Top Select Box & Badges */}
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => toggleSelect(l._id)}
                        className="p-1 text-stone-400 hover:text-amber-300 transition-colors"
                        title={isSelected ? "Deselect" : "Select"}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-amber-300" /> : <Square className="w-5 h-5" />}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Read / Unread Status Badge */}
                        <span className={`text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full ${
                          isRead ? 'bg-stone-800 text-stone-300 border border-stone-600' : 'bg-amber-500/25 text-amber-300 border border-amber-400 animate-pulse'
                        }`}>
                          {isRead ? '✓ Read' : '✦ Unread'}
                        </span>

                        <span className="px-2.5 py-0.5 text-[10px] font-bold text-white rounded-sm uppercase tracking-wider"
                          style={{
                            background: badgeColor,
                            fontFamily: "'Cinzel', serif"
                          }}
                        >
                          {badgeText}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 pb-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                        <p className="font-bold text-base sm:text-lg flex items-center gap-1.5" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                          {isDybbuk && <Ghost className="w-4 h-4 text-purple-400" />}
                          {isSchrodinger && <Atom className="w-4 h-4 text-sky-400 animate-spin" />}
                          {isBottle && <Waves className="w-4 h-4 text-emerald-400" />}
                          <span className="truncate">{title}</span>
                        </p>
                        <p className="text-xs italic mt-0.5" style={{ color: 'var(--gold-muted)' }}>
                          {isDybbuk ? (
                            `Spectral Realm: ${l.spectralSender?.realmOrigin || 'The Astral Veil'}`
                          ) : isSchrodinger ? (
                            `Quantum: ${l.schrodingerState || 'superposition'} • ${l.collapsedVariant ? `Collapsed: ${l.collapsedVariant.label}` : `${l.schrodingerVariants?.length || 3} States Superposed`}`
                          ) : isBottle ? (
                            `Drifted ${l.bottleDrift?.distanceKm || 0} km • Sealed with ${l.bottleWaxColor || 'gold'} wax`
                          ) : (
                            `${new Date(l.deliveredAt || l.createdAt).toLocaleDateString()} • Status: ${l.status}`
                          )}
                        </p>
                      </div>
                      {(l.scheduledFor && new Date(l.scheduledFor).getTime() > Date.now()) ? (
                        <div className="p-4 rounded-sm bg-black/60 border border-amber-500/40 text-center space-y-1.5 mb-4">
                          <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider font-mono">
                            <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span>⏳ Sealed in Time Capsule</span>
                          </div>
                          <p className="text-xs italic text-amber-200/80 font-serif">
                            Contents locked until: <strong className="text-amber-100">{new Date(l.scheduledFor).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                          </p>
                        </div>
                      ) : (
                        <div 
                          className="text-base whitespace-pre-wrap line-clamp-4 p-3 rounded-sm shadow-inner mb-4 leading-relaxed"
                          style={{
                            background: '#FFFDF9',
                            color: '#1A1A1A',
                            border: '1px solid var(--border-subtle)',
                            fontFamily: getFontFamily(l.font)
                          }}
                        >
                          {l.content}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 mt-auto" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                      <button
                        onClick={() => handleOpenLetter(l)}
                        className="flex-1 py-1.5 px-3 text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-all shadow"
                        style={{
                          background: (l.scheduledFor && new Date(l.scheduledFor).getTime() > Date.now())
                            ? '#78350F'
                            : isDybbuk ? '#7E22CE' : (isSchrodinger ? '#0284C7' : (isBottle ? '#059669' : 'var(--burgundy)')),
                          color: '#FFF',
                          fontFamily: "'Cinzel', serif"
                        }}
                      >
                        {(l.scheduledFor && new Date(l.scheduledFor).getTime() > Date.now()) ? (
                          <><Lock className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> <span>⏳ Sealed Capsule</span></>
                        ) : (
                          <><BookOpen className="w-3.5 h-3.5" /> <span>Read</span></>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleRead(l._id, isRead)}
                        className="py-1.5 px-2.5 text-[11px] font-bold rounded-sm transition-all"
                        style={{
                          background: 'rgba(255,253,249,0.06)',
                          color: isRead ? 'var(--gold-muted)' : 'var(--antique-gold)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          fontFamily: "'Cinzel', serif"
                        }}
                        title={isRead ? "Mark as Unread" : "Mark as Read"}
                      >
                        {isRead ? "Mark Unread" : "Mark Read"}
                      </button>

                      <button
                        onClick={() => handleAbandonLetter(l._id, title)}
                        className="py-1.5 px-2.5 text-xs font-bold rounded-sm flex items-center justify-center gap-1 transition-all"
                        style={{
                          background: 'rgba(255,253,249,0.06)',
                          color: '#FCD34D',
                          border: '1px solid rgba(212,175,55,0.3)',
                          fontFamily: "'Cinzel', serif"
                        }}
                        title="Abandon to The Dead Letter Office (Public Realm Archive)"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button
                        onClick={() => openStoryHeraldStudio(l)}
                        className="py-1.5 px-2.5 text-xs font-bold rounded-sm flex items-center justify-center gap-1 transition-all"
                        style={{
                          background: 'rgba(212,175,55,0.15)',
                          color: 'var(--antique-gold)',
                          border: '1px solid rgba(212,175,55,0.4)',
                          fontFamily: "'Cinzel', serif"
                        }}
                        title="Proclaim 9:16 Royal Story Herald"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Herald</span>
                      </button>

                      <button
                        onClick={() => handleRemoveLetter(l._id, title)}
                        className="py-1.5 px-2.5 text-xs font-bold rounded-sm flex items-center justify-center gap-1 transition-all"
                        style={{
                          background: 'rgba(255,253,249,0.06)',
                          color: 'var(--parchment-dark)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          fontFamily: "'Cinzel', serif"
                        }}
                        title="Move to Wastebin"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination / Load More Controls ── */}
            <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(212,175,55,0.25)' }}>
              <p className="text-xs sm:text-sm font-mono" style={{ color: 'var(--gold-muted)' }}>
                Showing <strong className="text-amber-300">{Math.min(visibleCount, filteredLetters.length)}</strong> of <strong className="text-amber-300">{filteredLetters.length}</strong> missives (Latest to Oldest)
              </p>
              
              <div className="flex flex-wrap items-center gap-2.5">
                {visibleCount < filteredLetters.length && (
                  <button
                    onClick={() => setVisibleCount(c => c + 5)}
                    className="btn-gold-saloon text-xs py-2 px-5 shadow"
                  >
                    See More (+5 Missives)
                  </button>
                )}
                {visibleCount < filteredLetters.length && (
                  <button
                    onClick={() => setVisibleCount(filteredLetters.length)}
                    className="btn-velvet-burgundy text-xs py-2 px-5 shadow font-bold"
                  >
                    SEE ALL ({filteredLetters.length})
                  </button>
                )}
                {visibleCount >= filteredLetters.length && filteredLetters.length > 5 && (
                  <button
                    onClick={() => setVisibleCount(5)}
                    className="btn-gold-saloon text-xs py-2 px-4 shadow opacity-80 hover:opacity-100"
                  >
                    Show Less (First 5)
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reader Modal with Smooth Parchment Scroll Unfurling & Roll-Down Closing Animation */}
      <AnimatePresence>
        {openLetter && openLetter.scheduledFor && new Date(openLetter.scheduledFor).getTime() > Date.now() ? (
          <WaxSealRevealModal
            isOpen={!!openLetter}
            letter={openLetter}
            onClose={handleCloseLetter}
            onTrash={(id) => handleRemoveLetter(id, 'Archived')}
          />
        ) : openLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
            <div className={`max-w-lg w-full relative ${isClosingScroll ? 'animate-scroll-roll-close' : 'animate-scroll-unroll'}`}>
              {/* Top Wooden Rod */}
              <div className="scroll-rod-top" />

              <div className="parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl">
                <button onClick={handleCloseLetter} className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1 transition-colors"><X className="w-6 h-6" /></button>
                
                {(openLetter.type === 'dybbuk' || openLetter.type === 'dibbyuk') ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Ghost className="w-6 h-6 text-purple-700 animate-pulse" />
                      <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#2E1065', fontFamily: "'Cinzel', serif" }}>
                        Spectral Dybbuk Missive
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4" style={{ color: '#7E22CE' }}>
                      From: <span className="font-bold">{openLetter.spectralSender?.name || 'A Whispering Shade'}</span> ({openLetter.spectralSender?.title || 'Unknown'}) • Realm: {openLetter.spectralSender?.realmOrigin || 'The Astral Veil'}
                    </p>
                  </div>
                ) : openLetter.type === 'schrodinger' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Atom className="w-6 h-6 text-sky-700 animate-spin" />
                      <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#0C4A6E', fontFamily: "'Cinzel', serif" }}>
                        {openLetter.collapsedVariant ? `Timeline: ${openLetter.collapsedVariant.label}` : "Schrödinger's Quantum Missive"}
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4" style={{ color: '#0284C7' }}>
                      Observed Reality • State: {openLetter.schrodingerState || 'superposition'}
                    </p>
                  </div>
                ) : openLetter.type === 'bottle' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Waves className="w-6 h-6 text-emerald-700 animate-pulse" />
                      <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#064E3B', fontFamily: "'Cinzel', serif" }}>
                        {openLetter.bottleMoniker || 'Ocean Bottle Missive'}
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4 text-emerald-800">
                      Origin: <span className="font-bold">{openLetter.isAnonymous ? 'An Anonymous Soul' : (openLetter.senderRef?.name || 'A Mariner')}</span> • Drifted: {openLetter.bottleDrift?.distanceKm || 0} km across oceanic tides
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: '#3A1F04' }}>
                      {openLetter.direction === 'incoming' ? `Missive from ${openLetter.senderRef?.name || 'Unknown'}` : `Missive to ${openLetter.receiverRef?.name || openLetter.receiverRef || 'Unknown'}`}
                    </h3>
                    <p className="text-xs italic mb-4" style={{ color: '#78350F' }}>
                      Recorded on {new Date(openLetter.createdAt).toLocaleString()} • Status: {openLetter.status}
                    </p>
                  </>
                )}

                <div 
                  style={{
                    fontFamily: getFontFamily(openLetter.font),
                    background: 'rgba(255, 255, 255, 0.75)',
                    color: '#1A1A1A',
                    border: '1px solid rgba(160, 120, 60, 0.3)'
                  }}
                  className={`p-5 rounded-sm whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto leading-relaxed ${getFontSizeClass(openLetter.fontSize)}`}
                >
                  {openLetter.content}
                </div>

                <div className="mt-5 text-right">
                  <button
                    onClick={handleCloseLetter}
                    className="btn-gold-saloon text-xs py-2 px-5"
                  >
                    Roll Up Scroll & Close
                  </button>
                </div>
              </div>

              {/* Bottom Wooden Rod */}
              <div className="scroll-rod-bottom" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
// ============================================
// MY MAILBOX (Inbox) with Dybbuk Letter & Mode
// ============================================
function MyMailbox() {
  const [myMailbox, setMyMailbox] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [openLetter, setOpenLetter] = useState<any>(null); 
  const [fadeProgress, setFadeProgress] = useState(0); 
  const [reportingUser, setReportingUser] = useState<any>(null); 
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [dybbukMode, setDybbukMode] = useState(false);
  const [tone, setTone] = useState<'classical' | 'modern'>('classical');
  const [summoningDybbuk, setSummoningDybbuk] = useState(false);
  const [summoningSchrodinger, setSummoningSchrodinger] = useState(false);
  const [isClosingScroll, setIsClosingScroll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const burnTimerRef = React.useRef<number | null>(null); 

  // Feature 26: Schrödinger Quantum Collapse States
  const [collapsingLetter, setCollapsingLetter] = useState<any>(null);
  const [collapseStep, setCollapseStep] = useState<'superposition' | 'collapsing' | 'collapsed'>('superposition');
  const [collapsedResult, setCollapsedResult] = useState<any>(null);

  const fetchMyMailbox = async () => { 
    try { 
      const data = await getMyMailbox(); 
      const arr = Array.isArray(data) ? data : [];
      // Latest to oldest sort
      arr.sort((a, b) => new Date(b.deliveredAt || b.createdAt || b.updatedAt || 0).getTime() - new Date(a.deliveredAt || a.createdAt || a.updatedAt || 0).getTime());
      setMyMailbox(arr); 
    } catch (e) {} 
  };
  
  useEffect(() => { 
    const u = getStoredUser();
    if (u) {
      const uid = u.id || u._id;
      getUserProfile(uid).then(prof => {
        if (prof && typeof prof.dybbukMode === 'boolean') {
          setDybbukMode(prof.dybbukMode);
        }
      }).catch(() => {});

      checkDybbukAutoDelivery(uid).then(res => {
        if (res && res.manifested) {
          setActionMsg(res.message);
          fetchMyMailbox();
        }
      }).catch(() => {});
    }

    fetchMyMailbox(); 
    return () => { if (burnTimerRef.current) window.clearInterval(burnTimerRef.current); }; 
  }, []);

  const handleToggleDybbukMode = async () => {
    const u = getStoredUser();
    if (!u) return;
    try {
      const res = await toggleDybbukMode(u.id || u._id, !dybbukMode);
      setDybbukMode(res.dybbukMode);
      setActionMsg(res.message);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (e: any) {
      alert(e.message || "Failed to toggle Dybbuk Mode");
    }
  };

  const handleSummonDybbuk = async () => {
    const u = getStoredUser();
    if (!u) return;
    setSummoningDybbuk(true);
    try {
      const res = await summonDybbukLetter(u.id || u._id, tone);
      setActionMsg(res.message || `👻 A Dybbuk Missive (${tone === 'modern' ? 'Modern' : 'Classical'}) has manifested in thy Mailbox!`);
      setTimeout(() => setActionMsg(null), 5000);
      fetchMyMailbox();
    } catch (e: any) {
      alert(e.message || "Failed to summon Dybbuk Missive");
    } finally {
      setSummoningDybbuk(false);
    }
  };

  const handleSummonSchrodinger = async () => {
    const u = getStoredUser();
    if (!u) return;
    setSummoningSchrodinger(true);
    try {
      await summonSchrodingerLetter({
        userId: u.id || u._id,
        tone
      });
      setActionMsg(`⚛️ A Schrödinger Quantum Box (${tone === 'modern' ? 'Modern' : 'Classical'}) has manifested in thy Mailbox!`);
      setTimeout(() => setActionMsg(null), 5000);
      fetchMyMailbox();
    } catch (e: any) {
      alert(e.message || "Failed to summon Schrödinger Box");
    } finally {
      setSummoningSchrodinger(false);
    }
  };

  const handleTriggerCollapse = (letter: any) => {
    setCollapsingLetter(letter);
    setCollapseStep('superposition');
    setCollapsedResult(null);
  };

  const executeWavefunctionCollapse = async () => {
    if (!collapsingLetter) return;
    setCollapseStep('collapsing');
    try {
      const res = await collapseSchrodingerLetter(collapsingLetter._id);
      setTimeout(() => {
        setCollapsedResult(res);
        setCollapseStep('collapsed');
        fetchMyMailbox();
      }, 1600);
    } catch (e: any) {
      alert(e.message || "Failed to collapse quantum wavefunction");
      setCollapseStep('superposition');
    }
  };

  const handleToggleRead = async (id: string, currentReadState: boolean) => {
    try {
      await toggleLetterRead(id, !currentReadState);
      setMyMailbox(prev => prev.map(l => l._id === id ? { ...l, isRead: !currentReadState, firstReadAt: !currentReadState ? Date.now() : undefined } : l));
    } catch (e: any) {
      alert(e.message || 'Failed to update read state');
    }
  };

  const handleBatchMarkRead = async (isRead: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await batchMarkRead(selectedIds, isRead);
      setActionMsg(`Marked ${selectedIds.length} missives as ${isRead ? 'read' : 'unread'}.`);
      setTimeout(() => setActionMsg(null), 3500);
      setMyMailbox(prev => prev.map(l => selectedIds.includes(l._id) ? { ...l, isRead, firstReadAt: isRead ? Date.now() : undefined } : l));
      setSelectedIds([]);
    } catch (e: any) {
      alert(e.message || 'Failed to batch update');
    }
  };

  const handleBatchTrash = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Move ${selectedIds.length} selected missives to thy Guild Wastebin?`)) return;
    try {
      await batchTrashLetters(selectedIds);
      setActionMsg(`Moved ${selectedIds.length} missives to thy Wastebin.`);
      setTimeout(() => setActionMsg(null), 3500);
      setMyMailbox(prev => prev.filter(l => !selectedIds.includes(l._id)));
      setSelectedIds([]);
      fetchMyMailbox();
    } catch (e: any) {
      alert(e.message || 'Failed to trash selected missives');
    }
  };

  const handleBatchAbandon = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Abandon ${selectedIds.length} selected missives to The Dead Letter Office? They will be deposited in the public realm archive for anyone to read.`)) return;
    try {
      await batchAbandonLetters(selectedIds);
      setActionMsg(`Released ${selectedIds.length} missives to The Dead Letter Office.`);
      setTimeout(() => setActionMsg(null), 4000);
      setMyMailbox(prev => prev.filter(l => !selectedIds.includes(l._id)));
      setSelectedIds([]);
      fetchMyMailbox();
    } catch (e: any) {
      alert(e.message || "Failed to batch abandon missives.");
    }
  };

  const handleAbandonLetter = async (id: string) => {
    if (!window.confirm("Abandon this missive to The Dead Letter Office? It will be released into the public archive for all realm scholars to read.")) return;
    try {
      await abandonLetter(id);
      setActionMsg("Missive forsaken and released to The Dead Letter Office.");
      setTimeout(() => setActionMsg(null), 4000);
      setMyMailbox(prev => prev.filter(l => l._id !== id));
      fetchMyMailbox();
    } catch (e: any) {
      alert(e.message || "Failed to abandon missive.");
    }
  };

  const handleRemoveInboxLetter = async (id: string) => {
    if (!window.confirm("Move this missive to thy Guild Wastebin?")) return;
    try {
      await removeLetterToTrash(id);
      setActionMsg("Missive removed to thy Wastebin.");
      setTimeout(() => setActionMsg(null), 3500);
      fetchMyMailbox();
    } catch (e: any) {
      alert(e.message || "Failed to remove missive.");
    }
  };

  const startFadeTimer = (letterId: string, readAtMs: number, burnTimerSeconds: number = 60) => {
    if (burnTimerRef.current) window.clearInterval(burnTimerRef.current);
    const durationMs = (burnTimerSeconds || 60) * 1000;
    burnTimerRef.current = window.setInterval(async () => {
      const progress = Math.min(1, (Date.now() - readAtMs) / durationMs); 
      setFadeProgress(progress);
      if (progress >= 1) { 
        if (burnTimerRef.current) window.clearInterval(burnTimerRef.current); 
        try { await burnLetter(letterId); } catch (e) {} 
        setOpenLetter(null); 
        fetchMyMailbox(); 
      }
    }, 200);
  };

  const openLetterView = async (letter: any) => {
    waxSealAudio.playWaxCrack();
    setTimeout(() => {
      waxSealAudio.playParchmentUnroll();
    }, 180);
    setOpenLetter(letter); 
    setIsClosingScroll(false);
    setFadeProgress(0);

    // Auto mark as read in background only if unlocked
    const isLocked = letter.scheduledFor && new Date(letter.scheduledFor).getTime() > Date.now();
    if (!isLocked && !letter.isRead && !letter.firstReadAt && letter._id) {
      try {
        await markLetterRead(letter._id);
        setMyMailbox(prev => prev.map(l => l._id === letter._id ? { ...l, isRead: true, firstReadAt: Date.now() } : l));
      } catch (_) {}
    }

    if (!isLocked && letter.burnAfterReading && letter.status === 'delivered') { 
      try { 
        const updated = await markLetterRead(letter._id); 
        startFadeTimer(letter._id, new Date(updated.firstReadAt).getTime(), letter.burnTimerSeconds || 60); 
      } catch (e) { 
        setOpenLetter(null); 
        fetchMyMailbox(); 
      } 
    }
  };

  const handleCloseLetter = () => {
    setIsClosingScroll(true);
    waxSealAudio.playParchmentUnroll();
    setTimeout(() => {
      waxSealAudio.playWaxStampThud();
    }, 220);
    setTimeout(() => {
      setOpenLetter(null);
      setIsClosingScroll(false);
      fetchMyMailbox();
    }, 550);
  };

  const filteredMailbox = myMailbox.filter(l => 
    l.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.senderRef?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.spectralSender?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.bottleMoniker?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMailbox.length && filteredMailbox.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMailbox.map(l => l._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const displayedMailbox = filteredMailbox.slice(0, visibleCount);

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-4xl mx-auto space-y-6">
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
        background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 pb-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-2 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              <span>📬 The Realm Mailbox</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-wide flex items-center gap-3" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
              <Inbox className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--antique-gold)' }} />
              Thy Sovereign Mailbox
            </h2>
            <p className="text-sm sm:text-base italic mt-1" style={{ color: 'var(--gold-muted)' }}>
              Missives delivered to thee by royal couriers across the realm (Latest to Oldest).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Language Tone Mode Selector */}
            <div className="inline-flex items-center p-1 rounded-sm shadow-inner" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 text-amber-300" style={{ fontFamily: "'Cinzel', serif" }}>Tone:</span>
              <button
                onClick={() => setTone('classical')}
                className={`px-2 py-0.5 text-xs font-bold rounded-sm transition-all ${tone === 'classical' ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'}`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Classical
              </button>
              <button
                onClick={() => setTone('modern')}
                className={`px-2 py-0.5 text-xs font-bold rounded-sm transition-all ${tone === 'modern' ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'}`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Modern
              </button>
            </div>

            <Link to="/trash" className="btn-gold-saloon text-xs py-2 px-4 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-amber-500" /> Wastebin
            </Link>
            <Link to="/" className="btn-velvet-burgundy text-xs py-2 px-4">
              ← Thy Ledger
            </Link>
          </div>
        </div>

        {/* Feature 25, 26, & Bottle: Thematic Portals (Dybbuk, Schrödinger & Ocean Bottle) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 mb-5 sm:mb-6">
          {/* Dybbuk Astral Realm Panel */}
          <div className="p-3 sm:p-4 md:p-5 rounded-sm text-purple-100 relative overflow-hidden animate-glow-pulse flex flex-col justify-between" style={{
            background: 'linear-gradient(135deg, rgba(46,16,66,0.92) 0%, rgba(20,10,32,0.96) 100%)',
            border: '1px solid rgba(168,85,247,0.45)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div className="space-y-1 sm:space-y-2 relative z-10">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Ghost className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-pulse" />
                <span className="font-bold text-xs sm:text-sm tracking-wide text-purple-200" style={{ fontFamily: "'Cinzel', serif" }}>
                  The Astral Veil
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200/80 leading-relaxed italic line-clamp-1 sm:line-clamp-none">
                {tone === 'modern'
                  ? 'Spectral transmissions analyzing your recent messages.'
                  : 'Phantom scribes craft personalized missives from beyond the veil.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 pt-2 sm:pt-3 relative z-10">
              <Link
                to="/dybbuk"
                className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-sm font-bold text-[11px] sm:text-xs shadow border flex items-center gap-1"
                style={{ background: '#581C87', color: '#F3E8FF', border: '1px solid #A855F7', fontFamily: "'Cinzel', serif" }}
              >
                <span>🔮 Room</span>
              </Link>

              <button
                onClick={handleSummonDybbuk}
                disabled={summoningDybbuk}
                className="flex-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-sm font-bold text-[11px] sm:text-xs shadow flex items-center justify-center gap-1"
                style={{
                  background: 'linear-gradient(135deg, #7E22CE 0%, #581C87 100%)',
                  color: '#FFF',
                  border: '1px solid rgba(192,132,252,0.5)',
                  fontFamily: "'Cinzel', serif"
                }}
              >
                <Sparkles className={`w-3 h-3 text-purple-200 ${summoningDybbuk ? 'animate-spin' : ''}`} />
                {summoningDybbuk ? 'Summoning...' : 'Summon'}
              </button>

              <button
                onClick={handleToggleDybbukMode}
                className="px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-sm font-bold text-[10px] sm:text-[11px] shadow border flex items-center gap-1"
                style={{
                  background: dybbukMode ? '#047857' : 'rgba(255,253,249,0.06)',
                  color: dybbukMode ? '#FFF' : 'var(--parchment-dark)',
                  border: dybbukMode ? '1px solid #10B981' : '1px solid rgba(212,175,55,0.3)',
                  fontFamily: "'Cinzel', serif"
                }}
              >
                <span>{dybbukMode ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Schrödinger Quantum Paradox Panel */}
          <div className="p-3 sm:p-4 md:p-5 rounded-sm text-sky-100 relative overflow-hidden animate-glow-pulse flex flex-col justify-between" style={{
            background: 'linear-gradient(135deg, rgba(9,19,31,0.95) 0%, rgba(6,11,18,0.98) 100%)',
            border: '1px solid rgba(56,189,248,0.45)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div className="space-y-1 sm:space-y-2 relative z-10">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Atom className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 animate-spin" />
                <span className="font-bold text-xs sm:text-sm tracking-wide text-sky-200" style={{ fontFamily: "'Cinzel', serif" }}>
                  Quantum Paradox
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-sky-200/80 leading-relaxed italic line-clamp-1 sm:line-clamp-none">
                {tone === 'modern'
                  ? 'Multi-mood missives locked in superposition.'
                  : 'Multi-mood missives collapsing on observation.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 pt-2 sm:pt-3 relative z-10">
              <Link
                to="/schrodinger"
                className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-sm font-bold text-[11px] sm:text-xs shadow border flex items-center gap-1"
                style={{ background: '#0369A1', color: '#F0F9FF', border: '1px solid #38BDF8', fontFamily: "'Cinzel', serif" }}
              >
                <span>⚛️ Vault</span>
              </Link>

              <button
                onClick={handleSummonSchrodinger}
                disabled={summoningSchrodinger}
                className="flex-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-sm font-bold text-[11px] sm:text-xs shadow flex items-center justify-center gap-1"
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#FFF',
                  border: '1px solid rgba(56,189,248,0.5)',
                  fontFamily: "'Cinzel', serif"
                }}
              >
                <Box className={`w-3 h-3 text-sky-200 ${summoningSchrodinger ? 'animate-bounce' : ''}`} />
                {summoningSchrodinger ? 'Manifesting...' : 'Manifest'}
              </button>
            </div>
          </div>

          {/* Message in a Bottle Panel */}
          <div className="p-3 sm:p-4 md:p-5 rounded-sm text-emerald-100 relative overflow-hidden animate-glow-pulse flex flex-col justify-between" style={{
            background: 'linear-gradient(135deg, rgba(7,30,22,0.95) 0%, rgba(4,16,12,0.98) 100%)',
            border: '1px solid rgba(52,211,153,0.45)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div className="space-y-1 sm:space-y-2 relative z-10">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Waves className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="font-bold text-xs sm:text-sm tracking-wide text-emerald-200" style={{ fontFamily: "'Cinzel', serif" }}>
                  Message in a Bottle
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/80 leading-relaxed italic line-clamp-1 sm:line-clamp-none">
                Anonymous corked parchment cast into open tides with geographic decay.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-3 relative z-10">
              <Link
                to="/bottle"
                className="w-full px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-sm font-bold text-[11px] sm:text-xs shadow border flex items-center justify-center gap-1"
                style={{ background: '#065F46', color: '#ECFDF5', border: '1px solid #10B981', fontFamily: "'Cinzel', serif" }}
              >
                <Waves className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>🌊 Ocean Shore & Scriptorium</span>
              </Link>
            </div>
          </div>
        </div>

        {actionMsg && (
          <div className="p-3.5 mb-5 rounded-sm text-sm font-bold flex items-center gap-2 shadow-md animate-curtain-reveal" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--parchment-light)', border: '1px solid var(--antique-gold)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--antique-gold)' }} /> {actionMsg}
          </div>
        )}

        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search missives by sender or content keywords..." 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(5); }} 
            className="w-full p-3.5 rounded-sm text-base sm:text-lg font-serif italic focus:outline-none transition-all shadow-inner"
            style={{
              background: '#FFFDF9',
              color: '#1A1A1A',
              border: '1px solid var(--border-subtle)'
            }}
          />
        </div>

        {/* ── Selection & Multi-Batch Action Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
            >
              {selectedIds.length === filteredMailbox.length && filteredMailbox.length > 0 ? (
                <><CheckSquare className="w-3.5 h-3.5 text-amber-300" /> Deselect All</>
              ) : (
                <><Square className="w-3.5 h-3.5" /> Select All ({filteredMailbox.length})</>
              )}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs font-mono font-bold text-amber-300">
                ✦ {selectedIds.length} Selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBatchMarkRead(true)}
                className="btn-gold-saloon text-[11px] py-1.5 px-3"
              >
                Mark Read
              </button>
              <button
                onClick={() => handleBatchMarkRead(false)}
                className="btn-gold-saloon text-[11px] py-1.5 px-3"
              >
                Mark Unread
              </button>
              <button
                onClick={handleBatchAbandon}
                className="btn-gold-saloon text-[11px] py-1.5 px-3 flex items-center gap-1"
                style={{ background: '#78350F', color: '#FEF3C7', border: '1px solid #D97706' }}
                title="Abandon selected missives to The Dead Letter Office public archive"
              >
                <Archive className="w-3 h-3 text-amber-300" /> Abandon ({selectedIds.length})
              </button>
              <button
                onClick={handleBatchTrash}
                className="btn-velvet-burgundy text-[11px] py-1.5 px-3 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3 text-amber-400" /> Move to Wastebin
              </button>
            </div>
          )}
        </div>

        {myMailbox.length === 0 ? (
          <div className="p-12 text-center rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold-muted)' }}>
            <Inbox className="w-12 h-12 mx-auto mb-2 opacity-60" style={{ color: 'var(--antique-gold)' }} />
            <p className="font-bold text-lg" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>Thy mailbox is currently empty.</p>
            <p className="text-sm mt-1 italic font-serif">Missives delivered by royal mailmen, summoned from the astral veil, or washed ashore in corked glass bottles will appear here.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayedMailbox.map((l: any, i) => {
                const isDybbuk = l.type === 'dybbuk' || l.type === 'dibbyuk';
                const isSchrodinger = l.type === 'schrodinger';
                const isBottle = l.type === 'bottle';
                const isSuperposition = isSchrodinger && l.schrodingerState === 'superposition';
                const isRead = l.isRead || !!l.firstReadAt;
                const isSelected = selectedIds.includes(l._id);
                const senderNameStr = isDybbuk 
                  ? (l.spectralSender?.name || 'Spectral Entity') 
                  : (isBottle ? (l.isAnonymous ? 'An Anonymous Mariner' : (l.senderRef?.name || 'A Sailor')) : (l.senderRef?.name || ''));
                const isFromAdmin = !isDybbuk && !isSchrodinger && !isBottle && (l.senderRef?.role === 'admin' || senderNameStr.toLowerCase().includes('guild master') || senderNameStr.toLowerCase().includes('admin'));
                const displaySender = isDybbuk 
                  ? senderNameStr 
                  : (isFromAdmin ? 'The Guild Master' : (senderNameStr || 'A Scholar of the Realm'));

                return (
                <div 
                  key={l._id || i} 
                  className="theatrical-card p-5 rounded-sm transition-all"
                  style={{
                    background: isDybbuk 
                      ? 'linear-gradient(145deg, rgba(38,18,58,0.85) 0%, rgba(18,10,28,0.95) 100%)' 
                      : isSuperposition 
                        ? 'linear-gradient(145deg, rgba(9,19,31,0.95) 0%, rgba(6,11,18,0.98) 100%)'
                        : isBottle
                          ? 'linear-gradient(145deg, rgba(6,36,26,0.95) 0%, rgba(3,18,13,0.98) 100%)'
                          : 'linear-gradient(145deg, #24201C 0%, #151311 100%)',
                    border: isSelected
                      ? '2px solid var(--antique-gold)'
                      : isDybbuk 
                        ? '1px solid rgba(168,85,247,0.5)' 
                        : isSuperposition 
                          ? '1px solid rgba(56,189,248,0.6)' 
                          : isBottle
                            ? '1px solid rgba(52,211,153,0.6)'
                            : '1px solid rgba(212,175,55,0.25)',
                    boxShadow: isSelected ? '0 0 20px rgba(212,175,55,0.3)' : isSuperposition ? '0 0 20px rgba(56,189,248,0.2)' : isBottle ? '0 0 20px rgba(52,211,153,0.2)' : 'none'
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleSelect(l._id)}
                        className="mt-1 p-1 text-stone-400 hover:text-amber-300 transition-colors flex-shrink-0"
                        title={isSelected ? "Deselect" : "Select"}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-amber-300" /> : <Square className="w-5 h-5" />}
                      </button>

                      <div>
                        <p className="font-bold flex items-center flex-wrap gap-2 text-base sm:text-lg" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                          {/* Read / Unread Badge */}
                          <span className={`text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full ${
                            isRead ? 'bg-stone-800 text-stone-300 border border-stone-600' : 'bg-amber-500/25 text-amber-300 border border-amber-400 animate-pulse'
                          }`}>
                            {isRead ? '✓ Read' : '✦ Unread'}
                          </span>

                          {isDybbuk ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: '#581C87', color: '#E9D5FF' }}>
                                <Ghost className="w-3.5 h-3.5 text-purple-300" /> Dybbuk Spectral
                              </span>
                              <span>Missive from {displaySender}</span>
                            </>
                          ) : isSchrodinger ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-quantum-wave" style={{
                                background: isSuperposition ? '#0284C7' : '#047857',
                                color: '#FFF'
                              }}>
                                <Atom className="w-3.5 h-3.5 text-sky-200 animate-spin" />
                                {isSuperposition ? `⚛️ Quantum Superposition (${l.schrodingerVariants?.length || 3} States)` : `✦ Collapsed: ${l.collapsedVariant?.label || 'Reality Chosen'}`}
                              </span>
                              <span>Schrödinger Missive from {displaySender}</span>
                            </>
                          ) : isBottle ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: '#065F46', color: '#ECFDF5', border: '1px solid #10B981' }}>
                                <Waves className="w-3.5 h-3.5 text-emerald-300" /> Washed Ashore Bottle
                              </span>
                              <span>{l.bottleMoniker || 'Ocean Bottle'}</span>
                            </>
                          ) : (
                            `Letter from ${displaySender}`
                          )}

                          {(l.isTorn || l.status === 'torn') && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-700 animate-pulse">
                              <Scissors className="w-3.5 h-3.5 text-red-400" /> Torn Missive
                            </span>
                          )}

                          {l.burnAfterReading && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: 'rgba(107,29,42,0.6)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.4)' }}>
                              <Flame className="w-3.5 h-3.5 text-orange-400" /> 
                              Burns in {l.burnTimerSeconds ? (l.burnTimerSeconds >= 60 ? Math.round(l.burnTimerSeconds / 60) + ' min' : l.burnTimerSeconds + 's') : '60s'}
                            </span>
                          )}

                          {l.scheduledFor && new Date(l.scheduledFor).getTime() > Date.now() && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-950 text-amber-200 border border-amber-500/60 animate-pulse font-mono">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Sealed Until {new Date(l.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </p>
                        <p className="text-xs sm:text-sm italic mt-1" style={{ color: 'var(--gold-muted)' }}>
                          {isDybbuk ? (
                            <span>Spectral Realm: <strong className="text-purple-300">{l.spectralSender?.realmOrigin || 'The Astral Veil'}</strong> • Title: {l.spectralSender?.title || 'Unknown'}</span>
                          ) : isSchrodinger ? (
                            <span>Quantum State: <strong className="text-sky-300">{l.schrodingerState || 'superposition'}</strong> • {new Date(l.createdAt).toLocaleDateString()}</span>
                          ) : isBottle ? (
                            <span>Drifted <strong className="text-emerald-300">{l.bottleDrift?.distanceKm || 0} km</strong> across ocean swells • Sealed with {l.bottleWaxColor || 'gold'} wax</span>
                          ) : (l.isTorn || l.status === 'torn') ? (
                            <span className="text-red-300 font-bold">⚠️ Delivered Damaged • Torn during transit intercept challenge</span>
                          ) : (
                            <span>Delivered {l.deliveredAt ? new Date(l.deliveredAt).toLocaleDateString() : new Date(l.createdAt).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {l.status !== 'burned' && !isFromAdmin && !isDybbuk && (
                        <button 
                          onClick={() => setReportingUser({
                            _id: l.senderRef?._id || l.senderRef || 'anonymous',
                            name: isBottle ? (l.isAnonymous ? `Anonymous Bottle ("${l.bottleMoniker || 'Ocean Relic'}")` : (l.senderRef?.name || 'Mariner')) : (l.senderRef?.name || 'Scribe'),
                            letterId: l._id,
                            isBottle: isBottle
                          })} 
                          className="px-2.5 py-1.5 bg-red-950 text-red-300 rounded-sm text-xs font-bold shadow hover:bg-red-900 flex items-center gap-1 border border-red-800" 
                          style={{ fontFamily: "'Cinzel', serif" }}
                          title="Report this missive to the Guild Master Tribunal"
                        >
                          <AlertTriangle className="w-3.5 h-3.5"/>
                        </button>
                      )}

                      {isSuperposition ? (
                        <button
                          onClick={() => handleTriggerCollapse(l)}
                          className="btn-quantum text-xs py-1.5 px-3 flex items-center gap-1.5 animate-quantum-wave"
                        >
                          <Eye className="w-3.5 h-3.5" /> Observe Box
                        </button>
                      ) : l.status !== 'burned' && (
                        <button 
                          onClick={async () => {
                            if (isBottle && l.bottleDrift?.driftStatus !== 'uncorked') {
                              try { await uncorkBottleMessage(l._id); } catch(e) {}
                            }
                            openLetterView(l);
                          }} 
                          className={l.scheduledFor && new Date(l.scheduledFor).getTime() > Date.now() ? 'btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shadow-md' : isDybbuk ? 'btn-astral text-xs py-1.5 px-3' : isBottle ? 'btn-quantum text-xs py-1.5 px-3' : 'btn-velvet-burgundy text-xs py-1.5 px-3'}
                          style={isBottle ? { background: '#065F46', border: '1px solid #10B981' } : {}}
                        >
                          {l.scheduledFor && new Date(l.scheduledFor).getTime() > Date.now() ? (
                            <><Lock className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> <span>⏳ Sealed Capsule</span></>
                          ) : isDybbuk ? (
                            '✦ Unveil Spectral'
                          ) : isSchrodinger ? (
                            '✦ Read Collapsed'
                          ) : isBottle ? (
                            '✦ Uncork & Read'
                          ) : (
                            '✦ Read Missive'
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleRead(l._id, isRead)}
                        className="btn-gold-saloon text-[11px] py-1.5 px-2.5 font-bold"
                        title={isRead ? "Mark as Unread" : "Mark as Read"}
                      >
                        {isRead ? "Mark Unread" : "Mark Read"}
                      </button>

                      <button 
                        onClick={() => handleAbandonLetter(l._id)} 
                        className="btn-gold-saloon text-xs py-1.5 px-2.5 flex items-center gap-1" 
                        style={{ color: '#FCD34D' }}
                        title="Abandon to The Dead Letter Office (Public Realm Archive)"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button 
                        onClick={() => openStoryHeraldStudio(l)} 
                        className="btn-gold-saloon text-xs py-1.5 px-2.5 flex items-center gap-1"
                        style={{
                          background: 'rgba(212,175,55,0.15)',
                          color: 'var(--antique-gold)',
                          border: '1px solid rgba(212,175,55,0.4)'
                        }}
                        title="Proclaim 9:16 Royal Story Herald"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Herald</span>
                      </button>

                      <button onClick={() => handleRemoveInboxLetter(l._id)} className="btn-gold-saloon text-xs py-1.5 px-2.5 flex items-center gap-1" title="Move to Wastebin">
                        <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </div>
                  </div>
                  {l.status === 'burned' && (
                    <div className="mt-3 p-4 rounded-sm text-center italic flex items-center justify-center gap-2" style={{ background: 'rgba(0,0,0,0.5)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold-muted)' }}>
                      <Flame className="w-5 h-5 text-orange-400" /> {l.content}
                    </div>
                  )}
                </div>
              )})}
            </div>

            {/* ── Pagination / Load More Controls ── */}
            <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(212,175,55,0.25)' }}>
              <p className="text-xs sm:text-sm font-mono" style={{ color: 'var(--gold-muted)' }}>
                Showing <strong className="text-amber-300">{Math.min(visibleCount, filteredMailbox.length)}</strong> of <strong className="text-amber-300">{filteredMailbox.length}</strong> missives (Latest to Oldest)
              </p>
              
              <div className="flex flex-wrap items-center gap-2.5">
                {visibleCount < filteredMailbox.length && (
                  <button
                    onClick={() => setVisibleCount(c => c + 5)}
                    className="btn-gold-saloon text-xs py-2 px-5 shadow"
                  >
                    See More (+5 Missives)
                  </button>
                )}
                {visibleCount < filteredMailbox.length && (
                  <button
                    onClick={() => setVisibleCount(filteredMailbox.length)}
                    className="btn-velvet-burgundy text-xs py-2 px-5 shadow font-bold"
                  >
                    SEE ALL ({filteredMailbox.length})
                  </button>
                )}
                {visibleCount >= filteredMailbox.length && filteredMailbox.length > 5 && (
                  <button
                    onClick={() => setVisibleCount(5)}
                    className="btn-gold-saloon text-xs py-2 px-4 shadow opacity-80 hover:opacity-100"
                  >
                    Show Less (First 5)
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Wavefunction Collapse Modal for Schrödinger Letters */}
      <AnimatePresence>
        {collapsingLetter && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          >
            <div className="quantum-card p-6 sm:p-10 max-w-lg w-full relative rounded-sm shadow-2xl text-center" style={{ border: '2px solid #38BDF8' }}>
              <button 
                onClick={() => setCollapsingLetter(null)} 
                className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>

              {collapseStep === 'superposition' && (
                <div className="space-y-5">
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-sky-900/40 border-2 border-sky-400 animate-quantum-wave">
                    <Box className="w-8 h-8 text-sky-300 animate-bounce" />
                  </div>

                  <h3 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
                    Schrödinger's Sealed Quantum Box
                  </h3>

                  <p className="text-sm italic leading-relaxed" style={{ color: '#BAE6FD' }}>
                    This missive exists across <strong className="text-sky-300">{collapsingLetter.schrodingerVariants?.length || 3} alternate reality timelines</strong>. Breaking the seal forces the quantum wave to collapse into 1 permanent truth!
                  </p>

                  <div className="p-4 rounded-sm text-left space-y-2 text-xs" style={{ background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <p className="font-bold text-sky-300 uppercase tracking-wider font-mono">Possible Dimensional States:</p>
                    {(collapsingLetter.schrodingerVariants || []).map((v: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-300">
                        <span>⚛️ State {idx + 1}:</span>
                        <strong className="text-sky-200">{v.label}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={executeWavefunctionCollapse}
                      className="btn-quantum text-sm py-3 px-8 w-full justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>✦ Break Seal & Observe (Collapse Wavefunction)</span>
                    </button>
                  </div>
                </div>
              )}

              {collapseStep === 'collapsing' && (
                <div className="py-12 space-y-6 animate-collapse-flash">
                  <Atom className="w-20 h-20 mx-auto text-sky-400 animate-spin" />
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#F0F9FF' }}>
                    Collapsing Multiverse Wavefunction...
                  </h3>
                  <p className="text-xs sm:text-sm italic font-mono text-sky-300">
                    Locking quantum eigenvalues into observable reality...
                  </p>
                </div>
              )}

              {collapseStep === 'collapsed' && collapsedResult && (
                <div className="space-y-5 animate-curtain-reveal">
                  <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-emerald-900/40 border-2 border-emerald-400 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-emerald-300" />
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded-sm" style={{ background: '#047857', color: '#FFF', fontFamily: "'Cinzel', serif" }}>
                      ✦ Reality Committed
                    </span>
                    <h3 className="text-2xl font-bold mt-2" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                      Timeline: {collapsedResult.collapsedVariant?.label}
                    </h3>
                  </div>

                  <div 
                    className="p-5 rounded-sm whitespace-pre-wrap text-left shadow-inner max-h-72 overflow-y-auto leading-relaxed"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      background: '#FFFDF9',
                      color: '#1A1A1A',
                      border: '1px solid rgba(56,189,248,0.4)',
                      fontSize: '1.15rem'
                    }}
                  >
                    {collapsedResult.collapsedVariant?.content}
                  </div>

                  <div className="text-right pt-2">
                    <button
                      onClick={() => setCollapsingLetter(null)}
                      className="btn-quantum text-xs py-2 px-6"
                    >
                      Commit to Mailbox & Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Modal with Smooth Parchment Scroll Unfurling & Roll-Down Closing Animation */}
      <AnimatePresence>
        {openLetter && openLetter.scheduledFor && new Date(openLetter.scheduledFor).getTime() > Date.now() ? (
          <WaxSealRevealModal
            isOpen={!!openLetter}
            letter={openLetter}
            onClose={() => setOpenLetter(null)}
            onTrash={handleRemoveInboxLetter}
            onReport={(letObj) => setReportingUser({
              _id: letObj.senderRef?._id || letObj.senderRef || 'anonymous',
              name: letObj.isBottle ? (letObj.isAnonymous ? `Anonymous Bottle ("${letObj.bottleMoniker || 'Ocean Relic'}")` : (letObj.senderRef?.name || 'Mariner')) : (letObj.senderRef?.name || 'Scribe'),
              letterId: letObj._id,
              isBottle: letObj.type === 'bottle'
            })}
          />
        ) : openLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
            <div className={`max-w-lg w-full relative ${isClosingScroll ? 'animate-scroll-roll-close' : 'animate-scroll-unroll'}`}>
              {/* Top Wooden Rod */}
              <div className="scroll-rod-top" />

              <div className={`parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl ${openLetter.isTorn || openLetter.status === 'torn' ? 'torn-missive-ragged' : ''}`}>
                <button onClick={handleCloseLetter} className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1 transition-colors"><X className="w-6 h-6" /></button>
                
                {(openLetter.isTorn || openLetter.status === 'torn') ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Scissors className="w-6 h-6 text-red-700 animate-pulse" />
                        <h3 className="text-xl sm:text-2xl font-bold font-serif" style={{ color: '#7F1D1D', fontFamily: "'Cinzel', serif" }}>
                          ⚠️ Torn Missive (Damaged in Transit)
                        </h3>
                      </div>
                      <p className="text-xs italic mb-4 text-red-800 font-serif">
                        From: <span className="font-bold">{openLetter.senderRef?.name || 'A Scribe'}</span> • The sender attempted to recall this missive through the Postmaster's Riddle, but failed—leaving the parchment torn directly down the middle.
                      </p>
                    </div>

                    {/* Middle Torn Parchment Fissure UI */}
                    <div className="letter-middle-tear-fissure">
                      {/* Left Torn Half */}
                      <div 
                        style={{
                          fontFamily: getFontFamily(openLetter.font),
                          background: 'rgba(255, 252, 245, 0.95)',
                          color: '#2A1408',
                          border: '1px solid rgba(185, 28, 28, 0.45)'
                        }}
                        className={`flex-1 p-3.5 shadow-xl torn-rip-left torn-half-left overflow-hidden relative ${getFontSizeClass(openLetter.fontSize)}`}
                      >
                        <div className="border-b border-red-800/30 pb-1 mb-2 flex items-center justify-between text-[9px] font-mono text-red-800 font-bold">
                          <span>[LEFT TORN SECTION]</span>
                          <span>⚠️ RIPPED</span>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed opacity-95 overflow-hidden max-h-80 text-left">
                          {openLetter.content}
                        </div>
                      </div>

                      {/* Right Torn Half */}
                      <div 
                        style={{
                          fontFamily: getFontFamily(openLetter.font),
                          background: 'rgba(255, 252, 245, 0.95)',
                          color: '#2A1408',
                          border: '1px solid rgba(185, 28, 28, 0.45)'
                        }}
                        className={`flex-1 p-3.5 shadow-xl torn-rip-right torn-half-right overflow-hidden relative ${getFontSizeClass(openLetter.fontSize)}`}
                      >
                        <div className="border-b border-red-800/30 pb-1 mb-2 flex items-center justify-between text-[9px] font-mono text-red-800 font-bold">
                          <span>[RIGHT TORN SECTION]</span>
                          <span>DAMAGED</span>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed opacity-95 overflow-hidden max-h-80 text-left">
                          {openLetter.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (openLetter.type === 'dybbuk' || openLetter.type === 'dibbyuk') ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Ghost className="w-6 h-6 text-purple-700 animate-pulse" />
                      <h3 className="text-xl sm:text-2xl font-bold font-serif" style={{ color: '#2E1065', fontFamily: "'Cinzel', serif" }}>
                        Spectral Dybbuk Missive
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4" style={{ color: '#7E22CE' }}>
                      From: <span className="font-bold">{openLetter.spectralSender?.name || 'A Whispering Shade'}</span> ({openLetter.spectralSender?.title || 'Unknown'}) • Realm: {openLetter.spectralSender?.realmOrigin || 'The Astral Veil'}
                    </p>
                  </div>
                ) : openLetter.type === 'schrodinger' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Atom className="w-6 h-6 text-sky-700 animate-spin" />
                      <h3 className="text-xl sm:text-2xl font-bold font-serif" style={{ color: '#0C4A6E', fontFamily: "'Cinzel', serif" }}>
                        {openLetter.collapsedVariant ? `Timeline: ${openLetter.collapsedVariant.label}` : "Schrödinger's Paradox Missive"}
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4" style={{ color: '#0284C7' }}>
                      From: <span className="font-bold">{openLetter.senderRef?.name || 'A Scholar'}</span> • Observed Reality: {openLetter.collapsedVariant?.label || 'Locked'}
                    </p>
                  </div>
                ) : openLetter.type === 'bottle' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Waves className="w-6 h-6 text-emerald-700 animate-pulse" />
                      <h3 className="text-xl sm:text-2xl font-bold font-serif" style={{ color: '#064E3B', fontFamily: "'Cinzel', serif" }}>
                        {openLetter.bottleMoniker || 'Ocean Bottle Missive'}
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4 text-emerald-800">
                      Origin: <span className="font-bold">{openLetter.isAnonymous ? 'An Anonymous Soul' : (openLetter.senderRef?.name || 'A Sailor')}</span> • Drifted: {openLetter.bottleDrift?.distanceKm || 0} km across open tides
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 font-serif" style={{ color: '#3A1F04', fontFamily: "'Cinzel', serif" }}>
                      Letter from {(openLetter.senderRef?.role === 'admin' || (openLetter.senderRef?.name || '').toLowerCase().includes('guild master') || (openLetter.senderRef?.name || '').toLowerCase().includes('admin')) ? 'The Guild Master' : (openLetter.senderRef?.name || 'Unknown')}
                    </h3>
                  </>
                )}

                {openLetter.burnAfterReading && (
                  <p className="text-red-700 text-sm italic mb-4 flex items-center gap-1.5 font-semibold">
                    <Flame className="w-4 h-4 text-orange-600 animate-bounce" /> This missive dissolves into ash as thou readeth — {Math.max(0, Math.ceil((openLetter.burnTimerSeconds || 60) * (1 - fadeProgress)))}s remain.
                  </p>
                )}

                {!openLetter.isTorn && openLetter.status !== 'torn' && (
                  <motion.div 
                    animate={{ opacity: openLetter.burnAfterReading ? 1 - fadeProgress : 1 }} 
                    style={{
                      fontFamily: getFontFamily(openLetter.font),
                      background: 'rgba(255, 255, 255, 0.75)',
                      color: '#1A1A1A',
                      border: '1px solid rgba(160, 120, 60, 0.3)'
                    }}
                    className={`p-5 rounded-sm whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto leading-relaxed ${getFontSizeClass(openLetter.fontSize)}`}
                  >
                    {openLetter.content}
                  </motion.div>
                )}

                {openLetter.burnAfterReading && (
                  <div className="mt-4 w-full bg-stone-300 rounded-full h-2 overflow-hidden border border-orange-500/30">
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 h-2 transition-all duration-300" style={{ width: `${fadeProgress * 100}%` }} />
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  {openLetter.status !== 'burned' && openLetter.senderRef?.role !== 'admin' && (
                    <button
                      onClick={() => {
                        setReportingUser({
                          _id: openLetter.senderRef?._id || openLetter.senderRef || 'anonymous',
                          name: openLetter.type === 'bottle' ? (openLetter.isAnonymous ? `Anonymous Bottle ("${openLetter.bottleMoniker || 'Ocean Relic'}")` : (openLetter.senderRef?.name || 'Mariner')) : (openLetter.senderRef?.name || 'Scribe'),
                          letterId: openLetter._id,
                          isBottle: openLetter.type === 'bottle'
                        });
                      }}
                      className="px-3 py-1.5 bg-red-950 text-red-300 rounded-sm text-xs font-bold shadow hover:bg-red-900 flex items-center gap-1 border border-red-800"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Report Missive
                    </button>
                  )}
                  <button
                    onClick={handleCloseLetter}
                    className="btn-gold-saloon text-xs py-2 px-5 ml-auto"
                  >
                    Roll Up Scroll & Close
                  </button>
                </div>
              </div>

              {/* Bottom Wooden Rod */}
              <div className="scroll-rod-bottom" />
            </div>
          </motion.div>
        )}
        {reportingUser && <ReportModal reportedUser={reportingUser} onClose={() => setReportingUser(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// REAL-TIME DISPATCH TRACKING (Feature 6)
// ============================================
function DispatchTimeline({ letter, onClose }: { letter: any; onClose: () => void }) {
  const isDelivered = letter.status === 'delivered' || letter.status === 'burned';
  const isInTransit = letter.status === 'in-transit' || letter.status === 'in_transit';
  const isDraft = letter.status === 'draft';
  const isTorn = letter.isTorn || letter.status === 'torn';

  // Compute timestamp progression so delivered letters always show complete lifecycle
  const draftedTime = letter.createdAt;
  const sealedTime = letter.sealedAt || (!isDraft ? (letter.pickedUpAt || letter.deliveredAt || letter.createdAt) : null);
  const transitTime = letter.pickedUpAt || (isInTransit || isDelivered || isTorn ? (letter.deliveredAt || letter.sealedAt || letter.createdAt) : null);
  const deliveredTime = letter.deliveredAt || (isDelivered || isTorn ? (letter.updatedAt || letter.createdAt) : null);

  const stages = [
    { 
      key: 'drafted', 
      label: 'DRAFTED IN SCRIPTORIUM', 
      time: draftedTime,
      active: true,
      desc: 'Missive inscribed and preserved in the author\'s parchment records.' 
    },
    { 
      key: 'sealed', 
      label: 'WAX SEALED & STAGED', 
      time: sealedTime,
      active: !isDraft,
      desc: 'Affixed with sovereign wax seal & QR token, awaiting courier acquisition.' 
    },
    { 
      key: 'transit', 
      label: 'CARRIED IN ROYAL SADDLEBAG', 
      time: transitTime,
      active: isInTransit || isDelivered || isTorn || !!letter.pickedUpAt,
      desc: 'Courier has scanned seal and is traversing the realm. (Postmaster Riddle Recall available in this stage)' 
    },
    { 
      key: 'delivered', 
      label: 'SAFELY DELIVERED TO MAILBOX', 
      time: deliveredTime,
      active: isDelivered || isTorn,
      desc: isTorn ? 'Delivered damaged to recipient mailbox after failed recall.' : 'Safely placed into recipient\'s sovereign mailbox.' 
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="theatrical-card p-6 sm:p-8 max-w-md w-full relative shadow-2xl animate-glow-pulse" style={{ border: '2px solid var(--antique-gold)' }}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"><X className="w-6 h-6" /></button>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
          <Clock className="w-6 h-6 text-[var(--antique-gold)]" /> Thy Letter's Odyssey
        </h3>
        <div className="space-y-5">
          {stages.map((s, i) => (
            <div key={s.key} className="flex items-start gap-3.5 relative">
              {i < stages.length - 1 && (
                <div 
                  className="absolute left-[8px] top-6 w-0.5 h-10 transition-colors" 
                  style={{ background: s.active ? 'var(--antique-gold)' : 'rgba(212,175,55,0.2)' }}
                />
              )}
              <div 
                className="w-4 h-4 rounded-full mt-1 flex-shrink-0 transition-all" 
                style={{
                  background: s.active ? 'var(--antique-gold)' : 'transparent',
                  border: s.active ? '2px solid #FFF' : '2px solid rgba(212,175,55,0.35)',
                  boxShadow: s.active ? '0 0 10px rgba(212,175,55,0.6)' : 'none'
                }} 
              />
              <div>
                <p className="font-bold text-sm sm:text-base tracking-wide" style={{ fontFamily: "'Cinzel', serif", color: s.active ? 'var(--parchment-light)' : 'var(--gold-muted)' }}>
                  {s.label}
                </p>
                <p className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                  {s.time ? new Date(s.time).toLocaleString() : (s.active ? 'Active now' : 'Awaiting dispatch...')}
                </p>
                <p className="text-[11px] text-stone-400 font-serif mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// SENT LETTERS (Outbox & Drafts)
// ============================================
function SentLetters() {
  const [myLetters, setMyLetters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdQR, setCreatedQR] = useState('');
  const [trackingLetter, setTrackingLetter] = useState<any>(null);
  const [openLetter, setOpenLetter] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'transit' | 'staged' | 'torn'>('all');
  const [isClosingScroll, setIsClosingScroll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Postmaster's Riddle Recall Modal State
  const [recallingLetter, setRecallingLetter] = useState<any>(null);
  const [riddleData, setRiddleData] = useState<any>(null);
  const [riddleLoading, setRiddleLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [riddleTimeLeft, setRiddleTimeLeft] = useState(90);
  const [submittingRecall, setSubmittingRecall] = useState(false);
  const [recallResult, setRecallResult] = useState<any>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    fetchMyLetters();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'drafts' || tab === 'transit' || tab === 'staged' || tab === 'torn') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const fetchMyLetters = async () => {
    try {
      const data = await getMyLetters();
      const arr = Array.isArray(data) ? data : [];
      // Latest to oldest sort
      arr.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime());
      setMyLetters(arr);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRead = async (id: string, currentReadState: boolean) => {
    try {
      await toggleLetterRead(id, !currentReadState);
      setMyLetters(prev => prev.map(l => l._id === id ? { ...l, isRead: !currentReadState, firstReadAt: !currentReadState ? Date.now() : undefined } : l));
    } catch (e: any) {
      alert(e.message || 'Failed to update read state');
    }
  };

  const handleBatchMarkRead = async (isRead: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await batchMarkRead(selectedIds, isRead);
      setActionMsg(`Marked ${selectedIds.length} missives as ${isRead ? 'read' : 'unread'}.`);
      setTimeout(() => setActionMsg(null), 3500);
      setMyLetters(prev => prev.map(l => selectedIds.includes(l._id) ? { ...l, isRead, firstReadAt: isRead ? Date.now() : undefined } : l));
      setSelectedIds([]);
    } catch (e: any) {
      alert(e.message || 'Failed to batch update');
    }
  };

  const handleBatchTrash = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Move ${selectedIds.length} selected missives to thy Guild Wastebin?`)) return;
    try {
      await batchTrashLetters(selectedIds);
      setActionMsg(`Moved ${selectedIds.length} missives to thy Wastebin.`);
      setTimeout(() => setActionMsg(null), 3500);
      setMyLetters(prev => prev.filter(l => !selectedIds.includes(l._id)));
      setSelectedIds([]);
      fetchMyLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to trash selected missives');
    }
  };

  const handleBatchAbandon = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Abandon ${selectedIds.length} selected dispatched missives to The Dead Letter Office? They will be deposited in the public realm archive for anyone to read.`)) return;
    try {
      await batchAbandonLetters(selectedIds);
      setActionMsg(`Released ${selectedIds.length} missives to The Dead Letter Office.`);
      setTimeout(() => setActionMsg(null), 4000);
      setMyLetters(prev => prev.filter(l => !selectedIds.includes(l._id)));
      setSelectedIds([]);
      fetchMyLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to batch abandon missives.');
    }
  };

  const handleAbandonSentLetter = async (id: string) => {
    if (!window.confirm("Abandon this dispatched missive to The Dead Letter Office? It will be stored in the public archive for all realm scholars to read.")) return;
    try {
      await abandonLetter(id);
      setActionMsg("Missive abandoned and transferred to The Dead Letter Office.");
      setTimeout(() => setActionMsg(null), 4000);
      setMyLetters(prev => prev.filter(l => l._id !== id));
      fetchMyLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to abandon missive.');
    }
  };

  const handleOpenRecallModal = async (letter: any) => {
    setRecallingLetter(letter);
    setRiddleLoading(true);
    setRecallResult(null);
    setSelectedOption(null);
    try {
      const data = await getPostmasterRiddle();
      setRiddleData(data);
      setRiddleTimeLeft(data.timeLimitSeconds || 90);
    } catch (e: any) {
      alert(e.message || "Failed to summon the Postmaster's Riddle");
      setRecallingLetter(null);
    } finally {
      setRiddleLoading(false);
    }
  };

  const handleExecuteRecall = async (isTimeout = false) => {
    if (!recallingLetter || !riddleData || submittingRecall) return;
    if (!isTimeout && selectedOption === null) {
      alert("Pray choose an option before submitting thy answer to the Postmaster!");
      return;
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setSubmittingRecall(true);

    try {
      const user = getStoredUser();
      const res = await attemptRecallLetter(recallingLetter._id, {
        riddleId: riddleData.riddleId,
        selectedOptionIndex: selectedOption !== null ? selectedOption : undefined,
        isTimeout,
        userId: user?.id || user?._id
      });
      if (!res.success || res.outcome === 'torn') {
        waxSealAudio.playPaperTear();
      } else {
        waxSealAudio.playParchmentUnroll();
      }
      setRecallResult(res);
      fetchMyLetters();
    } catch (e: any) {
      alert(e.message || "Failed to process Postmaster's Riddle");
    } finally {
      setSubmittingRecall(false);
    }
  };

  useEffect(() => {
    if (recallingLetter && riddleData && !recallResult && !submittingRecall) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRiddleTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleExecuteRecall(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [recallingLetter, riddleData, recallResult, submittingRecall]);

  const handleRemoveSentLetter = async (id: string, isDraft: boolean) => {
    const promptText = isDraft 
      ? "Move this draft to the Guild Wastebin?" 
      : "Move this sent missive to the Guild Wastebin?";
    if (!window.confirm(promptText)) return;
    setLoading(true);
    try {
      await removeLetterToTrash(id);
      setActionMsg(isDraft ? "Draft moved to Wastebin." : "Sent missive moved to Wastebin.");
      setTimeout(() => setActionMsg(null), 3500);
      fetchMyLetters();
    } catch (e: any) {
      alert(e.message || 'Failed to remove letter');
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = (letter: any) => {
    navigate('/compose', { state: { draft: letter } });
  };

  const handleOpenLetter = async (letter: any) => {
    waxSealAudio.playWaxCrack();
    setTimeout(() => {
      waxSealAudio.playParchmentUnroll();
    }, 180);
    setOpenLetter(letter);
    setIsClosingScroll(false);

    // Auto mark as read in background if not marked
    if (!letter.isRead && !letter.firstReadAt && letter._id) {
      try {
        await markLetterRead(letter._id);
        setMyLetters(prev => prev.map(l => l._id === letter._id ? { ...l, isRead: true, firstReadAt: Date.now() } : l));
      } catch (_) {}
    }
  };

  const handleCloseLetter = () => {
    setIsClosingScroll(true);
    waxSealAudio.playParchmentUnroll();
    setTimeout(() => {
      waxSealAudio.playWaxStampThud();
    }, 220);
    setTimeout(() => {
      setOpenLetter(null);
      setIsClosingScroll(false);
    }, 550);
  };

  // Filtered Letters based on active tab and search query
  const draftsCount = myLetters.filter(l => l.status === 'draft').length;
  const transitCount = myLetters.filter(l => (l.status === 'in-transit' || l.status === 'in_transit') && !l.isTorn).length;
  const stagedCount = myLetters.filter(l => l.status === 'pending' && !l.isTorn).length;
  const tornCount = myLetters.filter(l => l.isTorn || l.status === 'torn').length;

  const filteredLetters = myLetters.filter(l => {
    // Tab filter
    if (activeTab === 'drafts' && l.status !== 'draft') return false;
    if (activeTab === 'transit' && !(l.status === 'in-transit' || l.status === 'in_transit') || (activeTab === 'transit' && l.isTorn)) return false;
    if (activeTab === 'staged' && (l.status !== 'pending' || l.isTorn)) return false;
    if (activeTab === 'torn' && !l.isTorn && l.status !== 'torn') return false;

    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.content?.toLowerCase().includes(q) || 
      (l.receiverRef?.name || l.receiverRef)?.toLowerCase().includes(q) ||
      l.bottleMoniker?.toLowerCase().includes(q)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLetters.length && filteredLetters.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLetters.map(l => l._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const displayedLetters = filteredLetters.slice(0, visibleCount);

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-5xl mx-auto space-y-6">
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden rounded-sm" style={{
        background: `linear-gradient(180deg, rgba(20,17,14,0.85) 0%, rgba(12,10,9,0.96) 100%), url(${manuscriptQuillDesk}) center/cover no-repeat`,
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
      }}>
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 pb-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold mb-2 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              <span>📜 Outbox & Scriptorium Drafts</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-wide flex items-center gap-3" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
              <Send className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--antique-gold)' }} />
              Thy Dispatched Missives
            </h2>
            <p className="text-sm sm:text-base italic mt-1" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
              Preserved drafts, staged epistles, saddlebag deliveries, and dispatched scrolls (Latest to Oldest).
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link to="/trash" className="btn-gold-saloon text-xs py-2 px-4 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-amber-500" /> Wastebin
            </Link>
            <Link to="/" className="btn-velvet-burgundy text-xs py-2 px-4">
              ← Thy Ledger
            </Link>
          </div>
        </div>

        {actionMsg && (
          <div className="p-3.5 mb-5 rounded-sm text-sm font-bold flex items-center gap-2 shadow-md animate-curtain-reveal" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--parchment-light)', border: '1px solid var(--antique-gold)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--antique-gold)' }} /> {actionMsg}
          </div>
        )}

        {/* ── TOP SECTION TABS (Drafts, Saddlebag, Staged, Torn, All) ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          <button
            onClick={() => { setActiveTab('all'); setVisibleCount(5); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'all' ? 'bg-[#D4AF37] text-stone-950 shadow-md font-mono' : 'bg-stone-900/80 text-amber-200/70 border border-stone-700 hover:text-white'}`}
          >
            <span>All Missives</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-950/40 text-inherit">{myLetters.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('drafts'); setVisibleCount(5); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'drafts' ? 'bg-[#D4AF37] text-stone-950 shadow-md font-mono' : 'bg-stone-900/80 text-amber-200/70 border border-stone-700 hover:text-white'}`}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span>Scriptorium Drafts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-950/40 text-inherit">{draftsCount}</span>
          </button>

          <button
            onClick={() => { setActiveTab('transit'); setVisibleCount(5); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'transit' ? 'bg-amber-600 text-white shadow-md font-mono' : 'bg-stone-900/80 text-amber-200/70 border border-stone-700 hover:text-white'}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>In Royal Saddlebag</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-950/40 text-inherit">{transitCount}</span>
          </button>

          <button
            onClick={() => { setActiveTab('staged'); setVisibleCount(5); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'staged' ? 'bg-[#D4AF37] text-stone-950 shadow-md font-mono' : 'bg-stone-900/80 text-amber-200/70 border border-stone-700 hover:text-white'}`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Wax Sealed & Staged</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-950/40 text-inherit">{stagedCount}</span>
          </button>

          <button
            onClick={() => { setActiveTab('torn'); setVisibleCount(5); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'torn' ? 'bg-red-800 text-red-100 shadow-md font-mono' : 'bg-stone-900/80 text-red-300/70 border border-red-900/50 hover:text-red-200'}`}
          >
            <Scissors className="w-3.5 h-3.5 text-red-400" />
            <span>Torn Missives</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-950/40 text-inherit">{tornCount}</span>
          </button>
        </div>

        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search dispatched missives by recipient, moniker, or content words..." 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(5); }} 
            className="w-full p-3.5 rounded-sm text-base sm:text-lg font-serif italic focus:outline-none transition-all shadow-inner"
            style={{
              background: '#FFFDF9',
              color: '#1A1A1A',
              border: '1px solid var(--border-subtle)'
            }}
          />
        </div>

        {/* ── Selection & Multi-Batch Action Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
            >
              {selectedIds.length === filteredLetters.length && filteredLetters.length > 0 ? (
                <><CheckSquare className="w-3.5 h-3.5 text-amber-300" /> Deselect All</>
              ) : (
                <><Square className="w-3.5 h-3.5" /> Select All ({filteredLetters.length})</>
              )}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs font-mono font-bold text-amber-300">
                ✦ {selectedIds.length} Selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBatchMarkRead(true)}
                className="btn-gold-saloon text-[11px] py-1.5 px-3"
              >
                Mark Read
              </button>
              <button
                onClick={() => handleBatchMarkRead(false)}
                className="btn-gold-saloon text-[11px] py-1.5 px-3"
              >
                Mark Unread
              </button>
              <button
                onClick={handleBatchAbandon}
                className="btn-gold-saloon text-[11px] py-1.5 px-3 flex items-center gap-1"
                style={{ background: '#78350F', color: '#FEF3C7', border: '1px solid #D97706' }}
                title="Abandon selected dispatched missives to The Dead Letter Office public archive"
              >
                <Archive className="w-3 h-3 text-amber-300" /> Abandon ({selectedIds.length})
              </button>
              <button
                onClick={handleBatchTrash}
                className="btn-velvet-burgundy text-[11px] py-1.5 px-3 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3 text-amber-400" /> Move to Wastebin
              </button>
            </div>
          )}
        </div>

        {filteredLetters.length === 0 ? (
          <div className="p-12 text-center rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold-muted)' }}>
            <Send className="w-12 h-12 mx-auto mb-2 opacity-60" style={{ color: 'var(--antique-gold)' }} />
            <p className="font-bold text-lg" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
              {activeTab === 'drafts' ? 'No drafts preserved in thy Scriptorium.' : (activeTab === 'transit' ? 'No letters currently in courier saddlebags.' : 'Thou hast no missives matching this filter.')}
            </p>
            <p className="text-sm mt-1 italic font-serif">
              {activeTab === 'drafts' ? 'Save drafts while composing to resume editing here anytime.' : 'Drafted and dispatched letters will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayedLetters.map((l: any, i) => {
                const isDybbuk = l.type === 'dybbuk' || l.type === 'dibbyuk';
                const isSchrodinger = l.type === 'schrodinger';
                const isBottle = l.type === 'bottle';
                const isDraft = l.status === 'draft';
                const isTorn = l.isTorn || l.status === 'torn';
                const isInTransit = (l.status === 'in-transit' || l.status === 'in_transit') && !isTorn;
                const isRead = l.isRead || !!l.firstReadAt;
                const isSelected = selectedIds.includes(l._id);

                return (
                  <div 
                    key={l._id || i} 
                    className={`theatrical-card p-5 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${isTorn ? 'border-2 border-red-700 bg-red-950/20' : ''}`}
                    style={{
                      background: isTorn 
                        ? 'linear-gradient(145deg, rgba(50,10,10,0.85) 0%, rgba(20,5,5,0.95) 100%)'
                        : isDraft
                          ? 'linear-gradient(145deg, rgba(40,32,20,0.85) 0%, rgba(20,16,10,0.95) 100%)'
                          : isDybbuk 
                            ? 'linear-gradient(145deg, rgba(38,18,58,0.7) 0%, rgba(18,10,28,0.85) 100%)'
                            : isSchrodinger 
                              ? 'linear-gradient(145deg, rgba(8,47,73,0.7) 0%, rgba(3,21,38,0.85) 100%)'
                              : isBottle
                                ? 'linear-gradient(145deg, rgba(6,95,70,0.7) 0%, rgba(2,44,34,0.85) 100%)'
                                : 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
                      border: isSelected
                        ? '2px solid var(--antique-gold)'
                        : isTorn 
                          ? '1px solid rgba(239,68,68,0.6)'
                          : isDraft
                            ? '1px solid rgba(212,175,55,0.45)'
                            : isDybbuk 
                              ? '1px solid rgba(168,85,247,0.4)'
                              : isSchrodinger 
                                ? '1px solid rgba(56,189,248,0.4)'
                                : isBottle
                                  ? '1px solid rgba(52,211,153,0.4)'
                                  : '1px solid rgba(212,175,55,0.25)',
                      boxShadow: isSelected ? '0 0 20px rgba(212,175,55,0.3)' : 'none'
                    }}
                  >
                    <div className="w-full sm:w-auto flex items-start gap-3">
                      <button
                        onClick={() => toggleSelect(l._id)}
                        className="mt-1 p-1 text-stone-400 hover:text-amber-300 transition-colors flex-shrink-0"
                        title={isSelected ? "Deselect" : "Select"}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-amber-300" /> : <Square className="w-5 h-5" />}
                      </button>

                      <div>
                        <p className="font-bold text-base sm:text-lg flex items-center flex-wrap gap-2" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                          {/* Read / Unread Status */}
                          <span className={`text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full ${
                            isRead ? 'bg-stone-800 text-stone-300 border border-stone-600' : 'bg-amber-500/25 text-amber-300 border border-amber-400 animate-pulse'
                          }`}>
                            {isRead ? '✓ Read' : '✦ Unread'}
                          </span>

                          {isTorn && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-700 animate-pulse">
                              <Scissors className="w-3.5 h-3.5 text-red-400" /> Torn in Transit
                            </span>
                          )}
                          {isDraft && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700">
                              <Scroll className="w-3.5 h-3.5 text-amber-400" /> Scriptorium Draft
                            </span>
                          )}
                          {isInTransit && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-yellow-950 text-yellow-300 border border-yellow-700 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-yellow-400" /> In Royal Saddlebag (Stage 3)
                            </span>
                          )}
                          {isDybbuk ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: '#581C87', color: '#E9D5FF' }}>
                                <Ghost className="w-3.5 h-3.5 text-purple-300" /> Dybbuk Spectral
                              </span>
                              <span>Spectral Missive to {l.receiverRef?.name || 'Departed Entity'}</span>
                            </>
                          ) : isSchrodinger ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: '#0284C7', color: '#FFF' }}>
                                <Atom className="w-3.5 h-3.5 text-sky-200 animate-spin" />
                                {l.schrodingerState === 'superposition' ? `⚛️ Superposition Box (${l.schrodingerVariants?.length || 3} States)` : `✦ Collapsed: ${l.collapsedVariant?.label || 'Observed'}`}
                              </span>
                              <span>Schrödinger to {l.receiverRef?.name || l.receiverRef || 'Quantum Reality'}</span>
                            </>
                          ) : isBottle ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: '#065F46', color: '#ECFDF5', border: '1px solid #10B981' }}>
                                <Waves className="w-3.5 h-3.5 text-emerald-300" /> Ocean Bottle
                              </span>
                              <span>"{l.bottleMoniker || 'Ocean Relic'}"</span>
                            </>
                          ) : (
                            <>
                              {isDraft ? 'Draft to ' : (isTorn ? 'Torn Missive to ' : 'Sent Letter to ')}
                              <span style={{ color: isTorn ? '#FCA5A5' : 'var(--antique-gold)' }}>{l.receiverRef?.name || l.receiverRef || 'Open Missive'}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs sm:text-sm italic mt-1" style={{ color: 'var(--gold-muted)' }}>
                          {isDybbuk ? (
                            <span>Spectral Realm: <strong className="text-purple-300">{l.spectralSender?.realmOrigin || 'The Astral Veil'}</strong></span>
                          ) : isSchrodinger ? (
                            <span>Quantum State: <strong className="text-sky-300">{l.schrodingerState || 'superposition'}</strong> • {new Date(l.createdAt).toLocaleDateString()}</span>
                          ) : isBottle ? (
                            <span>Drifted <strong className="text-emerald-300">{l.bottleDrift?.distanceKm || 0} km</strong> • Wax: {l.bottleWaxColor || 'gold'} • Status: <strong className="text-emerald-400">{l.bottleDrift?.driftStatus || 'drifting'}</strong></span>
                          ) : isTorn ? (
                            <span className="text-red-300 font-bold">⚠️ Ripped During Recall • Delivery cancelled and preserved in thy records (-5 reputation)</span>
                          ) : isDraft ? (
                            <span className="text-amber-300 font-serif">Draft created on {new Date(l.createdAt).toLocaleString()} • Ready for Scriptorium editing</span>
                          ) : isInTransit ? (
                            <span className="text-yellow-300 font-serif">Carried in courier saddlebag • Unsendable via Postmaster's Riddle</span>
                          ) : (
                            <span>Status: <span className="font-bold uppercase tracking-wider text-amber-300">{l.status}</span> {l.qrCodeToken ? `| Token: ${l.qrCodeToken.substring(0, 8)}...` : ''}</span>
                          )}
                        </p>

                        {l.scheduledFor && new Date(l.scheduledFor).getTime() > Date.now() && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/70 border border-amber-500/50 px-2.5 py-1 rounded-sm w-fit font-serif">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            <span>⏳ Time Capsule Locked until <strong>{new Date(l.scheduledFor).toLocaleString()}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
                      <button 
                        onClick={() => handleOpenLetter(l)} 
                        className="btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1 shadow"
                      >
                        {(l.scheduledFor && new Date(l.scheduledFor).getTime() > Date.now()) ? (
                          <><Lock className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> <span>⏳ Sealed Capsule</span></>
                        ) : (
                          <><BookOpen className="w-3.5 h-3.5" /> <span>Read</span></>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleRead(l._id, isRead)}
                        className="btn-gold-saloon text-[11px] py-1.5 px-2.5 font-bold"
                        title={isRead ? "Mark as Unread" : "Mark as Read"}
                      >
                        {isRead ? "Mark Unread" : "Mark Read"}
                      </button>

                      {l.status === 'draft' && (
                        <button onClick={() => loadDraft(l)} className="btn-gold-saloon text-xs py-1.5 px-3 font-bold text-amber-300">
                          ✍️ Edit
                        </button>
                      )}
                      {l.status === 'pending' && l.qrCodeToken && !isTorn && (
                        <button onClick={() => setCreatedQR(l.qrCodeToken)} className="btn-velvet-burgundy text-xs py-1.5 px-3 animate-glow-pulse">Wax Seal</button>
                      )}
                      {isInTransit && !isBottle && !isDybbuk && (
                        <button 
                          onClick={() => handleOpenRecallModal(l)} 
                          className="btn-velvet-burgundy text-xs py-1.5 px-3 flex items-center gap-1 animate-pulse"
                          title="Stage 3 Saddlebag: Solve the Postmaster's Riddle to recall this epistle back to Drafts"
                        >
                          <Scissors className="w-3.5 h-3.5 text-amber-400" />
                          <span>Recall</span>
                        </button>
                      )}
                      {l.status !== 'draft' && !isBottle && !isDybbuk && !isTorn && (
                        <button onClick={() => setTrackingLetter(l)} className="btn-gold-saloon text-xs py-1.5 px-2.5 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> Odyssey</button>
                      )}
                      <button 
                        onClick={() => handleAbandonSentLetter(l._id)} 
                        className="btn-gold-saloon text-xs py-1.5 px-2.5 flex items-center gap-1" 
                        style={{ color: '#FCD34D' }}
                        title="Abandon to The Dead Letter Office (Public Realm Archive)"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button 
                        onClick={() => openStoryHeraldStudio(l)} 
                        className="btn-gold-saloon text-xs py-1.5 px-2.5 flex items-center gap-1"
                        style={{
                          background: 'rgba(212,175,55,0.15)',
                          color: 'var(--antique-gold)',
                          border: '1px solid rgba(212,175,55,0.4)'
                        }}
                        title="Proclaim 9:16 Royal Story Herald"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Herald</span>
                      </button>

                      <button onClick={() => handleRemoveSentLetter(l._id, isDraft)} disabled={loading} className="btn-gold-saloon text-xs py-1.5 px-2.5 flex items-center gap-1" title="Move to Wastebin">
                        <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination / Load More Controls ── */}
            <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(212,175,55,0.25)' }}>
              <p className="text-xs sm:text-sm font-mono" style={{ color: 'var(--gold-muted)' }}>
                Showing <strong className="text-amber-300">{Math.min(visibleCount, filteredLetters.length)}</strong> of <strong className="text-amber-300">{filteredLetters.length}</strong> missives (Latest to Oldest)
              </p>
              
              <div className="flex flex-wrap items-center gap-2.5">
                {visibleCount < filteredLetters.length && (
                  <button
                    onClick={() => setVisibleCount(c => c + 5)}
                    className="btn-gold-saloon text-xs py-2 px-5 shadow"
                  >
                    See More (+5 Missives)
                  </button>
                )}
                {visibleCount < filteredLetters.length && (
                  <button
                    onClick={() => setVisibleCount(filteredLetters.length)}
                    className="btn-velvet-burgundy text-xs py-2 px-5 shadow font-bold"
                  >
                    SEE ALL ({filteredLetters.length})
                  </button>
                )}
                {visibleCount >= filteredLetters.length && filteredLetters.length > 5 && (
                  <button
                    onClick={() => setVisibleCount(5)}
                    className="btn-gold-saloon text-xs py-2 px-4 shadow opacity-80 hover:opacity-100"
                  >
                    Show Less (First 5)
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reader Modal with Smooth Parchment Scroll Unfurling & Roll-Down Closing Animation */}
      <AnimatePresence>
        {openLetter && openLetter.scheduledFor && new Date(openLetter.scheduledFor).getTime() > Date.now() ? (
          <WaxSealRevealModal
            isOpen={!!openLetter}
            letter={openLetter}
            onClose={handleCloseLetter}
            onTrash={(id) => handleRemoveSentLetter(id, false)}
          />
        ) : openLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
            <div className={`max-w-lg w-full relative ${isClosingScroll ? 'animate-scroll-roll-close' : 'animate-scroll-unroll'}`}>
              {/* Top Wooden Rod */}
              <div className="scroll-rod-top" />

              <div className={`parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl ${openLetter.isTorn || openLetter.status === 'torn' ? 'torn-missive-ragged' : ''}`}>
                <button onClick={handleCloseLetter} className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1 transition-colors"><X className="w-6 h-6" /></button>
                
                {(openLetter.isTorn || openLetter.status === 'torn') ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Scissors className="w-6 h-6 text-red-700 animate-pulse" />
                        <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#7F1D1D', fontFamily: "'Cinzel', serif" }}>
                          ⚠️ Torn Missive (Damaged in Transit)
                        </h3>
                      </div>
                      <p className="text-xs italic text-red-800 font-serif">
                        This missive was torn directly down the middle when the Postmaster's Recall Challenge failed.
                      </p>
                    </div>

                    {/* Middle Torn Parchment Fissure UI */}
                    <div className="letter-middle-tear-fissure">
                      {/* Left Torn Half */}
                      <div 
                        style={{
                          fontFamily: getFontFamily(openLetter.font),
                          background: 'rgba(255, 252, 245, 0.95)',
                          color: '#2A1408',
                          border: '1px solid rgba(185, 28, 28, 0.45)'
                        }}
                        className={`flex-1 p-3.5 shadow-xl torn-rip-left torn-half-left overflow-hidden relative ${getFontSizeClass(openLetter.fontSize)}`}
                      >
                        <div className="border-b border-red-800/30 pb-1 mb-2 flex items-center justify-between text-[9px] font-mono text-red-800 font-bold">
                          <span>[LEFT TORN SECTION]</span>
                          <span>⚠️ RIPPED</span>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed opacity-95 overflow-hidden max-h-80 text-left">
                          {openLetter.content}
                        </div>
                      </div>

                      {/* Right Torn Half */}
                      <div 
                        style={{
                          fontFamily: getFontFamily(openLetter.font),
                          background: 'rgba(255, 252, 245, 0.95)',
                          color: '#2A1408',
                          border: '1px solid rgba(185, 28, 28, 0.45)'
                        }}
                        className={`flex-1 p-3.5 shadow-xl torn-rip-right torn-half-right overflow-hidden relative ${getFontSizeClass(openLetter.fontSize)}`}
                      >
                        <div className="border-b border-red-800/30 pb-1 mb-2 flex items-center justify-between text-[9px] font-mono text-red-800 font-bold">
                          <span>[RIGHT TORN SECTION]</span>
                          <span>DAMAGED</span>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed opacity-95 overflow-hidden max-h-80 text-left">
                          {openLetter.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (openLetter.type === 'dybbuk' || openLetter.type === 'dibbyuk') ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Ghost className="w-6 h-6 text-purple-700 animate-pulse" />
                      <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#2E1065', fontFamily: "'Cinzel', serif" }}>
                        Spectral Dybbuk Inscription
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4" style={{ color: '#7E22CE' }}>
                      Dispatched across the Astral Veil • Realm: {openLetter.spectralSender?.realmOrigin || 'Astral Veil'}
                    </p>
                  </div>
                ) : openLetter.type === 'schrodinger' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Atom className="w-6 h-6 text-sky-700 animate-spin" />
                      <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#0C4A6E', fontFamily: "'Cinzel', serif" }}>
                        {openLetter.collapsedVariant ? `Dispatched Box: ${openLetter.collapsedVariant.label}` : "Dispatched Schrödinger Paradox Box"}
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4" style={{ color: '#0284C7' }}>
                      Quantum State: {openLetter.schrodingerState || 'superposition'} ({openLetter.schrodingerVariants?.length || 3} Realities)
                    </p>
                  </div>
                ) : openLetter.type === 'bottle' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Waves className="w-6 h-6 text-emerald-700 animate-pulse" />
                      <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#064E3B', fontFamily: "'Cinzel', serif" }}>
                        {openLetter.bottleMoniker || 'Cast Ocean Bottle'}
                      </h3>
                    </div>
                    <p className="text-xs italic mb-4 text-emerald-800">
                      Dispatched into Open Swells • Drifted: {openLetter.bottleDrift?.distanceKm || 0} km • Sealed with {openLetter.bottleWaxColor || 'gold'} wax
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: '#3A1F04' }}>
                      Missive to {openLetter.receiverRef?.name || openLetter.receiverRef || 'Recipient'}
                    </h3>
                    <p className="text-xs italic mb-4" style={{ color: '#78350F' }}>
                      Dispatched on {new Date(openLetter.createdAt).toLocaleString()} • Status: {openLetter.status}
                    </p>
                  </>
                )}

                {!openLetter.isTorn && openLetter.status !== 'torn' && (
                  <div 
                    style={{
                      fontFamily: getFontFamily(openLetter.font),
                      background: 'rgba(255, 255, 255, 0.75)',
                      color: '#1A1A1A',
                      border: '1px solid rgba(160, 120, 60, 0.3)'
                    }}
                    className={`p-5 rounded-sm whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto leading-relaxed ${getFontSizeClass(openLetter.fontSize)}`}
                  >
                    {openLetter.content}
                  </div>
                )}

                <div className="mt-5 text-right">
                  <button
                    onClick={handleCloseLetter}
                    className="btn-gold-saloon text-xs py-2 px-5"
                  >
                    Roll Up Scroll & Close
                  </button>
                </div>
              </div>

              {/* Bottom Wooden Rod */}
              <div className="scroll-rod-bottom" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Postmaster's Riddle Recall & Tearing Chamber Modal */}
      <AnimatePresence>
        {recallingLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="theatrical-card p-6 sm:p-8 max-w-lg w-full relative text-center space-y-5 rounded-sm shadow-2xl overflow-hidden" style={{
              background: 'radial-gradient(ellipse at 50% 100%, #201306 0%, #120A03 50%, #080401 100%)',
              border: '2px solid var(--antique-gold)',
              boxShadow: '0 0 60px rgba(212,175,55,0.4), inset 0 0 30px rgba(0,0,0,0.8)'
            }}>
              <button 
                onClick={() => {
                  if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                  setRecallingLetter(null);
                }} 
                className="absolute top-3 right-3 text-stone-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header Badge & Title */}
              <div>
                <span className="text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded bg-amber-950 text-amber-300 font-mono border border-amber-800 animate-pulse">
                  ✦ Sovereign Intercept Challenge ✦
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mt-2" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
                  The Postmaster's Riddle
                </h3>
                <p className="text-xs text-amber-200/80 italic mt-1 font-serif">
                  Solve the riddle to intercept thy missive and recall it to Drafts. Failure shall tear the parchment in two and diminish thy honour.
                </p>
              </div>

              {riddleLoading ? (
                <div className="py-12 space-y-3">
                  <Feather className="w-8 h-8 mx-auto animate-spin text-amber-400" />
                  <p className="text-sm font-serif italic text-amber-300">Summoning the Postmaster's Scriptorium cipher...</p>
                </div>
              ) : recallResult ? (
                <div className="space-y-5 animate-curtain-reveal">
                  {recallResult.outcome === 'recalled' ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-emerald-900/60 border-2 border-emerald-400 shadow-xl">
                        <CheckCircle className="w-10 h-10 text-emerald-300" />
                      </div>
                      <h4 className="text-2xl font-bold text-emerald-300" style={{ fontFamily: "'Cinzel', serif" }}>
                        Epistle Recalled to Drafts!
                      </h4>
                      <p className="text-sm italic text-emerald-100 font-serif leading-relaxed px-2">
                        {recallResult.message}
                      </p>
                      {recallResult.lore && (
                        <p className="text-xs font-mono text-amber-300/80 italic">
                          “{recallResult.lore}”
                        </p>
                      )}
                      <div className="pt-2">
                        <button
                          onClick={() => setRecallingLetter(null)}
                          className="btn-gold-saloon text-xs py-2.5 px-6"
                        >
                          Return to Outbox Registry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Realistic Parchment Tearing Visualizer - Ripped straight through the middle */}
                      <div className="relative py-3 flex items-center justify-center overflow-visible">
                        <div className="flex items-stretch justify-center gap-3 sm:gap-5 w-full max-w-md">
                          {/* Left Torn Half */}
                          <div className="flex-1 bg-[#FBF7EE] text-[#1A1A1A] p-4 text-xs font-serif shadow-2xl torn-rip-left animate-paper-tear-left relative border border-red-900/40 min-h-[140px] text-left">
                            <div className="flex items-center justify-between border-b border-red-800/30 pb-1 mb-1.5 font-mono text-[9px] text-red-900 font-bold">
                              <span>TORN HALF (I)</span>
                              <span>⚠️ RIPPED</span>
                            </div>
                            <p className="line-clamp-4 italic opacity-85 leading-relaxed">{recallingLetter.content}</p>
                            <div className="absolute bottom-1.5 left-2 text-[9px] text-red-800 font-mono font-bold">POSTMASTER FISSURE</div>
                          </div>

                          {/* Right Torn Half */}
                          <div className="flex-1 bg-[#FBF7EE] text-[#1A1A1A] p-4 text-xs font-serif shadow-2xl torn-rip-right animate-paper-tear-right relative border border-red-900/40 min-h-[140px] text-left">
                            <div className="flex items-center justify-between border-b border-red-800/30 pb-1 mb-1.5 font-mono text-[9px] text-red-900 font-bold">
                              <span>TORN HALF (II)</span>
                              <span>DAMAGED</span>
                            </div>
                            <p className="line-clamp-4 italic opacity-85 leading-relaxed">{recallingLetter.content}</p>
                            <div className="absolute bottom-1.5 right-2 text-[9px] text-red-800 font-mono font-bold">RECALL FAILED</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded bg-red-950/80 border border-red-700 text-left space-y-1">
                        <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                          <Scissors className="w-4 h-4 text-red-400" />
                          <span>Recall Failed — Parchment Torn in Transit!</span>
                        </div>
                        <p className="text-xs text-red-200 font-serif">
                          {recallResult.message}
                        </p>
                        {recallResult.correctAnswer && (
                          <p className="text-xs font-mono text-amber-300 pt-1">
                            Correct Postmaster Key was: <strong>{recallResult.correctAnswer}</strong>
                          </p>
                        )}
                        <p className="text-xs font-mono text-red-300 font-bold">
                          Reputation Penalty: -5 Honour Points (New Score: {recallResult.newReputation})
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => setRecallingLetter(null)}
                          className="btn-gold-saloon text-xs py-2.5 px-6"
                        >
                          Acknowledge Missive Destruction & Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : riddleData ? (
                <div className="space-y-5 text-left">
                  {/* Timer Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-amber-300 font-bold">Category: {riddleData.category}</span>
                      <span className={`font-bold ${riddleTimeLeft <= 15 ? 'text-red-400 animate-ping' : 'text-amber-400'}`}>
                        ⏳ {riddleTimeLeft}s Remaining
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-amber-900/50">
                      <div 
                        className="h-full transition-all duration-1000"
                        style={{
                          width: `${(riddleTimeLeft / (riddleData.timeLimitSeconds || 90)) * 100}%`,
                          background: riddleTimeLeft <= 15 ? '#EF4444' : 'linear-gradient(90deg, #D4AF37 0%, #F59E0B 100%)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Riddle Prompt Box */}
                  <div className="p-4 rounded-sm" style={{ background: '#FFFDF9', color: '#1A1A1A', border: '2px solid rgba(212,175,55,0.4)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                    <p className="text-xs font-mono uppercase tracking-widest text-amber-900 font-bold mb-1">
                      Postmaster's Cipher:
                    </p>
                    <p className="text-base sm:text-lg font-serif italic leading-relaxed font-semibold">
                      “{riddleData.prompt}”
                    </p>
                  </div>

                  {/* 4 Riddle Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {riddleData.options.map((opt: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedOption(idx)}
                        className="p-3 rounded-sm text-xs sm:text-sm text-left transition-all font-serif font-bold flex items-center gap-2.5"
                        style={{
                          background: selectedOption === idx ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'rgba(255,253,249,0.06)',
                          color: selectedOption === idx ? '#FFF' : 'var(--parchment-light)',
                          border: selectedOption === idx ? '1px solid var(--antique-gold)' : '1px solid rgba(212,175,55,0.25)',
                          boxShadow: selectedOption === idx ? '0 0 15px rgba(212,175,55,0.3)' : 'none'
                        }}
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border border-amber-400/40 flex-shrink-0" style={{ background: selectedOption === idx ? '#D4AF37' : 'transparent', color: selectedOption === idx ? '#000' : '#D4AF37' }}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setRecallingLetter(null)}
                      className="btn-gold-saloon text-xs py-2.5 px-4"
                    >
                      Cancel Recall
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecuteRecall(false)}
                      disabled={submittingRecall || selectedOption === null}
                      className="btn-velvet-burgundy text-xs py-2.5 px-6 flex items-center gap-2 animate-glow-pulse"
                    >
                      <Feather className={`w-4 h-4 ${submittingRecall ? 'animate-spin' : ''}`} />
                      <span>{submittingRecall ? 'Evaluating Cipher...' : '✦ Submit Solution & Recall'}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createdQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="theatrical-card p-6 sm:p-8 max-w-md w-full relative text-center shadow-2xl animate-glow-pulse" style={{ border: '2px solid var(--antique-gold)' }}>
              <button onClick={() => setCreatedQR('')} className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"><X className="w-6 h-6" /></button>
              <Crown className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--antique-gold)' }} />
              <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>Delivery Wax Seal</h3>
              <p className="text-xs sm:text-sm italic mb-5" style={{ color: 'var(--gold-muted)' }}>Present this Royal Wax Seal (QR Code) to a Courier or Receiver for pickup.</p>
              
              <div className="flex justify-center p-4 bg-white rounded-sm mb-4 inline-block shadow-inner" style={{ border: '2px solid var(--antique-gold)' }}>
                <QRCodeCanvas value={createdQR} size={220} fgColor="#1A1A1A" />
              </div>
              
              <p className="font-mono text-xs p-2 rounded-sm break-all" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                {createdQR}
              </p>

              <div className="mt-5">
                <button onClick={() => setCreatedQR('')} className="btn-velvet-burgundy text-xs w-full justify-center">
                  Close Seal Window
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trackingLetter && <DispatchTimeline letter={trackingLetter} onClose={() => setTrackingLetter(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// REALISTIC PROCEDURAL CANVAS FIRE ENGINE
// ============================================
function RealisticFireCanvas({ 
  width = 500, 
  height = 300, 
  intensity = 1.0,
  sparkCount = 40,
  className = '' 
}: {
  width?: number;
  height?: number;
  intensity?: number;
  sparkCount?: number;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const cw = canvas.width;
    const ch = canvas.height;

    class FireParticle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      radius: number = 0;
      maxLife: number = 0;
      life: number = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = cw * 0.5 + (Math.random() - 0.5) * (cw * 0.75);
        this.y = ch - Math.random() * 10;
        this.vx = (Math.random() - 0.5) * 1.8;
        this.vy = -(Math.random() * 3.5 + 2.5) * intensity;
        this.radius = Math.random() * 24 + 14;
        this.maxLife = Math.random() * 32 + 22;
        this.life = 0;
      }

      update() {
        this.x += this.vx + (Math.random() - 0.5) * 0.7;
        this.y += this.vy;
        this.radius *= 0.96;
        this.life++;
        if (this.life >= this.maxLife || this.radius < 1.5) {
          this.reset();
        }
      }

      draw(c: CanvasRenderingContext2D) {
        const progress = this.life / this.maxLife;
        const alpha = Math.max(0, 1 - progress);

        let r = 255;
        let g = Math.floor(255 * (1 - progress * 1.2));
        if (g < 0) g = 0;

        if (progress > 0.6) {
          r = Math.floor(255 * (1 - (progress - 0.6) * 2));
        }

        const grad = c.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        grad.addColorStop(0, `rgba(255, 255, 240, ${alpha * 0.95})`);
        grad.addColorStop(0.3, `rgba(${r}, ${Math.max(80, g)}, 20, ${alpha * 0.8})`);
        grad.addColorStop(0.7, `rgba(${r}, ${Math.max(20, g)}, 0, ${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(20, 5, 0, 0)`);

        c.fillStyle = grad;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
      }
    }

    class EmberSpark {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      size: number = 0;
      life: number = 0;
      maxLife: number = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = cw * 0.5 + (Math.random() - 0.5) * (cw * 0.85);
        this.y = ch - Math.random() * 20;
        this.vx = (Math.random() - 0.5) * 2.5;
        this.vy = -(Math.random() * 5.0 + 2.0);
        this.size = Math.random() * 2.5 + 0.8;
        this.maxLife = Math.random() * 65 + 40;
        this.life = 0;
      }

      update() {
        this.x += this.vx + Math.sin(this.life * 0.1) * 0.7;
        this.y += this.vy;
        this.life++;
        if (this.life >= this.maxLife || this.y < 0) {
          this.reset();
        }
      }

      draw(c: CanvasRenderingContext2D) {
        const ratio = 1 - this.life / this.maxLife;
        c.fillStyle = `rgba(255, ${Math.floor(180 * ratio + 60)}, ${Math.floor(40 * ratio)}, ${ratio})`;
        c.shadowColor = '#FF6600';
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
    }

    class SmokeParticle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      radius: number = 0;
      life: number = 0;
      maxLife: number = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = cw * 0.5 + (Math.random() - 0.5) * (cw * 0.5);
        this.y = ch * 0.6 - Math.random() * 20;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = -(Math.random() * 2.0 + 1.0);
        this.radius = Math.random() * 22 + 15;
        this.maxLife = Math.random() * 70 + 50;
        this.life = 0;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.radius += 0.4;
        this.life++;
        if (this.life >= this.maxLife) {
          this.reset();
        }
      }

      draw(c: CanvasRenderingContext2D) {
        const alpha = Math.sin(Math.PI * (this.life / this.maxLife)) * 0.16;
        c.fillStyle = `rgba(40, 30, 25, ${alpha})`;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
      }
    }

    const fireParticles = Array.from({ length: 65 }, () => new FireParticle());
    const emberSparks = Array.from({ length: sparkCount }, () => new EmberSpark());
    const smokeParticles = Array.from({ length: 25 }, () => new SmokeParticle());

    const render = () => {
      ctx.clearRect(0, 0, cw, ch);

      smokeParticles.forEach(s => { s.update(); s.draw(ctx); });

      ctx.globalCompositeOperation = 'screen';
      fireParticles.forEach(p => { p.update(); p.draw(ctx); });

      ctx.globalCompositeOperation = 'source-over';
      emberSparks.forEach(e => { e.update(); e.draw(ctx); });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => { cancelAnimationFrame(animId); };
  }, [width, height, intensity, sparkCount]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pointer-events-none ${className}`}
      style={{ filter: 'contrast(1.25) brightness(1.2)' }}
    />
  );
}

// ============================================
// GUILD WASTEBIN & ASH PIT (Trash System)
// ============================================
function GuildWastebin() {
  const [trashedLetters, setTrashedLetters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'outbox' | 'inbox'>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openLetter, setOpenLetter] = useState<any>(null);
  const [burningLetter, setBurningLetter] = useState<any>(null);
  const [burningEntireTrash, setBurningEntireTrash] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isClosingScroll, setIsClosingScroll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleCloseLetter = () => {
    setIsClosingScroll(true);
    setTimeout(() => {
      setOpenLetter(null);
      setIsClosingScroll(false);
      fetchTrash();
    }, 550);
  };

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const data = await getTrashedLetters();
      const arr = Array.isArray(data) ? data : [];
      // Latest to oldest sort
      arr.sort((a, b) => new Date(b.trashedAt || b.updatedAt || b.createdAt || 0).getTime() - new Date(a.trashedAt || a.updatedAt || a.createdAt || 0).getTime());
      setTrashedLetters(arr);
    } catch (e) {
      console.error("Failed to load wastebin:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await restoreLetterFromTrash(id);
      setActionMsg(res.message || "Letter restored to thy active chronicles.");
      setTimeout(() => setActionMsg(null), 3500);
      fetchTrash();
    } catch (e: any) {
      alert(e.message || "Failed to restore letter.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      const res = await batchRestoreLetters(selectedIds);
      setActionMsg(res.message || `Restored ${selectedIds.length} missives to thy active desk.`);
      setTimeout(() => setActionMsg(null), 3500);
      setSelectedIds([]);
      fetchTrash();
    } catch (e: any) {
      alert(e.message || "Failed to batch restore letters.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchBurn = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Permanently burn ${selectedIds.length} selected missives to cinder and ash? This cannot be undone!`)) return;
    setActionLoading(true);
    try {
      const res = await batchBurnPermanent(selectedIds);
      setActionMsg(res.message || `Consumed ${selectedIds.length} missives into ash.`);
      setTimeout(() => setActionMsg(null), 3500);
      setSelectedIds([]);
      fetchTrash();
    } catch (e: any) {
      alert(e.message || "Failed to batch burn letters.");
    } finally {
      setActionLoading(false);
    }
  };

  const triggerBurnLetter = (letter: any) => {
    setBurningLetter(letter);
    setTimeout(async () => {
      try {
        await burnLetterPermanent(letter._id);
        setTrashedLetters(prev => prev.filter(l => l._id !== letter._id));
        setActionMsg("Missive consumed to ash by the eternal flame.");
        setTimeout(() => setActionMsg(null), 3500);
      } catch (e: any) {
        alert(e.message || "Failed to incinerate letter.");
      } finally {
        setBurningLetter(null);
      }
    }, 3000);
  };

  const triggerEmptyTrash = () => {
    setBurningEntireTrash(true);
    setTimeout(async () => {
      try {
        await emptyTrash();
        setTrashedLetters([]);
        setActionMsg("Thy entire wastebin has been reduced to cinder and ash.");
        setTimeout(() => setActionMsg(null), 4000);
      } catch (e: any) {
        alert(e.message || "Failed to empty wastebin.");
      } finally {
        setBurningEntireTrash(false);
      }
    }, 2800);
  };

  const filteredTrash = trashedLetters.filter(l => {
    if (activeTab === 'drafts' && l.removedFrom !== 'draft') return false;
    if (activeTab === 'outbox' && l.removedFrom !== 'outbox') return false;
    if (activeTab === 'inbox' && l.removedFrom !== 'inbox') return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTrash.length && filteredTrash.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrash.map(l => l._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const displayedTrash = filteredTrash.slice(0, visibleCount);

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-5xl mx-auto space-y-6">
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
        background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 pb-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-2 animate-float-gentle" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontFamily: "'Cinzel', serif" }}>
              <span>🔥 The Alchemical Ash Pit</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-wide flex items-center gap-3" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
              <Trash2 className="w-8 h-8 flex-shrink-0 text-amber-500" />
              The Guild's Wastebin
            </h2>
            <p className="text-sm sm:text-base italic mt-1" style={{ color: 'var(--gold-muted)' }}>
              Discarded drafts, removed missives, and items awaiting the eternal flame (Latest to Oldest).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {trashedLetters.length > 0 && (
              <button
                onClick={triggerEmptyTrash}
                disabled={actionLoading || burningEntireTrash}
                className="px-4 py-2.5 rounded-sm font-bold text-xs shadow flex items-center gap-1.5 transition-all text-white animate-pulse"
                style={{ background: 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)', border: '1px solid rgba(239,68,68,0.5)', fontFamily: "'Cinzel', serif" }}
              >
                <Flame className="w-4 h-4 text-orange-400" /> Burn Entire Wastebin
              </button>
            )}
            <Link to="/" className="btn-gold-saloon text-xs py-2 px-4">
              ← Thy Ledger
            </Link>
          </div>
        </div>

        {actionMsg && (
          <div className="p-3.5 mb-6 rounded-sm text-sm font-bold flex items-center gap-2 shadow-md animate-curtain-reveal" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--parchment-light)', border: '1px solid var(--antique-gold)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--antique-gold)' }} /> {actionMsg}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
          {[
            { key: 'all', label: 'All Discarded', count: trashedLetters.length },
            { key: 'drafts', label: 'Drafts', count: trashedLetters.filter(l => l.removedFrom === 'draft').length },
            { key: 'outbox', label: 'Sent Missives', count: trashedLetters.filter(l => l.removedFrom === 'outbox').length },
            { key: 'inbox', label: 'Received Missives', count: trashedLetters.filter(l => l.removedFrom === 'inbox').length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key as any); setVisibleCount(5); setSelectedIds([]); }}
              className="px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-sm transition-all flex items-center gap-2"
              style={{
                fontFamily: "'Cinzel', serif",
                background: activeTab === t.key ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'transparent',
                color: activeTab === t.key ? '#FFF' : 'var(--gold-muted)',
                border: activeTab === t.key ? '1px solid var(--antique-gold)' : '1px solid transparent',
                borderBottom: 'none'
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* ── Selection & Multi-Batch Action Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="btn-gold-saloon text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
            >
              {selectedIds.length === filteredTrash.length && filteredTrash.length > 0 ? (
                <><CheckSquare className="w-3.5 h-3.5 text-amber-300" /> Deselect All</>
              ) : (
                <><Square className="w-3.5 h-3.5" /> Select All ({filteredTrash.length})</>
              )}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs font-mono font-bold text-amber-300">
                ✦ {selectedIds.length} Selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBatchRestore}
                disabled={actionLoading}
                className="btn-gold-saloon text-[11px] py-1.5 px-3 flex items-center gap-1"
                style={{ background: '#047857', border: '1px solid #10B981', color: '#FFF' }}
              >
                <RotateCcw className="w-3 h-3 text-emerald-300" /> Restore Selected ({selectedIds.length})
              </button>
              <button
                onClick={handleBatchBurn}
                disabled={actionLoading}
                className="btn-velvet-burgundy text-[11px] py-1.5 px-3 flex items-center gap-1"
              >
                <Flame className="w-3 h-3 text-orange-400" /> Burn Selected to Ash
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center italic" style={{ color: 'var(--gold-muted)' }}>
            <Feather className="w-8 h-8 mx-auto animate-spin mb-3" style={{ color: 'var(--antique-gold)' }} />
            <p className="text-lg font-serif">Inspecting the ash pit...</p>
          </div>
        ) : filteredTrash.length === 0 ? (
          <div className="text-center py-16 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold-muted)' }}>
            <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-60" style={{ color: 'var(--antique-gold)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>Thy Wastebin is pristine and empty.</p>
            <p className="text-sm mt-1 italic font-serif">Any missives or drafts removed from thy desk will wait here before permanent burning.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayedTrash.map((l: any, i) => {
                const originLabel = l.removedFrom === 'draft' ? 'Draft' : (l.removedFrom === 'inbox' ? 'Received Missive' : 'Sent Missive');
                const targetName = l.receiverRef?.name || l.receiverRef || 'Unspecified';
                const senderName = l.senderRef?.name || 'Unknown';
                const isSelected = selectedIds.includes(l._id);

                return (
                  <div 
                    key={l._id || i} 
                    className="theatrical-card p-5 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all" 
                    style={{ 
                      border: isSelected ? '2px solid var(--antique-gold)' : '1px solid rgba(212,175,55,0.25)',
                      boxShadow: isSelected ? '0 0 20px rgba(212,175,55,0.3)' : 'none'
                    }}
                  >
                    <div className="flex-1 flex items-start gap-3">
                      <button
                        onClick={() => toggleSelect(l._id)}
                        className="mt-1 p-1 text-stone-400 hover:text-amber-300 transition-colors flex-shrink-0"
                        title={isSelected ? "Deselect" : "Select"}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-amber-300" /> : <Square className="w-5 h-5" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[11px] uppercase px-2.5 py-0.5 rounded-sm font-bold tracking-wider" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: "'Cinzel', serif" }}>
                            {originLabel}
                          </span>
                          <h4 className="text-base sm:text-lg font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                            {l.removedFrom === 'inbox' ? `From: ${senderName}` : `To: ${targetName}`}
                          </h4>
                        </div>
                        <p className="text-sm font-serif line-clamp-2 p-3 rounded-sm mb-1 leading-relaxed" style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)' }}>
                          {l.content}
                        </p>
                        <p className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                          Removed on {new Date(l.trashedAt || l.updatedAt || l.createdAt).toLocaleDateString()} at {new Date(l.trashedAt || l.updatedAt || l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setOpenLetter(l)}
                        className="btn-gold-saloon text-xs py-2 px-3 flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> View
                      </button>

                      <button
                        onClick={() => handleRestore(l._id)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-sm font-bold text-xs shadow flex items-center gap-1.5 transition-colors text-white"
                        style={{ background: '#047857', border: '1px solid #10B981', fontFamily: "'Cinzel', serif" }}
                        title="Restore back to active desk"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>

                      <button
                        onClick={() => triggerBurnLetter(l)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-sm font-bold text-xs shadow flex items-center gap-1.5 transition-colors text-white"
                        style={{ background: '#7F1D1D', border: '1px solid #DC2626', fontFamily: "'Cinzel', serif" }}
                        title="Open scroll and burn to ashes"
                      >
                        <Flame className="w-3.5 h-3.5 text-orange-400" /> Burn to Ash
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination / Load More Controls ── */}
            <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(212,175,55,0.25)' }}>
              <p className="text-xs sm:text-sm font-mono" style={{ color: 'var(--gold-muted)' }}>
                Showing <strong className="text-amber-300">{Math.min(visibleCount, filteredTrash.length)}</strong> of <strong className="text-amber-300">{filteredTrash.length}</strong> discarded items (Latest to Oldest)
              </p>
              
              <div className="flex flex-wrap items-center gap-2.5">
                {visibleCount < filteredTrash.length && (
                  <button
                    onClick={() => setVisibleCount(c => c + 5)}
                    className="btn-gold-saloon text-xs py-2 px-5 shadow"
                  >
                    See More (+5 Items)
                  </button>
                )}
                {visibleCount < filteredTrash.length && (
                  <button
                    onClick={() => setVisibleCount(filteredTrash.length)}
                    className="btn-velvet-burgundy text-xs py-2 px-5 shadow font-bold"
                  >
                    SEE ALL ({filteredTrash.length})
                  </button>
                )}
                {visibleCount >= filteredTrash.length && filteredTrash.length > 5 && (
                  <button
                    onClick={() => setVisibleCount(5)}
                    className="btn-gold-saloon text-xs py-2 px-4 shadow opacity-80 hover:opacity-100"
                  >
                    Show Less (First 5)
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reader Modal with 3D Parchment Scroll & Roll-Down Closing Animation */}
      <AnimatePresence>
        {openLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
            <div className={`parchment-scroll-container ${isClosingScroll ? 'animate-scroll-roll-close' : 'animate-scroll-unroll'}`}>
              {/* Top Wooden Rod */}
              <div className="scroll-rod-top" />

              <div className="parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl">
                <button onClick={handleCloseLetter} className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1"><X className="w-6 h-6" /></button>
                <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: '#3A1F04' }}>
                  Discarded Missive ({openLetter.removedFrom})
                </h3>
                <p className="text-xs italic mb-4" style={{ color: '#78350F' }}>
                  Removed on {new Date(openLetter.trashedAt || openLetter.updatedAt).toLocaleString()}
                </p>
                <div 
                  style={{
                    fontFamily: getFontFamily(openLetter.font),
                    background: 'rgba(255, 255, 255, 0.75)',
                    color: '#1A1A1A',
                    border: '1px solid rgba(160, 120, 60, 0.3)'
                  }}
                  className={`p-5 rounded-sm whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto leading-relaxed ${getFontSizeClass(openLetter.fontSize)}`}
                >
                  {openLetter.content}
                </div>
                <div className="mt-5 text-right">
                  <button onClick={handleCloseLetter} className="btn-gold-saloon text-xs py-2 px-5">
                    Roll Up Scroll & Close
                  </button>
                </div>
              </div>

              {/* Bottom Wooden Rod */}
              <div className="scroll-rod-bottom" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Realistic Burning Letter Scroll Modal */}
      <AnimatePresence>
        {burningLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] p-4 backdrop-blur-lg">
            <div className="theatrical-card p-6 sm:p-10 max-w-lg w-full relative text-center space-y-5 overflow-hidden rounded-sm" style={{
              background: 'radial-gradient(ellipse at 50% 100%, #220902 0%, #120401 50%, #050100 100%)',
              border: '2px solid rgba(239, 68, 68, 0.75)',
              boxShadow: '0 0 80px rgba(255, 68, 0, 0.55), inset 0 0 50px rgba(255, 68, 0, 0.25)'
            }}>
              {/* Header Badge & Title */}
              <div>
                <span className="text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded bg-red-950 text-red-300 font-mono border border-red-800">
                  ✦ Sovereign Incineration ✦
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-white" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                  Incinerating Epistle
                </h3>
                <p className="text-xs text-orange-300 italic mt-1 font-serif">
                  Consuming vellum fibers, calligraphic ink, and wax seal to eternal ash...
                </p>
              </div>

              {/* Central Burning Letter Stage */}
              <div className="relative py-2 flex flex-col items-center justify-center overflow-hidden">
                {/* 3D Parchment Scroll with Smoldering Char */}
                <div className="parchment-scroll-container relative overflow-hidden w-full max-w-md">
                  <div className="scroll-rod-top" />

                  <div className="parchment-scroll-surface p-5 sm:p-6 relative rounded-sm shadow-2xl animate-organic-smolder">
                    <div className="smoldering-burn-line" />

                    <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-red-900/40">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                        <span className="text-xs font-bold uppercase tracking-wider text-red-900" style={{ fontFamily: "'Cinzel', serif" }}>
                          {burningLetter.removedFrom ? `From: ${burningLetter.removedFrom}` : 'Active Epistle'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-red-800 font-bold">COMBUSTING</span>
                    </div>

                    <div 
                      style={{
                        fontFamily: getFontFamily(burningLetter.font),
                        background: 'rgba(255, 245, 230, 0.85)',
                        color: '#2A1408',
                        border: '1px solid rgba(220, 38, 38, 0.35)'
                      }}
                      className={`p-4 rounded-sm whitespace-pre-wrap shadow-inner max-h-48 overflow-hidden leading-relaxed text-left ${getFontSizeClass(burningLetter.fontSize)}`}
                    >
                      {burningLetter.content}
                    </div>

                    {/* Photorealistic Canvas Fire Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-end justify-center">
                      <RealisticFireCanvas width={480} height={260} intensity={1.5} sparkCount={55} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="scroll-rod-bottom" />
                </div>
              </div>

              {/* Bottom Status Indicator */}
              <div className="p-2.5 rounded-sm bg-black/60 border border-orange-900/50">
                <p className="text-xs font-mono text-amber-300 tracking-wider animate-pulse flex items-center justify-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Thermal decomposition active • Words turning to cinder
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Realistic Wrought-Iron Furnace Incinerator Modal */}
      <AnimatePresence>
        {burningEntireTrash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] p-4 backdrop-blur-lg">
            <div className="theatrical-card p-8 sm:p-12 max-w-lg w-full relative text-center space-y-6 overflow-hidden rounded-sm" style={{
              background: 'radial-gradient(ellipse at 50% 100%, #200802 0%, #100401 50%, #050100 100%)',
              border: '2px solid rgba(239, 68, 68, 0.7)',
              boxShadow: '0 0 80px rgba(255, 68, 0, 0.5), inset 0 0 50px rgba(255, 68, 0, 0.25)'
            }}>
              <div>
                <span className="text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded bg-red-950 text-red-300 font-mono border border-red-800">
                  ✦ Sovereign Incineration ✦
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-white" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                  Alchemical Iron Furnace
                </h3>
                <p className="text-xs text-orange-300 italic mt-1 font-serif">
                  Incinerating all discarded manuscripts, drafts, and records to pure ash.
                </p>
              </div>

              {/* Realistic Wrought-Iron Furnace with Canvas Inferno */}
              <div className="relative py-4 flex flex-col items-center justify-center">
                {/* Roaring High-Intensity Fire Canvas shooting out of Furnace */}
                <div className="relative z-20 -mb-16 pointer-events-none">
                  <RealisticFireCanvas width={420} height={260} intensity={1.8} sparkCount={75} className="mx-auto" />
                </div>

                {/* Heavy Wrought-Iron Furnace Cauldron */}
                <div className="wrought-iron-furnace z-10">
                  <div className="furnace-rivets">
                    <div className="furnace-rivet" />
                    <div className="furnace-rivet" />
                    <div className="furnace-rivet" />
                    <div className="furnace-rivet" />
                  </div>

                  <div className="furnace-vent-grate">
                    <div className="furnace-molten-glow" />
                    <div className="furnace-grate-bar" />
                    <div className="furnace-grate-bar" />
                    <div className="furnace-grate-bar" />
                    <div className="furnace-grate-bar" />
                  </div>
                </div>
              </div>

              <p className="text-xs font-mono text-amber-300 tracking-wider animate-pulse">
                🔥 Thermal decomposition active • All chronicles reduced to cinder...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// MAILMAN DASHBOARD (role-gated)
// ============================================
function MailmanDashboard({ user }: { user: any }) {
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQR, setSelectedQR] = useState<{ token: string, receiverName: string } | null>(null);
  const [showBadges, setShowBadges] = useState(false);
  const [liveUser, setLiveUser] = useState<any>(user);
  const [courierAlert, setCourierAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchQuests();
    fetchLiveUser();

    const socket = io();
    socket.on('letters-updated', () => {
      fetchQuests();
    });
    socket.on('mailman-notification', (data: any) => {
      const myId = user.id || user._id;
      if (!data.mailmanId || data.mailmanId === myId) {
        setCourierAlert(data.message);
        fetchQuests();
        setTimeout(() => setCourierAlert(null), 8000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchLiveUser = async () => {
    try {
      const data = await getUserProfile(user.id || user._id);
      setLiveUser(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuests = async () => {
    try {
      const data = await getActiveQuests();
      setQuests(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeizeMissive = async (token: string) => {
    try {
      const res = await scanLetter(token);
      alert(res.message || 'Missive seized successfully!');
      fetchQuests();
      fetchLiveUser();
    } catch (e: any) {
      alert(e.message || 'Error seizing missive');
    }
  };

  const xp = liveUser.xp || 0;
  const deliveries = liveUser.deliveriesCompleted || 0;
  const { currentRank, earnedCount } = getRankFromXP(xp);

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-5xl mx-auto space-y-8">
      {courierAlert && (
        <div className="p-4 rounded-sm bg-red-950 text-red-200 border-2 border-red-700 shadow-xl flex items-center gap-3 animate-curtain-reveal">
          <Scissors className="w-6 h-6 text-red-400 animate-pulse flex-shrink-0" />
          <div className="font-serif">
            <span className="font-bold text-red-300 font-mono text-xs uppercase tracking-wider block">Courier Dispatch Notice</span>
            <p className="text-sm italic">{courierAlert}</p>
          </div>
        </div>
      )}

      {/* ── Hero Banner with Atmospheric Courier Dispatch Background ── */}
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden rounded-sm text-center" style={{
        background: `linear-gradient(180deg, rgba(20,16,12,0.82) 0%, rgba(10,8,6,0.95) 100%), url(${courierDispatchTerminalBg}) center/cover no-repeat`,
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold mb-3 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
          <Crown className="w-3.5 h-3.5" />
          <span>✦ Imperial Courier Dispatch & Active Saddlebag ✦</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
          The Mailman's Registry
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base italic leading-relaxed mt-2" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
          Active frontier assignments, saddlebag deliveries, and courier service accolades for <strong>{user.name}</strong>.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-3 mt-4 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Rank: <strong>{currentRank.name}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-stone-900/80 text-stone-300 border border-stone-700">
            Experience: <strong>{xp} XP</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            Completed: <strong>{deliveries}</strong>
          </span>
        </div>
      </div>

      {/* ── Courier Stats & Active Saddlebag Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Thy Courier Credentials */}
        <div className="theatrical-card p-6 sm:p-8 relative overflow-hidden rounded-sm" style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />
          <h3 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2.5 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            <Crown className="w-6 h-6 text-amber-400" />
            <span>Thy Courier Ledger</span>
          </h3>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center p-3.5 rounded-sm" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span className="font-semibold text-stone-200" style={{ fontFamily: "'Cinzel', serif" }}>Deliveries Completed</span>
              <span className="text-amber-300 font-bold text-xl font-mono">{deliveries}</span>
            </div>

            <div className="flex justify-between items-center p-3.5 rounded-sm" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span className="font-semibold text-stone-200" style={{ fontFamily: "'Cinzel', serif" }}>Guild Experience (XP)</span>
              <span className="text-amber-300 font-bold text-xl font-mono">{xp} XP</span>
            </div>

            <div className="flex justify-between items-center p-3.5 rounded-sm" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span className="font-semibold text-stone-200" style={{ fontFamily: "'Cinzel', serif" }}>Accolades Bestowed</span>
              <div className="flex items-center gap-3">
                <span className="text-amber-300 font-bold text-xl font-mono">{earnedCount}</span>
                <button
                  onClick={() => setShowBadges(!showBadges)}
                  className="btn-gold-saloon text-xs py-1.5 px-3.5 shadow"
                >
                  {showBadges ? 'Conceal Badges' : 'Inspect Badges'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thy Active Deliveries (Saddlebag) */}
        <div className="theatrical-card p-6 sm:p-8 relative overflow-hidden rounded-sm" style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />
          <h3 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2.5 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            <Feather className="w-6 h-6 text-amber-400" />
            <span>Active Saddlebag Deliveries</span>
          </h3>

          <div className="p-4 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
            {quests.length === 0 ? (
              <div className="text-center py-6">
                <Star className="w-8 h-8 mx-auto text-amber-400/60 mb-2 animate-float-gentle" />
                <p className="text-stone-300 font-serif italic">No active letters currently in thy saddlebag.</p>
                <p className="text-xs text-amber-300/70 mt-1 font-mono">Scan unstamped missives across the realm to begin transport.</p>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                {quests.map((q, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-sm gap-3 transition-all"
                    style={{ background: 'linear-gradient(135deg, rgba(35,28,18,0.7) 0%, rgba(18,14,10,0.85) 100%)', border: '1px solid rgba(212,175,55,0.3)' }}
                  >
                    <div className="w-full sm:w-auto">
                      <p className="font-bold text-base" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                        Deliver to: <span style={{ color: 'var(--antique-gold)' }}>{q.receiverRef?.name || 'Open Missive'}</span>
                      </p>
                      <p className="text-xs italic text-stone-400 font-serif mt-0.5">
                        Sender: <strong className="text-stone-300">{q.senderRef?.name || 'A Noble Scribe'}</strong>
                      </p>
                    </div>
                    {(q.receiverRef?._id === user.id || q.receiverRef === user.id) ? (
                      <button
                        onClick={() => handleSeizeMissive(q.qrCodeToken)}
                        className="w-full sm:w-auto btn-velvet-burgundy text-xs py-2 px-4 shadow"
                      >
                        Seize Missive
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedQR({ token: q.qrCodeToken, receiverName: q.receiverRef?.name || 'Unknown' })}
                        className="w-full sm:w-auto btn-gold-saloon text-xs py-2 px-4 shadow"
                      >
                        Show Wax Seal QR
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBadges && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <HierarchyBadges userXP={xp} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── Gilded Aristocratic Wax Seal QR Modal ── */}
      <AnimatePresence>
        {selectedQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div
              className="theatrical-card p-6 sm:p-8 rounded-sm max-w-md w-full relative text-center shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
                border: '2px solid var(--antique-gold)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(212,175,55,0.2)'
              }}
            >
              <button
                onClick={() => setSelectedQR(null)}
                className="absolute top-3 right-3 text-stone-400 hover:text-amber-300 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-amber-500/20 border border-amber-400/50">
                <Crown className="w-6 h-6 text-amber-300" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold mb-1 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
                Delivery Wax Seal
              </h3>
              <p className="italic text-sm text-amber-300 font-serif mb-1">
                For Recipient: <strong>{selectedQR.receiverName}</strong>
              </p>
              <p className="text-xs text-stone-300 italic mb-5">
                Present this royal cryptographic seal to the recipient so they may scan and read their missive.
              </p>

              <div className="flex justify-center p-4 bg-[#FFFDF9] border-2 border-[var(--antique-gold)] rounded-sm mb-4 inline-block shadow-inner">
                <QRCodeCanvas value={selectedQR.token} size={240} fgColor="#1A140E" />
              </div>

              <div>
                <button
                  onClick={() => setSelectedQR(null)}
                  className="btn-gold-saloon text-xs py-2 px-6"
                >
                  Conceal Seal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// COMMUNITY NOTICE BOARD (Feature 2: Community Notice Board)
// ============================================
const NOTICE_CATEGORIES = [
  { id: 'all', label: 'All Proclamations', icon: '📜', color: 'border-amber-500/40 text-amber-300' },
  { id: 'announcement', label: 'Sovereign Decrees', icon: '📢', color: 'border-amber-400 bg-amber-950/60 text-amber-200' },
  { id: 'update', label: 'Realm Updates', icon: '⚡', color: 'border-cyan-400 bg-cyan-950/60 text-cyan-200' },
  { id: 'news', label: 'Kingdom Gazette', icon: '📰', color: 'border-emerald-400 bg-emerald-950/60 text-emerald-200' },
  { id: 'event', label: 'Guild Festivals', icon: '🎪', color: 'border-purple-400 bg-purple-950/60 text-purple-200' },
  { id: 'warning', label: 'Imperial Warnings', icon: '⚠️', color: 'border-rose-400 bg-rose-950/60 text-rose-200' },
];

function CommunityNoticeBoard({ user }: { user: any }) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // New notice form state (Admins only)
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'announcement' | 'update' | 'event' | 'warning' | 'news'>('announcement');
  const [newIsPinned, setNewIsPinned] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchBoardNotices = async () => {
    try {
      const data = await getNotices();
      if (Array.isArray(data)) setNotices(data);
    } catch (err: any) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardNotices();

    const socket: Socket = io();

    socket.on('new-notice', (notice: any) => {
      if (notice && notice._id) {
        setNotices(prev => [notice, ...prev.filter(n => n._id !== notice._id)]);
      }
    });

    socket.on('notice-updated', (updated: any) => {
      if (updated && updated._id) {
        setNotices(prev => prev.map(n => n._id === updated._id ? updated : n));
      }
    });

    socket.on('notice-deleted', ({ id }: { id: string }) => {
      if (id) {
        setNotices(prev => prev.filter(n => n._id !== id));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setError('Title and proclamation text cannot be empty.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await postNotice({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        isPinned: newIsPinned
      });
      setNewTitle('');
      setNewContent('');
      setNewCategory('announcement');
      setNewIsPinned(false);
      setShowDraftModal(false);
      fetchBoardNotices();
    } catch (err: any) {
      setError(err.message || 'Failed to proclaim decree.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await togglePinNotice(id);
      fetchBoardNotices();
    } catch (err: any) {
      alert(err.message || 'Failed to pin/unpin notice.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Strike down and remove "${title}" from the Community Notice Board?`)) return;
    try {
      await deleteNotice(id);
      setNotices(prev => prev.filter(n => n._id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove notice.');
    }
  };

  const filteredNotices = notices.filter(n => {
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.postedByName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryInfo = (cat: string) => {
    return NOTICE_CATEGORIES.find(c => c.id === cat) || NOTICE_CATEGORIES[1];
  };

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-5xl mx-auto space-y-8">
      {/* ── Hero Banner with Atmospheric Grand Library Background ── */}
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden text-center rounded-sm" style={{
        background: `linear-gradient(180deg, rgba(18,16,14,0.85) 0%, rgba(10,9,8,0.95) 100%), url(${grandArchiveLibraryBg}) center/cover no-repeat`,
        border: '1px solid rgba(212, 175, 55, 0.45)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.75)'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold mb-3 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
          <Megaphone className="w-3.5 h-3.5" />
          <span>✦ Sovereign Dispatch & Imperial Gazettes ✦</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
          Community Notice Board
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base italic leading-relaxed mt-2" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
          “Official decrees, realm updates, and herald announcements proclaimed by the Imperial Postmasters for all citizens and couriers.”
        </p>

        {/* Real-time sync indicator & Admin Inscribe Button */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 bg-emerald-950/80 text-emerald-300 text-xs px-3 py-1.5 rounded-full font-mono font-bold border border-emerald-500/40 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Time Realm Sync Active
          </span>

          {isAdmin ? (
            <button
              onClick={() => { setError(''); setShowDraftModal(true); }}
              className="btn-velvet-burgundy text-xs py-1.5 px-4 font-bold flex items-center gap-2 shadow-lg"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <PenTool className="w-3.5 h-3.5 text-amber-300" />
              <span>Inscribe Royal Decree</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-300/70 italic font-serif">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Only Admins may proclaim notices
            </span>
          )}
        </div>
      </div>

      {/* ── Filters & Category Navigation Bar ── */}
      <div className="theatrical-card p-4 rounded-sm space-y-4" style={{
        background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)'
      }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {NOTICE_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-sm font-serif transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold shadow-sm'
                      : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-amber-900/50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-64 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search decrees & news..."
              className="w-full text-xs px-3 py-2 rounded-sm bg-stone-950/80 border border-amber-900/40 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 font-serif"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-200 text-xs">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Notice List ── */}
      {loading ? (
        <div className="text-center p-12 animate-pulse space-y-3" style={{ color: 'var(--antique-gold)' }}>
          <Megaphone className="w-12 h-12 mx-auto animate-bounce opacity-70" />
          <p className="font-serif italic text-lg" style={{ fontFamily: "'Cinzel', serif" }}>
            Unrolling Sovereign Notice Parchments & Imperial Chronicles...
          </p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="theatrical-card p-12 text-center rounded-sm bg-stone-950/60 border border-dashed border-stone-800 text-stone-400 italic font-serif">
          <Scroll className="w-12 h-12 mx-auto mb-3 opacity-40 text-amber-400" />
          <p className="text-lg font-bold text-stone-300">No proclamations found under this category.</p>
          <p className="text-xs mt-1 text-stone-500">When the Postmasters post updates or warnings, they will immediately manifest upon this board.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const catInfo = getCategoryInfo(notice.category);
            const isPinned = notice.isPinned;
            const dateStr = notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Ancient Decree';

            return (
              <motion.div
                key={notice._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`theatrical-card p-5 sm:p-7 rounded-sm relative overflow-hidden transition-all ${
                  isPinned ? 'shadow-[0_0_25px_rgba(212,175,55,0.15)]' : ''
                }`}
                style={{
                  background: isPinned
                    ? 'linear-gradient(150deg, rgba(38, 28, 14, 0.95) 0%, rgba(18, 15, 12, 0.98) 100%)'
                    : 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
                  border: isPinned ? '1.5px solid rgba(212, 175, 55, 0.7)' : '1px solid rgba(212, 175, 55, 0.25)'
                }}
              >
                {/* Gold Top Accent Line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isPinned ? '3px' : '1.5px', background: isPinned ? 'linear-gradient(to right, #D4AF37, #F5D061, #D4AF37)' : 'linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)' }} />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {isPinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm animate-glow-pulse">
                          <Pin className="w-3 h-3 fill-amber-300" />
                          <span>Pinned Decree</span>
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catInfo.color}`}>
                        <span>{catInfo.icon}</span>
                        <span>{catInfo.label}</span>
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel', serif", color: isPinned ? 'var(--antique-gold)' : 'var(--parchment-light)' }}>
                      {notice.title}
                    </h3>
                  </div>

                  {/* Admin Management Tools (Pin & Delete) */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                      <button
                        onClick={() => handleTogglePin(notice._id)}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                          isPinned 
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 hover:bg-amber-900/60'
                            : 'bg-stone-900/80 text-stone-400 border-stone-700 hover:text-amber-200'
                        }`}
                        title={isPinned ? 'Unpin decree' : 'Pin decree to top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(notice._id, notice.title)}
                        className="text-xs px-2.5 py-1 rounded bg-red-950/60 text-red-300 border border-red-800/60 hover:bg-red-900/60 transition-colors flex items-center gap-1"
                        title="Remove proclamation from board"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Content Body */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif p-3.5 rounded-sm my-3" style={{
                  background: 'rgba(255, 253, 249, 0.04)',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  color: 'var(--parchment)',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.05rem',
                  lineHeight: '1.65'
                }}>
                  {notice.content}
                </div>

                {/* Footer Attribution & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-900/25 text-xs italic font-serif" style={{ color: 'var(--gold-muted)' }}>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Proclaimed by <strong>{notice.postedByName || 'Postmaster Tribunal'}</strong></span>
                  </span>
                  <span className="font-mono text-[11px] opacity-80">{dateStr}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Admin Inscription Modal ── */}
      <AnimatePresence>
        {showDraftModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5, 4, 3, 0.85)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="theatrical-card p-6 sm:p-8 max-w-2xl w-full rounded-sm relative overflow-hidden shadow-2xl space-y-5"
              style={{
                background: 'linear-gradient(160deg, #1C1915 0%, #100E0C 100%)',
                border: '2px solid var(--antique-gold)'
              }}
            >
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-amber-400" />
                  <h3 className="text-xl sm:text-2xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                    Inscribe Royal Proclamation
                  </h3>
                </div>
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="p-1 rounded text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 text-xs rounded-sm font-serif">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handlePostNotice} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-amber-300 font-mono">
                    Decree Headline / Title ({newTitle.length}/120)
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Festival of the Golden Wax Seal Begins!"
                    required
                    className="w-full text-sm p-2.5 rounded-sm bg-stone-950/90 border border-amber-900/50 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-400 font-serif"
                  />
                </div>

                {/* Category & Pin Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-amber-300 font-mono">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e: any) => setNewCategory(e.target.value)}
                      className="w-full text-sm p-2.5 rounded-sm bg-stone-950/90 border border-amber-900/50 text-stone-200 focus:outline-none focus:border-amber-400 font-serif"
                    >
                      <option value="announcement">📢 Sovereign Decree</option>
                      <option value="update">⚡ Realm Update</option>
                      <option value="news">📰 Kingdom Gazette</option>
                      <option value="event">🎪 Guild Festival / Quest</option>
                      <option value="warning">⚠️ Imperial Warning</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-serif text-amber-200">
                      <input
                        type="checkbox"
                        checked={newIsPinned}
                        onChange={(e) => setNewIsPinned(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="font-bold flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5 text-amber-400" /> Pin this decree to the top
                      </span>
                    </label>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-amber-300 font-mono">
                    Proclamation Content ({newContent.length}/2000)
                  </label>
                  <textarea
                    rows={6}
                    maxLength={2000}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Inscribe the detailed decree, herald announcement, or maintenance notice for all citizens to read..."
                    required
                    className="w-full text-sm p-3 rounded-sm bg-stone-950/90 border border-amber-900/50 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-400 font-serif leading-relaxed"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/30">
                  <button
                    type="button"
                    onClick={() => setShowDraftModal(false)}
                    className="btn-gold-saloon text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-velvet-burgundy text-xs py-2 px-6 font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    <Megaphone className="w-4 h-4 text-amber-300" />
                    <span>{submitting ? 'Broadcasting...' : 'Proclaim Decree to Realm'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// GUILD LEADERBOARDS (Feature 11 & Feature: Cartographic Note Status in Leaderboards)
// ============================================
function Leaderboard() {
  const [data, setData] = useState<{ mailmanOfTheMonth: any; topMailmen: any[]; topSenders: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const currentUser = getStoredUser();

  useEffect(() => {
    const viewerId = currentUser?.id || currentUser?._id;
    getLeaderboard(viewerId).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center p-12 animate-pulse space-y-3" style={{ color: 'var(--antique-gold)' }}>
        <Trophy className="w-12 h-12 mx-auto animate-bounce opacity-70" />
        <p className="font-serif italic text-lg" style={{ fontFamily: "'Cinzel', serif" }}>
          Consulting the Sovereign Hall of Fame & Imperial Guild Ledgers...
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-5xl mx-auto space-y-8">
      {/* ── Hero Banner with Atmospheric Background ── */}
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden text-center rounded-sm" style={{
        background: `linear-gradient(180deg, rgba(18,16,14,0.75) 0%, rgba(10,9,8,0.92) 100%), url(${courierDirectoryRosterBg}) center/cover no-repeat`,
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold mb-3 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
          <Trophy className="w-3.5 h-3.5" />
          <span>✦ The Sovereign Hall of Fame & Imperial Roster ✦</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
          Guild Hall of Fame
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base italic leading-relaxed mt-2" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
          “Immortalizing the swiftest couriers who traverse untamed frontiers, and honoring the noble scribes whose epistolary reputation resounds across the kingdom.”
        </p>

        {/* ── Mailman of the Month Crown Jewel Showcase ── */}
        {data?.mailmanOfTheMonth && (
          <div 
            onClick={() => setSelectedUserId(data.mailmanOfTheMonth._id)}
            className="mt-8 max-w-2xl mx-auto p-6 sm:p-8 rounded-sm relative overflow-hidden animate-glow-pulse text-center cursor-pointer transition-transform hover:scale-[1.01]" 
            style={{
              background: 'linear-gradient(145deg, rgba(45,35,18,0.9) 0%, rgba(20,16,10,0.95) 100%)',
              border: '2px solid var(--antique-gold)',
              boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(212,175,55,0.2)'
            }}
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              <Crown className="w-9 h-9 text-amber-300 animate-bounce" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ✦ Imperial Courier of the Realm ✦
            </span>
            <h3 className="text-2xl sm:text-4xl font-bold mt-2 tracking-wide" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
              {data.mailmanOfTheMonth.name}
            </h3>
            <p className="italic text-sm sm:text-base mt-1 text-amber-200/80 font-serif">
              {data.mailmanOfTheMonth.rank || 'Grand Royal Courier'} • <strong className="text-amber-300 font-mono">{data.mailmanOfTheMonth.xp || 0} XP</strong> • <strong className="text-emerald-300 font-mono">{data.mailmanOfTheMonth.deliveriesCompleted || 0} Deliveries Completed</strong>
            </p>
            {data.mailmanOfTheMonth.noteStatus && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs italic font-serif max-w-md mx-auto" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'var(--parchment-light)' }}>
                <span className="text-base">{NOTE_STATUS_MOODS[data.mailmanOfTheMonth.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                <span>“{data.mailmanOfTheMonth.noteStatus}”</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Top Couriers & Top Senders Dual Podiums ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Couriers by XP */}
        <div className="theatrical-card p-6 sm:p-8 relative overflow-hidden rounded-sm" style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, #D4AF37, transparent)' }} />
          <h3 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2.5 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            <Feather className="w-6 h-6 text-amber-400" />
            <span>Top Couriers (by XP)</span>
          </h3>

          <div className="space-y-3">
            {(data?.topMailmen ?? []).length === 0 ? (
              <p className="italic text-sm text-stone-400 font-serif p-4 text-center">No couriers have logged journeys yet.</p>
            ) : (
              (data?.topMailmen ?? []).map((m: any, i: number) => {
                const isFirst = i === 0;
                const isSecond = i === 1;
                const isThird = i === 2;

                return (
                  <div
                    key={m._id || i}
                    onClick={() => setSelectedUserId(m._id)}
                    className="p-3.5 rounded-sm transition-all hover:translate-x-1 cursor-pointer space-y-1.5"
                    style={{
                      background: isFirst 
                        ? 'linear-gradient(135deg, rgba(60,45,15,0.7) 0%, rgba(30,22,10,0.85) 100%)'
                        : isSecond 
                          ? 'linear-gradient(135deg, rgba(45,45,45,0.6) 0%, rgba(20,20,20,0.8) 100%)'
                          : isThird 
                            ? 'linear-gradient(135deg, rgba(50,30,20,0.6) 0%, rgba(25,15,10,0.8) 100%)'
                            : 'rgba(255,253,249,0.03)',
                      border: isFirst 
                        ? '1px solid rgba(212,175,55,0.6)' 
                        : isSecond 
                          ? '1px solid rgba(200,200,200,0.4)' 
                          : isThird 
                            ? '1px solid rgba(205,127,50,0.4)' 
                            : '1px solid rgba(212,175,55,0.15)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-mono" style={{
                          background: isFirst ? '#D4AF37' : (isSecond ? '#C0C0C0' : (isThird ? '#CD7F32' : 'rgba(255,255,255,0.1)')),
                          color: isFirst || isSecond || isThird ? '#1A1A1A' : 'var(--parchment-light)'
                        }}>
                          {i + 1}
                        </span>
                        <span className="font-bold text-base" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                          {m.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded font-mono" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                          {m.xp || 0} XP
                        </span>
                      </div>
                    </div>

                    {m.noteStatus && (
                      <div className="flex items-center gap-1.5 text-xs italic font-serif p-1.5 rounded-sm" style={{ background: 'rgba(255,253,249,0.06)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--parchment-light)' }}>
                        <span className="text-sm">{NOTE_STATUS_MOODS[m.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                        <span className="truncate">"{m.noteStatus}"</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Senders by Reputation */}
        <div className="theatrical-card p-6 sm:p-8 relative overflow-hidden rounded-sm" style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, #D4AF37, transparent)' }} />
          <h3 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2.5 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            <Award className="w-6 h-6 text-amber-400" />
            <span>Top Senders (by Reputation)</span>
          </h3>

          <div className="space-y-3">
            {(data?.topSenders ?? []).length === 0 ? (
              <p className="italic text-sm text-stone-400 font-serif p-4 text-center">No scribes have earned reputation points yet.</p>
            ) : (
              (data?.topSenders ?? []).map((s: any, i: number) => {
                const isFirst = i === 0;
                const isSecond = i === 1;
                const isThird = i === 2;

                return (
                  <div
                    key={s._id || i}
                    onClick={() => setSelectedUserId(s._id)}
                    className="p-3.5 rounded-sm transition-all hover:translate-x-1 cursor-pointer space-y-1.5"
                    style={{
                      background: isFirst 
                        ? 'linear-gradient(135deg, rgba(60,45,15,0.7) 0%, rgba(30,22,10,0.85) 100%)'
                        : isSecond 
                          ? 'linear-gradient(135deg, rgba(45,45,45,0.6) 0%, rgba(20,20,20,0.8) 100%)'
                          : isThird 
                            ? 'linear-gradient(135deg, rgba(50,30,20,0.6) 0%, rgba(25,15,10,0.8) 100%)'
                            : 'rgba(255,253,249,0.03)',
                      border: isFirst 
                        ? '1px solid rgba(212,175,55,0.6)' 
                        : isSecond 
                          ? '1px solid rgba(200,200,200,0.4)' 
                          : isThird 
                            ? '1px solid rgba(205,127,50,0.4)' 
                            : '1px solid rgba(212,175,55,0.15)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-mono" style={{
                          background: isFirst ? '#D4AF37' : (isSecond ? '#C0C0C0' : (isThird ? '#CD7F32' : 'rgba(255,255,255,0.1)')),
                          color: isFirst || isSecond || isThird ? '#1A1A1A' : 'var(--parchment-light)'
                        }}>
                          {i + 1}
                        </span>
                        <span className="font-bold text-base" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                          {s.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded font-mono" style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)' }}>
                          {s.reputationScore || 0} pts
                        </span>
                      </div>
                    </div>

                    {s.noteStatus && (
                      <div className="flex items-center gap-1.5 text-xs italic font-serif p-1.5 rounded-sm" style={{ background: 'rgba(255,253,249,0.06)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--parchment-light)' }}>
                        <span className="text-sm">{NOTE_STATUS_MOODS[s.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                        <span className="truncate">"{s.noteStatus}"</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Traveller Profile Modal */}
      <TravellerProfileModal
        userId={selectedUserId}
        viewerId={currentUser?.id || currentUser?._id}
        onClose={() => setSelectedUserId(null)}
      />
    </motion.div>
  );
}

// ============================================
// QR SCANNER
// ============================================
function QRScanner() {
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isMisdelivery, setIsMisdelivery] = useState(false);
  const [penaltyApplied, setPenaltyApplied] = useState(false);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      setScannerError('');
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }
      setCameraActive(true);
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!loading) {
            handleScan(decodedText);
          }
        },
        (_errorMessage) => {
          // parse errors are normal (no QR found yet)
        }
      );
    } catch (err: any) {
      setCameraActive(false);
      setScannerError(`Camera error: ${err.message || err}`);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setCameraActive(false);
      } catch (e) {
        console.error("Error stopping camera", e);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const [scanActionType, setScanActionType] = useState<'dispatch' | 'unseal' | null>(null);

  const handleScan = async (text: string) => {
    if (!text || loading) return;
    setLoading(true);
    setResult(text);
    await stopCamera();
    try {
      const res = await scanLetter(text);
      setMessage(res.message || 'Scan successful!');
      setIsMisdelivery(false);

      const isDispatch = res.letter?.status === 'in-transit' || 
                         (res.message || '').toLowerCase().includes('picked up') || 
                         (res.message || '').toLowerCase().includes('deliveries');

      if (isDispatch) {
        setScanActionType('dispatch');
        waxSealAudio.playSaddlebagDispatch();
      } else {
        setScanActionType('unseal');
        waxSealAudio.playUnsealingDelivery();
      }

      setTimeout(() => navigate('/'), 4000);
    } catch (e: any) {
      const errMsg = e.message || 'Invalid Wax Seal';
      const isWrongPerson = errMsg.includes('not addressed to thee');
      setMessage(errMsg);
      setIsMisdelivery(isWrongPerson);
      // Check if backend confirmed penalty was applied
      setPenaltyApplied(e?.penaltyApplied === true || isWrongPerson);
      if (isWrongPerson) {
        waxSealAudio.playWaxCrack?.();
        // Still redirect home after showing the message
        setTimeout(() => navigate('/'), 4000);
      }
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-2xl mx-auto text-center space-y-8">
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
        background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-3 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
          <span>🔍 The Royal Ocular Loupe</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-bold mb-2 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
          Scan Royal Wax Seal
        </h2>
        <p className="text-sm sm:text-base italic mb-6" style={{ color: 'var(--gold-muted)' }}>
          Align the wax seal's QR token within the optical frame to authenticate and process thy missive.
        </p>

        {message ? (
          <div className="p-8 rounded-sm flex flex-col items-center justify-center space-y-4 animate-curtain-reveal" style={{ background: isMisdelivery ? 'rgba(107,29,42,0.35)' : 'rgba(212,175,55,0.12)', border: `2px solid ${isMisdelivery ? '#EF4444' : 'var(--antique-gold)'}` }}>
            {isMisdelivery ? (
              /* Wrong Person / Misdelivery Penalty Panel */
              <div className="space-y-4 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-red-950/70 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
                <span className="text-[11px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                  ⚠ Misdelivery Detected by Central Hub ⚠
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-red-200" style={{ fontFamily: "'Cinzel', serif" }}>
                  {message}
                </h3>
                <p className="text-xs italic text-red-300/80 max-w-md font-serif">
                  The Central Postal Authority has flagged this scan. The assigned courier has been issued an official infraction.
                </p>
                {penaltyApplied && (
                  <div className="px-4 py-2 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-sm font-bold flex items-center gap-2">
                    <span>⚔️</span> Courier Penalty Applied: <span className="text-red-400">-15 XP</span>
                  </div>
                )}
              </div>
            ) : scanActionType === 'dispatch' ? (
              /* Courier Saddlebag Packing & Dispatch Animation */
              <div className="space-y-4 animate-glow-pulse flex flex-col items-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-amber-900/40 border-2 border-amber-400 shadow-[0_0_25px_rgba(212,175,55,0.5)] animate-float-gentle">
                  <Package className="w-10 h-10 text-amber-300 animate-bounce" />
                </div>
                <span className="text-[11px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ✦ Saddlebag Packed & Odyssey Staged ✦
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                  {message}
                </h3>
                <p className="text-xs italic text-amber-200/80 max-w-md font-serif">
                  The wax seal has been authenticated by royal courier. Missive is now secure within the royal saddlebag and en-route across the realm.
                </p>
              </div>
            ) : (
              /* Recipient Unsealing & Delivery Animation */
              <div className="space-y-4 animate-glow-pulse flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-950/70 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                    <CheckCircle className="w-10 h-10 text-emerald-300 animate-pulse" />
                  </div>
                  {/* Fractured Seal Particle Shards */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-emerald-300 animate-ping" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-[11px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✦ Wax Seal Fractured & Missive Unsealed ✦
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                  {message}
                </h3>
                <p className="text-xs italic text-emerald-200/80 max-w-md font-serif">
                  The royal missive has been authenticated and delivered directly into thy Sovereign Mailbox.
                </p>
              </div>
            )}
            <p className="text-xs italic font-mono pt-2" style={{ color: 'var(--gold-muted)' }}>Redirecting to thy sovereign desk...</p>
          </div>
        ) : (
          <div className="p-5 rounded-sm relative overflow-hidden flex flex-col justify-center items-center" style={{ background: 'rgba(255,253,249,0.03)', border: '1px solid rgba(212,175,55,0.25)' }}>
            {scannerError ? (
              <div className="p-6 text-center rounded-sm" style={{ background: 'rgba(107,29,42,0.4)', border: '1px solid rgba(239,68,68,0.4)' }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#FCA5A5', fontFamily: "'Cinzel', serif" }}>Camera Access Denied</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--parchment-light)' }}>{scannerError}</p>
                <button onClick={startCamera} className="btn-velvet-burgundy text-xs py-2 px-4">Try Again</button>
              </div>
            ) : !cameraActive && (
              <div className="p-8 sm:p-12 flex flex-col items-center space-y-4">
                <Scan className="w-16 h-16 animate-float-slow" style={{ color: 'var(--antique-gold)' }} />
                <p className="text-sm sm:text-base italic" style={{ color: 'var(--gold-muted)' }}>Tap below to ignite thy optical chamber lens.</p>
                <button onClick={startCamera} className="btn-velvet-burgundy text-sm py-3 px-8 animate-glow-pulse">
                  <Scan className="w-4 h-4" /> <span>✦ Activate Magical Lens</span>
                </button>
              </div>
            )}

            <div className="w-full">
              <div id="reader" className="w-full bg-black rounded-sm overflow-hidden" style={{ border: cameraActive ? '2px solid var(--antique-gold)' : 'none' }}></div>
              {cameraActive && (
                <button onClick={stopCamera} className="mt-4 bg-red-800 hover:bg-red-900 text-white px-6 py-2.5 rounded-sm font-bold text-xs shadow w-full" style={{ fontFamily: "'Cinzel', serif" }}>
                  Extinguish Camera Lens
                </button>
              )}
            </div>
          </div>
        )}

        {/* Manual Fallback */}
        <div className="mt-8 p-5 rounded-sm text-left" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <h4 className="font-bold text-sm mb-2 uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
            Manual Token Entry (For Scribes without optical lenses)
          </h4>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input 
              type="text" 
              value={result} 
              onChange={(e) => setResult(e.target.value)} 
              placeholder="Paste or inscribe token ID (e.g. POST-8f2a...)" 
              className="flex-1 p-3 rounded-sm font-mono text-sm focus:outline-none"
              style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)' }} 
            />
            <button onClick={() => handleScan(result)} disabled={loading} className="btn-velvet-burgundy text-xs py-3 px-6">
              Authenticate Token
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAP TRACKER (Feature #5 & #2 - Realm Vicinity Radar)
// ============================================
function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onMapClick, enabled }: { onMapClick: (coords: [number, number]) => void; enabled: boolean }) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Leaflet DivIcons for distinct realm entities
const createRealmDivIcon = (type: 'self' | 'mailman' | 'sender' | 'letter', inVicinity: boolean = false) => {
  let html = '';
  if (type === 'self') {
    html = `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:radial-gradient(circle,#1D4ED8 0%,#0F172A 100%);border:2.5px solid #93C5FD;box-shadow:0 0 16px rgba(59,130,246,0.9);color:#FFF;font-size:18px;cursor:pointer;">📍</div>`;
  } else if (type === 'mailman') {
    html = `<div class="${inVicinity ? 'courier-beacon-active' : ''}" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle,#B45309 0%,#1C1917 100%);border:2.5px solid #F59E0B;box-shadow:0 0 20px rgba(245,158,11,0.95);color:#FEF08A;font-size:20px;cursor:pointer;">🏇</div>`;
  } else if (type === 'sender') {
    html = `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#047857 0%,#064E3B 100%);border:2px solid #34D399;box-shadow:0 0 14px rgba(52,211,153,0.8);color:#A7F3D0;font-size:16px;cursor:pointer;">🪶</div>`;
  } else {
    html = `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#701A75 0%,#3B0764 100%);border:2px solid #E879F9;box-shadow:0 0 14px rgba(232,121,249,0.8);color:#FDF4FF;font-size:16px;cursor:pointer;">📜</div>`;
  }
  return L.divIcon({
    className: 'custom-realm-pin',
    html: html,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

function MapTracker() {
  const DEFAULT_COORDS: [number, number] = [51.5074, -0.1278]; // Imperial Postal Hub
  const [position, setPosition] = useState<[number, number]>(DEFAULT_COORDS);
  const [letters, setLetters] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [vicinityRadius, setVicinityRadius] = useState<number>(250);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locatingSuccess, setLocatingSuccess] = useState<string | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(true);
  const [clickToMoveEnabled, setClickToMoveEnabled] = useState<boolean>(false);
  const [requestingMailmanId, setRequestingMailmanId] = useState<string | null>(null);
  const [showRadarDispatchBox, setShowRadarDispatchBox] = useState<boolean>(true);
  const [dispatchedRequestMailman, setDispatchedRequestMailman] = useState<{ id: string; name: string; status: 'pending' | 'accepted' | 'declined' | 'dispatched'; letterToken?: string; message?: string } | null>(null);
  const [presentQrModal, setPresentQrModal] = useState<{ token: string; title: string } | null>(null);
  const user = getStoredUser();
  const [liveUser, setLiveUser] = useState<any>(user);

  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const positionRef = useRef<[number, number]>(DEFAULT_COORDS);
  const vicinityRadiusRef = useRef<number>(250);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    vicinityRadiusRef.current = vicinityRadius;
  }, [vicinityRadius]);

  const VICINITY_OPTIONS = [5, 10, 25, 50, 100, 250, 500, 1000];

  const getZoomForVicinity = (radius: number) => {
    if (radius <= 5) return 21;
    if (radius <= 10) return 20;
    if (radius <= 25) return 19;
    if (radius <= 50) return 18;
    if (radius <= 100) return 17;
    if (radius <= 250) return 16;
    if (radius <= 500) return 15;
    return 14;
  };

  useEffect(() => {
    if (user?.id || user?._id) {
      getUserProfile(user.id || user._id).then((profile) => {
        setLiveUser(profile);
        if (profile?.pickupAlertSettings?.radiusMeters) {
          setVicinityRadius(profile.pickupAlertSettings.radiusMeters);
        }
        if (profile?.location?.coordinates && (profile.location.coordinates[0] !== 0 || profile.location.coordinates[1] !== 0)) {
          const userSavedCoords: [number, number] = [profile.location.coordinates[1], profile.location.coordinates[0]];
          setPosition(userSavedCoords);
          emitJoinMap(userSavedCoords);
        }
      }).catch(() => {});
    }
  }, []);

  // Real-time Socket Connection Lifecycle (Mounted once)
  useEffect(() => {
    const socket: Socket = io();
    socketRef.current = socket;

    // Synchronize initial full active user list
    socket.on('map-users-sync', (users: any[]) => {
      if (Array.isArray(users)) {
        setActiveUsers(users);
      }
    });

    // Real-time instant new user join
    socket.on('user-joined-map', (newUser: any) => {
      if (newUser && newUser.userId) {
        const newId = String(newUser.userId);
        setActiveUsers(prev => {
          const filtered = prev.filter(u => String(u.userId || u._id || u.id) !== newId);
          return [...filtered, newUser];
        });
      }
    });

    // Real-time instant movement update
    socket.on('user-moved', (movedData: any) => {
      if (movedData && movedData.userId) {
        const movedId = String(movedData.userId);
        setActiveUsers(prev => prev.map(u => {
          if (String(u.userId || u._id || u.id) === movedId) {
            return {
              ...u,
              lat: movedData.lat,
              lng: movedData.lng,
              location: movedData.location || { type: 'Point', coordinates: [movedData.lng, movedData.lat] }
            };
          }
          return u;
        }));
      }
    });

    // Real-time instant note status update on map
    socket.on('user-note-updated', (noteData: any) => {
      if (noteData && noteData.userId) {
        const targetId = String(noteData.userId);
        setActiveUsers(prev => prev.map(u => {
          if (String(u.userId || u._id || u.id) === targetId) {
            return {
              ...u,
              noteStatus: noteData.noteStatus,
              noteStatusPrivacy: noteData.noteStatusPrivacy,
              noteStatusExpiresAt: noteData.noteStatusExpiresAt,
              noteStatusMood: noteData.noteStatusMood
            };
          }
          return u;
        }));
      }
    });

    // Real-time instant removal when user turns off location, closes tab, or logs out
    socket.on('user-left-map', ({ userId }: { userId: string }) => {
      if (userId) {
        const leftId = String(userId);
        setActiveUsers(prev => prev.filter(u => String(u.userId || u._id || u.id) !== leftId));
      }
    });

    // Scribe receives pickup response directly in MapTracker
    socket.on('scribe-pickup-response', (responseData: any) => {
      console.log('MapTracker received scribe-pickup-response:', responseData);
      if (responseData.accepted) {
        setDispatchedRequestMailman({
          id: responseData.mailmanId,
          name: responseData.mailmanName || 'Royal Mailman',
          status: 'accepted',
          letterToken: responseData.letterToken
        });
        setShowRadarDispatchBox(true);
      } else {
        setDispatchedRequestMailman({
          id: responseData.mailmanId,
          name: responseData.mailmanName || 'Royal Mailman',
          status: 'declined'
        });
        setShowRadarDispatchBox(true);
      }
    });

    // Real-time physical scan and handover completed
    socket.on('letter-handover-animated', (handoverData: any) => {
      console.log('MapTracker received letter-handover-animated:', handoverData);
      const myId = String(user?.id || user?._id);
      if (!myId) return;

      const isMyLetter = String(handoverData.senderId) === myId || (presentQrModal && presentQrModal.token === handoverData.token);

      if (isMyLetter) {
        // 1. Automatically close the QR Presentation Modal!
        setPresentQrModal(null);

        // 2. Display the Dispatched Proof in the Upper-Middle HUD!
        setDispatchedRequestMailman({
          id: handoverData.mailmanId || '',
          name: handoverData.mailmanName || 'Royal Mailman',
          status: 'dispatched',
          message: `📜 Missive Successfully Dispatched & Transferred to Mailman ${handoverData.mailmanName}'s Saddlebag!`
        });
        setShowRadarDispatchBox(true);

        // 3. Automatically disappear after 10 seconds!
        setTimeout(() => {
          setDispatchedRequestMailman(prev => (prev?.status === 'dispatched' ? null : prev));
        }, 10000);
      }
    });

    // Real-time letters update (when dispatched, picked up, or delivered)
    socket.on('letters-updated', () => {
      if (positionRef.current) {
        fetch(`/api/letters/nearby?lat=${positionRef.current[0]}&lng=${positionRef.current[1]}&radius=${vicinityRadiusRef.current}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('postmaster_token')}` }
        }).then(r => r.json()).then(res => {
          if (Array.isArray(res)) setLetters(res);
        }).catch(() => {});
      }
    });

    return () => {
      if (socket) {
        socket.emit('leave-map', { userId: user?.id || user?._id });
        socket.disconnect();
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const emitJoinMap = (coords: [number, number]) => {
    if (socketRef.current && (user?.id || user?._id)) {
      socketRef.current.emit('join-map', {
        userId: user.id || user._id,
        name: user.name,
        role: user.role,
        rank: liveUser?.rank || 'Novice',
        xp: liveUser?.xp || 0,
        reputationScore: liveUser?.reputationScore || 0,
        noteStatus: liveUser?.noteStatus || '',
        noteStatusPrivacy: liveUser?.noteStatusPrivacy || 'public',
        noteStatusExpiresAt: liveUser?.noteStatusExpiresAt || null,
        noteStatusMood: liveUser?.noteStatusMood || 'quill',
        lat: coords[0],
        lng: coords[1]
      });
    }
  };

  const updateCoordinates = (newCoords: [number, number], message?: string) => {
    setPosition(newCoords);
    setIsSharingLocation(true);
    setLocating(false);
    setError(null);
    setLocatingSuccess(message || `Coordinates synchronized: (${newCoords[0].toFixed(4)}, ${newCoords[1].toFixed(4)})`);
    setTimeout(() => setLocatingSuccess(null), 4500);

    emitJoinMap(newCoords);

    if (socketRef.current && (user?.id || user?._id)) {
      socketRef.current.emit('update-location', {
        userId: user.id || user._id,
        lat: newCoords[0],
        lng: newCoords[1]
      });
    }
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser Geolocation is not supported. Thou canst click on the map to set thy coordinates manually.");
      updateCoordinates(DEFAULT_COORDS, "Using Imperial Postal Hub coordinates.");
      return;
    }
    setLocating(true);
    setError(null);
    setLocatingSuccess("Seeking coordinates upon the realm...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        updateCoordinates(coords);

        if (watchIdRef.current === null) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (watchPos) => {
              const newCoords: [number, number] = [watchPos.coords.latitude, watchPos.coords.longitude];
              setPosition(newCoords);
              if (socketRef.current && (user?.id || user?._id)) {
                socketRef.current.emit('update-location', {
                  userId: user.id || user._id,
                  lat: newCoords[0],
                  lng: newCoords[1]
                });
              }
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
          );
        }
      },
      (err) => {
        console.warn('Geolocation warning (using default/fallback):', err);
        setLocating(false);
        setLocatingSuccess(null);
        setError("GPS signal unreached (using Realm coordinates). Thou canst click anywhere on the map to reposition thy pin.");
        updateCoordinates(DEFAULT_COORDS, "Realm Coordinates active upon map.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const stopSharingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (socketRef.current && (user?.id || user?._id)) {
      socketRef.current.emit('leave-map', { userId: user.id || user._id });
    }
    setIsSharingLocation(false);
    setLocatingSuccess("Location sharing paused. Thou art now cloaked from the realm.");
    setTimeout(() => setLocatingSuccess(null), 4500);
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const refreshMapData = async () => {
    setRefreshing(true);
    try {
      const [nearbyRes, mapUsers] = await Promise.all([
        fetch(`/api/letters/nearby?lat=${position[0]}&lng=${position[1]}&radius=${vicinityRadius}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('postmaster_token')}` }
        }).then(r => r.json()).catch(() => []),
        getActiveMapUsers(position[0], position[1], vicinityRadius, user?.id || user?._id).catch(() => [])
      ]);

      if (Array.isArray(nearbyRes)) setLetters(nearbyRes);
      if (Array.isArray(mapUsers)) setActiveUsers(mapUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshMapData();
  }, [position, vicinityRadius]);

  const claimLetter = async (letter: any) => {
    try {
      const res = await scanLetter(letter.qrCodeToken);
      alert(res.message || 'Letter claimed! It is now in thy deliveries.');
      refreshMapData();
    } catch (e: any) {
      alert(e.message || 'Could not claim letter.');
    }
  };

  // Feature: Scribe sends a Pickup Request Ping to a real Mailman
  const handleRequestPickupFromCourier = (targetCourier: any) => {
    if (!socketRef.current || !user) return;
    const courierId = String(targetCourier.userId || targetCourier._id);
    const courierName = targetCourier.name || 'Royal Mailman';

    setRequestingMailmanId(courierId);
    setDispatchedRequestMailman({
      id: courierId,
      name: courierName,
      status: 'pending'
    });
    setShowRadarDispatchBox(true);
    setLocatingSuccess(`⏳ Herald dispatched to ${courierName}! Awaiting mailman's response...`);
    setTimeout(() => setLocatingSuccess(null), 6000);

    const letterToHandover = (lettersInVicinity.length > 0 ? lettersInVicinity[0] : null);

    socketRef.current.emit('scribe-request-pickup', {
      senderId: user.id || user._id,
      senderName: user.name,
      mailmanId: courierId,
      letterId: letterToHandover?._id || '',
      letterToken: letterToHandover?.qrCodeToken || '',
      distanceMeters: targetCourier.calculatedDist,
      message: "Noble Mailman, please accept custody of my sealed missive."
    });
  };

  // Filter letters within chosen vicinity and compute exact distance
  const lettersInVicinity = letters.map((l: any) => {
    const dist = (position && l.senderLocation?.lat && l.senderLocation?.lng)
      ? calculateDistanceMeters(position[0], position[1], l.senderLocation.lat, l.senderLocation.lng)
      : (l.distanceMeters ?? 0);
    return { ...l, calculatedDist: dist };
  }).filter((l: any) => l.calculatedDist <= vicinityRadius);

  // Map active real members who are strictly within the user's defined vicinity radius
  const allOtherActiveUsers = activeUsers.map((u: any) => {
    const uid = String(u._id || u.userId || u.id);
    const currentId = String(user?.id || user?._id);

    if (uid === currentId) {
      return null;
    }

    const uLat = u.lat ?? u.location?.coordinates?.[1];
    const uLng = u.lng ?? u.location?.coordinates?.[0];

    if (typeof uLat !== 'number' || typeof uLng !== 'number' || (uLat === 0 && uLng === 0)) {
      return null;
    }

    const dist = calculateDistanceMeters(position[0], position[1], uLat, uLng);
    const inVicinity = dist <= vicinityRadius;
    if (!inVicinity) {
      return null;
    }

    return { ...u, calculatedDist: dist, lat: uLat, lng: uLng, inVicinity: true };
  }).filter((u: any) => u !== null);

  const nearbyMailmen = allOtherActiveUsers.filter(u => u.role === 'mailman');
  const nearbySenders = allOtherActiveUsers.filter(u => u.role !== 'mailman');

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="max-w-6xl mx-auto theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
      border: '1px solid rgba(212, 175, 55, 0.35)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
    }}>
      {/* Top Gold Rule */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

      {/* Presentation QR Code Modal */}
      <AnimatePresence>
        {presentQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="max-w-sm w-full theatrical-card p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden border-2 border-amber-500 text-center" style={{
              background: 'linear-gradient(160deg, #1C1814 0%, #100E0C 100%)',
              boxShadow: '0 0 50px rgba(212, 175, 55, 0.45)'
            }}>
              <button onClick={() => setPresentQrModal(null)} className="absolute top-3 right-3 text-amber-300 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>

              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-400 block mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
                Present to Royal Mailman
              </span>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel Decorative', serif" }}>
                {presentQrModal.title}
              </h3>

              <div className="bg-white p-4 rounded-sm inline-block mx-auto shadow-inner border-4 border-amber-800/40 mb-4">
                <QRCodeCanvas value={presentQrModal.token} size={220} fgColor="#1A1A1A" />
              </div>

              <p className="text-xs italic text-amber-200/90 font-serif leading-relaxed">
                Hold up this seal for the Mailman to scan with their device camera / scanner. Custody will officially transfer once scanned!
              </p>

              <button onClick={() => setPresentQrModal(null)} className="btn-gold-saloon mt-5 w-full py-2.5 text-xs font-bold justify-center">
                Done / Close Seal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
        <div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold animate-float-gentle" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              <span>🧭 Cartographer's Scriptorium</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.4)', fontFamily: "'Cinzel', serif" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Realm ({allOtherActiveUsers.length + 1})
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-wide mt-2 flex items-center gap-3" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            <Compass className="w-8 h-8 flex-shrink-0 animate-float-slow" style={{ color: 'var(--antique-gold)' }} />
            The Realm Map & Radar
          </h2>
          <p className="text-sm sm:text-base italic mt-1" style={{ color: 'var(--gold-muted)' }}>
            {user?.role === 'mailman' 
              ? 'Real-time radar: Claim nearby missives and see active senders live across the realm.'
              : 'Real-time radar: Track nearby royal mailmen and ping mailmen to accept custody of thy missives.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dispatch HUD Toggle */}
          <button
            onClick={() => setShowRadarDispatchBox(!showRadarDispatchBox)}
            className={`px-3 py-2 rounded-sm font-bold text-xs shadow flex items-center gap-1.5 transition-all border ${
              showRadarDispatchBox 
                ? 'bg-amber-600 text-white border-amber-300' 
                : 'bg-white/5 text-amber-200 border-amber-500/30 hover:bg-white/10'
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
            title="Toggle Mailman Dispatch HUD"
          >
            <Radio className="w-3.5 h-3.5 text-amber-300" />
            <span>{showRadarDispatchBox ? 'Hide Dispatch HUD' : 'Show Dispatch HUD'}</span>
          </button>

          {/* Click to Pin / Reposition Toggle */}
          <button 
            onClick={() => setClickToMoveEnabled(!clickToMoveEnabled)}
            className={`px-3 py-2 rounded-sm font-bold text-xs shadow flex items-center gap-1.5 transition-all border ${
              clickToMoveEnabled 
                ? 'bg-amber-600 text-white border-amber-300 animate-pulse' 
                : 'bg-white/5 text-amber-200/80 border-amber-500/30 hover:bg-white/10'
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
            title="Click anywhere on the map to reposition thy pin"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{clickToMoveEnabled ? 'Click Map to Move' : 'Reposition Pin'}</span>
          </button>

          {isSharingLocation ? (
            <button 
              onClick={stopSharingLocation}
              className="px-3.5 py-2 rounded-sm font-bold text-xs shadow flex items-center gap-1.5 transition-colors text-white"
              style={{ background: '#7F1D1D', border: '1px solid #DC2626', fontFamily: "'Cinzel', serif" }}
              title="Cloak thy position and stop sharing GPS location"
            >
              <X className="w-3.5 h-3.5" /> Cloak
            </button>
          ) : (
            <button 
              onClick={fetchLocation} 
              className="px-3.5 py-2 rounded-sm font-bold text-xs shadow flex items-center gap-1.5 transition-colors text-white"
              style={{ background: '#047857', border: '1px solid #10B981', fontFamily: "'Cinzel', serif" }}
              title="Grant location and broadcast coordinates to the guild"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Broadcast GPS
            </button>
          )}

          <button 
            onClick={fetchLocation} 
            disabled={locating}
            className="btn-gold-saloon text-xs py-2 px-3.5 flex items-center gap-1.5"
            title="Update celestial GPS coordinates"
          >
            <Radio className={`w-4 h-4 text-emerald-400 ${locating ? 'animate-spin' : 'animate-pulse'}`} /> 
            {locating ? 'Locating...' : 'GPS Relocate'}
          </button>
          <button 
            onClick={refreshMapData} 
            disabled={refreshing}
            className="btn-velvet-burgundy text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <Feather className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> 
            {refreshing ? 'Scanning...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Upper-Middle Realm Radar Dispatch HUD Box */}
      <AnimatePresence>
        {showRadarDispatchBox && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mb-6 p-4 sm:p-5 rounded-sm shadow-2xl relative overflow-hidden animate-curtain-reveal"
            style={{
              background: 'linear-gradient(135deg, rgba(28,24,20,0.97) 0%, rgba(18,16,14,0.98) 100%)',
              border: '2px solid var(--antique-gold)',
              boxShadow: '0 10px 35px rgba(0,0,0,0.7), 0 0 20px rgba(212,175,55,0.2)'
            }}
          >
            {/* Top Gold Trim */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

            <div className="flex items-center justify-between border-b border-amber-500/25 pb-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                    <span>📡 Missive Dispatch Radar</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {vicinityRadius}m Radar
                    </span>
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setShowRadarDispatchBox(false)}
                className="text-amber-400/70 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                title="Minimize HUD"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body based on State */}
            {dispatchedRequestMailman?.status === 'dispatched' ? (
              <div className="p-4 rounded-sm bg-emerald-950/80 border-2 border-emerald-400 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-curtain-reveal">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-900 border-2 border-emerald-400 flex items-center justify-center text-xl shadow-lg animate-bounce">
                    ✨
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-300 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                      <span>📜 Missive Successfully Dispatched!</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-500/50 uppercase tracking-widest font-mono">
                        Handover Verified
                      </span>
                    </p>
                    <p className="text-xs italic text-emerald-100/90 font-serif mt-0.5">
                      {dispatchedRequestMailman.message || `Custody has been officially transferred to Mailman ${dispatchedRequestMailman.name}'s Saddlebag!`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDispatchedRequestMailman(null)}
                  className="px-3 py-1.5 rounded text-xs font-bold text-emerald-200 hover:text-white bg-emerald-900/90 border border-emerald-500/50 shadow whitespace-nowrap"
                >
                  Dismiss Proof
                </button>
              </div>
            ) : dispatchedRequestMailman?.status === 'accepted' ? (
              <div className="p-4 rounded-sm bg-emerald-950/70 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-curtain-reveal">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-300" style={{ fontFamily: "'Cinzel', serif" }}>
                      Mailman {dispatchedRequestMailman.name} Accepted!
                    </p>
                    <p className="text-xs italic text-emerald-100/90 font-serif">
                      The mailman is on their way, please wait patiently! Present thy QR Seal below for scanning:
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      const token = dispatchedRequestMailman.letterToken || (lettersInVicinity[0]?.qrCodeToken) || '';
                      setPresentQrModal({
                        token: token,
                        title: `Handover to Mailman ${dispatchedRequestMailman.name}`
                      });
                    }}
                    className="btn-gold-saloon text-xs py-2 px-3.5 font-bold flex items-center gap-1.5 shadow-lg whitespace-nowrap"
                  >
                    <span>📜 Present QR Seal</span>
                  </button>
                  <button
                    onClick={() => setDispatchedRequestMailman(null)}
                    className="px-3 py-2 text-xs font-bold text-emerald-200 hover:text-white bg-emerald-900/60 rounded border border-emerald-600/40"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : dispatchedRequestMailman?.status === 'pending' ? (
              <div className="p-4 rounded-sm bg-amber-950/70 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-glow-pulse">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-spin-slow">⏳</span>
                  <div>
                    <p className="text-sm font-bold text-amber-300" style={{ fontFamily: "'Cinzel', serif" }}>
                      Herald Dispatched to {dispatchedRequestMailman.name}...
                    </p>
                    <p className="text-xs italic text-amber-200/90 font-serif">
                      Awaiting mailman's response to take custody of thy sealed missive.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDispatchedRequestMailman(null);
                    setRequestingMailmanId(null);
                  }}
                  className="px-3 py-1.5 rounded bg-black/40 hover:bg-black/60 text-xs font-bold text-amber-300 border border-amber-500/30"
                >
                  Cancel Request
                </button>
              </div>
            ) : dispatchedRequestMailman?.status === 'declined' ? (
              <div className="p-4 rounded-sm bg-red-950/70 border border-red-500/50 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-red-300" style={{ fontFamily: "'Cinzel', serif" }}>
                    Mailman {dispatchedRequestMailman.name} is currently unavailable.
                  </p>
                  <p className="text-xs italic text-red-200 font-serif">
                    Thou canst select another mailman in range or wait for them to be ready.
                  </p>
                </div>
                <button
                  onClick={() => setDispatchedRequestMailman(null)}
                  className="px-3 py-1.5 rounded bg-red-900/80 text-xs font-bold text-white border border-red-500/40"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <div>
                {user?.role === 'mailman' ? (
                  <div className="p-3 bg-amber-900/20 rounded border border-amber-500/30 text-xs text-amber-200/90 flex items-center justify-between">
                    <span>🏇 Royal Mailman Mode: Broadcasting celestial coordinates. Scribes in thy perimeter can send pickup pings to thee.</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs italic text-amber-200/80 mb-2.5 font-serif">
                      {nearbyMailmen.length > 0 
                        ? `Select an active Royal Mailman within thy ${vicinityRadius}m radar to send a pickup request:`
                        : `No Royal Mailmen currently within thy ${vicinityRadius}m perimeter.`}
                    </p>

                    {nearbyMailmen.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {nearbyMailmen.map((m: any) => (
                          <div key={m.userId || m._id} className="p-3 rounded-sm bg-black/40 border border-amber-500/25 flex flex-col justify-between gap-2.5 hover:border-amber-400 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-sm font-bold text-amber-200 block" style={{ fontFamily: "'Cinzel', serif" }}>
                                  {m.name}
                                </span>
                                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                  {m.calculatedDist}m away
                                </span>
                              </div>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono">
                                {m.rank || 'Mailman'}
                              </span>
                            </div>

                            <button
                              onClick={() => handleRequestPickupFromCourier(m)}
                              disabled={requestingMailmanId === (m.userId || m._id)}
                              className="btn-gold-saloon w-full py-1.5 text-xs font-bold justify-center flex items-center gap-1 shadow-md"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{requestingMailmanId === (m.userId || m._id) ? '⏳ Dispatched...' : '🏇 Request Pickup'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded bg-black/30 border border-amber-500/20 text-xs text-amber-300/70 flex items-center justify-between">
                        <span>💡 Try increasing thy radar radius above (e.g. 500m or 1000m) to reach more mailmen across the realm.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {locatingSuccess && (
        <div className="p-3.5 mb-4 rounded-sm text-sm font-bold flex items-center gap-2 shadow-md animate-curtain-reveal" style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.4)' }}>
          <CheckCircle className="w-5 h-5 text-emerald-400" /> {locatingSuccess}
        </div>
      )}

      {error && (
        <div className="p-3.5 mb-4 rounded-sm text-xs text-center italic flex items-center justify-between gap-3" style={{ background: 'rgba(107,29,42,0.4)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.4)' }}>
          <span>{error}</span>
          <button 
            onClick={() => setClickToMoveEnabled(true)}
            className="text-[11px] font-bold px-2 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-white"
          >
            Set Pin on Map
          </button>
        </div>
      )}

      {/* Vicinity Filter Bar */}
      <div className="p-4 rounded-sm mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-inner" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold flex items-center gap-1.5 text-sm uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
            <Radio className="w-4 h-4" /> Radar Vicinity:
          </span>
          {VICINITY_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => setVicinityRadius(r)}
              className="px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all"
              style={{
                fontFamily: "'Cinzel', serif",
                background: vicinityRadius === r ? 'var(--burgundy)' : 'rgba(255,253,249,0.06)',
                color: vicinityRadius === r ? '#FFF' : 'var(--gold-muted)',
                border: vicinityRadius === r ? '1px solid var(--antique-gold)' : '1px solid rgba(212,175,55,0.25)',
                transform: vicinityRadius === r ? 'scale(1.05)' : 'none'
              }}
            >
              {r}m
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-sm" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(59,130,246,0.5)', color: '#93C5FD' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm"></span> 
            Thou ({user?.name || (user?.role === 'mailman' ? 'Mailman' : 'Scribe')})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-sm" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.5)', color: 'var(--antique-gold)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm"></span> 
            Missives ({lettersInVicinity.length})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-sm" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(16,185,129,0.5)', color: '#6EE7B7' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm animate-pulse"></span> 
            Mailmen in Radar ({nearbyMailmen.length})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-sm" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(168,85,247,0.5)', color: '#D8B4FE' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm"></span> 
            Senders in Radar ({nearbySenders.length})
          </span>
        </div>
      </div>

      <div className="h-[620px] w-full rounded-sm overflow-hidden shadow-2xl relative" style={{ border: '2px solid var(--antique-gold)', filter: 'sepia(15%) contrast(98%) brightness(96%)' }}>
        <MapContainer 
          center={position} 
          zoom={getZoomForVicinity(vicinityRadius)} 
          minZoom={3}
          maxZoom={22} 
          scrollWheelZoom={true} 
          className="h-full w-full"
        >
          <MapRecenter center={position} zoom={getZoomForVicinity(vicinityRadius)} />
          <MapClickHandler onMapClick={(coords) => updateCoordinates(coords, `Pin placed upon (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`)} enabled={clickToMoveEnabled} />

          {/* Reliable High-Precision OpenStreetMap Tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxNativeZoom={19}
            maxZoom={22}
          />
          
          {/* User's current position (Thou) */}
          <Marker position={position} icon={createRealmDivIcon('self')}>
            <Popup>
              <div className="font-serif text-[#1A1A1A] text-center p-1.5 min-w-[170px]">
                <p className="font-bold text-base border-b border-[#D8CCA8] pb-1">📍 Thou Art Here</p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--burgundy)' }}>{user?.name}</p>
                <p className="text-xs italic capitalize font-semibold">Role: {user?.role === 'mailman' ? '🏇 Royal Mailman' : '📜 Noble Scribe'}</p>
                {liveUser?.noteStatus && !liveUser?.isNoteExpired && (
                  <div className="text-xs italic bg-amber-50 p-1.5 rounded mt-1.5 border border-amber-200 text-left flex items-start gap-1.5 shadow-sm">
                    <span className="text-sm flex-shrink-0">{NOTE_STATUS_MOODS[liveUser.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                    <span className="font-serif">"{liveUser.noteStatus}"</span>
                  </div>
                )}
                <p className="text-xs text-amber-900 font-bold mt-1.5 bg-amber-100 p-1 rounded border border-amber-300">Active Radar: {vicinityRadius}m</p>
              </div>
            </Popup>
          </Marker>

          {/* Vicinity radius circle */}
          <Circle
            center={position}
            radius={vicinityRadius}
            pathOptions={{ 
              color: '#D4AF37', 
              fillColor: '#D4AF37', 
              fillOpacity: 0.16, 
              weight: 2.5, 
              dashArray: '8, 8' 
            }}
          />

          {/* Nearby Letters awaiting collection in vicinity */}
          {lettersInVicinity.map((letter: any) => (
            <Marker 
              key={letter._id} 
              position={[letter.senderLocation.lat, letter.senderLocation.lng]}
              icon={createRealmDivIcon('letter')}
            >
              <Popup>
                <div className="font-serif text-[#1A1A1A] p-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-[#D8CCA8] pb-1">
                    <p className="font-bold text-base flex items-center gap-1">📜 Missive Awaits</p>
                    <span className="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">{letter.calculatedDist}m away</span>
                  </div>
                  <p className="text-xs mt-2"><span className="font-semibold">From:</span> {letter.senderRef?.name || 'Unknown'}</p>
                  {letter.receiverRef && <p className="text-xs"><span className="font-semibold">To:</span> {letter.receiverRef?.name || 'Unknown'}</p>}
                  {letter.burnAfterReading && <p className="text-xs text-red-700 font-bold mt-1">🔥 Burns in {letter.burnTimerSeconds || 60}s</p>}
                  {user?.role === 'mailman' ? (
                    <button
                      onClick={() => claimLetter(letter)}
                      className="mt-2.5 w-full py-1.5 px-3 bg-[#7A1E2E] hover:bg-[#5C1623] text-white text-xs font-bold rounded shadow transition-colors"
                    >
                      Claim this Missive
                    </button>
                  ) : (
                    <p className="text-[11px] italic mt-2 bg-[#FAF0E6] p-1 rounded border border-[#D8CCA8] text-center">
                      Awaiting mailman pickup
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Other active Guild travellers strictly within user-defined radar perimeter */}
          {allOtherActiveUsers.map((u: any) => (
            <Marker 
              key={u.userId || u._id || u.id} 
              position={[u.lat, u.lng]}
              icon={createRealmDivIcon(u.role === 'mailman' ? 'mailman' : 'sender', u.inVicinity)}
            >
              <Popup>
                <div className="font-serif text-[#1A1A1A] text-center p-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-[#D8CCA8] pb-1">
                    <p className="font-bold text-base">{u.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${u.inVicinity ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-800'}`}>
                      {u.calculatedDist}m away {u.inVicinity ? '🏇' : ''}
                    </span>
                  </div>
                  <p className="text-xs font-bold capitalize mt-1" style={{ color: u.role === 'mailman' ? '#B45309' : '#047857' }}>
                    {u.role === 'mailman' ? '🏇 Royal Mailman' : '📜 Noble Scribe'}
                  </p>
                  {u.role === 'mailman' && <p className="text-xs font-semibold text-gray-700">Rank: {u.rank || 'Mailman'} • {u.xp || 0} XP</p>}
                  {u.role !== 'mailman' && <p className="text-xs font-semibold text-gray-700">Reputation: {u.reputationScore || 0}</p>}
                  {u.noteStatus && (
                    <div className="text-xs italic bg-amber-50 p-1.5 rounded mt-1.5 border border-amber-200 text-left flex items-start gap-1.5 shadow-sm">
                      <span className="text-sm flex-shrink-0">{NOTE_STATUS_MOODS[u.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                      <span className="font-serif">"{u.noteStatus}"</span>
                    </div>
                  )}

                  {/* Scribe can ping this real Mailman to take letter */}
                  {user?.role !== 'mailman' && u.role === 'mailman' && (
                    <button
                      onClick={() => handleRequestPickupFromCourier(u)}
                      disabled={requestingMailmanId === (u.userId || u._id)}
                      className="mt-3 w-full py-2 px-3 btn-gold-saloon text-xs font-bold justify-center flex items-center gap-1.5 shadow-md animate-glow-pulse"
                      title="Send pickup request to this mailman"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      <span>{requestingMailmanId === (u.userId || u._id) ? '⏳ Herald Sent...' : '🏇 Ping Mailman to Take Letter'}</span>
                    </button>
                  )}

                  {u.inVicinity && u.role === 'mailman' && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 py-1 px-2 rounded border border-emerald-300">
                      🎯 Within Thy Alert Radius ({vicinityRadius}m)
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-sm shadow" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <p className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
            <Scroll className="w-5 h-5 text-[var(--antique-gold)]" /> 
            {lettersInVicinity.length} Missive{lettersInVicinity.length !== 1 ? 's' : ''} in {vicinityRadius}m Radar
          </p>
          <p className="text-xs sm:text-sm italic mt-1" style={{ color: 'var(--gold-muted)' }}>
            {lettersInVicinity.length > 0 ? 'Click pins upon the map to inspect waiting missives.' : 'No uncollected missives found within this radius.'}
          </p>
        </div>
        <div className="p-4 rounded-sm shadow flex flex-col justify-between" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <div>
            <p className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
              <Crown className="w-5 h-5 text-[var(--antique-gold)]" />
              {nearbyMailmen.length} Mailman{nearbyMailmen.length !== 1 ? 'men' : ''} in {vicinityRadius}m Radar
            </p>
            <p className="text-xs sm:text-sm italic mt-1" style={{ color: 'var(--gold-muted)' }}>
              {nearbyMailmen.length > 0 ? 'Active mailmen currently within thy radar perimeter.' : `No active mailmen within ${vicinityRadius}m.`}
            </p>
          </div>
          {user?.role !== 'mailman' && nearbyMailmen.length > 0 && (
            <div className="mt-3 space-y-2">
              {nearbyMailmen.slice(0, 3).map((c: any) => (
                <div key={c.userId || c._id} className="flex items-center justify-between p-2 rounded bg-black/40 border border-amber-500/20 text-xs">
                  <span className="font-bold text-amber-200">{c.name} ({c.calculatedDist}m)</span>
                  <button
                    onClick={() => handleRequestPickupFromCourier(c)}
                    disabled={requestingMailmanId === (c.userId || c._id)}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px]"
                  >
                    {requestingMailmanId === (c.userId || c._id) ? '⏳ Sent' : '🏇 Ping Mailman'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 rounded-sm shadow flex flex-col justify-between" style={{ background: 'rgba(255,253,249,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <div>
            <p className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
              <Users className="w-5 h-5 text-[var(--antique-gold)]" />
              {nearbySenders.length} Scribe{nearbySenders.length !== 1 ? 's' : ''} in {vicinityRadius}m Radar
            </p>
            <p className="text-xs sm:text-sm italic mt-1" style={{ color: 'var(--gold-muted)' }}>
              {nearbySenders.length > 0 ? 'Active scholars and senders within thy radar.' : `No active scribes within ${vicinityRadius}m.`}
            </p>
          </div>
          <Link to="/compose" className="btn-velvet-burgundy mt-3 text-xs justify-center py-2 px-4">
            ✍️ Inscribe Missive Here
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function Gallery({ user }: { user: any }) {
  const [liveUser, setLiveUser] = useState<any>(user);

  useEffect(() => {
    getUserProfile(user.id || user._id).then(setLiveUser).catch(() => {});
  }, []);

  // Feature 8: Sender Reputation Score — a free stamp unlocks for every letter dispatched
  const unlockedCount = Math.min(30, liveUser?.lettersSent || 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
      <div className="bg-[#FAF0E6] p-10 rounded-lg shadow-2xl border border-[#D2B48C]">
        <h2 className="text-4xl font-bold text-center mb-2 text-[#5C3A21] italic">The Royal Stamp Gallery</h2>
        <p className="text-center text-[#8B5A2B] italic mb-2">Collect stamps from thy travels across the realm.</p>
        {user?.role !== 'mailman' && (
          <p className="text-center text-sm mb-8 text-[#5C3A21] font-semibold flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-[#8B5A2B]" /> Reputation: {liveUser?.reputationScore ?? 0} • {unlockedCount}/30 stamps unlocked
          </p>
        )}
        {user?.role === 'mailman' && <div className="mb-8" />}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'Novice Seal', desc: 'First letter sent', emoji: '📜', earned: false },
            { name: 'Swift Courier', desc: '10 deliveries made', emoji: '🏇', earned: false },
            { name: 'Royal Decree', desc: 'Endorsed by the Crown', emoji: '👑', earned: false },
            { name: 'Night Owl', desc: 'Delivery after midnight', emoji: '🦉', earned: false },
            { name: 'Storm Rider', desc: 'Delivered in the rain', emoji: '⚡', earned: false },
            { name: 'Phantom Post', desc: 'Received a Dibbyuk letter', emoji: '👻', earned: false },
            { name: 'Pigeon Friend', desc: 'Used the bird network', emoji: '🕊️', earned: false },
            { name: 'Dragon Scaled', desc: 'Survive extreme heat', emoji: '🐉', earned: false },
            { name: 'Ocean Bottle', desc: 'Sent a message in a bottle', emoji: '🍾', earned: false },
            { name: 'Time Traveler', desc: 'Sent a time capsule', emoji: '⏳', earned: false },
            { name: 'Secret Keeper', desc: 'Sent an encrypted missive', emoji: '🗝️', earned: false },
            { name: 'Wax Master', desc: 'Used 5 different wax colors', emoji: '🕯️', earned: false },
            { name: 'Guild Initiate', desc: 'Joined the postmaster guild', emoji: '🤝', earned: false },
            { name: 'Mountain Climber', desc: 'Delivered to high altitudes', emoji: '⛰️', earned: false },
            { name: 'Desert Nomad', desc: 'Crossed the arid dunes', emoji: '🐪', earned: false },
            { name: 'Frost Walker', desc: 'Delivered in snowstorms', emoji: '❄️', earned: false },
            { name: 'Iron Horse', desc: 'Used the steam train', emoji: '🚂', earned: false },
            { name: 'Sea Captain', desc: 'Delivered via ship', emoji: '⛵', earned: false },
            { name: 'Star Gazer', desc: 'Nighttime delivery expert', emoji: '✨', earned: false },
            { name: 'Sun Bringer', desc: 'First delivery of the dawn', emoji: '🌅', earned: false },
            { name: 'Forest Ranger', desc: 'Navigated the deep woods', emoji: '🌲', earned: false },
            { name: 'City Dweller', desc: '100 urban deliveries', emoji: '🏙️', earned: false },
            { name: 'Rural Charm', desc: '100 countryside deliveries', emoji: '🏡', earned: false },
            { name: 'Speed Demon', desc: 'Delivered under 1 hour', emoji: '⚡', earned: false },
            { name: 'Heavy Load', desc: 'Delivered a large parcel', emoji: '📦', earned: false },
            { name: 'Featherweight', desc: 'Carried a single feather', emoji: '🪶', earned: false },
            { name: 'Ink Stained', desc: 'Wrote 50 letters', emoji: '🖋️', earned: false },
            { name: 'Parchment Hoarder', desc: 'Collected 100 letters', emoji: '📚', earned: false },
            { name: 'Golden Compass', desc: 'Perfect navigation score', emoji: '🧭', earned: false },
            { name: 'Mythic Carrier', desc: 'Legendary status achieved', emoji: '🦄', earned: false }
          ].map((stamp, i) => {
            const earned = i < unlockedCount;
            return (
              <motion.div key={i} whileHover={{ scale: 1.05, rotate: 2 }} className={`p-4 rounded-lg border-2 text-center transition-all ${earned ? 'border-[#8B5A2B] bg-[#FDF5E6] shadow-lg' : 'border-[#D2B48C] bg-[#FAF0E6] opacity-50'}`}>
                <span className="text-3xl block mb-2">{stamp.emoji}</span>
                <p className="font-bold text-[#5C3A21] text-sm leading-tight">{stamp.name}</p>
                <p className="text-[10px] italic text-[#8B5A2B] mt-1 leading-tight">{stamp.desc}</p>
                {!earned && <p className="text-[10px] font-bold text-[#D2B48C] mt-2">🔒 LOCKED</p>}
              </motion.div>
            );
          })}
        </div>
      </div>
      {user?.role !== 'mailman' && <HierarchyBadges />}
    </motion.div>
  );
}


// ============================================
// REPORT MODAL (Shared Component)
// ============================================
function ReportModal({ reportedUser, onClose }: { reportedUser: any, onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setStatus('submitting');
    try {
      await reportUser(reportedUser._id || reportedUser.id, reason, reportedUser.letterId);
      setStatus('success');
      setTimeout(onClose, 2500);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Failed to submit report.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#FAF0E6] p-8 rounded-lg max-w-md w-full relative border-4 border-red-800 shadow-2xl">
        <button onClick={onClose} className="absolute top-2 right-2 text-[#8B5A2B] hover:text-red-700"><X className="w-8 h-8" /></button>
        <h3 className="text-2xl font-bold text-red-800 mb-2 font-serif flex items-center gap-2"><AlertTriangle className="w-6 h-6"/> Report Transgression</h3>
        <p className="text-[#5C3A21] font-bold mb-1">
          Target: {reportedUser.name || 'Anonymous Author'}
        </p>
        {reportedUser.letterId && (
          <p className="text-xs italic text-stone-600 mb-4 bg-amber-100/70 p-2 rounded border border-amber-300">
            ⚖️ <strong>Tribunal Notice:</strong> Even if this missive was cast anonymously, the Guild Master Tribunal will unmask the true author's identity and apply sovereign sanctions.
          </p>
        )}
        
        {status === 'success' ? (
          <div className="p-4 bg-green-100 border border-green-400 text-green-800 rounded text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2"/>
            <p className="font-bold">Report Filed Successfully</p>
            <p className="text-sm italic">The Guild Tribunal has received the missive and will unmask & sanction transgressors.</p>
          </div>
        ) : (
          <>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              rows={4} 
              className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-red-700 text-sm font-serif resize-none shadow-inner mb-4" 
              placeholder="Detail the offensive content or transgression here..."
            ></textarea>
            {status === 'error' && <p className="text-red-600 font-bold text-sm mb-2">{errorMsg}</p>}
            <button onClick={handleSubmit} disabled={status === 'submitting'} className="w-full bg-red-800 hover:bg-red-900 text-white px-4 py-3 rounded font-bold shadow transition-colors">
              {status === 'submitting' ? 'Filing Report...' : 'Submit to Tribunal'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// FRIEND SCANNER MODAL (New Phase 2)
// ============================================
function FriendScannerModal({ onClose, onScan }: { onClose: () => void, onScan: (code: string) => void }) {
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode("friend-reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().then(() => onScan(decodedText)).catch(console.error);
            } else { onScan(decodedText); }
          },
          () => {}
        );
      } catch (err: any) { setError('Camera failed to start. Ensure browser permissions are granted.'); }
    };
    startScanner();
    return () => { if (scannerRef.current && scannerRef.current.isScanning) { scannerRef.current.stop().catch(console.error); } };
  }, [onScan]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4">
      <div className="theatrical-card p-6 sm:p-8 max-w-md w-full relative text-center shadow-2xl animate-glow-pulse" style={{ border: '2px solid var(--antique-gold)' }}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"><X className="w-6 h-6" /></button>
        <Crown className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--antique-gold)' }} />
        <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>Scan Companion's Seal</h3>
        <p className="text-xs sm:text-sm italic mb-5" style={{ color: 'var(--gold-muted)' }}>Align thy magical lens with their QR Code to forge an enduring bond.</p>
        {error && <p className="text-red-400 font-bold mb-4 text-xs">{error}</p>}
        <div className="w-full bg-black rounded-sm overflow-hidden" style={{ border: '1px solid var(--antique-gold)' }}>
          <div id="friend-reader" className="w-full h-[250px]"></div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// FELLOWSHIP / FRIENDS SYSTEM (Friend Requests & Alliances)
// ============================================
function Fellowship({ user }: { user: any }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'incoming' | 'outgoing'>('friends');
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportingUser, setReportingUser] = useState<any>(null);
  const [showMyQR, setShowMyQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const fetchFellowshipData = async () => {
    try {
      const [friendsList, requestsData] = await Promise.all([
        getMyFriends().catch(() => []),
        getFriendRequests().catch(() => ({ incoming: [], outgoing: [] }))
      ]);
      setFriends(Array.isArray(friendsList) ? friendsList : []);
      setIncomingRequests(Array.isArray(requestsData?.incoming) ? requestsData.incoming : []);
      setOutgoingRequests(Array.isArray(requestsData?.outgoing) ? requestsData.outgoing : []);
    } catch (e) {
      console.error("Failed to load fellowship data:", e);
    }
  };

  useEffect(() => {
    fetchFellowshipData();
  }, []);

  const handleSendRequest = async (codeToUse?: string) => {
    const code = (codeToUse || friendCode).trim();
    if (!code) {
      setError('Pray tell, enter a valid scroll address or ID code.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await sendFriendRequest(code);
      setSuccess(res.message || 'Friend request dispatched!');
      setFriendCode('');
      fetchFellowshipData();
      if (res.status === 'accepted') {
        setActiveTab('friends');
      } else {
        setActiveTab('outgoing');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to dispatch friend request.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId: string) => {
    setActionLoadingId(requesterId);
    setError('');
    setSuccess('');
    try {
      const res = await acceptFriendRequest(requesterId);
      setSuccess(res.message || 'Friend request accepted!');
      await fetchFellowshipData();
      setActiveTab('friends');
    } catch (e: any) {
      setError(e.message || 'Could not accept friend request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requesterId: string) => {
    setActionLoadingId(requesterId);
    setError('');
    setSuccess('');
    try {
      const res = await rejectFriendRequest(requesterId);
      setSuccess(res.message || 'Friend request declined.');
      await fetchFellowshipData();
    } catch (e: any) {
      setError(e.message || 'Could not decline friend request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (recipientId: string) => {
    setActionLoadingId(recipientId);
    setError('');
    setSuccess('');
    try {
      const res = await cancelFriendRequest(recipientId);
      setSuccess(res.message || 'Friend request retracted.');
      await fetchFellowshipData();
    } catch (e: any) {
      setError(e.message || 'Could not cancel friend request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemove = async (friendId: string, friendName: string) => {
    if (!window.confirm(`Dissolve thy sacred bond with ${friendName}?`)) return;
    setActionLoadingId(friendId);
    setError('');
    setSuccess('');
    try {
      const res = await removeFriend(friendId);
      setSuccess(res.message || 'Traveller removed from fellowship.');
      await fetchFellowshipData();
    } catch (e: any) {
      setError(e.message || 'Failed to remove companion.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-4xl mx-auto space-y-8">
      
      {/* Search & Send Friend Request Header Block */}
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
        background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-2 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
              <span>🤝 Holy Alliances</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-wide flex items-center gap-3" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
              <Users className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--antique-gold)' }}/> 
              Expand Thy Fellowship
            </h2>
          </div>
          <Link to="/" className="btn-gold-saloon text-xs py-2 px-4">
            ← Thy Ledger
          </Link>
        </div>
        <p className="text-sm sm:text-base italic mb-6" style={{ color: 'var(--gold-muted)' }}>
          Dispatch a friendship summons to another traveller via their Scroll Address (email) or secret ID Code.
        </p>
        
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" 
            value={friendCode} 
            onChange={(e) => setFriendCode(e.target.value)} 
            placeholder="e.g. companion@bracu.edu OR 64a7b9..." 
            className="flex-1 p-3.5 rounded-sm text-base sm:text-lg font-serif italic focus:outline-none shadow-inner"
            style={{
              background: '#FFFDF9',
              color: '#1A1A1A',
              border: '1px solid var(--border-subtle)'
            }}
          />
          <button 
            onClick={() => handleSendRequest()} 
            disabled={loading} 
            className="btn-velvet-burgundy text-xs py-3 px-6 whitespace-nowrap flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4"/>
            {loading ? 'Dispatching...' : 'Send Request'}
          </button>
          
          <button 
            onClick={() => setShowScanner(true)} 
            className="btn-gold-saloon text-xs py-3 px-5 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Scan className="w-4 h-4"/> Scan QR
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 rounded-sm font-bold text-xs sm:text-sm italic flex items-center gap-2 animate-curtain-reveal" style={{ background: 'rgba(107,29,42,0.4)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.4)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0"/> {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 rounded-sm font-bold text-xs sm:text-sm italic flex items-center gap-2 animate-curtain-reveal" style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.4)' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400"/> {success}
          </div>
        )}
        
        {/* User's Own ID & QR Code Badge */}
        <div className="mt-6 pt-6" style={{ borderTop: '1px dashed rgba(212,175,55,0.3)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Thy Secret Identification Code:</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="p-3 rounded-sm flex-1 flex justify-between items-center select-all cursor-pointer shadow-inner" style={{ background: '#FFFDF9', border: '1px solid var(--border-subtle)' }}>
              <span className="font-mono text-sm text-[#1A1A1A] font-bold">{user.id || user._id}</span>
              <span className="text-xs uppercase font-bold tracking-widest hidden sm:inline" style={{ color: 'var(--burgundy)', fontFamily: "'Cinzel', serif" }}>Share to connect</span>
            </div>
            <button 
              onClick={() => setShowMyQR(true)} 
              className="btn-velvet-burgundy text-xs py-2.5 px-5 whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <Scan className="w-4 h-4"/> Show My Seal
            </button>
          </div>
        </div>
      </div>

      {/* Fellowship Navigation Tabs */}
      <div className="flex gap-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
        <button
          onClick={() => setActiveTab('friends')}
          className="px-5 py-3 font-bold text-xs sm:text-sm rounded-t-sm transition-all flex items-center gap-2"
          style={{
            fontFamily: "'Cinzel', serif",
            background: activeTab === 'friends' ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'transparent',
            color: activeTab === 'friends' ? '#FFF' : 'var(--gold-muted)',
            border: activeTab === 'friends' ? '1px solid var(--antique-gold)' : '1px solid transparent',
            borderBottom: 'none'
          }}
        >
          <Users className="w-4 h-4"/>
          Thy Companions ({friends.length})
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className="px-5 py-3 font-bold text-xs sm:text-sm rounded-t-sm transition-all flex items-center gap-2 relative"
          style={{
            fontFamily: "'Cinzel', serif",
            background: activeTab === 'incoming' ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'transparent',
            color: activeTab === 'incoming' ? '#FFF' : 'var(--gold-muted)',
            border: activeTab === 'incoming' ? '1px solid var(--antique-gold)' : '1px solid transparent',
            borderBottom: 'none'
          }}
        >
          <UserCheck className="w-4 h-4"/>
          Incoming Requests
          {incomingRequests.length > 0 && (
            <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded-full font-sans font-bold animate-pulse">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className="px-5 py-3 font-bold text-xs sm:text-sm rounded-t-sm transition-all flex items-center gap-2"
          style={{
            fontFamily: "'Cinzel', serif",
            background: activeTab === 'outgoing' ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'transparent',
            color: activeTab === 'outgoing' ? '#FFF' : 'var(--gold-muted)',
            border: activeTab === 'outgoing' ? '1px solid var(--antique-gold)' : '1px solid transparent',
            borderBottom: 'none'
          }}
        >
          <Clock className="w-4 h-4"/>
          Pending Sent ({outgoingRequests.length})
        </button>
      </div>

      {/* TAB 1: THY COMPANIONS (Accepted Friends) */}
      {activeTab === 'friends' && (
        <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>Companions in Thy Fellowship</h3>
              <p className="text-xs sm:text-sm italic" style={{ color: 'var(--gold-muted)' }}>Mutually bonded travellers of the realm.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-sm" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: "'Cinzel', serif" }}>
              {friends.length} {friends.length === 1 ? 'Companion' : 'Companions'}
            </span>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-12 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold-muted)' }}>
              <Users className="w-14 h-14 mx-auto mb-3 opacity-60" style={{ color: 'var(--antique-gold)' }}/>
              <p className="text-lg font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>Thy fellowship is currently empty.</p>
              <p className="text-sm mt-1 italic font-serif">
                Send a friend request above or scan another traveller's seal to forge an alliance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.map((f: any) => (
                <div key={f._id} className="theatrical-card p-5 rounded-sm flex flex-col justify-between transition-all" style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>{f.name}</h4>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shadow" title="Bonded"></span>
                    </div>
                    <p className="text-xs sm:text-sm italic mb-2" style={{ color: 'var(--gold-muted)' }}>{f.email}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-sm font-bold uppercase tracking-wider" style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: "'Cinzel', serif" }}>
                        {f.role === 'mailman' ? '🏇 Royal Mailman' : '📜 Scribe'}
                      </span>
                      {f.role === 'mailman' ? (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-sm font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--parchment-light)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: "'Cinzel', serif" }}>
                          Rank: {f.rank || 'Novice'} • {f.xp || 0} XP
                        </span>
                      ) : (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-sm font-bold flex items-center gap-1" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--parchment-light)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: "'Cinzel', serif" }}>
                          <Award className="w-3 h-3 text-[var(--antique-gold)]"/> Rep: {f.reputationScore || 0}
                        </span>
                      )}
                    </div>
                    {f.noteStatus && (
                      <div className="text-xs font-serif italic mb-3 p-2 rounded-sm flex items-start gap-2" style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)' }}>
                        <span className="text-base flex-shrink-0">{NOTE_STATUS_MOODS[f.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                        <span className="italic flex-1">"{f.noteStatus}"</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                    <Link 
                      to="/compose" 
                      state={{ draft: { receiverRef: f.name } }} 
                      className="btn-velvet-burgundy flex-1 text-xs py-2 justify-center gap-1.5"
                    >
                      <Feather className="w-3.5 h-3.5"/> Inscribe Letter
                    </Link>
                    
                    <button 
                      onClick={() => handleRemove(f._id, f.name)}
                      disabled={actionLoadingId === f._id}
                      className="btn-gold-saloon text-xs py-2 px-3 flex items-center justify-center"
                      title="Dissolve fellowship with this traveller"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400"/>
                    </button>

                    {f.role !== 'admin' && !(f.name || '').toLowerCase().includes('guild master') && !(f.name || '').toLowerCase().includes('admin') && (
                      <button 
                        onClick={() => setReportingUser(f)} 
                        className="btn-gold-saloon text-xs py-2 px-3 flex items-center justify-center text-red-400" 
                        title="Report this traveller to the Guild Tribunal"
                      >
                        <AlertTriangle className="w-3.5 h-3.5"/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING FRIEND REQUESTS */}
      {activeTab === 'incoming' && (
        <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>Incoming Friendship Summons</h3>
              <p className="text-xs sm:text-sm italic" style={{ color: 'var(--gold-muted)' }}>Travellers seeking to forge a bond with thee.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)', fontFamily: "'Cinzel', serif" }}>
              {incomingRequests.length} Pending
            </span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="text-center py-12 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold-muted)' }}>
              <UserCheck className="w-14 h-14 mx-auto mb-3 opacity-60" style={{ color: 'var(--antique-gold)' }}/>
              <p className="text-lg font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>No incoming friend requests at this time.</p>
              <p className="text-sm mt-1 italic font-serif">
                When another traveller sends thee a summons, it will appear here for thy review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((req: any) => {
                const sender = req.from;
                if (!sender) return null;
                return (
                  <div key={sender._id} className="theatrical-card p-5 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>{sender.name}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: "'Cinzel', serif" }}>
                          {sender.role}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm italic mt-0.5" style={{ color: 'var(--gold-muted)' }}>{sender.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Dispatched: {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        onClick={() => handleAccept(sender._id)}
                        disabled={actionLoadingId === sender._id}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-sm font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all text-white"
                        style={{ background: '#047857', border: '1px solid #10B981', fontFamily: "'Cinzel', serif" }}
                      >
                        <UserCheck className="w-4 h-4"/> Accept
                      </button>

                      <button
                        onClick={() => handleReject(sender._id)}
                        disabled={actionLoadingId === sender._id}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-sm font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all text-white"
                        style={{ background: '#7F1D1D', border: '1px solid #DC2626', fontFamily: "'Cinzel', serif" }}
                      >
                        <UserX className="w-4 h-4"/> Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OUTGOING PENDING REQUESTS */}
      {activeTab === 'outgoing' && (
        <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden" style={{
          background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>Pending Sent Summons</h3>
              <p className="text-xs sm:text-sm italic" style={{ color: 'var(--gold-muted)' }}>Requests thou hast dispatched awaiting a response.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-sm" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: "'Cinzel', serif" }}>
              {outgoingRequests.length} Pending
            </span>
          </div>

          {outgoingRequests.length === 0 ? (
            <div className="text-center py-12 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold-muted)' }}>
              <Clock className="w-14 h-14 mx-auto mb-3 opacity-60" style={{ color: 'var(--antique-gold)' }}/>
              <p className="text-lg font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>No outgoing requests pending.</p>
              <p className="text-sm mt-1 italic font-serif">
                All thy summons have either been accepted or none have been sent yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map((req: any) => {
                const target = req.to;
                if (!target) return null;
                return (
                  <div key={target._id} className="theatrical-card p-5 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>{target.name}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: "'Cinzel', serif" }}>
                          {target.role}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm italic mt-0.5" style={{ color: 'var(--gold-muted)' }}>{target.email}</p>
                      <p className="text-xs text-amber-300 font-semibold mt-1">
                        ⏳ Awaiting acceptance • Dispatched on {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCancel(target._id)}
                      disabled={actionLoadingId === target._id}
                      className="btn-gold-saloon w-full sm:w-auto text-xs py-2 px-4 flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5"/> Retract Request
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QR Code & Scanner Modals */}
      <AnimatePresence>
        {showMyQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="theatrical-card p-6 sm:p-8 max-w-sm w-full relative text-center shadow-2xl animate-glow-pulse" style={{ border: '2px solid var(--antique-gold)' }}>
              <button onClick={() => setShowMyQR(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"><X className="w-6 h-6" /></button>
              <Crown className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--antique-gold)' }} />
              <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>Thy Friendship Seal</h3>
              <p className="text-xs sm:text-sm italic mb-5" style={{ color: 'var(--gold-muted)' }}>Let another traveller scan this to forge an alliance.</p>
              <div className="flex justify-center p-4 bg-white rounded-sm mb-4 inline-block shadow-inner" style={{ border: '2px solid var(--antique-gold)' }}>
                <QRCodeCanvas value={user.id || user._id} size={200} fgColor="#1A1A1A" />
              </div>
              <p className="font-mono text-xs p-2 rounded-sm break-all" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--antique-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                {user.id || user._id}
              </p>
            </div>
          </motion.div>
        )}
        
        {showScanner && (
          <FriendScannerModal 
            onClose={() => setShowScanner(false)} 
            onScan={(code) => { setShowScanner(false); handleSendRequest(code); }} 
          />
        )}

        {reportingUser && <ReportModal reportedUser={reportingUser} onClose={() => setReportingUser(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

export default App;