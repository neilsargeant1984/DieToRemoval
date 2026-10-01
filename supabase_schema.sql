-- =========================================================
-- DIETOREMOVAL.GG - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (1-Click Run)
-- =========================================================

-- 1. PROFILES TABLE (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  avatar_url text,
  arena_tag text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. DECKS TABLE
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  format text not null default 'brawl',
  description text,
  commander jsonb,
  mainboard jsonb not null default '[]'::jsonb,
  sideboard jsonb not null default '[]'::jsonb,
  tags text[] default '{}'::text[],
  is_public boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. USER COLLECTIONS TABLE
create table if not exists public.user_collections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  collection_data jsonb not null default '{}'::jsonb,
  wildcards jsonb not null default '{"common":0,"uncommon":0,"rare":0,"mythic":0}'::jsonb,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only edit their own data
-- =========================================================

alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.user_collections enable row level security;

-- PROFILES POLICIES
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can update their own profile" 
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile" 
  on public.profiles for insert with check (auth.uid() = id);

-- DECKS POLICIES
create policy "Users can view own decks or public decks" 
  on public.decks for select 
  using (auth.uid() = user_id or is_public = true);

create policy "Users can create decks" 
  on public.decks for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own decks" 
  on public.decks for update 
  using (auth.uid() = user_id);

create policy "Users can delete own decks" 
  on public.decks for delete 
  using (auth.uid() = user_id);

-- USER COLLECTIONS POLICIES
create policy "Users can view own collection" 
  on public.user_collections for select 
  using (auth.uid() = user_id);

create policy "Users can insert own collection" 
  on public.user_collections for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own collection" 
  on public.user_collections for update 
  using (auth.uid() = user_id);

-- =========================================================
-- AUTO CREATE PROFILE ON USER SIGNUP (TRIGGER)
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
