import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the event name directly here for consistency
const PRODUCTS_UPDATED_EVENT = 'kasoowaProductsUpdated';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem('kasoowaOrders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  useEffect(() => {
    localStorage.setItem('kasoowaOrders', JSON.stringify(orders));
  }, [orders]);

  const createOrder = (orderData) => {
    console.log("STEP 1: Order creation started with data:", orderData);
    
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'pending',
      deliveryMethod: orderData.deliveryMethod || 'delivery',
      paymentType: orderData.paymentType || 'full', // 'full' or 'deposit'
      deliveryAddress: orderData.deliveryMethod === 'delivery' ? {
        address: orderData.address,
        state: orderData.state,
        city: orderData.city,
        additionalInfo: orderData.additionalInfo
      } : null,
      deliveryFee: orderData.deliveryFee || 0,
      amountPaid: orderData.amountPaid || 0,
      balanceDue: orderData.balanceDue || 0,
      ...orderData
    };

    console.log("STEP 2: Created new order object:", newOrder);
    
    // Save the order
    setOrders(prevOrders => {
      const updatedOrders = [newOrder, ...prevOrders];
      console.log("STEP 3: Adding new order to orders array. New count:", updatedOrders.length);
      return updatedOrders;
    });

    console.log("STEP 4: Starting stock update process...");
    
    // Update product stock quantities after creating the order
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
    
    console.log("STEP FINAL: Order creation completed. Order ID:", newOrder.id);
    return newOrder.id;
  };

  const getOrdersByUser = (identifier) => {
    return orders.filter(order => 
      order.userEmail === identifier || order.userPhone === identifier
    );
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const updateOrderPickupSchedule = (orderId, pickupData) => {
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
  };

  const updateDeliveryStatus = (orderId, deliveryStatus) => {
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
  };

  const updateDeliveryAddress = (orderId, addressData) => {
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
  };

  const cancelOrderPickupSchedule = (orderId) => {
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
  };

  const updatePaymentStatus = (orderId, paymentData) => {
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
  };

  const refreshOrders = () => {
    const savedOrders = localStorage.getItem('kasoowaOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  };

  // Subscribe to storage events for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'kasoowaOrders') {
        refreshOrders();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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