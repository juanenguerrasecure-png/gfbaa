import { ProductCard } from './ProductCard';
import styles from './Catalog.module.css';

const TITLES = {
  all:      'All pieces',
  bags:     'Designer bags',
  jewelry:  '18K gold jewelry',
  mint:     'Mint condition',
  under1k: 'Under $1,000',
};

export function Catalog({ items, activeFilter, onAddToCart, onClearFilter }) {
  let displayTitle = TITLES[activeFilter] ?? 'Collection';
  if (activeFilter && activeFilter.startsWith('brand:')) {
    const brandName = activeFilter.slice(6);
    displayTitle = `${brandName} Collection`;
  }

  return (
    <main className={styles.catalog}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>{displayTitle}</h2>
        <span className={styles.count}>
          {items.length} piece{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {activeFilter !== 'all' && onClearFilter && (
        <div className="flex items-center gap-2 mb-6" id="catalog_active_filters_row">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold font-sans">Active Filter:</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-full border border-stone-200 transition-all">
            <span>
              {activeFilter.startsWith('brand:') ? `Brand: ${activeFilter.slice(6)}` : TITLES[activeFilter] ?? activeFilter}
            </span>
            <button
              onClick={onClearFilter}
              className="w-4 h-4 rounded-full bg-stone-300 hover:bg-stone-400 flex items-center justify-center text-[9px] text-stone-700 hover:text-stone-900 ml-1 transition-all cursor-pointer"
              aria-label="Clear filter"
              id="clear_filter_btn"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <p>No pieces match this filter.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map(item => (
            <ProductCard key={item.id} item={item} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </main>
  );
}
