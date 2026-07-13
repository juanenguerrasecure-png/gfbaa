import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={styles.toggle}
      title={theme === 'classic'
        ? 'Switch to Editorial look'
        : 'Switch to Classic look'}
    >
      <span className={styles.icon}>
        {theme === 'classic' ? '◐' : '●'}
      </span>
      <span className={styles.label}>
        {theme === 'classic' ? 'Editorial' : 'Classic'}
      </span>
    </button>
  );
}
