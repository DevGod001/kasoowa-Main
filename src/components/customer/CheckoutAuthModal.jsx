// src/components/customer/CheckoutAuthModal.jsx
import React, { useState } from "react";
import { X, Mail, Phone, MapPin, Truck, Home } from "lucide-react";
import { useOrders } from "../../contexts/OrderContext";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const CheckoutAuthModal = ({ isOpen, onClose, cartItems, total }) => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    deliveryMethod: "delivery",
    state: "",
    city: "",
    address: "",
    additionalInfo: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const calculateDeliveryFee = () => {
    if (formData.deliveryMethod === "pickup") return 0;
    if (formData.state === "Rivers") {
      return formData.city.toLowerCase() === "port harcourt" ? 1000 : 1500;
    }
    return 2500; // Default delivery fee for other states
  };

  const calculateTotalAmount = () => {
    const deliveryFee = calculateDeliveryFee();
    if (formData.deliveryMethod === "delivery") {
      return total + deliveryFee;
    }
    return total * 0.1; // 10% deposit for pickup
  };

  const handlePaymentSuccess = async (reference) => {
    try {
      const deliveryFee = calculateDeliveryFee();
      const paymentAmount = calculateTotalAmount();
      const orderTotal =
        total + (formData.deliveryMethod === "delivery" ? deliveryFee : 0);

      // First, log the raw cart items
      console.log("Raw cart items before mapping:", cartItems);

      // Map cart items to order items with additional debugging
      const orderItems = cartItems.map((item) => {
        console.log(`Processing cart item:`, item);

        // Log key properties to check if they exist
        console.log(`Item ID: ${item.id}, Type: ${typeof item.id}`);
        console.log(`Item has selectedVariant: ${!!item.selectedVariant}`);
        if (item.selectedVariant) {
          console.log(
            `Variant ID: ${item.selectedVariant.id}, Type: ${typeof item
              .selectedVariant.id}`
          );
        }

        return {
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          vendorId: item.vendorId ? item.vendorId.toString() : "",
          vendorName: item.vendorName || "",
          vendorSlug: item.vendorSlug || "",
          // Important: Ensure we provide both variant properties
          selectedVariant: item.selectedVariant || null,
          variant: item.selectedVariant || null, // Duplicate for compatibility
          stockQuantity: item.stockQuantity || 0,
          imageUrl: item.imageUrl || null,
        };
      });

      console.log("Mapped order items:", orderItems);

      // Create order with the mapped items
      const orderData = {
        userEmail: formData.email,
        userPhone: formData.phone,
        items: orderItems,
        total: orderTotal, // Include delivery fee in the total
        subtotal: total, // Original subtotal without delivery fee
        deliveryMethod: formData.deliveryMethod,
        deliveryFee: deliveryFee,
        amountPaid: paymentAmount,
        balanceDue:
          formData.deliveryMethod === "delivery"
            ? 0
            : orderTotal - paymentAmount,
        paymentType:
          formData.deliveryMethod === "delivery" ? "full" : "deposit",
        status: "processing",
        paymentReference: reference,
        deliveryAddress:
          formData.deliveryMethod === "delivery"
            ? {
                state: formData.state,
                city: formData.city,
                address: formData.address,
                additionalInfo: formData.additionalInfo,
              }
            : null,
        date: new Date().toISOString(),
        affiliateId: sessionStorage.getItem('referringAffiliateId') || null,
      };

      // Log the complete order data to verify it contains correct information
      console.log(
        "Creating order with data:",
        JSON.stringify(orderData, null, 2)
      );

      // Store order data temporarily
      localStorage.setItem("tempOrderData", JSON.stringify(orderData));

      await createOrder(orderData);

      // Clear cart
      clearCart();

      // Close modals and redirect
      onClose();
      alert("Payment successful! Check your email for receipt.");
      navigate("/account");
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Error creating order. Please contact support.");
    }
  };

  const handlePaymentClose = () => {
    setIsLoading(false);
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Phone validation (Nigerian format)
    const phoneRegex = /^([0-9]{11}|[0-9]{10})$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate delivery fields
    if (formData.deliveryMethod === "delivery") {
      if (!formData.state) newErrors.state = "Please select your state";
      if (!formData.city) newErrors.city = "City is required";
      if (!formData.address) newErrors.address = "Delivery address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const initializePayment = () => {
    try {
      const amount = calculateTotalAmount();

      if (!window.PaystackPop) {
        console.error("PaystackPop not found");
        throw new Error("Payment service not available");
      }

      const paystack = new window.PaystackPop();
      const config = {
        key: "pk_test_f38ae2cbb170707f232f9a81c7d9374c1f518fd9",
        email: formData.email,
        amount: Math.round(amount * 100), // Convert to kobo
        currency: "NGN",
        ref: "KAS_" + new Date().getTime(),
        metadata: {
          custom_fields: [
            {
              display_name: "Phone Number",
              variable_name: "phone",
              value: formData.phone,
            },
          ],
        },
        callback: function (response) {
          handlePaymentSuccess(response.reference);
        },
        onClose: function () {
          handlePaymentClose();
        },
      };

      paystack.newTransaction(config);
    } catch (error) {
      console.error("Error in initializePayment:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        setTimeout(() => {
          initializePayment();
        }, 1000);
      } catch (error) {
        console.error("Payment initialization error:", error);
        setErrors({
          submit: `Payment initialization failed: ${
            error.message || "Please try again."
          }`,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Checkout Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    deliveryMethod: "delivery",
                  }))
                }
                className={`p-4 border rounded-lg text-left transition-all ${
                  formData.deliveryMethod === "delivery"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <Truck className="h-5 w-5 text-green-600 mb-2" />
                <div className="font-medium">Home Delivery</div>
                <p className="text-xs text-gray-500">
                  Delivered to your address: Available nationwide
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, deliveryMethod: "pickup" }))
                }
                className={`p-4 border rounded-lg text-left transition-all ${
                  formData.deliveryMethod === "pickup"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <MapPin className="h-5 w-5 text-green-600 mb-2" />
                <div className="font-medium">Self Pickup</div>
                <p className="text-xs text-gray-500">
                  Available in Port Harcourt
                </p>
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="your@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                  errors.phone ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your phone number"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Delivery Address Fields */}
          {formData.deliveryMethod === "delivery" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700"
                >
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md ${
                    errors.state ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700"
                >
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                    errors.city ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Delivery Address
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                      errors.address ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter your full address"
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="additionalInfo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Additional Information (Optional)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows="3"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Landmarks, delivery instructions, etc."
                />
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Order Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₦{total.toLocaleString()}</span>
              </div>

              {formData.deliveryMethod === "delivery" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">
                    ₦{calculateDeliveryFee().toLocaleString()}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Total Payment:</span>
                  <span className="text-green-600">
                    ₦{calculateTotalAmount().toLocaleString()}
                  </span>
                </div>
                {formData.deliveryMethod === "pickup" && (
                  <p className="text-xs text-gray-500 mt-1">
                    10% deposit required for pickup. Balance due at pickup: ₦
                    {(total - calculateTotalAmount()).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Processing..."
              : formData.deliveryMethod === "delivery"
              ? `Pay ₦${calculateTotalAmount().toLocaleString()}`
              : `Pay ₦${calculateTotalAmount().toLocaleString()} Deposit`}
          </button>

          {formData.deliveryMethod === "pickup" && (
            <p className="text-sm text-gray-500 text-center">
              Balance of ₦{(total - calculateTotalAmount()).toLocaleString()} to
              be paid at pickup
            </p>
          )}
        </form>
      </div>
    </>
  );
};

export default CheckoutAuthModal;
