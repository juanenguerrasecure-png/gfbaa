import { useEffect, useState } from 'react';
import { Save, ShoppingBag, PhoneCall, Share2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const DEFAULT_SOCIAL_LINKS = {
  facebook: '',
  instagram: '',
  whatnot: '',
  whatsapp: '',
  viber: '',
};

function normalizeWhatsApp(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  const digits = trimmed.replace(/[^0-9]/g, '');
  return digits ? `https://wa.me/${digits}` : trimmed;
}

function normalizeViber(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('viber://') || trimmed.startsWith('http')) return trimmed;
  const number = trimmed.replace(/[\s()-]/g, '');
  return number ? `viber://chat?number=${number}` : trimmed;
}

export function SocialLinksTab() {
  const { socialLinks = {}, saveSocialLinks } = useStore();
  const [form, setForm] = useState(DEFAULT_SOCIAL_LINKS);
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({ ...DEFAULT_SOCIAL_LINKS, ...(socialLinks || {}) });
  }, [socialLinks]);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setStatus('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus('');

    const nextSocialLinks = {
      facebook: form.facebook.trim(),
      instagram: form.instagram.trim(),
      whatnot: form.whatnot.trim(),
      whatsapp: normalizeWhatsApp(form.whatsapp),
      viber: normalizeViber(form.viber),
    };

    try {
      await saveSocialLinks(nextSocialLinks);
      setStatus('Social links saved successfully.');
    } catch (error) {
      setStatus(error.message || 'Failed to save social links.');
    } finally {
      setIsSaving(false);
    }
  };

  const InputRow = ({ icon: Icon, label, value, onChange, placeholder, helper }) => (
    <div className="bg-white border border-[#E5DFD8] rounded p-4 space-y-2">
      <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-stone-500">
        <Icon size={14} className="text-[#C9A84C]" />
        {label}
      </label>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" />
      {helper && <p className="text-[11px] text-stone-400">{helper}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-display text-2xl text-stone-900 font-normal">Social Links</h2>
        <p className="text-sm text-stone-500">Configure the storefront social media icon links. Empty fields are hidden from the storefront.</p>
      </div>

      {status && <div className="text-sm px-4 py-3 rounded border border-[#E5DFD8] bg-white text-stone-700">{status}</div>}

      <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
        <InputRow icon={Share2} label="Facebook URL" value={form.facebook} onChange={value => setField('facebook', value)} placeholder="https://facebook.com/yourpage" />
        <InputRow icon={Share2} label="Instagram URL" value={form.instagram} onChange={value => setField('instagram', value)} placeholder="https://instagram.com/yourprofile" />
        <InputRow icon={ShoppingBag} label="Whatnot URL" value={form.whatnot} onChange={value => setField('whatnot', value)} placeholder="https://whatnot.com/user/yourshop" />
        <InputRow icon={PhoneCall} label="WhatsApp Number or URL" value={form.whatsapp} onChange={value => setField('whatsapp', value)} placeholder="15551234567 or https://wa.me/15551234567" helper="Numbers are saved as https://wa.me/<number>." />
        <InputRow icon={PhoneCall} label="Viber Number or URL" value={form.viber} onChange={value => setField('viber', value)} placeholder="+15551234567 or viber://chat?number=+15551234567" helper="Numbers are saved as viber://chat?number=<number>." />

        <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50">
          <Save size={14} />
          {isSaving ? 'Saving...' : 'Save Social Links'}
        </button>
      </form>
    </div>
  );
}
