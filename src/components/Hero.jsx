import { useStore } from '../context/StoreContext';
import { SocialLinks } from './SocialLinks';
import { Sparkles } from 'lucide-react';
import { SEASONAL_DETAILS, STATIC_PARTICLES } from '../utils/seasonKicker';
import { placeholderImages } from '../placeholderImages';
import styles from './Hero.module.css';

export function Hero({ onCategoryClick, slim = false }) {
  const { heroImage, season, siteContent } = useStore();
  const hasHeroImage = Boolean(heroImage?.url && String(heroImage.url).trim());
  
  const currentSeason = season || 'classic';
  const detail = SEASONAL_DETAILS[currentSeason] || SEASONAL_DETAILS.classic;
  const BadgeIcon = detail.icon || Sparkles;

  return (
    <section className={`${styles.hero} ${slim ? styles.heroSlim : ''}`} id="store_hero">
      {/* Sun-inspired ambient decorative circle & sunburst for summer */}
      {currentSeason === 'summer' && (
        <div className={styles.summerAmbientSun} id="hero_summer_ambient_sun">
          <div className={styles.sunCore}></div>
          <div className={styles.sunRays}></div>
        </div>
      )}

      {/* Ambient Seasonal Floating Particles */}
      {STATIC_PARTICLES.map((p, idx) => (
        <span
          key={idx}
          className={`${styles.particle} ${detail.particleType === 'fall' ? styles.particleFall : styles.particleFloat}`}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.size,
            top: detail.particleType === 'fall' ? '-20px' : `${15 + (idx * 8)}%`,
          }}
        >
          {detail.symbol}
        </span>
      ))}

      <div className={styles.container}>
        <div className={styles.copyCol}>
          <span className={styles.badge}>
            <BadgeIcon 
              size={13} 
              className={`${styles.badgeIcon} ${currentSeason === 'summer' ? styles.summerSunIcon : ''}`} 
            />
            {detail.badge}
          </span>
          <h2 className={styles.title}>
            {detail.title} <br />
            <em>
              {detail.emphasis}
            </em>
          </h2>
          <p className={styles.subtitle}>
            {siteContent?.homeIntro || detail.subtitle}
          </p>
          <SocialLinks />
          {!slim && (
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
          )}
        </div>

        <div className={styles.heroImageColumn}>
          <img
            src={hasHeroImage ? heroImage.url : placeholderImages.hero}
            alt={hasHeroImage ? (heroImage.alt || 'Good Finds by AA') : 'Good Finds by AA Featured Curation'}
            className={styles.heroCrestImage}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </section>
  );
}
