import React, { createContext, useState, useContext, useEffect } from 'react';

// Helper functions for storage management
const storageHelpers = {
  // Store data in chunks to overcome localStorage size limitations
  saveToStorage: (key, data) => {
    try {
      const stringData = JSON.stringify(data);
      
      // If data is small enough, store it directly
      if (stringData.length < 1000000) { // ~1MB safety threshold
        localStorage.setItem(key, stringData);
        return true;
      }
      
      // Otherwise, split into chunks
      const chunks = Math.ceil(stringData.length / 1000000);
      
      // Store metadata
      localStorage.setItem(`${key}_info`, JSON.stringify({
        chunks: chunks,
        totalLength: stringData.length,
        timestamp: new Date().getTime()
      }));
      
      // Store each chunk
      for (let i = 0; i < chunks; i++) {
        const start = i * 1000000;
        const end = Math.min(start + 1000000, stringData.length);
        const chunk = stringData.substring(start, end);
        localStorage.setItem(`${key}_chunk_${i}`, chunk);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      
      // Clean up any partial saves
      try {
        const info = JSON.parse(localStorage.getItem(`${key}_info`));
        if (info && info.chunks) {
          for (let i = 0; i < info.chunks; i++) {
            localStorage.removeItem(`${key}_chunk_${i}`);
          }
        }
        localStorage.removeItem(`${key}_info`);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return false;
    }
  },
  
  // Load data from chunks
  loadFromStorage: (key) => {
    try {
      // Check if we're using chunks
      const infoString = localStorage.getItem(`${key}_info`);
      
      // If no chunk info, try regular storage
      if (!infoString) {
        const directData = localStorage.getItem(key);
        return directData ? JSON.parse(directData) : null;
      }
      
      // Otherwise, load and combine chunks
      const info = JSON.parse(infoString);
      let fullData = '';
      
      for (let i = 0; i < info.chunks; i++) {
        const chunk = localStorage.getItem(`${key}_chunk_${i}`);
        if (!chunk) {
          console.error(`Missing chunk ${i} of ${info.chunks} for ${key}`);
          return null;
        }
        fullData += chunk;
      }
      
      return JSON.parse(fullData);
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  },
  
  // Clean up all chunks for a key
  removeFromStorage: (key) => {
    try {
      // Check if we're using chunks
      const infoString = localStorage.getItem(`${key}_info`);
      
      if (infoString) {
        const info = JSON.parse(infoString);
        // Remove all chunks
        for (let i = 0; i < info.chunks; i++) {
          localStorage.removeItem(`${key}_chunk_${i}`);
        }
        localStorage.removeItem(`${key}_info`);
      }
      
      // Remove direct item regardless
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }
};

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = storageHelpers.loadFromStorage('kasoowaCart');
    console.log('Initial cart from storage:', savedCart);
    return savedCart || {};
  });

  useEffect(() => {
    console.log('Saving cart to storage:', cartItems);
    const success = storageHelpers.saveToStorage('kasoowaCart', cartItems);
    if (!success) {
      console.warn('Failed to save cart to storage. Using memory-only storage for now.');
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    console.log('Adding to cart:', product, quantity);
    setCartItems(prev => ({
      ...prev,
      [product.id]: {
        id: product.id,
        quantity: (prev[product.id]?.quantity || 0) + quantity,
        variant: product.selectedVariant || null,
        price: product.selectedVariant ? product.selectedVariant.price : product.price,
        title: product.title,
        imageUrl: product.imageUrl || product.image || '/api/placeholder/80/80',
        description: product.description,
        weight: product.selectedVariant?.weight || null,
        size: product.selectedVariant?.size || null,
        stockQuantity: product.selectedVariant ?
          product.selectedVariant.stockQuantity :
          product.stockQuantity,
        // Add vendor information
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        vendorSlug: product.vendorSlug
      }
    }));
  };

  const updateQuantity = (productId, quantity) => {
    console.log('Updating quantity:', productId, quantity);
    if (quantity === 0) {
      setCartItems(prev => {
        const newItems = { ...prev };
        delete newItems[productId];
        return newItems;
      });
    } else {
      setCartItems(prev => {
        const item = prev[productId];
        const stockLimit = item.stockQuantity;
        
        // Check if new quantity would exceed stock
        if (quantity > stockLimit) {
          alert(`Cannot exceed available stock of ${stockLimit} items`);
          return prev;
        }

        return {
          ...prev,
          [productId]: {
            ...item,
            quantity
          }
        };
      });
    }
  };

  const removeFromCart = (productId) => {
    console.log('Removing from cart:', productId);
    setCartItems(prev => {
      const newItems = { ...prev };
      delete newItems[productId];
      return newItems;
    });
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setCartItems({});
    storageHelpers.removeFromStorage('kasoowaCart');
  };

  const getCartTotal = () => {
    return Object.values(cartItems).reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return Object.values(cartItems).reduce((count, item) => {
      return count + item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartProvider;