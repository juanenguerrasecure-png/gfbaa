import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ITEMS } from '../data/items';

const StoreContext = createContext(null);

// Default exchange rate: 1 USD = 58 PHP
const DEFAULT_EXCHANGE_RATE = 58.0;

export function StoreProvider({ children }) {
  // --- State Initialization with LocalStorage Persistence ---
  
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem('gf_exchange_rate');
    return saved ? Number(saved) : DEFAULT_EXCHANGE_RATE;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('gf_products');
    if (saved) return JSON.parse(saved);
    if (localStorage.getItem('gf_cleared') === 'true') return [];
    // Use the default ITEMS as starting products
    return ITEMS.map(item => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      cat: item.cat,
      detail: item.detail || '',
      price: item.price, // in USD
      orig: item.orig || null,
      emoji: item.emoji || '👜',
      photoUrl: item.photoUrl || null
    }));
  });

  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('gf_batches');
    if (saved) return JSON.parse(saved);
    if (localStorage.getItem('gf_cleared') === 'true') return [];

    // Seed realistic starting batches for each default product
    const seeded = [];
    ITEMS.forEach((item, idx) => {
      const quantity = 10;
      const productCostPHP = item.price * 0.55 * DEFAULT_EXCHANGE_RATE; // e.g. 55% of retail in PHP
      const shippingPHP = 50 * DEFAULT_EXCHANGE_RATE;
      const tariffPHP = 30 * DEFAULT_EXCHANGE_RATE;

      // Convert to USD
      const productCostUSD = Math.round((productCostPHP / DEFAULT_EXCHANGE_RATE) * 100) / 100;
      const shippingUSD = Math.round((shippingPHP / DEFAULT_EXCHANGE_RATE) * 100) / 100;
      const tariffUSD = Math.round((tariffPHP / DEFAULT_EXCHANGE_RATE) * 100) / 100;

      const totalCostUSD = productCostUSD + shippingUSD + tariffUSD;
      const costPerItemUSD = Math.round((totalCostUSD / quantity) * 100) / 100;

      seeded.push({
        id: `batch-${item.id}-1`,
        productId: item.id,
        batchNumber: `BATCH-2024-${String(item.id).padStart(3, '0')}`,
        date: '2024-10-01',
        quantity: quantity,
        remainingQty: quantity - (idx % 3 === 0 ? 3 : 0), // some already sold
        productCost: productCostUSD,
        shipping: shippingUSD,
        tariff: tariffUSD,
        totalCost: totalCostUSD,
        costPerItem: costPerItemUSD,
        condition: item.condition || 'mint',
        exchangeRateUsed: DEFAULT_EXCHANGE_RATE,
        enteredInPhp: true
      });
    });
    return seeded;
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('gf_sales');
    if (saved) return JSON.parse(saved);
    if (localStorage.getItem('gf_cleared') === 'true') return [];

    // Seed some initial sales matching our seeded batches
    const seededSales = [
      {
        id: 'sale-1',
        date: '2024-11-08',
        buyer: 'Maria Santos',
        totalPrice: 1500, // Sold classic items
        totalCogs: 920,
        profit: 580,
        items: [
          {
            productId: 2, // Speedy 30
            qty: 2,
            pricePerItem: 750,
            totalPrice: 1500,
            batches: [
              { batchId: 'batch-2-1', qty: 2, costPerItem: 460 }
            ]
          }
        ]
      },
      {
        id: 'sale-2',
        date: '2024-12-15',
        buyer: 'Ana Reyes',
        totalPrice: 1020,
        totalCogs: 510,
        profit: 510,
        items: [
          {
            productId: 11, // Croissant Ring
            qty: 3,
            pricePerItem: 340,
            totalPrice: 1020,
            batches: [
              { batchId: 'batch-11-1', qty: 3, costPerItem: 170 }
            ]
          }
        ]
      }
    ];
    return seededSales;
  });

  const [purchaseRequests, setPurchaseRequests] = useState(() => {
    const saved = localStorage.getItem('gf_purchase_requests');
    if (saved) return JSON.parse(saved);
    if (localStorage.getItem('gf_cleared') === 'true') return [];

    const seeded = [
      {
        id: 'req-1',
        date: '2024-12-25',
        buyerName: 'Beatriz Santos',
        buyerEmail: 'beatriz.s@example.com',
        buyerAddress: '123 Mahogany St, Forbes Park, Makati, Philippines',
        items: [
          { productId: 'cat-3', name: 'Birkin 30', brand: 'Hermès', qty: 1, price: 12000, emoji: '👛' }
        ],
        status: 'pending',
        shippingCost: null,
        specialInstructions: 'Please wrap it nicely, it is a birthday gift for my mother.'
      }
    ];
    return seeded;
  });

  const [catalogItems, setCatalogItems] = useState(() => {
    const saved = localStorage.getItem('gf_catalog_items');
    if (saved) return JSON.parse(saved);
    if (localStorage.getItem('gf_cleared') === 'true') return [];

    // Seed default catalog items, 1-to-1 with ITEMS and seeded batches
    return ITEMS.map(item => ({
      id: `cat-${item.id}`,
      productId: item.id,
      batchId: `batch-${item.id}-1`, // Seeded batch ID from store state
      name: item.name,
      brand: item.brand,
      cat: item.cat,
      detail: item.detail || '',
      price: item.price, // Seeded retail price
      orig: item.orig || null,
      emoji: item.emoji || '👜',
      condition: item.condition || 'mint'
    }));
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('gf_exchange_rate', exchangeRate.toString());
  }, [exchangeRate]);

  useEffect(() => {
    localStorage.setItem('gf_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('gf_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('gf_catalog_items', JSON.stringify(catalogItems));
  }, [catalogItems]);

  useEffect(() => {
    localStorage.setItem('gf_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('gf_purchase_requests', JSON.stringify(purchaseRequests));
  }, [purchaseRequests]);

  // --- Exchange Rate Converter helper ---
  const convertPhpToUsd = useCallback((phpAmount) => {
    if (!phpAmount || isNaN(Number(phpAmount))) return 0;
    return Math.round((Number(phpAmount) / exchangeRate) * 100) / 100;
  }, [exchangeRate]);

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
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    // Also delete any batches of this product
    setBatches(prev => prev.filter(b => b.productId !== id));
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
    setCatalogItems(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateCatalogItem = useCallback((id, updates) => {
    setCatalogItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextItem = { ...item, ...updates };
        // Ensure numbers are properly typed
        if (updates.quantity !== undefined) nextItem.quantity = Number(updates.quantity);
        if (updates.remainingQty !== undefined) nextItem.remainingQty = Number(updates.remainingQty);
        return nextItem;
      }
      return item;
    }));
  }, []);

  const deleteCatalogItem = useCallback((id) => {
    setCatalogItems(prev => prev.filter(item => item.id !== id));
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

    setBatches(prev => [newBatch, ...prev]);
    return newBatch;
  }, [exchangeRate, convertPhpToUsd]);

  const updateBatch = useCallback((id, updates) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBatch = useCallback((id) => {
    setBatches(prev => prev.filter(b => b.id !== id));
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

    setSales(prev => [newSale, ...prev]);
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
      }

      item.batches.forEach(b => {
        const batchInState = updatedBatches.find(bs => bs.id === b.batchId);
        if (batchInState) {
          batchInState.remainingQty += b.qty;
        }
      });
    });

    setBatches(updatedBatches);
    setCatalogItems(updatedCatalogItems);
    setSales(prev => prev.filter(s => s.id !== saleId));
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
    setPurchaseRequests(prev => [newRequest, ...prev]);
    return newRequest;
  }, []);

  const updatePurchaseRequest = useCallback((id, updates) => {
    setPurchaseRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deletePurchaseRequest = useCallback((id) => {
    setPurchaseRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearMockData = useCallback(() => {
    localStorage.setItem('gf_cleared', 'true');
    setProducts([]);
    setBatches([]);
    setSales([]);
    setPurchaseRequests([]);
    setCatalogItems([]);
  }, []);

  const resetToDemoData = useCallback(() => {
    localStorage.removeItem('gf_cleared');
    localStorage.removeItem('gf_products');
    localStorage.removeItem('gf_batches');
    localStorage.removeItem('gf_sales');
    localStorage.removeItem('gf_purchase_requests');
    localStorage.removeItem('gf_catalog_items');
    window.location.reload();
  }, []);

  return (
    <StoreContext.Provider value={{
      exchangeRate,
      setExchangeRate,
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
      clearMockData,
      resetToDemoData
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
