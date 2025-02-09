// src/components/customer/SchedulePickup.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SchedulePickupForm from "./SchedulePickupForm";
import { ArrowLeft, AlertCircle } from "lucide-react";

const SchedulePickup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkScheduleStatus = () => {
      // Check authentication
      const userIdentifier = localStorage.getItem("userIdentifier");
      const identifierType = localStorage.getItem("identifierType");

      if (!userIdentifier || !identifierType) {
        navigate("/account");
        return;
      }

      // Check if orderId exists
      if (!orderId) {
        navigate("/account");
        return;
      }

      // Check if order already has a pickup scheduled
      const orders = JSON.parse(localStorage.getItem("kasoowaOrders") || "[]");
      const currentOrder = orders.find((order) => order.id === orderId);

      if (!currentOrder) {
        setError("Order not found");
        return;
      }

      if (currentOrder.pickupScheduled) {
        navigate("/account", {
          state: {
            message: `Pickup already scheduled for ${new Date(
              currentOrder.pickupTime
            ).toLocaleString()}`,
            type: "warning",
          },
        });
        return;
      }
    };

    checkScheduleStatus();
  }, [navigate, orderId]);

  const handleScheduleComplete = (scheduleData) => {
    try {
      // Get current orders
      const orders = JSON.parse(localStorage.getItem("kasoowaOrders") || "[]");

      // Double check if already scheduled
      const existingOrder = orders.find(
        (order) => order.id === scheduleData.orderId
      );
      if (existingOrder?.pickupScheduled) {
        navigate("/account", {
          state: {
            message: `Pickup already scheduled for ${new Date(
              existingOrder.pickupTime
            ).toLocaleString()}`,
            type: "warning",
          },
        });
        return;
      }

      // Update order with schedule
      const updatedOrders = orders.map((order) => {
        if (order.id === scheduleData.orderId) {
          return {
            ...order,
            pickupScheduled: true,
            pickupTime: scheduleData.pickupTime,
            pickupDate: scheduleData.pickupDate,
            scheduledAt: new Date().toISOString(),
          };
        }
        return order;
      });

      // Save updated orders
      localStorage.setItem("kasoowaOrders", JSON.stringify(updatedOrders));

      // Trigger storage event for immediate update
      window.dispatchEvent(new Event("storage"));

      // Add a small delay before navigation to ensure state is updated
      setTimeout(() => {
        navigate("/account", {
          state: {
            message:
              "Pickup successfully scheduled! You can set a reminder for 10 minutes before the pickup time.",
            type: "success",
          },
          replace: true,
        });
      }, 100);
    } catch (error) {
      console.error("Error scheduling pickup:", error);
      setError("Failed to schedule pickup. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <div className="mt-4">
                  <button
                    onClick={() => navigate("/account")}
                    className="inline-flex items-center text-sm font-medium text-red-700 hover:text-red-600"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/account")}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Schedule Your Pickup
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a convenient time for your order pickup. You'll be able to
              set a reminder after scheduling.
            </p>
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            <SchedulePickupForm
              orderId={orderId}
              onScheduleComplete={handleScheduleComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePickup;
