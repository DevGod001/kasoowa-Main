// src/components/vendor/StoreCustomization.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ColorPicker } from '../ui/ColorPicker';

const StoreCustomization = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState({
    primaryColor: '#16a34a',
    accentColor: '#22c55e',
    backgroundColor: '#ffffff',
    headerStyle: 'gradient',
    fontFamily: 'Inter',
    bannerImage: null,
    logo: null
  });

  // Load existing theme if any
  useEffect(() => {
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    const currentVendor = vendors.find(v => v.id === user.id);
    if (currentVendor?.storeTheme) {
      setTheme(currentVendor.storeTheme);
    }
  }, [user.id]);

  const saveTheme = async () => {
    try {
      const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
      const updatedVendors = vendors.map(vendor => {
        if (vendor.id === user.id) {
          return {
            ...vendor,
            storeTheme: theme
          };
        }
        return vendor;
      });

      localStorage.setItem('vendors', JSON.stringify(updatedVendors));
      alert('Store theme saved successfully!');
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Failed to save theme');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Customize Your Store</h2>
      
      <div className="space-y-6">
        {/* Colors */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Store Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <ColorPicker
                color={theme.primaryColor}
                onChange={(color) => setTheme(prev => ({ ...prev, primaryColor: color }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <ColorPicker
                color={theme.accentColor}
                onChange={(color) => setTheme(prev => ({ ...prev, accentColor: color }))}
              />
            </div>
          </div>
        </div>

        {/* Header Style */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Header Style</h3>
          <select
            value={theme.headerStyle}
            onChange={(e) => setTheme(prev => ({ ...prev, headerStyle: e.target.value }))}
            className="w-full border rounded-md p-2"
          >
            <option value="gradient">Gradient</option>
            <option value="solid">Solid Color</option>
            <option value="image">Custom Image</option>
          </select>
        </div>

        {/* Font Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Font Style</h3>
          <select
            value={theme.fontFamily}
            onChange={(e) => setTheme(prev => ({ ...prev, fontFamily: e.target.value }))}
            className="w-full border rounded-md p-2"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Poppins">Poppins</option>
          </select>
        </div>

        {/* Banner Image */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Store Banner</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setTheme(prev => ({ ...prev, bannerImage: reader.result }));
                };
                reader.readAsDataURL(file);
              }
            }}
            className="w-full"
          />
          {theme.bannerImage && (
            <img 
              src={theme.bannerImage} 
              alt="Store Banner Preview" 
              className="mt-4 max-h-32 rounded-lg"
            />
          )}
        </div>

        <button
          onClick={saveTheme}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        >
          Save Theme
        </button>
      </div>
    </div>
  );
};

export default StoreCustomization;