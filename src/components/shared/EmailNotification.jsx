// File: src/components/shared/EmailNotification.jsx

import React from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';

const EmailNotification = ({ 
  type = 'order', // 'order' | 'confirmation' | 'ready' | 'receipt'
  data,
  status = 'pending' // 'pending' | 'sent' | 'error'
}) => {
  const getNotificationContent = () => {
    switch (type) {
      case 'order':
        return {
          title: 'Order Confirmation',
          message: 'Your order details and deposit receipt',
          icon: <Mail className="w-5 h-5" />
        };
      case 'confirmation':
        return {
          title: 'Pickup Confirmation',
          message: 'Your scheduled pickup details',
          icon: <Check className="w-5 h-5" />
        };
      case 'ready':
        return {
          title: 'Order Ready',
          message: 'Your order is ready for pickup',
          icon: <Check className="w-5 h-5" />
        };
      case 'receipt':
        return {
          title: 'Payment Receipt',
          message: 'Your full payment receipt',
          icon: <Mail className="w-5 h-5" />
        };
      default:
        return {
          title: 'Notification',
          message: 'Email notification',
          icon: <Mail className="w-5 h-5" />
        };
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const { title, message, icon } = getNotificationContent();

  return (
    <div className={`flex items-center p-4 rounded-lg border ${getStatusStyles()}`}>
      <div className="flex-shrink-0">
        {status === 'error' ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          icon
        )}
      </div>
      <div className="ml-3">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm mt-1">{message}</p>
        {data?.email && (
          <p className="text-sm mt-1">
            Sent to: {data.email}
          </p>
        )}
      </div>
      {status === 'pending' && (
        <div className="ml-auto">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default EmailNotification;