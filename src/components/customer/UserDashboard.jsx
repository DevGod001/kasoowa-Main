// src/components/customer/UserDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useOrders } from "../../contexts/OrderContext";
import TimeSlotManager from "../../utils/TimeSlotManager";
import { ChatProvider } from "../../contexts/ChatContext";
import ChatComponent from "../shared/ChatComponent";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  RefreshCw,
  Truck,
  Home,
  Calendar,
  X,
  LogOut,
  Package,
  ThumbsUp,
  Clipboard,
  MapPin,
  AlertTriangle,
  ThumbsDown,
  Image,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const UserDashboard = ({ userIdentifier, identifierType }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [notification, setNotification] = useState(null);
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const { getOrdersByUser } = useOrders();

  // Toggle order details function
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

  // Handle navigation state messages
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type,
      });
      // Clear the message after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  }, [location]);

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) => order.status === activeTab);

  const handleLogout = () => {
    // Clear ALL user session/auth data
    localStorage.removeItem("kasoowaUser");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userAuthenticated");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userLoginType");
    localStorage.removeItem("lastLoginTime");

    // Clear any user preferences or state
    localStorage.removeItem("userPreferences");
    localStorage.removeItem("userCart");
    localStorage.removeItem("userWishlist");

    // Additional step: Scan localStorage for any keys containing user identifiers
    // and clear those as well to ensure complete logout
    Object.keys(localStorage).forEach((key) => {
      if (
        key.toLowerCase().includes("user") ||
        key.toLowerCase().includes("auth") ||
        key.toLowerCase().includes("login") ||
        key.toLowerCase().includes("session")
      ) {
        localStorage.removeItem(key);
      }
    });

    // Show notification
    setNotification({
      message: "You have been logged out successfully",
      type: "success",
    });

    // Redirect to home page after a short delay
    setTimeout(() => {
      navigate("/", { replace: true }); // Using replace to prevent back-navigation to authenticated state
    }, 1000);
  };

  const handleSetReminder = (order) => {
    try {
      // First check if notifications are supported
      if (!("Notification" in window)) {
        setNotification({
          message: "Your browser doesn't support notifications",
          type: "error",
        });
        return;
      }

      // Request notification permission
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          const pickupTime = new Date(order.pickupTime);
          const reminderTime = new Date(pickupTime.getTime() - 10 * 60000);
          const timeUntilReminder = reminderTime.getTime() - Date.now();

          if (timeUntilReminder > 0) {
            // Check existing reminders
            const reminders = JSON.parse(
              localStorage.getItem("pickupReminders") || "{}"
            );

            if (reminders[order.id]) {
              setNotification({
                message: "A reminder is already set for this pickup",
                type: "warning",
              });
              return;
            }

            // Set the reminder
            const timeoutId = setTimeout(() => {
              // Show notification
              new Notification("Pickup Reminder", {
                body: `Your order pickup is scheduled in 10 minutes at ${pickupTime.toLocaleTimeString()}`,
                icon: "/favicon.ico",
              });

              // Vibrate if supported
              if ("vibrate" in navigator) {
                navigator.vibrate([200, 100, 200]);
              }

              // Play sound
              const audio = new Audio("/notification-sound.mp3");
              audio.play().catch((e) => console.log("Audio play failed:", e));

              // Remove the reminder from storage after it's triggered
              const currentReminders = JSON.parse(
                localStorage.getItem("pickupReminders") || "{}"
              );
              delete currentReminders[order.id];
              localStorage.setItem(
                "pickupReminders",
                JSON.stringify(currentReminders)
              );

              // Force refresh to update UI
              window.dispatchEvent(new Event("storage"));
            }, timeUntilReminder);

            // Save reminder info with the timeoutId
            reminders[order.id] = {
              time: reminderTime.toISOString(),
              set: true,
              timeoutId, // Store the timeoutId
            };
            localStorage.setItem("pickupReminders", JSON.stringify(reminders));

            // Force immediate UI update
            window.dispatchEvent(new Event("storage"));

            setNotification({
              message:
                "Reminder set! You will be notified 10 minutes before your pickup time.",
              type: "success",
            });
          } else {
            setNotification({
              message: "Pickup time has already passed",
              type: "error",
            });
          }
        } else {
          setNotification({
            message: "Notification permission denied",
            type: "error",
          });
        }
      });
    } catch (error) {
      console.error("Error setting reminder:", error);
      setNotification({
        message: "Failed to set reminder. Please try again.",
        type: "error",
      });
    }
  };

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
  const handleCancelSchedule = async (order) => {
    try {
      // Create instance of TimeSlotManager
      const timeSlotManager = new TimeSlotManager();

      // Release the time slot if it exists
      if (order.pickupTime) {
        const timeSlot = new Date(order.pickupTime);
        timeSlotManager.releaseSlot(timeSlot, order.id);
      }

      // Get current orders
      const orders = JSON.parse(localStorage.getItem("kasoowaOrders") || "[]");

      // Update order to remove schedule
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          const { pickupScheduled, pickupTime, pickupDate, ...rest } = o;
          return rest;
        }
        return o;
      });

      // Save updated orders
      localStorage.setItem("kasoowaOrders", JSON.stringify(updatedOrders));

      // Update local state to reflect changes immediately
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                pickupScheduled: false,
                pickupTime: null,
                pickupDate: null,
              }
            : o
        )
      );

      setNotification({
        message:
          "Pickup schedule cancelled successfully. You can now reschedule.",
        type: "success",
      });

      // Force a refresh of the component
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error cancelling schedule:", error);
      setNotification({
        message: "Failed to cancel schedule. Please try again.",
        type: "error",
      });
    }
  };

  // Handle order receipt confirmation
  const confirmOrderReceipt = (orderId) => {
    if (
      window.confirm(
        "Are you sure you want to confirm that you've received this order? This will complete the order and release payment to the vendor."
      )
    ) {
      try {
        // Update order in localStorage
        const allOrders = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );
        const updatedOrders = allOrders.map((order) => {
          if (order.id === orderId) {
            const updatedOrder = {
              ...order,
              status: "completed",
              completedDate: new Date().toISOString(),
              completedBy: "customer",
              paymentReleased: true,
              paymentReleasedDate: new Date().toISOString(),
            };

            // If this was a deposit payment, update the payment info to show 100%
            if (order.paymentType === "deposit") {
              updatedOrder.paymentStatus = "Paid in Full";
              updatedOrder.amountPaid = order.total;
              updatedOrder.depositPaid = order.total;
              updatedOrder.balanceAmount = 0;
              updatedOrder.depositPercentage = "100"; // Set to 100%

              // Update vendor-specific values if they exist
              if (order.vendorTotal) {
                updatedOrder.vendorDepositPaid = order.vendorTotal;
                updatedOrder.vendorBalanceAmount = 0;
                updatedOrder.vendorDepositPercentage = "100"; // Set to 100%
              }
            }

            return updatedOrder;
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
                  status: "completed",
                  completedDate: new Date().toISOString(),
                  completedBy: "customer",
                  paymentReleased: true,
                  paymentReleasedDate: new Date().toISOString(),
                  // Update payment info for deposit payments
                  ...(order.paymentType === "deposit" && {
                    paymentStatus: "Paid in Full",
                    amountPaid: order.total,
                    depositPaid: order.total,
                    balanceAmount: 0,
                    depositPercentage: "100",
                    ...(order.vendorTotal && {
                      vendorDepositPaid: order.vendorTotal,
                      vendorBalanceAmount: 0,
                      vendorDepositPercentage: "100",
                    }),
                  }),
                }
              : order
          )
        );

        // Show notification
        setNotification({
          message: "Order marked as received! Thank you for your purchase.",
          type: "success",
        });
      } catch (error) {
        console.error("Error confirming order receipt:", error);
        setNotification({
          message: "Failed to confirm order receipt. Please try again.",
          type: "error",
        });
      }
    }
  };

  // Open dispute modal
  const openDisputeModal = (order) => {
    setDisputeOrder(order);
    setDisputeReason("");
  };

  // Close dispute modal
  const closeDisputeModal = () => {
    setDisputeOrder(null);
    setDisputeReason("");
  };

  // Handle dispute submission
  const submitDispute = (e) => {
    e.preventDefault();

    if (!disputeOrder || !disputeReason.trim()) {
      setNotification({
        message: "Please provide a reason for the dispute",
        type: "error",
      });
      return;
    }

    try {
      // Update order in localStorage
      const allOrders = JSON.parse(
        localStorage.getItem("kasoowaOrders") || "[]"
      );
      const updatedOrders = allOrders.map((order) => {
        if (order.id === disputeOrder.id) {
          return {
            ...order,
            status: "disputed",
            disputeDate: new Date().toISOString(),
            disputeReason: disputeReason,
            disputeBy: "customer",
          };
        }
        return order;
      });

      localStorage.setItem("kasoowaOrders", JSON.stringify(updatedOrders));

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === disputeOrder.id
            ? {
                ...order,
                status: "disputed",
                disputeDate: new Date().toISOString(),
                disputeReason: disputeReason,
                disputeBy: "customer",
              }
            : order
        )
      );

      // Close modal
      closeDisputeModal();

      // Show notification
      setNotification({
        message:
          "Dispute submitted successfully. Our team will review it shortly.",
        type: "success",
      });
    } catch (error) {
      console.error("Error submitting dispute:", error);
      setNotification({
        message: "Failed to submit dispute. Please try again.",
        type: "error",
      });
    }
  };

  // Copy tracking number to clipboard
  const copyTrackingNumber = (trackingNumber) => {
    if (!trackingNumber) return;

    navigator.clipboard
      .writeText(trackingNumber)
      .then(() => {
        setNotification({
          message: "Tracking number copied to clipboard!",
          type: "success",
        });
      })
      .catch((err) => {
        console.error("Failed to copy tracking number:", err);
        setNotification({
          message: "Failed to copy tracking number.",
          type: "error",
        });
      });
  };

  // View full-size delivery proof image
  const viewDeliveryProof = (imageUrl) => {
    if (!imageUrl) return;

    // Open image in a new tab
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>Delivery Proof</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #f3f4f6;
            }
            img {
              max-width: 100%;
              max-height: 90vh;
              border: 1px solid #e5e7eb;
              border-radius: 0.375rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="Delivery Proof" />
        </body>
      </html>
    `);
  };

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const userOrders = getOrdersByUser(userIdentifier);
        setOrders(userOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    // Add listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "kasoowaOrders") {
        fetchOrders();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userIdentifier, getOrdersByUser]);

  return (
    <ChatProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Notification Banner */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded-md ${
                notification.type === "success"
                  ? "bg-green-50"
                  : notification.type === "error"
                  ? "bg-red-50"
                  : "bg-yellow-50"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  notification.type === "success"
                    ? "text-green-800"
                    : notification.type === "error"
                    ? "text-red-800"
                    : "text-yellow-800"
                }`}
              >
                {notification.message}
              </p>
            </div>
          )}

          {/* Header with Shop Now button and Logout button */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                Logged in with {identifierType}: {userIdentifier}
              </p>
            </div>
            <div className="flex space-x-3 -mt-1">
              <Link
                to="/"
                className="inline-flex items-center px-3 py-2 border border-transparent rounded text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-green-500"
              >
                <Home className="mr-1.5 h-4 w-4" />
                Shop
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500"
              >
                <LogOut className="mr-1.5 h-4 w-1 mx-auto" />
                Logout
              </button>
            </div>
          </div>

          {/* Order Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-8">
            {[
              {
                label: "Total Orders",
                value: orders.length,
                icon: ShoppingBag,
              },
              {
                label: "Pending",
                value: orders.filter((o) => o.status === "pending").length,
                icon: Clock,
              },
              {
                label: "Processing",
                value: orders.filter((o) =>
                  [
                    "processing",
                    "processed",
                    "shipped",
                    "delivered",
                    "pickup-ready",
                    "pickup-completed",
                  ].includes(o.status)
                ).length,
                icon: RefreshCw,
              },
              {
                label: "Completed",
                value: orders.filter((o) => o.status === "completed").length,
                icon: CheckCircle,
              },
            ].map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {[
                "all",
                "pending",
                "processing",
                "processed",
                "shipped",
                "pickup-ready",
                "pickup-completed",
                "delivered",
                "completed",
                "disputed",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                      ${
                        activeTab === tab
                          ? "border-green-500 text-green-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    `}
                >
                  {tab === "pickup-ready"
                    ? "Pickup Ready"
                    : tab === "pickup-completed"
                    ? "Pickup Completed"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">
                Loading your orders...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No orders found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === "all"
                  ? "You haven't placed any orders yet"
                  : `You don't have any ${activeTab.replace("-", " ")} orders`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white shadow-sm rounded-lg">
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Order #{order.id}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Placed on {new Date(order.date).toLocaleDateString()}
                        </p>
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

                    {/* Content that should be collapsible on mobile */}
                    <div
                      className={
                        expandedOrders.has(order.id) ? "block" : "hidden"
                      }
                    >
                      {/* Tracking Number (if available) */}
                      {order.trackingNumber && (
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded mb-4">
                          <span className="text-sm text-gray-500">
                            Tracking #:
                          </span>
                          <span className="text-sm font-medium">
                            {order.trackingNumber}
                          </span>
                          <button
                            onClick={() =>
                              copyTrackingNumber(order.trackingNumber)
                            }
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Copy tracking number"
                          >
                            <Clipboard className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="mt-4">
                        <div className="flow-root">
                          <ul className="-my-5 divide-y divide-gray-200">
                            {order.items &&
                              order.items.map((item, index) => (
                                <li key={index} className="py-5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {item.title || "Product"}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Qty: {item.quantity || 0}
                                      </p>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                      ₦{(item.price || 0).toLocaleString()}
                                    </p>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-gray-200 pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">
                              ₦{(order.total || 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Show different details based on delivery method */}
                          {order.deliveryMethod === "delivery" ? (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                  Delivery Fee
                                </span>
                                <span className="font-medium text-green-600">
                                  ₦{(order.deliveryFee || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                  Payment Status
                                </span>
                                <span className="font-medium text-green-600">
                                  Paid in Full
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                  Deposit Paid{" "}
                                  {order.paymentType === "deposit"
                                    ? `(${
                                        order.status === "completed" ||
                                        order.status === "pickup-completed"
                                          ? "100"
                                          : order.depositPercentage || "10"
                                      }%)`
                                    : ""}
                                </span>
                                <span className="font-medium text-green-600">
                                  ₦
                                  {(
                                    order.depositPaid ||
                                    order.amountPaid ||
                                    0
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                  Balance Due
                                </span>
                                <span className="font-medium text-gray-900">
                                  ₦
                                  {(
                                    (order.total || 0) -
                                    (order.depositPaid || order.amountPaid || 0)
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}

                          <div className="flex justify-between pt-4 border-t border-gray-200">
                            <span className="text-base font-medium text-gray-900">
                              Total Amount
                            </span>
                            <span className="text-base font-medium text-gray-900">
                              ₦{(order.total || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons based on status */}
                        <div className="mt-6">
                          {/* Delivery or Pickup Proof (if available) */}
                          {((order.deliveryProofUrl &&
                            order.status === "delivered") ||
                            (order.pickupProofUrl &&
                              order.status === "pickup-completed")) && (
                            <div className="mb-6 bg-white p-4 border rounded-md">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                {order.pickupScheduled
                                  ? "Pickup Proof"
                                  : "Delivery Proof"}
                              </h4>
                              <div className="relative mb-2">
                                <img
                                  src={
                                    order.pickupScheduled
                                      ? order.pickupProofUrl
                                      : order.deliveryProofUrl
                                  }
                                  alt={
                                    order.pickupScheduled
                                      ? "Pickup proof"
                                      : "Delivery proof"
                                  }
                                  className="w-full max-h-48 object-contain rounded-md cursor-pointer"
                                  onClick={() =>
                                    viewDeliveryProof(
                                      order.pickupScheduled
                                        ? order.pickupProofUrl
                                        : order.deliveryProofUrl
                                    )
                                  }
                                />
                                <button
                                  onClick={() =>
                                    viewDeliveryProof(
                                      order.pickupScheduled
                                        ? order.pickupProofUrl
                                        : order.deliveryProofUrl
                                    )
                                  }
                                  className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-md"
                                  title="View full image"
                                >
                                  <Image className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500">
                                Click on the image to view full size
                              </p>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap justify-end gap-3 mb-4">
                            {/* Pickup ready confirmation */}
                            {order.status === "pickup-ready" && (
                              <button
                                onClick={() => confirmOrderReceipt(order.id)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Confirm Pickup
                              </button>
                            )}

                            {/* Delivered order actions */}
                            {order.status === "delivered" && (
                              <>
                                <button
                                  onClick={() => confirmOrderReceipt(order.id)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <ThumbsUp className="mr-2 h-4 w-4" />
                                  Accept & Complete
                                </button>
                                <button
                                  onClick={() => openDisputeModal(order)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <ThumbsDown className="mr-2 h-4 w-4" />
                                  Reject & Dispute
                                </button>
                              </>
                            )}

                            {/* Pickup Completed order actions */}
                            {order.status === "pickup-completed" && (
                              <>
                                <button
                                  onClick={() => confirmOrderReceipt(order.id)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <ThumbsUp className="mr-2 h-4 w-4" />
                                  Accept & Complete
                                </button>
                                <button
                                  onClick={() => openDisputeModal(order)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <ThumbsDown className="mr-2 h-4 w-4" />
                                  Reject & Dispute
                                </button>
                              </>
                            )}

                            {/* Shipped order actions */}
                            {order.status === "shipped" && (
                              <button
                                onClick={() => confirmOrderReceipt(order.id)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Confirm Receipt
                              </button>
                            )}
                          </div>

                          {/* Schedule Pickup section */}
                          {order.status === "processing" &&
                            order.deliveryMethod !== "delivery" &&
                            !order.pickupScheduled && (
                              <div className="mt-6 flex justify-end">
                                <Link
                                  to={`/schedulePickup?orderId=${order.id}`}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Schedule Pickup
                                </Link>
                              </div>
                            )}

                          {/* Scheduled Pickup Info */}
                          {order.pickupScheduled &&
                            order.status !== "completed" && (
                              <div className="bg-blue-50 px-4 py-3 rounded-md mt-4">
                                <div className="flex">
                                  <div className="flex-shrink-0">
                                    <Calendar className="h-5 w-5 text-blue-400" />
                                  </div>
                                  <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                      Pickup Scheduled
                                    </h3>
                                    <p className="mt-1 text-sm text-blue-700">
                                      Your pickup is scheduled for{" "}
                                      {new Date(
                                        order.pickupTime
                                      ).toLocaleString()}
                                    </p>
                                    {order.status === "processing" && (
                                      <div className="mt-2 flex space-x-3">
                                        {!JSON.parse(
                                          localStorage.getItem(
                                            "pickupReminders"
                                          ) || "{}"
                                        )[order.id]?.set && (
                                          <button
                                            onClick={() =>
                                              handleSetReminder(order)
                                            }
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                                          >
                                            <Clock className="mr-2 h-4 w-4" />
                                            Set Reminder
                                          </button>
                                        )}
                                        <button
                                          onClick={() =>
                                            handleCancelSchedule(order)
                                          }
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                                        >
                                          <X className="mr-2 h-4 w-4" />
                                          Cancel Schedule
                                        </button>
                                      </div>
                                    )}
                                    {order.status === "pickup-ready" && (
                                      <div className="mt-2">
                                        <p className="text-sm text-blue-700 font-medium">
                                          Your order is ready for pickup!
                                        </p>
                                        {order.pickupReadyDate && (
                                          <p className="text-sm text-blue-700">
                                            Ready since:{" "}
                                            {new Date(
                                              order.pickupReadyDate
                                            ).toLocaleString()}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Order Status Sections */}
                          {order.status === "pending" && (
                            <div className="bg-yellow-50 px-4 py-3 rounded-md mt-4">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <Clock className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-yellow-800">
                                    Awaiting Processing
                                  </h3>
                                  <p className="mt-1 text-sm text-yellow-700">
                                    Your order is being reviewed. We'll update
                                    you soon.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Other status sections remain the same */}
                        </div>
                      </div>
                    </div>

                    {/* Toggle Details Button - Only for desktop */}
                    <div className="mt-4 hidden md:block">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Modal */}
        {disputeOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Report Problem with Order #{disputeOrder.id}
                </h3>
                <button
                  onClick={closeDisputeModal}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={submitDispute}>
                <div className="mb-4">
                  <label
                    htmlFor="disputeReason"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    What's wrong with your order?
                  </label>
                  <textarea
                    id="disputeReason"
                    rows={4}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Please describe the issue in detail..."
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div className="text-sm text-gray-500 mb-6">
                  <p className="mb-2">By submitting this dispute:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Our team will review your case within 24-48 hours</li>
                    <li>Payment to the vendor will be temporarily held</li>
                    <li>You may be contacted for additional information</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeDisputeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                    Submit Dispute
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chat Component */}
        <ChatComponent />
      </div>
    </ChatProvider>
  );
};

export default UserDashboard;
