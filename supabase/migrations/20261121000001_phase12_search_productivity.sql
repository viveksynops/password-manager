-- Phase 12: Search and Productivity (TASK-109 to TASK-113)

-- 1. Add tags to projects
alter table public.projects 
  add column if not exists tags text[] not null default '{}';

-- 2. Add tags and custom_fields to credentials
alter table public.credentials 
  add column if not exists tags text[] not null default '{}',
  add column if not exists custom_fields jsonb not null default '[]';

-- 3. Create user_favorites table
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('project', 'credential')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

-- Indexes for performance & search
create index if not exists idx_projects_tags on public.projects using gin(tags);
create index if not exists idx_credentials_tags on public.credentials using gin(tags);
create index if not exists idx_user_favorites_user on public.user_favorites(user_id);
create index if not exists idx_user_favorites_target on public.user_favorites(target_type, target_id);

-- Enable RLS on user_favorites
alter table public.user_favorites enable row level security;

-- Policies for user_favorites
drop policy if exists "Users can view own favorites" on public.user_favorites;
create policy "Users can view own favorites"
  on public.user_favorites for select
  using (user_id = auth.uid());

drop policy if exists "Users can add own favorites" on public.user_favorites;
create policy "Users can add own favorites"
  on public.user_favorites for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can remove own favorites" on public.user_favorites;
create policy "Users can remove own favorites"
  on public.user_favorites for delete
  using (user_id = auth.uid());
