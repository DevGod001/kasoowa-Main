import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle,
  RefreshCw,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const OrderManagementSection = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      processing: {
        color: "bg-blue-100 text-blue-800",
        icon: RefreshCw,
      },
      completed: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Filter, search and sort orders
  const applyFilters = useCallback(
    (ordersData, status, search, sort, order) => {
      let filtered = [...ordersData];

      // Apply status filter
      if (status !== "all") {
        filtered = filtered.filter((order) => order.status === status);
      }

      // Apply search
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (order) =>
            order.userIdentifier.toLowerCase().includes(searchLower) ||
            order.id.toString().includes(searchLower) ||
            order.items.some((item) =>
              item.title.toLowerCase().includes(searchLower)
            )
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let compareResult = 0;
        switch (sort) {
          case "date":
            compareResult = new Date(b.date) - new Date(a.date);
            break;
          case "total":
            compareResult = b.total - a.total;
            break;
          case "profit":
            compareResult = b.totalProfit - a.totalProfit;
            break;
          default:
            compareResult = 0;
        }
        return order === "desc" ? compareResult : -compareResult;
      });

      setFilteredOrders(filtered);
    },
    []
  );

  // Load and process orders
  useEffect(() => {
    const loadOrders = () => {
      setIsLoading(true);
      try {
        const ordersData = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );

        // Process and enrich order data
        const processedOrders = ordersData.map((order) => ({
          ...order,
          depositStatus:
            order.depositPaid >= order.total * 0.1 ? "Paid" : "Pending",
          balanceAmount: order.total - order.depositPaid,
          depositAmount: order.depositPaid,
          depositPercentage: ((order.depositPaid / order.total) * 100).toFixed(
            1
          ),
        }));

        setOrders(processedOrders);
        applyFilters(
          processedOrders,
          filterStatus,
          searchTerm,
          sortBy,
          sortOrder
        );
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();

    const handleStorageChange = (e) => {
      if (e.key === "kasoowaOrders") {
        loadOrders();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [filterStatus, searchTerm, sortBy, sortOrder, applyFilters]);

  // Apply filters when filter criteria change
  useEffect(() => {
    applyFilters(orders, filterStatus, searchTerm, sortBy, sortOrder);
  }, [orders, filterStatus, searchTerm, sortBy, sortOrder, applyFilters]);

  // Export orders to CSV
  const exportToCSV = () => {
    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Status",
      "Total Amount",
      "Deposit Paid",
      "Deposit %",
      "Balance Due",
    ];
    const csvData = filteredOrders.map((order) => [
      order.id,
      new Date(order.date).toLocaleDateString(),
      order.userIdentifier,
      order.status,
      order.total,
      order.depositPaid,
      order.depositPercentage + "%",
      order.balanceAmount,
    ]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // Toggle order details
  const toggleOrderDetails = (orderId) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Management</h2>

        {/* Filters and Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-md px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-md px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="total">Sort by Total Amount</option>
            <option value="deposit">Sort by Deposit Paid</option>
          </select>

          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="p-2 border rounded-md hover:bg-gray-50"
          >
            {sortOrder === "asc" ? <ChevronUp /> : <ChevronDown />}
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.date).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{order.userIdentifier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">
                      ₦{order.total.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Deposit Status</p>
                    <p
                      className={`font-medium ${
                        order.depositStatus === "Paid"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {order.depositStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Balance Due</p>
                    <p className="font-medium">
                      ₦{order.balanceAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Toggle Details Button */}
                <button
                  onClick={() => toggleOrderDetails(order.id)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  {expandedOrders.has(order.id) ? (
                    <>
                      Hide Details <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show Details <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Expanded Details */}
                {expandedOrders.has(order.id) && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-gray-50 p-2 rounded"
                        >
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {order.pickupScheduled && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Pickup Details</h4>
                        <p className="text-sm">
                          Scheduled for:{" "}
                          {new Date(order.pickupTime).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Profit Information (Admin Only) */}
                    <div className="mt-4 bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">
                        Payment Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-green-600">
                            Total Sale Amount
                          </p>
                          <p className="font-medium">
                            ₦{order.total.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600">Deposit Paid</p>
                          <p className="font-medium">
                            ₦{order.depositPaid.toLocaleString()} (
                            {order.depositPercentage}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600">Balance Due</p>
                          <p className="font-medium">
                            ₦{order.balanceAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagementSection;
