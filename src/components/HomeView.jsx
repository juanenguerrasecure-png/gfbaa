import { useMemo, useState } from 'react';
import { Hero } from './Hero';
import { useStore } from '../context/StoreContext';
import { useCurrency, formatProductPrice } from '../hooks/useCurrency';
import { useWishlist } from '../hooks/useWishlist';
import { Sparkles, ShoppingBag, Heart, ArrowRight, ShieldCheck, Award, Search, Compass } from 'lucide-react';
import { AskMeBanner } from './AskMeBanner';
import { placeholderImages } from '../placeholderImages';
import { ScrollFadeIn } from './ScrollFadeIn';

export function HomeView({ onViewChange, onAddToCart, showToast, onOpenAskMe }) {
  const { catalogItems, getCatalogItemStock, exchangeRate, siteContent, galleryPhotos, pastCollections } = useStore();
  const { currency, toggleCurrency } = useCurrency();
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

      {/* Subtle Visual Transition Bridge Line to tight visual relationship */}
      <div className="flex justify-center -mt-6 mb-2 relative z-20">
        <div className="w-[1px] h-12 bg-gradient-to-b from-[var(--border)] via-[var(--accent)] to-transparent opacity-60" />
      </div>

      {/* Main Exploration Tiles */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase font-sans tracking-[0.25em] font-semibold text-[var(--accent)] block mb-2">
            Seasonal Curations
          </span>
          <h2 className="font-serif text-2xl md:text-4xl font-light text-[var(--text-primary)] tracking-tight">
            Explore the <span className="italic font-normal text-[var(--text-secondary)]">Curation</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-[10px] font-sans mt-3 tracking-[0.25em] uppercase">
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
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10 pb-8 z-20 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase font-sans tracking-[0.25em] font-semibold text-amber-100/95 mb-2 block">Editorial</span>
              <h3 className="font-serif text-2xl font-light mb-2 tracking-tight">Gallery</h3>
              <p className="text-stone-200/90 text-xs font-sans line-clamp-2 mb-5 font-light leading-relaxed">
                {siteContent?.galleryIntro || 'Visual diaries, styling stories, and close-up lifestyle curations.'}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group/explore self-start">
                <span className="relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-white group-hover:after:w-full after:transition-all after:duration-300">
                  Explore
                </span>
                <ArrowRight size={13} className="text-[var(--accent)] transition-transform duration-300 group-hover:translate-x-1" />
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
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10 pb-8 z-20 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase font-sans tracking-[0.25em] font-semibold text-amber-100/95 mb-2 block">Available Curation</span>
              <h3 className="font-serif text-2xl font-light mb-2 tracking-tight">Current Selections</h3>
              <p className="text-stone-200/90 text-xs font-sans line-clamp-2 mb-5 font-light leading-relaxed">
                {siteContent?.shopIntro || 'Vetted designer handbags, fine pieces, and pristine seasonal acquisitions.'}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group/explore self-start">
                <span className="relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-white group-hover:after:w-full after:transition-all after:duration-300">
                  Explore
                </span>
                <ArrowRight size={13} className="text-[var(--accent)] transition-transform duration-300 group-hover:translate-x-1" />
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
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10 pb-8 z-20 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase font-sans tracking-[0.25em] font-semibold text-amber-100/95 mb-2 block">Archive Portfolio</span>
              <h3 className="font-serif text-2xl font-light mb-2 tracking-tight">Past Collections</h3>
              <p className="text-stone-200/90 text-xs font-sans line-clamp-2 mb-5 font-light leading-relaxed">
                {siteContent?.archiveIntro || 'An archival directory of previously loved curations now residing with new owners.'}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group/explore self-start">
                <span className="relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-white group-hover:after:w-full after:transition-all after:duration-300">
                  Explore
                </span>
                <ArrowRight size={13} className="text-[var(--accent)] transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Optional: "New Arrivals" strip */}
        {newArrivals.length > 0 && (
          <div className="mt-16 border-t border-[var(--border)]/20 pt-16" id="home_new_arrivals_strip">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-[10px] uppercase font-sans tracking-[0.25em] font-semibold text-[var(--accent)] block mb-1">
                  Private Vault
                </span>
                <h2 className="font-serif text-xl md:text-3xl font-light text-[var(--text-primary)] flex items-center gap-2">
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

            <div className={newArrivals.length === 1 ? "flex justify-center max-w-sm mx-auto" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"}>
              {newArrivals.map((item, index) => {
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
                  <ScrollFadeIn key={item.id} delay={(index % 4) * 60}>
                    <div 
                      onClick={() => handleProductClick(item)}
                      className="group rounded-2xl border border-[var(--border)]/15 overflow-hidden shadow-2xs hover:shadow-sm flex flex-col bg-[var(--surface)] transition-all cursor-pointer w-full"
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

                        {newArrivals.length === 1 && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[8px] font-sans font-extrabold uppercase tracking-[0.15em] rounded bg-[var(--accent)] text-white shadow-xs">
                            Curated Spotlight Piece
                          </span>
                        )}

                        {item.condition && newArrivals.length !== 1 && (
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
                          <div className="text-[9px] font-semibold text-[var(--text-secondary)] tracking-[0.2em] uppercase mb-1">
                            {item.brand || 'Luxury Piece'}
                          </div>
                          <h3 className="font-serif text-sm font-light text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200 line-clamp-1 mb-1">
                            {item.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/15 mt-2">
                          <div 
                            className="flex items-center gap-1.5 cursor-pointer group/price hover:text-[var(--accent)] transition-colors"
                            onClick={(e) => { e.stopPropagation(); toggleCurrency(); }}
                            title="Click to toggle PHP / USD"
                          >
                            <span className="text-xs font-semibold text-[var(--text-primary)] group-hover/price:text-[var(--accent)] font-serif transition-colors">
                              {formatProductPrice(item, currency, exchangeRate)}
                            </span>
                            <span className="text-[8px] font-sans font-extrabold uppercase px-1 py-0.5 rounded-sm bg-stone-100 text-stone-500 group-hover/price:bg-amber-100 group-hover/price:text-amber-800 transition-all tracking-wider">
                              {currency}
                            </span>
                          </div>
                          
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
                  </ScrollFadeIn>
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
            <span className="text-[10px] uppercase font-sans tracking-[0.25em] font-semibold text-[var(--accent)] block mb-2">
              Our Commitment
            </span>
            <h2 className="font-serif text-2xl md:text-4xl font-light text-[var(--text-primary)] tracking-tight">
              The Good Finds Luxury Promise
            </h2>
            <p className="text-[var(--text-secondary)] text-xs font-sans mt-3 max-w-lg mx-auto leading-relaxed">
              Every vintage handbag and 18K fine jewelry piece is selected with uncompromising standards of authenticity, beauty, and craftsmanship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]/15 shadow-4xs hover:shadow-2xs transition-all duration-300 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--gold)] border border-[var(--border)]/15 shadow-3xs">
                <Award size={18} strokeWidth={2} />
              </div>
              <h3 className="font-serif text-base font-normal text-[var(--text-primary)] tracking-tight">18K Gold Verification</h3>
              <p className="text-[var(--text-secondary)] text-xs font-sans leading-relaxed">
                All jewelry listed is tested using precision acid-density methods and inspected for authentic vintage hallmarks or official stamps.
              </p>
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]/15 shadow-4xs hover:shadow-2xs transition-all duration-300 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--gold)] border border-[var(--border)]/15 shadow-3xs">
                <ShieldCheck size={18} strokeWidth={2} />
              </div>
              <h3 className="font-serif text-base font-normal text-[var(--text-primary)] tracking-tight">Authenticity Guarantee</h3>
              <p className="text-[var(--text-secondary)] text-xs font-sans leading-relaxed">
                Every bag and accessory undergoes a meticulous multi-point inspection of stitching, date codes, hardware engraving, and weight.
              </p>
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]/15 shadow-4xs hover:shadow-2xs transition-all duration-300 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--gold)] border border-[var(--border)]/15 shadow-3xs">
                <Search size={18} strokeWidth={2} />
              </div>
              <h3 className="font-serif text-base font-normal text-[var(--text-primary)] tracking-tight">Honest Condition Grading</h3>
              <p className="text-[var(--text-secondary)] text-xs font-sans leading-relaxed">
                We assign strict and conservative condition reports. High-definition close-up photography ensures full visual transparency.
              </p>
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]/15 shadow-4xs hover:shadow-2xs transition-all duration-300 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--gold)] border border-[var(--border)]/15 shadow-3xs">
                <Compass size={18} strokeWidth={2} />
              </div>
              <h3 className="font-serif text-base font-normal text-[var(--text-primary)] tracking-tight">Sourcing Concierge</h3>
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
