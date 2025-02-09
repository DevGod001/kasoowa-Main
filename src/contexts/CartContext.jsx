// src/contexts/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('kasoowaCart');
    console.log('Initial cart from localStorage:', savedCart);
    return savedCart ? JSON.parse(savedCart) : {};
  });

  useEffect(() => {
    console.log('Saving cart to localStorage:', cartItems);
    localStorage.setItem('kasoowaCart', JSON.stringify(cartItems));
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
          product.stockQuantity
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