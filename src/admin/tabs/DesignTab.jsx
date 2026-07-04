import { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Database, Link, GitMerge, Settings, HelpCircle, Save, Palette, Sparkles } from 'lucide-react';

const DEFAULT_HERO_ALT = 'Good Finds by AA Featured Collection';

export function DesignTab() {
  const { exchangeRate, setExchangeRate, heroImage, saveHeroImage, season, saveSeason, siteContent, updateSiteContent } = useStore();
  const [activeTab, setActiveTab] = useState('schema');
  const [heroForm, setHeroForm] = useState({ url: '', alt: DEFAULT_HERO_ALT });
  const [previewOk, setPreviewOk] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [seasonSaveStatus, setSeasonSaveStatus] = useState('');
  const [syncWarning, setSyncWarning] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Site Content Editorial states
  const [siteContentForm, setSiteContentForm] = useState({
    homeIntro: '',
    shopIntro: '',
    galleryIntro: '',
    archiveIntro: ''
  });
  const [contentSaveStatus, setContentSaveStatus] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);

  useEffect(() => {
    if (siteContent) {
      setSiteContentForm({
        homeIntro: siteContent.homeIntro || '',
        shopIntro: siteContent.shopIntro || '',
        galleryIntro: siteContent.galleryIntro || '',
        archiveIntro: siteContent.archiveIntro || ''
      });
    }
  }, [siteContent]);

  const handleContentField = (field, value) => {
    setSiteContentForm(prev => ({ ...prev, [field]: value }));
    setContentSaveStatus('');
  };

  const handleSaveSiteContent = async () => {
    setIsSavingContent(true);
    setContentSaveStatus('');
    const result = await updateSiteContent(siteContentForm);
    if (!result?.ok) {
      setContentSaveStatus('Save failed. Sync issue.');
    } else {
      setContentSaveStatus('Editorial copy saved.');
    }
    setIsSavingContent(false);
  };

  useEffect(() => {
    setHeroForm({ url: heroImage?.url || '', alt: heroImage?.alt || DEFAULT_HERO_ALT });
    setPreviewOk(Boolean(heroImage?.url));
  }, [heroImage]);

  const handleHeroField = (field, value) => {
    setHeroForm(prev => ({ ...prev, [field]: value }));
    setSaveStatus('');
    if (field === 'url') setPreviewOk(Boolean(value.trim()));
  };

  const saveCurrentHeroImage = async () => saveHeroImage({ url: heroForm.url.trim(), alt: heroForm.alt.trim() || DEFAULT_HERO_ALT });

  const handleSaveHeroImage = async () => {
    setIsSavingHero(true);
    setSaveStatus('');
    const result = await saveCurrentHeroImage();
    if (!result?.ok) {
      setSyncWarning(true);
      setSaveStatus('Save failed. Changes may not sync across devices.');
    } else {
      setSyncWarning(false);
      setSaveStatus('Hero featured image saved.');
    }
    setIsSavingHero(false);
  };

  const handleRetry = async () => {
    setIsSavingHero(true);
    const result = await saveCurrentHeroImage();
    setSyncWarning(!result?.ok);
    setSaveStatus(result?.ok ? 'Saved successfully.' : 'Save failed. Changes may not sync across devices.');
    setIsSavingHero(false);
  };

  const SyncWarningBanner = () => syncWarning ? (
    <div className="flex items-center gap-3 bg-[#FFF8E7] border-l-[3px] border-[#C9A84C] px-4 py-3 text-[13px] text-stone-700">
      <span>⚠️ Saved locally but cloud sync failed. Changes may not appear on other devices.</span>
      <button type="button" onClick={handleRetry} className="ml-auto text-xs font-semibold uppercase tracking-wider text-stone-900 underline">Retry</button>
    </div>
  ) : null;

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
          <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(Math.max(1, Number(e.target.value)))} className="w-16 text-right px-2 py-1 bg-white border border-stone-300 rounded font-mono text-sm text-stone-800" />
        </div>
      </div>

      <SyncWarningBanner />

      <div className="bg-white p-5 rounded-lg border border-[#E5DFD8] shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="font-display text-xl text-stone-900">Hero Featured Image</h3><p className="text-sm text-stone-500">This image appears on the right side of the homepage hero section.</p></div>
          <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-[#C9A84C] border border-[#E5DFD8] px-3 py-1 rounded-full">Homepage</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_220px] gap-5 items-start">
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Image URL</label><input type="url" value={heroForm.url} onChange={(event) => handleHeroField('url', event.target.value)} placeholder="https://example.com/your-hero-image.png" className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" /><p className="text-[11px] text-stone-400">Tip: Upload your image to Imgur (imgur.com) or Google Drive (set sharing to 'Anyone with link') and paste the direct image URL here.</p></div>
            <div className="space-y-2"><label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Image description (for accessibility)</label><input type="text" value={heroForm.alt} onChange={(event) => handleHeroField('alt', event.target.value)} placeholder={DEFAULT_HERO_ALT} className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" /></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3"><button type="button" onClick={handleSaveHeroImage} disabled={isSavingHero} className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50"><Save size={14} />{isSavingHero ? 'Saving...' : 'Save Hero Image'}</button>{saveStatus && <span className="text-sm text-stone-500">{saveStatus}</span>}</div>
          </div>
          <div className="border border-[#E5DFD8] rounded bg-stone-50 min-h-[160px] flex items-center justify-center overflow-hidden">{heroForm.url && previewOk ? <img src={heroForm.url} alt={heroForm.alt || DEFAULT_HERO_ALT} className="w-full h-full max-h-[220px] object-contain" onLoad={() => setPreviewOk(true)} onError={() => setPreviewOk(false)} /> : <div className="text-center px-4 py-8"><div className="font-display text-4xl text-[#C9A84C]">GF</div><div className="text-[10px] uppercase tracking-wider text-stone-400 mt-2">Preview unavailable</div></div>}</div>
        </div>
      </div>

      {/* Editorial Section Copywriting Card */}
      <div className="bg-white p-5 rounded-lg border border-[#E5DFD8] shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-display text-xl text-stone-900 flex items-center gap-2">
              <Palette size={18} className="text-[#C9A84C]" />
              <span>Section Editorial Copywriting</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Customize the introductory subtitles and descriptions across key areas of your digital archive.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-[#C9A84C] border border-[#E5DFD8] px-3 py-1 rounded-full">Editorial</span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Home Intro */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider">
                Home Hero Subtitle
              </label>
              <input 
                type="text" 
                value={siteContentForm.homeIntro} 
                onChange={(e) => handleContentField('homeIntro', e.target.value)} 
                placeholder="Sourced with refinement, preserved for posterity" 
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" 
              />
            </div>

            {/* Shop Intro */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider">
                Current Selections Intro
              </label>
              <input 
                type="text" 
                value={siteContentForm.shopIntro} 
                onChange={(e) => handleContentField('shopIntro', e.target.value)} 
                placeholder="Vetted designer handbags, fine pieces, and pristine seasonal acquisitions." 
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" 
              />
            </div>

            {/* Gallery Intro */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider">
                Gallery Intro Description
              </label>
              <input 
                type="text" 
                value={siteContentForm.galleryIntro} 
                onChange={(e) => handleContentField('galleryIntro', e.target.value)} 
                placeholder="Visual diaries, styling stories, and close-up lifestyle curations." 
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" 
              />
            </div>

            {/* Archive Intro */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider">
                Past Collections (Archive) Description
              </label>
              <input 
                type="text" 
                value={siteContentForm.archiveIntro} 
                onChange={(e) => handleContentField('archiveIntro', e.target.value)} 
                placeholder="An archival directory of previously loved curations now residing with new owners." 
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#C9A84C]" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              onClick={handleSaveSiteContent} 
              disabled={isSavingContent} 
              className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              {isSavingContent ? 'Saving Copy...' : 'Save Editorial Copy'}
            </button>
            {contentSaveStatus && (
              <span className="text-xs text-emerald-600 font-semibold">{contentSaveStatus}</span>
            )}
          </div>
        </div>
      </div>

      {/* Seasonal Theme Picker Card */}
      <div className="bg-white p-5 rounded-lg border border-[#E5DFD8] shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-display text-xl text-stone-900 flex items-center gap-2">
              <span>Seasonal Storefront Vibe</span>
              <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded font-mono font-normal">Active: {(season || 'classic').toUpperCase()}</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Dramatically shift the storefront aesthetic to match different times of the year. The Admin Panel remains in neutral luxury gold to preserve professional readability.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-amber-600 border border-[#E5DFD8] px-3 py-1 rounded-full font-semibold">Live Storefront</span>
        </div>

        {(() => {
          const SEASONS_DATA = [
            { 
              id: 'classic', 
              label: 'Classic Gold', 
              desc: 'Warm, timeless legacy luxury gold.',
              emoji: '✦',
              mood: 'Opulent, historical, high-end curation', 
              accentColor: '#C9A84C',
              accentSoft: '#FDFBF7',
              particleLabel: 'Floating Sparkles',
              paletteColors: ['#C9A84C', '#B3923B', '#FDFBF7']
            },
            { 
              id: 'spring', 
              label: 'Spring Mint', 
              desc: 'Soft pastel sage and fresh leaf renewal.',
              emoji: '🌸',
              mood: 'Fresh, organic, botanical, calm growth', 
              accentColor: '#5D7268',
              accentSoft: '#F1F4F1',
              particleLabel: 'Drifting Cherry Blossoms',
              paletteColors: ['#5D7268', '#475850', '#F1F4F1']
            },
            { 
              id: 'summer', 
              label: 'Summer Amber', 
              desc: 'Radiant terracotta, clay and linen warmth.',
              emoji: '☀️',
              mood: 'Warm, sun-drenched, radiant beach elements', 
              accentColor: '#C17A4C',
              accentSoft: '#FBF6F2',
              particleLabel: 'Sunlight Particles',
              paletteColors: ['#C17A4C', '#A06138', '#FBF6F2']
            },
            { 
              id: 'autumn', 
              label: 'Autumn Crimson', 
              desc: 'Rustic crimson, deep grape, and ochre harvest.',
              emoji: '🍁',
              mood: 'Cozy, earthy, nostalgic warmth & velvet', 
              accentColor: '#8E4A4A',
              accentSoft: '#FAF4F4',
              particleLabel: 'Falling Maple Leaves',
              paletteColors: ['#8E4A4A', '#743B3B', '#FAF4F4']
            },
            { 
              id: 'winter', 
              label: 'Winter Sapphire', 
              desc: 'Frosted sapphire, silver, and deep navy ice.',
              emoji: '❄️',
              mood: 'Cool, crisp, elegant, winter nobility', 
              accentColor: '#4B6B88',
              accentSoft: '#F2F5F8',
              particleLabel: 'Glistening Ice Crystals',
              paletteColors: ['#4B6B88', '#3A546C', '#F2F5F8']
            }
          ];

          return (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-1">
              {/* Left Column: Interactive Cards List */}
              <div className="xl:col-span-2 space-y-3">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Select a seasonal palette</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SEASONS_DATA.map((theme) => {
                    const isSelected = (season || 'classic') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={async () => {
                          setSeasonSaveStatus(`Applying ${theme.label} vibe...`);
                          const res = await saveSeason(theme.id);
                          if (res?.ok) {
                            setSeasonSaveStatus(`Theme updated to ${theme.label}!`);
                          } else {
                            setSeasonSaveStatus('Failed to update seasonal theme.');
                          }
                        }}
                        className={`p-4 border rounded-lg text-left transition-all flex flex-col justify-between gap-3 outline-none group cursor-pointer ${
                          isSelected 
                            ? 'border-stone-900 bg-stone-50/50 ring-2 ring-stone-900/5' 
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{theme.emoji}</span>
                            <p className="text-sm font-semibold text-stone-900 group-hover:text-[#C9A84C] transition-colors">{theme.label}</p>
                          </div>
                          {isSelected ? (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-stone-900 text-white px-2 py-0.5 rounded">Active</span>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to apply</span>
                          )}
                        </div>
                        
                        <p className="text-xs text-stone-500 leading-normal">{theme.desc}</p>
                        
                        <div className="flex items-center gap-2 mt-1 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                          <span className="font-semibold text-stone-500">Palette:</span>
                          <div className="flex gap-1.5 items-center">
                            {theme.paletteColors.map((col, cIdx) => (
                              <span key={cIdx} className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: col }} title={col} />
                            ))}
                          </div>
                          <span className="mx-1">•</span>
                          <span>{theme.particleLabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Live Vibe Simulator */}
              <div className="bg-stone-50/70 p-4 rounded-lg border border-stone-200 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    <Palette size={14} className="text-amber-700 animate-pulse" />
                    <span>Vibe Simulator</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Visualizing how active storefront elements and headings react in real-time.
                  </p>
                </div>

                {/* Simulated Storefront Card Mockup */}
                {(() => {
                  const activeTheme = SEASONS_DATA.find(t => t.id === (season || 'classic')) || SEASONS_DATA[0];
                  return (
                    <div 
                      className="border border-stone-200 rounded-md p-4 shadow-sm relative overflow-hidden transition-all duration-700 space-y-3"
                      style={{ backgroundColor: activeTheme.accentSoft }}
                    >
                      {/* Floating particle simulation */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 flex justify-around items-center">
                        <span className="text-base animate-bounce" style={{ animationDelay: '0.1s' }}>{activeTheme.emoji}</span>
                        <span className="text-lg animate-pulse" style={{ animationDelay: '0.5s' }}>{activeTheme.emoji}</span>
                        <span className="text-xs animate-bounce" style={{ animationDelay: '0.9s' }}>{activeTheme.emoji}</span>
                      </div>

                      {/* Header Mock */}
                      <div className="flex justify-between items-center pb-2 border-b border-stone-100 relative z-10">
                        <span className="font-serif text-xs font-bold text-stone-800">Good Finds <span className="italic font-light text-stone-500">by AA</span></span>
                        <div className="flex gap-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeTheme.accentColor }} />
                          <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                        </div>
                      </div>

                      {/* Hero Badge Mock */}
                      <div className="space-y-1 relative z-10 text-center py-1">
                        <span 
                          className="inline-block text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full border text-stone-900"
                          style={{ 
                            borderColor: activeTheme.accentColor, 
                            color: activeTheme.accentColor, 
                            backgroundColor: '#FFFFFF' 
                          }}
                        >
                          {activeTheme.emoji} {activeTheme.label}
                        </span>
                        <p className="font-serif text-[11px] font-medium text-stone-800 mt-1 leading-tight">
                          {activeTheme.mood}
                        </p>
                      </div>

                      {/* Product Card Mock */}
                      <div className="border border-stone-100 rounded p-2 bg-white flex items-center gap-2 relative z-10 shadow-xs">
                        <div className="w-7 h-7 rounded bg-stone-50 flex items-center justify-center text-xs">👜</div>
                        <div className="flex-1 min-w-0">
                          <div className="h-1.5 w-12 bg-stone-200 rounded mb-1" />
                          <div className="h-1 w-16 bg-stone-100 rounded" />
                        </div>
                        <span className="text-[9px] font-mono font-bold" style={{ color: activeTheme.accentColor }}>₱55,000</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="text-[10px] text-stone-500 space-y-1 pt-2 border-t border-stone-200/60">
                  <p className="font-semibold text-stone-700">Dynamic Storefront Reaction:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-stone-500">
                    <li>Dynamic CSS properties render in browser</li>
                    <li>Particles trigger ambient physics effects</li>
                    <li>Storefront banners & category pills match season</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}

        {seasonSaveStatus && (
          <p className="text-xs font-semibold text-stone-700 pt-1 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500 animate-spin" />
            <span>{seasonSaveStatus}</span>
          </p>
        )}
      </div>

      <div className="flex border-b border-stone-200 overflow-x-auto">{[{ id: 'schema', label: 'Database Schema', icon: Database }, { id: 'endpoints', label: 'Suggested API Endpoints', icon: Link }, { id: 'logic', label: 'FIFO & Cost Matching Logic', icon: GitMerge }].map((t) => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === t.id ? 'border-amber-600 text-stone-900 font-semibold' : 'border-transparent text-stone-500 hover:text-stone-800'}`}><t.icon size={15} />{t.label}</button>)}</div>

      {activeTab === 'schema' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm"><h3 className="font-display text-lg text-stone-900 mb-2 flex items-center gap-2"><span className="p-1 bg-stone-100 rounded text-amber-700">1</span>App State Blob</h3><p className="text-xs text-stone-500 mb-4">The storefront and admin settings are synchronized through the single D1 app_state JSON record.</p><div className="overflow-x-auto"><table className="w-full text-left text-xs font-mono border border-stone-100"><thead><tr className="bg-stone-50 border-b border-stone-200 text-stone-600"><th className="p-2">Field</th><th className="p-2">Purpose</th></tr></thead><tbody className="divide-y divide-stone-100 text-stone-700"><tr><td className="p-2 font-semibold">products</td><td className="p-2">Product catalog and item metadata</td></tr><tr><td className="p-2 font-semibold">batches</td><td className="p-2">Purchase batches, stock, and cost data</td></tr><tr><td className="p-2 font-semibold">catalogItems</td><td className="p-2">Storefront listings and remaining quantities</td></tr><tr><td className="p-2 font-semibold">sales</td><td className="p-2">Completed sales and COGS records</td></tr><tr><td className="p-2 font-semibold">purchaseRequests</td><td className="p-2">Customer cart checkout requests</td></tr><tr><td className="p-2 font-semibold">socialLinks</td><td className="p-2">Storefront social media links</td></tr><tr><td className="p-2 font-semibold">paymentMethods</td><td className="p-2">Zelle and Venmo display information</td></tr><tr><td className="p-2 font-semibold">heroImage</td><td className="p-2">Configurable homepage hero image URL and alt text</td></tr><tr><td className="p-2 font-semibold">season</td><td className="p-2">Active seasonal theme preset of the storefront</td></tr></tbody></table></div></div><div className="bg-amber-50 p-5 rounded-lg border border-amber-200 shadow-sm space-y-3"><h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2"><HelpCircle size={15} className="text-amber-700" />How image configuration works</h4><p className="text-xs text-stone-700 leading-relaxed">The admin saves only the image URL and accessibility description into D1. The image file itself remains hosted externally, so no new upload route or storage change is required.</p><div className="bg-white p-3 rounded font-mono text-xs text-amber-950 border border-amber-100">heroImage = &#123; url: "https://...", alt: "Good Finds by AA Featured Collection" &#125;</div></div></div>}
      {activeTab === 'endpoints' && <div className="space-y-6"><div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm"><h3 className="font-display text-lg text-stone-900 mb-2">REST API Design</h3><p className="text-xs text-stone-500 mb-6">Current Worker routes used by the storefront and admin sync layer.</p><div className="space-y-4">{[{ method: 'GET', url: '/api/state', desc: 'Reads the public app state from D1.' }, { method: 'PUT', url: '/api/state', desc: 'Writes the full app state blob to D1 with Authorization header.' }, { method: 'POST', url: '/api/photos', desc: 'Uploads product photos to R2 with Authorization header.' }, { method: 'POST', url: '/api/requests', desc: 'Accepts public buyer purchase requests.' }].map((api) => <div key={`${api.method}-${api.url}`} className="border border-stone-200 rounded-lg overflow-hidden"><div className="flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50 px-4 py-3 border-b border-stone-200"><div className="flex items-center gap-2"><span className={`px-2 py-1 rounded text-xs font-mono font-bold ${api.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{api.method}</span><code className="text-sm font-semibold text-stone-800">{api.url}</code></div><span className="text-xs text-stone-500 mt-1 sm:mt-0">{api.desc}</span></div></div>)}</div></div></div>}
      {activeTab === 'logic' && <div className="space-y-6"><div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-6"><div><h3 className="font-display text-lg text-stone-900 mb-2">Inventory Logic Blueprint</h3><p className="text-xs text-stone-500">How the system processes transactions with high precision and flexibility.</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-3 p-4 border border-stone-200 rounded-lg bg-stone-50"><h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2"><span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs text-amber-800 font-bold">A</span>FIFO Algorithm</h4><p className="text-xs text-stone-600 leading-relaxed">When a sale is recorded as FIFO, the system draws from the oldest active batches first until the requested sales quantity is satisfied.</p></div><div className="space-y-3 p-4 border border-stone-200 rounded-lg bg-stone-50"><h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2"><span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs text-amber-800 font-bold">B</span>Manual Batch Selection Option</h4><p className="text-xs text-stone-600 leading-relaxed">Admin users may bypass FIFO and manually select the exact batch to deduct during a manual sale entry.</p></div></div><div className="border border-amber-100 rounded-lg bg-amber-50 p-4 flex gap-4"><GitMerge className="text-amber-700 shrink-0" size={20} /><div><h4 className="font-semibold text-stone-800 text-xs uppercase tracking-wider mb-1">Precision Inventory Valuation Rule</h4><p className="text-xs text-stone-600 leading-relaxed">Inventory valuation is calculated by summing each batch's remaining quantity multiplied by its cost-per-item.</p><div className="mt-2 font-mono text-xs text-amber-900 font-bold">Valuation = SUM( Batch.remainingQty * Batch.costPerItem )</div></div></div></div></div>}
    </div>
  );
}
