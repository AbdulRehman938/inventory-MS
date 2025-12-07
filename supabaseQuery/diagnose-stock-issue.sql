-- ============================================
-- DIAGNOSTIC QUERIES FOR STOCK MANAGEMENT ISSUE
-- Run these queries in Supabase SQL Editor to diagnose the problem
-- ============================================

-- 1. Check if the inventory_stocks table exists and has data
SELECT COUNT(*) as total_rows FROM public.inventory_stocks;

-- 2. Check all data in the table (if any)
SELECT * FROM public.inventory_stocks ORDER BY created_at DESC LIMIT 10;

-- 3. Check if the add_stock_item function exists
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'add_stock_item';

-- 4. Check RLS policies on inventory_stocks table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'inventory_stocks';

-- 5. Check if RLS is enabled on the table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'inventory_stocks';

-- 6. Test the add_stock_item function directly
SELECT * FROM add_stock_item(
    p_product_name := 'Test Product',
    p_category := 'Test Category',
    p_brand := 'Test Brand',
    p_quantity := 10,
    p_unit_price := 9.99,
    p_cost_price := 5.00,
    p_expiry_date := NULL,
    p_supplier_name := 'Test Supplier',
    p_description := 'Test Description',
    p_image_url := NULL
);

-- 7. After running the test above, check if it was inserted
SELECT * FROM public.inventory_stocks WHERE product_name = 'Test Product';

-- 8. Check current user's role
SELECT 
    auth.uid() as user_id,
    p.role,
    p.email
FROM public.profiles p
WHERE p.id = auth.uid();
