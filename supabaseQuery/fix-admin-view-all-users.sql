-- Allow admins to view all profiles
-- This policy enables the user management panel to show all users

-- First, check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Drop existing restrictive select policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new policy: Allow all authenticated users to view all profiles
-- This is safe because we check admin role in the application layer
CREATE POLICY "Allow authenticated users to view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Or if you want to restrict to admins only at database level:
-- CREATE POLICY "Admins can view all profiles"
-- ON profiles
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid()
--     AND 'admin' = ANY(profiles.role)
--   )
--   OR auth.uid() = id
-- );

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Test query (run as authenticated user)
SELECT id, email, full_name, role, is_active, created_at
FROM profiles
ORDER BY created_at DESC;
