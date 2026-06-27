import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Award, ZoomIn } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const COND_DETAILS = {
  mint: { label: 'Mint Condition', desc: 'Virtually indistinguishable from brand new. Pristine hardware and leather.', cls: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
  good: { label: 'Excellent/Good', desc: 'Lightly carried with minor, barely noticeable signs of wear. Excellent structure.', cls: 'bg-amber-50 text-amber-800 border-amber-100' },
  fair: { label: 'Fair Condition', desc: 'Shows normal signs of pre-loved use. Still fully functional and beautiful.', cls: 'bg-red-50 text-red-800 border-red-100' },
  new:  { label: 'Brand New', desc: 'Never worn or used. Complete with original boutique packaging and tags.', cls: 'bg-amber-50 text-amber-900 border-amber-200 ring-1 ring-amber-300' },
};

const FALLBACK_EMOJI = { bags: '👜', jewelry: '💍' };

export function QuickViewModal({ isOpen, onClose, item, onAddToCart }) {
  const [liked, setLiked] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const { getCatalogItemStock } = useStore();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (zoomMode) {
          setZoomMode(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoomMode]);

  if (!isOpen || !item) return null;

  const stock = getCatalogItemStock(item.id);
  const conditionInfo = COND_DETAILS[item.condition] ?? COND_DETAILS.good;
  const hasPhoto = item.photoUrl && !imgError;
  
  const savedAmount = item.orig ? (Number(item.orig) - Number(item.price)) : 0;
  const savingsPct = item.orig ? Math.round((savedAmount / Number(item.orig)) * 100) : 0;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      id={`quick_view_overlay_${item.id}`}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] border border-[#EAE5DF]"
        id={`quick_view_container_${item.id}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id={`btn_close_quick_view_${item.id}`}
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 rounded-full border border-stone-200 transition-all shadow-sm cursor-pointer"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>

        {/* Left Side: Product Image / Fallback Emojis */}
        <div className="w-full md:w-1/2 relative bg-[#F5EFE6] border-b md:border-b-0 md:border-r border-[#EAE5DF] flex items-center justify-center overflow-hidden aspect-square md:aspect-auto">
          {hasPhoto ? (
            <div className="relative w-full h-full flex items-center justify-center group">
              {!imgLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#EAE5DF] to-[#FAF8F5] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
              )}
              <img
                src={item.photoUrl}
                alt={`${item.brand} ${item.name}`}
                className={`w-full h-full object-cover transition-all duration-500 cursor-zoom-in hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
              
              {/* Image zoom instruction overlay */}
              <button
                id={`btn_zoom_photo_${item.id}`}
                onClick={() => setZoomMode(true)}
                className="absolute bottom-4 right-4 bg-stone-950/75 hover:bg-stone-950 text-white text-[11px] font-medium tracking-wide flex items-center gap-1.5 px-3 py-1.5 rounded backdrop-blur-sm transition-all shadow-lg cursor-pointer"
              >
                <ZoomIn size={12} />
                <span>Enlarge Photo</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <span className="text-8xl select-none filter drop-shadow-md animate-bounce-subtle" aria-hidden="true">
                {item.emoji ?? FALLBACK_EMOJI[item.cat]}
              </span>
              <p className="text-stone-400 text-xs font-medium tracking-wider uppercase mt-4">Pre-loved {item.cat}</p>
            </div>
          )}

          {/* Condition Floating Badge */}
          <span className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-sm border ${conditionInfo.cls}`}>
            {conditionInfo.label}
          </span>
        </div>

        {/* Right Side: Luxury Details Panel */}
        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Header breadcrumb & Meta */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-bold uppercase tracking-widest">
              <span>Collection / {item.cat === 'bags' ? 'Designer Bags' : '18K Jewelry'}</span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono">
                Authentic Piece
              </span>
            </div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-2">
              {item.brand}
            </p>
            <h3 className="font-display font-serif text-2xl md:text-3xl text-stone-900 leading-tight">
              {item.name}
            </h3>
          </div>

          {/* Price details and orig comparison */}
          <div className="py-4 border-y border-[#EAE5DF] flex items-center justify-between">
            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Special Boutique Price</span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-bold text-stone-950 font-sans">
                  ${(Number(item.price) || 0).toLocaleString()}
                </span>
                {item.orig && (
                  <span className="text-stone-400 line-through text-sm">
                    ${(Number(item.orig) || 0).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Savings Badge */}
            {item.orig && savedAmount > 0 && (
              <div className="text-right bg-emerald-50 border border-emerald-100 rounded px-3 py-1.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Savings</span>
                <span className="text-xs font-semibold text-emerald-700">
                  Save ${(savedAmount).toLocaleString()} ({savingsPct}%)
                </span>
              </div>
            )}
          </div>

          {/* Condition description box */}
          <div className="bg-stone-50 rounded border border-stone-200 p-3.5 space-y-1.5">
            <h4 className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={13} className="text-amber-600" />
              Verified {conditionInfo.label}
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              {conditionInfo.desc}
            </p>
          </div>

          {/* Item details */}
          {item.detail && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Product Details</h4>
              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line font-light">
                {item.detail}
              </p>
            </div>
          )}

          {/* Core specs grid */}
          <div className="grid grid-cols-2 gap-3.5 text-xs pt-2">
            <div className="p-2.5 bg-[#FAF8F5] border border-stone-200 rounded flex flex-col gap-0.5">
              <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">Item Category</span>
              <span className="font-semibold text-stone-800 capitalize">{item.cat}</span>
            </div>
            <div className="p-2.5 bg-[#FAF8F5] border border-stone-200 rounded flex flex-col gap-0.5">
              <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">Stock Status</span>
              <span className={`font-semibold ${stock <= 2 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {stock === 1 ? 'Last piece left!' : `${stock} pieces available`}
              </span>
            </div>
          </div>

          {/* Client protection assurances */}
          <div className="grid grid-cols-3 gap-2 py-2 border-t border-stone-200 text-stone-500">
            <div className="flex flex-col items-center text-center gap-1">
              <ShieldCheck size={16} className="text-amber-600" />
              <span className="text-[9px] font-bold tracking-wider uppercase text-stone-700">100% Certified</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <Truck size={16} className="text-amber-600" />
              <span className="text-[9px] font-bold tracking-wider uppercase text-stone-700">Secure Insured</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <RotateCcw size={16} className="text-amber-600" />
              <span className="text-[9px] font-bold tracking-wider uppercase text-stone-700">Luxury Hand-Off</span>
            </div>
          </div>

          {/* Footer controls: Add to Bag and Wishlist */}
          <div className="flex items-center gap-3 pt-4 border-t border-stone-200 mt-auto">
            <button
              id={`btn_wishlist_toggle_${item.id}`}
              onClick={() => setLiked(!liked)}
              className={`p-3 border rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                liked 
                  ? 'bg-amber-50 border-amber-400 text-amber-700' 
                  : 'bg-white border-stone-200 hover:border-stone-400 text-stone-500 hover:text-stone-800'
              }`}
              title={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={16} fill={liked ? '#C9A84C' : 'none'} stroke={liked ? '#C9A84C' : 'currentColor'} />
            </button>

            <button
              id={`btn_quick_view_add_to_cart_${item.id}`}
              onClick={() => {
                onAddToCart(item);
                // We keep modal open or close it. Typically, let's keep it open so they see confirmation toast, but we can also close it. Let's close on success so they see the toast and cart modal.
                onClose();
              }}
              className="flex-1 py-3 px-6 bg-[#1C1410] hover:bg-stone-800 text-white hover:text-amber-50 font-bold uppercase text-xs tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <ShoppingBag size={14} />
              <span>Add to Luxury Bag</span>
            </button>
          </div>

        </div>
      </div>

      {/* High-Resolution Immersive Image Lightbox Portal */}
      {zoomMode && hasPhoto && createPortal(
        <div 
          className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          id={`lightbox_overlay_${item.id}`}
          onClick={() => setZoomMode(false)}
        >
          <button
            id={`btn_close_lightbox_${item.id}`}
            onClick={() => setZoomMode(false)}
            className="absolute top-6 right-6 p-2 bg-stone-900/80 hover:bg-stone-800 text-white hover:text-[#C9A84C] rounded-full border border-stone-700 transition-all cursor-pointer"
            aria-label="Close image zoom"
          >
            <X size={22} />
          </button>
          <div 
            className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={item.photoUrl}
              alt={`${item.brand} ${item.name}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-stone-850 animate-zoom-in"
            />
            <div className="absolute bottom-[-2.5rem] text-center text-stone-400 text-xs font-mono">
              <span className="text-white font-semibold font-sans">{item.brand}</span> {item.name} • Click anywhere to return
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );

  return createPortal(modalContent, document.body);
}
