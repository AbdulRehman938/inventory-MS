-- Add is_verified column to otp_verification table
-- Run this in Supabase SQL Editor

ALTER TABLE otp_verification 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_otp_verification_email_verified 
ON otp_verification(email, is_verified);
