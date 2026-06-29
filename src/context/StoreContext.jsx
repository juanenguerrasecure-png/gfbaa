import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const StoreContext = createContext(null);
const DEFAULT_EXCHANGE_RATE = 58.0;
const DEFAULT_PAYMENT_METHODS = { zelle: { handle: '', instructions: '', qrUrl: '' }, venmo: { handle: '', instructions: '', qrUrl: '' } };
const DEFAULT_HERO_IMAGE = { url: '', alt: 'Good Finds by AA Featured Collection' };

function clearExpiredSession() {
  localStorage.removeItem('gf_is_admin');
  localStorage.removeItem('gf_current_user');
  localStorage.removeItem('gf_session_token');
  localStorage.removeItem('gf_session_expires_at');
  window.dispatchEvent(new Event('gf-auth-expired'));
}

function getActiveSessionToken() {
  const token = localStorage.getItem('gf_session_token') || '';
  const expiresAt = localStorage.getItem('gf_session_expires_at') || '';
  if (!token) return '';
  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt);
    if (Number.isFinite(expiresMs) && expiresMs <= Date.now()) {
      clearExpiredSession();
      return '';
    }
  }
  return token;
}

function hasActiveSession() {
  return Boolean(getActiveSessionToken());
}

function getAuthHeaders(extra = {}) {
  const token = getActiveSessionToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

function normalizePaymentMethods(value) {
  return { zelle: { ...DEFAULT_PAYMENT_METHODS.zelle, ...(value?.zelle || {}) }, venmo: { ...DEFAULT_PAYMENT_METHODS.venmo, ...(value?.venmo || {}) } };
}

function normalizeHeroImage(value) {
  if (!value || typeof value !== 'object') return DEFAULT_HERO_IMAGE;
  return { url: String(value.url || '').trim(), alt: String(value.alt || DEFAULT_HERO_IMAGE.alt).trim() || DEFAULT_HERO_IMAGE.alt };
}

export function StoreProvider({ children }) {
  const readLocalJson = (key, fallback) => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback; } catch (_error) { return fallback; }
  };
  const readLocalNumber = (key, fallback) => {
    const saved = localStorage.getItem(key);
    const value = saved ? Number(saved) : fallback;
    return Number.isFinite(value) ? value : fallback;
  };

  const [exchangeRate, setExchangeRate] = useState(() => readLocalNumber('gf_exchange_rate', DEFAULT_EXCHANGE_RATE));
  const [products, setProducts] = useState(() => readLocalJson('gf_products', []));
  const [batches, setBatches] = useState(() => readLocalJson('gf_batches', []));
  const [sales, setSales] = useState(() => readLocalJson('gf_sales', []));
  const [purchaseRequests, setPurchaseRequests] = useState(() => readLocalJson('gf_purchase_requests', []));
  const [catalogItems, setCatalogItems] = useState(() => readLocalJson('gf_catalog_items', []));
  const [socialLinks, setSocialLinks] = useState(() => readLocalJson('gf_social_links', {}));
  const [paymentMethods, setPaymentMethods] = useState(() => normalizePaymentMethods(readLocalJson('gf_payment_methods', DEFAULT_PAYMENT_METHODS)));
  const [heroImage, setHeroImage] = useState(() => normalizeHeroImage(readLocalJson('gf_hero_image', DEFAULT_HERO_IMAGE)));
  const [cloudReady, setCloudReady] = useState(false);

  const applyingRemoteRef = useRef(false);
  const saveTimerRef = useRef(null);
  const savingRef = useRef(false);
  const lastCloudUpdatedAtRef = useRef(localStorage.getItem('gf_cloud_updated_at') || '');
  const latestSnapshotRef = useRef(null);

  const buildSnapshot = useCallback(() => ({ exchangeRate, products, batches, sales, purchaseRequests, catalogItems, socialLinks, paymentMethods, heroImage }), [exchangeRate, products, batches, sales, purchaseRequests, catalogItems, socialLinks, paymentMethods, heroImage]);

  const snapshotHasRecords = (snapshot) => Boolean(snapshot?.products?.length || snapshot?.batches?.length || snapshot?.catalogItems?.length || snapshot?.sales?.length || snapshot?.purchaseRequests?.length);

  const writeLocalCache = useCallback((snapshot) => {
    localStorage.setItem('gf_exchange_rate', String(snapshot.exchangeRate ?? DEFAULT_EXCHANGE_RATE));
    localStorage.setItem('gf_products', JSON.stringify(snapshot.products || []));
    localStorage.setItem('gf_batches', JSON.stringify(snapshot.batches || []));
    localStorage.setItem('gf_sales', JSON.stringify(snapshot.sales || []));
    localStorage.setItem('gf_purchase_requests', JSON.stringify(snapshot.purchaseRequests || []));
    localStorage.setItem('gf_catalog_items', JSON.stringify(snapshot.catalogItems || []));
    localStorage.setItem('gf_social_links', JSON.stringify(snapshot.socialLinks || {}));
    localStorage.setItem('gf_payment_methods', JSON.stringify(normalizePaymentMethods(snapshot.paymentMethods)));
    localStorage.setItem('gf_hero_image', JSON.stringify(normalizeHeroImage(snapshot.heroImage)));
  }, []);

  const applySnapshot = useCallback((snapshot) => {
    applyingRemoteRef.current = true;
    setExchangeRate(Number(snapshot.exchangeRate) || DEFAULT_EXCHANGE_RATE);
    setProducts(Array.isArray(snapshot.products) ? snapshot.products : []);
    setBatches(Array.isArray(snapshot.batches) ? snapshot.batches : []);
    setSales(Array.isArray(snapshot.sales) ? snapshot.sales : []);
    setPurchaseRequests(Array.isArray(snapshot.purchaseRequests) ? snapshot.purchaseRequests : []);
    setCatalogItems(Array.isArray(snapshot.catalogItems) ? snapshot.catalogItems : []);
    setSocialLinks(snapshot.socialLinks && typeof snapshot.socialLinks === 'object' ? snapshot.socialLinks : {});
    setPaymentMethods(normalizePaymentMethods(snapshot.paymentMethods));
    setHeroImage(normalizeHeroImage(snapshot.heroImage));
    writeLocalCache(snapshot);
    window.setTimeout(() => { applyingRemoteRef.current = false; }, 0);
  }, [writeLocalCache]);

  const saveCloudState = useCallback(async (snapshot) => {
    if (!hasActiveSession()) {
      return { ok: false, authRequired: true, error: 'Admin session expired. Please log in again before syncing changes.' };
    }

    savingRef.current = true;
    try {
      const response = await fetch('/api/state', {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ state: snapshot }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        clearExpiredSession();
        return { ok: false, authRequired: true, error: 'Admin session expired. Please log in again before syncing changes.' };
      }
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to save cloud state.');
      if (result.updatedAt) {
        lastCloudUpdatedAtRef.current = result.updatedAt;
        localStorage.setItem('gf_cloud_updated_at', result.updatedAt);
      }
      return { ok: true, ...result };
    } catch (error) {
      console.warn('D1 sync save failed; local cache still updated:', error);
      return { ok: false, error: error?.message || 'Unable to save cloud state.' };
    } finally {
      savingRef.current = false;
    }
  }, []);

  const syncCurrentState = useCallback(async () => {
    const snapshot = latestSnapshotRef.current || buildSnapshot();
    writeLocalCache(snapshot);
    return saveCloudState(snapshot);
  }, [buildSnapshot, saveCloudState, writeLocalCache]);

  const loadCloudState = useCallback(async ({ force = false } = {}) => {
    if (savingRef.current && !force) return;
    try {
      const response = await fetch('/api/state', { method: 'GET' });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to load cloud state.');
      const localSnapshot = buildSnapshot();
      if (result.exists && result.state) {
        if (!snapshotHasRecords(result.state) && snapshotHasRecords(localSnapshot) && hasActiveSession()) {
          await saveCloudState(localSnapshot);
          return;
        }
        const incomingUpdatedAt = result.updatedAt || '';
        if (force || incomingUpdatedAt !== lastCloudUpdatedAtRef.current) {
          lastCloudUpdatedAtRef.current = incomingUpdatedAt;
          localStorage.setItem('gf_cloud_updated_at', incomingUpdatedAt);
          applySnapshot(result.state);
        }
      } else if (snapshotHasRecords(localSnapshot) && hasActiveSession()) {
        await saveCloudState(localSnapshot);
      }
    } catch (error) {
      console.warn('D1 sync load failed; using local cache:', error);
    } finally {
      setCloudReady(true);
    }
  }, [applySnapshot, buildSnapshot, saveCloudState]);

  useEffect(() => { latestSnapshotRef.current = buildSnapshot(); }, [buildSnapshot]);
  useEffect(() => { loadCloudState({ force: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { writeLocalCache(buildSnapshot()); }, [buildSnapshot, writeLocalCache]);

  useEffect(() => {
    if (!cloudReady || applyingRemoteRef.current) return;
    if (!hasActiveSession()) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const snapshot = buildSnapshot();
    saveTimerRef.current = setTimeout(() => { saveCloudState(snapshot); }, 600);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [cloudReady, buildSnapshot, saveCloudState]);

  useEffect(() => {
    if (!cloudReady) return;
    const refresh = () => loadCloudState({ force: false });
    const handleVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = window.setInterval(refresh, 15000);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', handleVisibility); window.clearInterval(intervalId); };
  }, [cloudReady, loadCloudState]);

  const saveSocialLinks = useCallback(async (nextSocialLinks) => {
    setSocialLinks(nextSocialLinks);
    const snapshot = { ...buildSnapshot(), socialLinks: nextSocialLinks };
    latestSnapshotRef.current = snapshot;
    writeLocalCache(snapshot);
    return saveCloudState(snapshot);
  }, [buildSnapshot, saveCloudState, writeLocalCache]);

  const savePaymentMethods = useCallback(async (nextPaymentMethods) => {
    const normalized = normalizePaymentMethods(nextPaymentMethods);
    setPaymentMethods(normalized);
    const snapshot = { ...buildSnapshot(), paymentMethods: normalized };
    latestSnapshotRef.current = snapshot;
    writeLocalCache(snapshot);
    return saveCloudState(snapshot);
  }, [buildSnapshot, saveCloudState, writeLocalCache]);

  const saveHeroImage = useCallback(async (nextHeroImage) => {
    const normalized = normalizeHeroImage(nextHeroImage);
    setHeroImage(normalized);
    const snapshot = { ...buildSnapshot(), heroImage: normalized };
    latestSnapshotRef.current = snapshot;
    writeLocalCache(snapshot);
    return saveCloudState(snapshot);
  }, [buildSnapshot, saveCloudState, writeLocalCache]);

  const syncAfterLocalChange = useCallback(async (snapshotOverride = null) => {
    const snapshot = snapshotOverride || latestSnapshotRef.current || buildSnapshot();
    latestSnapshotRef.current = snapshot;
    writeLocalCache(snapshot);
    return saveCloudState(snapshot);
  }, [buildSnapshot, saveCloudState, writeLocalCache]);

  const convertPhpToUsd = useCallback((phpAmount) => {
    if (!phpAmount || isNaN(Number(phpAmount))) return 0;
    return Math.round((Number(phpAmount) / exchangeRate) * 100) / 100;
  }, [exchangeRate]);

  const addProduct = useCallback((product) => {
    const newProduct = { ...product, id: Date.now(), price: Number(product.price) || 0, orig: product.orig ? Number(product.orig) : null, emoji: product.emoji || (product.cat === 'bags' ? 'bag' : 'ring'), photoUrl: product.photoUrl || null };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  }, []);
  const updateProduct = useCallback((id, updates) => setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p)), []);
  const deleteProduct = useCallback((id) => { setProducts(prev => prev.filter(p => p.id !== id)); setBatches(prev => prev.filter(b => b.productId !== id)); }, []);

  const addCatalogItem = useCallback((item) => {
    const qty = item.quantity !== undefined ? (Number(item.quantity) || 1) : 1;
    const newItem = { ...item, id: `cat-${Date.now()}`, price: Number(item.price) || 0, orig: item.orig ? Number(item.orig) : null, emoji: item.emoji || 'bag', photoUrl: item.photoUrl || null, quantity: qty, remainingQty: qty };
    setCatalogItems(prev => [newItem, ...prev]);
    return newItem;
  }, []);
  const updateCatalogItem = useCallback((id, updates) => setCatalogItems(prev => prev.map(item => item.id !== id ? item : { ...item, ...updates, ...(updates.quantity !== undefined ? { quantity: Number(updates.quantity) } : {}), ...(updates.remainingQty !== undefined ? { remainingQty: Number(updates.remainingQty) } : {}) })), []);
  const deleteCatalogItem = useCallback((id) => setCatalogItems(prev => prev.filter(item => item.id !== id)), []);

  const getCatalogItemStock = useCallback((catalogItemId) => {
    const item = catalogItems.find(c => String(c.id) === String(catalogItemId));
    if (!item) return 0;
    if (item.remainingQty !== undefined) return item.remainingQty;
    const batch = batches.find(b => b.id === item.batchId);
    return batch ? batch.remainingQty : 0;
  }, [batches, catalogItems]);

  const addBatch = useCallback((batchData) => {
    const qty = Number(batchData.quantity) || 1;
    let productCost = Number(batchData.productCost) || 0;
    let shipping = Number(batchData.shipping) || 0;
    let tariff = Number(batchData.tariff) || 0;
    if (batchData.enteredInPhp) { productCost = convertPhpToUsd(productCost); shipping = convertPhpToUsd(shipping); tariff = convertPhpToUsd(tariff); }
    const totalCost = productCost + shipping + tariff;
    const costPerItem = Math.round((totalCost / qty) * 100) / 100;
    const newBatch = { id: `batch-${Date.now()}`, productId: Number(batchData.productId), batchNumber: batchData.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`, date: batchData.date || new Date().toISOString().split('T')[0], quantity: qty, remainingQty: qty, productCost, shipping, tariff, totalCost, costPerItem, condition: batchData.condition || 'mint', exchangeRateUsed: exchangeRate, enteredInPhp: !!batchData.enteredInPhp };
    setBatches(prev => [newBatch, ...prev]);
    return newBatch;
  }, [exchangeRate, convertPhpToUsd]);
  const updateBatch = useCallback((id, updates) => setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b)), []);
  const deleteBatch = useCallback((id) => setBatches(prev => prev.filter(b => b.id !== id)), []);

  const recordSale = useCallback((saleDetails) => {
    const { buyer, date, items, selectionMethod } = saleDetails;
    let totalCogs = 0;
    let totalPrice = 0;
    const updatedBatches = [...batches];
    const updatedCatalogItems = [...catalogItems];
    const saleItemsSummary = [];
    for (const item of items) {
      const prodIdStr = String(item.productId);
      const requestedQty = Number(item.qty);
      const pricePerItem = Number(item.pricePerItem);
      const catalogItemObj = updatedCatalogItems.find(c => String(c.id) === prodIdStr);
      let productObj = catalogItemObj || products.find(p => p.id === Number(item.productId));
      let batchIdToDeduct = catalogItemObj?.batchId || null;
      if (!productObj) throw new Error('Item not found in catalog.');
      totalPrice += pricePerItem * requestedQty;
      const batchesDeducted = [];
      if (batchIdToDeduct) {
        const batchInState = updatedBatches.find(b => b.id === batchIdToDeduct);
        if (!batchInState) throw new Error(`Associated batch not found for catalog item "${productObj.name}".`);
        if (batchInState.remainingQty < requestedQty) throw new Error(`Insufficient stock in Batch "${batchInState.batchNumber}".`);
        if (catalogItemObj && catalogItemObj.remainingQty !== undefined) {
          if (catalogItemObj.remainingQty < requestedQty) throw new Error(`Insufficient stock for listing "${catalogItemObj.name}".`);
          catalogItemObj.remainingQty -= requestedQty;
        }
        batchInState.remainingQty -= requestedQty;
        totalCogs += requestedQty * batchInState.costPerItem;
        batchesDeducted.push({ batchId: batchInState.id, batchNumber: batchInState.batchNumber, qty: requestedQty, costPerItem: batchInState.costPerItem });
      } else {
        const numericProdId = Number(item.productId);
        const availableBatches = updatedBatches.filter(b => b.productId === numericProdId && b.remainingQty > 0).sort((a, b) => new Date(a.date) - new Date(b.date));
        const totalAvailable = availableBatches.reduce((sum, b) => sum + b.remainingQty, 0);
        if (totalAvailable < requestedQty) throw new Error(`Insufficient stock for "${productObj.name}".`);
        let remainingToDeduct = requestedQty;
        for (const batch of availableBatches) {
          if (remainingToDeduct <= 0) break;
          const batchInState = updatedBatches.find(b => b.id === batch.id);
          const deductAmount = Math.min(batchInState.remainingQty, remainingToDeduct);
          batchInState.remainingQty -= deductAmount;
          remainingToDeduct -= deductAmount;
          totalCogs += deductAmount * batchInState.costPerItem;
          batchesDeducted.push({ batchId: batchInState.id, batchNumber: batchInState.batchNumber, qty: deductAmount, costPerItem: batchInState.costPerItem });
        }
      }
      saleItemsSummary.push({ productId: item.productId, name: productObj.name, brand: productObj.brand, qty: requestedQty, pricePerItem, totalPrice: pricePerItem * requestedQty, batches: batchesDeducted });
    }
    setBatches(updatedBatches);
    setCatalogItems(updatedCatalogItems);
    const newSale = { id: `sale-${Date.now()}`, date: date || new Date().toISOString().split('T')[0], buyer: buyer || 'Walk-in customer', totalPrice, totalCogs: Math.round(totalCogs * 100) / 100, profit: Math.round((totalPrice - totalCogs) * 100) / 100, items: saleItemsSummary, selectionMethod: selectionMethod || 'Direct' };
    setSales(prev => [newSale, ...prev]);
    latestSnapshotRef.current = { ...buildSnapshot(), batches: updatedBatches, catalogItems: updatedCatalogItems, sales: [newSale, ...sales] };
    return newSale;
  }, [batches, products, catalogItems, buildSnapshot, sales]);

  const deleteSale = useCallback((saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    const updatedBatches = [...batches];
    const updatedCatalogItems = [...catalogItems];
    sale.items.forEach(item => {
      const catInState = updatedCatalogItems.find(c => String(c.id) === String(item.productId));
      if (catInState && catInState.remainingQty !== undefined) catInState.remainingQty += item.qty;
      item.batches.forEach(b => { const batchInState = updatedBatches.find(bs => bs.id === b.batchId); if (batchInState) batchInState.remainingQty += b.qty; });
    });
    const nextSales = sales.filter(s => s.id !== saleId);
    setBatches(updatedBatches); setCatalogItems(updatedCatalogItems); setSales(nextSales);
    latestSnapshotRef.current = { ...buildSnapshot(), batches: updatedBatches, catalogItems: updatedCatalogItems, sales: nextSales };
  }, [sales, batches, catalogItems, buildSnapshot]);

  const recordManualSale = useCallback((saleDetails) => {
    const { buyer, date, batchId, qty, pricePerItem } = saleDetails;
    const requestedQty = Number(qty);
    const price = Number(pricePerItem);
    if (!batchId) throw new Error('Please select a batch from inventory.');
    if (isNaN(requestedQty) || requestedQty <= 0) throw new Error('Quantity must be a positive number.');
    if (isNaN(price) || price < 0) throw new Error('Price cannot be negative.');
    const updatedBatches = [...batches];
    const updatedCatalogItems = [...catalogItems];
    const batchInState = updatedBatches.find(b => b.id === batchId);
    if (!batchInState) throw new Error('Selected batch was not found in inventory.');
    if (batchInState.remainingQty < requestedQty) throw new Error(`Insufficient stock in Batch "${batchInState.batchNumber}".`);
    const productObj = products.find(p => p.id === batchInState.productId);
    if (!productObj) throw new Error('Product specs not found for this batch.');
    batchInState.remainingQty -= requestedQty;
    updatedCatalogItems.forEach(c => { if (c.batchId === batchId && c.remainingQty !== undefined) c.remainingQty = Math.max(0, c.remainingQty - requestedQty); });
    const totalCogs = requestedQty * batchInState.costPerItem;
    const totalPrice = requestedQty * price;
    const newSale = { id: `sale-${Date.now()}`, date: date || new Date().toISOString().split('T')[0], buyer: buyer || 'Walk-in customer', totalPrice, totalCogs: Math.round(totalCogs * 100) / 100, profit: Math.round((totalPrice - totalCogs) * 100) / 100, items: [{ productId: batchInState.productId, name: productObj.name, brand: productObj.brand, qty: requestedQty, pricePerItem: price, totalPrice, batches: [{ batchId: batchInState.id, batchNumber: batchInState.batchNumber, qty: requestedQty, costPerItem: batchInState.costPerItem }] }], selectionMethod: 'Manual Batch Entry' };
    setBatches(updatedBatches); setCatalogItems(updatedCatalogItems); setSales(prev => [newSale, ...prev]);
    latestSnapshotRef.current = { ...buildSnapshot(), batches: updatedBatches, catalogItems: updatedCatalogItems, sales: [newSale, ...sales] };
    return newSale;
  }, [batches, products, catalogItems, buildSnapshot, sales]);

  const getProductStock = useCallback((productId) => batches.filter(b => b.productId === productId).reduce((sum, b) => sum + b.remainingQty, 0), [batches]);
  const inventoryValuation = batches.reduce((sum, b) => sum + (b.remainingQty * b.costPerItem), 0);

  const addPurchaseRequest = useCallback((requestData) => {
    const newRequest = { id: `req-${Date.now()}`, date: new Date().toISOString().split('T')[0], buyerName: requestData.buyerName, buyerEmail: requestData.buyerEmail, buyerAddress: requestData.buyerAddress, items: requestData.items, status: 'pending', shippingCost: null, specialInstructions: requestData.specialInstructions || '' };
    const nextRequests = [newRequest, ...purchaseRequests];
    setPurchaseRequests(nextRequests);
    latestSnapshotRef.current = { ...buildSnapshot(), purchaseRequests: nextRequests };
    return newRequest;
  }, [buildSnapshot, purchaseRequests]);
  const updatePurchaseRequest = useCallback((id, updates) => {
    const nextRequests = purchaseRequests.map(r => r.id === id ? { ...r, ...updates } : r);
    setPurchaseRequests(nextRequests);
    latestSnapshotRef.current = { ...buildSnapshot(), purchaseRequests: nextRequests };
  }, [buildSnapshot, purchaseRequests]);
  const deletePurchaseRequest = useCallback((id) => {
    const nextRequests = purchaseRequests.filter(r => r.id !== id);
    setPurchaseRequests(nextRequests);
    latestSnapshotRef.current = { ...buildSnapshot(), purchaseRequests: nextRequests };
  }, [buildSnapshot, purchaseRequests]);

  const clearMockData = useCallback(() => {
    const emptySnapshot = { exchangeRate, products: [], batches: [], sales: [], purchaseRequests: [], catalogItems: [], socialLinks, paymentMethods, heroImage };
    localStorage.setItem('gf_cleared', 'true');
    setProducts([]); setBatches([]); setSales([]); setPurchaseRequests([]); setCatalogItems([]);
    latestSnapshotRef.current = emptySnapshot;
    writeLocalCache(emptySnapshot);
    return saveCloudState(emptySnapshot);
  }, [exchangeRate, socialLinks, paymentMethods, heroImage, saveCloudState, writeLocalCache]);

  return (
    <StoreContext.Provider value={{
      exchangeRate, setExchangeRate,
      products, addProduct, updateProduct, deleteProduct,
      catalogItems, addCatalogItem, updateCatalogItem, deleteCatalogItem, getCatalogItemStock,
      batches, addBatch, updateBatch, deleteBatch,
      sales, recordSale, recordManualSale, deleteSale,
      getProductStock, convertPhpToUsd, inventoryValuation,
      purchaseRequests, addPurchaseRequest, updatePurchaseRequest, deletePurchaseRequest,
      socialLinks, saveSocialLinks,
      paymentMethods, savePaymentMethods,
      heroImage, saveHeroImage,
      saveCloudState, syncCurrentState, syncAfterLocalChange,
      clearMockData
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
