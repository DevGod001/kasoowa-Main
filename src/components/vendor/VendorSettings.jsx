// src/components/vendor/VendorSettings.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import BankAccountsManager from "../shared/BankAccountsManager";

const VendorSettings = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <Link
          to="/vendor/dashboard"
          className="inline-flex items-center text-green-600 hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Vendor Settings</h1>

      {/* Personal Information Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Business Name</p>
            <p className="font-medium">{user.businessName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Store URL</p>
            <p className="font-medium">
              {window.location.origin}/store/{user.storeSlug}
            </p>
          </div>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <BankAccountsManager userType="vendor" />

      {/* Domain Settings Shortcut */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Custom Domain</h2>
        <p className="text-gray-600 mb-4">
          Configure a custom domain for your store to improve branding and
          customer trust.
        </p>
        <Link
          to="/vendor/domain"
          className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Configure Domain Settings
        </Link>
      </div>
    </div>
  );
};

export default VendorSettings;
