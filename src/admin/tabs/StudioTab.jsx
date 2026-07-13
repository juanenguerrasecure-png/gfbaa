import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sparkles, Image as ImageIcon, Check, Copy, Save, Grid, Compass, RefreshCw } from 'lucide-react';

const MODEL_PRESETS = [
  { id: 'gemini-3.1-flash-lite-image', label: 'Gemini 3.1 Flash Lite (Fast)', desc: 'Lightweight, fast generation. Great for standard mood boards and drafts.' },
  { id: 'gemini-3.1-flash-image', label: 'Gemini 3.1 Flash (High Quality)', desc: 'Higher definition, better detail preservation, and advanced rendering.' }
];

const STYLE_PRESETS = [
  {
    name: 'Classic Gold Flatlay',
    prompt: 'A warm, timeless luxury flatlay. Curated pieces of pristine gold chain jewelry and vintage brown leather shoulder bag on an ivory linen surface, soft natural shadows, rich detailed textures, warm morning lighting.',
    category: 'Mood Board'
  },
  {
    name: 'Spring Botanical Mint',
    prompt: 'Fresh spring editorial showcase. A sage green designer leather handbag surrounded by soft white cherry blossoms, delicate botanical leaves, and fresh moss details, crisp daylight, high fashion, clean minimalist setting.',
    category: 'Seasonal Arrival'
  },
  {
    name: 'Summer Terracotta Linen',
    prompt: 'A sun-drenched, high-contrast lifestyle editorial. Terracotta ceramics, a white linen clutch bag, golden hour light casting long leaf shadows, organic warmth, Mediterranean luxury resort feel.',
    category: 'Promo Banner'
  },
  {
    name: 'Autumn Crimson Editorial',
    prompt: 'A rich, cozy autumn luxury display. A deep crimson velvet clutch bag next to golden-hued maple leaves and warm ambient candles on dark wood, high-end catalog aesthetic, cinematic soft lighting.',
    category: 'Mood Board'
  },
  {
    name: 'Winter Sapphire Glimmer',
    prompt: 'A glistening winter nobility setup. A navy blue sapphire-embellished evening bag on frosted silver mirror glass, crisp icy crystals reflecting light, clean studio spotlights, elite premium jewelry.',
    category: 'Promo Banner'
  },
  {
    name: 'Minimalist Studio Product Card',
    prompt: 'A pristine luxury product catalog photo. A single gold chain bracelet resting on a raw marble pedestal, solid warm white studio background, extremely sharp focus, professional accessory rendering.',
    category: 'Empty Card Asset'
  }
];

const ASPECT_RATIOS = [
  { ratio: '1:1', label: 'Square (1:1)', desc: 'Best for gallery and product cards' },
  { ratio: '16:9', label: 'Landscape (16:9)', desc: 'Perfect for Home Hero and banners' },
  { ratio: '4:3', label: 'Classic Card (4:3)', desc: 'Ideal for editorial grids' },
  { ratio: '3:4', label: 'Portrait (3:4)', desc: 'Elegant for vertical displays' }
];

export function StudioTab() {
  const { saveHeroImage, galleryPhotos = [], saveGalleryPhotos } = useStore();
  const [model, setModel] = useState('gemini-3.1-flash-lite-image');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [prompt, setPrompt] = useState(STYLE_PRESETS[0].prompt);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Dynamic UI actions status
  const [publishHeroStatus, setPublishHeroStatus] = useState('');
  const [publishGalleryStatus, setPublishGalleryStatus] = useState('');

  // Generation loading step index for animations
  const [loaderStep, setLoaderStep] = useState(0);

  const handleSelectPreset = (preset) => {
    setPrompt(preset.prompt);
    // If seasonal, adjust aspect ratio recommendation
    if (preset.name.includes('Flatlay') || preset.name.includes('Product')) {
      setAspectRatio('1:1');
    } else {
      setAspectRatio('16:9');
    }
  };

  const enhancePrompt = () => {
    setIsEnhancing(true);
    setTimeout(() => {
      const modifiers = [
        'captured with professional studio camera',
        '8k resolution',
        'soft cinematic volumetric lighting',
        'rich depth of field with pristine micro-details',
        'photorealistic style',
        'expert composition',
        'authentic luxury editorial mood'
      ];
      
      // Filter out elements already mentioned to avoid redundancy
      const cleanPrompt = prompt.replace(/\.$/, '');
      const uniqueModifiers = modifiers.filter(mod => !cleanPrompt.toLowerCase().includes(mod.split(' ')[0]));
      
      setPrompt(`${cleanPrompt}, ${uniqueModifiers.join(', ')}.`);
      setIsEnhancing(false);
    }, 450);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setStatus('Please enter a prompt.');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);
    setPublishHeroStatus('');
    setPublishGalleryStatus('');
    setStatus('');
    setLoaderStep(0);

    const steps = [
      'Authenticating secure AI API credentials...',
      'Mapping visual design composition presets...',
      'Synthesizing fine leather and fabric patterns...',
      'Casting 18k gold reflections & shadow matrices...',
      'Polishing high-fidelity camera focus planes...',
      'Persisting new high-res asset directly to R2 Cloud Storage...'
    ];

    const stepInterval = setInterval(() => {
      setLoaderStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio, model })
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Generative Model failed to complete.');
      }

      setGeneratedResult(data);
      setStatus('Creative asset generated successfully and stored in R2!');
    } catch (error) {
      clearInterval(stepInterval);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedResult?.imageUrl) return;
    try {
      const fullUrl = window.location.origin + generatedResult.imageUrl;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handlePublishAsHero = async () => {
    if (!generatedResult?.imageUrl) return;
    setPublishHeroStatus('Publishing...');
    try {
      const res = await saveHeroImage({
        url: generatedResult.imageUrl,
        alt: generatedResult.prompt || 'AI-generated featured editorial arrivals'
      });
      if (res?.ok) {
        setPublishHeroStatus('Published as Live Home Hero image!');
      } else {
        setPublishHeroStatus('Local cache updated. Sync delayed.');
      }
    } catch (error) {
      console.error(error);
      setPublishHeroStatus('Publishing failed.');
    }
  };

  const handlePublishToGallery = async () => {
    if (!generatedResult?.imageUrl) return;
    setPublishGalleryStatus('Publishing...');
    try {
      const nextOrder = galleryPhotos.length > 0 
        ? Math.max(...galleryPhotos.map(p => Number(p.order) || 0)) + 1 
        : 1;

      const newPhoto = {
        id: `gal-ai-${Date.now()}`,
        url: generatedResult.imageUrl,
        title: 'Editorial Arrivals',
        caption: generatedResult.prompt,
        story: 'Custom studio design mockup generated with Gemini AI to complement the seasonal storefront branding.',
        order: nextOrder
      };

      const res = await saveGalleryPhotos([...galleryPhotos, newPhoto]);
      if (res?.ok) {
        setPublishGalleryStatus('Added directly to Storefront Gallery!');
      } else {
        setPublishGalleryStatus('Local cache updated. Sync delayed.');
      }
    } catch (error) {
      console.error(error);
      setPublishGalleryStatus('Publishing failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-display text-2xl text-stone-900 flex items-center gap-2">
            <Sparkles className="text-[#C9A84C]" size={24} />
            <span>AI Editorial Studio</span>
          </h2>
          <p className="text-sm text-stone-500">Create gorgeous custom mood boards and seasonal arrivals banners on-demand with Gemini AI.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-semibold border border-stone-200 uppercase tracking-wider">
          <Compass size={14} />
          <span>Server-Side Gemini Platform</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Panel: Form Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset Inspirations */}
          <div className="bg-white p-5 rounded-lg border border-[#E5DFD8] shadow-sm space-y-4">
            <h3 className="font-display text-base text-stone-900 flex items-center gap-2">
              <Compass size={16} className="text-[#C9A84C]" />
              <span>Seasonal Preset Moodboards</span>
            </h3>
            <p className="text-xs text-stone-500">
              Select an editorial preset to quickly pre-populate high-fashion visual style configurations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="flex flex-col text-left p-3 border border-stone-200 hover:border-[#C9A84C] hover:bg-stone-50 rounded transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-stone-800 group-hover:text-[#C9A84C] transition-colors">{preset.name}</span>
                    <span className="text-[8px] uppercase tracking-wider bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{preset.category}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">{preset.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Model & Aspect Ratio Setup */}
          <div className="bg-white p-5 rounded-lg border border-[#E5DFD8] shadow-sm space-y-4">
            <h3 className="font-display text-base text-stone-900">1. Generation Engines</h3>
            
            {/* Model Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest">Select AI Model</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MODEL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setModel(p.id)}
                    className={`p-3 border text-left rounded transition-all cursor-pointer ${
                      model === p.id 
                        ? 'border-[#C9A84C] bg-[#FDFBF7]' 
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${model === p.id ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-stone-300'}`}>
                        {model === p.id && <span className="w-1 h-1 bg-white rounded-full" />}
                      </span>
                      <span className="text-xs font-bold text-stone-800">{p.label}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1.5 leading-normal">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest">Select Aspect Ratio</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((item) => (
                  <button
                    key={item.ratio}
                    type="button"
                    onClick={() => setAspectRatio(item.ratio)}
                    className={`p-2 border rounded text-center transition-all cursor-pointer ${
                      aspectRatio === item.ratio 
                        ? 'border-[#C9A84C] bg-[#FDFBF7] text-stone-900 font-bold' 
                        : 'border-stone-200 hover:border-stone-400 text-stone-500 bg-white'
                    }`}
                  >
                    <span className="text-xs block">{item.label}</span>
                    <span className="text-[8px] text-stone-400 block mt-0.5">{item.desc.split(' ')[0]} ...</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt Editor & Core Button */}
          <div className="bg-white p-5 rounded-lg border border-[#E5DFD8] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-base text-stone-900">2. Define Creative Vision</h3>
              <button
                type="button"
                onClick={enhancePrompt}
                disabled={isEnhancing || isGenerating}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stone-900 border border-stone-200 bg-stone-50 hover:bg-stone-100 px-3 py-1 rounded-full uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles size={11} className="text-[#C9A84C]" />
                {isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}
              </button>
            </div>

            <div className="space-y-2">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setStatus('');
                }}
                disabled={isGenerating}
                rows={4}
                placeholder="A luxury arrangement of fine designer leather bags..."
                className="w-full border border-stone-300 rounded p-3 text-sm text-stone-900 outline-none focus:border-[#C9A84C] disabled:bg-stone-50"
              />
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Be specific about materials (e.g. 18k gold detailing, saffiano leather, pure linen), angles, and studio light settings to ensure high artistic quality.
              </p>
            </div>

            {/* Error / Success Status */}
            {status && (
              <div className={`p-3 text-xs border rounded-md ${
                status.startsWith('Error') 
                  ? 'bg-rose-50 border-rose-100 text-rose-700' 
                  : 'bg-emerald-50 border-emerald-100 text-emerald-800 font-semibold'
              }`}>
                {status}
              </div>
            )}

            {/* Primary Generate Trigger */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>Synthesizing Studio Image...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-[#C9A84C]" />
                  <span>Generate Custom Creative</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Preview & Action Panel: Results Stage */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="bg-white rounded-lg border border-[#E5DFD8] shadow-sm p-5 flex flex-col flex-grow min-h-[450px]">
            <h3 className="font-display text-base text-stone-900 border-b border-stone-100 pb-3 mb-4">Studio Generation Stage</h3>

            {/* Interactive Preview Canvas */}
            <div className="flex-grow flex flex-col justify-center items-center bg-stone-50 border border-stone-100 rounded-lg overflow-hidden relative min-h-[280px]">
              {isGenerating ? (
                /* Dynamic Loader Stage with steps progress */
                <div className="text-center p-6 space-y-4 max-w-xs relative z-10">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-stone-200" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-[#C9A84C] animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto text-[#C9A84C] animate-pulse" size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-stone-800 uppercase tracking-widest animate-pulse">GENERATING ASSET</p>
                    <p className="text-[11px] text-stone-500 leading-relaxed min-h-[32px] transition-all duration-300">
                      {['Authenticating secure AI API credentials...',
                        'Mapping visual design composition presets...',
                        'Synthesizing fine leather and fabric patterns...',
                        'Casting 18k gold reflections & shadow matrices...',
                        'Polishing high-fidelity camera focus planes...',
                        'Persisting new high-res asset directly to R2 Cloud Storage...'
                      ][loaderStep]}
                    </p>
                  </div>
                </div>
              ) : generatedResult ? (
                /* Actual Generated Asset with cover fit */
                <div className="w-full h-full flex items-center justify-center p-2">
                  <img
                    src={generatedResult.imageUrl}
                    alt={generatedResult.prompt}
                    referrerPolicy="no-referrer"
                    className="max-h-[320px] max-w-full object-contain rounded border border-stone-200 shadow-sm"
                  />
                </div>
              ) : (
                /* Empty / Idle State */
                <div className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mx-auto">
                    <ImageIcon size={20} />
                  </div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Studio Empty</p>
                  <p className="text-[10px] text-stone-400 max-w-xs leading-relaxed">
                    Trigger the Gemini image generator engine on the left to synthesize fresh visual banners or seasonal mood boards.
                  </p>
                </div>
              )}
            </div>

            {/* Post-Generation Action Panel */}
            {generatedResult && (
              <div className="mt-5 space-y-4 pt-4 border-t border-stone-100">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 bg-stone-50 p-2.5 rounded border border-stone-100">
                    <span className="truncate flex-1 pr-4" title={generatedResult.imageUrl}>{generatedResult.imageUrl}</span>
                    <button
                      onClick={handleCopyToClipboard}
                      className="text-stone-800 hover:text-[#C9A84C] flex items-center gap-1 font-sans font-semibold shrink-0 cursor-pointer"
                    >
                      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest">Storefront Integrations</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Hero Integration */}
                    <button
                      type="button"
                      onClick={handlePublishAsHero}
                      className="inline-flex items-center justify-center gap-2 border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-[#C9A84C] px-3 py-2.5 rounded text-xs font-semibold text-stone-800 transition-all cursor-pointer"
                    >
                      <Save size={13} className="text-[#C9A84C]" />
                      <span>Set as Home Hero</span>
                    </button>

                    {/* Gallery Integration */}
                    <button
                      type="button"
                      onClick={handlePublishToGallery}
                      className="inline-flex items-center justify-center gap-2 border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-[#C9A84C] px-3 py-2.5 rounded text-xs font-semibold text-stone-800 transition-all cursor-pointer"
                    >
                      <Grid size={13} className="text-[#C9A84C]" />
                      <span>Publish to Gallery</span>
                    </button>
                  </div>

                  {/* Dynamic Action Callouts */}
                  {publishHeroStatus && (
                    <p className="text-[11px] text-emerald-600 font-semibold text-center pt-1 flex items-center justify-center gap-1">
                      <Check size={12} /> {publishHeroStatus}
                    </p>
                  )}
                  {publishGalleryStatus && (
                    <p className="text-[11px] text-emerald-600 font-semibold text-center pt-1 flex items-center justify-center gap-1">
                      <Check size={12} /> {publishGalleryStatus}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
