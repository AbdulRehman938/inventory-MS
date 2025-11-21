-- Add function to confirm user email after OTP verification
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION confirm_user_email(
  user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Mark email as confirmed (confirmed_at is auto-generated from email_confirmed_at)
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = user_id AND email_confirmed_at IS NULL;

  RETURN json_build_object('success', true, 'message', 'Email confirmed successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION confirm_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_user_email(UUID) TO anon;
