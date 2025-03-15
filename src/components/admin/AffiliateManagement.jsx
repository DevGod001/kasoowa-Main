import React, { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  AlertTriangle,
  Award,
  User,
  Download,
  FileText,
  ShoppingBag,
} from "lucide-react";

const AffiliateManagement = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [pendingAffiliates, setPendingAffiliates] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [affiliateStats, setAffiliateStats] = useState({
    totalAffiliates: 0,
    totalSales: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
  });
  const [filteredAffiliates, setFilteredAffiliates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [withdrawalHistoryFilter, setWithdrawalHistoryFilter] = useState("all");

  // Load affiliates data
  useEffect(() => {
    const loadAffiliates = () => {
      setIsLoading(true);
      try {
        // Load approved affiliates
        const approvedAffiliates = JSON.parse(
          localStorage.getItem("affiliates") || "[]"
        );
        setAffiliates(approvedAffiliates);

        // Load pending affiliate applications
        const pendingApps = JSON.parse(
          localStorage.getItem("pendingAffiliates") || "[]"
        );
        setPendingAffiliates(pendingApps);

        // Calculate statistics
        const stats = {
          totalAffiliates: approvedAffiliates.length,
          totalSales: 0,
          totalCommissions: 0,
          pendingCommissions: 0,
        };

        // Get all orders to calculate affiliate earnings
        const allOrders = JSON.parse(
          localStorage.getItem("kasoowaOrders") || "[]"
        );

        // Filter to orders with affiliate referral
        const affiliateOrders = allOrders.filter((order) => order.affiliateId);

        affiliateOrders.forEach((order) => {
          // Calculate commission (2% of order total)
          const commissionRate = 2; // 2% affiliate commission
          const orderTotal = order.total || 0;
          const commission = (orderTotal * commissionRate) / 100;

          // Add to total sales
          stats.totalSales += orderTotal;

          // Add to appropriate commission category
          if (order.status === "completed") {
            stats.totalCommissions += commission;
          } else if (
            order.status !== "disputed" &&
            order.status !== "cancelled"
          ) {
            stats.pendingCommissions += commission;
          }
        });

        setAffiliateStats(stats);
        setFilteredAffiliates(approvedAffiliates);
      } catch (error) {
        console.error("Error loading affiliate data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAffiliates();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (
        e.key === "affiliates" ||
        e.key === "pendingAffiliates" ||
        e.key === "kasoowaOrders"
      ) {
        loadAffiliates();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Load withdrawal requests
  useEffect(() => {
    const loadWithdrawals = () => {
      try {
        const allAffiliates = JSON.parse(
          localStorage.getItem("affiliates") || "[]"
        );
        let allWithdrawalRequests = [];
        let pendingRequests = [];

        // Loop through each affiliate and get their withdrawal requests
        allAffiliates.forEach((affiliate) => {
          if (affiliate.userId) {
            const affiliateWithdrawals = JSON.parse(
              localStorage.getItem(
                `withdrawals_affiliate_${affiliate.userId}`
              ) || "[]"
            );

            // Add affiliate info to all withdrawals
            const enhancedWithdrawals = affiliateWithdrawals.map((w) => ({
              ...w,
              affiliateName: affiliate.userName || affiliate.fullName,
              affiliateId: affiliate.id,
              userId: affiliate.userId,
              storeSlug: affiliate.storeSlug,
            }));

            // Split into pending and completed/rejected
            const pending = enhancedWithdrawals.filter(
              (w) => w.status === "pending"
            );

            pendingRequests = [...pendingRequests, ...pending];
            allWithdrawalRequests = [
              ...allWithdrawalRequests,
              ...enhancedWithdrawals,
            ];
          }
        });

        // Sort by request date (newest first)
        pendingRequests.sort(
          (a, b) => new Date(b.requestDate) - new Date(a.requestDate)
        );
        allWithdrawalRequests.sort(
          (a, b) => new Date(b.requestDate) - new Date(a.requestDate)
        );

        setPendingWithdrawals(pendingRequests);
        setAllWithdrawals(allWithdrawalRequests);
      } catch (error) {
        console.error("Error loading withdrawal requests:", error);
      }
    };

    loadWithdrawals();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith("withdrawals_affiliate_")) {
        loadWithdrawals();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAffiliates(affiliates);
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = affiliates.filter(
      (affiliate) =>
        (affiliate.userName &&
          affiliate.userName.toLowerCase().includes(search)) ||
        (affiliate.fullName &&
          affiliate.fullName.toLowerCase().includes(search)) ||
        (affiliate.email && affiliate.email.toLowerCase().includes(search)) ||
        (affiliate.storeName &&
          affiliate.storeName.toLowerCase().includes(search)) ||
        (affiliate.storeSlug &&
          affiliate.storeSlug.toLowerCase().includes(search))
    );

    setFilteredAffiliates(filtered);
  }, [searchTerm, affiliates]);

  // Open modal for application review or withdrawal processing
  const openModal = (type, item) => {
    setSelectedAffiliate(item);
    setModalType(type);
    setRejectionReason("");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedAffiliate(null);
    setModalType("");
    setRejectionReason("");
  };

  // Process affiliate application
  const processAffiliateApplication = (approve) => {
    if (!selectedAffiliate) return;

    try {
      const pendingApps = JSON.parse(
        localStorage.getItem("pendingAffiliates") || "[]"
      );

      // Remove from pending
      const updatedPendingApps = pendingApps.filter(
        (app) => app.id !== selectedAffiliate.id
      );
      localStorage.setItem(
        "pendingAffiliates",
        JSON.stringify(updatedPendingApps)
      );

      if (approve) {
        // Add to approved affiliates
        const approvedAffiliates = JSON.parse(
          localStorage.getItem("affiliates") || "[]"
        );

        const approved = {
          ...selectedAffiliate,
          status: "approved",
          approvalDate: new Date().toISOString(),
          approvedBy: "admin",
        };

        localStorage.setItem(
          "affiliates",
          JSON.stringify([...approvedAffiliates, approved])
        );
      }

      // Update state
      setPendingAffiliates(updatedPendingApps);

      if (approve) {
        setAffiliates((prev) => [
          ...prev,
          {
            ...selectedAffiliate,
            status: "approved",
            approvalDate: new Date().toISOString(),
            approvedBy: "admin",
          },
        ]);

        setAffiliateStats((prev) => ({
          ...prev,
          totalAffiliates: prev.totalAffiliates + 1,
        }));
      }

      // Close modal
      closeModal();

      // Trigger storage event
      window.dispatchEvent(new Event("storage"));

      alert(
        `Affiliate application ${
          approve ? "approved" : "rejected"
        } successfully.`
      );
    } catch (error) {
      console.error("Error processing affiliate application:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Process withdrawal request
  const processWithdrawalRequest = (approve) => {
    if (!selectedAffiliate) return;

    try {
      // Get affiliate's withdrawals
      const userWithdrawals = JSON.parse(
        localStorage.getItem(
          `withdrawals_affiliate_${selectedAffiliate.userId}`
        ) || "[]"
      );

      // Find the specific withdrawal and update its status
      const updatedWithdrawals = userWithdrawals.map((w) => {
        if (w.id === selectedAffiliate.id) {
          return {
            ...w,
            status: approve ? "completed" : "rejected",
            processedDate: new Date().toISOString(),
            processedBy: "admin",
            rejectionReason: !approve ? rejectionReason : undefined,
          };
        }
        return w;
      });

      // Save updated withdrawals back to localStorage
      localStorage.setItem(
        `withdrawals_affiliate_${selectedAffiliate.userId}`,
        JSON.stringify(updatedWithdrawals)
      );

      // Update the pending withdrawals list
      setPendingWithdrawals((prevWithdrawals) =>
        prevWithdrawals.filter((w) => w.id !== selectedAffiliate.id)
      );

      // Update all withdrawals list
      setAllWithdrawals((prev) =>
        prev.map((w) => {
          if (w.id === selectedAffiliate.id) {
            return {
              ...w,
              status: approve ? "completed" : "rejected",
              processedDate: new Date().toISOString(),
              processedBy: "admin",
              rejectionReason: !approve ? rejectionReason : undefined,
            };
          }
          return w;
        })
      );

      // Close the modal
      closeModal();

      // Trigger storage event for any listening components
      window.dispatchEvent(new Event("storage"));

      alert(
        `Withdrawal request ${approve ? "approved" : "rejected"} successfully.`
      );
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("An error occurred while processing the withdrawal request.");
    }
  };

  // Export withdrawal history to CSV
  const exportWithdrawalsToCSV = () => {
    const headers = [
      "Reference ID",
      "Affiliate Name",
      "Store",
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
      w.affiliateName || "",
      w.storeSlug || "",
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
    link.download = `affiliate_withdrawals_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // Calculate affiliate's earnings
  const getAffiliateEarnings = (affiliateId) => {
    try {
      const allOrders = JSON.parse(
        localStorage.getItem("kasoowaOrders") || "[]"
      );

      let totalEarnings = 0;
      let pendingEarnings = 0;
      let orderCount = 0;

      // Filter to orders with affiliate referral
      const affiliateOrders = allOrders.filter(
        (order) => order.affiliateId === affiliateId
      );
      orderCount = affiliateOrders.length;

      affiliateOrders.forEach((order) => {
        // Calculate commission 2% of order total)
        const commissionRate = 2; // 2% affiliate commission
        const orderTotal = order.total || 0;
        const commission = (orderTotal * commissionRate) / 100;

        // Add to appropriate category
        if (order.status === "completed") {
          totalEarnings += commission;
        } else if (
          order.status !== "disputed" &&
          order.status !== "cancelled"
        ) {
          pendingEarnings += commission;
        }
      });

      return {
        totalEarnings,
        pendingEarnings,
        orderCount,
      };
    } catch (error) {
      console.error("Error calculating affiliate earnings:", error);
      return {
        totalEarnings: 0,
        pendingEarnings: 0,
        orderCount: 0,
      };
    }
  };

  // Export affiliates to CSV
  const exportAffiliatesToCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Store Name",
      "Store URL",
      "Approval Date",
      "Total Sales",
      "Total Earnings",
      "Pending Earnings",
    ];

    const csvData = filteredAffiliates.map((affiliate) => {
      const earnings = getAffiliateEarnings(affiliate.id);
      return [
        affiliate.id || "",
        affiliate.fullName || affiliate.userName || "",
        affiliate.email || "",
        affiliate.storeName || "",
        `${window.location.origin}/affiliate/${affiliate.storeSlug}`,
        affiliate.approvalDate
          ? new Date(affiliate.approvalDate).toLocaleDateString()
          : "",
        earnings.orderCount,
        earnings.totalEarnings.toFixed(2),
        earnings.pendingEarnings.toFixed(2),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `affiliates_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Affiliate Program Management
        </h2>

        {/* Stats Cards - Made mobile responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Affiliates
                </p>
                <p className="text-lg sm:text-xl font-bold">
                  {affiliateStats.totalAffiliates}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-2" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Referred Sales
                </p>
                <p className="text-lg sm:text-xl font-bold">
                  ₦{affiliateStats.totalSales.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mr-2" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Commissions
                </p>
                <p className="text-lg sm:text-xl font-bold">
                  ₦{affiliateStats.totalCommissions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mr-2" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Pending Commissions
                </p>
                <p className="text-lg sm:text-xl font-bold">
                  ₦{affiliateStats.pendingCommissions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Made horizontally scrollable */}
        <div className="mb-6 border-b border-gray-200">
          <nav
            className="flex overflow-x-auto affiliate-section nav-tabs"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("pending")}
              className={`${
                activeTab === "pending"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0`}
            >
              Pending Applications
              {pendingAffiliates.length > 0 && (
                <span className="ml-1 sm:ml-2 bg-yellow-100 text-yellow-800 text-xs px-1 sm:px-2 py-0.5 rounded-full">
                  {pendingAffiliates.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("affiliates")}
              className={`${
                activeTab === "affiliates"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0`}
            >
              Active Affiliates
            </button>

            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`${
                activeTab === "withdrawals"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0`}
            >
              Withdrawal Requests
              {pendingWithdrawals.length > 0 && (
                <span className="ml-1 sm:ml-2 bg-yellow-100 text-yellow-800 text-xs px-1 sm:px-2 py-0.5 rounded-full">
                  {pendingWithdrawals.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {activeTab === "pending" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-medium">
                Pending Affiliate Applications
              </h3>

              <div className="flex items-center gap-2">
                {pendingAffiliates.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    {pendingAffiliates.length} Pending
                  </span>
                )}

                <button
                  onClick={() => {
                    // Manually load pending affiliates
                    const pendingApps = JSON.parse(
                      localStorage.getItem("pendingAffiliates") || "[]"
                    );
                    setPendingAffiliates(pendingApps);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {pendingAffiliates.length === 0 ? (
              <div className="text-center py-8 sm:py-10 bg-gray-50 rounded-lg">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">
                  No pending affiliate applications
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store Name
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Applied
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank Info
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingAffiliates.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="font-medium text-gray-900 text-xs sm:text-sm">
                            {application.fullName || application.userName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {application.email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {application.phone}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {application.storeName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Slug: {application.storeSlug}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">
                          {application.applicationDate
                            ? new Date(
                                application.applicationDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {application.bankName || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Acct: {application.accountNumber || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Name: {application.accountName || "N/A"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <div className="flex justify-center space-x-1 sm:space-x-2">
                            <button
                              onClick={() =>
                                openModal("viewApplication", application)
                              }
                              className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              title="View application details"
                            >
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <button
                              onClick={() =>
                                openModal("approveApplication", application)
                              }
                              className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              title="Approve application"
                            >
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <button
                              onClick={() =>
                                openModal("rejectApplication", application)
                              }
                              className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Reject application"
                            >
                              <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
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
        )}

        {/* Active Affiliates Tab */}
        {activeTab === "affiliates" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-medium">
                Active Affiliates
              </h3>

              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search affiliates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={exportAffiliatesToCSV}
                  className="flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 text-sm rounded hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            {filteredAffiliates.length === 0 ? (
              <div className="text-center py-8 sm:py-10 bg-gray-50 rounded-lg">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">
                  {searchTerm
                    ? "No affiliates match your search"
                    : "No active affiliates"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approval Date
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAffiliates.map((affiliate) => {
                      const earnings = getAffiliateEarnings(affiliate.id);

                      return (
                        <tr key={affiliate.id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="font-medium text-gray-900 text-xs sm:text-sm">
                              {affiliate.fullName || affiliate.userName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {affiliate.email}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {affiliate.storeName || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <span className="truncate max-w-[80px] sm:max-w-[120px]">
                                {affiliate.storeSlug}
                              </span>
                              <a
                                href={`/affiliate/${affiliate.storeSlug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-1 text-green-600"
                                title="Visit store"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">
                            {affiliate.approvalDate
                              ? new Date(
                                  affiliate.approvalDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">
                            {(affiliate.products &&
                              affiliate.products.length) ||
                              0}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              ₦{earnings.totalEarnings.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Pending: ₦{earnings.pendingEarnings.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Orders: {earnings.orderCount}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                            <div className="flex justify-center space-x-1 sm:space-x-2">
                              <button
                                onClick={() =>
                                  openModal("viewAffiliate", affiliate)
                                }
                                className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                title="View affiliate details"
                              >
                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  window.open(
                                    `/affiliate/${affiliate.storeSlug}`,
                                    "_blank"
                                  )
                                }
                                className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                title="Visit affiliate store"
                              >
                                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Withdrawal Requests Tab */}
        {activeTab === "withdrawals" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-medium">
                Affiliate Withdrawal Requests
              </h3>

              <div className="flex items-center gap-2">
                <select
                  value={withdrawalHistoryFilter}
                  onChange={(e) => setWithdrawalHistoryFilter(e.target.value)}
                  className="border rounded-md text-xs sm:text-sm px-2 py-1"
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
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

            {/* Pending Withdrawals */}
            {withdrawalHistoryFilter === "pending" ||
            withdrawalHistoryFilter === "all" ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm sm:text-md font-medium">
                    Pending Withdrawals
                  </h4>
                  {pendingWithdrawals.length > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      {pendingWithdrawals.length} Pending
                    </span>
                  )}
                </div>

                {pendingWithdrawals.length === 0 ? (
                  <div className="text-center py-4 sm:py-6 bg-gray-50 rounded-lg">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">
                      No pending withdrawal requests
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Affiliate
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date Requested
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingWithdrawals.map((withdrawal) => (
                          <tr key={withdrawal.id} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                              <div className="font-medium text-gray-900">
                                {withdrawal.affiliateName}
                              </div>
                              <div className="text-xs text-gray-500">
                                Store: {withdrawal.storeSlug}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                              {withdrawal.id}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">
                              {new Date(
                                withdrawal.requestDate
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 capitalize">
                              {withdrawal.method}
                              {withdrawal.method === "bank" &&
                                withdrawal.accountDetails?.bank && (
                                  <span className="text-xs block text-gray-400">
                                    {withdrawal.accountDetails.bank}
                                  </span>
                                )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium">
                              ₦{withdrawal.amount.toLocaleString()}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center">
                              <div className="flex justify-center space-x-1 sm:space-x-2">
                                <button
                                  onClick={() =>
                                    openModal("approveWithdrawal", withdrawal)
                                  }
                                  className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  title="Approve withdrawal"
                                >
                                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    openModal("rejectWithdrawal", withdrawal)
                                  }
                                  className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  title="Reject withdrawal"
                                >
                                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
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
            ) : null}

            {/* Withdrawal History */}
            <div>
              <h4 className="text-sm sm:text-md font-medium mb-2">
                {withdrawalHistoryFilter === "pending"
                  ? "Recent Processed Withdrawals"
                  : withdrawalHistoryFilter === "all"
                  ? "All Withdrawals"
                  : `${
                      withdrawalHistoryFilter.charAt(0).toUpperCase() +
                      withdrawalHistoryFilter.slice(1)
                    } Withdrawals`}
              </h4>

              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Requested
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <td className="px-2 sm:px-3 py-2 text-xs">
                            <div className="font-medium text-gray-900">
                              {withdrawal.affiliateName}
                            </div>
                            <div className="text-xs text-gray-500">
                              Store: {withdrawal.storeSlug}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-xs text-gray-500">
                            {withdrawal.id}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-xs text-gray-500">
                            {new Date(
                              withdrawal.requestDate
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-xs text-gray-500 capitalize">
                            {withdrawal.method}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-xs text-right font-medium">
                            ₦{withdrawal.amount.toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-xs text-center">
                            <span
                              className={`inline-block px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${
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
                          <td className="px-2 sm:px-3 py-2 text-xs text-gray-500">
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
                          className="px-2 sm:px-3 py-4 text-xs sm:text-sm text-center text-gray-500"
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
            </div>
          </div>
        )}
      </div>

      {/* Affiliate Program Note */}
      <div className="bg-blue-50 border border-blue-200 p-2 sm:p-3 rounded-md mt-4 sm:mt-6 flex items-start">
        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-700">
          <p className="font-medium mb-1">Affiliate Commission Structure:</p>
          <p>
            Affiliates earn 2% commission on all sales made through their
            referral links. Commissions are calculated after the order is
            completed and can be withdrawn through the affiliate's dashboard.
          </p>
        </div>
      </div>

      {/* Modals */}
      {showModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">
                {modalType === "viewApplication"
                  ? "Affiliate Application Details"
                  : modalType === "approveApplication"
                  ? "Approve Affiliate Application"
                  : modalType === "rejectApplication"
                  ? "Reject Affiliate Application"
                  : modalType === "viewAffiliate"
                  ? "Affiliate Details"
                  : modalType === "approveWithdrawal"
                  ? "Approve Withdrawal Request"
                  : "Reject Withdrawal Request"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Application Details */}
            {(modalType === "viewApplication" ||
              modalType === "approveApplication" ||
              modalType === "rejectApplication") && (
              <div className="mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                      Applicant Information
                    </h3>
                    <p className="font-medium text-sm">
                      {selectedAffiliate.fullName || selectedAffiliate.userName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {selectedAffiliate.email}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {selectedAffiliate.phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                      Store Information
                    </h3>
                    <p className="font-medium text-sm">
                      {selectedAffiliate.storeName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Slug: {selectedAffiliate.storeSlug}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Applied:{" "}
                      {new Date(
                        selectedAffiliate.applicationDate
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                    Bank Information
                  </h3>
                  <p className="text-xs sm:text-sm">
                    Bank: {selectedAffiliate.bankName}
                  </p>
                  <p className="text-xs sm:text-sm">
                    Account Number: {selectedAffiliate.accountNumber}
                  </p>
                  <p className="text-xs sm:text-sm">
                    Account Name: {selectedAffiliate.accountName}
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                    Description
                  </h3>
                  <p className="text-xs sm:text-sm mt-1 bg-gray-50 p-3 rounded">
                    {selectedAffiliate.description}
                  </p>
                </div>

                {modalType === "viewApplication" && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() =>
                        openModal("approveApplication", selectedAffiliate)
                      }
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm rounded-md hover:bg-green-700"
                    >
                      Approve Application
                    </button>
                    <button
                      onClick={() =>
                        openModal("rejectApplication", selectedAffiliate)
                      }
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700"
                    >
                      Reject Application
                    </button>
                  </div>
                )}

                {modalType === "approveApplication" && (
                  <div className="mt-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-yellow-700">
                          By approving this application, the user will be able
                          to generate affiliate links and earn commissions on
                          sales.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={closeModal}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => processAffiliateApplication(true)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm rounded-md hover:bg-green-700"
                      >
                        Approve Application
                      </button>
                    </div>
                  </div>
                )}

                {modalType === "rejectApplication" && (
                  <div className="mt-4">
                    <div className="mb-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Reason for Rejection
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full p-2 border rounded-md text-xs sm:text-sm"
                        rows={3}
                        placeholder="Enter reason for rejecting the application"
                      ></textarea>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={closeModal}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => processAffiliateApplication(false)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700"
                      >
                        Reject Application
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Affiliate Details */}
            {modalType === "viewAffiliate" && (
              <div className="mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                      Affiliate Information
                    </h3>
                    <p className="font-medium text-sm">
                      {selectedAffiliate.fullName || selectedAffiliate.userName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {selectedAffiliate.email}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {selectedAffiliate.phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                      Store Information
                    </h3>
                    <p className="font-medium text-sm">
                      {selectedAffiliate.storeName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      URL:{" "}
                      <a
                        href={`${window.location.origin}/affiliate/${selectedAffiliate.storeSlug}`}
                        className="text-green-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {window.location.origin}/affiliate/
                        {selectedAffiliate.storeSlug}
                      </a>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Approved:{" "}
                      {new Date(
                        selectedAffiliate.approvalDate
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                    Bank Information
                  </h3>
                  <p className="text-xs sm:text-sm">
                    Bank: {selectedAffiliate.bankName}
                  </p>
                  <p className="text-xs sm:text-sm">
                    Account Number: {selectedAffiliate.accountNumber}
                  </p>
                  <p className="text-xs sm:text-sm">
                    Account Name: {selectedAffiliate.accountName}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4">
                  {(() => {
                    const earnings = getAffiliateEarnings(selectedAffiliate.id);
                    return (
                      <>
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">
                            Total Earnings
                          </p>
                          <p className="text-base sm:text-lg font-bold">
                            ₦{earnings.totalEarnings.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">
                            Pending Earnings
                          </p>
                          <p className="text-base sm:text-lg font-bold">
                            ₦{earnings.pendingEarnings.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">
                            Total Orders
                          </p>
                          <p className="text-base sm:text-lg font-bold">
                            {earnings.orderCount}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                    Products (
                    {(selectedAffiliate.products &&
                      selectedAffiliate.products.length) ||
                      0}
                    )
                  </h3>

                  {!selectedAffiliate.products ||
                  selectedAffiliate.products.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      No products selected
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedAffiliate.products.map((productId, index) => {
                        // Get product details (implement this as needed)
                        const product = {
                          id: productId,
                          title: `Product ${index + 1}`,
                        };

                        return (
                          <div
                            key={productId}
                            className="flex items-center bg-gray-50 p-2 rounded"
                          >
                            <ShoppingBag className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs sm:text-sm">
                              {product.title} (ID: {product.id})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={closeModal}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 text-xs sm:text-sm rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                  <a
                    href={`${window.location.origin}/affiliate/${selectedAffiliate.storeSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm rounded-md hover:bg-green-700 inline-flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Visit Store
                  </a>
                </div>
              </div>
            )}

            {/* Withdrawal Request Processing */}
            {(modalType === "approveWithdrawal" ||
              modalType === "rejectWithdrawal") && (
              <div className="mb-4">
                <div className="mb-4">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    Request from:{" "}
                    <span className="font-medium">
                      {selectedAffiliate.affiliateName}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    Store:{" "}
                    <span className="font-medium">
                      {selectedAffiliate.storeSlug}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    Amount:{" "}
                    <span className="font-medium">
                      ₦{selectedAffiliate.amount.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    Date Requested:{" "}
                    <span className="font-medium">
                      {new Date(selectedAffiliate.requestDate).toLocaleString()}
                    </span>
                  </p>

                  {selectedAffiliate.method === "bank" && (
                    <div className="mt-2 bg-gray-50 p-2 sm:p-3 rounded-md">
                      <h3 className="text-xs sm:text-sm font-medium mb-1">
                        Bank Details:
                      </h3>
                      <p className="text-xs sm:text-sm">
                        Bank:{" "}
                        {selectedAffiliate.accountDetails?.bank ||
                          selectedAffiliate.bankName ||
                          "N/A"}
                      </p>
                      <p className="text-xs sm:text-sm">
                        Account:{" "}
                        {selectedAffiliate.accountDetails?.accountNumber ||
                          selectedAffiliate.accountNumber ||
                          "N/A"}
                      </p>
                      <p className="text-xs sm:text-sm">
                        Name:{" "}
                        {selectedAffiliate.accountDetails?.accountName ||
                          selectedAffiliate.accountName ||
                          "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                {modalType === "rejectWithdrawal" && (
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Reason for Rejection
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-2 border rounded-md text-xs sm:text-sm"
                      rows={3}
                      placeholder="Please provide a reason for rejecting this withdrawal request"
                      required
                    ></textarea>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 p-2 sm:p-3 rounded-md mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-yellow-700">
                      {modalType === "approveWithdrawal"
                        ? "By approving this withdrawal, you confirm that payment has been sent to the affiliate's account."
                        : "The affiliate will be notified that their withdrawal request has been rejected along with the reason."}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      processWithdrawalRequest(
                        modalType === "approveWithdrawal"
                      )
                    }
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-white ${
                      modalType === "approveWithdrawal"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                    disabled={
                      modalType === "rejectWithdrawal" &&
                      !rejectionReason.trim()
                    }
                  >
                    {modalType === "approveWithdrawal"
                      ? "Approve & Send Payment"
                      : "Reject Request"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateManagement;
