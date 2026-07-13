import { ShoppingBag, ChevronLeft, Heart, MessageSquare, ClipboardCheck, Lock } from 'lucide-react';
import { PriceToggle } from './PriceToggle';
import ThemeToggle from './ThemeToggle';
import styles from './Navbar.module.css';

export function Navbar({ cartCount, onCartClick, onAdminClick, wishlistCount = 0, onWishlistClick, title, onBack, currentView, onViewChange, onMessageMeClick, onTrackRequestClick }) {
  const isStoreFrontView = ['home', 'store', 'gallery', 'archive'].includes(currentView);

  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        {onBack ? (
          <button className={styles.backBtn} onClick={onBack} aria-label="Back">
            <ChevronLeft size={22} strokeWidth={1.8} />
            <span className={styles.backLabel}>Store</span>
          </button>
        ) : (
          <div className={styles.brand} onClick={() => onViewChange && onViewChange('home')} style={{ cursor: 'pointer' }}>
            <span className={styles.brandName}>Good Finds</span>
            <span className={styles.brandAccent}> by AA</span>
          </div>
        )}

        {isStoreFrontView && onViewChange && (
          <nav className={styles.navLinks}>
            <button 
              className={`${styles.navLink} ${currentView === 'home' ? styles.activeNavLink : ''}`} 
              onClick={() => onViewChange('home')}
              id="nav_link_home"
            >
              Home
            </button>
            <button 
              className={`${styles.navLink} ${currentView === 'gallery' ? styles.activeNavLink : ''}`} 
              onClick={() => onViewChange('gallery')}
              id="nav_link_gallery"
            >
              Gallery
            </button>
            <button 
              className={`${styles.navLink} ${currentView === 'store' ? styles.activeNavLink : ''}`} 
              onClick={() => onViewChange('store')}
              id="nav_link_shop"
            >
              Shop
            </button>
            <button 
              className={`${styles.navLink} ${currentView === 'archive' ? styles.activeNavLink : ''}`} 
              onClick={() => onViewChange('archive')}
              id="nav_link_archive"
            >
              Past Collections
            </button>
          </nav>
        )}

        {title && <h1 className={styles.navTitle}>{title}</h1>}

        <div className={styles.navRight}>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--gold)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)]/80 hover:bg-[var(--surface)] transition-all text-xs font-semibold cursor-pointer shadow-3xs active:scale-95"
            onClick={onTrackRequestClick}
            id="nav_track_request_btn"
            title="Track Request"
          >
            <ClipboardCheck size={13} className="text-[var(--gold)]" strokeWidth={2.5} />
            <span className="hidden sm:inline font-sans tracking-wide uppercase text-[10px]">Track Request</span>
          </button>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--gold)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)]/80 hover:bg-[var(--surface)] transition-all text-xs font-semibold cursor-pointer shadow-3xs active:scale-95"
            onClick={onMessageMeClick}
            id="nav_message_me_btn"
            title="Message Me"
          >
            <MessageSquare size={13} className="text-[var(--gold)]" strokeWidth={2.5} />
            <span className="hidden sm:inline font-sans tracking-wide uppercase text-[10px]">Message Me</span>
          </button>
          <ThemeToggle />
          <div className={styles.priceToggleWrap}>
            <PriceToggle />
          </div>
          <button className={styles.iconBtn} onClick={onAdminClick} aria-label="Admin panel">
            <Lock size={20} strokeWidth={1.5} />
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
