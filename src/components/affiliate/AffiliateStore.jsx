// src/components/affiliate/AffiliateStore.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { useCart } from '../../contexts/CartContext';
import { 
  ShoppingBag, 
  Search, 
  Grid,
  List,
  User,
  ExternalLink,
  ShoppingCart,
  Filter
} from 'lucide-react';

const AffiliateStore = () => {
  const { storeSlug } = useParams();
  const { products } = useProducts();
  const { cartItems } = useCart();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [affiliateStore, setAffiliateStore] = useState(null);
  const [affiliateProducts, setAffiliateProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load affiliate store data
  useEffect(() => {
    const fetchStoreData = () => {
      try {
        // Get all affiliates from localStorage
        const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]');
        
        // Find the affiliate with matching store slug
        const affiliate = affiliates.find(a => a.storeSlug === storeSlug);
        
        if (!affiliate) {
          setError('Store not found');
          setLoading(false);
          return;
        }
        
        setAffiliateStore(affiliate);
        
        // Get all products selected by this affiliate
        const affiliateProductIds = affiliate.products || [];
        const storeProducts = products.filter(p => affiliateProductIds.includes(p.id));
        
        setAffiliateProducts(storeProducts);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(storeProducts.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
        
        // Track store visit (would implement with real backend)
        console.log(`Tracking visit to affiliate store: ${storeSlug}`);
        
        // Save affiliate ID to sessionStorage for attribution
        sessionStorage.setItem('currentAffiliateId', affiliate.id);
        
      } catch (error) {
        console.error('Error loading affiliate store:', error);
        setError('Failed to load store data');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [storeSlug, products]);

  // Apply filters and sorting
  const getFilteredProducts = () => {
    if (!affiliateProducts) return [];
    
    let filtered = [...affiliateProducts];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Apply sorting
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => {
        const priceA = a.variants?.length > 0 
          ? Math.min(...a.variants.map(v => Number(v.price || 0)))
          : Number(a.price || 0);
        const priceB = b.variants?.length > 0 
          ? Math.min(...b.variants.map(v => Number(v.price || 0)))
          : Number(b.price || 0);
        return priceA - priceB;
      });
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => {
        const priceA = a.variants?.length > 0 
          ? Math.min(...a.variants.map(v => Number(v.price || 0)))
          : Number(a.price || 0);
        const priceB = b.variants?.length > 0 
          ? Math.min(...b.variants.map(v => Number(v.price || 0)))
          : Number(b.price || 0);
        return priceB - priceA;
      });
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.title?.localeCompare(b.title || ''));
    }
    // 'popularity' sorting would require actual view/purchase data
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  const cartItemCount = Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600">Store Not Found</h1>
          <p className="mt-2 text-gray-600">Sorry, we couldn't find the affiliate store you're looking for.</p>
          <Link to="/" className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                <span className="ml-2 text-base sm:text-lg font-bold text-gray-900">
                  Kasoowa FoodHub
                </span>
              </Link>
            </div>

            {/* Cart Icon */}
            <div
              className="relative cursor-pointer"
              onClick={() => setIsCartOpen(!isCartOpen)}
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Store Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {affiliateStore?.storeName || "Affiliate Store"}
              </h1>
              <p className="mt-1 text-sm text-gray-500 flex items-center">
                <User className="h-4 w-4 mr-1" />
                By {affiliateStore?.fullName || affiliateStore?.userName}
              </p>
            </div>
            <div>
              <Link to="/" className="text-sm text-green-600 hover:text-green-700 flex items-center">
                <ExternalLink className="h-4 w-4 mr-1" />
                Visit Main Store
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Search and Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          {/* Search with Filter Toggle */}
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-center p-2 border border-gray-300 rounded-md"
              aria-label="Toggle filters"
            >
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* Filter Options - Shown on Desktop, Toggle on Mobile */}
          <div className={`sm:flex sm:gap-2 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-xs sm:text-sm flex-grow sm:flex-grow-0 focus:ring-green-500 focus:border-green-500"
                style={{maxWidth: '140px'}}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-xs sm:text-sm flex-grow sm:flex-grow-0 focus:ring-green-500 focus:border-green-500"
                style={{maxWidth: '140px'}}
              >
                <option value="popularity">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-md overflow-hidden ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'bg-white text-gray-500'}`}
                >
                  <Grid className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'bg-white text-gray-500'}`}
                >
                  <List className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid - Updated to match main store's ProductCard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900">No products found</h2>
            <p className="mt-1 text-gray-500">
              {searchTerm || categoryFilter ? 
                "Try adjusting your search or filter criteria" : 
                "This store has no products yet"}
            </p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map(product => {
                const basePrice = product.variants?.length > 0
                  ? Math.min(...product.variants.map((v) => Number(v.price)))
                  : Number(product.price);
                
                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}?aff=${affiliateStore.id}`}
                    onClick={() => {
                      sessionStorage.setItem('referringAffiliateId', affiliateStore.id);
                    }}
                    className="group h-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
                  >
                    {/* Image Section */}
                    <div className="relative w-full h-36 sm:h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={product.imageUrl || "/api/placeholder/400/400"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "/api/placeholder/400/400";
                        }}
                      />
                    </div>
                    
                    {/* Content Section */}
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
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map(product => {
                const basePrice = product.variants?.length > 0
                  ? Math.min(...product.variants.map((v) => Number(v.price)))
                  : Number(product.price);
                
                return (
                  <Link 
                    key={product.id} 
                    to={`/product/${product.id}?aff=${affiliateStore.id}`}
                    onClick={() => {
                      sessionStorage.setItem('referringAffiliateId', affiliateStore.id);
                    }}
                    className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="flex">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-200 overflow-hidden">
                        <img 
                          src={product.imageUrl || "/api/placeholder/400/400"} 
                          alt={product.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "/api/placeholder/160/160";
                          }}
                        />
                      </div>
                      <div className="p-2 sm:p-3 flex-1">
                        <h3 className="text-sm sm:text-base font-medium line-clamp-2 group-hover:text-green-700 transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-sm font-bold">
                            ₦{basePrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-green-600">
                            View Details
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="bg-white mt-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              This is an affiliate store of <Link to="/" className="text-green-600 hover:underline">Kasoowa FoodHub</Link>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              © {new Date().getFullYear()} Kasoowa FoodHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateStore;