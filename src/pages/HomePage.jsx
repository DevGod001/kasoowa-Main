import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cart from "../components/customer/Cart";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import { ChatProvider } from "../contexts/ChatContext";
import ChatComponent from "../components/shared/ChatComponent";
import {
  ShoppingBag,
  Clock,
  Calendar,
  CheckCircle,
  Truck,
  Search,
} from "lucide-react";
import ProductCard from "../components/shared/ProductCard";
import {
  defaultWeightOptions,
  defaultSizeOptions,
} from "../config/productConfig";
import { useProducts } from "../contexts/ProductContext";

// Keep shuffleArray utility
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function HomePage() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleProducts, setVisibleProducts] = useState(8);
  const [shuffledProducts, setShuffledProducts] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Categories Array
  const categories = [
    "Grains and Staples",
    "Oils and seasonings",
    "Proteins:meat and fish",
    "Soup ingredients",
    "Swallow and snacks",
    "Vegetables and leaves",
  ];

  // Initialize shuffled products on mount
  useEffect(() => {
    if (products && products.length > 0) {
      const productsByCategory = products.reduce((acc, product) => {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {});

      const initialShuffledProducts = Object.keys(productsByCategory).reduce(
        (acc, category) => {
          acc[category] = shuffleArray([...productsByCategory[category]]);
          return acc;
        },
        {}
      );

      setShuffledProducts(initialShuffledProducts);
    }
  }, [products]);

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500
      ) {
        setVisibleProducts((prev) => prev + 8);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Search and Navigation Functions
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const scrollToProducts = () => {
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
  };

  // Load More Products
  const loadMoreProducts = () => {
    setVisibleProducts((prev) => prev + 8);
  };

  // Filter Products
  const getFilteredProducts = (products) => {
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  const handleSchedulePickup = () => {
    // Check if user is logged in by checking localStorage
    const userIdentifier = localStorage.getItem("userIdentifier");
    const identifierType = localStorage.getItem("identifierType");

    if (!userIdentifier || !identifierType) {
      // If not logged in, redirect to dashboard login
      navigate("/account");
    } else {
      // If logged in, redirect to schedule page
      navigate("/schedulePickup");
    }
  };

  return (
    <ChatProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2">
            {/* Logo and Brand Name */}
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center w-full md:w-auto justify-between">
                <div className="flex items-center">
                  <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  <span className="ml-2 text-lg md:text-xl font-bold text-gray-900">
                    Kasoowa FoodHub
                  </span>
                </div>
                {/* Mobile Cart Icon */}
                <div className="flex items-center md:hidden">
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

              {/* Mobile Navigation Menu */}
              <div className="mt-2 md:mt-0 w-full md:w-auto">
                <div className="flex flex-row items-center justify-between space-x-1 md:space-x-4 text-sm md:text-base">
                  <button
                    onClick={() => scrollToSection("about")}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    About
                  </button>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    How It Works
                  </button>
                  <Link
                    to="/account"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    My Orders
                  </Link>
                  <div className="hidden md:block relative cursor-pointer">
                    <ShoppingBag
                      className="h-6 w-6 text-green-600"
                      onClick={() => setIsCartOpen(true)}
                    />
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
                    className="bg-green-600 text-white px-2 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-md hover:bg-green-700 transition-colors"
                  >
                    Schedule Pickup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white pt-32 md:pt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Schedule Your Grocery Shopping Experience
                </h1>
                <p className="text-xl text-green-100 mb-8">
                  Experience a new way of grocery shopping. Schedule your visit,
                  pay a 10% deposit, and enjoy a convenient, organized shopping
                  experience at Kasoowa FoodHub.
                </p>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <button
                    onClick={scrollToProducts}
                    className="bg-white text-green-600 px-6 py-3 rounded-md font-semibold hover:bg-green-50 transition-colors"
                  >
                    Shop Now
                  </button>
                  <button className="border-2 border-white text-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-green-600 transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
              <div className="lg:block">
                <img 
                  src="/images/kasoowa-banner.png"
                  alt="Grocery shopping illustration"
                  className="h-64 lg:h-96 w-full object-contain filter brightness-110"
                />
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="py-16 bg-white" id="about">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                About Kasoowa FoodHub
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We're transforming the traditional grocery shopping experience
                into a modern, efficient, and enjoyable journey for our
                customers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="bg-green-50 rounded-lg p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Our Mission
                </h3>
                <p className="text-gray-600 mb-6">
                  To provide a convenient, organized, and stress-free grocery
                  shopping experience through our innovative scheduling system
                  and quality product selection.
                </p>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Our Vision
                </h3>
                <p className="text-gray-600">
                  To become the leading scheduled grocery shopping destination,
                  setting new standards in customer convenience and service
                  quality.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-600 p-6 rounded-lg text-white">
                  <h4 className="font-bold text-xl mb-2">1000+</h4>
                  <p>Happy Customers</p>
                </div>
                <div className="bg-green-600 p-6 rounded-lg text-white">
                  <h4 className="font-bold text-xl mb-2">500+</h4>
                  <p>Products</p>
                </div>
                <div className="bg-green-600 p-6 rounded-lg text-white">
                  <h4 className="font-bold text-xl mb-2">100%</h4>
                  <p>Satisfaction Rate</p>
                </div>
                <div className="bg-green-600 p-6 rounded-lg text-white">
                  <h4 className="font-bold text-xl mb-2">24/7</h4>
                  <p>Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-16 bg-gray-50" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600">
                Simple steps to your convenient shopping experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Calendar className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Schedule Visit</h3>
                <p className="text-gray-600">
                  Choose your preferred date and time for shopping
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <ShoppingBag className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select Products</h3>
                <p className="text-gray-600">
                  Browse and add items to your shopping list
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <Clock className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Pay Deposit</h3>
                <p className="text-gray-600">
                  Secure your slot with a 10% deposit
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Visit & Shop</h3>
                <p className="text-gray-600">
                  Come in at your scheduled time and enjoy shopping
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="py-8 bg-white" id="products">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search Bar */}
            <div className="w-full max-w-xl mx-auto mb-8">
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

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedCategory === "all"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-green-50"
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
                      : "bg-gray-100 text-gray-700 hover:bg-green-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {Object.keys(shuffledProducts).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products available yet. Check back soon!
              </div>
            ) : (
              Object.entries(shuffledProducts).map(
                ([category, products]) =>
                  (selectedCategory === "all" ||
                    selectedCategory === category) && (
                    <div key={category} className="mb-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {category}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {getFilteredProducts(products)
                          .slice(0, visibleProducts)
                          .map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={addToCart}
                              onUpdateQuantity={updateQuantity}
                              quantityInCart={
                                cartItems[product.id]?.quantity || 0
                              }
                              defaultWeightOptions={defaultWeightOptions}
                              defaultSizeOptions={defaultSizeOptions}
                            />
                          ))}
                      </div>
                      {products.length > visibleProducts && (
                        <div className="text-center mt-8">
                          <button
                            onClick={loadMoreProducts}
                            className="bg-green-50 text-green-600 px-6 py-2 rounded-md hover:bg-green-100 transition-colors"
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
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Kasoowa FoodHub
              </h2>
              <p className="text-xl text-gray-600">
                Experience the benefits of scheduled grocery shopping
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <Clock className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Save Time</h3>
                <p className="text-gray-600">
                  No more waiting in long queues. Shop at your scheduled time.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-md">
                <Truck className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Organized Shopping
                </h3>
                <p className="text-gray-600">
                  Your items are prepared and ready for your arrival.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-md">
                <ShoppingBag className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                <p className="text-gray-600">
                  Hand-picked fresh produce and quality groceries.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">About Us</h3>
                <p className="text-gray-400">
                  Kasoowa FoodHub is revolutionizing grocery shopping with
                  scheduled visits and quality products.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <button
                      onClick={() => scrollToSection("how-it-works")}
                      className="hover:text-white transition-colors"
                    >
                      How It Works
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("products")}
                      className="hover:text-white transition-colors"
                    >
                      Products
                    </button>
                  </li>
                  <li>
                    <button className="hover:text-white transition-colors">
                      Schedule Visit
                    </button>
                  </li>
                  <li>
                    <button className="hover:text-white transition-colors">
                      Contact Us
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>Email: info@kasoowa.com</li>
                  <li>Phone: (234) 123-4567</li>
                  <li>Address: Lagos, Nigeria</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>Mon - Fri: 9:00 AM - 6:00 PM</li>
                  <li>Saturday: 9:00 AM - 4:00 PM</li>
                  <li>Sunday: Closed</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
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
            id, // Make sure id is included
          }))}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
        />
        <ChatComponent />
      </div>
    </ChatProvider>
  );
}

export default HomePage;
