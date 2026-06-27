import { useStore } from '../context/StoreContext';
import ViberIcon from '../assets/icons/ViberIcon';
import WIcon from '../assets/icons/WIcon';
import styles from './SocialLinks.module.css';

function FacebookIcon({ size = 18, className }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <path d="M14 8h2V5h-3c-2.4 0-4 1.6-4 4v3H7v3h2v6h3v-6h3l.5-3H12V9.5c0-1 .5-1.5 2-1.5z" />
    </svg>
  );
}

function InstagramIcon({ size = 18, className }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.5" cy="7.5" r="1" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18, className }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 8c1 5 3 7 8 8" stroke="#FAF8F5" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const SOCIAL_META = [
  { key: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { key: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { key: 'whatnot', label: 'Whatnot', icon: WIcon },
  { key: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { key: 'viber', label: 'Viber', icon: ViberIcon },
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
        <a key={key} href={url} target="_blank" rel="noreferrer" className={styles.socialIcon} aria-label={label} title={label}>
          <Icon size={22} className={styles.svgIcon} />
        </a>
      ))}
    </div>
  );
}
