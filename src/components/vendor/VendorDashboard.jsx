// src/components/vendor/VendorDashboard.jsx
import React, { useState, useEffect } from "react";
import { useProducts } from "../../contexts/ProductContext";
import { useAuth } from "../../contexts/AuthContext";
import ProductForm from "../admin/ProductForm";
import VendorProductList from "./VendorProductList";
import { Link, useNavigate } from "react-router-dom";
import VendorWallet from "./VendorWallet";
import TimeSlotManager from "../../utils/TimeSlotManager";

import {
  ShoppingBag,
  Store,
  DollarSign,
  Settings,
  Share2,
  Clock,
  CheckCircle,
  RefreshCw,
  Truck,
  Package,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Camera,
  Clipboard,
  MapPin,
  AlertTriangle,
  User,
  LogOut,
} from "lucide-react";

const VendorDashboard = () => {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [totalSales, setTotalSales] = useState(0);
  const [activeTab, setActiveTab] = useState("orders");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [vendorOrders, setVendorOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryProof, setDeliveryProof] = useState(null);
  const [deliveryProofPreview, setDeliveryProofPreview] = useState(null);

  const { user, logout } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [showWallet, setShowWallet] = useState(true);
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/vendor/auth");
  };

  // Filter products to only show vendor's products
  const vendorProducts = products.filter((product) => {
    return (
      product.vendorId && product.vendorId.toString() === user.id.toString()
    );
  });

  // Calculate total sales for vendor
  useEffect(() => {
    // Updated calculateVendorSales function for VendorDashboard component
    const calculateVendorSales = () => {
      try {
        const allOrders = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );

        const vendorTotal = allOrders.reduce((acc, order) => {
          // Calculate product subtotal from items belonging to this vendor
          const vendorSubtotal = order.items.reduce((itemTotal, item) => {
            // Check if the item belongs to this vendor
            if (
              item.vendorId &&
              item.vendorId.toString() === user.id.toString()
            ) {
              const itemPrice = parseFloat(item.price) || 0;
              const itemQuantity = parseInt(item.quantity) || 0;
              return itemTotal + itemPrice * itemQuantity;
            }
            return itemTotal;
          }, 0);

          // Calculate the subtotal of the entire order
          const orderSubtotal = order.subtotal || order.total;

          // Calculate the vendor's proportion of the entire order
          const vendorProportion =
            orderSubtotal > 0 ? vendorSubtotal / orderSubtotal : 0;

          // Calculate the vendor's share of delivery fee if applicable
          const deliveryFeePortion =
            order.deliveryFee && order.deliveryMethod === "delivery"
              ? order.deliveryFee * vendorProportion
              : 0;

          // Add the subtotal plus the delivery fee portion
          const vendorOrderTotal = vendorSubtotal + deliveryFeePortion;

          return acc + vendorOrderTotal;
        }, 0);

        // Calculate admin commission (4.1%) and deduct it from the total
        const commissionRate = 4.1; // 4.1% admin commission
        const adminCommission = (vendorTotal * commissionRate) / 100;
        const vendorNetTotal = vendorTotal - adminCommission;

        console.log("Calculated vendor sales before commission:", vendorTotal); // Debug log
        console.log("Admin commission (4.1%):", adminCommission); // Debug log
        console.log("Vendor's actual sales after commission:", vendorNetTotal); // Debug log

        setTotalSales(vendorNetTotal); // Set the vendor's amount after commission
      } catch (error) {
        console.error("Error calculating sales:", error);
        setTotalSales(0);
      }
    };

    calculateVendorSales();

    // Listen for order updates
    const handleStorageChange = (e) => {
      if (e.key === "kasoowaOrders") {
        calculateVendorSales();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user.id]);

  // Load vendor orders
  useEffect(() => {
    const fetchVendorOrders = () => {
      setIsOrdersLoading(true);
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

        // Process and enrich order data
        const processedOrders = vendorOrders.map((order) => {
          const vendorItems = order.items.filter(
            (item) =>
              item.vendorId && item.vendorId.toString() === user.id.toString()
          );

          // Calculate vendor-specific totals
          const subtotal = order.subtotal || order.total; // Use subtotal if available
          const orderTotal = order.total; // Total with delivery fee

          // Calculate the vendor's proportion of the order total
          const vendorSubtotal = vendorItems.reduce((sum, item) => {
            return (
              sum +
              (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
            );
          }, 0);
          // Calculate the vendor's proportional share of delivery fee if applicable
          const vendorProportion = subtotal > 0 ? vendorSubtotal / subtotal : 0;
          const deliveryFeePortion =
            order.deliveryFee && order.deliveryMethod === "delivery"
              ? order.deliveryFee * vendorProportion
              : 0;

          const vendorTotal = vendorSubtotal + deliveryFeePortion;

          const depositPaid = order.depositPaid || order.amountPaid || 0;
          const commissionRate = 4.1; // Admin commission rate
          const adminCommission = (vendorTotal * commissionRate) / 100;
          const vendorAmount = vendorTotal - adminCommission;

          // Calculate the vendor's portion of the deposit
          const vendorDepositPaid =
            orderTotal > 0 ? (vendorTotal / orderTotal) * depositPaid : 0;

          return {
            ...order,
            items: vendorItems, // Only include vendor's items
            vendorSubtotal: vendorSubtotal,
            vendorDeliveryFee: deliveryFeePortion,
            vendorTotal: vendorTotal,
            vendorDepositPaid: vendorDepositPaid,
            vendorBalanceAmount: vendorTotal - vendorDepositPaid,
            vendorDepositPercentage:
              vendorTotal > 0
                ? ((vendorDepositPaid / vendorTotal) * 100).toFixed(1)
                : "0",
            adminCommission: adminCommission,
            vendorAmount: vendorAmount,
            commissionRate: commissionRate,
          };
        });

        setVendorOrders(processedOrders);
        applyOrderFilters(
          processedOrders,
          filterStatus,
          searchTerm,
          sortBy,
          sortOrder
        );
      } catch (error) {
        console.error("Error loading vendor orders:", error);
        setVendorOrders([]);
        setFilteredOrders([]);
      } finally {
        setIsOrdersLoading(false);
      }
    };

    fetchVendorOrders();

    // Listen for order updates
    const handleStorageChange = (e) => {
      if (e.key === "kasoowaOrders") {
        fetchVendorOrders();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user.id, filterStatus, searchTerm, sortBy, sortOrder]);

  // Filter, search and sort orders
  const applyOrderFilters = (ordersData, status, search, sort, order) => {
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
          compareResult = (b.vendorTotal || 0) - (a.vendorTotal || 0);
          break;
        default:
          compareResult = 0;
      }
      return order === "desc" ? compareResult : -compareResult;
    });

    setFilteredOrders(filtered);
  };

  // Apply filters when filter criteria change
  useEffect(() => {
    applyOrderFilters(
      vendorOrders,
      filterStatus,
      searchTerm,
      sortBy,
      sortOrder
    );
  }, [vendorOrders, filterStatus, searchTerm, sortBy, sortOrder]);

  const handleAddProduct = async (productData) => {
    try {
      // Add vendor information to product data
      productData.append("vendorId", user.id.toString());
      productData.append("vendorName", user.name);
      productData.append("vendorSlug", user.storeSlug || "default-store");

      // Use the API to add the product
      await addProduct(productData);

      // Product has been added via API, so we don't need to manually update state
      setIsAddingProduct(false);

      // Display success message
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product: " + (error.message || "Unknown error"));
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      // Verify product belongs to vendor
      if (editingProduct.vendorId.toString() !== user.id.toString()) {
        alert("You do not have permission to edit this product");
        return;
      }

      // Use the API to update the product
      await updateProduct(editingProduct.id, productData);

      // Close the edit modal
      setEditingProduct(null);

      // Display success message
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product: " + (error.message || "Unknown error"));
    }
  };

  const handleDeleteProduct = (productId) => {
    // Find the product first
    const productToDelete = products.find((p) => p.id === productId);

    // Verify product belongs to vendor
    if (
      !productToDelete ||
      productToDelete.vendorId.toString() !== user.id.toString()
    ) {
      alert("You do not have permission to delete this product");
      return;
    }

    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct(productId)
        .then(() => {
          alert("Product deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting product:", error);
          alert(
            "Failed to delete product: " + (error.message || "Unknown error")
          );
        });
    }
  };

  // Export orders to CSV
  const exportToCSV = () => {
    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Status",
      "Items",
      "Total Amount",
      "Tracking Number",
    ];
    const csvData = filteredOrders.map((order) => [
      order.id || "",
      order.date ? new Date(order.date).toLocaleDateString() : "",
      order.userIdentifier || "",
      order.status || "",
      order.items.length,
      order.vendorTotal.toFixed(2) || 0,
      order.trackingNumber || "",
    ]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vendor_orders_export_${
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

  // Open processing modal
  const openProcessingModal = (order) => {
    setProcessingOrder(order);
    setTrackingNumber(order.trackingNumber || "");
    setDeliveryProof(null);
    setDeliveryProofPreview(
      order.deliveryProofUrl || order.pickupProofUrl || null
    );
  };

  // Close processing modal
  const closeProcessingModal = () => {
    setProcessingOrder(null);
    setTrackingNumber("");
    setDeliveryProof(null);
    setDeliveryProofPreview(null);
  };

  // Handle processing form submission
  const handleProcessOrder = async (e) => {
    e.preventDefault();

    if (!processingOrder) return;

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

      // Only allow pickup flow if pickup is actually scheduled
      if (
        processingOrder.deliveryMethod !== "delivery" &&
        processingOrder.pickupScheduled
      ) {
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
            statusUpdatedBy: "vendor",
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

          if (newStatus === "pickup-completed") {
            updatedOrder.pickupProofUrl = proofImageUrl;
            updatedOrder.pickupCompletedDate = new Date().toISOString();
            // Do not update payment status here - only upon final completion
          }

          // Only update payment status when order is fully completed
          if (newStatus === "completed") {
            console.log("Order marked as completed, releasing pickup slot");

            if (processingOrder.pickupScheduled && processingOrder.pickupTime) {
              const timeSlotManager = new TimeSlotManager();
              timeSlotManager.releasePickupSlotForCompletedOrder(
                processingOrder
              );
              console.log(
                `Released pickup slot for order ${processingOrder.id}`
              );
            }
            updatedOrder.completedDate = new Date().toISOString();
            updatedOrder.completedBy = "vendor";
            updatedOrder.paymentReleased = true;
            updatedOrder.paymentReleasedDate = new Date().toISOString();

            // If this was a deposit-based order, update payment info
            if (order.paymentType === "deposit") {
              updatedOrder.paymentStatus = "Paid in Full";
              updatedOrder.amountPaid = order.total;
              updatedOrder.depositPaid = order.total;
              updatedOrder.balanceAmount = 0;
              updatedOrder.depositPercentage = "100";

              // Update vendor-specific values
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

      // Force immediate refresh of the component
      window.dispatchEvent(new Event("storage"));

      // Close the modal
      closeProcessingModal();

      // Show success alert
      alert(
        `Order #${processingOrder.id} has been updated to ${newStatus.replace(
          "-",
          " "
        )}`
      );

      // Force the component to refresh
      fetchVendorOrders();
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Failed to process order. Please try again.");
    }
  };

  // Add a fetchVendorOrders function to force refresh
  const fetchVendorOrders = () => {
    setIsOrdersLoading(true);
    try {
      const allOrders = JSON.parse(
        localStorage.getItem("kasoowaOrders") || "[]"
      );

      // Process orders as before
      const vendorOrders = allOrders.filter((order) => {
        return (
          order.items &&
          order.items.some(
            (item) =>
              item.vendorId && item.vendorId.toString() === user.id.toString()
          )
        );
      });

      // Process and enrich order data
      const processedOrders = vendorOrders.map((order) => {
        const vendorItems = order.items.filter(
          (item) =>
            item.vendorId && item.vendorId.toString() === user.id.toString()
        );

        const subtotal = order.subtotal || order.total;
        const orderTotal = order.total;

        // Calculate the vendor's proportion of the order total
        const vendorSubtotal = vendorItems.reduce((sum, item) => {
          return (
            sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
          );
        }, 0);

        // Calculate the vendor's proportional share of delivery fee if applicable
        const vendorProportion = subtotal > 0 ? vendorSubtotal / subtotal : 0;
        const deliveryFeePortion =
          order.deliveryFee && order.deliveryMethod === "delivery"
            ? order.deliveryFee * vendorProportion
            : 0;

        const vendorTotal = vendorSubtotal + deliveryFeePortion;

        const depositPaid = order.depositPaid || order.amountPaid || 0;
        const commissionRate = 4.1; // Admin commission rate
        const adminCommission = (vendorTotal * commissionRate) / 100;
        const vendorAmount = vendorTotal - adminCommission;

        // Calculate the vendor's portion of the deposit
        const vendorDepositPaid =
          orderTotal > 0 ? (vendorTotal / orderTotal) * depositPaid : 0;

        return {
          ...order,
          items: vendorItems, // Only include vendor's items
          vendorSubtotal: vendorSubtotal,
          vendorDeliveryFee: deliveryFeePortion,
          vendorTotal: vendorTotal,
          vendorDepositPaid: vendorDepositPaid,
          vendorBalanceAmount: vendorTotal - vendorDepositPaid,
          vendorDepositPercentage:
            vendorTotal > 0
              ? ((vendorDepositPaid / vendorTotal) * 100).toFixed(1)
              : "0",
          adminCommission: adminCommission,
          vendorAmount: vendorAmount,
          commissionRate: commissionRate,
        };
      });

      setVendorOrders(processedOrders);
      applyOrderFilters(
        processedOrders,
        filterStatus,
        searchTerm,
        sortBy,
        sortOrder
      );
    } catch (error) {
      console.error("Error loading vendor orders:", error);
      setVendorOrders([]);
      setFilteredOrders([]);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Handle delivery proof image change
  const handleDeliveryProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDeliveryProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeliveryProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
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

  const storeUrl = `${window.location.origin}/store/${user.storeSlug}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          className="text-green-600 hover:text-green-700 flex items-center"
        >
          Go back to Marketplace
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your store and products
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link
            to="/vendor/customize"
            className="text-green-600 hover:text-green-700 flex items-center text-sm"
          >
            <Settings className="h-4 w-4 mr-1" />
            Customize Store
          </Link>
          <Link
            to="/vendor/domain"
            className="text-green-600 hover:text-green-700 flex items-center text-sm"
          >
            <Store className="h-4 w-4 mr-1" />
            Domain Settings
          </Link>
          <Link
            to="/vendor/settings"
            className="text-green-600 hover:text-green-700 flex items-center text-sm"
          >
            <User className="h-4 w-4 mr-1" />
            Account Settings
          </Link>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 flex items-center text-sm"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </button>
          <button
            onClick={() => setIsAddingProduct(true)}
            className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-sm w-full sm:w-auto mt-2 sm:mt-0"
          >
            Add New Product
          </button>
        </div>
      </div>
      {/* Store Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold">{vendorProducts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
            <div className="w-full">
              <p className="text-sm text-gray-600">Store Link</p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={storeUrl}
                  readOnly
                  className="text-sm border rounded px-2 py-1 w-full truncate"
                />
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  title="Open store in new tab"
                >
                  <Share2 className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold">
                ₦
                {totalSales.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("orders")}
            className={`${
              activeTab === "orders"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }
            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Orders & Sales
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`${
              activeTab === "products"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }
            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Products
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "orders" ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Wallet & Finances</h2>
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

            {showWallet && <VendorWallet />}
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Management</h2>

            {/* Filters and Controls */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
              <div className="flex-1 w-full min-w-0 mb-2 sm:mb-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent flex-1 sm:flex-none min-w-[120px]"
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
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent flex-1 sm:flex-none min-w-[120px]"
                >
                  <option value="date">Sort by Date</option>
                  <option value="total">Sort by Amount</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="p-1.5 border rounded-md hover:bg-gray-50"
                >
                  {sortOrder === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1 bg-green-600 text-white px-2 py-1.5 rounded-md hover:bg-green-700 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {isOrdersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                      <div className="mb-2 sm:mb-0">
                        <h3 className="text-lg font-medium">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {order.date
                            ? new Date(order.date).toLocaleString()
                            : "N/A"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {order.deliveryMethod !== "delivery" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pickup Order
                            </span>
                          )}
                          {order.deliveryMethod !== "delivery" &&
                            order.pickupScheduled && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Pickup Scheduled
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        <button
                          onClick={() => toggleOrderDetails(order.id)}
                          className="text-gray-500 hover:text-gray-700 p-1"
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

                    {/* Order Summary */}
                    <div
                      className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 ${
                        expandedOrders.has(order.id)
                          ? "block"
                          : "hidden md:grid"
                      }`}
                    >
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium">
                          {order.userIdentifier || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Items</p>
                        <p className="font-medium">
                          {order.items.length} product(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Your Amount</p>
                        <p className="font-medium">
                          ₦{(order.vendorTotal || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons and tracking number */}
                    <div
                      className={`flex flex-wrap justify-between items-center mb-4 ${
                        expandedOrders.has(order.id)
                          ? "block"
                          : "hidden md:flex"
                      }`}
                    >
                      <div className="flex flex-wrap gap-2">
                        {/* Standard delivery flow actions */}
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

                            {order.status === "processing" &&
                              order.pickupScheduled && (
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
                              <button
                                onClick={() => openProcessingModal(order)}
                                className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Complete Order
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {order.trackingNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Tracking #:</span>
                          <span className="font-medium">
                            {order.trackingNumber}
                          </span>
                          <button
                            onClick={() =>
                              copyTrackingNumber(order.trackingNumber)
                            }
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Copy tracking number"
                          >
                            <Clipboard className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Toggle Details Button */}
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

                    {/* Expanded Details */}
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

                        {order.vendorDeliveryFee > 0 && (
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-sm text-green-600">
                              Your Delivery Fee Portion
                            </span>
                            <span className="font-medium">
                              ₦{(order.vendorDeliveryFee || 0).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Pickup Details (if applicable) */}
                        {order.pickupScheduled && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Pickup Details</h4>
                            <p className="text-sm">
                              Scheduled for:{" "}
                              {order.pickupTime
                                ? new Date(order.pickupTime).toLocaleString()
                                : "N/A"}
                            </p>

                            {order.status === "pickup-ready" &&
                              order.pickupReadyDate && (
                                <p className="text-sm mt-1">
                                  Ready since:{" "}
                                  {new Date(
                                    order.pickupReadyDate
                                  ).toLocaleString()}
                                </p>
                              )}

                            {order.status === "pickup-completed" &&
                              order.pickupCompletedDate && (
                                <p className="text-sm mt-1">
                                  Picked up on:{" "}
                                  {new Date(
                                    order.pickupCompletedDate
                                  ).toLocaleString()}
                                </p>
                              )}
                          </div>
                        )}

                        {/* Status History */}
                        {order.statusUpdateTime && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Status Updates</h4>
                            <p className="text-sm">
                              Last updated:{" "}
                              {new Date(
                                order.statusUpdateTime
                              ).toLocaleString()}{" "}
                              by {order.statusUpdatedBy || "system"}
                            </p>
                          </div>
                        )}

                        {/* Delivery Information */}
                        {order.deliveredDate &&
                          order.status === "delivered" && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">
                                Delivery Information
                              </h4>
                              <p className="text-sm">
                                Delivered on:{" "}
                                {new Date(order.deliveredDate).toLocaleString()}
                              </p>
                            </div>
                          )}

                        {/* Delivery or Pickup Proof (depending on the order type) */}
                        {((order.deliveryProofUrl &&
                          order.status === "delivered") ||
                          (order.pickupProofUrl &&
                            order.status === "pickup-completed")) && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">
                              {order.pickupScheduled
                                ? "Pickup Proof"
                                : "Delivery Proof"}
                            </h4>
                            <div className="mt-2">
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
                                className="max-h-48 rounded-md border"
                              />
                            </div>
                          </div>
                        )}

                        {/* Payment Details with Commission */}
                        <div className="mt-4 bg-green-50 p-3 sm:p-4 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">
                            Payment Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <p className="text-sm text-green-600">
                                Products Subtotal
                              </p>
                              <p className="font-medium">
                                ₦{(order.vendorSubtotal || 0).toLocaleString()}
                              </p>
                            </div>
                            {order.vendorDeliveryFee > 0 && (
                              <div>
                                <p className="text-sm text-green-600">
                                  Delivery Fee
                                </p>
                                <p className="font-medium">
                                  ₦
                                  {(
                                    order.vendorDeliveryFee || 0
                                  ).toLocaleString()}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-green-600">
                                Total Amount
                              </p>
                              <p className="font-medium">
                                ₦{(order.vendorTotal || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Add deposit information for vendors */}
                          {order.paymentType === "deposit" && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-green-600">
                                    Deposit Paid
                                  </p>
                                  <p className="font-medium">
                                    ₦
                                    {(
                                      order.vendorDepositPaid || 0
                                    ).toLocaleString()}{" "}
                                    ({order.vendorDepositPercentage || 0}%)
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-green-600">
                                    Balance Due
                                  </p>
                                  <p className="font-medium">
                                    ₦
                                    {(
                                      order.vendorBalanceAmount || 0
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-green-600">
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
                          )}

                          {/* Payment Status */}
                          {(order.status === "completed" ||
                            order.paymentReleased) && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                <p className="text-sm font-medium text-green-700">
                                  Payment Released{" "}
                                  {order.paymentReleasedDate
                                    ? `on ${new Date(
                                        order.paymentReleasedDate
                                      ).toLocaleDateString()}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Products List */
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Your Products</h2>
          {vendorProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>You haven't added any products yet.</p>
              <button
                onClick={() => setIsAddingProduct(true)}
                className="mt-4 text-green-600 hover:text-green-700"
              >
                Add your first product
              </button>
            </div>
          ) : (
            <VendorProductList
              products={vendorProducts}
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
            />
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full my-2 sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 z-10">
              <h2 className="text-xl font-bold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setIsAddingProduct(false);
                  setEditingProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <ProductForm
              onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
              initialProduct={editingProduct}
              onCancel={() => {
                setIsAddingProduct(false);
                setEditingProduct(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Order Processing Modal */}
      {processingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {processingOrder.pickupScheduled
                  ? processingOrder.status === "processing"
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

            <form onSubmit={handleProcessOrder} className="overflow-y-auto">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Order #{processingOrder.id} for{" "}
                  {processingOrder.userIdentifier}
                </p>
                <StatusBadge status={processingOrder.status} />
              </div>

              {/* Show pickup information if it's a pickup order */}
              {processingOrder.pickupScheduled && (
                <div className="mb-4 bg-blue-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-blue-800">
                    Pickup Information
                  </p>
                  <p className="text-sm text-blue-700">
                    Scheduled for:{" "}
                    {new Date(processingOrder.pickupTime).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Tracking number input for shipping */}
              {!processingOrder.pickupScheduled &&
                (processingOrder.status === "processed" ||
                  processingOrder.status === "shipped") && (
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

              {/* Proof upload for delivery or pickup */}
              {((processingOrder.status === "shipped" &&
                !processingOrder.pickupScheduled) ||
                (processingOrder.status === "pickup-ready" &&
                  processingOrder.pickupScheduled)) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {processingOrder.pickupScheduled
                      ? "Pickup Proof"
                      : "Delivery Proof"}{" "}
                    {processingOrder.status === "shipped" ||
                    processingOrder.status === "pickup-ready"
                      ? "(Required)"
                      : "(Optional)"}
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDeliveryProofChange}
                      className="hidden"
                      id="proofImage"
                      required={
                        (processingOrder.status === "shipped" ||
                          processingOrder.status === "pickup-ready") &&
                        !deliveryProofPreview
                      }
                    />
                    <label
                      htmlFor="proofImage"
                      className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Camera className="h-4 w-4 mr-1 inline-block" />
                      Upload Image
                    </label>
                  </div>

                  {deliveryProofPreview && (
                    <div className="mt-2">
                      <img
                        src={deliveryProofPreview}
                        alt="Proof preview"
                        className="max-h-40 rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryProof(null);
                          setDeliveryProofPreview(null);
                        }}
                        className="mt-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProcessingModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 order-1 sm:order-2 mb-2 sm:mb-0"
                >
                  {processingOrder.pickupScheduled
                    ? processingOrder.status === "processing"
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

export default VendorDashboard;
