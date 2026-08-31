import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllReports, updateReportStatus } from './api';
import { Shield, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'https://letter-game-136c.onrender.com';
export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [letters, setLetters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
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
  
  // Tribunal Modals (Now grabs their exact email!)
  const [messageModal, setMessageModal] = useState<{ reportId: string, reporterId: string, reporterName: string, reporterEmail: string } | null>(null);
  const [messageContent, setMessageContent] = useState("");

  const fetchAdminData = async () => {
    fetch(`${API_BASE}/api/admin/stats`).then(res => res.json()).then(setStats).catch(console.error);
    fetch(`${API_BASE}/api/admin/letters`).then(res => res.json()).then(setLetters).catch(console.error);
    fetch(`${API_BASE}/api/admin/users`).then(res => res.json()).then(setUsers).catch(console.error);
    try {
      const reportsData = await getAllReports();
      setReports(reportsData);
    } catch (e) { console.error("Error fetching reports", e); }
  };

  useEffect(() => {
    fetchAdminData();
    const intervalId = setInterval(fetchAdminData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) fetchAdminData(); 
    } catch (error) { console.error("Error changing role:", error); }
  };

  const handleBanSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${banModalUser._id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          years: Number(banTime.years),
          days: Number(banTime.days),
          hours: Number(banTime.hours),
          minutes: Number(banTime.minutes)
        })
      });
      
      if (response.ok) {
        setBanModalUser(null);
        setBanTime({ years: 0, days: 0, hours: 0, minutes: 0 });
        fetchAdminData();
      } else {
        alert("Failed to execute decree of restriction.");
      }
    } catch (error) { console.error("Error restricting user:", error); }
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      await updateReportStatus(reportId, newStatus);
      fetchAdminData();
    } catch(e) { console.error("Failed to update status", e); }
  };

  const handleSendMessage = async () => {
    if (!messageModal) return;
    try {
      const adminUser = JSON.parse(localStorage.getItem('postmaster_user') || '{}');
      const fullMessage = messageContent;

      const response = await fetch(`${API_BASE}/api/admin/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser.id || adminUser._id,
          reporterId: messageModal.reporterId,
          message: fullMessage
        })
      });

      if (!response.ok) throw new Error("Backend blocked the message!");

      await updateReportStatus(messageModal.reportId, 'resolved');
      setMessageModal(null);
      setMessageContent("");
      fetchAdminData();
    } catch (err: any) {
      alert("Failed to send message: " + err.message);
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
                      (roleFilter === "student" && (user.role === "sender" || user.role === "user" || !user.role));
    return searchMatch && roleMatch;
  });

  const filteredLetters = letters.filter(letter => {
    const sName = (getIdentity(letter.senderRef || letter.sender) + " " + (letter.bottleMoniker || "")).toLowerCase();
    const rName = getIdentity(letter.receiverRef || letter.receiver).toLowerCase();
    return sName.includes(letterSearchTerm.toLowerCase()) || rName.includes(letterSearchTerm.toLowerCase());
  });

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  if (!stats) return <div className="flex justify-center items-center h-screen text-2xl text-[#8B5A2B] italic">Consulting the Postmaster's Ledger...</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-8 bg-[#FDF5E6] border-4 border-[#8B5A2B] rounded-lg shadow-2xl mb-20 relative">
      
      <h1 className="text-4xl font-bold text-[#5C3A21] text-center mb-2 italic tracking-wider">Postmaster General Dashboard</h1>
      <p className="text-center text-[#8B5A2B] mb-8 uppercase tracking-widest text-sm font-semibold">Campus Postal Network Overview & Sovereign Tribunal</p>
      
      {/* --- TAB NAVIGATION --- */}
      <div className="flex justify-center flex-wrap gap-4 mb-10 border-b-2 border-[#D2B48C] pb-6">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`px-8 py-3 rounded font-bold text-lg border-2 transition-colors ${activeTab === 'overview' ? 'bg-[#8B5A2B] text-white border-[#8B5A2B] shadow-inner' : 'bg-[#FAF0E6] text-[#8B5A2B] border-[#D2B48C] hover:bg-[#FDF5E6]'}`}
        >
          Realm Overview
        </button>
        <button 
          onClick={() => setActiveTab('tribunal')} 
          className={`px-8 py-3 rounded font-bold text-lg border-2 transition-colors relative ${activeTab === 'tribunal' ? 'bg-red-800 text-white border-red-900 shadow-inner' : 'bg-[#FAF0E6] text-red-800 border-[#D2B48C] hover:bg-red-50'}`}
        >
          <span className="flex items-center gap-2"><Shield className="w-5 h-5"/> Guild Tribunal</span>
          {pendingReportsCount > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white animate-bounce">
              {pendingReportsCount}
            </span>
          )}
        </button>
        <Link
          to="/notice-board"
          className="px-6 py-3 rounded font-bold text-lg border-2 bg-amber-950/10 text-[#8B5A2B] border-amber-600 hover:bg-[#8B5A2B] hover:text-white transition-colors flex items-center gap-2"
        >
          <Megaphone className="w-5 h-5 text-amber-600" />
          <span>Notice Board Proclamations</span>
        </Link>
      </div>

      {/* =========================================
          TAB 1: REALM OVERVIEW
      ========================================= */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* STATS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 border-2 border-[#D2B48C] rounded text-center shadow-md"><h2 className="text-5xl font-bold text-[#8B5A2B] mb-2">{stats.totalStudents}</h2><p className="text-sm text-[#5C3A21] font-bold uppercase">Total Accounts</p></div>
            <div className="bg-white p-6 border-2 border-[#D2B48C] rounded text-center shadow-md"><h2 className="text-5xl font-bold text-[#8B5A2B] mb-2">{stats.totalMailmen}</h2><p className="text-sm text-[#5C3A21] font-bold uppercase">Active Mailmen</p></div>
            <div className="bg-white p-6 border-2 border-[#D2B48C] rounded text-center shadow-md"><h2 className="text-5xl font-bold text-[#8B5A2B] mb-2">{stats.totalLetters}</h2><p className="text-sm text-[#5C3A21] font-bold uppercase">Total Letters</p></div>
            <div className="bg-white p-6 border-2 border-[#D2B48C] rounded text-center shadow-md"><h2 className="text-5xl font-bold text-[#8B5A2B] mb-2">{stats.lettersInTransit}</h2><p className="text-sm text-[#5C3A21] font-bold uppercase">Letters In Transit</p></div>
          </div>

          {/* THE OVERSEER'S LOG */}
          <div className="bg-white border-2 border-[#D2B48C] rounded p-6 shadow-md mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-[#D2B48C] pb-4 gap-4">
              <h2 className="text-2xl font-bold text-[#5C3A21] italic">The Overseer's Log (Live Feed)</h2>
              <input 
                type="text" 
                placeholder="Search sender, receiver, or bottle moniker..." 
                className="p-2 border-2 border-[#D2B48C] rounded bg-[#FAF0E6] text-[#5C3A21] focus:outline-none focus:border-[#8B5A2B] w-full md:w-64"
                value={letterSearchTerm}
                onChange={(e) => setLetterSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-[#D2B48C] rounded">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-[#FAF0E6] shadow-sm z-10 border-b-2 border-[#8B5A2B]">
                  <tr>
                    <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Timestamp</th>
                    <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Type & Sender</th>
                    <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Receiver</th>
                    <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Status</th>
                    <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLetters.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-[#8B5A2B] italic font-bold">No letters found...</td></tr>
                  ) : (
                    filteredLetters.map((letter, index) => {
                      const isBottle = letter.type === 'bottle';
                      const trueSender = letter.senderRef || letter.sender;
                      const trueReceiver = letter.receiverRef || letter.receiver;
                      return (
                        <tr key={index} className="border-b border-[#D2B48C] hover:bg-[#FDF5E6] transition">
                          <td className="p-3 text-sm text-gray-600">{new Date(letter.createdAt).toLocaleString()}</td>
                          <td className="p-3">
                            <div className="text-[#5C3A21] font-bold flex items-center gap-1.5">
                              {isBottle && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold rounded border border-emerald-300">🍾 Bottle</span>}
                              <span>{getIdentity(trueSender)}</span>
                            </div>
                            {isBottle && letter.isAnonymous && (
                              <span className="text-xs text-emerald-700 italic block">
                                ✦ Anon Moniker: "{letter.bottleMoniker || 'Anonymous'}" (Unmasked to Admin)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-[#5C3A21] font-medium">{getIdentity(trueReceiver)}</td>
                          <td className="p-3 font-bold text-[#8B5A2B] uppercase text-sm">{letter.status || "Pending"}</td>
                          <td className="p-3">
                            <button onClick={() => setSelectedLetter(letter)} className="bg-[#5C3A21] hover:bg-[#8B5A2B] text-white px-3 py-1 rounded shadow text-sm font-bold transition">Intercept</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STAFF DIRECTORY */}
          <div className="bg-white border-2 border-[#D2B48C] rounded p-6 shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-[#D2B48C] pb-4 gap-4">
              <h2 className="text-2xl font-bold text-[#5C3A21] italic">Staff Directory & Role Manager</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  className="p-2 border-2 border-[#D2B48C] rounded bg-[#FAF0E6] text-[#5C3A21] focus:outline-none focus:border-[#8B5A2B] w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                  className="p-2 border-2 border-[#D2B48C] rounded bg-[#FAF0E6] text-[#5C3A21] font-bold focus:outline-none cursor-pointer"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Accounts</option>
                  <option value="admin">Admins Only</option>
                  <option value="mailman">Mailmen Only</option>
                  <option value="student">Students Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-[#D2B48C] rounded">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-[#FAF0E6] shadow-sm z-10 border-b-2 border-[#8B5A2B]">
                  <tr>
                    <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">User Details</th>
                    <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Current Role</th>
                    <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isBanned = user.restrictedUntil && new Date(user.restrictedUntil) > new Date();
                    return (
                      <tr key={user._id} className={`border-b border-[#D2B48C] transition ${isBanned ? 'bg-red-50' : 'hover:bg-[#FDF5E6]'}`}>
                        <td className="p-3">
                          <div className="text-[#5C3A21] font-bold">{user.name || "Unknown Student"}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {isBanned && <span className="text-xs font-bold text-red-600 block mt-1">BANNED UNTIL: {new Date(user.restrictedUntil).toLocaleString()}</span>}
                        </td>
                        <td className="p-3 font-bold text-[#8B5A2B] uppercase text-sm">{user.role || 'student'}</td>
                        <td className="p-3 flex gap-2 flex-wrap">
                          {user.role === 'admin' ? (
                            <span className="px-3 py-1 text-[#8B5A2B] italic text-sm font-bold opacity-70">Protected Account</span>
                          ) : (
                            <>
                              <button onClick={() => changeRole(user._id, 'mailman')} disabled={user.role === 'mailman'} className={`px-3 py-1 rounded shadow text-sm font-bold ${user.role === 'mailman' ? 'bg-gray-300 text-gray-500 opacity-50' : 'bg-[#D2B48C] hover:bg-[#8B5A2B] text-white'}`}>Hire Mailman</button>
                              <button onClick={() => changeRole(user._id, 'sender')} disabled={user.role !== 'mailman'} className={`px-3 py-1 rounded shadow text-sm font-bold ${user.role !== 'mailman' ? 'bg-gray-200 text-gray-400 opacity-50' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}>Make Student</button>
                              <button onClick={() => setBanModalUser(user)} className="px-3 py-1 rounded shadow text-sm font-bold bg-red-600 hover:bg-red-800 text-white">BAN</button>
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
          TAB 2: THE GUILD TRIBUNAL (NEW)
      ========================================= */}
      {activeTab === 'tribunal' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border-2 border-red-800 rounded p-6 shadow-md mb-12">
          <h2 className="text-2xl font-bold text-red-800 italic mb-6 border-b-2 border-red-200 pb-4 flex items-center gap-2">
            The Tribunal Ledger
          </h2>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-[#D2B48C] rounded">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-[#FAF0E6] shadow-sm z-10 border-b-2 border-[#8B5A2B]">
                <tr>
                  <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Date</th>
                  <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Reporter</th>
                  <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Accused Target (Unmasked)</th>
                  <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Transgression & Excerpt</th>
                  <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Status</th>
                  <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Judgment</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-[#8B5A2B] italic font-bold">No reports submitted. The realm is peaceful.</td></tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className={`border-b border-[#D2B48C] transition ${report.status === 'pending' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-[#FDF5E6] opacity-60'}`}>
                      <td className="p-3 text-sm text-gray-600">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-[#5C3A21] font-bold">{getIdentity(report.reporter)}</td>
                      <td className="p-3">
                        <div className="text-red-700 font-bold flex items-center gap-1">
                          <span>{getIdentity(report.reportedUser)}</span>
                        </div>
                        {report.isAnonymousBottle && (
                          <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                            🍾 Anonymous Ocean Bottle Author (Unmasked)
                          </span>
                        )}
                        <span className="text-xs text-gray-500 block">{report.reportedUser?.email}</span>
                      </td>
                      <td className="p-3 text-sm italic max-w-xs">
                        <div className="font-semibold text-gray-800">{report.reason}</div>
                        {report.letterSnippet && (
                          <div className="text-xs text-stone-600 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                            "{report.letterSnippet}"
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-bold uppercase text-xs">
                        <span className={`px-2 py-1 rounded shadow-sm ${report.status === 'pending' ? 'bg-red-200 text-red-800 border border-red-300' : report.status === 'resolved' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2 flex-wrap">
                        {report.status === 'pending' && (
                          <>
                            <button onClick={() => setBanModalUser(report.reportedUser)} className="px-3 py-1 rounded shadow text-xs font-bold bg-red-600 hover:bg-red-800 text-white">Ban Target</button>
                            {/* We safely grab their email here to guarantee delivery! */}
                            <button onClick={() => setMessageModal({ reportId: report._id, reporterId: report.reporter?._id, reporterName: report.reporter?.name, reporterEmail: report.reporter?.email })} className="px-3 py-1 rounded shadow text-xs font-bold bg-[#8B5A2B] hover:bg-[#5C3A21] text-white">Msg Reporter</button>
                            <button onClick={() => handleStatusChange(report._id, 'dismissed')} className="px-3 py-1 rounded shadow text-xs font-bold bg-gray-400 hover:bg-gray-600 text-white">Dismiss</button>
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

      {/* --- MODAL: BAN HAMMER --- */}
      {banModalUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FDF5E6] p-6 rounded border-4 border-[#8B5A2B] shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-red-700 mb-2 italic">Restrict User</h3>
            <p className="text-[#5C3A21] mb-6 font-bold border-b border-[#D2B48C] pb-2">Target: {banModalUser.name || banModalUser.email}</p>
            
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div><label className="block text-xs font-bold text-[#5C3A21] mb-1">Years</label><input type="number" min="0" value={banTime.years} onChange={e => setBanTime({...banTime, years: Number(e.target.value)})} className="w-full p-2 border border-[#D2B48C] rounded bg-white text-center font-bold" /></div>
              <div><label className="block text-xs font-bold text-[#5C3A21] mb-1">Days</label><input type="number" min="0" value={banTime.days} onChange={e => setBanTime({...banTime, days: Number(e.target.value)})} className="w-full p-2 border border-[#D2B48C] rounded bg-white text-center font-bold" /></div>
              <div><label className="block text-xs font-bold text-[#5C3A21] mb-1">Hours</label><input type="number" min="0" value={banTime.hours} onChange={e => setBanTime({...banTime, hours: Number(e.target.value)})} className="w-full p-2 border border-[#D2B48C] rounded bg-white text-center font-bold" /></div>
              <div><label className="block text-xs font-bold text-[#5C3A21] mb-1">Mins</label><input type="number" min="0" value={banTime.minutes} onChange={e => setBanTime({...banTime, minutes: Number(e.target.value)})} className="w-full p-2 border border-[#D2B48C] rounded bg-white text-center font-bold" /></div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setBanModalUser(null)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-bold shadow">Cancel</button>
              <button onClick={handleBanSubmit} className="px-4 py-2 bg-red-600 hover:bg-red-800 text-white rounded font-bold shadow">Drop Ban Hammer</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: MESSAGE REPORTER --- */}
      {messageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#FAF0E6] p-8 rounded border-4 border-[#8B5A2B] shadow-2xl max-w-md w-full relative">
            <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 italic">Verdict & Response</h3>
            <p className="text-[#8B5A2B] mb-4 text-sm font-bold border-b border-[#D2B48C] pb-2">To: {messageModal.reporterName}</p>
            <p className="text-sm italic text-gray-600 mb-2">This missive will be instantly delivered to their mailbox, resolving the report.</p>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={5}
              placeholder="e.g. We have investigated the traveller and dropped the ban hammer..."
              className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] p-3 rounded focus:outline-none focus:border-[#8B5A2B] text-sm font-serif resize-none shadow-inner mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setMessageModal(null); setMessageContent(""); }} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-bold shadow">Cancel</button>
              <button onClick={handleSendMessage} disabled={!messageContent.trim()} className="px-4 py-2 bg-[#8B5A2B] hover:bg-[#5C3A21] disabled:bg-gray-400 text-white rounded font-bold shadow">Send Verdict</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: READ INTERCEPTED LETTER --- */}
      {selectedLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF0E6] p-8 rounded border-4 border-[#8B5A2B] shadow-2xl max-w-2xl w-full relative">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#D2B48C] pb-4">
              <h3 className="text-2xl font-bold text-[#5C3A21] italic">
                {selectedLetter.type === 'bottle' ? 'Intercepted Ocean Bottle' : 'Intercepted Letter'}
              </h3>
              <button onClick={() => setSelectedLetter(null)} className="text-[#8B5A2B] font-bold text-3xl hover:text-red-600 leading-none">&times;</button>
            </div>
            
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">True Sender (Unmasked):</p>
                <p className="text-lg text-[#5C3A21] font-bold">{getIdentity(selectedLetter.senderRef || selectedLetter.sender)}</p>
                {selectedLetter.type === 'bottle' && selectedLetter.isAnonymous && (
                  <p className="text-xs text-emerald-700 italic">Moniker: "{selectedLetter.bottleMoniker || 'Anon'}"</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Recipient:</p>
                <p className="text-lg text-[#5C3A21] font-bold">{getIdentity(selectedLetter.receiverRef || selectedLetter.receiver)}</p>
                {selectedLetter.bottleDrift && (
                  <p className="text-xs text-blue-700 italic">Drift: {selectedLetter.bottleDrift.distanceKm} km</p>
                )}
              </div>
            </div>
            
            <div className="bg-white p-6 border-2 border-[#D2B48C] rounded shadow-inner min-h-[150px] max-h-64 overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap font-serif text-lg leading-relaxed">
                {selectedLetter.content || selectedLetter.body || selectedLetter.message || "No legible text found in this letter."}
              </p>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <span className={`px-4 py-1 rounded shadow text-xs font-bold text-white uppercase ${selectedLetter.status === 'delivered' ? 'bg-green-600' : selectedLetter.status === 'burned' ? 'bg-red-600' : 'bg-yellow-600'}`}>
                Status: {selectedLetter.status || 'Pending'}
              </span>
              <button onClick={() => setSelectedLetter(null)} className="px-6 py-2 bg-[#5C3A21] hover:bg-[#8B5A2B] text-white rounded shadow font-bold transition">Close Transcript</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}