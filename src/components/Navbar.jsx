import { ShoppingBag, Settings, ChevronLeft, Heart } from 'lucide-react';
import { PriceToggle } from './PriceToggle';
import styles from './Navbar.module.css';

export function Navbar({ cartCount, onCartClick, onAdminClick, wishlistCount = 0, onWishlistClick, title, onBack }) {
  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        {onBack ? (
          <button className={styles.backBtn} onClick={onBack} aria-label="Back">
            <ChevronLeft size={22} strokeWidth={1.8} />
            <span className={styles.backLabel}>Store</span>
          </button>
        ) : (
          <div className={styles.brand}>
            <span className={styles.brandName}>Good Finds</span>
            <span className={styles.brandAccent}> by AA</span>
          </div>
        )}

        {title && <h1 className={styles.navTitle}>{title}</h1>}

        <div className={styles.navRight}>
          <div className={styles.priceToggleWrap}>
            <PriceToggle />
          </div>
          <button className={styles.iconBtn} onClick={onAdminClick} aria-label="Admin panel">
            <Settings size={20} strokeWidth={1.5} />
          </button>
          <button className={styles.wishlistBtn} onClick={onWishlistClick} aria-label={`Wishlist, ${wishlistCount} items`}>
            <Heart size={20} strokeWidth={1.5} />
            {wishlistCount > 0 && <span className={styles.badge}>{wishlistCount > 9 ? '9+' : wishlistCount}</span>}
          </button>
          <button className={styles.cartBtn} onClick={onCartClick} aria-label={`Shopping bag, ${cartCount} items`}>
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount > 9 ? '9+' : cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
