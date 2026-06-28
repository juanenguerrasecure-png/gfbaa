import { lazy, Suspense, useState } from 'react';
import { Navbar }       from './components/Navbar';
import { Hero }         from './components/Hero';
import { ProductGrid }  from './components/ProductGrid';
import { Toast }        from './components/Toast';
import { CartModal }    from './components/CartModal';
import { AdminLogin }   from './admin/AdminLogin';
import { useCart }      from './hooks/useCart';
import { useAuth }      from './context/AuthContext';

const AdminPanel = lazy(() => import('./admin/AdminPanel').then(module => ({ default: module.AdminPanel })));

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-600">
        <div className="h-8 w-8 rounded-full border-2 border-[#E5DFD8] border-t-[#C9A84C] animate-spin" />
        <span className="text-xs uppercase tracking-[0.2em] font-semibold">Loading admin</span>
      </div>
    </div>
  );
}

// View states: 'store' | 'login' | 'admin'
export default function App() {
  const [view, setView] = useState('store');
  const [activeFilter, setActiveFilter] = useState('all');

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

  const { isAdmin } = useAuth();

  const handleAdminClick = () => {
    if (isAdmin) setView('admin');
    else setView('login');
  };

  // Admin login — redirect to admin if already logged in
  if (view === 'login') {
    if (isAdmin) { setView('admin'); return null; }
    return <AdminLogin onSuccess={() => setView('admin')} onBack={() => setView('store')} />;
  }

  // Admin panel
  if (view === 'admin') {
    if (!isAdmin) { setView('login'); return null; }
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminPanel onExitAdmin={() => setView('store')} />
      </Suspense>
    );
  }

  // Storefront
  return (
    <>
      <Navbar
        cartCount={cart.length}
        onCartClick={viewCart}
        onAdminClick={handleAdminClick}
      />
      <Hero onCategoryClick={setActiveFilter} />
      <ProductGrid
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onAddToCart={addToCart}
      />
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        onClear={clearCart}
        showToast={showToast}
      />
      <Toast visible={toast.visible} msg={toast.msg} />
    </>
  );
}
