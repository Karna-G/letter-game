import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Video,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Palette,
  Volume2,
  VolumeX,
  QrCode,
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
  Link as LinkIcon,
  PenTool,
  Compass,
  Loader2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type { StoryTeaserConfig, Particle } from '../utils/storyCanvasRenderer';
import {
  createStoryParticles,
  updateStoryParticles,
  renderStoryFrame,
  formatLocalDateTime
} from '../utils/storyCanvasRenderer';
import type { VideoExportProgress } from '../utils/storyVideoExporter';
import {
  recordStoryVideo,
  exportStoryImage,
  shareToSocialStory,
  copyImageToClipboard,
  triggerFileDownload
} from '../utils/storyVideoExporter';
import { waxSealAudio } from '../utils/waxSealAudio';
import { updateLetter, sendLetter } from '../api';
import { notify } from '../components/RealmDialog';

interface SocialTeaserModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter?: any; // The letter to generate story herald for
  onUpdateScheduledTime?: (date: Date) => void; // Syncs back to Compose or parent state
  onLetterDispatched?: (letterData: any) => void;
}

const THEMES = [
  { id: 'midnight', name: 'Midnight Velvet', icon: '🌌', desc: 'Starry obsidian sky with gold dust' },
  { id: 'candlelight', name: 'Candlelight Chamber', icon: '🕯️', desc: 'Warm glowing tavern amber' },
  { id: 'burgundy', name: 'Imperial Burgundy', icon: '🍷', desc: 'Opulent royal crimson velvet' },
  { id: 'ocean', name: 'Starlit Ocean', icon: '🌊', desc: 'Deep sapphire tides & sea mist' },
  { id: 'emerald', name: 'Elven Emerald', icon: '🌿', desc: 'Ancient enchanted forest grove' }
] as const;

const SEAL_COLORS = [
  { id: '#DC2626', name: 'Imperial Crimson', bg: '#DC2626' },
  { id: '#3FA97A', name: 'Royal Gold', bg: '#3FA97A' },
  { id: '#059669', name: 'Postman Emerald', bg: '#059669' },
  { id: '#2563EB', name: 'Sapphire Nocturne', bg: '#2563EB' },
  { id: '#9333EA', name: 'Mystic Amethyst', bg: '#9333EA' },
  { id: '#1E1B18', name: 'Obsidian Shadow', bg: '#1E1B18' },
  { id: '#E11D48', name: 'Rose Petal', bg: '#E11D48' }
];

const SEAL_ICONS = [
  { id: 'fleur', emoji: '⚜️', name: 'Fleur-de-lis' },
  { id: 'crown', emoji: '👑', name: 'Royal Crown' },
  { id: 'quill', emoji: '🪶', name: 'Scribe Quill' },
  { id: 'eagle', emoji: '🦅', name: 'Imperial Eagle' },
  { id: 'hourglass', emoji: '⌛', name: 'Hourglass' },
  { id: 'heart', emoji: '💌', name: 'Sealed Heart' },
  { id: 'sword', emoji: '⚔️', name: 'Knight Blade' }
];

const CLUE_PRESETS = [
  '“Words penned beneath a crimson midnight moon...”',
  '“A secret waiting until the appointed solar hour.”',
  '“Bound by honor and sealed in molten wax.”',
  '“Containeth sentiments never spoken aloud.”',
  '“You shall know your fate upon arrival.”'
];

export default function SocialTeaserModal({
  isOpen,
  onClose,
  letter,
  onUpdateScheduledTime,
  onLetterDispatched
}: SocialTeaserModalProps) {
  const navigate = useNavigate();

  // Config State
  const [theme, setTheme] = useState<StoryTeaserConfig['theme']>('midnight');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isAnonymousSender, setIsAnonymousSender] = useState(false);
  const [isAnonymousRecipient, setIsAnonymousRecipient] = useState(false);
  const [mysteryClue, setMysteryClue] = useState(CLUE_PRESETS[0]);
  const [sealColor, setSealColor] = useState('#DC2626');
  const [sealIcon, setSealIcon] = useState('fleur');
  const [includeQr, setIncludeQr] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [durationSec, setDurationSec] = useState<number>(5);
  const [copiedToken, setCopiedToken] = useState(false);

  // Target Date State (strictly formatted in local time)
  const [targetDate, setTargetDate] = useState<string>(() => {
    return formatLocalDateTime(new Date(Date.now() + 60 * 60 * 1000));
  });

  // Export States
  const [exportProgress, setExportProgress] = useState<VideoExportProgress | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'theme' | 'envelope' | 'countdown' | 'text'>('theme');

  // Dispatch from Herald States
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchedResult, setDispatchedResult] = useState<{
    letterId: string;
    qrCodeToken: string;
    scheduledFor: string;
    receiverName: string;
  } | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchedCopied, setDispatchedCopied] = useState(false);

  // Preview Canvas Reference
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>(createStoryParticles(45));
  const qrImageRef = useRef<HTMLImageElement | null>(null);

  // Dynamic QR Code Value (Real usable URL or Token)
  const qrValue = letter?.qrCodeToken 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/scanner?token=${letter.qrCodeToken}`
    : letter?._id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/mailbox?letter=${letter._id}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=story-herald`;

  const rawTokenString = letter?.qrCodeToken || letter?._id || 'ROYAL-MISSIVE-SEAL-819';

  // Initialize from letter data when modal opens
  useEffect(() => {
    if (isOpen) {
      setDispatchedResult(null);
      setDispatchError(null);
      setDispatchedCopied(false);
      if (letter) {
        setRecipientName(letter.receiverRef?.name || letter.receiverName || (typeof letter.receiverRef === 'string' ? letter.receiverRef : '') || 'Noble Scribe');
        setSenderName(letter.senderRef?.name || letter.senderName || 'Royal Postman');
        if (letter.isAnonymous) setIsAnonymousSender(true);
        if (letter.scheduledFor) {
          const sched = new Date(letter.scheduledFor);
          if (sched.getTime() > Date.now()) {
            setTargetDate(formatLocalDateTime(sched));
          } else {
            setTargetDate(formatLocalDateTime(new Date(Date.now() + 60 * 60 * 1000)));
          }
        } else {
          setTargetDate(formatLocalDateTime(new Date(Date.now() + 60 * 60 * 1000)));
        }
        if (letter.sealColor) setSealColor(letter.sealColor);
        if (letter.sealStamp) setSealIcon(letter.sealStamp);
      } else {
        setRecipientName('Lady Genevieve');
        setSenderName('Royal Postman');
        setTargetDate(formatLocalDateTime(new Date(Date.now() + 60 * 60 * 1000)));
      }
    }
  }, [isOpen, letter]);

  // Update Real QR Code as an HTMLImageElement from hidden QRCodeCanvas
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      try {
        const qrCanvas = document.getElementById('social-teaser-real-qr') as HTMLCanvasElement | null;
        if (qrCanvas) {
          const img = new Image();
          img.src = qrCanvas.toDataURL('image/png');
          img.onload = () => {
            qrImageRef.current = img;
          };
        }
      } catch (e) {
        console.warn('Could not load real QR canvas', e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen, qrValue, includeQr]);

  // Two-way synchronization helper when the timer changes
  const handleSyncTimer = (newDate: Date) => {
    onUpdateScheduledTime?.(newDate);

    // If this is an existing letter in DB, save the updated scheduledFor time
    if (letter?._id) {
      updateLetter(
        letter._id,
        letter.receiverRef?.name || letter.receiverRef || '',
        letter.content || '',
        letter.status || 'pending',
        letter.burnAfterReading || false,
        letter.burnTimerSeconds || 60,
        letter.font || 'Cinzel',
        letter.fontSize || 'medium',
        newDate.toISOString()
      ).catch(() => {});
    }
  };

  // Live Canvas Animation Loop
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const loop = () => {
      if (!isRunning) return;

      const config: StoryTeaserConfig = {
        theme,
        recipientName,
        senderName,
        isAnonymousSender,
        isAnonymousRecipient,
        mysteryClue,
        targetDate: new Date(targetDate).getTime(),
        sealColor,
        sealIcon,
        includeQr,
        appWatermark: 'guild-post.app • Sealed Letter',
        soundEnabled
      };

      updateStoryParticles(particlesRef.current, 1080, 1920);
      renderStoryFrame(ctx, config, particlesRef.current, Date.now(), qrImageRef.current);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    isOpen,
    theme,
    recipientName,
    senderName,
    isAnonymousSender,
    isAnonymousRecipient,
    mysteryClue,
    targetDate,
    sealColor,
    sealIcon,
    includeQr,
    soundEnabled
  ]);

  // Current Config Helper
  const getCurrentConfig = (): StoryTeaserConfig => ({
    theme,
    recipientName,
    senderName,
    isAnonymousSender,
    isAnonymousRecipient,
    mysteryClue,
    targetDate: new Date(targetDate).getTime(),
    sealColor,
    sealIcon,
    includeQr,
    appWatermark: 'guild-post.app • Sealed Letter',
    soundEnabled
  });

  // Action: Export Video
  const handleExportVideo = async () => {
    try {
      waxSealAudio.playWaxStampThud();
      const config = getCurrentConfig();
      const { blob } = await recordStoryVideo(
        config,
        qrImageRef.current,
        durationSec,
        30,
        (progress) => setExportProgress(progress)
      );

      triggerFileDownload(blob, `royal_missive_story_${Date.now()}.webm`);
      setTimeout(() => setExportProgress(null), 3500);
    } catch (e: any) {
      notify.error('Video export error: ' + e.message);
      setExportProgress(null);
    }
  };

  // Action: Export Image (HD PNG)
  const handleExportImage = async () => {
    try {
      waxSealAudio.playParchmentUnroll();
      const config = getCurrentConfig();
      const { blob } = await exportStoryImage(config, qrImageRef.current);
      triggerFileDownload(blob, `royal_missive_story_${Date.now()}.png`);
    } catch (e: any) {
      notify.error('Image export error: ' + e.message);
    }
  };

  // Action: Mobile Share
  const handleShareStory = async () => {
    try {
      waxSealAudio.playWaxStampThud();
      const config = getCurrentConfig();
      const { blob } = await exportStoryImage(config, qrImageRef.current);
      const shared = await shareToSocialStory(
        blob,
        `royal_missive_story_${Date.now()}.png`,
        '👑 A Royal Letter is in Transit!',
        `A sealed letter approaches for ${recipientName || 'Someone Special'}!`
      );
      if (shared) {
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 3000);
      }
    } catch (e: any) {
      console.warn('Share error', e);
    }
  };

  // Action: Copy Image to Clipboard
  const handleCopyClipboard = async () => {
    try {
      const config = getCurrentConfig();
      const { blob } = await exportStoryImage(config, qrImageRef.current);
      const success = await copyImageToClipboard(blob);
      if (success) {
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 3000);
      } else {
        triggerFileDownload(blob, 'royal_missive_story.png');
      }
    } catch (e: any) {
      notify.error('Copy error: ' + e.message);
    }
  };

  // Action: Copy Token String to Clipboard
  const handleCopyToken = async () => {
    try {
      waxSealAudio.playWaxCrack();
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(rawTokenString);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2500);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Preset Date Buttons with exact local time calculation
  const setQuickMinutes = (mins: number) => {
    waxSealAudio.playWaxCrack();
    const d = new Date(Date.now() + mins * 60 * 1000);
    const formatted = formatLocalDateTime(d);
    setTargetDate(formatted);
    handleSyncTimer(d);
  };

  const setQuickHours = (hoursAhead: number) => {
    waxSealAudio.playWaxCrack();
    const d = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    const formatted = formatLocalDateTime(d);
    setTargetDate(formatted);
    handleSyncTimer(d);
  };

  const handleCustomDateTimeChange = (val: string) => {
    setTargetDate(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        handleSyncTimer(d);
      }
    }
  };

  // Action: Seal & Dispatch Letter with Herald's Sealed-Until Hour
  const handleDispatchLetter = async () => {
    setDispatchLoading(true);
    setDispatchError(null);
    try {
      waxSealAudio.playWaxStampThud();
      const targetUnlockDate = new Date(targetDate);
      const schedIso = !isNaN(targetUnlockDate.getTime())
        ? targetUnlockDate.toISOString()
        : new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const effectiveReceiver = (isAnonymousRecipient
        ? 'Someone Special'
        : (recipientName || letter?.receiverRef?.name || letter?.receiverName || (typeof letter?.receiverRef === 'string' ? letter?.receiverRef : '') || 'Noble Scribe'));

      const payload: any = {
        receiverRef: effectiveReceiver,
        content: letter?.content || (letter?.isHandwritten ? `[Physical Handwritten Letter - ${letter?.handwrittenPages?.length || 1} Pages]` : 'Royal Letter'),
        type: 'standard',
        status: 'pending',
        burnAfterReading: !!letter?.burnAfterReading,
        burnTimerSeconds: letter?.burnTimerSeconds || 60,
        font: letter?.font || 'Cinzel',
        fontSize: letter?.fontSize || 'medium',
        scheduledFor: schedIso,
        isHandwritten: !!letter?.isHandwritten,
        handwrittenPages: letter?.handwrittenPages || [],
        handwritingStyle: 'freehand',
        inkColor: letter?.inkColor || 'iron-gall',
        parchmentPaper: letter?.parchmentPaper || 'vintage-cream',
        sealColor: sealColor,
        sealStamp: sealIcon,
        isAnonymous: isAnonymousSender,
        mysteryClue: mysteryClue
      };

      let res: any;
      if (letter?._id && letter._id !== 'draft-preview') {
        res = await updateLetter(letter._id, payload);
      } else {
        res = await sendLetter(payload);
      }

      const letterId = res?._id || letter?._id || '';
      const qrCodeToken = res?.qrCodeToken || letter?.qrCodeToken || '';

      setDispatchedResult({
        letterId,
        qrCodeToken,
        scheduledFor: schedIso,
        receiverName: effectiveReceiver
      });

      try {
        waxSealAudio.playParchmentUnroll();
      } catch (_) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('letter-dispatched-from-herald', {
            detail: { letterId, qrCodeToken, scheduledFor: schedIso }
          })
        );
      }

      onUpdateScheduledTime?.(targetUnlockDate);
      onLetterDispatched?.(res);
    } catch (e: any) {
      console.error('Could not dispatch letter from story herald:', e);
      setDispatchError(e.message || 'Could not dispatch letter');
    } finally {
      setDispatchLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        {/* Hidden Real Scannable QR Code Canvas */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <QRCodeCanvas
            id="social-teaser-real-qr"
            value={qrValue}
            size={280}
            fgColor="#1A1208"
            bgColor="#FAF0E6"
            level="H"
            includeMargin={true}
          />
        </div>

        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl bg-[#17120E] border-2 border-[#3FA97A]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(63, 169, 122,0.12) 0%, transparent 70%)'
          }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#3FA97A]/30 bg-[#1E1712]">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 bg-[#2D2119] border border-[#3FA97A]/40 rounded-xl shadow-inner">
                ✨
              </span>
              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold tracking-wider text-[#FAF0E6] flex items-center gap-2"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Sealed Letter Story Herald
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#3FA97A]/20 text-[#3FA97A] border border-[#3FA97A]/40 font-sans uppercase">
                    9:16 Royal Story
                  </span>
                </h2>
                <p className="text-xs text-[#D2B48C]/80 font-serif">
                  Make an animated story card to share with friends outside the realm
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                waxSealAudio.playParchmentUnroll();
                onClose();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-[#D2B48C] hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Body: Split View (Canvas Live Preview + Controls) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 overflow-y-auto">
            {/* LEFT COLUMN: 9:16 Live Story Preview Simulator (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative group">
                {/* 9:16 Phone Frame */}
                <div
                  className="relative rounded-[28px] p-2 sm:p-2.5 bg-gradient-to-b from-[#3D2D1E] via-[#2A1F14] to-[#1A120B] border-2 border-[#3FA97A]/60 shadow-2xl"
                  style={{
                    boxShadow: '0 0 35px rgba(63, 169, 122,0.25), inset 0 0 15px rgba(0,0,0,0.8)'
                  }}
                >
                  {/* Phone Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/70 rounded-full z-20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-700/80 mr-2" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                  </div>

                  {/* 1080x1920 HD Canvas Displayed at CSS Size */}
                  <canvas
                    ref={previewCanvasRef}
                    width={1080}
                    height={1920}
                    className="w-[260px] sm:w-[290px] h-[462px] sm:h-[515px] rounded-[20px] object-cover bg-black shadow-inner block"
                  />

                  {/* Overlay Badges on Hover */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#3FA97A]/40 text-[11px] text-[#FAF0E6] whitespace-nowrap">
                    🔴 Live 60 FPS Preview
                  </div>
                </div>

                {/* Quick Info Below Phone */}
                <p className="text-center text-xs text-[#D2B48C]/70 mt-3 font-serif flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#3FA97A]" />
                  1080 × 1920 HD Vertical Format • Real Scannable QR
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Customization Controls & Export Actions (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              {/* Tabs Navigation */}
              <div className="flex border-b border-[#3FA97A]/30 bg-[#211912] rounded-xl p-1 gap-1">
                {[
                  { id: 'theme', label: 'Theme & Mood', icon: Palette },
                  { id: 'envelope', label: 'Wax Seal', icon: Shield },
                  { id: 'countdown', label: 'Sealed Until', icon: Clock },
                  { id: 'text', label: 'Names & Riddle', icon: Sparkles }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        waxSealAudio.playWaxCrack();
                        setActiveTab(tab.id as any);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                        active
                          ? 'bg-gradient-to-r from-[#3FA97A] to-[#1D6B4C] text-[#1E1712] shadow-md'
                          : 'text-[#D2B48C] hover:text-[#FAF0E6] hover:bg-white/5'
                      }`}
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT AREA */}
              <div className="flex-1 bg-[#1E1712]/90 border border-[#3FA97A]/25 rounded-xl p-4 sm:p-5 overflow-y-auto max-h-[340px]">
                {/* TAB 1: THEME & MOOD */}
                {activeTab === 'theme' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#3FA97A] uppercase tracking-wider flex items-center gap-2">
                      <Palette className="w-4 h-4" /> Select Story Atmosphere
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            waxSealAudio.playParchmentUnroll();
                            setTheme(t.id);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            theme === t.id
                              ? 'bg-[#3A2818] border-[#3FA97A] shadow-[0_0_15px_rgba(63, 169, 122,0.3)]'
                              : 'bg-[#261D15] border-[#3FA97A]/20 hover:border-[#3FA97A]/50'
                          }`}
                        >
                          <span className="text-2xl">{t.icon}</span>
                          <div>
                            <p className="font-bold text-sm text-[#FAF0E6]">{t.name}</p>
                            <p className="text-xs text-[#D2B48C]/70 mt-0.5">{t.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Audio Toggle */}
                    <div className="pt-3 border-t border-[#3FA97A]/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#FAF0E6]">Include Ambient Audio (75% Soft Volume)</p>
                        <p className="text-[11px] text-[#D2B48C]/70">
                          Embeds soft antique clock ticking & warm harp resonance in exported video
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          waxSealAudio.playWaxCrack();
                          setSoundEnabled(!soundEnabled);
                        }}
                        className={`p-2 rounded-lg border transition-all ${
                          soundEnabled
                            ? 'bg-[#3FA97A] text-[#1E1712] border-[#3FA97A]'
                            : 'bg-[#261D15] text-[#D2B48C] border-[#3FA97A]/30'
                        }`}
                      >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: WAX SEAL & ENVELOPE */}
                {activeTab === 'envelope' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-[#3FA97A] uppercase tracking-wider mb-2">
                        Wax Color Palette
                      </h4>
                      <div className="flex flex-wrap gap-2.5">
                        {SEAL_COLORS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              waxSealAudio.playWaxCrack();
                              setSealColor(c.id);
                            }}
                            className={`w-9 h-9 rounded-full border-2 transition-transform shadow-md relative ${
                              sealColor === c.id
                                ? 'scale-110 border-white ring-2 ring-[#3FA97A]'
                                : 'border-black/50 hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.bg }}
                            title={c.name}
                          >
                            {sealColor === c.id && (
                              <Check className="w-4 h-4 text-white mx-auto drop-shadow" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#3FA97A]/20">
                      <h4 className="text-xs font-bold text-[#3FA97A] uppercase tracking-wider mb-2">
                        Stamped Crest Insignia
                      </h4>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {SEAL_ICONS.map((icon) => (
                          <button
                            key={icon.id}
                            onClick={() => {
                              waxSealAudio.playWaxStampThud();
                              setSealIcon(icon.id);
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                              sealIcon === icon.id
                                ? 'bg-[#3A2818] border-[#3FA97A] scale-105 shadow-md'
                                : 'bg-[#261D15] border-[#3FA97A]/20 hover:border-[#3FA97A]/50'
                            }`}
                          >
                            <span className="text-xl">{icon.emoji}</span>
                            <span className="text-[10px] text-[#D2B48C] mt-1 font-serif">{icon.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#3FA97A]/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#FAF0E6]">Include Real Scannable QR Sticker</p>
                          <p className="text-[11px] text-[#D2B48C]/70">
                            Real scannable barcode linking viewers directly to open or track this letter
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            waxSealAudio.playWaxCrack();
                            setIncludeQr(!includeQr);
                          }}
                          className={`p-2 rounded-lg border transition-all ${
                            includeQr
                              ? 'bg-[#3FA97A] text-[#1E1712] border-[#3FA97A]'
                              : 'bg-[#261D15] text-[#D2B48C] border-[#3FA97A]/30'
                          }`}
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Copyable Token & Link Box */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-[#3FA97A]/30 text-xs">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <LinkIcon className="w-3.5 h-3.5 text-[#3FA97A] flex-shrink-0" />
                          <span className="font-mono text-[11px] text-amber-200 truncate">{rawTokenString}</span>
                        </div>
                        <button
                          onClick={handleCopyToken}
                          className="px-2.5 py-1 rounded bg-[#3FA97A] hover:bg-[#A8E6C8] text-[#1E1712] font-bold text-[10px] flex items-center gap-1 flex-shrink-0"
                        >
                          {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedToken ? 'Copied' : 'Copy Code'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: COUNTDOWN SETTINGS ({SEALED UNTIL}) */}
                {activeTab === 'countdown' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-[#3FA97A] uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sealed Until Quick Presets</span>
                        </h4>
                        <span className="text-[10px] text-amber-300 font-serif">Syncs with Letter Unlock Timer</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {[
                          { label: '+5 Mins', fn: () => setQuickMinutes(5) },
                          { label: '+15 Mins', fn: () => setQuickMinutes(15) },
                          { label: '+30 Mins', fn: () => setQuickMinutes(30) },
                          { label: '+1 Hour', fn: () => setQuickHours(1) },
                          { label: '+6 Hours', fn: () => setQuickHours(6) },
                          { label: '+24 Hours', fn: () => setQuickHours(24) },
                          { label: '+3 Days', fn: () => setQuickHours(72) }
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={btn.fn}
                            className="py-2 px-1 text-xs font-semibold rounded-lg bg-[#2A1F16] border border-[#3FA97A]/30 hover:border-[#3FA97A] text-[#FAF0E6] hover:bg-[#382B1F] transition-all text-center"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#3FA97A]/20">
                      <label className="block text-xs font-bold text-[#3FA97A] uppercase tracking-wider mb-1.5">
                        Exact Unlock / Arrival Date & Time (Sealed Until)
                      </label>
                      <input
                        type="datetime-local"
                        value={targetDate}
                        onChange={(e) => handleCustomDateTimeChange(e.target.value)}
                        className="w-full bg-[#261D15] border border-[#3FA97A]/40 rounded-lg px-3 py-2 text-sm text-[#FAF0E6] focus:border-[#3FA97A] outline-none font-mono"
                      />
                    </div>

                    <div className="pt-3 border-t border-[#3FA97A]/20">
                      <label className="block text-xs font-bold text-[#3FA97A] uppercase tracking-wider mb-1.5">
                        Story Video Loop Duration
                      </label>
                      <div className="flex gap-3">
                        {[3, 5, 8].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setDurationSec(sec)}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                              durationSec === sec
                                ? 'bg-[#3FA97A] text-[#1E1712] border-[#3FA97A]'
                                : 'bg-[#261D15] text-[#D2B48C] border-[#3FA97A]/30'
                            }`}
                          >
                            {sec} Seconds Loop
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── DEDICATED SEALED-UNTIL DISPATCH CARD IN COUNTDOWN TAB ── */}
                    <div className="pt-3 border-t border-[#3FA97A]/30 bg-gradient-to-br from-[#2B1B17]/90 to-[#1A120B]/90 p-4 rounded-xl border border-amber-500/40 space-y-2.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5 font-serif">
                          <Clock className="w-4 h-4 text-[#3FA97A]" />
                          <span>Sealed Until: <strong className="text-amber-300 font-mono">{new Date(targetDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
                        </span>
                      </div>
                      <p className="text-[11px] text-[#D2B48C]/90 italic font-serif">
                        Sending now seals the letter with your wax. The recipient cannot open it until the time you set.
                      </p>
                      <button
                        type="button"
                        onClick={handleDispatchLetter}
                        disabled={dispatchLoading}
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-red-900 via-red-800 to-amber-700 hover:from-red-800 hover:to-amber-600 text-amber-100 shadow-xl border border-amber-400/60 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {dispatchLoading ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : <PenTool className="w-4 h-4 text-amber-300 animate-pulse" />}
                        <span>{dispatchLoading ? 'Affixing Wax Seal & Dispatching...' : '⚔️ Seal & Dispatch Letter with This Sealed-Until Hour'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: NAMES & RIDDLE */}
                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Recipient */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-[#3FA97A]">Recipient Moniker</label>
                          <button
                            onClick={() => setIsAnonymousRecipient(!isAnonymousRecipient)}
                            className="text-[10px] text-[#D2B48C] hover:text-white flex items-center gap-1"
                          >
                            {isAnonymousRecipient ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {isAnonymousRecipient ? 'Hidden' : 'Show'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={isAnonymousRecipient ? '' : recipientName}
                          disabled={isAnonymousRecipient}
                          placeholder={isAnonymousRecipient ? 'Someone Special' : 'Enter recipient name'}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="w-full bg-[#261D15] border border-[#3FA97A]/40 rounded-lg px-3 py-1.5 text-xs text-[#FAF0E6] focus:border-[#3FA97A] outline-none disabled:opacity-50"
                        />
                      </div>

                      {/* Sender */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-[#3FA97A]">Sender Moniker</label>
                          <button
                            onClick={() => setIsAnonymousSender(!isAnonymousSender)}
                            className="text-[10px] text-[#D2B48C] hover:text-white flex items-center gap-1"
                          >
                            {isAnonymousSender ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {isAnonymousSender ? 'Anonymous' : 'Show'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={isAnonymousSender ? '' : senderName}
                          disabled={isAnonymousSender}
                          placeholder={isAnonymousSender ? 'An Anonymous Scribe' : 'Enter sender name'}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="w-full bg-[#261D15] border border-[#3FA97A]/40 rounded-lg px-3 py-1.5 text-xs text-[#FAF0E6] focus:border-[#3FA97A] outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Mystery Clue */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-[#3FA97A] mb-1.5">
                        Mystery Clue / Riddle Line (Optional)
                      </label>
                      <input
                        type="text"
                        value={mysteryClue}
                        onChange={(e) => setMysteryClue(e.target.value)}
                        placeholder="Inscribe a subtle hint..."
                        className="w-full bg-[#261D15] border border-[#3FA97A]/40 rounded-lg px-3 py-2 text-xs text-[#FAF0E6] focus:border-[#3FA97A] outline-none mb-2"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {CLUE_PRESETS.slice(0, 3).map((clue, idx) => (
                          <button
                            key={idx}
                            onClick={() => setMysteryClue(clue)}
                            className="text-[10px] px-2 py-1 rounded bg-[#2D2119] hover:bg-[#3D2D22] text-[#D2B48C] border border-[#3FA97A]/20"
                          >
                            Preset #{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RECORDING PROGRESS BAR (if active) */}
              {exportProgress && (
                <div className="bg-[#261D15] border border-[#3FA97A]/40 rounded-xl p-3">
                  <div className="flex justify-between text-xs font-bold text-[#FAF0E6] mb-1.5">
                    <span>🎬 {exportProgress.message || 'Processing royal video...'}</span>
                    <span>{exportProgress.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#3FA97A] to-[#3FA97A]"
                      style={{ width: `${exportProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* SUCCESS / COPIED BANNER */}
              {copiedNotification && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Story card copied to your clipboard — ready to share.</span>
                </motion.div>
              )}

              {/* DISPATCH ERROR BANNER */}
              {dispatchError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-950/90 border border-red-500/60 text-red-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <span className="font-bold">⚠ {dispatchError}</span>
                </motion.div>
              )}

              {/* ── ACTION BUTTONS: PRIMARY SEAL & DISPATCH + EXPORT SUITE ── */}
              <div className="space-y-2.5 pt-2">
                {/* Primary Button: Seal & Dispatch Letter with the Sealed-Until Value */}
                <button
                  onClick={handleDispatchLetter}
                  disabled={dispatchLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0E4230] via-[#3FA97A] to-[#1D6B4C] hover:brightness-110 active:scale-[0.98] text-amber-100 border-2 border-[#3FA97A] transition-all shadow-[0_0_25px_rgba(63, 169, 122,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {dispatchLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                  ) : (
                    <PenTool className="w-5 h-5 text-amber-300 animate-pulse" />
                  )}
                  <span>
                    {dispatchLoading
                      ? 'Affixing Wax Seal & Dispatching...'
                      : `Seal & Dispatch Letter (Sealed Until ${new Date(targetDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                  </span>
                </button>

                {/* Export Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* 1. Video Export */}
                  <button
                    onClick={handleExportVideo}
                    disabled={exportProgress?.status === 'rendering'}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-[#3FA97A] via-[#3FA97A] to-[#1D6B4C] text-[#1E1712] hover:brightness-110 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <Video className="w-4 h-4 flex-shrink-0" />
                    <span>Export Video</span>
                  </button>

                  {/* 2. HD PNG Snapshot */}
                  <button
                    onClick={handleExportImage}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#2A1F16] border border-[#3FA97A]/50 hover:border-[#3FA97A] text-[#FAF0E6] hover:bg-[#382B1F] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <ImageIcon className="w-4 h-4 text-[#3FA97A] flex-shrink-0" />
                    <span>HD Story Card</span>
                  </button>

                  {/* 3. Copy to Clipboard */}
                  <button
                    onClick={handleCopyClipboard}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#2A1F16] border border-[#3FA97A]/50 hover:border-[#3FA97A] text-[#FAF0E6] hover:bg-[#382B1F] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5"
                    style={{ fontFamily: "'Cinzel', serif" }}
                    title="Copy HD Story Card directly to Clipboard"
                  >
                    <Copy className="w-4 h-4 text-[#3FA97A] flex-shrink-0" />
                    <span>Copy Image</span>
                  </button>

                  {/* 4. Mobile Share */}
                  <button
                    onClick={handleShareStory}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 text-white hover:brightness-110 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <Share2 className="w-4 h-4 flex-shrink-0" />
                    <span>Dispatch Story</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── POST-DISPATCH CONFIRMATION OVERLAY ── */}
          <AnimatePresence>
            {dispatchedResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="max-w-md w-full bg-[#1A120B] border-2 border-[#3FA97A] p-6 rounded-2xl shadow-2xl space-y-4 text-center animate-glow-pulse">
                  <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-2xl">
                    👑
                  </div>

                  <div>
                    <h3
                      className="text-xl sm:text-2xl font-bold text-amber-200 tracking-wider"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      Epistle Sealed & Dispatched!
                    </h3>
                    <p className="text-xs italic text-amber-300/80 font-serif mt-0.5">
                      Your letter is recorded in the High Post Registry.
                    </p>
                  </div>

                  {/* Sealed-Until Highlight */}
                  <div className="p-3 bg-black/70 rounded-xl border border-amber-500/40 text-left space-y-1 text-xs">
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="font-bold">Recipient:</span>
                      <span className="text-white font-serif">{dispatchedResult.receiverName}</span>
                    </div>
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="font-bold">Sealed Until:</span>
                      <span className="text-amber-200 font-mono font-bold">
                        {new Date(dispatchedResult.scheduledFor).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Canvas */}
                  {dispatchedResult.qrCodeToken && (
                    <div className="space-y-2">
                      <div className="inline-block p-3 bg-white rounded-xl shadow-inner border-2 border-[#3FA97A]">
                        <QRCodeCanvas value={dispatchedResult.qrCodeToken} size={150} fgColor="#1A1208" />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/80 border border-amber-500/30 text-xs">
                        <span className="font-mono text-[11px] text-amber-200 truncate mr-2">
                          {dispatchedResult.qrCodeToken}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(dispatchedResult.qrCodeToken);
                              setDispatchedCopied(true);
                              setTimeout(() => setDispatchedCopied(false), 2000);
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-[#3FA97A] text-stone-900 font-bold text-[10px] flex items-center gap-1 flex-shrink-0"
                        >
                          {dispatchedCopied ? <Check className="w-3 h-3 text-green-800" /> : <Copy className="w-3 h-3" />}
                          <span>{dispatchedCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/map', {
                          state: {
                            letterId: dispatchedResult.letterId,
                            letterToken: dispatchedResult.qrCodeToken
                          }
                        });
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg flex items-center justify-center gap-2 hover:brightness-110"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      <Compass className="w-4 h-4" />
                      <span>🏇 Hand Over to Mailman</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/sent');
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#2A1F16] border border-amber-500/40 text-amber-200 hover:bg-[#3A2A1E] flex items-center justify-center gap-2"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      <span>📜 View Sent Letters</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDispatchedResult(null)}
                      className="text-[11px] text-amber-400/80 hover:text-amber-200 underline pt-1"
                    >
                      Continue editing & exporting Story Herald
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
