// src/pages/ProductDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
  ShoppingBag,
  Store,
} from "lucide-react";
import Cart from "../components/customer/Cart";

// Define the event name directly for consistency
const PRODUCTS_UPDATED_EVENT = "kasoowaProductsUpdated";

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentStock, setCurrentStock] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // To prevent page shaking

  // Find the product - make sure to use string comparison for IDs
  const product = products.find((p) => String(p.id) === String(productId));

  // Find related products
  const relatedProducts = product
    ? products
        .filter((p) => p.category === product?.category && String(p.id) !== String(productId))
        .slice(0, 4)
    : [];

  // Update stock when variant changes or product changes
  useEffect(() => {
    if (product) {
      if (selectedVariant) {
        const stockQuantity = Number(selectedVariant.stock_quantity) || Number(selectedVariant.stockQuantity) || 0;
        setCurrentStock(stockQuantity);
      } else if (product.variants?.length > 0) {
        // Calculate total stock across all variants
        const totalStock = product.variants.reduce(
          (total, v) => {
            const variantStock = Number(v.stock_quantity) || Number(v.stockQuantity) || 0;
            return Number(total) + variantStock;
          },
          0
        );
        setCurrentStock(totalStock);
      } else {
        // Use product's own stock
        const stockQuantity = Number(product.stock_quantity) || Number(product.stockQuantity) || 0;
        setCurrentStock(stockQuantity);
      }
    }
  }, [product, selectedVariant]);

  // Handle stock updates from other parts of the app
  useEffect(() => {
    const handleProductUpdate = () => {
      console.log("ProductDetailPage: Product update detected");

      const updatedProductsJson = localStorage.getItem("kasoowaProducts");
      if (!updatedProductsJson) return;

      try {
        const updatedProducts = JSON.parse(updatedProductsJson);
        const updatedProduct = updatedProducts.find(
          (p) => String(p.id) === String(productId)
        );

        if (updatedProduct) {
          console.log("ProductDetailPage: Found updated product", updatedProduct.id);
          console.log("Current stock before update:", currentStock);

          // Update stock based on selected variant or total
          if (selectedVariant) {
            const updatedVariant = updatedProduct.variants?.find(
              (v) => String(v.id) === String(selectedVariant.id)
            );

            if (updatedVariant) {
              console.log("ProductDetailPage: Found updated variant");
              setSelectedVariant(updatedVariant);
              const stockQuantity = Number(updatedVariant.stock_quantity) || 
                                   Number(updatedVariant.stockQuantity) || 0;
              setCurrentStock(stockQuantity);
            }
          } else if (updatedProduct.variants?.length > 0) {
            // Calculate total stock across all variants
            const totalStock = updatedProduct.variants.reduce(
              (total, v) => {
                const variantStock = Number(v.stock_quantity) || Number(v.stockQuantity) || 0;
                return Number(total) + variantStock;
              },
              0
            );
            setCurrentStock(totalStock);
          } else {
            // Use product's own stock
            const stockQuantity = Number(updatedProduct.stock_quantity) || 
                                 Number(updatedProduct.stockQuantity) || 0;
            setCurrentStock(stockQuantity);
          }
        }
      } catch (error) {
        console.error("Error updating product details:", error);
      }
    };

    // Listen for product updates
    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === "kasoowaProducts" || e.key === "kasoowaForceRefresh") {
        handleProductUpdate();
      }
    });

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductUpdate);
      window.removeEventListener("storage", handleProductUpdate);
    };
  }, [productId, selectedVariant, currentStock]);

  // Calculate items in cart
  const itemInCart = cartItems ? cartItems[productId] : null;
  const inCartQuantity = itemInCart ? itemInCart.quantity : 0;

  // Handle back navigation
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <h2 className="mt-4 text-lg font-medium text-gray-900">Loading product...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <p className="mt-2 text-gray-600">The product you're looking for might have been removed or doesn't exist.</p>
        <button
          onClick={handleGoBack}
          className="mt-4 text-green-600 hover:text-green-700"
        >
          Return to previous page
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (isAdding) return; // Prevent multiple clicks
    
    if (product.variants?.length > 0 && !selectedVariant) {
      alert("Please select a variant");
      return;
    }

    // Check if adding would exceed stock
    const totalQuantity = inCartQuantity + quantity;
    const maxStock = selectedVariant
      ? (Number(selectedVariant.stock_quantity) || Number(selectedVariant.stockQuantity) || 0)
      : (Number(product.stock_quantity) || Number(product.stockQuantity) || 0);

    if (totalQuantity > maxStock) {
      alert(`Cannot exceed available stock of ${maxStock} items`);
      return;
    }

    setIsAdding(true); // Prevent repeat clicks

    // Check for affiliate referral
    const queryParams = new URLSearchParams(window.location.search);
    const affiliateId =
      queryParams.get("aff") ||
      queryParams.get("ref") ||
      sessionStorage.getItem("referringAffiliateId");

    if (affiliateId) {
      sessionStorage.setItem("referringAffiliateId", affiliateId);
    }

    const productToAdd = {
      ...product,
      selectedVariant,
      quantity,
    };

    addToCart(productToAdd, quantity);
    setAddedToCart(true);
    
    setTimeout(() => {
      setAddedToCart(false);
      setIsAdding(false); // Re-enable the button
    }, 2000);
  };

  // Calculate the base price - lowest variant price or product price
  const calculateBasePrice = () => {
    if (product.variants && product.variants.length > 0) {
      // Calculate the lowest price
      return Math.min(...product.variants.map(v => Number(v.price) || 0));
    }
    return Number(product.price);
  };

  // Get image URL with fallback
  const getImageUrl = (url) => {
    if (!url) return '/api/placeholder/600/600';
    
    // If URL already includes http or starts with /, use it directly
    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }
    
    // Otherwise, prepend the domain
    return `/uploads/${url}`;
  };

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
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              {Object.values(cartItems).reduce(
                (a, b) => a + (b.quantity || 0),
                0
              ) > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-xs">
                  {Object.values(cartItems).reduce(
                    (a, b) => a + (b.quantity || 0),
                    0
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Navigation */}
        <nav className="mb-4 sm:mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Back to Store
          </button>
        </nav>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-8">
            {/* Product Images */}
            <div className="space-y-2 sm:space-y-4">
              <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={
                    selectedVariant?.image_url || selectedVariant?.imageUrl
                      ? getImageUrl(selectedVariant.image_url || selectedVariant.imageUrl)
                      : getImageUrl(product.image_url || product.imageUrl)
                  }
                  alt={product.title}
                  className="w-full h-[250px] sm:h-[400px] object-contain"
                  onError={(e) => {
                    console.log("Image load error for:", e.target.src);
                    e.target.src = "/api/placeholder/600/600";
                  }}
                />
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                <button
                  onClick={() => setSelectedVariant(null)}
                  className={`aspect-w-1 aspect-h-1 rounded-lg overflow-hidden border-2 ${
                    !selectedVariant ? "border-green-500" : "border-transparent"
                  }`}
                >
                  <img
                    src={getImageUrl(product.image_url || product.imageUrl)}
                    alt="Main product"
                    className="w-full h-14 sm:h-20 object-contain"
                    onError={(e) => {
                      e.target.src = "/api/placeholder/150/150";
                    }}
                  />
                </button>
                {product.variants?.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`aspect-w-1 aspect-h-1 rounded-lg overflow-hidden border-2 ${
                      selectedVariant?.id === variant.id
                        ? "border-green-500"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={getImageUrl(variant.image_url || variant.imageUrl)}
                      alt={`${variant.size} - ${variant.weight}`}
                      className="w-full h-14 sm:h-20 object-contain"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/150/150";
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {product.title}
                </h1>
                <p className="mt-2 sm:mt-4 text-sm sm:text-base text-gray-500 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Pricing and Stock */}
              <div className="border-t border-b border-gray-200 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {product.variants?.length > 0
                      ? selectedVariant
                        ? `₦${Number(selectedVariant.price).toLocaleString()}`
                        : `From ₦${calculateBasePrice().toLocaleString()}`
                      : `₦${Number(product.price).toLocaleString()}`}
                  </span>
                  <div className="text-xs sm:text-sm">
                    <span
                      className={`font-medium ${
                        currentStock > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {product.variants?.length > 0
                        ? selectedVariant
                          ? `${Number(selectedVariant.stock_quantity) || Number(selectedVariant.stockQuantity) || 0} in stock`
                          : `${product.variants.reduce(
                              (total, v) => {
                                const variantStock = Number(v.stock_quantity) || Number(v.stockQuantity) || 0;
                                return Number(total) + variantStock;
                              },
                              0
                            )} total in stock`
                        : `${Number(product.stock_quantity) || Number(product.stockQuantity) || 0} in stock`}
                    </span>
                    {inCartQuantity > 0 && (
                      <span className="ml-2 text-gray-500">
                        ({inCartQuantity} in cart)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Select Option
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`relative p-3 sm:p-4 border rounded-lg text-left transition-all ${
                          selectedVariant?.id === variant.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {selectedVariant?.id === variant.id && (
                          <CheckCircle className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                        )}
                        <div className="font-medium text-sm sm:text-base">
                          {variant.size}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {variant.weight}
                        </div>
                        <div className="mt-1 font-semibold text-sm sm:text-base">
                          ₦{Number(variant.price).toLocaleString()}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {Number(variant.stock_quantity) || Number(variant.stockQuantity) || 0} available
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={currentStock - inCartQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Allow empty input during typing
                    if (inputValue === "") {
                      setQuantity("");
                    } else {
                      const parsedValue = parseInt(inputValue);
                      // Only apply min/max constraints when we have a valid number
                      if (!isNaN(parsedValue)) {
                        // Apply constraints on blur or when a complete value is entered
                        setQuantity(
                          Math.max(
                            1,
                            Math.min(parsedValue, currentStock - inCartQuantity)
                          )
                        );
                      } else {
                        // Keep the current input even if it's not a valid number yet
                        setQuantity(inputValue);
                      }
                    }
                  }}
                  // Apply constraints when focus leaves the input
                  onBlur={() => {
                    if (quantity === "" || isNaN(parseInt(quantity))) {
                      setQuantity(1);
                    }
                  }}
                  className="mt-1 w-20 sm:w-24 p-2 border rounded-md text-sm sm:text-base"
                />
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={
                  isAdding || // Prevent multiple clicks
                  (product.variants?.length > 0 && !selectedVariant) ||
                  currentStock === 0 ||
                  currentStock - inCartQuantity === 0
                }
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all ${
                  addedToCart
                    ? "bg-green-500 text-white"
                    : isAdding
                    ? "bg-green-300 text-white cursor-not-allowed"
                    : currentStock === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : product.variants?.length > 0 && !selectedVariant
                    ? "bg-green-50 text-green-800"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Added to Cart
                  </>
                ) : isAdding ? (
                  "Adding..."
                ) : currentStock === 0 ? (
                  "Out of Stock"
                ) : product.variants?.length > 0 && !selectedVariant ? (
                  "Select an Option"
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add to Cart
                  </>
                )}
              </button>

              {/* Additional Product Details */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Product Details
                </h3>
                <dl className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Vendor
                    </dt>
                    <dd className="mt-1">
                      <Link
                        to={`/store/${product.vendorSlug}`}
                        className="text-sm text-gray-900 hover:text-green-600 transition-colors inline-flex items-center gap-1"
                      >
                        {product.vendorName}
                        <Store className="h-4 w-4" />
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Category
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {product.category}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-8">
              More From This Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                  onClick={(e) => {
                    // If we're already on product details page, prevent default navigation
                    // and reload the page with the new product ID
                    if (window.location.pathname.includes("/product/")) {
                      e.preventDefault();
                      navigate(`/product/${relatedProduct.id}`);
                      // Scroll to top after navigation
                      window.scrollTo(0, 0);
                    }
                  }}
                >
                  <div className="relative w-full h-32 sm:h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={getImageUrl(relatedProduct.image_url || relatedProduct.imageUrl)}
                      alt={relatedProduct.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/400/400";
                      }}
                    />
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 group-hover:text-green-700 transition-colors line-clamp-1">
                      {relatedProduct.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 line-clamp-2">
                      {relatedProduct.description}
                    </p>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="text-sm sm:text-lg font-bold">
                        {relatedProduct.variants &&
                        relatedProduct.variants.length > 0
                          ? `₦${Math.min(
                              ...relatedProduct.variants.map(
                                (v) => Number(v.price) || 0
                              )
                            ).toLocaleString()}`
                          : `₦${Number(relatedProduct.price || 0).toLocaleString()}`}
                      </span>
                      <span className="text-xs sm:text-sm text-green-600">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default ProductDetailsPage;
