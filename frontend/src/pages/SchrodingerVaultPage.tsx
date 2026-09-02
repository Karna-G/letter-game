import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Atom, Send, ArrowLeft, RefreshCw, BookOpen, 
  Box, Eye, CheckCircle, X, Shuffle, Trash2, Sparkles, Wand2
} from 'lucide-react';
import { 
  generateSchrodingerVariants, summonSchrodingerLetter, 
  collapseSchrodingerLetter, getMyMailbox, getMyLetters, sendLetter,
  mutateLetterMood, removeLetterToTrash
} from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';

const AVAILABLE_MOODS = [
  { id: 'angry', label: 'Fiery & Indignant', modernLabel: 'Direct & Furious', icon: '⚡', color: '#EF4444' },
  { id: 'happy', label: 'Exultant & Merry', modernLabel: 'Warm & Celebrating', icon: '☀️', color: '#F59E0B' },
  { id: 'grief', label: 'Elegiac & Sorrowful', modernLabel: 'Vulnerable & Heartbroken', icon: '🌧️', color: '#3B82F6' },
  { id: 'disappointed', label: 'Cold & Disillusioned', modernLabel: 'Cold & Disillusioned', icon: '❄️', color: '#06B6D4' },
  { id: 'mystical', label: 'Quantum Paradox', modernLabel: 'Sci-Fi Quantum Paradox', icon: '🌌', color: '#A855F7' },
  { id: 'romantic', label: 'Devoted & Poetic', modernLabel: 'Intimate & Devoted', icon: '🌹', color: '#EC4899' },
];

export default function SchrodingerVaultPage({ user }: { user: any }) {
  // Tone state
  const [tone, setTone] = useState<'classical' | 'modern'>('classical');

  // Scriptorium superposition state
  const [baseContent, setBaseContent] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<string[]>(['angry', 'happy', 'grief']);
  const [variants, setVariants] = useState<any[]>([]);
  const [activeVariantTab, setActiveVariantTab] = useState(0);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Quantum collapse simulation modal
  const [collapsingLetter, setCollapsingLetter] = useState<any>(null);
  const [collapseStep, setCollapseStep] = useState<'superposition' | 'collapsing' | 'collapsed'>('superposition');
  const [collapsedResult, setCollapsedResult] = useState<any>(null);

  // Quantum Mood Mutator State
  const [allUserLetters, setAllUserLetters] = useState<any[]>([]);
  const [mutatorSourceLetterId, setMutatorSourceLetterId] = useState<string>('');
  const [mutatorCustomText, setMutatorCustomText] = useState<string>('');
  const [mutatorTargetMood, setMutatorTargetMood] = useState<string>('happy');
  const [mutating, setMutating] = useState(false);
  const [mutatedOutput, setMutatedOutput] = useState<any>(null);

  // History state
  const [quantumLetters, setQuantumLetters] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [openLetter, setOpenLetter] = useState<any>(null);

  useEffect(() => {
    fetchQuantumLetters();
  }, [user]);

  const fetchQuantumLetters = async () => {
    setLoadingHistory(true);
    try {
      const [inbox, outbox] = await Promise.all([
        getMyMailbox().catch(() => []),
        getMyLetters().catch(() => [])
      ]);
      const all = [...(Array.isArray(inbox) ? inbox : []), ...(Array.isArray(outbox) ? outbox : [])];
      setAllUserLetters(all);

      const uniqueMap = new Map();
      all.forEach(l => {
        if (l && l.type === 'schrodinger' && !uniqueMap.has(l._id)) {
          uniqueMap.set(l._id, l);
        }
      });
      setQuantumLetters(Array.from(uniqueMap.values()));
    } catch (e) {
      console.error('Failed to load quantum letters:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleMoodSelection = (moodId: string) => {
    if (selectedMoods.includes(moodId)) {
      if (selectedMoods.length <= 2) {
        alert('A quantum superposition requires at least 2 alternate timelines!');
        return;
      }
      setSelectedMoods(selectedMoods.filter(m => m !== moodId));
    } else {
      if (selectedMoods.length >= 3) {
        alert('A quantum box holds a maximum of 3 concurrent probability states.');
        return;
      }
      setSelectedMoods([...selectedMoods, moodId]);
    }
  };

  const handleGenerateRealities = async () => {
    if (!baseContent.trim()) {
      alert('Pray tell, write a base thought or premise first.');
      return;
    }
    setGeneratingVariants(true);
    try {
      const res = await generateSchrodingerVariants(baseContent, selectedMoods, tone);
      if (res && Array.isArray(res.variants)) {
        setVariants(res.variants);
        setActiveVariantTab(0);
        setActionMsg(`⚛️ 3 Parallel reality states successfully synthesized in ${tone === 'modern' ? 'Modern' : 'Classical'} tone!`);
        setTimeout(() => setActionMsg(null), 4000);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to synthesize quantum variants');
    } finally {
      setGeneratingVariants(false);
    }
  };

  const handleDispatchQuantumBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (variants.length < 2) {
      alert('Pray generate or define at least 2 quantum timeline states before sealing the box.');
      return;
    }

    setDispatching(true);
    try {
      const superposedContent = `⚛️ [SCHRÖDINGER'S SUPERPOSITION BOX]\n\nThis missive currently exists in ${variants.length} simultaneous quantum states:\n` +
        variants.map((v, i) => ` • State ${i + 1} (${v.label}): ${v.content.slice(0, 80)}...`).join('\n') +
        `\n\nUpon unsealing, the probability wave will collapse permanently into a single timeline!`;

      await sendLetter({
        senderRef: user.id || user._id,
        receiverRef: recipient.trim() || undefined,
        content: superposedContent,
        type: 'schrodinger',
        schrodingerVariants: variants,
        status: 'pending',
        font: tone === 'modern' ? 'Courier Prime' : 'Cinzel'
      });

      setActionMsg('⚛️ Schrödinger’s Quantum Paradox Box has been sealed and dispatched into superposition!');
      setBaseContent('');
      setVariants([]);
      setRecipient('');
      await fetchQuantumLetters();
      setTimeout(() => setActionMsg(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Failed to dispatch Schrödinger Box');
    } finally {
      setDispatching(false);
    }
  };

  const handleSummonTestBox = async () => {
    setDispatching(true);
    try {
      await summonSchrodingerLetter({
        userId: user.id || user._id,
        content: baseContent || undefined,
        moods: selectedMoods,
        tone
      });
      setActionMsg(`⚛️ A Quantum Superposition Box (${tone === 'modern' ? 'Modern' : 'Classical'}) hath manifested in thy Mailbox!`);
      await fetchQuantumLetters();
      setTimeout(() => setActionMsg(null), 4500);
    } catch (e: any) {
      alert(e.message || 'Failed to summon Quantum Box');
    } finally {
      setDispatching(false);
    }
  };

  // Feature: Mutate Letter Mood
  const handleMutateMood = async () => {
    let sourceContent = mutatorCustomText;
    if (mutatorSourceLetterId && !sourceContent) {
      const found = allUserLetters.find(l => l._id === mutatorSourceLetterId);
      if (found) sourceContent = found.content;
    }

    if (!sourceContent.trim()) {
      alert('Pray select an existing letter or inscribe custom text to mutate.');
      return;
    }

    setMutating(true);
    try {
      const res = await mutateLetterMood({
        letterId: mutatorSourceLetterId || undefined,
        content: sourceContent,
        targetMood: mutatorTargetMood,
        tone
      });
      setMutatedOutput(res);
      setActionMsg(`⚛️ Reality Shift Complete! Letter mutated to ${res.label} (${res.probabilityShift} probability resonance).`);
      setTimeout(() => setActionMsg(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Failed to mutate letter mood');
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteQuantumLetter = async (letterId: string) => {
    if (!window.confirm("Move this quantum paradox missive to thy Guild Wastebin?")) return;
    try {
      await removeLetterToTrash(letterId);
      setActionMsg("Quantum missive removed to Wastebin.");
      setTimeout(() => setActionMsg(null), 3500);
      await fetchQuantumLetters();
    } catch (e: any) {
      alert(e.message || "Failed to remove quantum missive");
    }
  };

  const handleTriggerCollapse = async (letter: any) => {
    setCollapsingLetter(letter);
    setCollapseStep('superposition');
    setCollapsedResult(null);
    waxSealAudio.playQuantumHum();
  };

  const executeWavefunctionCollapse = async () => {
    if (!collapsingLetter) return;
    setCollapseStep('collapsing');
    waxSealAudio.playQuantumHum();

    try {
      const res = await collapseSchrodingerLetter(collapsingLetter._id);
      setTimeout(() => {
        setCollapsedResult(res);
        setCollapseStep('collapsed');
        waxSealAudio.playWavefunctionCollapse();
        fetchQuantumLetters();
      }, 1600);
    } catch (e: any) {
      alert(e.message || 'Failed to collapse quantum wavefunction');
      setCollapseStep('superposition');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }} 
      className="max-w-5xl mx-auto space-y-8 pb-12"
    >
      {/* Back Navigation Bar & Tone Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <Link to="/" className="btn-gold-saloon text-xs py-2 px-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Thy Scriptorium
        </Link>
        
        {/* Language Tone Switcher */}
        <div className="inline-flex items-center p-1 rounded-sm shadow-md" style={{ background: 'rgba(9,19,31,0.9)', border: '1px solid rgba(56,189,248,0.4)' }}>
          <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 text-sky-300" style={{ fontFamily: "'Cinzel', serif" }}>
            Language Tone:
          </span>
          <button
            onClick={() => setTone('classical')}
            className={`px-3 py-1 text-xs font-bold rounded-sm transition-all ${tone === 'classical' ? 'bg-sky-600 text-white shadow-md' : 'text-sky-300 hover:text-white'}`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            🏛️ Classical / 18th-C
          </button>
          <button
            onClick={() => setTone('modern')}
            className={`px-3 py-1 text-xs font-bold rounded-sm transition-all ${tone === 'modern' ? 'bg-sky-600 text-white shadow-md' : 'text-sky-300 hover:text-white'}`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            📱 Modern / Normal
          </button>
        </div>

        <Link to="/dybbuk" className="btn-astral text-xs py-2 px-4 flex items-center gap-2">
          <span>🔮 Visit Dybbuk Astral Chamber</span> →
        </Link>
      </div>

      {/* Hero Banner: Schrödinger's Quantum Vault */}
      <div className="quantum-card p-8 sm:p-12 relative overflow-hidden text-center rounded-sm">
        {/* Animated Quantum Orbits & Grid */}
        <div className="absolute inset-0 bg-radial from-sky-950/40 via-transparent to-black pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold animate-quantum-wave" style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', color: '#38BDF8', fontFamily: "'Cinzel', serif" }}>
            <Atom className="w-4 h-4 text-sky-400 animate-spin" />
            <span>Quantum Probability & Reality Superposition</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            Schrödinger's Letter Vault
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base italic leading-relaxed" style={{ color: '#BAE6FD' }}>
            {tone === 'modern'
              ? 'Inscribe letters that exist simultaneously across 2 to 3 alternate emotional dimensions. The true message collapses permanently only when the recipient opens the box.'
              : 'Inscribe a missive that exists simultaneously in 2 to 3 alternate emotional realities. The true timeline remains unwritten until the recipient breaks the quantum seal, collapsing the probability wave into history.'}
          </p>

          {/* 3D Isometric Quantum Paradox Box with Orbitals */}
          <div className="py-4">
            <div className="quantum-3d-scene mx-auto">
              <div className="quantum-3d-cube">
                <div className="quantum-cube-face cube-front">
                  <Atom className="w-8 h-8 text-sky-200 animate-spin" />
                  <span className="text-[9px] font-mono text-sky-100 font-bold mt-1">STATE ψ₁</span>
                </div>
                <div className="quantum-cube-face cube-back">
                  <Box className="w-8 h-8 text-sky-300" />
                  <span className="text-[9px] font-mono text-sky-100 font-bold mt-1">STATE ψ₂</span>
                </div>
                <div className="quantum-cube-face cube-right">
                  <Sparkles className="w-8 h-8 text-cyan-200" />
                  <span className="text-[9px] font-mono text-sky-100 font-bold mt-1">STATE ψ₃</span>
                </div>
                <div className="quantum-cube-face cube-left">
                  <Atom className="w-8 h-8 text-sky-200" />
                  <span className="text-[9px] font-mono text-sky-100 font-bold mt-1">MATRIX</span>
                </div>
                <div className="quantum-cube-face cube-top">
                  <span className="text-[11px] font-bold text-sky-200 font-mono">⚛️ SCHRÖDINGER</span>
                </div>
                <div className="quantum-cube-face cube-bottom">
                  <span className="text-[10px] font-bold text-sky-300 font-mono">QUANTUM FLUX</span>
                </div>
              </div>

              {/* 3D Atomic Electron Probability Rings */}
              <div className="quantum-orbital-ring quantum-orbit-1" />
              <div className="quantum-orbital-ring quantum-orbit-2" />
              <div className="quantum-orbital-ring quantum-orbit-3" />
            </div>
          </div>

          {/* Action Message Alert */}
          {actionMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="p-3.5 max-w-xl mx-auto rounded-sm text-sm font-bold flex items-center justify-center gap-2 shadow-lg" 
              style={{ background: 'rgba(2,132,199,0.25)', border: '1px solid #38BDF8', color: '#F0F9FF' }}
            >
              <Atom className="w-4 h-4 text-sky-300 animate-spin" /> {actionMsg}
            </motion.div>
          )}

          {/* Quick Vault Action Buttons */}
          <div className="pt-3 flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={handleSummonTestBox}
              disabled={dispatching}
              className="btn-quantum text-xs sm:text-sm py-3 px-6 flex items-center gap-2"
            >
              <Box className="w-4 h-4 text-sky-200" />
              <span>Manifest Test Superposition Box ({tone === 'modern' ? 'Modern' : 'Classical'})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scriptorium: Inscribe Quantum Superposition Missive */}
      <div className="quantum-card p-6 sm:p-10 rounded-sm space-y-6">
        <div className="pb-4" style={{ borderBottom: '1px solid rgba(56,189,248,0.3)' }}>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-sm text-[11px] uppercase tracking-wider font-bold mb-2" style={{ background: '#0369A1', color: '#F0F9FF', fontFamily: "'Cinzel', serif" }}>
            <span>⚛️ Superposition Scriptorium</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            Forge Parallel Timelines
          </h2>
          <p className="text-xs sm:text-sm italic mt-1" style={{ color: '#BAE6FD' }}>
            Choose 2 or 3 contrasting dimensional moods, enter thy base premise, and synthesize parallel universe versions.
          </p>
        </div>

        <form onSubmit={handleDispatchQuantumBox} className="space-y-6">
          {/* Mood Selection Matrix */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold mb-2" style={{ color: '#E0F2FE', fontFamily: "'Cinzel', serif" }}>
              Select 2 to 3 Alternate Timeline Moods:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_MOODS.map(m => {
                const isSelected = selectedMoods.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMoodSelection(m.id)}
                    className="p-3 rounded-sm text-left flex items-center gap-2.5 transition-all text-xs sm:text-sm font-semibold"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      background: isSelected ? 'linear-gradient(135deg, rgba(2,132,199,0.4) 0%, rgba(67,56,202,0.4) 100%)' : 'rgba(255,253,249,0.04)',
                      border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(56,189,248,0.2)',
                      color: isSelected ? '#FFF' : '#94A3B8',
                      boxShadow: isSelected ? '0 0 15px rgba(56,189,248,0.25)' : 'none'
                    }}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span>{tone === 'modern' ? m.modernLabel : m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Base Premise Input */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold mb-1" style={{ color: '#E0F2FE', fontFamily: "'Cinzel', serif" }}>
              Base Premise / Thought:
            </label>
            <textarea
              rows={3}
              value={baseContent}
              onChange={(e) => setBaseContent(e.target.value)}
              placeholder="e.g. We met at the crossroads near the clocktower to discuss our long-delayed partnership..."
              className="w-full p-3.5 rounded-sm text-base font-serif italic focus:outline-none shadow-inner"
              style={{
                background: '#FFFDF9',
                color: '#1A1A1A',
                border: '1px solid rgba(56,189,248,0.4)'
              }}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleGenerateRealities}
                disabled={generatingVariants}
                className="btn-quantum text-xs py-2 px-5 flex items-center gap-2"
              >
                <Shuffle className={`w-3.5 h-3.5 ${generatingVariants ? 'animate-spin' : ''}`} />
                <span>{generatingVariants ? 'Computing Wavefunctions...' : `✦ Synthesize Parallel Realities (${tone === 'modern' ? 'Modern' : 'Classical'})`}</span>
              </button>
            </div>
          </div>

          {/* Superposed Realities Preview Tabs */}
          {variants.length > 0 && (
            <div className="p-5 rounded-sm space-y-4" style={{ background: 'rgba(2,132,199,0.08)', border: '1px solid rgba(56,189,248,0.3)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-sky-400 animate-quantum-wave" />
                  <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#BAE6FD', fontFamily: "'Cinzel', serif" }}>
                    Quantum Box Superposition Preview ({variants.length} States)
                  </span>
                </div>
              </div>

              {/* Variant Tabs */}
              <div className="flex gap-2 border-b border-sky-800/50">
                {variants.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveVariantTab(idx)}
                    className="px-4 py-2 text-xs sm:text-sm font-bold rounded-t-sm transition-all"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      background: activeVariantTab === idx ? '#0284C7' : 'transparent',
                      color: activeVariantTab === idx ? '#FFF' : '#94A3B8',
                      border: activeVariantTab === idx ? '1px solid #38BDF8' : 'none',
                      borderBottom: 'none'
                    }}
                  >
                    State {idx + 1}: {v.label}
                  </button>
                ))}
              </div>

              {/* Editable Active Variant Content */}
              <div>
                <textarea
                  rows={6}
                  value={variants[activeVariantTab]?.content || ''}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[activeVariantTab].content = e.target.value;
                    setVariants(updated);
                  }}
                  className="w-full p-4 rounded-sm text-base font-serif leading-relaxed focus:outline-none shadow-inner"
                  style={{
                    background: '#FFFDF9',
                    color: '#1A1A1A',
                    border: '1px solid rgba(56,189,248,0.4)',
                    fontFamily: tone === 'modern' ? "'Courier Prime', monospace" : "'Cinzel', serif"
                  }}
                />
              </div>

              {/* Recipient & Dispatch Section */}
              <div className="pt-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Recipient Name / Email (or leave empty for Open Quest)..."
                  className="p-3 rounded-sm text-sm font-serif flex-1 focus:outline-none"
                  style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid rgba(56,189,248,0.4)' }}
                />
                <button
                  type="submit"
                  disabled={dispatching}
                  className="btn-quantum text-xs py-3 px-6 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>{dispatching ? 'Sealing Superposition...' : 'Seal & Dispatch Quantum Box'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Feature 26+: Quantum Mood Mutator & Multiverse Shift */}
      <div className="quantum-card p-6 sm:p-10 rounded-sm space-y-6">
        <div className="pb-4" style={{ borderBottom: '1px solid rgba(56,189,248,0.3)' }}>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-sm text-[11px] uppercase tracking-wider font-bold mb-2" style={{ background: '#4F46E5', color: '#EEF2FF', fontFamily: "'Cinzel', serif" }}>
            <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Quantum Mood Mutator & Multiverse Shift</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
            Probabilistic Mood Transmutation
          </h2>
          <p className="text-xs sm:text-sm italic mt-1" style={{ color: '#BAE6FD' }}>
            Select an existing letter from thy chronicle or paste custom text, select a target timeline mood, and let the quantum engine probabilistically shift its reality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Selection & Custom Text */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-1" style={{ color: '#E0F2FE', fontFamily: "'Cinzel', serif" }}>
                1. Select Source Missive from thy Chronicle:
              </label>
              <select
                value={mutatorSourceLetterId}
                onChange={(e) => {
                  setMutatorSourceLetterId(e.target.value);
                  const found = allUserLetters.find(l => l._id === e.target.value);
                  if (found) setMutatorCustomText(found.content);
                }}
                className="w-full p-3 rounded-sm text-sm font-serif focus:outline-none"
                style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid rgba(56,189,248,0.4)' }}
              >
                <option value="">-- Or compose / paste custom text below --</option>
                {allUserLetters.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.senderRef?.name ? `From: ${l.senderRef.name}` : `To: ${l.receiverRef?.name || 'Courier'}`} • {l.content?.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-1" style={{ color: '#E0F2FE', fontFamily: "'Cinzel', serif" }}>
                Original Letter Text:
              </label>
              <textarea
                rows={4}
                value={mutatorCustomText}
                onChange={(e) => setMutatorCustomText(e.target.value)}
                placeholder="Enter or modify the source letter text to be mutated..."
                className="w-full p-3.5 rounded-sm text-sm font-serif focus:outline-none shadow-inner"
                style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid rgba(56,189,248,0.4)' }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-2" style={{ color: '#E0F2FE', fontFamily: "'Cinzel', serif" }}>
                2. Select Target Quantum Mood Eigenstate:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_MOODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMutatorTargetMood(m.id)}
                    className="p-2.5 rounded-sm text-left flex items-center gap-2 text-xs font-semibold transition-all"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      background: mutatorTargetMood === m.id ? 'linear-gradient(135deg, #4338CA 0%, #312E81 100%)' : 'rgba(255,253,249,0.04)',
                      border: mutatorTargetMood === m.id ? '1px solid #818CF8' : '1px solid rgba(56,189,248,0.2)',
                      color: mutatorTargetMood === m.id ? '#FFF' : '#94A3B8'
                    }}
                  >
                    <span>{m.icon}</span>
                    <span className="truncate">{tone === 'modern' ? m.modernLabel : m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleMutateMood}
              disabled={mutating}
              className="w-full btn-quantum text-xs py-3 px-6 flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className={`w-4 h-4 ${mutating ? 'animate-spin' : ''}`} />
              <span>{mutating ? 'Calculating Multiverse Shift...' : `✦ Shift Quantum Timeline (${tone === 'modern' ? 'Modern' : 'Classical'})`}</span>
            </button>
          </div>

          {/* Mutated Reality Output */}
          <div className="flex flex-col justify-between p-5 rounded-sm" style={{ background: 'rgba(9,19,31,0.85)', border: '1px solid rgba(56,189,248,0.3)' }}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-sky-800/40">
                <div className="flex items-center gap-2">
                  <Atom className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-xs uppercase tracking-wider font-bold" style={{ color: '#C7D2FE', fontFamily: "'Cinzel', serif" }}>
                    Mutated Timeline Reality
                  </span>
                </div>
                {mutatedOutput && (
                  <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded-sm bg-indigo-900/60 text-indigo-200 border border-indigo-500/40">
                    Resonance: {mutatedOutput.probabilityShift}
                  </span>
                )}
              </div>

              {mutatedOutput ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{mutatedOutput.icon}</span>
                    <span className="font-bold text-sm" style={{ color: '#E0E7FF', fontFamily: "'Cinzel', serif" }}>
                      {mutatedOutput.label}
                    </span>
                  </div>
                  <div 
                    className="p-4 rounded-sm whitespace-pre-wrap text-sm font-serif max-h-72 overflow-y-auto leading-relaxed shadow-inner"
                    style={{
                      background: '#FFFDF9',
                      color: '#1A1A1A',
                      border: '1px solid rgba(99,102,241,0.4)',
                      fontFamily: tone === 'modern' ? "'Courier Prime', monospace" : "'Cinzel', serif"
                    }}
                  >
                    {mutatedOutput.mutatedContent}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-sky-400/60 italic font-serif">
                  <Box className="w-12 h-12 mx-auto mb-2 opacity-30 text-sky-300" />
                  <p>Awaiting quantum transmutation...</p>
                </div>
              )}
            </div>

            {mutatedOutput && (
              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mutatedOutput.mutatedContent);
                    setActionMsg("⚛️ Mutated timeline copied to clipboard!");
                    setTimeout(() => setActionMsg(null), 3500);
                  }}
                  className="btn-gold-saloon text-xs py-2 px-4 flex-1"
                >
                  Copy Reality
                </button>
                <button
                  onClick={() => {
                    setBaseContent(mutatedOutput.mutatedContent);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="btn-quantum text-xs py-2 px-4 flex-1"
                >
                  Load into Scriptorium
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quantum Paradox Chronicles List (Registry) */}
      <div className="quantum-card p-6 sm:p-10 rounded-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 gap-2" style={{ borderBottom: '1px solid rgba(56,189,248,0.3)' }}>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
              <Atom className="w-6 h-6 text-sky-400 animate-spin" />
              Quantum Superposition Registry ({quantumLetters.length})
            </h2>
            <p className="text-xs sm:text-sm italic" style={{ color: '#BAE6FD' }}>
              Letters currently in probability superposition or locked into committed timelines.
            </p>
          </div>
          <button
            onClick={fetchQuantumLetters}
            className="btn-quantum-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Registry
          </button>
        </div>

        {loadingHistory ? (
          <div className="py-12 text-center text-sky-300 italic">
            <Atom className="w-8 h-8 mx-auto animate-spin mb-2" />
            <p className="font-serif">Observing quantum ledger...</p>
          </div>
        ) : quantumLetters.length === 0 ? (
          <div className="py-12 text-center rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(56,189,248,0.3)', color: '#BAE6FD' }}>
            <Box className="w-12 h-12 mx-auto mb-2 opacity-50 text-sky-400" />
            <p className="font-bold text-base" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>No quantum paradox missives found.</p>
            <p className="text-xs sm:text-sm mt-1 italic font-serif">Inscribe a letter above or click "Manifest Test Superposition Box" to begin experimenting with quantum observation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quantumLetters.map((l, i) => {
              const isSuperposition = l.schrodingerState === 'superposition';
              const variantCount = l.schrodingerVariants?.length || 3;

              return (
                <div 
                  key={l._id || i}
                  className="p-5 rounded-sm transition-all flex flex-col justify-between"
                  style={{
                    background: isSuperposition 
                      ? 'linear-gradient(145deg, rgba(9,19,31,0.95) 0%, rgba(6,11,18,0.98) 100%)' 
                      : 'linear-gradient(145deg, #1C1915 0%, #12100E 100%)',
                    border: isSuperposition ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(212,175,55,0.35)',
                    boxShadow: isSuperposition ? '0 0 20px rgba(56,189,248,0.2)' : '0 4px 15px rgba(0,0,0,0.5)'
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(56,189,248,0.2)' }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm" style={{
                            background: isSuperposition ? '#0284C7' : '#047857',
                            color: '#FFF',
                            fontFamily: "'Cinzel', serif"
                          }}>
                            {isSuperposition ? `⚛️ SUPERPOSITION (${variantCount} STATES)` : `✦ COLLAPSED: ${l.collapsedVariant?.label || 'COMMITTED'}`}
                          </span>
                        </div>
                        <h4 className="font-bold text-base sm:text-lg mt-1" style={{ color: '#F0F9FF', fontFamily: "'Cinzel', serif" }}>
                          To: {l.receiverRef?.name || l.receiverRef || 'Open Courier Quest'}
                        </h4>
                        <p className="text-[11px] italic" style={{ color: '#94A3B8' }}>
                          Dispatched by: {l.senderRef?.name || 'Thy Hand'} • {new Date(l.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Delete Option for Quantum Registry */}
                      <button
                        onClick={() => handleDeleteQuantumLetter(l._id)}
                        className="p-1.5 text-stone-400 hover:text-amber-500 transition-colors rounded-sm hover:bg-stone-800/50"
                        title="Remove to Wastebin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p 
                      className="text-sm font-serif line-clamp-3 p-3 rounded-sm mb-3 shadow-inner leading-relaxed"
                      style={{
                        background: '#FFFDF9',
                        color: '#1A1A1A',
                        border: '1px solid rgba(56,189,248,0.25)',
                        fontFamily: l.font || "'Cinzel', serif"
                      }}
                    >
                      {l.content}
                    </p>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(56,189,248,0.2)' }}>
                    <button
                      onClick={() => handleDeleteQuantumLetter(l._id)}
                      className="text-xs text-amber-500/80 hover:text-amber-400 font-bold flex items-center gap-1"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>

                    {isSuperposition ? (
                      <button
                        onClick={() => handleTriggerCollapse(l)}
                        className="btn-quantum text-xs py-1.5 px-4 flex items-center gap-1.5 animate-quantum-wave"
                      >
                        <Eye className="w-3.5 h-3.5" /> Observe & Collapse Wave
                      </button>
                    ) : (
                      <button
                        onClick={() => setOpenLetter(l)}
                        className="btn-gold-saloon text-xs py-1.5 px-3.5 flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Read Collapsed Inscription
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Wavefunction Collapse Modal */}
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
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-sky-950 border-2 border-sky-400 animate-quantum-wave">
                    <Atom className="w-10 h-10 text-sky-400 animate-spin" />
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded-sm" style={{ background: '#0284C7', color: '#FFF', fontFamily: "'Cinzel', serif" }}>
                      ⚛️ Superposition Observation
                    </span>
                    <h3 className="text-2xl font-bold mt-2" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                      Break Quantum Seal
                    </h3>
                    <p className="text-xs sm:text-sm italic mt-1" style={{ color: '#BAE6FD' }}>
                      This letter currently holds {collapsingLetter.schrodingerVariants?.length || 3} simultaneous timeline realities. Breaking the seal forces the quantum wave to collapse into a single permanent outcome!
                    </p>
                  </div>

                  <div className="p-4 rounded-sm text-left space-y-2" style={{ background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <p className="text-xs uppercase tracking-wider font-bold text-sky-300" style={{ fontFamily: "'Cinzel', serif" }}>
                      Superposed Vector States:
                    </p>
                    {(collapsingLetter.schrodingerVariants || []).map((v: any, idx: number) => (
                      <div key={idx} className="text-xs flex items-center gap-2 text-sky-200">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                        <span className="font-bold">State {idx + 1}:</span>
                        <span>{v.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={executeWavefunctionCollapse}
                      className="btn-quantum text-sm py-3 px-8 w-full flex items-center justify-center gap-2 shadow-xl"
                    >
                      <Eye className="w-4 h-4" />
                      <span>✦ Break Seal & Observe (Collapse Reality)</span>
                    </button>
                  </div>
                </div>
              )}

              {collapseStep === 'collapsing' && (
                <div className="py-12 space-y-6 animate-collapse-flash">
                  <Atom className="w-20 h-20 mx-auto text-sky-400 animate-spin" />
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#F0F9FF' }}>
                    Collapsing Wavefunction...
                  </h3>
                  <p className="text-xs sm:text-sm italic font-mono text-sky-300">
                    Evaluating quantum eigenvalues across multiverse vectors...
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
                      Commit to Memory & Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Modal with Parchment Scroll Unfurling */}
      <AnimatePresence>
        {openLetter && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          >
            <div className="max-w-lg w-full relative animate-scroll-unroll">
              {/* Top Wooden Rod */}
              <div className="scroll-rod-top" />

              <div className="parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl">
                <button 
                  onClick={() => setOpenLetter(null)} 
                  className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-2 mb-1">
                  <Atom className="w-5 h-5 text-sky-700 animate-spin" />
                  <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#0C4A6E' }}>
                    {openLetter.collapsedVariant ? `Timeline: ${openLetter.collapsedVariant.label}` : 'Quantum Paradox Missive'}
                  </h3>
                </div>
                <p className="text-xs italic mb-4" style={{ color: '#0284C7' }}>
                  Dispatched by {openLetter.senderRef?.name || 'Scribe'} • Observed on {new Date(openLetter.collapsedAt || openLetter.updatedAt).toLocaleString()}
                </p>

                <div 
                  className="p-4 rounded-sm whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto leading-relaxed border"
                  style={{
                    fontFamily: openLetter.font || "'Cinzel', serif",
                    background: 'rgba(255, 255, 255, 0.7)',
                    color: '#1A1A1A',
                    borderColor: 'rgba(56,189,248,0.3)',
                    fontSize: '1.15rem'
                  }}
                >
                  {openLetter.content}
                </div>

                <div className="mt-5 text-right">
                  <button
                    onClick={() => setOpenLetter(null)}
                    className="btn-quantum text-xs py-2 px-5"
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
