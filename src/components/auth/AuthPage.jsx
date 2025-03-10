import React, { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const AuthPage = ({ onLogin }) => {
  const [authMethod, setAuthMethod] = useState("email"); // 'email' or 'phone'
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Here you would typically make an API call to verify the user
      // For now, we'll simulate the API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (authMethod === "email" && !identifier.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      if (authMethod === "phone" && !/^[0-9]{10,11}$/.test(identifier)) {
        throw new Error("Please enter a valid phone number");
      }

      // If validation passes, call the onLogin prop
      onLogin(identifier, authMethod);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Access Your Orders
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the {authMethod === "email" ? "email" : "phone number"} you used
          during checkout
        </p>
        <div className="mt-4 text-center">
        <Link
            to="/"
            className="text-green-600 hover:text-green-700"
          >
            Marketplace
          </Link> 
          <br/>
          <br/>
          <Link
            to="/vendor/registration"
            className="text-green-600 hover:text-green-700"
          >
            Register as Vendor
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Auth Method Toggle */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setAuthMethod("email")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                authMethod === "email"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Mail className="inline-block w-4 h-4 mr-2" />
              Email
            </button>
            <button
              onClick={() => setAuthMethod("phone")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                authMethod === "phone"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Phone className="inline-block w-4 h-4 mr-2" />
              Phone
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700"
              >
                {authMethod === "email" ? "Email address" : "Phone number"}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {authMethod === "email" ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Phone className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type={authMethod === "email" ? "email" : "tel"}
                  autoComplete={authMethod === "email" ? "email" : "tel"}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder={
                    authMethod === "email" ? "you@example.com" : "08012345678"
                  }
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Checking..." : "View Orders"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
