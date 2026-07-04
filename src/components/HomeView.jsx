import { useMemo } from 'react';
import { Hero } from './Hero';
import { useStore } from '../context/StoreContext';
import { useCurrency, formatProductPrice } from '../hooks/useCurrency';
import { useWishlist } from '../hooks/useWishlist';
import { Sparkles, ShoppingBag, Heart, ArrowRight } from 'lucide-react';

export function HomeView({ onViewChange, onAddToCart }) {
  const { catalogItems, getCatalogItemStock, exchangeRate, siteContent, galleryPhotos, pastCollections } = useStore();
  const { currency } = useCurrency();
  const { toggleWishlist, isWishlisted } = useWishlist();

  // Find beautiful images for the 3 navigation tiles
  const activeItems = useMemo(() => {
    return catalogItems.filter(item => {
      const stock = getCatalogItemStock ? getCatalogItemStock(item.id) : 1;
      return stock > 0;
    });
  }, [catalogItems, getCatalogItemStock]);

  const newArrivals = useMemo(() => {
    return activeItems.slice(0, 4);
  }, [activeItems]);

  const tileImages = useMemo(() => {
    // Check if we have actual user uploaded items or custom items
    const galleryImg = galleryPhotos?.[0]?.url || null;
    const shopImg = activeItems?.[0]?.photoUrl || activeItems?.[0]?.photos?.[0] || null;
    const archiveImg = pastCollections?.[0]?.photos?.[0] || pastCollections?.[0]?.photoUrls?.[0] || pastCollections?.[0]?.photoUrl || null;

    return {
      gallery: galleryImg,
      shop: shopImg,
      archive: archiveImg
    };
  }, [activeItems, galleryPhotos, pastCollections]);

  const handleProductClick = (item) => {
    const url = new URL(window.location.href);
    url.searchParams.set('product', item.id);
    window.history.replaceState({}, '', url.pathname + url.search);
    onViewChange('store');
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen pb-20" id="home_view_container">
      {/* Shortened, Seasonal Hero Header */}
      <Hero slim={true} />

      {/* Main Exploration Tiles */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-light text-stone-900 tracking-tight">
            Explore the Curation
          </h2>
          <p className="text-stone-500 text-xs font-sans mt-2 tracking-wide uppercase">
            Sourced with refinement, preserved for posterity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Tile 1: Gallery */}
          <div 
            id="tile_gallery"
            onClick={() => onViewChange('gallery')}
            className="group relative h-96 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-500 border border-stone-200/40 bg-gradient-to-b from-[#2a2621] to-[#141210]"
          >
            <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/45 transition-colors duration-500 z-10" />
            {tileImages.gallery ? (
              <img 
                src={tileImages.gallery} 
                alt="Lifestyle Gallery" 
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-stone-800 to-stone-950 opacity-40 group-hover:opacity-55 transition-opacity duration-500">
                <span className="text-amber-200/10 text-9xl font-display font-light select-none">✦</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 z-20 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase font-sans tracking-widest font-bold text-amber-100 mb-1">Editorial</span>
              <h3 className="font-display text-xl font-medium mb-1 tracking-tight">Gallery</h3>
              <p className="text-stone-200 text-xs font-sans line-clamp-2 mb-4 font-light leading-relaxed">
                {siteContent?.galleryIntro || 'Visual diaries, styling stories, and close-up lifestyle curations.'}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                <span>Explore</span>
                <ArrowRight size={13} className="text-[var(--accent)]" />
              </div>
            </div>
          </div>

          {/* Tile 2: Shop / Current Selections */}
          <div 
            id="tile_shop"
            onClick={() => onViewChange('store')}
            className="group relative h-96 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-500 border border-stone-200/40 bg-gradient-to-b from-[#332b24] to-[#1a1511]"
          >
            <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/45 transition-colors duration-500 z-10" />
            {tileImages.shop ? (
              <img 
                src={tileImages.shop} 
                alt="Current Selections" 
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-stone-800 to-stone-950 opacity-40 group-hover:opacity-55 transition-opacity duration-500">
                <span className="text-amber-200/10 text-9xl font-display font-light select-none">✦</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 z-20 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase font-sans tracking-widest font-bold text-amber-100 mb-1">Available Curation</span>
              <h3 className="font-display text-xl font-medium mb-1 tracking-tight">Current Selections</h3>
              <p className="text-stone-200 text-xs font-sans line-clamp-2 mb-4 font-light leading-relaxed">
                {siteContent?.shopIntro || 'Vetted designer handbags, fine pieces, and pristine seasonal acquisitions.'}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                <span>Explore</span>
                <ArrowRight size={13} className="text-[var(--accent)]" />
              </div>
            </div>
          </div>

          {/* Tile 3: Past Collections / Archive */}
          <div 
            id="tile_archive"
            onClick={() => onViewChange('archive')}
            className="group relative h-96 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-500 border border-stone-200/40 bg-gradient-to-b from-[#26262b] to-[#121214]"
          >
            <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/45 transition-colors duration-500 z-10" />
            {tileImages.archive ? (
              <img 
                src={tileImages.archive} 
                alt="Past Collections" 
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-stone-800 to-stone-950 opacity-40 group-hover:opacity-55 transition-opacity duration-500">
                <span className="text-amber-200/10 text-9xl font-display font-light select-none">✦</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 z-20 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase font-sans tracking-widest font-bold text-amber-100 mb-1">Archive Portfolio</span>
              <h3 className="font-display text-xl font-medium mb-1 tracking-tight">Past Collections</h3>
              <p className="text-stone-200 text-xs font-sans line-clamp-2 mb-4 font-light leading-relaxed">
                {siteContent?.archiveIntro || 'An archival directory of previously loved curations now residing with new owners.'}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                <span>Explore</span>
                <ArrowRight size={13} className="text-[var(--accent)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Optional: "New Arrivals" strip */}
        {newArrivals.length > 0 && (
          <div className="mt-16 border-t border-stone-200/60 pt-16" id="home_new_arrivals_strip">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-light text-stone-950 flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  New Acquisitions
                </h2>
                <p className="text-stone-500 text-xs font-sans mt-1">
                  The latest arrivals in our active luxury vault
                </p>
              </div>
              <button 
                onClick={() => onViewChange('store')}
                className="text-stone-800 hover:text-accent font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Full Store</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {newArrivals.map(item => {
                const isLiked = isWishlisted(item.id);
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
                    onClick={() => handleProductClick(item)}
                    className="group rounded-lg border border-stone-200/60 overflow-hidden shadow-sm hover:shadow-md flex flex-col bg-white transition-all cursor-pointer"
                    id={`home_arrival_${item.id}`}
                  >
                    <div className="aspect-square bg-stone-50 overflow-hidden relative flex items-center justify-center">
                      {photos.length > 0 ? (
                        <img 
                          src={photos[0]} 
                          alt={item.name} 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-stone-300 uppercase font-bold text-xs tracking-wider">Good Finds</div>
                      )}

                      {item.condition && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[8px] font-sans font-bold uppercase tracking-wider rounded bg-stone-900/90 text-stone-100">
                          {item.condition === 'mint' || item.condition === 'new' ? 'Mint' : item.condition}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(item.id); }}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 hover:bg-white border flex items-center justify-center shadow-sm transition-all text-stone-400 hover:text-accent`}
                      >
                        <Heart size={12} fill={isLiked ? 'var(--accent)' : 'none'} stroke={isLiked ? 'var(--accent)' : 'currentColor'} />
                      </button>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] font-semibold text-[#8C7B6E] tracking-widest uppercase mb-0.5">
                          {item.brand || 'Luxury Piece'}
                        </div>
                        <h3 className="font-display text-xs font-medium text-stone-900 group-hover:text-accent transition-colors duration-200 line-clamp-1 mb-1">
                          {item.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2">
                        <span className="text-xs font-semibold text-stone-950 font-serif">
                          {formatProductPrice(item, currency, exchangeRate)}
                        </span>
                        
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                          className="w-7 h-7 rounded-full border border-stone-200 hover:border-accent hover:bg-accent hover:text-white flex items-center justify-center text-stone-500 transition-all cursor-pointer"
                          title="Add to bag"
                        >
                          <ShoppingBag size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
