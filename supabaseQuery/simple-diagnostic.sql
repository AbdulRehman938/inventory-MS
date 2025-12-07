-- ============================================
-- SIMPLE DIAGNOSTIC - Check role column type
-- Run these queries ONE AT A TIME
-- ============================================

-- Query 1: Check the role column data type
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name = 'role';

-- Query 2: Check all columns in profiles table
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Query 3: Try to select user data (if role is array)
SELECT 
    id,
    email,
    role::text as role_text,
    created_at
FROM public.profiles
WHERE email = 'iamrehman941@gmail.com';

-- Query 4: Check if role contains 'admin' (array syntax)
SELECT 
    id,
    email,
    role,
    'admin' = ANY(role) as is_admin
FROM public.profiles
WHERE email = 'iamrehman941@gmail.com';
