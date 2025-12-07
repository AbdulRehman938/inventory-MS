-- Create customer types table (managed by admin)
CREATE TABLE IF NOT EXISTS customer_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_vip BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_type_id UUID REFERENCES customer_types(id),
  customer_type_name TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  phone TEXT,
  email TEXT,
  total_purchases DECIMAL(12,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_type TEXT,
  payment_type TEXT NOT NULL DEFAULT 'cash',
  is_vip BOOLEAN DEFAULT FALSE,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  items_count INTEGER NOT NULL,
  processed_by UUID REFERENCES auth.users(id),
  processed_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales items table (individual items in each transaction)
CREATE TABLE IF NOT EXISTS sales_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type_id);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON sales_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_customer ON sales_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_transaction ON sales_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_items(product_id);

-- Enable RLS
ALTER TABLE customer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_types
CREATE POLICY "Anyone authenticated can view customer types"
  ON customer_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert customer types"
  ON customer_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.role)
    )
  );

CREATE POLICY "Only admins can update customer types"
  ON customer_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.role)
    )
  );

CREATE POLICY "Only admins can delete customer types"
  ON customer_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.role)
    )
  );

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for sales_transactions
CREATE POLICY "Authenticated users can view sales transactions"
  ON sales_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales transactions"
  ON sales_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for sales_items
CREATE POLICY "Authenticated users can view sales items"
  ON sales_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales items"
  ON sales_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_date TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COUNT(*) INTO v_count
  FROM sales_transactions
  WHERE DATE(created_at) = CURRENT_DATE;
  
  v_number := 'TXN-' || v_date || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- Insert default customer types
INSERT INTO customer_types (type_name, discount_percentage, is_vip, description)
VALUES 
  ('Walk-in Customer', 0, FALSE, 'Regular walk-in customers with no discount'),
  ('VIP Customer', 10, TRUE, 'VIP customers with 10% discount'),
  ('Wholesale Customer', 15, FALSE, 'Wholesale buyers with 15% discount')
ON CONFLICT (type_name) DO NOTHING;

COMMENT ON TABLE customer_types IS 'Customer categories with discount settings managed by admin';
COMMENT ON TABLE customers IS 'Customer records with purchase history';
COMMENT ON TABLE sales_transactions IS 'Sales transaction records with customer and payment details';
COMMENT ON TABLE sales_items IS 'Individual items in each sales transaction';
