import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { MessageSquare, Calendar, Mail, Trash2, CheckSquare } from 'lucide-react';

export function MessageBoardTab() {
  const {
    comments,
    setComments,
    messages,
    setMessages,
    deleteCommentOrReply,
    syncCurrentState
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState('comments'); // 'comments' | 'messages'
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingCommentsCount = (comments || []).filter(c => !c.reviewed).length;
  const pendingMessagesCount = (messages || []).filter(m => !m.reviewed).length;

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
          Review visitor thoughts, feedback comments, and direct inquiries. Strike out entries to mark them as addressed or reviewed.
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
      <div className="flex border-b border-stone-200/60 max-w-md">
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
      </div>

      {/* Tab Content Panels */}
      {activeSubTab === 'comments' ? (
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
                      {/* Text box with strike-through conditional styling */}
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
      ) : (
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
                      {/* Text box with strike-through conditional styling */}
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
    </div>
  );
}
