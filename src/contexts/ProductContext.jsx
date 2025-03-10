import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Define the event name directly here
const PRODUCTS_UPDATED_EVENT = 'kasoowaProductsUpdated';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('kasoowaProducts');
    return savedProducts ? JSON.parse(savedProducts) : [];
  });

  // Save products to localStorage when they change
  useEffect(() => {
    localStorage.setItem('kasoowaProducts', JSON.stringify(products));
  }, [products]);

  // Listen for product updates
  useEffect(() => {
    const handleProductUpdate = () => {
      console.log("ProductContext: Received kasoowaProductsUpdated event");
      
      const storedProducts = localStorage.getItem('kasoowaProducts');
      console.log("ProductContext: Raw stored products:", storedProducts);
      
      if (storedProducts) {
        try {
          const parsedProducts = JSON.parse(storedProducts);
          console.log("ProductContext: Successfully parsed products:", parsedProducts.length);
          
          // Compare to current products
          const sampleProduct = parsedProducts[0];
          const currentSampleProduct = products.find(p => 
            sampleProduct && String(p.id) === String(sampleProduct.id)
          );
          
          if (sampleProduct && currentSampleProduct) {
            console.log("ProductContext: Sample product comparison:");
            console.log("From localStorage:", sampleProduct);
            console.log("From state:", currentSampleProduct);
          }
          
          // Update state with new products
          setProducts(parsedProducts);
          console.log("ProductContext: Updated products state with new data");
        } catch (error) {
          console.error("ProductContext: Error parsing products:", error);
        }
      }
    };
    
    // Listen for our custom product update event
    console.log("ProductContext: Adding event listener for", PRODUCTS_UPDATED_EVENT);
    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductUpdate);
    
    // Also listen for storage events for cross-tab updates
    const handleStorageChange = (e) => {
      if (e.key === 'kasoowaProducts' || e.key === 'kasoowaForceRefresh') {
        console.log("ProductContext: Storage event detected for products");
        handleProductUpdate();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      console.log("ProductContext: Removing event listeners");
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [products]);

  // Memoized product operations
  const addProduct = useCallback((newProduct) => {
    setProducts((prev) => [...prev, newProduct]);
  }, []);

  const getVendorProducts = useCallback(
    (vendorId) => {
      return products.filter((product) => product.vendorId === vendorId);
    },
    [products]
  );

  const getAllVendors = useCallback(() => {
    const vendorMap = new Map();
    products.forEach((product) => {
      if (product.vendorId && !vendorMap.has(product.vendorId)) {
        vendorMap.set(product.vendorId, {
          id: product.vendorId,
          name: product.vendorName,
          storeSlug: product.vendorSlug,
          productCount: 1,
        });
      } else if (product.vendorId) {
        const vendor = vendorMap.get(product.vendorId);
        vendorMap.set(product.vendorId, {
          ...vendor,
          productCount: vendor.productCount + 1,
        });
      }
    });
    return Array.from(vendorMap.values());
  }, [products]);

  const updateProduct = useCallback((productId, updatedData) => {
    setProducts((prev) =>
      prev.map((product) =>
        String(product.id) === String(productId) ? { ...product, ...updatedData } : product
      )
    );
  }, []);

  const deleteProduct = useCallback((productId) => {
    setProducts((prev) => prev.filter((product) => String(product.id) !== String(productId)));
  }, []);

  const getProductsByCategory = useCallback(
    (category) => {
      return products.filter((product) => product.category === category);
    },
    [products]
  );

  const searchProducts = useCallback(
    (searchTerm) => {
      const term = searchTerm.toLowerCase();
      return products.filter(
        (product) =>
          product.title.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
      );
    },
    [products]
  );

  const value = {
    products,
    setProducts,
    addProduct,
    getVendorProducts,
    getAllVendors,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    searchProducts,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

// Export the event name constant for other components to use
export { PRODUCTS_UPDATED_EVENT };

export default ProductProvider;