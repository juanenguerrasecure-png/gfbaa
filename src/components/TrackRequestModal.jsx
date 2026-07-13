import { useState } from 'react';
import { X, Search, FileText, CheckCircle2, Clock, CreditCard, Truck, AlertCircle, Upload, QrCode, Clipboard, Check, XCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatProductPrice, useCurrency } from '../hooks/useCurrency';

export function TrackRequestModal({ isOpen, onClose, showToast }) {
  const { purchaseRequests = [], updatePurchaseRequest, paymentMethods = {}, exchangeRate, syncAfterLocalChange } = useStore();
  const { currency } = useCurrency();

  const [searchId, setSearchId] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [activeRequest, setActiveRequest] = useState(null);
  const [copiedText, setCopiedText] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Form for submitting payment details
  const [payMethod, setPayMethod] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [proofBase64, setProofBase64] = useState('');

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim() || !searchEmail.trim()) {
      showToast('Please enter both your Reference ID and registered Email.');
      return;
    }

    const cleanId = searchId.trim().toLowerCase();
    const cleanEmail = searchEmail.trim().toLowerCase();

    const found = purchaseRequests.find(req => {
      const matchId = String(req.id).toLowerCase() === cleanId || 
                      String(req.requestNumber || '').toLowerCase() === cleanId;
      const matchEmail = String(req.buyerEmail || req.buyerContact || '').toLowerCase() === cleanEmail;
      return matchId && matchEmail;
    });

    if (found) {
      setActiveRequest(found);
      // Pre-select payment method from order details
      setPayMethod(found.paymentMethod || 'Zelle');
      setTxnRef(found.paymentDetails?.transactionReference || '');
      setBuyerNotes(found.paymentDetails?.notes || '');
      setProofBase64(found.paymentDetails?.proofUrl || '');
      showToast('Request record retrieved successfully.');
    } else {
      showToast('No matching purchase request found. Please verify your entries.');
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file only (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofBase64(reader.result);
      showToast('Payment screenshot loaded.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPaymentProof = async (e) => {
    e.preventDefault();
    if (!activeRequest) return;
    if (!txnRef.trim()) {
      showToast('Please enter a transaction reference number or Sender Name.');
      return;
    }

    setIsSubmittingProof(true);

    try {
      const updatedDetails = {
        methodUsed: payMethod,
        receivedAt: null, // Admin will set this when verified
        amountReceived: null,
        transactionReference: txnRef.trim(),
        proofUrl: proofBase64,
        notes: buyerNotes.trim(),
        submittedAt: new Date().toISOString()
      };

      // Add activity log
      const currentLogs = activeRequest.activityLog || [];
      const newLogs = [
        ...currentLogs,
        {
          action: 'PAYMENT_PROOF_SUBMITTED',
          timestamp: new Date().toISOString(),
          description: `Buyer submitted payment proof for ${payMethod}. Ref: ${txnRef.trim()}`
        }
      ];

      // Update locally and trigger state sync
      updatePurchaseRequest(activeRequest.id, {
        status: 'payment_submitted',
        paymentDetails: updatedDetails,
        activityLog: newLogs
      });

      // Fetch the updated request object from the store list to keep UI synchronized
      const updatedReq = {
        ...activeRequest,
        status: 'payment_submitted',
        paymentDetails: updatedDetails,
        activityLog: newLogs
      };
      setActiveRequest(updatedReq);

      await syncAfterLocalChange();
      showToast('Payment proof submitted successfully! Waiting for admin verification.');
    } catch (err) {
      console.error(err);
      showToast('Submission failed. Please try again.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const getStatusVisuals = (status) => {
    switch (status) {
      case 'submitted':
      case 'pending':
        return {
          title: 'Awaiting Invoice Quote',
          desc: 'Our administrator is reviewing item availability, condition metrics, and shipping routes to generate your final invoice.',
          colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
          icon: <Clock className="text-amber-600 animate-pulse" size={24} />
        };
      case 'approved_pending_payment':
      case 'shipping_calculated':
        return {
          title: 'Quote Ready & Reserved',
          desc: 'Administrator has verified your curation and provided final shipping details. Please review payment instructions below to complete your order.',
          colorClass: 'text-purple-800 bg-purple-50 border-purple-200',
          icon: <CreditCard className="text-purple-600" size={24} />
        };
      case 'payment_submitted':
        return {
          title: 'Payment Verification Pending',
          desc: 'Your payment details have been submitted. The administrator will verify the receipt and finalize your order shortly.',
          colorClass: 'text-sky-800 bg-sky-50 border-sky-200',
          icon: <Clock className="text-sky-600 animate-spin" style={{ animationDuration: '3s' }} size={24} />
        };
      case 'payment_verified':
      case 'sold':
        return {
          title: 'Payment Confirmed',
          desc: 'Payment received and verified successfully! We are carefully packaging your luxury curation for shipment.',
          colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
          icon: <CheckCircle2 className="text-emerald-600" size={24} />
        };
      case 'shipped':
        return {
          title: 'Curation Dispatched',
          desc: 'Your luxury items have been shipped! Tracking parameters are provided below.',
          colorClass: 'text-blue-800 bg-blue-50 border-blue-200',
          icon: <Truck className="text-blue-600 animate-bounce" size={24} />
        };
      case 'completed':
        return {
          title: 'Completed',
          desc: 'Your luxury purchase is finalized and delivered. Thank you for collecting with Good Finds by AA.',
          colorClass: 'text-stone-800 bg-stone-50 border-stone-200',
          icon: <CheckCircle2 className="text-stone-700" size={24} />
        };
      case 'cancelled':
        return {
          title: 'Cancelled',
          desc: 'This purchase request has been declined or cancelled.',
          colorClass: 'text-red-800 bg-red-50 border-red-200',
          icon: <XCircle className="text-red-600" size={24} />
        };
      case 'expired':
        return {
          title: 'Reservation Expired',
          desc: 'The payment window for this curation expired before checkout details were submitted.',
          colorClass: 'text-stone-500 bg-stone-100 border-stone-200',
          icon: <AlertCircle className="text-stone-400" size={24} />
        };
      default:
        return {
          title: 'Processing',
          desc: 'Your request is being reviewed.',
          colorClass: 'text-stone-700 bg-stone-50 border-stone-200',
          icon: <Clock className="text-stone-500" size={24} />
        };
    }
  };

  const statusInfo = activeRequest ? getStatusVisuals(activeRequest.status) : null;
  const items = activeRequest?.items || [];
  const itemSubtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const activePaymentMethodConfig = activeRequest && payMethod ? paymentMethods[payMethod.toLowerCase()] : null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn" id="track_request_overlay" onClick={onClose}>
      <div className="bg-[#FAF8F5] rounded shadow-2xl border border-[#E5DFD8] w-full max-w-2xl max-h-[90vh] flex flex-col outline-none overflow-hidden" id="track_request_modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#C9A84C]" />
            <h2 className="font-display text-lg text-stone-900 font-normal">Track Purchase Request</h2>
          </div>
          <button className="text-stone-400 hover:text-stone-600 cursor-pointer p-1" onClick={onClose} aria-label="Close track request"><X size={20} /></button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Lookup Form */}
          {!activeRequest && (
            <form onSubmit={handleSearch} className="space-y-4 max-w-md mx-auto py-8">
              <div className="text-center space-y-2 mb-6">
                <p className="text-sm text-stone-600 font-sans">
                  Enter your details to track your request status, access your invoice quote, retrieve admin payment instructions, or submit payment screenshots.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Reference ID / Request Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">#</span>
                  <input 
                    type="text" 
                    placeholder="e.g. cat-17200..." 
                    value={searchId} 
                    onChange={e => setSearchId(e.target.value)}
                    className="w-full border border-stone-300 rounded px-3 py-2 pl-7 text-sm text-stone-900 outline-none focus:border-[#C9A84C] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Registered Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. buyer@example.com" 
                  value={searchEmail} 
                  onChange={e => setSearchEmail(e.target.value)}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C] font-sans"
                />
              </div>

              <button 
                type="submit" 
                className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer mt-4"
              >
                <Search size={14} /> Retrieve Request
              </button>
            </form>
          )}

          {/* Active Request Details */}
          {activeRequest && (
            <div className="space-y-6">
              
              {/* Back / Search another button */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setActiveRequest(null)}
                  className="text-xs text-stone-500 hover:text-stone-800 font-semibold uppercase tracking-wider underline cursor-pointer"
                >
                  ← Track another request
                </button>
                <span className="font-mono text-xs text-stone-500 font-semibold">Ref: #{activeRequest.requestNumber || activeRequest.id}</span>
              </div>

              {/* Status Alert Banner */}
              <div className={`p-4 border rounded flex items-start gap-3.5 ${statusInfo.colorClass}`}>
                <div className="mt-0.5">{statusInfo.icon}</div>
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-sm leading-tight">{statusInfo.title}</h3>
                  <p className="text-xs leading-relaxed font-sans opacity-95">{statusInfo.desc}</p>
                </div>
              </div>

              {/* Curation Summary */}
              <div className="border border-stone-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Your Luxury Curation</h4>
                </div>
                <div className="divide-y divide-stone-100 px-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-stone-900">{item.name}</div>
                        <div className="text-[10px] text-stone-400 uppercase tracking-wider">{item.brand}</div>
                      </div>
                      <div className="text-xs font-bold text-stone-950 font-mono">
                        {formatProductPrice(item, currency, exchangeRate)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-stone-50/50 p-4 border-t border-stone-100 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Items Subtotal:</span>
                    <span className="font-mono">{formatProductPrice({ price: itemSubtotal }, currency, exchangeRate)}</span>
                  </div>
                  
                  {activeRequest.shippingCost !== null && activeRequest.shippingCost !== undefined && (
                    <div className="flex justify-between text-stone-600">
                      <span className="flex items-center gap-1"><Truck size={12} className="text-amber-600" /> Logistics Shipping:</span>
                      <span className="font-mono text-amber-900 font-semibold">
                        {formatProductPrice({ price: activeRequest.shippingCost }, currency, exchangeRate)}
                      </span>
                    </div>
                  )}

                  {activeRequest.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Curation Discount:</span>
                      <span className="font-mono">-${activeRequest.discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-950 font-bold text-sm border-t border-stone-200 pt-2 mt-1">
                    <span>Invoice Grand Total:</span>
                    <span className="font-mono text-stone-950">
                      {formatProductPrice({ price: activeRequest.finalTotal || (itemSubtotal + (activeRequest.shippingCost || 0) - (activeRequest.discountAmount || 0)) }, currency, exchangeRate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping parameters (Only if Shipped) */}
              {activeRequest.status === 'shipped' && (
                <div className="border border-blue-200 rounded-lg bg-blue-50/20 p-4 space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-blue-800 border-b border-blue-100 pb-2">
                    <Truck size={16} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Logistics Dispatch Parameters</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-stone-500 block">Shipping Carrier</span>
                      <strong className="text-stone-800 font-semibold">{activeRequest.shippingCarrier || 'Express Carrier'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block flex items-center gap-1">Tracking ID</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <strong className="text-stone-950 font-mono text-sm bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                          {activeRequest.trackingNumber}
                        </strong>
                        <button 
                          onClick={() => handleCopy(activeRequest.trackingNumber, 'Tracking Number')}
                          className="text-[10px] uppercase font-bold text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          {copiedText === 'Tracking Number' ? <Check size={10} /> : <Clipboard size={10} />} Copy
                        </button>
                      </div>
                    </div>
                    {activeRequest.dateShipped && (
                      <div>
                        <span className="text-stone-500 block">Date Shipped</span>
                        <span className="text-stone-800 font-sans">{activeRequest.dateShipped}</span>
                      </div>
                    )}
                    {activeRequest.estimatedDelivery && (
                      <div>
                        <span className="text-stone-500 block">Estimated Delivery</span>
                        <span className="text-stone-800 font-sans font-semibold text-emerald-800">{activeRequest.estimatedDelivery}</span>
                      </div>
                    )}
                  </div>
                  {activeRequest.shippingNotes && (
                    <div className="bg-white/80 p-3 rounded border border-blue-100 text-xs text-stone-700 font-sans leading-relaxed">
                      <strong>Delivery Instructions / Notes:</strong> {activeRequest.shippingNotes}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Section (Shown when quote is ready & status is approved_pending_payment or payment_submitted) */}
              {(activeRequest.status === 'approved_pending_payment' || 
                activeRequest.status === 'shipping_calculated' || 
                activeRequest.status === 'payment_submitted') && (
                <div className="border border-stone-200 rounded-lg bg-[#FAF8F5] p-5 space-y-4">
                  <div className="border-b border-stone-200 pb-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CreditCard size={15} className="text-[#C9A84C]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Final Invoice Payment</h4>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/50 uppercase tracking-wider">
                      Manual Invoice Settlement
                    </span>
                  </div>

                  {activeRequest.status !== 'payment_submitted' ? (
                    <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 leading-relaxed font-sans">
                        Please settle the Grand Total using Zelle, Venmo, or PayPal using the details below, and upload your payment confirmation receipt to finalize the transaction.
                      </div>

                      {/* Payment Method selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Choose Settlement Method</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Zelle', 'Venmo', 'PayPal'].map(method => {
                            const config = paymentMethods[method.toLowerCase()] || {};
                            const isAvailable = config.isEnabled !== false && config.handle;
                            if (!isAvailable) return null;
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() => {
                                  setPayMethod(method);
                                  showToast(`Switched to ${method} instructions`);
                                }}
                                className={`py-2 px-3 border rounded text-xs font-semibold uppercase tracking-wider cursor-pointer text-center transition-all ${payMethod === method ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'}`}
                              >
                                {method}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Display active payment instructions & QR Code */}
                      {activePaymentMethodConfig && (
                        <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3.5 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="font-display font-semibold text-stone-900 uppercase tracking-wide text-xs">{payMethod} Payment Details</span>
                            <span className="text-[10px] text-[#C9A84C] font-semibold">Genuine Account verified</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3 text-xs font-sans">
                              {activePaymentMethodConfig.accountName && (
                                <div>
                                  <span className="text-stone-400 block uppercase tracking-wider text-[9px] font-bold">Account Holder Name</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <strong className="text-stone-900 font-medium">{activePaymentMethodConfig.accountName}</strong>
                                    <button type="button" onClick={() => handleCopy(activePaymentMethodConfig.accountName, 'Account Holder Name')} className="text-stone-400 hover:text-stone-600"><Clipboard size={12} /></button>
                                  </div>
                                </div>
                              )}

                              <div>
                                <span className="text-stone-400 block uppercase tracking-wider text-[9px] font-bold">{payMethod === 'PayPal' ? 'Email / Username' : 'Username / Phone'}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <strong className="text-stone-950 font-mono text-sm bg-stone-50 border border-stone-100 px-2 py-0.5 rounded">{activePaymentMethodConfig.handle}</strong>
                                  <button type="button" onClick={() => handleCopy(activePaymentMethodConfig.handle, 'Handle')} className="text-stone-400 hover:text-stone-600"><Clipboard size={12} /></button>
                                </div>
                              </div>

                              {activePaymentMethodConfig.instructions && (
                                <div>
                                  <span className="text-stone-400 block uppercase tracking-wider text-[9px] font-bold">Memo / Settlement Notes</span>
                                  <p className="text-[11px] text-stone-600 italic bg-stone-50 p-2 rounded border border-stone-100/60 mt-1 leading-relaxed">
                                    {activePaymentMethodConfig.instructions}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* QR Code Container */}
                            {activePaymentMethodConfig.qrUrl && (
                              <div className="flex flex-col items-center justify-center bg-[#FAF8F5] border border-stone-200/60 p-3 rounded-lg">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1"><QrCode size={11} /> Scan QR Code</span>
                                <img 
                                  src={activePaymentMethodConfig.qrUrl} 
                                  alt={`${payMethod} Payment QR Code`} 
                                  className="w-32 h-32 object-contain border border-stone-100 bg-white p-1 rounded shadow-3xs" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment Proof Fields */}
                      <div className="space-y-3 pt-2 border-t border-stone-200">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Transaction Reference ID / Sender Name <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            placeholder="e.g. Ref #129384810 or Sender: Jane Doe" 
                            value={txnRef} 
                            onChange={e => setTxnRef(e.target.value)}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Payment Screenshot Receipt (Proof)</label>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded cursor-pointer transition-colors shadow-3xs">
                              <Upload size={14} /> Choose File
                              <input 
                                type="file" 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden" 
                              />
                            </label>
                            <span className="text-[11px] text-stone-500 font-sans truncate max-w-[200px]">
                              {proofBase64 ? '✓ screenshot_loaded.png' : 'No screenshot selected (optional)'}
                            </span>
                          </div>
                          {proofBase64 && (
                            <div className="mt-2 border border-stone-200 bg-white p-2 rounded max-w-[150px]">
                              <img src={proofBase64} alt="Screenshot preview" className="max-h-24 object-contain rounded" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Settlement Memo / Buyer Notes (Optional)</label>
                          <textarea 
                            rows={2}
                            placeholder="Add any details about your transaction here..." 
                            value={buyerNotes} 
                            onChange={e => setBuyerNotes(e.target.value)}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C] font-sans"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmittingProof}
                        className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer mt-4"
                      >
                        {isSubmittingProof ? 'Submitting...' : 'Submit Payment Settlement'}
                      </button>
                    </form>
                  ) : (
                    // Proof already submitted
                    <div className="space-y-4 font-sans text-xs">
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-emerald-800 leading-relaxed">
                        ✓ Your payment parameters and screenshot proof have been uploaded. The administrator has been notified to verify the transaction.
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-white p-4 border border-stone-200 rounded-lg">
                        <div>
                          <span className="text-stone-400 font-bold uppercase tracking-wider text-[8px] block">Settlement Method Used</span>
                          <strong className="text-stone-800 font-medium text-xs uppercase">{activeRequest.paymentDetails?.methodUsed}</strong>
                        </div>
                        <div>
                          <span className="text-stone-400 font-bold uppercase tracking-wider text-[8px] block">Transaction Reference ID</span>
                          <strong className="text-stone-950 font-mono text-xs">{activeRequest.paymentDetails?.transactionReference}</strong>
                        </div>
                        <div className="col-span-2 border-t border-stone-100 pt-2.5">
                          <span className="text-stone-400 font-bold uppercase tracking-wider text-[8px] block mb-1">Receipt Screenshot Proof</span>
                          {activeRequest.paymentDetails?.proofUrl ? (
                            <img src={activeRequest.paymentDetails.proofUrl} alt="Submitted payment proof" className="max-h-32 object-contain border border-stone-100 bg-stone-50/50 p-1 rounded" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-stone-500 italic">No receipt file uploaded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-between items-center text-[10px] text-stone-500 font-mono">
          <span>Manual Luxury Order Flow</span>
          <span>Verified Secure</span>
        </div>

      </div>
    </div>
  );
}
