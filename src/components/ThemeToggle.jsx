import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={styles.toggle}
      id="theme_toggle_btn"
      title={theme === 'classic'
        ? 'Switch to New Look'
        : 'Switch to Classic Look'}
    >
      <span className={styles.icon}>
        {theme === 'classic' ? '✨' : '🏛️'}
      </span>
      <span className={styles.label}>
        {theme === 'classic' ? 'New Look' : 'Classic Look'}
      </span>
    </button>
  );
}
