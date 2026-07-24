import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { SocialLinks } from './SocialLinks';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { SEASONAL_DETAILS, STATIC_PARTICLES } from '../utils/seasonKicker';
import { placeholderImages } from '../placeholderImages';
import styles from './Hero.module.css';

export function Hero({ onCategoryClick, slim = false }) {
  const { heroImage, season, siteContent } = useStore();
  const { theme } = useTheme() || {};
  const hasHeroImage = Boolean(heroImage?.url && String(heroImage.url).trim());
  
  const currentSeason = season || 'classic';
  const detail = SEASONAL_DETAILS[currentSeason] || SEASONAL_DETAILS.classic;
  const BadgeIcon = detail.icon || Sparkles;

  // New Look (Editorial) mode Hero presentation
  if (theme === 'editorial') {
    const heroBgUrl = hasHeroImage 
      ? heroImage.url 
      : 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1600&auto=format&fit=crop';

    return (
      <section 
        className="relative w-full h-[630px] min-h-[630px] bg-[#151713] text-[#F4F0E8] overflow-hidden select-none rounded-none"
        id="store_hero_new_look"
      >
        {/* Full-width cinematic photograph with focal point around 65% horizontally */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBgUrl} 
            alt="The Good Finds Edit" 
            className="w-full h-full object-cover object-[65%_center]"
            referrerPolicy="no-referrer"
          />
          {/* Dark left-side overlay for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#151713] via-[#151713]/85 via-45% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151713] via-transparent to-[#151713]/30" />
        </div>

        {/* Hero Content Block: ~32px from left, ~138px from top, max-width ~570px */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-8 pt-[138px] pb-12 flex flex-col justify-start">
          <div className="max-w-[570px] pl-0 sm:pl-2">
            {/* Eyebrow */}
            <span className="block font-sans font-medium text-[7px] uppercase tracking-[0.4em] text-[#C4A269] mb-[28px]">
              THE GOOD FINDS EDIT
            </span>

            {/* Main Headline */}
            <h1 className="font-serif tracking-tight leading-[0.95] mb-6">
              <span className="block text-4xl sm:text-5xl md:text-[68px] font-light text-[#F4F0E8]">
                Beautiful things,
              </span>
              <span className="block text-4xl sm:text-5xl md:text-[68px] font-normal italic text-[#C4A269] mt-1">
                found again.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="max-w-[550px] font-serif text-[15px] font-normal leading-[2] text-[#F4F0E8]/90 mb-8">
              A considered collection of preloved designer handbags and verified fine jewelry—chosen for character, craftsmanship, and a life beyond the first owner.
            </p>

            {/* Primary Action Button */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                id="hero_btn_explore_edit"
                onClick={() => onCategoryClick ? onCategoryClick('all') : null}
                className="w-[180px] h-[44px] bg-[#F5F3EE] text-[#151713] border border-[#B8A57A] rounded-none hover:bg-[#151713] hover:text-[#F5F3EE] hover:border-[#C4A269] transition-all duration-300 font-sans text-[10px] uppercase tracking-[0.25em] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98"
              >
                <span>EXPLORE THE EDIT</span>
                <ArrowUpRight size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
