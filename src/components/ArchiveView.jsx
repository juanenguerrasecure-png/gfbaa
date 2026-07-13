import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { MessageCircle, Award, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { CommentBoard } from './CommentBoard';
import { placeholderImages } from '../placeholderImages';

function ArchivePieceCard({ piece }) {
  const { setInquiryItem, comments } = useStore();
  const [showComments, setShowComments] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  const itemCommentCount = useMemo(() => {
    return (comments || []).filter(
      (c) => String(c.itemId) === String(piece.id) && c.itemType === 'past_collection'
    ).length;
  }, [comments, piece.id]);

  const photosList = useMemo(() => {
    const list = [];
    if (Array.isArray(piece.photos)) list.push(...piece.photos);
    if (Array.isArray(piece.photoUrls)) list.push(...piece.photoUrls);
    if (piece.photoUrl) list.push(piece.photoUrl);
    return [...new Set(list.filter(Boolean))];
  }, [piece]);

  const hasMultiple = photosList.length > 1;

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? photosList.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev === photosList.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
  };

  const currentPhoto = photosList[activeIdx] || placeholderImages.archiveFallback;
  const dateStr = piece.dateAdded || 'Spring Curation';

  return (
    <div
      className="group relative bg-[var(--surface)] rounded-xl border border-[var(--border)]/50 overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md"
      id={`archive_piece_card_${piece.id}`}
    >
      {/* Diagonal SOLD corner ribbon */}
      {piece.sold !== false && (
        <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none z-20">
          <div
            className="absolute top-5 -right-7 w-32 py-1 rotate-45 text-center text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#FAF8F5] shadow-sm select-none"
            style={{ backgroundColor: 'var(--accent-deep, #8C7B6E)' }}
            id={`sold_ribbon_${piece.id}`}
          >
            Sold
          </div>
        </div>
      )}

      {/* Top Section */}
      <div>
        <div
          className="aspect-square bg-[var(--bg)] overflow-hidden relative flex items-center justify-center select-none group/slider"
          onTouchStart={hasMultiple ? handleTouchStart : undefined}
          onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
        >
          {/* Main Slide Image */}
          <div className="w-full h-full relative overflow-hidden">
            <img
              src={currentPhoto}
              alt={`${piece.brand || ''} curation`}
              className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500 ease-out"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="absolute inset-0 bg-stone-950/5 group-hover/slider:bg-stone-950/15 transition-all duration-300 pointer-events-none" />

          {/* Slider controls */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--surface)]/90 hover:bg-[var(--surface)] text-[var(--text-primary)] flex items-center justify-center shadow transition-all duration-300 active:scale-95 md:opacity-0 md:group-hover/slider:opacity-100 z-10 cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--surface)]/90 hover:bg-[var(--surface)] text-[var(--text-primary)] flex items-center justify-center shadow transition-all duration-300 active:scale-95 md:opacity-0 md:group-hover/slider:opacity-100 z-10 cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight size={16} />
              </button>

              {/* Slider Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {photosList.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(dotIdx);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                      dotIdx === activeIdx ? 'bg-white scale-125 shadow' : 'bg-white/50'
                    }`}
                    aria-label={`Go to photo ${dotIdx + 1}`}
                  />
                ))}
              </div>

              {/* Photo Counter Label */}
              <div className="absolute top-3 left-3 bg-stone-900/75 px-2 py-0.5 rounded text-[9px] font-mono font-medium text-stone-100 tracking-wide backdrop-blur-sm z-10">
                {activeIdx + 1} / {photosList.length}
              </div>
            </>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase flex items-center gap-1.5">
              <Award size={11} className="text-[var(--accent)]" />
              {piece.brand || 'Luxury Piece'}
            </span>
            <span className="text-[var(--text-secondary)]/60 font-sans text-[10px] flex items-center gap-1">
              <Calendar size={10} />
              {dateStr}
            </span>
          </div>

          <p className="font-serif italic font-light text-[var(--text-primary)] text-sm md:text-base leading-relaxed tracking-wide">
            "{piece.caption || 'Authentic vintage luxury curation.'}"
          </p>
        </div>
      </div>

      {/* Inquiry CTA & Comments */}
      <div className="p-6 pt-0 border-t border-[var(--border)]/40 mt-4 space-y-3">
        <button
          type="button"
          onClick={() => setInquiryItem({ ...piece, isPast: true })}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/60 hover:text-[var(--accent)] text-[var(--text-primary)] text-xs font-semibold rounded tracking-wider uppercase transition-all shadow-sm focus:outline-none cursor-pointer"
          id={`archive_inquiry_btn_${piece.id}`}
        >
          <MessageCircle size={13} />
          <span>Inquire Similar Piece</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)]/50 text-[var(--text-secondary)] text-xs font-semibold rounded tracking-wider uppercase transition-all cursor-pointer"
          id={`archive_comments_toggle_btn_${piece.id}`}
        >
          <MessageCircle size={13} />
          <span>{showComments ? 'Hide Thoughts' : `Thoughts (${itemCommentCount})`}</span>
        </button>

        {showComments && (
          <div className="border-t border-stone-200/30 pt-4 mt-3">
            <CommentBoard itemId={piece.id} itemType="past_collection" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ArchiveView() {
  const { pastCollections, socialLinks, siteContent } = useStore();

  const pieces = useMemo(() => {
    return [...(pastCollections || [])];
  }, [pastCollections]);

  // Formats WhatsApp Link
  const getInquiryUrl = (piece) => {
    const whatsapp = socialLinks?.whatsapp || '1234567890'; // Use configured whatsapp or default
    const text = encodeURIComponent(`Hello! I saw the "${piece.brand}" piece (${piece.caption}) in your Past Collections archive and was wondering if you might be able to source something similar for me.`);
    return `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${text}`;
  };

  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen py-16 px-6 transition-colors duration-500" id="archive_view_container">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-14">
        <span className="text-[10px] uppercase font-sans tracking-[0.3em] font-bold text-accent mb-2 block">
          Archival Portfolio
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-light text-[var(--text-primary)] tracking-tight leading-tight">
          Past Collections
        </h1>
        <p className="text-[var(--text-secondary)] font-sans text-xs md:text-sm max-w-lg mx-auto mt-4 leading-relaxed font-light">
          {siteContent?.archiveIntro || 'A historical directory of our most coveted acquisitions that have found their permanent homes with new collectors.'}
        </p>
      </div>

      {/* Grid or Empty State */}
      <div className="max-w-7xl mx-auto">
        {pieces.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20 px-6 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-xs" id="archive_empty_state">
            <span className="text-[var(--text-secondary)]/30 text-3xl block mb-3">✦</span>
            <p className="text-[var(--text-secondary)]/80 text-[10px] font-mono uppercase tracking-widest mb-2">Archive Queue Empty</p>
            <p className="font-serif text-base text-[var(--text-primary)] italic">"No prior items archived."</p>
            <p className="text-[var(--text-secondary)] text-xs mt-3 leading-relaxed max-w-xs mx-auto">
              Please sign into the admin portal to move items into the past collections repository.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="archive_portfolio_grid">
            {pieces.map((piece, index) => (
              <ArchivePieceCard
                key={piece.id || index}
                piece={piece}
                getInquiryUrl={getInquiryUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
