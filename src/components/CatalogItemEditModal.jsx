import { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Save } from 'lucide-react';
import { MultiPhotoEditor } from './MultiPhotoEditor';

export function CatalogItemEditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({ ...item });
  }, [item]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.brand) {
      setError('Please provide at least a Name and Brand.');
      return;
    }
    setError('');
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs" onClick={onClose}>
      <div 
        className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl shadow-2xl w-full max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200 bg-[#FAF8F5]">
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Sparkles size={16} className="text-[#C9A84C]" />
              Edit Storefront Catalog Listing
            </h3>
            <p className="text-[11px] text-stone-500 font-sans mt-0.5">
              Update details for {item.brand || 'Luxury Item'} {item.name || ''}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">Brand</label>
              <input 
                type="text" 
                value={form.brand || ''} 
                onChange={e => set('brand', e.target.value)} 
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none"
                placeholder="e.g. Chanel"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">Name</label>
              <input 
                type="text" 
                value={form.name || ''} 
                onChange={e => set('name', e.target.value)} 
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none"
                placeholder="e.g. Classic Double Flap"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">Public Details / Specifications</label>
            <textarea 
              rows={3}
              value={form.detail || ''} 
              onChange={e => set('detail', e.target.value)} 
              className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none font-sans"
              placeholder="e.g. Serial #24XXXXXX. Features gold-tone hardware and lambskin leather."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">Category</label>
              <select 
                value={form.cat || 'bags'} 
                onChange={e => set('cat', e.target.value)}
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none"
              >
                <option value="bags">Bags</option>
                <option value="jewelry">Jewelry</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">Emoji Icon</label>
              <input 
                type="text" 
                value={form.emoji || '👜'} 
                onChange={e => set('emoji', e.target.value)} 
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none text-center"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">Condition</label>
              <select 
                value={form.condition || 'mint'} 
                onChange={e => set('condition', e.target.value)}
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none"
              >
                <option value="new">New</option>
                <option value="mint">Mint</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">Retail Price (USD $)</label>
              <input 
                type="number" 
                value={form.price || ''} 
                onChange={e => set('price', Number(e.target.value))} 
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none font-mono"
                placeholder="e.g. 2400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">MSRP Original Price (USD $)</label>
              <input 
                type="number" 
                value={form.orig || ''} 
                onChange={e => set('orig', e.target.value ? Number(e.target.value) : null)} 
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none font-mono"
                placeholder="Leave empty if none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-stone-50 p-3 rounded-lg border border-stone-200/50">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block">Total Qty</label>
              <input 
                type="number" 
                value={form.quantity !== undefined ? form.quantity : 1} 
                onChange={e => set('quantity', Number(e.target.value))} 
                className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none font-mono text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block">Remaining Stock</label>
              <input 
                type="number" 
                value={form.remainingQty !== undefined ? form.remainingQty : 1} 
                onChange={e => set('remainingQty', Number(e.target.value))} 
                className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:border-[#C9A84C] outline-none font-mono text-center font-bold text-[#C9A84C]"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-stone-200">
            <MultiPhotoEditor
              photos={form.photos || (form.photoUrl ? [{ url: form.photoUrl, description: '' }] : [])}
              onChange={updatedPhotos => {
                set('photos', updatedPhotos);
                if (updatedPhotos.length > 0) {
                  set('photoUrl', updatedPhotos[0].url);
                } else {
                  set('photoUrl', null);
                }
              }}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 border border-stone-300 hover:bg-stone-100 rounded text-xs font-semibold uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            className="px-4 py-2 bg-stone-950 text-white hover:bg-stone-900 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <Save size={13} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
