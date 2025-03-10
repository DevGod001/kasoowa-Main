// src/components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAffiliate } from '../../contexts/AffiliateContext';

const ProtectedRoute = ({ children, requireAffiliateApproval = false }) => {
  const { user } = useAuth();
  const { isAffiliate, isPending, loading } = useAffiliate();
  const location = useLocation();
  
  // First check if user is authenticated
  if (!user) {
    // Path-based redirects
    if (location.pathname.startsWith('/affiliate')) {
      // For affiliate routes, redirect to affiliate-specific auth page
      return <Navigate to="/affiliate/auth" state={{ from: location.pathname }} />;
    }
    return <Navigate to="/vendor/registration" />;
  }
  
  // If we're on an affiliate page that requires approval
  if (requireAffiliateApproval && location.pathname.startsWith('/affiliate')) {
    // Wait for affiliate data to load
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      );
    }
    
    // If the user has a pending application, redirect to pending page
    if (isPending) {
      return <Navigate to="/affiliate/pending" />;
    }
    
    // If the user is not an approved affiliate and doesn't have a pending application
    if (!isAffiliate && !isPending) {
      return <Navigate to="/affiliate/register" />;
    }
  }
  
  // If all checks pass, render the protected component
  return children;
};

export default ProtectedRoute;