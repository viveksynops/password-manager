-- Initial Schema Migration for Company Vault
-- Covers TASK-014 through TASK-021

-- Enable pgcrypto for UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE (TASK-014)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('admin', 'manager', 'developer')) default 'developer',
  status text not null check (status in ('active', 'deactivated', 'invited')) default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. HELPER FUNCTIONS (TASK-021)
-- Defined early so RLS policies can consume them
-- ============================================================================
create or replace function public.get_current_user_role()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.profiles
  where id = (select auth.uid())
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce((public.get_current_user_role() = 'admin'), false);
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce((public.get_current_user_role() in ('admin', 'manager')), false);
$$;

create or replace function public.is_active_user()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'active'
  );
$$;

-- ============================================================================
-- 3. CLIENTS TABLE (TASK-015)
-- ============================================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  contact_email text,
  contact_phone text,
  notes text,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 4. PROJECTS TABLE (TASK-016)
-- ============================================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  description text,
  live_url text,
  repo_url text,
  hosting_info text,
  tech_stack text,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. PROJECT MEMBERS TABLE (TASK-017)
-- ============================================================================
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- Access helper functions (TASK-021)
create or replace function public.has_project_access(target_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select (
    public.is_manager_or_admin()
    or exists (
      select 1 from public.project_members
      where project_id = target_project_id
        and user_id = (select auth.uid())
    )
  );
$$;

create or replace function public.has_client_access(target_client_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select (
    public.is_manager_or_admin()
    or exists (
      select 1 from public.projects p
      join public.project_members pm on pm.project_id = p.id
      where p.client_id = target_client_id
        and pm.user_id = (select auth.uid())
    )
  );
$$;

-- ============================================================================
-- 6. CREDENTIALS TABLE (TASK-018)
-- ============================================================================
create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  service_name text not null,
  login_url text,
  username text not null,
  encrypted_password text not null,
  iv text not null,
  tag text not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 7. ENVIRONMENT VARIABLES TABLE (TASK-019)
-- ============================================================================
create table if not exists public.env_variables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  environment text not null check (environment in ('development', 'staging', 'production')),
  key text not null,
  encrypted_value text not null,
  iv text not null,
  tag text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, environment, key)
);

-- ============================================================================
-- 8. AUDIT LOGS TABLE (TASK-020)
-- Append-only table. No update or delete permitted for ANY role.
-- ============================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  project_id uuid references public.projects(id) on delete set null,
  ip_address text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Prevent update and delete on audit_logs at the trigger level (ADR-013)
create or replace function public.prevent_audit_log_modification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'audit_logs entries are append-only and cannot be updated or deleted';
end;
$$;

drop trigger if exists trg_prevent_audit_log_update on public.audit_logs;
create trigger trg_prevent_audit_log_update
before update or delete on public.audit_logs
for each row
execute function public.prevent_audit_log_modification();

-- ============================================================================
-- 9. FOREIGN KEY & QUERY INDEXES (Postgres Performance Best Practices)
-- ============================================================================
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_status on public.profiles (status);

create index if not exists idx_clients_is_archived on public.clients (is_archived);
create index if not exists idx_clients_created_by on public.clients (created_by);

create index if not exists idx_projects_client_id on public.projects (client_id);
create index if not exists idx_projects_is_archived on public.projects (is_archived);
create index if not exists idx_projects_created_by on public.projects (created_by);

create index if not exists idx_project_members_project_id on public.project_members (project_id);
create index if not exists idx_project_members_user_id on public.project_members (user_id);

create index if not exists idx_credentials_project_id on public.credentials (project_id);
create index if not exists idx_credentials_created_by on public.credentials (created_by);

create index if not exists idx_env_variables_project_id on public.env_variables (project_id);
create index if not exists idx_env_variables_project_env on public.env_variables (project_id, environment);
create index if not exists idx_env_variables_created_by on public.env_variables (created_by);

create index if not exists idx_audit_logs_user_id on public.audit_logs (user_id);
create index if not exists idx_audit_logs_project_id on public.audit_logs (project_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- ============================================================================
-- 10. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- PROFILES RLS
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_manager_or_admin()
  );

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
  )
  with check (
    -- Non-admins cannot alter their own role or status
    (public.is_admin())
    or (id = (select auth.uid()) and role = public.get_current_user_role())
  );

create policy "profiles_insert_service_or_admin" on public.profiles
  for insert to authenticated
  with check (public.is_admin());

-- CLIENTS RLS
alter table public.clients enable row level security;
alter table public.clients force row level security;

create policy "clients_select" on public.clients
  for select to authenticated
  using (
    public.is_active_user() and public.has_client_access(id)
  );

create policy "clients_insert_manager_admin" on public.clients
  for insert to authenticated
  with check (
    public.is_active_user() and public.is_manager_or_admin()
  );

create policy "clients_update_manager_admin" on public.clients
  for update to authenticated
  using (
    public.is_active_user() and public.is_manager_or_admin()
  );

create policy "clients_delete_admin" on public.clients
  for delete to authenticated
  using (
    public.is_active_user() and public.is_admin()
  );

-- PROJECTS RLS
alter table public.projects enable row level security;
alter table public.projects force row level security;

create policy "projects_select" on public.projects
  for select to authenticated
  using (
    public.is_active_user() and public.has_project_access(id)
  );

create policy "projects_insert_manager_admin" on public.projects
  for insert to authenticated
  with check (
    public.is_active_user() and public.is_manager_or_admin()
  );

create policy "projects_update_manager_admin" on public.projects
  for update to authenticated
  using (
    public.is_active_user() and public.is_manager_or_admin()
  );

create policy "projects_delete_admin" on public.projects
  for delete to authenticated
  using (
    public.is_active_user() and public.is_admin()
  );

-- PROJECT MEMBERS RLS
alter table public.project_members enable row level security;
alter table public.project_members force row level security;

create policy "project_members_select" on public.project_members
  for select to authenticated
  using (
    public.is_active_user() and public.has_project_access(project_id)
  );

create policy "project_members_modify_manager_admin" on public.project_members
  for all to authenticated
  using (
    public.is_active_user() and public.is_manager_or_admin()
  )
  with check (
    public.is_active_user() and public.is_manager_or_admin()
  );

-- CREDENTIALS RLS
alter table public.credentials enable row level security;
alter table public.credentials force row level security;

create policy "credentials_select" on public.credentials
  for select to authenticated
  using (
    public.is_active_user() and public.has_project_access(project_id)
  );

create policy "credentials_insert" on public.credentials
  for insert to authenticated
  with check (
    public.is_active_user() and public.has_project_access(project_id)
  );

create policy "credentials_update" on public.credentials
  for update to authenticated
  using (
    public.is_active_user() and public.has_project_access(project_id)
  );

create policy "credentials_delete" on public.credentials
  for delete to authenticated
  using (
    public.is_active_user() and public.is_manager_or_admin()
  );

-- ENV VARIABLES RLS
alter table public.env_variables enable row level security;
alter table public.env_variables force row level security;

create policy "env_variables_select" on public.env_variables
  for select to authenticated
  using (
    public.is_active_user() and public.has_project_access(project_id)
  );

create policy "env_variables_insert" on public.env_variables
  for insert to authenticated
  with check (
    public.is_active_user() and public.has_project_access(project_id)
  );

create policy "env_variables_update" on public.env_variables
  for update to authenticated
  using (
    public.is_active_user() and public.has_project_access(project_id)
  );

create policy "env_variables_delete" on public.env_variables
  for delete to authenticated
  using (
    public.is_active_user() and public.is_manager_or_admin()
  );

-- AUDIT LOGS RLS
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

create policy "audit_logs_select_admin" on public.audit_logs
  for select to authenticated
  using (
    public.is_active_user() and public.is_admin()
  );

create policy "audit_logs_insert_authenticated" on public.audit_logs
  for insert to authenticated
  with check (
    public.is_active_user()
  );

-- ============================================================================
-- 11. AUTOMATIC PROFILE CREATION TRIGGER
-- When a user signs up or is invited in auth.users, create public.profiles
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'developer'),
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
