import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAffiliate } from "../../contexts/AffiliateContext";
import { useAuth } from "../../contexts/AuthContext";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { nigerianBanks } from "../../config/countryData";
import bcrypt from "bcryptjs";

const AffiliateRegistration = () => {
  const { user, login } = useAuth();
  const { applyForAffiliate, isPending, loading } = useAffiliate();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    confirmPassword: "",
    storeName: "",
    description: "",
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  // Redirect if already a pending affiliate
  useEffect(() => {
    if (isPending && !loading) {
      navigate("/affiliate/pending");
    }
  }, [isPending, loading, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Handle bank selection
  const handleBankChange = (e) => {
    const selectedBank = nigerianBanks.find(
      (bank) => bank.code === e.target.value
    );

    setFormData({
      ...formData,
      bankCode: e.target.value,
      bankName: selectedBank?.name || "",
    });

    if (errors.bankName) {
      setErrors({
        ...errors,
        bankName: "",
      });
    }
  };

  // Format account number (digits only, max 10 digits)
  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData({
        ...formData,
        accountNumber: value,
      });
    }

    if (errors.accountNumber) {
      setErrors({
        ...errors,
        accountNumber: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.storeName.trim())
      newErrors.storeName = "Store name is required";
    if (formData.description.trim().length < 20)
      newErrors.description = "Description must be at least 20 characters";
    if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required";
    if (!formData.accountNumber.trim())
      newErrors.accountNumber = "Account number is required";
    if (formData.accountNumber.length !== 10)
      newErrors.accountNumber = "Account number must be 10 digits";
    if (!formData.accountName.trim())
      newErrors.accountName = "Account name is required";
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms and conditions";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setIsSuccessful(false);

    try {
      // Hash the password before sending
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(formData.password, salt);

      // Create a new object without the confirmPassword field
      const submissionData = {
        ...formData,
        password: hashedPassword,
        confirmPassword: undefined,
        applicationDate: new Date().toISOString(),
      };

      const result = await applyForAffiliate(submissionData);

      if (result.success) {
        setSubmitMessage(
          "Application submitted successfully! We will review your application and get back to you soon."
        );
        setIsSuccessful(true);

        // Auto-login the user if they're not already logged in
        if (!user && result.userData) {
          await login(result.userData);
        }

        // Navigate immediately to pending page with the application data
        const updatedFormData = {
          ...formData,
          applicationDate: new Date().toISOString(),
        };

        navigate("/affiliate/pending", {
          state: { applicationData: updatedFormData },
        });
      } else {
        setSubmitMessage(
          result.message || "Failed to submit application. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting affiliate application:", error);
      setSubmitMessage("An unexpected error occurred. Please try again later.");
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Become an Affiliate Partner</h1>
        <button
          onClick={() => navigate("/affiliate/auth")}
          className="text-sm text-gray-600 hover:text-green-600"
        >
          Back
        </button>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">
          Benefits of becoming an affiliate:
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Earn 2% commission on all sales referred through your store</li>
          <li>Create your own personalized storefront</li>
          <li>Select products you want to promote</li>
          <li>Track your earnings in real-time</li>
          <li>Withdraw earnings directly to your bank account</li>
        </ul>
      </div>

      {submitMessage && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            submitMessage.includes("successfully")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {submitMessage}
          {isSuccessful && (
            <div className="mt-2">Redirecting to pending status page...</div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.fullName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name
            </label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.storeName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.storeName && (
              <p className="mt-1 text-sm text-red-600">{errors.storeName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This will be used to create your store URL
              (kasoowa.com/affiliate/your-store-name)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md pr-10 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Tell us why you want to be an affiliate)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={`w-full p-2 border rounded-md ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
            <div className="flex items-start mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Please provide your bank account details. This is where your
                commission earnings will be sent when you request a withdrawal.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name
            </label>
            <select
              value={formData.bankCode}
              onChange={handleBankChange}
              className={`w-full p-2 border rounded-md ${
                errors.bankName ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Bank</option>
              {nigerianBanks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            {errors.bankName && (
              <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleAccountNumberChange}
              maxLength="10"
              placeholder="10-digit account number"
              className={`w-full p-2 border rounded-md ${
                errors.accountNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.accountNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.accountNumber}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.accountName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.accountName && (
              <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded"
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-gray-700"
              >
                I agree to the{" "}
                <a href="/terms" className="text-green-600 hover:underline">
                  terms and conditions
                </a>{" "}
                for affiliate partners
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting || isSuccessful}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md shadow-md disabled:opacity-50"
          >
            {isSubmitting
              ? "Submitting..."
              : isSuccessful
              ? "Submitted"
              : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AffiliateRegistration;
