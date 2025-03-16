// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cart from "../components/customer/Cart";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import { ChatProvider } from "../contexts/ChatContext";
import ChatComponent from "../components/shared/ChatComponent";
import ProductCard from "../components/store/ProductCard";
import {
  ShoppingBag,
  Menu,
  Search,
  X,
  MapPin,
  Truck,
  ChevronRight,
} from "lucide-react";
import { useProducts } from "../contexts/ProductContext";

// Utility to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Debounce function for scroll events
const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

function HomePage() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [shuffledProducts, setShuffledProducts] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);

  // Categories Array
  const categories = [
    "Grains and Staples",
    "Oils and seasonings",
    "Proteins:meat and fish",
    "Soup ingredients",
    "Swallow and snacks",
    "Vegetables and leaves",
  ];

  // Initialize shuffled products on mount or when products change
  useEffect(() => {
    if (products && products.length > 0) {
      const productsByCategory = {};
      products.forEach((product) => {
        if (!product.category) return; // Skip products without category
        if (!productsByCategory[product.category]) {
          productsByCategory[product.category] = [];
        }
        productsByCategory[product.category].push(product);
      });

      const initialShuffledProducts = {};
      Object.keys(productsByCategory).forEach((category) => {
        initialShuffledProducts[category] = shuffleArray([
          ...productsByCategory[category],
        ]);
      });

      setShuffledProducts(initialShuffledProducts);
    }
  }, [products]);

  // Handle infinite scroll with debounce
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500
      ) {
        setVisibleProducts((prev) => prev + 8);
      }
    };

    const debouncedScroll = debounce(handleScroll, 200);
    window.addEventListener("scroll", debouncedScroll);
    return () => window.removeEventListener("scroll", debouncedScroll);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setSelectedCategory("all");
  };

  const handleSchedulePickup = () => {
    const userIdentifier = localStorage.getItem("userIdentifier");
    const identifierType = localStorage.getItem("identifierType");

    if (!userIdentifier || !identifierType) {
      navigate("/account");
    } else {
      setShowDeliveryInfo(true);
    }
  };

  const getFilteredProducts = useCallback(
    (products) => {
      return products.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    [searchTerm]
  );

  return (
    <ChatProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo and Mobile Menu */}
              <div className="flex items-center space-x-4">
                <button
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 text-gray-600" />
                  ) : (
                    <Menu className="h-6 w-6 text-gray-600" />
                  )}
                </button>
                <Link to="/" className="flex items-center">
                  <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                    Kasoowa FoodHub
                  </span>
                </Link>
              </div>

              {/* Search Bar - Hide on Mobile */}
              <div className="hidden md:block flex-1 max-w-xl mx-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/about" className="text-gray-600 hover:text-gray-900">
                  About Us
                </Link>
                <Link
                  to="/vendor/auth"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sell on Kasoowa
                </Link>
                <Link
                  to="/affiliate/auth"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Become an Affiliate
                </Link>
                <Link
                  to="/account"
                  className="text-gray-600 hover:text-gray-900"
                >
                  My Orders
                </Link>
                <div
                  className="relative cursor-pointer"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingBag className="h-6 w-6 text-green-600" />
                  {Object.values(cartItems).reduce(
                    (a, b) => a + (b.quantity || 0),
                    0
                  ) > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                      {Object.values(cartItems).reduce(
                        (a, b) => a + (b.quantity || 0),
                        0
                      )}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSchedulePickup}
                  className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Schedule Pickup</span>
                </button>
              </div>

              {/* Mobile Cart Icon */}
              <div className="md:hidden">
                <div
                  className="relative cursor-pointer"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingBag className="h-6 w-6 text-green-600" />
                  {Object.values(cartItems).reduce(
                    (a, b) => a + (b.quantity || 0),
                    0
                  ) > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                      {Object.values(cartItems).reduce(
                        (a, b) => a + (b.quantity || 0),
                        0
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Search - Show only on mobile */}
            <div className="mt-4 md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>

          {/* Desktop Categories Bar */}
          <div className="border-t border-gray-200 bg-white hidden md:block">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center space-x-6 py-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === "all"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCategory === category
                        ? "bg-green-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-40">
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl overflow-y-auto">
              <div className="p-6">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>

                {/* Mobile Menu Links */}
                <div className="space-y-6">
                  <Link
                    to="/about"
                    className="block text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/vendor/auth"
                    className="block text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sell on Kasoowa
                  </Link>
                  <Link
                    to="/affiliate/auth"
                    className="block text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Become an Affiliate
                  </Link>
                  <Link
                    to="/account"
                    className="block text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/vendor/auth"
                    className="block text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sell on Kasoowa
                  </Link>
                  <button
                    onClick={() => {
                      handleSchedulePickup();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <MapPin className="h-5 w-5" />
                    <span>Schedule Pickup</span>
                  </button>

                  {/* Mobile Categories */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Categories
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex justify-between items-center w-full text-left text-gray-600 hover:text-gray-900"
                      >
                        <span>All Categories</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex justify-between items-center w-full text-left text-gray-600 hover:text-gray-900"
                        >
                          <span>{category}</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="pt-32 pb-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Hero Section - Optional */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                African Foodstuffs at Your Fingertips
              </h1>
              <p className="text-gray-600">
                Quality African Foodstuffs delivered to your doorstep. Schedule
                pickup available in Port Harcourt.
              </p>
            </div>

            {/* Products Grid */}
            {Object.keys(shuffledProducts).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products available yet. Check back soon!
              </div>
            ) : (
              Object.entries(shuffledProducts).map(
                ([category, categoryProducts]) =>
                  (selectedCategory === "all" ||
                    selectedCategory === category) && (
                    <div key={category} className="mb-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {category}
                      </h2>
                      {/* Direct grid container instead of using ProductGrid component */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {getFilteredProducts(categoryProducts)
                          .slice(0, visibleProducts)
                          .map((product) => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                      </div>
                      {categoryProducts.length > visibleProducts && (
                        <div className="text-center mt-8">
                          <button
                            onClick={() =>
                              setVisibleProducts((prev) => prev + 12)
                            }
                            className="bg-white text-green-600 px-6 py-2 rounded-md hover:bg-green-50 transition-colors border border-green-600"
                          >
                            Load More Products
                          </button>
                        </div>
                      )}
                    </div>
                  )
              )
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Quick Links
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <Link to="/about" className="hover:text-green-600">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/vendor/auth" className="hover:text-green-600">
                      Sell on Kasoowa
                    </Link>
                  </li>
                  <li>
                    <Link to="/affiliate/auth" className="hover:text-green-600">
                      Become an Affiliate
                    </Link>
                  </li>
                  <li>
                    <Link to="/account" className="hover:text-green-600">
                      My Orders
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>support@kasoowa.com</li>
                  <li>(234) 123-4567</li>
                  <li>Port Harcourt, Nigeria</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Delivery</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Nationwide Delivery</li>
                  <li>Pickup in Port Harcourt</li>
                  <li>Delivery Support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Business Hours
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Mon - Fri: 9:00 AM - 6:00 PM</li>
                  <li>Saturday: 9:00 AM - 4:00 PM</li>
                  <li>Sunday: Closed</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
              <p>
                &copy; {new Date().getFullYear()} Kasoowa FoodHub. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>

        {/* Cart Component */}
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={Object.entries(cartItems).map(([id, item]) => ({
            ...item,
            id,
          }))}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
        />

        {/* Delivery Info Modal */}
        {showDeliveryInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delivery Options
                </h3>
                <button onClick={() => setShowDeliveryInfo(false)}>
                  <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Pickup Service
                    </h4>
                    <p className="text-sm text-gray-600">
                      Available only in Port Harcourt, Rivers State. Schedule a
                      pickup time and pay a 10% deposit to secure your slot.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Home Delivery</h4>
                    <p className="text-sm text-gray-600">
                      Available nationwide. Order online and we'll deliver to
                      your doorstep.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowDeliveryInfo(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDeliveryInfo(false);
                      navigate("/schedulePickup");
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Continue to Pickup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ChatComponent />
      </div>
    </ChatProvider>
  );
}

export default HomePage;
