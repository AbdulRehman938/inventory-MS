-- Fix verify_otp function to handle both password_reset and signup
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION verify_otp(
  user_email TEXT,
  otp_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_record RECORD;
BEGIN
  -- Get the OTP record (check both purposes)
  SELECT * INTO otp_record
  FROM otp_verification
  WHERE email = user_email 
    AND otp = otp_code
    AND expires_at > NOW()
    AND is_verified = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if OTP exists and is valid
  IF otp_record IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Invalid or expired OTP'
    );
  END IF;

  -- Mark OTP as verified
  UPDATE otp_verification
  SET is_verified = TRUE
  WHERE id = otp_record.id;

  RETURN json_build_object(
    'success', TRUE,
    'message', 'OTP verified successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_otp(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_otp(TEXT, TEXT) TO anon;
