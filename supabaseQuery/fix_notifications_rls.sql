-- Fix Notifications RLS Policy
-- Drop existing policies to be safe
drop policy if exists "Enable all for users based on user_id" on notifications;
drop policy if exists "Enable insert for authenticated users" on notifications;
drop policy if exists "Users can view their own notifications" on notifications;
drop policy if exists "Users can update their own notifications" on notifications;

-- Create comprehensive policies

-- 1. Allow Users to View/Read their OWN notifications
create policy "Users can view own notifications"
on notifications for select
using (auth.uid() = user_id);

-- 2. Allow Users to Update (Mark as read) their OWN notifications
create policy "Users can update own notifications"
on notifications for update
using (auth.uid() = user_id);

-- 3. Allow ANY Authenticated User to insert a notification for ANY ONE
-- This is crucial for User A to notify User B (controller -> admin, admin -> controller)
create policy "Authenticated users can insert notifications"
on notifications for insert
with check (auth.role() = 'authenticated');
