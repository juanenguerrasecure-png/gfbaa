import { Check } from 'lucide-react';
import styles from './Toast.module.css';

export function Toast({ visible, msg }) {
  if (!visible) return null;

  return (
    <div className={styles.toast} id="app_toast" role="status">
      <div className={styles.inner}>
        <span className={styles.icon}>
          <Check size={14} strokeWidth={3} />
        </span>
        <span className={styles.msg}>{msg}</span>
      </div>
    </div>
  );
}
