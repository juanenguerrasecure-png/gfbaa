import { useState, useMemo } from 'react';
import { PlusCircle, CheckCircle, HelpCircle, DollarSign, Tag, Archive, Percent } from 'lucide-react';
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

export function AddItemTab() {
  const { products, addProduct, batches, addBatch, exchangeRate, addCatalogItem } = useStore();
  
  const [activeTab, setActiveTab] = useState('batch'); // 'batch' | 'catalog'
  const [currentStep, setCurrentStep] = useState(1);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentStep(1);
    setErrors({});
    setCatalogErrors({});
  };

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

  const activeBatches = useMemo(() => {
    return batches.filter(b => b.remainingQty > 0);
  }, [batches]);

  const handleProductChange = (k, v) => {
    setProductForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const handleBatchChange = (k, v) => {
    setBatchForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const handleCatalogChange = (k, v) => {
    setCatalogItemForm((prev) => ({ ...prev, [k]: v }));
    setCatalogErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const handleNextStep = () => {
    if (activeTab === 'batch') {
      if (currentStep === 1) {
        const e = {};
        if (isCreatingNewProduct) {
          if (!productForm.name.trim()) e.name = 'Product name is required';
          if (!productForm.brand.trim()) e.brand = 'Brand name is required';
        } else {
          if (batchForm.productId === 'new') e.productId = 'Select a product';
        }
        if (Object.keys(e).length) {
          setErrors(e);
          return;
        }
      } else if (currentStep === 2) {
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
      } else if (currentStep === 2) {
        const e = {};
        if (!catalogItemForm.price || Number(catalogItemForm.price) <= 0) e.price = 'Valid listing price is required';
        const qty = Number(catalogItemForm.quantity);
        if (!catalogItemForm.quantity || isNaN(qty) || qty <= 0) {
          e.quantity = 'Quantity must be at least 1';
        } else {
          const batch = batches.find(b => b.id === catalogItemForm.batchId);
          if (batch) {
            const remainingBatchStock = batch.remainingQty;
            if (qty > remainingBatchStock) {
              e.quantity = `Quantity cannot exceed remaining batch stock (${remainingBatchStock})`;
            }
          }
        }
        if (Object.keys(e).length) {
          setCatalogErrors(e);
          return;
        }
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleCatalogBatchSelect = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) {
      setCatalogItemForm(DEFAULT_CATALOG_ITEM);
      return;
    }
    const product = products.find(p => p.id === batch.productId);
    setCatalogItemForm({
      batchId: batchId,
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

    let pCostUSD = rawCost;
    let sCostUSD = rawShipping;
    let tCostUSD = rawTariff;

    if (isPhp) {
      pCostUSD = Math.round((rawCost / rate) * 100) / 100;
      sCostUSD = Math.round((rawShipping / rate) * 100) / 100;
      tCostUSD = Math.round((rawTariff / rate) * 100) / 100;
    }

    const totalCostUSD = pCostUSD + sCostUSD + tCostUSD;
    const costPerItemUSD = qty > 0 ? Math.round((totalCostUSD / qty) * 100) / 100 : 0;

    return {
      productCostUSD: pCostUSD,
      shippingUSD: sCostUSD,
      tariffUSD: tCostUSD,
      totalCostUSD,
      costPerItemUSD,
    };
  }, [batchForm.productCost, batchForm.shipping, batchForm.tariff, batchForm.quantity, batchForm.enteredInPhp, exchangeRate]);

  // Live Retail Margin Calculations
  const retailMarginDetails = useMemo(() => {
    const batch = batches.find(b => b.id === catalogItemForm.batchId);
    if (!batch) return null;

    const retailPrice = Number(catalogItemForm.price) || 0;
    const profitUSD = retailPrice > 0 ? Math.round((retailPrice - batch.costPerItem) * 100) / 100 : 0;
    const marginPercent = retailPrice > 0 ? Math.round((profitUSD / retailPrice) * 100) : 0;

    return {
      costPerItem: batch.costPerItem,
      remainingQty: batch.remainingQty,
      profitUSD,
      marginPercent,
      isLoss: profitUSD < 0
    };
  }, [batches, catalogItemForm.batchId, catalogItemForm.price]);

  // Wholesale Validate
  const validateWholesale = () => {
    const e = {};
    if (isCreatingNewProduct) {
      if (!productForm.name.trim()) e.name = 'Product name is required';
      if (!productForm.brand.trim()) e.brand = 'Brand name is required';
    } else {
      if (batchForm.productId === 'new') e.productId = 'Select a product';
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
      if (batch) {
        const remainingBatchStock = batch.remainingQty;
        if (qty > remainingBatchStock) {
          e.quantity = `Quantity cannot exceed remaining batch stock (${remainingBatchStock})`;
        }
      }
    }
    return e;
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
      const newProduct = addProduct({
        ...productForm,
        price: Number(productForm.price) || 0,
      });
      targetProductId = newProduct.id;
    }

    // Add the new batch
    addBatch({
      ...batchForm,
      productId: targetProductId,
      batchNumber: batchForm.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
    });

    setSaved(true);
    setCurrentStep(1);
    // Reset forms
    setProductForm(DEFAULT_PRODUCT);
    setBatchForm(() => ({
      ...DEFAULT_BATCH,
      productId: 'new',
    }));
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

  return (
    <div className={styles.wrap}>
      {/* Sub-Tab Selector */}
      <div className="flex border-b border-stone-200 mb-8 max-w-xl">
        <button
          onClick={() => handleTabChange('batch')}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === 'batch'
              ? 'border-amber-600 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Archive size={16} />
          Register Wholesale Batch
        </button>
        <button
          onClick={() => handleTabChange('catalog')}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-amber-600 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Tag size={16} />
          Create Storefront Catalog Item
        </button>
      </div>

      {activeTab === 'batch' ? (
        // --- Wholesale Batch View ---
        <div>
          <div className={styles.pageHeader}>
            <h2 className={styles.heading}>Register Wholesale Purchase & Batch</h2>
            <p className={styles.sub}>
              Log luxury acquisitions into independent cost-tracked batches. Automatically calculates land cost values and wholesale metrics.
            </p>
          </div>

          {saved && (
            <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-3 rounded-lg border border-emerald-200 flex items-center gap-2 mb-6" role="status">
              <CheckCircle size={16} className="text-emerald-700" />
              <span>Purchase batch successfully created and logged to your ledgers!</span>
            </div>
          )}

          <form onSubmit={handleWholesaleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                
                {/* Step 1: Item Identity */}
                {currentStep === 1 && (
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 animate-fade-in">
                    <h3 className="font-display text-lg text-stone-900 border-b border-stone-100 pb-2">Step 1: Item Identity</h3>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className={styles.label} htmlFor="productId">Product Model Reference</label>
                      <select
                        id="productId"
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded font-body text-sm text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
                        value={batchForm.productId}
                        onChange={(e) => handleBatchChange('productId', e.target.value)}
                      >
                        <option value="new">🆕 Create a new luxury product brand/model...</option>
                        <optgroup label="Select Existing Model">
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.brand} — {p.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {isCreatingNewProduct && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                        <div className="flex flex-col gap-1">
                          <label className={styles.label} htmlFor="prod_name">Product Model Name *</label>
                          <input
                            id="prod_name"
                            type="text"
                            className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                            placeholder="e.g. Classic Flap Medium"
                            value={productForm.name}
                            onChange={(e) => handleProductChange('name', e.target.value)}
                          />
                          {errors.name && <span className="text-[10px] text-red-600 font-semibold">{errors.name}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={styles.label} htmlFor="prod_brand">Brand / Designer *</label>
                          <input
                            id="prod_brand"
                            type="text"
                            className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                            placeholder="e.g. Chanel"
                            value={productForm.brand}
                            onChange={(e) => handleProductChange('brand', e.target.value)}
                          />
                          {errors.brand && <span className="text-[10px] text-red-600 font-semibold">{errors.brand}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={styles.label} htmlFor="prod_cat">Category</label>
                          <select
                            id="prod_cat"
                            className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                            value={productForm.cat}
                            onChange={(e) => handleProductChange('cat', e.target.value)}
                          >
                            <option value="bags">Handbags & Accessories</option>
                            <option value="jewelry">Fine Jewelry & Watches</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={styles.label} htmlFor="prod_emoji">Emoji Icon</label>
                          <input
                            id="prod_emoji"
                            type="text"
                            className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                            placeholder="e.g. 👜, 👛, 💍, 💎"
                            value={productForm.emoji}
                            onChange={(e) => handleProductChange('emoji', e.target.value)}
                          />
                        </div>

                        <div className="sm:col-span-2 flex flex-col gap-1">
                          <label className={styles.label} htmlFor="prod_detail">Detailed Description</label>
                          <textarea
                            id="prod_detail"
                            className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500 min-h-[60px]"
                            placeholder="e.g. Caviar leather with gold-tone metal hardware"
                            value={productForm.detail}
                            onChange={(e) => handleProductChange('detail', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1 pt-4 border-t border-stone-100">
                      <label className={styles.label} htmlFor="batchCond">Batch Quality Condition</label>
                      <select
                        id="batchCond"
                        className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                        value={batchForm.condition}
                        onChange={(e) => handleBatchChange('condition', e.target.value)}
                      >
                        <option value="new">Brand New</option>
                        <option value="mint">Mint (Like New)</option>
                        <option value="good">Very Good</option>
                        <option value="fair">Fair (Some Wear)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Pricing */}
                {currentStep === 2 && (
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <h3 className="font-display text-lg text-stone-900">Step 2: Logistics & Pricing</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-medium">Input Currency:</span>
                        <button
                          type="button"
                          onClick={() => handleBatchChange('enteredInPhp', false)}
                          className={`px-2 py-1 text-[11px] rounded font-semibold border ${
                            !batchForm.enteredInPhp
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          USD ($)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBatchChange('enteredInPhp', true)}
                          className={`px-2 py-1 text-[11px] rounded font-semibold border ${
                            batchForm.enteredInPhp
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          PHP (₱)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className={styles.label} htmlFor="batchNo">Acquisition Batch Reference #</label>
                        <input
                          id="batchNo"
                          type="text"
                          className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                          placeholder="e.g. CHAN-MAY-2024 (Auto-generated)"
                          value={batchForm.batchNumber}
                          onChange={(e) => handleBatchChange('batchNumber', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={styles.label} htmlFor="batchDate">Acquisition Date</label>
                        <input
                          id="batchDate"
                          type="date"
                          className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                          value={batchForm.date}
                          onChange={(e) => handleBatchChange('date', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={styles.label} htmlFor="quantity">Quantity Purchased (Wholesale) *</label>
                        <input
                          id="quantity"
                          type="number"
                          className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                          placeholder="e.g. 10"
                          value={batchForm.quantity}
                          onChange={(e) => handleBatchChange('quantity', e.target.value)}
                        />
                        {errors.quantity && <span className="text-[10px] text-red-600 font-semibold">{errors.quantity}</span>}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={styles.label} htmlFor="productCost">
                          Raw Wholesale Cost ({batchForm.enteredInPhp ? '₱' : '$'}) *
                        </label>
                        <input
                          id="productCost"
                          type="number"
                          className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                          placeholder={batchForm.enteredInPhp ? "e.g. 150000" : "e.g. 2500"}
                          value={batchForm.productCost}
                          onChange={(e) => handleBatchChange('productCost', e.target.value)}
                        />
                        {errors.productCost && <span className="text-[10px] text-red-600 font-semibold">{errors.productCost}</span>}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={styles.label} htmlFor="shipping">
                          Shipping / Air Freight ({batchForm.enteredInPhp ? '₱' : '$'})
                        </label>
                        <input
                          id="shipping"
                          type="number"
                          className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                          placeholder={batchForm.enteredInPhp ? "e.g. 5800" : "e.g. 100"}
                          value={batchForm.shipping}
                          onChange={(e) => handleBatchChange('shipping', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={styles.label} htmlFor="tariff">
                          Duties / Tariffs / Taxes ({batchForm.enteredInPhp ? '₱' : '$'})
                        </label>
                        <input
                          id="tariff"
                          type="number"
                          className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                          placeholder={batchForm.enteredInPhp ? "e.g. 2900" : "e.g. 50"}
                          value={batchForm.tariff}
                          onChange={(e) => handleBatchChange('tariff', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Photos */}
                {currentStep === 3 && (
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 animate-fade-in">
                    <h3 className="font-display text-lg text-stone-900 border-b border-stone-100 pb-2">Step 3: Upload Product Photo</h3>
                    <p className="text-xs text-stone-500">Provide an elegant image representing this batch or product model model.</p>
                    <PhotoUploader
                      value={productForm.photoUrl || ''}
                      onChange={(url) => handleProductChange('photoUrl', url)}
                    />
                  </div>
                )}

                {/* Step 4: Review + Submit */}
                {currentStep === 4 && (
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 animate-fade-in">
                    <h3 className="font-display text-lg text-stone-900 border-b border-stone-100 pb-2">Step 4: Review & Submit</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <h4 className="font-bold text-stone-800 uppercase text-xs tracking-wider">Item Identity</h4>
                        <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-1 text-xs">
                          <div><strong>Model Type:</strong> {isCreatingNewProduct ? '🆕 Create New Product' : 'Selected Existing Product'}</div>
                          {isCreatingNewProduct ? (
                            <>
                              <div><strong>Brand:</strong> {productForm.brand || '—'}</div>
                              <div><strong>Model Name:</strong> {productForm.name || '—'}</div>
                              <div><strong>Category:</strong> {productForm.cat === 'bags' ? 'Bags' : 'Jewelry'}</div>
                            </>
                          ) : (
                            <div>
                              <strong>Model:</strong> {products.find(p => p.id === Number(batchForm.productId))?.brand} — {products.find(p => p.id === Number(batchForm.productId))?.name}
                            </div>
                          )}
                          <div><strong>Quality Condition:</strong> <span className="uppercase">{batchForm.condition}</span></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-stone-800 uppercase text-xs tracking-wider">Acquisition Details</h4>
                        <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-1 text-xs">
                          <div><strong>Batch Reference #:</strong> {batchForm.batchNumber || 'Auto-generated'}</div>
                          <div><strong>Acquisition Date:</strong> {batchForm.date}</div>
                          <div><strong>Quantity:</strong> {batchForm.quantity} units</div>
                          <div><strong>Raw Wholesale Cost:</strong> {batchForm.enteredInPhp ? `₱${Number(batchForm.productCost).toLocaleString()}` : `$${Number(batchForm.productCost).toLocaleString()}`}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column (Ledger / Margin Info) */}
              <div className="space-y-6">
                <div className="bg-stone-900 text-stone-100 p-6 rounded-lg border border-stone-950 shadow-md space-y-4 sticky top-6">
                  <h3 className="font-display text-lg text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
                    <DollarSign size={18} />
                    Batch Ledger Summary
                  </h3>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-stone-800 pb-2">
                      <span className="text-stone-400">Entry Currency:</span>
                      <span className="text-white font-semibold">{batchForm.enteredInPhp ? 'PHP (₱)' : 'USD ($)'}</span>
                    </div>

                    {batchForm.enteredInPhp && (
                      <>
                        <div className="flex justify-between text-stone-400 text-[11px]">
                          <span>Wholesale PHP:</span>
                          <span>₱{(Number(batchForm.productCost) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-stone-400 text-[11px]">
                          <span>Shipping PHP:</span>
                          <span>₱{(Number(batchForm.shipping) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-stone-400 text-[11px] border-b border-stone-800 pb-2">
                          <span>Duties PHP:</span>
                          <span>₱{(Number(batchForm.tariff) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-stone-400 text-[11px] border-b border-stone-800 pb-2">
                          <span>Exchange Rate:</span>
                          <span>1 USD = {exchangeRate} PHP</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-stone-300 pt-1">
                      <span>Wholesale Cost (USD):</span>
                      <span className="text-stone-100">${convertedValues.productCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between text-stone-300">
                      <span>Shipping Cost (USD):</span>
                      <span className="text-stone-100">${convertedValues.shippingUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between text-stone-300 border-b border-stone-800 pb-3">
                      <span>Duties/Tariffs (USD):</span>
                      <span className="text-stone-100">${convertedValues.tariffUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between text-amber-300 text-sm font-semibold pt-2">
                      <span>Total Batch Cost:</span>
                      <span>${convertedValues.totalCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between text-stone-300 text-xs">
                      <span>Batch Size:</span>
                      <span className="text-stone-100">{batchForm.quantity || 0} units</span>
                    </div>

                    <div className="flex justify-between text-emerald-400 text-base font-bold border-t border-stone-800 pt-3">
                      <span>Land Cost Per Item:</span>
                      <span>${convertedValues.costPerItemUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer for Wholesale Wizard */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-stone-200 py-4 px-6 mt-10 z-30 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] flex items-center justify-between rounded-lg">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      currentStep === step
                        ? 'bg-amber-600 scale-125'
                        : currentStep > step
                        ? 'bg-stone-800'
                        : 'bg-stone-200'
                    }`}
                  />
                ))}
                <span className="text-xs text-stone-500 font-mono ml-2">Step {currentStep} of 4</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-50 rounded text-xs text-stone-600 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Back
                </button>
                
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-900 rounded text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle size={14} />
                    Log Purchase & Batch
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        // --- Catalog Creation View ---
        <div>
          <div className={styles.pageHeader}>
            <h2 className={styles.heading}>Manually Create Storefront Catalog Listing</h2>
            <p className={styles.sub}>
              Identify which wholesale purchase batch a storefront listing comes from, define its custom pricing, and customize design descriptions.
            </p>
          </div>

          {catalogSaved && (
            <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-3 rounded-lg border border-emerald-200 flex items-center gap-2 mb-6" role="status">
              <CheckCircle size={16} className="text-emerald-700" />
              <span>Catalog listing successfully published to the storefront! Stock will auto-deplete from its batch.</span>
            </div>
          )}

          {activeBatches.length === 0 ? (
            <div className="bg-amber-50 text-amber-900 rounded-lg p-8 border border-amber-200 text-center space-y-3">
              <Archive className="mx-auto text-amber-600" size={36} />
              <h3 className="font-semibold font-display text-lg">No Active Batches Available</h3>
              <p className="text-sm max-w-md mx-auto">
                Before listing items for sale on the storefront, you must first register an acquisition batch in the other tab to establish inventory and land costs.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('batch')}
                className="px-4 py-2 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition-all cursor-pointer"
              >
                Go Register Batch
              </button>
            </div>
          ) : (
            <form onSubmit={handleRetailSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Step 1: Identity */}
                  {currentStep === 1 && (
                    <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 animate-fade-in">
                      <h3 className="font-display text-lg text-stone-900 border-b border-stone-100 pb-2">Step 1: Listing Identity</h3>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className={styles.label} htmlFor="catalogBatch">Target Purchase Batch *</label>
                        <select
                          id="catalogBatch"
                          className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded font-body text-sm text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
                          value={catalogItemForm.batchId}
                          onChange={(e) => handleCatalogBatchSelect(e.target.value)}
                        >
                          <option value="">-- Choose active purchase batch with stock --</option>
                          {activeBatches.map((b) => {
                            const product = products.find(p => p.id === b.productId);
                            return (
                              <option key={b.id} value={b.id}>
                                {b.batchNumber} — {product ? `${product.brand} ${product.name}` : 'Unknown'} ({b.remainingQty} available — cost ${b.costPerItem}/ea)
                              </option>
                            );
                          })}
                        </select>
                        {catalogErrors.batchId && <span className="text-[10px] text-red-600 font-semibold">{catalogErrors.batchId}</span>}
                      </div>

                      {catalogItemForm.batchId && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                          <div className="flex flex-col gap-1">
                            <label className={styles.label} htmlFor="cat_name">Listing Display Name *</label>
                            <input
                              id="cat_name"
                              type="text"
                              className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                              placeholder="e.g. Chanel Boy Bag Metallic Gold"
                              value={catalogItemForm.name}
                              onChange={(e) => handleCatalogChange('name', e.target.value)}
                            />
                            {catalogErrors.name && <span className="text-[10px] text-red-600 font-semibold">{catalogErrors.name}</span>}
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className={styles.label} htmlFor="cat_brand">Brand Display *</label>
                            <input
                              id="cat_brand"
                              type="text"
                              className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                              value={catalogItemForm.brand}
                              onChange={(e) => handleCatalogChange('brand', e.target.value)}
                            />
                            {catalogErrors.brand && <span className="text-[10px] text-red-600 font-semibold">{catalogErrors.brand}</span>}
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className={styles.label} htmlFor="cat_category">Store Category</label>
                            <select
                              id="cat_category"
                              className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                              value={catalogItemForm.cat}
                              onChange={(e) => handleCatalogChange('cat', e.target.value)}
                            >
                              <option value="bags">Handbags & Accessories</option>
                              <option value="jewelry">Fine Jewelry & Watches</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className={styles.label} htmlFor="cat_emoji">Display Emoji Icon</label>
                            <input
                              id="cat_emoji"
                              type="text"
                              className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                              placeholder="e.g. 👜, 💍"
                              value={catalogItemForm.emoji}
                              onChange={(e) => handleCatalogChange('emoji', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className={styles.label} htmlFor="cat_condition">Item Quality Condition</label>
                            <select
                              id="cat_condition"
                              className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                              value={catalogItemForm.condition}
                              onChange={(e) => handleCatalogChange('condition', e.target.value)}
                            >
                              <option value="new">Brand New</option>
                              <option value="mint">Mint (Like New)</option>
                              <option value="good">Very Good</option>
                              <option value="fair">Fair (Some Wear)</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2 flex flex-col gap-1">
                            <label className={styles.label} htmlFor="cat_detail">Public Listing Details</label>
                            <textarea
                              id="cat_detail"
                              className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500 min-h-[80px]"
                              placeholder="e.g. Hand-picked directly from European distributors."
                              value={catalogItemForm.detail}
                              onChange={(e) => handleCatalogChange('detail', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Pricing */}
                  {currentStep === 2 && (
                    <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 animate-fade-in">
                      <h3 className="font-display text-lg text-stone-900 border-b border-stone-100 pb-2">Step 2: Listing Pricing</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className={styles.label} htmlFor="cat_price">Retail Store Selling Price (USD) *</label>
                          <input
                            id="cat_price"
                            type="number"
                            className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                            placeholder="e.g. 5000"
                            value={catalogItemForm.price}
                            onChange={(e) => handleCatalogChange('price', e.target.value)}
                          />
                          {catalogErrors.price && <span className="text-[10px] text-red-600 font-semibold">{catalogErrors.price}</span>}
                          {catalogItemForm.price && (
                            <span className="text-[10px] text-stone-500 font-mono mt-0.5">
                              PHP Equivalent: ₱{(Number(catalogItemForm.price) * (Number(exchangeRate) || 58.0)).toLocaleString()} (Rate: 1 USD = {exchangeRate} PHP)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={styles.label} htmlFor="cat_quantity">Listing Stock Quantity *</label>
                          <input
                            id="cat_quantity"
                            type="number"
                            className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                            placeholder="e.g. 1"
                            value={catalogItemForm.quantity}
                            onChange={(e) => handleCatalogChange('quantity', e.target.value)}
                          />
                          {catalogErrors.quantity && <span className="text-[10px] text-red-600 font-semibold">{catalogErrors.quantity}</span>}
                          <span className="text-[10px] text-stone-500 italic">e.g. 1 if this is a single individual item from the mixed bag batch.</span>
                        </div>

                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className={styles.label} htmlFor="cat_orig">Comparison / Original Retail MSRP (USD) [Optional]</label>
                          <input
                            id="cat_orig"
                            type="number"
                            className="w-full p-2 bg-white border border-stone-300 rounded text-sm text-stone-800 outline-none focus:border-amber-500"
                            placeholder="e.g. 6800"
                            value={catalogItemForm.orig}
                            onChange={(e) => handleCatalogChange('orig', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Photos */}
                  {currentStep === 3 && (
                    <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 animate-fade-in">
                      <h3 className="font-display text-lg text-stone-900 border-b border-stone-100 pb-2">Step 3: Upload Listing Photo</h3>
                      <p className="text-xs text-stone-500">Provide an elegant editorial image for the public storefront catalog listing.</p>
                      <PhotoUploader
                        value={catalogItemForm.photoUrl}
                        onChange={(url) => handleCatalogChange('photoUrl', url)}
                      />
                    </div>
                  )}

                  {/* Step 4: Review + Submit */}
                  {currentStep === 4 && (
                    <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 animate-fade-in">
                      <h3 className="font-display text-lg text-stone-900 border-b border-stone-100 pb-2">Step 4: Review & Publish Listing</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-bold text-stone-800 uppercase text-xs tracking-wider">Listing Details</h4>
                          <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-1 text-xs">
                            <div><strong>Display Name:</strong> {catalogItemForm.name}</div>
                            <div><strong>Brand Display:</strong> {catalogItemForm.brand}</div>
                            <div><strong>Category:</strong> {catalogItemForm.cat === 'bags' ? 'Bags' : 'Jewelry'}</div>
                            <div><strong>Condition:</strong> <span className="uppercase">{catalogItemForm.condition}</span></div>
                            <div><strong>Emoji:</strong> {catalogItemForm.emoji}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-stone-800 uppercase text-xs tracking-wider">Pricing details</h4>
                          <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-1 text-xs">
                            <div><strong>USD Selling Price:</strong> ${Number(catalogItemForm.price).toLocaleString()}</div>
                            <div><strong>PHP Equivalent:</strong> ₱{(Number(catalogItemForm.price) * (Number(exchangeRate) || 58.0)).toLocaleString()}</div>
                            <div><strong>Listing Qty:</strong> {catalogItemForm.quantity}</div>
                            {catalogItemForm.orig && <div><strong>Original MSRP:</strong> ${Number(catalogItemForm.orig).toLocaleString()}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column Retail Profit Estimator */}
                <div className="space-y-6">
                  <div className="bg-stone-900 text-stone-100 p-6 rounded-lg border border-stone-950 shadow-md space-y-4 sticky top-6">
                    <h3 className="font-display text-lg text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
                      <Percent size={18} />
                      Retail Margin Estimator
                    </h3>

                    {retailMarginDetails ? (
                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex justify-between border-b border-stone-800 pb-2">
                          <span className="text-stone-400">Selected Source:</span>
                          <span className="text-white font-semibold">Batch Remaining ({retailMarginDetails.remainingQty})</span>
                        </div>

                        <div className="flex justify-between pt-1">
                          <span>Batch Unit Cost:</span>
                          <span className="text-stone-100">${retailMarginDetails.costPerItem.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between border-b border-stone-800 pb-3">
                          <span>Proposed Price:</span>
                          <span className="text-stone-100">${(Number(catalogItemForm.price) || 0).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between font-bold text-sm pt-2">
                          <span>Estimated Profit/unit:</span>
                          <span className={retailMarginDetails.isLoss ? 'text-red-400' : 'text-emerald-400'}>
                            ${retailMarginDetails.profitUSD.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between text-xs border-t border-stone-800 pt-3">
                          <span>Projected Margin:</span>
                          <span className={`font-bold ${retailMarginDetails.isLoss ? 'text-red-400' : 'text-emerald-400'}`}>
                            {retailMarginDetails.marginPercent}%
                          </span>
                        </div>

                        <div className="text-[10px] text-stone-400 font-sans italic pt-2 leading-relaxed space-y-1">
                          <div>* Stores automatically deduct matching batch numbers during client checkout, tracking ROI instantly.</div>
                          <div className="text-amber-400 font-semibold mt-1">
                            * Selling 1 unit of this item records a COGS of ${retailMarginDetails.costPerItem.toFixed(2)} based on the overall cost of the selected purchase batch.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400 font-sans text-center py-8 italic">
                        Select an acquisition batch to see retail pricing analytics and profit projections.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer for Catalog Wizard */}
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-stone-200 py-4 px-6 mt-10 z-30 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] flex items-center justify-between rounded-lg">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        currentStep === step
                          ? 'bg-amber-600 scale-125'
                          : currentStep > step
                          ? 'bg-stone-800'
                          : 'bg-stone-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-stone-500 font-mono ml-2">Step {currentStep} of 4</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                    disabled={currentStep === 1}
                    className="px-4 py-2 border border-stone-300 hover:bg-stone-50 rounded text-xs text-stone-600 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Back
                  </button>
                  
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!catalogItemForm.batchId}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-900 rounded text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusCircle size={14} />
                      Publish Catalog Item
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
