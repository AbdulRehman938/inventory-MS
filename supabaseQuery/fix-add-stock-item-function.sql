-- ============================================
-- FIX FOR STOCK MANAGEMENT - RLS POLICY UPDATE
-- This ensures the add_stock_item function can insert data
-- ============================================

-- First, let's make sure the function bypasses RLS completely
-- by recreating it with proper SECURITY DEFINER

DROP FUNCTION IF EXISTS add_stock_item CASCADE;

CREATE OR REPLACE FUNCTION add_stock_item(
  p_product_name TEXT,
  p_category TEXT,
  p_brand TEXT,
  p_quantity INTEGER,
  p_unit_price DECIMAL,
  p_cost_price DECIMAL DEFAULT NULL,
  p_expiry_date DATE DEFAULT NULL,
  p_supplier_name TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_image_url TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  product_id TEXT,
  sku TEXT,
  barcode TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  quantity INTEGER,
  unit_price DECIMAL,
  cost_price DECIMAL,
  expiry_date DATE,
  supplier_name TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_product_id TEXT;
  new_sku TEXT;
  new_barcode TEXT;
BEGIN
  -- Generate unique identifiers
  new_product_id := generate_product_id();
  new_sku := generate_sku(p_category, p_brand);
  new_barcode := generate_barcode();
  
  -- Insert the record and return it
  RETURN QUERY
  INSERT INTO public.inventory_stocks (
    product_id,
    sku,
    barcode,
    product_name,
    category,
    brand,
    quantity,
    unit_price,
    cost_price,
    expiry_date,
    supplier_name,
    description,
    image_url
  ) VALUES (
    new_product_id,
    new_sku,
    new_barcode,
    p_product_name,
    p_category,
    p_brand,
    p_quantity,
    p_unit_price,
    p_cost_price,
    p_expiry_date,
    p_supplier_name,
    p_description,
    p_image_url
  )
  RETURNING 
    inventory_stocks.id,
    inventory_stocks.product_id,
    inventory_stocks.sku,
    inventory_stocks.barcode,
    inventory_stocks.product_name,
    inventory_stocks.category,
    inventory_stocks.brand,
    inventory_stocks.quantity,
    inventory_stocks.unit_price,
    inventory_stocks.cost_price,
    inventory_stocks.expiry_date,
    inventory_stocks.supplier_name,
    inventory_stocks.description,
    inventory_stocks.image_url,
    inventory_stocks.created_at;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_stock_item TO authenticated;
GRANT EXECUTE ON FUNCTION add_stock_item TO anon;

-- Also ensure the RLS policy allows inserts for authenticated users
-- This is a backup in case SECURITY DEFINER isn't working as expected
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.inventory_stocks;
CREATE POLICY "Allow authenticated inserts"
ON public.inventory_stocks
FOR INSERT
TO authenticated
WITH CHECK (true);

COMMENT ON FUNCTION add_stock_item IS 'Adds a new stock item with auto-generated IDs. Uses SECURITY DEFINER to bypass RLS.';
