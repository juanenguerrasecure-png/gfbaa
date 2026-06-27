import { ProductCard } from './ProductCard';
import styles from './Catalog.module.css';

const TITLES = {
  all:      'All pieces',
  bags:     'Designer bags',
  jewelry:  '18K gold jewelry',
  mint:     'Mint condition',
  under1k: 'Under $1,000',
};

export function Catalog({ items, activeFilter, onAddToCart }) {
  return (
    <main className={styles.catalog}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>{TITLES[activeFilter] ?? 'Collection'}</h2>
        <span className={styles.count}>
          {items.length} piece{items.length !== 1 ? 's' : ''}
        </span>
      </div>

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
