import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Mail, MapPin, Calendar, Clock, DollarSign, CheckCircle2, XCircle, Trash2, AlertCircle, ShoppingBag, Truck } from 'lucide-react';

export function RequestsTab() {
  const { purchaseRequests, updatePurchaseRequest, deletePurchaseRequest, recordSale, getCatalogItemStock } = useStore();
  const [shippingInputs, setShippingInputs] = useState({}); // state holding shipping cost input per request ID

  const handleShippingChange = (id, value) => {
    setShippingInputs(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSaveShipping = (id) => {
    const cost = parseFloat(shippingInputs[id]);
    if (isNaN(cost) || cost < 0) {
      alert('Please enter a valid shipping cost.');
      return;
    }

    updatePurchaseRequest(id, {
      shippingCost: cost,
      status: 'shipping_calculated'
    });
    alert('Shipping cost updated and saved successfully.');
  };

  const handleApprove = (request) => {
    // Validate stock exists for all requested items before approving
    const outOfStockItems = [];
    request.items.forEach(item => {
      const stock = getCatalogItemStock(item.productId);
      if (stock < item.qty) {
        outOfStockItems.push({ name: item.name, requested: item.qty, inStock: stock });
      }
    });

    if (outOfStockItems.length > 0) {
      const list = outOfStockItems.map(i => `"${i.name}" (Requested: ${i.requested}, In Stock: ${i.inStock})`).join('\n');
      alert(`Cannot approve request. Insufficient inventory for:\n${list}`);
      return;
    }

    if (confirm(`Are you sure you want to approve request ${request.id} and convert it to a completed store sale? This will deduct inventory and write to logs.`)) {
      try {
        // Distribute calculated shipping cost over items to keep item total pricing precise
        const extraPerItem = request.shippingCost ? (request.shippingCost / request.items.length) : 0;

        const saleDetails = {
          buyer: request.buyerName,
          date: new Date().toISOString().split('T')[0],
          selectionMethod: 'FIFO',
          items: request.items.map(item => ({
            productId: item.productId,
            qty: item.qty,
            pricePerItem: Math.round((item.price + extraPerItem) * 100) / 100
          }))
        };

        // Record standard FIFO sale
        recordSale(saleDetails);

        // Update purchase request status to approved
        updatePurchaseRequest(request.id, {
          status: 'approved'
        });

        alert('Request approved successfully! The inventory has been deducted, and the sale has been logged in your reports.');
      } catch (err) {
        alert(`Failed to approve request: ${err.message}`);
      }
    }
  };

  const handleReject = (id) => {
    if (confirm('Are you sure you want to decline this curation request?')) {
      updatePurchaseRequest(id, {
        status: 'rejected'
      });
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to permanently delete this request from logs?')) {
      deletePurchaseRequest(id);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'shipping_calculated':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved & Sold';
      case 'rejected':
        return 'Declined';
      case 'shipping_calculated':
        return 'Shipping Calculated';
      default:
        return 'Pending Review';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-display text-2xl text-stone-900 font-normal">Buyer Requests & Notifications</h2>
        <p className="text-sm text-stone-500">
          Review shopping bag purchase submissions, input custom logistics shipping fees, and finalize inventory orders.
        </p>
      </div>

      {purchaseRequests.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
          <ShoppingBag className="mx-auto text-stone-300 mb-4" size={40} />
          <h3 className="font-display text-lg text-stone-700 font-medium mb-1">No active buyer requests</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            When buyers select luxury items from the storefront and request custom logistics quotes, they will appear here as notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {purchaseRequests.map((req) => {
            const itemTotal = req.items.reduce((sum, i) => sum + i.price, 0);
            const totalWithShipping = itemTotal + (req.shippingCost || 0);
            const isPending = req.status === 'pending';
            const isShippingCalc = req.status === 'shipping_calculated';
            const isEditable = isPending || isShippingCalc;
            const currentShippingInput = shippingInputs[req.id] ?? (req.shippingCost !== null ? String(req.shippingCost) : '');

            return (
              <div
                key={req.id}
                className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden"
              >
                {/* Header Row */}
                <div className="bg-stone-50/50 px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold px-2 py-1 bg-stone-200/60 text-stone-700 rounded">
                      ID: {req.id}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 border rounded-full ${getStatusBadgeClass(req.status)}`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {req.date}
                    </span>
                  </div>
                </div>

                {/* Main Details Body */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Section: Buyer Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-1.5">
                      Buyer Contact & Shipping
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-stone-400">Buyer Name</div>
                        <div className="text-sm font-medium text-stone-900">{req.buyerName}</div>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-stone-700">
                        <Mail size={14} className="text-stone-400 flex-shrink-0" />
                        <span className="truncate" title={req.buyerEmail}>{req.buyerEmail}</span>
                      </div>

                      <div className="flex items-start gap-1.5 text-sm text-stone-700 bg-stone-50 p-3 rounded border border-stone-100">
                        <MapPin size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
                            Registered Shipping Address
                          </span>
                          <span className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                            {req.buyerAddress}
                          </span>
                        </div>
                      </div>

                      {req.specialInstructions && (
                        <div className="bg-amber-50/40 p-3 rounded border border-amber-100 text-xs text-amber-800">
                          <strong className="block mb-0.5 font-medium">Buyer Notes:</strong>
                          "{req.specialInstructions}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Section: Items Curation */}
                  <div className="space-y-4 lg:col-span-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-1.5">
                      Requested Items ({req.items.length})
                    </h4>

                    <div className="divide-y divide-stone-100 border border-stone-100 rounded bg-stone-50/30">
                      {req.items.map((item, index) => {
                        const inStock = getCatalogItemStock(item.productId);
                        return (
                          <div key={index} className="p-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{item.emoji || '👜'}</span>
                              <div>
                                <div className="text-sm font-medium text-stone-900">{item.name}</div>
                                <div className="text-xs text-stone-500">{item.brand}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <div className="text-xs text-stone-500">
                                {inStock > 0 ? (
                                  <span className="text-emerald-700 font-medium">In Stock ({inStock})</span>
                                ) : (
                                  <span className="text-red-600 font-medium flex items-center gap-1">
                                    <AlertCircle size={12} /> Out of stock
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-stone-900">
                                ${item.price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pricing Summary */}
                    <div className="bg-stone-50 p-4 rounded border border-stone-200/60 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-stone-500">Curation Subtotal</div>
                        <div className="text-base font-semibold text-stone-900 mt-0.5">
                          ${itemTotal.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-stone-500 flex items-center gap-1">
                          <Truck size={13} className="text-amber-600" />
                          Shipping Cost
                        </div>
                        <div className="text-base font-semibold text-stone-900 mt-0.5">
                          {req.shippingCost !== null ? (
                            <span className="text-amber-800">${req.shippingCost.toLocaleString()}</span>
                          ) : (
                            <span className="text-stone-400 italic text-sm">Not Quoted Yet</span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-stone-200 pt-3 md:pt-0 md:pl-4">
                        <div className="text-xs text-stone-500 font-medium">Grand Total Estimate</div>
                        <div className="text-lg font-bold text-stone-950 mt-0.5">
                          ${totalWithShipping.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Custom Actions (For Pending/Calculated states) */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100 bg-stone-50/50 -mx-6 -mb-6 px-6 py-4 mt-4 transition-all duration-300">
                      {isEditable ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">$</span>
                            <input
                              type="number"
                              placeholder="Shipping cost"
                              value={currentShippingInput}
                              onChange={(e) => handleShippingChange(req.id, e.target.value)}
                              className="w-32 text-sm text-stone-950 bg-white border border-stone-300 rounded py-1.5 pl-7 pr-2 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-semibold transition-all duration-150"
                            />
                          </div>
                          <button
                            onClick={() => handleSaveShipping(req.id)}
                            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-950 text-white text-xs font-semibold rounded uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-[0.98]"
                          >
                            Set Shipping Fee
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-stone-500 italic bg-stone-100 px-3 py-1.5 rounded border border-stone-200">
                          Order finalized. Shipping configuration is locked.
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {isEditable && (
                          <>
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={req.shippingCost === null}
                              className={`px-4 py-2 text-white text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 shadow-sm transition-all duration-200 ${
                                req.shippingCost === null
                                  ? 'bg-stone-300 cursor-not-allowed opacity-60'
                                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-100 active:scale-[0.98]'
                              }`}
                              title={req.shippingCost === null ? 'Quote shipping first' : 'Approve Curation Order'}
                            >
                              <CheckCircle2 size={14} />
                              Approve & Complete
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-3 py-2 bg-white border border-stone-300 hover:bg-red-50 text-stone-700 hover:text-red-700 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1 transition-all duration-200 active:scale-[0.98]"
                            >
                              <XCircle size={14} />
                              Decline
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-2 bg-stone-100 hover:bg-red-100 text-stone-500 hover:text-red-700 rounded transition-all duration-200 active:scale-[0.95]"
                          title="Delete request"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
