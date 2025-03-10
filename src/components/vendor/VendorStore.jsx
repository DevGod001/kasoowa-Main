// src/components/vendor/VendorStore.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { useProducts } from "../../contexts/ProductContext";
import ProductGrid from "../store/ProductGrid";
import { Link } from "react-router-dom";

const VendorStore = () => {
  const { storeSlug } = useParams();
  const { products } = useProducts();

  // Filter products for this store
  const storeProducts = products.filter(
    (product) => product.vendorSlug === storeSlug
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Store Header with Subtle Marketplace Link */}
        <div className="relative py-4">
          <Link
            to="/"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Kasoowa Marketplace
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to our Store
            </h1>
            <p className="mt-4 text-gray-500">Discover our amazing products</p>
          </div>
        </div>
        <p className="mt-4 text-gray-500">Discover our amazing products</p>
      </div>

      {/* Products Grid */}
      {storeProducts.length > 0 ? (
        <ProductGrid products={storeProducts} />
      ) : (
        <div className="text-center py-12 text-gray-500">
          No products available in this store yet.
        </div>
      )}
    </div>
  );
};

export default VendorStore;
