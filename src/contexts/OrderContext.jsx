import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api'; // Import the API service

// Define the event name directly here for consistency
const PRODUCTS_UPDATED_EVENT = 'kasoowaProductsUpdated';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem('kasoowaOrders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  // Sync with localStorage whenever orders state changes
  useEffect(() => {
    localStorage.setItem('kasoowaOrders', JSON.stringify(orders));
  }, [orders]);

  // Fetch orders from backend on mount (if available)
  useEffect(() => {
    const fetchOrdersFromBackend = async () => {
      try {
        // Get user identifier for filtering
        const userIdentifier = localStorage.getItem('userIdentifier');
        const token = localStorage.getItem('kasoowaAuthToken');
        
        // Only fetch if we have an identifier and token
        if (userIdentifier && token) {
          const response = await API.get(`/api/orders/identifier/${userIdentifier}`);
          if (response.data && Array.isArray(response.data)) {
            // Update state with backend data
            setOrders(response.data);
            
            // Also sync to localStorage
            localStorage.setItem('kasoowaOrders', JSON.stringify(response.data));
            console.log("Orders fetched from backend:", response.data.length);
          }
        }
      } catch (error) {
        console.warn('Could not fetch orders from backend:', error);
        // No need to show error - we'll use localStorage data as fallback
      }
    };

    fetchOrdersFromBackend();
    
    // Setup sync interval (every 30 seconds)
    const intervalId = setInterval(fetchOrdersFromBackend, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const createOrder = async (orderData) => {
    console.log("STEP 1: Order creation started with data:", orderData);
    
    // Group items by vendor
    const itemsByVendor = {};
    
    orderData.items.forEach(item => {
      const vendorId = item.vendorId || 'no-vendor'; // Default for items without a vendor
      
      if (!itemsByVendor[vendorId]) {
        itemsByVendor[vendorId] = {
          items: [],
          vendorName: item.vendorName || 'Kasoowa FoodHub',
          vendorSlug: item.vendorSlug || ''
        };
      }
      
      itemsByVendor[vendorId].items.push(item);
    });
    
    console.log("Grouped items by vendor:", itemsByVendor);
    
    // Calculate subtotals for each vendor
    Object.keys(itemsByVendor).forEach(vendorId => {
      let vendorSubtotal = 0;
      
      itemsByVendor[vendorId].items.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        vendorSubtotal += itemPrice * itemQuantity;
      });
      
      itemsByVendor[vendorId].subtotal = vendorSubtotal;
    });
    
    // Calculate delivery fee proportions if delivery method is "delivery"
    const totalDeliveryFee = orderData.deliveryFee || 0;
    const subtotalSum = Object.values(itemsByVendor).reduce((sum, vendor) => sum + vendor.subtotal, 0);
    
    // Create separate orders for each vendor
    const orderIds = [];
    const newOrders = [];
    
    Object.entries(itemsByVendor).forEach(([vendorId, vendorData]) => {
      // Calculate proportional delivery fee (only applies if delivery method is "delivery")
      const deliveryFeeProportion = orderData.deliveryMethod === 'delivery' 
        ? (vendorData.subtotal / subtotalSum) * totalDeliveryFee 
        : 0;
      
      // Calculate total for this vendor
      const vendorTotal = vendorData.subtotal + (orderData.deliveryMethod === 'delivery' ? deliveryFeeProportion : 0);
      
      // Calculate amount paid and balance due for this vendor
      const vendorAmountPaid = orderData.deliveryMethod === 'delivery' 
        ? vendorTotal 
        : vendorData.subtotal * 0.1; // 10% deposit for pickup
      
      const vendorBalanceDue = orderData.deliveryMethod === 'delivery' 
        ? 0 
        : vendorTotal - vendorAmountPaid;
      
      // Create vendor-specific order
      const vendorOrder = {
        id: `${Date.now().toString()}-${vendorId}`,
        date: new Date().toISOString(),
        status: 'pending',
        deliveryMethod: orderData.deliveryMethod,
        paymentType: orderData.paymentType || 'full', // 'full' or 'deposit'
        deliveryAddress: orderData.deliveryMethod === 'delivery' ? {
          address: orderData.address,
          state: orderData.state,
          city: orderData.city,
          additionalInfo: orderData.additionalInfo
        } : null,
        deliveryFee: deliveryFeeProportion,
        amountPaid: vendorAmountPaid,
        balanceDue: vendorBalanceDue,
        userEmail: orderData.userEmail,
        userPhone: orderData.userPhone,
        items: vendorData.items,
        total: vendorTotal,
        subtotal: vendorData.subtotal,
        vendorId: vendorId !== 'no-vendor' ? vendorId : null,
        vendorName: vendorData.vendorName,
        vendorSlug: vendorData.vendorSlug,
        paymentReference: orderData.paymentReference,
        depositPercentage: orderData.deliveryMethod === 'delivery' ? "100" : "10",
        depositPaid: vendorAmountPaid,
        affiliateId: orderData.affiliateId
      };
      
      console.log(`Created order for vendor ${vendorId}:`, vendorOrder);
      
      newOrders.push(vendorOrder);
      orderIds.push(vendorOrder.id);
    });

    // First update product stock quantities
    if (orderData.items && orderData.items.length > 0) {
      console.log("STEP 5: Order has items:", orderData.items);
      
      try {
        // Get products from localStorage
        const storedProducts = localStorage.getItem('kasoowaProducts');
        console.log("STEP 6: Retrieved products from localStorage");
        
        let products = JSON.parse(storedProducts || '[]');
        console.log("STEP 7: Parsed products:", products.length, "products found");
        
        // Track if any updates are made
        let hasUpdates = false;
        
        // Create a new array to hold updated products
        const updatedProducts = products.map(product => {
          // CRITICAL FIX: Convert both IDs to strings for comparison
          const orderItem = orderData.items.find(item => 
            String(item.id) === String(product.id)
          );
          
          if (orderItem) {
            console.log(`STEP 8: Found product ${product.id} in order. Current stock:`, 
              product.stockQuantity,
              "Order quantity:", orderItem.quantity);
              
            console.log("Order item data:", orderItem);
            console.log("Product data:", product);
              
            const productCopy = {...product};
            
            if (orderItem.selectedVariant || orderItem.variant) {
              // Handle variant products
              const variant = orderItem.selectedVariant || orderItem.variant;
              console.log("STEP 9A: Processing variant product. Variant:", variant);
              
              if (productCopy.variants) {
                console.log("STEP 10A: Product has variants:", productCopy.variants.length);
                
                // CRITICAL FIX: Convert variant IDs to strings for comparison
                const variantIndex = productCopy.variants.findIndex(v => 
                  String(v.id) === String(variant.id)
                );
                
                console.log("STEP 11A: Found variant at index:", variantIndex);
                
                if (variantIndex !== -1) {
                  // Update the variant's stock
                  const currentStock = parseInt(productCopy.variants[variantIndex].stockQuantity);
                  const newStock = Math.max(0, currentStock - orderItem.quantity);
                  console.log(`STEP 12A: Updating variant stock from ${currentStock} to ${newStock}`);
                  
                  productCopy.variants[variantIndex] = {
                    ...productCopy.variants[variantIndex],
                    stockQuantity: newStock
                  };
                  
                  hasUpdates = true;
                  console.log("STEP 13A: Variant stock updated");
                } else {
                  console.log("STEP 11A-ERROR: Variant not found in product!");
                  console.log("Looking for variant ID:", variant.id);
                  console.log("Available variant IDs:", productCopy.variants.map(v => v.id));
                }
              } else {
                console.log("STEP 10A-ERROR: Product has no variants array!");
              }
            } else {
              // Handle regular products
              console.log("STEP 9B: Processing regular product");
              
              const currentStock = parseInt(productCopy.stockQuantity);
              const newStock = Math.max(0, currentStock - orderItem.quantity);
              console.log(`STEP 10B: Updating product stock from ${currentStock} to ${newStock}`);
              
              productCopy.stockQuantity = newStock;
              hasUpdates = true;
              console.log("STEP 11B: Product stock updated");
            }
            
            return productCopy;
          } else {
            // Return unchanged if not in order
            return product;
          }
        });
        
        // Save the updated products to localStorage
        if (hasUpdates) {
          console.log("STEP 14: Updates detected, saving to localStorage");
          
          // Log a sample product before and after for comparison
          const sampleProductId = orderData.items[0]?.id;
          const beforeProduct = products.find(p => String(p.id) === String(sampleProductId));
          const afterProduct = updatedProducts.find(p => String(p.id) === String(sampleProductId));
          
          console.log("Sample product before:", beforeProduct);
          console.log("Sample product after:", afterProduct);
          
          localStorage.setItem('kasoowaProducts', JSON.stringify(updatedProducts));
          console.log("STEP 15: Products saved to localStorage");
          
          // Dispatch custom event
          console.log("STEP 16: Dispatching custom event:", PRODUCTS_UPDATED_EVENT);
          window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
          
          // Also dispatch storage event for other tabs
          window.dispatchEvent(new Event('storage'));
          console.log("STEP 17: Dispatched storage event");
        } else {
          console.log("STEP 14-ERROR: No updates were made to products");
        }
      } catch (error) {
        console.error('STEP ERROR: Error updating product stock:', error);
      }
    } else {
      console.log("STEP 5-ERROR: Order has no items");
    }

    // Now try to save orders to backend if possible
    try {
      // Send orders to the backend API
      const response = await API.post('/api/orders/batch', { orders: newOrders });
      console.log("Orders saved to backend:", response.data);
      
      // Use order IDs from backend if available
      const serverOrderIds = response.data.orders?.map(order => order.id);
      if (serverOrderIds && serverOrderIds.length > 0) {
        orderIds.length = 0; // Clear existing IDs
        orderIds.push(...serverOrderIds); // Add server-generated IDs
      }
    } catch (error) {
      console.warn('Unable to save orders to backend, using localStorage only:', error);
      // Continue with local storage only approach - don't exit the function
    }
    
    // Add all the new orders to the orders state
    setOrders(prevOrders => {
      const updatedOrders = [...newOrders, ...prevOrders];
      console.log(`STEP 3: Adding ${newOrders.length} new orders to orders array. New count:`, updatedOrders.length);
      return updatedOrders;
    });
    
    // DIRECT STOCK UPDATE: Immediately force product refresh on ALL pages that use products
    try {
      // We've updated localStorage, now force any components to reread it
      console.log("FORCE UPDATE: Manually dispatching events to update component stock");
      
      // Force a custom event
      window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
      
      // This is needed to bypass caching - modify a dummy value and immediately update it back
      // This ensures localStorage triggers a genuine change
      const dummyValue = localStorage.getItem('kasoowaForceRefresh') || '0';
      localStorage.setItem('kasoowaForceRefresh', String(Date.now()));
      setTimeout(() => {
        localStorage.setItem('kasoowaForceRefresh', dummyValue);
      }, 50);
      
      // Also dispatch storage event for other tabs
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Error in force update:", error);
    }
    
    console.log("STEP FINAL: Order creation completed. Order IDs:", orderIds);
    // Return an array of order IDs instead of a single ID
    return orderIds.length === 1 ? orderIds[0] : orderIds;
  };

  const getOrdersByUser = (identifier) => {
    return orders.filter(order => 
      order.userEmail === identifier || order.userPhone === identifier
    );
  };

  const updateOrderStatus = async (orderId, status) => {
    // First update in local state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
    );

    // Try to update in backend
    try {
      await API.put(`/api/orders/${orderId}/status`, { status });
      console.log(`Order ${orderId} status updated in backend to ${status}`);
    } catch (error) {
      console.warn(`Could not update order status in backend:`, error);
      // No need to show error to user or modify local state
      // We've already updated local state above
    }
  };

  const updateOrderPickupSchedule = async (orderId, pickupData) => {
    // First update in local state
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              pickupScheduled: true,
              pickupTime: pickupData.pickupTime,
              pickupDate: pickupData.pickupDate,
              scheduledAt: new Date().toISOString()
            }
          : order
      )
    );

    // Try to update in backend
    try {
      await API.put(`/api/orders/${orderId}/pickup-schedule`, pickupData);
      console.log(`Order ${orderId} pickup schedule updated in backend`);
    } catch (error) {
      console.warn(`Could not update pickup schedule in backend:`, error);
      // No need to show error to user or modify local state
    }
  };

  const updateDeliveryStatus = async (orderId, deliveryStatus) => {
    // First update in local state
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              deliveryStatus,
              lastUpdated: new Date().toISOString()
            }
          : order
      )
    );

    // Try to update in backend
    try {
      await API.put(`/api/orders/${orderId}/delivery-status`, { deliveryStatus });
      console.log(`Order ${orderId} delivery status updated in backend`);
    } catch (error) {
      console.warn(`Could not update delivery status in backend:`, error);
      // Continue with local state updates
    }
  };

  const updateDeliveryAddress = async (orderId, addressData) => {
    // First update in local state
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              deliveryAddress: {
                ...order.deliveryAddress,
                ...addressData
              },
              lastUpdated: new Date().toISOString()
            }
          : order
      )
    );

    // Try to update in backend
    try {
      await API.put(`/api/orders/${orderId}/delivery-address`, addressData);
      console.log(`Order ${orderId} delivery address updated in backend`);
    } catch (error) {
      console.warn(`Could not update delivery address in backend:`, error);
      // Continue with local state updates
    }
  };

  const cancelOrderPickupSchedule = async (orderId) => {
    // First update in local state
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              pickupScheduled: false,
              pickupTime: null,
              pickupDate: null,
              scheduledAt: null
            }
          : order
      )
    );

    // Try to update in backend
    try {
      await API.put(`/api/orders/${orderId}/cancel-pickup`);
      console.log(`Order ${orderId} pickup canceled in backend`);
    } catch (error) {
      console.warn(`Could not cancel pickup in backend:`, error);
      // Continue with local state updates
    }
  };

  const updatePaymentStatus = async (orderId, paymentData) => {
    // First update in local state
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              amountPaid: paymentData.amountPaid,
              balanceDue: paymentData.balanceDue,
              paymentStatus: paymentData.paymentStatus,
              lastUpdated: new Date().toISOString()
            }
          : order
      )
    );

    // Try to update in backend
    try {
      await API.put(`/api/orders/${orderId}/payment-status`, paymentData);
      console.log(`Order ${orderId} payment status updated in backend`);
    } catch (error) {
      console.warn(`Could not update payment status in backend:`, error);
      // Continue with local state updates
    }
  };

  const refreshOrders = async () => {
    try {
      // Get user identifier for filtering
      const userIdentifier = localStorage.getItem('userIdentifier');
      
      if (!userIdentifier) {
        // No authenticated user, load empty orders
        return;
      }
      
      try {
        const response = await API.get(`/api/orders/identifier/${userIdentifier}`);
        if (response.data && Array.isArray(response.data)) {
          // Update state with backend data
          setOrders(response.data);
          console.log("Orders refreshed from backend:", response.data.length);
        }
      } catch (apiError) {
        console.warn('Could not refresh orders from backend:', apiError);
        
        // Try to load from localStorage as fallback
        const savedOrders = localStorage.getItem('kasoowaOrders');
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        }
      }
    } catch (error) {
      console.error('Error in refresh orders:', error);
    }
  };

  const calculateDeliveryFee = (state, city) => {
    // Base delivery fees by state
    if (state === 'Rivers') {
      return city.toLowerCase() === 'port harcourt' ? 1000 : 1500;
    }
    // Add more state-specific logic here
    return 2500; // Default delivery fee for other states
  };

  return (
    <OrderContext.Provider 
      value={{ 
        orders, 
        createOrder, 
        getOrdersByUser, 
        updateOrderStatus,
        updateOrderPickupSchedule,
        cancelOrderPickupSchedule,
        updateDeliveryStatus,
        updateDeliveryAddress,
        updatePaymentStatus,
        calculateDeliveryFee,
        refreshOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

// Export the event name constant
export { PRODUCTS_UPDATED_EVENT };

export default OrderProvider;
