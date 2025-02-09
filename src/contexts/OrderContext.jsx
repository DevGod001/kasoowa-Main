import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'pending',
      ...orderData
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
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

  return (
    <OrderContext.Provider 
      value={{ 
        orders, 
        createOrder, 
        getOrdersByUser, 
        updateOrderStatus,
        updateOrderPickupSchedule,
        cancelOrderPickupSchedule,
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

export default OrderProvider;