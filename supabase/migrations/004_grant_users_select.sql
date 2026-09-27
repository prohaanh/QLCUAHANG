-- Allow authenticated sessions to read user profiles; RLS still controls visible rows.
grant select on table public.users to authenticated;