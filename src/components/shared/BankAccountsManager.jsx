// src/components/shared/BankAccountsManager.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Star, StarOff, Trash2, Plus } from "lucide-react";
import { nigerianBanks } from "../../config/countryData";
import {
  formatAccountNumber,
  formatPersonName,
} from "../../utils/InputFormatters";

const BankAccountsManager = ({ userType }) => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("kasoowaAuthToken");

        if (token) {
          const response = await axios.get(
            `${window.location.origin}/api/user/bank-accounts`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          setBankAccounts(response.data);
        } else {
          setBankAccounts([]);
        }
      } catch (error) {
        console.error("Error fetching bank accounts:", error);

        // Fallback to localStorage for development
        // This is only a temporary solution until the API is fully implemented
        try {
          const key = `${userType}_bank_accounts_${localStorage.getItem(
            "userId"
          )}`;
          const storedAccounts = JSON.parse(localStorage.getItem(key) || "[]");
          setBankAccounts(storedAccounts);
        } catch (e) {
          console.error("Error loading from localStorage:", e);
          setBankAccounts([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankAccounts();
  }, [userType]);

  // Format account number input
  const handleAccountNumberChange = (e) => {
    const formattedValue = formatAccountNumber(e.target.value);
    setNewAccount({ ...newAccount, accountNumber: formattedValue });
  };

  // Format account name input
  const handleAccountNameChange = (e) => {
    const formattedValue = formatPersonName(e.target.value);
    setNewAccount({ ...newAccount, accountName: formattedValue });
  };

  // Add new bank account
  const handleAddAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newAccount.bankCode) {
      setError("Please select a bank");
      return;
    }

    if (!newAccount.accountNumber || newAccount.accountNumber.length !== 10) {
      setError("Please enter a valid 10-digit account number");
      return;
    }

    if (!newAccount.accountName) {
      setError("Please enter the account name");
      return;
    }

    try {
      const token = localStorage.getItem("kasoowaAuthToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setError("You must be logged in to add a bank account");
        return;
      }

      // Check if user already has 3 accounts
      if (bankAccounts.length >= 3) {
        setError("Maximum of 3 bank accounts allowed");
        return;
      }

      // Check for duplicate account
      if (
        bankAccounts.some(
          (acc) => acc.account_number === newAccount.accountNumber
        )
      ) {
        setError("This account has already been added");
        return;
      }

      try {
        // First try API
        const response = await axios.post(
          `${window.location.origin}/api/user/bank-accounts`,
          {
            bankName: newAccount.bankName,
            bankCode: newAccount.bankCode,
            accountNumber: newAccount.accountNumber,
            accountName: newAccount.accountName,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Add the new account to the list
        setBankAccounts([...bankAccounts, response.data]);
      } catch (apiError) {
        console.warn(
          "API not available, falling back to localStorage:",
          apiError
        );

        // Fallback to localStorage if API fails
        const newBankAccount = {
          id: Date.now().toString(),
          user_id: userId,
          user_type: userType,
          bank_name: newAccount.bankName,
          bank_code: newAccount.bankCode,
          account_number: newAccount.accountNumber,
          account_name: newAccount.accountName,
          is_primary: bankAccounts.length === 0, // Make primary if it's the first account
          created_at: new Date().toISOString(),
        };

        const updatedAccounts = [...bankAccounts, newBankAccount];
        setBankAccounts(updatedAccounts);

        // Save to localStorage
        const key = `${userType}_bank_accounts_${userId}`;
        localStorage.setItem(key, JSON.stringify(updatedAccounts));
      }

      // Reset form
      setNewAccount({
        bankCode: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
      });

      setSuccess("Bank account added successfully");
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding bank account:", error);
      setError(error.response?.data?.message || "Failed to add bank account");
    }
  };

  // Set a bank account as primary
  const handleSetPrimary = async (accountId) => {
    try {
      const token = localStorage.getItem("kasoowaAuthToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setError("You must be logged in to manage bank accounts");
        return;
      }

      try {
        // First try API
        const response = await axios.put(
          `${window.location.origin}/api/user/bank-accounts/${accountId}/set-primary`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setBankAccounts(response.data);
      } catch (apiError) {
        console.warn(
          "API not available, falling back to localStorage:",
          apiError
        );

        // Fallback to localStorage
        const updatedAccounts = bankAccounts.map((account) => ({
          ...account,
          is_primary: account.id === accountId,
        }));

        setBankAccounts(updatedAccounts);

        // Save to localStorage
        const key = `${userType}_bank_accounts_${userId}`;
        localStorage.setItem(key, JSON.stringify(updatedAccounts));
      }

      setSuccess("Primary bank account updated");
    } catch (error) {
      console.error("Error setting primary bank account:", error);
      setError("Failed to update primary bank account");
    }
  };

  // Delete a bank account
  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) {
      return;
    }

    try {
      const token = localStorage.getItem("kasoowaAuthToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setError("You must be logged in to manage bank accounts");
        return;
      }

      try {
        // First try API
        const response = await axios.delete(
          `${window.location.origin}/api/user/bank-accounts/${accountId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setBankAccounts(response.data);
      } catch (apiError) {
        console.warn(
          "API not available, falling back to localStorage:",
          apiError
        );

        // Get the account we're deleting
        const accountToDelete = bankAccounts.find(
          (acc) => acc.id === accountId
        );
        const wasPrimary = accountToDelete?.is_primary;

        // Remove the account
        let updatedAccounts = bankAccounts.filter(
          (account) => account.id !== accountId
        );

        // If we removed the primary account, make the first remaining account primary
        if (wasPrimary && updatedAccounts.length > 0) {
          updatedAccounts = updatedAccounts.map((account, index) => ({
            ...account,
            is_primary: index === 0, // Make the first account primary
          }));
        }

        setBankAccounts(updatedAccounts);

        // Save to localStorage
        const key = `${userType}_bank_accounts_${userId}`;
        localStorage.setItem(key, JSON.stringify(updatedAccounts));
      }

      setSuccess("Bank account deleted successfully");
    } catch (error) {
      console.error("Error deleting bank account:", error);
      setError("Failed to delete bank account");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4">Your Bank Accounts</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Existing bank accounts */}
      {bankAccounts.length > 0 ? (
        <div className="mb-6 space-y-4">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              className={`p-4 rounded-lg border ${
                account.is_primary
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="font-medium">{account.bank_name}</h3>
                    {account.is_primary && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {account.account_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {account.account_name}
                  </p>
                </div>
                <div className="flex items-center">
                  {!account.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(account.id)}
                      className="text-gray-500 hover:text-green-600 p-1"
                      title="Set as primary account"
                    >
                      <StarOff className="h-4 w-4" />
                    </button>
                  )}
                  {account.is_primary && (
                    <div className="text-green-600 p-1">
                      <Star className="h-4 w-4" />
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-gray-500 hover:text-red-600 p-1 ml-1"
                    title="Delete account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">
            You haven't added any bank accounts yet.
          </p>
        </div>
      )}

      {/* Add bank account form */}
      {bankAccounts.length < 3 ? (
        isAdding ? (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Add Bank Account</h3>
            <form onSubmit={handleAddAccount}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <select
                  value={newAccount.bankCode}
                  onChange={(e) => {
                    const selectedBank = nigerianBanks.find(
                      (bank) => bank.code === e.target.value
                    );
                    setNewAccount({
                      ...newAccount,
                      bankCode: e.target.value,
                      bankName: selectedBank?.name || "",
                    });
                  }}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Bank</option>
                  {nigerianBanks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={newAccount.accountNumber}
                  onChange={handleAccountNumberChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter 10-digit account number"
                  maxLength={10}
                  required
                />
                {newAccount.accountNumber &&
                  newAccount.accountNumber.length !== 10 && (
                    <p className="mt-1 text-xs text-red-500">
                      Account number must be 10 digits
                    </p>
                  )}
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.accountName}
                  onChange={handleAccountNameChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter account name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center w-full p-3 border border-dashed border-gray-300 rounded-lg text-green-600 hover:bg-green-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Bank Account ({bankAccounts.length}/3)
          </button>
        )
      ) : (
        <p className="text-sm text-gray-500 text-center p-2 bg-gray-50 rounded-md">
          Maximum of 3 bank accounts allowed
        </p>
      )}
    </div>
  );
};

export default BankAccountsManager;
