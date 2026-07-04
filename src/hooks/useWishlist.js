import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../context/StoreContext';

const STORAGE_KEY = 'gf_wishlist';
const EVENT_NAME = 'gf_wishlist_change';

function readStoredWishlist() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (_error) {
    return [];
  }
}

function persistWishlist(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: list }));
  } catch (_error) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: list }));
  }
}

export function useWishlist() {
  const [wishlist, setWishlistState] = useState(readStoredWishlist);
  const { catalogItems } = useStore();

  useEffect(() => {
    const handleCustomChange = (event) => {
      setWishlistState(event.detail || []);
    };
    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY) {
        try {
          setWishlistState(event.newValue ? JSON.parse(event.newValue) : []);
        } catch {
          setWishlistState([]);
        }
      }
    };
    window.addEventListener(EVENT_NAME, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleWishlist = useCallback((id) => {
    const current = readStoredWishlist();
    const idStr = String(id);
    const next = current.map(String).includes(idStr)
      ? current.filter(x => String(x) !== idStr)
      : [...current, idStr];
    persistWishlist(next);
    setWishlistState(next);
  }, []);

  const isWishlisted = useCallback((id) => {
    return wishlist.map(String).includes(String(id));
  }, [wishlist]);

  // Resolve IDs to full catalog item objects
  const wishlistItems = (catalogItems || [])
    .filter(item => wishlist.map(String).includes(String(item.id)));

  return {
    wishlist,
    wishlistItems,
    toggleWishlist,
    isWishlisted,
  };
}
