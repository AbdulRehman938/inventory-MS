import { supabase } from "../lib/supabaseClient";

/**
 * Fetch daily sales stats for the last N days
 */
export const getDailySalesStats = async (days = 30) => {
  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);

    const { data, error } = await supabase
      .from("sales_transactions")
      .select("created_at, total_amount, items_count")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Aggregate by date
    const dailyStats = {};
    data.forEach((txn) => {
      const date = new Date(txn.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!dailyStats[date]) {
        dailyStats[date] = { date, sales: 0, revenue: 0 };
      }
      dailyStats[date].sales += txn.items_count;
      dailyStats[date].revenue += txn.total_amount;
    });

    return { success: true, data: Object.values(dailyStats) };
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Fetch controller activity for graph
 */
export const getControllerActivityStats = async (days = 30) => {
  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);

    const { data, error } = await supabase
      .from("controller_activity_log")
      .select("login_time, user_name")
      .gte("login_time", startDate.toISOString());

    if (error) throw error;

    // Aggregate by hour of day to show "Schedule" heat map style or just raw counts per user
    // For a line chart: logins by date/time
    // For "Schedules": logins count by hour of day (0-23)
    const loginsByHour = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, count: 0 }));
    
    data.forEach(log => {
        const hour = new Date(log.login_time).getHours();
        loginsByHour[hour].count += 1;
    });

    return { success: true, data: loginsByHour };
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Fetch Top Selling Items
 */
export const getTopSellingItems = async () => {
  try {
    // We need to fetch all items because we can't aggregate easily without an RPC
    // Limit to recent 1000 items to avoid perf issues if large
    const { data, error } = await supabase
      .from("sales_items")
      .select("product_name, quantity, total_price")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) throw error;

    const stats = {};
    data.forEach(item => {
        if (!stats[item.product_name]) {
            stats[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
        }
        stats[item.product_name].quantity += item.quantity;
        stats[item.product_name].revenue += item.total_price;
    });

    const sorted = Object.values(stats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10); // Top 10

    return { success: true, data: sorted };
  } catch (error) {
    console.error("Error fetching top selling:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Fetch Inventory Stock Stats
 */
export const getInventoryStats = async () => {
  try {
    const { data, error } = await supabase
      .from("inventory_stocks")
      .select("product_name, quantity, category, cost_price, unit_price");

    if (error) throw error;

    // 1. Quantity per item (Top 20 low/high?) - Let's do top 15 by qty
    const quantityGraph = [...data]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 15)
        .map(i => ({ name: i.product_name, quantity: i.quantity }));

    // 2. Category Distribution
    const catStats = {};
    data.forEach(i => {
        const cat = i.category || "Uncategorized";
        if (!catStats[cat]) catStats[cat] = { name: cat, value: 0 };
        catStats[cat].value += 1;
    });
    
    // 3. Potential Profit vs Cost (Aggregate)
    // This is for "Sales and Loss" graph (maybe "Investment vs Potential Return")
    // Or we can use sales data for actual sales vs cost.
    // Let's use Inventory Valuation here.
    const valuation = {
        name: "Inventory Value",
        cost: data.reduce((sum, i) => sum + ((i.cost_price || 0) * i.quantity), 0),
        potential_revenue: data.reduce((sum, i) => sum + ((i.unit_price || 0) * i.quantity), 0)
    };
    
    return { 
        success: true, 
        data: {
            quantityGraph,
            categoryGraph: Object.values(catStats),
            valuation // Could be used, or we just rely on sales vs cost
        } 
    };
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return { success: false, message: error.message };
  }
};
export const getDashboardSummary = async () => {
  try {
    // 1. Total Revenue & Sales (All time or Month?) - Let's do All Time for simplicity or Month
    // For "Quick Stats", usually it's "Total Orders", "Total Revenue", "Low Stock", "Total Customers"
    
    // Total Revenue (approx from recent transactions if too large, or explicit aggregation)
    // We can just sum specific fields or fetch counts
    
    // A. Revenue & Orders
    const { data: sales, error: salesError } = await supabase
       .from("sales_transactions")
       .select("total_amount", { count: "exact" });
    
    // If thousands of rows, this is slow. But for this scale it's fine.
    // Summing locally:
    const totalRevenue = sales ? sales.reduce((sum, t) => sum + (t.total_amount || 0), 0) : 0;
    const totalOrders = sales ? sales.length : 0;

    // B. Low Stock Count
    const { count: lowStockCount, error: stockError } = await supabase
       .from("inventory_stocks")
       .select("*", { count: "exact", head: true })
       .lt("quantity", 10);

    // C. Total Products
    const { count: productCount } = await supabase
       .from("inventory_stocks")
       .select("*", { count: "exact", head: true });

    return {
        success: true,
        data: {
            revenue: totalRevenue,
            orders: totalOrders,
            lowStock: lowStockCount || 0,
            products: productCount || 0
        }
    };
  } catch (error) {
      console.error("Error fetching summary:", error);
      return { success: false, message: error.message };
  }
};

/**
 * Fetch Recent Transactions
 */
export const getRecentTransactions = async (limit = 5) => {
    try {
        const { data, error } = await supabase
            .from("sales_transactions")
            .select("id, transaction_number, total_amount, created_at, customer_name, payment_type")
            .order("created_at", { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching recent txns:", error);
        return { success: false, message: error.message };
    }
};

/**
 * Fetch Low Stock Items
 */
export const getLowStockItems = async (limit = 5) => {
    try {
        const { data, error } = await supabase
            .from("inventory_stocks")
            .select("id, product_name, quantity, sku, image_url")
            .lt("quantity", 10)
            .order("quantity", { ascending: true })
            .limit(limit);
            
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
         console.error("Error fetching low stock:", error);
         return { success: false, message: error.message };
    }
};

