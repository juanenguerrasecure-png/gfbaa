import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PhotoUploader } from '../../components/PhotoUploader';

const DEFAULT_PAYMENT_METHODS = {
  zelle: { handle: '', instructions: '', qrUrl: '' },
  venmo: { handle: '', instructions: '', qrUrl: '' },
  paypal: { handle: '', instructions: '', qrUrl: '' }
};

export function PaymentMethodsTab() {
  const { paymentMethods = DEFAULT_PAYMENT_METHODS, savePaymentMethods } = useStore();
  const [form, setForm] = useState(DEFAULT_PAYMENT_METHODS);
  const [status, setStatus] = useState('');
  const [syncWarning, setSyncWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      zelle: { ...DEFAULT_PAYMENT_METHODS.zelle, ...(paymentMethods?.zelle || {}) },
      venmo: { ...DEFAULT_PAYMENT_METHODS.venmo, ...(paymentMethods?.venmo || {}) },
      paypal: { ...DEFAULT_PAYMENT_METHODS.paypal, ...(paymentMethods?.paypal || {}) }
    });
  }, [paymentMethods]);

  const setField = (platform, key, value) => {
    setForm(prev => ({ ...prev, [platform]: { ...prev[platform], [key]: value } }));
    setStatus('');
  };

  const buildPayload = () => ({
    zelle: { handle: form.zelle.handle.trim(), instructions: form.zelle.instructions.trim(), qrUrl: form.zelle.qrUrl.trim() },
    venmo: { handle: form.venmo.handle.trim(), instructions: form.venmo.instructions.trim(), qrUrl: form.venmo.qrUrl.trim() },
    paypal: { handle: form.paypal.handle.trim(), instructions: form.paypal.instructions.trim(), qrUrl: form.paypal.qrUrl.trim() }
  });
  const saveCurrent = async () => savePaymentMethods(buildPayload());

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus('');
    const result = await saveCurrent();
    if (!result?.ok) { setSyncWarning(true); setStatus('Save failed. Changes may not sync across devices.'); }
    else { setSyncWarning(false); setStatus('Payment setup saved successfully.'); }
    setIsSaving(false);
  };

  const handleRetry = async () => {
    setIsSaving(true);
    const result = await saveCurrent();
    setSyncWarning(!result?.ok);
    setStatus(result?.ok ? 'Saved successfully.' : 'Save failed. Changes may not sync across devices.');
    setIsSaving(false);
  };

  const PaymentSection = ({ platform, title, accentClass }) => (
    <section className="bg-white border border-[#E5DFD8] rounded p-5 space-y-4">
      <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded text-white text-sm font-bold ${accentClass}`}>
          {title[0]}
        </span>
        <div>
          <h3 className="font-display text-xl text-stone-900 font-normal">{title}</h3>
          <p className="text-xs text-stone-500">Handle, instructions, and QR code or payment image upload.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Handle / Username</label>
            <input
              value={form[platform].handle}
              onChange={event => setField(platform, 'handle', event.target.value)}
              placeholder="+1 555 000 0000 or @handle"
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Instructions</label>
            <textarea
              value={form[platform].instructions}
              onChange={event => setField(platform, 'instructions', event.target.value)}
              rows={4}
              placeholder="Send payment with your order ID in the memo. Wait for admin confirmation before sending."
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]"
            />
          </div>
        </div>
        <div className="flex flex-col justify-end bg-stone-50/50 p-4 rounded-lg border border-stone-100">
          <PhotoUploader
            value={form[platform].qrUrl || null}
            onChange={url => setField(platform, 'qrUrl', url || '')}
            label="QR Code Image / Scan Logo"
          />
        </div>
      </div>
    </section>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-display text-2xl text-stone-900 font-normal">Payment Setup</h2>
        <p className="text-sm text-stone-500">Configure Zelle, Venmo, and PayPal details shown to shoppers from the cart payment buttons.</p>
      </div>

      {/* Transaction & Settlement Steps Guide */}
      <div className="bg-stone-50 border border-[#E5DFD8] rounded p-5 max-w-4xl space-y-4">
        <h3 className="text-stone-900 font-medium text-xs uppercase tracking-wider font-sans">Direct Payment Settlement Steps</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          
          <div className="space-y-1.5 p-3 bg-white border border-stone-200/60 rounded flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">1</span>
                <span className="font-semibold text-[10px] text-stone-800 uppercase tracking-wider">Request</span>
              </div>
              <p className="text-2xs text-stone-500 leading-relaxed">
                Shopper selects curated items, chooses their preferred payment method (Zelle, Venmo, or PayPal) inside the shopping bag, and submits.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 p-3 bg-white border border-stone-200/60 rounded flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">2</span>
                <span className="font-semibold text-[10px] text-stone-800 uppercase tracking-wider">Quotation</span>
              </div>
              <p className="text-2xs text-stone-500 leading-relaxed">
                Admin calculates shipping costs & special handling fees on the "Requests" tab, then approves the customized quote.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 p-3 bg-white border border-stone-200/60 rounded flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">3</span>
                <span className="font-semibold text-[10px] text-stone-800 uppercase tracking-wider">Invoicing</span>
              </div>
              <p className="text-2xs text-stone-500 leading-relaxed">
                Admin prints the PDF Invoice or sends the email. The invoice automatically displays the chosen payment's details and custom QR code.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 p-3 bg-white border border-stone-200/60 rounded flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">4</span>
                <span className="font-semibold text-[10px] text-stone-800 uppercase tracking-wider">Settlement</span>
              </div>
              <p className="text-2xs text-stone-500 leading-relaxed">
                Shopper receives the invoice, scans the QR code or copies the handle, transfers funds, and uploads proof of payment.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 p-3 bg-white border border-stone-200/60 rounded flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">5</span>
                <span className="font-semibold text-[10px] text-stone-800 uppercase tracking-wider">Verification</span>
              </div>
              <p className="text-2xs text-stone-500 leading-relaxed">
                Admin verifies the uploaded receipt screenshot, approves the payment state, enters tracking, and dispatches the shipment.
              </p>
            </div>
          </div>

        </div>
      </div>

      {syncWarning && (
        <div className="flex items-center gap-3 bg-[#FFF8E7] border-l-[3px] border-[#C9A84C] px-4 py-3 text-[13px] text-stone-700">
          <span>⚠️ Saved locally but cloud sync failed. Changes may not appear on other devices.</span>
          <button type="button" onClick={handleRetry} className="ml-auto text-xs font-semibold uppercase tracking-wider text-stone-900 underline">Retry</button>
        </div>
      )}
      {status && <div className="text-sm px-4 py-3 rounded border border-[#E5DFD8] bg-white text-stone-700">{status}</div>}
      <form onSubmit={handleSave} className="space-y-5 max-w-4xl">
        <PaymentSection platform="zelle" title="Zelle" accentClass="bg-[#6D1ED4]" />
        <PaymentSection platform="venmo" title="Venmo" accentClass="bg-[#3D95CE]" />
        <PaymentSection platform="paypal" title="PayPal" accentClass="bg-[#003087]" />
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50"
        >
          <Save size={14} />
          {isSaving ? 'Saving...' : 'Save Payment Setup'}
        </button>
      </form>
    </div>
  );
}
