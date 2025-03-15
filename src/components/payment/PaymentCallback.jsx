import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '../../contexts/OrderContext';
import { CheckCircle, XCircle } from 'lucide-react';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { createOrder } = useOrders();
  const [status, setStatus] = useState('processing');

  // Function to verify payment
  const verifyPaymentWithProcessor = async (reference) => {
    try {
      // Here you would typically make an API call to verify the payment
      // For demo purposes, we'll simulate a successful response
      return {
        status: 'success',
        metadata: {
          orderData: JSON.parse(localStorage.getItem('tempOrderData') || '{}')
        }
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  // Function to send order confirmation email
  const sendOrderConfirmationEmail = async ({ email, orderDetails }) => {
    // Here you would typically integrate with your email service
    // For demo purposes, we'll just log it
    console.log('Sending confirmation email to:', email, 'Order details:', orderDetails);
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference');
        const response = await verifyPaymentWithProcessor(reference);

        if (response.status === 'success') {
          const orderData = response.metadata.orderData;
          orderData.status = 'processing';
          orderData.depositPaid = orderData.depositRequired;
          await createOrder(orderData);

          await sendOrderConfirmationEmail({
            email: orderData.userEmail,
            orderDetails: orderData
          });

          setStatus('success');
          
          setTimeout(() => {
            navigate('/account');
          }, 3000);
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams, createOrder, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        {status === 'processing' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <h2 className="mt-4 text-lg font-semibold">Verifying Payment...</h2>
            <p className="mt-2 text-gray-600">Please wait while we confirm your payment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="mt-4 text-lg font-semibold">Payment Successful!</h2>
            <p className="mt-2 text-gray-600">
              We've sent a receipt to your email. Redirecting you to your dashboard...
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-lg font-semibold">Payment Failed</h2>
            <p className="mt-2 text-gray-600">
              Something went wrong with your payment. Please try again.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Return to Shop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;