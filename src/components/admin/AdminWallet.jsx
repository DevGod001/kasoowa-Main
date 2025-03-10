import React, { useState, useEffect } from "react";
import {
  DollarSign,
  CreditCard,
  BarChart2,
  TrendingUp,
  Lock,
  Search,
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";

const AdminWallet = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [completedPayouts, setCompletedPayouts] = useState(0);
  const [salesByStatus, setSalesByStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorResults, setVendorResults] = useState(null);
  const [allVendors, setAllVendors] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [withdrawalHistoryFilter, setWithdrawalHistoryFilter] = useState("all");
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [withdrawalAction, setWithdrawalAction] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    // Load all vendors for search functionality
    try {
      const vendors = JSON.parse(localStorage.getItem("vendors") || "[]");
      setAllVendors(vendors);
    } catch (error) {
      console.error("Error loading vendors:", error);
    }
  }, []);

  // Load all withdrawal requests (pending and completed)
  useEffect(() => {
    const loadAllWithdrawals = () => {
      try {
        const vendors = JSON.parse(localStorage.getItem("vendors") || "[]");
        let completedWithdrawals = [];
        let pendingRequests = [];

        // Loop through each vendor and get their withdrawal requests
        vendors.forEach((vendor) => {
          const vendorWithdrawals = JSON.parse(
            localStorage.getItem(`withdrawals_${vendor.id}`) || "[]"
          );

          // Add vendor info to all withdrawals
          const enhancedWithdrawals = vendorWithdrawals.map((w) => ({
            ...w,
            vendorName: vendor.name,
            vendorEmail: vendor.email,
            vendorId: vendor.id,
          }));

          // Split into pending and completed/rejected
          const pending = enhancedWithdrawals.filter(
            (w) => w.status === "pending"
          );
          const completed = enhancedWithdrawals.filter(
            (w) => w.status !== "pending"
          );

          pendingRequests = [...pendingRequests, ...pending];
          completedWithdrawals = [...completedWithdrawals, ...completed];
        });

        // Sort by request date (newest first)
        pendingRequests.sort(
          (a, b) => new Date(b.requestDate) - new Date(a.requestDate)
        );
        completedWithdrawals.sort(
          (a, b) => new Date(b.requestDate) - new Date(a.requestDate)
        );

        setPendingWithdrawals(pendingRequests);
        setAllWithdrawals([...pendingRequests, ...completedWithdrawals]);
      } catch (error) {
        console.error("Error loading withdrawal requests:", error);
      }
    };

    loadAllWithdrawals();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith("withdrawals_")) {
        loadAllWithdrawals();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    // Calculate admin wallet data
    const calculateAdminFinances = () => {
      setIsLoading(true);
      try {
        const allOrders = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );

        let totalSalesAmount = 0;
        let totalCommissionAmount = 0;
        let pendingPayoutsAmount = 0;
        let completedPayoutsAmount = 0;
        const statusTotals = {};

        allOrders.forEach((order) => {
          const orderTotal = order.total || 0;
          const commissionRate = order.commissionRate || 2.5; // default 2.5%
          const adminCommission = (orderTotal * commissionRate) / 100;

          // Add to total sales
          totalSalesAmount += orderTotal;

          // Add to total commission
          totalCommissionAmount += adminCommission;

          // Track sales by status
          const status = order.status || "pending";
          statusTotals[status] = (statusTotals[status] || 0) + orderTotal;

          // Track pending and completed payouts
          if (order.status === "completed" || order.paymentReleased) {
            completedPayoutsAmount += orderTotal - adminCommission; // Vendor amount
          } else if (
            order.status !== "refunded" &&
            order.status !== "disputed"
          ) {
            pendingPayoutsAmount += orderTotal - adminCommission; // Pending vendor amount
          }
        });

        setTotalSales(totalSalesAmount);
        setTotalCommission(totalCommissionAmount);
        setPendingPayouts(pendingPayoutsAmount);
        setCompletedPayouts(completedPayoutsAmount);
        setSalesByStatus(statusTotals);
      } catch (error) {
        console.error("Error calculating admin finances:", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateAdminFinances();

    // Listen for order updates
    const handleStorageChange = (e) => {
      if (e.key === "kasoowaOrders") {
        calculateAdminFinances();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handle vendor search
  const searchVendor = () => {
    if (!vendorSearch) {
      setVendorResults(null);
      return;
    }

    setIsLoading(true);
    try {
      // Find vendor by email, name, or ID
      const searchLower = vendorSearch.toLowerCase();
      const vendor = allVendors.find(
        (v) =>
          (v.email && v.email.toLowerCase().includes(searchLower)) ||
          (v.name && v.name.toLowerCase().includes(searchLower)) ||
          (v.id && v.id.toString() === vendorSearch)
      );

      if (!vendor) {
        setVendorResults({ vendor: null, notFound: true });
        setIsLoading(false);
        return;
      }

      // Get all orders
      const allOrders = JSON.parse(
        localStorage.getItem("kasoowaOrders") || "[]"
      );

      // Filter orders to only include those with items from this vendor
      const vendorOrders = allOrders.filter((order) => {
        return (
          order.items &&
          order.items.some(
            (item) =>
              item.vendorId && item.vendorId.toString() === vendor.id.toString()
          )
        );
      });

      // Calculate vendor statistics
      let totalSales = 0;
      let totalCommission = 0;
      let pendingAmount = 0;
      let completedAmount = 0;

      vendorOrders.forEach((order) => {
        // Calculate vendor's subtotal from their items
        const vendorItems = order.items.filter(
          (item) =>
            item.vendorId && item.vendorId.toString() === vendor.id.toString()
        );

        const subtotal = order.subtotal || order.total;

        // Calculate vendor's portion of the subtotal
        const vendorSubtotal = vendorItems.reduce((sum, item) => {
          return (
            sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
          );
        }, 0);

        // Calculate proportional share of delivery fee
        const vendorProportion = subtotal > 0 ? vendorSubtotal / subtotal : 0;
        const deliveryFeePortion =
          order.deliveryFee && order.deliveryMethod === "delivery"
            ? order.deliveryFee * vendorProportion
            : 0;

        const vendorTotal = vendorSubtotal + deliveryFeePortion;
        const commissionRate = 2.5; // Admin commission rate
        const adminCommission = (vendorTotal * commissionRate) / 100;
        const vendorAmount = vendorTotal - adminCommission;

        // Add to totals
        totalSales += vendorTotal;
        totalCommission += adminCommission;

        // Track pending vs completed
        if (order.status === "completed" || order.paymentReleased) {
          completedAmount += vendorAmount;
        } else if (order.status !== "refunded" && order.status !== "disputed") {
          pendingAmount += vendorAmount;
        }
      });

      // Get withdrawal history for this vendor
      const withdrawalHistory = JSON.parse(
        localStorage.getItem(`withdrawals_${vendor.id}`) || "[]"
      );

      setVendorResults({
        vendor,
        totalSales,
        totalCommission,
        pendingAmount,
        completedAmount,
        orderCount: vendorOrders.length,
        withdrawals: withdrawalHistory,
        notFound: false,
      });
    } catch (error) {
      console.error("Error searching vendor:", error);
      setVendorResults({ error: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Export withdrawals to CSV
  const exportWithdrawalsToCSV = () => {
    const headers = [
      "Reference ID",
      "Vendor Name",
      "Vendor Email",
      "Date Requested",
      "Date Processed",
      "Method",
      "Amount",
      "Status",
      "Processed By",
    ];

    // Filter withdrawals based on selection
    const filtered = allWithdrawals.filter((w) => {
      if (withdrawalHistoryFilter === "all") return true;
      return w.status === withdrawalHistoryFilter;
    });

    const csvData = filtered.map((w) => [
      w.id || "",
      w.vendorName || "",
      w.vendorEmail || "",
      w.requestDate ? new Date(w.requestDate).toLocaleDateString() : "",
      w.processedDate ? new Date(w.processedDate).toLocaleDateString() : "",
      w.method || "",
      w.amount || 0,
      w.status || "",
      w.processedBy || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `withdrawals_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // Open withdrawal approval/rejection modal
  const openWithdrawalModal = (withdrawal, action) => {
    setSelectedWithdrawal(withdrawal);
    setWithdrawalAction(action);
    setRejectionReason("");
    setIsWithdrawalModalOpen(true);
  };

  // Close withdrawal modal
  const closeWithdrawalModal = () => {
    setIsWithdrawalModalOpen(false);
    setSelectedWithdrawal(null);
    setWithdrawalAction("");
    setRejectionReason("");
  };

  // Handle withdrawal approval or rejection
  const handleWithdrawalAction = () => {
    if (!selectedWithdrawal) return;

    try {
      // Get vendor's withdrawals
      const vendorWithdrawals = JSON.parse(
        localStorage.getItem(`withdrawals_${selectedWithdrawal.vendorId}`) ||
          "[]"
      );

      // Find the specific withdrawal and update its status
      const updatedWithdrawals = vendorWithdrawals.map((w) => {
        if (w.id === selectedWithdrawal.id) {
          return {
            ...w,
            status: withdrawalAction === "approve" ? "completed" : "rejected",
            processedDate: new Date().toISOString(),
            processedBy: "admin",
            rejectionReason:
              withdrawalAction === "reject" ? rejectionReason : undefined,
          };
        }
        return w;
      });

      // Save updated withdrawals back to localStorage
      localStorage.setItem(
        `withdrawals_${selectedWithdrawal.vendorId}`,
        JSON.stringify(updatedWithdrawals)
      );

      // Update the pending withdrawals list
      setPendingWithdrawals((prevWithdrawals) =>
        prevWithdrawals.filter((w) => w.id !== selectedWithdrawal.id)
      );

      // Close the modal
      closeWithdrawalModal();

      // Trigger storage event for any listening components
      window.dispatchEvent(new Event("storage"));

      alert(
        `Withdrawal request ${
          withdrawalAction === "approve" ? "approved" : "rejected"
        } successfully.`
      );
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("An error occurred while processing the withdrawal request.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Wallet className="h-5 w-5 text-green-600 mr-2" />
        Admin Wallet
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-xl font-bold">
                ₦{totalSales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Admin Commission</p>
              <p className="text-xl font-bold">
                ₦{totalCommission.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <BarChart2 className="h-8 w-8 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Pending Payouts</p>
              <p className="text-xl font-bold">
                ₦{pendingPayouts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Completed Payouts</p>
              <p className="text-xl font-bold">
                ₦{completedPayouts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Security Note */}
      <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4 flex items-start">
        <Lock className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          <span className="font-medium">Security Notice:</span> Withdrawals are
          disabled for admin wallet. For security purposes, admin commissions
          are automatically transferred according to company policy.
        </p>
      </div>

      {/* Vendor Search */}
      <div className="mb-6 mt-6 border-t pt-4">
        <h4 className="text-md font-medium mb-3">Vendor Sales Lookup</h4>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by vendor email, name or ID"
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={searchVendor}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Search
          </button>
        </div>

        {vendorResults && (
          <div className="border rounded-lg p-4 bg-gray-50">
            {vendorResults.notFound ? (
              <p className="text-red-500">
                No vendor found with those details.
              </p>
            ) : vendorResults.error ? (
              <p className="text-red-500">
                An error occurred while searching. Please try again.
              </p>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="font-medium text-lg">
                      {vendorResults.vendor.name}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {vendorResults.vendor.email}
                    </p>
                    {vendorResults.vendor.storeSlug && (
                      <p className="text-sm text-gray-600">
                        Store: {vendorResults.vendor.storeSlug}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ID: {vendorResults.vendor.id}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-lg font-bold">
                      ₦{vendorResults.totalSales.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Admin Commission</p>
                    <p className="text-lg font-bold">
                      ₦{vendorResults.totalCommission.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Order Count</p>
                    <p className="text-lg font-bold">
                      {vendorResults.orderCount}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Pending Amount</p>
                    <p className="text-lg font-bold">
                      ₦{vendorResults.pendingAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Withdrawal History */}
                {vendorResults.withdrawals &&
                  vendorResults.withdrawals.length > 0 && (
                    <div>
                      <h6 className="font-medium mb-2">Withdrawal History</h6>
                      <div className="overflow-x-auto border rounded">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                ID
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                Date
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                Method
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                Amount
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {vendorResults.withdrawals.map((withdrawal) => (
                              <tr key={withdrawal.id}>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {withdrawal.id}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  {new Date(
                                    withdrawal.date
                                  ).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500 capitalize">
                                  {withdrawal.method}
                                </td>
                                <td className="px-3 py-2 text-sm text-right font-medium">
                                  ₦{withdrawal.amount.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-xs text-center">
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
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending Withdrawal Requests */}
      <div className="mb-6 border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-medium">Pending Withdrawal Requests</h4>
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            {pendingWithdrawals.length} Pending
          </span>
        </div>

        {pendingWithdrawals.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No pending withdrawal requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Requested
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">
                        {withdrawal.vendorName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {withdrawal.vendorEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {withdrawal.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(withdrawal.requestDate).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                      {withdrawal.method}
                      {withdrawal.method === "bank" &&
                        withdrawal.accountDetails?.bank && (
                          <span className="text-xs block text-gray-400">
                            {withdrawal.accountDetails.bank}
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      ₦{withdrawal.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() =>
                            openWithdrawalModal(withdrawal, "approve")
                          }
                          className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Approve withdrawal"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            openWithdrawalModal(withdrawal, "reject")
                          }
                          className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Reject withdrawal"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      <div className="mb-6 border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-medium">Withdrawal History</h4>
          <div className="flex items-center gap-2">
            <select
              value={withdrawalHistoryFilter}
              onChange={(e) => setWithdrawalHistoryFilter(e.target.value)}
              className="border rounded-md text-sm px-2 py-1"
            >
              <option value="all">All Withdrawals</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={exportWithdrawalsToCSV}
              className="bg-green-600 text-white text-xs px-2 py-1 rounded-md flex items-center"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </button>
          </div>
        </div>

        {allWithdrawals.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No withdrawal history</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Requested
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allWithdrawals
                  .filter((w) => {
                    if (withdrawalHistoryFilter === "all") return true;
                    return w.status === withdrawalHistoryFilter;
                  })
                  .slice(0, 20) // Show latest 20 for performance
                  .map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm">
                        <div className="font-medium text-gray-900">
                          {withdrawal.vendorName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {withdrawal.vendorEmail}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {withdrawal.id}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {new Date(withdrawal.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 capitalize">
                        {withdrawal.method}
                      </td>
                      <td className="px-3 py-2 text-sm text-right font-medium">
                        ₦{withdrawal.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-center">
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
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {withdrawal.processedDate
                          ? new Date(
                              withdrawal.processedDate
                            ).toLocaleDateString()
                          : withdrawal.status === "pending"
                          ? "Awaiting"
                          : "N/A"}
                        {withdrawal.processedBy && (
                          <div className="text-xs text-gray-400">
                            by {withdrawal.processedBy}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                {allWithdrawals.filter((w) => {
                  if (withdrawalHistoryFilter === "all") return true;
                  return w.status === withdrawalHistoryFilter;
                }).length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-3 py-4 text-sm text-center text-gray-500"
                    >
                      No{" "}
                      {withdrawalHistoryFilter === "all"
                        ? ""
                        : withdrawalHistoryFilter}{" "}
                      withdrawals found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Status Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Sales by Status
        </h4>
        <div className="space-y-2">
          {Object.entries(salesByStatus).map(([status, amount]) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-sm capitalize">
                {status.replace("-", " ")}
              </span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                  <div
                    className={`h-full ${
                      status === "completed"
                        ? "bg-green-500"
                        : status === "delivered" ||
                          status === "pickup-completed"
                        ? "bg-teal-500"
                        : status === "shipped" || status === "pickup-ready"
                        ? "bg-purple-500"
                        : status === "processed"
                        ? "bg-indigo-500"
                        : status === "processing"
                        ? "bg-blue-500"
                        : status === "disputed"
                        ? "bg-red-500"
                        : status === "refunded"
                        ? "bg-gray-500"
                        : "bg-yellow-500"
                    }`}
                    style={{ width: `${(amount / totalSales) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  ₦{amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Commission Calculation Info */}
      <div className="bg-gray-50 p-3 rounded-md mt-4 flex items-start">
        <AlertTriangle className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-medium mb-1">Commission Calculation:</p>
          <p>
            Admin earns 2.5% commission on all sales processed through the
            platform. This calculation ensures vendors receive the correct
            payout amount after commission is deducted.
          </p>
        </div>
      </div>

      {/* Withdrawal Approval/Rejection Modal */}
      {isWithdrawalModalOpen && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {withdrawalAction === "approve"
                  ? "Approve Withdrawal Request"
                  : "Reject Withdrawal Request"}
              </h2>
              <button
                onClick={closeWithdrawalModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Request from:{" "}
                <span className="font-medium">
                  {selectedWithdrawal.vendorName}
                </span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Amount:{" "}
                <span className="font-medium">
                  ₦{selectedWithdrawal.amount.toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Date Requested:{" "}
                <span className="font-medium">
                  {new Date(selectedWithdrawal.requestDate).toLocaleString()}
                </span>
              </p>

              {selectedWithdrawal.method === "bank" && (
                <div className="mt-2 bg-gray-50 p-3 rounded-md">
                  <h3 className="text-sm font-medium mb-1">Bank Details:</h3>
                  <p className="text-sm">
                    Bank: {selectedWithdrawal.accountDetails?.bank || "N/A"}
                  </p>
                  <p className="text-sm">
                    Account:{" "}
                    {selectedWithdrawal.accountDetails?.accountNumber || "N/A"}
                  </p>
                  <p className="text-sm">
                    Name:{" "}
                    {selectedWithdrawal.accountDetails?.accountName || "N/A"}
                  </p>
                </div>
              )}
            </div>

            {withdrawalAction === "reject" && (
              <div className="mb-4">
                <label
                  htmlFor="rejectionReason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Reason for Rejection
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Please provide a reason for rejecting this withdrawal request"
                  required
                ></textarea>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  {withdrawalAction === "approve"
                    ? "By approving this withdrawal, you confirm that payment has been sent to the vendor's account."
                    : "The vendor will be notified that their withdrawal request has been rejected along with the reason."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeWithdrawalModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdrawalAction}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  withdrawalAction === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={
                  withdrawalAction === "reject" && !rejectionReason.trim()
                }
              >
                {withdrawalAction === "approve"
                  ? "Approve & Send Payment"
                  : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWallet;
