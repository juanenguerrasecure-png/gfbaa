import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingCart, Search, DollarSign, Calendar, User, X, Check } from 'lucide-react';

export function GlobalManualSaleModal({ isOpen, onClose, initialItemId = '', initialItemName = '' }) {
  const { batches, products, catalogItems, recordManualSale } = useStore();

  const [search, setSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [qty, setQty] = useState(1);
  const [priceInput, setPriceInput] = useState('');
  const [priceType, setPriceType] = useState('bulk'); // 'unit' | 'bulk'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeBatches = useMemo(() => batches.filter(b => b.remainingQty > 0), [batches]);

  const filteredBatches = useMemo(() => {
    const term = search.toLowerCase();
    return activeBatches.filter(b => {
      const prod = products.find(p => p.id === b.productId) || {};
      const name = (prod.name || '').toLowerCase();
      const brand = (prod.brand || '').toLowerCase();
      const batchNo = (b.batchNumber || '').toLowerCase();
      return name.includes(term) || brand.includes(term) || batchNo.includes(term);
    });
  }, [activeBatches, products, search]);

  const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId), [batches, selectedBatchId]);

  const selectedProduct = useMemo(() => {
    if (!selectedBatch) return null;
    return products.find(p => p.id === selectedBatch.productId);
  }, [products, selectedBatch]);

  const applyBatchSelection = (batchId) => {
    setSelectedBatchId(batchId);
    setError('');
    setSuccess('');

    if (!batchId) {
      setPriceInput('');
      return;
    }

    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      const linkedCatalog = catalogItems.find(c => c.batchId === batchId);
      setPriceInput(linkedCatalog && linkedCatalog.price ? String(linkedCatalog.price) : '');
      setQty(1);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccess('');

    if (initialItemName) setSearch(initialItemName);

    if (initialItemId) {
      const matchingBatch = batches.find(b => String(b.id) === String(initialItemId) || String(b.productId) === String(initialItemId));
      if (matchingBatch) applyBatchSelection(matchingBatch.id);
    }
  }, [isOpen, initialItemId, initialItemName, batches]);

  const handleBatchSelect = (batchId) => {
    applyBatchSelection(batchId);
  };

  const handleQtyChange = (val) => {
    if (!selectedBatch) return;
    const nextQty = Math.max(1, Math.min(selectedBatch.remainingQty, Number(val) || 1));

    if (priceType === 'bulk' && priceInput && qty) {
      const perUnit = Number(priceInput) / qty;
      setPriceInput(String(Math.round(perUnit * nextQty * 100) / 100));
    }
    setQty(nextQty);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedBatchId) {
      setError('Please select an active stock batch.');
      return;
    }

    const requestedQty = Number(qty);
    if (isNaN(requestedQty) || requestedQty <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    if (selectedBatch && requestedQty > selectedBatch.remainingQty) {
      setError(`Cannot sell more than available remaining quantity (${selectedBatch.remainingQty}).`);
      return;
    }

    const enteredPrice = Number(priceInput);
    if (isNaN(enteredPrice) || enteredPrice < 0) {
      setError('Please enter a valid price.');
      return;
    }

    const calculatedPricePerItem = priceType === 'unit' ? enteredPrice : (enteredPrice / requestedQty);

    try {
      recordManualSale({
        buyer: buyer.trim() || 'Offline Customer',
        date,
        batchId: selectedBatchId,
        qty: requestedQty,
        pricePerItem: calculatedPricePerItem
      });

      setSuccess('Direct sale successfully logged! Stock has been depleted.');
      setBuyer('');
      setSelectedBatchId('');
      setPriceInput('');
      setQty(1);
      setSearch('');

      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to record direct sale.');
    }
  };

  if (!isOpen) return null;

  const currentCogs = selectedBatch ? qty * selectedBatch.costPerItem : 0;
  const currentRevenue = selectedBatch
    ? (priceType === 'unit' ? qty * (Number(priceInput) || 0) : (Number(priceInput) || 0))
    : 0;
  const currentProfit = currentRevenue - currentCogs;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-stretch justify-center p-0 sm:items-center sm:p-4 bg-stone-900/60 backdrop-blur-sm"
      id="global_manual_sale_backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-none sm:rounded-lg shadow-xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] animate-fade-in"
        id="global_manual_sale_container"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingCart className="text-[#C9A84C] shrink-0" size={20} />
            <h3 className="font-display text-base sm:text-lg font-semibold tracking-wide truncate">Direct / Manual Sale Entry</h3>
          </div>
          <button
            id="btn_close_global_sale_modal"
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-1 shrink-0"
            aria-label="Close manual sale modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 pb-6">
            <div className="text-xs text-stone-500 bg-stone-50 p-3 rounded border border-[#E5DFD8]">
              Use this tool to record sales made outside the online storefront (such as in-person boutique visits, private collectors, phone orders, or wholesale transactions). Depleting stock here immediately syncs with your product catalog listings.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Search & Select Batch *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-stone-400" size={14} />
                    <input
                      id="global_sale_search_input"
                      type="text"
                      placeholder="Search by Brand, Product, or Batch ID..."
                      className="w-full pl-8 pr-12 py-1.5 border border-stone-300 rounded text-xs bg-white h-9 focus:border-[#C9A84C] outline-none"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 text-[10px] font-bold">
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-1.5 border border-[#E5DFD8] rounded overflow-y-auto bg-stone-50 p-1.5 space-y-1" style={{ height: '180px' }} id="global_sale_batch_list">
                    {filteredBatches.length === 0 ? (
                      <div className="text-center py-8 text-stone-400 text-xs">
                        {activeBatches.length === 0 ? 'No active inventory available.' : 'No matching active inventory found.'}
                      </div>
                    ) : (
                      filteredBatches.map(b => {
                        const prod = products.find(p => p.id === b.productId) || { name: 'Unknown', brand: 'Unknown' };
                        const isSelected = selectedBatchId === b.id;
                        return (
                          <button
                            key={b.id}
                            id={`global_sale_select_batch_${b.batchNumber}`}
                            type="button"
                            onClick={() => handleBatchSelect(b.id)}
                            className={`w-full text-left p-2 rounded border transition-all flex items-center justify-between text-xs ${isSelected ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-[#E5DFD8] hover:border-[#C9A84C] text-stone-800'}`}
                          >
                            <div className="flex-1 pr-2 truncate">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1 rounded font-mono text-[9px] ${isSelected ? 'bg-[#C9A84C] text-stone-950' : 'bg-stone-100 text-stone-600'}`}>
                                  {b.batchNumber}
                                </span>
                                <span className="font-semibold">{prod.brand}</span>
                              </div>
                              <p className={`truncate text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>{prod.name}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`font-semibold ${isSelected ? 'text-[#C9A84C]' : 'text-emerald-700'}`}>{b.remainingQty} left</span>
                              <p className="text-[10px] opacity-75">Cost: ${b.costPerItem}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedBatch ? (
                  <div className="p-3 bg-amber-50 rounded border border-amber-200 space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800">Active Selection</span>
                    <h4 className="text-xs font-bold text-stone-900 truncate">{selectedProduct?.brand} {selectedProduct?.name}</h4>
                    <div className="flex justify-between text-[11px] text-stone-600 font-mono">
                      <span>Batch: {selectedBatch.batchNumber}</span>
                      <span>Available Stock: {selectedBatch.remainingQty}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-100 rounded border border-dashed border-stone-300 text-center text-xs text-stone-400 py-6">
                    Please select an inventory stock batch on the left to proceed with details.
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Quantity Sold *</label>
                  <div className="flex items-center gap-2">
                    <input id="global_sale_qty_input" type="number" min="1" max={selectedBatch ? selectedBatch.remainingQty : 1} value={qty} onChange={e => handleQtyChange(e.target.value)} disabled={!selectedBatchId} className="w-full p-2 border border-stone-300 rounded text-xs bg-white disabled:opacity-50 disabled:bg-stone-100 h-9 focus:border-[#C9A84C] outline-none" required />
                    {selectedBatch && (
                      <button
                        type="button"
                        id="btn_global_sale_qty_max"
                        onClick={() => {
                          const maxQty = selectedBatch.remainingQty;
                          if (priceType === 'bulk' && priceInput && qty) {
                            const perUnit = Number(priceInput) / qty;
                            setPriceInput(String(Math.round(perUnit * maxQty * 100) / 100));
                          }
                          setQty(maxQty);
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-bold bg-stone-100 hover:bg-stone-200 rounded border text-stone-700 whitespace-nowrap h-9"
                      >
                        Set Max ({selectedBatch.remainingQty})
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Pricing Method</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded border border-[#E5DFD8]">
                    <button type="button" onClick={() => { if (priceType === 'unit') return; setPriceType('unit'); if (priceInput && qty) setPriceInput(String(Math.round((Number(priceInput) / qty) * 100) / 100)); }} className={`py-1 text-[11px] font-semibold rounded text-center transition-all ${priceType === 'unit' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>
                      Per Unit Price
                    </button>
                    <button type="button" onClick={() => { if (priceType === 'bulk') return; setPriceType('bulk'); if (priceInput && qty) setPriceInput(String(Math.round(Number(priceInput) * qty * 100) / 100)); }} className={`py-1 text-[11px] font-semibold rounded text-center transition-all ${priceType === 'bulk' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>
                      Bulk / Total Price
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">{priceType === 'unit' ? 'Selling Price (USD per unit) *' : 'Total Selling Price (Bulk/Total USD) *'}</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2 text-stone-400" size={14} />
                    <input id="global_sale_price_input" type="number" step="0.01" min="0" placeholder="0.00" value={priceInput} onChange={e => setPriceInput(e.target.value)} disabled={!selectedBatchId} className="w-full pl-7 pr-3 py-1.5 border border-stone-300 rounded text-xs bg-white disabled:opacity-50 disabled:bg-stone-100 h-9 focus:border-[#C9A84C] outline-none" required />
                  </div>
                  {selectedBatch && (
                    <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                      <span>Acquisition batch cost: ${selectedBatch.costPerItem}/ea</span>
                      {priceType === 'bulk' && priceInput && <span className="font-semibold text-stone-500">Computed: ${(Number(priceInput) / qty).toFixed(2)}/ea</span>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Buyer Name / Client</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2 text-stone-400" size={14} />
                    <input id="global_sale_buyer_input" type="text" placeholder="e.g. In-person client" value={buyer} onChange={e => setBuyer(e.target.value)} className="w-full pl-7 pr-3 py-1.5 border border-stone-300 rounded text-xs bg-white h-9 focus:border-[#C9A84C] outline-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Transaction Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2 text-stone-400" size={14} />
                    <input id="global_sale_date_input" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-7 pr-3 py-1.5 border border-stone-300 rounded text-xs bg-white h-9 focus:border-[#C9A84C] outline-none" required />
                  </div>
                </div>
              </div>
            </div>

            {selectedBatch && (
              <div className="bg-stone-950 text-stone-100 p-4 rounded-lg border border-stone-800 font-mono text-xs space-y-2 animate-fade-in" id="global_sale_financials">
                <div className="flex justify-between"><span className="text-stone-400">Total Items Sold:</span><span className="text-white font-semibold">{qty} units</span></div>
                <div className="flex justify-between"><span className="text-stone-400">Total Revenue:</span><span className="text-white font-semibold">${currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-stone-400"><span>Total COGS Cost:</span><span>-${currentCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between border-t border-stone-800 pt-2 font-semibold text-sm text-emerald-400"><span>Estimated Direct Profit:</span><span>${currentProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              </div>
            )}

            {error && <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded border border-red-200" id="global_sale_error">⚠️ {error}</div>}
            {success && <div className="text-xs font-semibold text-green-700 bg-green-50 p-2.5 rounded border border-green-200 flex items-center gap-1.5" id="global_sale_success"><Check size={14} /> {success}</div>}
          </div>

          <div className="shrink-0 bg-[#FAF8F5] sm:bg-white px-4 sm:px-6 py-3 border-t border-[#E5DFD8] shadow-[0_-8px_20px_rgba(28,20,16,0.08)] sm:shadow-none flex justify-end gap-3" id="global_sale_form_actions">
            <button id="btn_global_sale_cancel" type="button" onClick={onClose} className="px-4 py-2 border border-[#E5DFD8] rounded text-xs text-stone-600 hover:bg-stone-50 font-semibold transition-colors bg-white cursor-pointer">Cancel</button>
            <button id="btn_global_sale_confirm" type="submit" disabled={!selectedBatchId || success !== ''} className="flex-1 sm:flex-none px-5 py-2 bg-[#C9A84C] text-stone-950 font-bold hover:bg-[#b7963d] rounded text-xs transition-colors disabled:opacity-50 cursor-pointer">Confirm and Deplete Stock</button>
          </div>
        </form>
      </div>
    </div>
  );
}
