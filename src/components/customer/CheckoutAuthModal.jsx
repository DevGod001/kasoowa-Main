// src/components/customer/CheckoutAuthModal.jsx
import React, { useState } from 'react';
import { X, Mail, Phone } from 'lucide-react';
import { useOrders } from '../../contexts/OrderContext';
import { useNavigate } from 'react-router-dom';

const CheckoutAuthModal = ({ isOpen, onClose, cartItems, total }) => {
 const [formData, setFormData] = useState({
   email: '',
   phone: '',
 });
 const [errors, setErrors] = useState({});
 const [isLoading, setIsLoading] = useState(false);
 const { createOrder } = useOrders();
 const navigate = useNavigate();
 const deposit = total * 0.1; // 10% of total

 const handlePaymentSuccess = async (reference) => {
   try {
     // Create order in your system
     const orderData = {
       userEmail: formData.email,
       userPhone: formData.phone,
       items: cartItems,
       total: total,
       depositPaid: deposit,
       depositRequired: deposit,
       status: 'processing',
       paymentReference: reference,
       date: new Date().toISOString()
     };

     // Store order data temporarily
     localStorage.setItem('tempOrderData', JSON.stringify(orderData));

     await createOrder(orderData);
     
     // Close modals and redirect
     onClose();
     alert('Payment successful! Check your email for receipt.');
     navigate('/account');
   } catch (error) {
     console.error('Error creating order:', error);
     alert('Error creating order. Please contact support.');
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
     newErrors.email = 'Email is required';
   } else if (!emailRegex.test(formData.email)) {
     newErrors.email = 'Please enter a valid email';
   }

   // Phone validation (Nigerian format)
   const phoneRegex = /^([0-9]{11}|[0-9]{10})$/;
   if (!formData.phone) {
     newErrors.phone = 'Phone number is required';
   } else if (!phoneRegex.test(formData.phone)) {
     newErrors.phone = 'Please enter a valid phone number';
   }

   setErrors(newErrors);
   return Object.keys(newErrors).length === 0;
 };

 const initializePayment = () => {
   try {
     console.log('Starting payment initialization...');
     console.log('Payment details:', {
       email: formData.email,
       amount: Math.round(deposit * 100),
       phone: formData.phone
     });

     // Check if PaystackPop is available
     if (!window.PaystackPop) {
       console.error('PaystackPop not found');
       throw new Error('Payment service not available');
     }

     const paystack = new window.PaystackPop();
     const config = {
       key: 'pk_test_f38ae2cbb170707f232f9a81c7d9374c1f518fd9',
       email: formData.email,
       amount: Math.round(deposit * 100),
       currency: 'NGN',
       ref: 'KAS_' + new Date().getTime(),
       metadata: {
         custom_fields: [
           {
             display_name: "Phone Number",
             variable_name: "phone",
             value: formData.phone
           }
         ]
       },
       callback: function(response) {
         console.log('Payment callback received:', response);
         handlePaymentSuccess(response.reference);
       },
       onClose: function() {
         console.log('Payment modal closed');
         handlePaymentClose();
       }
     };

     console.log('Opening payment modal with config:', config);
     paystack.newTransaction(config);
   } catch (error) {
     console.error('Error in initializePayment:', error);
     throw error;
   }
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   if (validateForm()) {
     setIsLoading(true);
     try {
       // Add a small delay to ensure Paystack script is loaded
       setTimeout(() => {
         initializePayment();
       }, 1000);
     } catch (error) {
       console.error('Payment initialization error:', error);
       setErrors({ 
         submit: `Payment initialization failed: ${error.message || 'Please try again.'}`
       });
     } finally {
       setIsLoading(false);
     }
   }
 };

 const handleChange = (e) => {
   const { name, value } = e.target;
   setFormData(prev => ({
     ...prev,
     [name]: value
   }));
   if (errors[name]) {
     setErrors(prev => ({
       ...prev,
       [name]: ''
     }));
   }
 };

 if (!isOpen) return null;

 return (
   <>
     <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
     <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl z-50 p-6">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-semibold text-gray-900">Checkout Details</h2>
         <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
           <X className="h-6 w-6" />
         </button>
       </div>

       <div className="mb-6">
         <div className="bg-green-50 p-4 rounded-lg">
           <p className="text-green-800 font-medium">Order Summary</p>
           <div className="mt-2 space-y-1">
             <div className="flex justify-between">
               <span className="text-gray-600">Total Amount:</span>
               <span className="font-semibold">₦{total.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-green-700 font-medium">
               <span>Required Deposit (10%):</span>
               <span>₦{deposit.toLocaleString()}</span>
             </div>
           </div>
         </div>
       </div>

       <form onSubmit={handleSubmit} className="space-y-4">
         <div>
           <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                 errors.email ? 'border-red-300' : 'border-gray-300'
               }`}
               placeholder="your@email.com"
             />
           </div>
           {errors.email && (
             <p className="mt-1 text-sm text-red-600">{errors.email}</p>
           )}
         </div>

         <div>
           <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
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
                 errors.phone ? 'border-red-300' : 'border-gray-300'
               }`}
               placeholder="Enter your phone number"
             />
           </div>
           {errors.phone && (
             <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
           )}
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
           {isLoading ? 'Processing...' : `Pay ₦${deposit.toLocaleString()} Deposit`}
         </button>
       </form>

       <p className="mt-4 text-sm text-gray-500 text-center">
         You'll complete the remaining payment of ₦{(total - deposit).toLocaleString()} at pickup
       </p>
     </div>
   </>
 );
};

export default CheckoutAuthModal;