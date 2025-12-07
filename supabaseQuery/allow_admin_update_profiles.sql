-- Allow Admins to UPDATE any profile
-- This is necessary for the Admin Panel to update user roles, locations, etc. without the Edge Function.

-- 1. Create Policy for UPDATE
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  -- Check if the requesting user (auth.uid()) is an admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role @> ARRAY['admin']::text[]
  )
)
WITH CHECK (
  -- Ensure admins can write valid data (optional extra check, usually matching USING is enough)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role @> ARRAY['admin']::text[]
  )
);
