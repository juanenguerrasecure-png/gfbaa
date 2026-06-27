import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const StoreContext = createContext(null);

// Default exchange rate: 1 USD = 58 PHP
const DEFAULT_EXCHANGE_RATE = 58.0;

export function StoreProvider({ children }) {
  // --- State Initialization with LocalStorage Persistence ---
  
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem('gf_exchange_rate');
    return saved ? Number(saved) : DEFAULT_EXCHANGE_RATE;
  });

  // Ensure legacy mock state in browser local storage is cleared once so user has a clean slate immediately
  useEffect(() => {
    if (!localStorage.getItem('gf_clean_slate_init_v2')) {
      localStorage.removeItem('gf_products');
      localStorage.removeItem('gf_batches');
      localStorage.removeItem('gf_sales');
      localStorage.removeItem('gf_purchase_requests');
      localStorage.removeItem('gf_catalog_items');
      localStorage.setItem('gf_clean_slate_init_v2', 'true');
      // Reload to ensure state is initialized with clean slate
      window.location.reload();
    }
  }, []);

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('gf_products');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('gf_batches');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('gf_sales');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [purchaseRequests, setPurchaseRequests] = useState(() => {
    const saved = localStorage.getItem('gf_purchase_requests');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [catalogItems, setCatalogItems] = useState(() => {
    const saved = localStorage.getItem('gf_catalog_items');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // --- Real-time Sync and Polling Implementation ---
  const syncWithDatabase = useCallback(async () => {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) throw new Error('Database sync request failed.');
      const data = await res.json();
      if (data.ok) {
        setProducts(data.products || []);
        setBatches(data.batches || []);
        setCatalogItems(data.catalogItems || []);
        setSales(data.sales || []);
        setPurchaseRequests(data.purchaseRequests || []);
        setExchangeRate(data.exchangeRate || DEFAULT_EXCHANGE_RATE);

        // Save local cache backup
        localStorage.setItem('gf_products', JSON.stringify(data.products || []));
        localStorage.setItem('gf_batches', JSON.stringify(data.batches || []));
        localStorage.setItem('gf_catalog_items', JSON.stringify(data.catalogItems || []));
        localStorage.setItem('gf_sales', JSON.stringify(data.sales || []));
        localStorage.setItem('gf_purchase_requests', JSON.stringify(data.purchaseRequests || []));
        localStorage.setItem('gf_exchange_rate', String(data.exchangeRate || DEFAULT_EXCHANGE_RATE));
      }
    } catch (err) {
      console.warn('Real-time database sync failed (offline fallback active):', err);
    }
  }, []);

  // Fetch immediately and poll every 6 seconds to synchronize across all devices and tabs
  useEffect(() => {
    syncWithDatabase();
    const interval = setInterval(syncWithDatabase, 6000);
    return () => clearInterval(interval);
  }, [syncWithDatabase]);

  // --- Exchange Rate Converter helper ---
  const convertPhpToUsd = useCallback((phpAmount) => {
    if (!phpAmount || isNaN(Number(phpAmount))) return 0;
    return Math.round((Number(phpAmount) / exchangeRate) * 100) / 100;
  }, [exchangeRate]);

  // --- Exchange Rate Setter wrapper ---
  const updateExchangeRate = useCallback((rate) => {
    const numericRate = Math.max(1, Number(rate)) || DEFAULT_EXCHANGE_RATE;
    setExchangeRate(numericRate);
    localStorage.setItem('gf_exchange_rate', String(numericRate));

    fetch('/api/settings/exchange_rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: numericRate })
    }).catch(err => console.error('Failed to sync exchange rate setting:', err));
  }, []);

  // --- Product Management ---
  const addProduct = useCallback((product) => {
    const newProduct = {
      ...product,
      id: Date.now(),
      price: Number(product.price) || 0,
      orig: product.orig ? Number(product.orig) : null,
      emoji: product.emoji || (product.cat === 'bags' ? '👜' : '💍'),
      photoUrl: product.photoUrl || null
    };

    setProducts(prev => {
      const next = [newProduct, ...prev];
      localStorage.setItem('gf_products', JSON.stringify(next));
      return next;
    });

    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    }).catch(err => console.error('addProduct server sync failed:', err));

    return newProduct;
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      localStorage.setItem('gf_products', JSON.stringify(next));
      return next;
    });

    fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error('updateProduct server sync failed:', err));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem('gf_products', JSON.stringify(next));
      return next;
    });

    // Also delete any batches of this product
    setBatches(prev => {
      const next = prev.filter(b => b.productId !== id);
      localStorage.setItem('gf_batches', JSON.stringify(next));
      // Trigger deletion of linked batches on the server too
      prev.forEach(b => {
        if (b.productId === id) {
          fetch(`/api/batches/${b.id}`, { method: 'DELETE' }).catch(() => {});
        }
      });
      return next;
    });

    fetch(`/api/products/${id}`, { method: 'DELETE' })
      .catch(err => console.error('deleteProduct server sync failed:', err));
  }, []);

  // --- Catalog (Storefront Listings) Management ---
  const addCatalogItem = useCallback((item) => {
    const qty = item.quantity !== undefined ? (Number(item.quantity) || 1) : 1;
    const newItem = {
      ...item,
      id: `cat-${Date.now()}`,
      price: Number(item.price) || 0,
      orig: item.orig ? Number(item.orig) : null,
      emoji: item.emoji || '👜',
      photoUrl: item.photoUrl || null,
      quantity: qty,
      remainingQty: qty
    };

    setCatalogItems(prev => {
      const next = [newItem, ...prev];
      localStorage.setItem('gf_catalog_items', JSON.stringify(next));
      return next;
    });

    fetch('/api/catalog_items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    }).catch(err => console.error('addCatalogItem server sync failed:', err));

    return newItem;
  }, []);

  const updateCatalogItem = useCallback((id, updates) => {
    setCatalogItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          const nextItem = { ...item, ...updates };
          if (updates.quantity !== undefined) nextItem.quantity = Number(updates.quantity);
          if (updates.remainingQty !== undefined) nextItem.remainingQty = Number(updates.remainingQty);
          return nextItem;
        }
        return item;
      });
      localStorage.setItem('gf_catalog_items', JSON.stringify(next));
      return next;
    });

    fetch(`/api/catalog_items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error('updateCatalogItem server sync failed:', err));
  }, []);

  const deleteCatalogItem = useCallback((id) => {
    setCatalogItems(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem('gf_catalog_items', JSON.stringify(next));
      return next;
    });

    fetch(`/api/catalog_items/${id}`, { method: 'DELETE' })
      .catch(err => console.error('deleteCatalogItem server sync failed:', err));
  }, []);

  const getCatalogItemStock = useCallback((catalogItemId) => {
    const item = catalogItems.find(c => String(c.id) === String(catalogItemId));
    if (!item) return 0;
    if (item.remainingQty !== undefined) {
      return item.remainingQty;
    }
    const batch = batches.find(b => b.id === item.batchId);
    return batch ? batch.remainingQty : 0;
  }, [batches, catalogItems]);

  // --- Batch Management ---
  const addBatch = useCallback((batchData) => {
    const qty = Number(batchData.quantity) || 1;
    let productCost = Number(batchData.productCost) || 0;
    let shipping = Number(batchData.shipping) || 0;
    let tariff = Number(batchData.tariff) || 0;

    // Auto convert if entered in PHP
    if (batchData.enteredInPhp) {
      productCost = convertPhpToUsd(productCost);
      shipping = convertPhpToUsd(shipping);
      tariff = convertPhpToUsd(tariff);
    }

    const totalCost = productCost + shipping + tariff;
    const costPerItem = Math.round((totalCost / qty) * 100) / 100;

    const newBatch = {
      id: `batch-${Date.now()}`,
      productId: Number(batchData.productId),
      batchNumber: batchData.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
      date: batchData.date || new Date().toISOString().split('T')[0],
      quantity: qty,
      remainingQty: qty,
      productCost: productCost,
      shipping: shipping,
      tariff: tariff,
      totalCost: totalCost,
      costPerItem: costPerItem,
      condition: batchData.condition || 'mint',
      exchangeRateUsed: exchangeRate,
      enteredInPhp: !!batchData.enteredInPhp
    };

    setBatches(prev => {
      const next = [newBatch, ...prev];
      localStorage.setItem('gf_batches', JSON.stringify(next));
      return next;
    });

    fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBatch)
    }).catch(err => console.error('addBatch server sync failed:', err));

    return newBatch;
  }, [exchangeRate, convertPhpToUsd]);

  const updateBatch = useCallback((id, updates) => {
    setBatches(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      localStorage.setItem('gf_batches', JSON.stringify(next));
      return next;
    });

    fetch(`/api/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error('updateBatch server sync failed:', err));
  }, []);

  const deleteBatch = useCallback((id) => {
    setBatches(prev => {
      const next = prev.filter(b => b.id !== id);
      localStorage.setItem('gf_batches', JSON.stringify(next));
      return next;
    });

    fetch(`/api/batches/${id}`, { method: 'DELETE' })
      .catch(err => console.error('deleteBatch server sync failed:', err));
  }, []);

  // --- Sales Record (with FIFO and Manual Selection) ---
  const recordSale = useCallback((saleDetails) => {
    const { buyer, date, items, selectionMethod } = saleDetails;
    // selectionMethod: 'FIFO' | 'manual'
    // items: Array of { productId, qty, pricePerItem, selectedBatches: [{ batchId, qty }] }

    let totalCogs = 0;
    let totalPrice = 0;
    const updatedBatches = [...batches];
    const updatedCatalogItems = [...catalogItems];
    const saleItemsSummary = [];

    // Process each item sold
    for (const item of items) {
      const prodIdStr = String(item.productId);
      const requestedQty = Number(item.qty);
      const pricePerItem = Number(item.pricePerItem);
      
      // Check if it matches a Catalog Item first
      const catalogItemObj = updatedCatalogItems.find(c => String(c.id) === prodIdStr);
      let productObj = null;
      let batchIdToDeduct = null;

      if (catalogItemObj) {
        productObj = catalogItemObj;
        batchIdToDeduct = catalogItemObj.batchId;
      } else {
        // Fallback or legacy support
        const numericProdId = Number(item.productId);
        productObj = products.find(p => p.id === numericProdId);
      }

      if (!productObj) {
        throw new Error(`Item not found in catalog.`);
      }

      totalPrice += pricePerItem * requestedQty;
      const batchesDeducted = [];

      if (batchIdToDeduct) {
        // Direct depletion from the linked batch
        const batchInState = updatedBatches.find(b => b.id === batchIdToDeduct);
        if (!batchInState) {
          throw new Error(`Associated batch not found for catalog item "${productObj.name}".`);
        }
        if (batchInState.remainingQty < requestedQty) {
          throw new Error(`Insufficient stock in Batch "${batchInState.batchNumber}" for "${productObj.name}". Requested: ${requestedQty}, Available: ${batchInState.remainingQty}`);
        }

        // Deduct from catalog item's own remaining stock if defined
        if (catalogItemObj && catalogItemObj.remainingQty !== undefined) {
          if (catalogItemObj.remainingQty < requestedQty) {
            throw new Error(`Insufficient stock for listing "${catalogItemObj.name}". Requested: ${requestedQty}, Available: ${catalogItemObj.remainingQty}`);
          }
          catalogItemObj.remainingQty -= requestedQty;
        }

        batchInState.remainingQty -= requestedQty;
        totalCogs += requestedQty * batchInState.costPerItem;

        batchesDeducted.push({
          batchId: batchInState.id,
          batchNumber: batchInState.batchNumber,
          qty: requestedQty,
          costPerItem: batchInState.costPerItem
        });
      } else {
        // Traditional FIFO/Manual selection fallback if no batchId explicitly linked
        const numericProdId = Number(item.productId);
        if (selectionMethod === 'FIFO') {
          // Find all in-stock batches for this product, sorted by date (oldest first)
          const availableBatches = updatedBatches
            .filter(b => b.productId === numericProdId && b.remainingQty > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          const totalAvailable = availableBatches.reduce((sum, b) => sum + b.remainingQty, 0);
          if (totalAvailable < requestedQty) {
            throw new Error(`Insufficient stock for "${productObj.name}". Requested: ${requestedQty}, Available: ${totalAvailable}`);
          }

          let remainingToDeduct = requestedQty;
          for (const batch of availableBatches) {
            if (remainingToDeduct <= 0) break;

            const batchInState = updatedBatches.find(b => b.id === batch.id);
            const deductAmount = Math.min(batchInState.remainingQty, remainingToDeduct);

            batchInState.remainingQty -= deductAmount;
            remainingToDeduct -= deductAmount;
            totalCogs += deductAmount * batchInState.costPerItem;

            batchesDeducted.push({
              batchId: batchInState.id,
              batchNumber: batchInState.batchNumber,
              qty: deductAmount,
              costPerItem: batchInState.costPerItem
            });
          }
        } else {
          // Manual Selection
          // Validate each manual batch specified
          let manualSum = 0;
          for (const manualBatch of item.selectedBatches) {
            const batchInState = updatedBatches.find(b => b.id === manualBatch.batchId);
            if (!batchInState || batchInState.productId !== numericProdId) {
              throw new Error(`Invalid batch selected for "${productObj.name}".`);
            }

            const deductAmount = Number(manualBatch.qty);
            if (batchInState.remainingQty < deductAmount) {
              throw new Error(`Batch "${batchInState.batchNumber}" has insufficient stock. Requested: ${deductAmount}, Available: ${batchInState.remainingQty}`);
            }

            batchInState.remainingQty -= deductAmount;
            manualSum += deductAmount;
            totalCogs += deductAmount * batchInState.costPerItem;

            batchesDeducted.push({
              batchId: batchInState.id,
              batchNumber: batchInState.batchNumber,
              qty: deductAmount,
              costPerItem: batchInState.costPerItem
            });
          }

          if (manualSum !== requestedQty) {
            throw new Error(`Total manual quantities (${manualSum}) must match requested quantity (${requestedQty}) for "${productObj.name}".`);
          }
        }
      }

      saleItemsSummary.push({
        productId: item.productId,
        name: productObj.name,
        brand: productObj.brand,
        qty: requestedQty,
        pricePerItem: pricePerItem,
        totalPrice: pricePerItem * requestedQty,
        batches: batchesDeducted
      });
    }

    // All deductions validated and processed! Save the updated batches and register the sale.
    setBatches(updatedBatches);
    setCatalogItems(updatedCatalogItems);
    localStorage.setItem('gf_batches', JSON.stringify(updatedBatches));
    localStorage.setItem('gf_catalog_items', JSON.stringify(updatedCatalogItems));

    const newSale = {
      id: `sale-${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      buyer: buyer || 'Walk-in customer',
      totalPrice: totalPrice,
      totalCogs: Math.round(totalCogs * 100) / 100,
      profit: Math.round((totalPrice - totalCogs) * 100) / 100,
      items: saleItemsSummary,
      selectionMethod: batchIdToDeduct ? 'Direct' : selectionMethod
    };

    setSales(prev => {
      const next = [newSale, ...prev];
      localStorage.setItem('gf_sales', JSON.stringify(next));
      return next;
    });

    // Sync all modified entities to backend in background
    fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSale)
    }).catch(err => console.error('recordSale API save failed:', err));

    // Update modified batches and catalog items on database
    items.forEach(item => {
      const prodIdStr = String(item.productId);
      const catalogItemObj = updatedCatalogItems.find(c => String(c.id) === prodIdStr);
      if (catalogItemObj) {
        fetch(`/api/catalog_items/${catalogItemObj.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remainingQty: catalogItemObj.remainingQty })
        }).catch(() => {});

        const batchInState = updatedBatches.find(b => b.id === catalogItemObj.batchId);
        if (batchInState) {
          fetch(`/api/batches/${batchInState.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remainingQty: batchInState.remainingQty })
          }).catch(() => {});
        }
      } else {
        item.batches?.forEach(b => {
          const batchInState = updatedBatches.find(bs => bs.id === b.batchId);
          if (batchInState) {
            fetch(`/api/batches/${batchInState.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ remainingQty: batchInState.remainingQty })
            }).catch(() => {});
          }
        });
      }
    });

    return newSale;
  }, [batches, products, catalogItems]);

  const deleteSale = useCallback((saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    // Refund stock back to the batches and catalog items!
    const updatedBatches = [...batches];
    const updatedCatalogItems = [...catalogItems];

    sale.items.forEach(item => {
      // Refund to catalog item if applicable
      const catInState = updatedCatalogItems.find(c => String(c.id) === String(item.productId));
      if (catInState && catInState.remainingQty !== undefined) {
        catInState.remainingQty += item.qty;
        fetch(`/api/catalog_items/${catInState.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remainingQty: catInState.remainingQty })
        }).catch(() => {});
      }

      item.batches.forEach(b => {
        const batchInState = updatedBatches.find(bs => bs.id === b.batchId);
        if (batchInState) {
          batchInState.remainingQty += b.qty;
          fetch(`/api/batches/${batchInState.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remainingQty: batchInState.remainingQty })
          }).catch(() => {});
        }
      });
    });

    setBatches(updatedBatches);
    setCatalogItems(updatedCatalogItems);
    setSales(prev => {
      const next = prev.filter(s => s.id !== saleId);
      localStorage.setItem('gf_sales', JSON.stringify(next));
      return next;
    });
    localStorage.setItem('gf_batches', JSON.stringify(updatedBatches));
    localStorage.setItem('gf_catalog_items', JSON.stringify(updatedCatalogItems));

    // Delete sale from database
    fetch(`/api/sales/${saleId}`, { method: 'DELETE' })
      .catch(err => console.error('deleteSale server sync failed:', err));
  }, [sales, batches, catalogItems]);

  // --- Dynamic Inventory Calculations ---
  // A product is "in stock" if it has any active batches with remainingQty > 0
  const getProductStock = useCallback((productId) => {
    return batches
      .filter(b => b.productId === productId)
      .reduce((sum, b) => sum + b.remainingQty, 0);
  }, [batches]);

  // Aggregate stats
  const inventoryValuation = batches.reduce((sum, b) => sum + (b.remainingQty * b.costPerItem), 0);

  // --- Purchase Request Helpers ---
  const addPurchaseRequest = useCallback((requestData) => {
    const newRequest = {
      id: `req-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      buyerName: requestData.buyerName,
      buyerEmail: requestData.buyerEmail,
      buyerAddress: requestData.buyerAddress,
      items: requestData.items,
      status: 'pending',
      shippingCost: null,
      specialInstructions: requestData.specialInstructions || ''
    };

    setPurchaseRequests(prev => {
      const next = [newRequest, ...prev];
      localStorage.setItem('gf_purchase_requests', JSON.stringify(next));
      return next;
    });

    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    }).catch(err => console.error('addPurchaseRequest server sync failed:', err));

    return newRequest;
  }, []);

  const updatePurchaseRequest = useCallback((id, updates) => {
    setPurchaseRequests(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      localStorage.setItem('gf_purchase_requests', JSON.stringify(next));
      return next;
    });

    fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error('updatePurchaseRequest server sync failed:', err));
  }, []);

  const deletePurchaseRequest = useCallback((id) => {
    setPurchaseRequests(prev => {
      const next = prev.filter(r => r.id !== id);
      localStorage.setItem('gf_purchase_requests', JSON.stringify(next));
      return next;
    });

    fetch(`/api/requests/${id}`, { method: 'DELETE' })
      .catch(err => console.error('deletePurchaseRequest server sync failed:', err));
  }, []);

  const clearMockData = useCallback(() => {
    localStorage.setItem('gf_cleared', 'true');
    setProducts([]);
    setBatches([]);
    setSales([]);
    setPurchaseRequests([]);
    setCatalogItems([]);
    localStorage.removeItem('gf_products');
    localStorage.removeItem('gf_batches');
    localStorage.removeItem('gf_sales');
    localStorage.removeItem('gf_purchase_requests');
    localStorage.removeItem('gf_catalog_items');

    fetch('/api/clear', { method: 'POST' })
      .catch(err => console.error('clearMockData server sync failed:', err));
  }, []);

  return (
    <StoreContext.Provider value={{
      exchangeRate,
      setExchangeRate: updateExchangeRate,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      catalogItems,
      addCatalogItem,
      updateCatalogItem,
      deleteCatalogItem,
      getCatalogItemStock,
      batches,
      addBatch,
      updateBatch,
      deleteBatch,
      sales,
      recordSale,
      deleteSale,
      getProductStock,
      convertPhpToUsd,
      inventoryValuation,
      purchaseRequests,
      addPurchaseRequest,
      updatePurchaseRequest,
      deletePurchaseRequest,
      clearMockData
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
