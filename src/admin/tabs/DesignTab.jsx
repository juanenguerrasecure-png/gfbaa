import { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Database, Link, GitMerge, Settings, HelpCircle, Save } from 'lucide-react';

const DEFAULT_HERO_ALT = 'Good Finds by AA Featured Collection';

export function DesignTab() {
  const { exchangeRate, setExchangeRate, heroImage, saveHeroImage } = useStore();
  const [activeTab, setActiveTab] = useState('schema');
  const [heroForm, setHeroForm] = useState({ url: '', alt: DEFAULT_HERO_ALT });
  const [previewOk, setPreviewOk] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSavingHero, setIsSavingHero] = useState(false);

  useEffect(() => {
    setHeroForm({
      url: heroImage?.url || '',
      alt: heroImage?.alt || DEFAULT_HERO_ALT,
    });
    setPreviewOk(Boolean(heroImage?.url));
  }, [heroImage]);

  const handleHeroField = (field, value) => {
    setHeroForm(prev => ({ ...prev, [field]: value }));
    setSaveStatus('');
    if (field === 'url') setPreviewOk(Boolean(value.trim()));
  };

  const handleSaveHeroImage = async () => {
    setIsSavingHero(true);
    setSaveStatus('');
    try {
      await saveHeroImage({
        url: heroForm.url.trim(),
        alt: heroForm.alt.trim() || DEFAULT_HERO_ALT,
      });
      setSaveStatus('Hero featured image saved.');
    } catch (error) {
      setSaveStatus(error?.message || 'Unable to save hero featured image.');
    } finally {
      setIsSavingHero(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-display text-2xl text-stone-900">System Architecture & Design</h2>
          <p className="text-sm text-stone-500">Interactive system blueprints, schemas, and live configuration for Good Finds by AA.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-stone-100 px-4 py-2 rounded-lg border border-stone-200">
          <Settings size={16} className="text-stone-600" />
          <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Exchange Rate (USD/PHP):</span>
          <input
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Math.max(1, Number(e.target.value)))}
            className="w-16 text-right px-2 py-1 bg-white border border-stone-300 rounded font-mono text-sm text-stone-800"
          />
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border border-[#E5DFD8] shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-stone-900">Hero Featured Image</h3>
            <p className="text-sm text-stone-500">This image appears on the right side of the homepage hero section.</p>
          </div>
          <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-[#C9A84C] border border-[#E5DFD8] px-3 py-1 rounded-full">Homepage</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_220px] gap-5 items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Image URL</label>
              <input
                type="url"
                value={heroForm.url}
                onChange={(event) => handleHeroField('url', event.target.value)}
                placeholder="https://example.com/your-hero-image.png"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]"
              />
              <p className="text-[11px] text-stone-400">
                Tip: Upload your image to Imgur (imgur.com) or Google Drive (set sharing to 'Anyone with link') and paste the direct image URL here.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Image description (for accessibility)</label>
              <input
                type="text"
                value={heroForm.alt}
                onChange={(event) => handleHeroField('alt', event.target.value)}
                placeholder={DEFAULT_HERO_ALT}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={handleSaveHeroImage}
                disabled={isSavingHero}
                className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50"
              >
                <Save size={14} />
                {isSavingHero ? 'Saving...' : 'Save Hero Image'}
              </button>
              {saveStatus && <span className="text-sm text-stone-500">{saveStatus}</span>}
            </div>
          </div>

          <div className="border border-[#E5DFD8] rounded bg-stone-50 min-h-[160px] flex items-center justify-center overflow-hidden">
            {heroForm.url && previewOk ? (
              <img
                src={heroForm.url}
                alt={heroForm.alt || DEFAULT_HERO_ALT}
                className="w-full h-full max-h-[220px] object-contain"
                onLoad={() => setPreviewOk(true)}
                onError={() => setPreviewOk(false)}
              />
            ) : (
              <div className="text-center px-4 py-8">
                <div className="font-display text-4xl text-[#C9A84C]">GF</div>
                <div className="text-[10px] uppercase tracking-wider text-stone-400 mt-2">Preview unavailable</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-stone-200 overflow-x-auto">
        {[
          { id: 'schema', label: 'Database Schema', icon: Database },
          { id: 'endpoints', label: 'Suggested API Endpoints', icon: Link },
          { id: 'logic', label: 'FIFO & Cost Matching Logic', icon: GitMerge },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
              activeTab === t.id
                ? 'border-amber-600 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
            <h3 className="font-display text-lg text-stone-900 mb-2 flex items-center gap-2">
              <span className="p-1 bg-stone-100 rounded text-amber-700">1</span>
              App State Blob
            </h3>
            <p className="text-xs text-stone-500 mb-4">The storefront and admin settings are synchronized through the single D1 app_state JSON record.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-stone-100">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600">
                    <th className="p-2">Field</th>
                    <th className="p-2">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  <tr><td className="p-2 font-semibold">products</td><td className="p-2">Product catalog and item metadata</td></tr>
                  <tr><td className="p-2 font-semibold">batches</td><td className="p-2">Purchase batches, stock, and cost data</td></tr>
                  <tr><td className="p-2 font-semibold">catalogItems</td><td className="p-2">Storefront listings and remaining quantities</td></tr>
                  <tr><td className="p-2 font-semibold">sales</td><td className="p-2">Completed sales and COGS records</td></tr>
                  <tr><td className="p-2 font-semibold">purchaseRequests</td><td className="p-2">Customer cart checkout requests</td></tr>
                  <tr><td className="p-2 font-semibold">socialLinks</td><td className="p-2">Storefront social media links</td></tr>
                  <tr><td className="p-2 font-semibold">paymentMethods</td><td className="p-2">Zelle and Venmo display information</td></tr>
                  <tr><td className="p-2 font-semibold">heroImage</td><td className="p-2">Configurable homepage hero image URL and alt text</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 shadow-sm space-y-3">
            <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
              <HelpCircle size={15} className="text-amber-700" />
              How image configuration works
            </h4>
            <p className="text-xs text-stone-700 leading-relaxed">
              The admin saves only the image URL and accessibility description into D1. The image file itself remains hosted externally, so no new upload route or storage change is required.
            </p>
            <div className="bg-white p-3 rounded font-mono text-xs text-amber-950 border border-amber-100">
              heroImage = &#123; url: "https://...", alt: "Good Finds by AA Featured Collection" &#125;
            </div>
          </div>
        </div>
      )}

      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
            <h3 className="font-display text-lg text-stone-900 mb-2">REST API Design</h3>
            <p className="text-xs text-stone-500 mb-6">Current Worker routes used by the storefront and admin sync layer.</p>
            <div className="space-y-4">
              {[
                { method: 'GET', url: '/api/state', desc: 'Reads the public app state from D1.' },
                { method: 'PUT', url: '/api/state', desc: 'Writes the full app state blob to D1 with Authorization header.' },
                { method: 'POST', url: '/api/photos', desc: 'Uploads product photos to R2 with Authorization header.' },
                { method: 'GET', url: '/api/photos/:key', desc: 'Serves R2 photos back to the storefront.' },
              ].map((api) => (
                <div key={`${api.method}-${api.url}`} className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50 px-4 py-3 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${api.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{api.method}</span>
                      <code className="text-sm font-semibold text-stone-800">{api.url}</code>
                    </div>
                    <span className="text-xs text-stone-500 mt-1 sm:mt-0">{api.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logic' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-display text-lg text-stone-900 mb-2">Inventory Logic Blueprint</h3>
              <p className="text-xs text-stone-500">How the system processes transactions with high precision and flexibility.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 border border-stone-200 rounded-lg bg-stone-50">
                <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs text-amber-800 font-bold">A</span>
                  FIFO Algorithm (First-In, First-Out)
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  When a sale is recorded as FIFO, the system draws from the oldest active batches first until the requested sales quantity is satisfied.
                </p>
              </div>

              <div className="space-y-3 p-4 border border-stone-200 rounded-lg bg-stone-50">
                <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs text-amber-800 font-bold">B</span>
                  Manual Batch Selection Option
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Admin users may bypass FIFO and manually select the exact batch to deduct during a manual sale entry.
                </p>
              </div>
            </div>

            <div className="border border-amber-100 rounded-lg bg-amber-50 p-4 flex gap-4">
              <GitMerge className="text-amber-700 shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-stone-800 text-xs uppercase tracking-wider mb-1">Precision Inventory Valuation Rule</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Inventory valuation is calculated by summing each batch's remaining quantity multiplied by its cost-per-item.
                </p>
                <div className="mt-2 font-mono text-xs text-amber-900 font-bold">
                  Valuation = SUM( Batch.remainingQty * Batch.costPerItem )
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
