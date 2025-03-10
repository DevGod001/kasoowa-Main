// src/components/vendor/DomainSettings.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DomainSettings = () => {
  const { user } = useAuth();
  const [customDomain, setCustomDomain] = useState('');

  const handleDomainSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
      const updatedVendors = vendors.map(vendor => {
        if (vendor.id === user.id) {
          return {
            ...vendor,
            customDomain: customDomain,
            customDomainStatus: 'pending'
          };
        }
        return vendor;
      });

      localStorage.setItem('vendors', JSON.stringify(updatedVendors));
      alert('Domain settings saved! Please verify domain ownership.');
      
      // Optionally, fetch current vendor data after saving
      const currentVendor = updatedVendors.find(v => v.id === user.id);
      if (currentVendor?.customDomain) {
        setCustomDomain(currentVendor.customDomain);
      }
    } catch (error) {
      console.error('Error saving domain settings:', error);
      alert('Failed to save domain settings');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Custom Domain Settings</h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleDomainSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Custom Domain
            </label>
            <div className="mt-1">
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="w-full border rounded-md p-2"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter your domain without http:// or www
            </p>
          </div>

          {customDomain && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">DNS Configuration</h4>
              <p className="text-sm text-gray-600 mb-4">
                Add these records to your domain's DNS settings:
              </p>
              <div className="space-y-2 font-mono text-sm">
                <p>CNAME record: store.{customDomain} → stores.kasoowa.com</p>
                <p>TXT record: kasoowa-verification={user.id}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Save Domain Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default DomainSettings;