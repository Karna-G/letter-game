import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, getAllReports, updateReportStatus } from './api';
import { Shield, Megaphone, Users, Mail, Clock, Search, Eye, Flame, X, Feather, Crown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import royalCrestGold from './assets/royal_crest_gold.jpg';
import manuscriptQuillDesk from './assets/manuscript_quill_desk.jpg';
import CentralHubRegistryModal from './components/CentralHubRegistryModal';
import LetterEnvelopeWrapper from './components/LetterEnvelopeWrapper';
import HandwrittenLetterPaper from './components/HandwrittenLetterPaper';
import { notify } from './components/RealmDialog';

export default function AdminDashboard() {
  const [showHubProofsModal, setShowHubProofsModal] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [letters, setLetters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'tribunal'>('overview');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [letterSearchTerm, setLetterSearchTerm] = useState("");

  // Modals (Pop-ups)
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [banModalUser, setBanModalUser] = useState<any>(null);
  const [banTime, setBanTime] = useState({ years: 0, days: 0, hours: 0, minutes: 0 });
  
  // Tribunal Modals
  const [messageModal, setMessageModal] = useState<{ reportId: string, reporterId: string, reporterName: string, reporterEmail: string } | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [statsData, lettersData, usersData, reportsData] = await Promise.all([
        apiRequest('/admin/stats').catch(() => null),
        apiRequest('/admin/letters').catch(() => []),
        apiRequest('/admin/users').catch(() => []),
        getAllReports().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      if (Array.isArray(lettersData)) setLetters(lettersData);
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(reportsData)) setReports(reportsData);
    } catch (e) {
      console.error("Error fetching admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const intervalId = setInterval(fetchAdminData, 6000);
    return () => clearInterval(intervalId);
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    try {
      setActionLoading(true);
      await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      await fetchAdminData();
    } catch (error) {
      console.error("Error changing role:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanSubmit = async () => {
    if (!banModalUser) return;
    try {
      setActionLoading(true);
      await apiRequest(`/admin/users/${banModalUser._id}/ban`, {
        method: 'PUT',
        body: JSON.stringify({
          years: Number(banTime.years),
          days: Number(banTime.days),
          hours: Number(banTime.hours),
          minutes: Number(banTime.minutes)
        })
      });
      
      setBanModalUser(null);
      setBanTime({ years: 0, days: 0, hours: 0, minutes: 0 });
      await fetchAdminData();
    } catch (error) {
      console.error("Error restricting user:", error);
      notify.error("Could not execute decree of restriction.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await updateReportStatus(reportId, newStatus);
      await fetchAdminData();
    } catch (e) {
      console.error("Could not update status", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageModal) return;
    try {
      setActionLoading(true);
      const adminUser = JSON.parse(localStorage.getItem('postmaster_user') || '{}');
      const fullMessage = messageContent;

      await apiRequest('/admin/message', {
        method: 'POST',
        body: JSON.stringify({
          adminId: adminUser.id || adminUser._id,
          reporterId: messageModal.reporterId,
          message: fullMessage
        })
      });

      await updateReportStatus(messageModal.reportId, 'resolved');
      setMessageModal(null);
      setMessageContent("");
      await fetchAdminData();
    } catch (err: any) {
      notify.error("Could not send message: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  const getIdentity = (person: any) => {
    if (!person) return "Unknown";
    if (typeof person === 'string') return person;
    return person.name || person.email || "Unknown";
  };

  const filteredUsers = users.filter(user => {
    const searchMatch = (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter === "all" || user.role === roleFilter || 
                      (roleFilter === "student" && (user.role === "sender" || user.role === "user" || !user.role)) ||
                      (roleFilter === "scribe" && (user.role === "sender" || user.role === "user" || user.role === "scribe" || !user.role));
    return searchMatch && roleMatch;
  });

  const filteredLetters = letters.filter(letter => {
    const sName = (getIdentity(letter.senderRef || letter.sender) + " " + (letter.bottleMoniker || "")).toLowerCase();
    const rName = getIdentity(letter.receiverRef || letter.receiver).toLowerCase();
    return sName.includes(letterSearchTerm.toLowerCase()) || rName.includes(letterSearchTerm.toLowerCase());
  });

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  if (loading && !stats) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] space-y-4">
        <div className="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin shadow-lg" />
        <p className="text-xl text-amber-200 font-serif italic tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
          Consulting the Sovereign Postmaster's High Ledger...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-10 max-w-6xl mx-auto"
    >
      {/* ── THEATRICAL HIGH TRIBUNAL HERO BANNER ── */}
      <div 
        className="theatrical-card p-8 sm:p-12 relative overflow-hidden rounded-sm text-left shadow-2xl"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(14, 13, 12, 0.95) 0%, rgba(20, 15, 12, 0.88) 55%, rgba(14, 13, 12, 0.75) 100%), url(${manuscriptQuillDesk})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.7)'
        }}
      >
        {/* Top Gold Rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <img
              src={royalCrestGold}
              alt="Postmaster Crest"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-2xl border-2 border-[var(--antique-gold)] animate-glow-pulse flex-shrink-0"
              style={{ boxShadow: '0 0 35px rgba(212, 175, 55, 0.4), 0 0 15px rgba(107, 29, 42, 0.6)' }}
            />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-bold" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>Sovereign Realm Tribunal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif", color: 'var(--parchment-light)' }}>
                Postmaster High Command
              </h1>
              <p className="text-xs sm:text-sm italic" style={{ color: 'var(--gold-muted)', fontFamily: "'Cormorant Garamond', serif" }}>
                Postal network oversight, epistolary intercept telemetry, and sovereign tribunal decrees.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHubProofsModal(true)}
              className="py-2 px-3.5 rounded-sm font-bold text-xs bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A028] text-[#2B1B17] hover:brightness-110 shadow flex items-center gap-1.5 transition-all border border-[#FFE87C]"
              title="Central Postal Hub Delivery Proofs Registry"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Central Hub Proofs</span>
            </button>

            <button
              onClick={fetchAdminData}
              disabled={actionLoading}
              className="btn-gold-saloon text-xs py-2 px-4 flex items-center gap-1.5 shadow"
              title="Refresh Realm Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Sync Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      <CentralHubRegistryModal
        isOpen={showHubProofsModal}
        onClose={() => setShowHubProofsModal(false)}
      />

      {/* ── HIGH COMMAND TABS ── */}
      <div className="flex justify-center flex-wrap gap-3 pb-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
        <button 
          onClick={() => setActiveTab('overview')} 
          className="px-6 py-3 rounded-t-sm font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
          style={{
            fontFamily: "'Cinzel', serif",
            background: activeTab === 'overview' ? 'linear-gradient(135deg, #7A1E2E 0%, #430E17 100%)' : 'rgba(20, 18, 16, 0.6)',
            color: activeTab === 'overview' ? '#FFF' : 'var(--gold-muted)',
            border: activeTab === 'overview' ? '1px solid var(--antique-gold)' : '1px solid rgba(212,175,55,0.2)',
            borderBottom: 'none'
          }}
        >
          <Feather className="w-4 h-4 text-amber-300" />
          <span>Realm Telemetry & Staff</span>
        </button>

        <button 
          onClick={() => setActiveTab('tribunal')} 
          className="px-6 py-3 rounded-t-sm font-bold text-xs sm:text-sm transition-all flex items-center gap-2 relative"
          style={{
            fontFamily: "'Cinzel', serif",
            background: activeTab === 'tribunal' ? 'linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)' : 'rgba(20, 18, 16, 0.6)',
            color: activeTab === 'tribunal' ? '#FFF' : 'var(--gold-muted)',
            border: activeTab === 'tribunal' ? '1px solid #DC2626' : '1px solid rgba(212,175,55,0.2)',
            borderBottom: 'none'
          }}
        >
          <Shield className="w-4 h-4 text-red-400" />
          <span>Guild Tribunal Ledger</span>
          {pendingReportsCount > 0 && (
            <span className="bg-red-600 text-white text-[11px] font-sans font-bold px-2 py-0.5 rounded-full shadow-lg border border-white animate-pulse">
              {pendingReportsCount}
            </span>
          )}
        </button>

        <Link
          to="/notice-board"
          className="px-6 py-3 rounded-t-sm font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
          style={{
            fontFamily: "'Cinzel', serif",
            background: 'rgba(20, 18, 16, 0.6)',
            color: 'var(--gold-muted)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderBottom: 'none'
          }}
        >
          <Megaphone className="w-4 h-4 text-amber-400" />
          <span>Notice Board Proclamations</span>
        </Link>
      </div>

      {/* =========================================
          TAB 1: REALM OVERVIEW & STAFF
      ========================================= */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="theatrical-card p-5 sm:p-6 rounded-sm text-center relative overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>
              <Users className="w-6 h-6 mx-auto mb-2 text-amber-400 opacity-70" />
              <h2 className="text-3xl sm:text-4xl font-bold font-mono text-amber-300 mb-1">{stats?.totalStudents || 0}</h2>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>Total Scribes & Citizens</p>
            </div>
            
            <div className="theatrical-card p-5 sm:p-6 rounded-sm text-center relative overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>
              <Crown className="w-6 h-6 mx-auto mb-2 text-amber-300 opacity-70" />
              <h2 className="text-3xl sm:text-4xl font-bold font-mono text-amber-300 mb-1">{stats?.totalMailmen || 0}</h2>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>Commissioned Couriers</p>
            </div>

            <div className="theatrical-card p-5 sm:p-6 rounded-sm text-center relative overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>
              <Mail className="w-6 h-6 mx-auto mb-2 text-emerald-400 opacity-70" />
              <h2 className="text-3xl sm:text-4xl font-bold font-mono text-emerald-300 mb-1">{stats?.totalLetters || 0}</h2>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>Sovereign Epistles</p>
            </div>

            <div className="theatrical-card p-5 sm:p-6 rounded-sm text-center relative overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>
              <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400 opacity-70 animate-spin" />
              <h2 className="text-3xl sm:text-4xl font-bold font-mono text-yellow-300 mb-1">{stats?.lettersInTransit || 0}</h2>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>In Saddlebag Transit</p>
            </div>
          </div>

          {/* THE OVERSEER'S LOG (LIVE MISSIVE INTERCEPT FEED) */}
          <div className="theatrical-card p-6 sm:p-8 rounded-sm space-y-6" style={{ border: '1px solid rgba(212,175,55,0.35)' }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                  The Overseer's Intercept Feed
                </h2>
                <p className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                  Live transcripts of letters, quantum paradoxes, and oceanic relics drifting through the realm.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="Search sender, receiver, or moniker..." 
                  className="p-2 pl-9 rounded-sm text-xs font-serif w-full focus:outline-none"
                  style={{
                    background: '#FFFDF9',
                    color: '#1A1A1A',
                    border: '1px solid var(--border-subtle)'
                  }}
                  value={letterSearchTerm}
                  onChange={(e) => setLetterSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-sm border border-stone-800">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 z-10" style={{ background: '#1A1412', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
                  <tr>
                    <th className="p-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Timestamp</th>
                    <th className="p-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Type & Author</th>
                    <th className="p-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Recipient</th>
                    <th className="p-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Status</th>
                    <th className="p-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredLetters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-400 italic font-serif">
                        No letters match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredLetters.map((letter, index) => {
                      const isBottle = letter.type === 'bottle';
                      const isDybbuk = letter.type === 'dybbuk' || letter.type === 'dibbyuk';
                      const isSchrodinger = letter.type === 'schrodinger';
                      const isTorn = letter.isTorn || letter.status === 'torn';
                      const trueSender = letter.senderRef || letter.sender;
                      const trueReceiver = letter.receiverRef || letter.receiver;
                      
                      return (
                        <tr key={index} className="hover:bg-amber-950/20 transition-colors">
                          <td className="p-3 text-xs font-mono text-stone-400">
                            {new Date(letter.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                              {isBottle && <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] uppercase font-bold rounded border border-emerald-600">🍾 Bottle</span>}
                              {isDybbuk && <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 text-[10px] uppercase font-bold rounded border border-purple-600">👻 Dybbuk</span>}
                              {isSchrodinger && <span className="px-1.5 py-0.5 bg-sky-950 text-sky-300 text-[10px] uppercase font-bold rounded border border-sky-600">⚛️ Quantum</span>}
                              <span>{getIdentity(trueSender)}</span>
                            </div>
                            {isBottle && letter.isAnonymous && (
                              <span className="text-[11px] text-emerald-400 italic block font-serif">
                                ✦ Anon Moniker: "{letter.bottleMoniker || 'Ocean Relic'}" (Unmasked to Tribunal)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs sm:text-sm font-medium" style={{ color: 'var(--antique-gold)' }}>
                            {getIdentity(trueReceiver)}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                              letter.status === 'delivered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                              letter.status === 'burned' ? 'bg-orange-950 text-orange-300 border border-orange-700' :
                              isTorn ? 'bg-red-950 text-red-300 border border-red-700' :
                              (letter.status === 'in-transit' || letter.status === 'in_transit') ? 'bg-yellow-950 text-yellow-300 border border-yellow-700' :
                              'bg-stone-800 text-stone-300 border border-stone-600'
                            }`}>
                              {isTorn ? '⚠️ Torn' : (letter.status || "Pending")}
                            </span>
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => setSelectedLetter(letter)} 
                              className="btn-velvet-burgundy text-xs py-1.5 px-3 flex items-center gap-1 shadow"
                            >
                              <Eye className="w-3.5 h-3.5" /> Intercept
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STAFF DIRECTORY & SCRIBE ROLE MANAGER */}
          <div className="theatrical-card p-6 sm:p-8 rounded-sm space-y-6" style={{ border: '1px solid rgba(212,175,55,0.35)' }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: 'var(--parchment-light)' }}>
                  Staff Directory & Role Commission
                </h2>
                <p className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                  Promote citizens to Royal Couriers, reassign to Scribes, or enact decrees of restriction.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  className="p-2 rounded-sm text-xs font-serif focus:outline-none w-full sm:w-60"
                  style={{
                    background: '#FFFDF9',
                    color: '#1A1A1A',
                    border: '1px solid var(--border-subtle)'
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                  className="p-2 rounded-sm text-xs font-bold focus:outline-none cursor-pointer"
                  style={{
                    background: '#1C1915',
                    color: 'var(--antique-gold)',
                    border: '1px solid rgba(212,175,55,0.4)',
                    fontFamily: "'Cinzel', serif"
                  }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Realm Citizens</option>
                  <option value="admin">Admins Only</option>
                  <option value="mailman">Couriers Only</option>
                  <option value="scribe">Scribes Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-sm border border-stone-800">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 z-10" style={{ background: '#1A1412', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
                  <tr>
                    <th className="p-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Citizen Details</th>
                    <th className="p-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Current Office</th>
                    <th className="p-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--antique-gold)', fontFamily: "'Cinzel', serif" }}>Sovereign Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredUsers.map((user) => {
                    const isBanned = user.restrictedUntil && new Date(user.restrictedUntil) > new Date();
                    return (
                      <tr key={user._id} className={`transition-colors ${isBanned ? 'bg-red-950/25 hover:bg-red-950/40' : 'hover:bg-amber-950/20'}`}>
                        <td className="p-3">
                          <div className="font-bold text-sm" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel', serif" }}>
                            {user.name || "Unknown Scribe"}
                          </div>
                          <div className="text-xs font-mono text-stone-400">{user.email}</div>
                          {isBanned && (
                            <span className="text-[11px] font-bold text-red-400 flex items-center gap-1 mt-1 font-mono">
                              <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                              SANCTIONED UNTIL: {new Date(user.restrictedUntil).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono ${
                            user.role === 'admin' ? 'bg-amber-950 text-amber-300 border border-amber-500' :
                            user.role === 'mailman' ? 'bg-yellow-950 text-yellow-300 border border-yellow-600' :
                            'bg-stone-900 text-stone-300 border border-stone-700'
                          }`}>
                            {user.role === 'admin' ? '👑 Master / Admin' : user.role === 'mailman' ? '🏇 Royal Courier' : '📜 Scribe'}
                          </span>
                        </td>
                        <td className="p-3 flex gap-2 flex-wrap items-center">
                          {user.role === 'admin' ? (
                            <span className="text-xs italic font-serif text-amber-400/70 font-bold">
                              Protected Tribunal Account
                            </span>
                          ) : (
                            <>
                              <button 
                                onClick={() => changeRole(user._id, 'mailman')} 
                                disabled={user.role === 'mailman' || actionLoading} 
                                className={`btn-gold-saloon text-xs py-1 px-3 ${user.role === 'mailman' ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                🏇 Hire Courier
                              </button>
                              
                              <button 
                                onClick={() => changeRole(user._id, 'sender')} 
                                disabled={user.role !== 'mailman' || actionLoading} 
                                className={`btn-velvet-burgundy text-xs py-1 px-3 ${user.role !== 'mailman' ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                ✍️ Make Scribe
                              </button>
                              
                              <button 
                                onClick={() => setBanModalUser(user)} 
                                className="px-2.5 py-1 rounded-sm text-xs font-bold bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 shadow transition-colors"
                              >
                                ⚖️ Ban / Restrict
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================
          TAB 2: THE GUILD TRIBUNAL
      ========================================= */}
      {activeTab === 'tribunal' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="theatrical-card p-6 sm:p-8 rounded-sm space-y-6" style={{ border: '1px solid rgba(220,38,38,0.4)' }}>
          <div className="pb-4" style={{ borderBottom: '1px solid rgba(220,38,38,0.25)' }}>
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif", color: '#FCA5A5' }}>
              <Shield className="w-6 h-6 text-red-500" />
              The Tribunal Ledger & Transgression Reports
            </h2>
            <p className="text-xs italic mt-1" style={{ color: 'var(--gold-muted)' }}>
              Accusations filed by travellers. Review unmasked identities, deliver sovereign sanctions, or dispatch verdict epistles.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-sm border border-stone-800">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10" style={{ background: '#1A0E0E', borderBottom: '1px solid rgba(220,38,38,0.3)' }}>
                <tr>
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-red-300 font-mono">Date</th>
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-red-300 font-mono">Reporter</th>
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-red-300 font-mono">Accused Scribe (Unmasked)</th>
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-red-300 font-mono">Transgression & Excerpt</th>
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-red-300 font-mono">Status</th>
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-red-300 font-mono">Judgment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400 italic font-serif">
                      No grievances filed in the Tribunal Ledger. The realm is in peace.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className={`transition-colors ${report.status === 'pending' ? 'bg-red-950/20 hover:bg-red-950/35' : 'hover:bg-amber-950/15 opacity-70'}`}>
                      <td className="p-3 text-xs font-mono text-stone-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-xs sm:text-sm font-bold" style={{ color: 'var(--parchment-light)' }}>
                        {getIdentity(report.reporter)}
                      </td>
                      <td className="p-3">
                        <div className="text-red-400 font-bold text-xs sm:text-sm flex items-center gap-1 font-serif">
                          <span>{getIdentity(report.reportedUser)}</span>
                        </div>
                        {report.isAnonymousBottle && (
                          <span className="text-[11px] font-bold text-emerald-400 block mt-0.5 font-mono">
                            🍾 Anonymous Ocean Bottle Author (Unmasked)
                          </span>
                        )}
                        <span className="text-xs text-stone-400 font-mono block">{report.reportedUser?.email}</span>
                      </td>
                      <td className="p-3 text-xs italic max-w-xs space-y-1">
                        <div className="font-semibold text-stone-200">{report.reason}</div>
                        {report.letterSnippet && (
                          <div className="text-[11px] font-serif p-2 rounded-sm" style={{ background: '#FFFDF9', color: '#1A1A1A', border: '1px solid var(--border-subtle)' }}>
                            "{report.letterSnippet}"
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-mono uppercase text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          report.status === 'pending' ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse' : 
                          report.status === 'resolved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 
                          'bg-stone-800 text-stone-400 border border-stone-600'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2 flex-wrap items-center">
                        {report.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => setBanModalUser(report.reportedUser)} 
                              className="px-2.5 py-1 rounded-sm text-xs font-bold bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 shadow"
                            >
                              ⚖️ Ban Target
                            </button>
                            
                            <button 
                              onClick={() => setMessageModal({ 
                                reportId: report._id, 
                                reporterId: report.reporter?._id, 
                                reporterName: report.reporter?.name, 
                                reporterEmail: report.reporter?.email 
                              })} 
                              className="btn-gold-saloon text-xs py-1 px-2.5 shadow"
                            >
                              ✉️ Msg Reporter
                            </button>
                            
                            <button 
                              onClick={() => handleStatusChange(report._id, 'dismissed')} 
                              className="px-2 py-1 rounded-sm text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 shadow"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── MODAL: BAN HAMMER / RESTRICT CITIZEN ── */}
      <AnimatePresence>
        {banModalUser && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-curtain-reveal">
            <div 
              className="theatrical-card p-6 sm:p-8 max-w-md w-full relative rounded-sm shadow-2xl space-y-6"
              style={{
                background: 'linear-gradient(160deg, #1C1412 0%, #0F0A08 100%)',
                border: '2px solid #DC2626',
                boxShadow: '0 0 50px rgba(220,38,38,0.4)'
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                  <h3 className="text-xl sm:text-2xl font-bold text-red-300" style={{ fontFamily: "'Cinzel', serif" }}>
                    Enact Decree of Restriction
                  </h3>
                </div>
                <button onClick={() => setBanModalUser(null)} className="text-stone-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase font-bold tracking-wider text-stone-400 font-mono">Target Accused Scribe:</p>
                <p className="text-base font-bold text-amber-200 font-serif">{banModalUser.name || banModalUser.email}</p>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {['years', 'days', 'hours', 'minutes'].map((unit) => (
                  <div key={unit}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 font-mono">{unit}</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={(banTime as any)[unit]} 
                      onChange={e => setBanTime({...banTime, [unit]: Number(e.target.value)})} 
                      className="w-full p-2 rounded-sm text-center font-bold text-sm focus:outline-none"
                      style={{
                        background: '#FFFDF9',
                        color: '#1A1A1A',
                        border: '1px solid var(--border-subtle)'
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button 
                  onClick={() => setBanModalUser(null)} 
                  className="btn-gold-saloon text-xs py-2 px-4 font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBanSubmit} 
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-sm text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-lg border border-red-500 flex items-center gap-1.5 transition-all"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span>Execute Decree</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: VERDICT & RESPONSE TO REPORTER ── */}
      <AnimatePresence>
        {messageModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-curtain-reveal">
            <div 
              className="theatrical-card p-6 sm:p-8 max-w-md w-full relative rounded-sm shadow-2xl space-y-4"
              style={{
                background: 'linear-gradient(160deg, #1C1915 0%, #12100E 100%)',
                border: '2px solid var(--antique-gold)',
                boxShadow: '0 0 50px rgba(212,175,55,0.35)'
              }}
            >
              <div className="flex justify-between items-center pb-2 border-b border-amber-900/30">
                <h3 className="text-xl font-bold text-amber-200" style={{ fontFamily: "'Cinzel', serif" }}>
                  Tribunal Verdict & Decree
                </h3>
                <button onClick={() => { setMessageModal(null); setMessageContent(""); }} className="text-stone-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs space-y-1">
                <p className="text-stone-400">To Sovereign Reporter: <strong className="text-amber-300 font-bold">{messageModal.reporterName}</strong></p>
                <p className="text-stone-400 italic">This letter will be dispatched directly to their mailbox, formally concluding the grievance.</p>
              </div>

              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={5}
                placeholder="Inscribe the Tribunal's findings (e.g. We have investigated the grievance and enacted a decree of restriction)..."
                className="w-full p-3.5 rounded-sm focus:outline-none text-sm font-serif resize-none shadow-inner"
                style={{
                  background: '#FFFDF9',
                  color: '#1A1A1A',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '1.05rem'
                }}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => { setMessageModal(null); setMessageContent(""); }} 
                  className="btn-gold-saloon text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendMessage} 
                  disabled={!messageContent.trim() || actionLoading} 
                  className="btn-velvet-burgundy text-xs py-2 px-5 disabled:opacity-40"
                >
                  Dispatch Decree
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: READ INTERCEPTED MISSIVE (PARCHMENT TRANSCRIPT) ── */}
      <AnimatePresence>
        {selectedLetter && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-curtain-reveal">
            <div className="max-w-lg w-full relative animate-scroll-unroll">
              {/* Top Wooden Rod */}
              <div className="scroll-rod-top" />

              <div className="parchment-scroll-surface p-6 sm:p-8 relative rounded-sm shadow-2xl">
                <button 
                  onClick={() => setSelectedLetter(null)} 
                  className="absolute top-3 right-3 text-stone-600 hover:text-stone-950 p-1"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="border-b border-amber-900/20 pb-3 mb-4">
                  <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-amber-950 bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-800/30">
                    ✦ Tribunal Intercept Transcript ✦
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold mt-2" style={{ fontFamily: "'Cinzel', serif", color: '#3A1F04' }}>
                    {selectedLetter.type === 'bottle' ? 'Intercepted Ocean Bottle' : selectedLetter.type === 'dybbuk' ? 'Spectral Dybbuk Letter' : selectedLetter.type === 'schrodinger' ? 'Schrödinger Box Transcript' : 'Intercepted Letter'}
                  </h3>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-xs font-serif bg-black/5 p-3 rounded-sm border border-amber-900/15">
                  <div>
                    <span className="font-bold text-amber-950 uppercase tracking-wider block font-mono text-[10px]">True Sender:</span>
                    <strong className="text-amber-900 text-sm">{getIdentity(selectedLetter.senderRef || selectedLetter.sender)}</strong>
                    {selectedLetter.type === 'bottle' && selectedLetter.isAnonymous && (
                      <span className="text-[11px] text-emerald-800 italic block font-mono mt-0.5">
                        Moniker: "{selectedLetter.bottleMoniker || 'Anon'}"
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-amber-950 uppercase tracking-wider block font-mono text-[10px]">Recipient:</span>
                    <strong className="text-amber-900 text-sm">{getIdentity(selectedLetter.receiverRef || selectedLetter.receiver)}</strong>
                    {selectedLetter.bottleDrift && (
                      <span className="text-[11px] text-blue-800 italic block font-mono mt-0.5">
                        Drift: {selectedLetter.bottleDrift.distanceKm} km
                      </span>
                    )}
                  </div>
                </div>

                {(() => {
                  const letterSender = getIdentity(selectedLetter.senderRef || selectedLetter.sender);
                  const letterDate = selectedLetter.createdAt ? new Date(selectedLetter.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : undefined;
                  return (
                    <div className="mb-5">
                      <LetterEnvelopeWrapper
                        isHandwritten={!!selectedLetter.isHandwritten}
                        senderName={letterSender}
                        isAnonymous={selectedLetter.isAnonymous}
                        dateStr={letterDate}
                        penStyle={selectedLetter.isHandwritten ? 'Physical Quill Canvas' : (selectedLetter.font || 'Cinzel')}
                      >
                        {selectedLetter.isHandwritten ? (
                          <div className="max-h-[440px] overflow-y-auto">
                            <HandwrittenLetterPaper
                              content={selectedLetter.content}
                              senderName={letterSender}
                              styleId={selectedLetter.handwritingStyle}
                              inkId={selectedLetter.inkColor}
                              paperId={selectedLetter.parchmentPaper}
                              fontSize={selectedLetter.fontSize}
                              handwrittenPages={selectedLetter.handwrittenPages}
                              dateStr={letterDate}
                              isAnonymous={selectedLetter.isAnonymous}
                            />
                          </div>
                        ) : (
                          <div 
                            className="p-4 rounded-sm whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed text-sm sm:text-base"
                            style={{
                              color: '#1A1A1A',
                              fontFamily: selectedLetter.font || 'Cinzel'
                            }}
                          >
                            {selectedLetter.content || selectedLetter.body || selectedLetter.message || "No legible text inscribed in this letter."}
                          </div>
                        )}
                      </LetterEnvelopeWrapper>
                    </div>
                  );
                })()}

                <div className="flex justify-between items-center pt-2 border-t border-amber-900/20">
                  <span className="text-xs font-mono uppercase font-bold text-amber-900">
                    Status: <strong className="text-amber-950">{selectedLetter.status || 'Pending'}</strong>
                  </span>
                  <button 
                    onClick={() => setSelectedLetter(null)} 
                    className="btn-gold-saloon text-xs py-2 px-5"
                  >
                    Roll Up Scroll & Close
                  </button>
                </div>
              </div>

              {/* Bottom Wooden Rod */}
              <div className="scroll-rod-bottom" />
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}