import { useState, useRef, useMemo } from 'react';
import { Heart, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { ProductDetailModal } from './ProductDetailModal';
import { CatalogItemEditModal } from './CatalogItemEditModal';
import { formatProductPrice, useCurrency } from '../hooks/useCurrency';
import { ProductPlaceholder } from './ProductPlaceholder';
import WhatsAppIcon from '../assets/icons/WhatsAppIcon';
import ViberIcon from '../assets/icons/ViberIcon';
import MessengerIcon from '../assets/icons/MessengerIcon';
import { buildInquiryText, appendTextParam, getViberHref } from '../utils/inquiryHelpers';
import styles from './ProductCard.module.css';

const BADGE = {
  mint: { label: 'Mint', cls: 'badgeMint' },
  good: { label: 'Good', cls: 'badgeGood' },
  fair: { label: 'Fair', cls: 'badgeFair' },
  new: { label: 'New', cls: 'badgeNew' },
};

const CAT_BG = { bags: ['var(--bg)', 'var(--surface)'], jewelry: ['var(--bg)', 'var(--surface)'] };


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

async function copyInquiryText(item) {
  try {
    await navigator.clipboard.writeText(buildInquiryText(item));
  } catch {
    // Clipboard may be blocked by the browser. The chat/share link should still open.
  }
}

function openContact(event, href, item) {
  event.stopPropagation();
  event.preventDefault();
  if (!href) return;
  copyInquiryText(item);
  window.location.href = href;
}

export function ProductCard({ item, onAddToCart }) {
  const [liked, setLiked] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { getCatalogItemStock, isItemReserved, socialLinks = {}, exchangeRate, setInquiryItem, updateCatalogItem } = useStore();
  const { isAdmin } = useAuth();
  const { currency } = useCurrency();

  const badge = BADGE[item.condition] ?? BADGE.good;
  const [bg1, bg2] = CAT_BG[item.cat] ?? CAT_BG.bags;
  const stock = getCatalogItemStock(item.id);
  const isReserved = isItemReserved(item.id);
  const soldOut = stock <= 0;
  const whatsappHref = appendTextParam(socialLinks.whatsapp, item);
  const viberHref = getViberHref(socialLinks.viber, item);
  const messengerHref = getMessengerHref(socialLinks.messenger || socialLinks.facebook);

  // Extract all photos
  const photos = useMemo(() => {
    const list = [];
    const rawPhotos = [];
    if (Array.isArray(item?.photos)) rawPhotos.push(...item.photos);
    else if (Array.isArray(item?.photoUrls)) rawPhotos.push(...item.photoUrls);
    
    rawPhotos.forEach(p => {
      if (p && typeof p === 'object' && p.url) {
        list.push(p);
      } else if (p && typeof p === 'string') {
        list.push({ url: p, description: '' });
      }
    });

    if (item?.photoUrl && !list.some(p => p.url === item.photoUrl)) {
      list.push({ url: item.photoUrl, description: '' });
    }
    if (item?.photo && !list.some(p => p.url === item.photo)) {
      list.push({ url: item.photo, description: '' });
    }

    return list.filter(p => p.url);
  }, [item]);

  const [activePhoto, setActivePhoto] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState({});
  const [loadedPhotos, setLoadedPhotos] = useState({});
  const carouselRef = useRef(null);

  const visiblePhotos = useMemo(() => {
    return photos.filter((_, idx) => !failedPhotos[idx]);
  }, [photos, failedPhotos]);

  const hasPhoto = visiblePhotos.length > 0;

  const handleScroll = (e) => {
    const container = e.currentTarget;
    if (container.clientWidth > 0) {
      const index = Math.round(container.scrollLeft / container.clientWidth);
      if (index !== activePhoto && index >= 0 && index < visiblePhotos.length) {
        setActivePhoto(index);
      }
    }
  };

  const scrollToIndex = (index) => {
    if (carouselRef.current && carouselRef.current.clientWidth > 0) {
      carouselRef.current.scrollTo({
        left: index * carouselRef.current.clientWidth,
        behavior: 'smooth'
      });
      setActivePhoto(index);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const nextIndex = activePhoto === 0 ? visiblePhotos.length - 1 : activePhoto - 1;
    scrollToIndex(nextIndex);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const nextIndex = activePhoto === visiblePhotos.length - 1 ? 0 : activePhoto + 1;
    scrollToIndex(nextIndex);
  };

  return (
    <>
      <article className={`${styles.card} group`} onClick={() => setDetailOpen(true)} id={`product_card_${item.id}`}>
        <div className={styles.imgWrap} style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2})` }}>
          {hasPhoto ? (
            <>
              <div 
                ref={carouselRef}
                className={styles.carouselContainer} 
                onScroll={handleScroll}
                id={`product_carousel_${item.id}`}
              >
                {visiblePhotos.map((photoObj, index) => {
                  const url = photoObj.url;
                  const desc = photoObj.description;
                  const isLoaded = loadedPhotos[index];
                  return (
                    <div className={styles.carouselSlide} key={`${url}-${index}`}>
                      {!isLoaded && <div className={styles.skeleton} aria-hidden="true" />}
                      <img
                        src={url}
                        alt={`${item.brand} ${item.name} - View ${index + 1}`}
                        className={`${styles.photo} ${isLoaded ? styles.photoLoaded : ''}`}
                        onLoad={() => setLoadedPhotos(prev => ({ ...prev, [index]: true }))}
                        onError={() => setFailedPhotos(prev => ({ ...prev, [index]: true }))}
                        loading="lazy"
                        decoding="async"
                      />
                      {desc && (
                        <div className="absolute bottom-0 left-0 right-0 bg-stone-900/80 backdrop-blur-xs text-white p-2 text-[10px] text-center font-sans tracking-wide leading-tight line-clamp-2 z-10">
                          {desc}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {visiblePhotos.length > 1 && (
                <>
                  <button 
                    type="button" 
                    className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`} 
                    onClick={handlePrev}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={16} strokeWidth={2} />
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.carouselArrow} ${styles.carouselArrowRight}`} 
                    onClick={handleNext}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={16} strokeWidth={2} />
                  </button>

                  <div className={styles.carouselDots}>
                    {visiblePhotos.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`${styles.carouselDot} ${index === activePhoto ? styles.carouselDotActive : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToIndex(index);
                        }}
                        aria-label={`Show view ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <ProductPlaceholder category={item.cat} />
          )}
          <span className={`${styles.badge} ${styles[badge.cls]}`} aria-label={`Condition: ${badge.label}`}>{badge.label}</span>
          <button className={`${styles.wishlist} ${liked ? styles.liked : ''}`} onClick={e => { e.stopPropagation(); setLiked(l => !l); }} aria-label={liked ? 'Remove from wishlist' : 'Save to wishlist'} id={`wishlist_btn_${item.id}`}><Heart size={15} strokeWidth={1.8} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" /></button>

          {(whatsappHref || viberHref || messengerHref) && (
            <div className={styles.contactStack}>
              {whatsappHref && <a className={`${styles.contactBtn} ${styles.whatsappBtn}`} href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={event => { event.stopPropagation(); }} aria-label={`Ask about ${item.name} on WhatsApp`}><WhatsAppIcon size={14} /></a>}
              {viberHref && <a className={`${styles.contactBtn} ${styles.viberBtn}`} href={viberHref} onClick={event => openContact(event, viberHref, item)} aria-label={`Ask about ${item.name} on Viber`}><ViberIcon size={14} /></a>}
              {messengerHref && <a className={`${styles.contactBtn} ${styles.messengerBtn}`} href={messengerHref} target="_blank" rel="noopener noreferrer" onClick={event => { event.stopPropagation(); copyInquiryText(item); }} aria-label={`Ask about ${item.name} on Messenger`}><MessengerIcon size={14} /></a>}
            </div>
          )}
        </div>

        <div className={styles.body}>
          <div className="flex items-center justify-between">
            <p className={styles.brand}>{item.brand}</p>
            {isReserved ? (
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">Temporarily Reserved</span>
            ) : (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${soldOut ? 'text-stone-500 bg-stone-100' : 'text-stone-600 bg-stone-100'}`}>
                {soldOut ? 'Sold out' : `${stock} left`}
              </span>
            )}
          </div>
          <h2 className={styles.name}>{item.name}</h2>
          {item.detail && <p className={styles.detail}>{item.detail}</p>}
          <div className={styles.footer}>
            <div className={styles.pricing}><span className={styles.price}>{formatProductPrice(item, currency, exchangeRate)}</span>{item.orig && <span className={styles.orig}>${(Number(item.orig) || 0).toLocaleString()}</span>}</div>
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-850 text-[#C9A84C] text-[10px] font-sans font-bold uppercase tracking-wider rounded transition-colors border border-stone-800 cursor-pointer"
                  title="Edit listing details (Admin Only)"
                >
                  Edit
                </button>
              )}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setInquiryItem(item); }}
                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-sans font-semibold uppercase tracking-wider rounded transition-colors"
                id={`product_inquire_btn_${item.id}`}
              >
                Inquire
              </button>
              <button id={`add_to_cart_btn_${item.id}`} className={styles.addBtn} onClick={(e) => { e.stopPropagation(); if (!soldOut) onAddToCart(item); }} disabled={soldOut} aria-label={`Add ${item.name} to bag`}><ShoppingBag size={13} strokeWidth={1.8} /></button>
            </div>
          </div>
        </div>
      </article>
      <ProductDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} product={item} onAddToCart={onAddToCart} />
      {isEditing && (
        <CatalogItemEditModal
          item={item}
          onSave={(form) => {
            updateCatalogItem(item.id, form);
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}
