import { supabase } from "../lib/supabaseClient";

/**
 * Log controller login activity
 * @param {string} userEmail - User's email
 * @param {string} userName - User's full name
 * @returns {Promise<{success: boolean, logId?: string, message?: string}>}
 */
export const logControllerLogin = async (userEmail, userName) => {
  try {
    const { data, error } = await supabase.rpc("log_controller_login", {
      p_user_email: userEmail,
      p_user_name: userName,
    });

    if (error) {
      console.error("Error logging controller login:", error);
      return { success: false, message: error.message };
    }

    // Store the log ID in sessionStorage for logout tracking
    if (data) {
      sessionStorage.setItem("activityLogId", data);
      console.log("✅ Controller login logged:", { logId: data, userEmail });
    }

    return { success: true, logId: data };
  } catch (error) {
    console.error("Error in logControllerLogin:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Log controller logout activity
 * @param {string} logId - The activity log ID from login
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const logControllerLogout = async (logId) => {
  try {
    if (!logId) {
      console.warn("No activity log ID found for logout");
      return { success: false, message: "No activity log ID" };
    }

    const { data, error } = await supabase.rpc("log_controller_logout", {
      p_log_id: logId,
    });

    if (error) {
      console.error("Error logging controller logout:", error);
      return { success: false, message: error.message };
    }

    // Clear the log ID from sessionStorage
    sessionStorage.removeItem("activityLogId");
    console.log("✅ Controller logout logged:", { logId });

    return { success: true };
  } catch (error) {
    console.error("Error in logControllerLogout:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Get controller activity logs (for admin view)
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
export const getControllerActivityLogs = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from("controller_activity_log")
      .select("*")
      .order("login_time", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching activity logs:", error);
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getControllerActivityLogs:", error);
    return { success: false, message: error.message };
  }
};
