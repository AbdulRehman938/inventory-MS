import React, { useState, useEffect } from "react";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdFilterList,
  MdWarning,
  MdTrendingUp,
  MdTrendingDown,
  MdInventory,
  MdClose,
  MdUpload,
  MdDownload,
  MdImage,
} from "react-icons/md";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import CategoryDropdown from "./CategoryDropdown";
import DeleteItemModal from "./DeleteItemModal";
import FilterDropdown from "../FilterDropdown";
import { getCategoryColor } from "../../utils/categoryColors";
import { generateBarcodesPDF } from "../../utils/barcodeGenerator";

const StockManagement = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [bulkData, setBulkData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    product_name: "",
    category: "",
    brand: "",
    quantity: 0,
    unit_price: 0,
    cost_price: 0,
    expiry_date: "",
    supplier_name: "",
    description: "",
    image_url: "",
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      console.log("🔵 [FETCH STOCKS] Starting fetch...");

      // Check authentication state
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      console.log("🔵 [FETCH STOCKS] Current user:", user);
      console.log("🔵 [FETCH STOCKS] User ID:", user?.id);
      console.log("🔵 [FETCH STOCKS] Auth error:", authError);

      if (!user) {
        console.error("❌ [FETCH STOCKS] No authenticated user found!");
        toast.error("Please log in to view stock data");
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("inventory_stocks")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("🔵 [FETCH STOCKS] Response - Data:", data);
      console.log("🔵 [FETCH STOCKS] Response - Error:", error);
      console.log("🔵 [FETCH STOCKS] Data count:", data?.length || 0);

      if (error) {
        console.error("❌ [FETCH STOCKS] Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      setStocks(data || []);
      console.log(
        "✅ [FETCH STOCKS] State updated with",
        data?.length || 0,
        "items"
      );
    } catch (error) {
      console.error("❌ [FETCH STOCKS] Error fetching stocks:", error);
      toast.error("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();

    try {
      const rpcParams = {
        p_product_name: formData.product_name,
        p_category: formData.category,
        p_brand: formData.brand,
        p_quantity: parseInt(formData.quantity),
        p_unit_price: parseFloat(formData.unit_price),
        p_cost_price: formData.cost_price
          ? parseFloat(formData.cost_price)
          : null,
        p_expiry_date: formData.expiry_date || null,
        p_supplier_name: formData.supplier_name,
        p_description: formData.description || "",
        p_image_url: formData.image_url || null,
      };

      console.log("🔵 [ADD STOCK] Sending RPC params:", rpcParams);

      const { data, error } = await supabase.rpc("add_stock_item", rpcParams);

      console.log("🔵 [ADD STOCK] RPC Response - Data:", data);
      console.log("🔵 [ADD STOCK] RPC Response - Error:", error);

      if (error) {
        console.error("❌ [ADD STOCK] Supabase RPC Error:", error);
        throw error;
      }

      // Check if data was actually returned (RPC returns an array)
      if (!data || data.length === 0) {
        console.error("❌ [ADD STOCK] No data returned from database");
        throw new Error("No data returned from database");
      }

      // Get the newly inserted item from the RPC response
      const newStockItem = data[0];
      console.log("✅ [ADD STOCK] New item received:", newStockItem);

      // Update local state immediately with the new item (prepend to the list)
      setStocks((prevStocks) => {
        console.log(
          "🔵 [ADD STOCK] Updating local state. Previous count:",
          prevStocks.length
        );
        return [newStockItem, ...prevStocks];
      });

      toast.success("Stock item added successfully!");
      setShowAddModal(false);
      resetForm();

      // Refresh data from database to ensure consistency
      console.log("🔵 [ADD STOCK] Refreshing data from database...");
      await fetchStocks();
    } catch (error) {
      console.error("❌ [ADD STOCK] Error adding stock:", error);
      toast.error(
        `Failed to add stock item: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleBulkUpload = async () => {
    if (bulkData.length === 0) {
      toast.error("Please upload a file first");
      return;
    }

    try {
      setUploadProgress(0);
      const totalItems = bulkData.length;
      let successCount = 0;
      let failCount = 0;
      const addedItems = []; // Collect successfully added items

      for (let i = 0; i < bulkData.length; i++) {
        try {
          const item = bulkData[i];
          const { data, error } = await supabase.rpc("add_stock_item", {
            p_product_name: item.product_name,
            p_category: item.category,
            p_brand: item.brand,
            p_quantity: item.quantity,
            p_unit_price: item.unit_price,
            p_cost_price: item.cost_price || null,
            p_expiry_date: item.expiry_date || null,
            p_supplier_name: item.supplier_name,
            p_description: item.description || "",
            p_image_url: item.image_url || null,
          });

          if (error) {
            failCount++;
            console.error(`Failed to add item ${i + 1}:`, error);
          } else if (data && data.length > 0) {
            successCount++;
            addedItems.push(data[0]); // Collect the successfully added item
          }
        } catch (err) {
          failCount++;
          console.error(`Error processing item ${i + 1}:`, err);
        }

        setUploadProgress(((i + 1) / totalItems) * 100);
      }

      // Update local state with all successfully added items
      if (addedItems.length > 0) {
        setStocks((prevStocks) => [...addedItems, ...prevStocks]);
      }

      toast.success(
        `Bulk upload completed! Success: ${successCount}, Failed: ${failCount}`
      );
      setShowBulkUploadModal(false);
      setBulkData([]);
      setUploadProgress(0);

      // Refresh data from database
      await fetchStocks();
    } catch (error) {
      console.error("Error during bulk upload:", error);
      toast.error("Bulk upload failed");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform data
        const validatedData = jsonData.map((row) => ({
          product_name: row.product_name || "",
          category: row.category || "",
          brand: row.brand || "",
          quantity: parseInt(row.quantity) || 0,
          unit_price: parseFloat(row.unit_price) || 0,
          cost_price: parseFloat(row.cost_price) || 0,
          expiry_date: row.expiry_date || "",
          supplier_name: row.supplier_name || "",
          description: row.description || "",
          image_url: row.image_url || "",
        }));

        setBulkData(validatedData);
        toast.success(`Loaded ${validatedData.length} items from file`);
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error("Failed to read file. Please check the format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      {
        product_name: "Example Product",
        category: "Grocery",
        brand: "Example Brand",
        quantity: 100,
        unit_price: 10.99,
        cost_price: 8.5,
        expiry_date: "2025-12-31",
        supplier_name: "ABC Suppliers",
        description: "Product description here",
        image_url: "https://example.com/image.jpg",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Template");
    XLSX.writeFile(workbook, "stock_upload_template.xlsx");
    toast.success("Template downloaded successfully!");
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("inventory_stocks")
        .update(formData)
        .eq("id", selectedStock.id);

      if (error) throw error;

      toast.success("Stock updated successfully!");
      setShowEditModal(false);
      setSelectedStock(null);
      resetForm();
      fetchStocks();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    }
  };

  const openDeleteModal = (stock) => {
    setItemToDelete(stock);
    setShowDeleteModal(true);
  };

  const handleDeleteStock = async () => {
    if (!itemToDelete) return;

    try {
      console.log(
        "🔴 [DELETE STOCK] Deleting item:",
        itemToDelete.product_name
      );

      const { error } = await supabase
        .from("inventory_stocks")
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;

      console.log("✅ [DELETE STOCK] Item deleted successfully");
      toast.success("Stock item deleted successfully!");

      // Close modal and reset
      setShowDeleteModal(false);
      setItemToDelete(null);

      // Refresh data
      await fetchStocks();
    } catch (error) {
      console.error("❌ [DELETE STOCK] Error deleting stock:", error);
      toast.error("Failed to delete stock item");
    }
  };

  const handleDeleteAll = async () => {
    // Validation checks
    if (deleteConfirmText !== "DELETE ALL STOCKS") {
      toast.error("Please type 'DELETE ALL STOCKS' to confirm");
      return;
    }

    if (!deleteConfirmChecked) {
      toast.error("Please check the confirmation checkbox");
      return;
    }

    try {
      console.log("🔴 [DELETE ALL] Starting deletion of all stocks...");

      const { error } = await supabase
        .from("inventory_stocks")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

      if (error) {
        console.error("❌ [DELETE ALL] Error:", error);
        throw error;
      }

      console.log("✅ [DELETE ALL] All stocks deleted successfully");

      // Reset state
      setStocks([]);
      setShowDeleteAllModal(false);
      setDeleteConfirmText("");
      setDeleteConfirmChecked(false);

      toast.success("All stock items deleted successfully!");
      fetchStocks(); // Refresh to confirm
    } catch (error) {
      console.error("Error deleting all stocks:", error);
      toast.error("Failed to delete all stock items");
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      category: "",
      brand: "",
      quantity: 0,
      unit_price: 0,
      cost_price: 0,
      expiry_date: "",
      supplier_name: "",
      description: "",
      image_url: "",
    });
  };

  const openEditModal = (stock) => {
    setSelectedStock(stock);
    setFormData({
      product_name: stock.product_name,
      category: stock.category,
      brand: stock.brand,
      quantity: stock.quantity,
      unit_price: stock.unit_price,
      cost_price: stock.cost_price,
      expiry_date: stock.expiry_date || "",
      supplier_name: stock.supplier_name,
      description: stock.description,
      image_url: stock.image_url || "",
    });
    setShowEditModal(true);
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.brand?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterCategory === "all" || stock.category === filterCategory;

    return matchesSearch && matchesFilter;
  });

  const categories = [
    ...new Set(stocks.map((s) => s.category).filter(Boolean)),
  ];

  const stats = {
    total: stocks.length,
    totalValue: stocks.reduce(
      (sum, s) => sum + (s.quantity * s.unit_price || 0),
      0
    ),
    lowStock: stocks.filter((s) => s.quantity < 10).length,
    outOfStock: stocks.filter((s) => s.quantity === 0).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Stock Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage inventory stock levels and track movements
          </p>
        </div>
        <div className="flex gap-3">
          {selectedItems.length > 0 && (
            <button
              onClick={() => {
                const itemsToDownload = stocks.filter((s) =>
                  selectedItems.includes(s.id)
                );
                generateBarcodesPDF(itemsToDownload);
                toast.success(`Downloaded ${selectedItems.length} QR code(s)`);
              }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <MdDownload className="w-5 h-5" />
              Download QR Codes ({selectedItems.length})
            </button>
          )}
          {stocks.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <MdDelete className="w-5 h-5" />
              Delete All
            </button>
          )}
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MdUpload className="w-5 h-5" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Add Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Items
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <MdInventory className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Value
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                ${stats.totalValue.toFixed(2)}
              </p>
            </div>
            <MdTrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Low Stock
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {stats.lowStock}
              </p>
            </div>
            <MdWarning className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Out of Stock
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.outOfStock}
              </p>
            </div>
            <MdTrendingDown className="w-8 h-8 text-red-500" />
          </div>
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      filteredStocks.length > 0 &&
                      selectedItems.length === filteredStocks.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredStocks.map((s) => s.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU / Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              key={`stocks-${stocks.length}`}
              className="divide-y divide-gray-200 dark:divide-slate-700"
            >
              {filteredStocks.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No stock items found
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr
                    key={stock.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(stock.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, stock.id]);
                          } else {
                            setSelectedItems(
                              selectedItems.filter((id) => id !== stock.id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(stock)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(stock)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <MdDelete className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Stock Form Component */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {showAddModal ? "Add Stock Item" : "Edit Stock Item"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedStock(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={showAddModal ? handleAddStock : handleUpdateStock}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <CategoryDropdown
                  value={formData.category}
                  onChange={(category) =>
                    setFormData({ ...formData, category })
                  }
                  categories={categories}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit Price (Selling) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cost Price (Purchase)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date (if perishable)
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplier_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplier_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {showAddModal && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> SKU, Barcode, and Product ID will be
                    automatically generated when you add this item.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedStock(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {showAddModal ? "Add Stock Item" : "Update Stock Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-3xl w-full">
            <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Bulk Upload Stock Items
              </h2>
              <button
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setBulkData([]);
                  setUploadProgress(0);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Step 1: Download Template
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  Download the Excel template and fill in your stock data.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <MdDownload className="w-5 h-5" />
                  Download Template
                </button>
              </div>

              {/* Upload File */}
              <div className="bg-gray-50 dark:bg-slate-900/20 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Step 2: Upload Filled Template
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Upload your Excel file with stock data.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-900 dark:text-white
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700
                    file:cursor-pointer cursor-pointer
                    border border-gray-300 dark:border-slate-600 rounded-lg
                    bg-white dark:bg-slate-700"
                />
              </div>

              {/* Preview Data */}
              {bulkData.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Preview
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                    {bulkData.length} items ready to upload
                  </p>
                  <div className="max-h-40 overflow-auto text-xs text-green-700 dark:text-green-300">
                    {bulkData.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="py-1">
                        • {item.product_name} - {item.brand} - Qty:{" "}
                        {item.quantity}
                      </div>
                    ))}
                    {bulkData.length > 5 && (
                      <div className="py-1">
                        ... and {bulkData.length - 5} more items
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Uploading...</span>
                    <span>{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Info Note */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> SKU, Barcode, and Product ID will
                  be automatically generated for each item during upload.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkData([]);
                    setUploadProgress(0);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={bulkData.length === 0 || uploadProgress > 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <MdUpload className="w-5 h-5" />
                  Upload {bulkData.length} Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Delete Modal */}
      <DeleteItemModal
        item={itemToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteStock}
      />

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <MdWarning className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                  Delete All Stock Items
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeleteConfirmText("");
                  setDeleteConfirmChecked(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning Message */}
              <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 p-4 rounded">
                <div className="flex items-start gap-3">
                  <MdWarning className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
                      ⚠️ DANGER: This action cannot be undone!
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      You are about to permanently delete{" "}
                      <strong>ALL {stocks.length} stock items</strong> from the
                      database. This will:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
                      <li>Remove all product records</li>
                      <li>Delete all inventory data</li>
                      <li>Clear all stock history</li>
                      <li>This action is IRREVERSIBLE</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 1: Type Confirmation */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Step 1: Type{" "}
                  <span className="font-mono bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded text-red-600 dark:text-red-400">
                    DELETE ALL STOCKS
                  </span>{" "}
                  to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type here..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {deleteConfirmText &&
                  deleteConfirmText !== "DELETE ALL STOCKS" && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      ❌ Text doesn't match. Please type exactly: DELETE ALL
                      STOCKS
                    </p>
                  )}
                {deleteConfirmText === "DELETE ALL STOCKS" && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✅ Text confirmed
                  </p>
                )}
              </div>

              {/* Step 2: Checkbox Confirmation */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteConfirmChecked}
                    onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Step 2:</strong> I understand that this action will
                    permanently delete all {stocks.length} stock items and
                    cannot be undone. I take full responsibility for this
                    action.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setDeleteConfirmText("");
                    setDeleteConfirmChecked(false);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={
                    deleteConfirmText !== "DELETE ALL STOCKS" ||
                    !deleteConfirmChecked
                  }
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <MdDelete className="w-5 h-5" />
                  Delete All {stocks.length} Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
