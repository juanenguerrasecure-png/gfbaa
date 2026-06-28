import { useEffect, useState } from 'react';

const STORAGE_KEY = 'gf_price_currency';
const DEFAULT_CURRENCY = 'PHP';

function readStoredCurrency() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'USD' || stored === 'PHP' ? stored : DEFAULT_CURRENCY;
  } catch (_error) {
    return DEFAULT_CURRENCY;
  }
}

export function formatProductPrice(product, currency) {
  const phpPrice = Number(product?.price || 0);
  const usdPrice = product?.priceUSD !== undefined && product?.priceUSD !== null && product?.priceUSD !== ''
    ? Number(product.priceUSD)
    : null;

  if (currency === 'USD' && usdPrice !== null && Number.isFinite(usdPrice)) {
    return `$${usdPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `₱${phpPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function hasUsdPrice(product) {
  const value = product?.priceUSD;
  return value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value));
}

export function useCurrency() {
  const [currency, setCurrency] = useState(readStoredCurrency);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch (_error) {
      // localStorage may be unavailable in restricted browser contexts.
    }
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency(prev => (prev === 'PHP' ? 'USD' : 'PHP'));
  };

  return { currency, setCurrency, toggleCurrency };
}
