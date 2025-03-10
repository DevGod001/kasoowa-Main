// src/components/affiliate/AffiliatePending.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAffiliate } from '../../contexts/AffiliateContext';
import { Clock, ArrowLeft, HelpCircle } from 'lucide-react';

const AffiliatePending = () => {
  const { affiliateData, loading } = useAffiliate();
  const location = useLocation();
  const [pendingData, setPendingData] = useState(null);
  
  // Check if we have application data passed via location state
  useEffect(() => {
    if (location.state && location.state.applicationData) {
      setPendingData(location.state.applicationData);
    }
  }, [location]);

  // Display data from either context (for logged-in users) or location state (for guests)
  const displayData = affiliateData || pendingData;

  if (loading && !pendingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <div className="inline-block p-4 bg-yellow-50 rounded-full mb-4">
          <Clock className="h-16 w-16 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Application Under Review</h1>
        <p className="text-gray-600 mb-6">
          Thank you for applying to become an affiliate partner! Your application is currently under review.
        </p>
        <p className="text-gray-600 mb-8">
          We typically process applications within 1-2 business days. You'll receive an email notification once your application has been approved.
        </p>

        {displayData && (
          <div className="bg-gray-50 p-4 rounded-lg max-w-lg mx-auto mb-8 text-left">
            <h2 className="font-semibold mb-2">Your Application Details:</h2>
            <ul className="space-y-2 text-sm">
              <li><span className="font-medium">Store Name:</span> {displayData.storeName}</li>
              <li><span className="font-medium">Application Date:</span> {new Date(displayData.applicationDate).toLocaleString()}</li>
              <li><span className="font-medium">Status:</span> <span className="text-yellow-600 font-medium">Pending Review</span></li>
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/" className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </Link>
          <Link to="/account" className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200">
            <HelpCircle className="h-4 w-4" />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AffiliatePending;