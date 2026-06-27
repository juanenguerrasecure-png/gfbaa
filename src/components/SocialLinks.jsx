import { Facebook, Instagram, PhoneCall, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import styles from './SocialLinks.module.css';

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.svgIcon}>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.07-1.35C8.43 21.51 10.18 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8.65 7.85c.2-.45.38-.46.56-.46h.48c.16 0 .38.06.58.32.2.26.76.92.76 2.25 0 1.33-.78 2.62-.9 2.8-.11.18-1.52 2.45-3.75 3.33-.52.2-.93.32-1.25.41-.52.17-.99.15-1.36.09-.42-.06-1.28-.52-1.46-1.03-.18-.51-.18-.94-.13-1.03.05-.09.2-.15.42-.26.21-.11 1.27-.63 1.47-.7.2-.08.34-.11.49.11.15.22.56.7.69.84.13.15.26.17.48.06.22-.11.94-.35 1.79-1.11.66-.59 1.11-1.32 1.24-1.54.13-.22.01-.34-.1-.45-.1-.1-.22-.26-.34-.39-.11-.13-.15-.22-.22-.37-.07-.15-.04-.28.02-.39.06-.11.49-1.2.67-1.63z" fill="#FAF8F5" opacity="0.9" transform="scale(.62) translate(6.9 4.4)" />
    </svg>
  );
}

const SOCIAL_META = [
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'whatnot', label: 'Whatnot', icon: ShoppingBag },
  { key: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { key: 'viber', label: 'Viber', icon: PhoneCall },
];

export function SocialLinks({ className = '' }) {
  const { socialLinks = {} } = useStore();
  const links = SOCIAL_META
    .map(item => ({ ...item, url: socialLinks[item.key] || '' }))
    .filter(item => item.url && String(item.url).trim());

  if (!links.length) return null;

  return (
    <div className={`${styles.socialLinks} ${className}`} aria-label="Good Finds by AA social media links">
      {links.map(({ key, label, url, icon: Icon }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          className={styles.socialIcon}
          aria-label={label}
          title={label}
        >
          <Icon size={18} strokeWidth={1.7} />
        </a>
      ))}
    </div>
  );
}
