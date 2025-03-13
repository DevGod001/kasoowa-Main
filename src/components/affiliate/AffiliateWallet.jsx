// src/components/affiliate/AffiliateWallet.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAffiliate } from '../../contexts/AffiliateContext';
import { 
  ArrowUpCircle, 
  ArrowLeft, 
  AlertTriangle, 
  DollarSign, 
  Clock,
  X,
} from 'lucide-react';
import { nigerianBanks } from '../../config/countryData';

const AffiliateWallet = () => {
  const { 
    affiliateData, 
    loading, 
    earnings, 
    pendingAmount,
    pendingWithdrawals, 
    withdrawalHistory,
    requestWithdrawal,
    isAffiliate,
    getMonthlyData,
  } = useAffiliate();
  
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [bankCode, setBankCode] = useState(affiliateData?.bankCode || '');
  const [bankName, setBankName] = useState(affiliateData?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(affiliateData?.accountNumber || '');
  const [accountName, setAccountName] = useState(affiliateData?.accountName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Get monthly data and sanitize it to avoid NaN values
  const rawMonthlyData = getMonthlyData();
  const [monthlyData] = useState(() => {
    return rawMonthlyData.map(month => ({
      ...month,
      // Ensure all numeric values are valid numbers or default to 0
      sales: typeof month.sales === 'number' && !isNaN(month.sales) ? month.sales : 0,
      commission: typeof month.commission === 'number' && !isNaN(month.commission) 
        ? month.commission 
        : (typeof month.sales === 'number' && !isNaN(month.sales) ? month.sales * 0.02 : 0)
    }));
  });

  // Format account number input (only allow numbers and limit to standard length)
  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
    // Limit to 10 digits (standard for Nigerian accounts)
    if (value.length <= 10) {
      setAccountNumber(value);
    }
  };

  // Format account name input (only allow letters, spaces and some special characters)
  const handleAccountNameChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s\-']/g, ''); // Only allow letters, spaces, hyphens and apostrophes
    setAccountName(value);
  };

  // Open withdrawal modal with pre-filled bank details
  const openWithdrawalModal = () => {
    // Pre-fill with affiliate's bank details if available
    if (affiliateData) {
      setBankName(affiliateData.bankName || '');
      setBankCode(affiliateData.bankCode || '');
      setAccountNumber(affiliateData.accountNumber || '');
      setAccountName(affiliateData.accountName || '');
    } else {
      // Default values if no registered details
      setBankName('');
      setBankCode('');
      setAccountNumber('');
      setAccountName('');
    }

    setWithdrawalAmount('');
    setPaymentMethod('bank');
    setError('');
    setSuccessMessage('');
    setIsWithdrawalModalOpen(true);
  };

  // Close withdrawal modal
  const closeWithdrawalModal = () => {
    setIsWithdrawalModalOpen(false);
  };

  // Handle withdrawal form submission
  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate amount
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amount > earnings) {
      setError('Withdrawal amount cannot exceed available earnings');
      return;
    }
    
    if (amount < 500) {
      setError('Minimum withdrawal amount is ₦500');
      return;
    }
    
    // Validate payment details
    if (paymentMethod === 'bank') {
      if (!bankName) {
        setError('Please select a bank');
        return;
      }
      
      if (!accountNumber || accountNumber.length !== 10) {
        setError('Please provide a valid 10-digit account number');
        return;
      }
      
      if (!accountName) {
        setError('Please provide the account name');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const accountDetails = paymentMethod === 'bank' 
        ? { bankName, bankCode, accountNumber, accountName } 
        : { provider: 'Mobile Money' };
      
      const result = await requestWithdrawal(amount, paymentMethod, accountDetails);
      
      if (result.success) {
        setSuccessMessage('Withdrawal request submitted successfully!');
        setWithdrawalAmount('');
        setTimeout(() => {
          closeWithdrawalModal();
        }, 2000);
      } else {
        setError(result.message || 'Failed to process withdrawal request');
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency - with error handling for NaN values
  const formatCurrency = (amount) => {
    // Make sure amount is a valid number, otherwise use 0
    const numAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    
    return `₦${numAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAffiliate) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-red-600 mb-4">You need to be an approved affiliate to access this page.</p>
        <Link to="/affiliate/register" className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          Apply to become an affiliate
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4">
        <Link to="/affiliate/dashboard" className="inline-flex items-center text-green-600 hover:text-green-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Affiliate Wallet</h1>
        <p className="text-gray-600">Manage your earnings and withdrawals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Balance and Withdraw */}
        <div className="lg:col-span-2 space-y-8">
          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Balance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Available for Withdrawal</p>
                <p className="text-3xl font-bold">{formatCurrency(earnings)}</p>
              </div>
              
              <div className="bg-green-50 rounded-full p-3">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Withdraw Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Withdraw Funds</h2>
            
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Minimum withdrawal:</span> ₦500
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Withdrawals are typically processed within 2-3 business days.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={openWithdrawalModal}
              disabled={earnings < 500}
              className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 ${earnings < 500 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowUpCircle className="h-5 w-5" />
              Request Withdrawal
            </button>
            
            {earnings < 500 && (
              <p className="mt-2 text-sm text-red-600 text-center">
                You need at least ₦500 in your balance to withdraw
              </p>
            )}
          </div>

          {/* Pending Amount */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Pending Earnings</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Awaiting Order Completion</p>
                <p className="text-3xl font-bold">{formatCurrency(pendingAmount)}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-full p-3">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  Pending earnings will be available for withdrawal once the orders are completed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div className="space-y-8">
          {/* Monthly Earnings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Monthly Earnings</h2>
            
            {monthlyData && monthlyData.length > 0 ? (
              <div className="space-y-2">
                {monthlyData.map((month, index) => (
                  <div key={index} className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">{month.month || ""}</span>
                    <span className="font-semibold">
                      {formatCurrency(month.commission)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No earnings data yet</p>
            )}
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Pending Withdrawals</h2>
            
            {pendingWithdrawals && pendingWithdrawals.length > 0 ? (
              <div className="space-y-4">
                {pendingWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(withdrawal.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {withdrawal.requestDate ? new Date(withdrawal.requestDate).toLocaleDateString() : ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {withdrawal.method === 'bank' ? 'Bank Transfer' : 'Mobile Money'}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending withdrawals</p>
            )}
          </div>

          {/* Withdrawal History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Withdrawal History</h2>
            
            {withdrawalHistory && withdrawalHistory.length > 0 ? (
              <div className="space-y-4">
                {withdrawalHistory.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex justify-between items-center p-3 border-b">
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(withdrawal.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {withdrawal.completionDate || withdrawal.requestDate ? 
                          new Date(withdrawal.completionDate || withdrawal.requestDate).toLocaleDateString() 
                          : ""}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No withdrawal history</p>
            )}
          </div>

          {/* Commission Rates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Commission Information</h2>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-2 font-medium">
                Current Commission Rate: 2%
              </p>
              <p className="text-sm text-blue-700">
                You earn 2% of the total sales value for each order made through your affiliate links or store.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Request Withdrawal</h2>
              <button
                onClick={closeWithdrawalModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleWithdrawalSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Available Balance:{" "}
                  <span className="font-medium">
                    {formatCurrency(earnings)}
                  </span>
                </p>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="withdrawalAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₦</span>
                  </div>
                  <input
                    type="number"
                    id="withdrawalAmount"
                    min="500"
                    max={earnings}
                    step="1"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="w-full pl-8 p-2 border rounded-md"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum withdrawal: ₦500
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Withdrawal Method
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="withdrawalMethod"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={() => setPaymentMethod("bank")}
                      className="mr-2"
                    />
                    <span className="text-sm">Bank Transfer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="withdrawalMethod"
                      value="mobile"
                      checked={paymentMethod === "mobile"}
                      onChange={() => setPaymentMethod("mobile")}
                      className="mr-2"
                    />
                    <span className="text-sm">Mobile Money</span>
                  </label>
                </div>
              </div>

              <div className="overflow-y-auto pr-2 flex-1">
                {paymentMethod === "bank" && (
                  <>
                    {affiliateData && affiliateData.bankName && (
                      <div className="mb-4 bg-green-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-green-700 mb-2">
                          Using registered bank details:
                        </p>
                        <p className="text-sm text-green-600">
                          {affiliateData.bankName} - {affiliateData.accountNumber}
                        </p>
                        <p className="text-sm text-green-600">
                          Account Name: {affiliateData.accountName}
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <label
                        htmlFor="withdrawalBank"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Bank Name
                      </label>
                      <select
                        id="withdrawalBank"
                        value={bankCode}
                        onChange={(e) => {
                          const selectedBank = nigerianBanks.find(
                            (bank) => bank.code === e.target.value
                          );
                          setBankCode(e.target.value);
                          setBankName(selectedBank?.name || "");
                        }}
                        className="w-full p-2 border rounded-md"
                        required
                      >
                        <option value="">Select Bank</option>
                        {nigerianBanks.map((bank) => (
                          <option key={bank.code} value={bank.code}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="withdrawalAccount"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Account Number
                      </label>
                      <input
                        type="text"
                        id="withdrawalAccount"
                        value={accountNumber}
                        onChange={handleAccountNumberChange}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter 10-digit account number"
                        maxLength={10}
                        required
                      />
                      {accountNumber && accountNumber.length !== 10 && (
                        <p className="mt-1 text-xs text-red-500">
                          Account number must be 10 digits
                        </p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="withdrawalAccountName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Account Name
                      </label>
                      <input
                        type="text"
                        id="withdrawalAccountName"
                        value={accountName}
                        onChange={handleAccountNameChange}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter account name"
                        required
                      />
                    </div>
                  </>
                )}

                {paymentMethod === "mobile" && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm text-gray-600">
                      Mobile money withdrawals will be sent to your registered
                      phone number.
                    </p>
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <p className="text-sm font-medium">
                        Phone Number:{" "}
                        <span className="font-bold">
                          {affiliateData?.phone || "Not available"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-600">
                      Withdrawal requests are typically processed within 2-3
                      business days. You will receive an email notification when
                      your withdrawal is complete.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={closeWithdrawalModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center disabled:opacity-50"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Processing..." : "Request Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateWallet;