-- ============================================
-- CHECK USER ROLE AND PERMISSIONS
-- Run this while logged in as the admin user
-- ============================================

-- 1. Check current authenticated user
SELECT 
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Check user's profile and role
SELECT 
    id,
    email,
    role,
    created_at
FROM public.profiles
WHERE id = auth.uid();

-- 3. Check if user is admin
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        ) THEN 'User IS an admin'
        ELSE 'User is NOT an admin'
    END as admin_status;

-- 4. List all users and their roles (admin only)
SELECT 
    id,
    email,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 5. Check RLS policies on inventory_stocks
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
WHERE tablename = 'inventory_stocks'
ORDER BY policyname;
