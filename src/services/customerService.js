import { supabase } from "../lib/supabaseClient";

/**
 * Get all customer types
 */
export const getCustomerTypes = async () => {
  try {
    const { data, error } = await supabase
      .from("customer_types")
      .select("*")
      .order("type_name");

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching customer types:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Create a new customer type (admin only)
 */
export const createCustomerType = async (typeData) => {
  try {
    const { data, error } = await supabase
      .from("customer_types")
      .insert({
        type_name: typeData.type_name,
        discount_percentage: typeData.discount_percentage || 0,
        is_vip: typeData.is_vip || false,
        description: typeData.description || "",
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating customer type:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Update customer type (admin only)
 */
export const updateCustomerType = async (id, typeData) => {
  try {
    const { data, error } = await supabase
      .from("customer_types")
      .update({
        type_name: typeData.type_name,
        discount_percentage: typeData.discount_percentage,
        is_vip: typeData.is_vip,
        description: typeData.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error updating customer type:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete customer type (admin only)
 */
export const deleteCustomerType = async (id) => {
  try {
    const { error } = await supabase
      .from("customer_types")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting customer type:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Create or get customer
 */
export const createOrGetCustomer = async (customerData) => {
  try {
    // Check if customer exists by name
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("customer_name", customerData.customer_name)
      .maybeSingle();

    if (existing) {
      // Update visit count
      const { data, error } = await supabase
        .from("customers")
        .update({
          total_visits: existing.total_visits + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }

    // Create new customer
    const { data, error } = await supabase
      .from("customers")
      .insert({
        customer_name: customerData.customer_name,
        customer_type_id: customerData.customer_type_id,
        customer_type_name: customerData.customer_type_name,
        is_vip: customerData.is_vip || false,
        phone: customerData.phone || null,
        email: customerData.email || null,
        total_visits: 1,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating/getting customer:", error);
    return { success: false, message: error.message };
  }
};
