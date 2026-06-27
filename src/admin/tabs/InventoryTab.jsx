import { useState, useMemo } from 'react';
import { Pencil, Trash2, ShoppingCart, Search, Info, PlusCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PhotoUploader } from '../../components/PhotoUploader';
import styles from './InventoryTab.module.css';

function SellCatalogItemModal({ item, onClose, onConfirm }) {
  const { batches, getCatalogItemStock } = useStore();
  const availableStock = getCatalogItemStock(item.id);
  const linkedBatch = batches.find(b => b.id === item.batchId);

  const [buyer, setBuyer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [qty, setQty] = useState(1);
  const [pricePerItem, setPricePerItem] = useState(Number(item.price) || 0);

  const currentCogs = linkedBatch ? (qty * linkedBatch.costPerItem) : 0;
  const currentRevenue = qty * pricePerItem;
  const currentProfit = currentRevenue - currentCogs;

  const handleConfirm = () => {
    if (!buyer.trim()) {
      alert('Please specify the buyer name.');
      return;
    }
    if (qty > availableStock) {
      alert(`Cannot sell more than available stock (${availableStock} items).`);
      return;
    }

    onConfirm({
      buyer,
      date,
      items: [{
        productId: item.id, // catalogItemId
        qty: Number(qty),
        pricePerItem: Number(pricePerItem)
      }]
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} w-full max-w-lg bg-white p-6 rounded-lg`} onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl text-stone-900 border-b pb-2 mb-4">Record Retail Sale</h3>
        
        <div className="space-y-4">
          <div className="p-3 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-stone-800">{item.brand} {item.name}</p>
                <p className="text-xs text-stone-400">Linked to Batch: {linkedBatch?.batchNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">Unit Cost: ${linkedBatch?.costPerItem || 0}</p>
              <p className="text-xs font-semibold text-emerald-700">Available: {availableStock}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-500">Buyer Name *</label>
              <input
                type="text"
                className="p-2 border border-stone-200 rounded text-sm focus:border-amber-500 outline-none"
                placeholder="e.g. Walk-in Customer"
                value={buyer}
                onChange={e => setBuyer(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-500">Date of Sale</label>
              <input
                type="date"
                className="p-2 border border-stone-200 rounded text-sm focus:border-amber-500 outline-none"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-500">Quantity Sold</label>
              <input
                type="number"
                min="1"
                max={availableStock}
                className="p-2 border border-stone-200 rounded text-sm focus:border-amber-500 outline-none"
                value={qty}
                onChange={e => setQty(Math.max(1, Math.min(availableStock, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-500">Price Per Item (USD)</label>
              <input
                type="number"
                className="p-2 border border-stone-200 rounded text-sm focus:border-amber-500 outline-none"
                value={pricePerItem}
                onChange={e => setPricePerItem(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-stone-900 text-stone-100 p-4 rounded border font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span>Total Revenue:</span>
              <span>${currentRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Total COGS Cost:</span>
              <span>-${currentCogs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-stone-800 pt-2 font-semibold text-sm text-emerald-400">
              <span>Estimated Profit:</span>
              <span>${currentProfit.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-xs text-stone-600 hover:bg-stone-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold"
            >
              Record Storefront Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SellBatchModal({ batch, onClose, onConfirm }) {
  const { products } = useStore();
  const productObj = products.find(p => p.id === batch.productId) || { name: 'Unknown Product', brand: 'Unknown Brand' };

  const [buyer, setBuyer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [qty, setQty] = useState(1);
  const [priceInput, setPriceInput] = useState('');
  const [priceType, setPriceType] = useState('bulk'); // 'unit' | 'bulk'

  const currentCogs = qty * batch.costPerItem;
  const currentRevenue = priceType === 'unit' ? qty * (Number(priceInput) || 0) : (Number(priceInput) || 0);
  const currentProfit = currentRevenue - currentCogs;

  const handleQtyChange = (val) => {
    const nextQty = Math.max(1, Math.min(batch.remainingQty, Number(val) || 1));
    if (priceType === 'bulk' && priceInput && qty) {
      const perUnit = Number(priceInput) / qty;
      setPriceInput(String(Math.round(perUnit * nextQty * 100) / 100));
    }
    setQty(nextQty);
  };

  const handleConfirm = () => {
    if (!buyer.trim()) {
      alert('Please specify the buyer name.');
      return;
    }
    const enteredPrice = Number(priceInput);
    if (isNaN(enteredPrice) || enteredPrice < 0 || priceInput === '') {
      alert('Please enter a valid price.');
      return;
    }
    if (qty > batch.remainingQty) {
      alert(`Cannot sell more than available batch stock (${batch.remainingQty} items).`);
      return;
    }

    const calculatedPricePerItem = priceType === 'unit' ? enteredPrice : (enteredPrice / qty);

    onConfirm({
      buyer,
      date,
      batchId: batch.id,
      qty: Number(qty),
      pricePerItem: calculatedPricePerItem
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose} id="sell_batch_modal_overlay">
      <div className={`${styles.modal} w-full max-w-lg bg-white p-6 rounded-lg`} onClick={(e) => e.stopPropagation()} id="sell_batch_modal_container">
        <h3 className="font-display text-xl text-stone-900 border-b pb-2 mb-4" id="sell_batch_modal_title">Record Direct/Manual Sale</h3>
        
        <div className="space-y-4">
          <div className="p-3 bg-stone-50 rounded border border-stone-100 flex items-center justify-between" id="sell_batch_info">
            <div>
              <p className="text-xs uppercase font-bold text-amber-700 tracking-wider font-mono">Batch: {batch.batchNumber}</p>
              <p className="text-sm font-semibold text-stone-800">{productObj.brand} {productObj.name}</p>
              <p className="text-xs text-stone-400">Condition: {batch.condition}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">Unit Cost: ${batch.costPerItem}</p>
              <p className="text-xs font-semibold text-emerald-700">Available: {batch.remainingQty}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans" id="sell_batch_form_fields">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-500">Buyer Name *</label>
              <input
                id="sell_batch_buyer_input"
                type="text"
                className="p-2 border border-stone-200 rounded text-sm focus:border-amber-500 outline-none h-11"
                placeholder="e.g. Walk-in Customer"
                value={buyer}
                onChange={e => setBuyer(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-500">Date of Sale</label>
              <input
                id="sell_batch_date_input"
                type="date"
                className="p-2 border border-stone-200 rounded text-sm focus:border-amber-500 outline-none h-11"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-500">Quantity Sold *</label>
              <input
                id="sell_batch_qty_input"
                type="number"
                min="1"
                max={batch.remainingQty}
                className="p-2 border border-stone-200 rounded text-sm focus:border-amber-500 outline-none h-11"
                value={qty}
                onChange={e => handleQtyChange(e.target.value)}
              />
            </div>
            
            {/* Pricing Method Selector */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-stone-500">Pricing Method</label>
              <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    if (priceType === 'unit') return;
                    setPriceType('unit');
                    if (priceInput && qty) {
                      setPriceInput(String(Math.round((Number(priceInput) / qty) * 100) / 100));
                    }
                  }}
                  className={`py-1.5 text-[11px] font-semibold rounded text-center transition-all ${
                    priceType === 'unit' 
                      ? 'bg-stone-900 text-white shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Per Unit Price
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (priceType === 'bulk') return;
                    setPriceType('bulk');
                    if (priceInput && qty) {
                      setPriceInput(String(Math.round(Number(priceInput) * qty * 100) / 100));
                    }
                  }}
                  className={`py-1.5 text-[11px] font-semibold rounded text-center transition-all ${
                    priceType === 'bulk' 
                      ? 'bg-stone-900 text-white shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Bulk / Total Price
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-stone-500">
                {priceType === 'unit' ? 'Selling Price (USD per unit) *' : 'Total Selling Price (Bulk/Total USD) *'}
              </label>
              <input
                id="sell_batch_price_input"
                type="number"
                step="0.01"
                className="p-2 border border-stone-200 rounded text-sm focus:border-amber-500 outline-none h-11"
                placeholder={priceType === 'unit' ? 'Enter sale price per unit' : 'Enter total bulk sale price'}
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
              />
              {priceType === 'bulk' && priceInput && (
                <span className="text-[10px] text-stone-500 mt-0.5 font-semibold">
                  Computed per-unit: ${(Number(priceInput) / qty).toFixed(2)}/ea
                </span>
              )}
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-stone-900 text-stone-100 p-4 rounded border font-mono text-xs space-y-2" id="sell_batch_financial_summary">
            <div className="flex justify-between">
              <span>Total Revenue:</span>
              <span>${currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Total COGS Cost:</span>
              <span>-${currentCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-stone-800 pt-2 font-semibold text-sm text-emerald-400">
              <span>Estimated Profit:</span>
              <span>${currentProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2" id="sell_batch_modal_actions">
            <button
              id="btn_sell_batch_cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-xs text-stone-600 hover:bg-stone-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn_sell_batch_confirm"
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-[#C9A84C] text-stone-950 font-bold hover:bg-[#b7963d] rounded text-xs transition-colors"
            >
              Confirm and Deplete Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogItemEditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 className={styles.modalTitle}>Edit Catalog Listing</h3>
        <p className="text-xs text-stone-500 mb-4">Update storefront catalog parameters for {item.brand} {item.name}</p>
        
        <div className={styles.editGrid}>
          {[['name','Name'],['brand','Brand'],['detail','Public Details']].map(([k,l]) => (
            <div key={k} className={styles.editField}>
              <label className={styles.mLabel}>{l}</label>
              <input className={styles.mInput} value={form[k] || ''} onChange={e => set(k, e.target.value)} />
            </div>
          ))}
          <div className={styles.editField}>
            <label className={styles.mLabel}>Category</label>
            <select className={styles.mInput} value={form.cat} onChange={e => set('cat', e.target.value)}>
              <option value="bags">Bags</option>
              <option value="jewelry">Jewelry</option>
            </select>
          </div>
          <div className={styles.editField}>
            <label className={styles.mLabel}>Emoji Icon</label>
            <input className={styles.mInput} value={form.emoji || ''} onChange={e => set('emoji', e.target.value)} />
          </div>
          <div className={styles.editField}>
            <label className={styles.mLabel}>Quality Condition</label>
            <select className={styles.mInput} value={form.condition} onChange={e => set('condition', e.target.value)}>
              <option value="new">New</option>
              <option value="mint">Mint</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
          <div className={styles.editField}>
            <label className={styles.mLabel}>Listing Price (USD $)</label>
            <input className={styles.mInput} type="number" value={form.price} onChange={e => set('price', Number(e.target.value))} />
          </div>
          <div className={styles.editField}>
            <label className={styles.mLabel}>Comparison MSRP Price ($)</label>
            <input className={styles.mInput} type="number" value={form.orig || ''} onChange={e => set('orig', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className={styles.editField}>
            <label className={styles.mLabel}>Initial Qty</label>
            <input className={styles.mInput} type="number" value={form.quantity !== undefined ? form.quantity : 1} onChange={e => set('quantity', Number(e.target.value))} />
          </div>
          <div className={styles.editField}>
            <label className={styles.mLabel}>Remaining Stock</label>
            <input className={styles.mInput} type="number" value={form.remainingQty !== undefined ? form.remainingQty : 1} onChange={e => set('remainingQty', Number(e.target.value))} />
          </div>
        </div>

        <div className="mt-4 border-t border-stone-200 pt-4">
          <PhotoUploader value={form.photoUrl} onChange={url => set('photoUrl', url)} />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.confirmBtn} onClick={() => onSave(form)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

const COND_COLORS = { new: '#3B6D11', mint: '#3B6D11', good: '#854F0B', fair: '#993C1D' };
const COND_BG    = { new: '#F0F7F0',  mint: '#F0F7F0',  good: '#FFF8E8', fair: '#FDF0EE' };

export function InventoryTab({ onSwitchTab }) {
  const { catalogItems, products, batches, getCatalogItemStock, deleteCatalogItem, updateCatalogItem, recordSale, recordManualSale, deleteBatch } = useStore();
  
  const [search, setSearch] = useState('');
  const [sellTarget, setSellTarget] = useState(null);
  const [sellBatchTarget, setSellBatchTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [activeSubView, setActiveSubView] = useState('catalog'); // 'catalog' | 'batches'

  // Filter catalog listings based on search
  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase())
    );
  }, [catalogItems, search]);

  // Filter batches based on search
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const p = products.find(prod => prod.id === b.productId) || {};
      const prodName = p.name ? p.name.toLowerCase() : '';
      const prodBrand = p.brand ? p.brand.toLowerCase() : '';
      const bNum = b.batchNumber.toLowerCase();
      const s = search.toLowerCase();
      return prodName.includes(s) || prodBrand.includes(s) || bNum.includes(s);
    });
  }, [batches, products, search]);

  const handleSaleConfirm = (saleDetails) => {
    try {
      recordSale(saleDetails);
      setSellTarget(null);
    } catch (err) {
      alert(`Error recording sale: ${err.message}`);
    }
  };

  const handleManualSaleConfirm = (saleDetails) => {
    try {
      recordManualSale(saleDetails);
      setSellBatchTarget(null);
      alert('Manual direct sale successfully recorded! Stock has been depleted.');
    } catch (err) {
      alert(`Error recording manual sale: ${err.message}`);
    }
  };

  return (
    <div className={styles.wrap}>
      {/* View Sub-selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 mb-5 gap-4 pb-2 sm:pb-0">
        <div className="flex -mb-px">
          <button
            onClick={() => setActiveSubView('catalog')}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeSubView === 'catalog' ? 'border-amber-600 text-stone-900 font-bold' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Product Catalog Listings ({catalogItems.length})
          </button>
          <button
            onClick={() => setActiveSubView('batches')}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeSubView === 'batches' ? 'border-amber-600 text-stone-900 font-bold' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Acquisition Batches Log ({batches.length})
          </button>
        </div>
        
        {/* Create Items Button */}
        <div className="flex gap-2 pb-2 sm:pb-0 pr-1">
          <button
            onClick={() => {
              if (onSwitchTab) {
                onSwitchTab('add');
              }
            }}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 border border-stone-900"
          >
            <PlusCircle size={14} />
            Create Listing or Batch
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.search}
            placeholder={activeSubView === 'catalog' ? "Search listings..." : "Search batches..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className={styles.total}>
          {activeSubView === 'catalog'
            ? `${filteredCatalogItems.length} active listings`
            : `${filteredBatches.length} batches logged`}
        </span>
      </div>

      {activeSubView === 'catalog' ? (
        /* Catalog View Table */
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Listing Info</th>
                <th>Category</th>
                <th>Associated Batch</th>
                <th>Remaining Qty</th>
                <th>Retail Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalogItems.map(item => {
                const stock = getCatalogItemStock(item.id);
                const batch = batches.find(b => b.id === item.batchId);
                return (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.itemCell}>
                        <span className={styles.itemEmoji}>{item.emoji}</span>
                        <div>
                          <div className={styles.itemName}>{item.name}</div>
                          <div className={styles.itemBrand}>{item.brand}</div>
                          {item.detail && <div className="text-[10px] text-stone-400 line-clamp-1">{item.detail}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.catBadge}>{item.cat}</span></td>
                    <td>
                      {batch ? (
                        <div className="font-mono text-xs">
                          <div className="text-stone-800 font-semibold">{batch.batchNumber}</div>
                          <div className="text-[10px] text-stone-500">Cost: ${batch.costPerItem}/ea</div>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic text-xs">Unlinked</span>
                      )}
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        stock > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {stock} available
                      </span>
                    </td>
                    <td className={styles.numCell}>${(Number(item.price) || 0).toLocaleString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.iconBtn} title="Edit Spec Listing" onClick={() => setEditTarget(item)}>
                          <Pencil size={13} strokeWidth={1.8} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.sellBtn} bg-stone-900 text-white`} title="Sell Retail Item" onClick={() => setSellTarget(item)}>
                          <ShoppingCart size={13} strokeWidth={1.8} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Unlist Catalog Item" onClick={() => {
                          if (confirm(`Are you sure you want to unlist this item "${item.name}" from the storefront? The acquisition batch records and remaining stock will NOT be deleted.`)) {
                            deleteCatalogItem(item.id);
                          }
                        }}>
                          <Trash2 size={13} strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCatalogItems.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-stone-50/50 border border-dashed border-stone-200 rounded-lg m-4" id="empty_catalog_state">
                      <span className="text-3xl mb-3">✨</span>
                      <h3 className="font-display text-lg font-medium text-stone-800 mb-1">No Catalog Items Listed</h3>
                      <p className="text-stone-500 text-xs max-w-sm mb-5 font-sans">
                        You have not created any retail listing pages for the storefront yet. Direct your buyers to listed items or create one now.
                      </p>
                      <button
                        onClick={() => onSwitchTab && onSwitchTab('add')}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        id="empty_catalog_add_btn"
                      >
                        <PlusCircle size={13} />
                        Publish Your First Listing
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Batches Log View Table */
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Batch #</th>
                <th>Product Model</th>
                <th>Condition</th>
                <th>Bought Date</th>
                <th>Quantity</th>
                <th>In Stock</th>
                <th>Cost Per Item</th>
                <th>Total Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map(batch => {
                const prod = products.find(p => p.id === batch.productId) || { name: 'Unknown', brand: 'Unknown' };
                return (
                  <tr key={batch.id}>
                    <td className="font-semibold text-xs font-mono">{batch.batchNumber}</td>
                    <td>
                      <div className="text-xs">
                        <div className="font-semibold text-stone-800">{prod.brand} {prod.name}</div>
                        {batch.enteredInPhp && <div className="text-[10px] text-amber-700 font-semibold font-mono">PHP-Converted ({batch.exchangeRateUsed}x)</div>}
                      </div>
                    </td>
                    <td>
                      <span className={styles.condBadge} style={{ background: COND_BG[batch.condition], color: COND_COLORS[batch.condition] }}>
                        {batch.condition}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{batch.date}</td>
                    <td className="text-center font-mono text-xs">{batch.quantity}</td>
                    <td className="text-center font-mono text-xs font-semibold text-amber-700">{batch.remainingQty} left</td>
                    <td className={styles.numCell}>${batch.costPerItem.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={styles.numCell}>${batch.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div className="flex gap-1.5 justify-center">
                        <button
                          className={`${styles.iconBtn} bg-stone-900 text-white border-stone-900 hover:bg-stone-800`}
                          title="Record Direct Manual Sale"
                          id={`btn_record_direct_sale_batch_${batch.batchNumber}`}
                          disabled={batch.remainingQty <= 0}
                          style={{ opacity: batch.remainingQty <= 0 ? 0.4 : 1 }}
                          onClick={() => setSellBatchTarget(batch)}
                        >
                          <ShoppingCart size={13} strokeWidth={1.8} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn} border-stone-200 hover:border-red-500`} title="Delete Batch" onClick={() => deleteBatch(batch.id)}>
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-stone-50/50 border border-dashed border-stone-200 rounded-lg m-4" id="empty_batches_state">
                      <span className="text-3xl mb-3">📦</span>
                      <h3 className="font-display text-lg font-medium text-stone-800 mb-1">No Acquisition Batches Registered</h3>
                      <p className="text-stone-500 text-xs max-w-sm mb-5 font-sans">
                        To manage your gold jewelry or pre-loved designer bags inventory, register a wholesale acquisition batch first.
                      </p>
                      <button
                        onClick={() => onSwitchTab && onSwitchTab('add')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-stone-100 text-xs font-semibold rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        id="empty_batches_add_btn"
                      >
                        <PlusCircle size={13} />
                        Register New Wholesale Batch
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {sellTarget && (
        <SellCatalogItemModal
          item={sellTarget}
          onConfirm={handleSaleConfirm}
          onClose={() => setSellTarget(null)}
        />
      )}
      {sellBatchTarget && (
        <SellBatchModal
          batch={sellBatchTarget}
          onConfirm={handleManualSaleConfirm}
          onClose={() => setSellBatchTarget(null)}
        />
      )}
      {editTarget && (
        <CatalogItemEditModal
          item={editTarget}
          onSave={(form) => { updateCatalogItem(editTarget.id, form); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
