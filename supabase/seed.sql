-- Company Vault Development Seed Data (Fake Test Values Only)
-- Follows TEST_PLAN.md & RULES.md

-- 1. Test Users in auth.users (if running locally in Supabase)
-- User IDs for test accounts
-- Admin:    11111111-1111-1111-1111-111111111111
-- Manager:  22222222-2222-2222-2222-222222222222
-- Dev A:    33333333-3333-3333-3333-333333333333
-- Dev B:    44444444-4444-4444-4444-444444444444
-- Inactive: 55555555-5555-5555-5555-555555555555

-- Profiles
insert into public.profiles (id, email, full_name, role, status)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local', 'Admin User', 'admin', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'manager@test.local', 'Manager User', 'manager', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'dev-a@test.local', 'Developer Alpha', 'developer', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'dev-b@test.local', 'Developer Beta', 'developer', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'inactive@test.local', 'Inactive User', 'developer', 'deactivated')
on conflict (id) do update set
  role = excluded.role,
  status = excluded.status;

-- 2. Test Clients
insert into public.clients (id, name, contact_person, contact_email, contact_phone, notes, is_archived, created_by)
values
  ('00000000-0000-0000-0000-000000000001', 'Acme Corporation', 'John Doe', 'john@acme.example.com', '+1-555-0100', 'Enterprise client notes', false, '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000002', 'Starlight Studios', 'Jane Smith', 'jane@starlight.example.com', '+1-555-0200', 'Creative agency client', false, '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

-- 3. Test Projects
insert into public.projects (id, client_id, name, description, live_url, repo_url, hosting_info, tech_stack, is_archived, created_by)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Ecommerce Platform', 'Main ecommerce storefront for Acme', 'https://ecommerce.acme.example.com', 'https://github.com/acme/store', 'Vercel + Supabase', 'Next.js, Tailwind, Stripe', false, '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', 'Marketing Website', 'Company portfolio and marketing site', 'https://starlight.example.com', 'https://github.com/starlight/web', 'Netlify', 'Astro, React', false, '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

-- 4. Project Memberships
-- Dev Alpha assigned to Project A (Ecommerce Platform)
-- Dev Beta assigned to Project B (Marketing Website)
insert into public.project_members (id, project_id, user_id)
values
  ('a1111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333'),
  ('b2222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000020', '44444444-4444-4444-4444-444444444444')
on conflict (project_id, user_id) do nothing;

-- 5. Test Credentials (Ciphertext with fake IV & tag)
insert into public.credentials (id, project_id, service_name, login_url, username, encrypted_password, iv, tag, notes, created_by)
values
  ('c0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Supabase Database', 'https://supabase.com/dashboard', 'admin@acme.example.com', 'f0e1d2c3b4a59687fake_encrypted_password_supabase', 'a1b2c3d4e5f6a1b2c3d4e5f6', '12345678901234567890123456789012', 'Database project credentials', '11111111-1111-1111-1111-111111111111'),
  ('c0000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', 'Cloudinary Asset Storage', 'https://cloudinary.com/console', 'assets@acme.example.com', 'f0e1d2c3b4a59687fake_encrypted_password_cloudinary', 'b2c3d4e5f6a1b2c3d4e5f6a1', '23456789012345678901234567890123', 'Asset upload API key', '22222222-2222-2222-2222-222222222222'),
  ('c0000003-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000020', 'Netlify Hosting', 'https://app.netlify.com', 'deploy@starlight.example.com', 'f0e1d2c3b4a59687fake_encrypted_password_netlify', 'c3d4e5f6a1b2c3d4e5f6a1b2', '34567890123456789012345678901234', 'Production deployment login', '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

-- 6. Test Environment Variables
insert into public.env_variables (id, project_id, environment, key, encrypted_value, iv, tag, created_by)
values
  ('e0000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'production', 'DATABASE_URL', 'fake_encrypted_db_url', 'd4e5f6a1b2c3d4e5f6a1b2c3', '45678901234567890123456789012345', '11111111-1111-1111-1111-111111111111'),
  ('e0000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', 'development', 'NEXT_PUBLIC_API_URL', 'fake_encrypted_api_url', 'e5f6a1b2c3d4e5f6a1b2c3d4', '56789012345678901234567890123456', '22222222-2222-2222-2222-222222222222')
on conflict (project_id, environment, key) do nothing;

-- 7. Test Audit Log
insert into public.audit_logs (id, user_id, action, target_type, target_id, project_id, ip_address, metadata, created_at)
values
  ('f0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'create', 'project', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', '127.0.0.1', '{"name": "Ecommerce Platform"}'::jsonb, now())
on conflict (id) do nothing;
