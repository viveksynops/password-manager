-- Run this in your Supabase Dashboard -> SQL Editor
-- 1. Grant table & schema permissions to Supabase API roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

-- 2. Populate user profiles linked to the generated Supabase Auth accounts
insert into public.profiles (id, email, full_name, role, status)
values
  ('bcdee86d-9c6d-48db-b61a-9369f1b91b45', 'admin@vault.local', 'Admin User', 'admin', 'active'),
  ('e4f92761-0578-4119-9816-25113299e512', 'manager@vault.local', 'Manager User', 'manager', 'active'),
  ('942b8005-2a20-4b7a-9d7a-8189f7ec5c5c', 'developer@vault.local', 'Developer User', 'developer', 'active')
on conflict (id) do update set
  role = excluded.role,
  status = excluded.status,
  full_name = excluded.full_name;
