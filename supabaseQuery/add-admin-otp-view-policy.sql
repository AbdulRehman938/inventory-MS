-- Allow admins to view all OTP verification codes
-- This enables the OTP viewer feature in admin dashboard

-- Add RLS policy for admin users to select OTP verification records
CREATE POLICY "Admins can view all OTPs"
ON otp_verification
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND 'admin' = ANY(profiles.role)
  )
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'otp_verification';
