import { useStore } from '../context/StoreContext';
import { SocialLinks } from './SocialLinks';
import { Sparkles, Flower, Sun, Leaf, Snowflake } from 'lucide-react';
import styles from './Hero.module.css';

const SEASONAL_DETAILS = {
  classic: {
    badge: 'Classic Luxury — Timeless Picks',
    icon: Sparkles,
    symbol: '✦',
    particleType: 'float',
    title: 'Timeless Classics.',
    emphasis: '100% Authentic Pre-loved and Brand-new luxury goods and 18k Gold Jewelries. Money back guaranteed.',
    subtitle: 'Discover our meticulously selected collection of pre-loved designer handbags and exquisite selections of jewelry. Handpicked treasures that define elegance.'
  },
  spring: {
    badge: 'Spring Refresh — New Arrivals',
    icon: Flower,
    symbol: '🌸',
    particleType: 'fall',
    title: 'Spring Blossom Curation.',
    emphasis: 'Celebrate with fresh pastel tones, cherry blossom leather hues, and elegant solid 18k gold fine jewelry.',
    subtitle: 'Indulge in a beautiful renewal with curated luxury pieces designed to capture the fresh energy, light breeze, and gentle growth of spring.'
  },
  summer: {
    badge: 'Summer Edit — Golden Hour Curation',
    icon: Sun,
    symbol: '☀️',
    particleType: 'float',
    title: 'Sun-Drenched Summer Edit.',
    emphasis: 'Curated warm-toned terracotta leathers, honey-gold patinas, and glistening 18k gold jewelry.',
    subtitle: 'Embrace the vibrant golden hour energy with our meticulously selected warm-hued designer handbags and radiant jewelry inspired by the brilliant summer sun.'
  },
  autumn: {
    badge: 'Autumn Curation — Warm Crimson',
    icon: Leaf,
    symbol: '🍁',
    particleType: 'fall',
    title: 'Harvest Velvet & Ochre.',
    emphasis: 'Cozy rust textures, deep forest tones, and opulent harvest gold accessories.',
    subtitle: 'Prepare for the crisp breeze with our warm collection of autumn leather goods, mahogany accents, and rich, statement jewelry pieces.'
  },
  winter: {
    badge: 'Winter Edit — Festive Curation',
    icon: Snowflake,
    symbol: '❄️',
    particleType: 'fall',
    title: 'Frosted Sapphire Curation.',
    emphasis: 'Breathtaking icy silver hardware, deep winter sapphire leathers, and brilliant diamond jewelry.',
    subtitle: 'Celebrate the gifting season with luxurious winter-white accessories and exquisite jewelries that glisten like fresh frost.'
  }
};

const STATIC_PARTICLES = [
  { left: '5%', delay: '0s', duration: '11s', size: '14px' },
  { left: '18%', delay: '4s', duration: '14s', size: '20px' },
  { left: '32%', delay: '2s', duration: '12s', size: '16px' },
  { left: '48%', delay: '6s', duration: '15s', size: '18px' },
  { left: '62%', delay: '1s', duration: '10s', size: '22px' },
  { left: '76%', delay: '5s', duration: '13s', size: '15px' },
  { left: '89%', delay: '3s', duration: '16s', size: '12px' },
  { left: '95%', delay: '7s', duration: '9s', size: '19px' },
];

export function Hero({ onCategoryClick }) {
  const { heroImage, season } = useStore();
  const hasHeroImage = Boolean(heroImage?.url && String(heroImage.url).trim());
  
  const currentSeason = season || 'classic';
  const detail = SEASONAL_DETAILS[currentSeason] || SEASONAL_DETAILS.classic;
  const BadgeIcon = detail.icon || Sparkles;

  return (
    <section className={styles.hero} id="store_hero">
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
            {detail.subtitle}
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
