import React, { useState, useEffect, useCallback } from "react";
import AdminWallet from "./AdminWallet";
import TimeSlotManager from "../../utils/TimeSlotManager";

import {
  Clock,
  CheckCircle,
  RefreshCw,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Truck,
  Package,
  X,
  Clipboard,
  MapPin,
  AlertTriangle,
  DollarSign,
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
  const [processingOrder, setProcessingOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryProof, setDeliveryProof] = useState(null);
  const [commissionRate, setCommissionRate] = useState(2.5);
  const [showWallet, setShowWallet] = useState(true);

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
      processed: {
        color: "bg-indigo-100 text-indigo-800",
        icon: Package,
      },
      shipped: {
        color: "bg-purple-100 text-purple-800",
        icon: Truck,
      },
      delivered: {
        color: "bg-teal-100 text-teal-800",
        icon: MapPin,
      },
      completed: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      disputed: {
        color: "bg-red-100 text-red-800",
        icon: AlertTriangle,
      },
      "pickup-ready": {
        color: "bg-blue-100 text-blue-800",
        icon: Package,
      },
      "pickup-completed": {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      refunded: {
        color: "bg-gray-100 text-gray-800",
        icon: DollarSign,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-4 h-4 mr-1" />
        {status === "pickup-ready"
          ? "Pickup Ready"
          : status === "pickup-completed"
          ? "Pickup Completed"
          : status.charAt(0).toUpperCase() + status.slice(1)}
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
            (order.userIdentifier
              ? order.userIdentifier.toLowerCase().includes(searchLower)
              : false) ||
            (order.id ? order.id.toString().includes(searchLower) : false) ||
            (order.trackingNumber
              ? order.trackingNumber.toLowerCase().includes(searchLower)
              : false) ||
            (order.items
              ? order.items.some((item) =>
                  item.title
                    ? item.title.toLowerCase().includes(searchLower)
                    : false
                )
              : false)
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let compareResult = 0;
        switch (sort) {
          case "date":
            compareResult = new Date(b.date || 0) - new Date(a.date || 0);
            break;
          case "total":
            compareResult = (b.total || 0) - (a.total || 0);
            break;
          case "profit":
            compareResult = (b.totalProfit || 0) - (a.totalProfit || 0);
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

  // Load and process orders
  useEffect(() => {
    const loadOrders = () => {
      setIsLoading(true);
      try {
        const ordersData = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );

        // Process and enrich order data
        const processedOrders = ordersData.map((order) => {
          const total = order.total || 0;
          const depositPaid = order.depositPaid || order.amountPaid || 0;

          // Calculate commission amount
          const adminCommission = (total * commissionRate) / 100;
          const vendorAmount = total - adminCommission;

          return {
            ...order,
            total: total,
            depositPaid: depositPaid,
            depositStatus: depositPaid >= total * 0.1 ? "Paid" : "Pending",
            balanceAmount: total - depositPaid,
            depositPercentage:
              total > 0 ? ((depositPaid / total) * 100).toFixed(1) : "0",
            adminCommission: adminCommission,
            vendorAmount: vendorAmount,
            commissionRate: commissionRate,
          };
        });

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
  }, [
    filterStatus,
    searchTerm,
    sortBy,
    sortOrder,
    applyFilters,
    commissionRate,
  ]);

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
      "Tracking Number",
      "Admin Commission",
      "Vendor Amount",
      "Order Type",
    ];
    const csvData = filteredOrders.map((order) => [
      order.id || "",
      order.date ? new Date(order.date).toLocaleDateString() : "",
      order.userIdentifier || "",
      order.status || "",
      order.total || 0,
      order.depositPaid || 0,
      (order.depositPercentage || 0) + "%",
      order.balanceAmount || 0,
      order.trackingNumber || "",
      order.adminCommission || 0,
      order.vendorAmount || 0,
      order.pickupScheduled ? "Pickup" : "Delivery",
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

  // Handle order status change
  // This function is kept for future direct status updates without using the modal
  // eslint-disable-next-line no-unused-vars
  const updateOrderStatus = (orderId, newStatus) => {
    // Update local storage
    const allOrders = JSON.parse(localStorage.getItem("kasoowaOrders") || "[]");
    const updatedOrders = allOrders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus,
          statusUpdateTime: new Date().toISOString(),
          statusUpdatedBy: "admin",
        };
      }
      return order;
    });

    localStorage.setItem("kasoowaOrders", JSON.stringify(updatedOrders));

    // Update local state
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
              statusUpdateTime: new Date().toISOString(),
              statusUpdatedBy: "admin",
            }
          : order
      )
    );

    // Expand the order to show the status change
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
  };

  // Open processing modal
  const openProcessingModal = (order) => {
    // Check if this is a pickup order and if it's scheduled
    if (order.deliveryMethod !== "delivery" && !order.pickupScheduled) {
      alert(
        "Cannot process pickup order. Waiting for customer to schedule pickup."
      );
      return;
    }

    setProcessingOrder(order);
    setTrackingNumber(order.trackingNumber || "");
    setDeliveryProof(null);
  };

  // Close processing modal
  const closeProcessingModal = () => {
    setProcessingOrder(null);
    setTrackingNumber("");
    setDeliveryProof(null);
  };
  // Handle processing form submission
  const handleProcessOrder = async (e) => {
    e.preventDefault();

    if (!processingOrder) return;
    // Only process pickup orders if pickup is scheduled
    if (
      processingOrder.deliveryMethod !== "delivery" &&
      !processingOrder.pickupScheduled
    ) {
      alert(
        "Cannot process pickup order. Waiting for customer to schedule pickup."
      );
      return;
    }

    try {
      let proofImageUrl =
        processingOrder.deliveryProofUrl || processingOrder.pickupProofUrl;

      // Process proof image if provided
      if (deliveryProof) {
        const reader = new FileReader();
        proofImageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(deliveryProof);
        });
      }

      // Determine the new status based on whether this is a delivery or pickup
      let newStatus;

      if (processingOrder.pickupScheduled) {
        newStatus =
          processingOrder.status === "pending"
            ? "processing"
            : processingOrder.status === "processing"
            ? "pickup-ready"
            : processingOrder.status === "pickup-ready"
            ? "pickup-completed"
            : processingOrder.status === "pickup-completed"
            ? "completed"
            : processingOrder.status;
      } else {
        newStatus =
          processingOrder.status === "pending"
            ? "processing"
            : processingOrder.status === "processing"
            ? "processed"
            : processingOrder.status === "processed"
            ? "shipped"
            : processingOrder.status === "shipped"
            ? "delivered"
            : processingOrder.status;
      }

      // Update local storage
      const allOrders = JSON.parse(
        localStorage.getItem("kasoowaOrders") || "[]"
      );
      const updatedOrders = allOrders.map((order) => {
        if (order.id === processingOrder.id) {
          const updatedOrder = {
            ...order,
            status: newStatus,
            statusUpdateTime: new Date().toISOString(),
            statusUpdatedBy: "admin",
          };

          // Add specific fields based on the new status
          if (newStatus === "shipped") {
            updatedOrder.trackingNumber =
              trackingNumber || order.trackingNumber;
          }

          if (newStatus === "delivered") {
            updatedOrder.deliveryProofUrl = proofImageUrl;
            updatedOrder.deliveredDate = new Date().toISOString();
          }

          if (newStatus === "pickup-ready") {
            updatedOrder.pickupReadyDate = new Date().toISOString();
          }

          // When pickup is completed, update payment information
          if (newStatus === "pickup-completed") {
            updatedOrder.pickupProofUrl = proofImageUrl;
            updatedOrder.pickupCompletedDate = new Date().toISOString();

            // If it's a deposit payment, mark as paid in full
            if (order.paymentType === "deposit") {
              updatedOrder.paymentStatus = "Paid in Full";
              updatedOrder.amountPaid = order.total; // Set amount paid to total
              updatedOrder.depositPaid = order.total; // Update deposit paid to total
              updatedOrder.balanceAmount = 0; // Set balance due to zero

              // Update vendor-specific values if they exist
              if (order.vendorTotal) {
                updatedOrder.vendorDepositPaid = order.vendorTotal;
                updatedOrder.vendorBalanceAmount = 0;
                updatedOrder.vendorDepositPercentage = "100";
              }
            }
          }

          if (
            newStatus === "completed" &&
            (processingOrder.status === "delivered" ||
              processingOrder.status === "pickup-completed")
          ) {
            updatedOrder.completedDate = new Date().toISOString();
            updatedOrder.completedBy = "admin";
            updatedOrder.paymentReleased = true;
            updatedOrder.paymentReleasedDate = new Date().toISOString();
            updatedOrder.adminCommission = (order.total * commissionRate) / 100;
            updatedOrder.vendorAmount =
              order.total - (order.total * commissionRate) / 100;

            // Double check payment status
            if (order.paymentType === "deposit") {
              updatedOrder.paymentStatus = "Paid in Full";
              updatedOrder.amountPaid = order.total;
              updatedOrder.depositPaid = order.total;
              updatedOrder.balanceAmount = 0;

              if (order.vendorTotal) {
                updatedOrder.vendorDepositPaid = order.vendorTotal;
                updatedOrder.vendorBalanceAmount = 0;
                updatedOrder.vendorDepositPercentage = "100";
              }
            }
          }

          return updatedOrder;
        }
        return order;
      });

      localStorage.setItem("kasoowaOrders", JSON.stringify(updatedOrders));

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === processingOrder.id) {
            const updatedOrder = {
              ...order,
              status: newStatus,
              statusUpdateTime: new Date().toISOString(),
              statusUpdatedBy: "admin",
            };

            // Add specific fields based on the new status
            if (newStatus === "shipped") {
              updatedOrder.trackingNumber =
                trackingNumber || order.trackingNumber;
            }

            if (newStatus === "delivered") {
              updatedOrder.deliveryProofUrl = proofImageUrl;
              updatedOrder.deliveredDate = new Date().toISOString();
            }

            if (newStatus === "pickup-ready") {
              updatedOrder.pickupReadyDate = new Date().toISOString();
            }

            // When pickup is completed, update payment information
            if (newStatus === "pickup-completed") {
              updatedOrder.pickupProofUrl = proofImageUrl;
              updatedOrder.pickupCompletedDate = new Date().toISOString();

              // If it's a deposit payment, mark as paid in full
              if (order.paymentType === "deposit") {
                updatedOrder.paymentStatus = "Paid in Full";
                updatedOrder.amountPaid = order.total;
                updatedOrder.depositPaid = order.total;
                updatedOrder.balanceAmount = 0;

                if (order.vendorTotal) {
                  updatedOrder.vendorDepositPaid = order.vendorTotal;
                  updatedOrder.vendorBalanceAmount = 0;
                  updatedOrder.vendorDepositPercentage = "100";
                }
              }
            }

            if (
              newStatus === "completed" &&
              (processingOrder.status === "delivered" ||
                processingOrder.status === "pickup-completed")
            ) {
              updatedOrder.completedDate = new Date().toISOString();
              updatedOrder.completedBy = "admin";
              updatedOrder.paymentReleased = true;
              updatedOrder.paymentReleasedDate = new Date().toISOString();
              updatedOrder.adminCommission =
                (order.total * commissionRate) / 100;
              updatedOrder.vendorAmount =
                order.total - (order.total * commissionRate) / 100;

              // Double check payment status
              if (order.paymentType === "deposit") {
                updatedOrder.paymentStatus = "Paid in Full";
                updatedOrder.amountPaid = order.total;
                updatedOrder.depositPaid = order.total;
                updatedOrder.balanceAmount = 0;

                if (order.vendorTotal) {
                  updatedOrder.vendorDepositPaid = order.vendorTotal;
                  updatedOrder.vendorBalanceAmount = 0;
                  updatedOrder.vendorDepositPercentage = "100";
                }
              }
            }

            return updatedOrder;
          }
          return order;
        })
      );

      // Close the modal
      closeProcessingModal();

      alert(
        `Order #${processingOrder.id} has been updated to ${newStatus.replace(
          "-",
          " "
        )}`
      );
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Failed to process order. Please try again.");
    }
  };
  // Mark order as complete with proof
  const markOrderComplete = async (order) => {
    if (
      window.confirm(
        "Are you sure you want to mark this order as complete? This will release payment to the vendor."
      )
    ) {
      try {
        const timeSlotManager = new TimeSlotManager();
        timeSlotManager.releasePickupSlotForCompletedOrder(order);
        const allOrders = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );
        const updatedOrders = allOrders.map((o) => {
          if (o.id === order.id) {
            return {
              ...o,
              status: "completed",
              completedDate: new Date().toISOString(),
              completedBy: "admin",
              paymentReleased: true,
              paymentReleasedDate: new Date().toISOString(),
              adminCommission: (o.total * commissionRate) / 100,
              vendorAmount: o.total - (o.total * commissionRate) / 100,
            };
          }
          return o;
        });

        localStorage.setItem("kasoowaOrders", JSON.stringify(updatedOrders));

        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: "completed",
                  completedDate: new Date().toISOString(),
                  completedBy: "admin",
                  paymentReleased: true,
                  paymentReleasedDate: new Date().toISOString(),
                  adminCommission: (o.total * commissionRate) / 100,
                  vendorAmount: o.total - (o.total * commissionRate) / 100,
                }
              : o
          )
        );

        alert(
          `Order #${order.id} has been marked as completed. Payment has been released to the vendor.`
        );
      } catch (error) {
        console.error("Error completing order:", error);
        alert("Failed to complete order. Please try again.");
      }
    }
  };

  // Force complete pickup
  const forceCompletePickup = async (order) => {
    if (
      window.confirm(
        "Are you sure you want to force complete this pickup? This will override customer confirmation."
      )
    ) {
      try {
        const timeSlotManager = new TimeSlotManager();
        timeSlotManager.releasePickupSlotForCompletedOrder(order);
        const allOrders = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );
        const updatedOrders = allOrders.map((o) => {
          if (o.id === order.id) {
            return {
              ...o,
              status: "completed",
              completedDate: new Date().toISOString(),
              completedBy: "admin",
              adminConfirmedPickup: true,
              paymentReleased: true,
              paymentReleasedDate: new Date().toISOString(),
              adminCommission: (o.total * commissionRate) / 100,
              vendorAmount: o.total - (o.total * commissionRate) / 100,
            };
          }
          return o;
        });

        localStorage.setItem("kasoowaOrders", JSON.stringify(updatedOrders));

        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: "completed",
                  completedDate: new Date().toISOString(),
                  completedBy: "admin",
                  adminConfirmedPickup: true,
                  paymentReleased: true,
                  paymentReleasedDate: new Date().toISOString(),
                  adminCommission: (o.total * commissionRate) / 100,
                  vendorAmount: o.total - (o.total * commissionRate) / 100,
                }
              : o
          )
        );

        alert(
          `Pickup for order #${order.id} has been forcefully completed and payment has been released to the vendor.`
        );
      } catch (error) {
        console.error("Error completing pickup:", error);
        alert("Failed to complete pickup. Please try again.");
      }
    }
  };

  // Resolve dispute and release payment
  const resolveDispute = async (order, resolution) => {
    if (
      window.confirm(
        `Are you sure you want to ${
          resolution === "vendor"
            ? "approve this order and release payment to the vendor"
            : "refund the customer"
        }?`
      )
    ) {
      try {
        // Update local storage
        const allOrders = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );
        const updatedOrders = allOrders.map((o) => {
          if (o.id === order.id) {
            if (resolution === "vendor") {
              return {
                ...o,
                status: "completed",
                disputeResolution: "approved",
                disputeResolvedDate: new Date().toISOString(),
                disputeResolvedBy: "admin",
                paymentReleased: true,
                paymentReleasedDate: new Date().toISOString(),
                adminCommission: (o.total * commissionRate) / 100,
                vendorAmount: o.total - (o.total * commissionRate) / 100,
              };
            } else {
              return {
                ...o,
                status: "refunded",
                disputeResolution: "refunded",
                disputeResolvedDate: new Date().toISOString(),
                disputeResolvedBy: "admin",
                refundedDate: new Date().toISOString(),
              };
            }
          }
          return o;
        });

        localStorage.setItem("kasoowaOrders", JSON.stringify(updatedOrders));

        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((o) => {
            if (o.id === order.id) {
              if (resolution === "vendor") {
                return {
                  ...o,
                  status: "completed",
                  disputeResolution: "approved",
                  disputeResolvedDate: new Date().toISOString(),
                  disputeResolvedBy: "admin",
                  paymentReleased: true,
                  paymentReleasedDate: new Date().toISOString(),
                  adminCommission: (o.total * commissionRate) / 100,
                  vendorAmount: o.total - (o.total * commissionRate) / 100,
                };
              } else {
                return {
                  ...o,
                  status: "refunded",
                  disputeResolution: "refunded",
                  disputeResolvedDate: new Date().toISOString(),
                  disputeResolvedBy: "admin",
                  refundedDate: new Date().toISOString(),
                };
              }
            }
            return o;
          })
        );

        alert(
          `Dispute for Order #${order.id} has been resolved. ${
            resolution === "vendor"
              ? "Payment has been released to the vendor."
              : "Customer has been refunded."
          }`
        );
      } catch (error) {
        console.error("Error resolving dispute:", error);
        alert("Failed to resolve dispute. Please try again.");
      }
    }
  };

  // Copy tracking number to clipboard
  const copyTrackingNumber = (trackingNumber) => {
    if (!trackingNumber) return;

    navigator.clipboard
      .writeText(trackingNumber)
      .then(() => {
        alert("Tracking number copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy tracking number:", err);
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
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Admin Wallet & Finances</h2>
          <button
            onClick={() => setShowWallet(!showWallet)}
            className="text-green-600 hover:text-green-700 text-sm flex items-center"
          >
            {showWallet ? (
              <>
                Hide Wallet <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Show Wallet <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {showWallet && <AdminWallet />}
      </div>
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
            <option value="processed">Processed</option>
            <option value="shipped">Shipped</option>
            <option value="pickup-ready">Pickup Ready</option>
            <option value="pickup-completed">Pickup Completed</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="disputed">Disputed</option>
            <option value="refunded">Refunded</option>
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

        {/* Commission Rate Setting */}
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-700">Admin Commission Rate:</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={commissionRate}
            onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
            className="w-16 border rounded-md px-2 py-1 text-sm"
          />
          <span className="text-sm text-gray-700">%</span>
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
                      {order.date
                        ? new Date(order.date).toLocaleString()
                        : "N/A"}
                    </p>
                    {order.pickupScheduled && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Pickup Order
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <StatusBadge status={order.status} />
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="ml-2 md:hidden text-gray-500 hover:text-gray-700 p-1"
                      aria-label={
                        expandedOrders.has(order.id)
                          ? "Collapse order details"
                          : "Expand order details"
                      }
                    >
                      {expandedOrders.has(order.id) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Order Summary - always visible on desktop, collapsible on mobile */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 ${
                    expandedOrders.has(order.id) ? "block" : "hidden md:grid"
                  }`}
                >
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">
                      {order.userIdentifier || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">
                      ₦{(order.total || 0).toLocaleString()}
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
                      {order.depositStatus || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Balance Due</p>
                    <p className="font-medium">
                      ₦{(order.balanceAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* Action buttons and tracking number - Always visible on desktop, collapsible on mobile */}
                <div
                  className={`flex flex-wrap justify-between items-center mb-4 ${
                    expandedOrders.has(order.id) ? "block" : "hidden md:flex"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {order.deliveryMethod === "delivery" && (
                      <>
                        {order.status === "pending" && (
                          <button
                            onClick={() => openProcessingModal(order)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Process Order
                          </button>
                        )}

                        {order.status === "processing" && (
                          <button
                            onClick={() => openProcessingModal(order)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Mark Processed
                          </button>
                        )}

                        {order.status === "processed" && (
                          <button
                            onClick={() => openProcessingModal(order)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Mark Shipped
                          </button>
                        )}

                        {order.status === "shipped" && (
                          <button
                            onClick={() => openProcessingModal(order)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200"
                          >
                            <MapPin className="w-4 h-4 mr-1" />
                            Mark Delivered
                          </button>
                        )}

                        {order.status === "delivered" && (
                          <button
                            onClick={() => markOrderComplete(order)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Complete
                          </button>
                        )}
                      </>
                    )}

                    {/* Pickup flow actions */}
                    {order.deliveryMethod !== "delivery" && (
                      <>
                        {order.status === "pending" &&
                          !order.pickupScheduled && (
                            <button
                              disabled
                              className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
                              title="Waiting for customer to schedule pickup"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              Awaiting Pickup Schedule
                            </button>
                          )}

                        {order.status === "pending" &&
                          order.pickupScheduled && (
                            <button
                              onClick={() => openProcessingModal(order)}
                              className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Process Order
                            </button>
                          )}

                        {order.status === "processing" && (
                          <button
                            onClick={() => openProcessingModal(order)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Mark Pickup Ready
                          </button>
                        )}

                        {order.status === "pickup-ready" && (
                          <button
                            onClick={() => openProcessingModal(order)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Pickup Completed
                          </button>
                        )}

                        {order.status === "pickup-completed" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => markOrderComplete(order)}
                              className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Complete
                            </button>
                            <button
                              onClick={() => forceCompletePickup(order)}
                              className="inline-flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Force Complete
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {order.status === "disputed" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => resolveDispute(order, "vendor")}
                          className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve & Pay Vendor
                        </button>
                        <button
                          onClick={() => resolveDispute(order, "customer")}
                          className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Refund Customer
                        </button>
                      </div>
                    )}
                  </div>

                  {order.trackingNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Tracking #:</span>
                      <span className="font-medium">
                        {order.trackingNumber}
                      </span>
                      <button
                        onClick={() => copyTrackingNumber(order.trackingNumber)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Copy tracking number"
                      >
                        <Clipboard className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Toggle Details Button - Only visible on desktop */}
                <button
                  onClick={() => toggleOrderDetails(order.id)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium hidden md:flex items-center gap-1"
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
                Expanded Details
                {expandedOrders.has(order.id) && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {order.items &&
                        order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center bg-gray-50 p-2 rounded"
                          >
                            <div>
                              <p className="font-medium">
                                {item.title || "Product"}
                              </p>
                              <p className="text-sm text-gray-500">
                                Quantity: {item.quantity || 0}
                              </p>
                            </div>
                            <p className="font-medium">
                              ₦
                              {(
                                (item.price || 0) * (item.quantity || 0)
                              ).toLocaleString()}
                            </p>
                          </div>
                        ))}
                    </div>
                    {/* Display deposit information
                    {order.paymentType === "deposit" && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                          <div>
                            <p className="text-sm text-gray-600">
                              Deposit Paid
                            </p>
                            <p className="font-medium">
                              ₦{(order.depositPaid || 0).toLocaleString()} (
                              {order.depositPercentage || 0}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Balance Due</p>
                            <p className="font-medium">
                              ₦{(order.balanceAmount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Payment Status
                            </p>
                            <p
                              className={`font-medium ${
                                order.status === "completed" ||
                                order.pickupScheduled
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {order.status === "completed" ||
                              order.pickupScheduled
                                ? "Paid in Full"
                                : "Deposit Paid"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}{" "} */}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order Processing Modal */}
      {processingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {processingOrder.pickupScheduled
                  ? processingOrder.status === "pending"
                    ? "Process Order"
                    : processingOrder.status === "processing"
                    ? "Mark as Pickup Ready"
                    : processingOrder.status === "pickup-ready"
                    ? "Mark as Pickup Completed"
                    : processingOrder.status === "pickup-completed"
                    ? "Complete Order"
                    : "Update Order"
                  : processingOrder.status === "pending"
                  ? "Process Order"
                  : processingOrder.status === "processing"
                  ? "Mark as Processed"
                  : processingOrder.status === "processed"
                  ? "Mark as Shipped"
                  : processingOrder.status === "shipped"
                  ? "Mark as Delivered"
                  : "Update Order"}
              </h2>
              <button
                onClick={closeProcessingModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleProcessOrder}>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Order #{processingOrder.id} for{" "}
                  {processingOrder.userIdentifier}
                </p>
                <StatusBadge status={processingOrder.status} />
              </div>

              {/* Modal content */}
              {(processingOrder.status === "processed" ||
                processingOrder.status === "shipped") &&
                !processingOrder.pickupScheduled && (
                  <div className="mb-4">
                    <label
                      htmlFor="trackingNumber"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tracking Number{" "}
                      {processingOrder.status === "shipped"
                        ? "(Required)"
                        : "(Optional)"}
                    </label>
                    <input
                      type="text"
                      id="trackingNumber"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter tracking number"
                      required={processingOrder.status === "shipped"}
                    />
                  </div>
                )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProcessingModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  {processingOrder.pickupScheduled
                    ? processingOrder.status === "pending"
                      ? "Process Order"
                      : processingOrder.status === "processing"
                      ? "Mark Ready for Pickup"
                      : processingOrder.status === "pickup-ready"
                      ? "Confirm Pickup"
                      : processingOrder.status === "pickup-completed"
                      ? "Complete Order"
                      : "Update Status"
                    : processingOrder.status === "pending"
                    ? "Process Order"
                    : processingOrder.status === "processing"
                    ? "Mark as Processed"
                    : processingOrder.status === "processed"
                    ? "Mark as Shipped"
                    : processingOrder.status === "shipped"
                    ? "Mark as Delivered"
                    : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementSection;
