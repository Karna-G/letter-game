import { useState, useEffect } from 'react';
import { getMailmenDirectory, getStoredUser } from '../api';
import { Star, Crown, ChevronDown, ChevronUp, Scroll, Award, Users, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import courierDirectoryRosterBg from '../assets/courier_directory_roster_bg.jpg';

const NOTE_STATUS_MOODS: Record<string, { icon: string }> = {
  quill: { icon: '🪶' },
  horse: { icon: '🏇' },
  scroll: { icon: '📜' },
  candle: { icon: '🕯️' },
  compass: { icon: '🧭' },
  tavern: { icon: '☕' },
  weather: { icon: '🌧️' },
  crown: { icon: '👑' },
  seal: { icon: '⚜️' },
};

export default function MailmenDirectory() {
  const [mailmen, setMailmen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    try {
      const user = getStoredUser();
      const viewerId = user ? (user.id || user._id) : undefined;
      const data = await getMailmenDirectory(viewerId);
      setMailmen(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch directory');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="text-center p-12 italic animate-pulse space-y-3" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
        <Scroll className="w-12 h-12 mx-auto animate-bounce opacity-70" />
        <p className="text-lg">Consulting the Imperial Frontier & The Mailman's Registry...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="max-w-5xl mx-auto space-y-8">
      {/* ── Hero Banner with Scenic Oil Painting Backdrop ── */}
      <div className="theatrical-card p-6 sm:p-10 relative overflow-hidden text-center rounded-sm" style={{
        background: `linear-gradient(180deg, rgba(18,16,14,0.78) 0%, rgba(10,9,8,0.94) 100%), url(${courierDirectoryRosterBg}) center/cover no-repeat`,
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold mb-3 animate-float-gentle" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
          <Scroll className="w-3.5 h-3.5" />
          <span>✦ Imperial Courier Registry & Service Records ✦</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
          The Mailman's Registry
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base italic leading-relaxed mt-2" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
          “The official imperial record of certified couriers, active frontier postmasters, and royal deliverers who brave storms and wilderness to convey thy sovereign scrolls.”
        </p>

        <div className="flex flex-wrap justify-center items-center gap-4 mt-5 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Total Certified Deliverers: <strong>{mailmen.length}</strong>
          </span>
        </div>
      </div>

      {error && (
        <p className="p-4 rounded-sm text-sm" style={{ background: '#4A1019', color: '#F5ECD7', border: '1px solid #6B1D2A' }}>
          ⚠ {error}
        </p>
      )}

      {/* ── Courier Cards Grid ── */}
      <div className="grid gap-5">
        {mailmen.map((mailman) => {
          const isExpanded = expandedId === mailman._id;

          return (
            <div
              key={mailman._id}
              className="theatrical-card p-5 sm:p-7 transition-all rounded-sm relative overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)' }} />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer" onClick={() => toggleExpand(mailman._id)}>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 tracking-wide" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span>{mailman.name}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40" style={{ fontFamily: "'Cinzel', serif" }}>
                      {mailman.rank || 'Royal Courier'}
                    </span>
                    <span className="text-xs font-mono text-stone-300 bg-stone-900/80 px-2 py-0.5 rounded border border-stone-700">
                      {mailman.xp || 0} XP
                    </span>
                  </div>
                  {mailman.noteStatus && (
                    <div className="mt-2.5 p-2 rounded-sm text-xs italic font-serif flex items-center gap-2" style={{ background: 'rgba(255,253,249,0.06)', border: '1px solid rgba(212,175,55,0.25)', color: 'var(--parchment-light)' }}>
                      <span className="text-base">{NOTE_STATUS_MOODS[mailman.noteStatusMood || 'quill']?.icon || '🪶'}</span>
                      <span>“{mailman.noteStatus}”</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm shadow-inner" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)' }}>
                      <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span className="font-bold text-xs font-mono" style={{ color: 'var(--parchment-light)' }}>{mailman.reputationScore || 0} Rep</span>
                    </div>
                    <div className="text-[11px] mt-1 font-bold uppercase tracking-wider text-emerald-300/90 font-mono">
                      {mailman.deliveriesCompleted || 0} Deliveries
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="mt-5 pt-5 space-y-5 animate-curtain-reveal" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                  {/* Badges Earned */}
                  {mailman.badges && mailman.badges.length > 0 && (
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-widest mb-2 text-amber-300 flex items-center gap-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                        <Award className="w-3.5 h-3.5" /> Accolades & Insignia Bestowed
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {mailman.badges.map((badge: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1 rounded-sm shadow-md font-serif"
                            style={{ background: 'linear-gradient(135deg, #6B1D2A 0%, #4A1019 100%)', color: 'var(--parchment-light)', border: '1px solid rgba(212,175,55,0.35)', fontFamily: "'Cinzel', serif" }}
                          >
                            ✦ {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Senders & Receivers Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Senders */}
                    <div className="p-4 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <h4 className="font-bold mb-2.5 text-xs uppercase tracking-widest text-amber-300 flex items-center gap-1.5 pb-2" style={{ fontFamily: "'Cinzel', serif", borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                        <Users className="w-3.5 h-3.5" /> Noble Senders Serviced
                      </h4>
                      {mailman.servicedSenders && mailman.servicedSenders.length > 0 ? (
                        <ul className="text-xs space-y-2">
                          {mailman.servicedSenders.map((s: any, idx: number) => (
                            <li key={idx} className="flex justify-between items-center py-0.5">
                              <span className="font-medium text-stone-200">{s.name}</span>
                              <span className="italic text-amber-200/70 font-serif">({s.count} {s.count === 1 ? 'missive' : 'missives'})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic text-stone-400">None on record.</p>
                      )}
                    </div>

                    {/* Receivers */}
                    <div className="p-4 rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <h4 className="font-bold mb-2.5 text-xs uppercase tracking-widest text-amber-300 flex items-center gap-1.5 pb-2" style={{ fontFamily: "'Cinzel', serif", borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                        <Compass className="w-3.5 h-3.5" /> Receivers Reached
                      </h4>
                      {mailman.servicedReceivers && mailman.servicedReceivers.length > 0 ? (
                        <ul className="text-xs space-y-2">
                          {mailman.servicedReceivers.map((r: any, idx: number) => (
                            <li key={idx} className="flex justify-between items-center py-0.5">
                              <span className="font-medium text-stone-200">{r.name}</span>
                              <span className="italic text-amber-200/70 font-serif">({r.count} {r.count === 1 ? 'missive' : 'missives'})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic text-stone-400">None on record.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 flex justify-center pt-2" style={{ borderTop: '1px dashed rgba(212,175,55,0.2)' }}>
                <button
                  onClick={() => toggleExpand(mailman._id)}
                  className="transition-colors flex items-center text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {isExpanded ? (
                    <>Conceal Scroll Dossier <ChevronUp className="ml-1 w-3.5 h-3.5" /></>
                  ) : (
                    <>Inspect Courier Dossier <ChevronDown className="ml-1 w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {mailmen.length === 0 && (
          <div className="theatrical-card p-10 text-center rounded-sm" style={{ background: 'rgba(255,253,249,0.03)', border: '1px dashed rgba(212,175,55,0.3)' }}>
            <p className="italic text-base text-stone-300 font-serif">The Mailman's Registry is currently awaiting certified courier registrations.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
