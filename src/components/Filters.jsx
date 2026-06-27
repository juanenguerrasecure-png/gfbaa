import styles from './Filters.module.css';

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'bags',     label: 'Bags' },
  { key: 'jewelry',  label: 'Jewelry' },
  { key: 'mint',     label: 'Mint' },
  { key: 'under1k', label: 'Under $1k' },
];

export function Filters({ activeFilter, onFilterChange, onSortChange }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.scrollArea}>
        <div className={styles.pills}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.pill} ${activeFilter === f.key ? styles.active : ''}`}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.sortWrap}>
        <select
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
