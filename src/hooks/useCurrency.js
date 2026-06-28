import { useEffect, useState } from 'react';

const STORAGE_KEY = 'gf_price_currency';
const EVENT_NAME = 'gf_price_currency_change';
const DEFAULT_CURRENCY = 'PHP';

function readStoredCurrency() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'USD' || stored === 'PHP' ? stored : DEFAULT_CURRENCY;
  } catch (_error) {
    return DEFAULT_CURRENCY;
  }
}

function normalizeCurrency(value) {
  return value === 'USD' || value === 'PHP' ? value : DEFAULT_CURRENCY;
}

function persistCurrency(value) {
  const next = normalizeCurrency(value);
  try {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  } catch (_error) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  }
  return next;
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
  const [currency, setCurrencyState] = useState(readStoredCurrency);

  useEffect(() => {
    const handleCustomChange = (event) => {
      setCurrencyState(normalizeCurrency(event.detail));
    };
    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY) setCurrencyState(normalizeCurrency(event.newValue));
    };
    window.addEventListener(EVENT_NAME, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setCurrency = (nextCurrency) => {
    const next = persistCurrency(nextCurrency);
    setCurrencyState(next);
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'PHP' ? 'USD' : 'PHP');
  };

  return { currency, setCurrency, toggleCurrency };
}
