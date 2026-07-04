import { X } from 'lucide-react';
import styles from './PaymentInfoModal.module.css';

const PLATFORM_LABELS = {
  zelle: 'Zelle',
  venmo: 'Venmo',
  paypal: 'PayPal',
};

export function PaymentInfoModal({ isOpen, platform, info = {}, onClose }) {
  if (!isOpen) return null;

  const label = PLATFORM_LABELS[platform] || 'Payment';
  const handle = info?.handle || '';
  const instructions = info?.instructions || '';
  const qrUrl = info?.qrUrl || '';
  const isConfigured = Boolean(handle || instructions || qrUrl);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Payment Method</span>
            <h3 className={styles.title}>{label}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close payment information">
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {!isConfigured ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Payment info not configured yet.</p>
              <p className={styles.emptyText}>Please wait for the administrator to provide final payment details after your request is reviewed.</p>
            </div>
          ) : (
            <>
              {handle && (
                <div className={styles.infoBlock}>
                  <span className={styles.label}>Handle / Username</span>
                  <p className={styles.handle}>{handle}</p>
                </div>
              )}

              {instructions && (
                <div className={styles.infoBlock}>
                  <span className={styles.label}>Instructions</span>
                  <p className={styles.instructions}>{instructions}</p>
                </div>
              )}

              {qrUrl && (
                <div className={styles.qrBlock}>
                  <span className={styles.label}>QR Code</span>
                  <img className={styles.qrImage} src={qrUrl} alt={`${label} QR code`} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
