// src/components/affiliate/AffiliateSettings.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAffiliate } from "../../contexts/AffiliateContext";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import BankAccountsManager from "../shared/BankAccountsManager";

const AffiliateSettings = () => {
  const { affiliateData, updateStoreSettings, isAffiliate, loading } =
    useAffiliate();

  const [formData, setFormData] = useState({
    storeName: affiliateData?.storeName || "",
    description: affiliateData?.description || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateStoreSettings(formData);

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "Settings updated successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to update settings",
        });
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAffiliate) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-red-600 mb-4">
          You need to be an approved affiliate to access this page.
        </p>
        <Link
          to="/affiliate/register"
          className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Apply to become an affiliate
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <Link
          to="/affiliate/dashboard"
          className="inline-flex items-center text-green-600 hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">Store Settings</h1>

        {message && (
          <div
            className={`p-4 mb-6 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.type === "success" && (
              <CheckCircle className="inline-block h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="storeName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Store Name
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                placeholder="Your store name"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be used in your store URL: {window.location.origin}
                /affiliate/
                {formData.storeName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")}
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Store Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-2 border rounded-md"
                placeholder="Tell customers about your store"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bank Accounts Section */}
      <BankAccountsManager userType="affiliate" />
    </div>
  );
};

export default AffiliateSettings;
