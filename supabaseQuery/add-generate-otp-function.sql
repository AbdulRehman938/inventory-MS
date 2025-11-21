-- Create generate_otp function for signup email verification
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION generate_otp(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_code TEXT;
  existing_record RECORD;
BEGIN
  -- Generate 6-digit OTP
  otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Check if there's an existing OTP for this email
  SELECT * INTO existing_record 
  FROM otp_verification 
  WHERE email = user_email AND purpose = 'signup';
  
  IF existing_record IS NOT NULL THEN
    -- Update existing record
    UPDATE otp_verification
    SET 
      otp = otp_code,
      created_at = NOW(),
      expires_at = NOW() + INTERVAL '10 minutes',
      is_verified = FALSE
    WHERE email = user_email AND purpose = 'signup';
  ELSE
    -- Insert new record
    INSERT INTO otp_verification (email, otp, purpose, expires_at)
    VALUES (user_email, otp_code, 'signup', NOW() + INTERVAL '10 minutes');
  END IF;
  
  -- Return success with OTP (for development/testing)
  RETURN json_build_object(
    'success', TRUE,
    'message', 'OTP generated successfully',
    'otp', otp_code
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
GRANT EXECUTE ON FUNCTION generate_otp(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_otp(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_otp(TEXT) TO service_role;
