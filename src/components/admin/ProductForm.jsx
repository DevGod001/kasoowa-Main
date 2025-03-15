// src/components/admin/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { defaultWeightOptions, defaultSizeOptions } from '../../config/productConfig';

const ProductForm = ({ onSubmit, initialProduct, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    variants: [],
    imageFile: null,
    imagePreview: null,
    ...initialProduct
  });

  const [currentVariant, setCurrentVariant] = useState({
    weight: '',
    size: '',
    price: '',
    stockQuantity: '',
    imageFile: null,
    imagePreview: null
  });
  
  const [variantError, setVariantError] = useState('');

  // Calculate basePrice from variants whenever variants change
  useEffect(() => {
    if (formData.variants && formData.variants.length > 0) {
      // Find the lowest price among variants
      const lowestPrice = Math.min(
        ...formData.variants.map(variant => parseFloat(variant.price) || 0)
      );
      
      // Only update if there's a valid price
      if (lowestPrice > 0) {
        console.log("Setting basePrice to lowest variant price:", lowestPrice);
      }
      // Clear variant error if variants exist
      setVariantError('');
    }
  }, [formData.variants]);

  const handleImageChange = (e, isVariant = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isVariant) {
        setCurrentVariant({
          ...currentVariant,
          imageFile: file,
          imagePreview: URL.createObjectURL(file)
        });
      } else {
        setFormData({
          ...formData,
          imageFile: file,
          imagePreview: URL.createObjectURL(file)
        });
      }
    }
  };

  const addVariant = () => {
    if (currentVariant.weight && currentVariant.size && currentVariant.price && currentVariant.stockQuantity) {
      setFormData({
        ...formData,
        variants: [...formData.variants, { 
          ...currentVariant, 
          id: Date.now().toString(),
          imageUrl: currentVariant.imagePreview // Store the image URL
        }]
      });
      setCurrentVariant({
        weight: '',
        size: '',
        price: '',
        stockQuantity: '',
        imageFile: null,
        imagePreview: null
      });
      // Clear any variant error when a variant is added
      setVariantError('');
    }
  };

  const removeVariant = (variantId) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter(v => v.id !== variantId)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one variant exists
    if (!formData.variants || formData.variants.length === 0) {
      setVariantError('At least one product variant is required');
      return; // Prevent form submission
    }
    
    // Debug log for form state
    console.log("Form state before creating FormData:", formData);
    
    const productData = new FormData();
    
    // Explicitly add each required field to ensure they're properly added
    productData.append('title', formData.title || '');
    productData.append('description', formData.description || '');
    productData.append('category', formData.category || '');
    
    // Calculate and add basePrice from variants
    if (formData.variants && formData.variants.length > 0) {
      // Use the lowest variant price as basePrice
      const lowestPrice = Math.min(
        ...formData.variants.map(variant => parseFloat(variant.price) || 0)
      );
      productData.append('basePrice', lowestPrice.toString());
      console.log("Added basePrice from variants:", lowestPrice);
    }
    
    // Append main product image if it exists
    if (formData.imageFile) {
      productData.append('image', formData.imageFile);
      console.log("Added image file:", formData.imageFile.name);
    }

    // Append variant images and update variant data
    const variantsWithImages = formData.variants.map((variant, index) => {
      if (variant.imageFile) {
        const imageKey = `variantImage_${index}`;
        productData.append(imageKey, variant.imageFile);
        console.log(`Added variant image ${index}:`, variant.imageFile.name);
        return {
          ...variant,
          imageKey
        };
      }
      return variant;
    });

    // Append variants as JSON
    if (formData.variants && formData.variants.length > 0) {
      productData.append('variants', JSON.stringify(variantsWithImages));
      console.log("Added variants:", JSON.stringify(variantsWithImages));
    }
    
    // Debug log to see what's in the FormData
    console.log("FormData entries:");
    for (let [key, value] of productData.entries()) {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    }

    await onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main Product Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
        <div className="mt-1 flex items-center">
          {formData.imagePreview && (
            <img
              src={formData.imagePreview}
              alt="Preview"
              className="h-32 w-32 object-cover rounded-md mr-4 border border-gray-300"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, false)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 rounded-md p-2"
          />
        </div>
      </div>

      {/* Title Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 bg-white"
          required
          placeholder="Enter product title"
        />
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 bg-white"
          required
          placeholder="Enter product description"
        />
      </div>

      {/* Category Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 bg-white"
          required
        >
          <option value="">Select Category</option>
          <option value="Grains and Staples">Grains and Staples</option>
          <option value="Vegetables and leaves">Vegetables and leaves</option>
          <option value="Proteins:meat and fish">Proteins:meat and fish</option>
          <option value="Oils and seasonings">Oils and seasonings</option>
          <option value="Soup ingredients">Soup ingredients</option>
          <option value="Swallow and snacks">Swallow and snacks</option>
        </select>
      </div>

      {/* Display for calculated base price (read-only) */}
      {formData.variants && formData.variants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Calculated)</label>
          <div className="mt-1 py-2 px-3 bg-gray-100 rounded-md text-gray-800 border border-gray-300">
            ₦{Math.min(...formData.variants.map(v => parseFloat(v.price) || 0)).toLocaleString()}
            <p className="text-xs text-gray-500 mt-1">
              This is the lowest price from your variants and will be used as the base price
            </p>
          </div>
        </div>
      )}

      {/* Variants Section */}
      <div className="border-t border-gray-300 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Add Variants <span className="text-red-500">*</span>
          </h3>
          {formData.variants && formData.variants.length > 0 && (
            <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
              {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''} added
            </div>
          )}
        </div>

        {/* Variant error message */}
        {variantError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm border border-red-200">
            {variantError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md border border-gray-300">
          {/* Weight Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight <span className="text-red-500">*</span></label>
            <select
              value={currentVariant.weight}
              onChange={(e) => setCurrentVariant({ ...currentVariant, weight: e.target.value })}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 bg-white"
            >
              <option value="">Select Weight</option>
              {defaultWeightOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size <span className="text-red-500">*</span></label>
            <select
              value={currentVariant.size}
              onChange={(e) => setCurrentVariant({ ...currentVariant, size: e.target.value })}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 bg-white"
            >
              <option value="">Select Size</option>
              {defaultSizeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) <span className="text-red-500">*</span></label>
            <input
              type="number"
              placeholder="Enter price"
              value={currentVariant.price}
              onChange={(e) => setCurrentVariant({ ...currentVariant, price: e.target.value })}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 bg-white"
            />
          </div>

          {/* Stock Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              placeholder="Enter quantity"
              value={currentVariant.stockQuantity}
              onChange={(e) => setCurrentVariant({ ...currentVariant, stockQuantity: e.target.value })}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 bg-white"
            />
          </div>

          {/* Variant Image Upload */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Variant Image</label>
            <div className="flex items-center">
              {currentVariant.imagePreview && (
                <img
                  src={currentVariant.imagePreview}
                  alt="Variant Preview"
                  className="h-24 w-24 object-cover rounded-md mr-4 border border-gray-300"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, true)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 rounded-md p-2 bg-white"
              />
            </div>
          </div>

          {/* Add Variant Button */}
          <button
            type="button"
            onClick={addVariant}
            disabled={!currentVariant.weight || !currentVariant.size || !currentVariant.price || !currentVariant.stockQuantity}
            className={`col-span-1 sm:col-span-2 ${
              !currentVariant.weight || !currentVariant.size || !currentVariant.price || !currentVariant.stockQuantity
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } px-4 py-2 rounded-md font-medium text-center mt-2`}
          >
            Add Variant
          </button>
        </div>

        {/* Variant List */}
        <div className="mt-4 space-y-2">
          {formData.variants.map((variant) => (
            <div key={variant.id} className="flex justify-between items-center p-3 bg-white rounded-md border border-gray-300 shadow-sm">
              <div className="flex items-center">
                {variant.imagePreview && (
                  <img
                    src={variant.imagePreview}
                    alt={`${variant.weight} - ${variant.size}`}
                    className="h-12 w-12 object-cover rounded-md mr-4 border border-gray-300"
                  />
                )}
                <span>
                  {variant.weight} - {variant.size} - ₦{variant.price} - Stock: {variant.stockQuantity}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeVariant(variant.id)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-300">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 shadow-sm"
        >
          {initialProduct ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
