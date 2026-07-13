import styles from './SectionLabel.module.css';

export default function SectionLabel({ children }) {
  return <span className={styles.label}>{children}</span>;
}
