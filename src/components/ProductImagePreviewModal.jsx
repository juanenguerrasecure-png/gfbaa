import { useState, useMemo, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductPlaceholder } from './ProductPlaceholder';

export function ProductImagePreviewModal({ isOpen, onClose, item }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Extract all photos using a robust logic matching ProductCard's extraction
  const photos = useMemo(() => {
    if (!item) return [];
    const list = [];
    const rawPhotos = [];
    if (Array.isArray(item.photos)) rawPhotos.push(...item.photos);
    else if (Array.isArray(item.photoUrls)) rawPhotos.push(...item.photoUrls);
    
    rawPhotos.forEach(p => {
      if (p && typeof p === 'object' && p.url) {
        list.push(p);
      } else if (p && typeof p === 'string') {
        list.push({ url: p, description: '' });
      }
    });

    if (item.photoUrl && !list.some(p => p.url === item.photoUrl)) {
      list.push({ url: item.photoUrl, description: '' });
    }
    if (item.photo && !list.some(p => p.url === item.photo)) {
      list.push({ url: item.photo, description: '' });
    }

    return list.filter(p => p.url);
  }, [item]);

  // Reset index when item changes or modal opens
  useEffect(() => {
    setActiveIndex(0);
  }, [item, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && photos.length > 1) {
        setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
      }
      if (e.key === 'ArrowRight' && photos.length > 1) {
        setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, photos.length]);

  if (!isOpen || !item) return null;

  const handlePrev = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const activePhoto = photos[activeIndex];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md"
        onClick={onClose}
        id="product-image-preview-overlay"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="bg-[var(--bg)] border border-stone-200/50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start px-6 py-4 border-b border-stone-200 bg-[var(--bg)] shrink-0">
            <div>
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#8C7B6E] block mb-0.5 flex items-center gap-1">
                <Sparkles size={10} className="text-[var(--gold)]" />
                {item.brand || 'Luxury Item'}
              </span>
              <h3 className="font-serif text-lg font-semibold text-stone-900 leading-tight">
                {item.name || 'Unnamed product'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Close product preview"
              id="close-image-preview-btn"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-stone-50 min-h-[350px] relative">
            {photos.length > 0 ? (
              <div className="relative w-full flex-1 flex items-center justify-center max-h-[55vh] overflow-hidden">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.6}
                    onDragEnd={(event, info) => {
                      const swipeThreshold = 50;
                      if (info.offset.x < -swipeThreshold) {
                        handleNext(event);
                      } else if (info.offset.x > swipeThreshold) {
                        handlePrev(event);
                      }
                    }}
                    className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none absolute inset-0"
                  >
                    <img
                      src={activePhoto.url}
                      alt={`${item.brand || ''} ${item.name || ''} - View ${activeIndex + 1}`}
                      className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-md transition-all duration-300 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Left/Right Buttons */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-2 p-2 rounded-full bg-white/90 border border-stone-200 hover:bg-white text-stone-700 hover:text-stone-950 shadow-md transition-all shrink-0 cursor-pointer z-10"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-2 p-2 rounded-full bg-white/90 border border-stone-200 hover:bg-white text-stone-700 hover:text-stone-950 shadow-md transition-all shrink-0 cursor-pointer z-10"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-[40vh] max-h-[320px] rounded-lg overflow-hidden border border-stone-200/50">
                <ProductPlaceholder category={item.cat || 'bags'} />
              </div>
            )}

            {/* Description/Caption or Photo Index Indicator */}
            <div className="w-full text-center mt-4 space-y-1 shrink-0 px-4">
              {photos.length > 1 && (
                <span className="text-[10px] font-mono font-medium text-stone-400 uppercase tracking-widest block">
                  Photo {activeIndex + 1} of {photos.length}
                </span>
              )}

              {activePhoto?.description ? (
                <p className="text-xs text-stone-600 font-sans italic max-w-md mx-auto">
                  &ldquo;{activePhoto.description}&rdquo;
                </p>
              ) : item.detail ? (
                <p className="text-xs text-stone-500 font-sans max-w-md mx-auto line-clamp-2">
                  {item.detail}
                </p>
              ) : null}
            </div>

            {/* Thumbnails strip */}
            {photos.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3 overflow-x-auto max-w-full py-1 px-4 shrink-0">
                {photos.map((ph, idx) => (
                  <button
                    key={ph.url + '-' + idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`relative w-10 h-10 rounded overflow-hidden border transition-all shrink-0 ${
                      idx === activeIndex
                        ? 'border-[var(--gold)] ring-1 ring-[var(--gold)]/20'
                        : 'border-stone-200 hover:border-stone-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={ph.url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer details */}
          <div className="px-6 py-4 bg-stone-100 border-t border-stone-200 flex flex-wrap gap-4 items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {item.cat && (
                <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-stone-500 bg-stone-200/50 border border-stone-300/40 px-2.5 py-0.5 rounded">
                  {item.cat}
                </span>
              )}
              {item.condition && (
                <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded">
                  Condition: {item.condition}
                </span>
              )}
            </div>
            {item.price !== undefined && (
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block">Retail Price</span>
                <span className="text-sm font-sans font-bold text-stone-900">
                  ${(Number(item.price) || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
