import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProductProvider } from './contexts/ProductContext';
import AppRoutes from './AppRoutes';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ProductProvider>
        <AppRoutes />
      </ProductProvider>
    </BrowserRouter>
  </React.StrictMode>
);