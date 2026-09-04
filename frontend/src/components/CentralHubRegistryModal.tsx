import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, AlertTriangle, Clock, X, Search, RefreshCw, Lock, Award, FileText, User } from 'lucide-react';
import { getCentralHubProofs } from '../api';

interface CentralHubRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CentralHubRegistryModal: React.FC<CentralHubRegistryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'declined' | 'pending_verification'>('all');

  const fetchProofs = async () => {
    try {
      setLoading(true);
      const data = await getCentralHubProofs();
      setProofs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching central hub proofs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProofs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProofs = proofs.filter((p) => {
    const status = p.deliveryProof?.status || 'none';
    if (filterStatus !== 'all' && status !== filterStatus) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const authCode = (p.deliveryProof?.authenticationCode || '').toLowerCase();
    const sender = (p.senderRef?.name || '').toLowerCase();
    const receiver = (p.receiverRef?.name || '').toLowerCase();
    const mailman = (p.mailmanRef?.name || '').toLowerCase();

    return (
      authCode.includes(term) ||
      sender.includes(term) ||
      receiver.includes(term) ||
      mailman.includes(term)
    );
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border-2 border-[#3FA97A] bg-gradient-to-b from-[#1E130F] via-[#170E0B] to-[#0D0705] shadow-2xl text-[#A8E6C8]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#3FA97A]/30 p-5 bg-[#2B1B17]/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#3FA97A]/20 border border-[#3FA97A]/40 text-[#4FD1A0]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-wide text-[#4FD1A0]">
                  Central Postal Hub Proofs Registry
                </h3>
                <p className="text-xs text-[#A8E6C8]/70 italic">
                  Cryptographic Delivery Authentication & Postman Infraction Audit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchProofs}
                disabled={loading}
                className="p-2 bg-[#3FA97A]/10 hover:bg-[#3FA97A]/20 text-[#4FD1A0] rounded-lg transition-colors"
                title="Refresh Proofs"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-[#A8E6C8]/60 hover:text-[#4FD1A0] hover:bg-[#3FA97A]/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-[#3FA97A]/20 flex flex-wrap items-center justify-between gap-3 bg-[#140C0A]">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3FA97A]/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Auth Hash, Scribe, Recipient, or Postman..."
                className="w-full bg-[#1F1410] border border-[#3FA97A]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-amber-100 placeholder:text-[#A8E6C8]/40 focus:outline-none focus:border-[#3FA97A]"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#1F1410] p-1 rounded-xl border border-[#3FA97A]/30 text-xs">
              {(['all', 'verified', 'declined', 'pending_verification'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    filterStatus === st
                      ? 'bg-[#3FA97A] text-[#2B1B17] font-bold shadow'
                      : 'text-[#A8E6C8]/70 hover:text-[#4FD1A0]'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Proofs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="text-center py-16 text-[#3FA97A]/70 space-y-2">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
                <p className="text-sm italic">Consulting Imperial Ledgers...</p>
              </div>
            ) : filteredProofs.length === 0 ? (
              <div className="text-center py-16 text-[#A8E6C8]/50 space-y-2">
                <Shield className="w-12 h-12 mx-auto text-[#3FA97A]/30" />
                <p className="text-sm">No delivery proof records matching criteria found.</p>
              </div>
            ) : (
              filteredProofs.map((item) => {
                const dp = item.deliveryProof || {};
                const isVerified = dp.status === 'verified';
                const isDeclined = dp.status === 'declined';

                return (
                  <div
                    key={item._id}
                    className={`rounded-xl border p-4 transition-all ${
                      isVerified
                        ? 'bg-[#152419]/50 border-emerald-500/40 hover:border-emerald-400'
                        : isDeclined
                        ? 'bg-[#2E1210]/50 border-red-500/40 hover:border-red-400'
                        : 'bg-[#221612]/50 border-amber-500/40 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        {isVerified ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated & Delivered
                          </span>
                        ) : isDeclined ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-950/80 px-2.5 py-1 rounded-full border border-red-500/40">
                            <AlertTriangle className="w-3.5 h-3.5" /> Declined / Penalty Enforced (-15 XP)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40">
                            <Clock className="w-3.5 h-3.5" /> Pending Recipient Verification
                          </span>
                        )}
                        <span className="text-xs text-[#A8E6C8]/60 font-mono">
                          Epistle #{item._id.slice(-6)}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-[#3FA97A] flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {dp.authenticationCode || 'HUB-AUTH-GEN'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[#A8E6C8]/50 block">Origin Scribe:</span>
                        <span className="font-semibold text-amber-100 flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3 text-[#3FA97A]" /> {item.senderRef?.name || 'Noble Scribe'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#A8E6C8]/50 block">Intended Recipient:</span>
                        <span className="font-semibold text-amber-100 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-[#3FA97A]" /> {item.receiverRef?.name || 'Unknown Recipient'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#A8E6C8]/50 block">Postman of Record:</span>
                        <span className="font-semibold text-amber-100 flex items-center gap-1 mt-0.5">
                          <Award className="w-3 h-3 text-[#3FA97A]" /> {item.mailmanRef?.name || 'Royal Postman'}
                        </span>
                      </div>
                    </div>

                    {isDeclined && dp.declinedReason && (
                      <div className="mt-3 p-2.5 rounded bg-red-950/60 border border-red-500/30 text-xs text-red-200">
                        <strong className="text-red-400 font-semibold">Infraction Reason: </strong>
                        {dp.declinedReason}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default CentralHubRegistryModal;
