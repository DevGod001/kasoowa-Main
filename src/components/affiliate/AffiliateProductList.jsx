// src/components/affiliate/AffiliateProductList.jsx
import React, { useState, useEffect } from 'react';
import { useAffiliate } from '../../contexts/AffiliateContext';
import { useProducts } from '../../contexts/ProductContext';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, Share2, ArrowLeft, Copy } from 'lucide-react';

const AffiliateProductList = () => {
  const { selectedProducts, addProductToStore, removeProductFromStore, getProductReferralLink, isAffiliate } = useAffiliate();
  const { products } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  // Extract categories from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }
  }, [products]);

  // Check if a product is already selected
  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p.id === productId);
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handle adding a product to the affiliate store
  const handleAddProduct = async (productId) => {
    setProcessing(productId);
    
    try {
      await addProductToStore(productId);
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setProcessing(null);
    }
  };

  // Handle removing a product from the affiliate store
  const handleRemoveProduct = async (productId) => {
    setProcessing(productId);
    
    try {
      await removeProductFromStore(productId);
    } catch (error) {
      console.error('Error removing product:', error);
    } finally {
      setProcessing(null);
    }
  };

  // Copy referral link to clipboard
  const copyReferralLink = (productId) => {
    const link = getProductReferralLink(productId);
    if (link) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setCopiedLink(productId);
          setTimeout(() => setCopiedLink(null), 3000);
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
        });
    }
  };

  if (!isAffiliate) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-red-600 mb-4">You need to be an approved affiliate to access this page.</p>
        <Link to="/affiliate/register" className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          Apply to become an affiliate
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-4">
        <Link to="/affiliate/dashboard" className="inline-flex items-center text-green-600 hover:text-green-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Manage Your Products</h1>
        <p className="text-gray-600">Select products to feature in your affiliate store.</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by product name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow mb-8 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Products Available</h3>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Products in Your Store</h3>
            <p className="text-2xl font-bold">{selectedProducts.length}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Potential Commission</h3>
            <p className="text-2xl font-bold">
              ₦{(products.reduce((sum, product) => {
                const price = product.variants && product.variants.length > 0 
                  ? parseFloat(product.variants[0].price || 0) 
                  : parseFloat(product.price || 0);
                return sum + price;
              }, 0) * 0.02).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500">Based on 2% commission rate</p>
          </div>
        </div>
      </div>

      {/* Product List - Modified for mobile friendliness */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Available Products</h2>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => {
                const selected = isProductSelected(product.id);
                const price = product.variants && product.variants.length > 0 
                  ? parseFloat(product.variants[0].price || 0) 
                  : parseFloat(product.price || 0);
                const commission = price * 0.02;
                
                return (
                  <div key={product.id} className={`border rounded-lg overflow-hidden transition-all ${selected ? 'border-green-500 bg-green-50' : ''}`}>
                    <div className="h-32 sm:h-40 bg-gray-200">
                      <img 
                        src={product.imageUrl || "/api/placeholder/400/300"} 
                        alt={product.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/api/placeholder/400/300";
                        }}
                      />
                    </div>
                    
                    <div className="p-2 sm:p-3">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-sm truncate">{product.title}</h3>
                        {product.category && (
                          <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 ml-1 flex-shrink-0">
                            {product.category}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm">₦{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      
                      <p className="text-xs text-gray-500 mt-1 mb-2 line-clamp-2">{product.description}</p>
                      
                      <div>
                        <p className="text-xs font-medium">Commission: ₦{commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        
                        {selected ? (
                          <div className="mt-2 flex flex-col space-y-2">
                            <button
                              onClick={() => copyReferralLink(product.id)}
                              className="w-full py-1.5 px-2 text-xs border border-green-500 text-green-500 rounded-md hover:bg-green-50 flex items-center justify-center gap-1"
                            >
                              {copiedLink === product.id ? (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3 h-3" />
                                  Copy Link
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleRemoveProduct(product.id)}
                              disabled={processing === product.id}
                              className="w-full py-1.5 px-2 text-xs border border-red-500 text-red-500 rounded-md hover:bg-red-50 disabled:opacity-50 flex items-center justify-center"
                            >
                              {processing === product.id ? 
                                'Removing...' : 
                                'Remove'
                              }
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddProduct(product.id)}
                            disabled={processing === product.id}
                            className="mt-2 w-full py-1.5 px-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {processing === product.id ? (
                              'Adding...'
                            ) : (
                              <>
                                <PlusCircle className="w-3 h-3" />
                                Add to Store
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No products match your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateProductList;