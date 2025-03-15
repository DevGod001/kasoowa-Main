import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { CartAPI } from '../services/api';

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

  // Add userId state for server sync
  const [userId, setUserId] = useState(null);

  // Track if initial server sync has been done
  const initialSyncDone = useRef(false);

  // Get user ID from JWT token on mount
  useEffect(() => {
    const token = localStorage.getItem('kasoowaAuthToken');
    if (token) {
      try {
        // Decode the JWT token to get user ID
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        if (decodedPayload.id) {
          setUserId(decodedPayload.id);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Initial sync with server when userId is set for the first time
  useEffect(() => {
    const syncWithServer = async () => {
      if (userId && !initialSyncDone.current) {
        try {
          console.log('Trying to load cart from server for user:', userId);
          const serverCart = await CartAPI.getCart(userId);

          if (serverCart && Object.keys(serverCart).length > 0) {
            console.log('Loaded cart from server:', serverCart);
            setCartItems(serverCart);
          } else {
            // If no cart on server, sync local cart to server
            console.log('No cart on server, syncing local cart');
            await CartAPI.saveCart(userId, cartItems);
          }

          // Mark initial sync as done
          initialSyncDone.current = true;
        } catch (error) {
          console.error('Error syncing with server:', error);
        }
      }
    };

    if (userId) {
      syncWithServer();
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
  // We intentionally omit cartItems to avoid potential infinite loops

  // Save cart to storage and sync with server when cart changes
  useEffect(() => {
    console.log('Saving cart to storage:', cartItems);
    const success = storageHelpers.saveToStorage('kasoowaCart', cartItems);
    if (!success) {
      console.warn('Failed to save cart to storage. Using memory-only storage for now.');
    }

    // Sync with server if user is logged in and initial sync is done
    if (userId && initialSyncDone.current) {
      console.log('Syncing cart with server for user:', userId);
      CartAPI.saveCart(userId, cartItems).catch(error => {
        console.error('Error syncing cart with server:', error);
      });
    }
  }, [cartItems, userId]);

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
        // UPDATED: Check for image_url first, then other image properties
        imageUrl: product.image_url || product.imageUrl || product.image || null,
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

      // Also remove from server if logged in
      if (userId) {
        CartAPI.removeCartItem(userId, productId).catch(error => {
          console.error('Error removing item from server cart:', error);
        });
      }
    } else {
      setCartItems(prev => {
        const item = prev[productId];
        const stockLimit = item.stockQuantity;

        // Check if new quantity would exceed stock
        if (quantity > stockLimit) {
          alert(`Cannot exceed available stock of ${stockLimit} items`);
          return prev;
        }

        const updatedItem = {
          ...item,
          quantity
        };

        // Update on server if logged in
        if (userId) {
          CartAPI.updateCartItem(userId, productId, updatedItem).catch(error => {
            console.error('Error updating item on server cart:', error);
          });
        }

        return {
          ...prev,
          [productId]: updatedItem
        };
      });
    }
  };

  const removeFromCart = (productId) => {
    console.log('Removing from cart:', productId);
    setCartItems(prev => {
      const newItems = { ...prev };
      delete newItems[productId];

      // Remove from server if logged in
      if (userId) {
        CartAPI.removeCartItem(userId, productId).catch(error => {
          console.error('Error removing item from server cart:', error);
        });
      }

      return newItems;
    });
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setCartItems({});
    storageHelpers.removeFromStorage('kasoowaCart');

    // Clear on server if logged in
    if (userId) {
      CartAPI.clearCart(userId).catch(error => {
        console.error('Error clearing server cart:', error);
      });
    }
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
      getCartItemsCount,
      userId
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
