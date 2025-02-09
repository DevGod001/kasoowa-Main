// src/contexts/ProductContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    // Try to load products from localStorage on initial render
    const savedProducts = localStorage.getItem('kasoowaProducts');
    return savedProducts ? JSON.parse(savedProducts) : [];
  });

  // Save products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kasoowaProducts', JSON.stringify(products));
  }, [products]);

  // Add this function to help debug
  const addProduct = (newProduct) => {
    setProducts(prev => {
      const updated = [...prev, newProduct];
      console.log('Updated products:', updated); // Debug log
      return updated;
    });
  };

  return (
    <ProductContext.Provider value={{ products, setProducts, addProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export default ProductProvider;