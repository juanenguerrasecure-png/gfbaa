import { ShoppingBag, ChevronLeft, Heart, MessageSquare, ClipboardCheck, Lock } from 'lucide-react';
import { PriceToggle } from './PriceToggle';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import styles from './Navbar.module.css';

export function Navbar({ cartCount, onCartClick, onAdminClick, wishlistCount = 0, onWishlistClick, title, onBack, currentView, onViewChange, onMessageMeClick, onTrackRequestClick }) {
  const { theme } = useTheme() || {};
  const isStoreFrontView = ['home', 'store', 'gallery', 'archive'].includes(currentView);

  if (theme === 'editorial' && isStoreFrontView && !onBack && !title) {
    return (
      <header className="w-full bg-[#F5F3EE] border-b border-[#D8D0C4] text-[#151713] h-[90px] min-h-[90px] px-4 md:px-8 select-none flex items-center justify-between relative z-30" id="editorial_navbar">
        {/* Left: Branding */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onViewChange && onViewChange('home')}
          id="nav_editorial_brand"
        >
          {/* Circular Monogram: ~43px */}
          <div className="w-[43px] h-[43px] rounded-full border border-[#B8A57A] flex items-center justify-center font-serif italic text-lg text-[#151713] bg-[#F5F3EE] shrink-0 group-hover:border-[#C4A269] transition-colors shadow-3xs">
            GF
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-[16px] font-normal tracking-[0.22em] text-[#151713] uppercase leading-tight">
              Good Finds
            </span>
            <span className="text-[6px] tracking-[0.4em] text-[#8A8478] font-sans font-semibold uppercase block mt-0.5">
              BY AA
            </span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 md:gap-10">
          <button 
            onClick={() => onViewChange('store')}
            className={`text-[8.5px] font-sans font-medium tracking-[0.25em] uppercase transition-colors cursor-pointer ${currentView === 'store' ? 'text-[#C4A269]' : 'text-[#151713] hover:text-[#C4A269]'}`}
            id="nav_editorial_shop"
          >
            SHOP
          </button>
          <button 
            onClick={() => {
              onViewChange('home');
              setTimeout(() => {
                const el = document.getElementById('home_luxury_promise_section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="text-[8.5px] font-sans font-medium tracking-[0.25em] text-[#151713] hover:text-[#C4A269] uppercase transition-colors cursor-pointer"
            id="nav_editorial_standard"
          >
            OUR STANDARD
          </button>
          <button 
            onClick={onMessageMeClick}
            className="text-[8.5px] font-sans font-medium tracking-[0.25em] text-[#151713] hover:text-[#C4A269] uppercase transition-colors cursor-pointer"
            id="nav_editorial_concierge"
          >
            CONCIERGE
          </button>
          <button 
            onClick={() => onViewChange('gallery')}
            className={`text-[8.5px] font-sans font-medium tracking-[0.25em] uppercase transition-colors cursor-pointer ${currentView === 'gallery' ? 'text-[#C4A269]' : 'text-[#151713] hover:text-[#C4A269]'}`}
            id="nav_editorial_gallery"
          >
            GALLERY
          </button>
          <button 
            onClick={() => onViewChange('archive')}
            className={`text-[8.5px] font-sans font-medium tracking-[0.25em] uppercase transition-colors cursor-pointer ${currentView === 'archive' ? 'text-[#C4A269]' : 'text-[#151713] hover:text-[#C4A269]'}`}
            id="nav_editorial_archive"
          >
            PAST COLLECTIONS
          </button>
          <button 
            onClick={onAdminClick}
            className="text-[8.5px] font-sans font-medium tracking-[0.25em] text-[#151713] hover:text-[#C4A269] uppercase transition-colors cursor-pointer"
            id="nav_editorial_admin"
          >
            ADMIN
          </button>
        </nav>

        {/* Right: Cart & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <div className={styles.priceToggleWrap}>
            <PriceToggle />
          </div>

          <button 
            onClick={onWishlistClick}
            className="text-[#151713] hover:text-[#C4A269] transition-colors relative p-1 cursor-pointer"
            title={`Wishlist (${wishlistCount})`}
          >
            <Heart size={18} strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#171916] text-white text-[8px] font-mono flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          <button 
            onClick={onCartClick}
            className="flex items-center gap-2 cursor-pointer group/bag ml-1"
            id="nav_editorial_bag"
            aria-label={`Bag, ${cartCount} items`}
          >
            <span className="text-[8.5px] font-sans font-medium tracking-[0.25em] text-[#151713] group-hover/bag:text-[#C4A269] uppercase transition-colors">
              BAG
            </span>
            <div className="w-[19px] h-[19px] rounded-full bg-[#171916] text-[#F5F3EE] text-[10px] font-mono font-medium flex items-center justify-center shrink-0 shadow-2xs">
              {cartCount}
            </div>
          </button>
        </div>
      </header>
    );
  }

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
