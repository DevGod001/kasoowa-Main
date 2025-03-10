// src/components/admin/VendorManagement.jsx
import React, { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle, User, Phone, Mail } from "lucide-react";

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = () => {
    try {
      const loadedVendors = JSON.parse(localStorage.getItem("vendors") || "[]");
      setVendors(loadedVendors);
    } catch (error) {
      console.error("Error loading vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    if (!window.confirm("Are you sure you want to approve this vendor?")) {
      return;
    }

    try {
      const updatedVendors = vendors.map((vendor) => {
        if (vendor.id === vendorId) {
          // Create notification in localStorage
          const notifications = JSON.parse(
            localStorage.getItem("notifications") || "[]"
          );
          notifications.push({
            id: Date.now(),
            userId: vendor.id,
            type: "vendor_approved",
            message: "Your vendor account has been approved!",
            read: false,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem("notifications", JSON.stringify(notifications));

          return {
            ...vendor,
            status: "approved",
            isActive: true,
            approvedAt: new Date().toISOString(),
          };
        }
        return vendor;
      });

      localStorage.setItem("vendors", JSON.stringify(updatedVendors));
      setVendors(updatedVendors);

      if (isViewModalOpen) {
        setIsViewModalOpen(false);
      }
    } catch (error) {
      console.error("Error approving vendor:", error);
      alert("Failed to approve vendor. Please try again.");
    }
  };

  const handleReject = async (vendorId) => {
    if (!window.confirm("Are you sure you want to reject this vendor?")) {
      return;
    }

    try {
      const updatedVendors = vendors.map((vendor) => {
        if (vendor.id === vendorId) {
          // Create notification in localStorage
          const notifications = JSON.parse(
            localStorage.getItem("notifications") || "[]"
          );
          notifications.push({
            id: Date.now(),
            userId: vendor.id,
            type: "vendor_rejected",
            message: "Your vendor application has been rejected.",
            read: false,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem("notifications", JSON.stringify(notifications));

          return {
            ...vendor,
            status: "rejected",
            isActive: false,
            rejectedAt: new Date().toISOString(),
          };
        }
        return vendor;
      });

      localStorage.setItem("vendors", JSON.stringify(updatedVendors));
      setVendors(updatedVendors);

      if (isViewModalOpen) {
        setIsViewModalOpen(false);
      }
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      alert("Failed to reject vendor. Please try again.");
    }
  };

  // Function for displaying a responsive view of vendors
  const displayVendorsList = () => {
    // Display as a list of cards on mobile
    if (vendors.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">No vendors found</div>
      );
    }

    return (
      <div>
        {/* Mobile cards view (hidden on larger screens) */}
        <div className="lg:hidden space-y-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-lg shadow p-4 border"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {vendor.businessName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {vendor.city}, {vendor.state}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full 
                  ${
                    vendor.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : vendor.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {vendor.status.charAt(0).toUpperCase() +
                    vendor.status.slice(1)}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-center text-sm text-gray-700">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {vendor.firstName} {vendor.lastName}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{vendor.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{vendor.phone}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsViewModalOpen(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="View Details"
                >
                  <Eye className="h-5 w-5" />
                </button>
                {vendor.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(vendor.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      title="Approve Vendor"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleReject(vendor.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Reject Vendor"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Traditional table view (hidden on mobile) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vendor.businessName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vendor.city}, {vendor.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vendor.firstName} {vendor.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.email}</div>
                    <div className="text-sm text-gray-500">{vendor.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        vendor.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : vendor.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {vendor.status.charAt(0).toUpperCase() +
                        vendor.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setIsViewModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {vendor.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(vendor.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve Vendor"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleReject(vendor.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject Vendor"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Vendor Management</h2>

        {isLoading ? (
          <div className="text-center py-4 text-gray-500">
            Loading vendors...
          </div>
        ) : (
          displayVendorsList()
        )}
      </div>

      {/* Vendor Details Modal */}
      {isViewModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md md:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Vendor Details</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">
                  Business Information
                </h4>
                <p className="text-sm text-gray-600">
                  Business Name: {selectedVendor.businessName}
                </p>
                <p className="text-sm text-gray-600">
                  Store URL: {selectedVendor.storeSlug}
                </p>
                <p className="text-sm text-gray-600">
                  Type: {selectedVendor.businessType}
                </p>
                <p className="text-sm text-gray-600">
                  Description: {selectedVendor.businessDescription}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">
                  Contact Information
                </h4>
                <p className="text-sm text-gray-600">
                  Name: {selectedVendor.firstName} {selectedVendor.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  Email: {selectedVendor.email}
                </p>
                <p className="text-sm text-gray-600">
                  Phone: {selectedVendor.phone}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Address</h4>
                <p className="text-sm text-gray-600">
                  {selectedVendor.businessAddress}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedVendor.city}, {selectedVendor.state}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedVendor.country}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Bank Information</h4>
                <p className="text-sm text-gray-600">
                  Bank: {selectedVendor.bankName}
                </p>
                <p className="text-sm text-gray-600">
                  Account Number: {selectedVendor.accountNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Account Name: {selectedVendor.accountName}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Documents</h4>
                <p className="text-sm text-gray-600">
                  CAC Number: {selectedVendor.cac || "Not provided"}
                </p>
                <p className="text-sm text-gray-600">
                  ID Type: {selectedVendor.idType}
                </p>
                <p className="text-sm text-gray-600">
                  ID Number: {selectedVendor.idNumber}
                </p>
                {selectedVendor.idImage && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">ID Document:</p>
                    <img
                      src={selectedVendor.idImage}
                      alt="ID Document"
                      className="max-w-full md:max-w-xs rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {selectedVendor.status === "pending" && (
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => {
                      handleApprove(selectedVendor.id);
                      setIsViewModalOpen(false);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedVendor.id);
                      setIsViewModalOpen(false);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
