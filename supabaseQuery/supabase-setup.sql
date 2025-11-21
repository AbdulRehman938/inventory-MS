-- ============================================
-- INVENTORY MS - COMPLETE DATABASE SETUP
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE - Store user information and roles
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'controller')) DEFAULT 'controller',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS (for admin operations)
-- Admins can view all profiles (using a subquery that doesn't cause recursion)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ============================================
-- 2. OTP VERIFICATION TABLE - For password reset OTP
-- ============================================
CREATE TABLE public.otp_verification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('password_reset', 'email_verification')),
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.otp_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for OTP
CREATE POLICY "Users can view their own OTP"
  ON public.otp_verification FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Anyone can insert OTP"
  ON public.otp_verification FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own OTP"
  ON public.otp_verification FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- ============================================
-- 3. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'controller'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on profile update
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

-- Function to generate 6-digit OTP
CREATE OR REPLACE FUNCTION public.generate_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create OTP for password reset
CREATE OR REPLACE FUNCTION public.create_password_reset_otp(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  new_otp TEXT;
  otp_id UUID;
BEGIN
  -- Check if user exists
  SELECT id INTO user_record FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  -- Generate OTP
  new_otp := public.generate_otp();
  
  -- Insert OTP record
  INSERT INTO public.otp_verification (user_id, email, otp, purpose, expires_at)
  VALUES (
    user_record.id,
    user_email,
    new_otp,
    'password_reset',
    TIMEZONE('utc', NOW()) + INTERVAL '10 minutes'
  )
  RETURNING id INTO otp_id;
  
  RETURN json_build_object(
    'success', true,
    'otp', new_otp,
    'otp_id', otp_id,
    'message', 'OTP generated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(user_email TEXT, otp_code TEXT)
RETURNS JSON AS $$
DECLARE
  otp_record RECORD;
BEGIN
  -- Find valid OTP
  SELECT * INTO otp_record
  FROM public.otp_verification
  WHERE email = user_email
    AND otp = otp_code
    AND purpose = 'password_reset'
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
    'user_id', otp_record.user_id,
    'message', 'OTP verified successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired OTPs (run this periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verification
  WHERE expires_at < TIMEZONE('utc', NOW()) - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. INDEXES for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_otp_email ON public.otp_verification(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verification(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_used ON public.otp_verification(is_used);

-- ============================================
-- 5. INSERT DEFAULT ADMIN AND CONTROLLER USERS
-- ============================================
-- Note: These will be created through Supabase Auth Dashboard
-- After running this script, go to Authentication > Users and create:
-- 1. Admin: admin@inventory.com / admin123 with metadata: {"role": "admin", "full_name": "Admin User"}
-- 2. Controller: controller@inventory.com / controller123 with metadata: {"role": "controller", "full_name": "Controller User"}

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Enable email confirmations in Authentication > Settings (disable for testing)
-- 2. Configure email templates in Authentication > Email Templates
-- 3. Create test users through Authentication > Users dashboard
-- ============================================
