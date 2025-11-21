-- Add function to reset password by email (for password reset flow)
-- Run this in Supabase SQL Editor

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION reset_user_password_by_email(
  user_email TEXT,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted_pw TEXT;
  user_record RECORD;
BEGIN
  -- Get user by email
  SELECT id INTO user_record
  FROM auth.users
  WHERE email = user_email;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Encrypt the password using bcrypt
  encrypted_pw := crypt(new_password, gen_salt('bf'));

  -- Update the password in auth.users
  UPDATE auth.users
  SET 
    encrypted_password = encrypted_pw,
    updated_at = now()
  WHERE email = user_email;

  RETURN json_build_object('success', true, 'message', 'Password updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_user_password_by_email(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_password_by_email(TEXT, TEXT) TO anon;
