-- Create table to track controller login/logout activity
CREATE TABLE IF NOT EXISTS controller_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  login_time TIMESTAMPTZ NOT NULL,
  logout_time TIMESTAMPTZ,
  session_duration INTERVAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_controller_activity_user_id ON controller_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_controller_activity_login_time ON controller_activity_log(login_time DESC);

-- Enable RLS
ALTER TABLE controller_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all activity logs
CREATE POLICY "Admins can view all controller activity logs"
  ON controller_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.role)
    )
  );

-- Policy: Controllers can view their own activity logs
CREATE POLICY "Controllers can view their own activity logs"
  ON controller_activity_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Allow authenticated users to insert their own activity
CREATE POLICY "Users can insert their own activity logs"
  ON controller_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Allow users to update their own activity logs (for logout time)
CREATE POLICY "Users can update their own activity logs"
  ON controller_activity_log
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to log controller login
CREATE OR REPLACE FUNCTION log_controller_login(
  p_user_email TEXT,
  p_user_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO controller_activity_log (
    user_id,
    user_email,
    user_name,
    login_time
  ) VALUES (
    auth.uid(),
    p_user_email,
    p_user_name,
    NOW()
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to log controller logout
CREATE OR REPLACE FUNCTION log_controller_logout(
  p_log_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_login_time TIMESTAMPTZ;
BEGIN
  -- Get the login time
  SELECT login_time INTO v_login_time
  FROM controller_activity_log
  WHERE id = p_log_id AND user_id = auth.uid();
  
  IF v_login_time IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update logout time and calculate session duration
  UPDATE controller_activity_log
  SET 
    logout_time = NOW(),
    session_duration = NOW() - v_login_time
  WHERE id = p_log_id AND user_id = auth.uid();
  
  RETURN TRUE;
END;
$$;

COMMENT ON TABLE controller_activity_log IS 'Tracks controller login and logout activity with timestamps';
COMMENT ON FUNCTION log_controller_login IS 'Logs when a controller logs in';
COMMENT ON FUNCTION log_controller_logout IS 'Logs when a controller logs out and calculates session duration';
