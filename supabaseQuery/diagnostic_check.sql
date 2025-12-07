-- Diagnostic Script: Run this to check your database setup
-- Copy the results and share them

-- 1. Check if the new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('location', 'theme_access', 'role');

-- 2. Check current RLS policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Check if your admin user exists and has admin role
-- Replace 'YOUR_ADMIN_EMAIL' with your actual admin email
SELECT id, email, role, location, theme_access, is_active
FROM profiles
WHERE email = 'YOUR_ADMIN_EMAIL';

-- 4. Check a sample controller user
-- Replace 'CONTROLLER_EMAIL' with the controller you're trying to update
SELECT id, email, role, location, theme_access, is_active
FROM profiles
WHERE email = 'CONTROLLER_EMAIL';
