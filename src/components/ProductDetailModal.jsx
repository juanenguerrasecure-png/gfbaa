import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatProductPrice, hasUsdPrice, useCurrency } from '../hooks/useCurrency';
import { PriceToggle } from './PriceToggle';
import styles from './ProductDetailModal.module.css';

const BADGE = {
  mint: { label: 'Mint', cls: 'badgeMint' },
  good: { label: 'Good', cls: 'badgeGood' },
  fair: { label: 'Fair', cls: 'badgeFair' },
  new: { label: 'New', cls: 'badgeNew' },
};

const FALLBACK_EMOJI = { bags: '👜', jewelry: '💍' };

function getPhotos(product) {
  const list = [];
  if (Array.isArray(product?.photos)) list.push(...product.photos);
  if (Array.isArray(product?.photoUrls)) list.push(...product.photoUrls);
  if (product?.photoUrl) list.push(product.photoUrl);
  if (product?.photo) list.push(product.photo);
  return [...new Set(list.filter(Boolean))];
}

function buildInquiryText(product) {
  return `Hi! I'm interested in: ${product.name} by ${product.brand}. Can you tell me more about its availability and condition?`;
}

function appendTextParam(baseUrl, product) {
  if (!baseUrl) return '';
  const url = String(baseUrl).trim();
  if (!url) return '';
  const encoded = encodeURIComponent(buildInquiryText(product));
  return url.includes('?') ? `${url}&text=${encoded}` : `${url}?text=${encoded}`;
}

function getViberHref(baseUrl) {
  if (!baseUrl) return '';
  const url = String(baseUrl).trim();
  if (!url) return '';
  if (url.startsWith('viber://')) return url;
  const digits = url.replace(/[^0-9]/g, '');
  if (digits) return `viber://chat?number=%2B${digits}`;
  return url;
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
    // Clipboard may be blocked by the browser. The chat link should still open.
  }
}

function openContact(event, href, product) {
  event.stopPropagation();
  event.preventDefault();
  if (!href) return;
  copyInquiryText(product);
  window.open(href, '_blank', 'noopener,noreferrer');
}

export function ProductDetailModal({ isOpen, onClose, product, onAddToCart }) {
  const { socialLinks = {}, getCatalogItemStock, exchangeRate } = useStore();
  const { currency } = useCurrency();
  const [activePhoto, setActivePhoto] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const photos = useMemo(() => getPhotos(product), [product]);
  const badge = BADGE[product?.condition] ?? BADGE.good;
  const stock = product ? getCatalogItemStock(product.id) : 0;
  const soldOut = stock <= 0;
  const whatsappHref = product ? appendTextParam(socialLinks?.whatsapp, product) : '';
  const viberHref = product ? getViberHref(socialLinks?.viber) : '';
  const messengerHref = product ? getMessengerHref(socialLinks?.messenger || socialLinks?.facebook) : '';
  const allowUsd = hasUsdPrice(product);
  const displayCurrency = allowUsd ? currency : 'PHP';

  useEffect(() => {
    if (!isOpen) return undefined;
    setActivePhoto(0);
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setActivePhoto(prev => photos.length ? (prev + 1) % photos.length : 0);
      if (event.key === 'ArrowLeft') setActivePhoto(prev => photos.length ? (prev - 1 + photos.length) % photos.length : 0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, photos.length]);

  if (!isOpen || !product) return null;

  const goPrev = () => setActivePhoto(prev => (prev - 1 + photos.length) % photos.length);
  const goNext = () => setActivePhoto(prev => (prev + 1) % photos.length);

  const handleTouchEnd = (event) => {
    if (touchStart === null || photos.length <= 1) return;
    const delta = touchStart - event.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  const handleAdd = () => {
    if (soldOut) return;
    onAddToCart(product);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section className={styles.modal} onClick={event => event.stopPropagation()} aria-modal="true" role="dialog" aria-label={`${product.brand} ${product.name}`}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close product details"><X size={20} /></button>
        <div className={styles.gallery} onTouchStart={event => setTouchStart(event.touches[0].clientX)} onTouchEnd={handleTouchEnd}>
          {photos.length ? <img src={photos[activePhoto]} alt={`${product.brand} ${product.name}`} className={styles.photo} /> : <div className={styles.fallbackPhoto}>{product.emoji || FALLBACK_EMOJI[product.cat] || 'GF'}</div>}
          {photos.length > 1 && <><button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={goPrev} aria-label="Previous photo"><ChevronLeft size={20} /></button><button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={goNext} aria-label="Next photo"><ChevronRight size={20} /></button><div className={styles.dots}>{photos.map((_, index) => <button key={index} type="button" className={`${styles.dot} ${index === activePhoto ? styles.activeDot : ''}`} onClick={() => setActivePhoto(index)} aria-label={`Show photo ${index + 1}`} />)}</div></>}
        </div>
        <div className={styles.infoPanel}>
          <p className={styles.brand}>{product.brand}</p>
          <h2 className={styles.name}>{product.name}</h2>
          <div className={styles.metaRow}><span className={`${styles.badge} ${styles[badge.cls]}`}>{badge.label}</span><span className={styles.category}>{product.cat || 'curation'}</span></div>
          <div className={styles.priceRow}><span className={styles.price}>{formatProductPrice(product, displayCurrency, exchangeRate)}</span><PriceToggle compact allowUsd={allowUsd} /></div>
          <p className={styles.stock}>{soldOut ? 'Sold Out' : `${stock} available`}</p>
          {product.detail && <p className={styles.description}>{product.detail}</p>}
          {product.description && product.description !== product.detail && <p className={styles.description}>{product.description}</p>}
          {product.authenticityNotes && <div className={styles.note}><span>Authenticity Notes</span><p>{product.authenticityNotes}</p></div>}
        </div>
        <div className={styles.actionBar}>
          <button type="button" className={styles.addBtn} onClick={handleAdd} disabled={soldOut}><ShoppingBag size={16} />{soldOut ? 'Sold Out' : 'Add to Cart'}</button>
          {whatsappHref && <a className={`${styles.inquiryBtn} ${styles.whatsAppBtn}`} href={whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
          {viberHref && <a className={`${styles.inquiryBtn} ${styles.viberBtn}`} href={viberHref} target="_blank" rel="noopener noreferrer" onClick={event => openContact(event, viberHref, product)}>Viber</a>}
          {messengerHref && <a className={`${styles.inquiryBtn} ${styles.messengerBtn}`} href={messengerHref} target="_blank" rel="noopener noreferrer" onClick={event => openContact(event, messengerHref, product)}>Messenger</a>}
        </div>
      </section>
    </div>
  );
}
