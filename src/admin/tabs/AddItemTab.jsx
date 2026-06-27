import { useMemo, useState } from 'react';
import { Archive, CheckCircle, HelpCircle, PlusCircle, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PhotoUploader } from '../../components/PhotoUploader';
import styles from './AddItemTab.module.css';

const DEFAULT_PRODUCT = {
  name: '',
  brand: '',
  cat: 'bags',
  detail: '',
  price: '',
};

const DEFAULT_BATCH = {
  productId: 'new', // 'new' or existing product ID
  batchNumber: '',
  date: new Date().toISOString().split('T')[0],
  quantity: '',
  productCost: '',
  shipping: '',
  tariff: '',
  condition: 'mint',
  enteredInPhp: false,
};

const DEFAULT_CATALOG_ITEM = {
  batchId: '',
  name: '',
  brand: '',
  cat: 'bags',
  detail: '',
  price: '',
  orig: '',
  emoji: '👜',
  condition: 'mint',
  quantity: '1',
  photoUrl: null
};

const STEP_LABELS = ['Item Identity', 'Pricing', 'Photos', 'Review + Submit'];

export function AddItemTab() {
  const { products, addProduct, batches, addBatch, exchangeRate, addCatalogItem } = useStore();
  const [activeTab, setActiveTab] = useState('batch'); // 'batch' | 'catalog'
  const [currentStep, setCurrentStep] = useState(1);

  // --- Wholesale Batch Form State ---
  const [productForm, setProductForm] = useState(DEFAULT_PRODUCT);
  const [batchForm, setBatchForm] = useState(DEFAULT_BATCH);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  // --- Retail Catalog Form State ---
  const [catalogItemForm, setCatalogItemForm] = useState(DEFAULT_CATALOG_ITEM);
  const [catalogSaved, setCatalogSaved] = useState(false);
  const [catalogErrors, setCatalogErrors] = useState({});

  const isCreatingNewProduct = batchForm.productId === 'new';
  const activeBatches = useMemo(() => batches.filter(b => b.remainingQty > 0), [batches]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentStep(1);
    setErrors({});
    setCatalogErrors({});
  };

  const handleProductChange = (k, v) => {
    setProductForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const handleBatchChange = (k, v) => {
    setBatchForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const handleCatalogChange = (k, v) => {
    setCatalogItemForm(prev => ({ ...prev, [k]: v }));
    setCatalogErrors(prev => ({ ...prev, [k]: '' }));
  };

  const handleCatalogBatchSelect = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) {
      setCatalogItemForm(DEFAULT_CATALOG_ITEM);
      return;
    }
    const product = products.find(p => p.id === batch.productId);
    setCatalogItemForm({
      batchId,
      name: product ? product.name : '',
      brand: product ? product.brand : '',
      cat: product ? product.cat : 'bags',
      detail: product ? product.detail : '',
      price: product ? String(product.price) : '',
      orig: product && product.orig ? String(product.orig) : '',
      emoji: product ? product.emoji : '👜',
      condition: batch.condition || 'mint',
      quantity: '1',
      photoUrl: product ? product.photoUrl : null
    });
    setCatalogErrors({});
  };

  // Wholesale Cost Calculators
  const convertedValues = useMemo(() => {
    const isPhp = batchForm.enteredInPhp;
    const rate = Number(exchangeRate) || 58.0;
    const rawCost = Number(batchForm.productCost) || 0;
    const rawShipping = Number(batchForm.shipping) || 0;
    const rawTariff = Number(batchForm.tariff) || 0;
    const qty = Number(batchForm.quantity) || 1;
    const productCostUSD = isPhp ? Math.round((rawCost / rate) * 100) / 100 : rawCost;
    const shippingUSD = isPhp ? Math.round((rawShipping / rate) * 100) / 100 : rawShipping;
    const tariffUSD = isPhp ? Math.round((rawTariff / rate) * 100) / 100 : rawTariff;
    const totalCostUSD = productCostUSD + shippingUSD + tariffUSD;
    const costPerItemUSD = qty > 0 ? Math.round((totalCostUSD / qty) * 100) / 100 : 0;
    return { productCostUSD, shippingUSD, tariffUSD, totalCostUSD, costPerItemUSD };
  }, [batchForm.productCost, batchForm.shipping, batchForm.tariff, batchForm.quantity, batchForm.enteredInPhp, exchangeRate]);

  // Live Retail Margin Calculations
  const retailMarginDetails = useMemo(() => {
    const batch = batches.find(b => b.id === catalogItemForm.batchId);
    if (!batch) return null;
    const retailPrice = Number(catalogItemForm.price) || 0;
    const profitUSD = retailPrice > 0 ? Math.round((retailPrice - batch.costPerItem) * 100) / 100 : 0;
    const marginPercent = retailPrice > 0 ? Math.round((profitUSD / retailPrice) * 100) : 0;
    return { costPerItem: batch.costPerItem, remainingQty: batch.remainingQty, profitUSD, marginPercent, isLoss: profitUSD < 0 };
  }, [batches, catalogItemForm.batchId, catalogItemForm.price]);

  // Wholesale Validate
  const validateWholesale = () => {
    const e = {};
    if (isCreatingNewProduct) {
      if (!productForm.name.trim()) e.name = 'Product name is required';
      if (!productForm.brand.trim()) e.brand = 'Brand name is required';
    } else if (batchForm.productId === 'new') {
      e.productId = 'Select a product';
    }
    if (!batchForm.quantity || Number(batchForm.quantity) <= 0) e.quantity = 'Quantity must be greater than 0';
    if (!batchForm.productCost || Number(batchForm.productCost) < 0) e.productCost = 'Valid cost is required';
    return e;
  };

  // Retail Validate
  const validateRetail = () => {
    const e = {};
    if (!catalogItemForm.batchId) e.batchId = 'Please select a wholesale batch';
    if (!catalogItemForm.name.trim()) e.name = 'Listing name is required';
    if (!catalogItemForm.brand.trim()) e.brand = 'Brand name is required';
    if (!catalogItemForm.price || Number(catalogItemForm.price) <= 0) e.price = 'Valid listing price is required';
    const qty = Number(catalogItemForm.quantity);
    if (!catalogItemForm.quantity || isNaN(qty) || qty <= 0) {
      e.quantity = 'Quantity must be at least 1';
    } else {
      const batch = batches.find(b => b.id === catalogItemForm.batchId);
      if (batch && qty > batch.remainingQty) e.quantity = `Quantity cannot exceed remaining batch stock (${batch.remainingQty})`;
    }
    return e;
  };

  const handleNextStep = () => {
    if (activeTab === 'batch') {
      if (currentStep === 1) {
        const e = {};
        if (isCreatingNewProduct) {
          if (!productForm.name.trim()) e.name = 'Product name is required';
          if (!productForm.brand.trim()) e.brand = 'Brand name is required';
        } else if (batchForm.productId === 'new') {
          e.productId = 'Select a product';
        }
        if (Object.keys(e).length) {
          setErrors(e);
          return;
        }
      }
      if (currentStep === 2) {
        const e = {};
        if (!batchForm.quantity || Number(batchForm.quantity) <= 0) e.quantity = 'Quantity must be greater than 0';
        if (!batchForm.productCost || Number(batchForm.productCost) < 0) e.productCost = 'Valid cost is required';
        if (Object.keys(e).length) {
          setErrors(e);
          return;
        }
      }
    } else {
      if (currentStep === 1) {
        const e = {};
        if (!catalogItemForm.batchId) e.batchId = 'Please select a wholesale batch';
        if (!catalogItemForm.name.trim()) e.name = 'Listing name is required';
        if (!catalogItemForm.brand.trim()) e.brand = 'Brand name is required';
        if (Object.keys(e).length) {
          setCatalogErrors(e);
          return;
        }
      }
      if (currentStep === 2) {
        const e = {};
        if (!catalogItemForm.price || Number(catalogItemForm.price) <= 0) e.price = 'Valid listing price is required';
        const qty = Number(catalogItemForm.quantity);
        const batch = batches.find(b => b.id === catalogItemForm.batchId);
        if (!catalogItemForm.quantity || isNaN(qty) || qty <= 0) e.quantity = 'Quantity must be at least 1';
        if (batch && qty > batch.remainingQty) e.quantity = `Quantity cannot exceed remaining batch stock (${batch.remainingQty})`;
        if (Object.keys(e).length) {
          setCatalogErrors(e);
          return;
        }
      }
    }
    setCurrentStep(prev => Math.min(4, prev + 1));
  };

  const handleWholesaleSubmit = (e) => {
    e.preventDefault();
    const errs = validateWholesale();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    let targetProductId = Number(batchForm.productId);
    if (isCreatingNewProduct) {
      // Create new product type in catalog first
      const newProduct = addProduct({ ...productForm, price: Number(productForm.price) || 0 });
      targetProductId = newProduct.id;
    }

    // Add the new batch
    addBatch({ ...batchForm, productId: targetProductId, batchNumber: batchForm.batchNumber || `BATCH-${Date.now().toString().slice(-6)}` });

    setSaved(true);
    setCurrentStep(1);
    // Reset forms
    setProductForm(DEFAULT_PRODUCT);
    setBatchForm(() => ({ ...DEFAULT_BATCH, productId: 'new' }));
    setErrors({});
    setTimeout(() => setSaved(false), 4000);
  };

  const handleRetailSubmit = (e) => {
    e.preventDefault();
    const errs = validateRetail();
    if (Object.keys(errs).length) {
      setCatalogErrors(errs);
      return;
    }

    addCatalogItem({
      ...catalogItemForm,
      price: Number(catalogItemForm.price),
      orig: catalogItemForm.orig ? Number(catalogItemForm.orig) : null,
      quantity: Number(catalogItemForm.quantity) || 1
    });

    setCatalogSaved(true);
    setCurrentStep(1);
    setCatalogItemForm(DEFAULT_CATALOG_ITEM);
    setCatalogErrors({});
    setTimeout(() => setCatalogSaved(false), 4000);
  };

  const selectedBatchProduct = !isCreatingNewProduct ? products.find(p => String(p.id) === String(batchForm.productId)) : null;
  const selectedCatalogBatch = batches.find(b => b.id === catalogItemForm.batchId);
  const selectedCatalogProduct = selectedCatalogBatch ? products.find(p => p.id === selectedCatalogBatch.productId) : null;

  const FieldError = ({ children }) => children ? <span className="text-[10px] text-red-600 font-semibold">{children}</span> : null;

  const Input = ({ label, error, className = '', ...props }) => (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className={styles.label} htmlFor={props.id}>{label}</label>
      <input className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-[#C9A84C]" {...props} />
      <FieldError>{error}</FieldError>
    </div>
  );

  const Select = ({ label, children, error, className = '', ...props }) => (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className={styles.label} htmlFor={props.id}>{label}</label>
      <select className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-[#C9A84C]" {...props}>{children}</select>
      <FieldError>{error}</FieldError>
    </div>
  );

  const Textarea = ({ label, className = '', ...props }) => (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className={styles.label} htmlFor={props.id}>{label}</label>
      <textarea className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-[#C9A84C] min-h-[88px]" {...props} />
    </div>
  );

  const ReviewRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-stone-100 py-2 text-sm">
      <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500">{label}</span>
      <span className="text-stone-900 font-semibold text-left sm:text-right">{value || '—'}</span>
    </div>
  );

  const StepShell = ({ children }) => (
    <div className="bg-white border border-[#E5DFD8] rounded p-4 sm:p-6 shadow-sm min-h-[420px]">
      <div className="mb-5 border-b border-[#E5DFD8] pb-4">
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#C9A84C]">Step {currentStep} of 4</span>
        <h3 className="font-display text-xl sm:text-2xl font-normal text-stone-900 mt-1">{STEP_LABELS[currentStep - 1]}</h3>
      </div>
      {children}
    </div>
  );

  const WizardFooter = ({ isSubmitDisabled = false }) => (
    <div className="sticky bottom-0 z-20 mt-6 bg-[#FAF8F5]/95 backdrop-blur border border-[#E5DFD8] rounded px-4 py-3 shadow-[0_-8px_24px_rgba(28,20,16,0.08)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center justify-center sm:justify-start gap-2" aria-label="Wizard progress">
        {[1, 2, 3, 4].map(step => <span key={step} className={`h-2.5 rounded-full transition-all ${currentStep === step ? 'w-7 bg-[#C9A84C]' : 'w-2.5 bg-stone-300'}`} />)}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1} className="px-4 py-2 border border-[#E5DFD8] bg-white rounded text-xs font-semibold text-stone-600 hover:border-[#C9A84C] disabled:opacity-40 disabled:cursor-not-allowed">Back</button>
        {currentStep < 4 ? (
          <button type="button" onClick={handleNextStep} className="px-5 py-2 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800">Next</button>
        ) : (
          <button type="submit" disabled={isSubmitDisabled} className="px-5 py-2 bg-[#C9A84C] text-stone-950 rounded text-xs font-bold hover:bg-[#b7963d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><PlusCircle size={14} />Submit</button>
        )}
      </div>
    </div>
  );

  const renderBatchStep = () => {
    if (currentStep === 1) {
      return (
        <StepShell>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select id="batch_product_source" label="Product Source" value={batchForm.productId} onChange={(e) => handleBatchChange('productId', e.target.value)} error={errors.productId} className="md:col-span-2">
              <option value="new">Create New Product Identity</option>
              {products.map(product => <option key={product.id} value={product.id}>{product.brand} — {product.name}</option>)}
            </Select>
            {isCreatingNewProduct ? (
              <>
                <Input id="prod_name" label="Product Name *" value={productForm.name} onChange={(e) => handleProductChange('name', e.target.value)} placeholder="e.g. Birkin 30" error={errors.name} />
                <Input id="prod_brand" label="Brand *" value={productForm.brand} onChange={(e) => handleProductChange('brand', e.target.value)} placeholder="e.g. Hermès" error={errors.brand} />
                <Select id="prod_cat" label="Category" value={productForm.cat} onChange={(e) => handleProductChange('cat', e.target.value)}><option value="bags">Handbags & Accessories</option><option value="jewelry">Fine Jewelry & Watches</option></Select>
                <Input id="prod_price" type="number" label="Default Price (USD)" value={productForm.price} onChange={(e) => handleProductChange('price', e.target.value)} placeholder="e.g. 5000" />
                <Textarea id="prod_detail" label="Product Notes / Details" value={productForm.detail} onChange={(e) => handleProductChange('detail', e.target.value)} placeholder="Authenticity details, material, color, inclusions, or notable condition notes." className="md:col-span-2" />
              </>
            ) : (
              <div className="md:col-span-2 bg-stone-50 border border-[#E5DFD8] rounded p-4 text-sm text-stone-700">
                <span className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">Selected Product</span>
                {selectedBatchProduct ? `${selectedBatchProduct.brand} ${selectedBatchProduct.name}` : 'Select an existing product identity above.'}
              </div>
            )}
            <Select id="batch_condition" label="Condition" value={batchForm.condition} onChange={(e) => handleBatchChange('condition', e.target.value)}><option value="new">Brand New</option><option value="mint">Mint / Like New</option><option value="good">Very Good</option><option value="fair">Fair / Visible Wear</option></Select>
            <Input id="batch_number" label="Batch Number" value={batchForm.batchNumber} onChange={(e) => handleBatchChange('batchNumber', e.target.value)} placeholder="Auto-generated if blank" />
            <Input id="batch_date" type="date" label="Purchase Date" value={batchForm.date} onChange={(e) => handleBatchChange('date', e.target.value)} />
          </div>
        </StepShell>
      );
    }
    if (currentStep === 2) {
      return (
        <StepShell>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center justify-between gap-4 bg-stone-50 border border-[#E5DFD8] rounded p-4">
              <div><p className="text-sm font-semibold text-stone-900">Entered in PHP</p><p className="text-xs text-stone-500">Exchange rate note: using {Number(exchangeRate) || 58.0} PHP = 1 USD for converted calculations.</p></div>
              <input type="checkbox" checked={batchForm.enteredInPhp} onChange={(e) => handleBatchChange('enteredInPhp', e.target.checked)} className="h-5 w-5 accent-[#C9A84C]" />
            </div>
            <Input id="batch_quantity" type="number" label="Quantity *" value={batchForm.quantity} onChange={(e) => handleBatchChange('quantity', e.target.value)} placeholder="e.g. 5" error={errors.quantity} />
            <Input id="batch_product_cost" type="number" label={`Product Cost ${batchForm.enteredInPhp ? '(PHP)' : '(USD)'} *`} value={batchForm.productCost} onChange={(e) => handleBatchChange('productCost', e.target.value)} placeholder="e.g. 2500" error={errors.productCost} />
            <Input id="batch_shipping" type="number" label={`Shipping ${batchForm.enteredInPhp ? '(PHP)' : '(USD)'}`} value={batchForm.shipping} onChange={(e) => handleBatchChange('shipping', e.target.value)} placeholder="0" />
            <Input id="batch_tariff" type="number" label={`Tariff / Other Fees ${batchForm.enteredInPhp ? '(PHP)' : '(USD)'}`} value={batchForm.tariff} onChange={(e) => handleBatchChange('tariff', e.target.value)} placeholder="0" />
            <div className="md:col-span-2 bg-stone-950 text-stone-100 rounded p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between"><span className="text-stone-400">Total Cost USD</span><span>${convertedValues.totalCostUSD.toFixed(2)}</span></div>
              <div className="flex justify-between text-emerald-400 font-bold"><span>Cost Per Item</span><span>${convertedValues.costPerItemUSD.toFixed(2)}</span></div>
            </div>
          </div>
        </StepShell>
      );
    }
    if (currentStep === 3) {
      return <StepShell><div className="space-y-4"><p className="text-xs text-stone-500 bg-stone-50 border border-[#E5DFD8] rounded p-3">Upload a reference image for this acquisition. This is optional and can also be finalized when creating the storefront catalog item.</p><PhotoUploader value={productForm.photoUrl || null} onChange={(url) => handleProductChange('photoUrl', url)} /></div></StepShell>;
    }
    return (
      <StepShell>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-stone-50 border border-[#E5DFD8] rounded p-4"><h4 className="font-display text-lg text-stone-900 mb-3">Item Identity</h4><ReviewRow label="Product" value={isCreatingNewProduct ? `${productForm.brand} ${productForm.name}` : `${selectedBatchProduct?.brand || ''} ${selectedBatchProduct?.name || ''}`} /><ReviewRow label="Category" value={isCreatingNewProduct ? productForm.cat : selectedBatchProduct?.cat} /><ReviewRow label="Condition" value={batchForm.condition} /><ReviewRow label="Batch #" value={batchForm.batchNumber || 'Auto-generated'} /><ReviewRow label="Date" value={batchForm.date} /></div>
          <div className="bg-stone-50 border border-[#E5DFD8] rounded p-4"><h4 className="font-display text-lg text-stone-900 mb-3">Pricing</h4><ReviewRow label="Quantity" value={batchForm.quantity} /><ReviewRow label="Entered In" value={batchForm.enteredInPhp ? 'PHP' : 'USD'} /><ReviewRow label="Total Cost USD" value={`$${convertedValues.totalCostUSD.toFixed(2)}`} /><ReviewRow label="Cost Per Item" value={`$${convertedValues.costPerItemUSD.toFixed(2)}`} /></div>
        </div>
      </StepShell>
    );
  };

  const renderCatalogStep = () => {
    if (currentStep === 1) {
      return (
        <StepShell>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select id="catalog_batch" label="Source Batch *" value={catalogItemForm.batchId} onChange={(e) => handleCatalogBatchSelect(e.target.value)} error={catalogErrors.batchId} className="md:col-span-2">
              <option value="">Select active acquisition batch</option>
              {activeBatches.map(batch => { const product = products.find(p => p.id === batch.productId); return <option key={batch.id} value={batch.id}>{batch.batchNumber} — {product ? `${product.brand} ${product.name}` : 'Unknown Product'} ({batch.remainingQty} left)</option>; })}
            </Select>
            <Input id="cat_name" label="Listing Name *" value={catalogItemForm.name} onChange={(e) => handleCatalogChange('name', e.target.value)} placeholder="e.g. Classic Flap Bag" error={catalogErrors.name} />
            <Input id="cat_brand" label="Brand *" value={catalogItemForm.brand} onChange={(e) => handleCatalogChange('brand', e.target.value)} placeholder="e.g. Chanel" error={catalogErrors.brand} />
            <Select id="cat_category" label="Store Category" value={catalogItemForm.cat} onChange={(e) => handleCatalogChange('cat', e.target.value)}><option value="bags">Handbags & Accessories</option><option value="jewelry">Fine Jewelry & Watches</option></Select>
            <Select id="cat_condition" label="Item Quality Condition" value={catalogItemForm.condition} onChange={(e) => handleCatalogChange('condition', e.target.value)}><option value="new">Brand New</option><option value="mint">Mint (Like New)</option><option value="good">Very Good</option><option value="fair">Fair (Some Wear)</option></Select>
            <Input id="cat_emoji" label="Display Emoji Icon" value={catalogItemForm.emoji} onChange={(e) => handleCatalogChange('emoji', e.target.value)} placeholder="e.g. 👜, 💍" />
            <Textarea id="cat_detail" label="Public Listing Details" value={catalogItemForm.detail} onChange={(e) => handleCatalogChange('detail', e.target.value)} placeholder="Condition, inclusions, authenticity notes, sizing, or styling details." className="md:col-span-2" />
          </div>
        </StepShell>
      );
    }
    if (currentStep === 2) {
      return (
        <StepShell>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 bg-stone-50 border border-[#E5DFD8] rounded p-3 text-xs text-stone-500">Exchange rate note: reference rate is {Number(exchangeRate) || 58.0} PHP = 1 USD. Catalog listing prices are stored in USD.</div>
            <Input id="cat_price" type="number" label="Retail Store Selling Price (USD) *" value={catalogItemForm.price} onChange={(e) => handleCatalogChange('price', e.target.value)} placeholder="e.g. 5000" error={catalogErrors.price} />
            <Input id="cat_orig" type="number" label="Comparison / Original MSRP (USD)" value={catalogItemForm.orig} onChange={(e) => handleCatalogChange('orig', e.target.value)} placeholder="e.g. 6800" />
            <Input id="cat_quantity" type="number" label="Listing Stock Quantity *" value={catalogItemForm.quantity} onChange={(e) => handleCatalogChange('quantity', e.target.value)} placeholder="e.g. 1" error={catalogErrors.quantity} />
            {retailMarginDetails && <div className="md:col-span-2 bg-stone-950 text-stone-100 p-4 rounded-lg border border-stone-800 font-mono text-xs space-y-2"><div className="flex justify-between"><span className="text-stone-400">Batch Unit Cost</span><span>${retailMarginDetails.costPerItem.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-stone-400">Proposed Price</span><span>${(Number(catalogItemForm.price) || 0).toFixed(2)}</span></div><div className="flex justify-between border-t border-stone-800 pt-2"><span>Estimated Profit/unit</span><span className={retailMarginDetails.isLoss ? 'text-red-400' : 'text-emerald-400'}>${retailMarginDetails.profitUSD.toFixed(2)}</span></div><div className="flex justify-between"><span>Projected Margin</span><span className={retailMarginDetails.isLoss ? 'text-red-400' : 'text-emerald-400'}>{retailMarginDetails.marginPercent}%</span></div></div>}
          </div>
        </StepShell>
      );
    }
    if (currentStep === 3) return <StepShell><PhotoUploader value={catalogItemForm.photoUrl} onChange={(url) => handleCatalogChange('photoUrl', url)} /></StepShell>;
    return (
      <StepShell>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-stone-50 border border-[#E5DFD8] rounded p-4"><h4 className="font-display text-lg text-stone-900 mb-3">Listing Identity</h4><ReviewRow label="Source Batch" value={selectedCatalogBatch?.batchNumber} /><ReviewRow label="Source Product" value={selectedCatalogProduct ? `${selectedCatalogProduct.brand} ${selectedCatalogProduct.name}` : ''} /><ReviewRow label="Listing" value={`${catalogItemForm.brand} ${catalogItemForm.name}`} /><ReviewRow label="Category" value={catalogItemForm.cat} /><ReviewRow label="Condition" value={catalogItemForm.condition} /></div>
          <div className="bg-stone-50 border border-[#E5DFD8] rounded p-4"><h4 className="font-display text-lg text-stone-900 mb-3">Pricing</h4><ReviewRow label="Retail Price" value={`$${Number(catalogItemForm.price || 0).toLocaleString()}`} /><ReviewRow label="MSRP" value={catalogItemForm.orig ? `$${Number(catalogItemForm.orig).toLocaleString()}` : '—'} /><ReviewRow label="Quantity" value={catalogItemForm.quantity} /><ReviewRow label="Margin" value={retailMarginDetails ? `${retailMarginDetails.marginPercent}%` : '—'} /></div>
        </div>
      </StepShell>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className="flex border-b border-stone-200 mb-8 max-w-xl">
        <button onClick={() => handleTabChange('batch')} className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'batch' ? 'border-[#C9A84C] text-stone-900 font-semibold' : 'border-transparent text-stone-500 hover:text-stone-700'}`}><Archive size={16} />Register Wholesale Batch</button>
        <button onClick={() => handleTabChange('catalog')} className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'catalog' ? 'border-[#C9A84C] text-stone-900 font-semibold' : 'border-transparent text-stone-500 hover:text-stone-700'}`}><Tag size={16} />Create Storefront Catalog Item</button>
      </div>

      {activeTab === 'batch' ? (
        <div>
          <div className={styles.pageHeader}><h2 className={styles.heading}>Register Wholesale Purchase & Batch</h2><p className={styles.sub}>Log luxury acquisitions into independent cost-tracked batches. Automatically calculates landed cost values and wholesale metrics.</p></div>
          {saved && <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-3 rounded-lg border border-emerald-200 flex items-center gap-2 mb-6" role="status"><CheckCircle size={16} className="text-emerald-700" /><span>Purchase batch successfully created and logged to your ledgers!</span></div>}
          <form onSubmit={handleWholesaleSubmit}>{renderBatchStep()}<WizardFooter /></form>
        </div>
      ) : (
        <div>
          <div className={styles.pageHeader}><h2 className={styles.heading}>Publish Storefront Catalog Item</h2><p className={styles.sub}>Create a customer-facing listing from an existing acquisition batch while preserving batch-level cost and margin tracking.</p></div>
          {catalogSaved && <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-3 rounded-lg border border-emerald-200 flex items-center gap-2 mb-6" role="status"><CheckCircle size={16} className="text-emerald-700" /><span>Catalog item successfully published to the storefront.</span></div>}
          {activeBatches.length === 0 ? (
            <div className="bg-amber-50 text-amber-800 text-xs px-4 py-3 rounded-lg border border-amber-200 flex items-start gap-2"><HelpCircle size={16} className="text-amber-700 mt-0.5" /><span>No active acquisition batches are available. Register a wholesale batch before publishing a storefront item.</span></div>
          ) : (
            <form onSubmit={handleRetailSubmit}>{renderCatalogStep()}<WizardFooter isSubmitDisabled={!catalogItemForm.batchId} /></form>
          )}
        </div>
      )}
    </div>
  );
}
