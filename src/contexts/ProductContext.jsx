import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ProductAPI } from '../services/api';

// Define the event name directly here
const PRODUCTS_UPDATED_EVENT = 'kasoowaProductsUpdated';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from API on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const fetchedProducts = await ProductAPI.getAllProducts();
        console.log("Fetched products from API:", fetchedProducts);
        setProducts(fetchedProducts);
        
        // Also save to localStorage as fallback for offline access
        localStorage.setItem('kasoowaProducts', JSON.stringify(fetchedProducts));
        
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error fetching products from API:", err);
        setError('Failed to load products');
        
        // Try to load from localStorage as fallback
        const savedProducts = localStorage.getItem('kasoowaProducts');
        if (savedProducts) {
          console.log("Loading products from localStorage fallback");
          setProducts(JSON.parse(savedProducts));
        }
        
        setLoading(false);
      }
    };

    fetchProducts();
    
    // Poll for product updates every 5 minutes
    const intervalId = setInterval(fetchProducts, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Listen for product updates
  useEffect(() => {
    const handleProductUpdate = () => {
      console.log("ProductContext: Received kasoowaProductsUpdated event");
      // Reload products from API when update event is triggered
      ProductAPI.getAllProducts()
        .then(fetchedProducts => {
          console.log("ProductContext: Successfully fetched updated products:", fetchedProducts.length);
          setProducts(fetchedProducts);
          localStorage.setItem('kasoowaProducts', JSON.stringify(fetchedProducts));
        })
        .catch(err => {
          console.error("ProductContext: Error fetching products after update:", err);
        });
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
  }, []);

  // Add product with API integration
  const addProduct = useCallback(async (productData) => {
    try {
      const newProduct = await ProductAPI.addProduct(productData);
      
      // Update local state
      setProducts(prev => [...prev, newProduct]);
      
      // Update localStorage
      const updatedProducts = [...products, newProduct];
      localStorage.setItem('kasoowaProducts', JSON.stringify(updatedProducts));
      
      // Notify other components
      window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
      
      return newProduct;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  }, [products]);

  // Update product with API integration
  const updateProduct = useCallback(async (productId, updatedData) => {
    try {
      await ProductAPI.updateProduct(productId, updatedData);
      
      // Update local state
      setProducts(prev =>
        prev.map(product =>
          String(product.id) === String(productId) ? { ...product, ...updatedData } : product
        )
      );
      
      // Update localStorage
      const updatedProducts = products.map(product => 
        String(product.id) === String(productId) ? { ...product, ...updatedData } : product
      );
      localStorage.setItem('kasoowaProducts', JSON.stringify(updatedProducts));
      
      // Notify other components
      window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }, [products]);

  // Delete product with API integration
  const deleteProduct = useCallback(async (productId) => {
    try {
      await ProductAPI.deleteProduct(productId);
      
      // Update local state
      setProducts(prev => prev.filter(product => String(product.id) !== String(productId)));
      
      // Update localStorage
      const updatedProducts = products.filter(product => String(product.id) !== String(productId));
      localStorage.setItem('kasoowaProducts', JSON.stringify(updatedProducts));
      
      // Notify other components
      window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }, [products]);

  // Get vendor products
  const getVendorProducts = useCallback(
    (vendorId) => {
      return products.filter((product) => product.vendorId === vendorId);
    },
    [products]
  );

  // Get all vendors
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

  // Get products by category
  const getProductsByCategory = useCallback(
    (category) => {
      return products.filter((product) => product.category === category);
    },
    [products]
  );

  // Search products
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
    loading,
    error,
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