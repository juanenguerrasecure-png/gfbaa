import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, ShoppingBag, Send, CheckCircle, MapPin, Mail, User } from 'lucide-react';
import styles from './CartModal.module.css';

export function CartModal({ isOpen, onClose, cart, onRemove, onClear, showToast }) {
  const { addPurchaseRequest } = useStore();
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successRequest, setSuccessRequest] = useState(null);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your shopping bag is empty.');
      return;
    }
    if (!buyerName.trim() || !buyerEmail.trim() || !buyerAddress.trim()) {
      showToast('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Simulate small backend network timing for aesthetic perfection
    setTimeout(() => {
      try {
        const itemsPayload = cart.map(item => ({
          productId: item.id,
          name: item.name,
          brand: item.brand,
          qty: 1, // Storefront sells single-unit items
          price: item.price,
          emoji: item.emoji || '👜'
        }));

        const newRequest = addPurchaseRequest({
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerAddress: buyerAddress.trim(),
          specialInstructions: specialInstructions.trim(),
          items: itemsPayload
        });

        setSuccessRequest(newRequest);
        onClear(); // Wipe client cart
        showToast('Purchase request sent to administrator!');
      } catch (err) {
        showToast('Failed to submit purchase request.');
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };

  const handleCloseSuccess = () => {
    setSuccessRequest(null);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerAddress('');
    setSpecialInstructions('');
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <ShoppingBag size={20} className={styles.bagIcon} />
            <h2 className={styles.title}>Your Shopping Bag</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {successRequest ? (
          /* Success Screen */
          <div className={styles.successScreen}>
            <CheckCircle size={48} className={styles.successIcon} />
            <h3 className={styles.successTitle}>Request Placed!</h3>
            <p className={styles.successText}>
              Thank you, <strong>{successRequest.buyerName}</strong>! Your purchase request has been submitted to our administrator.
            </p>
            <div className={styles.successDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reference ID:</span>
                <span className={styles.detailValue}>{successRequest.id}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Registered Email:</span>
                <span className={styles.detailValue}>{successRequest.buyerEmail}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Shipping Address:</span>
                <span className={styles.detailValue}>{successRequest.buyerAddress}</span>
              </div>
            </div>
            <p className={styles.noteText}>
              Our administrator will review current batch margins, calculate the precise shipping cost for your address, and email you to arrange final shipping & details.
            </p>
            <button className={styles.primaryBtn} onClick={handleCloseSuccess}>
              Continue Shopping
            </button>
          </div>
        ) : (
          /* Main Cart Content */
          <div className={styles.content}>
            {cart.length === 0 ? (
              <div className={styles.emptyState}>
                <ShoppingBag size={48} className={styles.emptyIcon} />
                <p className={styles.emptyText}>Your shopping bag is currently empty.</p>
                <button className={styles.secondaryBtn} onClick={onClose}>
                  Browse luxury curation
                </button>
              </div>
            ) : (
              <div className={styles.layout}>
                {/* Items List */}
                <div className={styles.itemsSection}>
                  <h3 className={styles.sectionTitle}>Selected Curation ({cart.length})</h3>
                  <div className={styles.itemsList}>
                    {cart.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className={styles.cartItem}>
                        <div className={styles.itemEmoji}>{item.emoji || '👜'}</div>
                        <div className={styles.itemInfo}>
                          <h4 className={styles.itemName}>{item.name}</h4>
                          <p className={styles.itemBrand}>{item.brand}</p>
                          <span className={styles.itemCatBadge}>{item.cat}</span>
                        </div>
                        <div className={styles.itemPriceWrap}>
                          <span className={styles.itemPrice}>${item.price.toLocaleString()}</span>
                          <button 
                            className={styles.removeBtn} 
                            onClick={() => onRemove(idx)}
                            title="Remove from bag"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.summaryBox}>
                    <div className={styles.summaryRow}>
                      <span>Luxury Curation Total</span>
                      <span className={styles.totalPrice}>${totalAmount.toLocaleString()}</span>
                    </div>
                    <div className={styles.alertBanner}>
                      <p className={styles.alertText}>
                        * No payment is processed online. This request secures the item(s) for administrator review.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checkout Request Form */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Request Shipping & Curation</h3>
                  <p className={styles.formIntro}>
                    Provide your contact info and shipping address to get an exact logistics quotation.
                  </p>

                  <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Full Name <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputIconWrap}>
                        <User size={14} className={styles.inputIcon} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maria Clara"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Email Address <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputIconWrap}>
                        <Mail size={14} className={styles.inputIcon} />
                        <input
                          type="email"
                          required
                          placeholder="e.g. maria.clara@example.com"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Shipping Address <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputIconWrap}>
                        <MapPin size={14} className={styles.textareaIcon} />
                        <textarea
                          required
                          rows={3}
                          placeholder="Please enter your complete address (Street, Apt/Suite, City, Province, Zip code)"
                          value={buyerAddress}
                          onChange={(e) => setBuyerAddress(e.target.value)}
                          className={styles.textarea}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Special Instructions (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Ring sizing, specific timing, packaging requests"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        className={styles.textarea}
                      />
                    </div>

                    <div className={styles.actionBar}>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={styles.submitBtn}
                      >
                        {isSubmitting ? (
                          <span className={styles.loader}>Sending Curation Request...</span>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Submit Curation Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
