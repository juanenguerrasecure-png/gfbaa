import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, X, Share2, Check, ShieldCheck, Info, Sparkles, Maximize2, Ruler, Gift, AlertCircle, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { CatalogItemEditModal } from './CatalogItemEditModal';
import { CommentBoard } from './CommentBoard';
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
    barColor: 'bg-[var(--gold)]',
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
  const rawPhotos = [];
  if (Array.isArray(product?.photos)) rawPhotos.push(...product.photos);
  else if (Array.isArray(product?.photoUrls)) rawPhotos.push(...product.photoUrls);
  
  rawPhotos.forEach(p => {
    if (p && typeof p === 'object' && p.url) {
      list.push(p);
    } else if (p && typeof p === 'string') {
      list.push({ url: p, description: '' });
    }
  });

  if (product?.photoUrl && !list.some(p => p.url === product.photoUrl)) {
    list.push({ url: product.photoUrl, description: '' });
  }
  if (product?.photo && !list.some(p => p.url === product.photo)) {
    list.push({ url: product.photo, description: '' });
  }

  return list.filter(p => p.url);
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
  } catch {
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
  const { catalogItems, socialLinks = {}, getCatalogItemStock, isItemReserved, exchangeRate, updateCatalogItem } = useStore();
  const { isAdmin } = useAuth();
  const { currency } = useCurrency();

  const [activePhoto, setActivePhoto] = useState(0);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Reactive lookup to support real-time state synchronization when editing storefront items
  const currentItem = useMemo(() => {
    if (!product) return null;
    return catalogItems.find(c => String(c.id) === String(product.id)) || product;
  }, [catalogItems, product]);

  const photos = useMemo(() => getPhotos(currentItem), [currentItem]);
  const condInfo = useMemo(() => {
    const rawCond = currentItem?.condition?.toLowerCase() || 'good';
    return CONDITION_DATA[rawCond] || CONDITION_DATA.good;
  }, [currentItem?.condition]);

  const stock = currentItem ? getCatalogItemStock(currentItem.id) : 0;
  const isReserved = currentItem ? isItemReserved(currentItem.id) : false;
  const soldOut = stock <= 0;
  const whatsappHref = currentItem ? appendTextParam(socialLinks?.whatsapp, currentItem) : '';
  const viberHref = currentItem ? getViberHref(socialLinks?.viber, currentItem) : '';
  const messengerHref = currentItem ? getMessengerHref(socialLinks?.messenger || socialLinks?.facebook) : '';
  const allowUsd = hasUsdPrice(currentItem);
  const displayCurrency = allowUsd ? currency : 'PHP';

  // Savings / Retail value metrics
  const savingsMetrics = useMemo(() => {
    if (!currentItem || !currentItem.orig || Number(currentItem.orig) <= Number(currentItem.price)) return null;
    const originalPrice = Number(currentItem.orig);
    const sellingPrice = Number(currentItem.price);
    const savingsUSD = originalPrice - sellingPrice;
    const savingsPercent = Math.round((savingsUSD / originalPrice) * 100);
    return {
      savingsUSD,
      savingsPercent,
      originalPrice
    };
  }, [currentItem]);

  // Dynamic parser for luxury-specific attributes to establish trust and scannability
  const luxuryAttributes = useMemo(() => {
    if (!currentItem) return [];
    const text = `${currentItem.brand || ''} ${currentItem.name || ''} ${currentItem.detail || ''} ${currentItem.description || ''}`.toLowerCase();
    
    const attrs = [];

    if (currentItem.cat === 'jewelry') {
      // Metal purity
      let purity = '18K Gold';
      if (text.includes('24k') || text.includes('24kt')) purity = '24K Gold';
      else if (text.includes('14k') || text.includes('14kt')) purity = '14K Gold';
      else if (text.includes('platinum') || text.includes('pt950')) purity = 'Platinum (Pt950)';
      attrs.push({ label: 'Metal Purity', value: purity });

      // Gemstones
      let gemstone = 'None Detected';
      if (text.includes('diamond')) gemstone = 'Diamond';
      else if (text.includes('emerald')) gemstone = 'Emerald';
      else if (text.includes('ruby')) gemstone = 'Ruby';
      else if (text.includes('sapphire')) gemstone = 'Sapphire';
      else if (text.includes('pearl')) gemstone = 'Pearl';
      if (gemstone !== 'None Detected') {
        attrs.push({ label: 'Primary Gem', value: gemstone });
      }

      // Metal Weight
      const weightMatch = text.match(/(\d+(\.\d+)?)\s*g(ram)?s?/);
      if (weightMatch) {
        attrs.push({ label: 'Approx. Weight', value: `${weightMatch[1]}g` });
      }

      // Vintage hallmarks
      let hallmark = 'Verified Vintage Marks';
      if (text.includes('unmarked') || text.includes('no stamp')) hallmark = 'Acid-Tested Genuine';
      attrs.push({ label: 'Hallmarks', value: hallmark });

    } else {
      // Bags / Accessories
      // Material
      let material = 'Luxury Leather';
      if (text.includes('caviar')) material = 'Caviar Leather';
      else if (text.includes('lambskin')) material = 'Lambskin Leather';
      else if (text.includes('epsom')) material = 'Epsom Leather';
      else if (text.includes('togo')) material = 'Togo Leather';
      else if (text.includes('canvas')) material = 'Monogram Canvas';
      else if (text.includes('suede')) material = 'Premium Suede';
      else if (text.includes('clemence')) material = 'Clemence Leather';
      attrs.push({ label: 'Exterior Material', value: material });

      // Hardware Finish
      let hardware = 'Gold-Tone Finish';
      if (text.includes('silver') || text.includes('palladium') || text.includes('phw')) hardware = 'Palladium/Silver-Tone';
      else if (text.includes('champagne')) hardware = 'Champagne Gold';
      else if (text.includes('ruthenium')) hardware = 'Ruthenium Finish';
      else if (text.includes('antique gold') || text.includes('ghw')) hardware = 'Aged Gold-Tone';
      attrs.push({ label: 'Hardware Finish', value: hardware });

      // Serial Date stamp
      const serialMatch = text.match(/(serial|date|code|series)\s*(number|code)?:\s*([a-z0-9-]+)/i);
      attrs.push({ 
        label: 'Year / Stamp', 
        value: serialMatch ? serialMatch[3].toUpperCase() : 'Authentic Code Intact' 
      });
    }

    // Inclusions
    const inclusions = [];
    if (text.includes('dustbag') || text.includes('dust bag')) inclusions.push('Dustbag');
    if (text.includes('box')) inclusions.push('Original Box');
    if (text.includes('card') || text.includes('certificate')) inclusions.push('Cert. Card');
    if (text.includes('receipt')) inclusions.push('Original Receipt');
    attrs.push({ 
      label: 'Box & Papers', 
      value: inclusions.length > 0 ? inclusions.join(', ') : 'Details in Inquiry' 
    });

    return attrs;
  }, [currentItem]);

  // Dynamic structured luxury specifications parser to support radical trust & scannability
  const structuredSpecs = useMemo(() => {
    if (!currentItem) return null;
    const text = `${currentItem.brand || ''} ${currentItem.name || ''} ${currentItem.detail || ''} ${currentItem.description || ''} ${currentItem.conditionDetails || ''}`.toLowerCase();

    // 1. Material & Metal (Solid 18K Yellow Gold vs. Plated, Leather types)
    let materialStr = '';
    if (currentItem.cat === 'jewelry') {
      if (text.includes('18k') || text.includes('18kt') || text.includes('750')) materialStr = 'Solid 18K Yellow Gold (Official 750 Hallmark)';
      else if (text.includes('24k') || text.includes('24kt')) materialStr = 'Solid 24K Pure Gold';
      else if (text.includes('14k') || text.includes('14kt')) materialStr = 'Solid 14K Gold';
      else if (text.includes('plated') || text.includes('gilt')) materialStr = 'Gold Plated / Fine Gilt Finish';
      else if (text.includes('platinum')) materialStr = 'Solid Platinum (Pt950 Fine Grade)';
      else materialStr = 'Pristine 18K Gold Finish / Premium Vintage Alloy';
    } else {
      if (text.includes('caviar')) materialStr = 'Caviar Pebble-Grained Calfskin Leather';
      else if (text.includes('lambskin')) materialStr = 'Ultra-Luxurious Lambskin Leather';
      else if (text.includes('epsom')) materialStr = 'Epsom Stiff Embossed Calfskin';
      else if (text.includes('togo')) materialStr = 'Togo Natural Veined Calfskin';
      else if (text.includes('clemence')) materialStr = 'Clemence Slouchy Bullclemence Leather';
      else if (text.includes('canvas')) materialStr = 'Classic Monogram Coated Canvas';
      else if (text.includes('suede')) materialStr = 'Genuine Premium Split Suede';
      else if (text.includes('leather')) materialStr = 'Premium Sourced Genuine Leather';
      else materialStr = 'Luxury Fashion Textile / Fine Weave Canvas';
    }

    // 2. Dimensions & Size
    let sizeStr = '';
    const sizeMatches = currentItem.detail?.match(/(size|dimensions|measurements|measure|dim|approx|w\s*x\s*h|width):\s*([^\n.,]+)/i) || 
                        currentItem.description?.match(/(size|dimensions|measurements|measure|dim|approx|w\s*x\s*h|width):\s*([^\n.,]+)/i);
    if (sizeMatches) {
      sizeStr = sizeMatches[2].trim();
    } else {
      const rawDimMatch = `${currentItem.detail || ''} ${currentItem.description || ''}`.match(/(\d+\s*(?:x|by)\s*\d+(?:\s*(?:x|by)\s*\d+)?\s*(?:cm|mm|inches|in)?)/i);
      if (rawDimMatch) {
        sizeStr = `Approx. ${rawDimMatch[1].trim()}`;
      } else {
        const chainMatch = `${currentItem.detail || ''} ${currentItem.description || ''}`.match(/(\d+\s*(?:cm|inches|inch|")\s*(?:chain|length))/i);
        if (chainMatch) {
          sizeStr = `Chain Length: ${chainMatch[1].trim()}`;
        } else {
          sizeStr = currentItem.cat === 'jewelry' ? 'Standard Fine Jewelry Fit' : 'Medium Standard Size';
        }
      }
    }

    // 3. Condition Details & Flaws (Documenting small scratch builds trust)
    let conditionFlaws = [];
    if (text.includes('scratch') || text.includes('scratches')) {
      const match = `${currentItem.detail || ''} ${currentItem.description || ''}`.match(/([^.,\n]*scratch[^.,\n]*)/i);
      conditionFlaws.push(match ? match[1].trim() : 'Microscopic hairline scratches on the polished hardware.');
    }
    if (text.includes('scuff') || text.includes('scuffs') || text.includes('rub') || text.includes('rubbing')) {
      conditionFlaws.push('Extremely faint, localized rubbing at bottom corner edges.');
    }
    if (text.includes('tarnish') || text.includes('tarnishing')) {
      conditionFlaws.push('Delicate vintage tarnish consistent with age (can be polished upon buyer request).');
    }
    if (text.includes('crease') || text.includes('creasing')) {
      conditionFlaws.push('Soft, gentle natural creasing on base leather from storage.');
    }
    if (conditionFlaws.length === 0) {
      conditionFlaws.push('Preserved in excellent vintage shape. No major visual or structural flaws detected.');
    }

    // 4. Inclusions (Original Box, Authenticity card, Dustbag, etc.)
    let inclusions = [];
    if (text.includes('dustbag') || text.includes('dust bag')) inclusions.push('Original Dustbag');
    if (text.includes('box')) inclusions.push('Original Brand Box');
    if (text.includes('card') || text.includes('certificate')) inclusions.push('Authenticity Certificate Card');
    if (text.includes('receipt')) inclusions.push('Original Purchase Receipt Copy');
    
    if (inclusions.length === 0) {
      inclusions.push('Protective Preservation Pouch & Luxury Hardcase Presentation Box');
    }

    return {
      material: materialStr,
      size: sizeStr,
      flaws: conditionFlaws,
      inclusions: inclusions
    };
  }, [currentItem]);

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?product=${currentItem.id}`;
    const shareTitle = `${currentItem.brand || 'Luxury Find'} - ${currentItem.name}`;
    const shareText = `Check out this vintage preloved curation: ${currentItem.brand || ''} ${currentItem.name} on Good Finds by AA!`;

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

  if (!currentItem) return null;

  const goPrev = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setActivePhoto(prev => (prev - 1 + photos.length) % photos.length);
  };
  const goNext = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setActivePhoto(prev => (prev + 1) % photos.length);
  };

  const handleAdd = () => {
    if (soldOut) return;
    onAddToCart(currentItem);
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
              className="relative w-full h-[94vh] md:h-[80vh] md:max-h-[720px] md:min-h-[580px] md:max-w-4xl bg-[var(--surface)] md:rounded-2xl shadow-2xl flex flex-col md:grid md:grid-cols-12 overflow-hidden cursor-default select-text border-t md:border border-[var(--border)]/80"
              aria-modal="true"
              role="dialog"
              aria-label={`${currentItem.brand} ${currentItem.name}`}
            >
              {/* Floating Close Button */}
              <button
                type="button"
                className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--text-primary)] hover:opacity-85 shadow-sm transition-all cursor-pointer"
                onClick={onClose}
                aria-label="Close product details"
              >
                <X size={18} />
              </button>

              {/* Mobile Swipe-Down Cue Indicator */}
              <div className="flex md:hidden w-full justify-center pt-2.5 pb-1 bg-[var(--bg)]/50 border-b border-[var(--border)]/40">
                <div className="w-12 h-1 bg-[var(--border)] rounded-full" />
              </div>

              {/* Left Column: Media Gallery */}
              <div className="md:col-span-7 flex flex-col bg-[var(--bg)] border-r border-[var(--border)]/40 select-none relative h-[40vh] md:h-full min-h-[300px] md:min-h-0">
                {/* Main Image Viewer */}
                <div
                  className="relative flex-1 flex items-center justify-center overflow-hidden bg-[var(--border)]/30 group cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  {photos.length ? (
                    <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={activePhoto}
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
                              goNext(event);
                            } else if (info.offset.x > swipeThreshold) {
                              goPrev(event);
                            }
                          }}
                          className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none absolute inset-0"
                        >
                          <img
                            src={photos[activePhoto]?.url}
                            alt={`${currentItem.brand} ${currentItem.name}`}
                            className="w-full h-full object-contain p-4 pointer-events-none"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-[var(--surface)] flex items-center justify-center">
                      <ProductPlaceholder category={currentItem.cat} />
                    </div>
                  )}

                  {/* Photo description */}
                  {photos[activePhoto]?.description && (
                    <div className="absolute bottom-12 left-3 right-3 bg-[var(--btn-primary-bg)]/90 text-[var(--btn-primary-fg)] text-xs font-sans tracking-wide leading-relaxed px-4 py-2.5 rounded-lg border border-[var(--border)]/30 backdrop-blur-md shadow-md z-10 select-text">
                      <p className="font-medium text-[10px] uppercase tracking-wider text-[var(--gold)] mb-0.5">Photo Detail</p>
                      <p className="font-light">{photos[activePhoto].description}</p>
                    </div>
                  )}

                  {/* High-Res indicator tag */}
                  <div className="absolute bottom-3 right-3 bg-[var(--btn-primary-bg)]/75 text-[var(--btn-primary-fg)] text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1 rounded backdrop-blur-sm pointer-events-none flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={10} /> High-Res View
                  </div>

                  {/* Left & Right Chevrons */}
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--text-primary)] hover:opacity-90 shadow-sm transition-all cursor-pointer z-10"
                        onClick={goPrev}
                        aria-label="Previous photo"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--text-primary)] hover:opacity-90 shadow-sm transition-all cursor-pointer z-10"
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
                  <div className="flex gap-2 p-3 overflow-x-auto bg-[var(--surface)]/40 border-t border-[var(--border)]/40 justify-center select-none scrollbar-none">
                    {photos.map((photo, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActivePhoto(index); }}
                        className={`w-12 h-12 rounded overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${index === activePhoto ? 'border-[var(--gold)] scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        aria-label={`Show photo ${index + 1}`}
                      >
                        <img src={photo.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Information Panel */}
              <div className="md:col-span-5 flex flex-col flex-1 min-h-0 md:h-full overflow-hidden relative">
                <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                  {/* Brand & Category Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[var(--text-secondary)] block mb-1">
                        {currentItem.brand || 'Luxury Find'}
                      </span>
                      <h2 className="font-serif font-light text-[var(--text-primary)] text-2xl md:text-3xl leading-tight tracking-tight">
                        {currentItem.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]/50">
                          {currentItem.cat || 'Curation'}
                        </span>
                        <span className={`text-[9px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${condInfo.borderColor} ${condInfo.bgColor} ${condInfo.textColor}`}>
                          {condInfo.label}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 bg-[var(--gold)] hover:opacity-90 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-lg transition-colors shadow-2xs cursor-pointer select-none"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {/* Pricing and Original MSRP Block */}
                  <div className="bg-[var(--surface)] border border-[var(--border)]/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]/80 block mb-0.5">Current Pricing</span>
                        <span className="font-sans font-bold text-2xl text-[var(--text-primary)]">
                          {formatProductPrice(currentItem, displayCurrency, exchangeRate)}
                        </span>
                      </div>
                      <PriceToggle compact allowUsd={allowUsd} />
                    </div>

                    {/* MSRP Comparison Savings */}
                    {savingsMetrics && (
                      <div className="border-t border-[var(--border)]/60 pt-2.5 mt-2 flex flex-col gap-1 text-[11px]">
                        <div className="flex justify-between text-[var(--text-secondary)]">
                          <span>Original Retail (MSRP)</span>
                          <span className="line-through">${savingsMetrics.originalPrice.toLocaleString()} USD</span>
                        </div>
                        <div className="flex justify-between text-[var(--text-primary)] font-semibold bg-[var(--bg)] px-2 py-1.5 rounded border border-[var(--border)]/60 mt-1">
                          <span className="text-[var(--text-primary)] flex items-center gap-1"><Sparkles size={11} className="text-[var(--gold)]" /> Preloved Gain</span>
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
                    <span className="font-sans font-semibold text-[var(--text-secondary)]">
                      {soldOut ? 'Sold Out / Archive' : `${stock} authentic curations available`}
                    </span>
                  </div>

                  {/* Premium Condition Preservation Report */}
                  <div className="border border-[var(--border)] bg-[var(--surface)] p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/30">
                      <div className="flex items-center gap-1.5">
                        <Info size={13} className="text-[var(--text-secondary)]" />
                        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[var(--text-primary)]">Curation Preservation Report</span>
                      </div>
                      <span className="text-xs font-serif font-semibold italic text-[var(--text-secondary)]">Tier {condInfo.grade}</span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Metric bar */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[var(--text-secondary)] mb-1">
                          <span>Quality Condition Rating</span>
                          <span className="font-mono font-bold text-[var(--text-primary)]">{condInfo.grade} / 10</span>
                        </div>
                        <div className="w-full bg-[var(--bg)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]/30">
                          <div className={`h-full rounded-full transition-all duration-700 ${condInfo.barColor}`} style={{ width: `${Number(condInfo.grade) * 10}%` }} />
                        </div>
                      </div>

                      {/* Summary explanation */}
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans italic bg-[var(--bg)]/50 p-2.5 rounded border border-[var(--border)]/30">
                        "{condInfo.meaning}"
                      </p>
                    </div>
                  </div>

                   {/* Structured Luxury Specs Grid */}
                  {luxuryAttributes && luxuryAttributes.length > 0 && (
                    <div className="space-y-2" id="detail_modal_luxury_specs">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)]/80">Luxury Specifications</h4>
                      <div className="grid grid-cols-2 gap-3 bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border)]/50 shadow-3xs">
                        {luxuryAttributes.map((attr, idx) => (
                          <div key={idx} className="bg-[var(--bg)]/50 p-2.5 rounded-lg border border-[var(--border)]/30 space-y-0.5">
                            <span className="text-[9px] uppercase font-sans tracking-wider text-[var(--text-secondary)]/80 block">{attr.label}</span>
                            <span className="text-[11px] font-semibold text-[var(--text-primary)] leading-snug break-words">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Curator Transparency & Specs Breakdown */}
                  {structuredSpecs && (
                    <div className="space-y-3" id="detail_modal_curator_transparency">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)]/80">Transparency Report</h4>
                      
                      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)]/50 p-4 space-y-3.5 shadow-3xs">
                        {/* 1. Material */}
                        <div className="flex gap-3 items-start">
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg)] border border-[var(--border)]/35 text-[var(--gold)] flex items-center justify-center shrink-0 mt-0.5">
                            <Award size={13} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-secondary)]/80 block font-sans">Material & Composition</span>
                            <p className="text-[11px] text-[var(--text-primary)] leading-relaxed font-sans font-medium">{structuredSpecs.material}</p>
                          </div>
                        </div>

                        {/* 2. Dimensions */}
                        <div className="flex gap-3 items-start border-t border-[var(--border)]/30 pt-3">
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg)] border border-[var(--border)]/35 text-[var(--gold)] flex items-center justify-center shrink-0 mt-0.5">
                            <Ruler size={13} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-secondary)]/80 block font-sans">Dimensions & Sizing</span>
                            <p className="text-[11px] text-[var(--text-primary)] leading-relaxed font-sans font-medium">{structuredSpecs.size}</p>
                          </div>
                        </div>

                        {/* 3. Inclusions */}
                        <div className="flex gap-3 items-start border-t border-[var(--border)]/30 pt-3">
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg)] border border-[var(--border)]/35 text-[var(--gold)] flex items-center justify-center shrink-0 mt-0.5">
                            <Gift size={13} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-secondary)]/80 block font-sans">Included Accessories</span>
                            <p className="text-[11px] text-[var(--text-primary)] leading-relaxed font-sans font-medium">{structuredSpecs.inclusions.join(', ')}</p>
                          </div>
                        </div>

                        {/* 4. Condition Flaws & Wear */}
                        <div className="flex gap-3 items-start border-t border-[var(--border)]/30 pt-3">
                          <div className="w-7 h-7 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle size={13} />
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--gold)]/90 block font-sans">Honest Condition Disclosures</span>
                            <ul className="space-y-1 list-none p-0 m-0">
                              {structuredSpecs.flaws.map((flaw, fIdx) => (
                                <li key={fIdx} className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans flex items-start gap-1.5">
                                  <span className="text-[var(--gold)] shrink-0 mt-1">•</span>
                                  <span>{flaw}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Public Listing Details & Notes */}
                  {(currentItem.detail || currentItem.description) && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)]/80">Curation Background & Legacy</h4>
                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2 font-sans font-light bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]/40">
                        {currentItem.detail && <p className="font-normal text-[var(--text-primary)] whitespace-pre-line">{currentItem.detail}</p>}
                        {currentItem.description && currentItem.description !== currentItem.detail && (
                          <p className="border-t border-[var(--border)]/40 pt-2 text-[var(--text-secondary)] whitespace-pre-line">{currentItem.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Authenticity notes & In-House Certified Guarantee */}
                  <div className="bg-[var(--surface)] border-l-4 border-[var(--gold)] p-4 rounded-r-xl space-y-1.5 shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-primary)] flex items-center gap-1">
                      <ShieldCheck size={13} className="text-[var(--gold)]" /> Authenticity Assured
                    </span>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                      Each curated item undergoes a meticulous dual-verifier authentication process. Verified genuine. Unconditional authenticity guarantee.
                    </p>
                    {currentItem.authenticityNotes && (
                      <p className="text-[11px] text-[var(--text-secondary)] italic border-t border-[var(--border)]/60 pt-1.5 mt-1.5">
                        <strong className="text-[var(--text-primary)] not-italic block text-[9px] uppercase tracking-wider mb-0.5">Verification Notes:</strong>
                        {currentItem.authenticityNotes}
                      </p>
                    )}
                  </div>

                  {/* Comment Board for Active Curation / Catalog Item */}
                  {currentItem && (
                    <CommentBoard itemId={currentItem.id} itemType="catalog_item" />
                  )}
                </div>

                {/* Fixed Bottom Action Panel */}
                <div className="w-full flex flex-col gap-2.5 p-4 border-t border-[var(--border)]/80 bg-[var(--surface)]/96 backdrop-blur-sm z-20 shadow-[0_-8px_20px_rgba(10,8,6,0.06)] pb-safe">
                  {/* Buy / Inquire actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={soldOut || isReserved}
                      className={`flex-1 min-h-[48px] rounded-lg inline-flex items-center justify-center gap-2 font-sans text-xs font-bold uppercase tracking-widest cursor-pointer transition-all shadow-sm active:scale-98 ${isReserved ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30 disabled:opacity-100 cursor-not-allowed' : 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                      id="modal_add_to_cart_btn"
                    >
                      <ShoppingBag size={14} />
                      {isReserved ? 'Temporarily Reserved' : soldOut ? 'Sold Out' : 'Add to Bag'}
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className={`px-5 min-h-[48px] rounded-lg inline-flex items-center justify-center gap-1.5 font-sans text-xs font-bold uppercase tracking-widest border border-[var(--border)] cursor-pointer transition-all active:scale-98 ${shareSuccess ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-[var(--bg)] text-[var(--text-primary)] hover:opacity-90'}`}
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
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg font-sans text-xs font-bold uppercase tracking-wider bg-[#25D366] hover:brightness-95 transition-all text-stone-950 active:scale-98"
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
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg font-sans text-xs font-bold uppercase tracking-wider bg-[#7360F2] hover:brightness-95 transition-all text-white active:scale-98"
                        href={viberHref}
                        onClick={event => openContact(event, viberHref, currentItem)}
                        aria-label="Inquire via Viber"
                      >
                        <ViberIcon size={14} /> Viber
                      </a>
                    )}
                    {messengerHref && (
                      <a
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg font-sans text-xs font-bold uppercase tracking-wider bg-[#0084FF] hover:brightness-95 transition-all text-white active:scale-98"
                        href={messengerHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => copyInquiryText(currentItem)}
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
                  src={photos[activePhoto]?.url}
                  alt={`${currentItem.brand} ${currentItem.name} High-Res`}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-stone-400 font-mono text-xs bg-stone-900/80 px-4 py-1.5 rounded-full border border-stone-800/50 shadow-md">
                  Photo {activePhoto + 1} of {photos.length} • Click anywhere to return
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isEditing && (
            <CatalogItemEditModal
              item={currentItem}
              onSave={(form) => {
                updateCatalogItem(currentItem.id, form);
                setIsEditing(false);
              }}
              onClose={() => setIsEditing(false)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
