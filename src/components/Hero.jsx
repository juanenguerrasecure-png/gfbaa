import styles from './Hero.module.css';

export function Hero({ onCategoryClick }) {
  return (
    <section className={styles.hero} id="store_hero">
      <div className={styles.container}>
        <div className={styles.copyCol}>
          <span className={styles.badge}>Curated Pre-Loved Luxury</span>
          <h2 className={styles.title}>
            Timeless classics for the modern collector.
          </h2>
          <p className={styles.kicker}>
            Authentic designer bags and 18K gold jewelry
          </p>
          <p className={styles.subtitle}>
            Discover a refined selection of pre-loved designer handbags and fine jewelry, chosen for elegance, condition, and enduring value.
          </p>
          <div className={styles.actions}>
            <button
              id="hero_btn_bags"
              onClick={() => onCategoryClick('bags')}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Shop Bags
            </button>
            <button
              id="hero_btn_jewelry"
              onClick={() => onCategoryClick('jewelry')}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Shop Jewelry
            </button>
          </div>
        </div>

        <div className={styles.visualCol} aria-hidden="true">
          <div className={styles.featureFrame}>
            <span className={styles.brandInitial}>GF</span>
            <span className={styles.decorLine} />
            <span className={styles.visualCaption}>Featured Curation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
