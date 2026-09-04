import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, Flame, X } from 'lucide-react';
import { waxSealAudio } from '../utils/waxSealAudio';

// ============================================================
// REALM DIALOG — themed replacements for native alert()/confirm()
//
// The realm speaks in parchment and gold, never in browser chrome.
// Usage from anywhere (components or plain helpers):
//   notify('Letter sealed and sent.')            -> success toast
//   notify.error('Could not send the letter.')   -> warning toast
//   await confirmAction({ message: '...' })      -> Promise<boolean>
// ============================================================

export type NoticeTone = 'success' | 'error' | 'info';

export interface RealmNotice {
  id: number;
  message: string;
  tone: NoticeTone;
  /** true once the notice has begun fading out and is about to be removed. */
  leaving?: boolean;
}

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' styles the confirm button as an irreversible act (burning, deleting). */
  tone?: 'default' | 'danger';
}

interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (accepted: boolean) => void;
}

// ── Module-level store so these are callable outside React components ──
let noticeListener: ((notices: RealmNotice[]) => void) | null = null;
let confirmListener: ((req: ConfirmRequest | null) => void) | null = null;
let activeNotices: RealmNotice[] = [];
let nextId = 1;

const NOTICE_LIFETIME_MS = 5000;
const CONFIRM_EXIT_MS = 200;
const NOTICE_EXIT_MS = 260;

function pushNotice(message: string, tone: NoticeTone) {
  if (!message) return;
  const notice: RealmNotice = { id: nextId++, message: String(message), tone };
  activeNotices = [...activeNotices, notice];
  noticeListener?.(activeNotices);
  window.setTimeout(() => dismissNotice(notice.id), NOTICE_LIFETIME_MS);
}

/**
 * Fade a notice out, then drop it from the list. The removal is driven by our
 * own timer rather than an exit animation, so a notice can never be left in the
 * DOM at opacity 0 — invisible, but still swallowing clicks in that corner.
 */
function dismissNotice(id: number) {
  const target = activeNotices.find((n) => n.id === id);
  if (!target || target.leaving) return;
  activeNotices = activeNotices.map((n) => (n.id === id ? { ...n, leaving: true } : n));
  noticeListener?.(activeNotices);
  window.setTimeout(() => {
    activeNotices = activeNotices.filter((n) => n.id !== id);
    noticeListener?.(activeNotices);
  }, NOTICE_EXIT_MS);
}

/**
 * Show a themed notice. Drop-in replacement for alert() — but non-blocking,
 * so animations and audio keep running underneath it.
 */
export const notify = Object.assign(
  (message: string) => pushNotice(message, 'success'),
  {
    success: (message: string) => pushNotice(message, 'success'),
    error: (message: string) => pushNotice(message, 'error'),
    info: (message: string) => pushNotice(message, 'info'),
  }
);

/**
 * Ask the user to confirm. Drop-in replacement for window.confirm(), except
 * it returns a Promise — so callers must `await` it.
 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!confirmListener) {
      // Host not mounted (should not happen) — fail safe by declining.
      resolve(false);
      return;
    }
    confirmListener({ ...options, id: nextId++, resolve });
  });
}

const TONE_STYLES: Record<NoticeTone, { icon: typeof CheckCircle; accent: string; glow: string; border: string }> = {
  success: { icon: CheckCircle,   accent: 'var(--antique-gold)', glow: 'rgba(212,175,55,0.28)', border: 'rgba(212,175,55,0.55)' },
  error:   { icon: AlertTriangle, accent: '#E8A2A2',             glow: 'rgba(107,29,42,0.42)',  border: 'rgba(190,80,80,0.6)'  },
  info:    { icon: Info,          accent: 'var(--gold-muted)',   glow: 'rgba(212,175,55,0.18)', border: 'rgba(212,175,55,0.4)' },
};

// ============================================================
// HOST — mount once, near the root of the app
// ============================================================
export default function RealmDialogHost() {
  const [notices, setNotices] = useState<RealmNotice[]>([]);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    noticeListener = setNotices;
    confirmListener = setConfirmRequest;
    return () => {
      noticeListener = null;
      confirmListener = null;
    };
  }, []);

  const settleConfirm = (accepted: boolean) => {
    if (!confirmRequest || closing) return;
    if (accepted) waxSealAudio.playWaxStampThud();
    confirmRequest.resolve(accepted);
    // Fade out, then unmount on a timer. We deliberately do NOT use
    // AnimatePresence for this overlay: if its exit ever fails to complete, a
    // full-screen invisible layer is left behind that swallows every click.
    setClosing(true);
    window.setTimeout(() => {
      setConfirmRequest(null);
      setClosing(false);
    }, CONFIRM_EXIT_MS);
  };

  // Escape cancels the confirm dialog, Enter accepts it.
  useEffect(() => {
    if (!confirmRequest) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); settleConfirm(false); }
      if (e.key === 'Enter')  { e.preventDefault(); settleConfirm(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmRequest]);

  const isDanger = confirmRequest?.tone === 'danger';

  return (
    <>
      {/* ── Notice stack (replaces alert) ── */}
      <div
        className="fixed z-[9999] flex flex-col gap-2.5 pointer-events-none"
        style={{ top: '1.25rem', right: '1.25rem', maxWidth: 'min(26rem, calc(100vw - 2.5rem))' }}
        role="status"
        aria-live="polite"
      >
        {notices.map((notice) => {
            const tone = TONE_STYLES[notice.tone];
            const ToneIcon = tone.icon;
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={
                  notice.leaving
                    ? { opacity: 0, x: 40, scale: 0.96 }
                    : { opacity: 1, x: 0, scale: 1 }
                }
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-2.5 p-3.5 rounded-sm shadow-2xl"
                style={{
                  background: 'linear-gradient(145deg, #211C17 0%, #12100E 100%)',
                  border: `1px solid ${tone.border}`,
                  boxShadow: `0 14px 34px rgba(0,0,0,0.72), 0 0 22px ${tone.glow}`,
                  color: 'var(--parchment)',
                  fontFamily: "'Cormorant Garamond', serif",
                  pointerEvents: notice.leaving ? 'none' : 'auto',
                }}
              >
                <ToneIcon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: tone.accent }} />
                <span className="text-sm sm:text-base leading-snug flex-1">{notice.message}</span>
                <button
                  onClick={() => dismissNotice(notice.id)}
                  className="shrink-0 p-0.5 rounded-sm transition-colors hover:bg-white/10"
                  style={{ color: 'var(--warm-gray-light)' }}
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
      </div>

      {/* ── Confirm dialog (replaces window.confirm) ── */}
      {confirmRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: closing ? 0 : 1 }}
            transition={{ duration: CONFIRM_EXIT_MS / 1000 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{ background: 'rgba(6,5,4,0.78)', backdropFilter: 'blur(3px)' }}
            onClick={() => settleConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-md rounded-sm overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #221D18 0%, #12100E 100%)',
                border: `1px solid ${isDanger ? 'rgba(190,80,80,0.6)' : 'rgba(212,175,55,0.45)'}`,
                boxShadow: isDanger
                  ? '0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(107,29,42,0.4)'
                  : '0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(212,175,55,0.18)',
              }}
            >
              <div
                className="px-6 pt-5 pb-4 flex items-center gap-3"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.22)' }}
              >
                <div
                  className="p-2 rounded-full shrink-0"
                  style={{
                    background: isDanger ? 'rgba(107,29,42,0.3)' : 'rgba(212,175,55,0.15)',
                    border: `1px solid ${isDanger ? 'rgba(190,80,80,0.5)' : 'rgba(212,175,55,0.4)'}`,
                    color: isDanger ? '#E8A2A2' : 'var(--antique-gold)',
                  }}
                >
                  {isDanger ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <h3
                  className="text-lg sm:text-xl font-bold tracking-wide"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    color: isDanger ? '#F0C4C4' : 'var(--parchment-light)',
                  }}
                >
                  {confirmRequest.title || (isDanger ? 'This Cannot Be Undone' : 'Confirm')}
                </h3>
              </div>

              <p
                className="px-6 py-5 text-sm sm:text-base leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--parchment-dark)' }}
              >
                {confirmRequest.message}
              </p>

              <div
                className="px-6 pb-5 pt-1 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5"
                style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}
              >
                <button
                  onClick={() => settleConfirm(false)}
                  className="px-5 py-2.5 rounded-sm text-sm font-bold transition-all"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: 'transparent',
                    border: '1px solid rgba(212,175,55,0.35)',
                    color: 'var(--parchment-dark)',
                  }}
                >
                  {confirmRequest.cancelLabel || 'Cancel'}
                </button>
                <button
                  autoFocus
                  onClick={() => settleConfirm(true)}
                  className="px-5 py-2.5 rounded-sm text-sm font-bold transition-all"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: isDanger
                      ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)'
                      : 'linear-gradient(135deg, #6B5420 0%, #3F320F 100%)',
                    border: `1px solid ${isDanger ? 'rgba(190,80,80,0.7)' : 'var(--antique-gold)'}`,
                    color: '#FFF',
                    boxShadow: isDanger ? '0 0 18px rgba(107,29,42,0.55)' : '0 0 18px rgba(212,175,55,0.25)',
                  }}
                >
                  {confirmRequest.confirmLabel || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
    </>
  );
}
