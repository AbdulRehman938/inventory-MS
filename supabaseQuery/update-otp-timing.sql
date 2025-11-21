-- Update OTP functions to enforce 5-minute validity and 2-minute resend cooldown

-- 1. Update generate_otp function for signup (5-minute validity)
CREATE OR REPLACE FUNCTION generate_otp(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_otp TEXT;
  result JSON;
  last_otp_time TIMESTAMP;
BEGIN
  -- Check if user has requested an OTP in the last 2 minutes
  SELECT created_at INTO last_otp_time
  FROM otp_verification
  WHERE email = user_email
    AND purpose = 'signup'
    AND is_verified = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_otp_time IS NOT NULL AND (NOW() - last_otp_time) < INTERVAL '2 minutes' THEN
    result := json_build_object(
      'success', false,
      'message', 'Please wait 2 minutes before requesting a new OTP',
      'retry_after', EXTRACT(EPOCH FROM (last_otp_time + INTERVAL '2 minutes' - NOW()))
    );
    RETURN result;
  END IF;

  -- Generate 6-digit OTP
  new_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Mark previous OTPs as verified (expired)
  UPDATE otp_verification
  SET is_verified = true
  WHERE email = user_email AND purpose = 'signup';
  
  -- Insert new OTP with 5-minute expiry
  INSERT INTO otp_verification (email, otp, purpose, expires_at, is_verified)
  VALUES (user_email, new_otp, 'signup', NOW() + INTERVAL '5 minutes', false);
  
  result := json_build_object(
    'success', true,
    'otp', new_otp,
    'expires_in_seconds', 300
  );
  
  RETURN result;
END;
$$;

-- 2. Update create_password_reset_otp function (5-minute validity)
CREATE OR REPLACE FUNCTION create_password_reset_otp(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_otp TEXT;
  result JSON;
  user_exists BOOLEAN;
  last_otp_time TIMESTAMP;
BEGIN
  -- Check if user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = user_email
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    result := json_build_object(
      'success', false,
      'message', 'User not found'
    );
    RETURN result;
  END IF;

  -- Check if user has requested an OTP in the last 2 minutes
  SELECT created_at INTO last_otp_time
  FROM otp_verification
  WHERE email = user_email
    AND purpose = 'password_reset'
    AND is_verified = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_otp_time IS NOT NULL AND (NOW() - last_otp_time) < INTERVAL '2 minutes' THEN
    result := json_build_object(
      'success', false,
      'message', 'Please wait 2 minutes before requesting a new OTP',
      'retry_after', EXTRACT(EPOCH FROM (last_otp_time + INTERVAL '2 minutes' - NOW()))
    );
    RETURN result;
  END IF;
  
  -- Generate 6-digit OTP
  new_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Mark previous OTPs as verified (expired)
  UPDATE otp_verification
  SET is_verified = true
  WHERE email = user_email AND purpose = 'password_reset';
  
  -- Insert new OTP with 5-minute expiry
  INSERT INTO otp_verification (email, otp, purpose, expires_at, is_verified)
  VALUES (user_email, new_otp, 'password_reset', NOW() + INTERVAL '5 minutes', false);
  
  result := json_build_object(
    'success', true,
    'otp', new_otp,
    'expires_in_seconds', 300
  );
  
  RETURN result;
END;
$$;

-- 3. Verify the functions were updated
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name IN ('generate_otp', 'create_password_reset_otp')
  AND routine_schema = 'public';

-- Test the functions
SELECT generate_otp('test@example.com');
SELECT create_password_reset_otp('test@example.com');
