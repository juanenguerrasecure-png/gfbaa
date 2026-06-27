import { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import styles from './ProductCard.module.css';

const BADGE = {
  mint: { label: 'Mint',  cls: 'badgeMint' },
  good: { label: 'Good',  cls: 'badgeGood' },
  fair: { label: 'Fair',  cls: 'badgeFair' },
  new:  { label: 'New',   cls: 'badgeNew'  },
};

const CAT_BG = {
  bags:    ['#F0E8DF', '#E8DDD3'],
  jewelry: ['#F3EEE8', '#EDE6DC'],
};

const FALLBACK_EMOJI = { bags: '👜', jewelry: '💍' };

export function ProductCard({ item, onAddToCart }) {
  const [liked, setLiked]       = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { getCatalogItemStock } = useStore();

  const badge    = BADGE[item.condition] ?? BADGE.good;
  const [bg1, bg2] = CAT_BG[item.cat] ?? CAT_BG.bags;
  const hasPhoto  = item.photoUrl && !imgError;
  const stock = getCatalogItemStock(item.id);

  return (
    <article className={styles.card}>
      {/* Image area */}
      <div className={styles.imgWrap} style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2})` }}>
        {hasPhoto ? (
          <>
            {!imgLoaded && <div className={styles.skeleton} aria-hidden="true" />}
            <img
              src={item.photoUrl}
              alt={`${item.brand} ${item.name}`}
              className={`${styles.photo} ${imgLoaded ? styles.photoLoaded : ''}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
            />
          </>
        ) : (
          <span className={styles.emoji} aria-hidden="true">
            {item.emoji ?? FALLBACK_EMOJI[item.cat]}
          </span>
        )}

        {/* Condition badge */}
        <span className={`${styles.badge} ${styles[badge.cls]}`} aria-label={`Condition: ${badge.label}`}>
          {badge.label}
        </span>

        {/* Wishlist */}
        <button
          className={`${styles.wishlist} ${liked ? styles.liked : ''}`}
          onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
          aria-label={liked ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={15}
            strokeWidth={1.8}
            fill={liked ? '#C9A84C' : 'none'}
            stroke={liked ? '#C9A84C' : 'currentColor'}
          />
        </button>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className="flex items-center justify-between">
          <p className={styles.brand}>{item.brand}</p>
          <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
            {stock} left
          </span>
        </div>
        <h2 className={styles.name}>{item.name}</h2>
        {item.detail && <p className={styles.detail}>{item.detail}</p>}

        <div className={styles.footer}>
          <div className={styles.pricing}>
            <span className={styles.price}>${(Number(item.price) || 0).toLocaleString()}</span>
            {item.orig && (
              <span className={styles.orig}>${(Number(item.orig) || 0).toLocaleString()}</span>
            )}
          </div>
          <button
            className={styles.addBtn}
            onClick={() => onAddToCart(item)}
            aria-label={`Add ${item.name} to bag`}
          >
            <ShoppingBag size={13} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </article>
  );
}
