import { useStore } from '../context/StoreContext';
import { useWishlist } from '../hooks/useWishlist';
import { useCurrency, formatProductPrice } from '../hooks/useCurrency';
import { X, Trash2, ShoppingBag, Heart, ArrowRight } from 'lucide-react';
import styles from './WishlistModal.module.css';

export function WishlistModal({ isOpen, onClose, onAddToCart, showToast }) {
  const { exchangeRate } = useStore();
  const { currency } = useCurrency();
  const { wishlistItems, toggleWishlist } = useWishlist();

  if (!isOpen) return null;

  const handleAddToBag = (item) => {
    onAddToCart(item);
    showToast(`Added ${item.name} to your bag!`);
  };

  return (
    <div className={styles.overlay} onClick={onClose} id="wishlist_modal_overlay">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="wishlist_modal_container">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <Heart size={20} className={styles.heartIcon} fill="#C9A84C" stroke="#C9A84C" />
            <h2 className={styles.title}>Your Saved Wishlist</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close saved items modal">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {wishlistItems.length === 0 ? (
            <div className={styles.emptyState}>
              <Heart size={48} className={styles.emptyIcon} strokeWidth={1} />
              <p className={styles.emptyText}>Your wishlist is currently empty.</p>
              <p className={styles.emptySubtext}>Save your favorite curated vintage & high-end luxury finds to keep track of them here.</p>
              <button className={styles.secondaryBtn} onClick={onClose}>
                <span>Browse the Treasury</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {wishlistItems.map((item) => {
                // Securely extract photos
                const photos = (() => {
                  const list = [];
                  if (Array.isArray(item?.photos)) list.push(...item.photos);
                  if (Array.isArray(item?.photoUrls)) list.push(...item.photoUrls);
                  if (item?.photoUrl) list.push(item.photoUrl);
                  if (item?.photo) list.push(item.photo);
                  return [...new Set(list.filter(Boolean))];
                })();

                return (
                  <div key={item.id} className={styles.wishlistItem} id={`wishlist_item_${item.id}`}>
                    {/* Item Photo Thumbnail */}
                    <div className={styles.itemImageContainer}>
                      {photos.length > 0 ? (
                        <img 
                          src={photos[0]} 
                          alt={`${item.brand || ''} ${item.name}`} 
                          className={styles.itemImage}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={styles.itemEmoji}>{item.emoji || '✨'}</div>
                      )}
                    </div>

                    {/* Item Text Info */}
                    <div className={styles.itemInfo}>
                      <span className={styles.itemBrand}>{item.brand || 'Luxury Piece'}</span>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <div className={styles.metaRow}>
                        <span className={styles.itemCatBadge}>{item.cat}</span>
                        {item.condition && (
                          <span className={styles.itemConditionBadge}>
                            {item.condition === 'mint' || item.condition === 'new' ? 'Mint' : item.condition}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Action Buttons */}
                    <div className={styles.itemActionsWrap}>
                      <span className={styles.itemPrice}>
                        {formatProductPrice(item, currency, exchangeRate)}
                      </span>

                      <div className={styles.buttonGroup}>
                        {/* Add directly to bag */}
                        <button
                          type="button"
                          onClick={() => handleAddToBag(item)}
                          className={styles.addToBagBtn}
                          title="Add to shopping bag"
                        >
                          <ShoppingBag size={14} />
                          <span>Add to Bag</span>
                        </button>

                        {/* Remove from wishlist */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(item.id)}
                          className={styles.removeBtn}
                          title="Remove from wishlist"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
