import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [letters, setLetters] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [letterSearchTerm, setLetterSearchTerm] = useState("");

  // Modals (Pop-ups)
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [banModalUser, setBanModalUser] = useState(null);
  const [banTime, setBanTime] = useState({ years: 0, days: 0, hours: 0, minutes: 0 });

  const fetchAdminData = () => {
    fetch('http://localhost:5000/api/admin/stats').then(res => res.json()).then(setStats).catch(console.error);
    fetch('http://localhost:5000/api/admin/letters').then(res => res.json()).then(setLetters).catch(console.error);
    fetch('http://localhost:5000/api/admin/users').then(res => res.json()).then(setUsers).catch(console.error);
  };

  useEffect(() => {
    fetchAdminData();
    const intervalId = setInterval(fetchAdminData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const changeRole = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) fetchAdminData(); 
    } catch (error) { console.error("Error changing role:", error); }
  };

  const handleBanSubmit = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${banModalUser._id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banTime)
      });
      if (response.ok) {
        setBanModalUser(null);
        setBanTime({ years: 0, days: 0, hours: 0, minutes: 0 });
        fetchAdminData();
      }
    } catch (error) { console.error("Error banning user:", error); }
  };

  // Helper to safely get names since they might be strings or objects
  const getIdentity = (person) => {
    if (!person) return "Unknown";
    if (typeof person === 'string') return person;
    return person.name || person.email || "Unknown";
  };

  // Filter Engines
  const filteredUsers = users.filter(user => {
    const searchMatch = (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter === "all" || user.role === roleFilter || 
                      (roleFilter === "student" && (user.role === "sender" || user.role === "user" || !user.role));
    return searchMatch && roleMatch;
  });

  const filteredLetters = letters.filter(letter => {
    const sName = getIdentity(letter.sender).toLowerCase();
    const rName = getIdentity(letter.receiver).toLowerCase();
    return sName.includes(letterSearchTerm.toLowerCase()) || rName.includes(letterSearchTerm.toLowerCase());
  });

  if (!stats) return <div className="flex justify-center items-center h-screen text-2xl text-[#8B5A2B] italic">Consulting the Postmaster's Ledger...</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-8 bg-[#FDF5E6] border-4 border-[#8B5A2B] rounded-lg shadow-2xl mb-20 relative">
      
      <h1 className="text-4xl font-bold text-[#5C3A21] text-center mb-2 italic tracking-wider">Postmaster General Dashboard</h1>
      <p className="text-center text-[#8B5A2B] mb-10 uppercase tracking-widest text-sm font-semibold">Campus Postal Network Overview</p>
      
      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 border-2 border-[#D2B48C] rounded text-center shadow-md"><h2 className="text-5xl font-bold text-[#8B5A2B] mb-2">{stats.totalStudents}</h2><p className="text-sm text-[#5C3A21] font-bold uppercase">Total Accounts</p></div>
        <div className="bg-white p-6 border-2 border-[#D2B48C] rounded text-center shadow-md"><h2 className="text-5xl font-bold text-[#8B5A2B] mb-2">{stats.totalMailmen}</h2><p className="text-sm text-[#5C3A21] font-bold uppercase">Active Mailmen</p></div>
        <div className="bg-white p-6 border-2 border-[#D2B48C] rounded text-center shadow-md"><h2 className="text-5xl font-bold text-[#8B5A2B] mb-2">{stats.totalLetters}</h2><p className="text-sm text-[#5C3A21] font-bold uppercase">Total Letters</p></div>
        <div className="bg-white p-6 border-2 border-[#D2B48C] rounded text-center shadow-md"><h2 className="text-5xl font-bold text-[#8B5A2B] mb-2">{stats.lettersInTransit}</h2><p className="text-sm text-[#5C3A21] font-bold uppercase">Letters In Transit</p></div>
      </div>

      {/* --- THE OVERSEER'S LOG --- */}
      <div className="bg-white border-2 border-[#D2B48C] rounded p-6 shadow-md mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-[#D2B48C] pb-4 gap-4">
          <h2 className="text-2xl font-bold text-[#5C3A21] italic">The Overseer's Log (Live Feed)</h2>
          <input 
            type="text" 
            placeholder="Search sender or receiver..." 
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
                <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Sender</th>
                <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Receiver</th>
                <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Status</th>
                <th className="p-3 text-[#5C3A21] font-bold uppercase text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLetters.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-[#8B5A2B] italic font-bold">No letters found...</td></tr>
              ) : (
                filteredLetters.map((letter, index) => (
                  <tr key={index} className="border-b border-[#D2B48C] hover:bg-[#FDF5E6] transition">
                    <td className="p-3 text-sm text-gray-600">{new Date(letter.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-[#5C3A21] font-medium">{getIdentity(letter.sender)}</td>
                    <td className="p-3 text-[#5C3A21] font-medium">{getIdentity(letter.receiver)}</td>
                    <td className="p-3 font-bold text-[#8B5A2B] uppercase text-sm">{letter.status || "Pending"}</td>
                    <td className="p-3">
                      <button 
                        onClick={() => setSelectedLetter(letter)}
                        className="bg-[#5C3A21] hover:bg-[#8B5A2B] text-white px-3 py-1 rounded shadow text-sm font-bold transition"
                      >
                        Intercept
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- STAFF DIRECTORY --- */}
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

      {/* --- MODAL: BAN HAMMER --- */}
      {banModalUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FDF5E6] p-6 rounded border-4 border-[#8B5A2B] shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-red-700 mb-2 italic">Restrict User</h3>
            <p className="text-[#5C3A21] mb-6 font-bold border-b border-[#D2B48C] pb-2">Target: {banModalUser.name || banModalUser.email}</p>
            
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div><label className="block text-xs font-bold text-[#5C3A21] mb-1">Years</label><input type="number" min="0" value={banTime.years} onChange={e => setBanTime({...banTime, years: e.target.value})} className="w-full p-2 border border-[#D2B48C] rounded bg-white text-center font-bold" /></div>
              <div><label className="block text-xs font-bold text-[#5C3A21] mb-1">Days</label><input type="number" min="0" value={banTime.days} onChange={e => setBanTime({...banTime, days: e.target.value})} className="w-full p-2 border border-[#D2B48C] rounded bg-white text-center font-bold" /></div>
              <div><label className="block text-xs font-bold text-[#5C3A21] mb-1">Hours</label><input type="number" min="0" value={banTime.hours} onChange={e => setBanTime({...banTime, hours: e.target.value})} className="w-full p-2 border border-[#D2B48C] rounded bg-white text-center font-bold" /></div>
              <div><label className="block text-xs font-bold text-[#5C3A21] mb-1">Mins</label><input type="number" min="0" value={banTime.minutes} onChange={e => setBanTime({...banTime, minutes: e.target.value})} className="w-full p-2 border border-[#D2B48C] rounded bg-white text-center font-bold" /></div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setBanModalUser(null)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-bold shadow">Cancel</button>
              <button onClick={handleBanSubmit} className="px-4 py-2 bg-red-600 hover:bg-red-800 text-white rounded font-bold shadow">Drop Ban Hammer</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: READ INTERCEPTED LETTER --- */}
      {selectedLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF0E6] p-8 rounded border-4 border-[#8B5A2B] shadow-2xl max-w-2xl w-full relative">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#D2B48C] pb-4">
              <h3 className="text-2xl font-bold text-[#5C3A21] italic">Intercepted Letter</h3>
              <button onClick={() => setSelectedLetter(null)} className="text-[#8B5A2B] font-bold text-3xl hover:text-red-600 leading-none">&times;</button>
            </div>
            
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div><p className="text-xs font-bold text-gray-500 uppercase">From:</p><p className="text-lg text-[#5C3A21] font-bold">{getIdentity(selectedLetter.sender)}</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase">To:</p><p className="text-lg text-[#5C3A21] font-bold">{getIdentity(selectedLetter.receiver)}</p></div>
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