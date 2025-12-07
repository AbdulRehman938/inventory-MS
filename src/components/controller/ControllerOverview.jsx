import React, { useState, useEffect } from "react";
import {
  MdSearch,
  MdFilterList,
  MdImage,
  MdArrowUpward,
  MdArrowDownward,
  MdQrCodeScanner,
} from "react-icons/md";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-toastify";
import FilterDropdown from "../FilterDropdown";
import { getCategoryColor } from "../../utils/categoryColors";
import CustomerDetailsModal from "./CustomerDetailsModal";
import BarcodeScannerModal from "./BarcodeScannerModal";
import CheckoutSummaryModal from "./CheckoutSummaryModal";

const ControllerOverview = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory_stocks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStocks(data || []);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      toast.error("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedStocks = stocks
    .filter((stock) => {
      const matchesSearch =
        stock.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.brand?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterCategory === "all" || stock.category === filterCategory;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Convert to lowercase for string comparison
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const categories = [
    ...new Set(stocks.map((s) => s.category).filter(Boolean)),
  ];

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <MdArrowUpward className="w-4 h-4" />
    ) : (
      <MdArrowDownward className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleCustomerNext = (data) => {
    setCustomerData(data);
    setShowCustomerModal(false);
    setShowScannerModal(true);
  };

  const handleScanComplete = (items) => {
    setScannedItems(items);
    setShowScannerModal(false);
    setShowCheckoutModal(true);
  };

  const handleCheckoutClose = () => {
    setShowCheckoutModal(false);
    setCustomerData(null);
    setScannedItems([]);
    // Refresh stock data
    fetchStocks();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section with Scan Button */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome, Controller
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor inventory operations and view stock levels (Read-only access)
            </p>
          </div>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <MdQrCodeScanner className="w-6 h-6" />
            Start Scanning
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name, SKU, barcode, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <MdFilterList className="text-gray-600 dark:text-gray-400 w-5 h-5" />
            <FilterDropdown
              value={filterCategory}
              onChange={setFilterCategory}
              categories={categories}
            />
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Inventory Items ({filteredAndSortedStocks.length})
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View-only access • Click column headers to sort
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900">
              <tr>
                <th
                  onClick={() => handleSort("product_name")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Product <SortIcon field="product_name" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("sku")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    SKU / Barcode <SortIcon field="sku" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Category <SortIcon field="category" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("brand")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Brand <SortIcon field="brand" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("quantity")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Quantity <SortIcon field="quantity" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("unit_price")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Price <SortIcon field="unit_price" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Supplier
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredAndSortedStocks.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No stock items found
                  </td>
                </tr>
              ) : (
                filteredAndSortedStocks.map((stock) => (
                  <tr
                    key={stock.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {stock.image_url ? (
                          <img
                            src={stock.image_url}
                            alt={stock.product_name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                            <MdImage className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {stock.product_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {stock.product_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {stock.sku}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.barcode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          getCategoryColor(stock.category).bg
                        } ${getCategoryColor(stock.category).text} ${
                          getCategoryColor(stock.category).border
                        }`}
                      >
                        {stock.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stock.brand}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          stock.quantity === 0
                            ? "text-red-600 dark:text-red-400"
                            : stock.quantity < 10
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {stock.quantity}
                      </div>
                      {stock.expiry_date && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Exp: {stock.expiry_date}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        ${stock.unit_price?.toFixed(2)}
                      </div>
                      {stock.cost_price && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Cost: ${stock.cost_price.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stock.supplier_name}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCustomerModal && (
        <CustomerDetailsModal
          onClose={() => setShowCustomerModal(false)}
          onNext={handleCustomerNext}
        />
      )}

      {showScannerModal && customerData && (
        <BarcodeScannerModal
          onClose={() => setShowScannerModal(false)}
          onComplete={handleScanComplete}
          customerData={customerData}
        />
      )}

      {showCheckoutModal && customerData && scannedItems.length > 0 && (
        <CheckoutSummaryModal
          onClose={handleCheckoutClose}
          customerData={customerData}
          scannedItems={scannedItems}
        />
      )}
    </div>
  );
};

export default ControllerOverview;
