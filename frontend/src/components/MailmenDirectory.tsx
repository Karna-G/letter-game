import { useState, useEffect } from 'react';
import { getMailmenDirectory } from '../api';
import { Feather, Star, Crown, ChevronDown, ChevronUp } from 'lucide-react';

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
      const data = await getMailmenDirectory();
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

  if (loading) return <div className="text-center p-8 text-[#5C3A21] animate-pulse">Consulting the Guild Archives...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-[#5C3A21] mb-6 flex items-center border-b-2 border-[#D2B48C] pb-2 uppercase tracking-wider">
        <Feather className="mr-3 w-8 h-8" /> Guild Roster
      </h2>
      
      {error && <p className="text-red-700 bg-red-50 p-4 border border-red-200 rounded mb-6">⚠ {error}</p>}
      
      <div className="grid gap-6">
        {mailmen.map(mailman => (
          <div key={mailman._id} className="bg-[#FAF0E6] p-6 rounded-lg shadow-md border-2 border-[#D2B48C] hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleExpand(mailman._id)}>
              <div>
                <h3 className="text-2xl font-bold text-[#3E2723] flex items-center gap-2">
                  <Crown className="w-6 h-6 text-[#8B5A2B]" /> {mailman.name}
                </h3>
                <div className="text-sm italic text-[#8B5A2B] mt-1 font-semibold tracking-wide">
                  Rank: {mailman.rank} | XP: {mailman.xp}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{mailman.reputationScore}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-wider">
                  Deliveries: {mailman.deliveriesCompleted}
                </div>
              </div>
            </div>

            {expandedId === mailman._id && (
              <div className="mt-6 pt-4 border-t border-[#D2B48C] space-y-4">
                <div>
                  <h4 className="font-bold text-[#5C3A21] mb-2 uppercase text-sm tracking-wide">Badges Earned</h4>
                  <div className="flex flex-wrap gap-2">
                    {mailman.badges && mailman.badges.length > 0 ? (
                      mailman.badges.map((badge: string, i: number) => (
                        <span key={i} className="bg-[#8B5A2B] text-[#FDF5E6] text-xs px-2 py-1 rounded shadow-sm">{badge}</span>
                      ))
                    ) : (
                      <span className="text-sm italic text-gray-500">None yet</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white bg-opacity-40 p-4 rounded border border-[#E8DCC4]">
                    <h4 className="font-bold text-[#5C3A21] mb-2 text-sm uppercase tracking-wider border-b border-[#E8DCC4] pb-1">Senders Serviced</h4>
                    <ul className="list-disc list-inside text-sm text-[#3E2723]">
                      {mailman.servicedSenders && mailman.servicedSenders.length > 0 ? (
                        mailman.servicedSenders.map((sender: string, i: number) => (
                          <li key={i}>{sender}</li>
                        ))
                      ) : (
                        <li className="italic text-gray-500 list-none">No senders serviced</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-white bg-opacity-40 p-4 rounded border border-[#E8DCC4]">
                    <h4 className="font-bold text-[#5C3A21] mb-2 text-sm uppercase tracking-wider border-b border-[#E8DCC4] pb-1">Receivers Serviced</h4>
                    <ul className="list-disc list-inside text-sm text-[#3E2723]">
                      {mailman.servicedReceivers && mailman.servicedReceivers.length > 0 ? (
                        mailman.servicedReceivers.map((receiver: string, i: number) => (
                          <li key={i}>{receiver}</li>
                        ))
                      ) : (
                        <li className="italic text-gray-500 list-none">No receivers serviced</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex justify-center border-t border-[#D2B48C] border-dashed pt-2">
              <button onClick={() => toggleExpand(mailman._id)} className="text-[#8B5A2B] hover:text-[#5C3A21] transition-colors flex items-center text-sm font-semibold uppercase tracking-wider">
                {expandedId === mailman._id ? (
                  <><ChevronUp className="w-4 h-4 mr-1"/> Hide Service History</>
                ) : (
                  <><ChevronDown className="w-4 h-4 mr-1"/> View Service History</>
                )}
              </button>
            </div>
          </div>
        ))}
        {mailmen.length === 0 && !loading && (
          <p className="text-center italic text-[#8B5A2B]">The Guild Roster is currently empty.</p>
        )}
      </div>
    </div>
  );
}
