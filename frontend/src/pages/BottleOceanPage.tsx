import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Waves, 
  Send, 
  Compass, 
  Eye, 
  Sparkles, 
  X, 
  Trash2, 
  CheckCircle, 
  Anchor, 
  Navigation, 
  Wind, 
  Shield,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { 
  tossBottleMessage, 
  getMyTossedBottles, 
  getMyBeachedBottles, 
  uncorkBottleMessage,
  removeLetterToTrash,
  reportUser
} from '../api';
import ContinuousOceanWaves from '../components/ContinuousOceanWaves';
import { waxSealAudio } from '../utils/waxSealAudio';
import { notify, confirmAction } from '../components/RealmDialog';

const BOTTLE_STYLES = [
  { id: 'emerald', name: 'Emerald Sea Glass', class: 'glass-bottle-emerald', color: '#10B981', desc: 'Forged from coastal seaweed and jade sands' },
  { id: 'sapphire', name: 'Sapphire Deep Glass', class: 'glass-bottle-sapphire', color: '#0284C7', desc: 'Resonant with deep oceanic currents' },
  { id: 'amber', name: 'Amber Solitude', class: 'glass-bottle-amber', color: '#A9603A', desc: 'Aged resin bottle carrying nostalgic warmth' },
  { id: 'crystal', name: 'Frosted Moon Crystal', class: 'glass-bottle-crystal', color: '#E2E8F0', desc: 'Translucent crystal that gleams beneath starlight' },
];

const WAX_SEALS = [
  { id: 'gold', name: 'Royal Gold', hex: '#3FA97A' },
  { id: 'crimson', name: 'Imperial Crimson', hex: '#DC2626' },
  { id: 'emerald', name: 'Abyssal Emerald', hex: '#059669' },
  { id: 'azure', name: 'Celestial Azure', hex: '#2563EB' },
];

const BOTTLE_PROMPTS = [
  "To whoever picks this up from the tide: I hope the storm passed above you gently...",
  "A quiet truth from Cape Horn: We search for shores, yet the open sea teaches us who we are.",
  "If your footsteps wander near the cliffs tonight, look out toward the beacon. You are not alone.",
  "May these salt-sprayed words bring peace to whatever shore they crash upon."
];

interface BottleOceanPageProps {
  user: any;
}

export default function BottleOceanPage({ user }: BottleOceanPageProps) {
  const [activeTab, setActiveTab] = useState<'scriptorium' | 'radar' | 'shore'>('scriptorium');
  
  // Scriptorium State
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [bottleMoniker, setBottleMoniker] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'emerald' | 'sapphire' | 'amber' | 'crystal'>('emerald');
  const [selectedWax, setSelectedWax] = useState('gold');
  const [font, setFont] = useState('Great Vibes');
  
  // Post-Send Cinematic Prompt Modal & Choreographed Animation State
  const [tossPromptOpen, setTossPromptOpen] = useState(false);
  const [tossPhase, setTossPhase] = useState<'rolling' | 'inserting' | 'corking' | 'tossing' | 'dispatched'>('rolling');
  const [lastTossedResult, setLastTossedResult] = useState<any>(null);
  
  // Data
  const [tossedBottles, setTossedBottles] = useState<any[]>([]);
  const [beachedBottles, setBeachedBottles] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Reporting State
  const [reportingBottle, setReportingBottle] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Uncorking / Reader Modal
  const [uncorkingBottle, setUncorkingBottle] = useState<any>(null);
  const [uncorkStep, setUncorkStep] = useState<'sealed' | 'popping' | 'reading'>('sealed');
  const [viewingDriftLogs, setViewingDriftLogs] = useState<any>(null);
  const [isClosingScroll, setIsClosingScroll] = useState(false);

  const handleCloseUncorkedLetter = () => {
    setIsClosingScroll(true);
    setTimeout(() => {
      setUncorkingBottle(null);
      setIsClosingScroll(false);
    }, 550);
  };

  const fetchBottles = async () => {
    if (!user) return;
    const uid = user.id || user._id;
    setLoadingData(true);
    try {
      const [tossed, beached] = await Promise.all([
        getMyTossedBottles(uid),
        getMyBeachedBottles(uid)
      ]);
      setTossedBottles(tossed || []);
      setBeachedBottles(beached || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchBottles();
  }, [user]);

  const handleCastBottle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) {
      notify.info("Write your message before casting the bottle.");
      return;
    }

    const uid = user?.id || user?._id;
    if (!uid) return;

    // 1. Open dedicated post-send cinematic animation prompt immediately!
    setTossPromptOpen(true);
    setTossPhase('rolling');
    
    // Step 2: Slide into bottle
    setTimeout(() => {
      setTossPhase('inserting');
      waxSealAudio.playParchmentUnroll();
    }, 1100);

    // Step 3: Hammer cork & stamp wax seal
    setTimeout(() => {
      setTossPhase('corking');
      waxSealAudio.playWaxStampThud();
    }, 2200);

    // Step 4: Arcing throw into waves
    setTimeout(async () => {
      setTossPhase('tossing');
      waxSealAudio.playOceanSplash();
      try {
        const res = await tossBottleMessage({
          userId: uid,
          content,
          isAnonymous,
          bottleMoniker: isAnonymous ? (bottleMoniker || 'A Wandering Mariner') : user.name,
          bottleStyle: selectedStyle,
          bottleWaxColor: selectedWax,
          font,
          fontSize: 'medium'
        });

        // Step 5: Dispatched telemetry certificate prompt
        setTimeout(() => {
          setTossPhase('dispatched');
          waxSealAudio.playSaddlebagDispatch();
          setLastTossedResult(res);
          setContent('');
          fetchBottles();
        }, 1800);
      } catch (err: any) {
        notify.error(err.message || "Could not toss bottle into the tide");
        setTossPromptOpen(false);
      }
    }, 3400);
  };

  const handleUncorkStart = (bottle: any) => {
    setUncorkingBottle(bottle);
    setUncorkStep('sealed');
  };

  const handleExecuteUncork = async () => {
    if (!uncorkingBottle) return;
    setUncorkStep('popping');
    waxSealAudio.playCorkPop();
    try {
      const res = await uncorkBottleMessage(uncorkingBottle._id);
      setTimeout(() => {
        setUncorkingBottle(res.letter || uncorkingBottle);
        setUncorkStep('reading');
        waxSealAudio.playParchmentUnroll();
        fetchBottles();
      }, 1200);
    } catch (err: any) {
      notify.error(err.message || "Could not uncork bottle");
      setUncorkStep('sealed');
    }
  };

  const handleRemoveBottle = async (id: string) => {
    if (!(await confirmAction({ title: 'Move to Wastebin', message: 'Move this bottle to your wastebin? You can restore it later.', confirmLabel: 'Move to Wastebin' }))) return;
    // Optimistically remove from state immediately
    setTossedBottles(prev => prev.filter(b => b._id !== id));
    setBeachedBottles(prev => prev.filter(b => b._id !== id));
    try {
      await removeLetterToTrash(id);
      setActionMsg("Relic removed to your wastebin.");
      setTimeout(() => setActionMsg(null), 3000);
      fetchBottles();
    } catch (err: any) {
      notify.error(err.message || "Could not remove bottle");
      fetchBottles();
    }
  };

  const handleReportSubmit = async () => {
    if (!reportingBottle || !reportReason.trim()) return;
    setReportStatus('submitting');
    try {
      await reportUser(
        reportingBottle.senderRef?._id || reportingBottle.senderRef || 'anonymous',
        reportReason,
        reportingBottle._id
      );
      setReportStatus('success');
      setTimeout(() => {
        setReportingBottle(null);
        setReportReason('');
        setReportStatus('idle');
      }, 2500);
    } catch (err) {
      setReportStatus('error');
    }
  };

  const currentStyleObj = BOTTLE_STYLES.find(b => b.id === selectedStyle) || BOTTLE_STYLES[0];
  const currentWaxObj = WAX_SEALS.find(w => w.id === selectedWax) || WAX_SEALS[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8 }} 
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* ── OCEAN HERO BANNER ── */}
      <div 
        className="relative overflow-hidden rounded-sm p-6 md:p-10 shadow-2xl border border-sky-400/40"
        style={{
          background: 'linear-gradient(135deg, rgba(3, 21, 38, 0.96) 0%, rgba(4, 38, 34, 0.94) 50%, rgba(2, 16, 26, 0.98) 100%)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), inset 0 0 100px rgba(2, 132, 199, 0.2)'
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest font-mono" style={{ background: 'rgba(6, 95, 70, 0.6)', color: '#A7F3D0', border: '1px solid #10B981' }}>
              <Waves className="w-3.5 h-3.5 text-emerald-300" />
              <span>Nautical Epistles • Ocean Currents</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: '#E0F2FE' }}>
              Message in a Bottle
            </h1>
            <p className="text-sm md:text-base italic leading-relaxed text-sky-200/90 font-serif">
              Toss anonymous letters into the open sea. The tides carry them to distant shores — people nearer to you are more likely to find them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/mailbox" className="btn-quantum text-xs py-2 px-4 flex items-center gap-1.5" style={{ background: 'rgba(6, 95, 70, 0.6)', border: '1px solid #10B981' }}>
              📬 Your Mailbox
            </Link>
            <Link to="/" className="btn-gold-saloon text-xs py-2 px-4">
              ← My Desk
            </Link>
          </div>
        </div>

        {/* Continuous Floating Ocean Waves Background */}
        <ContinuousOceanWaves height="h-28" opacity="opacity-30" theme="sapphire" />
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-sm text-sm font-bold flex items-center gap-2 shadow-md bg-emerald-950/80 text-emerald-200 border border-emerald-500 animate-curtain-reveal">
          <CheckCircle className="w-5 h-5 text-emerald-400" /> {actionMsg}
        </div>
      )}

      {/* ── OCEAN NAVIGATION TABS ── */}
      <div className="flex border-b border-sky-900/60 gap-2 md:gap-4 pb-1">
        <button
          onClick={() => setActiveTab('scriptorium')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-sm text-sm font-bold transition-all ${
            activeTab === 'scriptorium'
              ? 'bg-sky-950/80 text-sky-200 border-t-2 border-l border-r border-sky-400 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Send className="w-4 h-4 text-emerald-400" />
          <span>Write a Bottle Note</span>
        </button>

        <button
          onClick={() => { setActiveTab('radar'); fetchBottles(); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-sm text-sm font-bold transition-all relative ${
            activeTab === 'radar'
              ? 'bg-sky-950/80 text-sky-200 border-t-2 border-l border-r border-sky-400 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Ocean Drift Radar ({tossedBottles.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('shore'); fetchBottles(); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-sm text-sm font-bold transition-all relative ${
            activeTab === 'shore'
              ? 'bg-sky-950/80 text-sky-200 border-t-2 border-l border-r border-emerald-400 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Waves className="w-4 h-4 text-emerald-400" />
          <span>Beached Bottles ({beachedBottles.length})</span>
          {beachedBottles.some(b => b.bottleDrift?.driftStatus !== 'uncorked') && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>
      </div>

      {/* ========================================================
          TAB 1: TIDE SCRIPTORIUM (CAST BOTTLE)
         ======================================================== */}
      {activeTab === 'scriptorium' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Note Inscription Form */}
          <div className="lg:col-span-7 theatrical-card p-6 md:p-8 space-y-6" style={{
            background: 'linear-gradient(160deg, #091C28 0%, #051119 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)'
          }}>
            <div>
              <h3 className="text-xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#E0F2FE' }}>
                Write Your Note for the Tides
              </h3>
              <p className="text-xs text-sky-300/70 italic mt-0.5">
                Keep it short — up to 500 characters. Whoever finds it will uncork the bottle and read it in the script you choose.
              </p>
            </div>

            {/* Inspiration Prompts */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-bold text-sky-400 mr-1 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3" /> Prompts:
              </span>
              {BOTTLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setContent(p)}
                  className="text-[11px] px-2.5 py-1 rounded bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/40 transition-all text-left truncate max-w-xs"
                  title={p}
                >
                  "{p.slice(0, 32)}..."
                </button>
              ))}
            </div>

            {/* Text Area */}
            <div>
              <textarea
                rows={5}
                value={content}
                maxLength={500}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message to the ocean… (e.g. 'To whoever finds this bottle on a distant morning…')"
                className="w-full p-4 rounded-sm text-base font-serif italic focus:outline-none shadow-inner resize-none transition-all"
                style={{
                  background: '#FFFDF9',
                  color: '#1A1A1A',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  fontFamily: font === 'Cinzel' ? "'Cinzel', serif" : font === 'Great Vibes' ? "'Great Vibes', cursive" : "'Special Elite', cursive"
                }}
              />
              <div className="flex justify-between items-center text-[11px] text-sky-400 mt-1 font-mono">
                <span>{content.length}/500 glyphs</span>
                <span>Proximity decay distribution active</span>
              </div>
            </div>

            {/* Anonymity & Moniker */}
            <div className="p-4 rounded-sm bg-sky-950/40 border border-sky-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-sky-900 border-sky-700"
                  />
                  <span className="text-xs font-bold text-sky-200" style={{ fontFamily: "'Cinzel', serif" }}>
                    Toss Anonymously (Hide Sender Identity from Recipient)
                  </span>
                </label>
                <Shield className="w-4 h-4 text-sky-400" />
              </div>

              {isAnonymous && (
                <div>
                  <label className="block text-[11px] font-bold text-sky-300 mb-1 font-mono">
                    Nautical Moniker (Optional Alias):
                  </label>
                  <input
                    type="text"
                    value={bottleMoniker}
                    onChange={(e) => setBottleMoniker(e.target.value)}
                    placeholder="e.g. 'A Lost Mariner of Cape Horn', 'Lighthouse Keeper'"
                    className="w-full p-2.5 rounded-sm text-xs bg-slate-900 text-sky-100 border border-sky-800 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Glass Bottle Vintage & Wax Seal Selector */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-sky-200 uppercase tracking-wider mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                  Select Glass Bottle Vintage:
                </label>

                {/* Prominent Active Selection Banner (Static, Zero Jiggle) */}
                <div className="mb-3.5 p-3.5 rounded-sm bg-slate-950 border-2 border-amber-400 shadow-md flex items-start gap-3.5">
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-amber-300 shadow-md flex-shrink-0 flex items-center justify-center relative overflow-hidden" 
                    style={{ background: currentStyleObj.color, boxShadow: `0 0 12px ${currentStyleObj.color}` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/70 pointer-events-none" />
                    <span className="text-white font-bold text-xs drop-shadow">✦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-amber-300 font-serif tracking-wide">
                        {currentStyleObj.name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold uppercase tracking-wider shadow">
                        ✓ Selected Vintage
                      </span>
                    </div>
                    <p className="text-xs text-white font-serif italic mt-1 leading-relaxed font-medium">
                      "{currentStyleObj.desc}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BOTTLE_STYLES.map((b) => {
                    const isSelected = selectedStyle === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedStyle(b.id as any)}
                        className={`p-3.5 rounded-sm text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-2 border-amber-400 bg-slate-900 shadow-lg'
                            : 'border border-slate-700 bg-slate-950/90 hover:border-slate-500 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <div 
                            className="w-7 h-7 rounded-full border-2 border-white/60 shadow-md relative overflow-hidden flex-shrink-0" 
                            style={{ 
                              background: b.color, 
                              boxShadow: `0 0 10px ${b.color}88, inset 0 2px 4px rgba(255,255,255,0.7)` 
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-white/70 pointer-events-none" />
                          </div>
                          {isSelected ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-stone-950 shadow flex items-center gap-1">
                              ✓ Selected
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400 hover:text-amber-200 transition-colors">
                              Select ✦
                            </span>
                          )}
                        </div>

                        <div>
                          <p className={`text-sm font-bold tracking-wide font-serif mb-1 ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                            {b.name}
                          </p>
                          <p className={`text-xs font-serif leading-relaxed ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                            {b.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-sky-900/40">
                <div>
                  <label className="block text-xs font-bold text-sky-200 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    Watertight Wax Seal Color:
                  </label>
                  <div className="flex items-center gap-2.5">
                    {WAX_SEALS.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWax(w.id)}
                        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center relative ${
                          selectedWax === w.id ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-slate-950 shadow-lg' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ background: w.hex }}
                        title={w.name}
                      >
                        {selectedWax === w.id && (
                          <span className="text-[10px] text-white font-bold drop-shadow">✦</span>
                        )}
                      </button>
                    ))}
                    <span className="text-xs font-mono text-amber-300 ml-1.5">
                      {currentWaxObj.name}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sky-200 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    Script Calligraphy Font:
                  </label>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="w-full p-2.5 rounded-sm text-xs bg-slate-900 text-sky-200 border border-sky-800 focus:outline-none focus:border-sky-400 shadow-inner"
                  >
                    <option value="Great Vibes">Great Vibes (Flowing Calligraphy)</option>
                    <option value="Cinzel">Cinzel (Classical Inscription)</option>
                    <option value="Special Elite">Special Elite (Weathered Typewriter)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-sky-900/40">
              <button
                type="button"
                onClick={handleCastBottle}
                disabled={!content.trim()}
                className="btn-quantum w-full py-3.5 px-6 flex items-center justify-center gap-2 text-sm font-bold shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #065F46 100%)',
                  border: '1px solid rgba(56,189,248,0.6)'
                }}
              >
                <Send className="w-4 h-4" />
                <span>✦ Seal Cork & Cast into the Ocean Waves</span>
              </button>
            </div>
          </div>

          {/* Right Column: Realistic 3D Glass Bottle Visualizer with Continuous Ocean Waves */}
          <div className="lg:col-span-5 space-y-6">
            <div className="theatrical-card p-6 sm:p-8 relative overflow-hidden text-center flex flex-col items-center justify-between min-h-[480px]" style={{
              background: 'linear-gradient(180deg, #071926 0%, #030C13 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}>
              {/* Continuous Floating Ocean Waves Background */}
              <ContinuousOceanWaves 
                height="h-44" 
                opacity="opacity-55" 
                theme={selectedStyle === 'emerald' ? 'emerald' : 'sapphire'} 
              />

              {/* Realistic 3D Floating Glass Bottle Container */}
              <div className="w-full py-4 space-y-5 relative z-10 animate-bottle-float-natural">
                <div className="realistic-bottle-wrap mx-auto">
                  {/* Real Wooden Cork Stopper */}
                  <div className="realistic-cork">
                    {/* Glowing Wax Seal on Top */}
                    <div className="realistic-wax-seal" style={{ background: currentWaxObj.hex }}>
                      <span className="text-[8px] font-bold text-white/90">✦</span>
                      <div className="realistic-wax-drip" style={{ background: currentWaxObj.hex, right: '3px' }} />
                    </div>
                  </div>

                  {/* Bottle Neck */}
                  <div className={`realistic-bottle-neck ${currentStyleObj.class}`} />

                  {/* Bottle Shoulder */}
                  <div className={`realistic-bottle-shoulder ${currentStyleObj.class}`} />

                  {/* Bottle Body */}
                  <div className={`realistic-bottle-body ${currentStyleObj.class}`}>
                    {/* Glass Highlights Specular Shine */}
                    <div className="realistic-glass-shine" />

                    {/* 3D Rolled Parchment Scroll inside Chamber */}
                    <div className="realistic-rolled-scroll">
                      <div className="scroll-twine-tie" />
                      <div className="w-full h-1 bg-amber-800/40 rounded-full" />
                      <div className="w-4/5 h-1 bg-amber-800/40 rounded-full" />
                      <div className="w-3/4 h-1 bg-amber-800/40 rounded-full" />
                    </div>

                    {/* Glass Bottom Rim */}
                    <div className="realistic-glass-bottom-rim" />
                  </div>
                </div>
              </div>

              {/* Selected Vessel Codex Card - Clear Name & Description Display */}
              <div className="w-full mt-2 p-4 rounded-sm bg-sky-950/85 border border-sky-500/40 text-left space-y-2 relative z-10 shadow-xl">
                <div className="flex items-center justify-between border-b border-sky-800/50 pb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3.5 h-3.5 rounded-full border border-white/60" 
                      style={{ background: currentStyleObj.color, boxShadow: `0 0 8px ${currentStyleObj.color}` }} 
                    />
                    <h4 className="text-sm font-bold text-amber-200 font-serif">
                      {currentStyleObj.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-sky-900 text-sky-200 border border-sky-700">
                    ✦ Selected Vintage
                  </span>
                </div>

                <p className="text-xs text-sky-100 font-serif italic leading-relaxed bg-slate-900/60 p-2.5 rounded border border-sky-900/40">
                  "{currentStyleObj.desc}"
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-sky-300/90 border-t border-sky-900/30">
                  <div>
                    <span className="text-slate-400">Wax Seal: </span>
                    <strong className="text-amber-300 font-semibold">{currentWaxObj.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Buoyancy: </span>
                    <strong className="text-emerald-300 font-semibold">Grade A Hydrodynamic</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DEDICATED POST-SEND CINEMATIC PROMPT MODAL
         ======================================================== */}
      <AnimatePresence>
        {tossPromptOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 backdrop-blur-md"
          >
            <div className="theatrical-card p-6 sm:p-10 max-w-xl w-full relative text-center space-y-6 overflow-hidden rounded-sm" style={{
              background: 'linear-gradient(160deg, #061924 0%, #030C12 100%)',
              border: '2px solid rgba(56, 189, 248, 0.6)',
              boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(56, 189, 248, 0.25)'
            }}>
              {/* Header Title */}
              <div>
                <span className="text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded bg-sky-950 text-sky-300 font-mono border border-sky-700">
                  ✦ Nautical Casting Sequence ✦
                </span>
                <h3 className="text-2xl font-bold mt-2 text-white" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                  {tossPhase === 'rolling' && '1. Rolling Vellum Note...'}
                  {tossPhase === 'inserting' && '2. Sliding Scroll into Chamber...'}
                  {tossPhase === 'corking' && '3. Pressing Cork & Hot Wax Seal...'}
                  {tossPhase === 'tossing' && '4. Arcing into Open Tides!'}
                  {tossPhase === 'dispatched' && '✦ Bottle Dispatched to the Ocean! ✦'}
                </h3>
              </div>

              {/* Animation Stage Area */}
              <div className="py-6 relative min-h-[220px] flex flex-col items-center justify-center">
                {/* Step 1: Rolling Note */}
                {tossPhase === 'rolling' && (
                  <div className="space-y-3 animate-curtain-reveal">
                    <div className="w-24 h-32 mx-auto bg-amber-50 rounded-sm shadow-2xl border border-amber-300 p-3 transform rotate-3 flex flex-col justify-between">
                      <p className="text-[10px] text-stone-900 italic font-serif truncate">"{content}"</p>
                      <div className="h-1 bg-amber-700/40 rounded-full" />
                      <div className="h-1 bg-amber-700/40 rounded-full w-3/4" />
                      <div className="text-[9px] font-bold text-amber-900 text-right border-t border-amber-300 pt-1">
                        Binding with Twine ✦
                      </div>
                    </div>
                    <p className="text-xs font-bold text-sky-300 font-mono animate-pulse">
                      Tightly rolling the parchment note...
                    </p>
                  </div>
                )}

                {/* Step 2: Inserting Scroll into Glass Bottle */}
                {tossPhase === 'inserting' && (
                  <div className="space-y-3 animate-curtain-reveal">
                    <div className="realistic-bottle-wrap mx-auto">
                      <div className={`realistic-bottle-neck ${currentStyleObj.class}`} />
                      <div className={`realistic-bottle-shoulder ${currentStyleObj.class}`} />
                      <div className={`realistic-bottle-body ${currentStyleObj.class}`}>
                        <div className="realistic-glass-shine" />
                        <div className="animate-parchment-insert realistic-rolled-scroll">
                          <div className="scroll-twine-tie" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-sky-300 font-mono animate-pulse">
                      Scroll descending into the {currentStyleObj.name} vintage...
                    </p>
                  </div>
                )}

                {/* Step 3: Corking & Wax Seal Stamping */}
                {tossPhase === 'corking' && (
                  <div className="space-y-3 animate-curtain-reveal">
                    <div className="realistic-bottle-wrap mx-auto">
                      <div className="animate-cork-press realistic-cork">
                        <div className="realistic-wax-seal" style={{ background: currentWaxObj.hex }}>
                          <span className="text-[8px] font-bold text-white">✦</span>
                          <div className="realistic-wax-drip" style={{ background: currentWaxObj.hex, right: '3px' }} />
                        </div>
                      </div>
                      <div className={`realistic-bottle-neck ${currentStyleObj.class}`} />
                      <div className={`realistic-bottle-shoulder ${currentStyleObj.class}`} />
                      <div className={`realistic-bottle-body ${currentStyleObj.class}`}>
                        <div className="realistic-glass-shine" />
                        <div className="realistic-rolled-scroll">
                          <div className="scroll-twine-tie" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-emerald-300 font-mono animate-pulse">
                      Stamping {currentWaxObj.name} wax seal to ensure watertight passage!
                    </p>
                  </div>
                )}

                {/* Step 4: Arcing Toss & Ocean Splash (HD Cinematic) */}
                {tossPhase === 'tossing' && (
                  <div className="space-y-3 relative w-full min-h-[260px] overflow-hidden rounded-sm p-4" style={{
                    background: 'radial-gradient(ellipse at 50% 20%, #0C364D 0%, #061F2E 60%, #020D14 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
                  }}>
                    {/* Glowing Moon & Starfield */}
                    <div className="absolute top-3 right-8 w-12 h-12 rounded-full bg-amber-100/90 shadow-[0_0_25px_rgba(255,248,220,0.7)] pointer-events-none" />
                    <div className="absolute top-6 left-10 w-1 h-1 bg-white rounded-full animate-ping" />
                    <div className="absolute top-12 left-1/4 w-1.5 h-1.5 bg-sky-200 rounded-full" />
                    <div className="absolute top-8 right-1/3 w-1 h-1 bg-sky-300 rounded-full" />

                    {/* Arcing Spinning 3D Bottle */}
                    <div className="animate-bottle-toss realistic-bottle-wrap mx-auto relative z-20">
                      <div className="realistic-cork">
                        <div className="realistic-wax-seal" style={{ background: currentWaxObj.hex }} />
                      </div>
                      <div className={`realistic-bottle-neck ${currentStyleObj.class}`} />
                      <div className={`realistic-bottle-shoulder ${currentStyleObj.class}`} />
                      <div className={`realistic-bottle-body ${currentStyleObj.class}`}>
                        <div className="realistic-glass-shine" />
                        <div className="realistic-rolled-scroll">
                          <div className="scroll-twine-tie" />
                        </div>
                      </div>
                    </div>

                    {/* Ocean Wave & Expanding Multi-Ring Splash */}
                    <div className="relative mt-4 flex flex-col justify-center items-center h-28 w-full overflow-hidden">
                      <ContinuousOceanWaves height="h-28" opacity="opacity-80" theme="sapphire" />

                      {/* Expanding Multi-Ring Splash Impact */}
                      <div className="absolute top-2 w-44 h-16 rounded-full border-2 border-sky-300/80 animate-splash-ring" />
                      <div className="absolute top-2 w-28 h-10 rounded-full border-2 border-emerald-300/90 animate-splash-ring" style={{ animationDelay: '0.35s' }} />
                      <div className="absolute top-2 w-16 h-6 rounded-full border border-white animate-splash-ring" style={{ animationDelay: '0.7s' }} />
                      
                      {/* Water Splash Particles */}
                      <div className="absolute top-0 left-1/3 w-2 h-2 rounded-full bg-sky-200 animate-bounce" style={{ animationDuration: '0.8s' }} />
                      <div className="absolute -top-2 right-1/3 w-2.5 h-2.5 rounded-full bg-emerald-200 animate-bounce" style={{ animationDuration: '0.9s' }} />
                      <div className="absolute -top-4 left-1/2 w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDuration: '0.7s' }} />
                    </div>

                    <p className="text-xs font-bold text-sky-200 font-mono animate-pulse text-center relative z-20">
                      🌊 Plunging through seafoam crests into the open ocean currents...
                    </p>
                  </div>
                )}

                {/* Step 5: Dispatched Certificate Prompt */}
                {tossPhase === 'dispatched' && (
                  <div className="space-y-5 animate-curtain-reveal w-full">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center shadow-2xl">
                      <CheckCircle className="w-9 h-9 text-emerald-300" />
                    </div>

                    <div className="p-4 rounded-sm bg-slate-900/80 border border-sky-800 text-left space-y-2 text-xs">
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400 font-mono">Nautical Moniker:</span>
                        <strong className="text-sky-200">{isAnonymous ? (bottleMoniker || 'A Wandering Mariner') : user.name}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400 font-mono">Current Ocean Drift:</span>
                        <strong className="text-emerald-300 font-mono">{lastTossedResult?.driftDistanceKm || 45} km</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono">Ocean Current:</span>
                        <span className="text-sky-300 font-mono">North Equatorial Swell</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTossPromptOpen(false);
                          setActiveTab('radar');
                        }}
                        className="btn-quantum flex-1 py-3 text-xs font-bold justify-center gap-1.5"
                      >
                        <Compass className="w-4 h-4" />
                        <span>Track in Ocean Radar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTossPromptOpen(false);
                          setActiveTab('scriptorium');
                        }}
                        className="btn-gold-saloon flex-1 py-3 text-xs font-bold justify-center"
                      >
                        ✦ Cast Another Bottle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          TAB 2: OCEAN DRIFT RADAR (BOTTLES CAST BY YOU)
         ======================================================== */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          <div className="theatrical-card p-6 md:p-8 space-y-4" style={{
            background: 'linear-gradient(160deg, #091C28 0%, #051119 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)'
          }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-sky-900/40 pb-4">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif", color: '#E0F2FE' }}>
                  <Compass className="w-6 h-6 text-sky-400" />
                  Ocean Drift Radar
                </h3>
                <p className="text-xs text-sky-300/80 italic mt-0.5">
                  Track every bottle you have cast into open oceanic currents.
                </p>
              </div>

              <button
                onClick={fetchBottles}
                disabled={loadingData}
                className="btn-quantum text-xs py-2 px-4 flex items-center gap-1"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                <span>Refresh Radar</span>
              </button>
            </div>

            {tossedBottles.length === 0 ? (
              <div className="p-12 text-center rounded-sm bg-slate-900/30 border border-dashed border-sky-800/40 text-sky-300/60">
                <Wind className="w-12 h-12 mx-auto mb-2 opacity-50 text-sky-400" />
                <p className="font-bold text-base text-sky-200" style={{ fontFamily: "'Cinzel', serif" }}>
                  You have not cast any bottles yet.
                </p>
                <p className="text-xs italic mt-1 font-serif">
                  Cast a message in a bottle from the Scriptorium to launch it across ocean swells!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tossedBottles.map((b) => {
                  const styleObj = BOTTLE_STYLES.find(s => s.id === b.bottleStyle) || BOTTLE_STYLES[0];
                  return (
                    <div 
                      key={b._id} 
                      className="p-5 rounded-sm bg-slate-900/60 border border-sky-900/60 space-y-3 transition-all hover:border-sky-500 shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ background: `${styleObj.color}22`, borderColor: styleObj.color }}>
                            <Waves className="w-4 h-4" style={{ color: styleObj.color }} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-sky-100" style={{ fontFamily: "'Cinzel', serif" }}>
                              {b.bottleMoniker || 'Ocean Letter'}
                            </h4>
                            <p className="text-[11px] text-sky-400 font-mono">
                              Vintage: {styleObj.name}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono border border-sky-800">
                          {b.bottleDrift?.driftStatus === 'uncorked' ? '✦ Uncorked' : '🌊 Drifting'}
                        </span>
                      </div>

                      {/* Distance Telemetry */}
                      <div className="p-3 rounded-sm bg-slate-950/60 border border-sky-950 text-xs space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="font-mono">Drift Distance:</span>
                          <strong className="text-emerald-300 font-mono">{b.bottleDrift?.distanceKm || 0} km</strong>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Tossed: {new Date(b.createdAt).toLocaleDateString()}</span>
                          <span>Wax: {b.bottleWaxColor || 'gold'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => setViewingDriftLogs(b)}
                          className="btn-quantum text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>View Tide Logs ({b.bottleDrift?.tideLogs?.length || 1})</span>
                        </button>

                        <button
                          onClick={() => handleRemoveBottle(b._id)}
                          className="text-slate-400 hover:text-red-400 p-1"
                          title="Remove from Radar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: BEACHED BOTTLES SHORE (RECEIVED BOTTLES)
         ======================================================== */}
      {activeTab === 'shore' && (
        <div className="space-y-6">
          <div className="theatrical-card p-6 md:p-8 space-y-4" style={{
            background: 'linear-gradient(160deg, #07221A 0%, #03140E 100%)',
            border: '1px solid rgba(52, 211, 153, 0.4)'
          }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-900/40 pb-4">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2 text-emerald-200" style={{ fontFamily: "'Cinzel', serif" }}>
                  <Waves className="w-6 h-6 text-emerald-400" />
                  Beached Bottles Shore
                </h3>
                <p className="text-xs text-emerald-300/80 italic mt-0.5">
                  Bottles washed ashore on your coastal perimeter. Break the wax seal to unfurl the parchment note!
                </p>
              </div>

              <button
                onClick={fetchBottles}
                disabled={loadingData}
                className="btn-quantum text-xs py-2 px-4 flex items-center gap-1"
                style={{ background: '#065F46', border: '1px solid #10B981' }}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                <span>Scan Coastline</span>
              </button>
            </div>

            {beachedBottles.length === 0 ? (
              <div className="p-12 text-center rounded-sm bg-emerald-950/20 border border-dashed border-emerald-800/40 text-emerald-300/60">
                <Anchor className="w-12 h-12 mx-auto mb-2 opacity-50 text-emerald-400" />
                <p className="font-bold text-base text-emerald-200" style={{ fontFamily: "'Cinzel', serif" }}>
                  Your shore is quiet. No bottles have washed up yet.
                </p>
                <p className="text-xs italic mt-1 font-serif">
                  When other scribes cast bottles into the sea, the tides may carry them to your shore.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {beachedBottles.map((b) => {
                  const isUncorked = b.bottleDrift?.driftStatus === 'uncorked';
                  const styleObj = BOTTLE_STYLES.find(s => s.id === b.bottleStyle) || BOTTLE_STYLES[0];
                  return (
                    <div 
                      key={b._id} 
                      className="p-5 rounded-sm bg-emerald-950/40 border border-emerald-800/50 space-y-3 transition-all hover:border-emerald-400 shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ background: `${styleObj.color}22`, borderColor: styleObj.color }}>
                            <Anchor className="w-4 h-4 text-emerald-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-100" style={{ fontFamily: "'Cinzel', serif" }}>
                              {b.bottleMoniker || 'Anonymous Bottle'}
                            </h4>
                            <p className="text-[11px] text-emerald-300/80 font-mono">
                              Drifted {b.bottleDrift?.distanceKm || 40} km across the sea
                            </p>
                          </div>
                        </div>

                        {isUncorked ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 font-mono border border-emerald-700">
                            Uncorked
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-amber-500 text-stone-950 font-mono animate-pulse">
                            Sealed with Wax
                          </span>
                        )}
                      </div>

                      {/* If Uncorked, show text preview */}
                      {isUncorked ? (
                        <div 
                          className="p-3 rounded-sm text-xs italic bg-slate-950/70 border border-emerald-900 text-slate-200 line-clamp-3"
                          style={{
                            fontFamily: b.font === 'Cinzel' ? "'Cinzel', serif" : b.font === 'Great Vibes' ? "'Great Vibes', cursive" : "'Special Elite', cursive"
                          }}
                        >
                          "{b.content}"
                        </div>
                      ) : (
                        <div className="p-3 rounded-sm text-xs italic bg-emerald-950/40 border border-dashed border-emerald-500/40 text-emerald-200 text-center">
                          ✦ The cork is tightly sealed with {b.bottleWaxColor || 'gold'} wax. Break the seal to unfurl the scroll inside!
                        </div>
                      )}

                      {/* Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-900/40">
                        <span className="text-[11px] text-emerald-400/60 font-mono">
                          Ashore: {new Date(b.deliveredAt || b.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Recipient Report Button for Abusive Bottles */}
                          <button
                            onClick={() => setReportingBottle({
                              _id: b.senderRef?._id || b.senderRef || 'anonymous',
                              name: b.isAnonymous ? `Anonymous Bottle ("${b.bottleMoniker || 'Ocean Relic'}")` : (b.senderRef?.name || 'Mariner'),
                              letterId: b._id
                            })}
                            className="text-xs px-2.5 py-1 rounded bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-800 flex items-center gap-1 font-bold"
                            title="Report abusive content to Guild Master Tribunal"
                          >
                            <AlertTriangle className="w-3 h-3" /> Report
                          </button>

                          <button
                            onClick={() => handleUncorkStart(b)}
                            className="btn-quantum text-xs py-2 px-4 flex items-center gap-1.5"
                            style={{ background: isUncorked ? '#047857' : '#059669', border: '1px solid #34D399' }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isUncorked ? 'Read Unfurled Scroll' : '✦ Break Seal & Uncork'}</span>
                          </button>

                          <button
                            onClick={() => handleRemoveBottle(b._id)}
                            className="text-slate-400 hover:text-red-400 p-1"
                            title="Remove to Wastebin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          UNCORKING & SCROLL READING MODAL (WITH PARCHMENT ROLL)
         ======================================================== */}
      <AnimatePresence>
        {uncorkingBottle && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          >
            {uncorkStep === 'sealed' && (
              <div className="theatrical-card p-6 sm:p-10 max-w-lg w-full relative text-center space-y-6" style={{
                background: 'linear-gradient(160deg, #091C24 0%, #040E12 100%)',
                border: '2px solid #34D399'
              }}>
                <button 
                  onClick={() => setUncorkingBottle(null)} 
                  className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="realistic-bottle-wrap mx-auto">
                  <div className="realistic-cork">
                    <div className="realistic-wax-seal" style={{ background: WAX_SEALS.find(w => w.id === uncorkingBottle.bottleWaxColor)?.hex || '#3FA97A' }}>
                      <span className="text-[8px] font-bold text-white">✦</span>
                    </div>
                  </div>
                  <div className={`realistic-bottle-neck ${BOTTLE_STYLES.find(s => s.id === uncorkingBottle.bottleStyle)?.class || 'glass-bottle-emerald'}`} />
                  <div className={`realistic-bottle-shoulder ${BOTTLE_STYLES.find(s => s.id === uncorkingBottle.bottleStyle)?.class || 'glass-bottle-emerald'}`} />
                  <div className={`realistic-bottle-body ${BOTTLE_STYLES.find(s => s.id === uncorkingBottle.bottleStyle)?.class || 'glass-bottle-emerald'}`}>
                    <div className="realistic-glass-shine" />
                    <div className="realistic-rolled-scroll">
                      <div className="scroll-twine-tie" />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded bg-emerald-900 text-emerald-200 font-mono">
                    Washed Ashore Relic
                  </span>
                  <h3 className="text-2xl font-bold mt-2 text-white" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                    {uncorkingBottle.bottleMoniker || 'Anonymous Bottle'}
                  </h3>
                  <p className="text-xs text-emerald-300 italic mt-1">
                    Drifted {uncorkingBottle.bottleDrift?.distanceKm || 40} km across oceanic tides.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      const cur = uncorkingBottle;
                      setUncorkingBottle(null);
                      setReportingBottle({
                        _id: cur.senderRef?._id || cur.senderRef || 'anonymous',
                        name: cur.isAnonymous ? `Anonymous Bottle ("${cur.bottleMoniker || 'Ocean Relic'}")` : (cur.senderRef?.name || 'Mariner'),
                        letterId: cur._id
                      });
                    }}
                    className="px-4 py-3 rounded-sm bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-800 text-xs font-bold flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Report
                  </button>

                  <button
                    onClick={handleExecuteUncork}
                    className="btn-quantum flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: '#059669', border: '1px solid #34D399' }}
                  >
                    <span>🍾 Pull Cork & Extract Scroll</span>
                  </button>
                </div>
              </div>
            )}

            {uncorkStep === 'popping' && (
              <div className="theatrical-card p-12 max-w-sm w-full text-center space-y-6" style={{
                background: 'linear-gradient(160deg, #091C24 0%, #040E12 100%)',
                border: '2px solid #34D399'
              }}>
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-900/50 border-2 border-emerald-400 flex items-center justify-center animate-spin">
                  <Waves className="w-8 h-8 text-emerald-300" />
                </div>
                <h4 className="text-xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                  Popping Cork & Unrolling Scroll...
                </h4>
                <p className="text-xs text-emerald-300 font-mono">
                  Breaking salt-spray seal...
                </p>
              </div>
            )}

            {uncorkStep === 'reading' && (
              <div className={`max-w-lg w-full relative ${isClosingScroll ? 'animate-scroll-roll-close' : 'animate-scroll-unroll'}`}>
                {/* Top Wooden Rod */}
                <div className="scroll-rod-top" />

                <div className="parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl">
                  <button 
                    onClick={handleCloseUncorkedLetter} 
                    className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="border-b border-amber-900/30 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Anchor className="w-5 h-5 text-emerald-800" />
                      <h3 className="text-xl font-bold" style={{ color: '#064E3B', fontFamily: "'Cinzel', serif" }}>
                        {uncorkingBottle.bottleMoniker || 'Ocean Bottle Letter'}
                      </h3>
                    </div>
                    <p className="text-xs italic text-emerald-900/70 mt-1">
                      Origin: <strong className="font-bold">{uncorkingBottle.isAnonymous ? 'An Anonymous Soul' : (uncorkingBottle.senderRef?.name || 'A Mariner')}</strong> • Drifted: {uncorkingBottle.bottleDrift?.distanceKm || 0} km
                    </p>
                  </div>

                  <div 
                    style={{
                      fontFamily: uncorkingBottle.font === 'Cinzel' ? "'Cinzel', serif" : uncorkingBottle.font === 'Great Vibes' ? "'Great Vibes', cursive" : "'Special Elite', cursive",
                      background: 'rgba(255, 255, 255, 0.75)',
                      color: '#1A1A1A',
                      border: '1px solid rgba(160, 120, 60, 0.3)',
                      fontSize: uncorkingBottle.font === 'Great Vibes' ? '1.5rem' : '1.15rem'
                    }}
                    className="p-5 rounded-sm whitespace-pre-wrap shadow-inner max-h-80 overflow-y-auto leading-relaxed"
                  >
                    {uncorkingBottle.content}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        const cur = uncorkingBottle;
                        setUncorkingBottle(null);
                        setReportingBottle({
                          _id: cur.senderRef?._id || cur.senderRef || 'anonymous',
                          name: cur.isAnonymous ? `Anonymous Bottle ("${cur.bottleMoniker || 'Ocean Relic'}")` : (cur.senderRef?.name || 'Mariner'),
                          letterId: cur._id
                        });
                      }}
                      className="px-3 py-1.5 bg-red-950 text-red-300 rounded-sm text-xs font-bold shadow hover:bg-red-900 flex items-center gap-1 border border-red-800"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Report Letter
                    </button>

                    <button
                      onClick={handleCloseUncorkedLetter}
                      className="btn-gold-saloon text-xs py-2 px-5 ml-auto"
                    >
                      Roll Up Scroll & Close
                    </button>
                  </div>
                </div>

                {/* Bottom Wooden Rod */}
                <div className="scroll-rod-bottom" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          RECIPIENT REPORT MODAL
         ======================================================== */}
      <AnimatePresence>
        {reportingBottle && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4"
          >
            <div className="bg-[#0B0B0A] p-8 rounded-lg max-w-md w-full relative border-4 border-red-800 shadow-2xl">
              <button 
                onClick={() => setReportingBottle(null)} 
                className="absolute top-2 right-2 text-[#8B5A2B] hover:text-red-700"
              >
                <X className="w-8 h-8" />
              </button>

              <h3 className="text-2xl font-bold text-red-400 mb-2 font-serif flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" /> Report Letter
              </h3>

              <p className="text-[#E4F2EA] font-bold mb-1">
                Target: {reportingBottle.name || 'Anonymous Author'}
              </p>

              <p className="text-xs italic text-[#9DC4B1] mb-4 bg-[#12513A]/50 p-2 rounded border border-[#3FA97A]/40">
                ⚖️ <strong>Tribunal Notice:</strong> Even though this bottle is anonymous to other players, the Guild Masters can still identify the author and act on abuse.
              </p>

              {reportStatus === 'success' ? (
                <div className="p-4 bg-[#12513A] border border-[#3FA97A] text-[#C7EFDA] rounded text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-bold">Report Filed Successfully</p>
                  <p className="text-sm italic">The Guild Tribunal will unmask and review the transgressor.</p>
                </div>
              ) : (
                <>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={4}
                    className="w-full bg-[#141210] text-[#E4F2EA] placeholder:text-[#6E9484] border-2 border-[#3FA97A]/40 p-3 rounded focus:outline-none focus:border-red-500 text-sm font-serif resize-none shadow-inner mb-4"
                    placeholder="Detail the abusive or offensive content here..."
                  />

                  {reportStatus === 'error' && (
                    <p className="text-red-600 font-bold text-sm mb-2">Failed to submit report. Please try again.</p>
                  )}

                  <button
                    onClick={handleReportSubmit}
                    disabled={reportStatus === 'submitting' || !reportReason.trim()}
                    className="w-full bg-red-800 hover:bg-red-900 disabled:bg-gray-400 text-white px-4 py-3 rounded font-bold shadow transition-colors"
                  >
                    {reportStatus === 'submitting' ? 'Submitting to Tribunal...' : 'Submit Report to Tribunal'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          DRIFT LOG WAYPOINTS MODAL
         ======================================================== */}
      <AnimatePresence>
        {viewingDriftLogs && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          >
            <div className="theatrical-card p-6 sm:p-8 max-w-lg w-full relative space-y-6" style={{
              background: 'linear-gradient(160deg, #091C24 0%, #040E12 100%)',
              border: '2px solid #38BDF8'
            }}>
              <button 
                onClick={() => setViewingDriftLogs(null)} 
                className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>

              <div>
                <span className="text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded bg-sky-950 text-sky-300 font-mono border border-sky-600">
                  Nautical Telemetry
                </span>
                <h3 className="text-xl font-bold text-white mt-2 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                  <Navigation className="w-5 h-5 text-sky-400" />
                  Drift Log: {viewingDriftLogs.bottleMoniker || 'Cast Bottle'}
                </h3>
              </div>

              {/* Waypoints Timeline */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(viewingDriftLogs.bottleDrift?.tideLogs || []).map((log: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-sm bg-slate-900/60 border border-sky-900/50 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-sky-300 font-mono text-[11px]">
                      <span className="font-bold uppercase tracking-wider">✦ Stage: {log.stage}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-200 italic font-serif leading-relaxed">
                      {log.text}
                    </p>
                    {log.lat && log.lng && (
                      <p className="text-[10px] text-sky-400/70 font-mono">
                        Coordinates: [{log.lat.toFixed(4)}, {log.lng.toFixed(4)}]
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-right pt-2 border-t border-sky-900/40">
                <button
                  onClick={() => setViewingDriftLogs(null)}
                  className="btn-quantum text-xs py-2 px-6"
                >
                  Close Radar View
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
