import { useState, useCallback } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: '' }), 2500);
  }, []);

  const addToCart = useCallback((item) => {
    // Check if item is already in bag (luxury items are typically unique or single-unit per click)
    setCart(prev => [...prev, item]);
    showToast(`${item.name} added to bag`);
  }, [showToast]);

  const removeFromCart = useCallback((indexToRemove) => {
    setCart(prev => prev.filter((_, idx) => idx !== indexToRemove));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);

  const viewCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    viewCart,
    cartTotal,
    toast,
    showToast
  };
}
