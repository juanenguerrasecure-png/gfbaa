import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, CornerDownRight, MessageSquare, Send, X } from 'lucide-react';

export function CommentBoard({ itemId, itemType }) {
  const { comments, addCommentOrReply, deleteCommentOrReply } = useStore();
  const { isAdmin } = useAuth();

  // Local state for parent comment submission
  const [authorName, setAuthorName] = useState(() => localStorage.getItem('gf_commenter_name') || '');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Local state for reply submission
  const [replyTargetId, setReplyTargetId] = useState(null); // ID of comment being replied to
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');

  // Filter and sort comments for this item (oldest first for readable thread)
  const filteredComments = useMemo(() => {
    return (comments || [])
      .filter((c) => String(c.itemId) === String(itemId) && c.itemType === itemType)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [comments, itemId, itemType]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const trimmedText = commentText.trim();
    const finalAuthor = isAdmin ? 'Admin' : authorName.trim();

    if (!finalAuthor && !isAdmin) {
      setSubmitError('Please enter your name to post.');
      return;
    }
    if (!trimmedText) {
      setSubmitError('Please enter a comment.');
      return;
    }

    setIsSubmitting(true);
    const result = await addCommentOrReply({
      itemId,
      itemType,
      authorName: finalAuthor,
      text: trimmedText
    });
    setIsSubmitting(false);

    if (result.ok) {
      setCommentText('');
      if (!isAdmin) {
        localStorage.setItem('gf_commenter_name', finalAuthor);
      }
    } else {
      setSubmitError(result.error || 'Failed to post comment.');
    }
  };

  const handlePostReply = async (commentId) => {
    setReplyError('');
    const trimmedReply = replyText.trim();
    if (!trimmedReply) {
      setReplyError('Please write a reply.');
      return;
    }

    setIsSubmitting(true);
    const result = await addCommentOrReply({
      commentId,
      authorName: 'Admin', // Replies are strictly admin
      text: trimmedReply
    });
    setIsSubmitting(false);

    if (result.ok) {
      setReplyText('');
      setReplyTargetId(null);
    } else {
      setReplyError(result.error || 'Failed to post reply.');
    }
  };

  const handleDelete = async (commentId, replyId = null) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    const result = await deleteCommentOrReply({ commentId, replyId });
    if (!result.ok) {
      alert(result.error || 'Failed to delete.');
    }
  };

  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return '';
    }
  };

  return (
    <div className="border-t border-stone-200/60 pt-6 mt-8 space-y-6" id={`comment_board_${itemType}_${itemId}`}>
      {/* Board Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-[#8C7B6E]" />
        <h3 className="font-serif text-lg font-light text-stone-900 tracking-tight">
          Thoughts & Inquiries ({filteredComments.length})
        </h3>
      </div>

      {/* Comment List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <p className="text-xs italic text-stone-400 font-sans pl-1">
            No thoughts shared yet. Be the first to leave a note!
          </p>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-stone-50 border border-stone-200/40 p-4 rounded-xl space-y-3 transition-colors"
              id={`comment_card_${comment.id}`}
            >
              {/* Comment Header */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-sans font-semibold text-stone-800 text-xs">
                      {comment.authorName}
                    </span>
                    {comment.isAdmin && (
                      <span className="bg-[#FAF4E5] text-[#C9A84C] text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-[#EBE1CD] shadow-xs">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTargetId(comment.id);
                        setReplyText('');
                        setReplyError('');
                      }}
                      className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Comment Text */}
              <p className="text-xs text-stone-700 font-sans leading-relaxed whitespace-pre-wrap select-text">
                {comment.text}
              </p>

              {/* Replies Sub-list */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="border-t border-stone-200/40 pt-3 mt-2 pl-4 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2.5" id={`reply_card_${reply.id}`}>
                      <CornerDownRight size={13} className="text-stone-300 mt-1 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-sans font-semibold text-stone-800 text-xs">
                                {reply.authorName}
                              </span>
                              {reply.isAdmin && (
                                <span className="bg-[#FAF4E5] text-[#C9A84C] text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-[#EBE1CD] shadow-xs">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-400 block mt-0.5">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(comment.id, reply.id)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-stone-100/50 transition-colors cursor-pointer"
                              title="Delete Reply"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 font-sans leading-relaxed whitespace-pre-wrap select-text">
                          {reply.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Reply Form (strictly Admin) */}
              {replyTargetId === comment.id && (
                <div className="bg-[#FAF8F5] border border-emerald-100 p-3.5 rounded-lg space-y-2.5 mt-2 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-emerald-800">
                      Drafting Response as Owner/Admin
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTargetId(null)}
                      className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write administrative reply..."
                    className="w-full text-xs p-2 rounded border border-stone-200 bg-white focus:outline-none focus:border-[#C9A84C] font-sans leading-relaxed resize-none"
                  />
                  {replyError && <p className="text-[10px] text-rose-500 font-sans">{replyError}</p>}
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReplyTargetId(null)}
                      className="px-2.5 py-1 text-[10px] font-medium text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200/60 rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handlePostReply(comment.id)}
                      className="px-3 py-1 text-[10px] font-bold text-white bg-stone-900 hover:bg-stone-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Send size={10} />
                      <span>{isSubmitting ? 'Sending...' : 'Submit'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Main Comment Input Form */}
      <form onSubmit={handlePostComment} className="space-y-3.5 bg-stone-50/50 border border-stone-200/50 p-4 rounded-xl">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">
          {isAdmin ? 'Owner Insights' : 'Post your Thoughts'}
        </h4>

        {/* Commenter Name Input (if Guest) */}
        {!isAdmin ? (
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider font-bold text-stone-500 block">
              Your Name
            </label>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Enter your name (persisted)"
              className="w-full text-xs p-2 rounded border border-stone-200 bg-white focus:outline-none focus:border-[#C9A84C] font-sans h-9"
            />
          </div>
        ) : (
          <div className="text-[11px] font-sans font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg inline-block shadow-2xs">
            Posting as Administrator / Owner
          </div>
        )}

        {/* Comment Textarea */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-wider font-bold text-stone-500 block">
            Comment Message
          </label>
          <textarea
            rows={3}
            required
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={isAdmin ? "Type administrator comments here..." : "What would you like to say? Ask questions, praise the curation, or comment on style..."}
            className="w-full text-xs p-2.5 rounded border border-stone-200 bg-white focus:outline-none focus:border-[#C9A84C] font-sans leading-relaxed"
          />
        </div>

        {submitError && <p className="text-[10px] text-rose-500 font-sans">{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 bg-[#8C7B6E] hover:bg-[#796B5F] text-white font-sans text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
        >
          <Send size={12} />
          <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
        </button>
      </form>
    </div>
  );
}
