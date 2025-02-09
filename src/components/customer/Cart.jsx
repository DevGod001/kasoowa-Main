import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import CheckoutAuthModal from './CheckoutAuthModal';

const Cart = ({ isOpen, onClose, cartItems, updateQuantity, removeFromCart }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  // Handle checkout process
  const handleCheckoutStart = () => {
    setIsAuthModalOpen(true);
  };

  // Check if cart has items
  const hasItems = cartItems.length > 0;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Cart Panel */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Cart Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <ShoppingBag className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold">Your Cart</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hasItems ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex p-4">
                    {/* Item Image */}
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl || "/api/placeholder/80/80"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/api/placeholder/80/80";
                        }}
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 ml-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          {item.selectedVariant && (
                            <p className="text-sm text-gray-600">
                              {item.selectedVariant.weight} - {item.selectedVariant.size}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="font-bold text-gray-900">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <div className="flex items-center bg-gray-50 rounded-lg border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-l-lg transition-colors disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-4 py-1 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-r-lg transition-colors disabled:opacity-50"
                            disabled={item.quantity >= item.stockQuantity}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {hasItems && (
          <div className="border-t bg-white p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Cart Value</span>
                <span className="text-lg font-bold text-gray-900">
                  ₦{calculateTotal().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-medium">Required Deposit (10%)</span>
                <span className="font-bold">
                  ₦{(calculateTotal() * 0.1).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                * Only 10% deposit is required to schedule your order pickup
              </p>
            </div>
            <button
              onClick={handleCheckoutStart}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2 mt-4"
            >
              <span>Pay 10% Deposit & Schedule</span>
            </button>
          </div>
        )}
      </div>

      {/* Checkout Authentication Modal */}
      <CheckoutAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        cartItems={cartItems}
        total={calculateTotal()}
      />
    </>
  );
};

export default Cart;