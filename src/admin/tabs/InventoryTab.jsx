import { lazy, Suspense, useMemo, useState } from 'react';
import { Pencil, PlusCircle, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PhotoUploader } from '../../components/PhotoUploader';
import styles from './InventoryTab.module.css';

const GlobalManualSaleModal = lazy(() => import('../components/GlobalManualSaleModal').then(m => ({ default: m.GlobalManualSaleModal })));

function AdminModalFallback() {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded bg-white p-6 text-stone-500 shadow-xl">
        <div className="h-7 w-7 rounded-full border-2 border-[#E5DFD8] border-t-[#C9A84C] animate-spin" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">Loading sale entry</span>
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
          {[['name', 'Name'], ['brand', 'Brand'], ['detail', 'Public Details']].map(([k, l]) => (
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
const COND_BG = { new: '#F0F7F0', mint: '#F0F7F0', good: '#FFF8E8', fair: '#FDF0EE' };

export function InventoryTab({ onSwitchTab }) {
  const { catalogItems, products, batches, getCatalogItemStock, deleteCatalogItem, updateCatalogItem, deleteBatch } = useStore();

  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [manualSaleTarget, setManualSaleTarget] = useState(null);
  const [activeSubView, setActiveSubView] = useState('catalog'); // 'catalog' | 'batches'

  const filteredCatalogItems = useMemo(() => {
    const s = search.toLowerCase();
    return catalogItems.filter(item =>
      item.name.toLowerCase().includes(s) ||
      item.brand.toLowerCase().includes(s)
    );
  }, [catalogItems, search]);

  const filteredBatches = useMemo(() => {
    const s = search.toLowerCase();
    return batches.filter(b => {
      const p = products.find(prod => prod.id === b.productId) || {};
      const prodName = p.name ? p.name.toLowerCase() : '';
      const prodBrand = p.brand ? p.brand.toLowerCase() : '';
      const bNum = b.batchNumber.toLowerCase();
      return prodName.includes(s) || prodBrand.includes(s) || bNum.includes(s);
    });
  }, [batches, products, search]);

  const openManualSale = (id, name) => {
    setManualSaleTarget({ id, name });
  };

  return (
    <div className={styles.wrap}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 mb-5 gap-4 pb-2 sm:pb-0">
        <div className="flex -mb-px">
          <button onClick={() => setActiveSubView('catalog')} className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${activeSubView === 'catalog' ? 'border-[#C9A84C] text-stone-900 font-bold' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>Product Catalog Listings ({catalogItems.length})</button>
          <button onClick={() => setActiveSubView('batches')} className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${activeSubView === 'batches' ? 'border-[#C9A84C] text-stone-900 font-bold' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>Acquisition Batches Log ({batches.length})</button>
        </div>

        <div className="flex gap-2 pb-2 sm:pb-0 pr-1">
          <button onClick={() => onSwitchTab && onSwitchTab('add')} className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 border border-stone-900">
            <PlusCircle size={14} />Create Listing or Batch
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.search} placeholder={activeSubView === 'catalog' ? 'Search listings...' : 'Search batches...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className={styles.total}>{activeSubView === 'catalog' ? `${filteredCatalogItems.length} active listings` : `${filteredBatches.length} batches logged`}</span>
      </div>

      {activeSubView === 'catalog' ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Listing Info</th><th>Category</th><th>Associated Batch</th><th>Remaining Qty</th><th>Retail Price</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredCatalogItems.map(item => {
                const stock = getCatalogItemStock(item.id);
                const batch = batches.find(b => b.id === item.batchId);
                return (
                  <tr key={item.id}>
                    <td><div className={styles.itemCell}><span className={styles.itemEmoji}>{item.emoji}</span><div><div className={styles.itemName}>{item.name}</div><div className={styles.itemBrand}>{item.brand}</div>{item.detail && <div className="text-[10px] text-stone-400 line-clamp-1">{item.detail}</div>}</div></div></td>
                    <td><span className={styles.catBadge}>{item.cat}</span></td>
                    <td>{batch ? <div className="font-mono text-xs"><div className="text-stone-800 font-semibold">{batch.batchNumber}</div><div className="text-[10px] text-stone-500">Cost: ${batch.costPerItem}/ea</div></div> : <span className="text-stone-400 italic text-xs">Unlinked</span>}</td>
                    <td><span className={`px-2.5 py-1 text-xs font-bold rounded-full ${stock > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-stone-100 text-stone-400'}`}>{stock} available</span></td>
                    <td className={styles.numCell}>${(Number(item.price) || 0).toLocaleString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.iconBtn} title="Edit Spec Listing" onClick={() => setEditTarget(item)}><Pencil size={13} strokeWidth={1.8} /></button>
                        <button className={`${styles.iconBtn} ${styles.sellBtn} bg-stone-900 text-white`} title="Record Sale" aria-label={`Record sale for ${item.brand} ${item.name}`} disabled={stock <= 0} style={{ opacity: stock <= 0 ? 0.4 : 1 }} onClick={() => openManualSale(item.batchId || item.id, `${item.brand} ${item.name}`)}><ShoppingBag size={13} strokeWidth={1.8} /></button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Unlist Catalog Item" onClick={() => { if (confirm(`Are you sure you want to unlist this item "${item.name}" from the storefront? The acquisition batch records and remaining stock will NOT be deleted.`)) deleteCatalogItem(item.id); }}><Trash2 size={13} strokeWidth={1.8} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCatalogItems.length === 0 && (
                <tr><td colSpan={6}><div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-stone-50/50 border border-dashed border-stone-200 rounded-lg m-4" id="empty_catalog_state"><span className="text-3xl mb-3">✨</span><h3 className="font-display text-lg font-medium text-stone-800 mb-1">No Catalog Items Listed</h3><p className="text-stone-500 text-xs max-w-sm mb-5 font-sans">You have not created any retail listing pages for the storefront yet. Direct your buyers to listed items or create one now.</p><button onClick={() => onSwitchTab && onSwitchTab('add')} className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer" id="empty_catalog_add_btn"><PlusCircle size={13} />Publish Your First Listing</button></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Batch #</th><th>Product Model</th><th>Condition</th><th>Bought Date</th><th>Quantity</th><th>In Stock</th><th>Cost Per Item</th><th>Total Cost</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredBatches.map(batch => {
                const prod = products.find(p => p.id === batch.productId) || { name: 'Unknown', brand: 'Unknown' };
                return (
                  <tr key={batch.id}>
                    <td className="font-semibold text-xs font-mono">{batch.batchNumber}</td>
                    <td><div className="text-xs"><div className="font-semibold text-stone-800">{prod.brand} {prod.name}</div>{batch.enteredInPhp && <div className="text-[10px] text-amber-700 font-semibold font-mono">PHP-Converted ({batch.exchangeRateUsed}x)</div>}</div></td>
                    <td><span className={styles.condBadge} style={{ background: COND_BG[batch.condition], color: COND_COLORS[batch.condition] }}>{batch.condition}</span></td>
                    <td className={styles.dateCell}>{batch.date}</td>
                    <td className="text-center font-mono text-xs">{batch.quantity}</td>
                    <td className="text-center font-mono text-xs font-semibold text-amber-700">{batch.remainingQty} left</td>
                    <td className={styles.numCell}>${batch.costPerItem.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={styles.numCell}>${batch.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td><div className="flex gap-1.5 justify-center"><button className={`${styles.iconBtn} bg-stone-900 text-white border-stone-900 hover:bg-stone-800`} title="Record Sale" aria-label={`Record sale for ${prod.brand} ${prod.name}`} disabled={batch.remainingQty <= 0} style={{ opacity: batch.remainingQty <= 0 ? 0.4 : 1 }} onClick={() => openManualSale(batch.id, `${prod.brand} ${prod.name}`)}><ShoppingBag size={13} strokeWidth={1.8} /></button><button className={`${styles.iconBtn} ${styles.deleteBtn} border-stone-200 hover:border-red-500`} title="Delete Batch" onClick={() => deleteBatch(batch.id)}><Trash2 size={13} strokeWidth={1.5} /></button></div></td>
                  </tr>
                );
              })}
              {filteredBatches.length === 0 && (
                <tr><td colSpan={9}><div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-stone-50/50 border border-dashed border-stone-200 rounded-lg m-4" id="empty_batches_state"><span className="text-3xl mb-3">📦</span><h3 className="font-display text-lg font-medium text-stone-800 mb-1">No Acquisition Batches Registered</h3><p className="text-stone-500 text-xs max-w-sm mb-5 font-sans">To manage your gold jewelry or pre-loved designer bags inventory, register a wholesale acquisition batch first.</p><button onClick={() => onSwitchTab && onSwitchTab('add')} className="px-4 py-2 bg-[#C9A84C] hover:bg-[#b7963d] text-stone-950 text-xs font-semibold rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer" id="empty_batches_add_btn"><PlusCircle size={13} />Register New Wholesale Batch</button></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {manualSaleTarget && (
        <Suspense fallback={<AdminModalFallback />}>
          <GlobalManualSaleModal isOpen={Boolean(manualSaleTarget)} onClose={() => setManualSaleTarget(null)} initialItemId={manualSaleTarget.id} initialItemName={manualSaleTarget.name} />
        </Suspense>
      )}

      {editTarget && <CatalogItemEditModal item={editTarget} onSave={(form) => { updateCatalogItem(editTarget.id, form); setEditTarget(null); }} onClose={() => setEditTarget(null)} />}
    </div>
  );
}
