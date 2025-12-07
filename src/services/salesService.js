import { supabase } from "../lib/supabaseClient";

/**
 * Create a sales transaction with items
 */
export const createSalesTransaction = async (transactionData) => {
  try {
    const user = (await supabase.auth.getUser()).data.user;

    // Generate transaction number
    const { data: txnNumber } = await supabase.rpc(
      "generate_transaction_number"
    );

    // Create transaction
    const { data: transaction, error: txnError } = await supabase
      .from("sales_transactions")
      .insert({
        transaction_number: txnNumber,
        customer_id: transactionData.customer_id,
        customer_name: transactionData.customer_name,
        customer_type: transactionData.customer_type,
        payment_type: transactionData.payment_type,
        is_vip: transactionData.is_vip,
        discount_percentage: transactionData.discount_percentage,
        subtotal: transactionData.subtotal,
        discount_amount: transactionData.discount_amount,
        total_amount: transactionData.total_amount,
        items_count: transactionData.items.length,
        processed_by: user?.id,
        processed_by_name: user?.email,
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Create sales items
    const salesItems = transactionData.items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      product_name: item.product_name,
      sku: item.sku,
      barcode: item.barcode,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabase
      .from("sales_items")
      .insert(salesItems);

    if (itemsError) throw itemsError;

    // Update customer total purchases
    if (transactionData.customer_id) {
      // First fetch current total
      const { data: customerData } = await supabase
        .from("customers")
        .select("total_purchases")
        .eq("id", transactionData.customer_id)
        .single();

      if (customerData) {
        const newTotal = (customerData.total_purchases || 0) + transactionData.total_amount;
        
        await supabase
          .from("customers")
          .update({ total_purchases: newTotal })
          .eq("id", transactionData.customer_id);
      }
    }

    // Update inventory quantities
    for (const item of transactionData.items) {
      // Use the unique row ID if available (added in scanner), otherwise product_id
      const queryField = item.id ? "id" : "product_id";
      const queryValue = item.id || item.product_id;

      // Fetch current quantity first
      const { data: stockItem, error: fetchError } = await supabase
        .from("inventory_stocks")
        .select("quantity")
        .eq(queryField, queryValue)
        .single();
      
      if (fetchError) {
         console.error(`Failed to fetch stock for ${item.product_name}:`, fetchError);
         continue;
      }

      // Calculate new quantity
      const newQuantity = (stockItem.quantity || 0) - item.quantity;
      
      // Update with new quantity
      const { error: updateError } = await supabase
        .from("inventory_stocks")
        .update({ quantity: newQuantity })
        .eq(queryField, queryValue);

      if (updateError) {
        console.error(
          `Failed to update stock for item ${item.product_name}:`,
          updateError
        );
      }
    }

    return { success: true, data: transaction };
  } catch (error) {
    console.error("Error creating sales transaction:", error);
    return { success: false, message: error.message };
  }
};

console.log("🔹 Sales Service Module Initialized (v3)");

/**
 * Get product by barcode
 */
export const getProductByBarcode = async (barcode) => {
  console.log(`🔍 getProductByBarcode called for: ${barcode}`);
  try {
    const { data, error } = await supabase
      .from("inventory_stocks")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();

    if (error) {
      console.error("❌ getProductByBarcode Supabase Error:", error);
      throw error;
    }
    
    if (!data) {
      console.warn(`⚠️ Product not found (getProductByBarcode): ${barcode}`);
      return { success: false, message: "Product not found" };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("❌ Error fetching product by barcode:", error);
    return { success: false, message: error.message };
  }
};

export const findProductByCodeSmart = async (code) => {
  try {
    const raw = (code || "").trim();
    const digits = raw.replace(/\D/g, "");
    
    console.log(`🔎 Smart Search: "${code}" (Raw: "${raw}", Digits: "${digits}")`);

    // 1. Exact Match (Digits only) - mostly for barcodes
    if (digits) {
      console.log(`   Attempt 1: Exact barcode search for "${digits}"`);
      const exactDigit = await supabase
        .from("inventory_stocks")
        .select("*")
        .eq("barcode", digits)
        .maybeSingle();
      
      console.log(`   👉 Attempt 1 Response:`, exactDigit); // LOG THE RAW RESPONSE

      if (exactDigit.data) {
        console.log(`   ✅ Match found via Digits Barcode:`, exactDigit.data.product_name);
        return { success: true, data: exactDigit.data };
      }
    }

    // 2. Exact Match (Raw input) - for alphanumeric codes
    console.log(`   Attempt 2: Exact barcode search for raw "${raw}"`);
    const exactRaw = await supabase
      .from("inventory_stocks")
      .select("*")
      .eq("barcode", raw)
      .maybeSingle();

    if (exactRaw.data) {
      console.log(`   ✅ Match found via Raw Barcode:`, exactRaw.data.product_name);
      return { success: true, data: exactRaw.data };
    }

    // 3. Fuzzy Search (SKU, Name, Barcode) as fallback
    console.log(`   Attempt 3: Fuzzy search for "%${raw}%"`);
    const fuzzy = await supabase
      .from("inventory_stocks")
      .select("*")
      .or(`sku.ilike.%${raw}%,product_name.ilike.%${raw}%,barcode.ilike.%${raw}%`)
      .limit(1);

    if (fuzzy.error) {
       console.error("   ❌ Fuzzy Search Error:", fuzzy.error);
    }

    if (fuzzy.data && fuzzy.data.length > 0) {
      console.log(`   ✅ Match found via Fuzzy Search:`, fuzzy.data[0].product_name);
      return { success: true, data: fuzzy.data[0] };
    }

    console.warn(`   ⚠️ No match found for "${code}"`);
    return { success: false, message: "No matching product" };
  } catch (error) {
    console.error("❌ Error finding product:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Get sales transactions
 */
export const getSalesTransactions = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from("sales_transactions")
      .select("*, sales_items(*)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching sales transactions:", error);
    return { success: false, message: error.message };
  }
};
