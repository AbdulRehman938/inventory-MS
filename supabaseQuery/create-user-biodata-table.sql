-- Create user_biodata table
create table if not exists public.user_biodata (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  data jsonb default '{}'::jsonb,
  verification_status text default 'idle',
  admin_remarks text,
  admin_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_biodata enable row level security;

-- Policies

-- 1. View: Users view own, Admins view all
create policy "Users can view own biodata" on public.user_biodata
  for select using (auth.uid() = user_id);

create policy "Admins can view all biodata" on public.user_biodata
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and 'admin' = ANY(profiles.role)
    )
  );

-- 2. Insert: Users can insert own
create policy "Users can insert own biodata" on public.user_biodata
  for insert with check (auth.uid() = user_id);

-- 3. Update: Users can update own data
create policy "Users can update own biodata" on public.user_biodata
  for update using (auth.uid() = user_id);

-- 4. Update: Admins can update any biodata (for verification)
create policy "Admins can update any biodata" on public.user_biodata
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and 'admin' = ANY(profiles.role)
    )
  );
