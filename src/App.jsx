// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductManagement from './components/admin/ProductManagement';
import AccountPage from './pages/AccountPage';
import PaymentCallback from './components/payment/PaymentCallback';
import SchedulePickup from './components/customer/SchedulePickup';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/products" element={<ProductManagement />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />
      <Route path="/schedulePickup" element={<SchedulePickup />} />
    </Routes>
  );
}

export default App;