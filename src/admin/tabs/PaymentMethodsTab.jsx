import { useEffect, useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const DEFAULT_PAYMENT_METHODS = {
  zelle: { handle: '', instructions: '', qrUrl: '' },
  venmo: { handle: '', instructions: '', qrUrl: '' },
};

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('gf_session_token') || '';
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export function PaymentMethodsTab() {
  const { paymentMethods = DEFAULT_PAYMENT_METHODS, savePaymentMethods } = useStore();
  const [form, setForm] = useState(DEFAULT_PAYMENT_METHODS);
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      zelle: { ...DEFAULT_PAYMENT_METHODS.zelle, ...(paymentMethods?.zelle || {}) },
      venmo: { ...DEFAULT_PAYMENT_METHODS.venmo, ...(paymentMethods?.venmo || {}) },
    });
  }, [paymentMethods]);

  const setField = (platform, key, value) => {
    setForm(prev => ({ ...prev, [platform]: { ...prev[platform], [key]: value } }));
    setStatus('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus('');

    const nextPaymentMethods = {
      zelle: {
        handle: form.zelle.handle.trim(),
        instructions: form.zelle.instructions.trim(),
        qrUrl: form.zelle.qrUrl.trim(),
      },
      venmo: {
        handle: form.venmo.handle.trim(),
        instructions: form.venmo.instructions.trim(),
        qrUrl: form.venmo.qrUrl.trim(),
      },
    };

    try {
      if (savePaymentMethods) {
        await savePaymentMethods(nextPaymentMethods);
      } else {
        const response = await fetch('/api/state', { method: 'GET' });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to load state.');
        const saveResponse = await fetch('/api/state', {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ state: { ...(result.state || {}), paymentMethods: nextPaymentMethods } }),
        });
        const saveResult = await saveResponse.json();
        if (!saveResponse.ok || !saveResult.ok) throw new Error(saveResult.error || 'Unable to save payment setup.');
      }
      setStatus('Payment setup saved successfully.');
    } catch (error) {
      setStatus(error.message || 'Failed to save payment setup.');
    } finally {
      setIsSaving(false);
    }
  };

  const PaymentSection = ({ platform, title, accentClass }) => (
    <section className="bg-white border border-[#E5DFD8] rounded p-5 space-y-4">
      <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded text-white text-sm font-bold ${accentClass}`}>{title[0]}</span>
        <div>
          <h3 className="font-display text-xl text-stone-900 font-normal">{title}</h3>
          <p className="text-xs text-stone-500">Handle, instructions, and optional QR code image URL.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Handle / Username</label>
          <input value={form[platform].handle} onChange={event => setField(platform, 'handle', event.target.value)} placeholder="+1 555 000 0000 or @handle" className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">QR Code Image URL</label>
          <input value={form[platform].qrUrl} onChange={event => setField(platform, 'qrUrl', event.target.value)} placeholder="https://.../qr-code.png" className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Instructions</label>
          <textarea value={form[platform].instructions} onChange={event => setField(platform, 'instructions', event.target.value)} rows={4} placeholder="Send payment with your order ID in the memo. Wait for admin confirmation before sending." className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" />
        </div>
      </div>
    </section>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-display text-2xl text-stone-900 font-normal">Payment Setup</h2>
        <p className="text-sm text-stone-500">Configure Zelle and Venmo details shown to shoppers from the cart payment buttons.</p>
      </div>

      {status && <div className="text-sm px-4 py-3 rounded border border-[#E5DFD8] bg-white text-stone-700">{status}</div>}

      <form onSubmit={handleSave} className="space-y-5 max-w-4xl">
        <PaymentSection platform="zelle" title="Zelle" accentClass="bg-[#6D1ED4]" />
        <PaymentSection platform="venmo" title="Venmo" accentClass="bg-[#3D95CE]" />

        <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50">
          <Save size={14} />
          {isSaving ? 'Saving...' : 'Save Payment Setup'}
        </button>
      </form>
    </div>
  );
}
