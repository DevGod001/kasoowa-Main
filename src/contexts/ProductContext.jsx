// src/contexts/ProductContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ProductContext = createContext();

// API URL
const API_URL = '/api'; // Adjust if your API base URL is different

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Add a new product
  const addProduct = async (productData) => {
    try {
      // Debug logging for FormData before sending
      console.log("Sending to API - FormData entries:");
      for (let [key, value] of productData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      // Make API call
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        body: productData,
        // Do NOT set Content-Type header, the browser will set it automatically with boundary
      });
      
      // Log response status
      console.log(`API Response status: ${response.status}`);
      
      // If response is not ok, try to get error message from response
      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.text();
          console.error("API Error Response:", errorData);
          if (errorData) {
            errorMessage = `${errorMessage}: ${errorData}`;
          }
        } catch (e) {
          console.error("Error reading error response:", e);
        }
        throw new Error(errorMessage);
      }
      
      const newProduct = await response.json();
      setProducts(prevProducts => [...prevProducts, newProduct]);
      return newProduct;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  };

  // Update a product
  const updateProduct = async (productId, productData) => {
    try {
      // Debug logging for FormData before sending
      console.log("Updating product - FormData entries:");
      for (let [key, value] of productData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        body: productData,
        // Do NOT set Content-Type header
      });
      
      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.text();
          console.error("API Error Response:", errorData);
          if (errorData) {
            errorMessage = `${errorMessage}: ${errorData}`;
          }
        } catch (e) {
          console.error("Error reading error response:", e);
        }
        throw new Error(errorMessage);
      }
      
      await fetchProducts(); // Refresh products after update
      return productId;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  };

  // Delete a product
  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
      return productId;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  };

  // Get a product by ID
  const getProductById = (productId) => {
    return products.find(product => product.id === productId);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// Custom hook to use the product context
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export default ProductContext;
