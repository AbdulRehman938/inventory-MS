-- Clean up: Remove 'theme_pro' from all users' roles
UPDATE profiles
SET role = array_remove(role, 'theme_pro')
WHERE role @> ARRAY['theme_pro']::text[];
