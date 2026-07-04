import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK_GALLERY_PHOTOS = [
  { id: 'g1', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop', caption: 'Prismatic autumn focus — structured silhouette with hand-finished edge glazing.', order: 1 },
  { id: 'g2', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop', caption: 'Heirloom tier rings, cast in molten 18-karat yellow gold and set with diamonds.', order: 2 },
  { id: 'g3', url: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=800&auto=format&fit=crop', caption: 'The quiet warmth of early morning fittings. Sourcing journeys, autumn 2026.', order: 3 },
  { id: 'g4', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop', caption: 'Pebbled leather surfaces designed to accumulate rich, warm patina.', order: 4 },
  { id: 'g5', url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=800&auto=format&fit=crop', caption: 'Linked collars catching light. A delicate balance of weight and structure.', order: 5 },
  { id: 'g6', url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop', caption: 'Curated styling accessories: a complete expression of seasonal texture and grace.', order: 6 },
];

export function GalleryView() {
  const { galleryPhotos } = useStore();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Combine loaded gallery photos with default editorial seeding
  const photos = useMemo(() => {
    const list = [...(galleryPhotos || [])];
    if (list.length === 0) {
      return FALLBACK_GALLERY_PHOTOS;
    }
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

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-16 px-6" id="gallery_view_container">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-14">
        <span className="text-[10px] uppercase font-sans tracking-[0.3em] font-bold text-accent mb-2 block">
          Editorial Gallery
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-light text-stone-950 tracking-tight leading-tight">
          Visual Curation
        </h1>
        <p className="text-stone-500 font-sans text-xs md:text-sm max-w-lg mx-auto mt-4 leading-relaxed font-light">
          A purely visual journal of styling setups, fine-grained details, and lifestyle concepts from our sourcing diaries.
        </p>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance]" id="gallery_masonry_grid">
          {photos.map((photo, index) => (
            <div
              key={photo.id || index}
              onClick={() => setLightboxIndex(index)}
              className="break-inside-avoid relative overflow-hidden rounded-xl border border-stone-200/40 bg-stone-100 group cursor-zoom-in transition-all duration-300 shadow-sm hover:shadow-md"
              id={`gallery_photo_item_${index}`}
            >
              <img
                src={photo.url}
                alt={photo.caption || 'Editorial curation'}
                className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {/* Elegant Caption Overlay on Hover */}
              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 z-10 text-white">
                <span className="text-[9px] uppercase tracking-widest font-bold text-amber-200 mb-1">View Detail</span>
                {photo.caption && (
                  <p className="font-serif italic text-sm md:text-base font-light text-stone-100 leading-snug line-clamp-3">
                    {photo.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Elegant Lightbox Modal */}
      {activePhoto && (
        <div 
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[1000] flex flex-col items-center justify-center p-4 select-none"
          id="gallery_lightbox"
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-stone-900/60 border border-white/10 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-900 transition-all cursor-pointer z-50"
            id="lightbox_close_btn"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Nav: Prev Button */}
          <button
            onClick={handlePrev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-stone-900/60 border border-white/10 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-900 transition-all cursor-pointer z-40"
            id="lightbox_prev_btn"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Active Image and Caption */}
          <div className="max-w-4xl max-h-[75vh] flex flex-col items-center justify-center relative px-10 z-30">
            <img
              src={activePhoto.url}
              alt={activePhoto.caption || 'Active editorial photo'}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[70vh] object-contain rounded shadow-2xl border border-white/5"
              id="lightbox_active_image"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Caption in Cormorant Garamond Italic */}
          {activePhoto.caption && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl text-center mt-6 px-6 z-30"
              id="lightbox_caption_container"
            >
              <p className="font-serif italic font-light text-stone-200 text-lg md:text-2xl tracking-wide leading-relaxed">
                "{activePhoto.caption}"
              </p>
              <p className="text-stone-500 font-mono text-[9px] uppercase tracking-widest mt-2">
                Good Finds Curation • Photo {lightboxIndex + 1} of {photos.length}
              </p>
            </div>
          )}

          {/* Nav: Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-stone-900/60 border border-white/10 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-900 transition-all cursor-pointer z-40"
            id="lightbox_next_btn"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
