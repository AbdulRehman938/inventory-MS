-- Delete All Users from Supabase Auth
-- WARNING: This will permanently delete ALL users and their associated data
-- Run this in Supabase SQL Editor

-- Step 1: Delete all profiles first (to avoid foreign key issues)
DELETE FROM public.profiles;

-- Step 2: Delete all OTP verification records
DELETE FROM public.otp_verification;

-- Step 3: Delete all users from auth.users
-- Note: This requires admin privileges in Supabase SQL Editor
DELETE FROM auth.users;

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT COUNT(*) as remaining_profiles FROM public.profiles;
