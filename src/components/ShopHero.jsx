import { useStore } from '../context/StoreContext';
import { Sparkles } from 'lucide-react';
import { SEASONAL_DETAILS } from '../utils/seasonKicker';

export function ShopHero() {
  const { season, catalogItems, getCatalogItemStock, siteContent } = useStore();
  const currentSeason = season || 'classic';
  const detail = SEASONAL_DETAILS[currentSeason] || SEASONAL_DETAILS.classic;
  const BadgeIcon = detail.icon || Sparkles;

  const activeCount = catalogItems.filter(item => {
    const stock = getCatalogItemStock ? getCatalogItemStock(item.id) : 1;
    return stock > 0;
  }).length;

  const displayIntro = siteContent?.shopIntro || 'Vetted designer handbags, fine pieces, and pristine seasonal acquisitions.';

  return (
    <section 
      className="relative overflow-hidden py-10 md:py-14 border-b border-stone-200/40 select-none"
      style={{ backgroundColor: 'var(--accent-soft, #FAF8F5)' }}
      id="shop_hero"
    >
      {/* Tiny decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-25 overflow-hidden">
        <span className="absolute left-10 top-6 text-sm">{detail.symbol}</span>
        <span className="absolute right-12 bottom-6 text-sm">{detail.symbol}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Seasonal Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border shadow-xs mb-4" style={{ borderColor: 'var(--accent, #C9A84C)' }}>
          <BadgeIcon size={12} style={{ color: 'var(--accent, #C9A84C)' }} />
          <span className="text-[9px] md:text-[10px] font-sans font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            {detail.badge}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl md:text-4xl font-light text-[var(--text-primary)] tracking-tight mb-3">
          Current Selections
        </h1>

        {/* Dynamic stock count */}
        <p className="text-[var(--text-secondary)] font-mono text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-3">
          {activeCount} {activeCount === 1 ? 'piece' : 'pieces'} currently in the vault
        </p>

        {/* Editable description */}
        <p className="max-w-xl mx-auto text-[var(--text-secondary)] text-xs md:text-sm font-sans leading-relaxed">
          {displayIntro}
        </p>
      </div>
    </section>
  );
}
