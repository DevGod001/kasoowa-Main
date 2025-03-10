// src/components/affiliate/AffiliateDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAffiliate } from "../../contexts/AffiliateContext";
import {
  ArrowUpCircle,
  ShoppingBag,
  Share2,
  DollarSign,
  Users,
  BarChart,
  Clock,
  Clipboard,
} from "lucide-react";

const AffiliateDashboard = () => {
  const {
    affiliateData,
    loading,
    earnings,
    pendingAmount,
    selectedProducts,
    storeUrl,
    isAffiliate,
    isPending,
    getMonthlyData,
  } = useAffiliate();

  const navigate = useNavigate();
  const { logout } = useAuth();

  // Redirect to pending page if affiliate status is pending
  useEffect(() => {
    if (isPending && !loading) {
      navigate('/affiliate/pending');
    }
  }, [isPending, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/affiliate/auth");
  };

  const [monthlyData, setMonthlyData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [visitorStats, setVisitorStats] = useState({
    total: 0,
    uniqueVisitors: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    if (isAffiliate) {
      try {
        // Get real monthly sales data
        const monthData = getMonthlyData();
        
        // Manually calculate the commission as 1% of sales if it's missing
        const fixedMonthData = monthData.map(month => ({
          ...month,
          commission: month.commission || (month.sales * 0.01)
        }));
        
        setMonthlyData(fixedMonthData);
      } catch (error) {
        console.error('Error loading monthly data:', error);
        setMonthlyData([]);
      }

      // Get real sales data
      try {
        const allOrders = JSON.parse(localStorage.getItem('kasoowaOrders') || '[]');
        // Filter orders that were referred by this affiliate
        const affiliateOrders = allOrders.filter(order => order.affiliateId === affiliateData.id);
        // Sort by date (most recent first) and limit to 5
        const sortedOrders = affiliateOrders
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
        
        // Map to the format we need
        const salesData = sortedOrders.map(order => {
          // Check if order.items exists and has at least one item
          const productId = order.items && order.items.length > 0 ? order.items[0]?.productId : null;
          
          // Find the product in selectedProducts or from all available products
          let product = null;
          if (productId && selectedProducts) {
            product = selectedProducts.find(p => p.id === productId);
          }
          
          // If product wasn't found in selectedProducts, use a default object with essential properties
          if (!product) {
            product = {
              id: productId || 'unknown',
              title: 'Product',
              imageUrl: null,
              price: 0
            };
          }
          
          // Ensure we have valid numeric values for amount and commission
          const orderTotal = typeof order.total === 'number' ? order.total : 0;
          
          return {
            id: order.id || `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            product: product,
            amount: orderTotal,
            commission: orderTotal * 0.01, // 1% commission
            date: order.date || new Date().toISOString()
          };
        });
        
        setRecentSales(salesData);
      } catch (error) {
        console.error('Error loading recent sales:', error);
        setRecentSales([]);
      }

      // Get real visitor stats
      try {
        // In a real app, this would come from analytics
        // For now, we'll get it from localStorage if available
        const storeVisits = JSON.parse(localStorage.getItem(`affiliateVisits_${affiliateData.id}`) || '[]');
        const totalVisits = storeVisits.length;
        
        // Count unique visitors by IP or user ID
        const uniqueVisitors = new Set(storeVisits.map(visit => visit.visitorId)).size;
        
        // Count conversions (visitors who made a purchase)
        const conversions = storeVisits.filter(visit => visit.madePurchase).length;
        const conversionRate = totalVisits > 0 ? (conversions / totalVisits * 100).toFixed(2) : 0;
        
        setVisitorStats({
          total: totalVisits,
          uniqueVisitors: uniqueVisitors,
          conversionRate: conversionRate
        });
      } catch (error) {
        console.error('Error loading visitor stats:', error);
        setVisitorStats({
          total: 0,
          uniqueVisitors: 0,
          conversionRate: 0
        });
      }
    }
  }, [isAffiliate, selectedProducts, getMonthlyData, affiliateData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Modified section - show a welcome screen instead of redirecting
  if (!isAffiliate || !affiliateData) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to the Affiliate Dashboard
          </h1>

          {isPending ? (
            <div className="mb-6">
              <p className="text-yellow-600 mb-2">
                Your affiliate application is currently under review.
              </p>
              <p className="text-gray-600">
                We'll notify you once it's approved. In the meantime, thank you for your patience.
              </p>
              <Link
                to="/affiliate/pending"
                className="mt-4 inline-block px-4 py-2 bg-yellow-500 text-white rounded"
              >
                View Application Status
              </Link>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You don't have an active affiliate account yet. Apply now to
                start earning commissions!
              </p>
              <Link
                to="/affiliate/register"
                className="mt-2 inline-block px-4 py-2 bg-green-600 text-white rounded"
              >
                Apply to Become an Affiliate
              </Link>
            </div>
          )}

          <div className="mt-8 p-6 bg-gray-50 rounded-lg text-left">
            <h2 className="text-lg font-semibold mb-4">
              Affiliate Program Benefits:
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Earn 1% commission on all sales referred through your store
              </li>
              <li>Create your own personalized storefront</li>
              <li>Select products you want to promote</li>
              <li>Track your earnings in real-time</li>
              <li>Withdraw earnings directly to your bank account</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Original dashboard UI for approved affiliates
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
        <p className="text-gray-600">
          Welcome back, {affiliateData.fullName || affiliateData.userName}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Available Earnings
              </h3>
              <p className="text-xl sm:text-2xl font-bold">
                ₦
                {(earnings || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <Link
                to="/affiliate/wallet"
                className="text-green-600 text-sm hover:underline mt-2 inline-block"
              >
                Withdraw Funds
              </Link>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 p-1 bg-green-50 rounded-full" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Pending Earnings
              </h3>
              <p className="text-xl sm:text-2xl font-bold">
                ₦
                {(pendingAmount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                From {selectedProducts?.length || 0} products
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 p-1 bg-yellow-50 rounded-full" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Visitors</h3>
              <p className="text-xl sm:text-2xl font-bold">{visitorStats?.total || 0}</p>
              <p className="text-sm text-gray-500 mt-2">
                Conversion: {visitorStats?.conversionRate || 0}%
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600 p-1 bg-blue-50 rounded-full" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Store URL</h3>
              <p className="text-md font-medium truncate max-w-[180px] sm:max-w-[220px]">
                {storeUrl || ""}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(storeUrl || "");
                  alert("Store URL copied to clipboard");
                }}
                className="text-green-600 text-sm hover:underline mt-2 inline-block"
              >
                Copy Link
              </button>
            </div>
            <Share2 className="h-8 w-8 text-purple-600 p-1 bg-purple-50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Link
              to="/affiliate/products"
              className="flex flex-col items-center justify-center p-2 sm:p-4 border rounded-lg hover:bg-gray-50"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm">Add Products</span>
            </Link>

            <Link
              to={storeUrl || "#"}
              className="flex flex-col items-center justify-center p-2 sm:p-4 border rounded-lg hover:bg-gray-50"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm">View Store</span>
            </Link>

            <Link
              to="/affiliate/wallet"
              className="flex flex-col items-center justify-center p-2 sm:p-4 border rounded-lg hover:bg-gray-50"
            >
              <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm">Withdraw</span>
            </Link>

            <Link
              to="/affiliate/settings"
              className="flex flex-col items-center justify-center p-2 sm:p-4 border rounded-lg hover:bg-gray-50"
            >
              <Clipboard className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sales Chart and Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold">Monthly Earnings</h2>
              <BarChart className="h-5 w-5 text-gray-400" />
            </div>

            {monthlyData && monthlyData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 text-xs sm:text-sm">Month</th>
                      <th className="text-right pb-2 text-xs sm:text-sm">Sales</th>
                      <th className="text-right pb-2 text-xs sm:text-sm">Orders</th>
                      <th className="text-right pb-2 text-xs sm:text-sm">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((month, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 sm:py-3 text-xs sm:text-sm">{month.month || ""}</td>
                        <td className="text-right py-2 sm:py-3 text-xs sm:text-sm">
                          ₦
                          {(month.sales || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-right py-2 sm:py-3 text-xs sm:text-sm">{month.orders || 0}</td>
                        <td className="text-right py-2 sm:py-3 font-medium text-green-600 text-xs sm:text-sm">
                          ₦
                          {(month.commission || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded">
                <p className="text-gray-500 text-sm">No sales data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Sales</h2>

            {recentSales && recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-start border-b pb-3">
                    <div className="w-10 h-10 flex-shrink-0 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                      {sale.product && sale.product.imageUrl ? (
                        <img
                          src={sale.product.imageUrl}
                          alt={(sale.product && sale.product.title) || "Product"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = "/placeholder-image.jpg"; // Fallback to local placeholder
                            // Also add a product icon as backup if local placeholder fails
                            if (!e.target.src) {
                              e.target.parentNode.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"></path><path d="M8 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"></path></svg></div>`;
                            }
                          }}
                          style={{ minHeight: "40px" }} // Ensure minimum dimensions
                        />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-gray-400" /> // Show icon if no image
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0"> {/* Added min-width to prevent shrinking */}
                      <p className="font-medium text-xs sm:text-sm truncate">
                        {(sale.product && sale.product.title) || "Product"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        ₦
                        {(sale.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        Commission: ₦
                        {(sale.commission || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {sale.date ? new Date(sale.date).toLocaleDateString() : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No recent sales</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Share your store link to start earning
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Products - Reduced Image Size */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Featured Products</h2>
            <Link
              to="/affiliate/products"
              className="text-green-600 text-xs sm:text-sm hover:underline"
            >
              Manage Products
            </Link>
          </div>

          {selectedProducts && selectedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {selectedProducts.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="h-16 sm:h-20 bg-gray-200 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder-image.jpg";
                          if (!e.target.src) {
                            e.target.parentNode.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"></path><path d="M8 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"></path></svg></div>`;
                          }
                        }}
                      />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-xs truncate">
                      {product.title || "Product"}
                    </h3>
                    <p className="text-gray-600 text-xs">
                      ₦
                      {(
                        (product.variants && product.variants.length > 0
                          ? parseFloat(product.variants[0].price || 0)
                          : parseFloat(product.price || 0)) || 0
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Commission: ₦
                      {(
                        (
                          (product.variants && product.variants.length > 0
                            ? parseFloat(product.variants[0].price || 0)
                            : parseFloat(product.price || 0)) || 0
                        ) * 0.01
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-gray-500 text-sm">No products in your store yet</p>
              <Link
                to="/affiliate/products"
                className="mt-2 inline-block px-4 py-2 bg-green-600 text-white rounded-md text-sm"
              >
                Add Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;