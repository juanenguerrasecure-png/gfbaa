import { useEffect, useState } from 'react';

const STORAGE_KEY = 'gf_price_currency';
const EVENT_NAME = 'gf_price_currency_change';
const DEFAULT_CURRENCY = 'PHP';
const DEFAULT_EXCHANGE_RATE = 58;

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

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getProductPriceValues(product, exchangeRate = DEFAULT_EXCHANGE_RATE) {
  const rate = Number(exchangeRate) > 0 ? Number(exchangeRate) : DEFAULT_EXCHANGE_RATE;
  const explicitPhp = toNumber(product?.pricePHP ?? product?.phpPrice ?? product?.pricePhp);
  const explicitUsd = toNumber(product?.priceUSD ?? product?.usdPrice ?? product?.priceUsd);
  const basePrice = toNumber(product?.price) ?? 0;

  const usd = explicitUsd ?? basePrice;
  const php = explicitPhp ?? Math.round(usd * rate * 100) / 100;

  return { php, usd };
}

export function formatProductPrice(product, currency, exchangeRate = DEFAULT_EXCHANGE_RATE) {
  const { php, usd } = getProductPriceValues(product, exchangeRate);

  if (currency === 'USD') {
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `₱${php.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function hasUsdPrice(product) {
  return Boolean(
    product?.priceUSD ?? product?.usdPrice ?? product?.priceUsd ?? product?.price
  );
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState(readStoredCurrency);

  useEffect(() => {
    const handleCustomChange = (event) => setCurrencyState(normalizeCurrency(event.detail));
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

  const toggleCurrency = () => setCurrency(currency === 'PHP' ? 'USD' : 'PHP');

  return { currency, setCurrency, toggleCurrency };
}
