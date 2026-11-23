-- Migration: Client Share Links (Phase 12B, FEATURE_CLIENT_SHARE.md)
-- Covers TASK-141 and TASK-142

-- 1. Create share_links table
create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  label text not null check (char_length(label) between 1 and 80),

  token_hash text not null unique,        -- SHA-256 hex of token
  pin_hash text not null,                 -- scrypt hash with pepper
  pin_salt text not null,                 -- random per link

  expires_at timestamptz,                 -- null when never_expires
  never_expires boolean not null default false,
  max_views integer check (max_views is null or max_views > 0),
  view_count integer not null default 0,

  status text not null default 'active'
    check (status in ('active', 'revoked')),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id),

  failed_attempts integer not null default 0,
  locked_until timestamptz,
  session_version integer not null default 1, -- bump to invalidate active client sessions

  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check ((never_expires = true and expires_at is null)
      or (never_expires = false and expires_at is not null))
);

-- 2. Create share_link_items table
create table if not exists public.share_link_items (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  item_type text not null check (item_type in ('credential', 'env_variable')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (share_link_id, item_type, item_id)
);

-- 3. Create share_link_attempts table
create table if not exists public.share_link_attempts (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  ip_address text,
  success boolean not null,
  created_at timestamptz not null default now()
);

-- 4. Indexes
create index if not exists idx_share_links_project on public.share_links (project_id);
create index if not exists idx_share_link_items_share on public.share_link_items (share_link_id);
create index if not exists idx_share_link_attempts_share on public.share_link_attempts (share_link_id, created_at);
create index if not exists idx_share_link_attempts_ip on public.share_link_attempts (ip_address, created_at);

-- 5. Row Level Security
alter table public.share_links enable row level security;
alter table public.share_links force row level security;

alter table public.share_link_items enable row level security;
alter table public.share_link_items force row level security;

alter table public.share_link_attempts enable row level security;
alter table public.share_link_attempts force row level security;

-- Policies for share_links
drop policy if exists "share_links_manage_manager_admin" on public.share_links;
create policy "share_links_manage_manager_admin" on public.share_links
  for all to authenticated
  using (
    public.is_active_user() and public.is_manager_or_admin() and public.has_project_access(project_id)
  )
  with check (
    public.is_active_user() and public.is_manager_or_admin() and public.has_project_access(project_id)
  );

-- Policies for share_link_items
drop policy if exists "share_link_items_manage_manager_admin" on public.share_link_items;
create policy "share_link_items_manage_manager_admin" on public.share_link_items
  for all to authenticated
  using (
    public.is_active_user() and public.is_manager_or_admin() and exists (
      select 1 from public.share_links sl
      where sl.id = share_link_id
      and public.has_project_access(sl.project_id)
    )
  )
  with check (
    public.is_active_user() and public.is_manager_or_admin() and exists (
      select 1 from public.share_links sl
      where sl.id = share_link_id
      and public.has_project_access(sl.project_id)
    )
  );

-- Policies for share_link_attempts (Admin can select; inserts happen through server actions / service role)
drop policy if exists "share_link_attempts_select_admin" on public.share_link_attempts;
create policy "share_link_attempts_select_admin" on public.share_link_attempts
  for select to authenticated
  using (
    public.is_active_user() and public.is_admin()
  );
