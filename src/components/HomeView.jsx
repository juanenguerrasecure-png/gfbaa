import { useMemo, useState } from 'react';
import { Hero } from './Hero';
import { useStore } from '../context/StoreContext';
import { useCurrency, formatProductPrice } from '../hooks/useCurrency';
import { useWishlist } from '../hooks/useWishlist';
import { Sparkles, ShoppingBag, Heart, ArrowRight, ShieldCheck, Award, Search, Compass } from 'lucide-react';
import { AskMeBanner } from './AskMeBanner';
import { placeholderImages } from '../placeholderImages';

export function HomeView({ onViewChange, onAddToCart, showToast, onOpenAskMe }) {
  const { catalogItems, getCatalogItemStock, exchangeRate, siteContent, galleryPhotos, pastCollections } = useStore();
  const { currency } = useCurrency();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [email, setEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      if (showToast) showToast('Please enter a valid email address.');
      return;
    }

    setSubmittingNewsletter(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' })
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        if (showToast) showToast(result.message || 'Successfully subscribed!');
        setEmail('');
      } else {
        if (showToast) showToast(result.error || 'Failed to subscribe.');
      }
    } catch (err) {
      console.error('Newsletter error:', err);
      if (showToast) showToast('Unable to connect to service. Please try again.');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

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
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen pb-20 transition-colors duration-500" id="home_view_container">
      {/* Shortened, Seasonal Hero Header */}
      <Hero slim={true} />

      {/* Main Exploration Tiles */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-light text-[var(--text-primary)] tracking-tight">
            Explore the Curation
          </h2>
          <p className="text-[var(--text-secondary)] text-xs font-sans mt-2 tracking-wide uppercase">
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
            <img 
              src={tileImages.gallery || placeholderImages.gallery[0].url} 
              alt="Lifestyle Gallery" 
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
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
            <img 
              src={tileImages.shop || placeholderImages.currentSelections} 
              alt="Current Selections" 
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
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
            <img 
              src={tileImages.archive || placeholderImages.archiveTile} 
              alt="Past Collections" 
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
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
          <div className="mt-16 border-t border-[var(--border)]/20 pt-16" id="home_new_arrivals_strip">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-light text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--accent)]" />
                  New Acquisitions
                </h2>
                <p className="text-[var(--text-secondary)] text-xs font-sans mt-1">
                  The latest arrivals in our active luxury vault
                </p>
              </div>
              <button 
                onClick={() => onViewChange('store')}
                className="text-[var(--text-primary)] hover:text-[var(--accent)] font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
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
                    className="group rounded-2xl border border-[var(--border)]/15 overflow-hidden shadow-2xs hover:shadow-sm flex flex-col bg-[var(--surface)] transition-all cursor-pointer"
                    id={`home_arrival_${item.id}`}
                  >
                    <div className="aspect-square bg-[var(--bg)] overflow-hidden relative flex items-center justify-center">
                      {photos.length > 0 ? (
                        <img 
                          src={photos[0]} 
                          alt={item.name} 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-[var(--text-secondary)] uppercase font-bold text-xs tracking-wider">Good Finds</div>
                      )}

                      {item.condition && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[8px] font-sans font-bold uppercase tracking-wider rounded bg-stone-900/90 text-stone-100">
                          {item.condition === 'mint' || item.condition === 'new' ? 'Mint' : item.condition}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(item.id); }}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[var(--surface)]/95 hover:bg-[var(--surface)] border border-[var(--border)]/30 flex items-center justify-center shadow-sm transition-all text-[var(--text-secondary)] hover:text-[var(--accent)]`}
                      >
                        <Heart size={12} fill={isLiked ? 'var(--accent)' : 'none'} stroke={isLiked ? 'var(--accent)' : 'currentColor'} />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase mb-0.5">
                          {item.brand || 'Luxury Piece'}
                        </div>
                        <h3 className="font-display text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200 line-clamp-1 mb-1">
                          {item.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/15 mt-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)] font-serif">
                          {formatProductPrice(item, currency, exchangeRate)}
                        </span>
                        
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                          className="w-7 h-7 rounded-full border border-[var(--border)]/40 hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--btn-primary-fg)] flex items-center justify-center text-[var(--text-secondary)] transition-all cursor-pointer"
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

        {/* Personal Shopper Wishlist Banner */}
        <AskMeBanner onOpen={onOpenAskMe} />

        {/* The Good Finds Luxury Promise Section */}
        <div className="mt-24 border-t border-[var(--border)]/20 pt-16" id="home_luxury_promise_section">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-light text-[var(--text-primary)] tracking-tight">
              The Good Finds Luxury Promise
            </h2>
            <p className="text-[var(--text-secondary)] text-xs font-sans mt-2 tracking-wide uppercase max-w-lg mx-auto leading-relaxed">
              Every vintage handbag and 18K fine jewelry piece is selected with uncompromising standards of authenticity, beauty, and craftsmanship.
            </p>
          </div>

          {/* Elegant Editorial Visual Banner */}
          <div className="max-w-4xl mx-auto mb-16 rounded-2xl overflow-hidden h-48 md:h-64 relative border border-[var(--border)]/15 shadow-2xs">
            <img
              src={placeholderImages.luxuryPromise}
              alt="Luxury Promise Detailing"
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-stone-900/5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]/15 shadow-4xs hover:shadow-2xs transition-all duration-300 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--gold)] border border-[var(--border)]/15 shadow-3xs">
                <Award size={18} strokeWidth={2} />
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] tracking-tight">18K Gold Verification</h3>
              <p className="text-[var(--text-secondary)] text-xs font-sans leading-relaxed">
                All jewelry listed is tested using precision acid-density methods and inspected for authentic vintage hallmarks or official stamps.
              </p>
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]/15 shadow-4xs hover:shadow-2xs transition-all duration-300 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--gold)] border border-[var(--border)]/15 shadow-3xs">
                <ShieldCheck size={18} strokeWidth={2} />
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] tracking-tight">Authenticity Guarantee</h3>
              <p className="text-[var(--text-secondary)] text-xs font-sans leading-relaxed">
                Every bag and accessory undergoes a meticulous multi-point inspection of stitching, date codes, hardware engraving, and weight.
              </p>
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]/15 shadow-4xs hover:shadow-2xs transition-all duration-300 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--gold)] border border-[var(--border)]/15 shadow-3xs">
                <Search size={18} strokeWidth={2} />
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] tracking-tight">Honest Condition Grading</h3>
              <p className="text-[var(--text-secondary)] text-xs font-sans leading-relaxed">
                We assign strict and conservative condition reports. High-definition close-up photography ensures full visual transparency.
              </p>
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]/15 shadow-4xs hover:shadow-2xs transition-all duration-300 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--gold)] border border-[var(--border)]/15 shadow-3xs">
                <Compass size={18} strokeWidth={2} />
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] tracking-tight">Sourcing Concierge</h3>
              <p className="text-[var(--text-secondary)] text-xs font-sans leading-relaxed">
                Searching for a rare vintage grail or a specific high-end 18K bracelet? Submit your request and our private shopper will find it.
              </p>
            </div>
          </div>
        </div>

        {/* Elegant Newsletter Section */}
        <div className="mt-24 border-t border-[var(--border)]/20 pt-16 pb-8 max-w-3xl mx-auto text-center" id="home_newsletter_section">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden border border-[var(--border)]/15 shadow-2xs">
            <img
              src={placeholderImages.newsletter}
              alt="Stay in the Loop Curation"
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="font-display text-xl md:text-2xl font-light text-[var(--text-primary)] tracking-tight">
            Stay in the Loop
          </h3>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Subscribe to receive priority notifications on pristine seasonal acquisitions, private sales, and newly cataloged curations.
          </p>

          <form onSubmit={handleSubscribe} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-2.5 rounded border border-[var(--border)]/40 text-sm bg-[var(--surface)] text-[var(--text-primary)] placeholder-stone-400 focus:outline-none focus:border-[var(--accent)] font-sans transition-colors"
              required
              disabled={submittingNewsletter}
            />
            <button
              type="submit"
              disabled={submittingNewsletter}
              className="px-6 py-2.5 bg-[var(--btn-primary-bg)] hover:opacity-90 text-[var(--btn-primary-fg)] text-xs font-semibold tracking-wider uppercase rounded transition-all duration-200 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submittingNewsletter ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          <p className="text-[10px] text-[var(--text-secondary)]/80 font-sans mt-3">
            Unsubscribe anytime. We respect your inbox privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
