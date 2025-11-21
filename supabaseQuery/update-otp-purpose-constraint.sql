-- Update otp_verification table to allow 'signup' purpose
-- Run this in Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE otp_verification 
DROP CONSTRAINT IF EXISTS otp_verification_purpose_check;

-- Add new constraint that allows both 'password_reset' and 'signup'
ALTER TABLE otp_verification 
ADD CONSTRAINT otp_verification_purpose_check 
CHECK (purpose IN ('password_reset', 'signup'));
