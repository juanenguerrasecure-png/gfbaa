import styles from './Hero.module.css';

export function Hero({ onCategoryClick }) {
  return (
    <section className={styles.hero} id="store_hero">
      <div className={styles.container}>
        <div className={styles.copyCol}>
          <span className={styles.badge}>Curated Pre-Loved Luxury</span>
          <h2 className={styles.title}>
            Timeless Classics. <br />
            <em>Guaranteed Authenticity.</em>
          </h2>
          <p className={styles.kicker}>
            Good Finds by AA
          </p>
          <p className={styles.subtitle}>
            Discover our meticulously authenticated collection of pre-loved designer handbags and exquisite 18K gold jewelry. Handpicked treasures that define elegance.
          </p>
          <div className={styles.actions}>
            <button
              id="hero_btn_bags"
              onClick={() => onCategoryClick('bags')}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Shop Luxury Bags
            </button>
            <button
              id="hero_btn_jewelry"
              onClick={() => onCategoryClick('jewelry')}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Explore Fine Jewelry
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
