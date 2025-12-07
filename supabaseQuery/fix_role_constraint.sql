-- Drop the restrictive check constraint on the role column
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Optional: Add a new, more permissive constraint if needed (or leave it open)
-- For now, we just drop it to allow 'theme_pro' and any other future roles.
-- If you strictly need validation, uncomment the lines below:
-- ALTER TABLE profiles 
-- ADD CONSTRAINT profiles_role_check 
-- CHECK (role <@ ARRAY['admin', 'controller', 'theme_pro', 'user']::text[]);
