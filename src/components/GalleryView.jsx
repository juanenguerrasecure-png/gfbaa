import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CommentBoard } from './CommentBoard';
import { AskMeBanner } from './AskMeBanner';
import { placeholderImages } from '../placeholderImages';

export function GalleryView({ onOpenAskMe }) {
  const { galleryPhotos, siteContent } = useStore();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Combine loaded gallery photos with default editorial seeding
  const photos = useMemo(() => {
    const list = galleryPhotos && galleryPhotos.length > 0 ? [...galleryPhotos] : [...placeholderImages.gallery];
    return list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }, [galleryPhotos]);

  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    if (activePhoto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activePhoto]);

  // Support keyboard shortcuts (arrows, escape)
  useEffect(() => {
    if (!activePhoto) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
      }
      if (event.key === 'ArrowRight') {
        setLightboxIndex(prev => photos.length ? (prev + 1) % photos.length : 0);
      }
      if (event.key === 'ArrowLeft') {
        setLightboxIndex(prev => photos.length ? (prev - 1 + photos.length) % photos.length : 0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activePhoto, photos.length]);

  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen py-16 px-6 transition-colors duration-500" id="gallery_view_container">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-14">
        <span className="text-[10px] uppercase font-sans tracking-[0.3em] font-bold text-accent mb-2 block">
          Editorial Gallery
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-light text-[var(--text-primary)] tracking-tight leading-tight">
          Visual Curation
        </h1>
        <p className="text-[var(--text-secondary)] font-sans text-xs md:text-sm max-w-lg mx-auto mt-4 leading-relaxed font-light">
          {siteContent?.galleryIntro || 'A purely visual journal of styling setups, fine-grained details, and lifestyle concepts from our sourcing diaries.'}
        </p>
      </div>

      {/* Masonry Grid or Empty State */}
      <div className="max-w-7xl mx-auto">
        {photos.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20 px-6 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-xs" id="gallery_empty_state">
            <span className="text-[var(--text-secondary)]/30 text-3xl block mb-3">✦</span>
            <p className="text-[var(--text-secondary)]/80 text-[10px] font-mono uppercase tracking-widest mb-2">Editorial Queue Empty</p>
            <p className="font-serif text-base text-[var(--text-primary)] italic">"Pristine layouts under curatorial view."</p>
            <p className="text-[var(--text-secondary)] text-xs mt-3 leading-relaxed max-w-xs mx-auto">
              Please log into the concierge desk dashboard to seed your custom visual stories with titles, captions, and narratives.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]" id="gallery_masonry_grid">
            {photos.map((photo, index) => (
              <div
                key={photo.id || index}
                onClick={() => setLightboxIndex(index)}
                className="break-inside-avoid mb-6 relative overflow-hidden rounded-xl border border-[var(--border)]/50 bg-[var(--surface)] group cursor-zoom-in transition-all duration-300 shadow-sm hover:shadow-md flex flex-col"
                id={`gallery_photo_item_${index}`}
              >
                {/* Photo Container */}
                <div className="relative overflow-hidden bg-[var(--bg)]">
                  <img
                    src={photo.url}
                    alt={photo.title || photo.caption || 'Editorial curation'}
                    className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500 ease-out"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {/* Elegant overlay on hover */}
                  <div className="absolute inset-0 bg-stone-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-[var(--surface)]/95 backdrop-blur-xs text-[var(--text-primary)] text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-full shadow-md border border-[var(--border)]/40">
                      Read Story
                    </span>
                  </div>
                </div>

                {/* Card Text Meta showing Title & Brief Description */}
                <div className="p-5 space-y-1.5 bg-[var(--surface)]">
                  <h3 className="font-serif text-base md:text-lg font-normal text-[var(--text-primary)] tracking-tight leading-snug">
                    {photo.title || 'Untitled Curation'}
                  </h3>
                  {photo.caption ? (
                    <p className="text-[var(--text-secondary)] font-sans text-xs md:text-[13px] leading-relaxed font-light line-clamp-2">
                      {photo.caption}
                    </p>
                  ) : (
                    <p className="text-[var(--text-secondary)]/60 font-sans text-xs italic leading-relaxed font-light">
                      Tap to open full curation narrative.
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-[var(--accent)] pt-1">
                    <span>Explore Story</span>
                    <span className="text-[7px]">✦</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Shopper Wishlist Banner */}
      <AskMeBanner onOpen={onOpenAskMe} />

      {/* Elegant Full-Screen Scrollable Lightbox Modal */}
      <AnimatePresence>
        {activePhoto && (
          <div className="fixed inset-0 z-[120] overflow-hidden" id="gallery_lightbox_portal">
            {/* Split Curation Detail Card */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 180 }}
              className="fixed inset-0 w-full h-full bg-[var(--bg)] text-[var(--text-primary)] flex flex-col overflow-y-auto z-[120]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Floating Close Button */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="fixed top-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 hover:bg-[var(--surface)] text-[var(--text-primary)] hover:text-[var(--accent)] shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                id="gallery_modal_close_btn"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              {/* Media Presentation Showcase */}
              <div className="w-full bg-stone-950/5 relative h-[70vh] md:h-[80vh] flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.title || 'Curation item'}
                  className="w-full h-full object-contain max-h-[65vh] md:max-h-[75vh]"
                  referrerPolicy="no-referrer"
                />

                {/* Left & Right Navigation Chevrons inside showcase */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--text-primary)] hover:bg-[var(--surface)] shadow-md transition-all cursor-pointer z-30 hover:scale-105 active:scale-95"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--text-primary)] hover:bg-[var(--surface)] shadow-md transition-all cursor-pointer z-30 hover:scale-105 active:scale-95"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Counter Indicator badge */}
                <div className="absolute bottom-6 right-6 bg-stone-900/90 text-white text-[10px] uppercase font-sans tracking-[0.2em] px-4 py-2 rounded-full backdrop-blur-xs shadow-sm">
                  Curation {lightboxIndex + 1} of {photos.length}
                </div>
              </div>

              {/* Narrative Storytelling Panel */}
              <div className="w-full max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-8 select-text flex-shrink-0">
                {/* Category stamp */}
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles size={12} className="text-[var(--accent)]" />
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                    Editorial Story
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-serif font-light text-[var(--text-primary)] text-3xl md:text-5xl leading-tight tracking-tight text-center">
                  {activePhoto.title || 'Untitled Curation'}
                </h2>

                {/* Aesthetic Accent Line */}
                <div className="w-16 h-[1px] bg-[var(--accent)] mx-auto" />

                {/* Brief Description */}
                {activePhoto.caption && (
                  <div className="bg-[var(--surface)] border border-[var(--border)]/60 p-6 md:p-8 rounded-2xl text-center shadow-2xs">
                    <p className="font-serif italic font-light text-[var(--text-primary)] text-base md:text-lg leading-relaxed">
                      "{activePhoto.caption}"
                    </p>
                  </div>
                )}

                {/* Full Description / Story which is scrollable */}
                <div className="font-sans font-light text-[var(--text-primary)] text-sm md:text-base leading-relaxed whitespace-pre-line bg-[var(--surface)] border border-[var(--border)]/50 p-6 md:p-8 rounded-2xl shadow-xs">
                  {activePhoto.story ? (
                    activePhoto.story
                  ) : (
                    <p className="italic text-[var(--text-secondary)] text-center">
                      This luxury curation is handpicked with historical respect, ensuring both beautiful vintage preservation and original structure. Explore our daily arrivals to add timeless stories to your own personal wardrobe.
                    </p>
                  )}
                </div>

                {/* Comment Board for Gallery Item */}
                <CommentBoard itemId={activePhoto.id} itemType="gallery" />
              </div>

              {/* Brand Footer */}
              <div className="border-t border-[var(--border)]/50 bg-[var(--surface)]/80 p-6 text-center flex-shrink-0 w-full mt-auto">
                <span className="text-[9px] uppercase font-sans tracking-[0.25em] text-[var(--text-secondary)]/50 font-medium">
                  GOOD FINDS BY AA • STYLE DIARIES
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
