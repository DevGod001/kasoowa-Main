// src/contexts/AffiliateContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AffiliateContext = createContext();

export const AffiliateProvider = ({ children }) => {
  const { user } = useAuth();
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [affiliateData, setAffiliateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);

  // Wrap calculateAffiliateEarnings in useCallback to avoid infinite loops
  const calculateAffiliateEarnings = useCallback((affiliateId) => {
    try {
      const allOrders = JSON.parse(localStorage.getItem('kasoowaOrders') || '[]');
      
      let availableBalance = 0;
      let pendingBalance = 0;
      
      // Filter to orders with affiliate referral
      const affiliateOrders = allOrders.filter(order => order.affiliateId === affiliateId);
      
      affiliateOrders.forEach(order => {
        // Calculate commission (2% of order total)
        const commissionRate = 2; // 2% affiliate commission
        const orderTotal = order.total || 0;
        const commission = (orderTotal * commissionRate) / 100;
        
        // Add to available balance if order is completed, otherwise to pending
        if (order.status === 'completed') {
          availableBalance += commission;
        } else if (order.status !== 'disputed' && order.status !== 'cancelled') {
          pendingBalance += commission;
        }
      });
      
      // Adjust available balance based on withdrawals
      const withdrawals = JSON.parse(localStorage.getItem(`withdrawals_affiliate_${user?.id}`) || '[]');
      
      withdrawals.forEach(withdrawal => {
        if (withdrawal.status === 'completed' || withdrawal.status === 'pending') {
          availableBalance -= withdrawal.amount;
        }
      });
      
      setEarnings(availableBalance);
      setPendingAmount(pendingBalance);
    } catch (error) {
      console.error('Error calculating affiliate earnings:', error);
      setEarnings(0);
      setPendingAmount(0);
    }
  }, [user]);

  // Fetch affiliate data if user is logged in
  useEffect(() => {
    const fetchAffiliateData = () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get affiliates from localStorage
        const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]');
        const affiliate = affiliates.find(a => a.userId === user.id);
        
        const pendingAffiliates = JSON.parse(localStorage.getItem('pendingAffiliates') || '[]');
        const pendingAffiliate = pendingAffiliates.find(a => a.userId === user.id);

        if (affiliate) {
          setIsAffiliate(true);
          setIsPending(false);
          setAffiliateData(affiliate);
          
          // Set store info
          setStoreName(affiliate.storeName);
          setStoreUrl(`${window.location.origin}/affiliate/${affiliate.storeSlug}`);
          
          // Get selected products
          const allProducts = JSON.parse(localStorage.getItem('kasoowaProducts') || '[]');
          const affiliateProducts = affiliate.products || [];
          const productsData = allProducts.filter(p => affiliateProducts.includes(p.id));
          setSelectedProducts(productsData);
          
          // Get withdrawals
          const withdrawals = JSON.parse(localStorage.getItem(`withdrawals_affiliate_${user.id}`) || '[]');
          const pending = withdrawals.filter(w => w.status === 'pending');
          const completed = withdrawals.filter(w => w.status === 'completed');
          
          setPendingWithdrawals(pending);
          setWithdrawalHistory(completed);
          
          // Calculate earnings and pending amount
          calculateAffiliateEarnings(affiliate.id);
        } else if (pendingAffiliate) {
          setIsAffiliate(false);
          setIsPending(true);
          setAffiliateData(pendingAffiliate);
        } else {
          setIsAffiliate(false);
          setIsPending(false);
          setAffiliateData(null);
        }
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateData();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (['affiliates', 'pendingAffiliates', 'kasoowaOrders', `withdrawals_affiliate_${user?.id}`].includes(e.key)) {
        fetchAffiliateData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, calculateAffiliateEarnings]);

  // Apply to become an affiliate
  const applyForAffiliate = async (applicationData) => {
    try {
      // Check if email already exists in users or pendingAffiliates
      const pendingAffiliates = JSON.parse(localStorage.getItem('pendingAffiliates') || '[]');
      const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]');
      const usersData = JSON.parse(localStorage.getItem('users') || '[]');
      
      const emailExists = usersData.some(u => u.email.toLowerCase() === applicationData.email.toLowerCase()) ||
                          pendingAffiliates.some(a => a.email.toLowerCase() === applicationData.email.toLowerCase()) ||
                          affiliates.some(a => a.email.toLowerCase() === applicationData.email.toLowerCase());
      
      if (emailExists && !user) {
        return { 
          success: false, 
          message: 'This email is already registered. Please use a different email or login to your account.'
        };
      }
      
      // Check if user is already an affiliate or has a pending application
      if (user) {
        if (isAffiliate) {
          return { success: false, message: 'You are already an affiliate' };
        }
        
        if (isPending) {
          return { success: false, message: 'You already have a pending application' };
        }
      }
      
      // Generate a unique ID for the application
      const applicationId = `affiliate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Generate userId if not logged in
      const userId = user?.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create store slug from storeName (lowercase, replace spaces with hyphens)
      const storeSlug = applicationData.storeName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      // Create user if not logged in
      if (!user) {
        const newUser = {
          id: userId,
          email: applicationData.email,
          fullName: applicationData.fullName,
          password: applicationData.password, // This is already hashed
          createdAt: new Date().toISOString()
        };
        
        // Save the new user to localStorage
        usersData.push(newUser);
        localStorage.setItem('users', JSON.stringify(usersData));
        
        // Log the new user
        console.log('New user created:', newUser);
      }
      
      // Create the affiliate application
      const newApplication = {
        id: applicationId,
        userId: userId,
        fullName: applicationData.fullName,
        email: applicationData.email,
        phone: applicationData.phone,
        storeName: applicationData.storeName,
        storeSlug: storeSlug,
        description: applicationData.description,
        bankName: applicationData.bankName,
        bankCode: applicationData.bankCode,
        accountNumber: applicationData.accountNumber,
        accountName: applicationData.accountName,
        applicationDate: new Date().toISOString(),
        status: 'pending',
        products: []
      };
      
      // Save to localStorage
      pendingAffiliates.push(newApplication);
      localStorage.setItem('pendingAffiliates', JSON.stringify(pendingAffiliates));
      
      // Update state if user is logged in
      if (user) {
        setIsPending(true);
        setAffiliateData(newApplication);
      }
      
      // Return success with user data for auto-login
      return { 
        success: true,
        userData: {
          id: userId,
          email: applicationData.email,
          name: applicationData.fullName
        }
      };
    } catch (error) {
      console.error('Error applying for affiliate:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to submit application. Please try again.' 
      };
    }
  };

  // Add a product to affiliate store
  const addProductToStore = async (productId) => {
    try {
      if (!user || !isAffiliate || !affiliateData) {
        throw new Error('You must be an approved affiliate to add products');
      }
      
      // Get current affiliates list
      const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]');
      const affiliateIndex = affiliates.findIndex(a => a.userId === user.id);
      
      if (affiliateIndex === -1) {
        throw new Error('Affiliate account not found');
      }
      
      // Add product if not already added
      if (!affiliates[affiliateIndex].products.includes(productId)) {
        affiliates[affiliateIndex].products.push(productId);
        localStorage.setItem('affiliates', JSON.stringify(affiliates));
        
        // Update selected products in state
        const allProducts = JSON.parse(localStorage.getItem('kasoowaProducts') || '[]');
        const product = allProducts.find(p => p.id === productId);
        
        if (product) {
          setSelectedProducts(prev => [...prev, product]);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding product to affiliate store:', error);
      return { success: false, message: error.message };
    }
  };

  // Remove a product from affiliate store
  const removeProductFromStore = async (productId) => {
    try {
      if (!user || !isAffiliate || !affiliateData) {
        throw new Error('You must be an approved affiliate to manage products');
      }
      
      // Get current affiliates list
      const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]');
      const affiliateIndex = affiliates.findIndex(a => a.userId === user.id);
      
      if (affiliateIndex === -1) {
        throw new Error('Affiliate account not found');
      }
      
      // Remove product
      affiliates[affiliateIndex].products = affiliates[affiliateIndex].products.filter(
        id => id !== productId
      );
      
      localStorage.setItem('affiliates', JSON.stringify(affiliates));
      
      // Update selected products in state
      setSelectedProducts(prev => prev.filter(p => p.id !== productId));
      
      return { success: true };
    } catch (error) {
      console.error('Error removing product from affiliate store:', error);
      return { success: false, message: error.message };
    }
  };

  // Request withdrawal
  const requestWithdrawal = async (amount, paymentMethod, accountDetails) => {
    try {
      if (!user || !isAffiliate) {
        throw new Error('You must be an approved affiliate to request withdrawals');
      }
      
      if (amount <= 0) {
        throw new Error('Withdrawal amount must be greater than zero');
      }
      
      if (amount > earnings) {
        throw new Error('Insufficient balance for this withdrawal');
      }
      
      // Create a withdrawal request
      const withdrawalId = `withdrawal_${Date.now()}`;
      const withdrawalRequest = {
        id: withdrawalId,
        affiliateId: affiliateData.id,
        amount: amount,
        paymentMethod,
        accountDetails,
        status: 'pending',
        requestDate: new Date().toISOString()
      };
      
      // Save to localStorage
      const withdrawals = JSON.parse(localStorage.getItem(`withdrawals_affiliate_${user.id}`) || '[]');
      withdrawals.push(withdrawalRequest);
      localStorage.setItem(`withdrawals_affiliate_${user.id}`, JSON.stringify(withdrawals));
      
      // Update state
      setPendingWithdrawals(prev => [...prev, withdrawalRequest]);
      
      return { success: true };
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return { success: false, message: error.message };
    }
  };

  // Update store settings
  const updateStoreSettings = async (settings) => {
    try {
      if (!user || !isAffiliate) {
        throw new Error('You must be an approved affiliate to update store settings');
      }
      
      // Get current affiliates list
      const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]');
      const affiliateIndex = affiliates.findIndex(a => a.userId === user.id);
      
      if (affiliateIndex === -1) {
        throw new Error('Affiliate account not found');
      }
      
      // Update settings
      affiliates[affiliateIndex] = {
        ...affiliates[affiliateIndex],
        ...settings
      };
      
      localStorage.setItem('affiliates', JSON.stringify(affiliates));
      
      // Update state
      setAffiliateData(prev => ({
        ...prev,
        ...settings
      }));
      
      if (settings.storeName) {
        setStoreName(settings.storeName);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating store settings:', error);
      return { success: false, message: error.message };
    }
  };

  // Get affiliate referral link for a product
  const getProductReferralLink = (productId) => {
    if (!affiliateData || !affiliateData.storeSlug) {
      return '';
    }
    
    return `${window.location.origin}/affiliate/${affiliateData.storeSlug}/product/${productId}`;
  };

  // Get monthly sales data for dashboard
  const getMonthlyData = () => {
    if (!user || !isAffiliate) {
      return [];
    }
    
    try {
      const allOrders = JSON.parse(localStorage.getItem('kasoowaOrders') || '[]');
      const affiliateOrders = allOrders.filter(order => order.affiliateId === affiliateData.id);
      
      // Group by month
      const monthlyData = {};
      
      affiliateOrders.forEach(order => {
        const date = new Date(order.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            orders: 0,
            sales: 0,
            commissions: 0
          };
        }
        
        monthlyData[monthKey].orders += 1;
        monthlyData[monthKey].sales += order.total || 0;
        monthlyData[monthKey].commissions += ((order.total || 0) * 2) / 100; // 2% commission
      });
      
      // Convert to array and sort by month
      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('Error getting monthly data:', error);
      return [];
    }
  };

  const value = {
    isAffiliate,
    isPending,
    affiliateData,
    loading,
    earnings,
    pendingAmount,
    selectedProducts,
    storeName,
    storeUrl,
    pendingWithdrawals,
    withdrawalHistory,
    applyForAffiliate,
    addProductToStore,
    removeProductFromStore,
    requestWithdrawal,
    updateStoreSettings,
    getProductReferralLink,
    getMonthlyData
  };

  return (
    <AffiliateContext.Provider value={value}>
      {children}
    </AffiliateContext.Provider>
  );
};

export const useAffiliate = () => {
  const context = useContext(AffiliateContext);
  if (!context) {
    throw new Error('useAffiliate must be used within an AffiliateProvider');
  }
  return context;
};

export default AffiliateContext;