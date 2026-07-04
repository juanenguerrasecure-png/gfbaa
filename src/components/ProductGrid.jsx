import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingBag, AlertCircle, Sparkles, RefreshCw, SlidersHorizontal, Heart } from 'lucide-react';
import { useCurrency, formatProductPrice } from '../hooks/useCurrency';
import { useStore } from '../context/StoreContext';
import { ProductPlaceholder } from './ProductPlaceholder';
import { ProductDetailModal } from './ProductDetailModal';
import { useWishlist } from '../hooks/useWishlist';

export function ProductGrid({ activeFilter: externalFilter, onFilterChange: onExternalFilterChange, onAddToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [internalFilter, setInternalFilter] = useState('all'); // 'all' | 'bags' | 'jewelry' | 'mint' | 'under1k' | 'brand:BrandName'
  
  const activeFilter = externalFilter !== undefined && externalFilter !== null ? externalFilter : internalFilter;
  const setActiveFilter = onExternalFilterChange !== undefined && onExternalFilterChange !== null ? onExternalFilterChange : setInternalFilter;

  const [sort, setSort] = useState('newest'); // 'newest' | 'low' | 'high'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { toggleWishlist, isWishlisted } = useWishlist();

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    const url = new URL(window.location.href);
    url.searchParams.set('product', product.id);
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  const { currency } = useCurrency();
  const { exchangeRate, getCatalogItemStock, catalogItems } = useStore();

  const fetchCatalogItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/catalog-items');
      if (!response.ok) {
        throw new Error(`Failed to fetch catalog items: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('API returned HTML instead of JSON. Falling back to local store cache.');
      }
      const json = await response.json();
      if (json.ok && Array.isArray(json.data)) {
        setItems(json.data);
      } else {
        throw new Error('API returned invalid data format.');
      }
    } catch (err) {
      console.warn('Error fetching catalog items from API, falling back to local cache:', err);
      if (catalogItems && catalogItems.length > 0) {
        setItems(catalogItems);
      } else {
        setError(err.message || 'Something went wrong while fetching products.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogItems();
  }, []);

  useEffect(() => {
    if (catalogItems && catalogItems.length > 0) {
      setItems(catalogItems);
    }
  }, [catalogItems]);

  useEffect(() => {
    if (items && items.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('product') || params.get('id');
      if (prodId) {
        const found = items.find(item => String(item.id) === String(prodId));
        if (found) {
          setSelectedProduct(found);
        }
      }
    }
  }, [items]);

  // Filter out of stock items for storefront view
  const inStockItems = useMemo(() => {
    return items.filter(item => {
      const stock = getCatalogItemStock ? getCatalogItemStock(item.id) : 1;
      return stock > 0;
    });
  }, [items, getCatalogItemStock]);

  // Compute available brands dynamically
  const availableBrands = useMemo(() => {
    const brands = inStockItems
      .map(item => item.brand?.trim())
      .filter(Boolean);
    return Array.from(new Set(brands)).sort();
  }, [inStockItems]);

  // Apply active filters and search
  const filteredItems = useMemo(() => {
    let result = [...inStockItems];

    // 1. Category / Condition / Brand filters
    if (activeFilter.startsWith('brand:')) {
      const brandName = activeFilter.slice(6).trim().toLowerCase();
      result = result.filter(i => i.brand && i.brand.trim().toLowerCase() === brandName);
    } else {
      switch (activeFilter) {
        case 'bags':
          result = result.filter(i => i.cat === 'bags');
          break;
        case 'jewelry':
          result = result.filter(i => i.cat === 'jewelry');
          break;
        case 'mint':
          result = result.filter(i => i.condition === 'mint' || i.condition === 'new');
          break;
        case 'under1k':
          result = result.filter(i => i.price < 1000);
          break;
        default:
          // 'all' - do nothing
          break;
      }
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const nameMatch = item.name?.toLowerCase().includes(query);
        const brandMatch = item.brand?.toLowerCase().includes(query);
        const detailMatch = item.detail?.toLowerCase().includes(query);
        return nameMatch || brandMatch || detailMatch;
      });
    }

    // 3. Sorting logic
    switch (sort) {
      case 'low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        result.sort((a, b) => {
          const idA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
          const idB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
          return idB - idA;
        });
        break;
    }

    return result;
  }, [inStockItems, activeFilter, searchQuery, sort]);

  const toggleLike = (id, e) => {
    e.stopPropagation();
    toggleWishlist(id);
  };

  const getDisplayTitle = () => {
    if (activeFilter.startsWith('brand:')) {
      return `${activeFilter.slice(6)} Collection`;
    }
    switch (activeFilter) {
      case 'bags': return 'Designer Bags';
      case 'jewelry': return '18K Gold Jewelry';
      case 'mint': return 'Mint Condition Curations';
      case 'under1k': return 'Vault Picks Under $1,000';
      default: return 'The Complete Collection';
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-12" id="product_grid_loading_skeleton">
        {/* Skeleton Header */}
        <div className="h-8 bg-stone-200/50 rounded w-48 mb-8 animate-pulse" />
        {/* Skeleton Filter controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 animate-pulse">
          <div className="flex gap-2 overflow-x-auto w-full max-w-lg pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-stone-200/50 rounded-full w-24 flex-shrink-0" />
            ))}
          </div>
          <div className="h-10 bg-stone-200/50 rounded-full w-full max-w-xs" />
        </div>
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-stone-200/40 overflow-hidden animate-pulse">
              <div className="aspect-square bg-stone-100" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-stone-200/50 rounded w-1/4" />
                <div className="h-4 bg-stone-200/50 rounded w-2/3" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-stone-200/50 rounded w-1/3" />
                  <div className="h-8 w-8 bg-stone-200/50 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto my-16 p-8 bg-[#FAF8F5] border border-stone-200 rounded-lg text-center" id="product_grid_error_state">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-600 mb-4">
          <AlertCircle size={22} />
        </div>
        <h3 className="font-display text-lg text-stone-900 mb-2">Failed to sync vault</h3>
        <p className="text-stone-500 text-xs font-sans leading-relaxed mb-6">{error}</p>
        <button
          onClick={fetchCatalogItems}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold rounded shadow-sm transition-all uppercase tracking-wider cursor-pointer"
          id="product_grid_retry_btn"
        >
          <RefreshCw size={13} />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12" id="tailwind_product_grid_section">
      {/* Search and Sort Sub-Bar */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8 border-b border-stone-200/60 pb-6" id="grid_utility_panel">
        <div className="w-full lg:w-auto">
          <h2 className="font-display text-2xl md:text-3xl font-light tracking-tight text-stone-950 flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            {getDisplayTitle()}
          </h2>
          <p className="text-stone-500 text-xs font-sans mt-1">
            Browse our carefully vetted acquisitions • Direct backend synchronization
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
          {/* Live Search Input with Tailwind classes */}
          <div className="relative flex-1 sm:w-64" id="grid_search_wrapper">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search brand, collection, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 hover:bg-stone-100/50 focus:bg-white text-stone-900 text-xs font-sans rounded border border-stone-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all shadow-sm"
              id="grid_search_input"
            />
          </div>

          {/* Sort Select Styled beautifully in Tailwind */}
          <div className="relative min-w-[160px] flex items-center gap-2 border border-stone-200 rounded px-2.5 py-1.5 bg-stone-50 hover:bg-stone-100/50 transition-colors shadow-sm" id="grid_sort_wrapper">
            <SlidersHorizontal size={13} className="text-stone-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-stone-800 text-xs font-medium focus:outline-none cursor-pointer w-full"
              aria-label="Sort options"
              id="grid_sort_select"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Responsive Custom Filters Pill Bar */}
      <div className="mb-8" id="grid_pills_container">
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {[
            { key: 'all', label: 'All Curations' },
            { key: 'bags', label: 'Designer Bags' },
            { key: 'jewelry', label: '18K Jewelry' },
            { key: 'mint', label: 'Mint Condition' },
            { key: 'under1k', label: 'Under $1,000' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                activeFilter === f.key
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100/70 hover:text-stone-900'
              }`}
              id={`filter_tab_pill_${f.key}`}
            >
              {f.label}
            </button>
          ))}

          {/* Dynamic Brands Division line */}
          {availableBrands.length > 0 && (
            <div className="h-4 w-px bg-stone-200 mx-1 self-center hidden sm:block" />
          )}

          {/* Render dyn-fetched Brands */}
          {availableBrands.map(brand => {
            const key = `brand:${brand}`;
            const normalizedId = brand.toLowerCase().replace(/[^a-z0-9]/g, '_');
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                  activeFilter === key
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100/70 hover:text-stone-850'
                }`}
                id={`filter_tab_brand_${normalizedId}`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Content Area */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-stone-50 border border-stone-200/60 rounded-xl" id="grid_empty_state_card">
          <span className="text-3xl mb-3">🔍</span>
          <h3 className="font-display text-lg text-stone-800 mb-1">No pieces match this selection</h3>
          <p className="text-stone-500 text-xs max-w-sm font-sans leading-relaxed">
            There are currently no active listings that match your filter or search query. Take a look at our complete treasury collections.
          </p>
          <button
            onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
            className="mt-5 px-5 py-2 bg-stone-950 hover:bg-stone-850 text-stone-100 text-xs font-semibold rounded transition-all shadow-sm cursor-pointer"
            id="grid_reset_btn"
          >
            Clear Active Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8" id="grid_products_layout">
          {filteredItems.map(item => {
            const stock = getCatalogItemStock ? getCatalogItemStock(item.id) : 1;
            const isSoldOut = stock <= 0;
            const isLiked = isWishlisted(item.id);

            // Extract all photos securely
            const photos = (() => {
              const list = [];
              if (Array.isArray(item?.photos)) list.push(...item.photos);
              if (Array.isArray(item?.photoUrls)) list.push(...item.photoUrls);
              if (item?.photoUrl) list.push(item.photoUrl);
              if (item?.photo) list.push(item.photo);
              return [...new Set(list.filter(Boolean))];
            })();

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="group rounded-lg border border-stone-200/70 overflow-hidden shadow-sm hover:shadow-md flex flex-col cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-soft, #FAF8F5)',
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.8s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                id={`product_card_tailwind_${item.id}`}
              >
                {/* Product Image Stage */}
                <div className="aspect-square w-full relative overflow-hidden bg-stone-50 flex items-center justify-center">
                  {photos.length > 0 ? (
                    <img
                      src={photos[0]}
                      alt={`${item.brand || ''} ${item.name}`}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ProductPlaceholder category={item.cat} />
                  )}

                  {/* Condition tag */}
                  {item.condition && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded bg-stone-900/90 text-stone-100 shadow-sm">
                      {item.condition === 'mint' || item.condition === 'new' ? 'Mint' : item.condition}
                    </span>
                  )}

                  {/* Liked Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleLike(item.id, e)}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white border flex items-center justify-center shadow-sm transition-all duration-200 focus:outline-none cursor-pointer ${
                      isLiked ? 'text-accent border-accent/30' : 'text-stone-500 hover:text-accent border-stone-200'
                    }`}
                    aria-label="Toggle saved"
                    id={`grid_wishlist_heart_${item.id}`}
                  >
                    <Heart
                      size={14}
                      fill={isLiked ? 'var(--accent)' : 'none'}
                      stroke={isLiked ? 'var(--accent)' : 'currentColor'}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Out of Stock banner */}
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-white text-xs font-semibold uppercase tracking-widest border border-white/40 px-3.5 py-1.5 rounded bg-stone-950/40">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Information Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Brand Meta header */}
                    <div className="text-[10px] font-semibold text-[#8C7B6E] tracking-widest uppercase mb-1">
                      {item.brand || 'Luxury Piece'}
                    </div>

                    {/* Title Name */}
                    <h3 className="font-display text-sm font-medium text-stone-900 group-hover:text-accent transition-colors duration-200 line-clamp-1 mb-1">
                      {item.name}
                    </h3>

                    {/* Details Snippet */}
                    {item.detail && (
                      <p className="text-stone-500 font-sans text-[11px] line-clamp-1 mb-4">
                        {item.detail}
                      </p>
                    )}
                  </div>

                  {/* Pricing and cart add button */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-stone-400 line-through">
                        {item.orig ? `$${Number(item.orig).toLocaleString()}` : ''}
                      </span>
                      <span className="text-sm font-semibold text-stone-950 font-serif">
                        {formatProductPrice(item, currency, exchangeRate)}
                      </span>
                    </div>

                    {/* Quick Add To Cart Bag Button */}
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onAddToCart && !isSoldOut) {
                          onAddToCart(item);
                        }
                      }}
                      className="w-8 h-8 rounded-full border border-stone-200 hover:border-accent hover:bg-accent hover:text-white flex items-center justify-center text-stone-600 transition-all duration-200 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                      title={`Add ${item.name} to bag`}
                      id={`grid_cart_btn_${item.id}`}
                    >
                      <ShoppingBag size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Display Dialog overlay */}
      {selectedProduct && (
        <ProductDetailModal
          isOpen={!!selectedProduct}
          onClose={handleCloseDetail}
          product={selectedProduct}
          onAddToCart={onAddToCart}
        />
      )}
    </section>
  );
}
