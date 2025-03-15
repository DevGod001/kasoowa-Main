// src/components/vendor/VendorWallet.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Clock,
  AlertTriangle,
  Download,
  X,
  ArrowUpCircle,
  Wallet,
} from "lucide-react";

const VendorWallet = () => {
  // State for wallet data
  const [walletBalance, setWalletBalance] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTransactionType, setFilterTransactionType] = useState("all");
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);

  // State for withdrawal modal
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("bank");

  // Bank account selection state
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);

  // These states will be set from the selected bank account
  const [withdrawalAccount, setWithdrawalAccount] = useState("");
  const [withdrawalBank, setWithdrawalBank] = useState("");
  const [withdrawalBankCode, setWithdrawalBankCode] = useState("");
  const [withdrawalAccountName, setWithdrawalAccountName] = useState("");

  // Get user from auth context
  const { user } = useAuth();

  // Load bank accounts
  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const token = localStorage.getItem("kasoowaAuthToken");
        const userId = localStorage.getItem("userId");

        if (token && userId) {
          // Try API first
          try {
            const response = await fetch(
              `${window.location.origin}/api/user/bank-accounts`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.ok) {
              const data = await response.json();
              setBankAccounts(data);

              // Set primary account as selected if available
              const primaryAccount = data.find((acc) => acc.is_primary);
              if (primaryAccount) {
                setSelectedBankAccount(primaryAccount.id);
                setWithdrawalBank(primaryAccount.bank_name);
                setWithdrawalBankCode(primaryAccount.bank_code);
                setWithdrawalAccount(primaryAccount.account_number);
                setWithdrawalAccountName(primaryAccount.account_name);
              }
            } else {
              throw new Error("API request failed");
            }
          } catch (apiError) {
            console.warn(
              "API not available, falling back to localStorage:",
              apiError
            );

            // Fallback to localStorage
            const key = `vendor_bank_accounts_${userId}`;
            const storedAccounts = JSON.parse(
              localStorage.getItem(key) || "[]"
            );
            setBankAccounts(storedAccounts);

            // Set primary account as selected if available
            const primaryAccount = storedAccounts.find((acc) => acc.is_primary);
            if (primaryAccount) {
              setSelectedBankAccount(primaryAccount.id);
              setWithdrawalBank(primaryAccount.bank_name);
              setWithdrawalBankCode(primaryAccount.bank_code);
              setWithdrawalAccount(primaryAccount.account_number);
              setWithdrawalAccountName(primaryAccount.account_name);
            }
          }
        }
      } catch (error) {
        console.error("Error loading bank accounts:", error);
        setBankAccounts([]);
      }
    };

    loadBankAccounts();
  }, []);

  // Load wallet data on component mount and when orders change
  useEffect(() => {
    // Updated fetchWalletData function to account for pending withdrawals
    const fetchWalletData = () => {
      setIsLoading(true);
      try {
        const allOrders = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );

        // Filter orders to only include those with items from this vendor
        const vendorOrders = allOrders.filter((order) => {
          return (
            order.items &&
            order.items.some(
              (item) =>
                item.vendorId && item.vendorId.toString() === user.id.toString()
            )
          );
        });

        // Calculate wallet balances and create transaction list
        let availableBalance = 0;
        let pendingBalance = 0;
        const transactionList = [];

        // Process each order
        vendorOrders.forEach((order) => {
          // Get only the vendor's items
          const vendorItems = order.items.filter(
            (item) =>
              item.vendorId && item.vendorId.toString() === user.id.toString()
          );

          // Calculate totals
          const subtotal = order.subtotal || order.total;

          // Calculate vendor's portion of the subtotal
          const vendorSubtotal = vendorItems.reduce((sum, item) => {
            return (
              sum +
              (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
            );
          }, 0);

          // Calculate vendor's proportional share of delivery fee if applicable
          const vendorProportion = subtotal > 0 ? vendorSubtotal / subtotal : 0;
          const deliveryFeePortion =
            order.deliveryFee && order.deliveryMethod === "delivery"
              ? order.deliveryFee * vendorProportion
              : 0;

          // Calculate the total amount for this vendor
          const vendorTotal = vendorSubtotal + deliveryFeePortion;

          // Calculate the admin commission
          const commissionRate = 4.1; // 4.1% admin commission
          const adminCommission = (vendorTotal * commissionRate) / 100;
          const vendorAmount = vendorTotal - adminCommission;

          // Create transaction record
          const transaction = {
            id: order.id,
            date: order.date,
            grossAmount: vendorTotal || 0,
            adminFee: adminCommission || 0,
            netAmount: vendorAmount || 0,
            status: order.status === "completed" ? "Paid" : "Pending",
            type: "sale",
            customerName: order.userIdentifier || "Customer",
            items: vendorItems.length,
            orderStatus: order.status,
          };

          // Add to transactions list
          transactionList.push(transaction);

          // Calculate available and pending balances
          if (order.status === "completed") {
            availableBalance += vendorAmount || 0;
          } else if (
            order.status !== "disputed" &&
            order.status !== "refunded" &&
            order.status !== "cancelled"
          ) {
            pendingBalance += vendorAmount || 0;
          }
        });

        // Load withdrawal history
        const withdrawalHistory = JSON.parse(
          localStorage.getItem(`withdrawals_${user.id}`) || "[]"
        );

        // Adjust available balance based on withdrawals
        withdrawalHistory.forEach((withdrawal) => {
          // For completed withdrawals, subtract from available balance
          if (withdrawal.status === "completed") {
            availableBalance -= withdrawal.amount;
          }
          // For pending withdrawals, also subtract from available balance
          else if (withdrawal.status === "pending") {
            availableBalance -= withdrawal.amount;
          }
        });

        // Sort transactions by date (newest first)
        transactionList.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Update state
        setWalletBalance(availableBalance);
        setPendingAmount(pendingBalance);
        setTransactions(transactionList);
        setWithdrawalHistory(withdrawalHistory);
      } catch (error) {
        console.error("Error loading wallet data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();

    // Listen for order updates or withdrawal changes
    const handleStorageChange = (e) => {
      if (e.key === "kasoowaOrders" || e.key === `withdrawals_${user.id}`) {
        fetchWalletData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user.id]);

  // Open withdrawal modal with pre-filled bank details
  const openWithdrawalModal = () => {
    // Reset selection
    setWithdrawalAmount("");
    setWithdrawalMethod("bank");
    setIsWithdrawalModalOpen(true);
  };

  // Close withdrawal modal
  const closeWithdrawalModal = () => {
    setIsWithdrawalModalOpen(false);
  };

  //handleWithdrawalRequest function with immediate refresh
  const handleWithdrawalRequest = (e) => {
    e.preventDefault();

    const amount = parseFloat(withdrawalAmount);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid withdrawal amount");
      return;
    }

    // Validate bank account selection
    if (withdrawalMethod === "bank") {
      if (bankAccounts.length === 0) {
        alert(
          "Please add at least one bank account in Settings before making a withdrawal"
        );
        return;
      }

      if (!selectedBankAccount) {
        alert("Please select a bank account for withdrawal");
        return;
      }
    }

    // Check if amount is available
    if (amount > walletBalance) {
      alert(
        "Insufficient funds. Your available balance is ₦" +
          walletBalance.toLocaleString()
      );
      return;
    }

    // Create withdrawal request
    const withdrawal = {
      id: `W${Date.now()}`,
      vendorId: user.id,
      amount: amount,
      method: withdrawalMethod,
      accountDetails:
        withdrawalMethod === "bank"
          ? {
              bank: withdrawalBank,
              bankCode: withdrawalBankCode,
              accountNumber: withdrawalAccount,
              accountName: withdrawalAccountName,
            }
          : { provider: "Mobile Money" },
      status: "pending",
      requestDate: new Date().toISOString(),
      date: new Date().toISOString(),
    };

    // Save withdrawal to localStorage
    const existingWithdrawals = JSON.parse(
      localStorage.getItem(`withdrawals_${user.id}`) || "[]"
    );

    const updatedWithdrawals = [...existingWithdrawals, withdrawal];
    localStorage.setItem(
      `withdrawals_${user.id}`,
      JSON.stringify(updatedWithdrawals)
    );

    // Immediately update component state to reflect changes
    setWithdrawalHistory(updatedWithdrawals);

    // Update wallet balance immediately (subtract withdrawal amount)
    setWalletBalance((prevBalance) => prevBalance - amount);

    // Also trigger the storage event for any other components listening
    window.dispatchEvent(new Event("storage"));

    alert(
      "Withdrawal request submitted successfully. Your request will be processed within 2-3 business days."
    );
    closeWithdrawalModal();
  };

  // Filter transactions by type - only show sales transactions
  const filterTransactions = (transactions) => {
    if (filterTransactionType === "all") {
      // Only include sales transactions by default
      return transactions.filter((transaction) => transaction.type === "sale");
    }
    return transactions.filter(
      (transaction) => transaction.type === filterTransactionType
    );
  };

  // Export transactions to CSV
  const exportTransactionsToCSV = () => {
    const headers = [
      "Transaction ID",
      "Date",
      "Type",
      "Gross Amount",
      "Admin Fee",
      "Net Amount",
      "Status",
    ];

    const filteredTransactions = filterTransactions(transactions);

    const csvData = filteredTransactions.map((transaction) => [
      transaction.id || "",
      transaction.date ? new Date(transaction.date).toLocaleDateString() : "",
      transaction.type === "withdrawal" ? "Withdrawal" : "Sale",
      transaction.grossAmount.toFixed(2) || 0,
      transaction.adminFee.toFixed(2) || 0,
      transaction.netAmount.toFixed(2) || 0,
      transaction.status || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vendor_transactions_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Show loading spinner if data is still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Wallet Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Wallet className="h-6 w-6 text-green-600 mr-2" />
            Vendor Wallet
          </h2>
          <button
            onClick={openWithdrawalModal}
            disabled={walletBalance <= 0}
            className={`px-4 py-2 rounded-md text-white flex items-center ${
              walletBalance > 0
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Request Withdrawal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Available Balance */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <p className="text-sm text-green-700 font-medium">
              Available Balance
            </p>
            <p className="text-3xl font-bold text-green-800 mt-2">
              {formatCurrency(walletBalance)}
            </p>
            <p className="text-xs text-green-600 mt-1">Ready to withdraw</p>
            {walletBalance > 0 && (
              <button
                onClick={openWithdrawalModal}
                className="mt-4 w-full py-2 rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center justify-center"
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Request Withdrawal
              </button>
            )}
          </div>

          {/* Pending Amount */}
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
            <p className="text-sm text-yellow-700 font-medium">
              Pending Amount
            </p>
            <p className="text-3xl font-bold text-yellow-800 mt-2">
              {formatCurrency(pendingAmount)}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              From orders not yet completed
            </p>
            {pendingAmount > 0 && (
              <div className="mt-4 bg-yellow-100 p-2 rounded">
                <p className="text-xs text-yellow-700 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Funds will be released when orders are completed
                </p>
              </div>
            )}
          </div>

          {/* Total Earnings */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700 font-medium">Total Earnings</p>
            <p className="text-3xl font-bold text-blue-800 mt-2">
              {formatCurrency(walletBalance + pendingAmount)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Lifetime earnings - Total Withdrawals
            </p>
            <div className="mt-4 bg-blue-100 p-2 rounded text-xs text-blue-700 flex items-start">
              <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
              <span>All amounts shown are after the 4.1% admin commission</span>
            </div>
          </div>
        </div>

        {/* Admin Fee Information */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Admin Fee:</span> A 4.1%
                commission is applied to all sales. This fee covers payment
                processing, platform maintenance, and customer support services.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Sales History</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <select
                value={filterTransactionType}
                onChange={(e) => setFilterTransactionType(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="all">All Sales</option>
                <option value="sale">Recent Sales</option>
              </select>
            </div>

            <button
              onClick={exportTransactionsToCSV}
              className="bg-green-600 text-white px-3 py-1 rounded flex items-center text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin Fee
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filterTransactions(transactions).map((transaction) => (
                <tr
                  key={transaction.id + transaction.date}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {transaction.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {transaction.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(Math.abs(transaction.grossAmount))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">
                    {formatCurrency(transaction.adminFee)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    <span className="text-green-600">
                      +{formatCurrency(Math.abs(transaction.netAmount))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full ${
                        transaction.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filterTransactions(transactions).length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-4 text-sm text-gray-500 text-center"
                  >
                    No sales transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium mb-4">Withdrawal History</h3>

        {withdrawalHistory.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawalHistory.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {withdrawal.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(withdrawal.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                      {withdrawal.method === "bank" &&
                      withdrawal.accountDetails?.bank
                        ? `${withdrawal.method} (${withdrawal.accountDetails.bank})`
                        : withdrawal.method}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                      -{formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full ${
                          withdrawal.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : withdrawal.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {withdrawal.status.charAt(0).toUpperCase() +
                          withdrawal.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

            <form
              onSubmit={handleWithdrawalRequest}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Available Balance:{" "}
                  <span className="font-medium">
                    {formatCurrency(walletBalance)}
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
                    min="100"
                    max={walletBalance}
                    step="1"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="w-full pl-8 p-2 border rounded-md"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum withdrawal: ₦100
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
                      checked={withdrawalMethod === "bank"}
                      onChange={() => setWithdrawalMethod("bank")}
                      className="mr-2"
                    />
                    <span className="text-sm">Bank Transfer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="withdrawalMethod"
                      value="mobile"
                      checked={withdrawalMethod === "mobile"}
                      onChange={() => setWithdrawalMethod("mobile")}
                      className="mr-2"
                    />
                    <span className="text-sm">Mobile Money</span>
                  </label>
                </div>
              </div>

              <div className="overflow-y-auto pr-2 flex-1">
                {withdrawalMethod === "bank" && (
                  <>
                    {/* Bank Account Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Bank Account
                      </label>

                      {bankAccounts.length > 0 ? (
                        <div className="space-y-2">
                          {bankAccounts.map((account) => (
                            <div key={account.id} className="relative">
                              <input
                                type="radio"
                                id={`account-${account.id}`}
                                name="bankAccount"
                                value={account.id}
                                checked={selectedBankAccount === account.id}
                                onChange={() => {
                                  setSelectedBankAccount(account.id);
                                  setWithdrawalBank(account.bank_name);
                                  setWithdrawalBankCode(account.bank_code);
                                  setWithdrawalAccount(account.account_number);
                                  setWithdrawalAccountName(
                                    account.account_name
                                  );
                                }}
                                className="sr-only" // Hide the actual radio input
                              />
                              <label
                                htmlFor={`account-${account.id}`}
                                className={`block p-3 rounded-md border cursor-pointer ${
                                  selectedBankAccount === account.id
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">
                                      {account.bank_name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {account.account_number}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {account.account_name}
                                    </p>
                                  </div>
                                  {selectedBankAccount === account.id && (
                                    <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center">
                                      <svg
                                        className="h-3 w-3 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 rounded-md">
                          <p className="text-yellow-700 text-sm">
                            No bank accounts found. Please add bank accounts in
                            your settings before making a withdrawal.
                          </p>
                          <Link
                            to="/vendor/settings"
                            className="mt-2 inline-block text-sm text-green-600 hover:underline"
                          >
                            Go to Settings
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {withdrawalMethod === "mobile" && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm text-gray-600">
                      Mobile money withdrawals will be sent to your registered
                      phone number.
                    </p>
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <p className="text-sm font-medium">
                        Phone Number:{" "}
                        <span className="font-bold">
                          {user.phone || "Not available"}
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Request Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorWallet;
