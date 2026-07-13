import { useEffect, useState } from 'react';
import { Mail, Trash2, Clipboard, Check, Search, AlertCircle } from 'lucide-react';

export function NewsletterTab() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSubscribers = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('gf_session') || '';
    try {
      const response = await fetch('/api/newsletter/subscribers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        setSubscribers(result.data || []);
      } else {
        setError(result.error || 'Failed to retrieve subscribers.');
      }
    } catch {
      setError('Unable to load subscribers. Connect error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = async (id, email) => {
    if (!confirm(`Are you sure you want to remove ${email} from the subscriber list?`)) return;

    const token = localStorage.getItem('gf_session') || '';
    try {
      const response = await fetch(`/api/newsletter/subscribers?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        setSubscribers(prev => prev.filter(s => s.id !== id));
      } else {
        alert(result.error || 'Failed to delete subscriber.');
      }
    } catch {
      alert('Delete failed.');
    }
  };

  const handleCopyEmails = () => {
    if (!subscribers.length) return;
    const emailList = subscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(emailList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSubscribers = subscribers.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.source && s.source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn" id="newsletter_tab_container">
      <div className="border-b border-stone-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-stone-900 font-normal">Newsletter Subscribers</h2>
          <p className="text-sm text-stone-500">View and manage newsletter subscription signups from the storefront.</p>
        </div>
        
        {subscribers.length > 0 && (
          <button
            onClick={handleCopyEmails}
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition cursor-pointer font-sans"
          >
            {copied ? <Check size={14} /> : <Clipboard size={14} />}
            {copied ? 'Emails Copied' : 'Copy All Emails'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-stone-500 font-sans">
            <div className="h-6 w-6 rounded-full border-2 border-stone-200 border-t-accent animate-spin" />
            <span className="text-[10px] uppercase tracking-wider">Loading subscribers...</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-stone-400" />
              <span className="text-sm font-semibold text-stone-800 font-sans">
                Total Subscribers: {subscribers.length}
              </span>
            </div>
            
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search email or source..."
                className="w-full text-xs text-stone-800 bg-white border border-stone-300 rounded px-3 py-1.5 pl-9 outline-none focus:border-accent font-sans"
              />
            </div>
          </div>

          {filteredSubscribers.length === 0 ? (
            <div className="py-16 text-center text-stone-500">
              <span className="text-stone-300 text-3xl block mb-2">✦</span>
              <p className="font-serif italic text-sm">
                {searchTerm ? 'No matching subscribers found.' : 'No subscribers yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold text-xs uppercase tracking-wider font-sans">
                    <th className="p-4">Email</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Date Joined</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans text-stone-800">
                  {filteredSubscribers.map(sub => (
                    <tr key={sub.id} className="hover:bg-stone-50/40 transition-colors">
                      <td className="p-4 font-medium text-stone-900">{sub.email}</td>
                      <td className="p-4 text-xs text-stone-500">
                        <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 uppercase tracking-wide font-mono text-[9px]">
                          {sub.source || 'website'}
                        </span>
                      </td>
                      <td className="p-4 text-stone-500 text-xs font-mono">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(sub.id, sub.email)}
                          className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer inline-flex items-center"
                          title="Delete subscriber"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
