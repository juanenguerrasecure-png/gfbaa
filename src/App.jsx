import { lazy, Suspense, useMemo, useState } from 'react';
import { Navbar }       from './components/Navbar';
import { Hero }         from './components/Hero';
import { Filters }      from './components/Filters';
import { Catalog }      from './components/Catalog';
import { Toast }        from './components/Toast';
import { CartModal }    from './components/CartModal';
import { AdminLogin }   from './admin/AdminLogin';
import { useCart }      from './hooks/useCart';
import { useStore }     from './context/StoreContext';
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

function applyFilter(items, filter) {
  if (filter && filter.startsWith('brand:')) {
    const brandName = filter.slice(6).trim().toLowerCase();
    return items.filter(i => i.brand && i.brand.trim().toLowerCase() === brandName);
  }
  switch (filter) {
    case 'bags':     return items.filter(i => i.cat === 'bags');
    case 'jewelry':  return items.filter(i => i.cat === 'jewelry');
    case 'mint':     return items.filter(i => i.condition === 'mint' || i.condition === 'new');
    case 'under1k': return items.filter(i => i.price < 1000);
    default:         return items;
  }
}

function applySort(items, sort) {
  const arr = [...items];
  switch (sort) {
    case 'low':  return arr.sort((a, b) => a.price - b.price);
    case 'high': return arr.sort((a, b) => b.price - a.price);
    case 'name': return arr.sort((a, b) => a.name.localeCompare(b.name));
    default:     return arr;
  }
}

// View states: 'store' | 'login' | 'admin'
export default function App() {
  const [view, setView] = useState('store');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sort, setSort] = useState('default');

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

  const { catalogItems, getCatalogItemStock } = useStore();
  const { isAdmin } = useAuth();

  // Only show in-stock items on storefront
  const storeItems = useMemo(
    () => catalogItems.filter(i => getCatalogItemStock(i.id) > 0),
    [catalogItems, getCatalogItemStock]
  );

  const availableBrands = useMemo(() => {
    const brands = storeItems
      .map(item => item.brand?.trim())
      .filter(Boolean);
    return Array.from(new Set(brands)).sort();
  }, [storeItems]);

  const visibleItems = useMemo(
    () => applySort(applyFilter(storeItems, activeFilter), sort),
    [storeItems, activeFilter, sort]
  );

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
      <Filters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onSortChange={setSort}
        availableBrands={availableBrands}
      />
      <Catalog
        items={visibleItems}
        activeFilter={activeFilter}
        onAddToCart={addToCart}
        onClearFilter={() => setActiveFilter('all')}
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
