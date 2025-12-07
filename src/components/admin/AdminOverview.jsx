import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import {
  MdAttachMoney,
  MdShoppingCart,
  MdWarning,
  MdInventory,
  MdTrendingUp,
  MdArrowForward,
  MdCheckCircle,
} from "react-icons/md";
import {
  getDailySalesStats,
  getControllerActivityStats,
  getTopSellingItems,
  getInventoryStats,
  getDashboardSummary,
  getRecentTransactions,
  getLowStockItems,
} from "../../services/reportService";

const AdminOverview = () => {
  const [salesData, setSalesData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [topSellingData, setTopSellingData] = useState([]);
  const [stockLevelData, setStockLevelData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* State for Modals */
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [chartModal, setChartModal] = useState({
    open: false,
    type: null,
    title: null,
    data: [],
  });

  /* Modal Handlers */
  const handleViewAllTransactions = () => {
    setShowTxnModal(true);
  };

  const handleChartClick = (type, title, data) => {
    setChartModal({ open: true, type, title, data });
  };

  const closeChartModal = () => {
    setChartModal({ ...chartModal, open: false });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        sales,
        activity,
        topSelling,
        inventory,
        summary,
        recent,
        lowStock,
      ] = await Promise.all([
        getDailySalesStats(30),
        getControllerActivityStats(30),
        getTopSellingItems(),
        getInventoryStats(),
        getDashboardSummary(),
        getRecentTransactions(5),
        getLowStockItems(5),
      ]);

      if (sales.success) setSalesData(sales.data);
      if (activity.success) setActivityData(activity.data);
      if (topSelling.success) setTopSellingData(topSelling.data);
      if (inventory.success) {
        setStockLevelData(inventory.data.quantityGraph);
        setCategoryData(inventory.data.categoryGraph);
      }
      if (summary.success) setSummaryData(summary.data);
      if (recent.success) setRecentTxns(recent.data);
      if (lowStock.success) setLowStockItems(lowStock.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* 1. Header & Summary Cards */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Dashboard Overview
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Real-time insights and performance metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MdAttachMoney className="w-24 h-24 text-blue-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <MdAttachMoney className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Revenue
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                ${summaryData?.revenue?.toLocaleString() || "0"}
              </h3>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-2 font-medium">
                <MdTrendingUp /> +12% from last month
              </p>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MdShoppingCart className="w-24 h-24 text-purple-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <MdShoppingCart className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Orders
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {summaryData?.orders?.toLocaleString() || "0"}
              </h3>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-2 font-medium">
                <MdTrendingUp /> +5 new today
              </p>
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MdInventory className="w-24 h-24 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <MdInventory className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Products
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {summaryData?.products?.toLocaleString() || "0"}
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                Active in inventory
              </p>
            </div>
          </div>

          {/* Low Stock Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MdWarning className="w-24 h-24 text-amber-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                  <MdWarning className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Low Stock Alert
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {summaryData?.lowStock || "0"}
              </h3>
              <p className="text-xs text-amber-500 mt-2 font-medium">
                Items need reorder
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart (Wider) */}
        <div
          onClick={() =>
            handleChartClick("sales", "Sales & Revenue Trend", salesData)
          }
          className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow relative group"
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
            Click to expand
          </div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Sales & Revenue Trend
            </h3>
            <select
              onClick={(e) => e.stopPropagation()}
              className="text-sm border-gray-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300"
            >
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-80 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={salesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f5f5f5" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis
                  yAxisId="left"
                  fontSize={12}
                  orientation="left"
                  stroke="#3b82f6"
                />
                <YAxis
                  yAxisId="right"
                  fontSize={12}
                  orientation="right"
                  stroke="#10b981"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue ($)"
                  fill="url(#colorRevenue)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sales"
                  name="Orders"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Recent Transactions
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {recentTxns.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No recent activity
              </p>
            ) : (
              recentTxns.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <MdShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {txn.customer_name || "Guest"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Order #{txn.transaction_number?.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      ${txn.total_amount?.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(txn.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={handleViewAllTransactions}
            className="mt-4 w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            View All Transactions <MdArrowForward />
          </button>
        </div>
      </div>

      {/* 3. Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Top Selling */}
        <div
          onClick={() =>
            handleChartClick("topSelling", "Top Selling Items", topSellingData)
          }
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow relative group"
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
            Click to expand
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Top Selling Items
          </h3>
          <div className="h-64 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSellingData}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  fontSize={11}
                  interval={0}
                />
                <Bar
                  dataKey="quantity"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Dist */}
        <div
          onClick={() =>
            handleChartClick("category", "Inventory by Category", categoryData)
          }
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow relative group"
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
            Click to expand
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Inventory Categories
          </h3>
          <div className="h-64 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ left: 10, right: 30, top: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  opacity={0.1}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  fontSize={11}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="value"
                  name="Items"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock And Alerts */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Low Stock Alerts
            </h3>
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
              {lowStockItems.length} Items
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {lowStockItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <MdCheckCircle className="w-12 h-12 mb-2 text-green-500 opacity-50" />
                <p>Stock levels are healthy</p>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30"
                >
                  <div className="w-10 h-10 rounded bg-white p-1 flex items-center justify-center border border-gray-200">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <MdInventory className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-red-600 font-medium">
                      Only {item.quantity} left
                    </p>
                  </div>
                  <button className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
                    Restock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTxnModal && (
        <React.Suspense fallback={null}>
          <TransactionsModal onClose={() => setShowTxnModal(false)} />
        </React.Suspense>
      )}

      {chartModal.open && (
        <React.Suspense fallback={null}>
          <ChartDetailModal
            onClose={closeChartModal}
            title={chartModal.title}
            data={chartModal.data}
            type={chartModal.type}
          />
        </React.Suspense>
      )}
    </div>
  );
};

// Lazy load modals
const TransactionsModal = React.lazy(() =>
  import("./modals/TransactionsModal")
);
const ChartDetailModal = React.lazy(() => import("./modals/ChartDetailModal"));

export default AdminOverview;
