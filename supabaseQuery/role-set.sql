UPDATE profiles 
SET role = array_append(role, 'admin')
WHERE email = 'user@example.com';