-- ============================================
-- INVENTORY STOCKS - RLS POLICIES
-- Run this AFTER creating the inventory_stocks table
-- ============================================

-- Enable Row Level Security
ALTER TABLE public.inventory_stocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage all stocks" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Admins can view stocks" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Controllers can view stocks" ON public.inventory_stocks;

-- Policy 1: Admins can do everything
CREATE POLICY "Admins can manage all stocks"
ON public.inventory_stocks
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'admin'
  )
);

-- Policy 2: Controllers can view
CREATE POLICY "Controllers can view stocks"
ON public.inventory_stocks
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'controller'
  )
);
