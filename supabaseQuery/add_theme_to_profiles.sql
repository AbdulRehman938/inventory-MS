-- Add theme column to profiles table if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'theme') then
    alter table profiles add column theme text default 'light';
  end if; 
end $$;
