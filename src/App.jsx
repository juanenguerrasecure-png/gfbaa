import { lazy, Suspense, useEffect, useState } from 'react';
import { Navbar }       from './components/Navbar';
import { Hero }         from './components/Hero';
import { ProductGrid }  from './components/ProductGrid';
import { Toast }        from './components/Toast';
import { CartModal }    from './components/CartModal';
import { WishlistModal } from './components/WishlistModal';
import { AdminLogin }   from './admin/AdminLogin';
import { useCart }      from './hooks/useCart';
import { useWishlist }  from './hooks/useWishlist';
import { useAuth }      from './context/AuthContext';
import { useStore }     from './context/StoreContext';
import { HomeView }     from './components/HomeView';
import { GalleryView }  from './components/GalleryView';
import { ArchiveView }  from './components/ArchiveView';
import { ShopHero }     from './components/ShopHero';
import { InquirySheet }  from './components/InquirySheet';

const AdminPanel = lazy(() => import('./admin/AdminPanel').then(module => ({ default: module.AdminPanel })));

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-600">
        <div className="h-8 w-8 rounded-full border-2 border-[#E5DFD8] border-t-accent animate-spin" />
        <span className="text-xs uppercase tracking-[0.2em] font-semibold">Loading admin</span>
      </div>
    </div>
  );
}

// View states: 'home' | 'store' | 'gallery' | 'archive' | 'login' | 'admin'
export default function App() {
  const { season } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-season', season || 'classic');
  }, [season]);

  const [view, setView] = useState('home');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    viewCart,
    toast,
    showToast
  } = useCart();

  const { wishlist } = useWishlist();

  const { isAdmin } = useAuth();

  const handleAdminClick = () => {
    if (isAdmin) setView('admin');
    else setView('login');
  };

  // Admin login — redirect to admin if already logged in
  if (view === 'login') {
    if (isAdmin) { setView('admin'); return null; }
    return <AdminLogin onSuccess={() => setView('admin')} onBack={() => setView('home')} />;
  }

  // Admin panel
  if (view === 'admin') {
    if (!isAdmin) { setView('login'); return null; }
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminPanel onExitAdmin={() => setView('home')} />
      </Suspense>
    );
  }

  // Render the selected view
  const renderContent = () => {
    switch (view) {
      case 'home':
        return <HomeView onViewChange={setView} onAddToCart={addToCart} />;
      case 'gallery':
        return <GalleryView />;
      case 'archive':
        return <ArchiveView />;
      case 'store':
      default:
        return (
          <>
            <ShopHero />
            <ProductGrid
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onAddToCart={addToCart}
            />
          </>
        );
    }
  };

  // Storefront
  return (
    <>
      <Navbar
        cartCount={cart.length}
        onCartClick={viewCart}
        onAdminClick={handleAdminClick}
        wishlistCount={wishlist.length}
        onWishlistClick={() => setIsWishlistOpen(true)}
        currentView={view}
        onViewChange={setView}
      />
      {renderContent()}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        onClear={clearCart}
        showToast={showToast}
      />
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        onAddToCart={addToCart}
        showToast={showToast}
      />
      <Toast visible={toast.visible} msg={toast.msg} />
      <InquirySheet />
    </>
  );
}
