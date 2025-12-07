-- ============================================
-- INVENTORY STOCKS - COMPLETE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Create inventory_stocks table with auto-generated fields
CREATE TABLE IF NOT EXISTS public.inventory_stocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Auto-generated identifiers (created by database functions)
  product_id TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  
  -- Product information
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  
  -- Inventory details
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  
  -- Pricing
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),
  
  -- Supplier information
  supplier_name TEXT NOT NULL,
  
  -- Expiry tracking (for perishable items)
  expiry_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_product_id ON public.inventory_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_sku ON public.inventory_stocks(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_barcode ON public.inventory_stocks(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_category ON public.inventory_stocks(category);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_brand ON public.inventory_stocks(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_quantity ON public.inventory_stocks(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_expiry_date ON public.inventory_stocks(expiry_date);

-- ============================================
-- DATABASE FUNCTIONS FOR AUTO-GENERATION
-- ============================================

-- Function to generate unique Product ID (format: PROD-YYYYMMDD-XXXXXX)
CREATE OR REPLACE FUNCTION generate_product_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'PROD-' || 
              TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
              UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    SELECT EXISTS(SELECT 1 FROM public.inventory_stocks WHERE product_id = new_id) INTO id_exists;
    
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate SKU based on category and brand (format: CAT-BRAND-12345)
CREATE OR REPLACE FUNCTION generate_sku(p_category TEXT, p_brand TEXT)
RETURNS TEXT AS $$
DECLARE
  new_sku TEXT;
  sku_exists BOOLEAN;
  cat_prefix TEXT;
  brand_prefix TEXT;
  random_num TEXT;
BEGIN
  cat_prefix := UPPER(SUBSTRING(p_category FROM 1 FOR 3));
  brand_prefix := UPPER(SUBSTRING(p_brand FROM 1 FOR 4));
  
  LOOP
    random_num := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    new_sku := cat_prefix || '-' || brand_prefix || '-' || random_num;
    
    SELECT EXISTS(SELECT 1 FROM public.inventory_stocks WHERE sku = new_sku) INTO sku_exists;
    
    EXIT WHEN NOT sku_exists;
  END LOOP;
  
  RETURN new_sku;
END;
$$ LANGUAGE plpgsql;

-- Function to generate EAN-13 compatible barcode (13 digits)
CREATE OR REPLACE FUNCTION generate_barcode()
RETURNS TEXT AS $$
DECLARE
  new_barcode TEXT;
  barcode_exists BOOLEAN;
  base_code TEXT;
  check_digit INTEGER;
  sum_val INTEGER;
  i INTEGER;
BEGIN
  LOOP
    -- Generate 12 random digits
    base_code := '';
    FOR i IN 1..12 LOOP
      base_code := base_code || FLOOR(RANDOM() * 10)::TEXT;
    END LOOP;
    
    -- Calculate EAN-13 check digit
    sum_val := 0;
    FOR i IN 1..12 LOOP
      IF i % 2 = 1 THEN
        sum_val := sum_val + SUBSTRING(base_code FROM i FOR 1)::INTEGER;
      ELSE
        sum_val := sum_val + (SUBSTRING(base_code FROM i FOR 1)::INTEGER * 3);
      END IF;
    END LOOP;
    
    check_digit := (10 - (sum_val % 10)) % 10;
    new_barcode := base_code || check_digit::TEXT;
    
    SELECT EXISTS(SELECT 1 FROM public.inventory_stocks WHERE barcode = new_barcode) INTO barcode_exists;
    
    EXIT WHEN NOT barcode_exists;
  END LOOP;
  
  RETURN new_barcode;
END;
$$ LANGUAGE plpgsql;

-- Function to add stock with auto-generated IDs
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_inventory_stocks_updated_at ON public.inventory_stocks;
CREATE TRIGGER update_inventory_stocks_updated_at
    BEFORE UPDATE ON public.inventory_stocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for stock statistics
CREATE OR REPLACE VIEW public.stock_statistics AS
SELECT 
  COUNT(*) as total_items,
  SUM(quantity) as total_quantity,
  SUM(quantity * unit_price) as total_value,
  COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_items,
  COUNT(CASE WHEN quantity < 10 THEN 1 END) as low_stock_items,
  COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN 1 END) as expired_items,
  COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon_items
FROM public.inventory_stocks;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_stock_item TO authenticated;
GRANT EXECUTE ON FUNCTION generate_product_id TO authenticated;
GRANT EXECUTE ON FUNCTION generate_sku TO authenticated;
GRANT EXECUTE ON FUNCTION generate_barcode TO authenticated;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
