// src/components/auth/VendorRegistration.jsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { SHA256 } from "crypto-js";

import {
  countries,
  nigerianStates,
  nigerianBanks,
} from "../../config/countryData";

// Validation function for store slug
const validateStoreSlug = async (slug) => {
  // Get existing vendors
  const vendors = JSON.parse(localStorage.getItem("vendors") || "[]");

  // Check if slug already exists
  const slugExists = vendors.some((vendor) => vendor.storeSlug === slug);

  // Add reserved words that shouldn't be used as slugs
  const reservedSlugs = [
    "admin",
    "api",
    "store",
    "stores",
    "shop",
    "marketplace",
  ];

  return {
    isValid: !slugExists && !reservedSlugs.includes(slug),
    message: slugExists
      ? "This store URL is already taken"
      : reservedSlugs.includes(slug)
      ? "This URL is not available"
      : "",
  };
};

const VendorRegistration = ({ onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Initialize error state
  const [errors, setErrors] = useState({
    storeSlug: "",
    email: "",
    phone: "",
    password: "",
  });

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Business Information
    businessName: "",
    storeSlug: "",
    businessAddress: "",
    city: "",
    state: "",
    country: "",
    bankCode: "",

    // Business Documents
    cac: "",
    idType: "national_id",
    idNumber: "",
    idImage: null,

    // Bank Information
    bankName: "",
    accountNumber: "",
    accountName: "",

    // Additional Information
    businessDescription: "",
    businessType: "individual",
    categories: [],

    // Terms and Policy
    agreedToTerms: false,
    agreedToPolicy: false,
  });
  // Add these validation handler functions to your VendorRegistration component

  // Handle name input (only allow letters, spaces, hyphens, and apostrophes)
  const handleNameInput = (e, field) => {
    const value = e.target.value.replace(/[^a-zA-Z\s\-']/g, "");
    setFormData({ ...formData, [field]: value });
  };

  // Handle phone number input (only allow numbers and format appropriately)
  const handlePhoneInput = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    // Limit to 11 digits (standard for Nigerian numbers)
    if (value.length <= 11) {
      setFormData({ ...formData, phone: value });
    }
  };

  // Handle account number input (only allow numbers and limit length)
  const handleAccountNumberInput = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    // Limit to 10 digits (standard for Nigerian accounts)
    if (value.length <= 10) {
      setFormData({ ...formData, accountNumber: value });
    }
  };

  // Handle ID number input (allow alphanumeric characters)
  const handleIdNumberInput = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
    setFormData({ ...formData, idNumber: value });
  };

  // Handle CAC number input (allow alphanumeric and some special characters)
  const handleCacInput = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9\-/]/g, "");
    setFormData({ ...formData, cac: value });
  };

  // Add validation for personal information
  const validatePersonalInfo = () => {
    const errors = {};

    // Phone validation
    if (formData.phone && !/^\d{11}$/.test(formData.phone)) {
      errors.phone = "Phone number must be 11 digits";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation (at least 8 characters)
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    return errors;
  };

  // Add validation for bank information
  const validateBankInfo = () => {
    const errors = {};

    // Account number validation
    if (formData.accountNumber && !/^\d{10}$/.test(formData.accountNumber)) {
      errors.accountNumber = "Account number must be 10 digits";
    }

    // Account name validation
    if (formData.accountName && formData.accountName.length < 2) {
      errors.accountName = "Please enter a valid account name";
    }

    return errors;
  };

  // Handle store slug changes with validation
  const handleStoreSlugChange = async (e) => {
    const rawSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-") // Replace invalid chars with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove hyphens from start and end

    const { isValid, message } = await validateStoreSlug(rawSlug);

    setFormData((prev) => ({
      ...prev,
      storeSlug: rawSlug,
      storeUrl: `kasoowa.com/store/${rawSlug}`,
    }));

    setErrors((prev) => ({
      ...prev,
      storeSlug: !isValid ? message : "",
    }));
  };

  // Handle country changes
  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setFormData({
      ...formData,
      country: selectedCountry,
      state: "", // Reset state when country changes
      bankName: "", // Reset bank when country changes
      bankCode: "", // Reset bank code when country changes
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate store slug
    const { isValid, message } = await validateStoreSlug(formData.storeSlug);
    if (!isValid) {
      setErrors((prev) => ({
        ...prev,
        storeSlug: message,
      }));
      return;
    }

    // Validate personal information
    const personalInfoErrors = validatePersonalInfo();
    // Validate bank information
    const bankInfoErrors = validateBankInfo();

    // Combine all validation errors
    const allErrors = {
      ...personalInfoErrors,
      ...bankInfoErrors,
      storeSlug: !isValid ? message : "",
    };

    // Check if there are any validation errors
    if (Object.keys(allErrors).some((key) => allErrors[key])) {
      setErrors(allErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validation checks
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        password: "Passwords don't match",
      }));
      return;
    }

    if (!formData.agreedToTerms || !formData.agreedToPolicy) {
      alert("Please agree to terms and privacy policy");
      return;
    }

    try {
      // Check for existing vendor with same email or phone
      const vendors = JSON.parse(localStorage.getItem("vendors") || "[]");
      const existingVendor = vendors.find(
        (vendor) =>
          vendor.email === formData.email || vendor.phone === formData.phone
      );

      if (existingVendor) {
        if (existingVendor.email === formData.email) {
          setErrors((prev) => ({
            ...prev,
            email: "This email is already registered",
          }));
        }
        if (existingVendor.phone === formData.phone) {
          setErrors((prev) => ({
            ...prev,
            phone: "This phone number is already registered",
          }));
        }
        return;
      }

      const vendorId = Date.now().toString();
      // Create vendor account
      const hashedPassword = SHA256(formData.password).toString();
      const vendorData = {
        ...formData,
        password: hashedPassword,
        confirmPassword: undefined,
        id: vendorId,
        role: "vendor",
        status: "pending",
        createdAt: new Date().toISOString(),
        isActive: false,
      };

      // Save to localStorage
      vendors.push(vendorData);
      localStorage.setItem("vendors", JSON.stringify(vendors));

      // Log the user in
      login({
        id: vendorId,
        email: formData.email,
        role: "vendor",
        name: `${formData.firstName} ${formData.lastName}`,
        businessName: formData.businessName,
        storeSlug: formData.storeSlug,
        status: "pending",
      });

      alert("Registration successful! Redirecting to your dashboard...");
      navigate("/vendor/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Vendor Registration</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => handleNameInput(e, "firstName")}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => handleNameInput(e, "lastName")}
              className="w-full p-2 border rounded"
              required
            />
            <div className="relative">
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full p-2 border rounded ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
                required
              />
              {errors.email && (
                <div className="mt-1 text-sm text-red-600">{errors.email}</div>
              )}
            </div>
            <div className="relative">
              <input
                type="tel"
                placeholder="Phone Number (11 digits)"
                value={formData.phone}
                onChange={handlePhoneInput}
                maxLength={11}
                className={`w-full p-2 border rounded ${
                  errors.phone ? "border-red-300" : "border-gray-300"
                }`}
                required
              />
              {errors.phone && (
                <div className="mt-1 text-sm text-red-600">{errors.phone}</div>
              )}
              {formData.phone && formData.phone.length !== 11 && (
                <div className="mt-1 text-xs text-yellow-600">
                  Phone number should be 11 digits
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`w-full p-2 border rounded ${
                  errors.password ? "border-red-300" : "border-gray-300"
                }`}
                required
                minLength={8}
              />
              {errors.password && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.password}
                </div>
              )}
              {formData.password &&
                formData.password.length < 8 &&
                !errors.password && (
                  <div className="mt-1 text-xs text-yellow-600">
                    Password must be at least 8 characters
                  </div>
                )}
            </div>
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className={`w-full p-2 border rounded ${
                formData.password !== formData.confirmPassword &&
                formData.confirmPassword
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
              required
            />
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
            <div className="relative">
              <input
                type="text"
                placeholder="Store URL (e.g., yourstore)"
                value={formData.storeSlug}
                onChange={handleStoreSlugChange}
                className={`w-full p-2 border rounded ${
                  errors.storeSlug ? "border-red-300" : "border-gray-300"
                }`}
                required
              />
              {formData.storeSlug && (
                <div className="mt-1 text-sm text-gray-500">
                  Your store URL will be: kasoowa.com/store/{formData.storeSlug}
                </div>
              )}
              {errors.storeSlug && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.storeSlug}
                </div>
              )}
            </div>

            {/* Country Selection */}
            <select
              value={formData.country}
              onChange={handleCountryChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>

            {/* State Selection - Shows dropdown for Nigeria, text input for others */}
            {formData.country === "NG" ? (
              <select
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select State</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="State/Province/Region"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            )}

            <input
              type="text"
              placeholder="City/Store Location"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />

            <textarea
              placeholder="Detailed Business Address"
              value={formData.businessAddress}
              onChange={(e) =>
                setFormData({ ...formData, businessAddress: e.target.value })
              }
              className="w-full p-2 border rounded md:col-span-2"
              required
            />
          </div>
        </div>

        {/* Business Documents */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Business Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="CAC Number (Optional)"
              value={formData.cac}
              onChange={handleCacInput}
              className="w-full p-2 border rounded"
            />
            <select
              value={formData.idType}
              onChange={(e) =>
                setFormData({ ...formData, idType: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="national_id">National ID</option>
              <option value="drivers_license">Driver's License</option>
              <option value="passport">International Passport</option>
              <option value="voters_card">Voter's Card</option>
            </select>
            <input
              type="text"
              placeholder="ID Number"
              value={formData.idNumber}
              onChange={handleIdNumberInput}
              className="w-full p-2 border rounded"
              required
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ID Document
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({
                          ...formData,
                          idImage: reader.result,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 
            file:mr-4 file:py-2 file:px-4 
            file:rounded-md file:border-0 
            file:text-sm file:font-semibold 
            file:bg-green-50 file:text-green-700 
            hover:file:bg-green-100"
                  required
                />
                {formData.idImage && (
                  <img
                    src={formData.idImage}
                    alt="ID Preview"
                    className="h-20 w-20 object-cover rounded-md"
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Upload a clear image of your ID document. Supported formats:
                JPG, PNG
              </p>
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Bank Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.country === "NG" ? (
              <select
                value={formData.bankCode}
                onChange={(e) => {
                  const selectedBank = nigerianBanks.find(
                    (bank) => bank.code === e.target.value
                  );
                  setFormData({
                    ...formData,
                    bankCode: e.target.value,
                    bankName: selectedBank?.name || "",
                  });
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Bank</option>
                {nigerianBanks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="Account Number (10 digits)"
                value={formData.accountNumber}
                onChange={handleAccountNumberInput}
                maxLength={10}
                className={`w-full p-2 border rounded ${
                  errors.accountNumber ? "border-red-300" : ""
                }`}
                required
              />
              {formData.accountNumber &&
                formData.accountNumber.length !== 10 && (
                  <div className="mt-1 text-xs text-yellow-600">
                    Account number must be 10 digits
                  </div>
                )}
              {errors.accountNumber && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.accountNumber}
                </div>
              )}
            </div>

            <div className="relative md:col-span-2">
              <input
                type="text"
                placeholder="Account Name"
                value={formData.accountName}
                onChange={(e) => handleNameInput(e, "accountName")}
                className={`w-full p-2 border rounded ${
                  errors.accountName ? "border-red-300" : ""
                }`}
                required
              />
              {errors.accountName && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.accountName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="space-y-4">
            <textarea
              placeholder="Business Description"
              value={formData.businessDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  businessDescription: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
              rows={4}
              required
            />
            <select
              value={formData.businessType}
              onChange={(e) =>
                setFormData({ ...formData, businessType: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="individual">Individual Business</option>
              <option value="registered_business">Registered Business</option>
            </select>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.agreedToTerms}
              onChange={(e) =>
                setFormData({ ...formData, agreedToTerms: e.target.checked })
              }
              className="mr-2"
              required
            />
            <label className="text-sm">
              I agree to the Terms and Conditions
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.agreedToPolicy}
              onChange={(e) =>
                setFormData({ ...formData, agreedToPolicy: e.target.checked })
              }
              className="mr-2"
              required
            />
            <label className="text-sm">I agree to the Privacy Policy</label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Submit Application
          </button>
        </div>
      </form>
      <div className="flex justify-center mt-4">
        <Link to="/" className="text-green-600 hover:text-green-700">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default VendorRegistration;
