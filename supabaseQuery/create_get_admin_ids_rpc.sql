-- Function to get admin IDs securely (bypassing RLS)
create or replace function get_admin_ids()
returns table (id uuid)
security definer
as $$
begin
  return query
  select p.id
  from profiles p
  where p.role @> ARRAY['admin']; -- Checks if 'admin' is in the text[] array
end;
$$ language plpgsql;
