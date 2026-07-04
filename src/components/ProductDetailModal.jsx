import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, X, Share2, Check, ShieldCheck, Info, Sparkles, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { formatProductPrice, hasUsdPrice, useCurrency } from '../hooks/useCurrency';
import { PriceToggle } from './PriceToggle';
import { ProductPlaceholder } from './ProductPlaceholder';
import WhatsAppIcon from '../assets/icons/WhatsAppIcon';
import ViberIcon from '../assets/icons/ViberIcon';
import MessengerIcon from '../assets/icons/MessengerIcon';
import { buildInquiryText, appendTextParam, getViberHref } from '../utils/inquiryHelpers';

const CONDITION_DATA = {
  new: {
    label: 'Brand New',
    grade: '10',
    meaning: 'Pristine, unused condition. Complete with original tags and packaging, showing zero signs of handling.',
    textColor: 'text-emerald-800',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    barColor: 'bg-emerald-600',
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  mint: {
    label: 'Mint / Like New',
    grade: '9.5',
    meaning: 'Outstanding preservation. Retains full original luster and structure, with no perceptible signs of wear.',
    textColor: 'text-teal-800',
    bgColor: 'bg-teal-50/50',
    borderColor: 'border-teal-200/80',
    barColor: 'bg-teal-600',
    badgeCls: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  good: {
    label: 'Very Good',
    grade: '8.5',
    meaning: 'Carefully preserved. Shows very light, isolated surface wear from limited use. Full structural integrity with clean interior.',
    textColor: 'text-amber-800',
    bgColor: 'bg-amber-50/50',
    borderColor: 'border-amber-200/80',
    barColor: 'bg-[#C9A84C]',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  fair: {
    label: 'Fair / Preloved',
    grade: '7.0',
    meaning: 'Visible signs of classic preloved wear or patina. Structurally robust and fully functional with timeless vintage character.',
    textColor: 'text-rose-800',
    bgColor: 'bg-rose-50/50',
    borderColor: 'border-rose-200/80',
    barColor: 'bg-rose-600',
    badgeCls: 'bg-rose-100 text-rose-800 border-rose-300'
  }
};

function getPhotos(product) {
  const list = [];
  if (Array.isArray(product?.photos)) list.push(...product.photos);
  if (Array.isArray(product?.photoUrls)) list.push(...product.photoUrls);
  if (product?.photoUrl) list.push(product.photoUrl);
  if (product?.photo) list.push(product.photo);
  return [...new Set(list.filter(Boolean))];
}

function getMessengerHref(baseUrl) {
  if (!baseUrl) return '';
  const url = String(baseUrl).trim();
  if (!url) return '';
  if (url.includes('m.me/')) return url;
  const clean = url.replace(/\/$/, '');
  const page = clean.split('/').filter(Boolean).pop();
  if (page && !page.includes('.')) return `https://m.me/${page}`;
  return url;
}

async function copyInquiryText(product) {
  try {
    await navigator.clipboard.writeText(buildInquiryText(product));
  } catch (_error) {
    // Clipboard may be blocked by the browser. The chat/share link should still open.
  }
}

function openContact(event, href, product) {
  event.stopPropagation();
  event.preventDefault();
  if (!href) return;
  copyInquiryText(product);
  window.location.href = href;
}

export function ProductDetailModal({ isOpen, onClose, product, onAddToCart }) {
  const { socialLinks = {}, getCatalogItemStock, exchangeRate } = useStore();
  const { currency } = useCurrency();
  const [activePhoto, setActivePhoto] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const photos = useMemo(() => getPhotos(product), [product]);
  const condInfo = useMemo(() => {
    const rawCond = product?.condition?.toLowerCase() || 'good';
    return CONDITION_DATA[rawCond] || CONDITION_DATA.good;
  }, [product?.condition]);

  const stock = product ? getCatalogItemStock(product.id) : 0;
  const soldOut = stock <= 0;
  const whatsappHref = product ? appendTextParam(socialLinks?.whatsapp, product) : '';
  const viberHref = product ? getViberHref(socialLinks?.viber, product) : '';
  const messengerHref = product ? getMessengerHref(socialLinks?.messenger || socialLinks?.facebook) : '';
  const allowUsd = hasUsdPrice(product);
  const displayCurrency = allowUsd ? currency : 'PHP';

  // Savings / Retail value metrics
  const savingsMetrics = useMemo(() => {
    if (!product || !product.orig || Number(product.orig) <= Number(product.price)) return null;
    const originalPrice = Number(product.orig);
    const sellingPrice = Number(product.price);
    const savingsUSD = originalPrice - sellingPrice;
    const savingsPercent = Math.round((savingsUSD / originalPrice) * 100);
    return {
      savingsUSD,
      savingsPercent,
      originalPrice
    };
  }, [product]);

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?product=${product.id}`;
    const shareTitle = `${product.brand || 'Luxury Find'} - ${product.name}`;
    const shareText = `Check out this vintage preloved curation: ${product.brand || ''} ${product.name} on Good Finds by AA!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboardFallback(shareUrl);
        }
      }
    } else {
      copyToClipboardFallback(shareUrl);
    }
  };

  const copyToClipboardFallback = (url) => {
    try {
      navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    setActivePhoto(0);
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose();
        }
      }
      if (event.key === 'ArrowRight') {
        setActivePhoto(prev => photos.length ? (prev + 1) % photos.length : 0);
      }
      if (event.key === 'ArrowLeft') {
        setActivePhoto(prev => photos.length ? (prev - 1 + photos.length) % photos.length : 0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, photos.length, isLightboxOpen]);

  // Lock background scroll when modal is open
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

  if (!product) return null;

  const goPrev = (e) => {
    e.stopPropagation();
    setActivePhoto(prev => (prev - 1 + photos.length) % photos.length);
  };
  const goNext = (e) => {
    e.stopPropagation();
    setActivePhoto(prev => (prev + 1) % photos.length);
  };

  const handleTouchEnd = (event) => {
    if (touchStart === null || photos.length <= 1) return;
    const delta = touchStart - event.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) goNext(event);
      else goPrev(event);
    }
    setTouchStart(null);
  };

  const handleAdd = () => {
    if (soldOut) return;
    onAddToCart(product);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-stone-950/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 cursor-pointer"
          >
            {/* Modal Body Container */}
            <motion.section
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              onClick={event => event.stopPropagation()}
              className="relative w-full h-[94vh] md:h-auto md:max-h-[90vh] md:max-w-4xl bg-[#FAF8F5] md:rounded-2xl shadow-2xl flex flex-col md:grid md:grid-cols-12 overflow-hidden cursor-default select-text border-t md:border border-stone-200/80"
              aria-modal="true"
              role="dialog"
              aria-label={`${product.brand} ${product.name}`}
            >
              {/* Floating Close Button */}
              <button
                type="button"
                className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 bg-[#FAF8F5]/90 text-stone-800 hover:bg-stone-100 hover:text-stone-950 shadow-sm transition-all cursor-pointer"
                onClick={onClose}
                aria-label="Close product details"
              >
                <X size={18} />
              </button>

              {/* Mobile Swipe-Down Cue Indicator */}
              <div className="flex md:hidden w-full justify-center pt-2.5 pb-1 bg-stone-100/50 border-b border-stone-200/40">
                <div className="w-12 h-1 bg-stone-300 rounded-full" />
              </div>

              {/* Left Column: Media Gallery */}
              <div className="md:col-span-7 flex flex-col bg-[#F3ECE5] border-r border-stone-200/40 select-none relative h-[40vh] md:h-full min-h-[300px] md:min-h-[520px]">
                {/* Main Image Viewer */}
                <div
                  className="relative flex-1 flex items-center justify-center overflow-hidden bg-stone-200/50 group cursor-zoom-in"
                  onTouchStart={event => setTouchStart(event.touches[0].clientX)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => setIsLightboxOpen(true)}
                >
                  {photos.length ? (
                    <img
                      src={photos[activePhoto]}
                      alt={`${product.brand} ${product.name}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-stone-100 flex items-center justify-center">
                      <ProductPlaceholder category={product.cat} />
                    </div>
                  )}

                  {/* High-Res indicator tag */}
                  <div className="absolute bottom-3 right-3 bg-stone-900/75 text-white text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1 rounded backdrop-blur-sm pointer-events-none flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={10} /> High-Res View
                  </div>

                  {/* Left & Right Chevrons */}
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 bg-[#FAF8F5]/90 text-stone-800 hover:bg-stone-50 shadow-sm transition-all cursor-pointer z-10"
                        onClick={goPrev}
                        aria-label="Previous photo"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 bg-[#FAF8F5]/90 text-stone-800 hover:bg-stone-50 shadow-sm transition-all cursor-pointer z-10"
                        onClick={goNext}
                        aria-label="Next photo"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>

                {/* Aesthetic Thumbnail Strip */}
                {photos.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-[#FAF8F5]/40 border-t border-stone-200/40 justify-center select-none scrollbar-none">
                    {photos.map((photo, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActivePhoto(index); }}
                        className={`w-12 h-12 rounded overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${index === activePhoto ? 'border-[#C9A84C] scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        aria-label={`Show photo ${index + 1}`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Information Panel */}
              <div className="md:col-span-5 flex flex-col h-[calc(54vh-36px)] md:h-full overflow-y-auto">
                <div className="p-6 md:p-8 space-y-6 pb-24 md:pb-8 flex-1">
                  {/* Brand & Category Header */}
                  <div>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C7B6E] block mb-1">
                      {product.brand || 'Luxury Find'}
                    </span>
                    <h2 className="font-serif font-light text-stone-900 text-2xl md:text-3xl leading-tight tracking-tight">
                      {product.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/50">
                        {product.cat || 'Curation'}
                      </span>
                      <span className={`text-[9px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${condInfo.borderColor} ${condInfo.bgColor} ${condInfo.textColor}`}>
                        {condInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Pricing and Original MSRP Block */}
                  <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-0.5">Current Pricing</span>
                        <span className="font-sans font-bold text-2xl text-stone-950">
                          {formatProductPrice(product, displayCurrency, exchangeRate)}
                        </span>
                      </div>
                      <PriceToggle compact allowUsd={allowUsd} />
                    </div>

                    {/* MSRP Comparison Savings */}
                    {savingsMetrics && (
                      <div className="border-t border-stone-200/60 pt-2.5 mt-2 flex flex-col gap-1 text-[11px]">
                        <div className="flex justify-between text-stone-500">
                          <span>Original Retail (MSRP)</span>
                          <span className="line-through">${savingsMetrics.originalPrice.toLocaleString()} USD</span>
                        </div>
                        <div className="flex justify-between text-stone-900 font-semibold bg-[#FAF8F5] px-2 py-1.5 rounded border border-[#E5DFD8]/60 mt-1">
                          <span className="text-stone-700 flex items-center gap-1"><Sparkles size={11} className="text-[#C9A84C]" /> Preloved Gain</span>
                          <span className="text-emerald-700 font-mono">
                            Save ${savingsMetrics.savingsUSD.toLocaleString()} USD ({savingsMetrics.savingsPercent}% Off)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stock Status Notification */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${soldOut ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="font-sans font-semibold text-stone-600">
                      {soldOut ? 'Sold Out / Archive' : `${stock} authentic curations available`}
                    </span>
                  </div>

                  {/* Premium Condition Preservation Report */}
                  <div className="border border-stone-200/80 bg-white p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-1.5">
                        <Info size={13} className="text-[#8C7B6E]" />
                        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-700">Curation Preservation Report</span>
                      </div>
                      <span className="text-xs font-serif font-semibold italic text-stone-500">Tier {condInfo.grade}</span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Metric bar */}
                      <div>
                        <div className="flex justify-between text-[11px] text-stone-500 mb-1">
                          <span>Quality Condition Rating</span>
                          <span className="font-mono font-bold text-stone-900">{condInfo.grade} / 10</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden border border-stone-200/30">
                          <div className={`h-full rounded-full transition-all duration-700 ${condInfo.barColor}`} style={{ width: `${Number(condInfo.grade) * 10}%` }} />
                        </div>
                      </div>

                      {/* Summary explanation */}
                      <p className="text-xs text-stone-600 leading-relaxed font-sans italic bg-stone-50/50 p-2.5 rounded border border-stone-100">
                        "{condInfo.meaning}"
                      </p>
                    </div>
                  </div>

                  {/* Public Listing Details & Notes */}
                  {(product.detail || product.description) && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Specifications & Description</h4>
                      <div className="text-xs text-stone-600 leading-relaxed space-y-2 font-sans font-light bg-[#FAF8F5] p-4 rounded-xl border border-stone-200/40">
                        {product.detail && <p className="font-normal text-stone-800 whitespace-pre-line">{product.detail}</p>}
                        {product.description && product.description !== product.detail && (
                          <p className="border-t border-stone-200/40 pt-2 text-stone-500 whitespace-pre-line">{product.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Authenticity notes & In-House Certified Guarantee */}
                  <div className="bg-[#FAF8F5] border-l-4 border-[#C9A84C] p-4 rounded-r-xl space-y-1.5 shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-700 flex items-center gap-1">
                      <ShieldCheck size={13} className="text-[#C9A84C]" /> Authenticity Assured
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                      Each curated item undergoes a meticulous dual-verifier authentication process. Verified genuine. Unconditional authenticity guarantee.
                    </p>
                    {product.authenticityNotes && (
                      <p className="text-[11px] text-stone-500 italic border-t border-stone-200/60 pt-1.5 mt-1.5">
                        <strong className="text-stone-700 not-italic block text-[9px] uppercase tracking-wider mb-0.5">Verification Notes:</strong>
                        {product.authenticityNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fixed Bottom Action Panel */}
                <div className="absolute bottom-0 right-0 left-0 md:left-auto md:width-full md:col-span-5 flex flex-col gap-2 p-4 border-t border-stone-200/80 bg-[#FAF8F5]/96 backdrop-blur-sm z-20 shadow-[0_-8px_20px_rgba(10,8,6,0.06)]">
                  {/* Buy / Inquire actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={soldOut}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 bg-stone-950 text-white font-sans text-[11px] font-bold uppercase tracking-widest cursor-pointer hover:bg-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      id="modal_add_to_cart_btn"
                    >
                      <ShoppingBag size={14} />
                      {soldOut ? 'Sold Out' : 'Add to Bag'}
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className={`px-4 min-h-[44px] inline-flex items-center justify-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-widest border border-stone-200 cursor-pointer transition-all ${shareSuccess ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-800 hover:bg-stone-50'}`}
                      id="modal_share_btn"
                    >
                      {shareSuccess ? <Check size={14} /> : <Share2 size={14} />}
                      {shareSuccess ? 'Copied' : 'Share'}
                    </button>
                  </div>

                  {/* Direct Instant Chat Inquiries */}
                  <div className="flex gap-2 text-white">
                    {whatsappHref && (
                      <a
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-md font-sans text-[10px] font-bold uppercase tracking-wider bg-[#25D366] hover:brightness-95 transition-all text-stone-950"
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Inquire via WhatsApp"
                      >
                        <WhatsAppIcon size={14} /> WhatsApp
                      </a>
                    )}
                    {viberHref && (
                      <a
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-md font-sans text-[10px] font-bold uppercase tracking-wider bg-[#7360F2] hover:brightness-95 transition-all text-white"
                        href={viberHref}
                        onClick={event => openContact(event, viberHref, product)}
                        aria-label="Inquire via Viber"
                      >
                        <ViberIcon size={14} /> Viber
                      </a>
                    )}
                    {messengerHref && (
                      <a
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-md font-sans text-[10px] font-bold uppercase tracking-wider bg-[#0084FF] hover:brightness-95 transition-all text-white"
                        href={messengerHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => copyInquiryText(product)}
                        aria-label="Inquire via Messenger"
                      >
                        <MessengerIcon size={14} /> Messenger
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          </motion.div>

          {/* High-Resolution Zoom Lightbox Portal */}
          <AnimatePresence>
            {isLightboxOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsLightboxOpen(false)}
                className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 cursor-zoom-out select-none"
              >
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="absolute top-4 right-4 z-[210] w-10 h-10 flex items-center justify-center rounded-full bg-stone-900/80 border border-stone-800 text-stone-200 hover:text-white transition-all shadow-lg cursor-pointer"
                  aria-label="Close zoomed view"
                >
                  <X size={20} />
                </button>
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25 }}
                  src={photos[activePhoto]}
                  alt={`${product.brand} ${product.name} High-Res`}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-stone-400 font-mono text-xs bg-stone-900/80 px-4 py-1.5 rounded-full border border-stone-800/50 shadow-md">
                  Photo {activePhoto + 1} of {photos.length} • Click anywhere to return
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
