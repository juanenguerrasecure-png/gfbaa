import styles from './Filters.module.css';

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'bags',     label: 'Bags' },
  { key: 'jewelry',  label: 'Jewelry' },
  { key: 'mint',     label: 'Mint' },
  { key: 'under1k',  label: 'Under $1k' },
];

export function Filters({ activeFilter, onFilterChange, onSortChange, availableBrands = [] }) {
  return (
    <div className={styles.wrap} id="storefront_filters_wrap">
      <div className={styles.scrollArea} id="storefront_filters_scroll">
        <div className={styles.pills} id="storefront_filters_pills_container">
          {FILTERS.map(f => (
            <button
              key={f.key}
              id={`filter_pill_${f.key}`}
              className={`${styles.pill} ${activeFilter === f.key ? styles.active : ''}`}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}

          {availableBrands.length > 0 && (
            <div className={styles.divider} id="storefront_brand_filters_divider" />
          )}

          {availableBrands.map(brand => {
            const key = `brand:${brand}`;
            const normalizedBrandId = brand.toLowerCase().replace(/[^a-z0-9]/g, '_');
            return (
              <button
                key={key}
                id={`filter_pill_brand_${normalizedBrandId}`}
                className={`${styles.pill} ${activeFilter === key ? styles.active : ''}`}
                onClick={() => onFilterChange(key)}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles.sortWrap} id="storefront_sort_wrap">
        <select
          id="storefront_sort_select"
          className={styles.sort}
          onChange={e => onSortChange(e.target.value)}
          aria-label="Sort items"
        >
          <option value="default">Featured</option>
          <option value="low">Price ↑</option>
          <option value="high">Price ↓</option>
          <option value="name">A–Z</option>
        </select>
      </div>
    </div>
  );
}
