import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { getNotices } from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';

export default function PhantomGazettePopup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNoticeData = async () => {
    try {
      const data = await getNotices();
      const list = Array.isArray(data) ? data : [];

      const lastReadStr = localStorage.getItem('postmaster_last_read_notice_at');
      const lastReadTime = lastReadStr ? new Date(lastReadStr).getTime() : 0;

      const unreadList = list.filter(n => new Date(n.createdAt).getTime() > lastReadTime);
      setHasUnread(unreadList.length > 0);
      setUnreadCount(unreadList.length);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNoticeData();
    const interval = setInterval(fetchNoticeData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenNoticeBoard = () => {
    try {
      waxSealAudio.playParchmentUnroll();
    } catch (_) {}
    setHasUnread(false);
    setUnreadCount(0);
    localStorage.setItem('postmaster_last_read_notice_at', new Date().toISOString());
    navigate('/notice-board');
  };

  // Only show the launcher if on "My Desk" (the root route '/') and there is an unread notice
  if (location.pathname !== '/' || !hasUnread) {
    return null;
  }

  return (
    <>
      {/* ── FLOATING SIDE CORNER NOTICE BOARD BADGE (ONLY VISIBLE ON NEW NOTICE) ── */}
      {hasUnread && (
        <div className="fixed bottom-6 right-6 z-40 print:hidden select-none animate-bounce">
          <motion.button
            onClick={handleOpenNoticeBoard}
            whileHover={{ scale: 1.1, rotate: -3 }}
            whileTap={{ scale: 0.94 }}
            className="relative p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 border-2 border-amber-400 text-amber-200 animate-glow-pulse shadow-[0_0_30px_rgba(245,158,11,0.7)] cursor-pointer"
            title="A new proclamation has arrived upon the Notice Board!"
          >
            <Megaphone className="w-5 h-5 text-amber-300" />
            <span className="hidden sm:inline-block font-serif font-bold text-xs uppercase tracking-wider text-amber-200">
              Notice Board
            </span>

            {/* Pulsing Red Badge */}
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-extrabold text-[10px] border border-amber-300 shadow-md">
              {unreadCount > 0 ? `${unreadCount} NEW` : 'NEW'}
            </span>
          </motion.button>
        </div>
      )}
    </>
  );
}