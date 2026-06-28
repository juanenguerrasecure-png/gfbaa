import { useStore } from '../context/StoreContext';
import { SocialLinks } from './SocialLinks';
import styles from './Hero.module.css';

export function Hero({ onCategoryClick }) {
  const { heroImage } = useStore();
  const hasHeroImage = Boolean(heroImage?.url && String(heroImage.url).trim());

  return (
    <section className={styles.hero} id="store_hero">
      <div className={styles.container}>
        <div className={styles.copyCol}>
          <span className={styles.badge}>Curated Pre-Loved Luxury</span>
          <h2 className={styles.title}>
            Timeless Classics. <br />
            <em>
              100% Authentic Pre-loved and Brand-new luxury goods and 18k Gold Jewelries. Money back guaranteed.
            </em>
          </h2>
          <p className={styles.subtitle}>
            Discover our meticulously selected collection of pre-loved designer handbags and exquisite selections of jewelry. Handpicked treasures that define elegance.
          </p>
          <SocialLinks />
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

        {hasHeroImage ? (
          <div className={styles.heroImageColumn}>
            <img
              src={heroImage.url}
              alt={heroImage.alt || 'Good Finds by AA'}
              className={styles.heroCrestImage}
            />
          </div>
        ) : (
          <div className={styles.heroImageColumn}>
            <div className={styles.heroPlaceholder}>
              <span className={styles.heroPlaceholderInitials}>GF</span>
              <span className={styles.heroPlaceholderLabel}>FEATURED CURATION</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
