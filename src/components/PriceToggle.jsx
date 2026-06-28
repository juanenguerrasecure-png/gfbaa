import { useCurrency } from '../hooks/useCurrency';
import styles from './PriceToggle.module.css';

export function PriceToggle({ compact = false }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={`${styles.toggle} ${compact ? styles.compact : ''}`} role="group" aria-label="Price currency toggle">
      <button
        type="button"
        className={`${styles.option} ${currency === 'PHP' ? styles.active : ''}`}
        onClick={() => setCurrency('PHP')}
        aria-pressed={currency === 'PHP'}
      >
        <span className={styles.symbol}>₱</span>
        {!compact && <span>PHP</span>}
      </button>
      <button
        type="button"
        className={`${styles.option} ${currency === 'USD' ? styles.active : ''}`}
        onClick={() => setCurrency('USD')}
        aria-pressed={currency === 'USD'}
      >
        <span className={styles.symbol}>$</span>
        {!compact && <span>USD</span>}
      </button>
    </div>
  );
}
