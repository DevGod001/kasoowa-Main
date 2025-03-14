// src/services/api.js
import axios from 'axios';

// Create an axios instance with common configuration
const API = axios.create({
  baseURL: 'http://localhost:3000/api', // Updated to point to your server
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kasoowaAuthToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API endpoints
export const ProductAPI = {
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await API.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fall back to localStorage if API fails during transition
      const savedProducts = localStorage.getItem('kasoowaProducts');
      return savedProducts ? JSON.parse(savedProducts) : [];
    }
  },
  
  // Add a new product
  addProduct: async (productData) => {
    const formData = new FormData();
    
    // Add product fields to formData
    Object.keys(productData).forEach(key => {
      if (key === 'image' && productData[key] instanceof File) {
        formData.append('image', productData[key]);
      } else if (key !== 'image') {
        // Handle nested objects like variants
        if (typeof productData[key] === 'object' && productData[key] !== null) {
          formData.append(key, JSON.stringify(productData[key]));
        } else {
          formData.append(key, productData[key]);
        }
      }
    });
    
    try {
      const response = await API.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },
  
  // Update a product
  updateProduct: async (productId, updatedData) => {
    try {
      const formData = new FormData();
      
      // Add product fields to formData
      Object.keys(updatedData).forEach(key => {
        if (key === 'image' && updatedData[key] instanceof File) {
          formData.append('image', updatedData[key]);
        } else if (key !== 'image') {
          // Handle nested objects like variants
          if (typeof updatedData[key] === 'object' && updatedData[key] !== null) {
            formData.append(key, JSON.stringify(updatedData[key]));
          } else {
            formData.append(key, updatedData[key]);
          }
        }
      });
      
      const response = await API.put(`/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },
  
  // Delete a product
  deleteProduct: async (productId) => {
    try {
      const response = await API.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};

export const AuthAPI = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },
  
  // Login a user
  login: async (credentials) => {
    try {
      const response = await API.post('/auth/login', credentials);
      // Store the JWT token
      if (response.data.token) {
        localStorage.setItem('kasoowaAuthToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },
  
  // Logout a user
  logout: () => {
    localStorage.removeItem('kasoowaAuthToken');
  }
};

// Cart API endpoints
export const CartAPI = {
  // Get user cart
  getCart: async (userId) => {
    try {
      const response = await API.get(`/cart/${userId}`);
      return response.data.items;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },
  
  // Save entire cart
  saveCart: async (userId, items) => {
    try {
      const response = await API.post(`/cart/${userId}`, { items });
      return response.data;
    } catch (error) {
      console.error('Error saving cart:', error);
      throw error;
    }
  },
  
  // Update cart item
  updateCartItem: async (userId, productId, itemData) => {
    try {
      const response = await API.put(`/cart/${userId}/items/${productId}`, itemData);
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },
  
  // Remove cart item
  removeCartItem: async (userId, productId) => {
    try {
      const response = await API.delete(`/cart/${userId}/items/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw error;
    }
  },
  
  // Clear cart
  clearCart: async (userId) => {
    try {
      const response = await API.delete(`/cart/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

export default API;