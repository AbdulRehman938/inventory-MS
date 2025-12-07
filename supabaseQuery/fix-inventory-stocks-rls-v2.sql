-- ============================================
-- FIX RLS POLICIES FOR INVENTORY_STOCKS
-- Handles role as both TEXT and TEXT[] (array)
-- ============================================

-- First, check the actual data type of the role column
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name = 'role';

-- Check current user and their role
SELECT 
    id,
    email,
    role,
    pg_typeof(role) as role_type
FROM public.profiles
WHERE email = 'iamrehman941@gmail.com';

-- Drop all existing policies on inventory_stocks
DROP POLICY IF EXISTS "Admins can manage all stocks" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Admins can view all stocks" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Admins can view stocks" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Controllers can view stocks" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Admins can insert stocks" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Admins can update stocks" ON public.inventory_stocks;
DROP POLICY IF EXISTS "Admins can delete stocks" ON public.inventory_stocks;

-- ============================================
-- NEW POLICIES THAT HANDLE BOTH TEXT AND ARRAY
-- ============================================

-- Policy 1: Admins can SELECT (view) all stocks
-- This handles role as both TEXT and TEXT[]
CREATE POLICY "Admins can view all stocks"
ON public.inventory_stocks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Handle TEXT type
      (pg_typeof(profiles.role)::text = 'text' AND profiles.role = 'admin')
      OR
      -- Handle TEXT[] array type
      (pg_typeof(profiles.role)::text LIKE '%array%' AND 'admin' = ANY(profiles.role))
    )
  )
);

-- Policy 2: Admins can INSERT stocks
CREATE POLICY "Admins can insert stocks"
ON public.inventory_stocks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      (pg_typeof(profiles.role)::text = 'text' AND profiles.role = 'admin')
      OR
      (pg_typeof(profiles.role)::text LIKE '%array%' AND 'admin' = ANY(profiles.role))
    )
  )
);

-- Policy 3: Admins can UPDATE stocks
CREATE POLICY "Admins can update stocks"
ON public.inventory_stocks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      (pg_typeof(profiles.role)::text = 'text' AND profiles.role = 'admin')
      OR
      (pg_typeof(profiles.role)::text LIKE '%array%' AND 'admin' = ANY(profiles.role))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      (pg_typeof(profiles.role)::text = 'text' AND profiles.role = 'admin')
      OR
      (pg_typeof(profiles.role)::text LIKE '%array%' AND 'admin' = ANY(profiles.role))
    )
  )
);

-- Policy 4: Admins can DELETE stocks
CREATE POLICY "Admins can delete stocks"
ON public.inventory_stocks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      (pg_typeof(profiles.role)::text = 'text' AND profiles.role = 'admin')
      OR
      (pg_typeof(profiles.role)::text LIKE '%array%' AND 'admin' = ANY(profiles.role))
    )
  )
);

-- Policy 5: Controllers can view stocks (read-only)
CREATE POLICY "Controllers can view stocks"
ON public.inventory_stocks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      (pg_typeof(profiles.role)::text = 'text' AND profiles.role = 'controller')
      OR
      (pg_typeof(profiles.role)::text LIKE '%array%' AND 'controller' = ANY(profiles.role))
    )
  )
);

-- Verify RLS is enabled
ALTER TABLE public.inventory_stocks ENABLE ROW LEVEL SECURITY;

-- Test the SELECT query (should now return data for admins)
SELECT * FROM public.inventory_stocks ORDER BY created_at DESC LIMIT 5;

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'inventory_stocks'
ORDER BY policyname;
