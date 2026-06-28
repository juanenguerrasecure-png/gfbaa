import { useCurrency } from '../hooks/useCurrency';
import styles from './PriceToggle.module.css';

export function PriceToggle({ compact = false, allowUsd = true }) {
  const { currency, setCurrency } = useCurrency();
  const effectiveCurrency = allowUsd ? currency : 'PHP';

  return (
    <div className={`${styles.toggle} ${compact ? styles.compact : ''}`} role="group" aria-label="Price currency toggle">
      <button
        type="button"
        className={`${styles.option} ${effectiveCurrency === 'PHP' ? styles.active : ''}`}
        onClick={() => setCurrency('PHP')}
        aria-pressed={effectiveCurrency === 'PHP'}
      >
        <span className={styles.symbol}>₱</span>
        {!compact && <span>PHP</span>}
      </button>
      {allowUsd && (
        <button
          type="button"
          className={`${styles.option} ${effectiveCurrency === 'USD' ? styles.active : ''}`}
          onClick={() => setCurrency('USD')}
          aria-pressed={effectiveCurrency === 'USD'}
        >
          <span className={styles.symbol}>$</span>
          {!compact && <span>USD</span>}
        </button>
      )}
    </div>
  );
}
