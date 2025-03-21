// src/components/admin/ProductManagement.jsx
import React, { useState, useEffect } from "react";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import AdminChatView from "./AdminChatView";
import OrderManagementSection from "./OrderManagementSection"; // Add this import
import { useProducts } from "../../contexts/ProductContext";
import { ChatProvider } from "../../contexts/ChatContext";
import { useChat } from "../../contexts/ChatContext";
import VendorManagement from "./VendorManagement";
import AffiliateManagement from "./AffiliateManagement";

const ProductManagement = () => {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();

  return (
    <ChatProvider>
      <ProductManagementContent
        isAddingProduct={isAddingProduct}
        setIsAddingProduct={setIsAddingProduct}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        products={products}
        addProduct={addProduct}
        updateProduct={updateProduct}
        deleteProduct={deleteProduct}
      />
    </ChatProvider>
  );
};

const ProductManagementContent = ({
  isAddingProduct,
  setIsAddingProduct,
  editingProduct,
  setEditingProduct,
  products,
  addProduct,
  updateProduct,
  deleteProduct,
}) => {
  const { setIsAdminOnline } = useChat();
  const [activeTab, setActiveTab] = useState("orders"); // Add this state

  useEffect(() => {
    setIsAdminOnline(true);
    return () => setIsAdminOnline(false);
  }, [setIsAdminOnline]);

  // Updated handleAddProduct function for ProductManagement component
  const handleAddProduct = async (productData) => {
    try {
      // Log the form data
      console.log("Form data being submitted:");
      for (let [key, value] of productData.entries()) {
        console.log(key + ": " + value);
      }
      
      // Call the addProduct function from context which now uses the API
      await addProduct(productData);

      // Close the form modal
      setIsAddingProduct(false);

      // Show success message
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product: " + (error.message || "Unknown error"));
    }
  };

  // Updated handleEditProduct function for ProductManagement component
  const handleEditProduct = async (productData) => {
    try {
      // Use the API function to update the product
      await updateProduct(editingProduct.id, productData);

      // Close the edit modal
      setEditingProduct(null);

      // Show success message
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product: " + (error.message || "Unknown error"));
    }
  };

  // Updated handleDeleteProduct function for ProductManagement component
  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        // Use the API function to delete the product
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
      } catch (error) {
        console.error("Error deleting product:", error);
        alert(
          "Failed to delete product: " + (error.message || "Unknown error")
        );
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage Orders and Products
          </p>
        </div>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="bg-green-600 text-white px-2 py-2 text-sm rounded hover:bg-green-700 mt-2 sm:mt-0 w-full sm:w-auto"
        >
          Add New Product
        </button>
      </div>

      {/* Tab Navigation - Scrollable on mobile */}
      <div className="mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="flex min-w-full whitespace-nowrap" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("orders")}
            className={`${
              activeTab === "orders"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }
            whitespace-nowrap py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0`}
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
            whitespace-nowrap py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`${
              activeTab === "vendors"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }
            whitespace-nowrap py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0`}
          >
            Vendors
          </button>
          <button
            onClick={() => setActiveTab("affiliates")}
            className={`${
              activeTab === "affiliates"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }
            whitespace-nowrap py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0`}
          >
            Affiliates
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "orders" ? (
        <OrderManagementSection />
      ) : activeTab === "products" ? (
        <>
          <div className="mb-4 text-gray-600 text-sm">
            Total Products: {products.length}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <ProductList
              products={products}
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
            />
          </div>
        </>
      ) : activeTab === "vendors" ? (
        <VendorManagement />
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="min-w-full md:min-w-0">
            <AffiliateManagement />
          </div>
        </div>
      )}

      {/* Product Form Modal - Improved for mobile */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto z-[60]">
          <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-2xl my-4 sm:my-8">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setIsAddingProduct(false);
                  setEditingProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>
            <div className="max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
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
        </div>
      )}

      {/* Admin Chat View */}
      <AdminChatView />
    </div>
  );
};

export default ProductManagement;
