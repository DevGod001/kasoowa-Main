// src/components/admin/ProductForm.jsx
import React, { useState } from 'react';
import { defaultWeightOptions, defaultSizeOptions } from '../../config/productConfig';

const ProductForm = ({ onSubmit, initialProduct, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    basePrice: '',
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
    const productData = new FormData();
    
    // Append main product image if it exists
    if (formData.imageFile) {
      productData.append('image', formData.imageFile);
    }

    // Append variant images and update variant data
    const variantsWithImages = formData.variants.map((variant, index) => {
      if (variant.imageFile) {
        const imageKey = `variantImage_${index}`;
        productData.append(imageKey, variant.imageFile);
        return {
          ...variant,
          imageKey
        };
      }
      return variant;
    });

    // Append other product details
    Object.keys(formData).forEach(key => {
      if (key === 'variants') {
        productData.append('variants', JSON.stringify(variantsWithImages));
      } else if (key !== 'imageFile' && key !== 'imagePreview') {
        productData.append(key, formData[key]);
      }
    });

    await onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main Product Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Image</label>
        <div className="mt-1 flex items-center">
          {formData.imagePreview && (
            <img
              src={formData.imagePreview}
              alt="Preview"
              className="h-32 w-32 object-cover rounded-md mr-4"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, false)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>
      </div>

      {/* Title Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      {/* Category Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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

      {/* Variants Section */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Variants</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Weight Selection */}
          <select
            value={currentVariant.weight}
            onChange={(e) => setCurrentVariant({ ...currentVariant, weight: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">Select Weight</option>
            {defaultWeightOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Size Selection */}
          <select
            value={currentVariant.size}
            onChange={(e) => setCurrentVariant({ ...currentVariant, size: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">Select Size</option>
            {defaultSizeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Price Input */}
          <input
            type="number"
            placeholder="Price"
            value={currentVariant.price}
            onChange={(e) => setCurrentVariant({ ...currentVariant, price: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />

          {/* Stock Quantity Input */}
          <input
            type="number"
            placeholder="Stock Quantity"
            value={currentVariant.stockQuantity}
            onChange={(e) => setCurrentVariant({ ...currentVariant, stockQuantity: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />

          {/* Variant Image Upload */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Variant Image</label>
            <div className="flex items-center">
              {currentVariant.imagePreview && (
                <img
                  src={currentVariant.imagePreview}
                  alt="Variant Preview"
                  className="h-24 w-24 object-cover rounded-md mr-4"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, true)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
          </div>

          {/* Add Variant Button */}
          <button
            type="button"
            onClick={addVariant}
            className="col-span-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Add Variant
          </button>
        </div>

        {/* Variant List */}
        <div className="mt-4 space-y-2">
          {formData.variants.map((variant) => (
            <div key={variant.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                {variant.imagePreview && (
                  <img
                    src={variant.imagePreview}
                    alt={`${variant.weight} - ${variant.size}`}
                    className="h-12 w-12 object-cover rounded-md mr-4"
                  />
                )}
                <span>
                  {variant.weight} - {variant.size} - ₦{variant.price} - Stock: {variant.stockQuantity}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeVariant(variant.id)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          {initialProduct ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;