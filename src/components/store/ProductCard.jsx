// src/components/store/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  if (!product) return null;

  const basePrice =
    product.variants?.length > 0
      ? Math.min(...product.variants.map((v) => Number(v.price)))
      : Number(product.price);

  // Helper function to get the correct image URL
  const getImageUrl = (url) => {
    if (!url) return "/api/placeholder/400/400";
    
    // If URL already includes http or starts with /, use it as is
    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }
    
    // Otherwise, add the uploads path
    return `/uploads/${url}`;
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group h-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
    >
      {/* Image Section */}
      <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
        <img
          src={getImageUrl(product.image_url || product.imageUrl)}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            console.log("Image load error for:", e.target.src);
            e.target.src = "/api/placeholder/400/400";
          }}
        />
      </div>

      {/* Content Section - Combined from both previous sections */}
      <div className="p-2 sm:p-4 flex-grow flex flex-col">
        <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 group-hover:text-green-700 transition-colors line-clamp-1">
          {product.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-auto flex justify-between items-center">
          <span className="text-sm sm:text-lg font-bold">
            ₦{basePrice.toLocaleString()}
          </span>
          <span className="text-xs sm:text-sm text-green-600">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
