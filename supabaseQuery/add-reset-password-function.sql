-- Add function to reset password without active session
-- This function uses the service role to update auth.users password directly
-- Run this in Supabase SQL Editor

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION reset_user_password(
  user_id UUID,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
  encrypted_pw TEXT;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Encrypt the password using Supabase's password hashing
  encrypted_pw := crypt(new_password, gen_salt('bf'));

  -- Update the password in auth.users
  UPDATE auth.users
  SET 
    encrypted_password = encrypted_pw,
    updated_at = now()
  WHERE id = user_id;

  RETURN json_build_object('success', true, 'message', 'Password updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_user_password(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_password(UUID, TEXT) TO anon;
