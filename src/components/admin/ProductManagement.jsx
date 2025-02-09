// src/components/admin/ProductManagement.jsx
import React, { useState, useEffect } from "react";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import AdminChatView from "./AdminChatView";
import OrderManagementSection from "./OrderManagementSection"; // Add this import
import { useProducts } from "../../contexts/ProductContext";
import { ChatProvider } from "../../contexts/ChatContext";
import { useChat } from "../../contexts/ChatContext";

const ProductManagement = () => {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { products, setProducts } = useProducts();

  return (
    <ChatProvider>
      <ProductManagementContent
        isAddingProduct={isAddingProduct}
        setIsAddingProduct={setIsAddingProduct}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        products={products}
        setProducts={setProducts}
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
  setProducts,
}) => {
  const { setIsAdminOnline } = useChat();
  const [activeTab, setActiveTab] = useState("orders"); // Add this state

  useEffect(() => {
    setIsAdminOnline(true);
    return () => setIsAdminOnline(false);
  }, [setIsAdminOnline]);

  const handleAddProduct = async (productData) => {
    try {
      // Handle main product image
      const imageFile = productData.get("image");
      let imageUrl = null;

      if (imageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imageFile);
        });
      }

      // Handle variant images
      const variantImages = {};
      let variants = JSON.parse(productData.get("variants") || "[]");

      // Process each variant's image
      for (const variant of variants) {
        if (variant.imageKey) {
          const variantImageFile = productData.get(variant.imageKey);
          if (variantImageFile) {
            const reader = new FileReader();
            const variantImageUrl = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(variantImageFile);
            });
            variantImages[variant.id] = variantImageUrl;
          }
        }
      }

      // Update variants with their image URLs
      variants = variants.map((variant) => ({
        ...variant,
        imageUrl: variantImages[variant.id] || null,
        imageKey: undefined, // Remove the temporary imageKey
      }));

      const newProduct = {
        id: Date.now().toString(),
        title: productData.get("title"),
        description: productData.get("description"),
        category: productData.get("category"),
        variants: variants,
        imageUrl: imageUrl,
      };

      setProducts((prevProducts) => {
        const updatedProducts = [...prevProducts, newProduct];
        localStorage.setItem(
          "kasoowaProducts",
          JSON.stringify(updatedProducts)
        );
        return updatedProducts;
      });

      setIsAddingProduct(false);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      // Handle main product image
      const imageFile = productData.get("image");
      let imageUrl = editingProduct.imageUrl;

      if (imageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imageFile);
        });
      }

      // Handle variant images
      const variantImages = {};
      let variants = JSON.parse(productData.get("variants") || "[]");

      // Process each variant's image
      for (const variant of variants) {
        if (variant.imageKey) {
          const variantImageFile = productData.get(variant.imageKey);
          if (variantImageFile) {
            const reader = new FileReader();
            const variantImageUrl = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(variantImageFile);
            });
            variantImages[variant.id] = variantImageUrl;
          }
        }
      }

      // Update variants with their image URLs
      variants = variants.map((variant) => ({
        ...variant,
        imageUrl: variantImages[variant.id] || variant.imageUrl || null,
        imageKey: undefined, // Remove the temporary imageKey
      }));

      const updatedProduct = {
        ...editingProduct,
        title: productData.get("title"),
        description: productData.get("description"),
        category: productData.get("category"),
        variants: variants,
        imageUrl: imageUrl,
      };

      setProducts((prevProducts) => {
        const updated = prevProducts.map((p) =>
          p.id === editingProduct.id ? updatedProduct : p
        );
        localStorage.setItem("kasoowaProducts", JSON.stringify(updated));
        return updated;
      });

      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    }
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        setProducts((prevProducts) => {
          const updatedProducts = prevProducts.filter(
            (p) => p.id !== productId
          );
          localStorage.setItem(
            "kasoowaProducts",
            JSON.stringify(updatedProducts)
          );
          return updatedProducts;
        });
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
      }
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage Orders and Products
          </p>
        </div>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Add New Product
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("orders")}
            className={`
              ${
                activeTab === "orders"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
            `}
          >
            Orders & Sales
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`
              ${
                activeTab === "products"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
            `}
          >
            Products
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "orders" ? (
        <OrderManagementSection />
      ) : (
        <>
          <div className="mb-4 text-gray-600">
            Total Products: {products.length}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProductList
                products={products}
                onEdit={setEditingProduct}
                onDelete={handleDeleteProduct}
              />
            </div>
          </div>
        </>
      )}

      {/* Product Form Modal */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-4">
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
            <div className="max-h-[80vh] overflow-y-auto">
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
