-- ============================================
-- PRE-SIGNUP OTP VERIFICATION SETUP (FINAL v2)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Modify otp_verification to allow NULL user_id
ALTER TABLE public.otp_verification 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Update the constraint for purpose
ALTER TABLE public.otp_verification 
DROP CONSTRAINT IF EXISTS otp_verification_purpose_check;

ALTER TABLE public.otp_verification 
ADD CONSTRAINT otp_verification_purpose_check 
CHECK (purpose IN ('password_reset', 'email_verification', 'signup'));

-- 3. Function to generate OTP for NEW users (Signup)
CREATE OR REPLACE FUNCTION public.create_signup_otp(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_exists BOOLEAN;
  new_otp TEXT;
  otp_id UUID;
  target_email TEXT;
BEGIN
  -- Normalize email to lowercase
  target_email := lower(user_email);

  -- Check if user already exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = target_email
  ) INTO user_exists;
  
  IF user_exists THEN
    RETURN json_build_object('success', false, 'message', 'Email already registered. Please login.');
  END IF;
  
  -- Generate OTP
  IF (SELECT to_regproc('public.generate_otp')) IS NOT NULL THEN
      new_otp := public.generate_otp();
  ELSE
      new_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  
  -- Insert OTP record
  INSERT INTO public.otp_verification (email, otp, purpose, expires_at)
  VALUES (
    target_email,
    new_otp,
    'signup',
    TIMEZONE('utc', NOW()) + INTERVAL '10 minutes'
  )
  RETURNING id INTO otp_id;
  
  RETURN json_build_object(
    'success', true,
    'otp', new_otp,
    'message', 'OTP generated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to verify Signup OTP
CREATE OR REPLACE FUNCTION public.verify_signup_otp_pre_creation(target_email TEXT, otp_code TEXT)
RETURNS JSON AS $$
DECLARE
  otp_record RECORD;
  normalized_email TEXT;
BEGIN
  normalized_email := lower(target_email);

  -- Find valid OTP
  SELECT * INTO otp_record
  FROM public.otp_verification
  WHERE email = normalized_email
    AND otp = otp_code
    AND purpose = 'signup'
    AND is_used = false
    AND expires_at > TIMEZONE('utc', NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired OTP');
  END IF;
  
  -- Mark OTP as used
  UPDATE public.otp_verification
  SET is_used = true
  WHERE id = otp_record.id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'OTP verified successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. NEW: Function to force-confirm a user (Bypassing Supabase Link)
CREATE OR REPLACE FUNCTION public.confirm_auth_user_by_email(target_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE email = lower(target_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. GRANT PERMISSIONS (Essential for anonymous access)
GRANT EXECUTE ON FUNCTION public.create_signup_otp TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_signup_otp_pre_creation TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_auth_user_by_email TO anon, authenticated, service_role;
