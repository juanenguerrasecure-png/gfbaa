import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { MessageSquare, Calendar, Mail, Trash2, CheckSquare, Sparkles, RefreshCw } from 'lucide-react';

export function MessageBoardTab() {
  const {
    comments,
    setComments,
    messages,
    setMessages,
    deleteCommentOrReply,
    syncCurrentState
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState('comments'); // 'comments' | 'messages' | 'shopper_requests'
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Shopper Requests States
  const [shopperRequests, setShopperRequests] = useState([]);
  const [requestsFilter, setRequestsFilter] = useState('all'); // 'all' | 'new' | 'in_progress' | 'fulfilled'
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState('');

  const pendingCommentsCount = (comments || []).filter(c => !c.reviewed).length;
  const pendingMessagesCount = (messages || []).filter(m => !m.reviewed).length;

  // Fetch Shopper Requests from D1 backend
  const fetchShopperRequests = async (statusFilter = 'all') => {
    setLoadingRequests(true);
    setRequestsError('');
    try {
      const token = localStorage.getItem('gf_session_token') || '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      let url = '/api/admin/requests';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetch(url, { headers });
      const result = await response.json();
      if (response.ok && result.ok) {
        setShopperRequests(result.requests || []);
      } else {
        setRequestsError(result.error || 'Failed to load shopper requests.');
      }
    } catch (err) {
      console.error(err);
      setRequestsError('Connection error while loading shopper requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch shopper requests when sub-tab or status filter changes
  useEffect(() => {
    if (activeSubTab === 'shopper_requests') {
      fetchShopperRequests(requestsFilter);
    }
  }, [activeSubTab, requestsFilter]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing with database...');
    const result = await syncCurrentState();
    setIsSyncing(false);
    if (result && result.ok) {
      setSyncStatus('Changes synced successfully to database.');
    } else {
      setSyncStatus(result?.error || 'Database sync failed. Changes saved locally.');
    }
    setTimeout(() => setSyncStatus(''), 4000);
  };

  const handleToggleCommentReview = async (commentId) => {
    const updatedComments = (comments || []).map(c => {
      if (c.id === commentId) {
        return { ...c, reviewed: !c.reviewed };
      }
      return c;
    });
    setComments(updatedComments);
    // Trigger sync
    setTimeout(() => {
      handleSync();
    }, 100);
  };

  const handleToggleMessageReview = async (messageId) => {
    const updatedMessages = (messages || []).map(m => {
      if (m.id === messageId) {
        return { ...m, reviewed: !m.reviewed };
      }
      return m;
    });
    setMessages(updatedMessages);
    // Trigger sync
    setTimeout(() => {
      handleSync();
    }, 100);
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to permanently delete this comment?')) return;
    const result = await deleteCommentOrReply({ commentId });
    if (result.ok) {
      setSyncStatus('Comment deleted successfully.');
    } else {
      alert(result.error || 'Failed to delete comment.');
    }
    setTimeout(() => setSyncStatus(''), 4000);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to permanently delete this message?')) return;
    const updatedMessages = (messages || []).filter(m => m.id !== messageId);
    setMessages(updatedMessages);
    // Save state
    setTimeout(async () => {
      setIsSyncing(true);
      const result = await syncCurrentState();
      setIsSyncing(false);
      if (result && result.ok) {
        setSyncStatus('Message deleted & database updated.');
      } else {
        setSyncStatus('Message deleted locally, database sync failed.');
      }
      setTimeout(() => setSyncStatus(''), 4000);
    }, 100);
  };

  const handleUpdateStatus = async (requestId, nextStatus) => {
    try {
      const token = localStorage.getItem('gf_session_token') || '';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        setSyncStatus(`Request ID ${requestId.substring(0, 8)}... status updated to "${nextStatus}".`);
        setTimeout(() => setSyncStatus(''), 4000);
        // Refresh local requests list
        fetchShopperRequests(requestsFilter);
      } else {
        alert(result.error || 'Failed to update request status.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating request status.');
    }
  };

  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Tab Header */}
      <div className="border-b border-stone-200 pb-5">
        <h2 className="font-serif font-light text-3xl text-stone-900 tracking-tight">Message Board Review</h2>
        <p className="text-sm text-stone-500 font-sans font-light mt-1">
          Review visitor thoughts, feedback comments, direct inquiries, and custom shopper requests.
        </p>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="px-4 py-3 bg-[#FAF8F5] border border-stone-200 text-stone-700 text-xs rounded-xl flex items-center justify-between shadow-3xs">
          <span>{syncStatus}</span>
          {isSyncing && <div className="h-4 w-4 rounded-full border-2 border-stone-300 border-t-[#C9A84C] animate-spin" />}
        </div>
      )}

      {/* Navigation sub-tabs */}
      <div className="flex border-b border-stone-200/60 max-w-xl">
        <button
          onClick={() => setActiveSubTab('comments')}
          className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'comments'
              ? 'border-[#C9A84C] text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            Comments
            {pendingCommentsCount > 0 && (
              <span className="bg-[#C9A84C] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingCommentsCount}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('messages')}
          className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'messages'
              ? 'border-[#C9A84C] text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            Inquiries ("Message Me")
            {pendingMessagesCount > 0 && (
              <span className="bg-[#C9A84C] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingMessagesCount}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('shopper_requests')}
          className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'shopper_requests'
              ? 'border-[#C9A84C] text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            Shopper Wishlists ("Ask Me")
          </span>
        </button>
      </div>

      {/* Tab Content Panels */}
      {activeSubTab === 'comments' && (
        <div className="space-y-4">
          {(comments || []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <MessageSquare className="mx-auto text-stone-300 mb-3" size={32} />
              <h3 className="font-serif text-lg text-stone-700 font-light">No comments posted</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                When visitors write reviews or styling stories on gallery curations or archive pages, they will appear here for review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {[...(comments || [])]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((comment) => (
                  <div
                    key={comment.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-sm ${
                      comment.reviewed ? 'border-stone-200 bg-stone-50/50 opacity-80' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4">
                      <div>
                        <span className="text-xs font-bold text-stone-800">{comment.authorName}</span>
                        <span className="text-[10px] bg-stone-100 text-stone-500 font-mono py-0.5 px-2 rounded-full ml-2 uppercase">
                          {comment.itemType} ID: {comment.itemId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <Calendar size={11} />
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p
                        className={`text-sm font-sans leading-relaxed break-words ${
                          comment.reviewed
                            ? 'line-through text-stone-400 font-light decoration-stone-400 decoration-1'
                            : 'text-stone-700 font-light'
                        }`}
                      >
                        {comment.text}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-50">
                        <div>
                          {comment.reviewed ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                              ✓ Reviewed
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                              ● Pending Review
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleCommentReview(comment.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                              comment.reviewed
                                ? 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                                : 'bg-[#C9A84C] hover:bg-[#b0923e] text-white'
                            }`}
                            id={`btn_review_comment_${comment.id}`}
                          >
                            <CheckSquare size={12} />
                            <span>{comment.reviewed ? 'Un-Review' : 'Review & Strike Out'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'messages' && (
        <div className="space-y-4">
          {(messages || []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <Mail className="mx-auto text-stone-300 mb-3" size={32} />
              <h3 className="font-serif text-lg text-stone-700 font-light">No direct messages received</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                When visitors click the "Message Me" button at the top of the page and submit a message, their messages will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {[...(messages || [])]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((message) => (
                  <div
                    key={message.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-sm ${
                      message.reviewed ? 'border-stone-200 bg-stone-50/50 opacity-80' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4">
                      <div>
                        <span className="text-xs font-bold text-stone-800">{message.name}</span>
                        <a
                          href={`mailto:${message.email}`}
                          className="text-[11px] text-stone-500 hover:text-[#C9A84C] underline ml-3 flex-inline items-center gap-1 font-mono"
                        >
                          {message.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <Calendar size={11} />
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p
                        className={`text-sm font-sans leading-relaxed break-words ${
                          message.reviewed
                            ? 'line-through text-stone-400 font-light decoration-stone-400 decoration-1'
                            : 'text-stone-700 font-light'
                        }`}
                      >
                        {message.text}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-50">
                        <div>
                          {message.reviewed ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                              ✓ Addressed
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                              ● Pending Review
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleMessageReview(message.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                              message.reviewed
                                ? 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                                : 'bg-[#C9A84C] hover:bg-[#b0923e] text-white'
                            }`}
                            id={`btn_review_message_${message.id}`}
                          >
                            <CheckSquare size={12} />
                            <span>{message.reviewed ? 'Un-Review' : 'Mark Addressed'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1.5 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'shopper_requests' && (
        <div className="space-y-5">
          {/* Controls Panel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs">
            <div className="flex flex-wrap gap-1.5">
              {['all', 'new', 'in_progress', 'fulfilled'].map((filterVal) => (
                <button
                  key={filterVal}
                  onClick={() => setRequestsFilter(filterVal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    requestsFilter === filterVal
                      ? 'bg-stone-900 text-white shadow-xs border border-stone-900'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/40'
                  }`}
                >
                  {filterVal === 'all' ? 'All Requests' : filterVal === 'in_progress' ? 'Sourcing' : filterVal}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchShopperRequests(requestsFilter)}
              disabled={loadingRequests}
              className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all border border-stone-200/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={loadingRequests ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Loader or Error or Listing */}
          {loadingRequests ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-7 w-7 rounded-full border-2 border-stone-200 border-t-accent animate-spin" />
              <span className="text-xs text-stone-400 font-mono uppercase tracking-widest">Loading Personal Sourcing Queue...</span>
            </div>
          ) : requestsError ? (
            <div className="bg-red-50 border border-red-200/40 rounded-xl p-8 text-center text-red-800 space-y-3">
              <p className="text-sm font-semibold">{requestsError}</p>
              <button
                onClick={() => fetchShopperRequests(requestsFilter)}
                className="px-5 py-2 bg-red-100 hover:bg-red-200 text-red-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Retry Fetching
              </button>
            </div>
          ) : shopperRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center space-y-2">
              <Sparkles className="mx-auto text-stone-300 mb-2 animate-pulse" size={32} />
              <h3 className="font-serif text-lg text-stone-700 font-light">No shopper requests found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                When visitors submit personal shopper sourcing wishlists, they will appear here under the selected status.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {shopperRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  id={`shopper_req_card_${req.id}`}
                >
                  <div>
                    {/* Header bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-900">{req.name}</span>
                        <span className="text-[9px] font-mono font-bold bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded uppercase">
                          ID: {req.id.substring(0, 8)}...
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
                        <Calendar size={11} />
                        <span>{formatDate(req.created_at)}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-col md:flex-row gap-5 items-start">
                      
                      {/* Wishlist text detail */}
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400 block">
                          Wishlist & Sourcing Description
                        </span>
                        <p className="text-sm font-sans font-light text-stone-700 leading-relaxed whitespace-pre-line bg-stone-50 border border-stone-100/50 p-4 rounded-xl">
                          {req.message}
                        </p>
                      </div>

                      {/* Right panel: Reference photo and Contact handles */}
                      <div className="w-full md:w-44 shrink-0 space-y-4">
                        
                        {/* Reference Photo display */}
                        {req.photo_key ? (
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400 block">
                              Reference Photo
                            </span>
                            <a
                              href={`/api/photos/${req.photo_key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-square rounded-lg overflow-hidden border border-stone-200/60 bg-stone-50 hover:border-accent hover:opacity-90 transition-all shadow-3xs"
                              title="Click to view full image in a new window"
                            >
                              <img
                                src={`/api/photos/${req.photo_key}`}
                                alt="Reference photo uploaded by customer"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </a>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400 block">
                              Reference Photo
                            </span>
                            <div className="aspect-square rounded-lg border border-stone-200/40 bg-stone-50/50 flex flex-col items-center justify-center text-stone-300">
                              <span className="text-2xl">✦</span>
                              <span className="text-[9px] font-mono tracking-wider text-stone-400 mt-1 uppercase">No Photo</span>
                            </div>
                          </div>
                        )}

                        {/* Contact badges */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400 block">
                            Customer Contact
                          </span>
                          
                          {req.contact_method === 'email' ? (
                            <a
                              href={`mailto:${req.contact_value}`}
                              className="w-full text-[11px] text-stone-600 hover:text-accent font-sans truncate block border border-stone-200 bg-stone-50/50 px-2 py-1.5 rounded-lg text-center font-medium"
                              title={`Email: ${req.contact_value}`}
                            >
                              ✉ Send Email
                            </a>
                          ) : (
                            <a
                              href={`https://wa.me/${req.contact_value.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full text-[11px] text-emerald-700 hover:text-emerald-800 font-sans truncate block border border-emerald-200 bg-emerald-50 px-2 py-1.5 rounded-lg text-center font-semibold"
                              title={`WhatsApp: ${req.contact_value}`}
                            >
                              💬 Open WhatsApp
                            </a>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Actions Bar Footer */}
                  <div className="flex flex-wrap items-center justify-between pt-4 mt-4 border-t border-stone-100 gap-3 shrink-0">
                    <div>
                      {req.status === 'new' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 border border-blue-200/50 px-2.5 py-1 rounded-full">
                          ● New Request
                        </span>
                      )}
                      {req.status === 'in_progress' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-full">
                          ● Sourcing Piece
                        </span>
                      )}
                      {req.status === 'fulfilled' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                          ✓ Wishlist Fulfilled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mr-1">Change Status:</span>
                      
                      {req.status !== 'new' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'new')}
                          className="px-2.5 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Mark New
                        </button>
                      )}

                      {req.status !== 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[10px] font-bold uppercase tracking-wider text-amber-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Sourcing
                        </button>
                      )}

                      {req.status !== 'fulfilled' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'fulfilled')}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider text-emerald-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Fulfill
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
