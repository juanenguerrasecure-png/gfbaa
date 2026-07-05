import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Mail, MapPin, Calendar, CheckCircle2, XCircle, Trash2, 
  AlertCircle, ShoppingBag, Truck, Clock, Copy, Printer, Check, Eye, ShieldAlert, X
} from 'lucide-react';

export function RequestsTab() {
  const { 
    purchaseRequests = [], 
    updatePurchaseRequest, 
    deletePurchaseRequest, 
    recordSale, 
    getCatalogItemStock, 
    syncAfterLocalChange,
    paymentMethods = {},
    catalogItems = [],
    products = []
  } = useStore();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'submitted' | 'awaiting_payment' | 'verifying' | 'shipped' | 'cancelled'
  const [shippingCosts, setShippingCosts] = useState({});
  const [discounts, setDiscounts] = useState({});
  const [insuranceCosts, setInsuranceCosts] = useState({});
  const [taxAmounts, setTaxAmounts] = useState({});
  const [otherFees, setOtherFees] = useState({});
  
  // Shipping details form
  const [carrier, setCarrier] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [estDelivery, setEstDelivery] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [shippingFormRequestId, setShippingFormRequestId] = useState(null);

  // Modal / Preview states
  const [invoicePreviewRequest, setInvoicePreviewRequest] = useState(null);
  const [emailTemplateRequest, setEmailTemplateRequest] = useState(null);
  const [copiedLabel, setCopiedLabel] = useState('');
  const [syncWarning, setSyncWarning] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const getItemPhoto = (item) => {
    if (!item) return null;
    const itemPhotos = [];
    if (Array.isArray(item.photos)) itemPhotos.push(...item.photos);
    if (Array.isArray(item.photoUrls)) itemPhotos.push(...item.photoUrls);
    if (item.photoUrl) itemPhotos.push(item.photoUrl);
    if (item.photo) itemPhotos.push(item.photo);
    
    if (itemPhotos.length === 0 && item.productId) {
      const catalogItem = catalogItems.find(c => String(c.id) === String(item.productId));
      if (catalogItem) {
        if (Array.isArray(catalogItem.photos)) itemPhotos.push(...catalogItem.photos);
        if (Array.isArray(catalogItem.photoUrls)) itemPhotos.push(...catalogItem.photoUrls);
        if (catalogItem.photoUrl) itemPhotos.push(catalogItem.photoUrl);
        if (catalogItem.photo) itemPhotos.push(catalogItem.photo);
      }
    }
    
    if (itemPhotos.length === 0 && item.productId) {
      const product = products?.find(p => String(p.id) === String(item.productId));
      if (product) {
        if (Array.isArray(product.photos)) itemPhotos.push(...product.photos);
        if (Array.isArray(product.photoUrls)) itemPhotos.push(...product.photoUrls);
        if (product.photoUrl) itemPhotos.push(product.photoUrl);
        if (product.photo) itemPhotos.push(product.photo);
      }
    }

    const uniquePhotos = [...new Set(itemPhotos.filter(Boolean))];
    return uniquePhotos[0] || null;
  };

  const handleSyncResult = async () => {
    const result = await syncAfterLocalChange();
    if (!result?.ok) {
      setSyncWarning(true);
      setSyncStatus('Changes saved locally but cloud sync failed.');
    } else {
      setSyncWarning(false);
      setSyncStatus('Cloud state synced successfully.');
    }
    return result;
  };

  const handleRetry = async () => {
    setIsSyncing(true);
    await handleSyncResult();
    setIsSyncing(false);
  };

  // Helper state setters
  const setRequestField = (id, field, value, setter) => {
    setter(prev => ({ ...prev, [id]: value }));
  };

  // 1. Decline / Cancel Request
  const handleDeclineRequest = async (id) => {
    if (!confirm('Are you sure you want to decline this purchase request and release any temporary reservations?')) return;
    
    const req = purchaseRequests.find(r => r.id === id);
    const logs = req?.activityLog || [];
    const updatedLogs = [
      ...logs,
      {
        action: 'REQUEST_DECLINED',
        timestamp: new Date().toISOString(),
        description: 'Administrator declined the purchase request'
      }
    ];

    updatePurchaseRequest(id, { 
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      activityLog: updatedLogs
    });
    await handleSyncResult();
  };

  // 2. Calculate & Approve Invoice Quote
  const handleApproveQuote = async (id) => {
    const req = purchaseRequests.find(r => r.id === id);
    if (!req) return;

    // Validate quantities
    const outOfStockItems = [];
    req.items.forEach(item => {
      const stock = getCatalogItemStock(item.productId, id);
      if (stock < item.qty) {
        outOfStockItems.push({ name: item.name, requested: item.qty, inStock: stock });
      }
    });

    if (outOfStockItems.length > 0) {
      const list = outOfStockItems.map(i => `"${i.name}" (Requested: ${i.requested}, In Stock: ${i.inStock})`).join('\n');
      alert(`Cannot approve quote. Insufficient stock:\n${list}`);
      return;
    }

    const shipCost = parseFloat(shippingCosts[id] || 0);
    const discount = parseFloat(discounts[id] || 0);
    const insCost = parseFloat(insuranceCosts[id] || 0);
    const taxAmt = parseFloat(taxAmounts[id] || 0);
    const extraFee = parseFloat(otherFees[id] || 0);

    if (isNaN(shipCost) || shipCost < 0) { alert('Please enter a valid shipping cost.'); return; }
    if (isNaN(discount) || discount < 0) { alert('Please enter a valid discount amount.'); return; }
    if (isNaN(insCost) || insCost < 0) { alert('Please enter a valid insurance cost.'); return; }
    if (isNaN(taxAmt) || taxAmt < 0) { alert('Please enter a valid tax amount.'); return; }
    if (isNaN(extraFee) || extraFee < 0) { alert('Please enter a valid fee amount.'); return; }

    const itemTotal = (req.items || []).reduce((sum, i) => sum + (Number(i.price) || 0), 0);
    const finalTotal = itemTotal + shipCost + insCost + taxAmt + extraFee - discount;

    const logs = req.activityLog || [];
    const updatedLogs = [
      ...logs,
      {
        action: 'QUOTE_APPROVED',
        timestamp: new Date().toISOString(),
        description: `Quote approved. Grand Total: $${finalTotal.toLocaleString()} (Shipping: $${shipCost})`
      }
    ];

    // Set deadline to 24 hours from now
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 24);

    updatePurchaseRequest(id, {
      status: 'approved_pending_payment',
      shippingCost: shipCost,
      discountAmount: discount,
      insuranceCost: insCost,
      taxAmount: taxAmt,
      otherFee: extraFee,
      finalTotal,
      approvedAt: new Date().toISOString(),
      paymentDeadline: deadline.toISOString(),
      activityLog: updatedLogs
    });

    await handleSyncResult();
  };

  // 3. Extend Payment Deadline
  const handleExtendDeadline = async (id) => {
    const req = purchaseRequests.find(r => r.id === id);
    if (!req) return;

    const currentDeadline = req.paymentDeadline ? new Date(req.paymentDeadline) : new Date();
    currentDeadline.setHours(currentDeadline.getHours() + 24);

    const logs = req.activityLog || [];
    const updatedLogs = [
      ...logs,
      {
        action: 'DEADLINE_EXTENDED',
        timestamp: new Date().toISOString(),
        description: `Payment deadline extended to ${currentDeadline.toLocaleString()}`
      }
    ];

    updatePurchaseRequest(id, {
      paymentDeadline: currentDeadline.toISOString(),
      activityLog: updatedLogs
    });

    await handleSyncResult();
  };

  // 4. Verify Payment & Deduct Stock
  const handleVerifyPayment = async (id) => {
    const req = purchaseRequests.find(r => r.id === id);
    if (!req) return;

    if (!confirm('Have you verified that the exact payment amount has cleared in your banking/processor account? This action will permanently deduct inventory stock.')) return;

    try {
      const logs = req.activityLog || [];
      const updatedLogs = [
        ...logs,
        {
          action: 'PAYMENT_VERIFIED',
          timestamp: new Date().toISOString(),
          description: 'Payment verified and cleared by administrator.'
        }
      ];

      // Physical inventory deduction using recordSale helper from StoreContext
      // This will safely deduct remainingQty and log the completed sale
      recordSale({
        buyer: req.buyerName,
        date: new Date().toISOString().split('T')[0],
        selectionMethod: 'FIFO',
        items: req.items.map(item => ({
          productId: item.productId,
          qty: item.qty || 1,
          pricePerItem: item.price
        }))
      });

      updatePurchaseRequest(id, {
        status: 'payment_verified',
        paymentDetails: {
          ...(req.paymentDetails || {}),
          receivedAt: new Date().toISOString(),
          amountReceived: req.finalTotal
        },
        activityLog: updatedLogs
      });

      await handleSyncResult();
    } catch (err) {
      alert(`Failed to verify payment: ${err.message}`);
    }
  };

  // 5. Submit Shipping Details
  const handleShipOrder = async (e) => {
    e.preventDefault();
    if (!shippingFormRequestId) return;

    if (!carrier.trim() || !trackingNo.trim()) {
      alert('Please fill out Carrier name and Tracking Number.');
      return;
    }

    const req = purchaseRequests.find(r => r.id === shippingFormRequestId);
    if (!req) return;

    const logs = req.activityLog || [];
    const updatedLogs = [
      ...logs,
      {
        action: 'ORDER_SHIPPED',
        timestamp: new Date().toISOString(),
        description: `Dispatched via ${carrier.trim()} (Tracking: ${trackingNo.trim()})`
      }
    ];

    updatePurchaseRequest(shippingFormRequestId, {
      status: 'shipped',
      shippingCarrier: carrier.trim(),
      trackingNumber: trackingNo.trim(),
      dateShipped: new Date().toISOString().split('T')[0],
      estimatedDelivery: estDelivery.trim(),
      shippingNotes: shippingNotes.trim(),
      activityLog: updatedLogs
    });

    setShippingFormRequestId(null);
    setCarrier('');
    setTrackingNo('');
    setEstDelivery('');
    setShippingNotes('');

    await handleSyncResult();
  };

  // 6. Complete Order
  const handleMarkCompleted = async (id) => {
    const req = purchaseRequests.find(r => r.id === id);
    const logs = req?.activityLog || [];
    const updatedLogs = [
      ...logs,
      {
        action: 'ORDER_COMPLETED',
        timestamp: new Date().toISOString(),
        description: 'Order delivery confirmed and archived as completed.'
      }
    ];

    updatePurchaseRequest(id, {
      status: 'completed',
      activityLog: updatedLogs
    });

    await handleSyncResult();
  };

  // 7. Permanently Delete Request
  const handleDeleteRequest = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this request log? This is irreversible.')) return;
    deletePurchaseRequest(id);
    await handleSyncResult();
  };

  // Email template generator
  const generateEmailText = (req, type) => {
    const itemTotal = (req.items || []).reduce((sum, i) => sum + (Number(i.price) || 0), 0);
    const itemsListText = (req.items || []).map(i => `- ${i.brand} ${i.name} ($${Number(i.price).toLocaleString()})`).join('\n');
    
    if (type === 'invoice') {
      const zelle = paymentMethods.zelle || {};
      const venmo = paymentMethods.venmo || {};
      const paypal = paymentMethods.paypal || {};
      
      return `Subject: Quotation & Invoice for Request #${req.requestNumber || req.id} - Good Finds by AA

Dear ${req.buyerName},

Thank you for your request to collect with Good Finds by AA. We have reviewed your reservation, verified the items' flawless condition parameters, and secured your luxury selection.

Below is your custom, itemized logistics invoice:

--------------------------------------------------
CURATION SPECIFICATIONS:
${itemsListText}

Subtotal: $${itemSubtotal(req).toLocaleString()}
Custom Logistics Shipping: $${(req.shippingCost || 0).toLocaleString()}
${req.discountAmount > 0 ? `Discount: -$${req.discountAmount.toLocaleString()}\n` : ''}${req.insuranceCost > 0 ? `Insurance/Declared Value: $${req.insuranceCost.toLocaleString()}\n` : ''}${req.taxAmount > 0 ? `Duties/Tax: $${req.taxAmount.toLocaleString()}\n` : ''}${req.otherFee > 0 ? `Special Packaging: $${req.otherFee.toLocaleString()}\n` : ''}GRAND TOTAL: $${(req.finalTotal || itemTotal + (req.shippingCost || 0)).toLocaleString()}
--------------------------------------------------

MANUAL SETTLEMENT INSTRUCTIONS:
To complete your curation purchase, please settle the Grand Total within 24 hours using one of our verified, direct accounts below:

${zelle.isEnabled !== false && zelle.handle ? `• ZELLE:
  Account Username/Phone: ${zelle.handle}
  Account Name: ${zelle.accountName || 'Good Finds by AA'}
  Memo: Quote #${req.requestNumber || req.id}
` : ''}${venmo.isEnabled !== false && venmo.handle ? `• VENMO:
  Account Username: ${venmo.handle}
  Account Name: ${venmo.accountName || 'Good Finds by AA'}
  Memo: Quote #${req.requestNumber || req.id}
` : ''}${paypal.isEnabled !== false && paypal.handle ? `• PAYPAL:
  Account Email: ${paypal.handle}
  Account Name: ${paypal.accountName || 'Good Finds by AA'}
` : ''}

CONFIRMATION & RECEIPTS:
Once settlement is sent, please capture a screenshot of your transaction and upload it directly onto our website using the "Track Request" widget using your Reference ID: #${req.requestNumber || req.id} and your email: ${req.buyerEmail || req.buyerContact}.

Thank you for your refined patronage. We look forward to dispatching your luxury curations.

Warmest regards,
Good Finds by AA Administrator
https://ai.studio/build`;
    } else {
      return `Subject: Curation Dispatched - Shipment Tracking ID: ${req.trackingNumber || ''}

Dear ${req.buyerName},

Exquisite news! Your curated luxury selection has been meticulously polished, securely packaged, and dispatched.

--------------------------------------------------
SHIPMENT TRACKING DETAILS:
Carrier: ${req.shippingCarrier || 'Express Courier'}
Tracking Number: ${req.trackingNumber || 'N/A'}
Estimated Delivery: ${req.estimatedDelivery || 'Standard Express'}
--------------------------------------------------

You may track your package directly on our website using the "Track Request" tab or via the carrier's portal.

Should you have any inquiries, feel free to use the "Message Me" service or reply directly to this email.

Kindest regards,
Good Finds by AA Logistics Curation Team`;
    }
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(''), 2000);
  };

  const itemSubtotal = (req) => {
    return (req.items || []).reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  };

  // Tab Filtering
  const filteredRequests = purchaseRequests.filter(req => {
    if (activeTab === 'all') return true;
    if (activeTab === 'submitted') return req.status === 'submitted' || req.status === 'pending';
    if (activeTab === 'awaiting_payment') return req.status === 'approved_pending_payment' || req.status === 'shipping_calculated';
    if (activeTab === 'verifying') return req.status === 'payment_submitted';
    if (activeTab === 'shipped') return req.status === 'shipped' || req.status === 'completed';
    if (activeTab === 'cancelled') return req.status === 'cancelled' || req.status === 'expired';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'approved_pending_payment':
      case 'shipping_calculated':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'payment_submitted':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'payment_verified':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-stone-50 text-stone-800 border-stone-200';
      case 'cancelled':
      case 'expired':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'submitted':
      case 'pending':
        return 'Quotation Request';
      case 'approved_pending_payment':
      case 'shipping_calculated':
        return 'Awaiting Payment';
      case 'payment_submitted':
        return 'Verifying Receipt';
      case 'payment_verified':
        return 'Paid (Ready to Ship)';
      case 'shipped':
        return 'Shipped';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Declined / Cancelled';
      case 'expired':
        return 'Reservation Expired';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Title block */}
      <div className="border-b border-stone-200 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-stone-900 font-normal">Invoicing & Request Workflow</h2>
          <p className="text-sm text-stone-500">
            Secure reservations, enter shipping fees, review direct payment receipts, and dispatch tracking parameters.
          </p>
        </div>
      </div>

      {syncWarning && (
        <div className="flex items-center gap-3 bg-[#FFF8E7] border-l-[3px] border-[#C9A84C] px-4 py-3 text-[13px] text-stone-700">
          <span>⚠️ Changes saved locally but failed to sync online. Please try retrying.</span>
          <button type="button" onClick={handleRetry} disabled={isSyncing} className="ml-auto text-xs font-semibold uppercase tracking-wider text-stone-900 underline">
            {isSyncing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}
      {syncStatus && <div className="text-sm px-4 py-2.5 border border-[#E5DFD8] bg-white text-stone-700">{syncStatus}</div>}

      {/* Tabs list */}
      <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar gap-2">
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'submitted', label: 'Pending Review' },
          { id: 'awaiting_payment', label: 'Awaiting Payment' },
          { id: 'verifying', label: 'Verifying Receipt' },
          { id: 'shipped', label: 'Shipped / Done' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Request entries list */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded border border-stone-200 p-12 text-center">
          <ShoppingBag className="mx-auto text-stone-300 mb-3" size={36} />
          <h3 className="font-display text-lg text-stone-700 font-normal mb-1">No requests match this filter</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            When buyers submit quote requests or pay invoice grand totals, their records will filter into these states.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((req) => {
            const sub = itemSubtotal(req);
            const isSubmittedState = req.status === 'submitted' || req.status === 'pending';
            const isAwaitingPaymentState = req.status === 'approved_pending_payment' || req.status === 'shipping_calculated';
            const isVerifyingState = req.status === 'payment_submitted';
            const isPaidReadyState = req.status === 'payment_verified';
            const isShippedState = req.status === 'shipped';
            
            const currShippingInput = shippingCosts[req.id] ?? (req.shippingCost !== null && req.shippingCost !== undefined ? String(req.shippingCost) : '');
            const currDiscountInput = discounts[req.id] ?? (req.discountAmount ? String(req.discountAmount) : '0');
            const currInsInput = insuranceCosts[req.id] ?? (req.insuranceCost ? String(req.insuranceCost) : '0');
            const currTaxInput = taxAmounts[req.id] ?? (req.taxAmount ? String(req.taxAmount) : '0');
            const currOtherInput = otherFees[req.id] ?? (req.otherFee ? String(req.otherFee) : '0');

            return (
              <div key={req.id} className="bg-white border border-[#E5DFD8] rounded overflow-hidden shadow-xs">
                
                {/* Header info */}
                <div className="bg-[#FAF8F5] border-b border-stone-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-stone-200/60 text-stone-700 rounded">
                      #{req.requestNumber || req.id.toString().slice(-6)}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full ${getStatusBadge(req.status)}`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 flex items-center gap-1.5 font-mono">
                    <Calendar size={13} /> {req.date || req.createdAt || 'N/A'}
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Buyer details & parameters */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-1.5">
                      Buyer profile & logistics
                    </h4>
                    
                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <span className="text-stone-400 font-bold uppercase tracking-wider text-[8px] block">Full Name</span>
                        <div className="text-stone-900 font-semibold">{req.buyerName}</div>
                      </div>

                      <div>
                        <span className="text-stone-400 font-bold uppercase tracking-wider text-[8px] block">Registered Email</span>
                        <div className="text-stone-800 flex items-center gap-1">
                          <Mail size={13} className="text-stone-400 flex-shrink-0" />
                          <span className="truncate">{req.buyerEmail || req.buyerContact}</span>
                        </div>
                      </div>

                      <div className="bg-[#FAF8F5] border border-stone-200 p-3 rounded space-y-1">
                        <span className="text-stone-400 font-bold uppercase tracking-wider text-[8px] block flex items-center gap-1">
                          <MapPin size={10} /> Shipping Destination
                        </span>
                        <p className="text-stone-600 leading-relaxed font-light line-clamp-3">{req.buyerAddress}</p>
                      </div>

                      {req.specialInstructions && (
                        <div className="bg-amber-50/40 border border-amber-200/50 p-2.5 rounded text-amber-900 leading-relaxed">
                          <strong className="block mb-0.5 font-semibold text-[8px] uppercase tracking-wider text-amber-700">Buyer Notes:</strong>
                          {req.specialInstructions}
                        </div>
                      )}

                      {req.paymentMethod && (
                        <div>
                          <span className="text-stone-400 font-bold uppercase tracking-wider text-[8px] block mb-1">Intended Settlement Method</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-50 border border-stone-200 text-[10px] font-bold text-stone-800 uppercase tracking-wider font-sans">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: req.paymentMethod.toLowerCase() === 'zelle' ? '#6D1ED4' : '#3D95CE' }} />
                            {req.paymentMethod}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timeline Activity Log */}
                    {req.activityLog && req.activityLog.length > 0 && (
                      <div className="pt-2 border-t border-stone-100">
                        <span className="text-stone-400 font-bold uppercase tracking-wider text-[8px] block mb-2">Request Activity Audit</span>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                          {req.activityLog.map((log, idx) => (
                            <div key={idx} className="text-[10px] font-mono leading-relaxed border-l-2 border-stone-200 pl-2">
                              <span className="text-stone-400 block">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:</span>
                              <span className="text-stone-600">{log.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Items list & prices */}
                  <div className="space-y-4 lg:col-span-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-1.5">
                      Luxury curations reserved ({(req.items || []).length})
                    </h4>

                    <div className="border border-stone-200 rounded divide-y divide-stone-100 bg-white overflow-hidden">
                      {(req.items || []).map((item, idx) => {
                        const stock = getCatalogItemStock(item.productId, req.id);
                        return (
                          <div key={idx} className="p-3 flex items-center justify-between gap-4 text-xs font-sans">
                            <div>
                              <div className="font-semibold text-stone-900">{item.name}</div>
                              <div className="text-[10px] text-stone-400 uppercase tracking-wider">{item.brand}</div>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <div>
                                {stock > 0 ? (
                                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50 uppercase tracking-wider text-[9px]">Available ({stock})</span>
                                ) : (
                                  <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200/50 uppercase tracking-wider text-[9px] flex items-center gap-0.5"><ShieldAlert size={10} /> Reserved / Locked</span>
                                )}
                              </div>
                              <div className="font-bold font-mono text-stone-950">${Number(item.price || 0).toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Invoice cost sheet summary */}
                    <div className="bg-[#FAF8F5] border border-stone-200 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                      <div>
                        <span className="text-stone-400 block">Curation Subtotal</span>
                        <div className="font-bold text-stone-900 mt-0.5 font-mono">${sub.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Logistics Shipping</span>
                        <div className="font-bold text-amber-900 mt-0.5 font-mono">
                          {req.shippingCost !== null && req.shippingCost !== undefined ? `$${req.shippingCost.toLocaleString()}` : <span className="text-stone-400 italic text-2xs block">No Quote</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Curation Discount</span>
                        <div className="font-bold text-emerald-800 mt-0.5 font-mono">
                          {req.discountAmount ? `-$${req.discountAmount.toLocaleString()}` : '$0'}
                        </div>
                      </div>
                      <div className="border-t md:border-t-0 md:border-l border-stone-200 pt-3 md:pt-0 md:pl-4">
                        <span className="text-stone-500 block font-bold uppercase tracking-wider text-[9px]">GRAND TOTAL</span>
                        <div className="font-bold text-stone-950 text-base mt-0.5 font-mono">
                          ${(req.finalTotal || sub + (req.shippingCost || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Admin Verification Panel / Submitted Payment details */}
                    {isVerifyingState && req.paymentDetails && (
                      <div className="bg-sky-50/40 border border-sky-200 rounded p-4 space-y-3.5 text-xs font-sans">
                        <div className="flex items-center gap-2 text-sky-800 font-semibold uppercase tracking-wider text-[10px] border-b border-sky-100 pb-1.5">
                          <Clock size={13} /> Review settlement proof submitted
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-stone-400 block uppercase tracking-wider text-[8px] font-bold">Settlement Method Used</span>
                            <strong className="text-stone-800 text-xs uppercase block">{req.paymentDetails.methodUsed}</strong>
                          </div>
                          <div>
                            <span className="text-stone-400 block uppercase tracking-wider text-[8px] font-bold">Transaction Reference ID / Name</span>
                            <strong className="text-stone-950 font-mono text-xs block">{req.paymentDetails.transactionReference}</strong>
                          </div>
                          {req.paymentDetails.notes && (
                            <div className="col-span-2">
                              <span className="text-stone-400 block uppercase tracking-wider text-[8px] font-bold">Buyer Transaction Notes</span>
                              <p className="text-stone-600 bg-white/60 p-2 border border-stone-200/50 rounded mt-0.5 italic">{req.paymentDetails.notes}</p>
                            </div>
                          )}
                        </div>

                        {req.paymentDetails.proofUrl && (
                          <div className="border border-stone-200 bg-white p-2.5 rounded max-w-sm space-y-1.5">
                            <span className="text-stone-400 block uppercase tracking-wider text-[8px] font-bold">Clearing Screenshot Proof</span>
                            <a href={req.paymentDetails.proofUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden border border-stone-100 bg-stone-50 rounded">
                              <img src={req.paymentDetails.proofUrl} alt="Submitted payment proof" className="max-h-48 object-contain mx-auto" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold uppercase tracking-wider text-[10px] gap-1">
                                <Eye size={12} /> View Fullscreen
                              </div>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery & Dispatch info (If shipped or completed) */}
                    {(isShippedState || req.status === 'completed') && (
                      <div className="bg-blue-50/20 border border-blue-200 p-4 rounded-lg space-y-3.5 text-xs font-sans">
                        <div className="flex items-center gap-2 text-blue-800 border-b border-blue-100 pb-1.5 uppercase font-bold tracking-widest text-[10px]">
                          <Truck size={14} /> Tracking dispatch information
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="text-stone-400 block">Shipping Carrier</span>
                            <strong className="text-stone-800 font-semibold">{req.shippingCarrier || 'Express'}</strong>
                          </div>
                          <div>
                            <span className="text-stone-400 block">Tracking Number</span>
                            <strong className="text-stone-950 font-mono text-sm block">{req.trackingNumber}</strong>
                          </div>
                          <div>
                            <span className="text-stone-400 block">Dispatch Date</span>
                            <span className="text-stone-700 block">{req.dateShipped || 'N/A'}</span>
                          </div>
                        </div>
                        {req.shippingNotes && (
                          <div className="bg-white/80 p-2 rounded border border-blue-100 text-stone-600">
                            <strong>Logistics Notes:</strong> {req.shippingNotes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Panel */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100 bg-[#FAF8F5] -mx-6 -mb-6 px-6 py-4 mt-4">
                      
                      {/* Interactive form based on active request status */}
                      {isSubmittedState && (
                        <div className="w-full space-y-4">
                          <span className="text-stone-500 font-bold uppercase tracking-wider text-[9px] block">Generate Custom Invoice Quote</span>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Shipping Cost</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold">$</span>
                                <input 
                                  type="number" 
                                  placeholder="0.00" 
                                  value={currShippingInput}
                                  onChange={e => setRequestField(req.id, 'shipping', e.target.value, setShippingCosts)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 pl-6 pr-1 outline-none focus:border-[#C9A84C]"
                                />
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Discount (-)</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold">$</span>
                                <input 
                                  type="number" 
                                  placeholder="0.00" 
                                  value={currDiscountInput}
                                  onChange={e => setRequestField(req.id, 'discount', e.target.value, setDiscounts)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 pl-6 pr-1 outline-none focus:border-[#C9A84C]"
                                />
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Insurance</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold">$</span>
                                <input 
                                  type="number" 
                                  placeholder="0.00" 
                                  value={currInsInput}
                                  onChange={e => setRequestField(req.id, 'insurance', e.target.value, setInsuranceCosts)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 pl-6 pr-1 outline-none focus:border-[#C9A84C]"
                                />
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Taxes / Duties</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold">$</span>
                                <input 
                                  type="number" 
                                  placeholder="0.00" 
                                  value={currTaxInput}
                                  onChange={e => setRequestField(req.id, 'tax', e.target.value, setTaxAmounts)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 pl-6 pr-1 outline-none focus:border-[#C9A84C]"
                                />
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Special Pack</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold">$</span>
                                <input 
                                  type="number" 
                                  placeholder="0.00" 
                                  value={currOtherInput}
                                  onChange={e => setRequestField(req.id, 'other', e.target.value, setOtherFees)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 pl-6 pr-1 outline-none focus:border-[#C9A84C]"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 pt-2">
                            <button 
                              type="button" 
                              onClick={() => handleApproveQuote(req.id)}
                              className="px-4.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer inline-flex items-center gap-1.5 shadow-3xs"
                            >
                              <CheckCircle2 size={13} /> Calculate & Secure Reservation
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeclineRequest(req.id)}
                              className="px-3.5 py-2 bg-white hover:bg-red-50 text-stone-600 hover:text-red-700 border border-stone-300 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                            >
                              <XCircle size={13} /> Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Awaiting payment states */}
                      {isAwaitingPaymentState && (
                        <div className="w-full flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => setInvoicePreviewRequest(req)}
                              className="px-3.5 py-1.5 bg-white border border-stone-300 hover:border-stone-400 text-stone-800 hover:text-stone-950 text-2xs font-semibold uppercase tracking-wider rounded inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer size={12} /> Printable Invoice
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEmailTemplateRequest({ req, type: 'invoice' })}
                              className="px-3.5 py-1.5 bg-white border border-stone-300 hover:border-stone-400 text-stone-800 hover:text-stone-950 text-2xs font-semibold uppercase tracking-wider rounded inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={12} /> Copy Invoice Email
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleExtendDeadline(req.id)}
                              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-2xs font-semibold uppercase tracking-wider rounded inline-flex items-center gap-1 cursor-pointer"
                              title="Extend reserve window by 24h"
                            >
                              <Clock size={12} /> Extend Deadline 24h
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleVerifyPayment(req.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-bold uppercase tracking-wider rounded cursor-pointer inline-flex items-center gap-1 shadow-3xs"
                            >
                              <CheckCircle2 size={12} /> Settle Manually (Receive Payment)
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeclineRequest(req.id)}
                              className="text-stone-400 hover:text-red-700 text-2xs font-bold uppercase tracking-wider cursor-pointer border border-transparent p-1.5"
                            >
                              Release Holds
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Verifying receipt state */}
                      {isVerifyingState && (
                        <div className="w-full flex flex-wrap items-center justify-between gap-4">
                          <span className="text-stone-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <AlertCircle size={11} className="text-sky-600 animate-bounce" /> Settle transaction receipt confirmation
                          </span>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleVerifyPayment(req.id)}
                              className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer inline-flex items-center gap-1 shadow-3xs"
                            >
                              <CheckCircle2 size={13} /> Confirm Clearance & Release Curation
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeclineRequest(req.id)}
                              className="px-3 py-2 bg-white border border-stone-300 hover:bg-red-50 text-stone-700 hover:text-red-700 text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer inline-flex items-center gap-1"
                            >
                              Reject Proof
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Paid & Ready to Ship state */}
                      {isPaidReadyState && (
                        <div className="w-full space-y-4">
                          <span className="text-stone-500 font-bold uppercase tracking-wider text-[9px] block">Disptach Logistics & Create Parcel</span>
                          {shippingFormRequestId === req.id ? (
                            <form onSubmit={handleShipOrder} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 border border-stone-200 rounded-lg">
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Carrier Partner</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. DHL Express, LBC" 
                                  value={carrier}
                                  onChange={e => setCarrier(e.target.value)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 px-2 outline-none focus:border-[#C9A84C]"
                                  required
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Tracking ID / Waybill</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 192837498" 
                                  value={trackingNo}
                                  onChange={e => setTrackingNo(e.target.value)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 px-2 outline-none focus:border-[#C9A84C]"
                                  required
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Est. Delivery Date</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 3-5 Business Days" 
                                  value={estDelivery}
                                  onChange={e => setEstDelivery(e.target.value)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 px-2 outline-none focus:border-[#C9A84C]"
                                />
                              </div>
                              <div className="space-y-0.5 col-span-1 md:col-span-4">
                                <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Shipping Instructions / Delivery Notes</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Leave with building security if receptionist is out." 
                                  value={shippingNotes}
                                  onChange={e => setShippingNotes(e.target.value)}
                                  className="w-full text-xs text-stone-950 bg-white border border-stone-300 rounded py-1 px-2 outline-none focus:border-[#C9A84C]"
                                />
                              </div>
                              <div className="col-span-1 md:col-span-4 flex items-center gap-2 pt-2 border-t border-stone-100">
                                <button type="submit" className="px-4.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer">Dispatch Parcel</button>
                                <button type="button" onClick={() => setShippingFormRequestId(null)} className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => {
                                setShippingFormRequestId(req.id);
                                setCarrier('');
                                setTrackingNo('');
                              }}
                              className="px-4.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer inline-flex items-center gap-1.5 shadow-3xs"
                            >
                              <Truck size={13} /> Enter Shipment Parameters (Ship)
                            </button>
                          )}
                        </div>
                      )}

                      {/* Shipped state */}
                      {isShippedState && (
                        <div className="w-full flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => setEmailTemplateRequest({ req, type: 'shipping' })}
                              className="px-3.5 py-1.5 bg-white border border-stone-300 hover:border-stone-400 text-stone-800 hover:text-stone-950 text-2xs font-semibold uppercase tracking-wider rounded inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={12} /> Copy Shipping Email
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleMarkCompleted(req.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-bold uppercase tracking-wider rounded cursor-pointer inline-flex items-center gap-1 shadow-3xs"
                            >
                              <CheckCircle2 size={12} /> Mark Completed / Delivered
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Done, Cancelled, Expired */}
                      {(req.status === 'completed' || req.status === 'cancelled' || req.status === 'expired') && (
                        <div className="w-full flex items-center justify-between gap-4">
                          <span className="text-stone-400 text-2xs italic">Record is archived. Changes are locked.</span>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-700 rounded transition-colors"
                            title="Delete permanently from archives"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 1. Email Template Modal Popup */}
      {emailTemplateRequest && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-3xs z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setEmailTemplateRequest(null)}>
          <div className="bg-white rounded border border-[#E5DFD8] w-full max-w-xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-display text-lg font-normal text-stone-900 uppercase tracking-wide">
                {emailTemplateRequest.type === 'invoice' ? 'Quotation Email Template' : 'Dispatch Email Template'}
              </h3>
              <button onClick={() => setEmailTemplateRequest(null)} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
            </div>
            <p className="text-2xs text-stone-400 italic">
              Copy and paste this template directly into your email platform to arrange logistics with the buyer.
            </p>
            <textarea 
              rows={12}
              readOnly
              value={generateEmailText(emailTemplateRequest.req, emailTemplateRequest.type)}
              className="w-full font-mono text-xs text-stone-800 bg-stone-50 border border-stone-200 p-3 rounded"
            />
            <div className="flex items-center justify-between">
              <button 
                onClick={() => handleCopyText(generateEmailText(emailTemplateRequest.req, emailTemplateRequest.type), 'Email Template')}
                className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider"
              >
                {copiedLabel === 'Email Template' ? <Check size={13} /> : <Copy size={13} />}
                {copiedLabel === 'Email Template' ? 'Copied' : 'Copy Email Content'}
              </button>
              <button onClick={() => setEmailTemplateRequest(null)} className="text-xs text-stone-500 font-semibold uppercase hover:underline">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Printable Invoice Modal Popup */}
      {invoicePreviewRequest && (() => {
        const chosenMethodKey = (invoicePreviewRequest.paymentMethod || 'zelle').toLowerCase();
        const methodDetails = paymentMethods[chosenMethodKey] || {};
        const methodLabel = chosenMethodKey === 'zelle' ? 'Zelle' : chosenMethodKey === 'venmo' ? 'Venmo' : 'PayPal';
        const accentBg = chosenMethodKey === 'zelle' ? 'bg-[#6D1ED4]' : chosenMethodKey === 'venmo' ? 'bg-[#3D95CE]' : 'bg-[#003087]';
        const itemsTotal = (invoicePreviewRequest.items || []).reduce((sum, i) => sum + (Number(i.price) || 0), 0);
        
        return (
          <div id="print_area_backdrop" className="fixed inset-0 bg-stone-900/50 backdrop-blur-3xs z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setInvoicePreviewRequest(null)}>
            <div className="bg-white rounded w-full max-w-2xl p-8 space-y-8 shadow-2xl border border-stone-200 font-sans" id="print_area" onClick={e => e.stopPropagation()}>
              
              {/* PAGE 1: CORE INVOICE BILL */}
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b-2 border-stone-900 pb-5">
                  <div>
                    <h2 className="font-serif text-3xl font-light text-stone-950 tracking-tight">GOOD FINDS<span className="text-[#C9A84C] font-normal"> by AA</span></h2>
                    <span className="text-[10px] uppercase font-semibold tracking-widest text-stone-400 block mt-1">Luxury Resale & Curation Invoice</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block">Curation Bill</span>
                    <span className="font-mono text-xs text-stone-700 block mt-1 font-semibold">INVOICE NO: #{invoicePreviewRequest.requestNumber || invoicePreviewRequest.id.toString().slice(-6)}</span>
                    <span className="text-2xs text-stone-500 block mt-0.5">Date: {new Date(invoicePreviewRequest.approvedAt || invoicePreviewRequest.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Billing and Payment Meta Details */}
                <div className="grid grid-cols-2 gap-8 text-xs border-b border-stone-100 pb-5">
                  <div>
                    <span className="text-stone-400 font-bold uppercase tracking-wider text-[9px] block mb-1.5">BILL / SHIP TO</span>
                    <strong className="text-stone-950 block text-sm font-medium">{invoicePreviewRequest.buyerName}</strong>
                    <span className="text-stone-600 block mt-0.5">{invoicePreviewRequest.buyerEmail || invoicePreviewRequest.buyerContact}</span>
                    <p className="text-stone-500 mt-1 leading-relaxed whitespace-pre-line">{invoicePreviewRequest.buyerAddress}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-stone-400 font-bold uppercase tracking-wider text-[9px] block mb-1">SETTLEMENT OVERVIEW</span>
                    <div className="flex justify-between">
                      <span className="text-stone-500 text-2xs uppercase">Intended Option:</span>
                      <span className="font-bold text-stone-900">{methodLabel}</span>
                    </div>
                    {invoicePreviewRequest.paymentDeadline && (
                      <div className="flex justify-between">
                        <span className="text-stone-500 text-2xs uppercase">Payment Deadline:</span>
                        <span className="font-mono text-red-700 font-semibold">{new Date(invoicePreviewRequest.paymentDeadline).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-stone-500 text-2xs uppercase">Reservation Hold:</span>
                      <span className="text-stone-600">24 Hours Guaranteed</span>
                    </div>
                  </div>
                </div>

                {/* Table of Items */}
                <table className="w-full text-xs text-left font-sans">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-2.5">Curation Item Description</th>
                      <th className="pb-2.5 text-right">Brand</th>
                      <th className="pb-2.5 text-right">Qty</th>
                      <th className="pb-2.5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(invoicePreviewRequest.items || []).map((item, idx) => {
                      const photoUrl = getItemPhoto(item);
                      return (
                        <tr key={idx} className="text-stone-800">
                          <td className="py-3 font-medium text-stone-900">
                            <div className="flex items-center gap-3">
                              {photoUrl ? (
                                <img 
                                  src={photoUrl} 
                                  alt={item.name} 
                                  className="w-12 h-12 rounded object-cover border border-stone-200 shrink-0 bg-stone-50"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                                  <ShoppingBag size={14} />
                                </div>
                              )}
                              <div>
                                <span className="block font-medium text-stone-900 text-xs sm:text-sm">{item.name}</span>
                                <span className="block text-[10px] text-stone-400 uppercase tracking-wider font-semibold md:hidden mt-0.5 print:hidden">{item.brand}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-right uppercase tracking-wider text-[10px] text-stone-500 font-medium">{item.brand}</td>
                          <td className="py-3 text-right font-mono font-medium text-stone-600">{item.qty || 1}</td>
                          <td className="py-3 text-right font-mono font-bold">${Number(item.price).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pricing breakdown and payment methods */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-5 border-t border-stone-200">
                  {/* Custom direct payment details block */}
                  <div className="md:col-span-3 space-y-3 text-left">
                    <div className="bg-stone-50 p-4 rounded border border-stone-100 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white uppercase ${accentBg}`}>
                            {methodLabel[0]}
                          </span>
                          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                            Intended Payment ({methodLabel})
                          </h4>
                        </div>
                        
                        {methodDetails.handle ? (
                          <div className="text-stone-800 text-xs pt-1">
                            <span className="text-stone-400 uppercase tracking-wider text-[8px] font-bold block">Account / Handle</span>
                            <strong className="text-stone-950 select-all font-mono bg-stone-200/80 px-1 py-0.5 rounded text-xs block mt-1 w-max">{methodDetails.handle}</strong>
                            {methodDetails.accountName && (
                              <span className="text-[10px] text-stone-500 block mt-1 font-medium">Account Name: {methodDetails.accountName}</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-2xs text-stone-500 italic pt-1">No payment details set up yet for {methodLabel}. Please contact the administrator.</p>
                        )}

                        {methodDetails.instructions && (
                          <div className="pt-2 text-2xs text-stone-600 leading-relaxed">
                            <span className="text-stone-400 uppercase tracking-wider text-[8px] font-bold block mb-0.5">Instructions</span>
                            <p className="whitespace-pre-line bg-white/50 p-1.5 border border-stone-100 rounded text-stone-700 font-medium leading-relaxed">{methodDetails.instructions}</p>
                          </div>
                        )}
                      </div>

                      {methodDetails.qrUrl && (
                        <div className="flex flex-col items-center justify-center p-3 bg-white border border-stone-200/60 rounded shrink-0 self-center shadow-3xs">
                          <img 
                            src={methodDetails.qrUrl} 
                            alt={`${methodLabel} QR Code`} 
                            className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[8px] font-bold text-stone-500 uppercase tracking-wider mt-2.5 bg-stone-100 px-2 py-0.5 rounded">Scan to Pay</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtotals & Grand Total */}
                  <div className="md:col-span-2 space-y-2 text-right text-xs">
                    <div className="flex justify-between text-stone-500">
                      <span>Subtotal:</span>
                      <span className="font-mono font-medium">${itemSubtotal(invoicePreviewRequest).toLocaleString()}</span>
                    </div>
                    {invoicePreviewRequest.shippingCost !== null && (
                      <div className="flex justify-between text-stone-500">
                        <span>Shipping Logistics:</span>
                        <span className="font-mono font-medium">${invoicePreviewRequest.shippingCost.toLocaleString()}</span>
                      </div>
                    )}
                    {invoicePreviewRequest.insuranceCost > 0 && (
                      <div className="flex justify-between text-stone-500">
                        <span>Insurance:</span>
                        <span className="font-mono font-medium">${invoicePreviewRequest.insuranceCost.toLocaleString()}</span>
                      </div>
                    )}
                    {invoicePreviewRequest.taxAmount > 0 && (
                      <div className="flex justify-between text-stone-500">
                        <span>Duties & Taxes:</span>
                        <span className="font-mono font-medium">${invoicePreviewRequest.taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {invoicePreviewRequest.otherFee > 0 && (
                      <div className="flex justify-between text-stone-500">
                        <span>Special Handling:</span>
                        <span className="font-mono font-medium">${invoicePreviewRequest.otherFee.toLocaleString()}</span>
                      </div>
                    )}
                    {invoicePreviewRequest.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-800 font-medium">
                        <span>Discount:</span>
                        <span className="font-mono">-${invoicePreviewRequest.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-950 font-bold border-t border-stone-200 pt-2 text-sm">
                      <span>Grand Total:</span>
                      <span className="font-mono">${(invoicePreviewRequest.finalTotal || itemsTotal + (invoicePreviewRequest.shippingCost || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Memo/Notice footer */}
                <div className="text-[9px] text-stone-400 leading-relaxed border-t border-stone-100 pt-4 font-sans text-center">
                  <span>Thank you for choosing Good Finds by AA. To complete settlement, please scan the large QR code above or send payments to the specified handler account. Curation reservations are automatically released if left unpaid. Please see Page 2 for complete buyer steps.</span>
                </div>
              </div>

              {/* PAGE BREAK FOR PRINTING & VISUAL DIVIDER ON SCREEN */}
              <div className="page-break my-10 border-t border-dashed border-stone-300 relative">
                <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-stone-100 border border-stone-200 text-stone-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider print:hidden">
                  Page 2 (Transaction & Shipping Steps)
                </span>
              </div>

              {/* PAGE 2: CLIENT TRANSACTION & CURATION GUIDE */}
              <div className="space-y-6 pt-4 print:pt-0">
                {/* Header for Page 2 */}
                <div className="flex justify-between items-start border-b-2 border-stone-900 pb-5">
                  <div>
                    <h2 className="font-serif text-2xl font-light text-stone-950 tracking-tight">GOOD FINDS<span className="text-[#C9A84C] font-normal"> by AA</span></h2>
                    <span className="text-[10px] uppercase font-semibold tracking-widest text-stone-400 block mt-1">Direct Settlement & Logistics Guide</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xs text-stone-500 block uppercase tracking-wider font-semibold text-[#C9A84C]">Client Companion</span>
                    <span className="font-mono text-[11px] text-stone-600 block mt-0.5">INVOICE NO: #{invoicePreviewRequest.requestNumber || invoicePreviewRequest.id.toString().slice(-6)}</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    To ensure absolute safety, provenance preservation, and seamless dispatch of your curated luxury purchase, please follow our structured step-by-step settlement workflow:
                  </p>

                  <div className="space-y-3 font-sans">
                    {/* Step 1 */}
                    <div className="flex gap-4 p-3.5 bg-stone-50 rounded border border-stone-200/60 items-start">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white text-[11px] font-bold font-mono">01</span>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Purchase & Curation Request</h4>
                        <p className="text-2xs text-stone-500 leading-relaxed">
                          Your chosen high-end items are temporarily reserved upon request. This places a secure 24-hour hold on the catalog, removing the listings from our public collection to protect your procurement.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 p-3.5 bg-stone-50 rounded border border-stone-200/60 items-start">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-white text-[11px] font-bold font-mono">02</span>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Shipping Logistics & Quotation Approval</h4>
                        <p className="text-2xs text-stone-500 leading-relaxed">
                          The curation administrator evaluates your delivery address, calculates optimized courier values, secures optional transit insurance, and issues your customized multi-tier invoice.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 p-3.5 bg-stone-50 rounded border border-stone-200/60 items-start">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6D1ED4] text-white text-[11px] font-bold font-mono">03</span>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Direct Payment Settlement</h4>
                        <p className="text-2xs text-stone-500 leading-relaxed">
                          Scan the large custom QR code on Page 1 or copy the account handler details exactly. Submit your total outstanding balance using your choice of Zelle, Venmo, or PayPal within the 24-hour guarantee window.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4 p-3.5 bg-stone-50 rounded border border-stone-200/60 items-start">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3D95CE] text-white text-[11px] font-bold font-mono">04</span>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Receipt Upload & Verification</h4>
                        <p className="text-2xs text-stone-500 leading-relaxed">
                          Take a clear screenshot of your bank or mobile app's successful payment receipt. Go to your shopper dashboard's tracking area and upload it. The administrator will match the transaction with the bank log and approve.
                        </p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-4 p-3.5 bg-stone-50 rounded border border-stone-200/60 items-start">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white text-[11px] font-bold font-mono">05</span>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Luxury Dispatch & Delivery</h4>
                        <p className="text-2xs text-stone-500 leading-relaxed">
                          Verified orders are packed with professional curation standards (dust bags, premium insulation box). Tracking links are registered and shared via email, providing high-visibility logistics straight to your door.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning terms for Page 2 */}
                  <div className="bg-[#FFF8E7]/40 border border-amber-200 p-3.5 rounded text-left text-2xs text-amber-900 leading-relaxed font-sans">
                    <span className="font-bold uppercase tracking-wider text-[8px] block mb-1 text-amber-800">⚠️ TRANSACTION & RETURN ADVISORY</span>
                    Authenticity of all items is 100% unconditionally guaranteed. Due to the high value, rare vintage provenance, and exclusive consignment nature of curated items, all approved transactions are final. For priority logistics assistance, contact our concierge at aa@goodfindsbyaa.com.
                  </div>
                </div>

                {/* Guide Page Footer */}
                <div className="text-[9px] text-stone-400 leading-relaxed border-t border-stone-100 pt-4 font-sans text-center">
                  <span>Thank you for your patronage. Good Finds by AA — Curated Fine Pieces & Timeless Luxury collectibles.</span>
                </div>
              </div>

              {/* Printable buttons */}
              <div className="flex justify-between border-t border-stone-100 pt-5" id="print_buttons">
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-3xs"
                >
                  <Printer size={13} /> Print Invoice (PDF)
                </button>
                <button onClick={() => setInvoicePreviewRequest(null)} className="text-xs text-stone-500 font-semibold uppercase hover:underline">Close</button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
