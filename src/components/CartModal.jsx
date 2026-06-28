import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, ShoppingBag, Send, CheckCircle, MapPin, Mail, User } from 'lucide-react';
import { PaymentInfoModal } from './PaymentInfoModal';
import { formatProductPrice, useCurrency } from '../hooks/useCurrency';
import styles from './CartModal.module.css';

export function CartModal({ isOpen, onClose, cart, onRemove, onClear, showToast }) {
  const { paymentMethods = {}, addPurchaseRequest, exchangeRate } = useStore();
  const { currency } = useCurrency();
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successRequest, setSuccessRequest] = useState(null);
  const [activePayment, setActivePayment] = useState(null);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = async (e) => {
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

    try {
      const itemsPayload = cart.map(item => ({
        productId: item.id,
        name: item.name,
        brand: item.brand,
        qty: 1,
        price: item.price,
        emoji: item.emoji || 'bag'
      }));

      let requestObj;
      try {
        const response = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerName: buyerName.trim(),
            buyerEmail: buyerEmail.trim(),
            buyerContact: buyerEmail.trim(),
            buyerAddress: buyerAddress.trim(),
            specialInstructions: specialInstructions.trim(),
            message: specialInstructions.trim(),
            productId: itemsPayload[0]?.productId || '',
            productName: itemsPayload[0]?.name || '',
            items: itemsPayload
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'Failed to submit request.');
        requestObj = result.request;
      } catch (fetchErr) {
        console.warn('Backend requests submission failed; creating locally:', fetchErr);
        if (addPurchaseRequest) {
          requestObj = addPurchaseRequest({
            buyerName: buyerName.trim(),
            buyerEmail: buyerEmail.trim(),
            buyerAddress: buyerAddress.trim(),
            specialInstructions: specialInstructions.trim(),
            items: itemsPayload
          });
        } else {
          throw fetchErr;
        }
      }

      setSuccessRequest(requestObj);
      onClear();
      showToast('Request submitted successfully');
    } catch (_err) {
      showToast('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessRequest(null);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerAddress('');
    setSpecialInstructions('');
    onClose();
  };

  const PaymentButton = ({ platform, label, bg }) => (
    <button type="button" onClick={() => setActivePayment(platform)} className="flex flex-1 items-center justify-center gap-2 rounded border border-[#E5DFD8] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-800 transition hover:border-[#C9A84C] hover:bg-[#FBF5E8]">
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-[11px] font-bold text-white" style={{ backgroundColor: bg }}>{label[0]}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrap}><ShoppingBag size={20} className={styles.bagIcon} /><h2 className={styles.title}>Your Shopping Bag</h2></div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </div>

        {successRequest ? (
          <div className={styles.successScreen}>
            <CheckCircle size={48} className={styles.successIcon} />
            <h3 className={styles.successTitle}>Request Placed!</h3>
            <p className={styles.successText}>Thank you, <strong>{successRequest.buyerName}</strong>! Your purchase request has been submitted to our administrator.</p>
            <div className={styles.successDetails}>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Reference ID:</span><span className={styles.detailValue}>{successRequest.id}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Registered Email:</span><span className={styles.detailValue}>{successRequest.buyerEmail || successRequest.buyerContact}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Shipping Address:</span><span className={styles.detailValue}>{successRequest.buyerAddress}</span></div>
            </div>
            <p className={styles.noteText}>Our administrator will review current batch margins, calculate the precise shipping cost for your address, and email you to arrange final shipping details.</p>
            <button className={styles.primaryBtn} onClick={handleCloseSuccess}>Continue Shopping</button>
          </div>
        ) : (
          <div className={styles.content}>
            {cart.length === 0 ? (
              <div className={styles.emptyState}><ShoppingBag size={48} className={styles.emptyIcon} /><p className={styles.emptyText}>Your shopping bag is currently empty.</p><button className={styles.secondaryBtn} onClick={onClose}>Browse luxury curation</button></div>
            ) : (
              <div className={styles.layout}>
                <div className={styles.itemsSection}>
                  <h3 className={styles.sectionTitle}>Selected Curation ({cart.length})</h3>
                  <div className={styles.itemsList}>{cart.map((item, idx) => <div key={`${item.id}-${idx}`} className={styles.cartItem}><div className={styles.itemEmoji}>{item.emoji || 'bag'}</div><div className={styles.itemInfo}><h4 className={styles.itemName}>{item.name}</h4><p className={styles.itemBrand}>{item.brand}</p><span className={styles.itemCatBadge}>{item.cat}</span></div><div className={styles.itemPriceWrap}><span className={styles.itemPrice}>{formatProductPrice(item, currency, exchangeRate)}</span><button className={styles.removeBtn} onClick={() => onRemove(idx)} title="Remove from bag"><Trash2 size={15} /></button></div></div>)}</div>
                  <div className="mb-4 rounded border border-[#E5DFD8] bg-[#FAF8F5] p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">Payment Methods Accepted</p><div className="flex gap-2"><PaymentButton platform="zelle" label="Zelle" bg="#6D1ED4" /><PaymentButton platform="venmo" label="Venmo" bg="#3D95CE" /></div></div>
                  <div className={styles.summaryBox}><div className={styles.summaryRow}><span>Luxury Curation Total</span><span className={styles.totalPrice}>{formatProductPrice({ price: totalAmount }, currency, exchangeRate)}</span></div><div className={styles.alertBanner}><p className={styles.alertText}>* No payment is processed online. This request secures the item(s) for administrator review.</p></div></div>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Request Shipping & Curation</h3>
                  <p className={styles.formIntro}>Provide your contact info and shipping address to get an exact logistics quotation.</p>
                  <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}><label className={styles.label}>Full Name <span className={styles.required}>*</span></label><div className={styles.inputIconWrap}><User size={14} className={styles.inputIcon} /><input type="text" required placeholder="Full name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className={styles.input} /></div></div>
                    <div className={styles.inputGroup}><label className={styles.label}>Email Address <span className={styles.required}>*</span></label><div className={styles.inputIconWrap}><Mail size={14} className={styles.inputIcon} /><input type="email" required placeholder="Email address" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className={styles.input} /></div></div>
                    <div className={styles.inputGroup}><label className={styles.label}>Shipping Address <span className={styles.required}>*</span></label><div className={styles.inputIconWrap}><MapPin size={14} className={styles.textareaIcon} /><textarea required rows={3} placeholder="Complete shipping address" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} className={styles.textarea} /></div></div>
                    <div className={styles.inputGroup}><label className={styles.label}>Special Instructions (Optional)</label><textarea rows={2} placeholder="Special instructions" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} className={styles.textarea} /></div>
                    <div className={styles.actionBar}><button type="submit" disabled={isSubmitting} className={styles.submitBtn}>{isSubmitting ? <span className={styles.loader}>Sending Curation Request...</span> : <><Send size={14} /><span>Submit Curation Request</span></>}</button></div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <PaymentInfoModal isOpen={Boolean(activePayment)} platform={activePayment} info={activePayment ? paymentMethods?.[activePayment] : {}} onClose={() => setActivePayment(null)} />
    </div>
  );
}
