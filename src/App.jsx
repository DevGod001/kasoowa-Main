// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProductManagement from "./components/admin/ProductManagement";
import AccountPage from "./pages/AccountPage";
import PaymentCallback from "./components/payment/PaymentCallback";
import SchedulePickup from "./components/customer/SchedulePickup";
import VendorDashboard from "./components/vendor/VendorDashboard";
import VendorStore from "./components/vendor/VendorStore";
import VendorRegistration from "./components/auth/VendorRegistration";
import VendorAuth from "./components/auth/VendorAuth";
import VendorLogin from "./components/auth/VendorLogin";
import StoreCustomization from "./components/vendor/StoreCustomization";
import DomainSettings from "./components/vendor/DomainSettings";
import VendorSettings from "./components/vendor/VendorSettings";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import { useAuth } from "./contexts/AuthContext";
import VendorDashboardPending from "./components/vendor/VendorDashboardPending";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AboutPage from "./pages/AboutPages";

// Affiliate Components
import AffiliateDashboard from "./components/affiliate/AffiliateDashboard";
import AffiliateRegistration from "./components/affiliate/AffiliateRegistration";
import AffiliatePending from "./components/affiliate/AffiliatePending";
import AffiliateProductList from "./components/affiliate/AffiliateProductList";
import AffiliateWallet from "./components/affiliate/AffiliateWallet";
import AffiliateStore from "./components/affiliate/AffiliateStore";
import AffiliateSettings from "./components/affiliate/AffiliateSettings";
import AffiliateAuth from "./components/auth/AffiliateAuth";
import AffiliateLogin from "./components/auth/AffiliateLogin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/products" element={<ProductManagement />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />
      <Route path="/schedulePickup" element={<SchedulePickup />} />

      {/* Vendor Routes */}
      <Route path="/vendor/auth" element={<VendorAuth />} />
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/vendor/registration" element={<VendorRegistration />} />
      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute>
            <VendorDashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/customize"
        element={
          <ProtectedRoute>
            <StoreCustomization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/domain"
        element={
          <ProtectedRoute>
            <DomainSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/settings"
        element={
          <ProtectedRoute>
            <VendorSettings />
          </ProtectedRoute>
        }
      />

      {/* Affiliate Routes */}
      <Route path="/affiliate/auth" element={<AffiliateAuth />} />
      <Route path="/affiliate/login" element={<AffiliateLogin />} />
      <Route path="/affiliate/register" element={<AffiliateRegistration />} />

      {/* Dashboard can be accessed by any logged-in affiliate user */}
      <Route
        path="/affiliate/dashboard"
        element={
          <ProtectedRoute>
            <AffiliateDashboard />
          </ProtectedRoute>
        }
      />

      {/* Pending status page for users with pending applications */}
      <Route
        path="/affiliate/pending"
        element={
          <ProtectedRoute>
            <AffiliatePending />
          </ProtectedRoute>
        }
      />

      {/* Routes that require approved affiliate status */}
      <Route
        path="/affiliate/products"
        element={
          <ProtectedRoute requireAffiliateApproval={true}>
            <AffiliateProductList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/affiliate/wallet"
        element={
          <ProtectedRoute requireAffiliateApproval={true}>
            <AffiliateWallet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/affiliate/settings"
        element={
          <ProtectedRoute requireAffiliateApproval={true}>
            <AffiliateSettings />
          </ProtectedRoute>
        }
      />

      {/* Public affiliate store routes */}
      <Route path="/affiliate/:storeSlug" element={<AffiliateStore />} />
      <Route
        path="/affiliate/:storeSlug/product/:productId"
        element={<ProductDetailsPage />}
      />

      {/* Product Routes */}
      <Route path="/product/:productId" element={<ProductDetailsPage />} />
      <Route path="/store/:storeSlug" element={<VendorStore />} />
      <Route
        path="/store/:storeSlug/product/:productId"
        element={<ProductDetailsPage />}
      />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

// Separate component to handle the conditional rendering for vendor dashboard
function VendorDashboardRouter() {
  const { user } = useAuth();
  return user && user.status === "pending" ? (
    <VendorDashboardPending />
  ) : (
    <VendorDashboard />
  );
}

export default App;
