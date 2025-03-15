import React, { useState, useMemo, useEffect } from "react";
import { Plus, Minus, ShoppingCart, RefreshCw } from "lucide-react";

const ProductCard = ({
  product,
  onAddToCart,
  onUpdateQuantity,
  quantityInCart = 0,
}) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showVariants, setShowVariants] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(null);

  // Reset states when product changes
  useEffect(() => {
    setSelectedVariant(null);
    setShowVariants(false);
    setQuantity(1);
    setCurrentImage(product?.imageUrl || "/api/placeholder/400/300");
  }, [product]);

  // Update image when variant changes
  useEffect(() => {
    if (selectedVariant?.imageUrl) {
      setCurrentImage(selectedVariant.imageUrl);
    } else {
      setCurrentImage(product?.imageUrl || "/api/placeholder/400/300");
    }
  }, [selectedVariant, product]);

  // When the product is added to cart, reset the variant selection
  useEffect(() => {
    if (quantityInCart > 0) {
      setShowVariants(false);
    }
  }, [quantityInCart]);

  const basePrice = useMemo(() => {
    if (product?.variants?.length > 0) {
      const prices = product.variants.map((v) => Number(v.price));
      return Math.min(...prices);
    }
    return Number(product?.price) || 0;
  }, [product]);

  const totalStock = useMemo(() => {
    if (product?.variants?.length > 0) {
      return product.variants.reduce(
        (sum, v) => sum + Number(v.stockQuantity),
        0
      );
    }
    return Number(product?.stockQuantity) || 0;
  }, [product]);

  const currentStock = useMemo(() => {
    return selectedVariant ? selectedVariant.stockQuantity : totalStock;
  }, [selectedVariant, totalStock]);

  const availableStock = currentStock - quantityInCart;

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setShowVariants(false); // Close dropdown after selection
    setQuantity(1);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    if (value === "") {
      setQuantity("");
    } else {
      setQuantity(Math.min(Math.max(1, value), availableStock));
    }
  };

  const handleAddToCart = () => {
    if (product?.variants?.length > 0 && !selectedVariant) {
      setShowVariants(true);
      return;
    }

    const productToAdd = {
      id: product.id,
      title: product.title,
      description: product.description,
      imageUrl: currentImage,
      price: selectedVariant ? selectedVariant.price : product.price,
      stockQuantity: selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity,
      selectedVariant: selectedVariant
        ? {
            id: selectedVariant.id,
            weight: selectedVariant.weight,
            size: selectedVariant.size,
            price: selectedVariant.price,
            stockQuantity: selectedVariant.stockQuantity,
            imageUrl: selectedVariant.imageUrl,
          }
        : null,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      vendorSlug: product.vendorSlug,
    };

    const currentVariantStock = selectedVariant
      ? selectedVariant.stockQuantity
      : product.stockQuantity;

    if (quantityInCart + quantity > currentVariantStock) {
      alert(`Cannot exceed available stock of ${currentVariantStock} items`);
      return;
    }

    onAddToCart(productToAdd, quantity);

    // Reset selection after adding to cart
    setSelectedVariant(null);
    setQuantity(1);
    setShowVariants(false);
    setCurrentImage(product?.imageUrl || "/api/placeholder/400/300"); // Reset image to default
  };

  const resetSelection = () => {
    setSelectedVariant(null);
    setShowVariants(false);
    setQuantity(1);
    setCurrentImage(product?.imageUrl || "/api/placeholder/400/300");
  };

  if (!product) return null;

  return (
    <div className="h-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col">
      {/* Image Section */}
      <div className="relative w-[300px] h-full overflow-hidden">
        <img
          src={currentImage}
          alt={product.title}
          className="w-full h-full object-cover transition-all duration-300 ease-in-out"
          onError={(e) => {
            e.target.src = "/api/placeholder/400/300";
          }}
        />
      </div>

      {/* Content Section */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{product.description}</p>

        {/* Price Display */}
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">
              {selectedVariant
                ? `₦${Number(selectedVariant.price).toLocaleString()}`
                : `${
                    product.variants?.length > 0 ? "From " : ""
                  }₦${basePrice.toLocaleString()}`}
            </span>
            <span
              className={`text-sm ${
                availableStock > 0
                  ? "text-green-600"
                  : "text-red-600 font-semibold"
              }`}
            >
              {availableStock > 0
                ? `${availableStock} in stock`
                : "Out of Stock"}
            </span>
          </div>

          {/* Variant Selection */}
          {(showVariants || selectedVariant) && product.variants?.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-0 pr-4">
                <select
                  onChange={(e) => {
                    const variant = product.variants.find(
                      (v) => v.id === e.target.value
                    );
                    if (variant) {
                      handleVariantSelect(variant);
                    } else {
                      resetSelection();
                    }
                  }}
                  value={selectedVariant?.id || ""}
                  className="flex-1 p-2 border rounded-md"
                  onBlur={() => setShowVariants(false)}
                >
                  <option value="">Select Size/Weight</option>
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.weight} - {variant.size} - ₦
                      {Number(variant.price).toLocaleString()}
                    </option>
                  ))}
                </select>
                <button
                  onClick={resetSelection}
                  className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100"
                  title="Reset selection"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Quantity Input and Add to Cart */}
          {quantityInCart === 0 ? (
            <div className="space-y-2">
              {(selectedVariant || !product.variants?.length) &&
                availableStock > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      min="1"
                      max={availableStock}
                      value={quantity}
                      onChange={handleQuantityChange}
                      onBlur={() => {
                        if (quantity === "" || quantity < 1) {
                          setQuantity(1);
                        }
                      }}
                      className="w-24 p-2 border rounded-md"
                    />
                    <span
                      className={`text-sm ${
                        availableStock > 0
                          ? "text-green-600"
                          : "text-red-600 font-semibold"
                      }`}
                    >
                      {availableStock > 0
                        ? `${availableStock} in stock`
                        : "Out of Stock"}
                    </span>
                  </div>
                )}
              <button
                onClick={handleAddToCart}
                style={{ backgroundColor: "rgba(144, 238, 144, 0.5)" }}
                className="w-full text-green-800 font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={availableStock <= 0}
              >
                <ShoppingCart size={20} />
                {product.variants?.length > 0 && !selectedVariant
                  ? "Select Options"
                  : "Add to Cart"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between flex-1">
                <button
                  onClick={() =>
                    onUpdateQuantity(product.id, quantityInCart - 1)
                  }
                  className="bg-green-50 hover:bg-green-100 text-green-800 p-2 rounded-md disabled:opacity-50"
                  disabled={quantityInCart <= 0}
                >
                  <Minus size={16} />
                </button>
                <span className="font-semibold text-lg">{quantityInCart}</span>
                <button
                  onClick={() =>
                    onUpdateQuantity(product.id, quantityInCart + 1)
                  }
                  className="bg-green-50 hover:bg-green-100 text-green-800 p-2 rounded-md disabled:opacity-50"
                  disabled={quantityInCart >= currentStock}
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={resetSelection}
                className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100"
                title="Reset selection"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;