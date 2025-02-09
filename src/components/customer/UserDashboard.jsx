// src/components/customer/UserDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";

const UserDashboard = ({ userIdentifier, identifierType }) => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [notification, setNotification] = useState(null);
  const { getOrdersByUser } = useOrders();

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
      "in-progress": {
        color: "bg-purple-100 text-purple-800",
        icon: Truck,
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

          {/* Header with Shop Now button */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                Logged in with {identifierType}: {userIdentifier}
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Home className="mr-2 h-4 w-4" />
              Shop Now
            </Link>
          </div>

          {/* Order Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                value: orders.filter((o) => o.status === "processing").length,
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
            <nav className="flex space-x-8" aria-label="Tabs">
              {["all", "pending", "processing", "completed"].map((tab) => (
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
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                  : `You don't have any ${activeTab} orders`}
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
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Order Items */}
                    <div className="mt-6">
                      <div className="flow-root">
                        <ul className="-my-5 divide-y divide-gray-200">
                          {order.items.map((item, index) => (
                            <li key={index} className="py-5">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Qty: {item.quantity}
                                  </p>
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                  ₦{item.price.toLocaleString()}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="font-medium text-gray-900">
                            ₦{order.total.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Deposit Paid (10%)
                          </span>
                          <span className="font-medium text-green-600">
                            ₦{order.depositPaid.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Balance Due</span>
                          <span className="font-medium text-gray-900">
                            ₦
                            {(order.total - order.depositPaid).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-gray-200">
                          <span className="text-base font-medium text-gray-900">
                            Total Amount
                          </span>
                          <span className="text-base font-medium text-gray-900">
                            ₦{order.total.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Schedule Pickup Button */}
                      {order.status === "processing" &&
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

                      {/* Action Buttons based on status */}
                      <div className="mt-6">
                        {order.status === "pending" && (
                          <div className="bg-yellow-50 px-4 py-3 rounded-md">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <Clock className="h-5 w-5 text-yellow-400" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                  Awaiting Processing
                                </h3>
                                <p className="mt-1 text-sm text-yellow-700">
                                  Your order is being reviewed. We'll update you
                                  soon.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {order.status === "processing" && (
                          <div className="bg-blue-50 px-4 py-3 rounded-md">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <RefreshCw className="h-5 w-5 text-blue-400" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                  Processing in Progress
                                </h3>
                                {order.pickupScheduled ? (
                                  <div className="mt-2 space-y-2">
                                    <p className="text-sm text-blue-700">
                                      Pickup scheduled for{" "}
                                      {new Date(
                                        order.pickupTime
                                      ).toLocaleString()}
                                    </p>
                                    <div className="flex space-x-3">
                                      {!JSON.parse(
                                        localStorage.getItem(
                                          "pickupReminders"
                                        ) || "{}"
                                      )[order.id]?.set && (
                                        <button
                                          onClick={() =>
                                            handleSetReminder(order)
                                          }
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                          <Clock className="mr-2 h-4 w-4" />
                                          Set Reminder
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          handleCancelSchedule(order)
                                        }
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                      >
                                        <X className="mr-2 h-4 w-4" />
                                        Cancel Schedule
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2">
                                    <Link
                                      to={`/schedulePickup?orderId=${order.id}`}
                                      className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900"
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      Schedule your pickup time
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {order.status === "completed" && (
                          <div className="bg-green-50 px-4 py-3 rounded-md">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">
                                  Order Completed
                                </h3>
                                <p className="mt-1 text-sm text-green-700">
                                  Thank you for shopping with us!
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Chat Component */}
        <ChatComponent />
      </div>
    </ChatProvider>
  );
};

export default UserDashboard;
