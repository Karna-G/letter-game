import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, AlertTriangle, X, Award, FileText, UserCheck, Lock } from 'lucide-react';
import { authenticateDeliveryProof } from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';

export interface DeliveryProofRequestData {
  letterId: string;
  authenticationCode: string;
  receiverId?: string;
  receiverName?: string;
  senderName?: string;
  mailmanId?: string;
  mailmanName?: string;
  submittedAt?: string | Date;
}

interface DeliveryProofModalProps {
  isOpen: boolean;
  data: DeliveryProofRequestData | null;
  currentUser: { _id?: string; id?: string; name: string; role: string } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeliveryProofModal: React.FC<DeliveryProofModalProps> = ({
  isOpen,
  data,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);
  const [resultStatus, setResultStatus] = useState<'idle' | 'accepted' | 'declined'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !data) return null;

  const handleAccept = async () => {
    if (!currentUser) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      waxSealAudio.playWaxStampThud();

      const myId = String(currentUser.id || currentUser._id || '');
      await authenticateDeliveryProof(data.letterId, {
        userId: myId,
        action: 'accept',
      });

      setResultStatus('accepted');
      waxSealAudio.playCourierProximityChime();
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setResultStatus('idle');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not authenticate delivery with Central Hub');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!currentUser) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      waxSealAudio.playPaperTear();

      const myId = String(currentUser.id || currentUser._id || '');
      await authenticateDeliveryProof(data.letterId, {
        userId: myId,
        action: 'decline',
        reason: declineReason || 'Recipient declined delivery custody or reported incorrect address.',
      });

      setResultStatus('declined');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setIsDeclining(false);
        setResultStatus('idle');
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not report delivery decline');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#2B1B17] via-[#1F1410] to-[#120B09] p-6 shadow-2xl text-[#EEDC82]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {/* Header Crown Banner */}
          <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#FFD700]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-wide text-[#FFD700]">
                  Central Hub Delivery Authentication
                </h3>
                <p className="text-xs text-[#EEDC82]/70 italic">
                  Imperial Postal Verification Protocol
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-1 text-[#EEDC82]/60 hover:text-[#FFD700] hover:bg-[#D4AF37]/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success / Decline Overlay State */}
          {resultStatus === 'accepted' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10 animate-pulse" />
              </div>
              <h4 className="text-2xl font-bold text-emerald-300">
                ✦ Delivery Authenticated ✦
              </h4>
              <p className="text-sm text-[#EEDC82]/80 max-w-sm mx-auto">
                The Central Hub has validated your identity. Letter safely sealed in your mailbox and +20 XP awarded to Courier {data.mailmanName || 'Royal Mailman'}.
              </p>
            </motion.div>
          ) : resultStatus === 'declined' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-10 h-10 animate-bounce" />
              </div>
              <h4 className="text-2xl font-bold text-red-400">
                ⚠️ Delivery Rejected & Penalized
              </h4>
              <p className="text-sm text-[#EEDC82]/80 max-w-sm mx-auto">
                Central Hub has flagged this misdelivery. Courier {data.mailmanName || 'Royal Mailman'} has received a formal penalty (-15 XP).
              </p>
            </motion.div>
          ) : (
            <>
              {/* Central Hub Verification Card */}
              <div className="bg-[#120B09]/80 border border-[#D4AF37]/30 rounded-xl p-4 mb-5 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-[#D4AF37]/20 pb-2">
                  <span className="text-[#D4AF37] font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Authentication Hash:
                  </span>
                  <span className="font-mono text-amber-200 tracking-wider">
                    {data.authenticationCode || 'HUB-AUTH-PENDING'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm pt-1">
                  <div>
                    <span className="text-xs text-[#EEDC82]/60 block">Sender of Record:</span>
                    <span className="font-semibold text-amber-100 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#D4AF37]" /> {data.senderName || 'Noble Scribe'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#EEDC82]/60 block">Courier Presenting:</span>
                    <span className="font-semibold text-amber-100 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> {data.mailmanName || 'Royal Mailman'}
                    </span>
                  </div>
                </div>

                <div className="text-xs bg-[#2B1B17]/60 p-2.5 rounded border border-[#D4AF37]/20 text-[#EEDC82]/90 italic">
                  "By decree of the Central Postal Hub: confirm that you are the intended recipient and that this letter reached you in good order."
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Decline Reason Drawer */}
              {isDeclining ? (
                <div className="space-y-3 mb-4">
                  <label className="text-xs text-red-300 font-semibold block">
                    Reason for Declining Custody (Courier will incur -15 XP penalty):
                  </label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="E.g., Wrong recipient name, physical envelope damaged, courier did not present letter..."
                    rows={3}
                    className="w-full bg-[#120B09] border border-red-500/40 rounded-lg p-2.5 text-sm text-amber-100 focus:outline-none focus:border-red-400 placeholder:text-stone-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDecline}
                      disabled={submitting}
                      className="flex-1 py-2 px-3 bg-red-800/80 hover:bg-red-700 text-white rounded-lg text-sm font-semibold border border-red-500 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {submitting ? 'Enforcing Penalty...' : 'Confirm Decline & Penalize'}
                    </button>
                    <button
                      onClick={() => setIsDeclining(false)}
                      disabled={submitting}
                      className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Primary Actions */
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAccept}
                    disabled={submitting}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A028] text-[#2B1B17] hover:brightness-110 font-bold rounded-xl shadow-lg border border-[#FFE87C] flex items-center justify-center gap-2 transition-all"
                  >
                    <Award className="w-5 h-5" />
                    {submitting ? 'Verifying...' : '✨ Authenticate & Accept'}
                  </button>

                  <button
                    onClick={() => setIsDeclining(true)}
                    disabled={submitting}
                    className="py-3 px-4 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-600/40 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Decline / Misdelivered
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default DeliveryProofModal;
