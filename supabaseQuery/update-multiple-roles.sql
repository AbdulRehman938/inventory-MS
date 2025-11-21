-- Update profiles table to support multiple roles
-- Run this in Supabase SQL Editor

-- First, drop the constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Remove the default before changing type
ALTER TABLE public.profiles 
ALTER COLUMN role DROP DEFAULT;

-- Change role to text array type
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE text[] USING ARRAY[role];

-- Now set the default after type change
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT ARRAY['controller']::text[];

-- Add new constraint for valid roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role <@ ARRAY['admin', 'controller']::text[]);

-- Update existing users to have array format (if they have single role)
-- This is a safety measure in case some users still have old format
UPDATE public.profiles 
SET role = ARRAY['controller']::text[]
WHERE role IS NULL OR cardinality(role) = 0;

-- Update the handle_new_user function to work with arrays
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    ARRAY['controller']::text[],
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND check_role = ANY(role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update indexes
DROP INDEX IF EXISTS idx_profiles_role;
CREATE INDEX idx_profiles_role ON public.profiles USING GIN(role);
