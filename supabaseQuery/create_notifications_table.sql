-- Create notifications table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  title text not null,
  message text not null,
  is_read boolean default false,
  link text, -- optional link to navigate to
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table notifications enable row level security;

-- Policies
-- 1. Users can view their own notifications
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- 2. Users can update (mark read) their own notifications
create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- 3. Users can delete their own notifications (optional)
create policy "Users can delete own notifications"
  on notifications for delete
  using (auth.uid() = user_id);

-- 4. Admins can insert notifications for anyone (requires checking admin role)
-- For simplicity, we might allow any authenticated user to insert for now, 
-- or strictly check if sender is admin. 
-- However, for "Controller -> Admin" notification, the Controller needs to insert.
-- So we allow "Authenticated" to insert. 
create policy "Authenticated users can insert notifications"
  on notifications for insert
  with check (auth.role() = 'authenticated');
